/**
 * SegmentRevaluationDashboard.tsx (TFR-058)
 *
 * Shows segments pending revaluation, progress, value change impact.
 * Read-only display. No domain math.
 */

import React from 'react';
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

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  'pending': { label: 'Pending', variant: 'outline' },
  'in-progress': { label: 'In Progress', variant: 'secondary' },
  'complete': { label: 'Complete', variant: 'default' },
  'review': { label: 'Under Review', variant: 'destructive' },
};

interface SegmentRevaluationDashboardProps {
  segments?: RevaluationSegment[];
  loading?: boolean;
  sourceLabel?: string;
}

export function SegmentRevaluationDashboard({
  segments = [],
  loading = false,
  sourceLabel = 'No revaluation segment provider is configured for this surface.',
}: SegmentRevaluationDashboardProps) {
  const totalParcels = segments.reduce((sum, s) => sum + s.parcelCount, 0);
  const completedParcels = segments.filter(s => s.status === 'complete' || s.status === 'review')
    .reduce((sum, s) => sum + s.parcelCount, 0);
  const inProgressParcels = segments.filter(s => s.status === 'in-progress')
    .reduce((sum, s) => sum + Math.round(s.parcelCount * s.progress / 100), 0);
  const overallProgress = totalParcels > 0
    ? Math.round(((completedParcels + inProgressParcels) / totalParcels) * 100)
    : 0;

  const chartData = segments.filter(s => s.avgValueChange !== 0).map(s => ({
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
                <div className="text-3xl font-bold">{segments.length}</div>
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
                  {segments.filter(s => s.status === 'pending').length}
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
              {chartData.length > 0 ? (
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
              ) : (
                <div className="rounded border border-dashed p-6 text-sm text-muted-foreground">
                  {sourceLabel}
                </div>
              )}
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
                  {segments.length === 0 ? (
                    <tr>
                      <td className="py-4 text-muted-foreground" colSpan={7}>
                        {sourceLabel}
                      </td>
                    </tr>
                  ) : segments.map(seg => (
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
