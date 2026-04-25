import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import {
  RefreshCw,
  FileBarChart,
  Building,
  BarChart4,
  TrendingUp,
  PieChart,
  Calendar,
  BarChart,
  ChevronRight,
  Calculator,
  FileDown,
  ClipboardList,
} from 'lucide-react';

// recentCalcs and recentReports are now fetched from the API (see useQuery hooks below)

export default function DashboardPage() {
  const [selectedTab, setSelectedTab] = useState<string>('overview');

  // CostForge system status (agent health, calculation throughput)
  const { data: statusData } = useQuery({
    queryKey: ['costforge-status'],
    queryFn: () => apiRequest('/api/costforge/status'),
    staleTime: 60_000,
  });

  // Benton FY2025 cost matrix rows
  const { data: matrixData } = useQuery({
    queryKey: ['costforge-matrix'],
    queryFn: () => apiRequest('/api/costforge/cost-matrix/benton'),
    staleTime: 60_000,
  });

  // Real parcel count from TerraFusion ecosystem DB
  const { data: parcelsData } = useQuery({
    queryKey: ['parcels-count'],
    queryFn: () => apiRequest('/api/properties?page=1&limit=1'),
    staleTime: 60_000,
  });

  // Cost trends from analytics API
  const { data: trendsData } = useQuery({
    queryKey: ['/api/analytics/trends-dash'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/trends?timeRange=12m');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60_000,
  });
  const trendPoints: { month: string; value: number }[] = (trendsData?.dataPoints ?? []).map((p: { period: string; value: number }) => ({
    month: new Date(p.period).toLocaleDateString('en-US', { month: 'short' }),
    value: Number(p.value),
  }));

  // Recent valuation records from CostForge
  const { data: valuationsData } = useQuery({
    queryKey: ['/api/costforge/valuations'],
    queryFn: async () => {
      const res = await fetch('/api/costforge/valuations?limit=5');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60_000,
  });

  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const recentCalcs: { parcel: string; type: string; value: string; date: string }[] = (valuationsData?.valuations ?? []).slice(0, 5).map((v: Record<string, unknown>) => ({
    parcel: String(v.ParcelId ?? v.parcelId ?? '—'),
    type: String(v.BuildingType ?? v.buildingType ?? v.PropertyType ?? v.propertyType ?? '—'),
    value: fmt.format(Number(v.FinalReconciledValue ?? v.finalReconciledValue ?? v.Rcnld ?? v.rcnld ?? 0)),
    date: v.CreatedAt || v.createdAt ? new Date(String(v.CreatedAt ?? v.createdAt)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
  }));

  const fmtNum = (n: unknown) =>
    typeof n === 'number' ? n.toLocaleString() : '—';

  const stats = [
    {
      title: 'Total Parcels',
      value: fmtNum(parcelsData?.totalCount),
      icon: <Building className="h-5 w-5" />,
    },
    {
      title: 'Cost Matrices',
      value: typeof matrixData?.count === 'number'
        ? String(matrixData.count)
        : Array.isArray(matrixData) ? String(matrixData.length) : '—',
      icon: <BarChart4 className="h-5 w-5" />,
    },
    {
      title: 'Total Calculations',
      value: fmtNum(statusData?.totalCalculations),
      icon: <RefreshCw className="h-5 w-5" />,
    },
    {
      title: 'System Status',
      value: statusData?.systemStatus === 'optimal' ? 'Optimal' : statusData?.systemStatus ?? '—',
      icon: <ClipboardList className="h-5 w-5" />,
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">CostForge Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Benton County — Cost Approach Assessment</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button size="sm" asChild>
              <Link href="/calculator">
                <Calculator className="h-4 w-4 mr-2" /> New Calculation
              </Link>
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {stat.title}
                  </span>
                  <span className="text-muted-foreground">{stat.icon}</span>
                </div>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent calculations */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    Recent Calculations
                    {recentCalcs.length === 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">No saved valuations yet</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {recentCalcs.map((calc, i) => (
                      <div key={i} className="flex items-center justify-between px-6 py-3">
                        <div>
                          <div className="text-sm font-medium">{calc.parcel}</div>
                          <div className="text-xs text-muted-foreground">{calc.type}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-primary">{calc.value}</div>
                          <div className="text-xs text-muted-foreground">{calc.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-6 py-3 border-t border-border">
                    <Button variant="ghost" size="sm" className="text-xs w-full" asChild>
                      <Link href="/calculator">Run new calculation →</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Cost trends — live from /api/analytics/trends */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart className="h-4 w-4 text-primary" />
                    Cost Trends — Benton County (12 mo)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={208}>
                    <AreaChart data={trendPoints} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dashTrendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={2} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} width={42} />
                      <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}/sqft`, 'Avg Rate']} />
                      <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#dashTrendGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Quick access */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/calculator">
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calculator className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Calculator</div>
                        <div className="text-xs text-muted-foreground">Run a cost calculation</div>
                      </div>
                    </div>
                  </Link>

                  <Link href="/reports">
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileBarChart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Reports</div>
                        <div className="text-xs text-muted-foreground">View saved reports</div>
                      </div>
                    </div>
                  </Link>

                  <Link href="/analytics">
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <PieChart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Analytics</div>
                        <div className="text-xs text-muted-foreground">Cost breakdown analysis</div>
                      </div>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileBarChart className="h-4 w-4 text-primary" />
                  Recent Valuation Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {recentCalcs.length === 0 ? (
                    <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                      No saved valuations yet. Run a calculation and save it to see reports here.
                    </div>
                  ) : (
                    recentCalcs.map((calc, i) => (
                      <div key={i} className="flex items-center justify-between px-6 py-4">
                        <div>
                          <div className="text-sm font-medium">{calc.parcel}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" /> {calc.date}
                            {calc.type !== '—' && <span className="ml-2">{calc.type}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">{calc.value}</span>
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/reports">
                              <FileDown className="h-3.5 w-3.5 mr-1.5" /> View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-6 py-3 border-t border-border">
                  <Button variant="ghost" size="sm" className="text-xs w-full" asChild>
                    <Link href="/reports">View all reports →</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {(() => {
              const entries: { buildingType: string; buildingTypeLabel: string; region: string; baseCostPerSqft: number }[] =
                Array.isArray(matrixData?.entries) ? matrixData.entries : [];

              // Avg $/sqft by building type
              const byType = Object.values(
                entries.reduce((acc: Record<string, { label: string; total: number; count: number }>, e) => {
                  if (!acc[e.buildingType]) acc[e.buildingType] = { label: e.buildingTypeLabel ?? e.buildingType, total: 0, count: 0 };
                  acc[e.buildingType].total += Number(e.baseCostPerSqft);
                  acc[e.buildingType].count += 1;
                  return acc;
                }, {})
              ).map(v => ({ name: v.label.replace(/^[A-Z]\d — /, '').substring(0, 14), avg: Math.round(v.total / v.count) }))
               .sort((a, b) => b.avg - a.avg);

              // Avg $/sqft by Reval Area
              const byArea = Object.values(
                entries.reduce((acc: Record<string, { total: number; count: number }>, e) => {
                  const k = e.region ?? '';
                  if (!acc[k]) acc[k] = { total: 0, count: 0 };
                  acc[k].total += Number(e.baseCostPerSqft);
                  acc[k].count += 1;
                  return acc;
                }, {})
              ).map((v, i, arr) => {
                const key = entries.find(e => {
                  const g = arr; void g;
                  return true;
                });
                void key;
                return v;
              });
              const areaEntries = [...new Set(entries.map(e => e.region))].sort().map(region => ({
                name: region.replace('Reval ', 'R'),
                avg: Math.round(entries.filter(e => e.region === region).reduce((s, e) => s + Number(e.baseCostPerSqft), 0) /
                  entries.filter(e => e.region === region).length),
              }));

              const COLORS = ['#1e6fa8','#2a9d8f','#e76f51','#264653','#f4a261','#e9c46a'];

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart4 className="h-4 w-4 text-primary" />
                        Avg $/sqft by Building Type
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {byType.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">Loading matrix…</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <ReBarChart data={byType} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                            <Tooltip formatter={(v: number) => [`$${v}/sqft`, 'Avg Rate']} />
                            <Bar dataKey="avg" radius={[0, 3, 3, 0]}>
                              {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                          </ReBarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Avg $/sqft by Reval Area (Cycle)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {areaEntries.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">Loading matrix…</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <ReBarChart data={areaEntries} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} width={42} />
                            <Tooltip formatter={(v: number) => [`$${v}/sqft`, 'Avg Rate']} />
                            <Bar dataKey="avg" radius={[3, 3, 0, 0]}>
                              {areaEntries.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                          </ReBarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardContent className="p-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Full analytics, filtering, and cost build-up on the Analytics page</span>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/analytics">Open Analytics <ChevronRight className="h-3.5 w-3.5 ml-1" /></Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
