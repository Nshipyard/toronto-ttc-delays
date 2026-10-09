import { NextResponse } from "next/server";
import { getData, searchExplorer } from "@/lib/delays";

// Minimal MCP server over streamable HTTP (JSON-RPC 2.0 via POST).
// Supports: initialize, tools/list, tools/call. Stateless.

const SERVER = { name: "toronto-ttc-delays", version: "1.0.0" };

const TOOLS = [
  {
    name: "delays_summary",
    description:
      "Headline figures for the TTC delays build: 1,240,037 incidents (2014-01-01 to 2026-08-31), total delay-minutes by mode, trend summary 2014 vs 2024, vintage, and crosswalk method counts.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "delays_by_mode",
    description:
      "Per-mode delay data for bus, streetcar, or subway: yearly delay-minute trend, failure fingerprint (category shares), and category totals. Omit mode for all three.",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", description: "bus, streetcar, or subway. Optional." },
      },
      required: [],
    },
  },
  {
    name: "delays_by_cause",
    description:
      "One cause category (Operations/Crew, Mechanical, Security, Emergency/Medical, Collision, Track/Overhead, Cleaning/Sanitation, Unclassified): totals plus a yearly delay-minute series per mode.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Cause category, e.g. 'Mechanical'." },
      },
      required: ["category"],
    },
  },
  {
    name: "delays_crosswalk",
    description:
      "Search the 539-row editorial crosswalk v1 (no TTC-published crosswalk exists): code to category, method (official/pattern), confidence, with observed incident counts. Pattern-matched rows are unofficial.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search text, e.g. 'SUDP' or 'disorderly'. Optional." },
        mode: { type: "string", description: "bus, streetcar, or subway. Optional." },
        limit: { type: "integer", description: "Max rows, default 100, max 539." },
      },
      required: [],
    },
  },
  {
    name: "delays_line_share",
    description:
      "Subway line shares of delay-minutes over the full series (Line 1 50.5%, Line 2 39.4%). No public ridership denominator exists, so per-rider rates cannot be computed.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

function ok(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function err(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
function textResult(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function handle(msg: any) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return err(msg?.id ?? null, -32600, "Invalid Request");
  }
  const id = msg.id ?? null;
  const d = getData();
  switch (msg.method) {
    case "initialize":
      return ok(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER,
      });
    case "notifications/initialized":
      return null;
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      const { name, arguments: args } = msg.params ?? {};
      try {
        if (name === "delays_summary") {
          return ok(id, textResult({
            vintage: d.meta.vintage,
            total_incidents: d.meta.total_incidents,
            total_delay_minutes: d.meta.total_delay_minutes,
            by_mode: d.meta.by_mode,
            trend_summary: d.trend_summary,
            crosswalk_methods: d.meta.crosswalk_methods,
          }));
        }
        if (name === "delays_by_mode") {
          const mode = String(args?.mode ?? "").toLowerCase();
          const modes = ["bus", "streetcar", "subway"].filter((m) => !mode || m === mode);
          if (mode && modes.length === 0) return err(id, -32001, `Unknown mode ${args?.mode}`);
          return ok(id, textResult({ vintage: d.meta.vintage, modes: modes.map((m) => ({
            mode: m,
            trend: d.by_mode_year.filter((r) => r.mode === m),
            fingerprints: d.fingerprints[m],
          })) }));
        }
        if (name === "delays_by_cause") {
          const category = String(args?.category ?? "");
          const match = d.meta.categories.find((c) => c.toLowerCase() === category.toLowerCase());
          if (!match) return err(id, -32001, `Unknown category ${args?.category}`);
          const series = Object.values(d.by_year).sort((a, b) => a.year - b.year).map((y) => {
            const perMode: Record<string, number> = {};
            for (const [m, mm] of Object.entries(y.modes)) perMode[m] = mm.categories[match].delay_minutes;
            return { year: y.year, ...perMode };
          });
          return ok(id, textResult({ vintage: d.meta.vintage, category: match, series }));
        }
        if (name === "delays_crosswalk") {
          const rawLimit = parseInt(String(args?.limit ?? "100"), 10);
          const limit = Math.min(Math.max(isNaN(rawLimit) ? 100 : rawLimit, 1), 539);
          const r = searchExplorer(String(args?.q ?? ""), String(args?.mode ?? "").toLowerCase(), limit);
          return ok(id, textResult({
            crosswalk_version: d.meta.crosswalk_version,
            editorial_note: "No TTC-published crosswalk exists. Pattern-matched rows are unofficial.",
            ...r,
          }));
        }
        if (name === "delays_line_share") {
          return ok(id, textResult({
            vintage: d.meta.vintage,
            note: "No public ridership denominator exists; per-rider rates cannot be computed.",
            lines: d.lines,
          }));
        }
        return err(id, -32602, `Unknown tool ${name}`);
      } catch (e) {
        return err(id, -32000, `Tool error: ${(e as Error).message}`);
      }
    }
    default:
      return err(id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(err(null, -32700, "Parse error"), { status: 400 });
  }
  if (Array.isArray(body)) {
    const out = body.map(handle).filter((r) => r !== null);
    return NextResponse.json(out);
  }
  const out = handle(body);
  if (out === null) return new NextResponse(null, { status: 202 });
  return NextResponse.json(out);
}

export async function GET() {
  return NextResponse.json(
    { error: "This MCP server accepts JSON-RPC 2.0 via POST only." },
    { status: 405 }
  );
}

export async function DELETE() {
  return new NextResponse(null, { status: 405 });
}
