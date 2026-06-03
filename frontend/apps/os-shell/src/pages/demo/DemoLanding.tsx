/**
 * DemoLanding.tsx — TerraFusion Intelligence Preview front door (conference demo)
 *
 * Routes: /demo and /preview
 *
 * One entry point that frames the locked conference story and routes to the three
 * built experiences. This is the "demo navigation" + the TerraFusion OS handoff:
 * Atlas (understand a property) → Academy (understand a problem) → OS (act).
 *
 * The story is fixed (Demo Story Lock). Offline-safe; tf-* tokens only.
 */

import React from 'react';
import { Link } from 'react-router-dom';

interface Leg {
  rank: number;
  product: string;
  question: string;
  blurb: string;
  cta: { to: string; label: string };
  secondary?: { to: string; label: string };
}

const LEGS: Leg[] = [
  {
    rank: 1,
    product: 'Atlas',
    question: 'What should I know about this property?',
    blurb:
      'A property dossier that leads with the signals that decide the parcel, says what they mean in plain language, and ends with the next action.',
    cta: { to: '/atlas/dossier/demo', label: 'Open a property dossier' },
    secondary: { to: '/atlas/county-pulse/demo', label: 'See it at county scale →' },
  },
  {
    rank: 2,
    product: 'Academy',
    question: 'How would an experienced professional approach this?',
    blurb:
      'A Codex of real assessment problems — each teaching how an expert thinks, not just definitions — plus an Ask that answers without guessing.',
    cta: { to: '/academy', label: 'Browse the Codex' },
    secondary: { to: '/academy/ask', label: 'Ask Academy →' },
  },
  {
    rank: 3,
    product: 'TerraFusion OS',
    question: 'What should my office do next?',
    blurb:
      'Every property read and every method ends in a clear "Now What." County Pulse shows those next moves at county scale — what to watch, and where to focus.',
    cta: { to: '/atlas/county-pulse/demo', label: 'Open the operational briefing' },
  },
];

export const DemoLanding: React.FC = () => (
  <div className='min-h-screen px-6 py-10' style={{ background: 'hsl(var(--tf-bg))' }} data-testid='demo-landing'>
    <div className='max-w-4xl mx-auto space-y-8'>
      {/* Hero */}
      <header className='space-y-3'>
        <div className='flex items-center gap-3 flex-wrap'>
          <h1 className='tf-text text-3xl font-bold'>TerraFusion Intelligence Preview</h1>
          <span
            className='text-xs font-semibold rounded px-2 py-0.5'
            style={{ background: 'hsl(var(--tf-warning) / 0.18)', color: 'hsl(var(--tf-warning))' }}
          >
            PREVIEW · offline-safe
          </span>
        </div>
        <p className='tf-text-secondary text-lg leading-relaxed max-w-2xl'>
          TerraFusion helps people understand <span className='tf-text font-medium'>what matters</span>,{' '}
          <span className='tf-text font-medium'>why it matters</span>, and{' '}
          <span className='tf-text font-medium'>what to do next</span>. Three quick looks: a property, a problem,
          and an action.
        </p>
      </header>

      {/* Three legs */}
      <div className='space-y-4'>
        {LEGS.map((leg) => (
          <section
            key={leg.product}
            className='tf-panel rounded-xl p-6'
            style={{ borderLeft: '3px solid hsl(var(--tf-transcend-cyan-hs) 55%)' }}
            data-testid={`demo-leg-${leg.rank}`}
          >
            <div className='flex items-start gap-4'>
              <span
                className='text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center shrink-0'
                style={{ background: 'hsl(var(--tf-transcend-cyan-hs) 50% / 0.18)', color: 'hsl(var(--tf-transcend-cyan-hs) 70%)' }}
              >
                {leg.rank}
              </span>
              <div className='min-w-0 flex-1'>
                <div className='flex items-baseline gap-2 flex-wrap'>
                  <h2 className='tf-text text-xl font-bold'>{leg.product}</h2>
                  <span className='tf-text-dim text-sm'>— {leg.question}</span>
                </div>
                <p className='tf-text-secondary text-sm mt-1.5 leading-relaxed'>{leg.blurb}</p>
                <div className='flex items-center gap-4 mt-3 flex-wrap'>
                  <Link
                    to={leg.cta.to}
                    className='px-4 py-2 rounded-lg font-semibold text-sm'
                    style={{ background: 'hsl(var(--tf-transcend-cyan-hs) 50% / 0.18)', color: 'hsl(var(--tf-transcend-cyan-hs) 70%)' }}
                  >
                    {leg.cta.label}
                  </Link>
                  {leg.secondary && (
                    <Link to={leg.secondary.to} className='tf-suite-accent-text text-sm'>
                      {leg.secondary.label}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <footer className='tf-text-dim text-xs'>
        TerraFusion Intelligence Preview. Demo data is illustrative; methodology is real. Runs without internet,
        database, or live AI.
      </footer>
    </div>
  </div>
);

export default DemoLanding;
