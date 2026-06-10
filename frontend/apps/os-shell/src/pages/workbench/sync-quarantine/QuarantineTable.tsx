/**
 * SYNC-UX-1A: paged table of imprv-attr quarantine rows.
 *
 * - 9 columns: PropId, ImprvId/ImprvDetId, IAttrValCd, AttrValueText,
 *   UniverseCode, ReasonDetail, TriageStatus (badge), SuggestedReroute,
 *   CreatedAt
 * - Per-row Route + Dismiss actions
 * - Multi-select via checkboxes (header check toggles all on page)
 * - Pagination: prev/next + "page X of Y" + page-size selector
 *
 * Visual language matches the doctrine console's tables: tabular-nums
 * for counts, monospace code in IAttrValCd / SuggestedReroute, status
 * badges via tf-status-* tokens.
 */

import React from 'react';
import type { QuarantineRowResponse } from '@/api/syncQuarantine';

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

interface QuarantineTableProps {
  rows: QuarantineRowResponse[];
  selectedIds: ReadonlySet<string>;
  onToggleRow: (unprovenRowId: string) => void;
  onToggleAll: (checked: boolean) => void;
  onRouteRow: (row: QuarantineRowResponse) => void;
  onDismissRow: (row: QuarantineRowResponse) => void;
  // Pagination
  page: number; // 1-based
  pageSize: PageSize;
  hasNextPage: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageSizeChange: (n: PageSize) => void;
  // Loading state for refresh / pagination
  isFetching: boolean;
}

function statusClass(status: string): string {
  switch (status) {
    case 'Routed':
      return 'tf-status-success';
    case 'Dismissed':
      return 'tf-status-warning';
    case 'Open':
    default:
      return 'tf-status-info';
  }
}

export default function QuarantineTable({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onRouteRow,
  onDismissRow,
  page,
  pageSize,
  hasNextPage,
  onPrevPage,
  onNextPage,
  onPageSizeChange,
  isFetching,
}: QuarantineTableProps): React.ReactElement {
  const allOnPageSelected =
    rows.length > 0 && rows.every((r) => selectedIds.has(r.unprovenRowId));
  const someOnPageSelected = !allOnPageSelected && rows.some((r) => selectedIds.has(r.unprovenRowId));

  return (
    <section
      className='tf-panel p-4 mt-4'
      aria-label='Quarantine rows'
      data-testid='quarantine-table-panel'
    >
      <div
        style={{
          overflowX: 'auto',
          maxWidth: '100%',
        }}
      >
        <table
          style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}
          data-testid='quarantine-table'
        >
          <thead>
            <tr className='tf-text-secondary'>
              <th style={{ padding: '4px 8px', textAlign: 'left', width: 28 }}>
                <input
                  type='checkbox'
                  aria-label='Select all rows on this page'
                  data-testid='select-all-checkbox'
                  checked={allOnPageSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someOnPageSelected;
                  }}
                  onChange={(e) => onToggleAll(e.target.checked)}
                />
              </th>
              <th style={{ textAlign: 'right', padding: '4px 8px' }}>PropId</th>
              <th style={{ textAlign: 'right', padding: '4px 8px' }}>Imprv / Det</th>
              <th style={{ textAlign: 'left', padding: '4px 8px' }}>IAttrValCd</th>
              <th style={{ textAlign: 'left', padding: '4px 8px' }}>AttrValueText</th>
              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Universe</th>
              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Reason</th>
              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Triage</th>
              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Suggested</th>
              <th style={{ textAlign: 'right', padding: '4px 8px' }}>Created</th>
              <th style={{ textAlign: 'right', padding: '4px 8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className='tf-text-secondary'
                  style={{ padding: '12px 8px', textAlign: 'center' }}
                  data-testid='quarantine-empty'
                >
                  {isFetching ? 'Loading…' : 'No quarantine rows match the current filters.'}
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const checked = selectedIds.has(row.unprovenRowId);
              return (
                <tr
                  key={row.unprovenRowId}
                  data-testid='quarantine-row'
                  data-row-id={row.unprovenRowId}
                  data-status={row.triageStatus}
                  style={{ borderTop: '1px solid var(--tf-border)' }}
                >
                  <td style={{ padding: '4px 8px' }}>
                    <input
                      type='checkbox'
                      aria-label={`Select quarantine row ${row.unprovenRowId}`}
                      data-testid='row-checkbox'
                      checked={checked}
                      onChange={() => onToggleRow(row.unprovenRowId)}
                    />
                  </td>
                  <td
                    className='tf-text'
                    style={{
                      padding: '4px 8px',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {row.propId.toLocaleString()}
                  </td>
                  <td
                    className='tf-text-secondary'
                    style={{
                      padding: '4px 8px',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {row.imprvId.toLocaleString()} / {row.imprvDetId.toLocaleString()}
                  </td>
                  <td className='tf-text' style={{ padding: '4px 8px' }}>
                    <code>{row.iAttrValCd}</code>
                  </td>
                  <td
                    className='tf-text-secondary'
                    style={{
                      padding: '4px 8px',
                      maxWidth: 240,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={row.attrValueText ?? ''}
                  >
                    {row.attrValueText ?? '—'}
                  </td>
                  <td className='tf-text' style={{ padding: '4px 8px' }}>
                    <code>{row.universeCode ?? 'UNKNOWN'}</code>
                  </td>
                  <td
                    className='tf-text-secondary'
                    style={{
                      padding: '4px 8px',
                      maxWidth: 200,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={row.quarantineReasonDetail ?? row.quarantineReason}
                  >
                    <code>{row.quarantineReason}</code>
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <span
                      className={statusClass(row.triageStatus)}
                      data-testid='triage-badge'
                      style={{ padding: '2px 6px', borderRadius: 3 }}
                    >
                      {row.triageStatus}
                    </span>
                  </td>
                  <td className='tf-text-secondary' style={{ padding: '4px 8px' }}>
                    {row.suggestedReroute ? <code>{row.suggestedReroute}</code> : '—'}
                  </td>
                  <td
                    className='tf-text-secondary'
                    style={{ padding: '4px 8px', textAlign: 'right' }}
                  >
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                    <button
                      type='button'
                      aria-label={`Route quarantine row ${row.unprovenRowId}`}
                      data-testid='row-route-button'
                      onClick={() => onRouteRow(row)}
                      className='tf-status-success'
                      style={{
                        padding: '2px 8px',
                        borderRadius: 3,
                        fontSize: '0.75rem',
                        marginRight: 4,
                        cursor: 'pointer',
                      }}
                    >
                      Route
                    </button>
                    <button
                      type='button'
                      aria-label={`Dismiss quarantine row ${row.unprovenRowId}`}
                      data-testid='row-dismiss-button'
                      onClick={() => onDismissRow(row)}
                      className='tf-status-warning'
                      style={{
                        padding: '2px 8px',
                        borderRadius: 3,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Dismiss
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px solid var(--tf-border)',
          fontSize: '0.8rem',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div className='tf-text-secondary' data-testid='page-indicator'>
          page {page}
          {hasNextPage ? '' : ' (last)'}
          {' · '}
          {rows.length} {rows.length === 1 ? 'row' : 'rows'} on page
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label className='tf-text-secondary' style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            show
            <select
              aria-label='Rows per page'
              data-testid='page-size-select'
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)}
              className='tf-text'
              style={{
                background: 'transparent',
                border: '1px solid var(--tf-border)',
                borderRadius: 3,
                padding: '2px 4px',
                fontSize: '0.8rem',
              }}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            type='button'
            aria-label='Previous page'
            data-testid='prev-page-button'
            onClick={onPrevPage}
            disabled={page <= 1 || isFetching}
            className='tf-status-info'
            style={{
              padding: '4px 10px',
              borderRadius: 3,
              fontSize: '0.8rem',
              opacity: page <= 1 || isFetching ? 0.5 : 1,
              cursor: page <= 1 || isFetching ? 'not-allowed' : 'pointer',
            }}
          >
            ← Prev
          </button>
          <button
            type='button'
            aria-label='Next page'
            data-testid='next-page-button'
            onClick={onNextPage}
            disabled={!hasNextPage || isFetching}
            className='tf-status-info'
            style={{
              padding: '4px 10px',
              borderRadius: 3,
              fontSize: '0.8rem',
              opacity: !hasNextPage || isFetching ? 0.5 : 1,
              cursor: !hasNextPage || isFetching ? 'not-allowed' : 'pointer',
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </section>
  );
}
