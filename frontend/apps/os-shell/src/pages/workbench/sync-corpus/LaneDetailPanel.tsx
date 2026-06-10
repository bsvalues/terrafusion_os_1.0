/**
 * SYNC-UX-1C: inline detail panel for a selected lane.
 *
 * Shows the three opaque JSON blobs the backend ships per
 * lane-result row (CountsJson, GateSummaryJson, QuarantineDeltaJson)
 * pretty-printed for operator inspection.
 */

import React from 'react';
import type { FullCorpusLaneResultResponse, LaneName } from '@/api/syncCorpus';

interface Props {
  lane: LaneName;
  laneResult: FullCorpusLaneResultResponse | undefined;
}

export default function LaneDetailPanel({
  lane,
  laneResult,
}: Props): React.ReactElement {
  return (
    <section
      aria-label={`Lane detail: ${lane}`}
      data-testid='lane-detail-panel'
      data-lane={lane}
      className='tf-panel p-4 mt-2'
    >
      <h4 className='tf-text font-medium mb-2' style={{ fontSize: '0.9rem' }}>
        {lane} · detail
      </h4>
      {!laneResult ? (
        <p className='tf-text-secondary' style={{ fontSize: '0.85rem' }}>
          No result row yet for this lane.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          <JsonBlock title='Counts' raw={laneResult.countsJson} />
          <JsonBlock title='Gate summary' raw={laneResult.gateSummaryJson} />
          <JsonBlock title='Quarantine delta' raw={laneResult.quarantineDeltaJson} />
          {laneResult.errorMessage && (
            <div className='tf-status-error p-2 rounded' style={{ fontSize: '0.8rem' }}>
              <div className='font-medium' style={{ marginBottom: 4 }}>
                Error
              </div>
              <code style={{ whiteSpace: 'pre-wrap' }}>{laneResult.errorMessage}</code>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function JsonBlock({
  title,
  raw,
}: {
  title: string;
  raw: string | null | undefined;
}): React.ReactElement {
  let pretty: string;
  if (!raw) {
    pretty = '—';
  } else {
    try {
      pretty = JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      pretty = raw;
    }
  }
  return (
    <div>
      <div
        className='tf-text-secondary'
        style={{ fontSize: '0.75rem', marginBottom: 4, textTransform: 'uppercase' }}
      >
        {title}
      </div>
      <pre
        className='tf-text'
        style={{
          fontSize: '0.75rem',
          background: 'hsl(var(--tf-bg))',
          padding: 8,
          borderRadius: 4,
          maxHeight: 240,
          overflow: 'auto',
          margin: 0,
        }}
      >
        {pretty}
      </pre>
    </div>
  );
}
