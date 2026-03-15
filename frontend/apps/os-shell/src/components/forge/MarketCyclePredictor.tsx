// TFT-128 — Market cycle predictor widget
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MarketCycle } from '@/types/realEstate';
import { getMarketCycle } from '@/services/forge/marketTrendsClientService';

const phaseConfig = {
  expansion: { color: 'bg-green-500', label: 'Expansion' },
  peak: { color: 'bg-yellow-500', label: 'Peak' },
  contraction: { color: 'bg-red-500', label: 'Contraction' },
  trough: { color: 'bg-blue-500', label: 'Trough' },
};

const phaseOrder: MarketCycle['phase'][] = ['expansion', 'peak', 'contraction', 'trough'];

export function MarketCyclePredictor() {
  const [cycle, setCycle] = useState<MarketCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMarketCycle()
      .then(setCycle)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Market Cycle</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-8 rounded bg-primary/10" />
            <div className="h-4 w-1/2 rounded bg-primary/10" />
          </div>
        ) : cycle ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {phaseOrder.map((phase) => (
                <div key={phase} className="flex flex-col items-center flex-1">
                  <div
                    className={`h-3 w-3 rounded-full ${phaseConfig[phase].color} ${
                      cycle.phase === phase ? 'ring-2 ring-offset-2 ring-offset-background' : 'opacity-30'
                    }`}
                  />
                  <span className={`text-[10px] mt-1 ${cycle.phase === phase ? 'font-semibold' : 'text-muted-foreground'}`}>
                    {phaseConfig[phase].label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Badge variant={cycle.confidence >= 0.7 ? 'success' : 'warning'}>
                {(cycle.confidence * 100).toFixed(0)}% confidence
              </Badge>
              <span className="text-xs text-muted-foreground">
                {cycle.duration} months in phase
              </span>
            </div>

            {cycle.indicators.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Indicators</p>
                {cycle.indicators.map((ind, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>{ind.name}</span>
                    <span className="text-muted-foreground">{ind.signal}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No cycle data available</p>
        )}
      </CardContent>
    </Card>
  );
}
