import { NextResponse } from "next/server";
import { getData } from "@/lib/delays";

export async function GET() {
  const d = getData();
  return NextResponse.json({
    vintage: d.meta.vintage,
    note: "Subway line shares of delay-minutes over the full series. No public ridership denominator exists, so per-rider rates cannot be computed.",
    lines: d.lines,
  });
}
