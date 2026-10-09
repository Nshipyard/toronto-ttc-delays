# Reproducing the incident-level table

The cleaned incident table (`data/incidents_clean.parquet`) is built from the
public City of Toronto Open Data portal. Every step is scripted; no manual edits.

## 1. Download the raw files

```
cd scripts
RAW_DIR=../raw python3 download_resources.py
```

This enumerates resources via the CKAN API (`package_show` on
`ttc-subway-delay-data`, `ttc-streetcar-delay-data`, `ttc-bus-delay-data` at
`ckan0.cf.opendata.inter.prod-toronto.ca`), records the exact resource IDs,
vintages and pull date in `data/resource_meta.json`, and downloads:

- Subway: yearly XLSX files 2014-2024 (12 monthly sheets each), the rolling
  "TTC Subway Delay Data since 2025" CSV, the 2025+ "Code Descriptions" CSV,
  and the legacy "ttc-subway-delay-codes" XLSX (the R-scheme table).
- Streetcar: yearly XLSX 2014-2024 plus the rolling 2025+ CSV and its
  "Code Descriptions" CSV.
- Bus: yearly XLSX 2014-2024 plus the rolling 2025+ CSV and its
  "Code Descriptions" CSV.

## 2. Build the crosswalk

```
python3 scripts/build_crosswalk.py observed_codes.tsv
```

`observed_codes.tsv` (a tab-separated list of `mode<TAB>cause_code` pairs seen
in the data) is produced by scanning the raw files; regenerate it with the
snippet in `scripts/observed_codes.py` if the raw files change. Output:
`data/crosswalk_v1.csv`.

## 3. Ingest and clean

```
RAW_DIR=../raw python3 scripts/ingest.py
```

Normalizes the monthly-sheet column renames (Date/Report Date, Line/Route,
Code/Incident, Min Delay/Delay, Min Gap/Gap, Bound/Direction), applies the
cleaning rules documented in `data/README.md`, normalizes subway station
names via `data/station_map.json`, and writes `data/incidents_clean.parquet`
plus `data/cleaning_log.json` (exact removal counts per rule).

## 4. Aggregates

```
python3 scripts/build_aggregates.py
```

Joins the crosswalk and writes the CSVs under `data/aggregates/`.

Python requirements: pandas, openpyxl, pyarrow.
