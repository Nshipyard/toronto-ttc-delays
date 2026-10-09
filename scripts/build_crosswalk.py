#!/usr/bin/env python3
"""Build the TTC delay cause crosswalk (v1): every raw cause code/label from all
three modes and both eras -> one of seven common categories plus Unclassified.

Method notes (also documented in data/README.md):
- The TTC publishes NO crosswalk between its pre-2025 and 2025+ coding schemes,
  and no crosswalk between the plain-language surface categories and the
  alphanumeric codes. This crosswalk is EDITORIAL and versioned.
- Official code descriptions come from the City of Toronto Open Data portal:
  the per-mode "Code Descriptions" resources (2025+ U-scheme) and the subway
  "ttc-subway-delay-codes" resource, which carries the legacy R-scheme table
  with identical descriptions (so R-scheme codes are mapped from official
  descriptions, not guessed).
- Codes absent from every official table are assigned by prefix/suffix pattern
  rules and flagged method=pattern with low confidence.
"""
import csv, os, re, sys

RAW = os.environ.get("RAW_DIR", os.path.join(os.path.dirname(__file__), "..", "raw"))
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "crosswalk_v1.csv")
VERSION = "v1"

CATS = ["Operations/Crew", "Security", "Mechanical", "Cleaning/Sanitation",
        "Emergency/Medical", "Collision", "Track/Overhead", "Unclassified"]


def clean_desc(s):
    s = (s or "").strip()
    s = s.replace("â\x80\x93", "-").replace("â\x80\x99", "'").replace("â\x80\x9c", '"').replace("â\x80\x9d", '"')
    s = re.sub(r"\s+", " ", s)
    return s


def load_official(path):
    d = {}
    with open(path, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            d[row["CODE"].strip()] = clean_desc(row["DESCRIPTION"])
    return d


VAGUE_UNCLASSIFIED = {
    "OTHER", "RC&S OTHER", "MISCELLANEOUS OTHER", "OTHER - PLANT", "T&S OTHER",
    "MISCELLANEOUS GENERAL SUBWAY LINE DELAYS -",
    "MISCELLANEOUS GENERAL STREETCAR DELAY",
    "PASSENGER OTHER", "MISCELLANEOUS OTHER",
}

def categorize(desc, code):
    """Keyword rules, first match wins. Returns (category, confidence, note)."""
    D = " " + desc.upper() + " "
    U = lambda *ks: any(k in D for k in ks)

    if desc.upper().strip() in VAGUE_UNCLASSIFIED:
        return "Unclassified", "high", "vague catch-all code"
    if U("NO TROUBLE FOUND"):
        return "Unclassified", "medium", "logged delay with no fault found; not attributable"
    if U("NO EQUIPMENT AVAILABLE"):
        return "Operations/Crew", "medium", "no vehicle/equipment available is operational"
    if U("VISION ISSUES"):
        return "Unclassified", "medium", "environmental visibility; fits no category"
    if U("MISCELLANEOUS GENERAL"):
        return "Unclassified", "medium", "vague catch-all"

    if U("COLLISION", "CONTACT WITH PERSON", "PRIORITY ONE"):
        return "Collision", "high", ""
    if U("INJURED", "ILL CUSTOMER", "ILL OPERATOR", "MEDICAL AID", "FIRE", "SMOKE",
         "ESCALATOR", "ELEVATOR INCIDENT", "STAIRWAY INCIDENT", "ON BOARD INJURY"):
        return "Emergency/Medical", "high", ""
    if U("UNSANITARY", "BIOHAZARD", "GRAFFITI", "SCRATCHITI", "CLEANING"):
        return "Cleaning/Sanitation", "high", ""
    if U("ASSAULT", "ASSUALT", "DISORDERLY", "BOMB THREAT", "SUSPICIOUS", "ROBBERY",
         "HELD BY POLICE", "POLICE INVESTIGATION", "HOLD-UP", "ALARM ACTIVATED",
         "UNAUTHORIZED AT TRACK", "SECURITY OTHER", "EMERGENCY ALARM", "FARE DISPUTE"):
        return "Security", "high", ""
    if U("TRACK", "RAIL", "SWITCH", "SIGNAL", "OVERHEAD", "PANTOGRAPH", "SCADA",
         "T&S", "PLANT MAINTENANCE", "DEBRIS AT TRACK", "WORK ZONE", "TRACTION POWER",
         "TRUMP UNIT", "AXLE COUNTER", "STRUCTURE RELATED", "INSULATED JOINT",
         "ICE/SNOW", "TRACK CIRCUIT", "SPEED CONTROL", "BEACON", "RADIO",
         "DATA COMMUNICATIONS", "SMART IO", "LOGIC CONTROLLER", "LOOP",
         "EXTERNAL POWER FAILURE", "SIGNALS POWER SUPPLY", "ELECTRICAL -", "VCC/RCIU/CCR"):
        return "Track/Overhead", "high", "signalling, track, overhead and traction power infrastructure"
    if U("NO OPERATOR", "NO CREW", "NO COLLECTOR", "OPERATOR", "UNABLE TO MAINT",
         "LATE ENTERING", "LATE VEHICLE", "DIVERSION", "LABOUR DISPUTE", "WORK REFUSAL",
         "TRAINING", "SUPERVISORY", "DIVISIONAL CLERK", "CLOSURES", "WEATHER",
         "FORCE MAJEURE", "YARD", "CARHOUSE", "TRANSIT CONTROL", "TOWER CONTROLLER",
         "MAINLINE STORAGE", "STORM TRAINS", "USED AS A PUSHER", "USED AS SHUTTLE",
         "OTHER - SWITCH VIOLATION", "CANCELLATION", "TRAPPED VEHICLE",
         "CONSTRUCTION", "ATC PROJECT", "DOORS OPEN IN ERROR", "CONTROLS IMPROPERLY",
         "TRANSPORTATION OTHER", "MISC.TRANSPORTATION OTHER",
         "MISCELLANEOUS TRANSPORTATION OTHER", "TRANSPORTATION - OTHER",
         "TRANSPORTATION DEPARTMENT - OTHER", "TIMEOUT",
         "PARADES", "MARCHES"):
        note = ""
        if U("TRAPPED VEHICLE"):
            note = "cause ambiguous; treated as operational blockage"
        if U("TIMEOUT"):
            note = "operational hold; confidence medium"
            return "Operations/Crew", "medium", note
        return "Operations/Crew", "high", note
    if U("DOOR PROBLEMS"):
        if "PASSENGER" in D:
            return "Operations/Crew", "medium", "passenger-caused door holding"
        return "Mechanical", "high", ""
    # equipment default
    if code[:2] in {"EU", "ER", "ET", "EF"}:
        return "Mechanical", "high", "equipment prefix, no other signal"
    return "Unclassified", "low", "no rule matched"


def pattern_map(code):
    """Fallback for codes in NO official table. Returns (category, confidence, note)."""
    c = code.strip().upper()
    if c == "XXXXX" or not c or len(c) == 1:
        return "Unclassified", "high", "placeholder or single-character fragment"
    if c in {"STG", "STL", "SFG", "SFL", "SUL", "SUPD"}:
        return "Unclassified", "low", "pattern: S-code with unknown suffix; not assumed security"
    if "BIO" in c:
        return "Cleaning/Sanitation", "low", "pattern: BIO suffix implies biohazard"
    if c.endswith("SAN"):
        return "Cleaning/Sanitation", "low", "pattern: SAN suffix implies unsanitary"
    if "VIS" in c:
        return "Unclassified", "medium", "pattern: VIS implies vision issues; fits no category"
    if c == "TFDP":
        return "Collision", "low", "pattern: probable transposition typo of TFPD (TTC collision, property damage)"
    if c in {"EUTAC", "ERTO", "PUTO", "PTNT"}:
        notes = {"EUTAC": "probable typo of EUATC (ATC equipment)",
                 "ERTO": "unknown E-code; equipment family",
                 "PUTO": "probable typo of PUT0 (T&S other)",
                 "PTNT": "probable truncated PTNTF (switch problem)"}
        cats = {"EUTAC": "Mechanical", "ERTO": "Mechanical", "PUTO": "Track/Overhead", "PTNT": "Track/Overhead"}
        return cats[c], "low", "pattern: " + notes[c]
    if c[0] == "E":
        return "Mechanical", "medium", "pattern: E prefix is equipment family"
    if c[0] == "S":
        return "Security", "medium", "pattern: S prefix is security family"
    if c[0] == "P":
        return "Track/Overhead", "low", "pattern: P prefix is plant/track family; suffix unknown"
    if c[0] == "T":
        if any(c.endswith(s) for s in ("PD", "PI")):
            return "Collision", "medium", "pattern: T-prefix collision suffix"
        if "FOI" in c:
            return "Emergency/Medical", "medium", "pattern: on-board injury"
        if any(k in c for k in ("NOA", "ESA", "NCA", "LD", "DM", "OR", "AV", "UT", "DV", "US", "UL")):
            return "Operations/Crew", "low", "pattern: transportation family with operations-like suffix"
        return "Unclassified", "low", "pattern: T-code with unknown suffix"
    if c[0] == "M":
        if "FR" in c:
            return "Track/Overhead", "low", "pattern: foul-rail style obstruction"
        if "BIO" in c:
            return "Cleaning/Sanitation", "low", "pattern: BIO suffix implies biohazard"
        if any(c.endswith(s) for s in ("PD", "PI")):
            return "Collision", "low", "pattern: collision suffix"
        if c.endswith("UIR") or c.endswith("UI") or "IE" in c:
            return "Emergency/Medical", "low", "pattern: injury/illness suffix"
        if c.endswith("DV") or "NOA" in c or "ESA" in c or "NCA" in c or c.endswith("SH"):
            return "Operations/Crew", "low", "pattern: operations suffix"
        if "WR" in c or "WEA" in c or c.endswith("LD") or c.endswith("US") or c.endswith("UL"):
            return "Operations/Crew", "low", "pattern: workforce/schedule suffix"
        return "Unclassified", "low", "pattern: unrecognized M-code"
    return "Unclassified", "low", "pattern: unrecognized code"


PLAIN_LABELS = {
    "streetcar": [
        ("Cleaning", "Cleaning/Sanitation", "high", ""),
        ("Cleaning - Disinfection", "Cleaning/Sanitation", "high", ""),
        ("Cleaning - Unsanitary", "Cleaning/Sanitation", "high", ""),
        ("Collision - TTC Involved", "Collision", "high", ""),
        ("Diversion", "Operations/Crew", "high", "operational rerouting"),
        ("Emergency Services", "Emergency/Medical", "high", ""),
        ("General Delay", "Operations/Crew", "medium", "vague catch-all; best fit is operational"),
        ("Held By", "Operations/Crew", "medium", "held by control/supervision"),
        ("Investigation", "Security", "medium", "police investigation"),
        ("Late", "Operations/Crew", "medium", "vague late-departure label"),
        ("Late Entering Service", "Operations/Crew", "high", ""),
        ("Late Leaving Garage", "Operations/Crew", "high", ""),
        ("Management", "Operations/Crew", "medium", "management-caused delay"),
        ("Mechanical", "Mechanical", "high", ""),
        ("Operations", "Operations/Crew", "high", ""),
        ("Overhead", "Track/Overhead", "high", ""),
        ("Overhead - Pantograph", "Track/Overhead", "high", ""),
        ("Rail/Switches", "Track/Overhead", "high", ""),
        ("Security", "Security", "high", ""),
        ("Utilized Off Route", "Operations/Crew", "high", "vehicle redeployed off route"),
        ("Utilizing Off Route", "Operations/Crew", "high", "variant spelling of Utilized Off Route"),
        ("Vision", "Unclassified", "medium", "environmental visibility; fits no category"),
    ],
    "bus": [
        ("Cleaning", "Cleaning/Sanitation", "high", ""),
        ("Cleaning - Disinfection", "Cleaning/Sanitation", "high", ""),
        ("Cleaning - Unsanitary", "Cleaning/Sanitation", "high", ""),
        ("Collision - TTC", "Collision", "high", ""),
        ("Collision - TTC Involved", "Collision", "high", ""),
        ("Diversion", "Operations/Crew", "high", "operational rerouting"),
        ("Emergency Services", "Emergency/Medical", "high", ""),
        ("General Delay", "Operations/Crew", "medium", "vague catch-all; best fit is operational"),
        ("Held By", "Operations/Crew", "medium", "held by control/supervision"),
        ("Investigation", "Security", "medium", "police investigation"),
        ("Late", "Operations/Crew", "medium", "vague late-departure label"),
        ("Late Entering Service", "Operations/Crew", "high", ""),
        ("Late Entering Service - Mechanical", "Mechanical", "high", "label names mechanical cause"),
        ("Late Leaving Garage", "Operations/Crew", "high", ""),
        ("Late Leaving Garage - Management", "Operations/Crew", "medium", ""),
        ("Late Leaving Garage - Mechanical", "Mechanical", "high", "label names mechanical cause"),
        ("Late Leaving Garage - Operations", "Operations/Crew", "high", ""),
        ("Late Leaving Garage - Operator", "Operations/Crew", "high", ""),
        ("Late Leaving Garage - Vision", "Unclassified", "medium", "environmental visibility; fits no category"),
        ("Management", "Operations/Crew", "medium", "management-caused delay"),
        ("Mechanical", "Mechanical", "high", ""),
        ("Operations", "Operations/Crew", "high", ""),
        ("Operations - Operator", "Operations/Crew", "high", ""),
        ("Overhead", "Track/Overhead", "high", ""),
        ("Rail/Switches", "Track/Overhead", "high", ""),
        ("Road Block - Non-TTC Collision", "Collision", "high", ""),
        ("Road Blocked - NON-TTC Collision", "Collision", "high", ""),
        ("Roadblock by Collision - Non-TTC", "Collision", "high", ""),
        ("Securitty", "Security", "high", "misspelled Security label"),
        ("Security", "Security", "high", ""),
        ("Utilized Off Route", "Operations/Crew", "high", "vehicle redeployed off route"),
        ("Utilizing Off Route", "Operations/Crew", "high", "variant spelling of Utilized Off Route"),
        ("Vision", "Unclassified", "medium", "environmental visibility; fits no category"),
    ],
}


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    sub_off = load_official(os.path.join(RAW, "ttc-subway-delay-data__CodeDescriptions.csv"))
    st_off = load_official(os.path.join(RAW, "ttc-streetcar-delay-data__CodeDescriptions.csv"))
    bus_off = load_official(os.path.join(RAW, "ttc-bus-delay-data__CodeDescriptions.csv"))
    old_rows = list(csv.DictReader(open(os.path.join(RAW, "subway_codes_old_scheme.csv"), encoding="utf-8")))
    tables = {"subway": sub_off, "streetcar": st_off, "bus": bus_off}

    rows = []
    # explicit overrides where the keyword rules get a known code wrong
    OVERRIDES = {
        ("subway", "PUOPO"): ("Track/Overhead", "medium",
                              "communications-group train door monitoring; plant side"),
    }
    # official tables per mode
    for mode, table in tables.items():
        for code, desc in sorted(table.items()):
            if (mode, code) in OVERRIDES:
                cat, conf, note = OVERRIDES[(mode, code)]
            else:
                cat, conf, note = categorize(desc, code)
            rows.append([VERSION, mode, code, desc, cat, "official", conf, note])
    # legacy subway R-scheme: official descriptions from the TTC legacy code table
    for r in old_rows:
        code, desc = r["CODE"].strip(), clean_desc(r["DESCRIPTION"])
        if ("subway", code) in OVERRIDES:
            cat, conf, note = OVERRIDES[("subway", code)]
        else:
            cat, conf, note = categorize(desc, code)
        rows.append([VERSION, "subway", code, desc, cat, "official-legacy", conf, note])

    # rows with no cause recorded in the source file
    for m in ("subway", "streetcar", "bus"):
        rows.append([VERSION, m, "NOT LOGGED", "Not Logged", "Unclassified",
                     "direct-label", "high", "source row had no cause recorded"])

    # cross-mode official lookups and pattern fallback for observed codes
    # (mode<TAB>code pairs passed as TSV files on the command line)
    observed = {}
    for path in sys.argv[1:]:
        with open(path) as f:
            for line in f:
                mode, code = line.strip().split("\t")
                observed.setdefault(mode, set()).add(code)
    have = {(r[1], r[2]) for r in rows}
    for mode, codes in observed.items():
        for code in sorted(codes):
            if (mode, code) in have:
                continue
            desc, method, cat, conf, note = "", "pattern", None, None, None
            # cross-mode official lookup
            for m2, table in tables.items():
                if m2 != mode and code in table:
                    desc = table[code]
                    cat, conf, note = categorize(desc, code)
                    method = "cross-mode-official"
                    note = (note + "; " if note else "") + "official description from %s table" % m2
                    break
            if cat is None:
                # legacy R-scheme correspondence check is covered above; try pattern
                cat, conf, note = pattern_map(code)
            rows.append([VERSION, mode, code, desc, cat, method, conf, note])

    # plain-language era labels (cause_code stored uppercased to match incident table)
    for mode, labels in PLAIN_LABELS.items():
        for label, cat, conf, note in labels:
            rows.append([VERSION, mode, label.upper(), label, cat, "direct-label", conf, note])

    # dedupe, prefer official over pattern
    rank = {"official": 0, "official-legacy": 1, "cross-mode-official": 2, "direct-label": 3, "pattern": 4}
    best = {}
    for r in rows:
        key = (r[1], r[2])
        if key not in best or rank[r[5]] < rank[best[key][5]]:
            best[key] = r
    final = sorted(best.values(), key=lambda r: (r[1], r[2]))
    with open(OUT, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["crosswalk_version", "mode", "cause_code", "official_description",
                    "category", "method", "confidence", "note"])
        w.writerows(final)
    print("wrote", OUT, len(final), "rows")
    from collections import Counter
    print(Counter((r[5], r[6]) for r in final))


if __name__ == "__main__":
    main()
