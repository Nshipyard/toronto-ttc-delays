#!/usr/bin/env python3
"""Ingest all TTC delay raw files into one cleaned incident table.

Reads the raw XLSX monthly sheets (2014-2024) and the rolling 2025+ CSVs for
subway, streetcar, and bus; normalizes column renames; applies the documented
cleaning rules; writes data/incidents_clean.parquet and data/cleaning_log.json.

Raw files are NOT committed to the repo; fetch them with scripts/download_resources.py
(see docs/REPRODUCE.md).
"""
import csv, datetime, glob, json, math, os, re, sys
import openpyxl
import pandas as pd

RAW = os.environ.get("RAW_DIR", os.path.join(os.path.dirname(__file__), "..", "raw"))
DATA = os.path.join(os.path.dirname(__file__), "..", "data")

# column alias -> canonical field
ALIASES = {
    "date": ["date", "report date"],
    "time": ["time"],
    "day": ["day"],
    "station": ["station", "location"],
    "line": ["line", "route", "route/line"],
    "cause": ["code", "incident"],
    "min_delay": ["min delay", "delay", "min. delay"],
    "min_gap": ["min gap", "gap"],
    "bound": ["bound", "direction"],
    "vehicle": ["vehicle"],
}

PLACEHOLDER_LINES = {"999", "500"}


def map_columns(hdr):
    norm = {c.strip().lower(): c for c in hdr}
    out = {}
    for field, names in ALIASES.items():
        for n in names:
            if n in norm:
                out[field] = norm[n]
                break
    return out


def parse_date(v):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v if isinstance(v, datetime.date) else v.date()
    s = str(v).strip()
    if not s:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d", "%m/%d/%Y", "%Y/%m/%d", "%d-%b-%y", "%d-%b-%Y"):
        try:
            return datetime.datetime.strptime(s.split("T")[0] if "T" in s and fmt != "%Y-%m-%dT%H:%M:%S" else s, fmt).date()
        except ValueError:
            pass
    try:
        return datetime.datetime.fromisoformat(s).date()
    except ValueError:
        return None


def parse_time(v):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    if isinstance(v, datetime.time):
        return v
    if isinstance(v, datetime.datetime):
        return v.time()
    if isinstance(v, datetime.timedelta):
        secs = int(v.total_seconds()) % 86400
        return datetime.time(secs // 3600, (secs % 3600) // 60)
    s = str(v).strip().strip("'").strip('"')
    m = re.match(r"^(\d{1,2}):(\d{2})(?::(\d{2}))?", s)
    if m:
        h, mi = int(m.group(1)), int(m.group(2))
        if 0 <= h <= 23 and 0 <= mi <= 59:
            return datetime.time(h, mi)
    return None


def parse_minutes(v):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    try:
        return float(str(v).strip())
    except ValueError:
        return None


def load_xlsx(path, mode, log):
    xl = pd.ExcelFile(path, engine="openpyxl")
    recs = []
    for sheet in xl.sheet_names:
        df = xl.parse(sheet, dtype=object)
        df.columns = [str(c).strip() for c in df.columns]
        cmap = map_columns(list(df.columns))
        if "date" not in cmap or "cause" not in cmap:
            log["sheets_skipped"].append("%s :: %s (cols %s)" % (
                os.path.basename(path), sheet, list(df.columns)))
            continue
        sub = df.rename(columns={v: k for k, v in cmap.items()})[[k for k in cmap]]
        for col in sub.columns:
            sub[col] = sub[col].where(sub[col].notna(), None)
        recs += sub.to_dict("records")
    return recs


def load_csv(path, mode, log):
    df = pd.read_csv(path, dtype=str)
    cmap = map_columns(list(df.columns))
    recs = []
    for _, row in df.iterrows():
        recs.append({f: row[c] for f, c in cmap.items()})
    return recs


def dequote(s):
    s = s.strip()
    if len(s) >= 2 and s[0] == s[-1] and s[0] in "'\"":
        return s[1:-1].strip()
    return s


def main():
    os.makedirs(DATA, exist_ok=True)
    log = {"sheets_skipped": [], "rules": {}, "files": {}}
    all_recs = []
    specs = [
        ("subway", sorted(glob.glob(os.path.join(RAW, "ttc-subway-delay-data__*.xlsx"))),
         [os.path.join(RAW, "ttc-subway-delay-data__TTC Subway Delay Data since 2025.csv.csv")]),
        ("streetcar", sorted(glob.glob(os.path.join(RAW, "ttc-streetcar-delay-data__*.xlsx"))),
         [os.path.join(RAW, "ttc-streetcar-delay-data__TTC Streetcar Delay Data since 2025.csv.csv")]),
        ("bus", sorted(glob.glob(os.path.join(RAW, "ttc-bus-delay-data__*.xlsx"))),
         [os.path.join(RAW, "ttc-bus-delay-data__TTC Bus Delay Data since 2025.csv.csv")]),
    ]
    raw_total = 0
    for mode, xlsx_files, csv_files in specs:
        mode_recs = []
        for p in xlsx_files:
            base = os.path.basename(p)
            if "codedescriptions" in base.lower() or "readme" in base.lower() or "old_codes" in base:
                continue
            recs = load_xlsx(p, mode, log)
            log["files"][base] = {"raw_rows": len(recs), "era": "pre-2025"}
            print("loaded", base, len(recs), flush=True)
            mode_recs += [{"mode": mode, "era": "pre-2025", "source_file": base, **r} for r in recs]
        for p in csv_files:
            base = os.path.basename(p)
            recs = load_csv(p, mode, log)
            log["files"][base] = {"raw_rows": len(recs), "era": "2025+"}
            mode_recs += [{"mode": mode, "era": "2025+", "source_file": base, **r} for r in recs]
        raw_total += len(mode_recs)
        all_recs += mode_recs
    log["raw_rows_total"] = raw_total

    df = pd.DataFrame(all_recs)

    # ---- cleaning rules (counts recorded in order) ----
    def count(rule, mask):
        n = int(mask.sum())
        log["rules"][rule] = n
        return mask

    # R0: drop rows with no parseable date
    df["date_parsed"] = df["date"].map(parse_date)
    df = df[~count("R0_drop_unparseable_date", df["date_parsed"].isna())]
    df["date_parsed"] = pd.to_datetime(df["date_parsed"])

    # R1: drop placeholder route lines 999 / 500 (surface modes)
    df["line_norm"] = df["line"].fillna("").astype(str).map(dequote).str.upper()
    surf = df["mode"].isin(["streetcar", "bus"])
    df = df[~count("R1_drop_placeholder_line_999_500",
                   surf & df["line_norm"].isin(PLACEHOLDER_LINES))]

    # R2/R3: minutes
    df["min_delay"] = df["min_delay"].map(parse_minutes)
    df = df[~count("R2_drop_min_delay_999_cap", df["min_delay"] == 999)]
    df = df[~count("R3_drop_min_delay_over_300", df["min_delay"] > 300)]
    df = df[~count("R3b_drop_negative_min_delay", df["min_delay"] < 0)]
    df["zero_minute"] = df["min_delay"] == 0
    log["rules"]["R4_zero_minute_rows_kept_and_flagged"] = int(df["zero_minute"].sum())

    # R5: station normalization (subway); applied via station_map.json if present
    station_map_path = os.path.join(DATA, "station_map.json")
    if os.path.exists(station_map_path):
        smap = json.load(open(station_map_path))
        df["station_raw"] = df["station"].fillna("").astype(str).map(dequote)
        df["station"] = df["station_raw"].str.upper().map(lambda s: smap.get(s, s))
        log["rules"]["R5_station_names_normalized"] = int((df["station"] != df["station_raw"].str.strip().str.upper()).sum())
    else:
        df["station"] = df["station"].fillna("").astype(str).map(dequote).str.upper()

    # cause code normalization
    df["cause_raw"] = df["cause"].fillna("").astype(str).map(dequote)
    df["cause_code"] = df["cause_raw"].str.upper().replace("", "NOT LOGGED")

    # time / hour / weekday
    df["time_parsed"] = df["time"].map(parse_time)
    df["hour"] = df["time_parsed"].map(lambda t: t.hour if t else None)
    df["weekday"] = df["date_parsed"].dt.day_name()
    df["year"] = df["date_parsed"].dt.year
    df["month"] = df["date_parsed"].dt.month

    # line normalization
    def norm_line(row):
        m, v = row["mode"], (row["line_norm"] or "")
        if m == "subway":
            base = re.split(r"[\s/]", v)[0]
            return {"YU": "Line 1 (Yonge-University)", "YUS": "Line 1 (Yonge-University)",
                    "BD": "Line 2 (Bloor-Danforth)", "SHP": "Line 4 (Sheppard)",
                    "SRT": "Line 3 (Scarborough)"}.get(base, v)
        mt = re.match(r"^(\d{3}[A-Z]?)\b", v)
        if mt:
            return mt.group(1)
        return v
    df["route"] = df.apply(norm_line, axis=1)

    df["min_gap"] = df["min_gap"].map(parse_minutes)
    df["bound"] = df["bound"].fillna("").astype(str).str.strip().str.upper()
    df["vehicle"] = df["vehicle"].fillna("").astype(str).str.strip()

    keep = ["mode", "era", "source_file", "date_parsed", "year", "month", "weekday", "hour",
            "time_parsed", "station", "route", "cause_code", "cause_raw",
            "min_delay", "min_gap", "zero_minute", "bound", "vehicle"]
    df = df[keep].rename(columns={"date_parsed": "date", "time_parsed": "time"})
    df["date"] = df["date"].dt.date.astype(str)
    df["time"] = df["time"].astype(str)

    out = os.path.join(DATA, "incidents_clean.parquet")
    df.to_parquet(out, index=False)
    log["cleaned_rows_total"] = len(df)
    log["cleaned_by_mode"] = df["mode"].value_counts().to_dict()
    log["cleaned_by_mode_era"] = {"%s|%s" % k: int(v) for k, v in df.groupby(["mode", "era"]).size().items()}
    json.dump(log, open(os.path.join(DATA, "cleaning_log.json"), "w"), indent=1)
    print("rows:", len(df), "->", out)
    print(json.dumps(log["rules"], indent=1))


if __name__ == "__main__":
    main()
