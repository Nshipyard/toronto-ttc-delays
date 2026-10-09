import { NextResponse } from "next/server";
import { getData, searchExplorer } from "@/lib/delays";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const mode = (searchParams.get("mode") ?? "").toLowerCase();
  const limitRaw = parseInt(searchParams.get("limit") ?? "100", 10);
  const limit = Math.min(Math.max(isNaN(limitRaw) ? 100 : limitRaw, 1), 539);
  const d = getData();
  const r = searchExplorer(q, mode, limit);
  return NextResponse.json({
    vintage: d.meta.vintage,
    crosswalk_version: d.meta.crosswalk_version,
    editorial_note:
      "No TTC-published crosswalk exists. This table is editorial and versioned; pattern-matched rows are flagged as unofficial.",
    ...r,
  });
}
