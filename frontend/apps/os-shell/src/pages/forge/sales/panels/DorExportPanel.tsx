/**
 * DorExportPanel — Tab 5 of SalesForge.
 * Preview qualified sales for DOR export. Generates downloadable CSV.
 * Blob download pattern matching the rest of TerraFusion.
 */

import { useEffect, useState, useCallback } from 'react';
import { useSalesForgeStore } from '../salesForgeStore';
import { apiFetch } from '../../../../lib/apiBase';
import type { SaleQueueItem } from '../salesForgeTypes';

// DOR CSV columns — certified submission format
const DOR_COLUMNS: { key: keyof SaleQueueItem | string; label: string }[] = [
  { key: 'parcelId',                    label: 'Parcel Number' },
  { key: 'saleDate',                    label: 'Sale Date' },
  { key: 'salePrice',                   label: 'Sale Price' },
  { key: 'adjustedSalePrice',           label: 'Adjusted Sale Price' },
  { key: 'assessedValue',               label: 'Assessed Value' },
  { key: 'salesRatio',                  label: 'Sales Ratio' },
  { key: 'hood',                        label: 'Neighborhood' },
  { key: 'propertyType',                label: 'Property Type' },
  { key: 'salesYear',                   label: 'DOR Sales Year' },
  { key: 'qualificationDecision',       label: 'Qualification Decision' },
  { key: 'qualificationDecisionBy',     label: 'Decided By' },
  { key: 'qualificationDecisionAt',     label: 'Decided At' },
  { key: 'rawWacCd',                    label: 'WAC Code' },
  { key: 'rawSaleQualifier',            label: 'Sale Qualifier' },
  { key: 'rawCountyRatioCd',            label: 'County Ratio Code' },
  { key: 'rawRatioTypeCd',              label: 'Ratio Type Code' },
  { key: 'rawSaleTypeCode',             label: 'Sale Type Code' },
  { key: 'rawFinancingCode',            label: 'Financing Code' },
  { key: 'slLivingArea',               label: 'GLA (Time of Sale)' },
  { key: 'slYearBuilt',                label: 'Year Built (Time of Sale)' },
  { key: 'address',                     label: 'Address' },
];

function escCsv(val: string | number | null | undefined): string {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(items: SaleQueueItem[]): string {
  const header = DOR_COLUMNS.map((c) => escCsv(c.label)).join(',');
  const rows = items.map((item) =>
    DOR_COLUMNS.map((c) => escCsv((item as Record<string, unknown>)[c.key] as string | number | null)).join(',')
  );
  return [header, ...rows].join('\r\n');
}

function fmtNum(n: number): string {
  return n.toLocaleString();
}

function fmtPrice(n: number | null | undefined): string {
  if (n == null) return '—';
  return `$${n.toLocaleString()}`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  } catch {
    return iso;
  }
}

function fmtRatio(n: number | null | undefined): string {
  if (n == null) return '—';
  return (n * 100).toFixed(2) + '%';
}

export function DorExportPanel() {
  const taxYear = useSalesForgeStore((s) => s.taxYear);
  const committedFilters = useSalesForgeStore((s) => s.committedFilters);

  const [exportData, setExportData] = useState<SaleQueueItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadExportPreview = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      taxYear: String(taxYear),
      status: 'qualified',
      pageSize: '9999',
      page: '1',
    });
    if (committedFilters.hood)         params.set('hood',         committedFilters.hood);
    if (committedFilters.propertyType) params.set('propertyType', committedFilters.propertyType);
    if (committedFilters.saleDateFrom) params.set('saleDateFrom', committedFilters.saleDateFrom);
    if (committedFilters.saleDateTo)   params.set('saleDateTo',   committedFilters.saleDateTo);

    try {
      const res = await apiFetch(`/terraforge/sale-qualification?${params}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const page = await res.json() as { total: number; items: SaleQueueItem[] };
      if (signal?.aborted) return;
      setExportData(page.items);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Failed to load export data');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [taxYear, committedFilters]);

  useEffect(() => {
    const ctrl = new AbortController();
    void loadExportPreview(ctrl.signal);
    return () => ctrl.abort();
  }, [loadExportPreview]);

  const handleExport = useCallback(() => {
    if (!exportData || exportData.length === 0) return;
    setExporting(true);
    try {
      const csv = buildCsv(exportData);
      const bom = '\uFEFF';
      const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const hood = committedFilters.hood ? `_${committedFilters.hood}` : '';
      try {
        a.href = url;
        a.download = `DOR_SaleQualification_BentonCounty_${taxYear}${hood}.csv`;
        a.click();
      } finally {
        URL.revokeObjectURL(url);
        setExporting(false);
      }
    } catch {
      setExporting(false);
    }
  }, [exportData, taxYear, committedFilters.hood]);

  const qualifiedCount  = exportData?.length ?? 0;
  const wacNullCount    = exportData?.filter((i) => i.rawWacCd == null).length ?? 0;
  const ratioNullCount  = exportData?.filter((i) => i.salesRatio == null).length ?? 0;
  const pendingDecision = exportData?.filter((i) => i.qualificationDecision == null).length ?? 0;

  return (
    <div className="sf-main">
      <div className="sf-ratio-audit-toolbar">
        <span style={{ fontSize: '0.8125rem', color: 'var(--sf-muted)' }}>
          DOR-certified sale qualification export · {taxYear} tax year
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="sf-btn sf-btn--ghost"
            style={{ fontSize: '0.75rem', padding: '3px 10px' }}
            onClick={() => void loadExportPreview()}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh preview'}
          </button>
          <button
            type="button"
            className="sf-btn sf-btn--success"
            style={{ fontSize: '0.8125rem', padding: '5px 14px', fontWeight: 600 }}
            onClick={handleExport}
            disabled={loading || exporting || qualifiedCount === 0}
            title={`Export ${qualifiedCount.toLocaleString()} qualified sales to DOR CSV`}
          >
            {exporting ? 'Generating…' : `Export DOR CSV (${qualifiedCount.toLocaleString()} sales)`}
          </button>
        </div>
      </div>

      {loading && !exportData && (
        <div className="sf-state" role="status">Loading qualified sales…</div>
      )}
      {error && (
        <div className="sf-state sf-state--error" role="alert">{error}</div>
      )}

      {exportData && (
        <>
          {/* Pre-export summary */}
          <div className="sf-dor-summary">
            <div className="sf-dor-kpi-row">
              <div className="sf-dor-kpi">
                <div className="sf-dor-kpi__label">Qualified sales</div>
                <div className="sf-dor-kpi__value sf-dor-kpi__value--primary">{fmtNum(qualifiedCount)}</div>
              </div>
              <div className="sf-dor-kpi">
                <div className="sf-dor-kpi__label">Awaiting appraiser sign-off</div>
                <div className={`sf-dor-kpi__value ${pendingDecision > 0 ? 'sf-dor-kpi__value--warn' : 'sf-dor-kpi__value--ok'}`}>
                  {fmtNum(pendingDecision)}
                </div>
              </div>
              <div className="sf-dor-kpi">
                <div className="sf-dor-kpi__label">Missing WAC code</div>
                <div className={`sf-dor-kpi__value ${wacNullCount > 0 ? 'sf-dor-kpi__value--warn' : 'sf-dor-kpi__value--ok'}`}>
                  {fmtNum(wacNullCount)}
                </div>
              </div>
              <div className="sf-dor-kpi">
                <div className="sf-dor-kpi__label">Missing ratio</div>
                <div className={`sf-dor-kpi__value ${ratioNullCount > 0 ? 'sf-dor-kpi__value--warn' : 'sf-dor-kpi__value--ok'}`}>
                  {fmtNum(ratioNullCount)}
                </div>
              </div>
            </div>

            {pendingDecision > 0 && (
              <div className="sf-data-alert" role="alert" style={{ marginTop: 8 }}>
                <strong>⚠ {fmtNum(pendingDecision)} sales have no appraiser sign-off.</strong>{' '}
                These are TF-recommended qualified but not yet confirmed by an appraiser.
                Consider finishing decisions in the Queue tab before DOR submission.
              </div>
            )}
            {wacNullCount > 0 && (
              <div className="sf-data-alert" role="alert" style={{ marginTop: 8 }}>
                <strong>⚠ {fmtNum(wacNullCount)} sales missing WAC code.</strong>{' '}
                WAC codes are required for DOR-exempt classification.
                Re-sync WAC codes from the source system before final submission.
              </div>
            )}
          </div>

          {/* Preview table */}
          <div className="sf-table-scroll" style={{ flex: 1 }}>
            <div style={{ padding: '8px 0', fontSize: '0.75rem', color: 'var(--sf-muted)' }}>
              Preview — first {Math.min(exportData.length, 100).toLocaleString()} of {fmtNum(qualifiedCount)} rows
              {committedFilters.hood && ` · filtered to hood ${committedFilters.hood}`}
            </div>
            <div className="sf-table sf-table--dor" role="table" aria-label="DOR export preview">
              <div className="sf-row sf-row--head" role="row">
                <span className="sf-cell" role="columnheader">Parcel</span>
                <span className="sf-cell" role="columnheader">Date</span>
                <span className="sf-cell sf-cell--num" role="columnheader">Sale price</span>
                <span className="sf-cell sf-cell--num" role="columnheader">Assessed</span>
                <span className="sf-cell sf-cell--num" role="columnheader">Ratio</span>
                <span className="sf-cell" role="columnheader">Hood</span>
                <span className="sf-cell" role="columnheader">WAC</span>
                <span className="sf-cell" role="columnheader">Decision</span>
                <span className="sf-cell" role="columnheader">By</span>
              </div>
              {exportData.slice(0, 100).map((item) => (
                <div key={item.saleId} className="sf-row sf-row--data" role="row">
                  <span className="sf-cell sf-parcel" role="cell">{item.parcelId ?? '—'}</span>
                  <span className="sf-cell" role="cell">{fmtDate(item.saleDate)}</span>
                  <span className="sf-cell sf-cell--num" role="cell">
                    {fmtPrice(item.adjustedSalePrice ?? item.salePrice)}
                  </span>
                  <span className="sf-cell sf-cell--num" role="cell">
                    {item.assessedValue != null
                      ? fmtPrice(item.assessedValue)
                      : <span className="sf-null-flag">—</span>
                    }
                  </span>
                  <span className="sf-cell sf-cell--num" role="cell">
                    {fmtRatio(item.salesRatio)}
                  </span>
                  <span className="sf-cell" style={{ fontSize: '0.75rem', color: 'var(--sf-muted)' }} role="cell">
                    {item.hood ?? '—'}
                  </span>
                  <span className="sf-cell" role="cell">
                    {item.rawWacCd
                      ? <code style={{ fontSize: '0.75rem' }}>{item.rawWacCd}</code>
                      : <span className="sf-null-flag">—</span>
                    }
                  </span>
                  <span className="sf-cell" role="cell" style={{ fontSize: '0.75rem', color: 'var(--sf-success)' }}>
                    {item.qualificationDecision ?? <span style={{ color: 'var(--sf-muted)' }}>TF rec</span>}
                  </span>
                  <span className="sf-cell" style={{ fontSize: '0.6875rem', color: 'var(--sf-muted)' }} role="cell">
                    {item.qualificationDecisionBy ?? '—'}
                  </span>
                </div>
              ))}
              {exportData.length > 100 && (
                <div className="sf-row" style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--sf-subtle)', fontStyle: 'italic' }}>
                  … and {fmtNum(exportData.length - 100)} more rows — all included in CSV export.
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '12px 0 4px', fontSize: '0.75rem', color: 'var(--sf-subtle)' }}>
            File: <code>DOR_SaleQualification_BentonCounty_{taxYear}{committedFilters.hood ? `_${committedFilters.hood}` : ''}.csv</code>
            {' · '}{DOR_COLUMNS.length} columns · UTF-8 with BOM
          </div>
        </>
      )}
    </div>
  );
}
