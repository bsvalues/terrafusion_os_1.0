/**
 * BenchmarkingVisualization
 *
 * Renders bar charts from /api/benchmarking endpoints (TerraFusion .NET API).
 * Data source: Benton County in-memory cost matrix (BentonCostData.CostMatrix).
 *
 * Tab 1 — Cost / Sq.Ft: avg/min/max base rate by building type (filtered by revalArea if set)
 * Tab 2 — Sample Counts: record count by building type
 * Tab 3 — By Reval Area: avg base rate per Reval Area across all or one building type
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
  region?: string;       // Reval Area code, e.g. "Reval 1"
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

interface RevalAreaRow {
  name: string;   // "Reval 1", "Reval 2", …
  avg: number;
  min: number;
  max: number;
  count: number;
}

interface BenchmarkData {
  costPerSqft: StatRow[];
  totalCost: Array<{ name: string; count: number; avg: number }>;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const BenchmarkingVisualization: React.FC<BenchmarkingVisualizationProps> = ({
  buildingType,
  region,
}) => {
  const [activeTab, setActiveTab] = useState('costPerSqft');

  // Query 1: statistical-data by building type (optionally filtered by revalArea)
  const { data, isLoading, error } = useQuery<BenchmarkData>({
    queryKey: ['/api/benchmarking/statistical-data', buildingType, region],
    queryFn: async () => {
      let url = `/api/benchmarking/statistical-data?county=Benton`;
      if (buildingType) url += `&buildingType=${encodeURIComponent(buildingType)}`;
      if (region)       url += `&revalArea=${encodeURIComponent(region)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const stats: Array<{
        buildingType?: string; BuildingType?: string;
        buildingTypeLabel?: string; BuildingTypeLabel?: string;
        count?: number; Count?: number;
        minRate?: number; MinRate?: number;
        maxRate?: number; MaxRate?: number;
        meanRate?: number; MeanRate?: number;
      }> = json?.statistics ?? json?.Statistics ?? json?.data ?? [];

      return {
        costPerSqft: stats.map((s) => ({
          name: (s.buildingTypeLabel ?? s.BuildingTypeLabel ?? s.BuildingType ?? s.buildingType ?? 'Unknown').substring(0, 14),
          avg: s.meanRate ?? s.MeanRate ?? 0,
          min: s.minRate  ?? s.MinRate  ?? 0,
          max: s.maxRate  ?? s.MaxRate  ?? 0,
        })),
        totalCost: stats.map((s) => ({
          name: (s.buildingTypeLabel ?? s.BuildingTypeLabel ?? s.BuildingType ?? s.buildingType ?? 'Unknown').substring(0, 14),
          count: s.count ?? s.Count ?? 0,
          avg: s.meanRate ?? s.MeanRate ?? 0,
        })),
      };
    },
  });

  // Query 2: regional-costs grouped by Reval Area
  const { data: revalData, isLoading: revalLoading } = useQuery<RevalAreaRow[]>({
    queryKey: ['/api/benchmarking/regional-costs', buildingType],
    queryFn: async () => {
      let url = `/api/benchmarking/regional-costs?county=Benton`;
      if (buildingType) url += `&buildingType=${encodeURIComponent(buildingType)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rows: Array<{
        region?: string; Region?: string; revalArea?: string; RevalArea?: string;
        count?: number; Count?: number;
        avgRate?: number; AvgRate?: number;
        minRate?: number; MinRate?: number;
        maxRate?: number; MaxRate?: number;
      }> = json?.regionalCosts ?? json?.RegionalCosts ?? [];
      return rows.map((r) => ({
        name:  r.revalArea ?? r.RevalArea ?? r.Region ?? r.region ?? 'Unknown',
        avg:   r.avgRate   ?? r.AvgRate   ?? 0,
        min:   r.minRate   ?? r.MinRate   ?? 0,
        max:   r.maxRate   ?? r.MaxRate   ?? 0,
        count: r.count     ?? r.Count     ?? 0,
      }));
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

  const subtitle = [
    buildingType ? `Building type: ${buildingType}` : 'All building types',
    region       ? `Reval Area: ${region}` : 'All Reval Areas',
  ].join(' · ');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Building Cost Benchmarks</CardTitle>
        <CardDescription>
          Benton County cost matrix — {subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="costPerSqft" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="costPerSqft">Cost / Sq.Ft</TabsTrigger>
            <TabsTrigger value="totalCost">Sample Counts</TabsTrigger>
            <TabsTrigger value="revalArea">By Reval Area</TabsTrigger>
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
                <Bar dataKey="count" fill="#8884d8" name="Matrix Entries" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="revalArea">
            {revalLoading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : !revalData || revalData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No Reval Area data available.</div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  Average base cost ($/sqft) by Reval Area (PACS Cycle field).
                  {buildingType ? ` Filtered to: ${buildingType}.` : ' All building types.'}
                </p>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={revalData} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
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
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BenchmarkingVisualization;
