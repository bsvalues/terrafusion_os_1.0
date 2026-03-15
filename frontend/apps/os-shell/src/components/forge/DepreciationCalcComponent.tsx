// TFT-103 — Depreciation calculator component
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { DepreciationInput, DepreciationResult } from '@/types/realEstate';
import { calculateDepreciation } from '@/services/forge/propertyValuationClientService';

export function DepreciationCalcComponent() {
  const [input, setInput] = useState<DepreciationInput>({
    age: 0,
    effectiveAge: 0,
    condition: 'average',
    qualityClass: 'C',
    totalLife: 50,
  });
  const [result, setResult] = useState<DepreciationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await calculateDepreciation(input);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof DepreciationInput, value: string | number) => {
    setInput((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Depreciation Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Age"
            type="number"
            value={input.age}
            onChange={(e) => updateField('age', Number(e.target.value))}
          />
          <Input
            label="Effective Age"
            type="number"
            value={input.effectiveAge}
            onChange={(e) => updateField('effectiveAge', Number(e.target.value))}
          />
          <Input
            label="Condition"
            value={input.condition}
            onChange={(e) => updateField('condition', e.target.value)}
          />
          <Input
            label="Quality Class"
            value={input.qualityClass}
            onChange={(e) => updateField('qualityClass', e.target.value)}
          />
          <Input
            label="Total Life"
            type="number"
            value={input.totalLife}
            onChange={(e) => updateField('totalLife', Number(e.target.value))}
          />
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {loading && <Skeleton className="h-24 w-full" />}

        {result && !loading && (
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Physical</span>
              <Badge variant="outline">{(result.physicalDepreciation * 100).toFixed(1)}%</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Functional</span>
              <Badge variant="outline">{(result.functionalObsolescence * 100).toFixed(1)}%</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">External</span>
              <Badge variant="outline">{(result.externalObsolescence * 100).toFixed(1)}%</Badge>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium">Total Depreciation</span>
              <Badge>{(result.totalDepreciation * 100).toFixed(1)}%</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
