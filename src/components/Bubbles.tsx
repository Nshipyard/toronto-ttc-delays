"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n";
import { catColor, num, num1 } from "./viz-shared";

interface B { category: string; delay_minutes: number; delay_hours: number; incidents: number; avg_minutes: number }

const W = 960, H = 480, PAD_L = 64, PAD_R = 200, PAD_T = 24, PAD_B = 52;

export default function Bubbles() {
  const { t } = useLang();
  const [rows, setRows] = useState<B[]>([]);
  useEffect(() => {
    fetch("/api/v1/delays/heat").then((r) => r.json()).then((d) => setRows(d.bubbles ?? [])).catch(() => {});
  }, []);

  const innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B;
  const maxX = rows.length ? Math.max(...rows.map((r) => r.avg_minutes)) * 1.1 : 1;
  const maxY = rows.length ? Math.max(...rows.map((r) => r.delay_hours)) * 1.1 : 1;
  const maxInc = rows.length ? Math.max(...rows.map((r) => r.incidents)) : 1;
  const x = (v: number) => PAD_L + (v / maxX) * innerW;
  const y = (v: number) => PAD_T + innerH - (v / maxY) * innerH;
  const rOf = (inc: number) => 10 + 42 * Math.sqrt(inc / maxInc);

  const xTicks = [0, 5, 10, 15, 20];
  const yTicks = [0, 25000, 50000, 75000, 100000, 125000];

  return (
    <div className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t.bubbles.title}>
        {xTicks.map((tk) => (
          <g key={tk}>
            <line x1={x(tk)} x2={x(tk)} y1={PAD_T} y2={PAD_T + innerH} stroke="rgba(10,15,30,0.07)" />
            <text x={x(tk)} y={H - 28} textAnchor="middle" fontSize={12} fill="rgba(10,15,30,0.55)">{tk}</text>
          </g>
        ))}
        {yTicks.map((tk) => (
          <g key={tk}>
            <line x1={PAD_L} x2={PAD_L + innerW} y1={y(tk)} y2={y(tk)} stroke="rgba(10,15,30,0.07)" />
            <text x={PAD_L - 10} y={y(tk) + 5} textAnchor="end" fontSize={12} fill="rgba(10,15,30,0.55)">
              {num(tk)}
            </text>
          </g>
        ))}
        {rows.map((b, i) => (
          <g key={b.category}>
            <circle cx={x(b.avg_minutes)} cy={y(b.delay_hours)} r={rOf(b.incidents)} fill={catColor(b.category)} opacity={0.72} />
            <text x={x(b.avg_minutes) + rOf(b.incidents) + 8} y={y(b.delay_hours) + (i % 2 === 0 ? -6 : 16)} fontSize={13} fontWeight={600} fill="#0a0f1e">
              {b.category}
            </text>
            <text x={x(b.avg_minutes) + rOf(b.incidents) + 8} y={y(b.delay_hours) + (i % 2 === 0 ? 11 : 33)} fontSize={12} fill="rgba(10,15,30,0.6)">
              {num(b.incidents)} · {num1(b.avg_minutes)} min
            </text>
          </g>
        ))}
        <text x={PAD_L + innerW / 2} y={H - 6} textAnchor="middle" fontSize={13} fill="rgba(10,15,30,0.65)">{t.bubbles.xAxis}</text>
        <text x={16} y={PAD_T + innerH / 2} textAnchor="middle" fontSize={13} fill="rgba(10,15,30,0.65)" transform={`rotate(-90 16 ${PAD_T + innerH / 2})`}>{t.bubbles.yAxis}</text>
      </svg>
      <p className="mt-2 text-[13px] text-ink/55">{t.bubbles.sizeNote}</p>
    </div>
  );
}
