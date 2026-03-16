/**
 * StatisticsStudio.tsx
 *
 * Statistics Studio orchestrator for the TerraForge suite.
 * Tabbed dashboard integrating ratio study, trend charts, and equity (VEI) analysis.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RatioStudyPanel from './RatioStudyPanel';
import CODTrendChart from './charts/CODTrendChart';
import PRDTrendChart from './charts/PRDTrendChart';
import VEIDashboard from './VEIDashboard';

type Tab = 'ratio-study' | 'trends' | 'equity';

// --- Sample data: Benton County ---

const sampleRatioData = {
  medianRatio: 0.985,
  cod: 12.4,
  prd: 1.008,
  prb: -0.023,
  sampleSize: 1847,
  salesPeriod: 'Jul 2025 \u2013 Jun 2026',
};

const sampleCODTrend = [
  { period: 'Q1-2025', cod: 13.8 },
  { period: 'Q2-2025', cod: 13.1 },
  { period: 'Q3-2025', cod: 12.6 },
  { period: 'Q4-2025', cod: 11.9 },
  { period: 'Q1-2026', cod: 12.4 },
  { period: 'Q2-2026', cod: 11.7 },
];

const samplePRDTrend = [
  { period: 'Q1-2025', prd: 1.024 },
  { period: 'Q2-2025', prd: 1.018 },
  { period: 'Q3-2025', prd: 1.012 },
  { period: 'Q4-2025', prd: 1.005 },
  { period: 'Q1-2026', prd: 1.008 },
  { period: 'Q2-2026', prd: 1.003 },
];

const sampleVEIMetrics = {
  cod: 12.4,
  prd: 1.008,
  prb: -0.023,
  tierSlope: 0.012,
  medianRatio: 0.985,
  sampleSize: 1847,
};

const sampleNeighborhoods = [
  { neighborhood: 'Richland', medianRatio: 0.978, cod: 11.2, sampleSize: 523 },
  { neighborhood: 'Kennewick', medianRatio: 0.992, cod: 13.1, sampleSize: 487 },
  { neighborhood: 'Pasco', medianRatio: 1.005, cod: 14.3, sampleSize: 412 },
  { neighborhood: 'West Richland', medianRatio: 0.969, cod: 10.8, sampleSize: 268 },
  { neighborhood: 'Prosser', medianRatio: 1.012, cod: 12.9, sampleSize: 157 },
];

const sampleTaxYears = [2026, 2025, 2024, 2023];

// --- Component ---

export function StatisticsStudio() {
  const [activeTab, setActiveTab] = useState<Tab>('ratio-study');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ratio-study', label: 'Ratio Study' },
    { key: 'trends', label: 'Trends' },
    { key: 'equity', label: 'Equity (VEI)' },
  ];

  return (
    <div data-testid="statistics-studio" className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Statistics Studio</h1>
          <Badge variant="secondary">IAAO Compliant</Badge>
        </div>
        <div className="flex gap-2">
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
              ratioData={sampleRatioData}
              loading={false}
              onRefresh={() => {}}
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
              <CODTrendChart data={sampleCODTrend} threshold={15} loading={false} />
            </CardContent>
          </Card>
          <Card data-material="bento">
            <CardHeader>
              <CardTitle>PRD Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <PRDTrendChart data={samplePRDTrend} loading={false} />
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
              metrics={sampleVEIMetrics}
              neighborhoods={sampleNeighborhoods}
              availableTaxYears={sampleTaxYears}
              loading={false}
              onTaxYearChange={() => {}}
              onSalesWindowChange={() => {}}
              onOutlierMethodChange={() => {}}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StatisticsStudio;
