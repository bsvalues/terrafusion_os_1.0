import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PredictionPoint {
  period: string;
  actual: number | null;
  predicted: number;
  upperBound: number;
  lowerBound: number;
}

interface MarketPredictionChartProps {
  neighborhood?: string;
}

export function MarketPredictionChart({ neighborhood }: MarketPredictionChartProps) {
  const [data, setData] = useState<PredictionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (neighborhood) params.set('neighborhood', neighborhood);
        const res = await fetch(`/api/market/predictions?${params}`);
        if (!res.ok) throw new Error('Failed to fetch predictions');
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, [neighborhood]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Market Prediction</h2>
        <Badge variant="outline">BIV-129</Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading && <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading predictions...</div>}
          {error && <div className="h-[300px] flex items-center justify-center text-destructive">{error}</div>}
          {!loading && !error && (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  name="Upper Confidence"
                  stroke="none"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.1}
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  name="Lower Confidence"
                  stroke="none"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.1}
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  name="Predicted"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="hsl(var(--foreground))"
                  fill="none"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
