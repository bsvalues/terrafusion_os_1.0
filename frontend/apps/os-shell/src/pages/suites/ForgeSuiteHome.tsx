/**
 * TerraFusion OS — TerraForge Suite Home
 *
 * TerraForge launcher posture is governed by the current Suite layer contract:
 * Temporary shells outside County Studio remain bounded launch surfaces.
 * County Studio is the countywide workbench; Atlas is its embedded/pop-out
 * spatial surface; GeoForge remains internal compatibility infrastructure.
 *
 * The PRIMARY_MODULES and SECONDARY_MODULES arrays below define the v1
 * TerraForge app list. This list was verified correct at commit 8da26658a.
 *
 * IF THIS FILE LOOKS WRONG (wrong apps, wrong labels, wrong grouping):
 *   git checkout 8da26658a -- frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx
 *
 * DO NOT rewrite the module list from memory or "fix" it by editing.
 * Restore from git. That is the only correct action.
 *
 * Verified layout (matches screenshot from 2026-04-09):
 *   PRIMARY   : CostForge (cost approach, AppFrame → port 5002)
 *               CompsForge (sales comparison, standalone React module)
 *               IncomeForge (income approach, live)
 *   SPECIALIST: Batch Cost Runs (batch execution)
 *               Regression Studio / TerraGAMA / Coefficient Preview live
 *   DEFAULT ANALYTICS: County Studio (study-anchored Operational Health +
 *                      Statistics Compat + VEI exploration)
 */
import { useCallback, useState } from 'react';
import { invokeTool } from '../../api/pilotApi';
import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import type { WorkbenchTabSlug } from '../../contracts/workbench';
import { useCountyStats } from '../../hooks/useCountyStats';
import { activateModule } from '../../orchestration/moduleActivation';
import { usePropertyStore } from '../../stores/propertyStore';
import { SaleQualificationQueue } from './SaleQualificationQueue';
import { CompsPoolBrowser } from './CompsPoolBrowser';
import './ForgeSuiteHome.css';

type LaunchMode = 'standalone' | 'workbench';
type TruthState = 'live' | 'queued';

interface ForgeModuleDef {
  id: string;
  label: string;
  description: string;
  priority: 'primary' | 'secondary';
  launchMode: LaunchMode;
  chipLabel?: string;
  truthState?: TruthState;
  workbenchTab?: WorkbenchTabSlug;
  moduleId?: string;
}

interface CountyFindingSummary {
  findingType: string;
  severity: string;
  recommendedAction: string;
  correlationId: string;
}

interface MorningBriefSummary {
  role: string;
  queueType: string;
  priority: string;
  dueWindow: string;
  recommendedTool: string;
  readyToAct: boolean;
  blockingDependencies: string[];
  findings: CountyFindingSummary[];
}

interface CountyImpactPreview {
  prdBefore: number;
  prdAfter: number;
  codBefore: number;
  codAfter: number;
  avDelta: number;
  fairnessDelta: number;
}

interface CountyDiagnosticsSummary {
  metrics: CountyImpactPreview;
  readyForSignoff: boolean;
  narrative: string;
}

interface CalibrationMemoSummary {
  payloadRef: string;
  sections: string[];
  summary: string;
}

const PRIMARY_MODULES: readonly ForgeModuleDef[] = [
  {
    id: 'costforge',
    label: 'CostForge',
    description:
      'County-wide cost approach — replacement cost schedules, depreciation tables, land schedules, and RCNLD',
    priority: 'primary',
    launchMode: 'standalone',
    moduleId: 'costforge',
    chipLabel: 'Cost approach',
  },
  {
    id: 'comps-forge',
    label: 'CompsForge',
    description:
      'County-wide sales comparison — adjustment grid studio, paired-sales analysis, and market-derived time trends',
    priority: 'primary',
    launchMode: 'standalone',
    moduleId: 'comps-forge',
    chipLabel: 'Sales comparison',
  },
  {
    id: 'income-forge',
    label: 'IncomeForge',
    description:
      'County-wide income approach — cap rates, NOI modeling, and rent schedules for commercial properties',
    priority: 'primary',
    launchMode: 'standalone',
    moduleId: 'income-forge',
    chipLabel: 'Income approach',
  },
  {
    id: 'sales-forge',
    label: 'SalesForge',
    description:
      'Sale qualification & ratio audit — qualify sales, audit WAC codes, review IAAO stats, and export DOR-certified study',
    priority: 'primary',
    launchMode: 'standalone',
    moduleId: 'sales-forge',
    chipLabel: 'Sale qualification',
  },
  {
    id: 'cuforge',
    label: 'CUForge',
    description:
      'Current Use Program — DFL/CUFA/CUOS/CUTL enrollment, RCW 84.34.108 rollback calculator, DOR interest rates, and removal proceedings',
    priority: 'primary',
    launchMode: 'standalone',
    moduleId: 'cuforge',
    chipLabel: 'Current use',
  },
] as const;

const SECONDARY_MODULES: readonly ForgeModuleDef[] = [
  {
    id: 'batch-cost-run',
    label: 'Batch Cost Runs',
    description: 'County-wide cost model runs with strata, neighborhood, and class filters',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'batch-cost-run',
    chipLabel: 'Batch execution',
  },
  {
    id: 'regression-studio',
    label: 'Regression Studio',
    description: 'MRA regression models with R² diagnostics for market modeling',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'regression-studio',
    chipLabel: 'Live regression',
  },
  {
    id: 'terra-gama',
    label: 'TerraGAMA',
    description: 'Geospatial automated mass appraisal with spatial lag models',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'terra-gama',
    chipLabel: 'Live spatial',
  },
  {
    id: 'coefficient-preview',
    label: 'Coefficient Preview',
    description: 'Live preview of adjustment coefficients before table publication',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'coefficient-preview',
    chipLabel: 'Live preview',
  },
] as const;

const fmtNum = (n: number | undefined | null) => (n != null ? n.toLocaleString() : '—');
const fmtCurrency = (n: number | undefined | null) => (n != null ? `$${n.toLocaleString()}` : '—');

function getSourceDisclosure(source: 'snapshot' | 'fixtures' | 'live' | null): string | null {
  if (source === 'snapshot') {
    return 'Snapshot-backed county aggregates: TerraForge stats are using bundled county snapshot data, not live backend metrics.';
  }
  if (source === 'fixtures') {
    return 'Non-live county aggregate mode is active; TerraForge stats are not live backend metrics.';
  }
  return null;
}

function getLaunchLabel(mod: ForgeModuleDef): string {
  if (mod.truthState === 'queued') {
    return 'Queued surface';
  }
  if (mod.launchMode === 'workbench') {
    return mod.workbenchTab === 'dais' ? 'Opens TerraDais workbench' : 'Opens Property Workbench';
  }
  return 'Launches in window';
}

export default function ForgeSuiteHome() {
  const { stats, loading, error, source } = useCountyStats();
  const activeParcel = usePropertyStore((s) => s.activeParcel);
  const recentParcels = usePropertyStore((s) => s.recentParcels);
  const sourceDisclosure = getSourceDisclosure(source);
  const [briefState, setBriefState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; result?: MorningBriefSummary; correlationId?: string; error?: string }>({ status: 'idle' });
  const [diagnosticsState, setDiagnosticsState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; result?: CountyDiagnosticsSummary; correlationId?: string; error?: string }>({ status: 'idle' });
  const [memoState, setMemoState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; result?: CalibrationMemoSummary; correlationId?: string; error?: string }>({ status: 'idle' });

  // KPI values from /api/terraforge/county-stats when the provider is live.
  const fmt = (n: number | undefined, style: 'decimal' | 'currency' | 'percent', decimals = 0) => {
    if (n === undefined || n === null) return '—';
    if (style === 'currency') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: decimals }).format(n);
    if (style === 'percent') return `${n.toFixed(1)}%`;
    return new Intl.NumberFormat('en-US').format(n);
  };
  const kpiMetrics = [
    { label: 'TOTAL PARCELS',      value: loading ? '…' : fmt(stats?.totalParcels,             'decimal'),   tone: 'neutral'  },
    { label: 'AVG ASSESSED',       value: loading ? '…' : fmt(stats?.averageAssessedValue,      'currency'),  tone: 'neutral'  },
    { label: 'ASSESSED THIS YEAR', value: loading ? '…' : fmt(stats?.assessedThisYear,          'decimal'),   tone: 'neutral'  },
    { label: 'PENDING',            value: loading ? '…' : fmt(stats?.pendingAssessments,        'decimal'),   tone: 'warn'     },
    { label: 'COMPLETION',         value: loading ? '…' : (stats ? fmt(stats.assessmentCompletionPercent, 'percent') : '—'), tone: 'success' },
  ] as const;

  const handleModuleLaunch = (mod: ForgeModuleDef) => {
    if (mod.truthState === 'queued') {
      return;
    }

    if (mod.launchMode === 'workbench') {
      if (!mod.workbenchTab) {
        return;
      }
      const parcelId = activeParcel?.parcelId;
      void activateModule('property-workbench', {
        source: 'system',
        metadata: { tab: mod.workbenchTab, ...(parcelId ? { parcelId } : {}) },
      });
      return;
    }

    const targetId = mod.moduleId ?? mod.id;
    void activateModule(targetId, { source: 'system' });
  };

  const handleParcelOpen = (parcelId: string) => {
    void activateModule('property-workbench', {
      source: 'system',
      metadata: { parcelId },
    });
  };

  const parseToolOutput = <T,>(output: unknown, fallback: T): T => {
    try {
      return typeof output === 'string' ? JSON.parse(output) as T : output as T;
    } catch {
      return fallback;
    }
  };

  const handleRefreshBrief = useCallback(async () => {
    setBriefState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'generate_morning_brief',
        params: { county: 'benton', taxYear: 2026, role: 'chief_appraiser' },
      });
      if (response.success && response.result) {
        const parsed = parseToolOutput<MorningBriefSummary>(response.result.output, {
          role: 'chief_appraiser',
          queueType: 'calibration_review',
          priority: 'medium',
          dueWindow: 'next business day',
          recommendedTool: 'propose_rate_adjustment',
          readyToAct: false,
          blockingDependencies: [],
          findings: [],
        });
        setBriefState({ status: 'success', result: parsed, correlationId: response.correlationId });
      } else {
        setBriefState({ status: 'error', correlationId: response.correlationId, error: response.error?.message || 'Failed to load county briefing.' });
      }
    } catch (toolError) {
      setBriefState({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: toolError instanceof Error ? toolError.message : 'Failed to load county briefing.',
      });
    }
  }, []);

  const handleRunDiagnostics = useCallback(async () => {
    setDiagnosticsState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'rerun_ratio_study',
        params: { county: 'benton', taxYear: 2026, draftVersion: 'benton-2026-working', scope: 'county' },
      });
      if (response.success && response.result) {
        const parsed = parseToolOutput<CountyDiagnosticsSummary>(response.result.output, {
          metrics: { prdBefore: 0, prdAfter: 0, codBefore: 0, codAfter: 0, avDelta: 0, fairnessDelta: 0 },
          readyForSignoff: false,
          narrative: 'No county diagnostics returned.',
        });
        setDiagnosticsState({ status: 'success', result: parsed, correlationId: response.correlationId });
      } else {
        setDiagnosticsState({ status: 'error', correlationId: response.correlationId, error: response.error?.message || 'Failed to run county diagnostics.' });
      }
    } catch (toolError) {
      setDiagnosticsState({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: toolError instanceof Error ? toolError.message : 'Failed to run county diagnostics.',
      });
    }
  }, []);

  const handleDraftBoardMemo = useCallback(async () => {
    setMemoState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'generate_calibration_memo',
        params: { county: 'benton', draftVersion: 'benton-2026-working', audience: 'board', reasonCode: 'annual_certification' },
        confirmation: { confirmed: true, reasonCode: 'annual_certification' },
      });
      if (response.success && response.result) {
        const parsed = parseToolOutput<CalibrationMemoSummary>(response.result.output, {
          payloadRef: '',
          sections: [],
          summary: 'No calibration memo returned.',
        });
        setMemoState({ status: 'success', result: parsed, correlationId: response.correlationId });
      } else {
        setMemoState({ status: 'error', correlationId: response.correlationId, error: response.error?.message || 'Failed to draft board memo.' });
      }
    } catch (toolError) {
      setMemoState({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: toolError instanceof Error ? toolError.message : 'Failed to draft board memo.',
      });
    }
  }, []);

  return (
    <div data-testid="suite-forge-root" className="forge-workspace h-full flex flex-col">
      <ParcelContextBanner suiteTabId="forge" />

      <main className="forge-workspace__viewport">
        <div className="forge-workspace__stage">
          <header className="forge-workspace__header">
            <div>
              <p className="forge-workspace__eyebrow">TerraForge · County valuation workspace</p>
              <h1 className="forge-workspace__title">TerraForge</h1>
              <p className="forge-workspace__subtitle">County valuation operations, model review, and evidence-ready assessment workflows.</p>
            </div>
            <div className="forge-workspace__status">
              <span className="forge-chip forge-chip--neutral">Layer 2 Workspace</span>
              <span className={`forge-chip ${source === 'live' ? 'forge-chip--success' : 'forge-chip--warn'}`}>
                {source === 'live' ? 'Live metrics' : 'Snapshot-backed'}
              </span>
            </div>
          </header>

          {sourceDisclosure && (
            <div data-testid="forge-source-disclosure" role="status" className="forge-workspace__notice forge-workspace__notice--warn">
              {sourceDisclosure}
            </div>
          )}
          {loading && !stats && (
            <div data-testid="forge-loading" role="status" className="forge-workspace__notice">
              Loading county metrics…
            </div>
          )}
          {error && (
            <div data-testid="forge-error" role="alert" className="forge-workspace__notice forge-workspace__notice--error">
              {error}
            </div>
          )}

          <section data-testid="forge-stats" className="forge-kpi-grid">
            {kpiMetrics.map(({ label, value, tone }) => (
              <div key={label} className="forge-kpi-cell">
                <div className="forge-kpi-cell__label">{label}</div>
                <div className={`forge-kpi-cell__value forge-kpi-cell__value--${tone}`}>{value}</div>
              </div>
            ))}
          </section>

          <section className="forge-panel" data-testid="forge-calibration-desk">
            <div className="forge-panel__header">
              <div>
                <p className="forge-panel__eyebrow">County Calibration Desk</p>
                <h2 className="forge-panel__title">County calibration posture</h2>
              </div>
            </div>

            <div className="forge-ops-grid">
              <div className="forge-ops-card">
                <div className="forge-ops-card__head">
                  <div>
                    <div className="forge-ops-card__title">Morning Brief</div>
                    <div className="forge-ops-card__sub">Ranked findings and recommended next action for Benton County valuation review.</div>
                  </div>
                  <button type="button" className="forge-ops-btn" onClick={handleRefreshBrief} disabled={briefState.status === 'loading'}>
                    {briefState.status === 'loading' ? 'Refreshing…' : 'Refresh Brief'}
                  </button>
                </div>
                {briefState.status === 'success' && briefState.result && (
                  <div className="forge-ops-body">
                    <div className="forge-ops-metrics">
                      <div className="forge-ops-metric">
                        <span className="forge-ops-metric__label">Queue</span>
                        <span className="forge-ops-metric__value">{briefState.result.queueType.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="forge-ops-metric">
                        <span className="forge-ops-metric__label">Priority</span>
                        <span className="forge-ops-metric__value">{briefState.result.priority}</span>
                      </div>
                      <div className="forge-ops-metric">
                        <span className="forge-ops-metric__label">Recommended Tool</span>
                        <span className="forge-ops-metric__value">{briefState.result.recommendedTool.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    {briefState.result.findings.slice(0, 2).map((finding) => (
                      <div key={finding.correlationId} className="forge-ops-finding">
                        <div className="forge-ops-finding__top">
                          <span>{finding.findingType}</span>
                          <span className="forge-chip forge-chip--warn">{finding.severity}</span>
                        </div>
                        <p>{finding.recommendedAction}</p>
                      </div>
                    ))}
                    <div className="forge-ops-foot">
                      <span>{briefState.result.readyToAct ? 'Ready to act' : 'Awaiting dependencies'}</span>
                      {briefState.correlationId && <code>{briefState.correlationId.slice(0, 16)}...</code>}
                    </div>
                  </div>
                )}
                {briefState.status === 'error' && <div className="forge-workspace__notice forge-workspace__notice--error">{briefState.error}</div>}
              </div>

              <div className="forge-ops-card">
                <div className="forge-ops-card__head">
                  <div>
                    <div className="forge-ops-card__title">County Diagnostics Sweep</div>
                    <div className="forge-ops-card__sub">Refresh PRD, COD, AV delta, and signoff posture for the working draft.</div>
                  </div>
                  <button type="button" className="forge-ops-btn" onClick={handleRunDiagnostics} disabled={diagnosticsState.status === 'loading'}>
                    {diagnosticsState.status === 'loading' ? 'Running…' : 'Run Sweep'}
                  </button>
                </div>
                {diagnosticsState.status === 'success' && diagnosticsState.result && (
                  <div className="forge-ops-body">
                    <div className="forge-ops-metrics forge-ops-metrics--compact">
                      <div className="forge-ops-metric">
                        <span className="forge-ops-metric__label">PRD</span>
                        <span className="forge-ops-metric__value">{diagnosticsState.result.metrics.prdBefore.toFixed(3)} → {diagnosticsState.result.metrics.prdAfter.toFixed(3)}</span>
                      </div>
                      <div className="forge-ops-metric">
                        <span className="forge-ops-metric__label">COD</span>
                        <span className="forge-ops-metric__value">{diagnosticsState.result.metrics.codBefore.toFixed(2)} → {diagnosticsState.result.metrics.codAfter.toFixed(2)}</span>
                      </div>
                      <div className="forge-ops-metric">
                        <span className="forge-ops-metric__label">AV Delta</span>
                        <span className="forge-ops-metric__value">{fmtCurrency(diagnosticsState.result.metrics.avDelta)}</span>
                      </div>
                    </div>
                    <p className="forge-ops-note">{diagnosticsState.result.narrative}</p>
                    <div className="forge-ops-foot">
                      <span>{diagnosticsState.result.readyForSignoff ? 'Signoff ready' : 'Further review needed'}</span>
                      {diagnosticsState.correlationId && <code>{diagnosticsState.correlationId.slice(0, 16)}...</code>}
                    </div>
                  </div>
                )}
                {diagnosticsState.status === 'error' && <div className="forge-workspace__notice forge-workspace__notice--error">{diagnosticsState.error}</div>}
              </div>

              <div className="forge-ops-card forge-ops-card--wide">
                <div className="forge-ops-card__head">
                  <div>
                    <div className="forge-ops-card__title">Board Memo Packet</div>
                    <div className="forge-ops-card__sub">Draft the governed board-facing calibration memo and open the supporting Forge applications.</div>
                  </div>
                  <div className="forge-ops-actions">
                    <button type="button" className="forge-ops-btn" onClick={handleDraftBoardMemo} disabled={memoState.status === 'loading'}>
                      {memoState.status === 'loading' ? 'Drafting…' : 'Draft Memo'}
                    </button>
                    <button type="button" className="forge-ops-btn forge-ops-btn--ghost" onClick={() => handleModuleLaunch(PRIMARY_MODULES[0])}>
                      Open CostForge
                    </button>
                    <button
                      type="button"
                      className="forge-ops-btn forge-ops-btn--ghost"
                      onClick={() => handleModuleLaunch({
                        id: 'county-studio',
                        label: 'County Studio',
                        description: '',
                        priority: 'primary',
                        launchMode: 'standalone',
                        moduleId: 'county-studio',
                      })}
                    >
                      Open County Studio
                    </button>
                  </div>
                </div>
                {memoState.status === 'success' && memoState.result && (
                  <div className="forge-ops-body">
                    <p className="forge-ops-note">{memoState.result.summary}</p>
                    <div className="forge-ops-tags">
                      {memoState.result.sections.map((section) => (
                        <span key={section} className="forge-chip forge-chip--neutral">{section}</span>
                      ))}
                    </div>
                    <div className="forge-ops-foot">
                      <span>{memoState.result.payloadRef || 'Payload pending'}</span>
                      {memoState.correlationId && <code>{memoState.correlationId.slice(0, 16)}...</code>}
                    </div>
                  </div>
                )}
                {memoState.status === 'error' && <div className="forge-workspace__notice forge-workspace__notice--error">{memoState.error}</div>}
              </div>
            </div>
          </section>

          <section className="forge-panel" data-testid="forge-primary-applications">
            <div className="forge-panel__header">
              <div>
                <p className="forge-panel__eyebrow">Primary Applications</p>
                <h2 className="forge-panel__title">County-wide valuation scenes</h2>
              </div>
            </div>
            <div className="forge-primary-grid">
              {PRIMARY_MODULES.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  className="forge-card forge-card--primary"
                  onClick={() => handleModuleLaunch(mod)}
                  disabled={mod.truthState === 'queued'}
                >
                  <div className="forge-card__rail">
                    {mod.chipLabel && <span className="forge-chip forge-chip--neutral">{mod.chipLabel}</span>}
                    <span className="forge-card__foot">{getLaunchLabel(mod)}</span>
                  </div>
                  <div className="forge-card__title">{mod.label}</div>
                  <p className="forge-card__description">{mod.description}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Secondary / Specialist Applications */}
          <section className="forge-panel" data-testid="forge-secondary-applications">
            <div className="forge-panel__header">
              <div>
                <p className="forge-panel__eyebrow">Specialist Valuation Tools</p>
                <h2 className="forge-panel__title">Focused model review and batch operations</h2>
              </div>
            </div>
            <div className="forge-primary-grid">
              {SECONDARY_MODULES.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  className="forge-card forge-card--secondary"
                  onClick={() => handleModuleLaunch(mod)}
                  disabled={mod.truthState === 'queued'}
                >
                  <div className="forge-card__rail">
                    {mod.chipLabel && <span className="forge-chip forge-chip--neutral">{mod.chipLabel}</span>}
                    <span className="forge-card__foot">{getLaunchLabel(mod)}</span>
                  </div>
                  <div className="forge-card__title">{mod.label}</div>
                  <p className="forge-card__description">{mod.description}</p>
                </button>
              ))}
            </div>
          </section>

          {/* County Studio — segment-first countywide valuation workspace */}
          <section className="forge-panel" data-testid="forge-county-applications">
            <div className="forge-panel__header">
              <div>
                <p className="forge-panel__eyebrow">County Operations</p>
                <h2 className="forge-panel__title">County Studio · Analysis, Scenario, Defense</h2>
              </div>
            </div>
            <button
              type="button"
              className="forge-card forge-card--primary"
              style={{ width: '100%', textAlign: 'left' }}
              onClick={() => handleModuleLaunch({ id: 'county-studio', label: 'County Studio', description: '', priority: 'primary', launchMode: 'standalone', moduleId: 'county-studio' })}
            >
              <div className="forge-card__rail">
                <span className="forge-chip forge-chip--neutral">Default analytics workbench</span>
                <span className="forge-card__foot">County → Reval Area → Neighborhood → Segment</span>
              </div>
              <div className="forge-card__title">County Studio</div>
              <p className="forge-card__description">
                The countywide operating workspace for valuation analysis, Operational Health, Statistics Compat,
                embedded spatial review, cohort creation, scenario preview, correction routing, and evidence defense.
                Atlas map review opens inside County Studio or as a pop-out for the same study session; governed
                approval and publish remain downstream workflow steps.
              </p>
            </button>
          </section>

          {/* Slice 1.4 — county-wide sale qualification queue */}
          <SaleQualificationQueue />

          {/* Slice 1.6 — qualified comps pool browser */}
          <CompsPoolBrowser />


          <section className="forge-panel" data-testid="forge-queue">
            <div className="forge-panel__header">
              <div>
                <p className="forge-panel__eyebrow">Operational Queue</p>
                <h2 className="forge-panel__title">Recent parcels</h2>
              </div>
            </div>

            {recentParcels.length === 0 ? (
              <div className="forge-queue forge-queue--empty">No recent parcel activity.</div>
            ) : (
              <div className="forge-queue">
                {recentParcels.slice(0, 8).map((parcel) => (
                  <button
                    key={parcel.parcelId}
                    type="button"
                    className="forge-queue__row"
                    onClick={() => handleParcelOpen(parcel.parcelId)}
                  >
                    <div className="forge-queue__identity">
                      <div className="forge-queue__address">{parcel.address}</div>
                      <div className="forge-queue__meta">
                        {parcel.parcelId} · {parcel.city}
                      </div>
                    </div>
                    <div className="forge-queue__value">{fmtCurrency(parcel.totalAssessedValue)}</div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
