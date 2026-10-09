"use client";

import { useLang } from "@/i18n";
import McpConnect from "./McpConnect";

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/delays/by-mode?mode=subway",
    desc: "One mode: yearly delay-minute trend, failure fingerprint, category totals",
    response: `{
  "mode": "subway",
  "trend": [
    { "year": 2014, "delay_minutes": 39625.0,
      "incidents": 17821 }, … ],
  "fingerprints": [
    { "category": "Security", "share": 25.1 }, … ]
}`,
  },
  {
    method: "GET",
    path: "/api/v1/delays/crosswalk?q=SUDP&mode=subway",
    desc: "Search the 539-row editorial crosswalk by code, description, or category",
    response: `{
  "total": 1,
  "rows": [
    { "mode": "subway", "cause_code": "SUDP",
      "official_description": "Disorderly Patron",
      "category": "Security", "method": "official",
      "confidence": "high", "incidents": 22482, … }
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/v1/delays/by-line",
    desc: "Subway line shares of delay-minutes over the full series",
    response: `{
  "lines": [
    { "line": "Line 1 (Yonge-University)",
      "delay_minutes": 333979.0,
      "incidents": 134725, "share": 50.5 }, … ]
}`,
  },
];

export default function Developers() {
  const { t } = useLang();
  return (
    <section id="developers" className="bg-ink text-white">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.developers.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.developers.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-white/70">{t.developers.body}</p>

        <h3 className="mt-14 text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.developers.endpoints}</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {endpoints.map((e) => (
            <article key={e.path} className="overflow-hidden rounded-[24px] bg-white/[0.06]">
              <div className="border-b border-white/10 px-6 py-4">
                <span className="mr-3 rounded-full bg-canada px-2.5 py-1 font-mono text-[12px] font-semibold">{e.method}</span>
                <code className="font-mono text-[13px] text-white/85 break-all">{e.path}</code>
                <p className="mt-2 text-[14px] text-white/60">{e.desc}</p>
                <a
                  href={e.path}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block rounded-full border border-white/25 px-4 py-1.5 text-[13px] font-semibold text-white/85 hover:border-white/60"
                >
                  {t.developers.tryIt} →
                </a>
              </div>
              <pre className="overflow-x-auto px-6 py-4 font-mono text-[12.5px] leading-relaxed text-white/75">{e.response}</pre>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <a href="/api/openapi.json" className="block rounded-[24px] bg-white/[0.06] p-6 hover:bg-white/[0.09]">
            <h4 className="text-[19px] font-semibold">{t.developers.openapi}</h4>
            <code className="mt-2 block font-mono text-[13px] text-white/60">GET /api/openapi.json</code>
          </a>
        </div>

        <McpConnect
          config={{
            slug: "toronto-ttc-delays",
            displayName: "TTC Delays, One Taxonomy",
            exampleEn: "Look up crosswalk code SUDP and tell me its category and incident count",
            exampleFr: "Cherche le code de correspondance SUDP et donne-moi sa catégorie et son nombre d'incidents",
          }}
        />
      </div>
    </section>
  );
}
