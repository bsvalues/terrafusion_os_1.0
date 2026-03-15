/**
 * CostForgeDashboard.tsx (TFR-096)
 *
 * CostForge dashboard. Overview of cost approach analytics.
 * Cost schedule status, depreciation tables, replacement cost trends.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

interface ScheduleStatus {
  type: string;
  lastUpdated: string;
  entryCount: number;
  status: 'current' | 'needs-review' | 'outdated';
}

const SCHEDULE_STATUS: ScheduleStatus[] = [
  { type: 'Residential', lastUpdated: '2026-03-01', entryCount: 24, status: 'current' },
  { type: 'Commercial', lastUpdated: '2026-02-15', entryCount: 18, status: 'current' },
  { type: 'Industrial', lastUpdated: '2025-12-10', entryCount: 12, status: 'needs-review' },
  { type: 'Agricultural', lastUpdated: '2025-08-20', entryCount: 8, status: 'outdated' },
  { type: 'Multi-Family', lastUpdated: '2026-01-15', entryCount: 15, status: 'current' },
];

const RCN_TREND = [
  { year: '2021', residential: 125, commercial: 140, industrial: 85 },
  { year: '2022', residential: 135, commercial: 150, industrial: 90 },
  { year: '2023', residential: 142, commercial: 158, industrial: 95 },
  { year: '2024', residential: 140, commercial: 162, industrial: 92 },
  { year: '2025', residential: 145, commercial: 165, industrial: 95 },
  { year: '2026', residential: 148, commercial: 170, industrial: 98 },
];

const DEPRECIATION_SUMMARY = [
  { category: 'Physical', avg: 22.5, min: 0, max: 75 },
  { category: 'Functional', avg: 5.8, min: 0, max: 30 },
  { category: 'External', avg: 2.1, min: 0, max: 15 },
];

const PROPERTY_TYPE_DIST = [
  { name: 'Residential', value: 72450, color: '#3b82f6' },
  { name: 'Commercial', value: 8240, color: '#10b981' },
  { name: 'Industrial', value: 3120, color: '#f59e0b' },
  { name: 'Agricultural', value: 4200, color: '#8b5cf6' },
  { name: 'Multi-Family', value: 1237, color: '#ef4444' },
];

const statusBadge = (status: string) => {
  const map: Record<string, 'default' | 'secondary' | 'destructive'> = {
    current: 'default', 'needs-review': 'secondary', outdated: 'destructive',
  };
  return map[status] || 'secondary';
};

export function CostForgeDashboard() {
  const [loading] = useState(false);

  const totalParcels = PROPERTY_TYPE_DIST.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">CostForge Dashboard</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-muted-foreground">Loading dashboard...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{totalParcels.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Parcels</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{SCHEDULE_STATUS.length}</div>
                <div className="text-sm text-muted-foreground">Cost Schedules</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">$148</div>
                <div className="text-sm text-muted-foreground">Avg Res. Cost/sqft</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">22.5%</div>
                <div className="text-sm text-muted-foreground">Avg Physical Dep.</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* RCN Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Replacement Cost / sqft Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={RCN_TREND}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis label={{ value: '$/sqft', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value: number) => `$${value}/sqft`} />
                    <Line type="monotone" dataKey="residential" stroke="#3b82f6" strokeWidth={2} name="Residential" />
                    <Line type="monotone" dataKey="commercial" stroke="#10b981" strokeWidth={2} name="Commercial" />
                    <Line type="monotone" dataKey="industrial" stroke="#f59e0b" strokeWidth={2} name="Industrial" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Property Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Parcels by Property Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={PROPERTY_TYPE_DIST}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {PROPERTY_TYPE_DIST.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Depreciation Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Depreciation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={DEPRECIATION_SUMMARY} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 80]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="category" width={70} />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Bar dataKey="avg" fill="#3b82f6" name="Average" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="max" fill="#e5e7eb" name="Max" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Schedule Status */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Schedule Status</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Type</th>
                    <th className="text-right py-2">Entries</th>
                    <th className="text-left py-2">Last Updated</th>
                    <th className="text-center py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SCHEDULE_STATUS.map(s => (
                    <tr key={s.type} className="border-b hover:bg-gray-50">
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
