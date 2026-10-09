#!/usr/bin/env python3
"""Join the cleaned incident table with the crosswalk and compute aggregates.

Outputs (all under data/aggregates/):
- by_year_mode_category.csv      delay minutes + incidents by year x mode x category
- by_line.csv                    subway lines x year x category
- by_route_surface.csv           streetcar/bus routes x year (minutes, incidents)
- by_hour.csv                    hour of day x mode x category
- by_weekday.csv                 day of week x mode x category
- frequency_severity_category.csv total minutes, incidents, avg min/incident per category
- frequency_severity_code.csv     same per (mode, code) with description
- cause_share.csv                minutes share by category x mode x era (for the code-break view)
- summary.json                   headline figures (vintages, row counts, coverage)
"""
import csv, json, os
import pandas as pd

HERE = os.path.dirname(__file__)
DATA = os.path.join(HERE, "..", "data")
AGG = os.path.join(DATA, "aggregates")
CROSSWALK_VERSION = "v1"


def main():
    os.makedirs(AGG, exist_ok=True)
    df = pd.read_parquet(os.path.join(DATA, "incidents_clean.parquet"))
    xw = pd.read_csv(os.path.join(DATA, "crosswalk_%s.csv" % CROSSWALK_VERSION))
    xw = xw.drop_duplicates(subset=["mode", "cause_code"], keep="first")

    df = df.merge(xw[["mode", "cause_code", "category", "method", "confidence"]],
                  on=["mode", "cause_code"], how="left")
    n_unmapped = int(df["category"].isna().sum())
    df["category"] = df["category"].fillna("Unclassified")
    df["method"] = df["method"].fillna("unmapped")
    df["confidence"] = df["confidence"].fillna("low")
    print("unmapped cause codes after crosswalk:", n_unmapped)

    agg = lambda g, cols: g.agg(delay_minutes=("min_delay", "sum"),
                                incidents=("min_delay", "size"),
                                zero_minute_incidents=("zero_minute", "sum")).reset_index()

    t = agg(df.groupby(["year", "mode", "category"]), None)
    t.to_csv(os.path.join(AGG, "by_year_mode_category.csv"), index=False)

    sub = df[df["mode"] == "subway"]
    agg(sub.groupby(["year", "route", "category"]), None).to_csv(
        os.path.join(AGG, "by_line.csv"), index=False)

    surf = df[df["mode"].isin(["streetcar", "bus"])]
    agg(surf.groupby(["mode", "year", "route"]), None).to_csv(
        os.path.join(AGG, "by_route_surface.csv"), index=False)

    agg(df.groupby(["hour", "mode", "category"]), None).to_csv(
        os.path.join(AGG, "by_hour.csv"), index=False)
    agg(df.groupby(["weekday", "mode", "category"]), None).to_csv(
        os.path.join(AGG, "by_weekday.csv"), index=False)

    fs = agg(df.groupby(["category"]), None)
    fs["avg_minutes_per_incident"] = fs["delay_minutes"] / fs["incidents"]
    fs.to_csv(os.path.join(AGG, "frequency_severity_category.csv"), index=False)

    xwd = xw[["mode", "cause_code", "official_description"]]
    fsc = df.merge(xwd, on=["mode", "cause_code"], how="left")
    fsc = agg(fsc.groupby(["mode", "cause_code", "official_description", "category"]), None)
    fsc["avg_minutes_per_incident"] = fsc["delay_minutes"] / fsc["incidents"]
    fsc.to_csv(os.path.join(AGG, "frequency_severity_code.csv"), index=False)

    cs = agg(df.groupby(["mode", "era", "category"]), None)
    cs.to_csv(os.path.join(AGG, "cause_share_by_era.csv"), index=False)

    summary = {
        "crosswalk_version": CROSSWALK_VERSION,
        "total_incidents": len(df),
        "total_delay_minutes": float(df["min_delay"].sum()),
        "by_mode": df.groupby("mode").agg(
            incidents=("min_delay", "size"),
            delay_minutes=("min_delay", "sum")).reset_index().to_dict("records"),
        "by_mode_era": {"%s|%s" % k: int(v) for k, v in df.groupby(["mode", "era"]).size().items()},
        "date_range": {"min": str(df["date"].min()), "max": str(df["date"].max())},
        "crosswalk_methods": xw["method"].value_counts().to_dict(),
        "crosswalk_confidence": xw["confidence"].value_counts().to_dict(),
        "unmapped_rows": n_unmapped,
        "zero_minute_rows": int(df["zero_minute"].sum()),
    }
    json.dump(summary, open(os.path.join(AGG, "summary.json"), "w"), indent=1)
    print(json.dumps(summary, indent=1)[:2000])


if __name__ == "__main__":
    main()
