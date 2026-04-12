/**
 * BenchmarkingVisualization
 *
 * Renders bar charts from /api/benchmarking/statistical-data (TerraFusion .NET API).
 * Shows avg, min, max cost/sqft by building type across Benton County cost matrices.
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface BenchmarkingVisualizationProps {
  buildingType?: string;
  region?: string;
  year?: number;
  squareFootage?: number;
  calculationId?: number;
}

interface StatRow {
  name: string;
  avg: number;
  min: number;
  max: number;
}

interface BenchmarkData {
  costPerSqft: StatRow[];
  totalCost: Array<{ name: string; count: number; avg: number }>;
  regionalComparison: Array<{ name: string; value: number }>;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const BenchmarkingVisualization: React.FC<BenchmarkingVisualizationProps> = ({
  buildingType,
  region,
}) => {
  const [activeTab, setActiveTab] = useState('costPerSqft');

  const { data, isLoading, error } = useQuery<BenchmarkData>({
    queryKey: ['/api/benchmarking/statistical-data', buildingType, region],
    queryFn: async () => {
      const url = `/api/benchmarking/statistical-data?county=Benton${buildingType ? `&buildingType=${encodeURIComponent(buildingType)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const stats: Array<{
        buildingType?: string; BuildingType?: string;
        buildingTypeLabel?: string;
        count?: number; Count?: number;
        minRate?: number; MinRate?: number; minValue?: number; MinValue?: number;
        maxRate?: number; MaxRate?: number; maxValue?: number; MaxValue?: number;
        meanRate?: number; MeanRate?: number; meanValue?: number; MeanValue?: number;
      }> = json?.statistics ?? json?.Statistics ?? json?.data ?? [];

      return {
        costPerSqft: stats.map((s) => ({
          name: (s.buildingTypeLabel ?? s.BuildingType ?? s.buildingType ?? 'Unknown').substring(0, 12),
          avg: s.meanRate ?? s.MeanRate ?? s.meanValue ?? s.MeanValue ?? 0,
          min: s.minRate ?? s.MinRate ?? s.minValue ?? s.MinValue ?? 0,
          max: s.maxRate ?? s.MaxRate ?? s.maxValue ?? s.MaxValue ?? 0,
        })),
        totalCost: stats.map((s) => ({
          name: (s.buildingTypeLabel ?? s.BuildingType ?? s.buildingType ?? 'Unknown').substring(0, 12),
          count: s.count ?? s.Count ?? 0,
          avg: s.meanRate ?? s.MeanRate ?? s.meanValue ?? s.MeanValue ?? 0,
        })),
        regionalComparison: stats.map((s) => ({
          name: (s.buildingTypeLabel ?? s.BuildingType ?? s.buildingType ?? 'Unknown').substring(0, 12),
          value: s.meanRate ?? s.MeanRate ?? s.meanValue ?? s.MeanValue ?? 0,
        })),
      };
    },
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle>
          <div className="text-sm text-muted-foreground mt-1"><Skeleton className="h-4 w-1/2" /></div>
        </CardHeader>
        <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
      </Card>
    );
  }

  if (error || !data || data.costPerSqft.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Building Cost Benchmarks</CardTitle>
          <CardDescription>Benton County cost matrix statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {error ? `Error loading benchmarks: ${(error as Error).message}` : 'No benchmark data available.'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Building Cost Benchmarks</CardTitle>
        <CardDescription>
          Benton County cost matrix — avg, min, max base rate by building type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="costPerSqft" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="costPerSqft">Cost / Sq.Ft</TabsTrigger>
            <TabsTrigger value="totalCost">Sample Counts</TabsTrigger>
            <TabsTrigger value="regional">Regional Compare</TabsTrigger>
          </TabsList>

          <TabsContent value="costPerSqft">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.costPerSqft} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="min" fill="#82ca9d" name="Min ($/sqft)" />
                <Bar dataKey="avg" fill="#8884d8" name="Avg ($/sqft)" />
                <Bar dataKey="max" fill="#ff7c7c" name="Max ($/sqft)" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="totalCost">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.totalCost} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Record Count" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="regional">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.regionalComparison} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" fill="#8884d8" name="Mean Base Rate" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BenchmarkingVisualization;
