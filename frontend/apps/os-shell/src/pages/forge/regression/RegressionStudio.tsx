/**
 * RegressionStudio.tsx (Phase 16B)
 *
 * Regression studio landing page. Model list, create new, version
 * comparison, coefficient detail. Store-driven via forgeRegressionStore.
 *
 * DATA POSTURE: The Saved Models list is always sourced from REGRESSION_MODELS
 * fixtures. No live path exists for model records. Run history may be API-backed
 * when the backend is available; the store discloses fixture fallback via error state.
 */

import React, { useEffect, useState } from 'react';
import { DemoDataBanner } from '@/components/governance/DemoDataBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RegressionControlPanel } from './RegressionControlPanel';
import { CoefficientPanel } from './CoefficientPanel';
import { VersionComparePanel } from './VersionComparePanel';
import { ResidualPlot, CoefficientBarChart, PredictedVsActual, QQPlot } from './charts';
import { useForgeRegressionStore } from '@/stores/forgeRegressionStore';
import { RegressionStudioDashboard } from './RegressionStudioDashboard';

type View = 'list' | 'new' | 'compare' | 'detail' | 'advanced';

export function RegressionStudio() {
  const [view, setView] = useState<View>('list');
  const [showCharts, setShowCharts] = useState(false);

  const models = useForgeRegressionStore((s) => s.models);
  const runs = useForgeRegressionStore((s) => s.runs);
  const selectedModelId = useForgeRegressionStore((s) => s.selectedModelId);
  const loading = useForgeRegressionStore((s) => s.loading);
  const error = useForgeRegressionStore((s) => s.error);
  const fetchModels = useForgeRegressionStore((s) => s.fetchModels);
  const selectModel = useForgeRegressionStore((s) => s.selectModel);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'production': return 'default';
      case 'validated': return 'secondary';
      default: return 'outline';
    }
  };

  const handleModelClick = (modelId: string) => {
    selectModel(modelId);
    setView('detail');
  };

  return (
    <div data-testid="regression-studio" className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Regression Studio</h1>
        <div className="flex gap-2">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setView('list'); selectModel(null); }}
          >
            Models
          </Button>
          <Button
            variant={view === 'new' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('new')}
          >
            New Run
          </Button>
          <Button
            variant={view === 'compare' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('compare')}
          >
            Compare
          </Button>
          <Button
            variant={view === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('advanced')}
          >
            Advanced
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded text-sm border" style={{
          background: 'hsl(var(--tf-error, 0 80% 60%) / 0.1)',
          color: 'hsl(var(--tf-error, 0 80% 60%))',
          borderColor: 'hsl(var(--tf-error, 0 80% 60%) / 0.2)',
        }}>
          {error}
        </div>
      )}

      {/* View: Models List */}
      {view === 'list' && (
        <>
          {/* Card 46C: Saved Models list is always REGRESSION_MODELS fixtures — no live path */}
          <DemoDataBanner module="Regression Studio" />
          <Card>
            <CardHeader>
              <CardTitle>Saved Models</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <span style={{ color: 'hsl(var(--tf-muted))' }}>Loading models...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      data-model-id={model.id}
                      data-material="bento"
                      className="flex items-center justify-between p-3 rounded border cursor-pointer"
                      style={{ borderColor: 'hsl(var(--tf-border) / 0.2)' }}
                      onClick={() => handleModelClick(model.id)}
                      role="link"
                    >
                      <div>
                        <div className="font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>{model.name}</div>
                        <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
                          {model.modelType} v{model.version} | {model.variables.length} variables | Created {model.createdAt}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm" style={{ color: 'hsl(var(--tf-fg))' }}>
                          R² = {model.rSquared.toFixed(4)}
                        </span>
                        <Badge variant={statusColor(model.status) as any}>{model.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Run History</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.2)' }}>
                    <th className="text-left py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Timestamp</th>
                    <th className="text-left py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Type</th>
                    <th className="text-right py-2" style={{ color: 'hsl(var(--tf-muted))' }}>R²</th>
                    <th className="text-right py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Variables</th>
                    <th className="text-left py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.1)' }}>
                      <td className="py-2" style={{ color: 'hsl(var(--tf-muted))' }}>{run.timestamp}</td>
                      <td className="py-2"><Badge variant="outline">{run.modelType}</Badge></td>
                      <td className="py-2 text-right font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>
                        {run.rSquared.toFixed(4)}
                      </td>
                      <td className="py-2 text-right" style={{ color: 'hsl(var(--tf-fg))' }}>
                        {run.variables.length}
                      </td>
                      <td className="py-2">
                        <Badge variant={run.status === 'completed' ? 'secondary' : 'outline'}>
                          {run.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      {/* View: New Run */}
      {view === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RegressionControlPanel onRunComplete={() => setShowCharts(true)} />
          {showCharts && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Diagnostics</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Residuals</h4>
                    <ResidualPlot />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Coefficients</h4>
                    <CoefficientBarChart />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Predicted vs Actual</h4>
                    <PredictedVsActual />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Q-Q Plot</h4>
                    <QQPlot />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* View: Compare */}
      {view === 'compare' && <VersionComparePanel />}

      {/* View: Advanced — full regression statistical laboratory */}
      {view === 'advanced' && <RegressionStudioDashboard />}

      {/* View: Model Detail */}
      {view === 'detail' && selectedModelId && (
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => { setView('list'); selectModel(null); }}>
            ← Back to Models
          </Button>
          <CoefficientPanel />
        </div>
      )}
    </div>
  );
}

export default RegressionStudio;
