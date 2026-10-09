#!/usr/bin/env python3
"""Scan the raw files and emit observed (mode, cause_code) pairs as TSV.

Used as input to build_crosswalk.py so the crosswalk covers every code that
actually appears in the data, including codes missing from the official tables.
"""
import glob, os
import openpyxl
import pandas as pd


def dequote(s):
    s = s.strip()
    if len(s) >= 2 and s[0] == s[-1] and s[0] in "'\"":
        return s[1:-1].strip()
    return s


RAW = os.environ.get("RAW_DIR", os.path.join(os.path.dirname(__file__), "..", "raw"))


def main():
    pairs = set()
    specs = [
        ("subway", sorted(glob.glob(os.path.join(RAW, "ttc-subway-delay-data__*.xlsx"))), "Code",
         [os.path.join(RAW, "ttc-subway-delay-data__TTC Subway Delay Data since 2025.csv.csv")]),
        ("streetcar", sorted(glob.glob(os.path.join(RAW, "ttc-streetcar-delay-data__*.xlsx"))), "Incident",
         [os.path.join(RAW, "ttc-streetcar-delay-data__TTC Streetcar Delay Data since 2025.csv.csv")]),
        ("bus", sorted(glob.glob(os.path.join(RAW, "ttc-bus-delay-data__*.xlsx"))), "Incident",
         [os.path.join(RAW, "ttc-bus-delay-data__TTC Bus Delay Data since 2025.csv.csv")]),
    ]
    for mode, xlsx_files, causecol, csv_files in specs:
        for p in xlsx_files:
            base = os.path.basename(p)
            if "codedescriptions" in base.lower() or "readme" in base.lower() or "old_codes" in base:
                continue
            xl = pd.ExcelFile(p, engine="openpyxl")
            for sheet in xl.sheet_names:
                df = xl.parse(sheet, dtype=object)
                df.columns = [str(c).strip() for c in df.columns]
                if causecol not in df.columns:
                    continue
                for v in df[causecol].dropna().astype(str):
                    c = dequote(v).upper()
                    if c:
                        pairs.add((mode, c))
        for p in csv_files:
            df = pd.read_csv(p, usecols=["Code"], dtype=str)
            for v in df["Code"].dropna().astype(str):
                c = dequote(v).upper()
                if c:
                    pairs.add((mode, c))
    out = os.path.join(os.path.dirname(__file__), "observed_codes.tsv")
    with open(out, "w") as f:
        for mode, code in sorted(pairs):
            f.write("%s\t%s\n" % (mode, code))
    print("wrote", out, len(pairs), "pairs")


if __name__ == "__main__":
    main()
