/**
 * SYNC-UX-1B: Universe distribution display.
 *
 * Renders the 7-cell SYNC-DOCTRINE-4 universe taxonomy snapshot
 * captured at commit time. We use a labeled CSS grid (not Recharts)
 * because:
 *   - the cohort is fixed at 7 categorical buckets
 *   - the operator wants exact counts, not visual ratios
 *   - keeps the page bundle thin (no Recharts pull-in for 7 cells)
 *
 * If the backend's universeDistributionJson can't be parsed, the
 * page (caller) renders the unparseable placeholder; this component
 * always receives a parsed snapshot.
 */

import React from 'react';
import { UNIVERSE_KEYS, type UniverseDistribution } from '@/api/syncCommits';

interface Props {
  distribution: UniverseDistribution;
}

export default function UniverseDistributionChart({ distribution }: Props): React.ReactElement {
  const total = UNIVERSE_KEYS.reduce((acc, k) => acc + (distribution[k] ?? 0), 0);

  return (
    <section
      className='tf-panel p-4'
      aria-label='Universe distribution snapshot'
      data-testid='universe-distribution-chart'
    >
      <h3 className='tf-text font-medium mb-3' style={{ fontSize: '0.95rem' }}>
        Universe distribution ({total.toLocaleString()} truth rows at commit time)
      </h3>
      <div
        role='list'
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 8,
        }}
      >
        {UNIVERSE_KEYS.map((key) => {
          const count = distribution[key] ?? 0;
          return (
            <div
              key={key}
              role='listitem'
              data-testid={`universe-cell-${key}`}
              data-universe={key}
              data-count={count}
              className='tf-status-info p-3 rounded'
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                opacity: count > 0 ? 1 : 0.55,
              }}
            >
              <code className='tf-text-secondary' style={{ fontSize: '0.7rem' }}>
                {key}
              </code>
              <span
                className='tf-text font-semibold'
                style={{ fontSize: '1.2rem', fontVariantNumeric: 'tabular-nums' }}
              >
                {count.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
