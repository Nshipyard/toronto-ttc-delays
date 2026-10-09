import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), "data");

export interface Meta {
  crosswalk_version: string;
  total_incidents: number;
  total_delay_minutes: number;
  by_mode: { mode: string; incidents: number; delay_minutes: number }[];
  by_mode_era: Record<string, number>;
  date_range: { min: string; max: string };
  crosswalk_methods: Record<string, number>;
  crosswalk_confidence: Record<string, number>;
  crosswalk_rows: number;
  unmapped_rows: number;
  zero_minute_rows: number;
  pull_date: string;
  portal_refresh: string;
  coverage: string;
  vintage: string;
  categories: string[];
}

export interface Bubble {
  category: string;
  delay_minutes: number;
  delay_hours: number;
  incidents: number;
  avg_minutes: number;
}

export interface Fingerprint {
  category: string;
  share: number;
}

export interface LineStat {
  line: string;
  delay_minutes: number;
  incidents: number;
  share: number;
}

export interface ExplorerRow {
  mode: string;
  cause_code: string;
  official_description: string;
  category: string;
  method: string;
  confidence: string;
  note: string;
  incidents: number;
  delay_minutes: number;
}

export interface SiteData {
  meta: Meta;
  trend: { year: number; bus: number; streetcar: number; subway: number; total: number }[];
  trend_summary: Record<string, number>;
  by_mode_year: { year: number; mode: string; delay_minutes: number; incidents: number }[];
  by_year: Record<string, {
    year: number;
    modes: Record<string, {
      delay_minutes: number; incidents: number;
      categories: Record<string, { delay_minutes: number; incidents: number; share: number; avg_minutes: number }>;
    }>;
  }>;
  bubbles: Bubble[];
  fingerprints: Record<string, Fingerprint[]>;
  lines: LineStat[];
  hour_heat: { hour: number; mode: string; category: string; incidents: number; delay_minutes: number }[];
  weekday_heat: { weekday: string; mode: string; category: string; incidents: number; delay_minutes: number; avg_minutes: number }[];
  weekday_avg: Record<string, number>;
  era_break: Record<string, number>;
  foul_rail_vs_mechanical: { foul_rail_minutes: number; foul_rail_incidents: number; mechanical_minutes: number; mechanical_incidents: number };
  disorderly: { code: string; mode: string; total_incidents: number; total_delay_minutes: number; peak_hour: number; peak_hour_incidents: number };
  explorer: ExplorerRow[];
  cleaning_rules: Record<string, number>;
  raw_rows_ingested: number;
}

let cache: SiteData | null = null;

export function getData(): SiteData {
  if (cache) return cache;
  cache = JSON.parse(fs.readFileSync(path.join(DATA, "site-data.json"), "utf8")) as SiteData;
  return cache;
}

export function lookupCode(mode: string, code: string): ExplorerRow | undefined {
  return getData().explorer.find(
    (r) => r.mode === mode.toLowerCase() && r.cause_code.toLowerCase() === code.toLowerCase()
  );
}

export function searchExplorer(q: string, mode: string, limit = 100): { total: number; rows: ExplorerRow[] } {
  const query = q.trim().toLowerCase();
  const rows = getData().explorer.filter((r) => {
    if (mode && r.mode !== mode) return false;
    if (query && !`${r.cause_code} ${r.official_description} ${r.category}`.toLowerCase().includes(query)) return false;
    return true;
  });
  const sorted = [...rows].sort((a, b) => b.delay_minutes - a.delay_minutes);
  return { total: rows.length, rows: sorted.slice(0, limit) };
}
