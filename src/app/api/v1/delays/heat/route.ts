import { NextResponse } from "next/server";
import { getData } from "@/lib/delays";

export async function GET() {
  const d = getData();
  return NextResponse.json({
    vintage: d.meta.vintage,
    trend: d.trend,
    trend_summary: d.trend_summary,
    bubbles: d.bubbles,
    fingerprints: d.fingerprints,
    lines: d.lines,
    hour_heat: d.hour_heat,
    weekday_heat: d.weekday_heat,
    weekday_avg: d.weekday_avg,
    era_break: d.era_break,
    disorderly: d.disorderly,
    foul_rail_vs_mechanical: d.foul_rail_vs_mechanical,
  });
}
