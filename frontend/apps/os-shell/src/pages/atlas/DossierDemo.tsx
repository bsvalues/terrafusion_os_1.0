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
 * STRUCTURE follows the dossier doctrine — five reads, ending in an action:
 *   Facts → Context → Signals → Interpretation → Now What?
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

// Signals — the things that actually matter on this parcel
const SIGNALS: { label: string; value: string; tone: 'good' | 'watch' | 'flag' }[] = [
  { label: 'Assessment-to-sale ratio (nbhd median)', value: '0.97 — within IAAO 0.90–1.10 band', tone: 'good' },
  { label: 'Year-over-year value change', value: '+8.9% ($471K → $513K)', tone: 'watch' },
  { label: '2024 building permit', value: 'BP-2024-1187: detached shop, 960 sf — not yet on the improvement record', tone: 'flag' },
  { label: 'Covered patio (480 sf)', value: 'Present on sketch; contributes ~3% of building value (Benton Method)', tone: 'watch' },
  { label: 'Appeal history', value: 'No appeals on file (last 6 years)', tone: 'good' },
];

const toneVar: Record<'good' | 'watch' | 'flag', string> = {
  good: '--tf-success',
  watch: '--tf-warning',
  flag: '--tf-danger',
};

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const Section: React.FC<{ n: number; title: string; hint: string; children: React.ReactNode }> = ({
  n,
  title,
  hint,
  children,
}) => (
  <section className='tf-panel p-5 rounded-xl space-y-3'>
    <div className='flex items-baseline gap-3'>
      <span
        className='text-xs font-bold rounded-full px-2 py-0.5'
        style={{ background: 'hsl(var(--tf-transcend-cyan-hs) 50% / 0.18)', color: 'hsl(var(--tf-transcend-cyan-hs) 70%)' }}
      >
        {n}
      </span>
      <h2 className='tf-text text-lg font-semibold'>{title}</h2>
    </div>
    <p className='tf-text-dim text-xs'>{hint}</p>
    <div>{children}</div>
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

        {/* 1 — Facts */}
        <Section n={1} title='Facts' hint='What this property is, on the record.'>
          <div className='grid gap-x-8 gap-y-0 sm:grid-cols-2'>
            <Row label='Use' value={PARCEL.useCode} />
            <Row label='Year built' value={String(PARCEL.yearBuilt)} />
            <Row label='Living area' value={`${PARCEL.livingSqFt.toLocaleString()} sf`} />
            <Row label='Lot size' value={`${PARCEL.lotAcres} ac`} />
            <Row label='Land value' value={usd(PARCEL.assessed.land)} />
            <Row label='Improvement value' value={usd(PARCEL.assessed.improvement)} />
            <Row label='Total assessed' value={usd(PARCEL.assessed.total)} strong />
            <Row label='Assessed $/sf' value={`$${pricePerSqFt}/sf`} />
          </div>
        </Section>

        {/* 2 — Context */}
        <Section n={2} title='Context' hint='How it sits against the neighborhood — recent qualified sales.'>
          <div className='space-y-2'>
            {COMPS.map((c) => (
              <div key={c.addr} className='tf-overlay rounded-lg px-3 py-2 flex justify-between items-center gap-4'>
                <div>
                  <div className='tf-text text-sm font-medium'>{c.addr}</div>
                  <div className='tf-text-dim text-xs'>
                    {c.date} · {c.sqft.toLocaleString()} sf
                  </div>
                </div>
                <div className='text-right'>
                  <div className='tf-text text-sm'>{usd(c.soldFor)}</div>
                  <div className='tf-text-dim text-xs'>A/S {c.ratio.toFixed(2)}</div>
                </div>
              </div>
            ))}
            <p className='tf-text-dim text-xs pt-1'>
              Subject total {usd(PARCEL.assessed.total)} sits just below the comp range — consistent with an
              assessment-to-sale ratio near 0.97.
            </p>
          </div>
        </Section>

        {/* 3 — Signals */}
        <Section n={3} title='Signals' hint='The few things on this parcel that deserve attention.'>
          <div className='space-y-2'>
            {SIGNALS.map((s) => (
              <div key={s.label} className='flex items-start gap-3 py-1'>
                <span
                  className='mt-1.5 h-2 w-2 rounded-full shrink-0'
                  style={{ background: `hsl(var(${toneVar[s.tone]}))` }}
                  aria-hidden
                />
                <div>
                  <div className='tf-text text-sm font-medium'>{s.label}</div>
                  <div className='tf-text-dim text-sm'>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 4 — Interpretation */}
        <Section n={4} title='Interpretation' hint='What an experienced appraiser reads from the above.'>
          <p className='tf-text-secondary text-sm leading-relaxed'>
            The valuation is defensible: the +{yoyPct}% lift tracks a genuinely rising Southridge market, and the
            0.97 neighborhood ratio keeps the parcel inside the IAAO equity band. The one real exposure is the{' '}
            <span className='tf-text font-medium'>2024 detached shop (BP-2024-1187)</span> — a 960 sf structure that
            has not yet landed on the improvement record. Under the Benton Method a shop of this class typically
            contributes on the order of <span className='tf-text font-medium'>15–18% of building value</span>, so the
            current total likely <span className='tf-text font-medium'>understates</span> true value rather than over-assessing it.
            That makes the parcel low-risk on appeal but a candidate for a field-check before next roll.
          </p>
        </Section>

        {/* 5 — Now What? */}
        <Section n={5} title='Now What?' hint='The next concrete actions for the office.'>
          <ol className='space-y-2'>
            {[
              'Queue a field check to confirm the 2024 shop (BP-2024-1187) and add it to the improvement record for the next roll.',
              'Hold the current value for 2026 — it is well-supported by recent sales and sits inside the equity band.',
              'Flag the covered patio for sketch reconciliation so its ~3% contribution is captured consistently.',
              'No appeal action needed; if appealed, the comp set and ratio above are the defense.',
            ].map((step, i) => (
              <li key={i} className='flex gap-3'>
                <span
                  className='text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shrink-0'
                  style={{ background: 'hsl(var(--tf-transcend-cyan-hs) 50% / 0.18)', color: 'hsl(var(--tf-transcend-cyan-hs) 70%)' }}
                >
                  {i + 1}
                </span>
                <span className='tf-text-secondary text-sm'>{step}</span>
              </li>
            ))}
          </ol>
        </Section>

        <footer className='tf-text-dim text-xs pt-2'>
          Atlas · Property Dossier demo. All figures illustrative. Built for the TerraFusion Intelligence Preview.
        </footer>
      </div>
    </div>
  );
};

export default DossierDemo;
