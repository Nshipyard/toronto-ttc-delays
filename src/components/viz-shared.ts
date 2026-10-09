export const num = (n: number) => n.toLocaleString("en-CA");
export const num1 = (n: number) => n.toLocaleString("en-CA", { maximumFractionDigits: 1 });
export const pct = (n: number) => `${n.toLocaleString("en-CA", { maximumFractionDigits: 1 })}%`;

export const MODE_COLORS: Record<string, string> = {
  bus: "#1f6feb",
  streetcar: "#d80621",
  subway: "#6d28d9",
};

export const CAT_COLORS: Record<string, string> = {
  "Operations/Crew": "#d80621",
  "Mechanical": "#1f6feb",
  "Security": "#6d28d9",
  "Emergency/Medical": "#e8772e",
  "Collision": "#0f766e",
  "Unclassified": "#94a3b8",
  "Cleaning/Sanitation": "#16a34a",
  "Track/Overhead": "#b45309",
};

export function catColor(c: string) {
  return CAT_COLORS[c] ?? "#64748b";
}
