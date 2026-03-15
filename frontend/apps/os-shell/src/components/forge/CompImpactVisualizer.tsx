// TFT-113 — Comp adjustment impact visualizer
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import type { CompAdjustment } from '@/types/realEstate';

interface CompImpactVisualizerProps {
  adjustments: CompAdjustment[];
  loading?: boolean;
}

export function CompImpactVisualizer({ adjustments, loading }: CompImpactVisualizerProps) {
  const chartData = adjustments.map((adj) => ({
    name: adj.field,
    amount: adj.adjustmentAmount,
  }));

  const totalAdjustment = adjustments.reduce((sum, a) => sum + a.adjustmentAmount, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Adjustment Impact</CardTitle>
          <span className={`text-sm font-semibold ${totalAdjustment >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalAdjustment >= 0 ? '+' : ''}${totalAdjustment.toLocaleString()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse h-48 rounded bg-primary/10" />
        ) : adjustments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No adjustments to display</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
              <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={75} />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Adjustment']}
              />
              <ReferenceLine x={0} stroke="#666" />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.amount >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
