"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n";
import { Banner, Nav, Footer } from "@/components/chrome";
import Trend from "@/components/Trend";
import Bubbles from "@/components/Bubbles";
import Fingerprints from "@/components/Fingerprints";
import Lines from "@/components/Lines";
import Heatmaps from "@/components/Heatmaps";
import CrosswalkExplorer from "@/components/CrosswalkExplorer";
import Developers from "@/components/Developers";
import { num } from "@/components/viz-shared";

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{kicker}</p>
      <h2 className="display mt-4 max-w-[760px] text-[40px] md:text-[52px]">{title}</h2>
    </div>
  );
}

function Hero() {
  const { t } = useLang();
  const [stats, setStats] = useState<[string, string, string, string] | null>(null);
  useEffect(() => {
    fetch("/api/v1/delays/metadata")
      .then((r) => r.json())
      .then((d) => {
        setStats([
          num(d.total_incidents),
          num(Math.round(d.total_delay_minutes)),
          num(d.crosswalk_rows),
          "99.3%",
        ]);
      })
      .catch(() => {});
  }, []);
  const values = stats ?? ["…", "…", "…", "…"];
  return (
    <section id="top" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 pb-16 pt-16 md:pb-20 md:pt-24">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.hero.kicker}</p>
        <h1 className="display mt-5 max-w-[880px] text-[52px] md:text-[84px]">{t.hero.title}</h1>
        <p className="display mt-8 max-w-[860px] border-l-4 border-canada pl-6 text-[24px] leading-snug text-ink md:text-[30px]">
          {t.hero.answer}
        </p>
        <p className="mt-6 max-w-[680px] text-[19px] leading-relaxed text-ink/70 md:text-[21px]">{t.hero.sub}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a href="#crosswalk" className="rounded-full bg-canada px-7 py-3.5 text-[16px] font-semibold text-white hover:bg-canada-dark">
            {t.hero.cta1}
          </a>
          <a href="#methodology" className="rounded-full border border-line px-7 py-3.5 text-[16px] font-semibold hover:border-ink">
            {t.hero.cta2}
          </a>
        </div>
        <div className="mt-16 grid gap-px overflow-hidden rounded-[24px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {t.hero.statsLabels.map((label, i) => (
            <div key={label} className="bg-paper p-7">
              <p className="display text-[44px] text-canada">{values[i]}</p>
              <p className="mt-2 text-[15px] leading-snug text-ink/65">{label}</p>
            </div>
          ))}
        </div>
        <div id="trend" className="mt-10 scroll-mt-24">
          <Trend />
        </div>
      </div>
    </section>
  );
}

function TrendSection() {
  const { t } = useLang();
  return (
    <section className="bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <SectionHead kicker={t.trend.kicker} title={t.trend.title} />
        <p className="mt-5 max-w-[760px] text-[18px] leading-relaxed text-ink/70">{t.trend.body}</p>
      </div>
    </section>
  );
}

function BubblesSection() {
  const { t } = useLang();
  return (
    <section id="causes" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <SectionHead kicker={t.bubbles.kicker} title={t.bubbles.title} />
        <p className="mt-5 max-w-[760px] text-[18px] leading-relaxed text-ink/70">{t.bubbles.body}</p>
        <div className="mt-10">
          <Bubbles />
        </div>
      </div>
    </section>
  );
}

function FingerprintsSection() {
  const { t } = useLang();
  return (
    <section id="fingerprints" className="bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <SectionHead kicker={t.fingerprints.kicker} title={t.fingerprints.title} />
        <p className="mt-5 max-w-[760px] text-[18px] leading-relaxed text-ink/70">{t.fingerprints.body}</p>
        <div className="mt-10">
          <Fingerprints />
        </div>
        <p className="mt-6 text-[13px] text-ink/55">{t.fingerprints.vintage}</p>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
            <h3 className="display text-[26px] leading-tight">{t.fingerprints.foulTitle}</h3>
            <p className="mt-4 text-[16px] leading-relaxed text-ink/70">{t.fingerprints.foulBody}</p>
          </article>
          <article className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
            <h3 className="display text-[26px] leading-tight">{t.fingerprints.disorderlyTitle}</h3>
            <p className="mt-4 text-[16px] leading-relaxed text-ink/70">{t.fingerprints.disorderlyBody}</p>
          </article>
        </div>
      </div>
    </section>
  );
}

function LinesSection() {
  const { t } = useLang();
  return (
    <section id="lines" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <SectionHead kicker={t.lines.kicker} title={t.lines.title} />
        <p className="mt-5 max-w-[760px] text-[18px] leading-relaxed text-ink/70">{t.lines.body}</p>
        <div className="mt-10">
          <Lines />
        </div>
        <div className="mt-8 rounded-[24px] border border-canada/30 bg-canada/[0.05] p-6 md:p-8">
          <h3 className="text-[19px] font-semibold text-canada">{t.lines.caveatTitle}</h3>
          <p className="mt-2 max-w-[760px] text-[15px] leading-relaxed text-ink/70">{t.lines.caveatBody}</p>
        </div>
        <p className="mt-6 text-[13px] text-ink/55">{t.lines.vintage}</p>
      </div>
    </section>
  );
}

function TimingSection() {
  const { t } = useLang();
  return (
    <section id="timing" className="bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <SectionHead kicker={t.timing.kicker} title={t.timing.title} />
        <div className="mt-10">
          <Heatmaps />
        </div>
      </div>
    </section>
  );
}

function CrosswalkSection() {
  const { t } = useLang();
  return (
    <section id="crosswalk" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <SectionHead kicker={t.crosswalk.kicker} title={t.crosswalk.title} />
        <p className="mt-5 max-w-[760px] text-[18px] leading-relaxed text-ink/70">{t.crosswalk.body}</p>
        <div className="mt-10">
          <CrosswalkExplorer />
        </div>
      </div>
    </section>
  );
}

function Caveats() {
  const { t } = useLang();
  return (
    <section id="caveats" className="bg-ink text-white">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-24">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.caveats.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.caveats.title}</h2>
        <ul className="mt-10 grid gap-5 lg:grid-cols-2">
          {t.caveats.items.map((item, i) => (
            <li key={i} className="flex gap-4 rounded-[20px] bg-white/[0.06] p-6">
              <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canada text-[14px] font-bold text-white">
                {i + 1}
              </span>
              <p className="text-[15px] leading-relaxed text-white/80">{item}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Methodology() {
  const { t } = useLang();
  const cards = [
    { title: t.methodology.sourcesTitle, body: t.methodology.sourcesBody },
    { title: t.methodology.joinedTitle, body: t.methodology.joinedBody },
    { title: t.methodology.normalizedTitle, body: t.methodology.normalizedBody },
    { title: t.methodology.leftoutTitle, body: t.methodology.leftoutBody },
    { title: t.methodology.computationTitle, body: t.methodology.computationBody },
    { title: t.methodology.crosswalkTitle, body: t.methodology.crosswalkBody },
  ];
  return (
    <section id="methodology" className="bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <SectionHead kicker={t.methodology.kicker} title={t.methodology.title} />
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {cards.map((c) => (
            <article key={c.title} className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
              <h3 className="display text-[26px] leading-tight">{c.title}</h3>
              <p className="mt-4 text-[16px] leading-relaxed text-ink/70">{c.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-[14px] text-ink/55">{t.methodology.builtLine}</p>
      </div>
    </section>
  );
}

function Downloads() {
  const { t } = useLang();
  return (
    <section id="data" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <SectionHead kicker={t.downloads.kicker} title={t.downloads.title} />
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-ink/70">{t.downloads.body}</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.downloads.files.map((f) => (
            <div key={f.name} className="flex items-center justify-between gap-4 rounded-[24px] border border-line bg-paper-warm p-6">
              <div>
                <code className="font-mono text-[15px] font-medium">{f.name}</code>
                <p className="mt-1 text-[14px] text-ink/60">{f.desc}</p>
              </div>
              <a href={`/data/${f.name}`} download className="shrink-0 rounded-full border border-line px-5 py-2.5 text-[15px] font-semibold hover:border-ink">
                {t.downloads.download}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Banner />
      <Nav />
      <main className="flex-1">
        <Hero />
        <TrendSection />
        <BubblesSection />
        <FingerprintsSection />
        <LinesSection />
        <TimingSection />
        <CrosswalkSection />
        <Caveats />
        <Methodology />
        <Developers />
        <Downloads />
      </main>
      <Footer />
    </>
  );
}
