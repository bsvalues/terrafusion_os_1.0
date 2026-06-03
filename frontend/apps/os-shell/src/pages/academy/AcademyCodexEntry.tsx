/**
 * AcademyCodexEntry.tsx — a single Codex entry (conference demo)
 *
 * Route: /academy/codex/:slug
 *
 * Renders one entry from academyCodex. Layout weights the remembered/teaching
 * parts: leads with Problem → Why It Matters → How Experts Think (the
 * differentiator), then the operational detail (Workflow / Tools / Common
 * Mistakes), and ends on Now What. Offline-safe; tf-* tokens only.
 */

import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CODEX_BY_SLUG } from './academyCodex';

const HeroSection: React.FC<{ kicker: string; title: string; children: React.ReactNode }> = ({
  kicker,
  title,
  children,
}) => (
  <section
    className='tf-panel rounded-xl p-6 space-y-3'
    style={{ borderLeft: '3px solid hsl(var(--tf-transcend-cyan-hs) 55%)' }}
  >
    <div>
      <div
        className='text-xs font-semibold tracking-widest uppercase'
        style={{ color: 'hsl(var(--tf-transcend-cyan-hs) 70%)' }}
      >
        {kicker}
      </div>
      <h2 className='tf-text text-xl font-bold mt-0.5'>{title}</h2>
    </div>
    {children}
  </section>
);

const ListCard: React.FC<{ title: string; items: string[]; numbered?: boolean; flag?: boolean }> = ({
  title,
  items,
  numbered,
  flag,
}) => (
  <div className='tf-overlay rounded-lg p-4'>
    <div className='tf-text-secondary text-sm font-medium mb-2'>{title}</div>
    <ol className='space-y-1.5'>
      {items.map((it, i) => (
        <li key={i} className='flex gap-2.5'>
          {numbered ? (
            <span className='tf-text-dim text-xs font-semibold pt-0.5 w-4 shrink-0'>{i + 1}.</span>
          ) : (
            <span
              className='mt-1.5 h-1.5 w-1.5 rounded-full shrink-0'
              style={{ background: flag ? 'hsl(var(--tf-danger))' : 'hsl(var(--tf-muted))' }}
              aria-hidden
            />
          )}
          <span className='tf-text-secondary text-sm'>{it}</span>
        </li>
      ))}
    </ol>
  </div>
);

export const AcademyCodexEntry: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const entry = slug ? CODEX_BY_SLUG[slug] : undefined;

  if (!entry) {
    return (
      <div className='min-h-screen px-6 py-8' style={{ background: 'hsl(var(--tf-bg))' }} data-testid='codex-not-found'>
        <div className='max-w-3xl mx-auto space-y-4'>
          <h1 className='tf-text text-xl font-bold'>Codex entry not found</h1>
          <p className='tf-text-dim text-sm'>No entry matches “{slug}”.</p>
          <Link to='/academy' className='tf-suite-accent-text text-sm'>← Back to Academy</Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen px-6 py-8' style={{ background: 'hsl(var(--tf-bg))' }} data-testid='codex-entry'>
      <div className='max-w-3xl mx-auto space-y-5'>
        {/* Header */}
        <header className='space-y-2'>
          <Link to='/academy' className='tf-text-dim text-xs hover:opacity-80'>← Academy</Link>
          <div className='flex items-center gap-3 flex-wrap'>
            <h1 className='tf-text text-2xl font-bold'>{entry.title}</h1>
            <span className='tf-text-dim text-xs uppercase tracking-wide'>{entry.category}</span>
            <span
              className='text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5'
              style={{ background: 'hsl(var(--tf-transcend-cyan-hs) 55% / 0.16)', color: 'hsl(var(--tf-transcend-cyan-hs) 70%)' }}
            >
              {entry.level}
            </span>
          </div>
          <p className='tf-text-secondary'>{entry.oneLiner}</p>
        </header>

        {/* The problem */}
        <HeroSection kicker='The problem' title='What you’re facing'>
          <p className='tf-text-secondary text-base leading-relaxed'>{entry.problem}</p>
        </HeroSection>

        {/* Why it matters */}
        <HeroSection kicker='Why it matters' title='What’s at stake'>
          <p className='tf-text-secondary text-base leading-relaxed'>{entry.whyItMatters}</p>
        </HeroSection>

        {/* How experts think — the differentiator */}
        <HeroSection kicker='The mental model' title='How experts think'>
          <p className='tf-text text-base leading-relaxed'>{entry.howExpertsThink}</p>
        </HeroSection>

        {/* Operational detail (supporting) */}
        <div className='grid gap-4 md:grid-cols-2'>
          <ListCard title='Workflow' items={entry.workflow} numbered />
          <ListCard title='Common mistakes' items={entry.commonMistakes} flag />
        </div>

        {/* Tools (chips) */}
        <div className='tf-overlay rounded-lg p-4'>
          <div className='tf-text-secondary text-sm font-medium mb-2'>Tools</div>
          <div className='flex flex-wrap gap-2'>
            {entry.tools.map((t) => (
              <span
                key={t}
                className='text-xs rounded-full px-3 py-1'
                style={{ background: 'hsl(var(--tf-overlay))', color: 'hsl(var(--tf-text) / 0.8)' }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Now what — the action */}
        <HeroSection kicker='Do this next' title='Now What?'>
          <ol className='space-y-2.5'>
            {entry.nowWhat.map((step, i) => (
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

        {entry.furtherReading && entry.furtherReading.length > 0 && (
          <p className='tf-text-dim text-xs'>
            Further reading: {entry.furtherReading.join(' · ')}
          </p>
        )}
      </div>
    </div>
  );
};

export default AcademyCodexEntry;
