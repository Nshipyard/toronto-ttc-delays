import { NextResponse } from "next/server";
import { getData } from "@/lib/delays";

const MODES = ["bus", "streetcar", "subway"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode") ?? "").toLowerCase();
  const d = getData();
  const modes = mode ? (MODES.includes(mode) ? [mode] : []) : MODES;
  if (mode && modes.length === 0) {
    return NextResponse.json({ error: `Unknown mode '${mode}'. Use bus, streetcar, or subway.` }, { status: 400 });
  }
  return NextResponse.json({
    vintage: d.meta.vintage,
    modes: modes.map((m) => ({
      mode: m,
      trend: d.by_mode_year.filter((r) => r.mode === m).map((r) => ({ year: r.year, delay_minutes: r.delay_minutes, incidents: r.incidents })),
      fingerprints: d.fingerprints[m],
      bubbles: d.bubbles.map((b) => ({ ...b })),
    })),
  });
}
