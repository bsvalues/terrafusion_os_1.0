/**
 * CostForge.tsx
 * Main workspace container — IAAO cost approach module.
 * 8-tab workflow: Triage → Audit → Calibration → Parcel → Depreciation → Data Quality → Schedule → Calc Trace
 * Right stats rail fetches dashboard-stats on mount.
 *
 * Task D2 — receives County Studio Inspector handoff metadata on mount.
 * Supported metadata keys (all optional):
 *   deeplinkQuery: '?stratum=R1&year=2026&segmentId=s1' — raw query; parsed
 *                  as a fallback if pre-split fields are missing.
 *   stratumKey:    string — stored as contextStratumKey for the chip, does
 *                  not auto-apply as a hood filter (stratum != hood code).
 *   taxYear:       number — swaps the tax year selector.
 *   segmentId:     string — drives the "Scoped From" chip.
 *   segmentLabel:  string — human label for the chip.
 */
import React, { Suspense, useEffect, useLayoutEffect, useRef } from 'react';
import activateModule from '@/orchestration/moduleActivation';
import { parseRollupHandoff } from '../shared/rollupHandoff';
import './CostForge.css';
import { getCostForgeCountyBadgeLabel } from './countyScope';
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
  { id: 'parcel',       label: 'Parcel',       title: 'Single-parcel RCNLD with certified BIV display' },
  { id: 'depreciation', label: 'Depreciation', title: 'Certified physical / functional / external depreciation with comparison waterfall' },
  { id: 'data-quality', label: 'Data Quality', title: 'Assessment record quality — missing fields, outlier flags' },
  { id: 'schedule',     label: 'Schedule',     title: 'Certified cost manual reference + batch apply' },
  { id: 'calc-trace',   label: 'Calc Trace',   title: 'RCNLD audit trail — full calculation lineage' },
];

function ActivePanel({ tab }: { tab: CostForgeTab }) {
  switch (tab) {
    case 'triage':       return <TriageTab />;
    case 'hood-audit':   return <NeighborhoodAuditTab />;
    case 'calibration':  return <CalibrationWorkbenchTab />;
    case 'parcel':       return <CostApproachRunner />;
    case 'depreciation': return <DepreciationCalculator />;
    case 'data-quality': return <DataQualityTab />;
    case 'schedule':     return <CostManual />;
    case 'calc-trace':   return <CalcTracePanel />;
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

const TAX_YEARS = [2024, 2025, 2026];

export interface CostForgeProps {
  /**
   * Optional metadata from the shell's window system. Carries County Studio
   * Inspector handoff payload (stratum / year / segmentId / label).
   */
  metadata?: Record<string, unknown>;
}

/** Best-effort parser for the raw backend deeplink query string. */
function parseDeeplinkQuery(raw: unknown): {
  stratum?: string;
  year?: number;
  segmentId?: string;
} {
  if (typeof raw !== 'string' || raw.length === 0) return {};
  try {
    const trimmed = raw.startsWith('?') ? raw.slice(1) : raw;
    const params = new URLSearchParams(trimmed);
    const out: { stratum?: string; year?: number; segmentId?: string } = {};
    const stratum = params.get('stratum');
    if (stratum) out.stratum = stratum;
    const yearStr = params.get('year');
    if (yearStr) {
      const n = Number(yearStr);
      if (Number.isFinite(n)) out.year = n;
    }
    const segmentId = params.get('segmentId');
    if (segmentId) out.segmentId = segmentId;
    return out;
  } catch {
    return {};
  }
}

export default function CostForge({ metadata }: CostForgeProps = {}) {
  const isTerraForgeSuiteRuntime =
    metadata?.launchContext === 'terraforge-suite'
    && metadata?.dataSource === 'terrafusion-api'
    && metadata?.runtimePath === 'costforge-triage';
  const countyBadgeLabel = getCostForgeCountyBadgeLabel();
  const activeTab    = useCostForgeWorkspaceStore((s) => s.activeTab);
  const setActiveTab = useCostForgeWorkspaceStore((s) => s.setActiveTab);
  const fetchStats   = useCostForgeWorkspaceStore((s) => s.fetchDashboardStats);
  const taxYear      = useCostForgeWorkspaceStore((s) => s.taxYear);
  const setTaxYear   = useCostForgeWorkspaceStore((s) => s.setTaxYear);
  const setHandoffContext    = useCostForgeWorkspaceStore((s) => s.setHandoffContext);
  const setSelectedHood      = useCostForgeWorkspaceStore((s) => s.setSelectedHood);
  const contextStratumKey    = useCostForgeWorkspaceStore((s) => s.contextStratumKey);
  const contextSegmentId     = useCostForgeWorkspaceStore((s) => s.contextSegmentId);
  const contextSegmentLabel  = useCostForgeWorkspaceStore((s) => s.contextSegmentLabel);
  const abortRef     = useRef<AbortController | null>(null);
  const handoff = parseRollupHandoff(metadata);

  // ── Consume County Studio handoff metadata before child fetch effects ───
  useLayoutEffect(() => {
    if (!metadata) return;
    const parsed = parseDeeplinkQuery(metadata.deeplinkQuery);
    const stratum = handoff.stratumKey ?? parsed.stratum ?? null;
    const year = handoff.taxYear ?? parsed.year ?? null;
    const segmentId = handoff.segmentId ?? parsed.segmentId ?? null;
    const label = handoff.segmentLabel;

    if (year !== null) setTaxYear(year);
    if (isTerraForgeSuiteRuntime) {
      setHandoffContext(null, null);
      setSelectedHood(null);
      setActiveTab('triage');
      return;
    }
    if (stratum || segmentId) {
      setHandoffContext(stratum, segmentId, label);
    }
    if (handoff.rollupScope === 'neighborhood' && handoff.neighborhoodCode) {
      setSelectedHood(handoff.neighborhoodCode);
      setActiveTab('hood-audit');
    } else if (handoff.rollupScope === 'city') {
      setSelectedHood(null);
      if (!stratum && !segmentId) {
        setActiveTab('triage');
      }
    }
  }, [
    handoff.neighborhoodCode,
    handoff.rollupScope,
    handoff.segmentId,
    handoff.segmentLabel,
    handoff.stratumKey,
    handoff.taxYear,
    isTerraForgeSuiteRuntime,
    metadata,
    setActiveTab,
    setHandoffContext,
    setSelectedHood,
    setTaxYear,
  ]);

  useEffect(() => {
    abortRef.current = new AbortController();
    void fetchStats(abortRef.current.signal);
    return () => { abortRef.current?.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxYear]);  // re-fetch when year changes

  const handleBackToCountyStudio = () => {
    void activateModule('county-studio', {
      source: 'system',
      metadata: contextSegmentId ? { segmentId: contextSegmentId } : undefined,
    });
  };

  return (
    <div className="cf-workspace" data-testid="cf-workspace">
      <header className="cf-header">
        <div className="cf-header__row">
          <div>
            <div className="cf-header__eyebrow">TerraFusion · Cost Approach</div>
            <h1 className="cf-header__title">CostForge</h1>
          </div>
          <div className="cf-header__badges">
            {contextSegmentId && (
              <button
                type="button"
                data-testid="cf-scoped-from-chip"
                data-segment-id={contextSegmentId}
                data-stratum={contextStratumKey ?? ''}
                onClick={handleBackToCountyStudio}
                title="Back to County Studio"
                style={{
                  background: 'hsl(var(--cf-accent, 199 89% 48%) / 0.12)',
                  border: '1px solid hsl(var(--cf-accent, 199 89% 48%) / 0.4)',
                  color: 'var(--cf-accent, hsl(199 89% 48%))',
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← From County Studio · Segment {contextSegmentLabel ?? contextSegmentId}
                {contextStratumKey ? ` · Stratum ${contextStratumKey}` : ''}
              </button>
            )}
            {handoff.rollupScope === 'city' && handoff.city && (
              <span className="forge-chip">City overview · {handoff.city}</span>
            )}
            {handoff.rollupScope === 'neighborhood' && handoff.neighborhoodCode && (
              <span className="forge-chip">
                Neighborhood · {handoff.neighborhoodName ?? handoff.neighborhoodCode}
                {handoff.revalArea !== null ? ` · Reval ${handoff.revalArea}` : ''}
              </span>
            )}
            {isTerraForgeSuiteRuntime && (
              <span className="forge-chip" data-testid="costforge-suite-runtime-badge">
                TerraForge Suite · Benton CostForge triage API
              </span>
            )}
            {/* Tax year selector */}
            <select
              value={taxYear}
              onChange={(e) => setTaxYear(Number(e.target.value))}
              aria-label="Tax year"
              style={{
                background: 'hsl(222 16% 16%)',
                border: '1px solid var(--cf-border)',
                borderRadius: 5,
                color: 'var(--cf-accent)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                padding: '3px 8px',
                cursor: 'pointer',
              }}
            >
              {TAX_YEARS.map((y) => (
                <option key={y} value={y}>{y} Study</option>
              ))}
            </select>
            <span className="forge-chip">{countyBadgeLabel}</span>
          </div>
        </div>
        {handoff.rollupScope === 'city' && handoff.city && (
          <div
            style={{
              padding: '6px 0 2px',
              fontSize: '0.75rem',
              color: 'var(--cf-muted)',
            }}
          >
            City scope from County Studio is triage-only. Counties actually calibrate by reval area and neighborhood, so CostForge stays in the county neighborhood matrix until you drill below the city rollup.
          </div>
        )}
        {handoff.rollupScope === 'neighborhood' && handoff.neighborhoodCode && (
          <div
            style={{
              padding: '6px 0 2px',
              fontSize: '0.75rem',
              color: 'var(--cf-muted)',
            }}
          >
            County Studio handed off neighborhood {handoff.neighborhoodName ?? handoff.neighborhoodCode}
            {handoff.revalArea !== null ? ` in reval ${handoff.revalArea}` : ''}. CostForge opens directly into hood audit because neighborhood and reval area are the operative county cost segments.
          </div>
        )}
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
