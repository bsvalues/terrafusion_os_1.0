/**
 * RunningStatsPanel — Live IAAO stats sidebar for SalesForge.
 * Shows qualification counts + median/COD/PRD/PRB as decisions accumulate.
 */

import { useEffect } from 'react';
import { useSalesForgeStore } from '../salesForgeStore';

function fmtCount(n: number): string {
  return n.toLocaleString();
}

function fmtRatio(n: number | null): string {
  return n == null ? '—' : n.toFixed(4);
}

function fmtStat(n: number | null, decimals = 2): string {
  return n == null ? '—' : n.toFixed(decimals);
}

export function RunningStatsPanel() {
  const runningStats  = useSalesForgeStore((s) => s.runningStats);
  const statsLoading  = useSalesForgeStore((s) => s.statsLoading);
  const statsError    = useSalesForgeStore((s) => s.statsError);
  const fetchStats    = useSalesForgeStore((s) => s.fetchRunningStats);
  const committedFilters = useSalesForgeStore((s) => s.committedFilters);

  useEffect(() => {
    void fetchStats();
    // fetchStats is a stable Zustand action reference — safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedFilters]);

  const counts = runningStats?.counts;
  const stats  = runningStats?.stats;
  const iaao   = runningStats?.iaaoCompliant;

  return (
    <div className="sf-stats-rail" style={{ minWidth: 0 }}>
      {/* Counts */}
      <div className="sf-stats-section">
        <div className="sf-stats-heading">Qualification counts</div>
        <div className="sf-stats-kpi">
          <span className="sf-stats-kpi__label">Qualified</span>
          <span className="sf-stats-kpi__value sf-stats-kpi__value--pass">
            {statsLoading ? '…' : fmtCount(counts?.qualified ?? 0)}
          </span>
        </div>
        <div className="sf-stats-kpi">
          <span className="sf-stats-kpi__label">Non-qualified</span>
          <span className="sf-stats-kpi__value sf-stats-kpi__value--warn">
            {statsLoading ? '…' : fmtCount(counts?.nonQualified ?? 0)}
          </span>
        </div>
        <div className="sf-stats-kpi">
          <span className="sf-stats-kpi__label">Pending</span>
          <span className="sf-stats-kpi__value">
            {statsLoading ? '…' : fmtCount(counts?.pending ?? 0)}
          </span>
        </div>
        <div className="sf-stats-kpi">
          <span className="sf-stats-kpi__label">Total window</span>
          <span className="sf-stats-kpi__value">
            {statsLoading ? '…' : fmtCount(counts?.total ?? 0)}
          </span>
        </div>
        <div className="sf-stats-kpi" style={{ borderBottom: 'none' }}>
          <span className="sf-stats-kpi__label">With ratio</span>
          <span className="sf-stats-kpi__value">
            {statsLoading ? '…' : fmtCount(counts?.withRatio ?? 0)}
          </span>
        </div>
      </div>

      {/* IAAO stats */}
      <div className="sf-stats-section">
        <div className="sf-stats-heading">IAAO ratio study</div>
        <div className="sf-stats-kpi">
          <span className="sf-stats-kpi__label">Median ratio</span>
          <span className="sf-stats-kpi__value">
            {statsLoading ? '…' : fmtRatio(stats?.medianRatio ?? null)}
          </span>
        </div>
        {stats?.weightedMeanRatio != null && (
          <div className="sf-stats-kpi">
            <span className="sf-stats-kpi__label">Weighted mean</span>
            <span className="sf-stats-kpi__value">
              {statsLoading ? '…' : fmtRatio(stats.weightedMeanRatio)}
            </span>
          </div>
        )}
        <div className="sf-stats-kpi">
          <span className="sf-stats-kpi__label">COD</span>
          <span className="sf-stats-kpi__value">
            {statsLoading ? '…' : fmtStat(stats?.cod ?? null)}
          </span>
        </div>
        <div className="sf-stats-kpi">
          <span className="sf-stats-kpi__label">PRD</span>
          <span className="sf-stats-kpi__value">
            {statsLoading ? '…' : fmtStat(stats?.prd ?? null, 4)}
          </span>
        </div>
        <div className="sf-stats-kpi" style={{ borderBottom: 'none' }}>
          <span className="sf-stats-kpi__label">PRB</span>
          <span className="sf-stats-kpi__value">
            {statsLoading ? '…' : fmtStat(stats?.prb ?? null, 4)}
          </span>
        </div>
      </div>

      {/* IAAO compliance */}
      <div className="sf-stats-section">
        <div className="sf-stats-heading">IAAO compliance</div>
        {iaao ? (
          <>
            <IaaoRow label="Median (0.90–1.10)" pass={iaao.median} />
            <IaaoRow label="COD (< 15 improved res)" pass={iaao.cod} />
            <IaaoRow label="PRD (0.98–1.03)" pass={iaao.prd} />
            <IaaoRow label="PRB (|x| < 0.05)" pass={iaao.prb} />
          </>
        ) : (
          <div style={{ fontSize: '0.75rem', color: 'var(--sf-muted)' }}>
            {statsLoading ? 'Loading…' : statsError ? '—' : 'No data yet'}
          </div>
        )}
      </div>

      <button
        type="button"
        className="sf-btn sf-btn--ghost"
        style={{ width: '100%', marginTop: 4 }}
        onClick={() => void fetchStats()}
        disabled={statsLoading}
      >
        {statsLoading ? 'Refreshing…' : 'Refresh stats'}
      </button>
    </div>
  );
}

function IaaoRow({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className="sf-iaao-row">
      <span>{label}</span>
      <span className={`sf-iaao-badge ${pass ? 'sf-iaao-badge--pass' : 'sf-iaao-badge--fail'}`}>
        {pass ? '✓' : '✗'}
      </span>
    </div>
  );
}
