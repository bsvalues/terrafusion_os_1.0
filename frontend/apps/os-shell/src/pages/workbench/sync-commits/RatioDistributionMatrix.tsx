/**
 * SYNC-UX-1B: Ratio distribution 2x2 matrix.
 *
 * Renders the four cells of the SYNC-DOCTRINE-1 sales-ratio policy
 * crosstab snapshot:
 *
 *                       County qualified    County not-qualified
 *   DOR qualified           DorQ_CountyQ           DorQ_CountyN
 *   DOR not-qualified       DorN_CountyQ           DorN_CountyN
 *
 * The diagonal cells (DorQ_CountyQ, DorN_CountyN) are concordant.
 * The off-diagonal cells expose disagreement between DOR and the
 * county's internal ratio — these are operator-relevant.
 */

import React from 'react';
import type { RatioDistribution } from '@/api/syncCommits';

interface Props {
  distribution: RatioDistribution;
}

interface CellSpec {
  key: keyof RatioDistribution;
  label: string;
  concordant: boolean;
}

const CELLS: CellSpec[][] = [
  [
    { key: 'DorQ_CountyQ', label: 'DOR Q · County Q', concordant: true },
    { key: 'DorQ_CountyN', label: 'DOR Q · County N', concordant: false },
  ],
  [
    { key: 'DorN_CountyQ', label: 'DOR N · County Q', concordant: false },
    { key: 'DorN_CountyN', label: 'DOR N · County N', concordant: true },
  ],
];

export default function RatioDistributionMatrix({ distribution }: Props): React.ReactElement {
  return (
    <section
      className='tf-panel p-4'
      aria-label='Ratio distribution snapshot'
      data-testid='ratio-distribution-matrix'
    >
      <h3 className='tf-text font-medium mb-3' style={{ fontSize: '0.95rem' }}>
        Sales-ratio distribution (DOR × County qualification)
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
        }}
      >
        {CELLS.flat().map((cell) => {
          const count = distribution[cell.key] ?? 0;
          const cls = cell.concordant ? 'tf-status-success' : 'tf-status-warning';
          return (
            <div
              key={cell.key}
              data-testid={`ratio-cell-${cell.key}`}
              data-cell={cell.key}
              data-count={count}
              className={`${cls} p-3 rounded`}
              style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <span className='tf-text-secondary' style={{ fontSize: '0.7rem' }}>
                {cell.label}
              </span>
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
