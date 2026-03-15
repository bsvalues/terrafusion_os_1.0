// TFT-155 — Economic analysis page
import React from 'react';
import { EconomicIndicatorsDashboard } from '@/components/forge/EconomicIndicatorsDashboard';
import { MarketCyclePredictor } from '@/components/forge/MarketCyclePredictor';
import { MarketMetricsChartComponent } from '@/components/forge/MarketMetricsChartComponent';

export function EconomicAnalysisPage() {
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Economic Analysis</h1>
      <p className="text-sm text-muted-foreground">
        Economic indicators and their impact on property values
      </p>

      <EconomicIndicatorsDashboard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MarketMetricsChartComponent title="Value Trends vs Economic Factors" />
        <MarketCyclePredictor />
      </div>
    </div>
  );
}
