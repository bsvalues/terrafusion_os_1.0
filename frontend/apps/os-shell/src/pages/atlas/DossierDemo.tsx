/**
 * DossierDemo.tsx — Atlas Property Dossier (conference demo)
 *
 * Route: /atlas/dossier/demo
 *
 * PURPOSE: The conference centerpiece for the "understand a property" story.
 * Unlike the live PropertyDossier tab (which fetches from /api/dossier/* and
 * renders empty without a backend + parcelId), this page is FULLY SELF-CONTAINED:
 * all data is hardcoded, illustrative, and offline-safe so the demo can never
 * render empty on stage. No network, no hooks, no backend dependency.
 *
 * DATA POSTURE: Every value below is a realistic but FABRICATED demo parcel for
 * Benton County, WA. It is illustrative only and is NOT a real assessment record.
 * The page states this plainly to the viewer.
 *
 * LAYOUT DOCTRINE (validated by the Memory Report): people remember and act on
 * Signals -> Interpretation -> Now What. Those three LEAD and dominate the page.
 * Facts and Context are demoted to a compact supporting "On the record" block at
 * the bottom — present for credibility, not competing for attention.
 *
 * Styling uses TerraFusion design tokens (tf-* classes / --tf-* vars) only —
 * no raw gray/white Tailwind, per the UI token contract.
 */

import React from 'react';

// ── Demo parcel (fabricated, illustrative — NOT a real record) ───────────────
const PARCEL = {
  parcelNumber: '1-1885-200-0009-000',
  address: '4412 W Clearwater Ave, Kennewick, WA 99336',
  neighborhood: 'Kennewick — Southridge (NBHD 4120)',
  useCode: 'R — Single-Family Residential',
  yearBuilt: 2004,
  livingSqFt: 2380,
  lotAcres: 0.27,
  taxYear: 2026,
  assessed: { land: 92000, improvement: 421000, total: 513000 },
  priorTotal: 471000, // 2025 certified
};

// Recent qualified sales in the same neighborhood (fabricated, illustrative)
const COMPS = [
  { addr: '4380 W Clearwater Ave', soldFor: 529000, date: 'Aug 2025', sqft: 2410, ratio: 0.97 },
  { addr: '512 S Olympia St', soldFor: 498000, date: 'Jun 2025', sqft: 2240, ratio: 1.03 },
  { addr: '4455 W 4th Pl', soldFor: 541000, date: 'Apr 2025', sqft: 2520, ratio: 0.95 },
];

type Tone = 'good' | 'watch' | 'flag';

// Signals — the few things on this parcel that decide it. This is the hero.
const SIGNALS: { headline: string; detail: string; tone: Tone }[] = [
  {
    headline: 'A 2024 shop (960 sf) is missing from the record',
    detail: 'Permit BP-2024-1187 closed; the structure was never added. Likely under-assessed, not over.',
    tone: 'flag',
  },
  {
    headline: 'Value jumped +8.9% year over year',
    detail: '$471K → $513K. Tracks a genuinely rising Southridge market — but it is the kind of jump owners call about.',
    tone: 'watch',
  },
  {
    headline: 'Covered patio (480 sf) not fully captured',
    detail: 'On the sketch; contributes ~3% of building value under the Benton Method. Reconcile for consistency.',
    tone: 'watch',
  },
  {
    headline: 'Assessment-to-sale ratio sits at 0.97',
    detail: 'Inside the IAAO 0.90–1.10 equity band against three recent neighborhood sales.',
    tone: 'good',
  },
  {
    headline: 'No appeals on file in six years',
    detail: 'Stable history; low contest risk if the value holds.',
    tone: 'good',
  },
];

const toneVar: Record<Tone, string> = {
  good: '--tf-success',
  watch: '--tf-warning',
  flag: '--tf-danger',
};
const toneLabel: Record<Tone, string> = { good: 'Clear', watch: 'Watch', flag: 'Flag' };

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

/** Prominent section used for the remembered trio (Signals / Interpretation / Now What). */
const HeroSection: React.FC<{ kicker: string; title: string; children: React.ReactNode }> = ({
  kicker,
  title,
  children,
}) => (
  <section
    className='tf-panel rounded-xl p-6 space-y-4'
    style={{ borderLeft: '3px solid hsl(var(--tf-transcend-cyan-hs) 55%)' }}
  >
    <div>
      <div
        className='text-xs font-semibold tracking-widest uppercase'
        style={{ color: 'hsl(var(--tf-transcend-cyan-hs) 70%)' }}
      >
        {kicker}
      </div>
      <h2 className='tf-text text-2xl font-bold mt-0.5'>{title}</h2>
    </div>
    {children}
  </section>
);

const Row: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div className='flex justify-between gap-4 py-1'>
    <span className='tf-text-dim text-sm'>{label}</span>
    <span className={`tf-text text-sm ${strong ? 'font-semibold' : ''}`}>{value}</span>
  </div>
);

export const DossierDemo: React.FC = () => {
  const pricePerSqFt = Math.round(PARCEL.assessed.total / PARCEL.livingSqFt);
  const yoyPct = (((PARCEL.assessed.total - PARCEL.priorTotal) / PARCEL.priorTotal) * 100).toFixed(1);

  const counts = SIGNALS.reduce(
    (acc, s) => ({ ...acc, [s.tone]: acc[s.tone] + 1 }),
    { good: 0, watch: 0, flag: 0 } as Record<Tone, number>,
  );

  return (
    <div
      className='min-h-screen px-6 py-8'
      style={{ background: 'hsl(var(--tf-bg))' }}
      data-testid='atlas-dossier-demo'
    >
      <div className='max-w-4xl mx-auto space-y-5'>
        {/* Header */}
        <header className='space-y-2'>
          <div className='flex items-center gap-3 flex-wrap'>
            <h1 className='tf-text text-2xl font-bold'>Property Dossier</h1>
            <span
              className='text-xs font-semibold rounded px-2 py-0.5'
              style={{ background: 'hsl(var(--tf-warning) / 0.18)', color: 'hsl(var(--tf-warning))' }}
            >
              DEMO PARCEL · illustrative data, not a real record
            </span>
          </div>
          <p className='tf-text-secondary'>{PARCEL.address}</p>
          <p className='tf-text-dim text-sm'>
            Parcel {PARCEL.parcelNumber} · {PARCEL.neighborhood} · Tax year {PARCEL.taxYear}
          </p>
        </header>

        {/* ───────── HERO 1 — SIGNALS (what people remember; lead with it) ───────── */}
        <HeroSection kicker='Start here' title='Signals'>
          {/* density summary */}
          <div className='flex items-center gap-2 flex-wrap'>
            {(['flag', 'watch', 'good'] as Tone[]).map((t) =>
              counts[t] ? (
                <span
                  key={t}
                  className='inline-flex items-center gap-2 text-xs font-medium rounded-full px-3 py-1'
                  style={{ background: `hsl(var(${toneVar[t]}) / 0.14)`, color: `hsl(var(${toneVar[t]}))` }}
                >
                  <span
                    className='h-2 w-2 rounded-full'
                    style={{ background: `hsl(var(${toneVar[t]}))`, boxShadow: `0 0 8px hsl(var(${toneVar[t]}) / 0.8)` }}
                  />
                  {counts[t]} {toneLabel[t]}
                </span>
              ) : null,
            )}
          </div>

          <div className='space-y-3'>
            {SIGNALS.map((s) => (
              <div key={s.headline} className='flex items-start gap-4'>
                <span
                  className='mt-1.5 h-3.5 w-3.5 rounded-full shrink-0'
                  style={{ background: `hsl(var(${toneVar[s.tone]}))`, boxShadow: `0 0 10px hsl(var(${toneVar[s.tone]}) / 0.7)` }}
                  aria-hidden
                />
                <div className='min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className='tf-text font-semibold'>{s.headline}</span>
                    <span
                      className='text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5'
                      style={{ background: `hsl(var(${toneVar[s.tone]}) / 0.16)`, color: `hsl(var(${toneVar[s.tone]}))` }}
                    >
                      {toneLabel[s.tone]}
                    </span>
                  </div>
                  <p className='tf-text-dim text-sm mt-0.5'>{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </HeroSection>

        {/* ───────── HERO 2 — INTERPRETATION (human language, not software) ───────── */}
        <HeroSection kicker='What it means' title='Interpretation'>
          <p className='tf-text-secondary text-base leading-relaxed'>
            <span className='tf-text font-semibold'>The valuation is defensible.</span> The +{yoyPct}% lift tracks a
            genuinely rising Southridge market, and the 0.97 neighborhood ratio keeps the parcel inside the equity band.
            The one real exposure is the{' '}
            <span className='tf-text font-medium'>2024 detached shop (BP-2024-1187)</span> — 960 sf that never landed on
            the improvement record. Under the Benton Method a shop of this class typically adds{' '}
            <span className='tf-text font-medium'>15–18% of building value</span>, so the current total most likely{' '}
            <span className='tf-text font-medium'>understates</span> true value rather than over-assessing it. That makes
            this parcel low-risk on appeal but a clear candidate for a field check before the next roll.
          </p>
        </HeroSection>

        {/* ───────── HERO 3 — NOW WHAT (the action) ───────── */}
        <HeroSection kicker='Do this next' title='Now What?'>
          <ol className='space-y-2.5'>
            {[
              'Queue a field check to confirm the 2024 shop (BP-2024-1187) and add it to the improvement record for the next roll.',
              'Hold the current value for 2026 — it is well-supported by recent sales and sits inside the equity band.',
              'Flag the covered patio for sketch reconciliation so its ~3% contribution is captured consistently.',
              'No appeal action needed; if appealed, the comp set and 0.97 ratio are the defense.',
            ].map((step, i) => (
              <li key={i} className='flex gap-3'>
                <span
                  className='text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shrink-0'
                  style={{ background: 'hsl(var(--tf-transcend-cyan-hs) 50% / 0.18)', color: 'hsl(var(--tf-transcend-cyan-hs) 70%)' }}
                >
                  {i + 1}
                </span>
                <span className='tf-text-secondary text-sm leading-relaxed pt-0.5'>{step}</span>
              </li>
            ))}
          </ol>
        </HeroSection>

        {/* ───────── SUPPORTING — On the record (Facts + Context, demoted) ───────── */}
        <div className='pt-2'>
          <div className='tf-text-dim text-xs font-semibold tracking-widest uppercase mb-2'>
            On the record — the underlying data
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            {/* Facts (compact, muted) */}
            <div className='tf-overlay rounded-lg p-4'>
              <div className='tf-text-secondary text-sm font-medium mb-2'>Facts</div>
              <Row label='Use' value={PARCEL.useCode} />
              <Row label='Year built' value={String(PARCEL.yearBuilt)} />
              <Row label='Living area' value={`${PARCEL.livingSqFt.toLocaleString()} sf`} />
              <Row label='Lot size' value={`${PARCEL.lotAcres} ac`} />
              <Row label='Land / Improvement' value={`${usd(PARCEL.assessed.land)} / ${usd(PARCEL.assessed.improvement)}`} />
              <Row label='Total assessed' value={usd(PARCEL.assessed.total)} strong />
              <Row label='Assessed $/sf' value={`$${pricePerSqFt}/sf`} />
            </div>

            {/* Context (compact, muted) */}
            <div className='tf-overlay rounded-lg p-4'>
              <div className='tf-text-secondary text-sm font-medium mb-2'>Context — recent qualified sales</div>
              <div className='space-y-1.5'>
                {COMPS.map((c) => (
                  <div key={c.addr} className='flex justify-between items-center gap-3 text-sm'>
                    <span className='tf-text-dim truncate'>
                      {c.addr} <span className='opacity-60'>· {c.date}</span>
                    </span>
                    <span className='tf-text shrink-0'>
                      {usd(c.soldFor)} <span className='tf-text-dim text-xs'>A/S {c.ratio.toFixed(2)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className='tf-text-dim text-xs pt-2'>
          Atlas · Property Dossier demo. All figures illustrative. Built for the TerraFusion Intelligence Preview.
        </footer>
      </div>
    </div>
  );
};

export default DossierDemo;
