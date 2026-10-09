"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/i18n";
import { catColor, num, num1 } from "./viz-shared";

interface HC { hour: number; mode: string; category: string; incidents: number; delay_minutes: number }
interface WC { weekday: string; mode: string; category: string; incidents: number; delay_minutes: number; avg_minutes: number }

const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CATS = ["Operations/Crew", "Mechanical", "Security", "Emergency/Medical", "Collision", "Cleaning/Sanitation", "Track/Overhead", "Unclassified"];

function cellColor(frac: number) {
  // frac 0..1 → paper to canada red
  const r = Math.round(255 - frac * (255 - 216));
  const g = Math.round(255 - frac * (255 - 6));
  const b = Math.round(255 - frac * (255 - 33));
  return `rgb(${r},${g},${b})`;
}

export default function Heatmaps() {
  const { t, lang } = useLang();
  const [hour, setHour] = useState<HC[]>([]);
  const [week, setWeek] = useState<WC[]>([]);
  const [mode, setMode] = useState("all");

  useEffect(() => {
    fetch("/api/v1/delays/heat")
      .then((r) => r.json())
      .then((d) => {
        setHour(d.hour_heat ?? []);
        setWeek(d.weekday_heat ?? []);
      })
      .catch(() => {});
  }, []);

  const hourGrid = useMemo(() => {
    const pick = (h: number, c: string) =>
      hour.filter((r) => r.hour === h && r.category === c && (mode === "all" || r.mode === mode)).reduce((a, r) => a + r.incidents, 0);
    const vals = CATS.flatMap((c) => Array.from({ length: 24 }, (_, h) => pick(h, c)));
    const max = Math.max(...vals, 1);
    return { pick, max };
  }, [hour, mode]);

  const weekGrid = useMemo(() => {
    const pick = (w: string, c: string) => {
      const rows = week.filter((r) => r.weekday === w && r.category === c && (mode === "all" || r.mode === mode));
      const inc = rows.reduce((a, r) => a + r.incidents, 0);
      const mins = rows.reduce((a, r) => a + r.delay_minutes, 0);
      return inc ? mins / inc : 0;
    };
    const vals = CATS.flatMap((c) => WEEK.map((w) => pick(w, c)));
    const max = Math.max(...vals, 1);
    return { pick, max };
  }, [week, mode]);

  const modeLabel = (m: string) =>
    m === "all" ? (lang === "fr" ? "Tous" : "All") : lang === "fr" ? { streetcar: "Tramway", subway: "Métro", bus: "Bus" }[m] : m;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <label className="text-[14px] font-medium text-ink/60">{lang === "fr" ? "Mode :" : "Mode:"}</label>
        <div className="flex items-center rounded-full border border-line text-[14px] font-medium">
          {["all", "bus", "streetcar", "subway"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-1.5 capitalize ${mode === m ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
            >
              {modeLabel(m)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
        <h3 className="display text-[26px] leading-tight">{t.timing.hourTitle}</h3>
        <p className="mt-3 max-w-[760px] text-[15px] leading-relaxed text-ink/70">{t.timing.hourBody}</p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="p-1 text-left font-medium text-ink/50"></th>
                {Array.from({ length: 24 }, (_, h) => (
                  <th key={h} className="p-1 text-center font-medium text-ink/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATS.map((c) => (
                <tr key={c}>
                  <td className="whitespace-nowrap p-1 pr-3 font-medium text-ink/75">{c}</td>
                  {Array.from({ length: 24 }, (_, h) => {
                    const v = hourGrid.pick(h, c);
                    return (
                      <td key={h} className="p-[2px]" title={`${c}, ${h}:00 - ${num(v)} ${t.timing.hours}`}>
                        <div className="flex h-7 items-center justify-center rounded" style={{ background: cellColor(v / hourGrid.max) }}>
                          {v > hourGrid.max * 0.35 ? <span className="font-mono text-white/95">{num(v)}</span> : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-ink/55">{t.timing.hours} · {t.timing.vintage}</p>
      </div>

      <div className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
        <h3 className="display text-[26px] leading-tight">{t.timing.weekdayTitle}</h3>
        <p className="mt-3 max-w-[760px] text-[15px] leading-relaxed text-ink/70">{t.timing.weekdayBody}</p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="p-1 text-left font-medium text-ink/50"></th>
                {WEEK.map((w) => (
                  <th key={w} className="p-1 text-center font-medium text-ink/50">{w.slice(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATS.map((c) => (
                <tr key={c}>
                  <td className="whitespace-nowrap p-1 pr-3 font-medium text-ink/75">
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-sm" style={{ background: catColor(c) }} />
                    {c}
                  </td>
                  {WEEK.map((w) => {
                    const v = weekGrid.pick(w, c);
                    return (
                      <td key={w} className="p-[2px]" title={`${c}, ${w}: ${num1(v)} ${t.timing.avgMin}`}>
                        <div className="flex h-9 items-center justify-center rounded font-mono" style={{ background: cellColor(v / weekGrid.max) }}>
                          {v > 0 ? num1(v) : ""}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-ink/55">{t.timing.avgMin} · {t.timing.vintage}</p>
      </div>
    </div>
  );
}
