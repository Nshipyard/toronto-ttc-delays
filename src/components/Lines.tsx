"use client";

import { useEffect, useState } from "react";
import { num, pct } from "./viz-shared";

interface L { line: string; delay_minutes: number; incidents: number; share: number }

export default function Lines() {
  const [lines, setLines] = useState<L[]>([]);
  useEffect(() => {
    fetch("/api/v1/delays/heat").then((r) => r.json()).then((d) => setLines(d.lines ?? [])).catch(() => {});
  }, []);

  const max = Math.max(...lines.map((l) => l.share), 1);
  return (
    <div className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
      <ul className="space-y-6">
        {lines.map((l) => (
          <li key={l.line}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[17px] font-semibold">{l.line}</p>
              <p className="font-mono text-[15px] text-ink/70">
                {pct(l.share)} · {num(Math.round(l.delay_minutes))} min · {num(l.incidents)} incidents
              </p>
            </div>
            <div className="mt-2 h-5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-canada" style={{ width: `${(l.share / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
