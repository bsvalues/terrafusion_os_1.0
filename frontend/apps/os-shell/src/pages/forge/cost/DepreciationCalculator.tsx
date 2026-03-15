import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DepreciationResult {
  physicalDepreciation: number;
  functionalObsolescence: number;
  externalObsolescence: number;
  totalDepreciation: number;
  depreciatedValue: number;
}

export function DepreciationCalculator() {
  const [age, setAge] = useState('');
  const [effectiveAge, setEffectiveAge] = useState('');
  const [condition, setCondition] = useState('average');
  const [quality, setQuality] = useState('average');
  const [replacementCost, setReplacementCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DepreciationResult | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/valuation/depreciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualAge: Number(age),
          effectiveAge: Number(effectiveAge),
          condition,
          quality,
          replacementCostNew: Number(replacementCost),
        }),
      });
      if (!res.ok) throw new Error('Depreciation calculation failed');
      const data: DepreciationResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Depreciation Calculator</h1>
          <p className="text-muted-foreground">
            Calculate depreciation using backend CostApproachService
          </p>
        </div>
        <Badge variant="outline">BIV-086</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Input Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="age">Actual Age (years)</Label>
              <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 25" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveAge">Effective Age (years)</Label>
              <Input id="effectiveAge" type="number" value={effectiveAge} onChange={(e) => setEffectiveAge(e.target.value)} placeholder="e.g. 20" />
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quality Grade</Label>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rcn">Replacement Cost New ($)</Label>
              <Input id="rcn" type="number" value={replacementCost} onChange={(e) => setReplacementCost(e.target.value)} placeholder="e.g. 350000" />
            </div>
            <Button onClick={handleCalculate} disabled={loading} className="w-full">
              {loading ? 'Calculating...' : 'Calculate Depreciation'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-destructive text-sm mb-4">{error}</div>
            )}
            {!result && !error && (
              <p className="text-muted-foreground">
                Enter parameters and click Calculate to see depreciation results.
              </p>
            )}
            {result && (
              <div className="space-y-3">
                <ResultRow label="Physical Depreciation" value={`${result.physicalDepreciation.toFixed(1)}%`} />
                <ResultRow label="Functional Obsolescence" value={`${result.functionalObsolescence.toFixed(1)}%`} />
                <ResultRow label="External Obsolescence" value={`${result.externalObsolescence.toFixed(1)}%`} />
                <div className="border-t pt-3">
                  <ResultRow label="Total Depreciation" value={`${result.totalDepreciation.toFixed(1)}%`} bold />
                  <ResultRow label="Depreciated Value" value={`$${result.depreciatedValue.toLocaleString()}`} bold />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResultRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? 'font-semibold' : 'text-muted-foreground'}>{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  );
}
