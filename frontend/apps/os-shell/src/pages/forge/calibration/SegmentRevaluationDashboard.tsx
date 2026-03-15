/**
 * SegmentRevaluationDashboard.tsx (TFR-058)
 *
 * Shows segments pending revaluation, progress, value change impact.
 * Read-only display. No domain math.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface RevaluationSegment {
  id: string;
  name: string;
  parcelCount: number;
  status: 'pending' | 'in-progress' | 'complete' | 'review';
  progress: number;
  avgValueChange: number;
  totalValueImpact: number;
  lastRevaluation: string;
  dueDate: string;
}

const SEGMENTS: RevaluationSegment[] = [
  { id: 's1', name: 'Downtown Residential', parcelCount: 1245, status: 'complete', progress: 100, avgValueChange: 4.2, totalValueImpact: 12500000, lastRevaluation: '2026-02-15', dueDate: '2026-03-01' },
  { id: 's2', name: 'West Side Commercial', parcelCount: 342, status: 'in-progress', progress: 67, avgValueChange: 6.8, totalValueImpact: 8900000, lastRevaluation: '2025-08-10', dueDate: '2026-04-01' },
  { id: 's3', name: 'Rural Agricultural', parcelCount: 2180, status: 'pending', progress: 0, avgValueChange: 0, totalValueImpact: 0, lastRevaluation: '2025-03-20', dueDate: '2026-06-01' },
  { id: 's4', name: 'Industrial Park', parcelCount: 187, status: 'review', progress: 100, avgValueChange: -2.1, totalValueImpact: -1450000, lastRevaluation: '2026-01-05', dueDate: '2026-03-15' },
  { id: 's5', name: 'Suburban Residential', parcelCount: 3456, status: 'in-progress', progress: 34, avgValueChange: 3.5, totalValueImpact: 24000000, lastRevaluation: '2025-06-12', dueDate: '2026-05-01' },
  { id: 's6', name: 'Waterfront Properties', parcelCount: 89, status: 'pending', progress: 0, avgValueChange: 0, totalValueImpact: 0, lastRevaluation: '2025-09-01', dueDate: '2026-07-01' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  'pending': { label: 'Pending', variant: 'outline' },
  'in-progress': { label: 'In Progress', variant: 'secondary' },
  'complete': { label: 'Complete', variant: 'default' },
  'review': { label: 'Under Review', variant: 'destructive' },
};

export function SegmentRevaluationDashboard() {
  const [loading] = useState(false);

  const totalParcels = SEGMENTS.reduce((sum, s) => sum + s.parcelCount, 0);
  const completedParcels = SEGMENTS.filter(s => s.status === 'complete' || s.status === 'review')
    .reduce((sum, s) => sum + s.parcelCount, 0);
  const inProgressParcels = SEGMENTS.filter(s => s.status === 'in-progress')
    .reduce((sum, s) => sum + Math.round(s.parcelCount * s.progress / 100), 0);
  const overallProgress = Math.round(((completedParcels + inProgressParcels) / totalParcels) * 100);

  const chartData = SEGMENTS.filter(s => s.avgValueChange !== 0).map(s => ({
    name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
    change: s.avgValueChange,
  }));

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Segment Revaluation Dashboard</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-muted-foreground">Loading revaluation data...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{SEGMENTS.length}</div>
                <div className="text-sm text-muted-foreground">Total Segments</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{totalParcels.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Parcels</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{overallProgress}%</div>
                <div className="text-sm text-muted-foreground">Overall Progress</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">
                  {SEGMENTS.filter(s => s.status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Average Value Change by Segment</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} />
                  <YAxis tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Bar dataKey="change" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.change >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Segment</th>
                    <th className="text-right py-2">Parcels</th>
                    <th className="text-center py-2">Status</th>
                    <th className="text-right py-2">Progress</th>
                    <th className="text-right py-2">Avg Change</th>
                    <th className="text-right py-2">Total Impact</th>
                    <th className="text-left py-2">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {SEGMENTS.map(seg => (
                    <tr key={seg.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 font-medium">{seg.name}</td>
                      <td className="py-2 text-right">{seg.parcelCount.toLocaleString()}</td>
                      <td className="py-2 text-center">
                        <Badge variant={statusConfig[seg.status].variant}>
                          {statusConfig[seg.status].label}
                        </Badge>
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-16 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${seg.progress}%` }}
                            />
                          </div>
                          <span className="text-xs">{seg.progress}%</span>
                        </div>
                      </td>
                      <td className={`py-2 text-right font-mono ${seg.avgValueChange > 0 ? 'text-green-600' : seg.avgValueChange < 0 ? 'text-red-600' : ''}`}>
                        {seg.avgValueChange !== 0 ? `${seg.avgValueChange > 0 ? '+' : ''}${seg.avgValueChange}%` : '--'}
                      </td>
                      <td className={`py-2 text-right font-mono ${seg.totalValueImpact > 0 ? 'text-green-600' : seg.totalValueImpact < 0 ? 'text-red-600' : ''}`}>
                        {seg.totalValueImpact !== 0 ? `$${(seg.totalValueImpact / 1000000).toFixed(1)}M` : '--'}
                      </td>
                      <td className="py-2 text-muted-foreground">{seg.dueDate}</td>
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

export default SegmentRevaluationDashboard;
