import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface SegmentData {
  segment: string;
  medianValue: number;
  avgValue: number;
  salesCount: number;
  cod: number;
}

export function SegmentComparisonChart() {
  const [data, setData] = useState<SegmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSegments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/market/segments');
        if (!res.ok) throw new Error('Failed to fetch segment data');
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchSegments();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Segment Comparison</h2>
        <Badge variant="outline">BIV-132</Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading && <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading segments...</div>}
          {error && <div className="h-[300px] flex items-center justify-center text-destructive">{error}</div>}
          {!loading && !error && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="segment" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="medianValue" name="Median Value" fill="hsl(var(--primary))" />
                <Bar dataKey="avgValue" name="Average Value" fill="hsl(var(--muted-foreground))" opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
