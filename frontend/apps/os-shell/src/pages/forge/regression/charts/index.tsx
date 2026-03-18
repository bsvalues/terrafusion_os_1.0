/**
 * Regression chart components (TFR-054)
 *
 * ResidualPlot, CoefficientBarChart, PredictedVsActual, QQPlot.
 * All using Recharts. Export from index.
 */

import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, ReferenceLine, LineChart, Line,
} from 'recharts';

/* ── Sample data for display ─────────────────────────────── */

const residualData = Array.from({ length: 50 }, (_, i) => ({
  predicted: 150000 + Math.random() * 350000,
  residual: (Math.random() - 0.5) * 60000,
}));

const coefficientData = [
  { variable: 'sqft', coefficient: 85.4 },
  { variable: 'lot_size', coefficient: 12.3 },
  { variable: 'year_built', coefficient: 450.2 },
  { variable: 'quality', coefficient: 22000 },
  { variable: 'neighborhood', coefficient: 15400 },
  { variable: 'condition', coefficient: 8900 },
];

const predictedActualData = Array.from({ length: 50 }, (_, i) => {
  const actual = 100000 + Math.random() * 400000;
  const predicted = actual + (Math.random() - 0.5) * 50000;
  return { actual, predicted };
});

const qqData = Array.from({ length: 40 }, (_, i) => {
  const theoretical = -2.5 + (i / 39) * 5;
  const sample = theoretical + (Math.random() - 0.5) * 0.6;
  return { theoretical, sample };
});

/* ── ResidualPlot ─────────────────────────────────────────── */

export function ResidualPlot() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="predicted"
          name="Predicted"
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          label={{ value: 'Predicted Value', position: 'insideBottom', offset: -10 }}
        />
        <YAxis
          type="number"
          dataKey="residual"
          name="Residual"
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          label={{ value: 'Residual', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          formatter={(value: number) => `$${value.toLocaleString()}`}
        />
        <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="3 3" />
        <Scatter data={residualData} fill="#3b82f6" fillOpacity={0.6} r={3} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ── CoefficientBarChart ──────────────────────────────────── */

export function CoefficientBarChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={coefficientData} layout="vertical" margin={{ top: 10, right: 10, bottom: 10, left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="variable" width={70} />
        <Tooltip formatter={(value: number) => value.toFixed(2)} />
        <Bar dataKey="coefficient" fill="#6366f1" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── PredictedVsActual ────────────────────────────────────── */

export function PredictedVsActual() {
  const minVal = 100000;
  const maxVal = 500000;
  const perfectLine = [
    { actual: minVal, predicted: minVal },
    { actual: maxVal, predicted: maxVal },
  ];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="actual"
          name="Actual"
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          label={{ value: 'Actual', position: 'insideBottom', offset: -10 }}
        />
        <YAxis
          type="number"
          dataKey="predicted"
          name="Predicted"
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          label={{ value: 'Predicted', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
        <Scatter data={predictedActualData} fill="#10b981" fillOpacity={0.6} r={3} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ── QQPlot ───────────────────────────────────────────────── */

export function QQPlot() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="theoretical"
          name="Theoretical"
          label={{ value: 'Theoretical Quantiles', position: 'insideBottom', offset: -10 }}
        />
        <YAxis
          type="number"
          dataKey="sample"
          name="Sample"
          label={{ value: 'Sample Quantiles', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip />
        <ReferenceLine segment={[{ x: -2.5, y: -2.5 }, { x: 2.5, y: 2.5 }]} stroke="#dc2626" strokeDasharray="3 3" />
        <Scatter data={qqData} fill="#f59e0b" fillOpacity={0.7} r={3} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
