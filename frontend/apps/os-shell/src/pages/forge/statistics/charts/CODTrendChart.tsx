import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

// TFR-013: COD over time with IAAO threshold

interface CODDataPoint {
  period: string;
  cod: number;
}

interface CODTrendChartProps {
  data: CODDataPoint[];
  threshold?: number;
  loading?: boolean;
}

export default function CODTrendChart({ data, threshold = 15, loading }: CODTrendChartProps) {
  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        Loading COD trend...
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600 }}>
        COD Trend (Residential)
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="period" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} domain={[0, 'auto']} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 6,
              fontSize: 13,
            }}
            formatter={(value: number) => [value.toFixed(2), 'COD']}
          />
          <ReferenceLine
            y={threshold}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{
              value: `IAAO Threshold (${threshold})`,
              fill: '#ef4444',
              fontSize: 11,
              position: 'right',
            }}
          />
          <Line
            type="monotone"
            dataKey="cod"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4, fill: '#3b82f6' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
