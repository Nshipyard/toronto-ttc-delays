"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n";
import { catColor, num } from "./viz-shared";

interface Row {
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

const MODES = ["bus", "streetcar", "subway"] as const;

export default function CrosswalkExplorer() {
  const { t, lang } = useLang();
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams({ q, mode, limit: "200" });
    fetch(`/api/v1/delays/crosswalk?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.rows ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => {});
  }, [q, mode]);

  const methodLabel = (m: string) => (t.crosswalk.methodLabels as Record<string, string>)[m] ?? m;
  const modeLabel = (m: string) =>
    lang === "fr" ? ({ bus: "Bus", streetcar: "Tramway", subway: "Métro" } as Record<string, string>)[m] ?? m : m;

  return (
    <div className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
      <div className="mb-6 rounded-[16px] border border-line bg-paper-warm p-5">
        <h3 className="text-[17px] font-semibold">{t.crosswalk.breaksTitle}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{t.crosswalk.breaksBody}</p>
      </div>
      <div className="mb-6 rounded-[16px] border border-canada/30 bg-canada/[0.05] p-5">
        <h3 className="text-[17px] font-semibold text-canada">{t.crosswalk.flagTitle}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{t.crosswalk.flagBody}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.crosswalk.search}
          className="min-w-[240px] flex-1 rounded-full border border-line bg-paper px-5 py-2.5 text-[15px] outline-none placeholder:text-ink/40 focus:border-ink"
        />
        <div className="flex items-center rounded-full border border-line text-[14px] font-medium">
          <button
            onClick={() => setMode("")}
            className={`rounded-full px-4 py-2 ${mode === "" ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
          >
            {t.crosswalk.allModes}
          </button>
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-2 capitalize ${mode === m ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
            >
              {modeLabel(m)}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-4 text-[13px] text-ink/55">
        {num(total)} {t.crosswalk.results} · {t.crosswalk.vintage}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="py-2.5 pr-3 font-semibold text-ink/60">{t.crosswalk.headers.code}</th>
              <th className="py-2.5 pr-3 font-semibold text-ink/60">{t.crosswalk.headers.description}</th>
              <th className="py-2.5 pr-3 font-semibold text-ink/60">{t.crosswalk.headers.category}</th>
              <th className="py-2.5 pr-3 font-semibold text-ink/60">{t.crosswalk.mode}</th>
              <th className="py-2.5 pr-3 font-semibold text-ink/60">{t.crosswalk.headers.method}</th>
              <th className="py-2.5 pr-3 font-semibold text-ink/60">{t.crosswalk.headers.confidence}</th>
              <th className="py-2.5 pr-3 text-right font-semibold text-ink/60">{t.crosswalk.headers.incidents}</th>
              <th className="py-2.5 text-right font-semibold text-ink/60">{t.crosswalk.headers.minutes}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.mode}-${r.cause_code}-${i}`} className="border-b border-line/60 align-top hover:bg-paper-warm">
                <td className="py-2.5 pr-3 font-mono font-semibold">{r.cause_code || "-"}</td>
                <td className="py-2.5 pr-3 text-ink/75">{r.official_description || "-"}</td>
                <td className="py-2.5 pr-3">
                  <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: catColor(r.category) }} />
                  {r.category}
                </td>
                <td className="py-2.5 pr-3 capitalize text-ink/75">{modeLabel(r.mode)}</td>
                <td className="py-2.5 pr-3 text-ink/75">
                  {methodLabel(r.method)}
                  {r.method === "pattern" && (
                    <span className="ml-2 rounded-full bg-canada/10 px-2 py-0.5 text-[11px] font-semibold text-canada">
                      {t.crosswalk.patternFlag}
                    </span>
                  )}
                  {r.note ? <span className="mt-1 block text-[12px] text-ink/50">{r.note}</span> : null}
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      r.confidence === "high"
                        ? "bg-green-100 text-green-800"
                        : r.confidence === "medium"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {r.confidence}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-right font-mono">{num(r.incidents)}</td>
                <td className="py-2.5 text-right font-mono">{num(Math.round(r.delay_minutes))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
