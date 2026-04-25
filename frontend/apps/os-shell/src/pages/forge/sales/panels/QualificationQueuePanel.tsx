/**
 * QualificationQueuePanel — Tab 1 of SalesForge.
 * Master list + decision UI. Left column of the two-panel layout.
 */

import { useCallback, useEffect } from 'react';
import { useSalesForgeStore } from '../salesForgeStore';
import { SaleFilterBar } from '../components/SaleFilterBar';
import { SaleDetailPanel } from '../components/SaleDetailPanel';
import { QualDecisionButtons } from '../components/QualDecisionButtons';
import { QUEUE_PAGE_SIZE } from '../salesForgeTypes';
import type { SaleQueueItem, QueueTab } from '../salesForgeTypes';

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  } catch {
    return iso;
  }
}

function fmtPrice(n: number | null): string {
  if (n == null) return '—';
  return `$${(n / 1000).toFixed(0)}k`;
}

function RatioBadge({ ratio }: { ratio: number | null }) {
  if (ratio == null) return <span className="sf-ratio-badge sf-ratio-badge--missing">—</span>;
  const cls = ratio >= 0.9 && ratio <= 1.1 ? 'sf-ratio-badge--ok'
    : ratio < 0.9 ? 'sf-ratio-badge--low'
    : 'sf-ratio-badge--high';
  return <span className={`sf-ratio-badge ${cls}`}>{(ratio * 100).toFixed(1)}%</span>;
}

function RecChip({ rec }: { rec: string | null }) {
  if (!rec) return <span style={{ color: 'var(--sf-subtle)', fontSize: '0.75rem' }}>—</span>;
  const chipClass = rec === 'qualified' ? 'forge-chip forge-chip--success'
    : 'forge-chip forge-chip--warn';
  const label = rec === 'qualified' ? 'qualified'
    : rec.startsWith('non') ? 'non-AL'
    : rec.length > 12 ? `${rec.slice(0, 12)}…` : rec;
  return <span className={chipClass}>{label}</span>;
}

function DecisionChip({ decision }: { decision: string | null }) {
  if (!decision) return <span style={{ color: 'var(--sf-subtle)', fontSize: '0.75rem' }}>pending</span>;
  const cls = decision === 'qualified' ? 'forge-chip forge-chip--success'
    : 'forge-chip forge-chip--warn';
  return <span className={cls}>{decision === 'qualified' ? 'qualified' : decision}</span>;
}

const QUEUE_TABS: { id: QueueTab; label: string }[] = [
  { id: 'all',    label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'staff',   label: 'Staff confirmed' },
  { id: 'final',   label: 'Appraiser final' },
];

export function QualificationQueuePanel() {
  const queueData        = useSalesForgeStore((s) => s.queueData);
  const queueLoading     = useSalesForgeStore((s) => s.queueLoading);
  const queueError       = useSalesForgeStore((s) => s.queueError);
  const queuePage        = useSalesForgeStore((s) => s.queuePage);
  const queueTab         = useSalesForgeStore((s) => s.queueTab);
  const selectedSaleId   = useSalesForgeStore((s) => s.selectedSaleId);
  const fetchQueue       = useSalesForgeStore((s) => s.fetchQueue);
  const setQueueTab      = useSalesForgeStore((s) => s.setQueueTab);
  const setQueuePage     = useSalesForgeStore((s) => s.setQueuePage);
  const selectSale       = useSalesForgeStore((s) => s.selectSale);
  const clearSelection   = useSalesForgeStore((s) => s.clearSelection);
  const committedFilters = useSalesForgeStore((s) => s.committedFilters);
  const bulkDecision     = useSalesForgeStore((s) => s.bulkDecision);

  useEffect(() => {
    void fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueTab, queuePage, committedFilters]);

  const handleRowClick = useCallback((item: SaleQueueItem) => {
    if (selectedSaleId === item.saleId) {
      clearSelection();
    } else {
      selectSale(item.saleId);
    }
  }, [selectedSaleId, selectSale, clearSelection]);

  const handleBulkAccept = useCallback(() => {
    const pendingRecommended = (queueData?.items ?? [])
      .filter((i) => i.qualificationDecision == null && i.qualificationRecommendation === 'qualified')
      .map((i) => i.saleId);
    if (pendingRecommended.length === 0) return;
    void bulkDecision(pendingRecommended, 'qualified', 'Batch accept TF recommended qualified sales', 'staff');
  }, [queueData, bulkDecision]);

  const totalPages = queueData ? Math.ceil(queueData.total / QUEUE_PAGE_SIZE) : 0;
  const pendingRecommendedCount = (queueData?.items ?? [])
    .filter((i) => i.qualificationDecision == null && i.qualificationRecommendation === 'qualified').length;

  return (
    <div className="sf-main">
      <SaleFilterBar />

      {/* Queue sub-tabs */}
      <div className="sf-subtabs">
        {QUEUE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`sf-subtab ${queueTab === t.id ? 'sf-subtab--active' : ''}`}
            onClick={() => setQueueTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="sf-table-scroll">
        {queueLoading && !queueData && (
          <div className="sf-state" role="status">Loading sales…</div>
        )}
        {queueError && (
          <div className="sf-state sf-state--error" role="alert">{queueError}</div>
        )}
        {queueData && queueData.items.length === 0 && (
          <div className="sf-state">No sales match the current filters.</div>
        )}

        {queueData && queueData.items.length > 0 && (
          <div className="sf-table" role="table" aria-label="Sale qualification queue">
            {/* Header */}
            <div className="sf-row sf-row--head" role="row">
              <span className="sf-cell" role="columnheader">Parcel / Address</span>
              <span className="sf-cell" role="columnheader">Date</span>
              <span className="sf-cell sf-cell--num" role="columnheader">Price</span>
              <span className="sf-cell sf-cell--num" role="columnheader">Ratio</span>
              <span className="sf-cell" role="columnheader">Recommendation</span>
              <span className="sf-cell" role="columnheader">Hood</span>
              <span className="sf-cell" role="columnheader">Decision</span>
              <span className="sf-cell" role="columnheader">By</span>
              <span className="sf-cell" role="columnheader">Action</span>
            </div>

            {queueData.items.map((item) => (
              <div
                key={item.saleId}
                className={`sf-row sf-row--data ${selectedSaleId === item.saleId ? 'sf-row--selected' : ''}`}
                role="row"
                onClick={() => handleRowClick(item)}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleRowClick(item); }}
                aria-selected={selectedSaleId === item.saleId}
              >
                <span className="sf-cell sf-cell--identity" role="cell">
                  <span className="sf-parcel">{item.parcelId ?? '—'}</span>
                  {item.address && (
                    <span className="sf-address" title={item.address}>
                      {item.address.length > 32 ? `${item.address.slice(0, 32)}…` : item.address}
                    </span>
                  )}
                </span>
                <span className="sf-cell" role="cell">{fmtDate(item.saleDate)}</span>
                <span className="sf-cell sf-cell--num" role="cell">
                  {fmtPrice(item.adjustedSalePrice ?? item.salePrice)}
                </span>
                <span className="sf-cell sf-cell--num" role="cell">
                  <RatioBadge ratio={item.salesRatio} />
                </span>
                <span className="sf-cell" role="cell">
                  <RecChip rec={item.qualificationRecommendation} />
                </span>
                <span className="sf-cell" style={{ fontSize: '0.75rem', color: 'var(--sf-muted)' }} role="cell">
                  {item.hood ?? '—'}
                </span>
                <span className="sf-cell" role="cell">
                  <DecisionChip decision={item.qualificationDecision} />
                </span>
                <span className="sf-cell" style={{ fontSize: '0.6875rem', color: 'var(--sf-muted)' }} role="cell">
                  {item.qualificationDecisionBy ?? '—'}
                </span>
                <span className="sf-cell" role="cell" onClick={(e) => e.stopPropagation()}>
                  {item.qualificationDecision == null && (
                    <QualDecisionButtons saleId={item.saleId} compact />
                  )}
                  {item.qualificationDecision != null && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--sf-subtle)' }}>decided</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination + bulk bar */}
      {queueData && (
        <div className="sf-pagination">
          <button
            type="button"
            className="sf-btn sf-btn--ghost"
            style={{ padding: '4px 10px' }}
            disabled={queuePage <= 1}
            onClick={() => setQueuePage(queuePage - 1)}
            aria-label="Previous page"
          >
            ‹ Prev
          </button>
          <span className="sf-page-info">
            {queuePage} / {totalPages || 1}
            &nbsp;({queueData.total.toLocaleString()} total)
          </span>
          <button
            type="button"
            className="sf-btn sf-btn--ghost"
            style={{ padding: '4px 10px' }}
            disabled={queuePage >= totalPages}
            onClick={() => setQueuePage(queuePage + 1)}
            aria-label="Next page"
          >
            Next ›
          </button>

          {/* Bulk actions */}
          {queueTab === 'pending' || queueTab === 'all' ? (
            <div className="sf-bulk-bar">
              <button
                type="button"
                className="sf-btn sf-btn--success"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                disabled={pendingRecommendedCount === 0}
                onClick={handleBulkAccept}
                title={`Accept all ${pendingRecommendedCount} TF-recommended qualified sales on this page`}
              >
                Bulk accept recommended ({pendingRecommendedCount})
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Selected sale detail */}
      {selectedSaleId && <SaleDetailPanel />}
    </div>
  );
}
