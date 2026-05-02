/**
 * OPS-1-B: ReadinessPanel — one of the six pinned-question
 * panels per the OPS-1 wireframe. Renders status badge,
 * headline, optional detail line, and an optional
 * "See sample" disclosure (used only for question 5).
 *
 * Self-explanatory: the operator should be able to read the
 * status without clicking anything.
 */

import React, { useState } from 'react';
import type { SyncReadinessPanel } from '@/api/workbenchSyncReadiness';
import { StatusBadge } from './StatusBadge';

interface ReadinessPanelProps {
  panel: SyncReadinessPanel;
  questionLabel: string;
  /** Optional — enables a `▸ See sample` toggle. */
  sampleNode?: React.ReactNode;
}

export function ReadinessPanel({
  panel,
  questionLabel,
  sampleNode,
}: ReadinessPanelProps): React.ReactElement {
  const [showSample, setShowSample] = useState(false);
  return (
    <section
      className='tf-panel p-4'
      aria-label={questionLabel}
      data-testid='readiness-panel'
      data-panel-source={panel.source}
    >
      <header className='flex items-center justify-between mb-2'>
        <h3 className='tf-text font-medium' style={{ fontSize: '0.95rem' }}>
          {questionLabel}
        </h3>
        <StatusBadge status={panel.status} />
      </header>

      <p className='tf-text mt-1' style={{ fontSize: '0.95rem' }}>
        {panel.headline}
      </p>

      {panel.detail && (
        <p className='tf-text-secondary mt-1' style={{ fontSize: '0.85rem' }}>
          {panel.detail}
        </p>
      )}

      {panel.capturedAtUtc && (
        <p className='tf-text-tertiary mt-2' style={{ fontSize: '0.75rem' }}>
          captured {panel.capturedAtUtc}
        </p>
      )}

      {sampleNode && (
        <div className='mt-2'>
          <button
            type='button'
            className='tf-text-secondary'
            style={{ fontSize: '0.85rem', textDecoration: 'underline' }}
            onClick={() => setShowSample((s) => !s)}
            aria-expanded={showSample}
            data-testid='panel-sample-toggle'
          >
            {showSample ? '▾ Hide sample' : '▸ See sample'}
          </button>
          {showSample && <div className='mt-2'>{sampleNode}</div>}
        </div>
      )}
    </section>
  );
}
