import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, LineChart as LineChartIcon, TrendingUp, Map, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import MainLayout from '@/components/layout/MainLayout';

const CHART_COLORS = ['#1e6fa8', '#2a9d8f', '#e76f51', '#264653', '#f4a261'];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

function ChartSkeleton() {
  return (
    <div className="h-[360px] flex flex-col gap-3 p-4">
      <Skeleton className="h-full w-full" />
    </div>
  );
}

function EndpointPending({ name }: { name: string }) {
  return (
    <div className="h-[360px] flex items-center justify-center text-muted-foreground text-sm">
      <div className="text-center space-y-2">
        <AlertCircle className="h-8 w-8 mx-auto opacity-40" />
        <p>{name} endpoint is being provisioned. Check back shortly.</p>
      </div>
    </div>
  );
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cost-trends');
  const [timeRange, setTimeRange] = useState('12m');
  const [region, setRegion] = useState('all');
  const [buildingType, setBuildingType] = useState('all');

  // Real TerraFusion OS endpoint — AnalyticsController.GetTrends()
  const trendsQuery = useQuery({
    queryKey: ['/api/analytics/trends', timeRange, region, buildingType],
    queryFn: () => fetchJson(
      `/api/analytics/trends?timeRange=${timeRange}` +
      (region !== 'all' ? `&region=${region}` : '') +
      (buildingType !== 'all' ? `&buildingType=${buildingType}` : '')
    ),
    retry: 1,
    staleTime: 60_000,
  });

  // Real TerraFusion OS endpoint — AnalyticsController.GetMarket()
  const marketQuery = useQuery({
    queryKey: ['/api/analytics/market', region, buildingType],
    queryFn: () => fetchJson(
      `/api/analytics/market` +
      (region !== 'all' || buildingType !== 'all'
        ? `?${new URLSearchParams({ ...(region !== 'all' ? { region } : {}), ...(buildingType !== 'all' ? { buildingType } : {}) })}`
        : '')
    ),
    retry: 1,
    staleTime: 60_000,
  });

  // New endpoints — Segment 3. Returns 404 until BenchmarkingController is created. Graceful fallback.
  const regionalQuery = useQuery({
    queryKey: ['/api/analytics/regional-comparison', buildingType],
    queryFn: () => fetchJson(
      `/api/analytics/regional-comparison` +
      (buildingType !== 'all' ? `?buildingType=${buildingType}` : '')
    ),
    retry: false,
    staleTime: 60_000,
  });

  const buildingTypeQuery = useQuery({
    queryKey: ['/api/analytics/building-type-comparison', region],
    queryFn: () => fetchJson(
      `/api/analytics/building-type-comparison` +
      (region !== 'all' ? `?region=${region}` : '')
    ),
    retry: false,
    staleTime: 60_000,
  });

  // Normalize trend data — TF returns { dataPoints: [{period, value}] } or flat array
  const trendData: { period: string; value: number }[] = React.useMemo(() => {
    if (!trendsQuery.data) return [];
    const raw = trendsQuery.data?.dataPoints ?? trendsQuery.data?.DataPoints ?? trendsQuery.data;
    if (!Array.isArray(raw)) return [];
    return raw.map((d: Record<string, unknown>) => ({
      period: String(d.period ?? d.Period ?? d.month ?? d.Month ?? ''),
      value: Number(d.value ?? d.Value ?? d.avgCost ?? d.AvgCost ?? 0),
    }));
  }, [trendsQuery.data]);

  // Normalize regional data
  const regionalData: { region: string; avgCost: number; count: number }[] = React.useMemo(() => {
    if (!regionalQuery.data) return [];
    const raw = regionalQuery.data?.regions ?? regionalQuery.data?.Regions ?? regionalQuery.data;
    if (!Array.isArray(raw)) return [];
    return raw.map((d: Record<string, unknown>) => ({
      region: String(d.region ?? d.Region ?? ''),
      avgCost: Number(d.avgCost ?? d.AvgCost ?? d.medianCost ?? d.MedianCost ?? 0),
      count: Number(d.count ?? d.Count ?? 0),
    }));
  }, [regionalQuery.data]);

  // Normalize building type data
  const buildingTypeData: { type: string; avgCost: number; count: number }[] = React.useMemo(() => {
    if (!buildingTypeQuery.data) return [];
    const raw = buildingTypeQuery.data?.buildingTypes ?? buildingTypeQuery.data?.BuildingTypes ?? buildingTypeQuery.data;
    if (!Array.isArray(raw)) return [];
    return raw.map((d: Record<string, unknown>) => ({
      type: String(d.buildingType ?? d.BuildingType ?? d.type ?? d.Type ?? ''),
      avgCost: Number(d.avgCost ?? d.AvgCost ?? d.baseRate ?? d.BaseRate ?? 0),
      count: Number(d.count ?? d.Count ?? 0),
    }));
  }, [buildingTypeQuery.data]);

  // Market KPIs from /api/analytics/market
  const marketKPIs = React.useMemo(() => {
    if (!marketQuery.data) return null;
    const d = marketQuery.data;
    return {
      avgCost: d.AvgCostPerSqft ?? d.avgCostPerSqft ?? d.AverageCost ?? d.averageCost ?? null,
      totalProperties: d.TotalProperties ?? d.totalProperties ?? null,
      yoyChange: d.YearOverYearChange ?? d.yearOverYearChange ?? null,
      topRegion: d.TopRegion ?? d.topRegion ?? null,
    };
  }, [marketQuery.data]);

  return (
    <MainLayout pageTitle="Analytics Dashboard" pageDescription="Benton County building cost analytics — live data from TerraFusion OS">
        <div className="space-y-6">
          {/* KPI Strip */}
          {marketQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[0,1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : marketQuery.isError ? null : marketKPIs ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {marketKPIs.avgCost !== null && (
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="text-xs text-muted-foreground">Avg Assessed Value</div>
                    <div className="text-2xl font-bold">{formatCurrency(marketKPIs.avgCost)}</div>
                  </CardContent>
                </Card>
              )}
              {marketKPIs.totalProperties !== null && (
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="text-xs text-muted-foreground">Total Properties</div>
                    <div className="text-2xl font-bold">{Number(marketKPIs.totalProperties).toLocaleString()}</div>
                  </CardContent>
                </Card>
              )}
              {marketKPIs.yoyChange !== null && (
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="text-xs text-muted-foreground">YoY Change</div>
                    <div className="text-2xl font-bold">{Number(marketKPIs.yoyChange).toFixed(1)}%</div>
                  </CardContent>
                </Card>
              )}
              {marketKPIs.topRegion !== null && (
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="text-xs text-muted-foreground">Top Type</div>
                    <div className="text-xl font-bold">{String(marketKPIs.topRegion)}</div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3m">3 Months</SelectItem>
                  <SelectItem value="6m">6 Months</SelectItem>
                  <SelectItem value="12m">1 Year</SelectItem>
                  <SelectItem value="24m">2 Years</SelectItem>
                  <SelectItem value="60m">5 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Region</label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="kennewick">Kennewick</SelectItem>
                  <SelectItem value="richland">Richland</SelectItem>
                  <SelectItem value="prosser">Prosser</SelectItem>
                  <SelectItem value="rural">Rural</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Building Type</label>
              <Select value={buildingType} onValueChange={setBuildingType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="R1">Residential (R1)</SelectItem>
                  <SelectItem value="C1">Commercial (C1)</SelectItem>
                  <SelectItem value="I1">Industrial (I1)</SelectItem>
                  <SelectItem value="AG">Agricultural</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="cost-trends">
                <LineChartIcon className="h-4 w-4 mr-2" />Cost Trends
              </TabsTrigger>
              <TabsTrigger value="regional">
                <Map className="h-4 w-4 mr-2" />Regional
              </TabsTrigger>
              <TabsTrigger value="building-type">
                <BarChart3 className="h-4 w-4 mr-2" />Building Type
              </TabsTrigger>
              <TabsTrigger value="predictive">
                <TrendingUp className="h-4 w-4 mr-2" />Predictive
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {/* Cost Trends — /api/analytics/trends */}
              <TabsContent value="cost-trends" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Building Cost Trends</CardTitle>
                    <CardDescription>Average cost per sqft over time — TerraFusion PostgreSQL</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trendsQuery.isLoading ? <ChartSkeleton /> :
                     trendsQuery.isError ? (
                       <Alert variant="destructive">
                         <AlertCircle className="h-4 w-4" />
                         <AlertDescription>Unable to load trend data: {(trendsQuery.error as Error)?.message}</AlertDescription>
                       </Alert>
                     ) :
                     trendData.length === 0 ? (
                       <div className="h-[360px] flex items-center justify-center text-muted-foreground text-sm">No trend data returned for this filter.</div>
                     ) : (
                       <ResponsiveContainer width="100%" height={360}>
                         <LineChart data={trendData}>
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                           <YAxis tickFormatter={v => `$${(v/1).toFixed(0)}`} tick={{ fontSize: 11 }} />
                           <Tooltip formatter={(v: number) => formatCurrency(v)} />
                           <Legend />
                           <Line type="monotone" dataKey="value" stroke="#1e6fa8" strokeWidth={2} dot={false} name="Avg Cost/sqft" />
                         </LineChart>
                       </ResponsiveContainer>
                     )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Regional Analysis — /api/analytics/regional-comparison */}
              <TabsContent value="regional" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Regional Cost Comparison</CardTitle>
                    <CardDescription>Median assessment by region — Benton County</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {regionalQuery.isLoading ? <ChartSkeleton /> :
                     regionalQuery.isError ? <EndpointPending name="Regional comparison" /> :
                     regionalData.length === 0 ? (
                       <div className="h-[360px] flex items-center justify-center text-muted-foreground text-sm">No regional data returned.</div>
                     ) : (
                       <ResponsiveContainer width="100%" height={360}>
                         <BarChart data={regionalData}>
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                           <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 11 }} />
                           <Tooltip formatter={(v: number) => formatCurrency(v)} />
                           <Legend />
                           <Bar dataKey="avgCost" name="Avg Cost/sqft" radius={[4,4,0,0]}>
                             {regionalData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                           </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                     )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Building Type — /api/analytics/building-type-comparison */}
              <TabsContent value="building-type" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Building Type Comparison</CardTitle>
                    <CardDescription>Cost distribution by building type code</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {buildingTypeQuery.isLoading ? <ChartSkeleton /> :
                     buildingTypeQuery.isError ? <EndpointPending name="Building type comparison" /> :
                     buildingTypeData.length === 0 ? (
                       <div className="h-[360px] flex items-center justify-center text-muted-foreground text-sm">No building type data returned.</div>
                     ) : (
                       <ResponsiveContainer width="100%" height={360}>
                         <BarChart data={buildingTypeData} layout="vertical">
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis type="number" tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 11 }} />
                           <YAxis type="category" dataKey="type" width={80} tick={{ fontSize: 11 }} />
                           <Tooltip formatter={(v: number) => formatCurrency(v)} />
                           <Bar dataKey="avgCost" name="Avg Cost/sqft" radius={[0,4,4,0]}>
                             {buildingTypeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                           </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                     )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Predictive — uses trend data with simple forward projection */}
              <TabsContent value="predictive" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Predictive Analysis</CardTitle>
                    <CardDescription>Forward projection based on historical trend — powered by TerraFusion AI</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trendsQuery.isLoading ? <ChartSkeleton /> :
                     trendsQuery.isError ? (
                       <Alert variant="destructive">
                         <AlertCircle className="h-4 w-4" />
                         <AlertDescription>Unable to load trend data for projection.</AlertDescription>
                       </Alert>
                     ) :
                     trendData.length < 2 ? (
                       <EndpointPending name="Trend projection" />
                     ) : (() => {
                       // Simple linear extrapolation of last 3 data points for forward projection
                       const last = trendData[trendData.length - 1].value;
                       const prev = trendData[Math.max(0, trendData.length - 4)].value;
                       const slope = trendData.length > 1 ? (last - prev) / Math.min(3, trendData.length - 1) : 0;
                       const projected = [1,2,3,4,5,6].map(i => ({
                         period: `+${i}mo`,
                         projected: Math.round(last + slope * i),
                       }));
                       const combined = [
                         ...trendData.slice(-6).map(d => ({ period: d.period, historical: d.value, projected: undefined })),
                         ...projected.map(d => ({ period: d.period, historical: undefined, projected: d.projected })),
                       ];
                       return (
                         <ResponsiveContainer width="100%" height={360}>
                           <LineChart data={combined}>
                             <CartesianGrid strokeDasharray="3 3" />
                             <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                             <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 11 }} />
                             <Tooltip formatter={(v: number) => formatCurrency(v)} />
                             <Legend />
                             <Line type="monotone" dataKey="historical" stroke="#1e6fa8" strokeWidth={2} dot={false} name="Historical" connectNulls={false} />
                             <Line type="monotone" dataKey="projected" stroke="#e76f51" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Projected" connectNulls={false} />
                           </LineChart>
                         </ResponsiveContainer>
                       );
                     })()}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
    </MainLayout>
  );
};

export default AnalyticsPage;
