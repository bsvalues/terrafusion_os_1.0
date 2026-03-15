import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';

// TFR-014: PRD over time with IAAO acceptable range band (0.98-1.03)

interface PRDDataPoint {
  period: string;
  prd: number;
}

interface PRDTrendChartProps {
  data: PRDDataPoint[];
  loading?: boolean;
}

export default function PRDTrendChart({ data, loading }: PRDTrendChartProps) {
  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        Loading PRD trend...
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600 }}>PRD Trend</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="period" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} domain={[0.9, 1.1]} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 6,
              fontSize: 13,
            }}
            formatter={(value: number) => [value.toFixed(4), 'PRD']}
          />
          {/* IAAO acceptable range band */}
          <ReferenceArea
            y1={0.98}
            y2={1.03}
            fill="#22c55e"
            fillOpacity={0.08}
            label={{
              value: 'IAAO Range (0.98-1.03)',
              fill: '#22c55e',
              fontSize: 11,
              position: 'insideTopRight',
            }}
          />
          <Line
            type="monotone"
            dataKey="prd"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ r: 4, fill: '#8b5cf6' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
