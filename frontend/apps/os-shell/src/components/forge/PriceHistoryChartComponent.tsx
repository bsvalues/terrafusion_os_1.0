// TFT-143 — Price history chart component
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { PriceHistoryPoint } from '@/types/realEstate';
import { getPriceHistory } from '@/services/forge/marketTrendsClientService';

interface PriceHistoryChartComponentProps {
  parcelId: string;
}

export function PriceHistoryChartComponent({ parcelId }: PriceHistoryChartComponentProps) {
  const [data, setData] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getPriceHistory(parcelId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [parcelId]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Price History</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading ? (
          <div className="animate-pulse h-56 rounded bg-primary/10" />
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No price history available</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--tf-border) / 0.6)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`,
                  name === 'assessedValue'
                    ? 'Assessed'
                    : name === 'marketValue'
                    ? 'Market'
                    : 'Sale Price',
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="assessedValue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Assessed"
              />
              <Line
                type="monotone"
                dataKey="marketValue"
                stroke="hsl(var(--tf-success))"
                strokeWidth={2}
                dot={false}
                name="Market"
              />
              <Line
                type="monotone"
                dataKey="salePrice"
                stroke="hsl(var(--tf-warning))"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
                name="Sale Price"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
