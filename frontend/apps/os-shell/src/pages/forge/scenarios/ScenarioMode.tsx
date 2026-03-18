/**
 * ScenarioMode (TFR-101) — What-if analysis UI.
 * Adjust parameters, see projected impact on values.
 * No actual calculation — sends params to backend.
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ScenarioParam {
  name: string;
  label: string;
  currentValue: number;
  adjustedValue: number;
  unit: string;
}

interface ScenarioResult {
  scenarioId: string;
  description: string;
  projectedImpact: number;
  affectedParcels: number;
  confidenceLevel: number;
}

export function ScenarioMode() {
  const [params, setParams] = useState<ScenarioParam[]>([
    { name: 'landMultiplier', label: 'Land Value Multiplier', currentValue: 1.0, adjustedValue: 1.0, unit: 'x' },
    { name: 'depreciationRate', label: 'Depreciation Adjustment', currentValue: 0, adjustedValue: 0, unit: '%' },
    { name: 'neighborhoodFactor', label: 'Neighborhood Factor', currentValue: 1.0, adjustedValue: 1.0, unit: 'x' },
    { name: 'costIndex', label: 'Cost Index Change', currentValue: 0, adjustedValue: 0, unit: '%' },
  ]);
  const [results, setResults] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);

  const updateParam = (index: number, value: number) => {
    setParams(prev => prev.map((p, i) => i === index ? { ...p, adjustedValue: value } : p));
  };

  const runScenario = async () => {
    setLoading(true);
    try {
      const body = Object.fromEntries(params.map(p => [p.name, p.adjustedValue]));
      const res = await fetch('/api/forge/scenarios/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Scenario run failed');
      setResults(await res.json());
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scenario Mode</h1>
        <Badge variant="outline">What-If Analysis</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Adjustment Parameters</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {params.map((param, i) => (
            <div key={param.name} className="grid grid-cols-4 gap-4 items-center">
              <span className="text-sm font-medium">{param.label}</span>
              <span className="text-sm text-muted-foreground text-center">
                Current: {param.currentValue}{param.unit}
              </span>
              <Input
                type="number"
                step="0.01"
                value={param.adjustedValue}
                onChange={e => updateParam(i, parseFloat(e.target.value) || 0)}
                className="text-right"
              />
              <span className="text-sm text-muted-foreground">{param.unit}</span>
            </div>
          ))}
          <Button onClick={runScenario} disabled={loading} className="w-full mt-4">
            {loading ? 'Running Scenario...' : 'Run Scenario Analysis'}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader><CardTitle>Projected Impact</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Affected Parcels</span>
              <span className="font-medium">{results.affectedParcels.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Value Impact</span>
              <span className={`font-medium ${results.projectedImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {results.projectedImpact >= 0 ? '+' : ''}{results.projectedImpact.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-medium">{(results.confidenceLevel * 100).toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
