/**
 * SYNC-UX-1B: Paged table of commit-linked triage decisions.
 *
 * 50 rows/page client-side pagination — the backend already returns
 * the full decision-link set inline on the commit-detail payload, so
 * we slice in-memory rather than refetching.
 *
 * Columns: TriageId (short), DecisionType (badge), RoutedToUniverse,
 * RoutedToIAttrValCd, DismissalReason. Empty fields render '—'.
 */

import React, { useMemo, useState } from 'react';
import { type DecisionLinkResponse, shortId } from '@/api/syncCommits';

interface Props {
  decisions: DecisionLinkResponse[];
  pageSize?: number;
}

export const DECISIONS_PAGE_SIZE = 50;

export default function DecisionsTable({
  decisions,
  pageSize = DECISIONS_PAGE_SIZE,
}: Props): React.ReactElement {
  const [page, setPage] = useState(0);
  const total = decisions.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount - 1);

  const slice = useMemo(() => {
    const start = safePage * pageSize;
    return decisions.slice(start, start + pageSize);
  }, [decisions, safePage, pageSize]);

  if (total === 0) {
    return (
      <section
        className='tf-panel p-4'
        aria-label='Decisions in commit'
        data-testid='decisions-table'
      >
        <h3 className='tf-text font-medium mb-3' style={{ fontSize: '0.95rem' }}>
          Decisions
        </h3>
        <p className='tf-text-secondary' style={{ fontSize: '0.85rem' }}>
          No decision links recorded for this commit.
        </p>
      </section>
    );
  }

  return (
    <section
      className='tf-panel p-4'
      aria-label='Decisions in commit'
      data-testid='decisions-table'
    >
      <div className='flex items-center justify-between mb-3'>
        <h3 className='tf-text font-medium' style={{ fontSize: '0.95rem' }}>
          Decisions ({total.toLocaleString()})
        </h3>
        {pageCount > 1 && (
          <div
            className='tf-text-secondary'
            style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}
            data-testid='decisions-pager'
          >
            <button
              type='button'
              className='tf-status-info px-2 py-1 rounded'
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label='Previous page of decisions'
            >
              ‹ Prev
            </button>
            <span>
              page {safePage + 1} / {pageCount}
            </span>
            <button
              type='button'
              className='tf-status-info px-2 py-1 rounded'
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              aria-label='Next page of decisions'
            >
              Next ›
            </button>
          </div>
        )}
      </div>

      <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr className='tf-text-secondary'>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Triage</th>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Type</th>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Routed Universe</th>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Routed Attr Code</th>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Dismissal Reason</th>
          </tr>
        </thead>
        <tbody>
          {slice.map((d) => {
            const badgeClass =
              d.decisionType === 'Route'
                ? 'tf-status-info'
                : d.decisionType === 'Dismiss'
                  ? 'tf-status-warning'
                  : 'tf-text-secondary';
            return (
              <tr
                key={d.linkId}
                data-testid={`decision-row-${d.linkId}`}
                data-decision-type={d.decisionType}
              >
                <td className='tf-text' style={{ padding: '4px 8px' }} title={d.triageId}>
                  <code>{shortId(d.triageId)}</code>
                </td>
                <td style={{ padding: '4px 8px' }}>
                  <span
                    className={`${badgeClass} px-2 py-0.5 rounded`}
                    style={{ fontSize: '0.7rem', fontWeight: 600 }}
                    data-testid={`decision-badge-${d.linkId}`}
                  >
                    {d.decisionType}
                  </span>
                </td>
                <td className='tf-text' style={{ padding: '4px 8px' }}>
                  {d.routedToUniverse ? <code>{d.routedToUniverse}</code> : <span aria-label='empty'>—</span>}
                </td>
                <td className='tf-text' style={{ padding: '4px 8px' }}>
                  {d.routedToIAttrValCd ? <code>{d.routedToIAttrValCd}</code> : <span aria-label='empty'>—</span>}
                </td>
                <td
                  className='tf-text-secondary'
                  style={{
                    padding: '4px 8px',
                    maxWidth: 320,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={d.dismissalReason ?? ''}
                >
                  {d.dismissalReason ?? <span aria-label='empty'>—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
