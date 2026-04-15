/**
 * ModelComparisonPanel.tsx — Phase 16
 * ===================================================================
 * Side-by-side ratio study comparison with delta indicators and
 * strata breakdown table.
 *
 * Renders as a tab within StatisticsStudio.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useForgeStatisticsStore } from '@/stores/forgeStatisticsStore';

// ============================================================================
// Helpers
// ============================================================================

function fmtNum(n: number, decimals = 3): string {
  return n.toFixed(decimals);
}

function fmtInt(n: number): string {
  return n.toLocaleString();
}

function deltaColor(metric: string, improved: string[], degraded: string[]): string {
  if (improved.includes(metric)) return 'hsl(var(--tf-success, 140 60% 50%))';
  if (degraded.includes(metric)) return 'hsl(var(--tf-error, 0 80% 60%))';
  return 'hsl(var(--tf-muted))';
}

function deltaPrefix(value: number): string {
  return value > 0 ? '+' : '';
}

// ============================================================================
// Metric Row
// ============================================================================

interface MetricRowProps {
  label: string;
  valueA: string;
  valueB: string;
}

function MetricRow({ label, valueA, valueB }: MetricRowProps) {
  return (
    <div className="flex justify-between items-center py-1" style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.1)' }}>
      <span className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{label}</span>
      <div className="flex gap-6">
        <span className="font-mono text-sm" style={{ color: 'hsl(var(--tf-fg))' }}>{valueA}</span>
        <span className="font-mono text-sm" style={{ color: 'hsl(var(--tf-fg))' }}>{valueB}</span>
      </div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

// Normalize a model entry from either the live API (flat) or fixture (nested result) shape.
function extractStats(model: Record<string, unknown>): {
  cod: number; prd: number; prb: number; medianRatio: number; sampleSize: number; iaaoCompliant: boolean;
} {
  // Live API shape: { label, cod, prd, prb, medianRatio, sampleSize }
  // Fixture shape:  { label, params, result: { cod, prd, prb, medianRatio, sampleSize, iaaoCompliant } }
  const src = (model.result as Record<string, unknown> | undefined) ?? model;
  const cod        = Number(src.cod        ?? 0);
  const prd        = Number(src.prd        ?? 1);
  const prb        = Number(src.prb        ?? 0);
  const medianRatio = Number(src.medianRatio ?? 0);
  const sampleSize = Number(src.sampleSize ?? 0);
  const iaaoCompliant: boolean =
    src.iaaoCompliant !== undefined
      ? Boolean(src.iaaoCompliant)
      : cod <= 15 && prd >= 0.98 && prd <= 1.03 && Math.abs(prb) < 0.05 &&
        medianRatio >= 0.9 && medianRatio <= 1.1;
  return { cod, prd, prb, medianRatio, sampleSize, iaaoCompliant };
}

export function ModelComparisonPanel() {
  const comparison = useForgeStatisticsStore((s) => s.comparison);
  const strata = useForgeStatisticsStore((s) => s.strata);

  if (!comparison) {
    return (
      <div data-testid="model-comparison" className="p-4">
        <p style={{ color: 'hsl(var(--tf-muted))' }}>No comparison loaded.</p>
      </div>
    );
  }

  const { modelA, modelB, deltas, improvedMetrics, degradedMetrics } = comparison;
  const statsA = extractStats(modelA as unknown as Record<string, unknown>);
  const statsB = extractStats(modelB as unknown as Record<string, unknown>);

  return (
    <div data-testid="model-comparison" className="space-y-4">
      {/* Side-by-side Model Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Model A */}
        <Card data-testid="model-a-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{modelA.label}</span>
              {statsA.iaaoCompliant && <Badge>Compliant</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <MetricRow label="COD" valueA={fmtNum(statsA.cod, 1)} valueB="" />
              <MetricRow label="PRD" valueA={fmtNum(statsA.prd)} valueB="" />
              <MetricRow label="PRB" valueA={fmtNum(statsA.prb)} valueB="" />
              <MetricRow label="Median Ratio" valueA={fmtNum(statsA.medianRatio)} valueB="" />
              <MetricRow label="Sample Size" valueA={fmtInt(statsA.sampleSize)} valueB="" />
            </div>
          </CardContent>
        </Card>

        {/* Model B */}
        <Card data-testid="model-b-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{modelB.label}</span>
              {statsB.iaaoCompliant && <Badge>Compliant</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <MetricRow label="COD" valueA={fmtNum(statsB.cod, 1)} valueB="" />
              <MetricRow label="PRD" valueA={fmtNum(statsB.prd)} valueB="" />
              <MetricRow label="PRB" valueA={fmtNum(statsB.prb)} valueB="" />
              <MetricRow label="Median Ratio" valueA={fmtNum(statsB.medianRatio)} valueB="" />
              <MetricRow label="Sample Size" valueA={fmtInt(statsB.sampleSize)} valueB="" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delta Summary */}
      <Card data-testid="delta-summary">
        <CardHeader>
          <CardTitle>Comparison Deltas (B vs A)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {(['cod', 'prd', 'prb', 'medianRatio', 'sampleSize'] as const).map((key) => {
              const val = deltas[key];
              const color = deltaColor(key, improvedMetrics, degradedMetrics);
              return (
                <div key={key} className="text-center">
                  <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{key}</div>
                  <div className="font-mono text-lg font-bold" style={{ color }}>
                    {key === 'sampleSize'
                      ? `${deltaPrefix(val)}${fmtInt(val)}`
                      : `${deltaPrefix(val)}${fmtNum(val)}`}
                  </div>
                  <Badge>
                    {improvedMetrics.includes(key) ? 'improved' : degradedMetrics.includes(key) ? 'degraded' : 'unchanged'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Strata Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Strata Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div data-testid="strata-table" className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.2)' }}>
                  <th className="text-left py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Strata</th>
                  <th className="text-left py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Neighborhood</th>
                  <th className="text-left py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Type</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Sample</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Median Ratio</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>COD</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>PRD</th>
                  <th className="text-left py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Qualified</th>
                </tr>
              </thead>
              <tbody>
                {strata.map((s) => (
                  <tr key={s.strataId} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.1)' }}>
                    <td className="py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>{s.strataLabel}</td>
                    <td className="py-2 px-2 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{s.neighborhood}</td>
                    <td className="py-2 px-2 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{s.propertyType}</td>
                    <td className="py-2 px-2 text-right font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>{s.sampleSize}</td>
                    <td className="py-2 px-2 text-right font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>{s.medianRatio.toFixed(3)}</td>
                    <td className="py-2 px-2 text-right font-mono" style={{ color: s.cod > 15 ? 'hsl(var(--tf-error, 0 80% 60%))' : 'hsl(var(--tf-fg))' }}>{s.cod.toFixed(1)}</td>
                    <td className="py-2 px-2 text-right font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>{s.prd.toFixed(3)}</td>
                    <td className="py-2 px-2">
                      <Badge>{s.qualified ? 'Pass' : 'Fail'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ModelComparisonPanel;
