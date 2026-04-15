/**
 * CostForgeDashboard.tsx (TFR-096)
 *
 * CostForge dashboard. Overview of cost approach analytics.
 * Property type distribution and depreciation stats from live API.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/apiBase';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

/** Centralized chart palette */
const FORGE_CHART_COLORS = {
  residential:  '#3b82f6',
  commercial:   '#10b981',
  industrial:   '#f59e0b',
  agricultural: '#8b5cf6',
  multiFamily:  '#ef4444',
  manufactured: '#06b6d4',
  apartment:    '#f97316',
  barAvg:       '#3b82f6',
  barMax:       '#64748b',
};

const TYPE_COLOR_MAP: Record<string, string> = {
  Residential:  FORGE_CHART_COLORS.residential,
  Commercial:   FORGE_CHART_COLORS.commercial,
  Industrial:   FORGE_CHART_COLORS.industrial,
  Agricultural: FORGE_CHART_COLORS.agricultural,
  'Multi-Family': FORGE_CHART_COLORS.multiFamily,
  Manufactured: FORGE_CHART_COLORS.manufactured,
  Apartment:    FORGE_CHART_COLORS.apartment,
};

interface DashboardStats {
  taxYear: number;
  totalParcels: number;
  propertyTypeDistribution: { name: string; value: number }[];
  depreciationSummary: { category: string; avg: number; min: number; max: number }[];
  source: string;
  avgResCostPerSqft: number | null;
  dataIntegrityWarning: string | null;
}

const statusBadge = (status: string) => {
  const map: Record<string, 'default' | 'secondary' | 'destructive'> = {
    current: 'default', 'needs-review': 'secondary', outdated: 'destructive',
  };
  return map[status] || 'secondary';
};

// Cost schedule status is editorial/admin — derived from actual cost matrix dates
const SCHEDULE_STATUS = [
  { type: 'Residential',  lastUpdated: '2026-03-01', entryCount: 24, status: 'current' },
  { type: 'Commercial',   lastUpdated: '2026-02-15', entryCount: 18, status: 'current' },
  { type: 'Industrial',   lastUpdated: '2025-12-10', entryCount: 12, status: 'needs-review' },
  { type: 'Agricultural', lastUpdated: '2025-08-20', entryCount: 8,  status: 'outdated' },
  { type: 'Multi-Family', lastUpdated: '2026-01-15', entryCount: 15, status: 'current' },
];

export function CostForgeDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['costforge-dashboard-stats'],
    queryFn: () => apiFetch('/costforge/dashboard-stats?taxYear=2026').then((r) => r.json()),
    staleTime: 10 * 60_000,
  });

  const propertyTypeDist = (stats?.propertyTypeDistribution ?? []).map((d) => ({
    ...d,
    color: TYPE_COLOR_MAP[d.name] ?? '#64748b',
  }));

  const depreciationSummary = stats?.depreciationSummary ?? [];
  const totalParcels = stats?.totalParcels ?? 0;

  const avgPhysicalDep = depreciationSummary.find((d) => d.category === 'Physical')?.avg ?? 22.5;

  return (
    <div data-testid="cost-forge-dashboard" className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">CostForge Dashboard</h1>
        {stats?.source === 'live' && (
          <Badge variant="secondary">Live — {stats.taxYear}</Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-muted-foreground">Loading dashboard...</span>
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card data-material="bento">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{totalParcels.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Parcels</div>
              </CardContent>
            </Card>
            <Card data-material="bento">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{SCHEDULE_STATUS.length}</div>
                <div className="text-sm text-muted-foreground">Cost Schedules</div>
              </CardContent>
            </Card>
            <Card data-material="bento">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">
                  {stats?.avgResCostPerSqft != null
                    ? `$${Math.round(stats.avgResCostPerSqft).toLocaleString()}`
                    : '—'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg Res. Cost/sqft
                  {stats?.source === 'live' && stats?.avgResCostPerSqft != null && (
                    <span className="ml-1 text-xs text-green-500">(Live)</span>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card data-material="bento">
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center gap-1">
                  <div className="text-3xl font-bold">{avgPhysicalDep.toFixed(1)}%</div>
                  {stats?.dataIntegrityWarning && (
                    <span
                      title={stats.dataIntegrityWarning}
                      className="text-amber-500 text-lg cursor-help"
                    >
                      ⚠
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Avg Physical Dep.</div>
                {stats?.dataIntegrityWarning && (
                  <div className="text-xs text-amber-500 mt-1 leading-tight">
                    Data flag — hover ⚠ for details
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Physical Depreciation % — bar chart */}
            <Card>
              <CardHeader>
                <CardTitle>Physical Depreciation {stats?.source === 'live' ? '(Live)' : ''}</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const physRow = depreciationSummary.find((d) => d.category === 'Physical');
                  const funcRow = depreciationSummary.find((d) => d.category === 'Functional');
                  const extRow  = depreciationSummary.find((d) => d.category === 'External');
                  if (!physRow) {
                    return (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No depreciation data available for {stats?.taxYear ?? 2026}.
                      </div>
                    );
                  }
                  return (
                    <>
                      {/* Physical depreciation bar — % values */}
                      <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={[physRow]} layout="vertical" margin={{ left: 90 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                          <YAxis type="category" dataKey="category" width={80} />
                          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                          <Bar dataKey="avg" fill={FORGE_CHART_COLORS.barAvg} name="Avg %" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="max" fill={FORGE_CHART_COLORS.barMax} name="Max %" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      {/* Obsolescence dollar amounts */}
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg border p-3">
                          <div className="text-xs text-muted-foreground mb-1">Functional Obsolescence</div>
                          <div className="text-lg font-semibold">
                            {funcRow ? `$${funcRow.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })} avg` : '—'}
                          </div>
                          {funcRow && (
                            <div className="text-xs text-muted-foreground">
                              Max ${funcRow.max.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          )}
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-xs text-muted-foreground mb-1">External Obsolescence</div>
                          <div className="text-lg font-semibold">
                            {extRow ? `$${extRow.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })} avg` : '—'}
                          </div>
                          {extRow && (
                            <div className="text-xs text-muted-foreground">
                              Max ${extRow.max.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Property Type Distribution (Live) */}
            <Card>
              <CardHeader>
                <CardTitle>Parcels by Property Type {stats?.source === 'live' ? '(Live)' : ''}</CardTitle>
              </CardHeader>
              <CardContent>
                {propertyTypeDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={propertyTypeDist}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {propertyTypeDist.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => value.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No property type data available.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Schedule Status */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Schedule Coverage by Property Type</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Schedules are organized by use category (Property Type). Quality class (A–D)
                differentials are applied within each type via the depreciation matrix.
              </p>
              <table className="w-full text-sm" data-material="bento">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Type</th>
                    <th className="text-right py-2">Entries</th>
                    <th className="text-left py-2">Last Updated</th>
                    <th className="text-center py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SCHEDULE_STATUS.map((s) => (
                    <tr key={s.type} className="border-b hover:bg-white/5 cursor-pointer" role="link">
                      <td className="py-2 font-medium">{s.type}</td>
                      <td className="py-2 text-right">{s.entryCount}</td>
                      <td className="py-2 text-muted-foreground">{s.lastUpdated}</td>
                      <td className="py-2 text-center">
                        <Badge variant={statusBadge(s.status)}>{s.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default CostForgeDashboard;
