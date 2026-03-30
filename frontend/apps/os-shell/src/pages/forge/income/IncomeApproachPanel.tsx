import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { invokeTool } from '../../../api/pilotApi';

interface IncomeValuationResult {
  netOperatingIncome: number;
  capRate: number;
  valuation: number;
  grossIncomeMultiplier: number;
  riskClassification: string;
  source: string;
}

export function IncomeApproachPanel() {
  const [method, setMethod] = useState<'direct-cap' | 'grm'>('direct-cap');

  // Direct capitalization inputs
  const [grossIncome, setGrossIncome] = useState('');
  const [vacancy, setVacancy] = useState('5');
  const [capRate, setCapRate] = useState('');

  // GRM inputs
  const [monthlyRent, setMonthlyRent] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IncomeValuationResult | null>(null);

  const handleDirectCap = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await invokeTool({
        toolId: 'run_income_valuation',
        params: {
          county: 'benton',
          annualRentalIncome: Number(grossIncome),
          vacancyRate: Number(vacancy),
          capRate: Number(capRate),
        },
        parcelId: '',
      });
      if (response.success && response.result) {
        const parsed: IncomeValuationResult = typeof response.result.output === 'string'
          ? JSON.parse(response.result.output)
          : response.result.output;
        setResult(parsed);
      } else {
        throw new Error(response.error?.message ?? 'Income valuation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleGrm = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await invokeTool({
        toolId: 'run_income_valuation',
        params: {
          county: 'benton',
          annualRentalIncome: Number(monthlyRent) * 12,
        },
        parcelId: '',
      });
      if (response.success && response.result) {
        const parsed: IncomeValuationResult = typeof response.result.output === 'string'
          ? JSON.parse(response.result.output)
          : response.result.output;
        setResult(parsed);
      } else {
        throw new Error(response.error?.message ?? 'GRM calculation failed');
      }
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
          <h1 className="text-2xl font-bold">Income Approach</h1>
          <p className="text-muted-foreground">
            Direct capitalization and gross rent multiplier analysis
          </p>
        </div>
        <Badge variant="outline">BIV-087</Badge>
      </div>

      <Tabs value={method} onValueChange={(v) => setMethod(v as 'direct-cap' | 'grm')}>
        <TabsList>
          <TabsTrigger value="direct-cap">Direct Capitalization</TabsTrigger>
          <TabsTrigger value="grm">Gross Rent Multiplier</TabsTrigger>
        </TabsList>

        <TabsContent value="direct-cap">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Income Inputs</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Potential Gross Income ($)</Label>
                  <Input type="number" value={grossIncome} onChange={(e) => setGrossIncome(e.target.value)} placeholder="120000" />
                </div>
                <div className="space-y-2">
                  <Label>Vacancy Rate (%)</Label>
                  <Input type="number" value={vacancy} onChange={(e) => setVacancy(e.target.value)} placeholder="5" />
                </div>
                <div className="space-y-2">
                  <Label>Capitalization Rate (%)</Label>
                  <Input type="number" value={capRate} onChange={(e) => setCapRate(e.target.value)} placeholder="7.5" />
                </div>
                <Button onClick={handleDirectCap} disabled={loading} className="w-full">
                  {loading ? 'Calculating...' : 'Calculate Value'}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Direct Cap Result</CardTitle></CardHeader>
              <CardContent>
                {error && <div className="text-destructive text-sm mb-4">{error}</div>}
                {!result && !error && (
                  <p className="text-muted-foreground">Enter income data to see the indicated value.</p>
                )}
                {result && (
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">NOI</span><span>${result.netOperatingIncome.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Cap Rate</span><span>{result.capRate.toFixed(2)}%</span></div>
                    <div className="border-t pt-3 flex justify-between font-semibold">
                      <span>Indicated Value</span><span>${result.valuation.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="grm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>GRM Inputs</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Monthly Rent ($)</Label>
                  <Input type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} placeholder="2500" />
                </div>
                <Button onClick={handleGrm} disabled={loading} className="w-full">
                  {loading ? 'Calculating...' : 'Calculate Value'}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>GRM Result</CardTitle></CardHeader>
              <CardContent>
                {error && <div className="text-destructive text-sm mb-4">{error}</div>}
                {!result && !error && (
                  <p className="text-muted-foreground">Enter rent to see the indicated value.</p>
                )}
                {result && (
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">GIM</span><span>{result.grossIncomeMultiplier.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Risk</span><span>{result.riskClassification}</span></div>
                    <div className="border-t pt-3 flex justify-between font-semibold">
                      <span>Indicated Value</span><span>${result.valuation.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
