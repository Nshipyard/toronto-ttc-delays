import { NextResponse } from "next/server";
import { getData } from "@/lib/delays";

export async function GET() {
  const d = getData();
  return NextResponse.json({
    vintage: d.meta.vintage,
    crosswalk_version: d.meta.crosswalk_version,
    total_incidents: d.meta.total_incidents,
    total_delay_minutes: d.meta.total_delay_minutes,
    by_mode: d.meta.by_mode,
    by_mode_era: d.meta.by_mode_era,
    trend_summary: d.trend_summary,
    era_break: d.era_break,
    disorderly: d.disorderly,
    foul_rail_vs_mechanical: d.foul_rail_vs_mechanical,
    weekday_avg: d.weekday_avg,
    crosswalk_methods: d.meta.crosswalk_methods,
    crosswalk_confidence: d.meta.crosswalk_confidence,
    unmapped_rows: d.meta.unmapped_rows,
    zero_minute_rows: d.meta.zero_minute_rows,
  });
}
