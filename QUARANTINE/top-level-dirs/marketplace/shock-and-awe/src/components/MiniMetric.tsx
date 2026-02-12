import React from 'react';

export interface MiniMetricProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  format?: (v: number) => string;
}

export const MiniMetric: React.FC<MiniMetricProps> = ({ label, value, min = 0, max = 1.5, format }) => {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const width = 160;
  const height = 10;
  const barWidth = Math.max(2, Math.round(width * pct));
  const display = format ? format(value) : value.toFixed(3);

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span>{label}</span>
        <strong>{display}</strong>
      </div>
      <svg width={width} height={height} role="img" aria-label={`${label} ${display}`}>
        <rect x={0} y={0} width={width} height={height} fill="#e5e7eb" rx={4} />
        <rect x={0} y={0} width={barWidth} height={height} fill="#2563eb" rx={4} />
      </svg>
    </div>
  );
};

export default MiniMetric;
