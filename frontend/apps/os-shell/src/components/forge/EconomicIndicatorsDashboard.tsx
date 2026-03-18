// TFT-136 — Economic indicators dashboard
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EconomicIndicator } from '@/types/realEstate';
import { getEconomicIndicators } from '@/services/forge/marketTrendsClientService';

const categoryLabels: Record<string, string> = {
  employment: 'Employment',
  housing: 'Housing',
  demographic: 'Demographics',
  income: 'Income',
};

export function EconomicIndicatorsDashboard() {
  const [indicators, setIndicators] = useState<EconomicIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEconomicIndicators()
      .then(setIndicators)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const grouped = indicators.reduce<Record<string, EconomicIndicator[]>>((acc, ind) => {
    (acc[ind.category] ??= []).push(ind);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Economic Indicators</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-primary/10" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="rounded-md border p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  {categoryLabels[category] ?? category}
                </p>
                <div className="space-y-2">
                  {items.map((ind) => {
                    const isPositive = ind.changePercent >= 0;
                    return (
                      <div key={ind.indicatorId} className="flex items-center justify-between">
                        <span className="text-sm">{ind.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {ind.value.toLocaleString()}{ind.unit}
                          </span>
                          <Badge variant={isPositive ? 'success' : 'error'} className="text-[10px] px-1.5">
                            {isPositive ? '+' : ''}{ind.changePercent.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
