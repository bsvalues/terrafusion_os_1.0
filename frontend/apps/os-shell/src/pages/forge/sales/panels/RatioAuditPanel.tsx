/**
 * RatioAuditPanel — Tab 2 of SalesForge.
 * All qualified sales sorted by ratio, with outlier flags and quick decision override.
 * Fetches all sales independently (pageSize=2000) — not piggy-backing on the Queue page slice.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSalesForgeStore } from '../salesForgeStore';
import { QualDecisionButtons } from '../components/QualDecisionButtons';
import { apiFetch } from '../../../../lib/apiBase';
import type { SaleQueueItem } from '../salesForgeTypes';

type SortDir = 'asc' | 'desc';

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  } catch {
    return iso;
  }
}

function fmtPrice(n: number | null | undefined): string {
  if (n == null) return '—';
  return `$${(n / 1000).toFixed(0)}k`;
}

function fmtRatio(n: number | null | undefined): string {
  if (n == null) return '—';
  return (n * 100).toFixed(2) + '%';
}

type OutlierLevel = 'high' | 'low' | 'ok';

function getOutlierLevel(ratio: number | null | undefined): OutlierLevel {
  if (ratio == null) return 'ok';
  if (ratio > 1.15) return 'high';
  if (ratio < 0.85) return 'low';
  return 'ok';
}

function OutlierBadge({ ratio }: { ratio: number | null | undefined }) {
  if (ratio == null) return <span style={{ color: 'var(--sf-subtle)', fontSize: '0.75rem' }}>—</span>;
  const level = getOutlierLevel(ratio);
  const pct = (ratio * 100).toFixed(2) + '%';
  if (level === 'high') {
    return <span className="sf-ratio-badge sf-ratio-badge--high">{pct} ▲</span>;
  }
  if (level === 'low') {
    return <span className="sf-ratio-badge sf-ratio-badge--low">{pct} ▼</span>;
  }
  return <span className="sf-ratio-badge sf-ratio-badge--ok">{pct}</span>;
}

export function RatioAuditPanel() {
  const taxYear          = useSalesForgeStore((s) => s.taxYear);
  const committedFilters = useSalesForgeStore((s) => s.committedFilters);
  const selectSale       = useSalesForgeStore((s) => s.selectSale);
  const clearSelection   = useSalesForgeStore((s) => s.clearSelection);
  const selectedSaleId   = useSalesForgeStore((s) => s.selectedSaleId);
  const saleDetail       = useSalesForgeStore((s) => s.saleDetail);
  const detailLoading    = useSalesForgeStore((s) => s.detailLoading);

  const [auditSales, setAuditSales]     = useState<SaleQueueItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError]     = useState<string | null>(null);

  const [sortDir, setSortDir]               = useState<SortDir>('asc');
  const [showOutliersOnly, setShowOutliersOnly] = useState(false);

  const fetchAuditSales = useCallback(async (signal?: AbortSignal) => {
    setAuditLoading(true);
    setAuditError(null);
    const params = new URLSearchParams({
      taxYear: String(taxYear),
      status: 'all',
      pageSize: '2000',
      page: '1',
    });
    if (committedFilters.hood)         params.set('hood', committedFilters.hood);
    if (committedFilters.propertyType) params.set('propertyType', committedFilters.propertyType);
    if (committedFilters.saleDateFrom) params.set('saleDateFrom', committedFilters.saleDateFrom);
    if (committedFilters.saleDateTo)   params.set('saleDateTo', committedFilters.saleDateTo);
    try {
      const res = await apiFetch(`/terraforge/sale-qualification?${params}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (signal?.aborted) return;
      const page = await res.json() as { items: SaleQueueItem[] };
      if (signal?.aborted) return;
      setAuditSales(page.items);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setAuditError(e instanceof Error ? e.message : 'Failed to load ratio audit data');
    } finally {
      if (!signal?.aborted) setAuditLoading(false);
    }
  }, [taxYear, committedFilters]);

  useEffect(() => {
    const ctrl = new AbortController();
    void fetchAuditSales(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchAuditSales]);

  // Filter to qualified-only and sort by ratio
  const auditItems = auditSales
    .filter((i) => {
      const isQualified = i.qualificationDecision === 'qualified'
        || (i.qualificationDecision == null && i.qualificationRecommendation === 'qualified');
      if (!isQualified) return false;
      if (showOutliersOnly) return getOutlierLevel(i.salesRatio) !== 'ok';
      return true;
    })
    .slice()
    .sort((a, b) => {
      const ra = a.salesRatio ?? 0;
      const rb = b.salesRatio ?? 0;
      return sortDir === 'asc' ? ra - rb : rb - ra;
    });

  const outlierCount = auditSales.filter((i) => {
    const isQualified = i.qualificationDecision === 'qualified'
      || (i.qualificationDecision == null && i.qualificationRecommendation === 'qualified');
    return isQualified && getOutlierLevel(i.salesRatio) !== 'ok';
  }).length;

  const handleRowClick = useCallback((item: SaleQueueItem) => {
    if (selectedSaleId === item.saleId) {
      clearSelection();
    } else {
      selectSale(item.saleId);
    }
  }, [selectedSaleId, selectSale, clearSelection]);

  return (
    <div className="sf-main">
      <div className="sf-ratio-audit-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--sf-muted)' }}>
            {auditSales.length.toLocaleString()} total · {auditItems.length.toLocaleString()} qualified
            {outlierCount > 0 && (
              <span style={{ marginLeft: 8, color: 'var(--sf-warn)', fontWeight: 600 }}>
                · {outlierCount} outliers (&lt;85% or &gt;115%)
              </span>
            )}
          </span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showOutliersOnly}
              onChange={(e) => setShowOutliersOnly(e.target.checked)}
              style={{ accentColor: 'var(--sf-warn)' }}
            />
            <span>Outliers only</span>
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--sf-muted)' }}>Sort ratio:</span>
          <button
            type="button"
            className={`sf-btn sf-btn--ghost ${sortDir === 'asc' ? 'sf-btn--active' : ''}`}
            style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            onClick={() => setSortDir('asc')}
          >
            Low → High
          </button>
          <button
            type="button"
            className={`sf-btn sf-btn--ghost ${sortDir === 'desc' ? 'sf-btn--active' : ''}`}
            style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            onClick={() => setSortDir('desc')}
          >
            High → Low
          </button>
        </div>
      </div>

      <div className="sf-table-scroll">
        {auditLoading && auditSales.length === 0 && (
          <div className="sf-state" role="status">Loading sales…</div>
        )}
        {auditError && (
          <div className="sf-state sf-state--error" role="alert">{auditError}</div>
        )}
        {!auditLoading && auditItems.length === 0 && !auditError && (
          <div className="sf-state">
            {showOutliersOnly ? 'No outliers found.' : 'No qualified sales in current filter window.'}
          </div>
        )}

        {auditItems.length > 0 && (
          <div className="sf-table sf-table--ratio-audit" role="table" aria-label="Ratio audit — qualified sales">
            <div className="sf-row sf-row--head" role="row">
              <span className="sf-cell" role="columnheader">Parcel / Address</span>
              <span className="sf-cell" role="columnheader">Date</span>
              <span className="sf-cell sf-cell--num" role="columnheader">Sale price</span>
              <span className="sf-cell sf-cell--num" role="columnheader">Assessed</span>
              <span className="sf-cell sf-cell--num" role="columnheader">Ratio</span>
              <span className="sf-cell" role="columnheader">Hood</span>
              <span className="sf-cell" role="columnheader">Decision</span>
              <span className="sf-cell" role="columnheader">Override</span>
            </div>

            {auditItems.map((item) => {
              const outlier = getOutlierLevel(item.salesRatio);
              return (
                <div
                  key={item.saleId}
                  className={`sf-row sf-row--data ${selectedSaleId === item.saleId ? 'sf-row--selected' : ''} ${outlier !== 'ok' ? 'sf-row--outlier' : ''}`}
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
                    {item.assessedValue != null ? fmtPrice(item.assessedValue) : <span className="sf-null-flag">—</span>}
                  </span>
                  <span className="sf-cell sf-cell--num" role="cell">
                    <OutlierBadge ratio={item.salesRatio} />
                  </span>
                  <span className="sf-cell" style={{ fontSize: '0.75rem', color: 'var(--sf-muted)' }} role="cell">
                    {item.hood ?? '—'}
                  </span>
                  <span className="sf-cell" role="cell">
                    <span style={{ fontSize: '0.75rem', color: 'var(--sf-success)' }}>
                      {item.qualificationDecision === 'qualified' ? 'confirmed' : 'recommended'}
                    </span>
                  </span>
                  <span className="sf-cell" role="cell" onClick={(e) => e.stopPropagation()}>
                    {outlier !== 'ok' && (
                      <QualDecisionButtons saleId={item.saleId} compact />
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail expand for selected sale */}
      {selectedSaleId && (
        <div className="sf-detail-panel">
          <div className="sf-detail-header">
            <div className="sf-detail-title">
              {detailLoading
                ? 'Loading detail…'
                : saleDetail
                  ? `${saleDetail.parcelId ?? 'Sale Detail'} — ${saleDetail.address ?? ''}`
                  : 'Sale Detail'}
            </div>
            <button type="button" className="sf-detail-close" onClick={clearSelection} aria-label="Close detail">
              ✕
            </button>
          </div>

          {detailLoading && (
            <div className="sf-state" role="status" style={{ padding: '12px 16px' }}>Loading…</div>
          )}

          {!detailLoading && saleDetail && (
            <>
              <div className="sf-detail-grid" style={{ padding: '12px 16px' }}>
                <div className="sf-detail-field">
                  <div className="sf-detail-field__label">Sale price</div>
                  <span className="sf-detail-field__value">{fmtPrice(saleDetail.salePrice)}</span>
                </div>
                <div className="sf-detail-field">
                  <div className="sf-detail-field__label">Assessed value</div>
                  <span className={`sf-detail-field__value ${saleDetail.assessedValue == null ? 'sf-null-flag' : ''}`}>
                    {saleDetail.assessedValue != null ? fmtPrice(saleDetail.assessedValue) : '—'}
                  </span>
                </div>
                <div className="sf-detail-field">
                  <div className="sf-detail-field__label">Sales ratio</div>
                  <span className="sf-detail-field__value">{fmtRatio(saleDetail.salesRatio)}</span>
                </div>
                <div className="sf-detail-field">
                  <div className="sf-detail-field__label">GLA (time of sale)</div>
                  <span className="sf-detail-field__value">
                    {saleDetail.slLivingArea != null ? `${saleDetail.slLivingArea.toLocaleString()} sf` : '—'}
                  </span>
                </div>
                <div className="sf-detail-field">
                  <div className="sf-detail-field__label">WAC code</div>
                  <span className={`sf-detail-field__value ${!saleDetail.rawWacCd ? 'sf-null-flag' : ''}`}>
                    {saleDetail.rawWacCd ?? '—'}
                  </span>
                </div>
              </div>
              <div style={{ padding: '0 16px 12px' }}>
                <QualDecisionButtons saleId={saleDetail.saleId} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
