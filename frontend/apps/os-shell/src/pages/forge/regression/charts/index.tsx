/**
 * Regression chart components (TFR-054)
 *
 * Prometheus posture: charts remain empty until populated by a governed
 * regression result. No generated residuals, coefficients, predictions, or
 * quantiles are rendered as operational evidence.
 */

import React from 'react';

function EvidenceUnavailable({ title }: { title: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded border border-dashed border-white/20 bg-white/[0.03] p-4 text-center">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          No governed regression output is attached to this chart.
        </div>
      </div>
    </div>
  );
}

export function ResidualPlot() {
  return <EvidenceUnavailable title="Residual plot unavailable" />;
}

export function CoefficientBarChart() {
  return <EvidenceUnavailable title="Coefficient chart unavailable" />;
}

export function PredictedVsActual() {
  return <EvidenceUnavailable title="Predicted vs actual unavailable" />;
}

export function QQPlot() {
  return <EvidenceUnavailable title="Q-Q plot unavailable" />;
}
