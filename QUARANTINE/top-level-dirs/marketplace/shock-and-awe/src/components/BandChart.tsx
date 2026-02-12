import React from 'react';

export interface BandChartProps {
  lower: number;
  expected: number;
  upper: number;
  width?: number;
  height?: number;
  format?: (v: number) => string;
}

export const BandChart: React.FC<BandChartProps> = ({ lower, expected, upper, width = 320, height = 36, format }) => {
  const min = Math.min(lower, expected, upper);
  const max = Math.max(lower, expected, upper);
  const pad = 10;
  const span = max - min || 1;
  const x = (v: number) => pad + ((v - min) / span) * (width - pad * 2);

  return (
    <svg width={width} height={height} role="img" aria-label="forecast-band">
      <line x1={pad} y1={height / 2} x2={width - pad} y2={height / 2} stroke="#e5e7eb" strokeWidth={6} strokeLinecap="round" />
      <line x1={x(lower)} y1={height / 2} x2={x(upper)} y2={height / 2} stroke="#93c5fd" strokeWidth={8} strokeLinecap="round" />
      <circle cx={x(expected)} cy={height / 2} r={6} fill="#1d4ed8" />
      <text x={x(lower)} y={height - 4} textAnchor="middle" fontSize={10} fill="#6b7280">{format ? format(lower) : lower.toLocaleString()}</text>
      <text x={x(expected)} y={12} textAnchor="middle" fontSize={11} fill="#111827" fontWeight="bold">{format ? format(expected) : expected.toLocaleString()}</text>
      <text x={x(upper)} y={height - 4} textAnchor="middle" fontSize={10} fill="#6b7280">{format ? format(upper) : upper.toLocaleString()}</text>
    </svg>
  );
};

export default BandChart;
