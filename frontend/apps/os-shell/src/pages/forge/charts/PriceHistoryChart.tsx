import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';

interface SaleEvent {
  date: string;
  price: number;
  type: string;
  buyer: string;
}

interface PriceHistoryChartProps {
  parcelId: string;
}

export function PriceHistoryChart({ parcelId }: PriceHistoryChartProps) {
  const [sales, setSales] = useState<SaleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/properties/${parcelId}/sale-history`);
        if (!res.ok) throw new Error('Failed to fetch price history');
        setSales(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    if (parcelId) fetchHistory();
  }, [parcelId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Price History</h2>
        <Badge variant="outline">BIV-130</Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading && <div className="h-[250px] flex items-center justify-center text-muted-foreground">Loading history...</div>}
          {error && <div className="h-[250px] flex items-center justify-center text-destructive">{error}</div>}
          {!loading && !error && sales.length === 0 && (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">No sale history available.</div>
          )}
          {!loading && !error && sales.length > 0 && (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={sales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => `$${v.toLocaleString()}`}
                  labelFormatter={(label) => `Sale Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  name="Sale Price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 5, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
