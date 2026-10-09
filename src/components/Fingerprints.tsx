"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n";
import { catColor, pct } from "./viz-shared";

interface F { category: string; share: number }

const MODE_ORDER = ["streetcar", "subway", "bus"] as const;

export default function Fingerprints() {
  const { t, lang } = useLang();
  const [fp, setFp] = useState<Record<string, F[]> | null>(null);
  useEffect(() => {
    fetch("/api/v1/delays/heat").then((r) => r.json()).then((d) => setFp(d.fingerprints ?? null)).catch(() => {});
  }, []);

  const modeLabel = (m: string) => (lang === "fr" ? { streetcar: "Tramway", subway: "Métro", bus: "Bus" }[m] : m[0].toUpperCase() + m.slice(1));

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {MODE_ORDER.map((m) => (
        <div key={m} className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
          <h3 className="display text-[26px]">{modeLabel(m)}</h3>
          <div className="mt-5">
            <div className="flex h-4 w-full overflow-hidden rounded-full">
              {(fp?.[m] ?? []).map((f) => (
                <div key={f.category} style={{ width: `${f.share}%`, background: catColor(f.category) }} title={`${f.category}: ${pct(f.share)}`} />
              ))}
            </div>
          </div>
          <ul className="mt-5 space-y-2.5">
            {(fp?.[m] ?? []).map((f) => (
              <li key={f.category} className="flex items-center justify-between gap-3 text-[14px]">
                <span className="flex items-center gap-2 text-ink/75">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: catColor(f.category) }} />
                  {f.category}
                </span>
                <span className="font-mono font-medium">{pct(f.share)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
