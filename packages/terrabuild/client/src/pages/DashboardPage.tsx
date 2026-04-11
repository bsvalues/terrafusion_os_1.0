import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw,
  FileBarChart,
  Building,
  BarChart4,
  TrendingUp,
  PieChart,
  ArrowUpRight,
  Calendar,
  BarChart,
  ChevronRight,
  Calculator,
  FileDown,
  ClipboardList,
} from 'lucide-react';

const recentCalcs = [
  { parcel: 'BEN-2024-00142', type: 'R1 — Single Family', value: '$342,000', date: 'Apr 9, 2026' },
  { parcel: 'BEN-2024-00098', type: 'C2 — Office Commercial', value: '$1,240,000', date: 'Apr 9, 2026' },
  { parcel: 'BEN-2024-00211', type: 'R2 — Multi-Family', value: '$780,000', date: 'Apr 8, 2026' },
  { parcel: 'BEN-2024-00055', type: 'I1 — Light Industrial', value: '$2,100,000', date: 'Apr 8, 2026' },
  { parcel: 'BEN-2024-00307', type: 'A1 — Agricultural', value: '$95,000', date: 'Apr 7, 2026' },
];

const recentReports = [
  { title: 'Q1 2026 Cost Approach Summary', date: 'April 1, 2026' },
  { title: 'Annual Building Type Distribution', date: 'March 28, 2026' },
  { title: 'Regional Material Cost Variance', date: 'February 12, 2026' },
];

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
                    <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                      DEMO DATA
                    </span>
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

              {/* Cost trends placeholder */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart className="h-4 w-4 text-primary" />
                    Cost Trends — Central Benton
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-52 flex items-center justify-center border border-dashed border-border rounded-lg">
                    <div className="text-center text-muted-foreground text-sm">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      Cost trend chart — coming in Phase 3
                    </div>
                  </div>
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
                  Reports Archive
                  <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                    DEMO DATA
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {recentReports.map((report, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <div className="text-sm font-medium">{report.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" /> {report.date}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <FileDown className="h-3.5 w-3.5 mr-1.5" /> Export
                      </Button>
                    </div>
                  ))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Cost Prediction', desc: 'Forecast building costs using trend analysis', icon: TrendingUp },
                { title: 'Type Comparison', desc: 'Compare costs across building types and regions', icon: BarChart4 },
                { title: 'Historical Analysis', desc: 'Analyze cost trends and historical patterns', icon: BarChart },
                { title: 'Regional Variance', desc: 'Regional cost factor breakdown by district', icon: PieChart },
              ].map((item, i) => (
                <Card key={i} className="cursor-pointer hover:border-primary/50 transition-colors">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{item.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto mt-0.5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
