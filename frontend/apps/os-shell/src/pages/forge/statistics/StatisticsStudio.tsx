/**
 * StatisticsStudio.tsx
 *
 * Statistics Studio orchestrator for the TerraForge suite.
 * Tabbed dashboard integrating ratio study, trend charts, equity (VEI) analysis,
 * outlier review, and model comparison. (Phase 16: +Outliers, +Comparison tabs)
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RatioStudyPanel from './RatioStudyPanel';
import CODTrendChart from './charts/CODTrendChart';
import PRDTrendChart from './charts/PRDTrendChart';
import VEIDashboard from './VEIDashboard';
import { OutlierReviewPanel } from './OutlierReviewPanel';
import { ModelComparisonPanel } from './ModelComparisonPanel';
import { useForgeStatisticsStore } from '@/stores/forgeStatisticsStore';
import { DemoDataBanner } from '@/components/governance/DemoDataBanner';
import {
  RATIO_STUDY_RESULT,
  COD_TREND,
  PRD_TREND,
  VEI_METRICS,
  NEIGHBORHOODS,
  TAX_YEARS,
} from '@/data/forgeStatisticsFixtures';

type Tab = 'ratio-study' | 'trends' | 'equity' | 'outliers' | 'comparison';

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

export function StatisticsStudio() {
  const [activeTab, setActiveTab] = useState<Tab>('ratio-study');
  const fetchStudy = useForgeStatisticsStore((s) => s.fetchStudy);
  const loadComparison = useForgeStatisticsStore((s) => s.loadComparison);
  const ratioData = useRatioData();

  useEffect(() => {
    fetchStudy();
    loadComparison();
  }, [fetchStudy, loadComparison]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ratio-study', label: 'Ratio Study' },
    { key: 'trends', label: 'Trends' },
    { key: 'equity', label: 'Equity (VEI)' },
    { key: 'outliers', label: 'Outliers' },
    { key: 'comparison', label: 'Comparison' },
  ];

  return (
    <div data-testid="statistics-studio" className="space-y-4 p-4">
      {ratioData.isFixture && <DemoDataBanner module="Statistics Studio" />}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Statistics Studio</h1>
          <Badge variant="secondary">IAAO Compliant</Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
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

      {/* Tab: Trends */}
      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card data-material="bento">
            <CardHeader>
              <CardTitle>COD Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <CODTrendChart data={COD_TREND} threshold={15} loading={false} />
            </CardContent>
          </Card>
          <Card data-material="bento">
            <CardHeader>
              <CardTitle>PRD Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <PRDTrendChart data={PRD_TREND} loading={false} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Equity (VEI) */}
      {activeTab === 'equity' && (
        <Card data-material="bento">
          <CardHeader>
            <CardTitle>Valuation Equity Index</CardTitle>
          </CardHeader>
          <CardContent>
            <VEIDashboard
              metrics={VEI_METRICS}
              neighborhoods={NEIGHBORHOODS}
              availableTaxYears={TAX_YEARS}
              loading={false}
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
    </div>
  );
}

export default StatisticsStudio;
