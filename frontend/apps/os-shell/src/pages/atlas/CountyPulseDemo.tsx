/**
 * CountyPulseDemo.tsx — Atlas County Pulse (conference demo)
 *
 * Route: /atlas/county-pulse/demo
 *
 * PURPOSE: The county-scale companion to the Property Dossier for the
 * "understand a property → understand the county" story. Self-contained and
 * offline-safe: all data hardcoded, no network, no hooks, no fake real-time
 * simulation. It can never render empty or drift on stage.
 *
 * NOTE: An older `CountyPulse.tsx` exists under os-platform tools, but it was
 * deliberately NOT lifted — it uses a particle-canvas "flashy startup" aesthetic,
 * randomized fake real-time data, hyperbolic claims, raw white/slate/purple
 * Tailwind, and @mui icons. None of that fits this assessor audience, the UI
 * token contract, or the honesty bar. This is a fresh build in the os-shell idiom,
 * mirroring the Property Dossier's validated layout.
 *
 * DATA POSTURE: realistic but FABRICATED Benton County figures, illustrative only.
 *
 * LAYOUT DOCTRINE (Memory Report): lead with what people remember and act on —
 * Top 5 to Watch (signals) -> Interpretation -> Now What. County totals
 * (growth/permits/development) are demoted to a compact supporting strip.
 *
 * tf-* design tokens only (no raw gray/white), per the UI token contract.
 */

import React from 'react';

const COUNTY = {
  name: 'Benton County, WA',
  cycle: '2026 assessment cycle',
  parcels: 89247,
  population: 206000,
  medianResValueYoY: 9.3, // %
  permitsYtd: 1840,
  permitsYoY: 23, // %
  unrolledNewHomes: 312,
  overallRatio: 0.94,
};

type Tone = 'good' | 'watch' | 'flag';

// Top 5 to Watch — the county-scale signals. This is the hero.
const WATCH: { headline: string; detail: string; tone: Tone }[] = [
  {
    headline: '312 permitted new homes are not yet on the roll',
    detail: 'Mostly Southridge (Kennewick) and Badger Mountain South (Richland). Roll closes soon — this is uncaptured value.',
    tone: 'flag',
  },
  {
    headline: 'Overall sale ratio has drifted to 0.94',
    detail: 'County-wide it is still inside the IAAO band, but the fast-growth neighborhoods are pulling it toward the 0.90 floor.',
    tone: 'watch',
  },
  {
    headline: 'Residential values up +9.3% year over year',
    detail: 'Kennewick Southridge is leading. Expect elevated appeal volume after notices go out.',
    tone: 'watch',
  },
  {
    headline: 'Commercial vacancy rising on the Clearwater corridor',
    detail: 'Income-approach assumptions for that corridor likely need a second look before certification.',
    tone: 'watch',
  },
  {
    headline: 'County uniformity (COD) is within standard',
    detail: 'Dispersion is inside the IAAO uniformity threshold — no broad reassessment trigger this cycle.',
    tone: 'good',
  },
];

const toneVar: Record<Tone, string> = {
  good: '--tf-success',
  watch: '--tf-warning',
  flag: '--tf-danger',
};
const toneLabel: Record<Tone, string> = { good: 'Clear', watch: 'Watch', flag: 'Flag' };

// Supporting county totals (demoted "on the record" strip)
const TOTALS: { label: string; value: string; sub: string }[] = [
  { label: 'Parcels', value: COUNTY.parcels.toLocaleString(), sub: `${COUNTY.population.toLocaleString()} residents` },
  { label: 'Median residential value', value: `+${COUNTY.medianResValueYoY}%`, sub: 'year over year' },
  { label: 'Building permits (YTD)', value: COUNTY.permitsYtd.toLocaleString(), sub: `+${COUNTY.permitsYoY}% vs last year` },
  { label: 'New homes awaiting roll', value: COUNTY.unrolledNewHomes.toLocaleString(), sub: 'Southridge · Badger Mtn South' },
  { label: 'Overall sale ratio', value: COUNTY.overallRatio.toFixed(2), sub: 'IAAO band 0.90–1.10' },
  { label: 'Active growth corridors', value: '3', sub: 'Southridge · Badger Mtn S · Queensgate' },
];

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

export const CountyPulseDemo: React.FC = () => {
  const counts = WATCH.reduce(
    (acc, s) => ({ ...acc, [s.tone]: acc[s.tone] + 1 }),
    { good: 0, watch: 0, flag: 0 } as Record<Tone, number>,
  );

  return (
    <div
      className='min-h-screen px-6 py-8'
      style={{ background: 'hsl(var(--tf-bg))' }}
      data-testid='atlas-county-pulse-demo'
    >
      <div className='max-w-4xl mx-auto space-y-5'>
        {/* Header */}
        <header className='space-y-2'>
          <div className='flex items-center gap-3 flex-wrap'>
            <h1 className='tf-text text-2xl font-bold'>County Pulse</h1>
            <span
              className='text-xs font-semibold rounded px-2 py-0.5'
              style={{ background: 'hsl(var(--tf-warning) / 0.18)', color: 'hsl(var(--tf-warning))' }}
            >
              DEMO · illustrative data, not a real record
            </span>
          </div>
          <p className='tf-text-secondary'>{COUNTY.name}</p>
          <p className='tf-text-dim text-sm'>
            {COUNTY.cycle} · {COUNTY.parcels.toLocaleString()} parcels
          </p>
        </header>

        {/* ───────── HERO 1 — TOP 5 TO WATCH (signals) ───────── */}
        <HeroSection kicker='Start here' title='Top 5 to watch'>
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
            {WATCH.map((s) => (
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

        {/* ───────── HERO 2 — INTERPRETATION ───────── */}
        <HeroSection kicker='What it means' title='Interpretation'>
          <p className='tf-text-secondary text-base leading-relaxed'>
            <span className='tf-text font-semibold'>The county is healthy but running hot in two corridors.</span>{' '}
            Uniformity holds, so there is no case for a broad reassessment. The real work is concentrated: a{' '}
            <span className='tf-text font-medium'>{COUNTY.unrolledNewHomes} new homes</span> are built but not yet on the
            roll, and the same fast-growth neighborhoods driving the +{COUNTY.medianResValueYoY}% lift are pulling the
            overall ratio toward the {COUNTY.overallRatio.toFixed(2)} floor. Capture the new construction and the ratio
            recovers on its own — miss it and you both under-collect and widen inequity. Commercial on the Clearwater
            corridor is the one area where the income approach, not the market, needs a second look.
          </p>
        </HeroSection>

        {/* ───────── HERO 3 — NOW WHAT ───────── */}
        <HeroSection kicker='Do this next' title='Now What?'>
          <ol className='space-y-2.5'>
            {[
              `Reconcile the ${COUNTY.unrolledNewHomes} permitted-but-unrolled homes before the roll closes — this is the highest-value action this cycle.`,
              'Pre-stage appeal defense packets for the fastest-rising neighborhoods (Southridge first) ahead of notices.',
              'Re-examine commercial income assumptions on the Clearwater corridor before certification.',
              'Hold the cycle plan — county uniformity is within standard; no broad reassessment is warranted.',
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

        {/* ───────── SUPPORTING — On the record (county totals, demoted) ───────── */}
        <div className='pt-2'>
          <div className='tf-text-dim text-xs font-semibold tracking-widest uppercase mb-2'>
            On the record — county totals
          </div>
          <div className='grid gap-3 sm:grid-cols-2 md:grid-cols-3'>
            {TOTALS.map((t) => (
              <div key={t.label} className='tf-overlay rounded-lg p-4'>
                <div className='tf-text-dim text-xs uppercase tracking-wide'>{t.label}</div>
                <div className='tf-text text-xl font-semibold mt-1'>{t.value}</div>
                <div className='tf-text-dim text-xs mt-0.5'>{t.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <footer className='tf-text-dim text-xs pt-2'>
          Atlas · County Pulse demo. All figures illustrative. Built for the TerraFusion Intelligence Preview.
        </footer>
      </div>
    </div>
  );
};

export default CountyPulseDemo;
