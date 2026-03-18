/**
 * VersionComparePanel.tsx — Phase 16B
 * ===================================================================
 * Side-by-side model version comparison with coefficient deltas
 * and metric delta summary. Reuses delta display pattern from
 * ModelComparisonPanel (Phase 16A).
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useForgeRegressionStore } from '@/stores/forgeRegressionStore';

// ============================================================================
// Component
// ============================================================================

export function VersionComparePanel() {
  const models = useForgeRegressionStore((s) => s.models);
  const comparison = useForgeRegressionStore((s) => s.comparison);
  const compareVersions = useForgeRegressionStore((s) => s.compareVersions);

  const [modelAId, setModelAId] = useState<string>(models[0]?.id ?? '');
  const [modelBId, setModelBId] = useState<string>(models[1]?.id ?? '');

  const handleCompare = () => {
    if (modelAId && modelBId) {
      compareVersions(modelAId, modelBId);
    }
  };

  return (
    <div data-testid="version-compare-panel" className="space-y-4">
      {/* Model Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Models to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--tf-muted))' }}>Model A</label>
              <select
                value={modelAId}
                onChange={(e) => setModelAId(e.target.value)}
                className="w-full p-2 rounded border text-sm"
                style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-fg))', borderColor: 'hsl(var(--tf-border))' }}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} v{m.version} ({m.modelType})</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--tf-muted))' }}>Model B</label>
              <select
                value={modelBId}
                onChange={(e) => setModelBId(e.target.value)}
                className="w-full p-2 rounded border text-sm"
                style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-fg))', borderColor: 'hsl(var(--tf-border))' }}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} v{m.version} ({m.modelType})</option>
                ))}
              </select>
            </div>
            <Button onClick={handleCompare} size="sm">Compare</Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparison && (
        <>
          {/* Metric Deltas */}
          <Card>
            <CardHeader>
              <CardTitle>Metric Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div data-testid="metric-deltas" className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {([
                  { key: 'rSquared', label: 'R²', higherBetter: true },
                  { key: 'adjustedRSquared', label: 'Adj. R²', higherBetter: true },
                  { key: 'aic', label: 'AIC', higherBetter: false },
                  { key: 'bic', label: 'BIC', higherBetter: false },
                  { key: 'mse', label: 'MSE', higherBetter: false },
                ] as const).map(({ key, label, higherBetter }) => {
                  const delta = comparison.metricDeltas[key];
                  const isImproved = comparison.improved.includes(key);
                  const isDegraded = comparison.degraded.includes(key);
                  return (
                    <div key={key} className="text-center p-3 rounded" style={{ background: 'hsl(var(--tf-surface) / 0.5)' }}>
                      <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{label}</div>
                      <div className="text-lg font-bold font-mono" style={{
                        color: isImproved
                          ? 'hsl(var(--tf-success, 142 70% 45%))'
                          : isDegraded
                            ? 'hsl(var(--tf-error, 0 80% 60%))'
                            : 'hsl(var(--tf-fg))',
                      }}>
                        {delta > 0 ? '+' : ''}{key === 'mse' ? `${(delta / 1e6).toFixed(1)}M` : delta.toFixed(4)}
                      </div>
                      <Badge>{isImproved ? 'improved' : isDegraded ? 'degraded' : 'neutral'}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Coefficient Deltas */}
          <Card>
            <CardHeader>
              <CardTitle>Coefficient Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div data-testid="coefficient-deltas" className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.2)' }}>
                      <th className="text-left py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Variable</th>
                      <th className="text-right py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>
                        {comparison.modelA.name} v{comparison.modelA.version}
                      </th>
                      <th className="text-right py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>
                        {comparison.modelB.name} v{comparison.modelB.version}
                      </th>
                      <th className="text-right py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Delta</th>
                      <th className="text-center py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Sign Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.coefficientDeltas.map((cd) => (
                      <tr key={cd.variable} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.1)' }}>
                        <td className="py-2 px-2 font-mono text-xs" style={{ color: 'hsl(var(--tf-fg))' }}>{cd.variable}</td>
                        <td className="py-2 px-2 text-right font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>
                          {cd.estimateA.toFixed(4)}
                          {!cd.significantA && <span style={{ color: 'hsl(var(--tf-muted))' }}> (ns)</span>}
                        </td>
                        <td className="py-2 px-2 text-right font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>
                          {cd.estimateB.toFixed(4)}
                          {!cd.significantB && <span style={{ color: 'hsl(var(--tf-muted))' }}> (ns)</span>}
                        </td>
                        <td className="py-2 px-2 text-right font-mono" style={{
                          color: cd.delta > 0
                            ? 'hsl(var(--tf-success, 142 70% 45%))'
                            : cd.delta < 0
                              ? 'hsl(var(--tf-error, 0 80% 60%))'
                              : 'hsl(var(--tf-fg))',
                        }}>
                          {cd.delta > 0 ? '+' : ''}{cd.delta.toFixed(4)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {cd.signChange ? <Badge>Sign Change</Badge> : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default VersionComparePanel;
