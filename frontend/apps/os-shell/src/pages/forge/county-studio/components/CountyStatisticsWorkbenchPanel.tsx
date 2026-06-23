import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/apiBase';
import { useForgeStatisticsStore } from '@/stores/forgeStatisticsStore';
import { getSession } from '@/auth/session';
import {
  getCertifiedMarketReferenceLane,
  getCountyFileStem,
  supportsStatisticsAdvancedAnalysisLane,
} from '../../countyCertification';
import RatioStudyPanel from '../../statistics/RatioStudyPanel';
import CODTrendChart from '../../statistics/charts/CODTrendChart';
import PRDTrendChart from '../../statistics/charts/PRDTrendChart';
import VEIDashboard from '../../statistics/VEIDashboard';
import { StratifiedStudyPanel } from '../../statistics/StratifiedStudyPanel';
import { ValueDriverPanel } from '../../statistics/ValueDriverPanel';
import { OutlierReviewPanel } from '../../statistics/OutlierReviewPanel';
import { ModelComparisonPanel } from '../../statistics/ModelComparisonPanel';
import AssessmentIntelligence from '../../statistics/AssessmentIntelligence';
import EconomicIndicators from '../../statistics/EconomicIndicators';
import MarketAnalyticsDashboard from '../../statistics/MarketAnalyticsDashboard';
import MarketDashboard from '../../statistics/MarketDashboard';
import QualityControlPanel from '../../statistics/QualityControlPanel';
import { CostRatioAnalysis } from '../../cost/CostRatioAnalysis';
import { CostForgeDashboard } from '../../cost/CostForgeDashboard';
import { DiagnosticsTab } from '../../statistics/panels/DiagnosticsTab';
import { SpatialTemporalTab } from '../../statistics/panels/SpatialTemporalTab';
import { CalibrationEngineTab } from '../../statistics/panels/CalibrationEngineTab';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { healthApi } from '../countyStudyApi';
import type {
  CountyHealthSummaryDto,
  CountySegmentDto,
  CountyStatisticsCompatDto,
} from '../types/countyStudio.types';
import type { StatisticsCountyScope } from '../../statistics/statisticsCountyScope';

type AnalyticsMode =
  | 'ratio-study'
  | 'stratified'
  | 'trends'
  | 'equity'
  | 'assessment-intelligence'
  | 'quality-control'
  | 'market-context'
  | 'outliers'
  | 'comparison'
  | 'calibration'
  | 'cost-analytics'
  | 'diagnostics'
  | 'spatial-temporal'
  | 'calibration-engine';

const ADVANCED_MODES: AnalyticsMode[] = ['diagnostics', 'spatial-temporal', 'calibration-engine'];
const WASHINGTON_SALES_START_YEAR = 2016;

interface CertifiedMarketReferenceDataResponse {
  county: string;
  state: string;
  medianHouseholdIncome: number;
  unemploymentRate: number;
  populationGrowthRate: number;
  medianHomePrice: number;
  medianPricePerSqft: number;
  medianDaysOnMarket: number;
  monthsOfInventory: number;
  employmentSectors: Array<{ sector: string; percentOfTotal: number }>;
  effectiveDate: string;
  source: string;
}

type MarketCondition = 'Hot' | 'Warm' | 'Normal' | 'Cool' | 'Cold';

const ANALYTICS_MODES: { key: AnalyticsMode; label: string; group: 'core' | 'advanced' }[] = [
  { key: 'ratio-study', label: 'Ratio Study', group: 'core' },
  { key: 'stratified', label: 'Stratified', group: 'core' },
  { key: 'trends', label: 'Trends', group: 'core' },
  { key: 'equity', label: 'Equity', group: 'core' },
  { key: 'assessment-intelligence', label: 'Intelligence', group: 'core' },
  { key: 'quality-control', label: 'Quality', group: 'core' },
  { key: 'market-context', label: 'Market Context', group: 'core' },
  { key: 'outliers', label: 'Outliers', group: 'core' },
  { key: 'comparison', label: 'Comparison', group: 'core' },
  { key: 'calibration', label: 'Calibration', group: 'core' },
  { key: 'cost-analytics', label: 'Cost Analytics', group: 'core' },
  { key: 'diagnostics', label: 'Diagnostics', group: 'advanced' },
  { key: 'spatial-temporal', label: 'Spatial / Temporal', group: 'advanced' },
  { key: 'calibration-engine', label: 'Calibration Engine', group: 'advanced' },
];

function buildStudyCountyScope(countyId: string): StatisticsCountyScope {
  const session = getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-county-id': countyId,
  };

  if (session?.userId) headers['x-user-id'] = session.userId;
  if (session?.role) headers['x-role'] = session.role;
  if (session?.mode) headers['x-mode'] = session.mode;

  return {
    countyId,
    headers,
    isolated: true,
    advancedCertified: supportsStatisticsAdvancedAnalysisLane(countyId),
    exportStem: getCountyFileStem(countyId),
  };
}

function useRatioData() {
  const studyResult = useForgeStatisticsStore((state) => state.studyResult);
  if (!studyResult) return null;

  return {
    medianRatio: studyResult.medianRatio,
    weightedMeanRatio: studyResult.weightedMeanRatio,
    cod: studyResult.cod,
    prd: studyResult.prd,
    prb: studyResult.prb,
    tierSlope: studyResult.tierSlope,
    sampleSize: studyResult.sampleSize,
    salesPeriod: `Tax Year ${studyResult.params.taxYear}`,
  };
}

function buildCompatRatioData(compat: CountyStatisticsCompatDto | undefined) {
  if (
    !compat
    || compat.medianRatio == null
    || compat.weightedMeanRatio == null
    || compat.cod == null
    || compat.prd == null
    || compat.prb == null
  ) {
    return null;
  }

  return {
    medianRatio: compat.medianRatio,
    weightedMeanRatio: compat.weightedMeanRatio,
    cod: compat.cod,
    prd: compat.prd,
    prb: compat.prb,
    tierSlope: compat.tierSlope ?? compat.prb,
    sampleSize: compat.countWithRatio,
    salesPeriod: `Tax Year ${compat.taxYear}`,
  };
}

function formatNumber(value: number | null | undefined, digits = 3): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : 'unavailable';
}

function getTerraForgeMetric(ratioData: ReturnType<typeof useRatioData>, key: keyof NonNullable<ReturnType<typeof useRatioData>>) {
  return ratioData ? ratioData[key] : null;
}

function compareMetric(
  label: string,
  countyStudio: number | null | undefined,
  terraForge: number | null | undefined,
  tolerance: number,
) {
  if (typeof countyStudio !== 'number' || typeof terraForge !== 'number') {
    return { label, status: 'unavailable' as const, countyStudio, terraForge, tolerance, delta: null };
  }
  const delta = Math.abs(countyStudio - terraForge);
  return {
    label,
    status: delta <= tolerance ? ('pass' as const) : ('mismatch' as const),
    countyStudio,
    terraForge,
    tolerance,
    delta,
  };
}

function buildParityRows(compat: CountyStatisticsCompatDto | undefined, ratioData: ReturnType<typeof useRatioData>) {
  return [
    compareMetric('Qualified sales', compat?.countWithRatio, ratioData?.sampleSize, 0),
    compareMetric('Median ratio', compat?.medianRatio, getTerraForgeMetric(ratioData, 'medianRatio') as number | null, 0.0001),
    compareMetric('COD', compat?.cod, getTerraForgeMetric(ratioData, 'cod') as number | null, 0.01),
    compareMetric('PRD', compat?.prd, getTerraForgeMetric(ratioData, 'prd') as number | null, 0.0001),
    compareMetric('PRB', compat?.prb, getTerraForgeMetric(ratioData, 'prb') as number | null, 0.0001),
    compareMetric('Weighted mean ratio', compat?.weightedMeanRatio, getTerraForgeMetric(ratioData, 'weightedMeanRatio') as number | null, 0.0001),
  ];
}

function toPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.max(0, Math.min(100, (numerator / denominator) * 100));
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function fmtCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

function buildMarketCondition(data: CertifiedMarketReferenceDataResponse | undefined) {
  if (!data) return null;
  const inventory = data.monthsOfInventory;
  const condition: MarketCondition =
    inventory < 2 ? 'Hot' :
    inventory < 4 ? 'Warm' :
    inventory < 6 ? 'Normal' :
    inventory < 8 ? 'Cool' :
    'Cold';
  const score = Math.max(
    0,
    Math.min(100, Math.round(100 - inventory * 9 - data.unemploymentRate * 2 + data.populationGrowthRate * 3)),
  );

  return {
    condition,
    score,
    description:
      `${data.county} County market context from ${data.source}. ` +
      `${data.monthsOfInventory.toFixed(1)} months of inventory, ` +
      `${data.medianDaysOnMarket} median days on market, and ` +
      `${data.populationGrowthRate.toFixed(1)}% population growth.`,
    lastUpdated: data.effectiveDate,
    signals: [
      {
        label: 'Inventory',
        value: `${data.monthsOfInventory.toFixed(1)} mo.`,
        strength: data.monthsOfInventory < 4 ? 'positive' : data.monthsOfInventory < 6 ? 'neutral' : 'negative',
      },
      {
        label: 'Days on market',
        value: `${data.medianDaysOnMarket}`,
        strength: data.medianDaysOnMarket < 25 ? 'positive' : data.medianDaysOnMarket < 45 ? 'neutral' : 'negative',
      },
      {
        label: 'Unemployment',
        value: `${data.unemploymentRate.toFixed(1)}%`,
        strength: data.unemploymentRate < 4 ? 'positive' : data.unemploymentRate < 6 ? 'neutral' : 'negative',
      },
      {
        label: 'Population growth',
        value: `${data.populationGrowthRate.toFixed(1)}%`,
        strength: data.populationGrowthRate > 1 ? 'positive' : data.populationGrowthRate > 0 ? 'neutral' : 'negative',
      },
    ] as Array<{ label: string; value: string; strength: 'positive' | 'neutral' | 'negative' }>,
  };
}

function buildMarketAnalytics(data: CertifiedMarketReferenceDataResponse | undefined) {
  if (!data) return [];
  return [
    {
      label: 'Median Home Price',
      value: fmtCurrency(data.medianHomePrice),
      trend: data.populationGrowthRate > 0 ? ('up' as const) : ('flat' as const),
      changePercent: data.populationGrowthRate,
    },
    {
      label: 'Price / Sq Ft',
      value: fmtCurrency(data.medianPricePerSqft),
      trend: data.populationGrowthRate > 0 ? ('up' as const) : ('flat' as const),
      changePercent: data.populationGrowthRate,
    },
    {
      label: 'Days on Market',
      value: `${data.medianDaysOnMarket}`,
      trend: data.medianDaysOnMarket < 30 ? ('down' as const) : ('flat' as const),
    },
    {
      label: 'Inventory',
      value: `${data.monthsOfInventory.toFixed(1)} mo.`,
      trend: data.monthsOfInventory < 4 ? ('down' as const) : ('flat' as const),
    },
  ];
}

function buildEconomicIndicators(data: CertifiedMarketReferenceDataResponse | undefined) {
  if (!data) return [];
  return [
    {
      category: 'income' as const,
      label: 'Median household income',
      value: fmtCurrency(data.medianHouseholdIncome),
      change: 'ACS reference',
      trend: 'flat' as const,
      period: data.effectiveDate,
    },
    {
      category: 'employment' as const,
      label: 'Unemployment rate',
      value: `${data.unemploymentRate.toFixed(1)}%`,
      change: data.unemploymentRate < 4 ? 'low' : 'watch',
      trend: data.unemploymentRate < 4 ? ('down' as const) : ('flat' as const),
      period: data.effectiveDate,
    },
    {
      category: 'population' as const,
      label: 'Population growth',
      value: `${data.populationGrowthRate.toFixed(1)}%`,
      change: data.populationGrowthRate > 0 ? 'growing' : 'flat',
      trend: data.populationGrowthRate > 0 ? ('up' as const) : ('flat' as const),
      period: data.effectiveDate,
    },
    {
      category: 'housing' as const,
      label: 'Median home price',
      value: fmtCurrency(data.medianHomePrice),
      change: `${data.monthsOfInventory.toFixed(1)} mo. inventory`,
      trend: data.monthsOfInventory < 4 ? ('up' as const) : ('flat' as const),
      period: data.effectiveDate,
    },
  ];
}

function buildQualityDimensions(
  healthSummary: CountyHealthSummaryDto | null,
  segments: CountySegmentDto[],
) {
  if (!healthSummary && segments.length === 0) return [];

  const parcelCount =
    healthSummary?.parcelCount ??
    segments.reduce((sum, segment) => sum + segment.parcelCount, 0);
  const ratioCount =
    healthSummary?.ratioCount ??
    segments.reduce((sum, segment) => sum + (segment.ratioCount ?? segment.salesCount ?? 0), 0);
  const exceptionCount =
    healthSummary?.exceptionCount ??
    segments.reduce((sum, segment) => sum + segment.exceptionCount, 0);

  const sparseSegments = segments.filter(
    (segment) => segment.cod == null || segment.medianRatio == null || segment.prd == null,
  );
  const highRiskSegments = segments.filter((segment) => segment.riskScore >= 70);
  const unstableSegments = segments.filter((segment) => segment.stabilityScore < 60);
  const weightedStability =
    healthSummary?.stabilityScore ??
    average(segments.map((segment) => segment.stabilityScore).filter(Number.isFinite));
  const weightedRisk =
    healthSummary?.riskScore ??
    average(segments.map((segment) => segment.riskScore).filter(Number.isFinite));

  const derivedAt = healthSummary?.derivedAt ? new Date(healthSummary.derivedAt) : null;
  const daysSinceDerive =
    derivedAt && Number.isFinite(derivedAt.getTime())
      ? Math.max(0, (Date.now() - derivedAt.getTime()) / 86_400_000)
      : null;
  const timelinessScore =
    daysSinceDerive == null ? 35 : Math.max(0, Math.min(100, 100 - daysSinceDerive * 3));

  return [
    {
      name: 'completeness' as const,
      score: Math.round(toPercent(ratioCount, parcelCount)),
      issues: [
        ...(parcelCount > 0 && ratioCount / parcelCount < 0.5
          ? [{
              id: 'coverage-low',
              severity: 'critical' as const,
              message: 'Ratio coverage is below 50%; leadership should treat conclusions as evidence-thin.',
              affectedRecords: Math.max(0, parcelCount - ratioCount),
            }]
          : []),
        ...(sparseSegments.length > 0
          ? [{
              id: 'sparse-segments',
              severity: 'warning' as const,
              message: 'Segments with missing COD, PRD, or median ratio need more evidence before final judgment.',
              affectedRecords: sparseSegments.length,
            }]
          : []),
      ],
    },
    {
      name: 'consistency' as const,
      score: Math.round(
        Math.max(0, Math.min(100, 100 - toPercent(exceptionCount, Math.max(parcelCount, 1)) * 4)),
      ),
      issues: exceptionCount > 0
        ? [{
            id: 'exceptions-open',
            severity: exceptionCount > parcelCount * 0.05 ? ('critical' as const) : ('warning' as const),
            message: 'Open exception load is affecting study consistency.',
            affectedRecords: exceptionCount,
          }]
        : [],
    },
    {
      name: 'accuracy' as const,
      score: Math.round(
        Math.max(0, Math.min(100, average([
          weightedStability ?? 0,
          weightedRisk == null ? 100 : 100 - weightedRisk,
        ]) ?? 0)),
      ),
      issues: [
        ...(highRiskSegments.length > 0
          ? [{
              id: 'high-risk-segments',
              severity: 'critical' as const,
              message: 'High-risk segments are present in the active study.',
              affectedRecords: highRiskSegments.length,
            }]
          : []),
        ...(unstableSegments.length > 0
          ? [{
              id: 'unstable-segments',
              severity: 'warning' as const,
              message: 'Unstable segments need senior review before scenario promotion.',
              affectedRecords: unstableSegments.length,
            }]
          : []),
      ],
    },
    {
      name: 'timeliness' as const,
      score: Math.round(timelinessScore),
      issues: daysSinceDerive == null
        ? [{
            id: 'not-derived',
            severity: 'critical' as const,
            message: 'No derived segment timestamp is available for this study.',
          }]
        : daysSinceDerive > 14
          ? [{
              id: 'derive-stale',
              severity: 'warning' as const,
              message: `Segment metrics were derived ${Math.floor(daysSinceDerive)} days ago.`,
            }]
          : [],
    },
  ];
}

function buildAssessmentIntelligence(
  healthSummary: CountyHealthSummaryDto | null,
  segments: CountySegmentDto[],
  ratioData: ReturnType<typeof useRatioData>,
) {
  const parcelCount =
    healthSummary?.parcelCount ??
    segments.reduce((sum, segment) => sum + segment.parcelCount, 0);
  const exceptionCount =
    healthSummary?.exceptionCount ??
    segments.reduce((sum, segment) => sum + segment.exceptionCount, 0);

  const byType = Array.from(
    segments.reduce((map, segment) => {
      const key = segment.segmentType || 'Unclassified';
      map.set(key, (map.get(key) ?? 0) + segment.exceptionCount);
      return map;
    }, new Map<string, number>()),
  )
    .map(([type, count]) => ({ type, count }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const riskBuckets = [
    {
      risk: 'high' as const,
      count: segments
        .filter((segment) => segment.riskScore >= 70)
        .reduce((sum, segment) => sum + segment.parcelCount, 0),
    },
    {
      risk: 'medium' as const,
      count: segments
        .filter((segment) => segment.riskScore >= 40 && segment.riskScore < 70)
        .reduce((sum, segment) => sum + segment.parcelCount, 0),
    },
    {
      risk: 'low' as const,
      count: segments
        .filter((segment) => segment.riskScore < 40)
        .reduce((sum, segment) => sum + segment.parcelCount, 0),
    },
  ].map((bucket) => ({
    ...bucket,
    percentage: toPercent(bucket.count, parcelCount),
  }));

  return {
    outliers: parcelCount > 0
      ? {
          totalOutliers: exceptionCount,
          totalParcels: parcelCount,
          byType,
        }
      : null,
    appealRisk: riskBuckets.filter((bucket) => bucket.count > 0),
    marketTrends: [
      ...(ratioData
        ? [{
            indicator: 'Median ratio',
            direction:
              ratioData.medianRatio < 0.9 ? ('down' as const) :
              ratioData.medianRatio > 1.1 ? ('up' as const) :
              ('flat' as const),
            value: ratioData.medianRatio.toFixed(3),
            change: ratioData.medianRatio < 0.9 || ratioData.medianRatio > 1.1 ? 'outside target' : 'within target',
          }]
        : []),
      ...(ratioData
        ? [{
            indicator: 'COD',
            direction:
              ratioData.cod > 20 ? ('up' as const) :
              ratioData.cod <= 15 ? ('down' as const) :
              ('flat' as const),
            value: ratioData.cod.toFixed(1),
            change: ratioData.cod > 20 ? 'critical' : ratioData.cod <= 15 ? 'compliant' : 'marginal',
          }]
        : []),
      ...(healthSummary?.riskScore != null
        ? [{
            indicator: 'Composite risk',
            direction:
              healthSummary.riskScore >= 70 ? ('up' as const) :
              healthSummary.riskScore < 40 ? ('down' as const) :
              ('flat' as const),
            value: healthSummary.riskScore.toFixed(0),
            change: healthSummary.complianceStatus,
          }]
        : []),
    ],
  };
}

function StatSummaryCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const toneColor = {
    neutral: 'hsl(var(--tf-fg))',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  }[tone];

  return (
    <div
      style={{
        border: '1px solid hsl(var(--tf-border))',
        borderRadius: 6,
        padding: '10px 12px',
        background: 'hsl(var(--tf-surface))',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: 'hsl(var(--tf-muted))', letterSpacing: 0.8 }}>
        {label}
      </div>
      <div style={{ marginTop: 4, fontSize: 20, fontWeight: 800, color: toneColor }}>
        {value}
      </div>
    </div>
  );
}

function ContractField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid hsl(var(--tf-border))',
        borderRadius: 6,
        padding: '8px 10px',
        background: 'hsl(var(--tf-bg))',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: 'hsl(var(--tf-muted))', letterSpacing: 0.6 }}>
        {label}
      </div>
      <div style={{ marginTop: 3, fontSize: 12, fontWeight: 700, overflowWrap: 'anywhere' }}>
        {value}
      </div>
    </div>
  );
}

function EvidenceField({ label, value, tone = 'neutral' }: { label: string; value: React.ReactNode; tone?: 'neutral' | 'warning' | 'danger' }) {
  const color =
    tone === 'danger' ? 'hsl(var(--tf-danger, 0 84% 60%))' :
    tone === 'warning' ? 'hsl(var(--tf-warning, 38 92% 50%))' :
    'hsl(var(--tf-fg))';

  return (
    <div
      style={{
        border: '1px solid hsl(var(--tf-border))',
        borderRadius: 6,
        padding: '9px 10px',
        background: 'hsl(var(--tf-bg))',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--tf-muted))' }}>
        {label}
      </div>
      <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color, overflowWrap: 'anywhere' }}>
        {value}
      </div>
    </div>
  );
}

function formatCompatDate(value: string | undefined): string {
  if (!value) return 'unavailable';
  return value.slice(0, 10);
}

function buildEvidencePosture(
  compat: CountyStatisticsCompatDto | undefined,
  loading: boolean,
  mismatches: Array<{ status: string }>,
  unavailable: Array<{ status: string }>,
) {
  if (loading) return { status: 'Loading', tone: 'neutral' as const };
  if (!compat) return { status: 'Unavailable', tone: 'danger' as const };
  if (compat.countWithRatio < 50 || unavailable.length > 0 || compat.trustPosture.length > 0) {
    return { status: 'Partial', tone: 'warning' as const };
  }
  if (mismatches.length > 0) return { status: 'Blocked', tone: 'danger' as const };
  return { status: 'Ready', tone: 'neutral' as const };
}

function StatisticsCompatContractPanel({
  compat,
  ratioData,
  loading,
}: {
  compat: CountyStatisticsCompatDto | undefined;
  ratioData: ReturnType<typeof useRatioData>;
  loading: boolean;
}) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const parityRows = buildParityRows(compat, ratioData);
  const mismatches = parityRows.filter((row) => row.status === 'mismatch');
  const unavailable = parityRows.filter((row) => row.status === 'unavailable');
  const evidencePosture = buildEvidencePosture(compat, loading, mismatches, unavailable);
  const thinSample = Boolean(compat && compat.countWithRatio < 50);
  const defensibilityRisk =
    !compat ? 'study evidence is unavailable' :
    thinSample ? 'sample size is thin' :
    mismatches.length > 0 ? 'parity mismatch requires review before defense' :
    unavailable.length > 0 ? 'some parity checks are unavailable' :
    'ratio evidence is ready for review';
  const nextReviewAction =
    !compat ? 'open or refresh the ratio study evidence source' :
    thinSample || compat.parcelIdentityReconciliation.unmatchedSaleRows > 0
      ? 'review sale qualification and parcel reconciliation'
      : 'confirm parity evidence and attach the study packet';

  return (
    <Card data-material="bento" data-testid="statistics-compat-contract-panel">
      <CardHeader>
        <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Can this ratio study be trusted?
          <Badge variant={evidencePosture.status === 'Ready' ? 'default' : 'secondary'}>
            Status: {evidencePosture.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <EvidenceField label="Population" value={`${compat?.countWithRatio?.toLocaleString() ?? 'unavailable'} qualified sale ratio rows`} tone={thinSample ? 'warning' : 'neutral'} />
          <EvidenceField label="Included after trimming" value={`${compat?.trimmedCount?.toLocaleString() ?? 'unavailable'} after trimming`} />
          <EvidenceField label="Excluded as outliers" value={`${compat?.outliersExcluded?.toLocaleString() ?? 'unavailable'} outlier${compat?.outliersExcluded === 1 ? '' : 's'} excluded`} />
          <EvidenceField label="Parcel matching" value={`${compat?.parcelIdentityReconciliation.unmatchedSaleRows?.toLocaleString() ?? 'unavailable'} unmatched parcels`} tone={compat && compat.parcelIdentityReconciliation.unmatchedSaleRows > 0 ? 'warning' : 'neutral'} />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <EvidenceField
            label="Method"
            value={`Sale window: ${formatCompatDate(compat?.saleWindow.lookbackStart)} to ${formatCompatDate(compat?.saleWindow.lookbackEndExclusive)}. Qualification: qualified sales only.`}
          />
          <EvidenceField
            label="Exclusions"
            value={`Suppressed/no-calc rows excluded. Outlier handling: Tukey/IQR trimmed.`}
          />
          <EvidenceField
            label="Defensibility"
            value={`Evidence posture: ${evidencePosture.status.toLowerCase()}. Risk: ${defensibilityRisk}.`}
            tone={evidencePosture.tone}
          />
          <EvidenceField
            label="Next review action"
            value={`Next action: ${nextReviewAction}.`}
            tone={evidencePosture.status === 'Ready' ? 'neutral' : 'warning'}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowTechnicalDetails((open) => !open)}
          style={{ marginBottom: showTechnicalDetails ? 12 : 0 }}
        >
          Technical details
        </Button>

        {showTechnicalDetails && (
          <div
            data-testid="statistics-compat-technical-details"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <ContractField label="contractId" value={compat?.contractId ?? 'unavailable'} />
            <ContractField label="population" value={compat?.population ?? 'qualified sale ratio rows'} />
            <ContractField label="countWithRatio" value={compat?.countWithRatio?.toLocaleString() ?? 'unavailable'} />
            <ContractField label="outliersExcluded" value={compat?.outliersExcluded?.toLocaleString() ?? 'unavailable'} />
            <ContractField label="trimmedCount" value={compat?.trimmedCount?.toLocaleString() ?? 'unavailable'} />
            <ContractField label="trustPosture" value={compat?.trustPosture?.join(' / ') ?? 'unavailable'} />
            <ContractField label="saleWindow" value={compat?.saleWindow.rule ?? 'unavailable'} />
            <ContractField label="qualificationPolicy" value={compat?.qualificationPolicy ?? 'unavailable'} />
            <ContractField label="suppressionPolicy" value={compat?.suppressionPolicy ?? 'unavailable'} />
            <ContractField label="outlierPolicy" value={compat?.outlierPolicy ?? 'unavailable'} />
            <ContractField label="parcelIdentityReconciliation" value={
              compat
                ? `${compat.parcelIdentityReconciliation.joinMode}; matched ${compat.parcelIdentityReconciliation.matchedPropertyRows.toLocaleString()} of ${compat.parcelIdentityReconciliation.saleRows.toLocaleString()} sale rows; unmatched ${compat.parcelIdentityReconciliation.unmatchedSaleRows.toLocaleString()}`
                : 'unavailable'
            } />
            <ContractField label="conversionSensitiveCounts" value={
              compat
                ? `decision ${compat.conversionSensitiveCounts.decisionQualifiedRows.toLocaleString()}, recommendation ${compat.conversionSensitiveCounts.recommendationQualifiedRows.toLocaleString()}, null-default ${compat.conversionSensitiveCounts.recommendationNullDefaultQualifiedRows.toLocaleString()}, suppressed ${compat.conversionSensitiveCounts.suppressedExcludedRows.toLocaleString()}, no-calc ${compat.conversionSensitiveCounts.includeNoCalcExcludedRows.toLocaleString()}`
                : 'unavailable'
            } />
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ color: 'hsl(var(--tf-muted))', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px', borderBottom: '1px solid hsl(var(--tf-border))' }}>Metric</th>
                <th style={{ padding: '6px 8px', borderBottom: '1px solid hsl(var(--tf-border))' }}>County Studio Evidence</th>
                <th style={{ padding: '6px 8px', borderBottom: '1px solid hsl(var(--tf-border))' }}>TerraForge Ratio Study</th>
                <th style={{ padding: '6px 8px', borderBottom: '1px solid hsl(var(--tf-border))' }}>Tolerance</th>
                <th style={{ padding: '6px 8px', borderBottom: '1px solid hsl(var(--tf-border))' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {parityRows.map((row) => (
                <tr key={row.label}>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid hsl(var(--tf-border))', fontWeight: 700 }}>{row.label}</td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid hsl(var(--tf-border))' }}>{formatNumber(row.countyStudio, row.label === 'COD' ? 2 : 4)}</td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid hsl(var(--tf-border))' }}>{formatNumber(row.terraForge, row.label === 'COD' ? 2 : 4)}</td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid hsl(var(--tf-border))' }}>{row.tolerance}</td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid hsl(var(--tf-border))' }}>
                    <Badge variant={row.status === 'pass' ? 'default' : 'secondary'}>{row.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function CountyStatisticsWorkbenchPanel() {
  const activeStudy = useCountyStudioStore((state) => state.activeStudy);
  const segments = useCountyStudioStore((state) => state.segments);
  const healthSummary = useCountyStudioStore((state) => state.healthSummary);
  const loadStatus = useCountyStudioStore((state) => state.loadStatus);
  const [mode, setMode] = useState<AnalyticsMode>('ratio-study');
  const currentTaxYear = new Date().getFullYear();
  const taxYear = activeStudy?.taxYear ?? currentTaxYear;
  const [veiTaxYear, setVeiTaxYear] = useState(taxYear);
  const countyScope = useMemo(
    () => activeStudy?.countyId ? buildStudyCountyScope(activeStudy.countyId) : null,
    [activeStudy?.countyId],
  );
  const certifiedMarketReferenceLane = useMemo(
    () => getCertifiedMarketReferenceLane(activeStudy?.countyId),
    [activeStudy?.countyId],
  );
  const hasCertifiedMarketReferenceLane = Boolean(certifiedMarketReferenceLane);

  const fetchStudy = useForgeStatisticsStore((state) => state.fetchStudy);
  const setStudyFilter = useForgeStatisticsStore((state) => state.setFilter);
  const loadComparison = useForgeStatisticsStore((state) => state.loadComparison);
  const statsLoading = useForgeStatisticsStore((state) => state.loading);
  const terraForgeRatioData = useRatioData();
  const availableTaxYears = useMemo(
    () =>
      Array.from(
        { length: Math.max(1, currentTaxYear - WASHINGTON_SALES_START_YEAR + 1) },
        (_, index) => currentTaxYear - index,
      ),
    [currentTaxYear],
  );

  useEffect(() => {
    if (!activeStudy?.countyId || !countyScope?.isolated) return;
    setStudyFilter({ taxYear, countyId: activeStudy.countyId });
    void fetchStudy();
    void loadComparison();
  }, [activeStudy?.countyId, countyScope?.isolated, fetchStudy, loadComparison, setStudyFilter, taxYear]);

  useEffect(() => {
    setVeiTaxYear(taxYear);
  }, [activeStudy?.studyId, taxYear]);

  const {
    data: statisticsCompat,
    isLoading: compatLoading,
    refetch: refetchStatisticsCompat,
  } = useQuery<CountyStatisticsCompatDto>({
    queryKey: ['county-studio-statistics-compat', activeStudy?.studyId],
    queryFn: () => healthApi.statisticsCompat(activeStudy!.studyId),
    enabled: Boolean(activeStudy?.studyId && countyScope?.isolated),
    staleTime: 5 * 60_000,
  });

  const ratioData = useMemo(
    () => buildCompatRatioData(statisticsCompat) ?? terraForgeRatioData,
    [statisticsCompat, terraForgeRatioData],
  );

  const { data: trendsData, isLoading: trendsLoading } = useQuery<{
    codTrend: { period: string; cod: number }[];
    prdTrend: { period: string; prd: number }[];
  }>({
    queryKey: ['county-studio-ratio-study-trends', taxYear, activeStudy?.countyId],
    queryFn: () =>
      apiFetch(
        `/terraforge/ratio-study/trends?taxYear=${taxYear}&countyId=${encodeURIComponent(activeStudy!.countyId)}`,
        { headers: countyScope!.headers },
      ).then((response) => response.json()),
    enabled: Boolean(activeStudy?.countyId && countyScope?.isolated),
    staleTime: 5 * 60_000,
  });

  const { data: snapshots = [], isLoading: equityLoading } = useQuery<
    Array<{
      neighborhood_code: string;
      parcel_count: number;
      median_ratio: number;
      cod: number;
      prd: number;
      sale_count: number;
    }>
  >({
    queryKey: ['county-studio-neighborhood-snapshots-equity', veiTaxYear, activeStudy?.countyId],
    queryFn: () =>
      apiFetch(
        `/terraforge/comparison-snapshots?taxYear=${veiTaxYear}&countyId=${encodeURIComponent(activeStudy!.countyId)}`,
        { headers: countyScope!.headers },
      ).then((response) => response.json()),
    enabled: Boolean(activeStudy?.countyId && countyScope?.isolated),
    staleTime: 5 * 60_000,
  });

  const {
    data: marketData,
    isLoading: marketLoading,
    error: marketError,
  } = useQuery<CertifiedMarketReferenceDataResponse>({
    queryKey: ['county-studio-income-market-data', activeStudy?.countyId, certifiedMarketReferenceLane?.id],
    queryFn: () =>
      apiFetch(
        certifiedMarketReferenceLane!.endpoint,
        { headers: countyScope!.headers },
      ).then((response) => response.json()),
    enabled: Boolean(activeStudy?.countyId && countyScope?.isolated && certifiedMarketReferenceLane),
    staleTime: 30 * 60_000,
  });

  const neighborhoods = snapshots.map((snapshot) => ({
    neighborhood: snapshot.neighborhood_code,
    medianRatio: snapshot.median_ratio,
    cod: snapshot.cod,
    sampleSize: snapshot.sale_count,
  }));

  const liveVeiMetrics =
    snapshots.length > 0 && ratioData
      ? {
          cod: +(snapshots.reduce((sum, snapshot) => sum + snapshot.cod, 0) / snapshots.length).toFixed(1),
          prd: +(snapshots.reduce((sum, snapshot) => sum + snapshot.prd, 0) / snapshots.length).toFixed(3),
          prb: ratioData.prb,
          tierSlope: ratioData.tierSlope,
          medianRatio: +(
            snapshots.reduce((sum, snapshot) => sum + snapshot.median_ratio, 0) / snapshots.length
          ).toFixed(3),
          sampleSize: snapshots.reduce((sum, snapshot) => sum + snapshot.sale_count, 0),
        }
      : null;
  const qualityDimensions = useMemo(
    () => buildQualityDimensions(healthSummary, segments),
    [healthSummary, segments],
  );
  const assessmentIntelligence = useMemo(
    () => buildAssessmentIntelligence(healthSummary, segments, ratioData),
    [healthSummary, ratioData, segments],
  );
  const intelligenceLoading =
    loadStatus.segments === 'loading' ||
    loadStatus.healthSummary === 'loading' ||
    statsLoading || compatLoading;

  const advancedGuarded =
    countyScope?.isolated &&
    ADVANCED_MODES.includes(mode) &&
    !countyScope.advancedCertified;

  if (!activeStudy || !countyScope) {
    return (
      <div
        data-testid="county-studio-analytics-empty"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: 24,
          color: 'hsl(var(--tf-muted))',
          textAlign: 'center',
        }}
      >
        Open a County Studio study to load countywide statistical analysis inside the workbench.
      </div>
    );
  }

  const renderMode = () => {
    if (advancedGuarded) {
      return (
        <Card data-material="bento" data-testid="county-studio-advanced-unavailable">
          <CardHeader>
            <CardTitle>Advanced Analysis Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            Advanced diagnostics remain certified only on the current legacy county lane. Countywide
            core metrics stay available for this study, but this advanced analysis mode is withheld
            until county certification is complete.
          </CardContent>
        </Card>
      );
    }

    switch (mode) {
      case 'ratio-study':
        return (
          <div className="space-y-4">
            <StatisticsCompatContractPanel
              compat={statisticsCompat}
              ratioData={terraForgeRatioData}
              loading={compatLoading || statsLoading}
            />
            <Card data-material="bento">
              <CardHeader>
                <CardTitle>County Ratio Study Evidence View</CardTitle>
              </CardHeader>
              <CardContent>
                <RatioStudyPanel
                  ratioData={buildCompatRatioData(statisticsCompat)}
                  loading={compatLoading}
                  onRefresh={() => {
                    void refetchStatisticsCompat();
                    void fetchStudy();
                  }}
                />
              </CardContent>
            </Card>
          </div>
        );
      case 'stratified':
        return <StratifiedStudyPanel taxYear={taxYear} countyScopeOverride={countyScope} />;
      case 'trends':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card data-material="bento">
              <CardHeader>
                <CardTitle>COD Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <CODTrendChart
                  data={trendsData?.codTrend ?? []}
                  threshold={15}
                  loading={trendsLoading}
                />
              </CardContent>
            </Card>
            <Card data-material="bento">
              <CardHeader>
                <CardTitle>PRD Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <PRDTrendChart data={trendsData?.prdTrend ?? []} loading={trendsLoading} />
              </CardContent>
            </Card>
          </div>
        );
      case 'equity':
        return (
          <Card data-material="bento">
            <CardHeader>
              <CardTitle>Valuation Equity Index</CardTitle>
            </CardHeader>
            <CardContent>
              <VEIDashboard
                metrics={liveVeiMetrics}
                neighborhoods={neighborhoods}
                availableTaxYears={availableTaxYears}
                selectedTaxYear={veiTaxYear}
                loading={equityLoading}
                onTaxYearChange={setVeiTaxYear}
                onSalesWindowChange={() => {}}
                onOutlierMethodChange={() => {}}
              />
            </CardContent>
          </Card>
        );
      case 'assessment-intelligence':
        return (
          <Card data-material="bento">
            <CardContent className="pt-6">
              <AssessmentIntelligence
                outliers={assessmentIntelligence.outliers}
                appealRisk={assessmentIntelligence.appealRisk}
                marketTrends={assessmentIntelligence.marketTrends}
                loading={intelligenceLoading}
              />
            </CardContent>
          </Card>
        );
      case 'quality-control':
        return (
          <Card data-material="bento">
            <CardContent className="pt-6">
              <QualityControlPanel
                dimensions={qualityDimensions}
                loading={intelligenceLoading}
              />
            </CardContent>
          </Card>
        );
      case 'market-context':
        return (
          <div className="space-y-4">
            {!hasCertifiedMarketReferenceLane ? (
              <Card data-material="bento" data-testid="county-market-context-reference-lane-unavailable">
                <CardHeader>
                  <CardTitle>Market Context Reference Lane Unavailable</CardTitle>
                </CardHeader>
                <CardContent>
                  The Benton-certified market reference lane is withheld for this county. Statistics
                  evidence will not substitute Benton market data for a non-certified county scope.
                </CardContent>
              </Card>
            ) : null}
            {certifiedMarketReferenceLane ? (
              <Card data-material="bento" data-testid="county-market-context-reference-lane-posture">
                <CardHeader>
                  <CardTitle>Reference-Only Market Lane</CardTitle>
                </CardHeader>
                <CardContent>
                  {certifiedMarketReferenceLane.label} is displayed as context only and is excluded
                  from Study Evidence parity and County Studio superset proof.
                </CardContent>
              </Card>
            ) : null}
            {marketError ? (
              <Card data-material="bento" data-testid="county-market-context-unavailable">
                <CardHeader>
                  <CardTitle>Market Context Unavailable</CardTitle>
                </CardHeader>
                <CardContent>
                  County Studio could not load the Benton-certified reference lane for this study.
                  This panel will not substitute generic market assumptions for county evidence.
                </CardContent>
              </Card>
            ) : null}
            <Card data-material="bento">
              <CardContent className="pt-6">
                <MarketAnalyticsDashboard
                  metrics={buildMarketAnalytics(marketData)}
                  asOfDate={marketData?.effectiveDate ?? '—'}
                  loading={marketLoading}
                />
              </CardContent>
            </Card>
            <Card data-material="bento">
              <CardContent className="pt-6">
                <MarketDashboard
                  status={buildMarketCondition(marketData)}
                  loading={marketLoading}
                />
              </CardContent>
            </Card>
            <Card data-material="bento">
              <CardContent className="pt-6">
                <EconomicIndicators
                  metrics={buildEconomicIndicators(marketData)}
                  region={marketData ? `${marketData.county} County, ${marketData.state}` : '—'}
                  loading={marketLoading}
                />
              </CardContent>
            </Card>
          </div>
        );
      case 'outliers':
        return <OutlierReviewPanel />;
      case 'comparison':
        return <ModelComparisonPanel />;
      case 'calibration':
        return (
          <div className="space-y-4">
            <CostRatioAnalysis />
            <ValueDriverPanel taxYear={taxYear} countyScopeOverride={countyScope} />
          </div>
        );
      case 'cost-analytics':
        return <CostForgeDashboard />;
      case 'diagnostics':
        return <DiagnosticsTab countyScope={countyScope} taxYear={taxYear} />;
      case 'spatial-temporal':
        return <SpatialTemporalTab countyScope={countyScope} taxYear={taxYear} />;
      case 'calibration-engine':
        return <CalibrationEngineTab countyScope={countyScope} taxYear={taxYear} />;
      default:
        return null;
    }
  };

  return (
    <div
      data-testid="county-studio-statistics-workbench"
      style={{ height: '100%', overflow: 'auto', padding: 16 }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 1.2fr) repeat(4, minmax(120px, 0.6fr))',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            border: '1px solid hsl(var(--tf-border))',
            borderRadius: 6,
            padding: 12,
            background: 'hsl(var(--tf-surface))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Study Evidence</h2>
            <Badge variant="secondary">Ratio Study Evidence</Badge>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--tf-muted))', lineHeight: 1.5 }}>
            Defensible ratio-study evidence for {activeStudy.countyName ?? activeStudy.countyId}.
            Operational Health remains the command surface; this view explains what data was included,
            what was excluded, and whether the study can be defended.
          </p>
        </div>
        <StatSummaryCard
          label="Median"
          value={ratioData ? ratioData.medianRatio.toFixed(3) : '—'}
          tone={ratioData && (ratioData.medianRatio < 0.9 || ratioData.medianRatio > 1.1) ? 'danger' : 'neutral'}
        />
        <StatSummaryCard
          label="COD"
          value={ratioData ? ratioData.cod.toFixed(1) : '—'}
          tone={ratioData && ratioData.cod > 20 ? 'danger' : ratioData && ratioData.cod > 15 ? 'warning' : 'neutral'}
        />
        <StatSummaryCard
          label="PRD"
          value={ratioData ? ratioData.prd.toFixed(3) : '—'}
          tone={ratioData && (ratioData.prd < 0.98 || ratioData.prd > 1.03) ? 'danger' : 'neutral'}
        />
        <StatSummaryCard
          label="Sample"
          value={ratioData ? ratioData.sampleSize.toLocaleString() : '—'}
          tone={ratioData && ratioData.sampleSize < 30 ? 'warning' : 'neutral'}
        />
      </div>

      <div
        role="tablist"
        aria-label="County Studio analytical modes"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          padding: '8px 0 14px',
        }}
      >
        {ANALYTICS_MODES.map((analyticsMode) => (
          <Button
            key={analyticsMode.key}
            type="button"
            role="tab"
            aria-selected={mode === analyticsMode.key}
            data-testid={`county-analytics-${analyticsMode.key}`}
            variant={mode === analyticsMode.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode(analyticsMode.key)}
          >
            {analyticsMode.group === 'advanced' ? 'Adv · ' : ''}
            {analyticsMode.label}
          </Button>
        ))}
      </div>

      <div data-testid="county-studio-analytics-mode" data-mode={mode}>
        {renderMode()}
      </div>
    </div>
  );
}
