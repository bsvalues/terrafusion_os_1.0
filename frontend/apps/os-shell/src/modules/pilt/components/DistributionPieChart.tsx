/**
 * PILT Distribution Pie Chart
 *
 * Visualizes PILT payment distribution by entity type using recharts.
 *
 * Owner Suite: TerraDais
 * @module modules/pilt/components/DistributionPieChart
 */

import React from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export interface DistributionPieChartProps {
  data: Array<{ entityType: string; amount: number }>;
}

const ENTITY_COLORS: Record<string, string> = {
  federal: '#0080FF',
  state: '#00FFEE',
  tribal: '#FF6B35',
  municipal: '#00FFAA',
  other: '#8B5CF6',
};

const fallbackColor = '#64748B';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function DistributionPieChart({ data }: DistributionPieChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-white/40">
        No distribution data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="entityType"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ entityType, percent }) =>
            `${entityType} ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((entry) => (
            <Cell
              key={entry.entityType}
              fill={ENTITY_COLORS[entry.entityType] ?? fallbackColor}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => currencyFormatter.format(value)}
          contentStyle={{
            backgroundColor: '#0A0E1A',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: '#fff',
          }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
