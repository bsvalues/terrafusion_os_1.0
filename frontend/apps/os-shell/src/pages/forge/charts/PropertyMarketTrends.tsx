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
  Legend,
} from 'recharts';

interface PropertyMarketPoint {
  period: string;
  assessedValue: number;
  marketValue: number;
  neighborhoodMedian: number;
  countyMedian: number;
}

interface PropertyMarketTrendsProps {
  parcelId: string;
}

export function PropertyMarketTrends({ parcelId }: PropertyMarketTrendsProps) {
  const [data, setData] = useState<PropertyMarketPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/properties/${parcelId}/market-trends`);
        if (!res.ok) throw new Error('Failed to fetch property market trends');
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    if (parcelId) fetchTrends();
  }, [parcelId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Property Market Context</h2>
        <Badge variant="outline">BIV-131</Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading && <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading trends...</div>}
          {error && <div className="h-[300px] flex items-center justify-center text-destructive">{error}</div>}
          {!loading && !error && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="assessedValue" name="Assessed" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="marketValue" name="Market" stroke="hsl(var(--destructive))" strokeWidth={2} />
                <Line type="monotone" dataKey="neighborhoodMedian" name="Neighborhood Median" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="countyMedian" name="County Median" stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" opacity={0.5} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
