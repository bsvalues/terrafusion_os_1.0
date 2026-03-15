/**
 * RegressionStudio.tsx (TFR-053)
 *
 * Regression studio landing page. Model list, create new, run history.
 * Orchestrates RegressionControlPanel + charts.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RegressionControlPanel } from './RegressionControlPanel';
import { ResidualPlot, CoefficientBarChart, PredictedVsActual, QQPlot } from './charts';

interface SavedModel {
  id: string;
  name: string;
  modelType: string;
  rSquared: number;
  variables: number;
  createdAt: string;
  status: 'draft' | 'validated' | 'production';
}

interface RunHistoryEntry {
  id: string;
  modelType: string;
  rSquared: number;
  timestamp: string;
  variables: string[];
}

type View = 'list' | 'new' | 'results';

export function RegressionStudio() {
  const [view, setView] = useState<View>('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState(false);

  const [savedModels] = useState<SavedModel[]>([
    { id: 'm1', name: 'SFR Base Model', modelType: 'OLS', rSquared: 0.8742, variables: 6, createdAt: '2026-02-15', status: 'production' },
    { id: 'm2', name: 'Commercial GWR', modelType: 'GWR', rSquared: 0.9103, variables: 8, createdAt: '2026-03-01', status: 'validated' },
    { id: 'm3', name: 'Multi-Family Quantile', modelType: 'Quantile', rSquared: 0.8321, variables: 5, createdAt: '2026-03-10', status: 'draft' },
  ]);

  const [runHistory] = useState<RunHistoryEntry[]>([
    { id: 'r1', modelType: 'OLS', rSquared: 0.8742, timestamp: '2026-03-14 14:30', variables: ['sqft', 'lot_size', 'year_built', 'quality_grade', 'neighborhood', 'condition'] },
    { id: 'r2', modelType: 'GWR', rSquared: 0.9103, timestamp: '2026-03-14 10:15', variables: ['sqft', 'lot_size', 'year_built', 'quality_grade', 'neighborhood', 'condition', 'dist_cbd', 'view'] },
    { id: 'r3', modelType: 'OLS', rSquared: 0.8501, timestamp: '2026-03-13 16:45', variables: ['sqft', 'lot_size', 'year_built', 'quality_grade'] },
  ]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'production': return 'default';
      case 'validated': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Regression Studio</h1>
        <div className="flex gap-2">
          <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setView('list')}>
            Models
          </Button>
          <Button variant={view === 'new' ? 'default' : 'outline'} size="sm" onClick={() => setView('new')}>
            New Run
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>
      )}

      {view === 'list' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Saved Models</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="text-muted-foreground">Loading models...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedModels.map(model => (
                    <div key={model.id} className="flex items-center justify-between p-3 rounded border hover:bg-gray-50 cursor-pointer">
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {model.modelType} | {model.variables} variables | Created {model.createdAt}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm">R² = {model.rSquared.toFixed(4)}</span>
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
                  <tr className="border-b">
                    <th className="text-left py-2">Timestamp</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-right py-2">R-squared</th>
                    <th className="text-right py-2">Variables</th>
                  </tr>
                </thead>
                <tbody>
                  {runHistory.map(run => (
                    <tr key={run.id} className="border-b hover:bg-gray-50 cursor-pointer">
                      <td className="py-2 text-muted-foreground">{run.timestamp}</td>
                      <td className="py-2"><Badge variant="outline" className="text-xs">{run.modelType}</Badge></td>
                      <td className="py-2 text-right font-mono">{run.rSquared.toFixed(4)}</td>
                      <td className="py-2 text-right">{run.variables.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

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
    </div>
  );
}

export default RegressionStudio;
