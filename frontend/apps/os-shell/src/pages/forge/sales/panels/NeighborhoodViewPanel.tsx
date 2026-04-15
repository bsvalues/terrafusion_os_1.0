/**
 * NeighborhoodViewPanel — Tab 3 of SalesForge.
 * Hood-level COD/PRD/count equity view. Worst COD first.
 * Click a hood row to jump to the filtered queue for that neighborhood.
 */

import { useEffect } from 'react';
import { useSalesForgeStore } from '../salesForgeStore';
import type { HoodStat } from '../salesForgeTypes';

function fmtNum(n: number | null | undefined): string {
  return n == null ? '—' : n.toLocaleString();
}

function fmtStat(n: number | null | undefined, decimals = 2): string {
  return n == null ? '—' : n.toFixed(decimals);
}

function fmtRatio(n: number | null | undefined): string {
  return n == null ? '—' : (n * 100).toFixed(2) + '%';
}

function codClass(cod: number | null | undefined): string {
  if (cod == null) return '';
  if (cod >= 20) return 'sf-hood-cod--critical';
  if (cod >= 15) return 'sf-hood-cod--warn';
  return 'sf-hood-cod--ok';
}

function CodBadge({ cod }: { cod: number | null | undefined }) {
  if (cod == null) {
    return <span style={{ fontSize: '0.75rem', color: 'var(--sf-subtle)' }}>n/a</span>;
  }
  return <span className={`sf-hood-cod-badge ${codClass(cod)}`}>{fmtStat(cod)}</span>;
}

function QualPct({ qualified, total }: { qualified: number; total: number }) {
  if (total === 0) return <span style={{ color: 'var(--sf-subtle)' }}>—</span>;
  const pct = (qualified / total) * 100;
  const cls = pct >= 60 ? 'sf-hood-pct--ok' : pct >= 35 ? 'sf-hood-pct--warn' : 'sf-hood-pct--low';
  return (
    <span className={`sf-hood-pct ${cls}`}>
      {qualified.toLocaleString()} <span style={{ opacity: 0.6 }}>/ {total.toLocaleString()}</span>
      <span style={{ marginLeft: 6 }}>({pct.toFixed(0)}%)</span>
    </span>
  );
}

export function NeighborhoodViewPanel() {
  const hoodStats    = useSalesForgeStore((s) => s.hoodStats);
  const statsLoading = useSalesForgeStore((s) => s.hoodStatsLoading);
  const statsError   = useSalesForgeStore((s) => s.hoodStatsError);
  const fetchHoodStats = useSalesForgeStore((s) => s.fetchHoodStats);
  const committedFilters = useSalesForgeStore((s) => s.committedFilters);
  const setFilterForm  = useSalesForgeStore((s) => s.setFilterForm);
  const applyFilters   = useSalesForgeStore((s) => s.applyFilters);
  const setActiveTab   = useSalesForgeStore((s) => s.setActiveTab);

  useEffect(() => {
    void fetchHoodStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedFilters]);

  const rows: HoodStat[] = hoodStats?.hoods ?? [];

  // Sort: COD descending (worst equity first), then nulls last
  const sorted = rows.slice().sort((a, b) => {
    if (a.cod == null && b.cod == null) return (b.totalCount - a.totalCount);
    if (a.cod == null) return 1;
    if (b.cod == null) return -1;
    return b.cod - a.cod;
  });

  const handleHoodClick = (hood: string) => {
    setFilterForm({ hood });
    applyFilters();
    setActiveTab('queue');
  };

  return (
    <div className="sf-main">
      <div className="sf-ratio-audit-toolbar">
        <span style={{ fontSize: '0.8125rem', color: 'var(--sf-muted)' }}>
          {sorted.length} neighborhoods · sorted by COD (worst first)
        </span>
        <button
          type="button"
          className="sf-btn sf-btn--ghost"
          style={{ fontSize: '0.75rem', padding: '3px 10px' }}
          onClick={() => void fetchHoodStats()}
          disabled={statsLoading}
        >
          {statsLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {statsLoading && !hoodStats && (
        <div className="sf-state" role="status">Loading neighborhood data…</div>
      )}
      {statsError && (
        <div className="sf-state sf-state--error" role="alert">{statsError}</div>
      )}
      {hoodStats?.hoodDataGap && (
        <div className="sf-null-alert" role="alert" style={{ margin: '12px 0' }}>
          <strong>⚠ Data gap:</strong> {hoodStats.hoodDataGapAlert}
          <span style={{ display: 'block', marginTop: 4, fontSize: '0.75rem', opacity: 0.7 }}>
            IAAO stats are available in the Running Stats rail. Neighborhood breakdown requires a data re-sync to populate neighborhood codes.
          </span>
        </div>
      )}
      {!statsLoading && sorted.length === 0 && !statsError && (
        <div className="sf-state">No neighborhood data for current filter window.</div>
      )}

      {sorted.length > 0 && (
        <div className="sf-table-scroll">
          <div className="sf-hood-table" role="table" aria-label="Neighborhood equity view">
            <div className="sf-row sf-row--head" role="row">
              <span className="sf-cell" role="columnheader">Neighborhood</span>
              <span className="sf-cell sf-cell--num" role="columnheader">Total sales</span>
              <span className="sf-cell sf-cell--num" role="columnheader">Qual / Total</span>
              <span className="sf-cell sf-cell--num" role="columnheader">Pending</span>
              <span className="sf-cell sf-cell--num" role="columnheader">Median ratio</span>
              <span className="sf-cell sf-cell--num" role="columnheader">COD</span>
              <span className="sf-cell" role="columnheader">Equity status</span>
              <span className="sf-cell" role="columnheader">Action</span>
            </div>

            {sorted.map((row) => {
              const cod = row.cod;
              const codStatus = cod == null
                ? 'Insufficient data'
                : cod < 15 ? '✓ IAAO passing'
                : cod < 20 ? '⚠ Above IAAO threshold'
                : '✗ Critical — review needed';
              const statusCls = cod == null ? ''
                : cod < 15 ? 'sf-hood-status--ok'
                : cod < 20 ? 'sf-hood-status--warn'
                : 'sf-hood-status--critical';

              return (
                <div
                  key={row.hood}
                  className="sf-row sf-row--data sf-row--hood"
                  role="row"
                >
                  <span className="sf-cell" role="cell">
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{row.hood}</span>
                  </span>
                  <span className="sf-cell sf-cell--num" role="cell">
                    {fmtNum(row.totalCount)}
                  </span>
                  <span className="sf-cell sf-cell--num" role="cell">
                    <QualPct qualified={row.qualifiedCount} total={row.totalCount} />
                  </span>
                  <span className="sf-cell sf-cell--num" role="cell">
                    {fmtNum(row.pendingCount)}
                  </span>
                  <span className="sf-cell sf-cell--num" role="cell">
                    {fmtRatio(row.medianRatio)}
                  </span>
                  <span className="sf-cell sf-cell--num" role="cell">
                    <CodBadge cod={cod} />
                  </span>
                  <span className={`sf-cell sf-hood-status ${statusCls}`} role="cell">
                    {codStatus}
                  </span>
                  <span className="sf-cell" role="cell">
                    <button
                      type="button"
                      className="sf-btn sf-btn--ghost"
                      style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                      onClick={() => handleHoodClick(row.hood)}
                      title={`Filter queue to neighborhood ${row.hood}`}
                    >
                      Open queue →
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COD legend */}
      <div className="sf-cod-legend">
        <span style={{ fontSize: '0.75rem', color: 'var(--sf-muted)', marginRight: 16 }}>COD thresholds:</span>
        <span className="sf-hood-cod-badge sf-hood-cod--ok" style={{ marginRight: 8 }}>&lt;15 IAAO passing</span>
        <span className="sf-hood-cod-badge sf-hood-cod--warn" style={{ marginRight: 8 }}>15–20 warning</span>
        <span className="sf-hood-cod-badge sf-hood-cod--critical">&gt;20 critical</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--sf-subtle)', marginLeft: 16 }}>
          · n/a = fewer than 5 qualified sales
        </span>
      </div>
    </div>
  );
}
