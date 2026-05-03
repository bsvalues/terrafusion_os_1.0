/**
 * TerraLevy Dashboard
 *
 * Live levy operations surface backed by the native TerraLevy controllers.
 * No fabricated levy rows or budget cards are rendered here. When a live lane
 * is not yet modeled in TerraLevy, the UI discloses that gap explicitly.
 */

import React, { useEffect, useMemo, useState } from 'react';
import ReferenceComplianceTab from './ReferenceComplianceTab';
import {
  getBentonTaxingDistricts,
  getBudgetScenarios,
  getBudgetVisualization,
  getCertificationSteps,
  getDataQualityRecommendations,
  getDistrictRiskScores,
  getLevyDashboardMetrics,
  getLevyDashboardSummary,
  getLevyDistrictOverview,
  getStatutoryLimits,
  type AiRecommendationsResult,
  type BudgetProjectionRecord,
  type BudgetScenarioEnvelope,
  type BudgetScenarioRecord,
  type BudgetVisualizationEnvelope,
  type CertificationStep,
  type DistrictRiskSummaryResponse,
  type LevyDashboardBudgetSummary,
  type LevyDashboardDistrictOverview,
  type LevyDashboardDistrictOverviewResponse,
  type LevyDashboardMetrics,
  type RiskFlag,
  type StatutoryLimit,
  type TaxingDistrict,
} from '../../services/levyService';

const T = {
  accent: 'hsl(var(--tf-accent))',
  bg: 'hsl(var(--tf-bg))',
  card: 'hsl(var(--tf-card))',
  fg: 'hsl(var(--tf-fg))',
  success: 'hsl(var(--tf-success))',
  warning: 'hsl(var(--tf-warning))',
  danger: 'hsl(var(--tf-destructive))',
  border: 'hsl(var(--tf-fg) / 0.1)',
  muted: 'hsl(var(--tf-fg) / 0.68)',
  dim: 'hsl(var(--tf-fg) / 0.45)',
} as const;

type Tab = 'overview' | 'levies' | 'districts' | 'budget' | 'compliance' | 'ai';
type DashboardStatus = 'idle' | 'loading' | 'ready' | 'partial' | 'error';
type BannerTone = 'info' | 'success' | 'warning' | 'danger';

interface DashboardState {
  status: DashboardStatus;
  error: string | null;
  summary: LevyDashboardBudgetSummary | null;
  metrics: LevyDashboardMetrics | null;
  districtOverview: LevyDashboardDistrictOverviewResponse | null;
  scenarios: BudgetScenarioEnvelope | null;
  visualization: BudgetVisualizationEnvelope | null;
  recommendations: AiRecommendationsResult | null;
  riskSummary: DistrictRiskSummaryResponse | null;
}

const INITIAL_STATE: DashboardState = {
  status: 'idle',
  error: null,
  summary: null,
  metrics: null,
  districtOverview: null,
  scenarios: null,
  visualization: null,
  recommendations: null,
  riskSummary: null,
};

function formatCurrency(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits,
  }).format(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function normalizePercent(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return Math.abs(value) <= 1 ? value * 100 : value;
}

function formatPercent(value: number | null | undefined, digits = 1): string {
  const normalized = normalizePercent(value);
  return normalized == null ? '-' : `${normalized.toFixed(digits)}%`;
}

function riskTone(flag: RiskFlag): BannerTone {
  if (flag === 'critical') {
    return 'danger';
  }

  if (flag === 'warn') {
    return 'warning';
  }

  return 'success';
}

function toneColor(tone: BannerTone): string {
  if (tone === 'success') {
    return T.success;
  }

  if (tone === 'warning') {
    return T.warning;
  }

  if (tone === 'danger') {
    return T.danger;
  }

  return T.accent;
}

function statusLabel(status: DashboardStatus): string {
  if (status === 'ready') {
    return 'Live';
  }

  if (status === 'partial') {
    return 'Partial';
  }

  if (status === 'error') {
    return 'Unavailable';
  }

  return 'Loading';
}

function readSettled<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value : null;
}

function failureMessages(results: ReadonlyArray<PromiseSettledResult<unknown>>): string[] {
  return results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map((result) =>
      result.reason instanceof Error ? result.reason.message : String(result.reason)
    );
}

function SectionCard(props: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.fg }}>{props.title}</div>
        {props.subtitle ? (
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{props.subtitle}</div>
        ) : null}
      </div>
      {props.children}
    </section>
  );
}

function Banner(props: { tone: BannerTone; title: string; children: React.ReactNode }) {
  const color = toneColor(props.tone);
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        background: `${color}14`,
        border: `1px solid ${color}44`,
        color,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{props.title}</div>
      <div style={{ fontSize: 12, color: T.muted }}>{props.children}</div>
    </div>
  );
}

function UnavailablePanel(props: { title: string; message: string }) {
  return (
    <div
      style={{
        padding: 28,
        borderRadius: 12,
        border: `1px dashed ${T.border}`,
        background: 'hsl(var(--tf-fg) / 0.02)',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: T.fg }}>{props.title}</div>
      <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>{props.message}</div>
    </div>
  );
}

function MetricCard(props: { label: string; value: string; detail: string; tone?: BannerTone }) {
  const color = toneColor(props.tone ?? 'info');
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        background: 'hsl(var(--tf-fg) / 0.025)',
      }}
    >
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>{props.label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{props.value}</div>
      <div style={{ fontSize: 12, color: T.dim, marginTop: 6 }}>{props.detail}</div>
    </div>
  );
}

function SourceBadge(props: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 999,
        border: `1px solid ${T.border}`,
        background: 'hsl(var(--tf-fg) / 0.03)',
        color: T.muted,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {props.label}
    </span>
  );
}

export default function TerraLevyDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setState((current) => ({
        ...current,
        status: 'loading',
        error: null,
      }));

      const results = await Promise.allSettled([
        getLevyDashboardSummary(),
        getLevyDashboardMetrics(),
        getLevyDistrictOverview(),
        getBudgetScenarios(),
        getBudgetVisualization(),
        getDataQualityRecommendations(),
        getDistrictRiskScores(),
      ]);

      if (cancelled) {
        return;
      }

      const nextState: DashboardState = {
        status: 'ready',
        error: null,
        summary: readSettled(results[0]),
        metrics: readSettled(results[1]),
        districtOverview: readSettled(results[2]),
        scenarios: readSettled(results[3]),
        visualization: readSettled(results[4]),
        recommendations: readSettled(results[5]),
        riskSummary: readSettled(results[6]),
      };

      const availableCount = [
        nextState.summary,
        nextState.metrics,
        nextState.districtOverview,
        nextState.scenarios,
        nextState.visualization,
        nextState.recommendations,
        nextState.riskSummary,
      ].filter(Boolean).length;
      const failures = failureMessages(results);

      if (availableCount === 0) {
        nextState.status = 'error';
        nextState.error =
          failures[0] ?? 'All TerraLevy live surfaces failed to load.';
      } else if (failures.length > 0) {
        nextState.status = 'partial';
        nextState.error = `${failures.length} live surface(s) failed to load. ${failures[0]}`;
      }

      setState(nextState);
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const displayYear = useMemo(
    () =>
      state.metrics?.taxYear ??
      state.summary?.taxYear ??
      state.districtOverview?.taxYear ??
      state.scenarios?.taxYear ??
      state.visualization?.taxYear ??
      state.riskSummary?.taxYear ??
      null,
    [state],
  );

  const countyLabel = useMemo(
    () =>
      state.metrics?.countyId ??
      state.districtOverview?.districts[0]?.countyId ??
      state.scenarios?.scenarios[0]?.countyId ??
      'latest available county slice',
    [state],
  );

  const liveSurfaceCount = useMemo(
    () =>
      [
        state.summary,
        state.metrics,
        state.districtOverview,
        state.scenarios,
        state.visualization,
        state.recommendations,
        state.riskSummary,
      ].filter(Boolean).length,
    [state],
  );

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(180deg, hsl(var(--tf-bg)) 0%, hsl(var(--tf-bg-secondary, var(--tf-bg))) 100%)`,
        color: T.fg,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ minWidth: 240 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.accent }}>
            TerraLevy
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
            Live levy metrics, district rows, budget scenarios, projections, risk
            signals, and statutory reference surfaces backed by TerraLevy services.
          </p>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <SourceBadge label={`State: ${statusLabel(state.status)}`} />
          <SourceBadge label={`Tax year: ${displayYear ?? 'resolving'}`} />
          <SourceBadge label={`County: ${countyLabel}`} />
          <SourceBadge label={`Live surfaces: ${liveSurfaceCount}/7`} />
        </div>
      </div>

      <div style={{ padding: '16px 24px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Banner tone={state.status === 'error' ? 'danger' : 'info'} title="Surface truth">
          Metrics come from <code>/api/levy/dashboard/*</code>, scenarios from{' '}
          <code>/api/levy/budget/*</code>, and AI/risk signals from{' '}
          <code>/api/levy/v1/data-quality/*</code>. No levy rows or budget cards are
          synthesized in this shell.
        </Banner>

        {state.error ? (
          <Banner tone={state.status === 'error' ? 'danger' : 'warning'} title="Load status">
            {state.error}
          </Banner>
        ) : null}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0,
          padding: '0 24px',
          marginTop: 16,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        {(['overview', 'levies', 'districts', 'budget', 'compliance', 'ai'] as Tab[]).map(
          (entry) => (
            <button
              key={entry}
              onClick={() => setTab(entry)}
              style={{
                padding: '12px 18px',
                border: 'none',
                background: tab === entry ? 'hsl(var(--tf-accent) / 0.08)' : 'transparent',
                borderBottom:
                  tab === entry ? `2px solid ${T.accent}` : '2px solid transparent',
                color: tab === entry ? T.accent : T.muted,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'capitalize',
              }}
            >
              {entry === 'ai'
                ? 'AI and Risk'
                : entry === 'districts'
                  ? 'District Reference'
                  : entry}
            </button>
          ),
        )}
      </div>

      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        {state.status === 'loading' ? (
          <UnavailablePanel
            title="Loading TerraLevy live surfaces"
            message="The dashboard is waiting on live levy endpoints. If this state persists, verify the TerraFusion API is reachable and authenticated."
          />
        ) : null}

        {state.status !== 'loading' && tab === 'overview' ? (
          <OverviewTab
            metrics={state.metrics}
            summary={state.summary}
            districtOverview={state.districtOverview}
            scenarios={state.scenarios}
            visualization={state.visualization}
            riskSummary={state.riskSummary}
          />
        ) : null}

        {state.status !== 'loading' && tab === 'levies' ? (
          <LevyRowsTab districtOverview={state.districtOverview} />
        ) : null}

        {state.status !== 'loading' && tab === 'districts' ? <DistrictsTab /> : null}

        {state.status !== 'loading' && tab === 'budget' ? (
          <BudgetTab
            summary={state.summary}
            scenarios={state.scenarios}
            visualization={state.visualization}
          />
        ) : null}

        {state.status !== 'loading' && tab === 'compliance' ? <ReferenceComplianceTab /> : null}

        {state.status !== 'loading' && tab === 'ai' ? (
          <AiTab
            recommendations={state.recommendations}
            riskSummary={state.riskSummary}
          />
        ) : null}
      </div>
    </div>
  );
}

function OverviewTab(props: {
  metrics: LevyDashboardMetrics | null;
  summary: LevyDashboardBudgetSummary | null;
  districtOverview: LevyDashboardDistrictOverviewResponse | null;
  scenarios: BudgetScenarioEnvelope | null;
  visualization: BudgetVisualizationEnvelope | null;
  riskSummary: DistrictRiskSummaryResponse | null;
}) {
  const activeScenarioCount =
    props.scenarios?.scenarios.filter((scenario) => scenario.isActive).length ?? 0;
  const flaggedDistrictCount =
    props.riskSummary?.districts.filter((district) => district.riskFlag !== 'ok').length ?? 0;
  const leadingDistricts = props.districtOverview?.districts.slice(0, 5) ?? [];

  if (
    !props.metrics &&
    !props.summary &&
    !props.districtOverview &&
    !props.scenarios &&
    !props.visualization &&
    !props.riskSummary
  ) {
    return (
      <UnavailablePanel
        title="No live overview data"
        message="TerraLevy did not return any dashboard, scenario, or risk surfaces for the active slice."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 16,
        }}
      >
        <MetricCard
          label="Levy rows"
          value={String(props.metrics?.totalLevies ?? 0)}
          detail={props.metrics?.source ?? 'No live metric surface'}
        />
        <MetricCard
          label="Total levy amount"
          value={formatCurrency(props.metrics?.totalLevyAmount ?? 0)}
          detail="Active levy rows in the resolved tax year"
          tone="success"
        />
        <MetricCard
          label="Average levy rate"
          value={props.metrics ? props.metrics.averageLevyRate.toFixed(4) : '-'}
          detail="Rate per $1,000 AV"
        />
        <MetricCard
          label="Certified rate"
          value={formatPercent(props.metrics?.certifiedRate)}
          detail="Rows whose district is currently certified"
          tone="success"
        />
        <MetricCard
          label="Active scenarios"
          value={String(activeScenarioCount)}
          detail={props.scenarios?.source ?? 'No live scenario surface'}
          tone="info"
        />
        <MetricCard
          label="Flagged districts"
          value={String(flaggedDistrictCount)}
          detail={props.riskSummary?.provenanceNote ?? 'No live risk surface'}
          tone={flaggedDistrictCount > 0 ? 'warning' : 'success'}
        />
      </div>

      {props.summary ? (
        <Banner
          tone={props.summary.specialistGated ? 'warning' : 'success'}
          title="Budget summary truth"
        >
          {props.summary.specialistGated
            ? props.summary.specialistGateNote
            : `Certified budget categories available: ${props.summary.count}.`}
        </Banner>
      ) : (
        <UnavailablePanel
          title="Budget summary unavailable"
          message="The summary endpoint did not return a response. Budget scenarios and projections may still be available on the Budget tab."
        />
      )}

      <SectionCard
        title="Top levy rows by current amount"
        subtitle="Current district overview ordered by levy amount for the resolved tax year."
      >
        {leadingDistricts.length === 0 ? (
          <UnavailablePanel
            title="No live district overview rows"
            message="The district overview endpoint returned no active levy rows."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {leadingDistricts.map((district) => (
              <div
                key={`${district.levyMeasureId}-${district.districtCode}`}
                style={{
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: 14,
                  background: 'hsl(var(--tf-fg) / 0.02)',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: T.fg }}>
                  {district.districtName}
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                  {district.districtCode} - {district.levyMeasureName}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.accent, marginTop: 12 }}>
                  {formatCurrency(district.levyAmount)}
                </div>
                <div style={{ fontSize: 12, color: T.dim, marginTop: 4 }}>
                  Rate {district.rate.toFixed(4)} / $1,000 AV - Certification {district.certificationStatus}
                </div>
                <div style={{ fontSize: 12, color: T.dim, marginTop: 4 }}>
                  Confidence {formatPercent(district.confidenceScore)} - Utilization {formatPercent(district.utilizationPct)}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {props.visualization ? (
        <SectionCard
          title="Projection coverage"
          subtitle={`Source: ${props.visualization.source}`}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            <MetricCard
              label="Projected net revenue"
              value={formatCurrency(props.visualization.summary.totalProjectedRevenue)}
              detail={`Across ${props.visualization.count} projection row(s)`}
              tone="success"
            />
            <MetricCard
              label="Average collection rate"
              value={formatPercent(props.visualization.summary.averageCollectionRate)}
              detail="Projection summary"
            />
            <MetricCard
              label="Average growth rate"
              value={formatPercent(props.visualization.summary.averageGrowthRate)}
              detail={`Fiscal years: ${props.visualization.summary.fiscalYears.join(', ') || '-'}`}
            />
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

function LevyRowsTab(props: { districtOverview: LevyDashboardDistrictOverviewResponse | null }) {
  const districts = props.districtOverview?.districts ?? [];

  if (!props.districtOverview || districts.length === 0) {
    return (
      <UnavailablePanel
        title="No live levy rows"
        message="The district overview endpoint returned no active levy rows for the resolved tax year."
      />
    );
  }

  return (
    <SectionCard
      title={`Live levy rows (${districts.length})`}
      subtitle={`Source: ${props.districtOverview.source} - generated ${formatDate(props.districtOverview.generatedAt)}`}
    >
      <div style={{ overflow: 'auto', borderRadius: 10, border: `1px solid ${T.border}` }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 12,
            background: 'hsl(var(--tf-fg) / 0.02)',
          }}
        >
          <thead>
            <tr style={{ textAlign: 'left', color: T.muted }}>
              <th style={thStyle}>District</th>
              <th style={thStyle}>Measure</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Rate</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Levy amount</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>AV</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Utilization</th>
              <th style={thStyle}>Certification</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {districts.map((district) => (
              <LevyRow key={`${district.levyMeasureId}-${district.districtCode}`} district={district} />
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function LevyRow(props: { district: LevyDashboardDistrictOverview }) {
  const { district } = props;

  return (
    <tr style={{ borderTop: `1px solid ${T.border}` }}>
      <td style={tdStyle}>
        <div style={{ fontWeight: 700 }}>{district.districtName}</div>
        <div style={{ color: T.dim, fontFamily: 'monospace' }}>{district.districtCode}</div>
      </td>
      <td style={tdStyle}>
        <div>{district.levyMeasureName}</div>
        <div style={{ color: T.dim }}>{district.districtType}</div>
      </td>
      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {district.rate.toFixed(4)}
      </td>
      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {formatCurrency(district.levyAmount)}
      </td>
      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {formatCurrency(district.assessedValue)}
      </td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>{formatPercent(district.utilizationPct)}</td>
      <td style={tdStyle}>
        <span
          style={{
            display: 'inline-flex',
            padding: '3px 8px',
            borderRadius: 999,
            background: `${district.isCertified ? T.success : T.warning}14`,
            border: `1px solid ${district.isCertified ? T.success : T.warning}44`,
            color: district.isCertified ? T.success : T.warning,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {district.certificationStatus}
        </span>
      </td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>{formatPercent(district.confidenceScore)}</td>
    </tr>
  );
}

function BudgetTab(props: {
  summary: LevyDashboardBudgetSummary | null;
  scenarios: BudgetScenarioEnvelope | null;
  visualization: BudgetVisualizationEnvelope | null;
}) {
  const scenarios = props.scenarios?.scenarios ?? [];
  const projections = props.visualization?.projections ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {props.summary ? (
        <Banner
          tone={props.summary.specialistGated ? 'warning' : 'success'}
          title="Budget category status"
        >
          {props.summary.specialistGated
            ? props.summary.specialistGateNote
            : `Certified budget category count: ${props.summary.count}.`}
        </Banner>
      ) : null}

      <SectionCard
        title={`Scenario rows (${scenarios.length})`}
        subtitle={props.scenarios?.source ?? 'Budget scenarios unavailable'}
      >
        {scenarios.length === 0 ? (
          <UnavailablePanel
            title="No persisted levy scenarios"
            message="No live budget scenarios were returned for the resolved tax year."
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {scenarios.map((scenario) => (
              <ScenarioCard key={scenario.scenarioId} scenario={scenario} />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={`Projection rows (${projections.length})`}
        subtitle={props.visualization?.source ?? 'Budget projections unavailable'}
      >
        {projections.length === 0 ? (
          <UnavailablePanel
            title="No persisted revenue projections"
            message="The projection endpoint returned no rows for the resolved tax year."
          />
        ) : (
          <div style={{ overflow: 'auto', borderRadius: 10, border: `1px solid ${T.border}` }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 12,
                background: 'hsl(var(--tf-fg) / 0.02)',
              }}
            >
              <thead>
                <tr style={{ textAlign: 'left', color: T.muted }}>
                  <th style={thStyle}>Scenario</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Fiscal year</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Projected levy</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Net revenue</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Collection</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Growth</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {projections.map((projection) => (
                  <ProjectionRow
                    key={`${projection.scenarioId}-${projection.fiscalYear}`}
                    projection={projection}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function ScenarioCard(props: { scenario: BudgetScenarioRecord }) {
  const { scenario } = props;

  return (
    <div
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: 16,
        background: 'hsl(var(--tf-fg) / 0.02)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{scenario.scenarioName}</div>
          <div style={{ fontSize: 12, color: T.muted }}>
            {scenario.scenarioType} - {scenario.levyMeasureName}
          </div>
        </div>
        <span
          style={{
            display: 'inline-flex',
            height: 'fit-content',
            padding: '3px 8px',
            borderRadius: 999,
            background: `${scenario.isActive ? T.success : T.warning}14`,
            border: `1px solid ${scenario.isActive ? T.success : T.warning}44`,
            color: scenario.isActive ? T.success : T.warning,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {scenario.isActive ? 'active' : 'inactive'}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginTop: 14,
        }}
      >
        <ScenarioMetric label="Levy rate" value={scenario.levyRate.toFixed(4)} />
        <ScenarioMetric
          label="Calculated amount"
          value={formatCurrency(scenario.calculatedAmount)}
        />
        <ScenarioMetric
          label="Projected revenue"
          value={formatCurrency(scenario.projectedRevenue)}
        />
        <ScenarioMetric
          label="Collection rate"
          value={formatPercent(scenario.collectionRate)}
        />
      </div>

      <div style={{ fontSize: 12, color: T.dim, marginTop: 12 }}>
        Confidence {formatPercent(scenario.confidenceScore)} - Created{' '}
        {formatDate(scenario.createdAt)}
      </div>
    </div>
  );
}

function ScenarioMetric(props: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: T.dim }}>{props.label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{props.value}</div>
    </div>
  );
}

function ProjectionRow(props: { projection: BudgetProjectionRecord }) {
  const { projection } = props;

  return (
    <tr style={{ borderTop: `1px solid ${T.border}` }}>
      <td style={tdStyle}>{projection.scenarioName}</td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>{projection.fiscalYear}</td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>
        {formatCurrency(projection.projectedLevyAmount)}
      </td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>
        {formatCurrency(projection.projectedNetRevenue)}
      </td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>
        {formatPercent(projection.projectedCollectionRate)}
      </td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>
        {formatPercent(projection.growthRate)}
      </td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>
        {formatPercent(projection.confidenceLevel)}
      </td>
    </tr>
  );
}

function AiTab(props: {
  recommendations: AiRecommendationsResult | null;
  riskSummary: DistrictRiskSummaryResponse | null;
}) {
  const criticalCount =
    props.riskSummary?.districts.filter((district) => district.riskFlag === 'critical').length ??
    0;
  const warningCount =
    props.riskSummary?.districts.filter((district) => district.riskFlag === 'warn').length ?? 0;
  const healthyCount =
    props.riskSummary?.districts.filter((district) => district.riskFlag === 'ok').length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 16,
        }}
      >
        <MetricCard
          label="Critical districts"
          value={String(criticalCount)}
          detail={props.riskSummary?.provenanceNote ?? 'No risk summary'}
          tone={criticalCount > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          label="Warning districts"
          value={String(warningCount)}
          detail="Districts approaching policy or data thresholds"
          tone={warningCount > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          label="Healthy districts"
          value={String(healthyCount)}
          detail="Risk summary rows currently flagged ok"
          tone="success"
        />
      </div>

      <SectionCard
        title="AI recommendations"
        subtitle={props.recommendations?.source ?? 'Recommendation surface unavailable'}
      >
        {!props.recommendations ? (
          <UnavailablePanel
            title="No AI recommendation surface"
            message="The AI recommendation endpoint did not return a payload."
          />
        ) : props.recommendations.recommendations.length === 0 ? (
          <UnavailablePanel
            title="No recommendations returned"
            message={
              props.recommendations.error ??
              'The recommendation endpoint returned successfully but produced no current recommendations.'
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {props.recommendations.recommendations.map((recommendation) => {
              const tone =
                recommendation.priority === 'high'
                  ? 'danger'
                  : recommendation.priority === 'medium'
                    ? 'warning'
                    : 'info';

              return (
                <div
                  key={`${recommendation.focusArea}-${recommendation.title}`}
                  style={{
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    padding: 16,
                    background: 'hsl(var(--tf-fg) / 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{recommendation.title}</div>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: `${toneColor(tone)}14`,
                        border: `1px solid ${toneColor(tone)}44`,
                        color: toneColor(tone),
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {recommendation.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>
                    {recommendation.description}
                  </div>
                  <div style={{ fontSize: 12, color: T.dim, marginTop: 10 }}>
                    Focus area {recommendation.focusArea}
                    {recommendation.action ? ` - Action ${recommendation.action}` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="District risk summary"
        subtitle={props.riskSummary?.provenanceNote ?? 'Risk summary unavailable'}
      >
        {!props.riskSummary || props.riskSummary.districts.length === 0 ? (
          <UnavailablePanel
            title="No district risk rows"
            message="The risk summary endpoint returned no district rows for the resolved tax year."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {props.riskSummary.districts.map((district) => (
              <Banner
                key={district.districtId}
                tone={riskTone(district.riskFlag)}
                title={`${district.districtName} (${district.districtCode})`}
              >
                {district.riskReasons.join('; ') || 'No explicit risk reason returned.'} Current
                rate {district.currentRate.toFixed(4)} / limit {district.statutoryLimit.toFixed(4)}.
                Confidence {formatPercent(district.confidence)}.
              </Banner>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

interface DistrictsState {
  status: 'idle' | 'loading' | 'ok' | 'error' | 'empty';
  districts: TaxingDistrict[];
  limits: StatutoryLimit[];
  steps: CertificationStep[];
  sourceDistricts?: string;
  sourceLimits?: string;
  error?: string;
}

function DistrictsTab() {
  const [state, setState] = useState<DistrictsState>({
    status: 'idle',
    districts: [],
    limits: [],
    steps: [],
  });

  useEffect(() => {
    let cancelled = false;

    setState((current) => ({ ...current, status: 'loading', error: undefined }));

    Promise.all([
      getBentonTaxingDistricts(),
      getStatutoryLimits(),
      getCertificationSteps(),
    ])
      .then(([districtsRes, limitsRes, stepsRes]) => {
        if (cancelled) {
          return;
        }

        const hasAny =
          (districtsRes.districts?.length ?? 0) > 0 ||
          (limitsRes.limits?.length ?? 0) > 0 ||
          (stepsRes.steps?.length ?? 0) > 0;

        setState({
          status: hasAny ? 'ok' : 'empty',
          districts: districtsRes.districts ?? [],
          limits: limitsRes.limits ?? [],
          steps: stepsRes.steps ?? [],
          sourceDistricts: districtsRes.source,
          sourceLimits: limitsRes.source,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setState((current) => ({
          ...current,
          status: 'error',
          error:
            error instanceof Error ? error.message : 'Unknown error fetching levy reference data.',
        }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <UnavailablePanel
        title="Loading district reference surfaces"
        message="Waiting on Benton taxing districts, statutory limits, and certification steps."
      />
    );
  }

  if (state.status === 'error') {
    return (
      <Banner tone="danger" title="Unable to load district reference surfaces">
        Endpoint <code>/api/levy-calculation/*</code> is not reachable. Start the backend or
        verify the API base URL. {state.error}
      </Banner>
    );
  }

  if (state.status === 'empty') {
    return (
      <UnavailablePanel
        title="No district reference data"
        message="The levy calculation reference endpoints returned no districts, limits, or certification steps."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Banner tone="success" title="Reference provenance">
        Live district reference data served by <code>/api/levy-calculation/*</code>. District
        source {state.sourceDistricts ?? 'unknown'}. Statutory source {state.sourceLimits ?? 'unknown'}.
      </Banner>

      <SectionCard
        title={`Benton County taxing districts (${state.districts.length})`}
        subtitle="Reference district catalog used by the levy calculation lane."
      >
        <div style={{ overflow: 'auto', borderRadius: 10, border: `1px solid ${T.border}` }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12,
              background: 'hsl(var(--tf-fg) / 0.02)',
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', color: T.muted }}>
                <th style={thStyle}>Code</th>
                <th style={thStyle}>District</th>
                <th style={thStyle}>Type</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Limit / $1,000 AV</th>
                <th style={thStyle}>RCW</th>
                <th style={thStyle}>Voted</th>
              </tr>
            </thead>
            <tbody>
              {state.districts.map((district) => (
                <tr key={district.code} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{district.code}</td>
                  <td style={tdStyle}>{district.name}</td>
                  <td style={{ ...tdStyle, color: T.muted }}>{district.type}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {district.statutoryLimitPerThousand.toFixed(4)}
                  </td>
                  <td style={{ ...tdStyle, color: T.muted }}>{district.rcwReference}</td>
                  <td style={tdStyle}>{district.isVoted ? 'yes' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title={`Statutory rate limits (${state.limits.length})`}
        subtitle="Current statutory limits exposed by the governed reference endpoint."
      >
        <div style={{ overflow: 'auto', borderRadius: 10, border: `1px solid ${T.border}` }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12,
              background: 'hsl(var(--tf-fg) / 0.02)',
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', color: T.muted }}>
                <th style={thStyle}>District type</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Limit / $1,000 AV</th>
                <th style={thStyle}>RCW</th>
                <th style={thStyle}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {state.limits.map((limit) => (
                <tr key={`${limit.districtType}-${limit.rcwReference}`} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={tdStyle}>{limit.districtType}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {limit.limitPerThousandAV.toFixed(4)}
                  </td>
                  <td style={{ ...tdStyle, color: T.muted }}>{limit.rcwReference}</td>
                  <td style={{ ...tdStyle, color: T.muted }}>{limit.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title={`Certification process (${state.steps.length} steps)`}
        subtitle="Current certification sequence from the governed Benton levy reference lane."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {state.steps.map((step) => (
            <div
              key={step.stepNumber}
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: 14,
                background: 'hsl(var(--tf-fg) / 0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  Step {step.stepNumber}. {step.name}
                </div>
                <div style={{ fontSize: 12, color: T.muted }}>{step.rcwReference}</div>
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>
                {step.description}
              </div>
              <div style={{ fontSize: 12, color: T.dim, marginTop: 6 }}>
                Responsible: {step.responsibleParty}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <Banner tone="warning" title="Known calculation gaps">
        Limit factor is still fixed at 1.01 pending IPD ingestion. Banked capacity, lid lift,
        state school, and senior freeze write-side execution remain governed backlog items and
        are disclosed instead of simulated.
      </Banner>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontWeight: 700,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'top',
};
