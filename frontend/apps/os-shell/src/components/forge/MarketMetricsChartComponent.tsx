// TFT-142 — Market metrics chart component
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { TrendPoint } from '@/types/realEstate';
import { getMarketMetrics } from '@/services/forge/marketTrendsClientService';

interface MarketMetricsChartComponentProps {
  propertyType?: string;
  title?: string;
}

export function MarketMetricsChartComponent({
  propertyType,
  title = 'Market Metrics',
}: MarketMetricsChartComponentProps) {
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getMarketMetrics({ propertyType })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [propertyType]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading ? (
          <div className="animate-pulse h-64 rounded bg-primary/10" />
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No market metrics data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--tf-border) / 0.6)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="value"
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="volume"
                orientation="right"
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'value'
                    ? [`$${value.toLocaleString()}`, 'Median Value']
                    : [value, 'Sales Volume']
                }
              />
              <Legend />
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="hsl(var(--primary))"
                opacity={0.4}
                name="Volume"
              />
              <Line
                yAxisId="value"
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--tf-success))"
                strokeWidth={2}
                dot={false}
                name="Median Value"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
