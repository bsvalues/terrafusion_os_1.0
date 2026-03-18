/**
 * CoefficientPanel.tsx — Phase 16B
 * ===================================================================
 * Coefficient table with significance highlighting, model receipt
 * summary, and IAAO qualification badge.
 *
 * Consumes forgeRegressionStore selectedModel.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useForgeRegressionStore } from '@/stores/forgeRegressionStore';

// ============================================================================
// Component
// ============================================================================

export function CoefficientPanel() {
  const models = useForgeRegressionStore((s) => s.models);
  const selectedModelId = useForgeRegressionStore((s) => s.selectedModelId);

  const model = models.find((m) => m.id === selectedModelId);

  if (!model) {
    return (
      <div data-testid="coefficient-panel" className="p-4">
        <p style={{ color: 'hsl(var(--tf-muted))' }}>Select a model to view coefficients.</p>
      </div>
    );
  }

  return (
    <div data-testid="coefficient-panel" className="space-y-4">
      {/* Model Receipt Summary */}
      <div data-testid="model-receipt" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>R²</div>
            <div className="text-xl font-bold font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>
              {model.rSquared.toFixed(4)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Adj. R²</div>
            <div className="text-xl font-bold font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>
              {model.adjustedRSquared.toFixed(4)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>F-Statistic</div>
            <div className="text-xl font-bold font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>
              {model.fStatistic.toFixed(1)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Observations</div>
            <div className="text-xl font-bold font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>
              {model.observations.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>AIC</div>
            <div className="text-xl font-bold font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>
              {model.aic.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>BIC</div>
            <div className="text-xl font-bold font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>
              {model.bic.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>MSE</div>
            <div className="text-xl font-bold font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>
              {(model.mse / 1e6).toFixed(1)}M
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>IAAO Qualified</div>
            <div className="mt-1">
              <Badge>{model.qualificationPass ? 'Pass' : 'Fail'}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coefficient Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Coefficients — {model.name} v{model.version}</span>
            <Badge>{model.modelType}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div data-testid="coefficient-table" className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.2)' }}>
                  <th className="text-left py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Variable</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Estimate</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Std Error</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>t-Stat</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>p-Value</th>
                  <th className="text-center py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>Sig.</th>
                  {model.coefficients.some((c) => c.vif !== undefined) && (
                    <th className="text-right py-2 px-2 font-medium" style={{ color: 'hsl(var(--tf-muted))' }}>VIF</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {model.coefficients.map((c) => (
                  <tr key={c.variable} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.1)' }}>
                    <td className="py-2 px-2 font-mono text-xs" style={{ color: 'hsl(var(--tf-fg))' }}>{c.variable}</td>
                    <td className="py-2 px-2 text-right font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>{c.estimate.toFixed(4)}</td>
                    <td className="py-2 px-2 text-right font-mono" style={{ color: 'hsl(var(--tf-muted))' }}>{c.stdError.toFixed(4)}</td>
                    <td className="py-2 px-2 text-right font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>{c.tStat.toFixed(3)}</td>
                    <td className="py-2 px-2 text-right font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>{c.pValue.toFixed(4)}</td>
                    <td className="py-2 px-2 text-center">
                      <Badge>{c.significant ? 'Yes' : 'No'}</Badge>
                    </td>
                    {model.coefficients.some((co) => co.vif !== undefined) && (
                      <td className="py-2 px-2 text-right font-mono" style={{ color: 'hsl(var(--tf-muted))' }}>
                        {c.vif !== undefined ? c.vif.toFixed(1) : '—'}
                      </td>
                    )}
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

export default CoefficientPanel;
