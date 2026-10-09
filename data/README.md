# TTC Delays: data

One cleaned incident table for every TTC delay record published by the City of
Toronto Open Data portal from 2014-01-01 to 2026-08-31, on a single seven-category
cause taxonomy, plus the crosswalk that makes the 2024-to-2025 code break
comparable.

## Sources

All three datasets are City of Toronto Open Data, Open Government Licence -
Toronto, pulled 2026-10-09 (portal last refreshed 2026-09-21):

- TTC Subway Delay Data: https://open.toronto.ca/dataset/ttc-subway-delay-data/
- TTC Streetcar Delay Data: https://open.toronto.ca/dataset/ttc-streetcar-delay-data/
- TTC Bus Delay Data: https://open.toronto.ca/dataset/ttc-bus-delay-data/

Resources were enumerated with the CKAN API (`package_show` on each dataset
slug at `ckan0.cf.opendata.inter.prod-toronto.ca`). Exact resource IDs,
vintages and pull dates are in `resource_meta.json`. Files used:

- Subway: yearly XLSX 2014-2024 (Jan 2014-Apr 2017 and May-Dec 2017 are two
  resources; each file holds 12 monthly sheets), the rolling
  "TTC Subway Delay Data since 2025" CSV, the 2025+ "Code Descriptions" CSV
  (140 codes), and the legacy "ttc-subway-delay-codes" XLSX (the old-scheme
  table with 71 codes).
- Streetcar: yearly XLSX 2014-2024 plus the rolling 2025+ CSV and its
  "Code Descriptions" CSV (85 codes). The portal lists two 2020 resources, one
  with a trailing tab in its name; they are byte-identical, and only one was used.
- Bus: yearly XLSX 2014-2024 plus the rolling 2025+ CSV and its
  "Code Descriptions" CSV (46 codes).

Prior art at opendatacanada.ca (streetcar and subway delay articles) was used
for methodology reference only. Every number below was recomputed from the raw
files; none was copied.

## The code breaks (what the crosswalk bridges)

There are two breaks, not one:

1. Subway, around 2018-2024: the legacy code scheme (ER/MR/PR/SR/TR prefixes)
   was replaced by the current scheme (EU/MU/PU/SU/TU). The 2018-2023 files mix
   both. This break is documented by the TTC itself: the legacy
   "ttc-subway-delay-codes" resource maps old codes to new codes with identical
   descriptions, so old-scheme codes are mapped from official descriptions,
   not guessed.
2. Streetcar and bus, 2025: plain-language categories (13 for streetcar,
   12-15 for bus depending on year) were replaced by alphanumeric codes.
   The 2025+ streetcar file mixes streetcar-scheme codes (ET/MT/PT/ST/TT) and
   bus-scheme codes (EF/MF/PF/SF/TF); both official tables are consulted.

The subway never used plain-language categories: its 2014-2024 files always
carried codes.

## Crosswalk v1 (`crosswalk_v1.csv`)

No TTC-published crosswalk exists between these schemes. This crosswalk is
editorial and versioned: 539 rows of (mode, cause_code) to one of seven
categories (Operations/Crew, Security, Mechanical, Cleaning/Sanitation,
Emergency/Medical, Collision, Track/Overhead) plus Unclassified for vague
catch-alls (OTHER codes, MISCELLANEOUS GENERAL, NO TROUBLE FOUND) and
placeholders (XXXXX, blank causes).

Methods: official 271 rows (from the per-mode Code Descriptions tables),
official-legacy 71 (the TTC legacy subway table), cross-mode-official 45
(codes found in another mode's official table), direct-label 58
(plain-language era labels), pattern 94 (prefix/suffix rules for codes in no
official table, e.g. MUBIO as biohazard). Confidence: high 416, medium 67,
low 56. By incident rows, 99.3% map at high or medium confidence; 8,618 rows
(0.7%) rest on pattern matching. Every pattern-matched code carries a note
explaining the reasoning, so the whole table is auditable and challengeable.

## Cleaning rules (exact removal counts)

Applied in order; counts from `cleaning_log.json`:

- R0, unparseable dates dropped: 0
- R1, placeholder route lines (streetcar/bus Line of 999 or 500) dropped: 1,752
- R2, Min Delay of exactly 999 (data-entry cap) dropped: 1,235
- R3, Min Delay over 300 minutes dropped: 5,391
- R3b, negative Min Delay dropped: 10
- R4, zero-minute rows kept but flagged (`zero_minute` column): 221,620
- R5, subway station names normalized via `station_map.json` (117 spelling and
  punctuation variants, e.g. DANFORT to DANFORTH): 2,099 rows renamed

Raw rows ingested: 1,248,435. Cleaned rows: 1,240,037
(`incidents_clean.parquet`, 17.9 MB).

## Coverage

| mode | incidents | delay minutes | pre-2025 rows | 2025+ rows |
| --- | --- | --- | --- | --- |
| bus | 802,036 | 12,234,187 | 701,135 | 100,901 |
| streetcar | 170,206 | 2,214,639 | 146,702 | 23,504 |
| subway | 267,795 | 660,832 | 222,333 | 45,462 |
| total | 1,240,037 | 15,109,658 | 1,070,170 | 169,867 |

Date range 2014-01-01 to 2026-08-31 (2026 is partial, January to August).

Zero-minute rows, kept and flagged: subway 65.2% pre-2025 and 65.3% in 2025+
(a stable TTC logging convention, not a data error); streetcar 22.0% in 2025+;
bus 12.4% in 2025+. They count toward incident counts but add nothing to
minute totals.

## Aggregates (`aggregates/`)

- `by_year_mode_category.csv`: delay minutes and incidents by year, mode, cause category
- `by_line.csv`: subway lines by year and category
- `by_route_surface.csv`: streetcar/bus routes by year
- `by_hour.csv`: hour of day by mode and category
- `by_weekday.csv`: day of week by mode and category
- `frequency_severity_category.csv`: total minutes, incidents, average minutes
  per incident per category (all modes)
- `frequency_severity_code.csv`: same per (mode, cause code), with official
  descriptions and crosswalk method
- `cause_share_by_era.csv`: category shares by mode and era (the code-break view)
- `summary.json`: headline figures

## Patterns verified in this build

- Subway delay-minute share over the full series: Line 1 (Yonge-University)
  50.5%, Line 2 (Bloor-Danforth) 39.4%, Line 3 (Scarborough) and Line 4
  (Sheppard) the rest. No public ridership denominator exists, so per-rider
  rates cannot be computed.
- Disorderly-patron (SUDP) incidents peak at 5 PM (1,398 incidents), not late
  evening; the 6 PM to 8 PM window is nearly as high.
- Average incident duration: Sunday 13.8 minutes vs Friday 12.1 minutes
  (Sunday incidents run about 14% longer).
- Streetcar Track/Overhead share jumps from 1.4% of 2024 minutes to 15.7% of
  2025 minutes while Mechanical falls from 8.1% to 3.6%. Part of this may be
  crosswalk sensitivity at the code break, not a real change; treat
  year-over-year comparisons across the break as approximate.

## Claims checked and NOT reproduced

Do not use these; they failed verification against the full series:

- "Streetcars lose more time to cars parked on the tracks than to mechanical
  breakdowns." Auto-foul-rail codes (MTAFR, MFAFR) total 1,394 incidents and
  36,728 minutes; the Mechanical category totals 47,547 incidents and
  400,253 minutes. Mechanical is roughly 11x larger.
- "Disorderly-patron delays peak at 9 PM." Peak hour is 5 PM.
- "Sunday incidents last 67% longer than Friday ones." Sunday averages
  13.8 minutes vs Friday 12.1, about 14% longer.

## Caveats

- No ridership denominators exist in public data; per-rider delay rates cannot
  be computed. This applies next to every line and route comparison.
- The TTC logs a single primary cause per incident.
- The 2024-to-2025 crosswalk is editorial, not official. Year-over-year
  comparisons across the break are approximate; `crosswalk_v1.csv` shows
  exactly how each code was mapped.
- The 2025+ files are rolling and the portal refreshes them; every figure
  carries its vintage (pull date 2026-10-09, portal refresh 2026-09-21,
  coverage through 2026-08-31).

## Reproducing

See `docs/REPRODUCE.md`. Pipeline: `scripts/download_resources.py` (fetch +
resource inventory) -> `scripts/observed_codes.py` ->
`scripts/build_crosswalk.py` -> `scripts/ingest.py` ->
`scripts/build_aggregates.py`. Requirements: pandas, openpyxl, pyarrow.
