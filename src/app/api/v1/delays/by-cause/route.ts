import { NextResponse } from "next/server";
import { getData } from "@/lib/delays";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "";
  const d = getData();
  const match = d.meta.categories.find((c) => c.toLowerCase() === category.toLowerCase());
  if (!match) {
    return NextResponse.json(
      { error: `Unknown category '${category}'. Valid: ${d.meta.categories.join(", ")}.` },
      { status: 400 }
    );
  }
  const bubble = d.bubbles.find((b) => b.category === match);
  const series = Object.values(d.by_year)
    .sort((a, b) => a.year - b.year)
    .map((y) => {
      const perMode: Record<string, { delay_minutes: number; incidents: number }> = {};
      for (const [m, mm] of Object.entries(y.modes)) perMode[m] = mm.categories[match];
      const total = Object.values(perMode).reduce((a, v) => a + v.delay_minutes, 0);
      return { year: y.year, delay_minutes: Math.round(total * 10) / 10, per_mode: perMode };
    });
  return NextResponse.json({ vintage: d.meta.vintage, category: match, totals: bubble, series });
}
