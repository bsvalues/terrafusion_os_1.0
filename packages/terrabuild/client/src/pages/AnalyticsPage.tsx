import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import {
  AlertCircle, BarChart3, TrendingUp, Map, Calculator, Layers, Zap,
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

const CHART_COLORS = ['#1e6fa8', '#2a9d8f', '#e76f51', '#264653', '#f4a261', '#e9c46a', '#8ecae6', '#219ebc', '#ffb703', '#fb8500'];

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const formatCurrency = (v: number) => fmt.format(v);
const fmtRate = (v: number) => `$${v.toFixed(2)}/sqft`;

function ChartSkeleton({ height = 360 }: { height?: number }) {
  return <div style={{ height }} className="flex items-center justify-center"><Skeleton className="h-full w-full" /></div>;
}

function Empty({ label }: { label: string }) {
  return (
    <div className="h-[360px] flex items-center justify-center text-muted-foreground text-sm">
      <div className="text-center space-y-2">
        <AlertCircle className="h-8 w-8 mx-auto opacity-40" />
        <p>{label}</p>
      </div>
    </div>
  );
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ── Building types from cost matrix ─────────────────────────────────────────
const ALL_BUILDING_TYPES = [
  { code: 'all', label: 'All Types' },
  { code: 'R1',  label: 'R1 — Single Family Residential' },
  { code: 'R2',  label: 'R2 — Multi-Family Residential' },
  { code: 'C1',  label: 'C1 — Commercial Retail' },
  { code: 'C2',  label: 'C2 — Office' },
  { code: 'C3',  label: 'C3 — Restaurant' },
  { code: 'C4',  label: 'C4 — Warehouse' },
  { code: 'A1',  label: 'A1 — Farm' },
  { code: 'A2',  label: 'A2 — Ranch' },
  { code: 'I1',  label: 'I1 — Industrial' },
  { code: 'S1',  label: 'S1 — Hospital' },
  { code: 'S2',  label: 'S2 — School' },
];

const QUALITY_GRADES = [
  { code: 'all',      label: 'All Quality Grades' },
  { code: 'ECONOMY',  label: 'Economy (Grade E)' },
  { code: 'STANDARD', label: 'Standard (Grade C)' },
  { code: 'CUSTOM',   label: 'Custom (Grade B)' },
  { code: 'PREMIUM',  label: 'Premium (Grade A)' },
  { code: 'LUXURY',   label: 'Luxury (Grade A+)' },
];

const CONDITION_GRADES = [
  { code: 'all',       label: 'All Conditions' },
  { code: 'POOR',      label: 'Poor' },
  { code: 'FAIR',      label: 'Fair' },
  { code: 'GOOD',      label: 'Good (typical)' },
  { code: 'EXCELLENT', label: 'Excellent' },
];

const COMPLEXITY_GRADES = [
  { code: 'SIMPLE',        label: 'Simple' },
  { code: 'STANDARD',      label: 'Standard' },
  { code: 'COMPLEX',       label: 'Complex' },
  { code: 'HIGHLY_COMPLEX', label: 'Highly Complex' },
];

const REVAL_AREAS = [
  { code: 'all',    label: 'All Reval Areas' },
  { code: 'Reval 1', label: 'Reval 1 — Kennewick (Urban Core)' },
  { code: 'Reval 2', label: 'Reval 2 — West Richland / Badger Mtn' },
  { code: 'Reval 3', label: 'Reval 3 — North Richland / Horn Rapids' },
  { code: 'Reval 4', label: 'Reval 4 — East Benton / Benton City' },
  { code: 'Reval 5', label: 'Reval 5 — Prosser / Wine Country' },
  { code: 'Reval 6', label: 'Reval 6 — Rural / Agricultural Lands' },
];

const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cost-matrix');
  const [timeRange, setTimeRange]     = useState('12m');
  const [revalArea, setRevalArea]     = useState('all');
  const [buildingType, setBuildingType] = useState('all');
  const [quality, setQuality]         = useState('all');
  const [condition, setCondition]     = useState('all');

  // Cost Build-Up controls
  const [buType,       setBuType]       = useState('R1');
  const [buRevalArea,  setBuRevalArea]  = useState('Reval 1');
  const [buQuality,    setBuQuality]    = useState('STANDARD');
  const [buCondition,  setBuCondition]  = useState('GOOD');
  const [buComplexity, setBuComplexity] = useState('STANDARD');
  const [buSqft,       setBuSqft]       = useState('2000');
  const [buAge,        setBuAge]        = useState('10');

  // ── Data queries ───────────────────────────────────────────────────────────
  const matrixQuery = useQuery({
    queryKey: ['/api/costforge/cost-matrix/benton', revalArea, buildingType, quality],
    queryFn: () => fetchJson('/api/costforge/cost-matrix/benton'),
    staleTime: 300_000,
  });

  const trendsQuery = useQuery({
    queryKey: ['/api/analytics/trends', timeRange, revalArea, buildingType],
    queryFn: () => fetchJson(
      `/api/analytics/trends?timeRange=${timeRange}` +
      (revalArea !== 'all' ? `&revalArea=${revalArea}` : '') +
      (buildingType !== 'all' ? `&buildingType=${buildingType}` : '')
    ),
    retry: 1, staleTime: 60_000,
  });

  const neighborhoodQuery = useQuery({
    queryKey: ['/api/costforge/neighborhoods'],
    queryFn: () => fetchJson('/api/costforge/neighborhoods'),
    staleTime: 300_000,
  });

  const featureQuery = useQuery({
    queryKey: ['/api/costforge/feature-factors'],
    queryFn: () => fetchJson('/api/costforge/feature-factors'),
    staleTime: 300_000,
  });

  const benchStatsQuery = useQuery({
    queryKey: ['/api/benchmarking/statistical-data'],
    queryFn: () => fetchJson('/api/benchmarking/statistical-data?county=Benton'),
    staleTime: 300_000,
  });

  const breakdownQuery = useQuery({
    queryKey: ['/api/costforge/cost-breakdown', buType, buRevalArea, buQuality, buCondition, buComplexity, buSqft, buAge],
    queryFn: () => fetchJson(
      `/api/costforge/cost-breakdown?buildingType=${buType}&revalArea=${encodeURIComponent(buRevalArea)}&quality=${buQuality}&condition=${buCondition}&complexity=${buComplexity}&squareFootage=${buSqft}&effectiveAge=${buAge}`
    ),
    staleTime: 0,
  });

  // ── Normalized data ────────────────────────────────────────────────────────
  const matrixEntries: { buildingType: string; buildingTypeLabel: string; revalArea: string; baseCostPerSqft: number }[] =
    React.useMemo(() => {
      const raw = matrixQuery.data?.entries ?? [];
      if (!Array.isArray(raw)) return [];
      let entries = raw.map((e: Record<string, unknown>) => ({
        buildingType:      String(e.buildingType ?? ''),
        buildingTypeLabel: String(e.buildingTypeLabel ?? e.buildingType ?? ''),
        revalArea:         String(e.region ?? ''),
        baseCostPerSqft:   Number(e.baseCostPerSqft ?? 0),
      }));
      if (revalArea !== 'all')    entries = entries.filter(e => e.revalArea === revalArea);
      if (buildingType !== 'all') entries = entries.filter(e => e.buildingType === buildingType);
      return entries;
    }, [matrixQuery.data, revalArea, buildingType]);

  // Group matrix by building type for cross-reval-area bar chart
  const matrixByType = React.useMemo(() => {
    const map: Record<string, Record<string, string | number>> = {};
    matrixEntries.forEach(e => {
      if (!map[e.buildingTypeLabel]) map[e.buildingTypeLabel] = { type: e.buildingTypeLabel };
      map[e.buildingTypeLabel][e.revalArea] = e.baseCostPerSqft;
    });
    return Object.values(map);
  }, [matrixEntries]);

  const uniqueRevalAreas: string[] = React.useMemo(() =>
    [...new Set(matrixEntries.map(e => e.revalArea))].sort(), [matrixEntries]);

  const trendData = React.useMemo(() => {
    const raw = trendsQuery.data?.dataPoints ?? trendsQuery.data?.DataPoints ?? trendsQuery.data;
    if (!Array.isArray(raw)) return [];
    return raw.map((d: Record<string, unknown>) => ({
      period: String(d.period ?? d.Period ?? ''),
      value:  Number(d.value ?? d.Value ?? 0),
    }));
  }, [trendsQuery.data]);

  const neighborhoods: { name: string; medianPrice: number; pricePerSqft: number; revalArea: string; note: string }[] =
    React.useMemo(() => {
      const raw = neighborhoodQuery.data?.neighborhoods ?? [];
      return Array.isArray(raw) ? raw : [];
    }, [neighborhoodQuery.data]);

  const features: { code: string; label: string; pctOfBiv: number; typicalSqft: number; perSqft: number; note: string }[] =
    React.useMemo(() => {
      const raw = featureQuery.data?.features ?? [];
      return Array.isArray(raw) ? raw : [];
    }, [featureQuery.data]);

  const benchStats: { buildingType: string; buildingTypeLabel: string; minRate: number; maxRate: number; meanRate: number }[] =
    React.useMemo(() => {
      const raw = benchStatsQuery.data?.statistics ?? [];
      return Array.isArray(raw) ? raw : [];
    }, [benchStatsQuery.data]);

  const breakdownSteps: { step: number; label: string; value: number; unit: string; formula: string; explanation?: string }[] =
    React.useMemo(() => {
      const raw = breakdownQuery.data?.steps ?? [];
      return Array.isArray(raw) ? raw : [];
    }, [breakdownQuery.data]);

  const breakdownSummary = breakdownQuery.data?.summary;

  return (
    <MainLayout pageTitle="Analytics" pageDescription="Cost approach analytics — every angle, no black boxes">
      <div className="space-y-5">

        {/* ── Global Filters ────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Reval Area (Cycle)</label>
            <Select value={revalArea} onValueChange={setRevalArea}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REVAL_AREAS.map(r => <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[210px]">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Building Type</label>
            <Select value={buildingType} onValueChange={setBuildingType}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_BUILDING_TYPES.map(t => <SelectItem key={t.code} value={t.code}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[170px]">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Quality Grade</label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {QUALITY_GRADES.map(q => <SelectItem key={q.code} value={q.code}>{q.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[140px]">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Condition</label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITION_GRADES.map(c => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[120px]">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Time Range</label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="12m">1 Year</SelectItem>
                <SelectItem value="24m">2 Years</SelectItem>
                <SelectItem value="60m">5 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="cost-matrix" className="text-xs">
              <Layers className="h-3.5 w-3.5 mr-1.5" />Cost Matrix
            </TabsTrigger>
            <TabsTrigger value="neighborhoods" className="text-xs">
              <Map className="h-3.5 w-3.5 mr-1.5" />Neighborhoods
            </TabsTrigger>
            <TabsTrigger value="building-types" className="text-xs">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />Building Types
            </TabsTrigger>
            <TabsTrigger value="features" className="text-xs">
              <Zap className="h-3.5 w-3.5 mr-1.5" />Feature Factors
            </TabsTrigger>
            <TabsTrigger value="cost-buildup" className="text-xs">
              <Calculator className="h-3.5 w-3.5 mr-1.5" />Cost Build-Up
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-xs">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />Trends
            </TabsTrigger>
          </TabsList>

          {/* ── TAB: Cost Matrix ─────────────────────────────────────────── */}
          <TabsContent value="cost-matrix" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Benton County Cost Matrix 2025</CardTitle>
                <CardDescription>
                  Base cost rate ($/sqft) by building type and Reval Area — source: Benton County Assessor Cost Matrix 2025.
                  Use Reval Area and Building Type filters above to slice.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matrixQuery.isLoading ? <ChartSkeleton /> : matrixEntries.length === 0 ? (
                  <Empty label="No matrix entries for selected filters." />
                ) : (
                  <>
                    {/* Cross-reval-area grouped bar chart */}
                    {uniqueRevalAreas.length > 1 && (
                      <div className="mb-6">
                        <p className="text-xs text-muted-foreground mb-3">Base Rate by Building Type and Reval Area ($/sqft)</p>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={matrixByType} margin={{ left: 10, right: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="type" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                            <Tooltip formatter={(v: number) => fmtRate(v)} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            {uniqueRevalAreas.map((r, i) => (
                              <Bar key={r} dataKey={r} name={r} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[3,3,0,0]} />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {/* Detailed table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Code</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Building Type</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Reval Area</th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Base Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matrixEntries.map((e, i) => (
                            <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="py-2 px-3"><Badge variant="outline" className="font-mono text-xs">{e.buildingType}</Badge></td>
                              <td className="py-2 px-3 text-sm">{e.buildingTypeLabel}</td>
                              <td className="py-2 px-3 text-sm text-muted-foreground">{e.revalArea}</td>
                              <td className="py-2 px-3 text-sm font-semibold text-right">{fmtRate(e.baseCostPerSqft)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB: Neighborhoods ───────────────────────────────────────── */}
          <TabsContent value="neighborhoods" className="mt-4">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Benton County Neighborhoods — Price Context</CardTitle>
                  <CardDescription>
                    Median sale price and $/sqft by neighborhood area.
                    These values provide market context for calibrating the cost approach against market evidence.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {neighborhoodQuery.isLoading ? <ChartSkeleton height={280} /> : neighborhoods.length === 0 ? (
                    <Empty label="Neighborhood data not available." />
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={neighborhoods} margin={{ left: 10, right: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={55} />
                          <YAxis yAxisId="price" orientation="left" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                          <YAxis yAxisId="sqft" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                          <Tooltip
                            formatter={(v: number, name: string) =>
                              name === 'Median Price' ? [formatCurrency(v), name] : [fmtRate(v), name]}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar yAxisId="price" dataKey="medianPrice" name="Median Price" radius={[3,3,0,0]}>
                            {neighborhoods.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Bar>
                          <Bar yAxisId="sqft" dataKey="pricePerSqft" name="$/sqft" fill="#264653" radius={[3,3,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Neighborhood</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Reval Area</th>
                              <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Median Price</th>
                              <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">$/sqft</th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {neighborhoods.map((n, i) => (
                              <tr key={i} className="border-b hover:bg-muted/30">
                                <td className="py-2 px-3 font-medium">{n.name}</td>
                                <td className="py-2 px-3"><Badge variant="outline" className="text-xs font-mono">{n.revalArea}</Badge></td>
                                <td className="py-2 px-3 text-right">{formatCurrency(n.medianPrice)}</td>
                                <td className="py-2 px-3 text-right">{fmtRate(n.pricePerSqft)}</td>
                                <td className="py-2 px-3 text-xs text-muted-foreground">{n.note}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── TAB: Building Types ──────────────────────────────────────── */}
          <TabsContent value="building-types" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Building Type — Rate Range</CardTitle>
                <CardDescription>
                  Min / mean / max base rate across all Reval Areas for each building type.
                  This shows the spread of rates — useful for understanding how much Reval Area affects cost.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {benchStatsQuery.isLoading ? <ChartSkeleton /> : benchStats.length === 0 ? (
                  <Empty label="Building type stats not available." />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={benchStats} margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="buildingTypeLabel" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                        <Tooltip formatter={(v: number, name: string) => [fmtRate(v), name]} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="minRate" name="Min ($/sqft)" fill="#8ecae6" radius={[3,3,0,0]} />
                        <Bar dataKey="meanRate" name="Mean ($/sqft)" fill="#1e6fa8" radius={[3,3,0,0]} />
                        <Bar dataKey="maxRate" name="Max ($/sqft)" fill="#264653" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Code</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Type</th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Min</th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Mean</th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Max</th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Spread</th>
                          </tr>
                        </thead>
                        <tbody>
                          {benchStats.map((s, i) => (
                            <tr key={i} className="border-b hover:bg-muted/30">
                              <td className="py-2 px-3"><Badge variant="outline" className="font-mono text-xs">{s.buildingType}</Badge></td>
                              <td className="py-2 px-3 text-sm">{s.buildingTypeLabel}</td>
                              <td className="py-2 px-3 text-right text-sm">{fmtRate(s.minRate)}</td>
                              <td className="py-2 px-3 text-right text-sm font-medium">{fmtRate(s.meanRate)}</td>
                              <td className="py-2 px-3 text-right text-sm">{fmtRate(s.maxRate)}</td>
                              <td className="py-2 px-3 text-right text-sm text-muted-foreground">
                                ${(s.maxRate - s.minRate).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB: Feature Factors ─────────────────────────────────────── */}
          <TabsContent value="features" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Feature Adjustment Factors — Benton Method</CardTitle>
                <CardDescription>
                  How individual property features contribute to improvement value as a percentage of Base Improvement Value (BIV).
                  Source: Benton County Assessor Cost Approach FY 2025.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {featureQuery.isLoading ? <ChartSkeleton /> : features.length === 0 ? (
                  <Empty label="Feature factor data not available." />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={features} layout="vertical" margin={{ left: 0, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                        <YAxis type="category" dataKey="label" width={165} tick={{ fontSize: 10 }} />
                        <Tooltip
                          formatter={(v: number) => [`${(v * 100).toFixed(0)}% of BIV`, '% of Base Value']}
                        />
                        <Bar dataKey="pctOfBiv" name="% of BIV" radius={[0,4,4,0]}>
                          {features.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-5 overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Code</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Feature</th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">% of BIV</th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Typical Sqft</th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Cost/sqft</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {features.map((f, i) => (
                            <tr key={i} className="border-b hover:bg-muted/30">
                              <td className="py-2 px-3"><Badge variant="outline" className="font-mono text-xs">{f.code}</Badge></td>
                              <td className="py-2 px-3 font-medium">{f.label}</td>
                              <td className="py-2 px-3 text-right font-semibold text-primary">{(f.pctOfBiv * 100).toFixed(0)}%</td>
                              <td className="py-2 px-3 text-right text-muted-foreground">{f.typicalSqft > 0 ? `${f.typicalSqft} sqft` : '—'}</td>
                              <td className="py-2 px-3 text-right">{f.perSqft > 0 ? fmtRate(f.perSqft) : '—'}</td>
                              <td className="py-2 px-3 text-xs text-muted-foreground">{f.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB: Cost Build-Up ───────────────────────────────────────── */}
          <TabsContent value="cost-buildup" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Controls */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Build-Up Parameters</CardTitle>
                  <CardDescription className="text-xs">
                    Every factor that shapes the final RCNLD value.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Building Type</label>
                    <Select value={buType} onValueChange={setBuType}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALL_BUILDING_TYPES.filter(t => t.code !== 'all').map(t => (
                          <SelectItem key={t.code} value={t.code}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Reval Area (Cycle)</label>
                    <Select value={buRevalArea} onValueChange={setBuRevalArea}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {REVAL_AREAS.filter(r => r.code !== 'all').map(r => (
                          <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Quality Grade</label>
                    <Select value={buQuality} onValueChange={setBuQuality}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {QUALITY_GRADES.filter(q => q.code !== 'all').map(q => (
                          <SelectItem key={q.code} value={q.code}>{q.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Condition</label>
                    <Select value={buCondition} onValueChange={setBuCondition}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONDITION_GRADES.filter(c => c.code !== 'all').map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Complexity</label>
                    <Select value={buComplexity} onValueChange={setBuComplexity}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMPLEXITY_GRADES.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Square Footage</label>
                    <input
                      type="number" min={100} max={50000} step={100}
                      value={buSqft}
                      onChange={e => setBuSqft(e.target.value)}
                      className="w-full h-8 px-3 text-sm border border-border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Effective Age (years)</label>
                    <input
                      type="number" min={0} max={100} step={1}
                      value={buAge}
                      onChange={e => setBuAge(e.target.value)}
                      className="w-full h-8 px-3 text-sm border border-border rounded-md bg-background"
                    />
                  </div>
                  {breakdownSummary && (
                    <div className="pt-3 border-t space-y-2">
                      <div className="text-xs text-muted-foreground">Summary</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">RCN/sqft</span>
                        <span className="font-medium">{fmtRate(breakdownSummary.rcnPerSqft)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">RCN Total</span>
                        <span className="font-medium">{formatCurrency(breakdownSummary.rcnTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Depreciation</span>
                        <span className="font-medium text-destructive">−{breakdownSummary.depreciationPct}%</span>
                      </div>
                      <div className="flex justify-between text-sm border-t pt-2 font-semibold">
                        <span>RCNLD</span>
                        <span className="text-primary">{formatCurrency(breakdownSummary.rcnld)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>RCNLD/sqft</span>
                        <span>{fmtRate(breakdownSummary.rcnldPerSqft)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step-by-step breakdown */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Cost Build-Up — Step by Step</CardTitle>
                  <CardDescription className="text-xs">
                    Every factor applied to arrive at RCNLD (Replacement Cost New Less Depreciation).
                    This IS the cost approach formula — nothing hidden.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {breakdownQuery.isLoading ? (
                    <div className="space-y-2">
                      {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                    </div>
                  ) : breakdownQuery.isError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Failed to load cost breakdown. Check building type + reval area combination.</AlertDescription>
                    </Alert>
                  ) : breakdownSteps.length === 0 ? (
                    <Empty label="Select parameters to see the cost build-up formula." />
                  ) : (
                    <div className="space-y-2">
                      {breakdownSteps.map((s, i) => {
                        const isFinal = s.label.includes('RCNLD');
                        const isDepr  = s.label.includes('Depreciation Amount');
                        return (
                          <div
                            key={i}
                            className={`rounded-lg border px-4 py-3 ${
                              isFinal
                                ? 'border-primary/50 bg-primary/5'
                                : isDepr
                                ? 'border-destructive/30 bg-destructive/5'
                                : 'border-border bg-muted/20'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-5 shrink-0">#{s.step}</span>
                                  <span className={`text-sm font-medium ${isFinal ? 'text-primary' : ''}`}>{s.label}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 ml-7 font-mono">{s.formula}</div>
                                {s.explanation && (
                                  <div className="text-xs text-muted-foreground mt-1 ml-7">{s.explanation}</div>
                                )}
                              </div>
                              <div className={`text-right shrink-0 ${isFinal ? 'text-primary font-bold text-lg' : isDepr ? 'text-destructive font-semibold' : 'font-semibold'}`}>
                                {s.unit === '$' || s.unit === '$/sqft'
                                  ? s.unit === '$' ? formatCurrency(s.value) : fmtRate(s.value)
                                  : `×${Number(s.value).toFixed(2)}`}
                                <div className="text-xs text-muted-foreground font-normal">{s.unit}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── TAB: Trends ──────────────────────────────────────────────── */}
          <TabsContent value="trends" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Assessment Value Trends</CardTitle>
                <CardDescription>Avg assessed value over time — use filters above to slice by reval area, type, quality</CardDescription>
              </CardHeader>
              <CardContent>
                {trendsQuery.isLoading ? <ChartSkeleton /> :
                 trendsQuery.isError ? (
                   <Alert>
                     <AlertCircle className="h-4 w-4" />
                     <AlertDescription>Trend data unavailable: {(trendsQuery.error as Error)?.message}</AlertDescription>
                   </Alert>
                 ) :
                 trendData.length === 0 ? (
                   <Empty label="No trend data for selected filters." />
                 ) : (
                   <ResponsiveContainer width="100%" height={360}>
                     <LineChart data={trendData}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                       <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                       <Tooltip formatter={(v: number) => [formatCurrency(v), 'Avg Assessed Value']} />
                       <Legend />
                       <Line type="monotone" dataKey="value" stroke="#1e6fa8" strokeWidth={2} dot={false} name="Avg Value" />
                     </LineChart>
                   </ResponsiveContainer>
                 )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AnalyticsPage;
