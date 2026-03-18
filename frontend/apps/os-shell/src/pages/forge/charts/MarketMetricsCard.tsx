import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MarketMetrics {
  cod: number;
  prd: number;
  medianRatio: number;
  sampleSize: number;
  meanRatio: number;
}

interface MarketMetricsCardProps {
  metrics: MarketMetrics | null;
  loading?: boolean;
  error?: string | null;
}

export function MarketMetricsCard({ metrics, loading, error }: MarketMetricsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">Loading metrics...</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const codStatus = metrics.cod <= 15 ? 'Acceptable' : metrics.cod <= 20 ? 'Marginal' : 'High';
  const codColor = metrics.cod <= 15 ? 'text-green-600' : metrics.cod <= 20 ? 'text-yellow-600' : 'text-red-600';

  const prdStatus = metrics.prd >= 0.98 && metrics.prd <= 1.03 ? 'Acceptable' : 'Out of Range';
  const prdColor = metrics.prd >= 0.98 && metrics.prd <= 1.03 ? 'text-green-600' : 'text-red-600';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Market Metrics Summary</CardTitle>
          <Badge variant="outline">BIV-118</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">COD</div>
            <div className="text-lg font-bold">{metrics.cod.toFixed(2)}</div>
            <div className={`text-xs ${codColor}`}>{codStatus}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">PRD</div>
            <div className="text-lg font-bold">{metrics.prd.toFixed(4)}</div>
            <div className={`text-xs ${prdColor}`}>{prdStatus}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Median Ratio</div>
            <div className="text-lg font-bold">{metrics.medianRatio.toFixed(4)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Sample Size</div>
            <div className="text-lg font-bold">{metrics.sampleSize.toLocaleString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
