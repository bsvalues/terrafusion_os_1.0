/**
 * SYNC-UX-1B: Left-rail paged commit list.
 *
 * Each row shows the short commit id, committed-at (relative time +
 * absolute on tooltip), operator id, and routed/dismissed counts.
 * Click a row to select it — selection drives the right detail panel
 * via the parent page's state and the URL :commitId param.
 */

import React from 'react';
import { type CommitSummaryResponse, shortId } from '@/api/syncCommits';

interface Props {
  items: CommitSummaryResponse[];
  selectedCommitId: string | null;
  onSelect: (commitId: string) => void;
  isLoading: boolean;
  isError: boolean;
  totalCount: number;
  offset: number;
  pageSize: number;
  onPageChange: (offset: number) => void;
}

function relativeTime(iso: string): string {
  try {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return iso;
    const delta = Math.round((Date.now() - t) / 1000);
    if (delta < 60) return `${delta}s ago`;
    if (delta < 3600) return `${Math.round(delta / 60)}m ago`;
    if (delta < 86400) return `${Math.round(delta / 3600)}h ago`;
    return `${Math.round(delta / 86400)}d ago`;
  } catch {
    return iso;
  }
}

export default function CommitsList({
  items,
  selectedCommitId,
  onSelect,
  isLoading,
  isError,
  totalCount,
  offset,
  pageSize,
  onPageChange,
}: Props): React.ReactElement {
  const showingFrom = items.length === 0 ? 0 : offset + 1;
  const showingTo = offset + items.length;

  return (
    <section
      className='tf-panel p-3'
      aria-label='Recent commits'
      data-testid='commits-list'
      style={{ overflowY: 'auto' }}
    >
      <div className='flex items-center justify-between mb-2'>
        <h3 className='tf-text font-medium' style={{ fontSize: '0.9rem' }}>
          Commits
        </h3>
        <span className='tf-text-secondary' style={{ fontSize: '0.75rem' }}>
          {totalCount > 0 ? `${showingFrom}–${showingTo}` : '—'}
        </span>
      </div>

      {isLoading && (
        <p
          className='tf-text-secondary'
          style={{ fontSize: '0.85rem' }}
          data-testid='commits-list-loading'
        >
          Loading commits…
        </p>
      )}
      {isError && (
        <p
          className='tf-status-error p-2 rounded'
          style={{ fontSize: '0.85rem' }}
          data-testid='commits-list-error'
        >
          Failed to load commits.
        </p>
      )}
      {!isLoading && !isError && items.length === 0 && (
        <p
          className='tf-text-secondary'
          style={{ fontSize: '0.85rem' }}
          data-testid='commits-list-empty'
        >
          No commits yet. Click "New Commit" to seal pending decisions.
        </p>
      )}

      <ul
        style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}
      >
        {items.map((c) => {
          const isSelected = c.commitId === selectedCommitId;
          return (
            <li key={c.commitId}>
              <button
                type='button'
                onClick={() => onSelect(c.commitId)}
                aria-current={isSelected ? 'true' : undefined}
                aria-label={`Select commit ${shortId(c.commitId)}`}
                data-testid={`commit-row-${c.commitId}`}
                data-selected={isSelected ? 'true' : 'false'}
                className={isSelected ? 'tf-status-info' : 'tf-panel'}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <div
                  className='tf-text'
                  style={{
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                >
                  {shortId(c.commitId)}
                </div>
                <div
                  className='tf-text-secondary'
                  style={{ fontSize: '0.7rem' }}
                  title={new Date(c.committedAt).toLocaleString()}
                >
                  {relativeTime(c.committedAt)} · {c.operatorId}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 2, fontSize: '0.7rem' }}>
                  <span
                    className='tf-status-info px-1.5 rounded'
                    data-testid={`commit-routed-${c.commitId}`}
                  >
                    R {c.routedDecisionsApplied}
                  </span>
                  <span
                    className='tf-status-warning px-1.5 rounded'
                    data-testid={`commit-dismissed-${c.commitId}`}
                  >
                    D {c.dismissedDecisionsApplied}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {(items.length > 0 || offset > 0) && (
        <div
          className='flex items-center justify-between mt-3'
          style={{ fontSize: '0.75rem' }}
          data-testid='commits-list-pager'
        >
          <button
            type='button'
            className='tf-status-info px-2 py-1 rounded'
            disabled={offset === 0}
            onClick={() => onPageChange(Math.max(0, offset - pageSize))}
            aria-label='Previous page of commits'
          >
            ‹ Prev
          </button>
          <button
            type='button'
            className='tf-status-info px-2 py-1 rounded'
            disabled={items.length < pageSize}
            onClick={() => onPageChange(offset + pageSize)}
            aria-label='Next page of commits'
          >
            Next ›
          </button>
        </div>
      )}
    </section>
  );
}
