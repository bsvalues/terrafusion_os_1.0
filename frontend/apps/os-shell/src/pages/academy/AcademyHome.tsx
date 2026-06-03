/**
 * AcademyHome.tsx — Academy shell (conference demo)
 *
 * Routes: /academy and /academy/search
 *
 * The Academy answers: "How would an experienced professional approach this?"
 * Grid of Codex entries + search + an Ask Academy CTA. Offline-safe (pure data).
 * tf-* design tokens only.
 */

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CODEX } from './academyCodex';

const levelTint: Record<string, string> = {
  Foundational: '--tf-success',
  Core: '--tf-transcend-cyan-hs',
  Advanced: '--tf-warning',
};

export const AcademyHome: React.FC = () => {
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return CODEX;
    return CODEX.filter((e) =>
      [e.title, e.category, e.oneLiner, e.level].some((f) => f.toLowerCase().includes(term)),
    );
  }, [q]);

  return (
    <div className='min-h-screen px-6 py-8' style={{ background: 'hsl(var(--tf-bg))' }} data-testid='academy-home'>
      <div className='max-w-5xl mx-auto space-y-6'>
        {/* Header */}
        <header className='space-y-2'>
          <div className='flex items-center gap-3 flex-wrap'>
            <h1 className='tf-text text-2xl font-bold'>Academy</h1>
            <span
              className='text-xs font-semibold rounded px-2 py-0.5'
              style={{ background: 'hsl(var(--tf-warning) / 0.18)', color: 'hsl(var(--tf-warning))' }}
            >
              PREVIEW
            </span>
          </div>
          <p className='tf-text-secondary text-base'>How experienced assessment professionals actually think.</p>
        </header>

        {/* Search + Ask CTA */}
        <div className='flex items-center gap-3 flex-wrap'>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search the Codex — e.g. appeal, ratio, exemption, income…'
            className='tf-input flex-1 min-w-[16rem] p-3 rounded-lg'
            data-testid='academy-search'
          />
          <Link
            to='/academy/ask'
            className='px-4 py-3 rounded-lg font-semibold whitespace-nowrap'
            style={{ background: 'hsl(var(--tf-transcend-cyan-hs) 50% / 0.18)', color: 'hsl(var(--tf-transcend-cyan-hs) 70%)' }}
          >
            Ask Academy →
          </Link>
        </div>

        {/* Codex grid */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {results.map((e) => (
            <Link
              key={e.slug}
              to={`/academy/codex/${e.slug}`}
              className='tf-panel rounded-xl p-5 block hover:opacity-90 transition-opacity'
              style={{ borderLeft: `3px solid hsl(var(${levelTint[e.level] ?? '--tf-border'})${e.level === 'Core' ? ' 55%' : ''})` }}
              data-testid={`codex-card-${e.slug}`}
            >
              <div className='flex items-center justify-between gap-2 mb-2'>
                <span className='tf-text-dim text-xs uppercase tracking-wide'>{e.category}</span>
                <span
                  className='text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5'
                  style={{ background: `hsl(var(${levelTint[e.level] ?? '--tf-border'})${e.level === 'Core' ? ' 55%' : ''} / 0.16)`, color: `hsl(var(${levelTint[e.level] ?? '--tf-muted'})${e.level === 'Core' ? ' 70%' : ''})` }}
                >
                  {e.level}
                </span>
              </div>
              <h2 className='tf-text text-lg font-semibold'>{e.title}</h2>
              <p className='tf-text-dim text-sm mt-1'>{e.oneLiner}</p>
            </Link>
          ))}
          {results.length === 0 && (
            <p className='tf-text-dim text-sm italic'>No Codex entries match “{q}”. Try a broader term.</p>
          )}
        </div>

        <footer className='tf-text-dim text-xs pt-2'>
          Academy · {CODEX.length} founding Codex entries. Methodology is real; specific figures are illustrative.
          Built for the TerraFusion Intelligence Preview.
        </footer>
      </div>
    </div>
  );
};

export default AcademyHome;
