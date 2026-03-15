// TFT-151 — Market trends page
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MarketMetricsChartComponent } from '@/components/forge/MarketMetricsChartComponent';
import { MarketAnalyticsDashboard } from '@/components/forge/MarketAnalyticsDashboard';
import { MarketCyclePredictor } from '@/components/forge/MarketCyclePredictor';
import type { MarketSegment } from '@/types/realEstate';
import { getMarketSegments } from '@/services/forge/marketTrendsClientService';

export function MarketTrendsPage() {
  const [segments, setSegments] = useState<MarketSegment[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketSegments()
      .then((data) => {
        setSegments(data);
        const types = [...new Set(data.map((s) => s.propertyType))];
        if (types.length > 0 && !selectedType) setSelectedType(types[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const propertyTypes = [...new Set(segments.map((s) => s.propertyType))];

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Market Trends</h1>
      <p className="text-sm text-muted-foreground">
        Time series analysis and segment performance
      </p>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {propertyTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`rounded-md px-3 py-1 text-sm ${
                  selectedType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'border hover:bg-muted'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <MarketMetricsChartComponent
            propertyType={selectedType}
            title={`${selectedType} Market Metrics`}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <MarketAnalyticsDashboard />
            </div>
            <div>
              <MarketCyclePredictor />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
