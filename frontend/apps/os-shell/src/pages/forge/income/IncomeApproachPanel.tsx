import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface IncomeResult {
  indicatedValue: number;
  capRate: number;
  noi: number;
  effectiveGrossIncome: number;
}

interface GrmResult {
  indicatedValue: number;
  grm: number;
  monthlyRent: number;
}

export function IncomeApproachPanel() {
  const [method, setMethod] = useState<'direct-cap' | 'grm'>('direct-cap');

  // Direct capitalization inputs
  const [grossIncome, setGrossIncome] = useState('');
  const [vacancy, setVacancy] = useState('5');
  const [expenses, setExpenses] = useState('');
  const [capRate, setCapRate] = useState('');

  // GRM inputs
  const [monthlyRent, setMonthlyRent] = useState('');
  const [grm, setGrm] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incomeResult, setIncomeResult] = useState<IncomeResult | null>(null);
  const [grmResult, setGrmResult] = useState<GrmResult | null>(null);

  const handleDirectCap = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/valuation/income/direct-capitalization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grossIncome: Number(grossIncome),
          vacancyRate: Number(vacancy) / 100,
          operatingExpenses: Number(expenses),
          capRate: Number(capRate) / 100,
        }),
      });
      if (!res.ok) throw new Error('Income valuation failed');
      setIncomeResult(await res.json());
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
      const res = await fetch('/api/valuation/income/grm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyRent: Number(monthlyRent),
          grossRentMultiplier: Number(grm),
        }),
      });
      if (!res.ok) throw new Error('GRM calculation failed');
      setGrmResult(await res.json());
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
                  <Label>Operating Expenses ($)</Label>
                  <Input type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)} placeholder="45000" />
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
                {!incomeResult && !error && (
                  <p className="text-muted-foreground">Enter income data to see the indicated value.</p>
                )}
                {incomeResult && (
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">NOI</span><span>${incomeResult.noi.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Cap Rate</span><span>{(incomeResult.capRate * 100).toFixed(2)}%</span></div>
                    <div className="border-t pt-3 flex justify-between font-semibold">
                      <span>Indicated Value</span><span>${incomeResult.indicatedValue.toLocaleString()}</span>
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
                <div className="space-y-2">
                  <Label>Gross Rent Multiplier</Label>
                  <Input type="number" value={grm} onChange={(e) => setGrm(e.target.value)} placeholder="120" />
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
                {!grmResult && !error && (
                  <p className="text-muted-foreground">Enter rent and GRM to see the indicated value.</p>
                )}
                {grmResult && (
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">Monthly Rent</span><span>${grmResult.monthlyRent.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">GRM</span><span>{grmResult.grm.toFixed(1)}</span></div>
                    <div className="border-t pt-3 flex justify-between font-semibold">
                      <span>Indicated Value</span><span>${grmResult.indicatedValue.toLocaleString()}</span>
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
