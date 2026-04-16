/**
 * CostForge.tsx
 * Main workspace container — IAAO cost approach module.
 * 8-tab workflow: Triage → Audit → Calibration → Parcel → Depreciation → Data Quality → Schedule → Calc Trace
 * Right stats rail fetches dashboard-stats on mount.
 */
import React, { Suspense, useEffect, useRef } from 'react';
import './CostForge.css';
import {
  useCostForgeWorkspaceStore,
  type CostForgeTab,
} from './costForgeWorkspaceStore';

// Workflow tabs (new)
const TriageTab              = React.lazy(() => import('./tabs/TriageTab').then((m) => ({ default: m.TriageTab })));
const NeighborhoodAuditTab   = React.lazy(() => import('./tabs/NeighborhoodAuditTab').then((m) => ({ default: m.NeighborhoodAuditTab })));
const CalibrationWorkbenchTab = React.lazy(() => import('./tabs/CalibrationWorkbenchTab').then((m) => ({ default: m.CalibrationWorkbenchTab })));
const DataQualityTab         = React.lazy(() => import('./tabs/DataQualityTab').then((m) => ({ default: m.DataQualityTab })));

// Existing panels (fixed)
const CostApproachRunner     = React.lazy(() => import('./CostApproachRunner').then((m) => ({ default: m.CostApproachRunner })));
const DepreciationCalculator = React.lazy(() => import('./DepreciationCalculator').then((m) => ({ default: m.DepreciationCalculator })));
const CostManual             = React.lazy(() => import('./CostManual').then((m) => ({ default: m.CostManual })));
const CalcTracePanel         = React.lazy(() => import('./CalcTracePanel').then((m) => ({ default: m.CalcTracePanel })));

const TABS: { id: CostForgeTab; label: string; title: string }[] = [
  { id: 'triage',       label: 'Triage',       title: 'AI priority-ranked neighborhood health — where to start' },
  { id: 'hood-audit',   label: 'Audit',        title: 'Drill-down: parcel spread, vintage root cause, IQR outliers' },
  { id: 'calibration',  label: 'Calibration',  title: 'Mass-adjust with impact simulation — commit the fix' },
  { id: 'parcel',       label: 'Parcel',        title: 'Single-parcel RCNLD with Benton Method BIV display' },
  { id: 'depreciation', label: 'Depreciation', title: 'Physical / functional / external with waterfall bar' },
  { id: 'data-quality', label: 'Data Quality', title: 'PACS gap scanner — missing fields, outlier flags' },
  { id: 'schedule',     label: 'Schedule',     title: 'Cost manual reference + batch apply' },
  { id: 'calc-trace',   label: 'Calc Trace',   title: 'RCNLD audit trail — full calculation lineage' },
];

function ActivePanel({ tab }: { tab: CostForgeTab }) {
  const selectedParcelId = useCostForgeWorkspaceStore((s) => s.selectedParcelId);
  switch (tab) {
    case 'triage':       return <TriageTab />;
    case 'hood-audit':   return <NeighborhoodAuditTab />;
    case 'calibration':  return <CalibrationWorkbenchTab />;
    case 'parcel':       return <CostApproachRunner />;
    case 'depreciation': return <DepreciationCalculator />;
    case 'data-quality': return <DataQualityTab />;
    case 'schedule':     return <CostManual />;
    case 'calc-trace':   return <CalcTracePanel parcelId={selectedParcelId} />;
  }
}

function CostForgeStatsRail() {
  const stats   = useCostForgeWorkspaceStore((s) => s.dashboardStats);
  const loading = useCostForgeWorkspaceStore((s) => s.dashboardLoading);
  const error   = useCostForgeWorkspaceStore((s) => s.dashboardError);
  const fetch   = useCostForgeWorkspaceStore((s) => s.fetchDashboardStats);

  function fmt(n: number | null | undefined, dec = 0): string {
    if (n == null) return '—';
    return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  return (
    <div className="cf-stats-rail" style={{ minWidth: 0 }}>
      <div className="cf-stats-section">
        <div className="cf-stats-heading">Cost Approach Portfolio</div>
        <div className="cf-stats-kpi">
          <span className="cf-stats-kpi__label">Parcels valued</span>
          <span className="cf-stats-kpi__value">{loading ? '…' : fmt(stats?.totalParcels)}</span>
        </div>
        <div className="cf-stats-kpi">
          <span className="cf-stats-kpi__label">Avg cost/sqft</span>
          <span className="cf-stats-kpi__value">
            {loading ? '…' : stats?.avgCostPerSqft != null ? '$' + stats.avgCostPerSqft.toFixed(2) : '—'}
          </span>
        </div>
        <div className="cf-stats-kpi" style={{ borderBottom: 'none' }}>
          <span className="cf-stats-kpi__label">Avg % good</span>
          <span className="cf-stats-kpi__value">
            {loading ? '…' : stats?.avgPctGood != null ? fmt(stats.avgPctGood, 1) + '%' : '—'}
          </span>
        </div>
      </div>

      <div className="cf-stats-section">
        <div className="cf-stats-heading">IAAO Calibration</div>
        <div className="cf-stats-kpi">
          <span className="cf-stats-kpi__label">Wtd median ratio</span>
          <span className="cf-stats-kpi__value">{loading ? '…' : fmt(stats?.weightedMedianRatio, 3)}</span>
        </div>
        <div className="cf-stats-kpi">
          <span className="cf-stats-kpi__label">Avg COD</span>
          <span className={`cf-stats-kpi__value${(stats?.avgCod ?? 0) > 15 ? ' cf-stats-kpi__value--warn' : ''}`}>
            {loading ? '…' : fmt(stats?.avgCod, 1)}
          </span>
        </div>
        <div className="cf-stats-kpi">
          <span className="cf-stats-kpi__label">Hoods out of comp</span>
          <span className={`cf-stats-kpi__value${(stats?.hoodsOutOfCompliance ?? 0) > 0 ? ' cf-stats-kpi__value--alert' : ' cf-stats-kpi__value--ok'}`}>
            {loading ? '…' : fmt(stats?.hoodsOutOfCompliance)}
          </span>
        </div>
        <div className="cf-stats-kpi" style={{ borderBottom: 'none' }}>
          <span className="cf-stats-kpi__label">Qualified sales</span>
          <span className="cf-stats-kpi__value">{loading ? '…' : fmt(stats?.qualifiedSalesCount)}</span>
        </div>
      </div>

      {error && (
        <div style={{ fontSize: '0.75rem', color: 'var(--cf-warn)', padding: '4px 0' }}>{error}</div>
      )}

      <button
        type="button"
        className="cf-btn cf-btn--ghost"
        style={{ width: '100%', marginTop: 4 }}
        onClick={() => void fetch()}
        disabled={loading}
      >
        {loading ? 'Refreshing…' : 'Refresh stats'}
      </button>
    </div>
  );
}

export default function CostForge() {
  const activeTab    = useCostForgeWorkspaceStore((s) => s.activeTab);
  const setActiveTab = useCostForgeWorkspaceStore((s) => s.setActiveTab);
  const fetchStats   = useCostForgeWorkspaceStore((s) => s.fetchDashboardStats);
  const taxYear      = useCostForgeWorkspaceStore((s) => s.taxYear);
  const abortRef     = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current = new AbortController();
    void fetchStats(abortRef.current.signal);
    return () => { abortRef.current?.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="cf-workspace" data-testid="cf-workspace">
      <header className="cf-header">
        <div className="cf-header__row">
          <div>
            <div className="cf-header__eyebrow">TerraFusion · Cost Approach</div>
            <h1 className="cf-header__title">CostForge</h1>
          </div>
          <div className="cf-header__badges">
            <span className="forge-chip">{taxYear} Study</span>
            <span className="forge-chip">Benton County</span>
          </div>
        </div>
        <nav className="cf-tabbar" role="tablist" aria-label="CostForge tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-label={tab.title}
              className={`cf-tab${activeTab === tab.id ? ' cf-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="cf-body">
        <div className="cf-layout">
          <main className="cf-main" role="tabpanel">
            <Suspense fallback={<div className="cf-state">Loading…</div>}>
              <ActivePanel tab={activeTab} />
            </Suspense>
          </main>
          <aside>
            <CostForgeStatsRail />
          </aside>
        </div>
      </div>
    </div>
  );
}
