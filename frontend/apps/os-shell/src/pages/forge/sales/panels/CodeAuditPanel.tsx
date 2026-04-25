/**
 * CodeAuditPanel — Tab 4 of SalesForge.
 * Raw PACS code breakdown: WAC, SaleQualifier, RatioType, CountyRatio.
 * Prominently flags the known rawWacCd null/seeding gap.
 */

import { useEffect } from 'react';
import { useSalesForgeStore } from '../salesForgeStore';

interface NormalizedRow {
  code: string | null;
  description: string | null;
  count: number;
}

function fmtNum(n: number): string {
  return n.toLocaleString();
}

function fmtPct(count: number, total: number): string {
  if (total === 0) return '—';
  return ((count / total) * 100).toFixed(1) + '%';
}

interface BreakdownTableProps {
  title: string;
  rows: NormalizedRow[];
  nullLabel?: string;
}

function BreakdownTable({ title, rows, nullLabel = 'No code (null)' }: BreakdownTableProps) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  const sorted = rows.slice().sort((a, b) => b.count - a.count);

  return (
    <div className="sf-code-section">
      <div className="sf-code-section__title">{title}</div>
      <div className="sf-code-table" role="table" aria-label={title}>
        <div className="sf-row sf-row--head" role="row">
          <span className="sf-cell" role="columnheader">Code</span>
          <span className="sf-cell" role="columnheader">Description</span>
          <span className="sf-cell sf-cell--num" role="columnheader">Count</span>
          <span className="sf-cell sf-cell--num" role="columnheader">% of total</span>
        </div>
        {sorted.map((row) => {
          const isNull = row.code == null;
          return (
            <div key={row.code ?? '__null__'} className="sf-row sf-row--data" role="row">
              <span className="sf-cell" role="cell">
                {isNull
                  ? <span className="sf-null-flag">null</span>
                  : <code style={{ fontSize: '0.8125rem' }}>{row.code}</code>
                }
              </span>
              <span className="sf-cell" role="cell" style={{ fontSize: '0.8125rem', color: isNull ? 'var(--sf-warn)' : undefined }}>
                {isNull ? nullLabel : (row.description ?? '—')}
              </span>
              <span className="sf-cell sf-cell--num" role="cell">{fmtNum(row.count)}</span>
              <span className="sf-cell sf-cell--num" role="cell">{fmtPct(row.count, total)}</span>
            </div>
          );
        })}
        <div className="sf-row sf-row--total" role="row">
          <span className="sf-cell" role="cell" style={{ fontWeight: 600 }}>Total</span>
          <span className="sf-cell" role="cell" />
          <span className="sf-cell sf-cell--num" role="cell" style={{ fontWeight: 600 }}>{fmtNum(total)}</span>
          <span className="sf-cell sf-cell--num" role="cell">100%</span>
        </div>
      </div>
    </div>
  );
}

export function CodeAuditPanel() {
  const codeAudit    = useSalesForgeStore((s) => s.codeAudit);
  const auditLoading = useSalesForgeStore((s) => s.codeAuditLoading);
  const auditError   = useSalesForgeStore((s) => s.codeAuditError);
  const fetchCodeAudit = useSalesForgeStore((s) => s.fetchCodeAudit);
  const committedFilters = useSalesForgeStore((s) => s.committedFilters);

  useEffect(() => {
    void fetchCodeAudit();
    // fetchCodeAudit is a stable Zustand action reference — safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedFilters]);

  // Normalize wacCd rows to common shape
  const wacRows: NormalizedRow[] = (codeAudit?.wacCdBreakdown ?? []).map((r) => ({
    code: r.wacCd,
    description: r.description ?? null,
    count: r.count,
  }));

  const qualifierRows: NormalizedRow[] = (codeAudit?.saleQualifierBreakdown ?? []).map((r) => ({
    code: r.code,
    description: null,
    count: r.count,
  }));

  const ratioTypeRows: NormalizedRow[] = (codeAudit?.ratioTypeBreakdown ?? []).map((r) => ({
    code: r.code,
    description: null,
    count: r.count,
  }));

  const countyRatioRows: NormalizedRow[] = (codeAudit?.countyRatioBreakdown ?? []).map((r) => ({
    code: r.code,
    description: null,
    count: r.count,
  }));

  // Find null WAC count for the critical alert
  const wacNullRow = wacRows.find((r) => r.code == null);
  const wacNullCount = wacNullRow?.count ?? 0;
  const wacTotal = wacRows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="sf-main">
      <div className="sf-ratio-audit-toolbar">
        <span style={{ fontSize: '0.8125rem', color: 'var(--sf-muted)' }}>
          Code distribution — all {codeAudit ? fmtNum(codeAudit.totalSales) : '…'} sales in current tax year window
        </span>
        <button
          type="button"
          className="sf-btn sf-btn--ghost"
          style={{ fontSize: '0.75rem', padding: '3px 10px' }}
          onClick={() => void fetchCodeAudit()}
          disabled={auditLoading}
        >
          {auditLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {auditLoading && !codeAudit && (
        <div className="sf-state" role="status">Loading code audit…</div>
      )}
      {auditError && (
        <div className="sf-state sf-state--error" role="alert">{auditError}</div>
      )}

      {codeAudit && (
        <div className="sf-table-scroll">
          {/* Critical WAC null alert */}
          {wacNullCount > 0 && (
            <div className="sf-data-alert" role="alert">
              <strong>⚠ Data quality gap:</strong>{' '}
              {fmtNum(wacNullCount)} of {fmtNum(wacTotal)} sales (
              {fmtPct(wacNullCount, wacTotal)}) have no WAC code (rawWacCd = null).
              {' '}WAC codes were not synced — re-sync WAC codes from the source system to resolve.
              Qualification decisions are not blocked, but DOR submission may require WAC codes for exempt classification.
            </div>
          )}

          {wacRows.length > 0 && (
            <BreakdownTable
              title="WAC Code (RCW 458-61A) breakdown"
              rows={wacRows}
              nullLabel="No WAC code on file"
            />
          )}

          {qualifierRows.length > 0 && (
            <BreakdownTable
              title="Sale qualifier breakdown"
              rows={qualifierRows}
              nullLabel="No sale qualifier"
            />
          )}

          {ratioTypeRows.length > 0 && (
            <BreakdownTable
              title="Ratio type code breakdown"
              rows={ratioTypeRows}
              nullLabel="No ratio type"
            />
          )}

          {countyRatioRows.length > 0 && (
            <BreakdownTable
              title="County ratio code breakdown"
              rows={countyRatioRows}
              nullLabel="No county ratio code"
            />
          )}

          <div style={{ padding: '12px 0', fontSize: '0.75rem', color: 'var(--sf-subtle)' }}>
            Source: WAC code, sale qualifier, ratio type, county ratio — direct from county sale records. Raw codes are shown as-is.
          </div>
        </div>
      )}
    </div>
  );
}
