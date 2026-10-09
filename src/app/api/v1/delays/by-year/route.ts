import { NextResponse } from "next/server";
import { getData } from "@/lib/delays";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ?? "";
  const d = getData();
  const rec = d.by_year[year];
  if (!rec) {
    return NextResponse.json(
      { error: `Unknown year '${year}'. Coverage is 2014 to 2026 (2026 partial, January to August).` },
      { status: 400 }
    );
  }
  return NextResponse.json({ vintage: d.meta.vintage, ...rec });
}
