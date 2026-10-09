import { NextResponse } from "next/server";
import { getData } from "@/lib/delays";

export async function GET() {
  const d = getData();
  return NextResponse.json({
    vintage: d.meta.vintage,
    crosswalk_version: d.meta.crosswalk_version,
    date_range: d.meta.date_range,
    pull_date: d.meta.pull_date,
    portal_refresh: d.meta.portal_refresh,
    total_incidents: d.meta.total_incidents,
    total_delay_minutes: d.meta.total_delay_minutes,
    raw_rows_ingested: d.raw_rows_ingested,
    by_mode_era: d.meta.by_mode_era,
    crosswalk_rows: d.meta.crosswalk_rows,
    crosswalk_methods: d.meta.crosswalk_methods,
    crosswalk_confidence: d.meta.crosswalk_confidence,
    unmapped_rows: d.meta.unmapped_rows,
    zero_minute_rows: d.meta.zero_minute_rows,
    cleaning_rules: d.cleaning_rules,
    sources: [
      { name: "TTC Subway Delay Data", url: "https://open.toronto.ca/dataset/ttc-subway-delay-data/" },
      { name: "TTC Streetcar Delay Data", url: "https://open.toronto.ca/dataset/ttc-streetcar-delay-data/" },
      { name: "TTC Bus Delay Data", url: "https://open.toronto.ca/dataset/ttc-bus-delay-data/" },
    ],
    license: "Open Government Licence - Toronto",
  });
}
