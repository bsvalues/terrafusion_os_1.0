import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// TFR-012: Median ratios by value quartile (Q1-Q4)

interface TierData {
  quartile: string; // 'Q1' | 'Q2' | 'Q3' | 'Q4'
  medianRatio: number;
  sampleSize: number;
}

interface TierRatioPlotProps {
  data: TierData[];
  loading?: boolean;
}

function getBarColor(ratio: number): string {
  const deviation = Math.abs(ratio - 1.0);
  if (deviation <= 0.05) return '#22c55e';
  if (deviation <= 0.10) return '#eab308';
  return '#ef4444';
}

function DeviationTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload as TierData;
  const deviation = ((item.medianRatio - 1.0) * 100).toFixed(2);
  const sign = item.medianRatio >= 1.0 ? '+' : '';
  return (
    <div
      style={{
        padding: '8px 12px',
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 6,
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 600 }}>{item.quartile}</div>
      <div>Median Ratio: {item.medianRatio.toFixed(3)}</div>
      <div>
        Deviation: {sign}
        {deviation}%
      </div>
      <div style={{ color: '#94a3b8' }}>Sample: {item.sampleSize}</div>
    </div>
  );
}

export default function TierRatioPlot({ data, loading }: TierRatioPlotProps) {
  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
        Loading tier ratio data...
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600 }}>
        Median Ratios by Value Quartile
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="quartile" stroke="#64748b" fontSize={13} />
          <YAxis
            domain={[0.8, 1.2]}
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(v: number) => v.toFixed(2)}
          />
          <Tooltip content={<DeviationTooltip />} />
          <ReferenceLine y={1.0} stroke="#3b82f6" strokeDasharray="4 4" label="1.00" />
          <Bar dataKey="medianRatio" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={getBarColor(entry.medianRatio)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
