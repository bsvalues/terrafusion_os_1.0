import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MetricsTrendPoint {
  period: string;
  cod: number;
  prd: number;
  medianRatio: number;
}

interface MarketMetricsChartProps {
  neighborhood?: string;
}

export function MarketMetricsChart({ neighborhood }: MarketMetricsChartProps) {
  const [data, setData] = useState<MetricsTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (neighborhood) params.set('neighborhood', neighborhood);
        const res = await fetch(`/api/market/metrics/trends?${params}`);
        if (!res.ok) throw new Error('Failed to fetch metrics trends');
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [neighborhood]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Market Metrics Trends</h2>
        <Badge variant="outline">BIV-128</Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading && <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading chart...</div>}
          {error && <div className="h-[300px] flex items-center justify-center text-destructive">{error}</div>}
          {!loading && !error && (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" label={{ value: 'COD', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'PRD', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="cod" name="COD" fill="hsl(var(--primary))" opacity={0.7} />
                <Line yAxisId="right" type="monotone" dataKey="prd" name="PRD" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
