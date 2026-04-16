import { useState } from 'react';
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
import { apiFetch } from '@/lib/apiBase';

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
  const [functionalObsolescence, setFunctionalObsolescence] = useState('');
  const [externalObsolescence, setExternalObsolescence] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DepreciationResult | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    const ctrl = new AbortController();
    try {
      const params = new URLSearchParams({
        actualAge: age,
        effectiveAge: effectiveAge,
        condition,
        quality,
        rcn: replacementCost,
      });
      if (functionalObsolescence) params.set('functionalObsolescence', functionalObsolescence);
      if (externalObsolescence)   params.set('externalObsolescence', externalObsolescence);

      const data = await apiFetch<DepreciationResult>(
        `/costforge/depreciation/calculate?${params.toString()}`,
        { signal: ctrl.signal }
      );
      setResult(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Depreciation Lab</h1>
          <p className="text-muted-foreground">
            Physical · Functional · External — IAAO cost approach depreciation
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
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 25"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveAge">Effective Age (years)</Label>
              <Input
                id="effectiveAge"
                type="number"
                value={effectiveAge}
                onChange={(e) => setEffectiveAge(e.target.value)}
                placeholder="e.g. 20"
              />
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
              <Input
                id="rcn"
                type="number"
                value={replacementCost}
                onChange={(e) => setReplacementCost(e.target.value)}
                placeholder="e.g. 350000"
              />
            </div>

            {/* Obsolescence inputs — optional */}
            <div className="space-y-2">
              <Label htmlFor="funcObs">
                Functional Obsolescence ($){' '}
                <span style={{ fontSize: '0.7rem', color: 'var(--cf-muted)' }}>optional</span>
              </Label>
              <Input
                id="funcObs"
                type="number"
                value={functionalObsolescence}
                onChange={(e) => setFunctionalObsolescence(e.target.value)}
                placeholder="Cost-to-cure or capitalized rent loss"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extObs">
                External Obsolescence ($){' '}
                <span style={{ fontSize: '0.7rem', color: 'var(--cf-muted)' }}>optional</span>
              </Label>
              <Input
                id="extObs"
                type="number"
                value={externalObsolescence}
                onChange={(e) => setExternalObsolescence(e.target.value)}
                placeholder="From paired sales or rent loss capitalization"
              />
            </div>

            <Button
              onClick={() => void handleCalculate()}
              disabled={loading || !age || !effectiveAge || !replacementCost}
              className="w-full"
            >
              {loading ? 'Calculating…' : 'Calculate Depreciation'}
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
                <ResultRow
                  label="Physical Depreciation"
                  value={`${result.physicalDepreciation.toFixed(1)}%`}
                />
                <ResultRow
                  label="Functional Obsolescence"
                  value={`${result.functionalObsolescence.toFixed(1)}%`}
                />
                <ResultRow
                  label="External Obsolescence"
                  value={`${result.externalObsolescence.toFixed(1)}%`}
                />
                <div className="border-t pt-3">
                  <ResultRow
                    label="Total Depreciation"
                    value={`${result.totalDepreciation.toFixed(1)}%`}
                    bold
                  />
                  <ResultRow
                    label="Depreciated Value"
                    value={`$${result.depreciatedValue.toLocaleString()}`}
                    bold
                  />
                </div>

                {/* Depreciation waterfall bar */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cf-muted)', marginBottom: 4 }}>
                    Depreciation waterfall
                  </div>
                  <div className="cf-deprec-bar">
                    <div
                      className="cf-deprec-bar__physical"
                      title={`Physical: ${result.physicalDepreciation.toFixed(1)}%`}
                      style={{ width: `${Math.min(result.physicalDepreciation, 100)}%` }}
                    />
                    <div
                      className="cf-deprec-bar__functional"
                      title={`Functional: ${result.functionalObsolescence.toFixed(1)}%`}
                      style={{ width: `${Math.min(result.functionalObsolescence, 100)}%` }}
                    />
                    <div
                      className="cf-deprec-bar__external"
                      title={`External: ${result.externalObsolescence.toFixed(1)}%`}
                      style={{ width: `${Math.min(result.externalObsolescence, 100)}%` }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      fontSize: '0.75rem',
                      color: 'var(--cf-muted)',
                      marginTop: 4,
                    }}
                  >
                    <span style={{ color: 'var(--cf-warn)' }}>■ Physical</span>
                    <span style={{ color: 'var(--cf-accent)' }}>■ Functional</span>
                    <span style={{ color: 'var(--cf-danger)' }}>■ External</span>
                  </div>
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
