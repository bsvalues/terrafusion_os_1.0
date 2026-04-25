/**
 * StatisticsStudio.tsx
 *
 * Statistics Studio orchestrator for the TerraForge suite.
 * Tabbed dashboard integrating ratio study, trend charts, equity (VEI) analysis,
 * outlier review, and model comparison.
 *
 * DATA POSTURE:
 * - Ratio Study tab: from `useForgeStatisticsStore` (API-backed with fixture fallback).
 * - Trends tab: live from /api/terraforge/ratio-study/trends (quarterly COD/PRD).
 * - Equity (VEI) tab: live from /api/terraforge/comparison-snapshots (neighborhood stats).
 * - Outliers tab: from `useForgeStatisticsStore` (API-backed with fixture fallback).
 * - Comparison tab: from `useForgeStatisticsStore` (API-backed with fixture fallback).
 */

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RatioStudyPanel from './RatioStudyPanel';
import CODTrendChart from './charts/CODTrendChart';
import PRDTrendChart from './charts/PRDTrendChart';
import VEIDashboard from './VEIDashboard';
import { OutlierReviewPanel } from './OutlierReviewPanel';
import { ModelComparisonPanel } from './ModelComparisonPanel';
import { CostRatioAnalysis } from '../cost/CostRatioAnalysis';
import { CostForgeDashboard } from '../cost/CostForgeDashboard';
import { StratifiedStudyPanel } from './StratifiedStudyPanel';
import { ValueDriverPanel } from './ValueDriverPanel';
import { DiagnosticsTab } from './panels/DiagnosticsTab';
import { SpatialTemporalTab } from './panels/SpatialTemporalTab';
import { CalibrationEngineTab } from './panels/CalibrationEngineTab';
import { useForgeStatisticsStore } from '@/stores/forgeStatisticsStore';
import { DemoDataBanner } from '@/components/governance/DemoDataBanner';
import { RATIO_STUDY_RESULT } from '@/data/forgeStatisticsFixtures';
import { apiFetch } from '@/lib/apiBase';

type Tab = 'ratio-study' | 'stratified' | 'trends' | 'equity' | 'outliers' | 'comparison' | 'calibration' | 'cost-analytics' | 'diagnostics' | 'spatial-temporal' | 'calibration-engine';

// --- Ratio study data from store or fixture fallback ---

function useRatioData() {
  const studyResult = useForgeStatisticsStore((s) => s.studyResult);
  const isFixtureStudy = useForgeStatisticsStore((s) => s.isFixture.studyResult);
  if (studyResult) {
    const isFixture = isFixtureStudy;
    return {
      medianRatio: studyResult.medianRatio,
      weightedMeanRatio: studyResult.weightedMeanRatio,
      cod: studyResult.cod,
      prd: studyResult.prd,
      prb: studyResult.prb,
      sampleSize: studyResult.sampleSize,
      salesPeriod: isFixture ? 'Jul 2025 \u2013 Jun 2026' : `Tax Year ${studyResult.params.taxYear}`,
      isFixture,
    };
  }
  return {
    medianRatio: RATIO_STUDY_RESULT.medianRatio,
    weightedMeanRatio: RATIO_STUDY_RESULT.weightedMeanRatio,
    cod: RATIO_STUDY_RESULT.cod,
    prd: RATIO_STUDY_RESULT.prd,
    prb: RATIO_STUDY_RESULT.prb,
    sampleSize: RATIO_STUDY_RESULT.sampleSize,
    salesPeriod: 'Jul 2025 \u2013 Jun 2026',
    isFixture: true,
  };
}

// --- Component ---

const ADVANCED_TABS: Tab[] = ['diagnostics', 'spatial-temporal', 'calibration-engine'];

export function StatisticsStudio() {
  const [activeTab, setActiveTab] = useState<Tab>('ratio-study');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fetchStudy = useForgeStatisticsStore((s) => s.fetchStudy);
  const loadComparison = useForgeStatisticsStore((s) => s.loadComparison);
  const isFixture = useForgeStatisticsStore((s) => s.isFixture);
  const ratioData = useRatioData();

  useEffect(() => {
    fetchStudy();
    loadComparison();
  }, [fetchStudy, loadComparison]);

  // ── Trends data (live) ───────────────────────────────────────────────
  const {
    data: trendsData,
    isLoading: trendsLoading,
  } = useQuery<{ codTrend: { period: string; cod: number }[]; prdTrend: { period: string; prd: number }[] }>({
    queryKey: ['ratio-study-trends'],
    queryFn: () => apiFetch('/terraforge/ratio-study/trends?taxYear=2026').then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  // ── Equity/neighborhood data (live) ─────────────────────────────────
  const {
    data: snapshots = [],
    isLoading: equityLoading,
  } = useQuery<Array<{ neighborhood_code: string; parcel_count: number; median_ratio: number; cod: number; prd: number; sale_count: number }>>({
    queryKey: ['neighborhood-snapshots-equity'],
    queryFn: () => apiFetch('/terraforge/comparison-snapshots?taxYear=2026').then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  // Map snapshot array to VEIDashboard's NeighborhoodRatio[] shape
  const neighborhoods = snapshots.map((s) => ({
    neighborhood: s.neighborhood_code,
    medianRatio: s.median_ratio,
    cod: s.cod,
    sampleSize: s.sale_count,
  }));

  // Derive overall VEI metrics from live snapshots
  const liveVeiMetrics =
    snapshots.length > 0
      ? {
          cod: +(snapshots.reduce((sum, s) => sum + s.cod, 0) / snapshots.length).toFixed(1),
          prd: +(snapshots.reduce((sum, s) => sum + s.prd, 0) / snapshots.length).toFixed(3),
          // PRB and tierSlope come from the county-wide ratio study (store → API), not from
          // neighborhood averages which don't compute these regression-based metrics.
          prb: ratioData.prb ?? 0,
          tierSlope: ratioData.tierSlope ?? 0,
          medianRatio: +(
            snapshots.reduce((sum, s) => sum + s.median_ratio, 0) / snapshots.length
          ).toFixed(3),
          sampleSize: snapshots.reduce((sum, s) => sum + s.sale_count, 0),
        }
      : null;

  const tabHasFixtureData = (tab: Tab): boolean => {
    if (tab === 'ratio-study') return isFixture.studyResult;
    if (tab === 'outliers') return isFixture.outliers;
    if (tab === 'comparison') return isFixture.comparison;
    return false; // trends, equity, calibration, cost-analytics are fully live
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ratio-study', label: 'Ratio Study' },
    { key: 'stratified', label: 'Stratified Study' },
    { key: 'calibration', label: 'Calibration Matrix' },
    { key: 'trends', label: 'Trends' },
    { key: 'equity', label: 'Equity (VEI)' },
    { key: 'outliers', label: 'Outliers' },
    { key: 'comparison', label: 'Comparison' },
    { key: 'cost-analytics', label: 'Cost Analytics' },
  ];

  return (
    <div data-testid="statistics-studio" className="space-y-4 p-4">
      {tabHasFixtureData(activeTab) && <DemoDataBanner module="Statistics Studio" />}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Statistics Studio</h1>
          <Badge variant="secondary">IAAO Compliant</Badge>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              data-testid={`tab-${tab.key}`}
              variant={activeTab === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
          <div className="border-l border-border mx-2 self-stretch" />
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
            onClick={() => {
              const next = !showAdvanced;
              setShowAdvanced(next);
              if (!next && ADVANCED_TABS.includes(activeTab)) {
                setActiveTab('ratio-study');
              }
            }}
          >
            {showAdvanced ? 'Hide Advanced ↑' : 'Show Advanced Analysis ↓'}
          </button>
          {showAdvanced && (
            <>
              <Button
                data-testid="tab-diagnostics"
                variant={activeTab === 'diagnostics' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('diagnostics')}
              >
                Diagnostics
              </Button>
              <Button
                data-testid="tab-spatial-temporal"
                variant={activeTab === 'spatial-temporal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('spatial-temporal')}
              >
                Spatial &amp; Temporal
              </Button>
              <Button
                data-testid="tab-calibration-engine"
                variant={activeTab === 'calibration-engine' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('calibration-engine')}
              >
                Calibration Engine
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tab: Ratio Study */}
      {activeTab === 'ratio-study' && (
        <Card data-material="bento">
          <CardHeader>
            <CardTitle>Benton County Ratio Study</CardTitle>
          </CardHeader>
          <CardContent>
            <RatioStudyPanel
              ratioData={ratioData}
              loading={false}
              onRefresh={() => fetchStudy()}
            />
          </CardContent>
        </Card>
      )}

      {/* Tab: Stratified Study — IAAO DOR strata table */}
      {activeTab === 'stratified' && <StratifiedStudyPanel />}

      {/* Tab: Trends — live quarterly COD/PRD */}
      {activeTab === 'trends' && (
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
              <PRDTrendChart
                data={trendsData?.prdTrend ?? []}
                loading={trendsLoading}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Equity (VEI) — live neighborhood stats */}
      {activeTab === 'equity' && (
        <Card data-material="bento">
          <CardHeader>
            <CardTitle>Valuation Equity Index</CardTitle>
          </CardHeader>
          <CardContent>
            <VEIDashboard
              metrics={liveVeiMetrics}
              neighborhoods={neighborhoods}
              availableTaxYears={[2024, 2025, 2026]}
              loading={equityLoading}
              onTaxYearChange={() => {}}
              onSalesWindowChange={() => {}}
              onOutlierMethodChange={() => {}}
            />
          </CardContent>
        </Card>
      )}

      {/* Tab: Outliers (Phase 16) */}
      {activeTab === 'outliers' && <OutlierReviewPanel />}

      {/* Tab: Comparison (Phase 16) */}
      {activeTab === 'comparison' && <ModelComparisonPanel />}

      {/* Tab: Calibration Matrix — live neighborhood ratio study + value driver attribution */}
      {activeTab === 'calibration' && (
        <div className="space-y-4">
          <CostRatioAnalysis />
          <ValueDriverPanel />
        </div>
      )}

      {/* Tab: Cost Analytics — CostForge dashboard stats (property type dist, depreciation) */}
      {activeTab === 'cost-analytics' && <CostForgeDashboard />}

      {/* Advanced Analysis Tabs */}
      {activeTab === 'diagnostics' && <DiagnosticsTab />}
      {activeTab === 'spatial-temporal' && <SpatialTemporalTab />}
      {activeTab === 'calibration-engine' && <CalibrationEngineTab />}
    </div>
  );
}

export default StatisticsStudio;
