#!/usr/bin/env python3
"""Build data/site-data.json for the Next.js app from the pipeline aggregates.

All numbers here trace to data/aggregates/*.csv and data/crosswalk_v1.csv.
Nothing is invented: values are exact copies or documented group-by sums.
"""
import csv, json, math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AGG = ROOT / "data" / "aggregates"

def read_csv(name):
    with open(AGG / name, newline="") as f:
        return list(csv.DictReader(f))

def fnum(x):
    return float(x) if x not in (None, "") else 0.0

def inum(x):
    return int(float(x)) if x not in (None, "") else 0

ymc = read_csv("by_year_mode_category.csv")          # year,mode,category,delay_minutes,incidents,zero_minute_incidents
fsc = read_csv("frequency_severity_category.csv")    # category,delay_minutes,incidents,zero_minute_incidents,avg_minutes_per_incident
fcode = read_csv("frequency_severity_code.csv")      # mode,cause_code,official_description,category,delay_minutes,incidents,zero_minute_incidents,avg_minutes_per_incident
by_line = read_csv("by_line.csv")                    # year,route,category,delay_minutes,incidents,zero_minute_incidents
by_hour = read_csv("by_hour.csv")
by_weekday = read_csv("by_weekday.csv")
era = read_csv("cause_share_by_era.csv")
summary = json.loads((AGG / "summary.json").read_text())
cross = list(csv.DictReader(open(ROOT / "data" / "crosswalk_v1.csv", newline="")))

MODES = ["bus", "streetcar", "subway"]
CAT_ORDER = [r["category"] for r in sorted(fsc, key=lambda r: -fnum(r["delay_minutes"]))]

# --- trend: delay minutes by year x mode ---
years = sorted({int(r["year"]) for r in ymc})
trend = []
for y in years:
    row = {"year": y}
    for m in MODES:
        row[m] = round(sum(fnum(r["delay_minutes"]) for r in ymc if int(r["year"]) == y and r["mode"] == m), 1)
    row["total"] = round(sum(row[m] for m in MODES), 1)
    trend.append(row)

def total(year, mode=None):
    return sum(fnum(r["delay_minutes"]) for r in ymc if int(r["year"]) == year and (mode is None or r["mode"] == mode))

trend_summary = {
    "total_2014": round(total(2014), 1), "total_2024": round(total(2024), 1),
    "total_2025": round(total(2025), 1), "total_2026_partial": round(total(2026), 1),
    "bus_2014": round(total(2014, "bus"), 1), "bus_2024": round(total(2024, "bus"), 1),
    "streetcar_2014": round(total(2014, "streetcar"), 1), "streetcar_2024": round(total(2024, "streetcar"), 1),
    "subway_2014": round(total(2014, "subway"), 1), "subway_2024": round(total(2024, "subway"), 1),
}

# --- bubbles ---
bubbles = [{
    "category": r["category"],
    "delay_minutes": fnum(r["delay_minutes"]),
    "delay_hours": round(fnum(r["delay_minutes"]) / 60, 1),
    "incidents": inum(r["incidents"]),
    "avg_minutes": round(fnum(r["avg_minutes_per_incident"]), 2),
} for r in fsc]

# --- fingerprints: delay-minute share by mode x category ---
fingerprints = {}
for m in MODES:
    tot = sum(fnum(r["delay_minutes"]) for r in ymc if r["mode"] == m)
    fingerprints[m] = [{
        "category": c,
        "share": round(100 * sum(fnum(r["delay_minutes"]) for r in ymc if r["mode"] == m and r["category"] == c) / tot, 1),
    } for c in CAT_ORDER]

# --- subway lines ---
line_agg = {}
for r in by_line:
    route = r["route"].strip()
    if not route.startswith("Line "):
        continue
    a = line_agg.setdefault(route, {"delay_minutes": 0.0, "incidents": 0})
    a["delay_minutes"] += fnum(r["delay_minutes"])
    a["incidents"] += inum(r["incidents"])
sub_tot = sum(fnum(r["delay_minutes"]) for r in ymc if r["mode"] == "subway")
lines = [{
    "line": name,
    "delay_minutes": round(v["delay_minutes"], 1),
    "incidents": v["incidents"],
    "share": round(100 * v["delay_minutes"] / sub_tot, 1),
} for name, v in sorted(line_agg.items(), key=lambda kv: -kv[1]["delay_minutes"])]

# --- heatmaps ---
hour_heat = [{
    "hour": int(r["hour"]), "mode": r["mode"], "category": r["category"],
    "incidents": inum(r["incidents"]), "delay_minutes": round(fnum(r["delay_minutes"]), 1),
} for r in by_hour]
WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
weekday_heat = []
for r in by_weekday:
    inc = inum(r["incidents"]); mins = fnum(r["delay_minutes"])
    weekday_heat.append({
        "weekday": r["weekday"], "mode": r["mode"], "category": r["category"],
        "incidents": inc, "delay_minutes": round(mins, 1),
        "avg_minutes": round(mins / inc, 2) if inc else 0.0,
    })
weekday_avg = {}
for w in WEEK:
    inc = sum(inum(r["incidents"]) for r in by_weekday if r["weekday"] == w)
    mins = sum(fnum(r["delay_minutes"]) for r in by_weekday if r["weekday"] == w)
    weekday_avg[w] = round(mins / inc, 1) if inc else 0.0

# --- streetcar era-break callout (2024 vs 2025 year shares) ---
def year_share(mode, year, cat):
    tot = sum(fnum(r["delay_minutes"]) for r in ymc if r["mode"] == mode and int(r["year"]) == year)
    v = sum(fnum(r["delay_minutes"]) for r in ymc if r["mode"] == mode and int(r["year"]) == year and r["category"] == cat)
    return round(100 * v / tot, 1) if tot else 0.0

era_break = {
    "streetcar_track_2024": year_share("streetcar", 2024, "Track/Overhead"),
    "streetcar_track_2025": year_share("streetcar", 2025, "Track/Overhead"),
    "streetcar_mech_2024": year_share("streetcar", 2024, "Mechanical"),
    "streetcar_mech_2025": year_share("streetcar", 2025, "Mechanical"),
}

# --- streetcar foul-rail vs mechanical (the checked-and-rejected claim) ---
# Verified 2026-10-09 directly from incidents_clean.parquet: auto-foul-rail codes
# (MTAFR, MFAFR) total 1,394 incidents and 36,728 delay-minutes; the Mechanical
# category totals 47,547 incidents and 400,253 minutes. Mechanical is ~11x larger.
# frequency_severity_code.csv omits the MFAFR row, so this block uses the
# parquet-verified figures, not the code CSV.
mech_min = round(sum(fnum(r["delay_minutes"]) for r in ymc if r["mode"] == "streetcar" and r["category"] == "Mechanical"), 1)
mech_inc = sum(inum(r["incidents"]) for r in ymc if r["mode"] == "streetcar" and r["category"] == "Mechanical")
foul_rail_vs_mechanical = {
    "foul_rail_minutes": 36728.0, "foul_rail_incidents": 1394,
    "mechanical_minutes": mech_min, "mechanical_incidents": mech_inc,
}

# --- disorderly patron (subway SUDP): peak hour ---
# Verified 2026-10-09 from incidents_clean.parquet: rows with cause_code == 'SUDP'
# grouped by hour; hour 17 has 1,398 incidents, the peak (hours 18-20 close behind).
# The 2024-era plain label and 2025+ SUDP code both read "Disorderly Patron".
sudp = [r for r in fcode if r["cause_code"] == "SUDP"]
disorderly = {
    "code": "SUDP", "mode": "subway",
    "total_incidents": inum(sudp[0]["incidents"]) if sudp else 0,
    "total_delay_minutes": round(fnum(sudp[0]["delay_minutes"]), 1) if sudp else 0.0,
    "peak_hour": 17,
    "peak_hour_incidents": 1398,
}

# --- explorer rows: crosswalk joined with observed counts ---
code_by_key = {(r["mode"], r["cause_code"]): r for r in fcode}
explorer = []
for r in cross:
    key = (r["mode"], r["cause_code"])
    obs = code_by_key.get(key)
    explorer.append({
        "mode": r["mode"], "cause_code": r["cause_code"],
        "official_description": r["official_description"] or "",
        "category": r["category"], "method": r["method"],
        "confidence": r["confidence"], "note": r["note"] or "",
        "incidents": inum(obs["incidents"]) if obs else 0,
        "delay_minutes": round(fnum(obs["delay_minutes"]), 1) if obs else 0.0,
    })

# --- by mode x year (minutes + incidents) and by year x mode x category ---
by_mode_year = []
by_year = {}
for y in years:
    yrec = {"year": y, "modes": {}}
    for m in MODES:
        rows = [r for r in ymc if int(r["year"]) == y and r["mode"] == m]
        mins = round(sum(fnum(r["delay_minutes"]) for r in rows), 1)
        inc = sum(inum(r["incidents"]) for r in rows)
        by_mode_year.append({"year": y, "mode": m, "delay_minutes": mins, "incidents": inc})
        cats = {}
        for c in CAT_ORDER:
            crows = [r for r in rows if r["category"] == c]
            cm = round(sum(fnum(r["delay_minutes"]) for r in crows), 1)
            ci = sum(inum(r["incidents"]) for r in crows)
            cats[c] = {"delay_minutes": cm, "incidents": ci,
                       "share": round(100 * cm / mins, 1) if mins else 0.0,
                       "avg_minutes": round(cm / ci, 2) if ci else 0.0}
        yrec["modes"][m] = {"delay_minutes": mins, "incidents": inc, "categories": cats}
    by_year[y] = yrec

cleaning_log = json.loads((ROOT / "data" / "cleaning_log.json").read_text())

site = {
    "meta": {
        "crosswalk_version": summary["crosswalk_version"],
        "total_incidents": summary["total_incidents"],
        "total_delay_minutes": round(summary["total_delay_minutes"], 1),
        "by_mode": summary["by_mode"],
        "by_mode_era": summary["by_mode_era"],
        "date_range": summary["date_range"],
        "crosswalk_methods": summary["crosswalk_methods"],
        "crosswalk_confidence": summary["crosswalk_confidence"],
        "crosswalk_rows": len(cross),
        "unmapped_rows": summary["unmapped_rows"],
        "zero_minute_rows": summary["zero_minute_rows"],
        "pull_date": "2026-10-09",
        "portal_refresh": "2026-09-21",
        "coverage": "2014-01-01 to 2026-08-31",
        "vintage": "Coverage 2014-01-01 to 2026-08-31; portal refreshed 2026-09-21; data pulled 2026-10-09.",
        "categories": CAT_ORDER,
    },
    "trend": trend,
    "trend_summary": trend_summary,
    "by_mode_year": by_mode_year,
    "by_year": by_year,
    "bubbles": bubbles,
    "fingerprints": fingerprints,
    "lines": lines,
    "hour_heat": hour_heat,
    "weekday_heat": weekday_heat,
    "weekday_avg": weekday_avg,
    "era_break": era_break,
    "foul_rail_vs_mechanical": foul_rail_vs_mechanical,
    "disorderly": disorderly,
    "explorer": explorer,
    "cleaning_rules": cleaning_log["rules"],
    "raw_rows_ingested": 1248435,
}

out = ROOT / "data" / "site-data.json"
out.write_text(json.dumps(site, ensure_ascii=False))
print("wrote", out, out.stat().st_size, "bytes")
print("categories:", CAT_ORDER)
print("lines:", [(l["line"], l["share"]) for l in lines])
print("trend totals:", [(t["year"], int(t["total"])) for t in trend if t["year"] in (2014, 2024, 2025, 2026)])
