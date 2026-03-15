import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TaxBreakdown {
  district: string;
  rate: number;
  estimatedTax: number;
}

interface TaxCalcResult {
  assessedValue: number;
  totalEstimatedTax: number;
  breakdown: TaxBreakdown[];
}

export function TaxCalculatorWidget() {
  const [assessedValue, setAssessedValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TaxCalcResult | null>(null);

  const handleCalculate = async () => {
    if (!assessedValue) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessedValue: Number(assessedValue) }),
      });
      if (!res.ok) throw new Error('Tax calculation failed');
      setResult(await res.json());
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
          <h1 className="text-2xl font-bold">Tax Calculator</h1>
          <p className="text-muted-foreground">Estimate property tax by levy district</p>
        </div>
        <Badge variant="outline">BIV-113</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Input</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assessed">Assessed Value ($)</Label>
            <Input
              id="assessed"
              type="number"
              value={assessedValue}
              onChange={(e) => setAssessedValue(e.target.value)}
              placeholder="e.g. 350000"
            />
          </div>
          <Button onClick={handleCalculate} disabled={loading || !assessedValue}>
            {loading ? 'Calculating...' : 'Calculate Tax'}
          </Button>
          {error && <div className="text-destructive text-sm">{error}</div>}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Estimated Tax</CardTitle>
              <span className="text-2xl font-bold">${result.totalEstimatedTax.toLocaleString()}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>District</TableHead>
                  <TableHead className="text-right">Rate (/$1,000)</TableHead>
                  <TableHead className="text-right">Estimated Tax</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.breakdown.map((b, i) => (
                  <TableRow key={i}>
                    <TableCell>{b.district}</TableCell>
                    <TableCell className="text-right">${b.rate.toFixed(4)}</TableCell>
                    <TableCell className="text-right">${b.estimatedTax.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
