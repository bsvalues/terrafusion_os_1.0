/**
 * LEV-047 - Interactive Levy Visualization Components
 *
 * Provides chart components for levy rate comparison, trend analysis,
 * and district heatmap visualization using recharts.
 */

import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface RateComparisonDatum {
  districtName: string;
  currentRate: number;
  priorRate: number;
  statutoryLimit: number;
}

export interface TrendLineDatum {
  year: number;
  levyRate: number;
  assessedValue: number;
}

export interface DistrictHeatmapDatum {
  districtId: string;
  districtName: string;
  intensity: number; // 0-1 scale
}

/* ------------------------------------------------------------------ */
/*  RateComparisonChart                                                */
/* ------------------------------------------------------------------ */

interface RateComparisonChartProps {
  data: RateComparisonDatum[];
  height?: number;
}

export const RateComparisonChart: React.FC<RateComparisonChartProps> = ({
  data,
  height = 400,
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="districtName" />
      <YAxis label={{ value: 'Rate ($/1000 AV)', angle: -90, position: 'insideLeft' }} />
      <Tooltip formatter={(v: number) => `$${v.toFixed(4)}`} />
      <Legend />
      <Bar dataKey="currentRate" name="Current Rate" fill="#3b82f6" />
      <Bar dataKey="priorRate" name="Prior Rate" fill="#94a3b8" />
      <Bar dataKey="statutoryLimit" name="Statutory Limit" fill="#ef4444" />
    </BarChart>
  </ResponsiveContainer>
);

/* ------------------------------------------------------------------ */
/*  TrendLineChart                                                     */
/* ------------------------------------------------------------------ */

interface TrendLineChartProps {
  data: TrendLineDatum[];
  height?: number;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  height = 400,
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="year" />
      <YAxis yAxisId="rate" label={{ value: 'Levy Rate', angle: -90, position: 'insideLeft' }} />
      <YAxis
        yAxisId="av"
        orientation="right"
        label={{ value: 'Assessed Value', angle: 90, position: 'insideRight' }}
      />
      <Tooltip />
      <Legend />
      <Line yAxisId="rate" type="monotone" dataKey="levyRate" stroke="#3b82f6" name="Levy Rate" />
      <Line
        yAxisId="av"
        type="monotone"
        dataKey="assessedValue"
        stroke="#10b981"
        name="Assessed Value"
      />
    </LineChart>
  </ResponsiveContainer>
);

/* ------------------------------------------------------------------ */
/*  DistrictHeatmap                                                    */
/* ------------------------------------------------------------------ */

interface DistrictHeatmapProps {
  data: DistrictHeatmapDatum[];
  height?: number;
}

const intensityColor = (intensity: number): string => {
  const r = Math.round(59 + (239 - 59) * intensity);
  const g = Math.round(130 - 62 * intensity);
  const b = Math.round(246 - 178 * intensity);
  return `rgb(${r},${g},${b})`;
};

export const DistrictHeatmap: React.FC<DistrictHeatmapProps> = ({
  data,
  height = 400,
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="districtName" />
      <YAxis label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }} />
      <Tooltip formatter={(v: number) => v.toFixed(3)} />
      <Bar dataKey="intensity" name="Levy Intensity">
        {data.map((entry) => (
          <Cell key={entry.districtId} fill={intensityColor(entry.intensity)} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);
