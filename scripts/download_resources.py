#!/usr/bin/env python3
"""Download all TTC delay raw files from the City of Toronto Open Data CKAN.

Enumerates resources via package_show on the three dataset slugs, saves the
resource inventory (IDs, vintages, pull date) to data/resource_meta.json, and
downloads the XLSX/CSV delay files plus the code-description lookups into raw/.

Usage: RAW_DIR=../raw python3 download_resources.py
"""
import json, os, urllib.request

BASE = "https://ckan0.cf.opendata.inter.prod-toronto.ca"
API = BASE + "/api/3/action/package_show?id="
DATASETS = {
    "ttc-subway-delay-data": "996cfe8d-fb35-40ce-b569-698d51fc683b",
    "ttc-streetcar-delay-data": "b68cb71b-44a7-4394-97e2-5d2f41462a5d",
    "ttc-bus-delay-data": "e271cdae-8788-4980-96ce-6a5c95bc6618",
}
RAW = os.environ.get("RAW_DIR", os.path.join(os.path.dirname(__file__), "..", "raw"))
DATA = os.path.join(os.path.dirname(__file__), "..", "data")
PULL_DATE = "2026-10-09"


def main():
    os.makedirs(RAW, exist_ok=True)
    meta = {}
    for slug, dsid in DATASETS.items():
        with urllib.request.urlopen(API + slug, timeout=60) as r:
            pkg = json.load(r)["result"]
        meta[slug] = {
            "title": pkg["title"],
            "dataset_id": dsid,
            "last_refreshed": pkg.get("last_refreshed"),
            "resources": {},
        }
        for res in pkg["resources"]:
            name, fmt = res["name"], res["format"]
            meta[slug]["resources"][name] = {
                "id": res["id"], "format": fmt, "size": res["size"],
                "last_modified": res["last_modified"],
                "url": f"{BASE}/dataset/{dsid}/resource/{res['id']}/download",
            }
            if fmt in ("XLSX", "CSV") and ("delay" in name.lower() or "code" in name.lower()):
                out = os.path.join(RAW, f"{slug}__{name}.{fmt.lower()}")
                if os.path.exists(out):
                    print("skip", out)
                    continue
                print("downloading", name)
                req = urllib.request.Request(
                    f"{BASE}/dataset/{dsid}/resource/{res['id']}/download",
                    headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=600) as resp, open(out, "wb") as f:
                    f.write(resp.read())
                print("saved", out, os.path.getsize(out))
    meta["pull_date"] = PULL_DATE
    json.dump(meta, open(os.path.join(DATA, "resource_meta.json"), "w"), indent=1)
    print("wrote resource_meta.json")


if __name__ == "__main__":
    main()
