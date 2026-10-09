"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n";
import { MODE_COLORS, num } from "./viz-shared";

interface Row { year: number; bus: number; streetcar: number; subway: number; total: number }

const MODES = ["bus", "streetcar", "subway"] as const;
const W = 960, H = 420, PAD_L = 64, PAD_R = 16, PAD_T = 20, PAD_B = 44;

export default function Trend() {
  const { t } = useLang();
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    fetch("/api/v1/delays/heat").then((r) => r.json()).then((d) => setRows(d.trend ?? [])).catch(() => {});
  }, []);

  const innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B;
  const maxY = rows.length ? Math.max(...rows.map((r) => r.total)) * 1.08 : 1;
  const x = (i: number) => PAD_L + (i / Math.max(rows.length - 1, 1)) * innerW;
  const y = (v: number) => PAD_T + innerH - (v / maxY) * innerH;

  // stacked area paths per mode
  const paths: string[] = [];
  if (rows.length > 0) {
    let cum: number[] = rows.map(() => 0);
    for (const m of MODES) {
      const top = rows.map((r, i) => cum[i] + r[m]);
      const dTop = rows.map((r, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(top[i]).toFixed(1)}`).join(" ");
      const rev = rows.map((_, i) => rows.length - 1 - i).map((i) => `L${x(i).toFixed(1)},${y(cum[i]).toFixed(1)}`).join(" ");
      paths.push(`${dTop} ${rev} Z`);
      cum = top;
    }
  }

  const ticks = [0, 500000, 1000000, 1500000];

  return (
    <div className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {MODES.map((m) => (
          <span key={m} className="flex items-center gap-2 text-[14px] font-medium text-ink/70">
            <span className="h-3 w-3 rounded-sm" style={{ background: MODE_COLORS[m] }} />
            {t.trend.legend[m]}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label={t.trend.title}>
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(tk)} y2={y(tk)} stroke="rgba(10,15,30,0.08)" />
            <text x={PAD_L - 10} y={y(tk) + 5} textAnchor="end" fontSize={12} fill="rgba(10,15,30,0.55)">
              {(tk / 1e6).toFixed(2)}M
            </text>
          </g>
        ))}
        {paths.map((d, i) => (
          <path key={MODES[i]} d={d} fill={MODE_COLORS[MODES[i]]} opacity={0.82} />
        ))}
        {rows.map((r, i) =>
          i % 2 === 0 || i === rows.length - 1 ? (
            <text key={r.year} x={x(i)} y={H - 14} textAnchor="middle" fontSize={12} fill="rgba(10,15,30,0.55)">
              {r.year}
              {r.year === 2026 ? "*" : ""}
            </text>
          ) : null
        )}
        <text x={PAD_L} y={PAD_T - 6} fontSize={12} fill="rgba(10,15,30,0.55)">{t.trend.yAxis}</text>
      </svg>
      <p className="mt-2 text-[13px] text-ink/55">* {t.trend.chartNote}</p>
      <p className="mt-4 max-w-[860px] text-[15px] leading-relaxed text-ink/70">{t.trend.built}</p>
    </div>
  );
}
