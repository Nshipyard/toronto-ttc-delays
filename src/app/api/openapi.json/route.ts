import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "TTC Delays, One Taxonomy API",
    version: "1.0.0",
    description:
      "1,240,037 TTC delay incidents (2014-01-01 to 2026-08-31) across subway, streetcar, and bus, unified on one 8-category cause taxonomy. The TTC changed its delay-coding scheme in 2025 and published no crosswalk; this API serves the editorial crosswalk v1 that bridges the break. No TTC-published crosswalk exists. MIT licensed.",
  },
  servers: [{ url: "https://ttc.canada.nshipyard.com/api/v1" }],
  paths: {
    "/delays/summary": {
      get: {
        summary: "Headline totals, trend summary, vintage, crosswalk methods",
        responses: { "200": { description: "Summary of the full build" } },
      },
    },
    "/delays/by-mode": {
      get: {
        summary: "Per-mode trend series, fingerprints, and category totals",
        parameters: [
          { name: "mode", in: "query", required: false, schema: { type: "string", enum: ["bus", "streetcar", "subway"] }, example: "subway" },
        ],
        responses: {
          "200": { description: "Mode data" },
          "400": { description: "Unknown mode" },
        },
      },
    },
    "/delays/by-year": {
      get: {
        summary: "One year: delay-minutes, incidents, category shares per mode",
        parameters: [
          { name: "year", in: "query", required: true, schema: { type: "integer" }, example: 2024 },
        ],
        responses: {
          "200": { description: "Year record" },
          "400": { description: "Unknown year" },
        },
      },
    },
    "/delays/by-line": {
      get: {
        summary: "Subway line shares of delay-minutes over the full series",
        responses: { "200": { description: "Line 1 through Line 4 shares" } },
      },
    },
    "/delays/by-cause": {
      get: {
        summary: "One cause category: totals plus yearly series per mode",
        parameters: [
          { name: "category", in: "query", required: true, schema: { type: "string" }, example: "Mechanical" },
        ],
        responses: {
          "200": { description: "Category record" },
          "400": { description: "Unknown category" },
        },
      },
    },
    "/delays/crosswalk": {
      get: {
        summary: "Search the 539-row editorial crosswalk by code, description, or category",
        parameters: [
          { name: "q", in: "query", required: false, schema: { type: "string" }, example: "SUDP" },
          { name: "mode", in: "query", required: false, schema: { type: "string", enum: ["bus", "streetcar", "subway"] } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 100, maximum: 539 } },
        ],
        responses: { "200": { description: "Matching crosswalk rows with observed counts" } },
      },
    },
    "/delays/heat": {
      get: {
        summary: "Hour-of-day and day-of-week delay aggregates by mode and category",
        responses: { "200": { description: "Heatmap cells plus trend, bubbles, fingerprints, lines" } },
      },
    },
    "/delays/metadata": {
      get: {
        summary: "Vintages, row counts, cleaning rules, sources",
        responses: { "200": { description: "Metadata record" } },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
