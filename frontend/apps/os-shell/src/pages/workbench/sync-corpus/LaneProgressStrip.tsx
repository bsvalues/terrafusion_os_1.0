/**
 * SYNC-UX-1C: 6-lane horizontal progress strip.
 *
 * One pill per lane in the canonical order
 * (parcel → owner-wsdor → improvement → land → sales → geometry).
 * Currently-running lane is highlighted with tf-status-info and a
 * pulsing ring; click any lane to expand its CountsJson /
 * GateSummaryJson / QuarantineDeltaJson detail panel below.
 */

import React from 'react';
import {
  LaneOrder,
  type FullCorpusLaneResultResponse,
  type LaneName,
  type LaneStatus,
} from '@/api/syncCorpus';

interface Props {
  lanes: FullCorpusLaneResultResponse[];
  selectedLane: LaneName | null;
  onSelectLane: (lane: LaneName | null) => void;
}

export default function LaneProgressStrip({
  lanes,
  selectedLane,
  onSelectLane,
}: Props): React.ReactElement {
  // Index lanes by name; backend always emits 6, but be defensive.
  const byName = new Map<LaneName, FullCorpusLaneResultResponse>();
  for (const l of lanes) byName.set(l.lane, l);

  return (
    <section
      aria-label='Lane progress'
      data-testid='lane-progress-strip'
      className='tf-panel p-4 mt-4'
    >
      <h3 className='tf-text font-medium mb-3' style={{ fontSize: '0.95rem' }}>
        Lane progress
      </h3>
      <ol
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gridTemplateColumns: `repeat(${LaneOrder.length}, 1fr)`,
          gap: 8,
        }}
      >
        {LaneOrder.map((lane, i) => {
          const result = byName.get(lane);
          const status: LaneStatus = result?.status ?? 'Pending';
          const isSelected = selectedLane === lane;
          const isRunning = status === 'Running';
          const isLast = i === LaneOrder.length - 1;
          return (
            <li key={lane} style={{ position: 'relative' }}>
              <button
                type='button'
                onClick={() => onSelectLane(isSelected ? null : lane)}
                data-testid={`lane-pill-${lane}`}
                data-lane={lane}
                data-lane-status={status}
                data-running={isRunning ? 'true' : 'false'}
                aria-pressed={isSelected}
                aria-label={`Lane ${lane}: ${status}`}
                className={`${laneStatusClass(status)} p-2 rounded`}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  border: isSelected
                    ? '2px solid hsl(var(--tf-transcend-cyan-hs) 50%)'
                    : '1px solid transparent',
                  cursor: 'pointer',
                  animation: isRunning ? 'tf-pulse 2s ease-in-out infinite' : undefined,
                }}
              >
                <div className='font-medium'>
                  {i + 1}. {lane}
                </div>
                <div style={{ fontSize: '0.7rem', marginTop: 2, opacity: 0.85 }}>
                  {status}
                  {result?.startedAt && result?.finishedAt
                    ? ` · ${formatDuration(result.startedAt, result.finishedAt)}`
                    : null}
                </div>
                <div style={{ fontSize: '0.7rem', marginTop: 2, opacity: 0.7 }}>
                  {batchCount(result?.batchIdsJson)} batches
                </div>
              </button>
              {!isLast && (
                <span
                  aria-hidden='true'
                  style={{
                    position: 'absolute',
                    right: -6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'hsl(var(--tf-muted))',
                    fontSize: '0.75rem',
                  }}
                >
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function laneStatusClass(status: LaneStatus): string {
  switch (status) {
    case 'Completed':
      return 'tf-status-success';
    case 'Running':
      return 'tf-status-info';
    case 'Failed':
      return 'tf-status-error';
    case 'Skipped':
      return 'tf-status-warning';
    case 'Pending':
    default:
      return 'tf-text-secondary';
  }
}

function formatDuration(startedAt: string, finishedAt: string): string {
  try {
    const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    if (!Number.isFinite(ms) || ms < 0) return '—';
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rs = s % 60;
    if (m < 60) return `${m}m${rs > 0 ? ` ${rs}s` : ''}`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h${rm > 0 ? ` ${rm}m` : ''}`;
  } catch {
    return '—';
  }
}

function batchCount(batchIdsJson: string | null | undefined): number {
  if (!batchIdsJson) return 0;
  try {
    const parsed = JSON.parse(batchIdsJson);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}
