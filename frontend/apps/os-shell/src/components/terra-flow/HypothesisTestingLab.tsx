/**
 * Hypothesis Testing Lab Component
 *
 * PhD-level statistical hypothesis testing interface with publication-ready output.
 * Connects to TerraFusion.QuantumAnalytics API (port 3005) for:
 * - t-test, ANOVA, Mann-Whitney, Kruskal-Wallis
 * - Effect sizes (Cohen's d, eta-squared)
 * - Confidence intervals
 * - LaTeX and APA formatted output
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Foundation
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, AlertCircle, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

interface HypothesisTestingLabProps {
  isConnected: boolean;
}

interface TestResult {
  testStatistic: number;
  pValue: number;
  degreesOfFreedom?: number;
  confidenceInterval?: number[];
  effectSize?: {
    type: string;
    value: number;
  };
  conclusion: string;
  latexOutput: string;
  apaOutput: string;
}

export function HypothesisTestingLab({ isConnected }: HypothesisTestingLabProps) {
  const [testType, setTestType] = useState<string>('t-test');
  const [group1Data, setGroup1Data] = useState<string>('23.1, 24.5, 22.8, 25.3, 23.9, 24.2, 23.7');
  const [group2Data, setGroup2Data] = useState<string>('27.2, 26.8, 28.1, 27.5, 26.9, 27.8, 27.3');
  const [alpha, setAlpha] = useState<number>(0.05);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    if (!isConnected) {
      toast.error('Backend not connected', {
        description: 'Please ensure QuantumAnalytics service is running on port 3005'
      });
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      // Parse data
      const group1 = group1Data.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
      const group2 = group2Data.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

      if (group1.length === 0) {
        throw new Error('Group 1 data is empty or invalid');
      }

      if (testType !== 'anova' && group2.length === 0) {
        throw new Error('Group 2 data is empty or invalid');
      }

      // Build request
      const request = {
        testType,
        dataset: {
          group1,
          group2: testType === 'anova' ? undefined : group2
        },
        hypothesis: {
          null: 'The means are equal',
          alternative: 'two-sided'
        },
        alpha
      };

      // Call API
      const response = await fetch('http://localhost:3005/api/v2/analytics/hypothesis-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In production, add JWT token here
          // 'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);

      toast.success('Test completed successfully', {
        description: `p-value: ${data.pValue.toFixed(6)}`
      });
    } catch (err: any) {
      console.error('Error running test:', err);
      setError(err.message);
      toast.error('Test failed', {
        description: err.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Test Configuration */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
          <CardDescription>
            Configure your statistical hypothesis test with publication-ready output
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Type Selection */}
          <div className="space-y-2">
            <Label>Test Type</Label>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger className="bg-slate-800 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="t-test">Independent Samples t-test</SelectItem>
                <SelectItem value="anova">One-Way ANOVA</SelectItem>
                <SelectItem value="mann-whitney">Mann-Whitney U Test (non-parametric)</SelectItem>
                <SelectItem value="kruskal-wallis">Kruskal-Wallis H Test (non-parametric)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Group 1 Data */}
          <div className="space-y-2">
            <Label>Group 1 Data (comma-separated)</Label>
            <Textarea
              value={group1Data}
              onChange={(e) => setGroup1Data(e.target.value)}
              placeholder="e.g., 23.1, 24.5, 22.8, 25.3"
              className="bg-slate-800 border-slate-600 font-mono text-sm"
              rows={3}
            />
          </div>

          {/* Group 2 Data */}
          <div className="space-y-2">
            <Label>Group 2 Data (comma-separated)</Label>
            <Textarea
              value={group2Data}
              onChange={(e) => setGroup2Data(e.target.value)}
              placeholder="e.g., 27.2, 26.8, 28.1, 27.5"
              className="bg-slate-800 border-slate-600 font-mono text-sm"
              rows={3}
            />
          </div>

          {/* Significance Level */}
          <div className="space-y-2">
            <Label>Significance Level (α)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                step={0.01}
                min={0.001}
                max={0.1}
                className="bg-slate-800 border-slate-600"
              />
              <span className="text-sm text-slate-400 flex items-center">
                Typical: 0.05 for 95% confidence
              </span>
            </div>
          </div>

          {/* Run Test Button */}
          <Button
            onClick={runTest}
            disabled={isRunning || !isConnected}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Analysis...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Run Hypothesis Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {result && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Test Statistic</div>
                <div className="text-2xl font-bold text-cyan-400">
                  {result.testStatistic.toFixed(4)}
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">P-Value</div>
                <div className={`text-2xl font-bold ${result.pValue < alpha ? 'text-green-400' : 'text-yellow-400'}`}>
                  {result.pValue.toFixed(6)}
                </div>
                {result.pValue < alpha && (
                  <Badge className="mt-2 bg-green-600">Significant at α = {alpha}</Badge>
                )}
              </div>

              {result.degreesOfFreedom !== undefined && (
                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="text-sm text-slate-400 mb-1">Degrees of Freedom</div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {result.degreesOfFreedom}
                  </div>
                </div>
              )}

              {result.effectSize && (
                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="text-sm text-slate-400 mb-1">Effect Size ({result.effectSize.type})</div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {result.effectSize.value.toFixed(4)}
                  </div>
                </div>
              )}
            </div>

            {/* Confidence Interval */}
            {result.confidenceInterval && (
              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="text-sm text-slate-400 mb-2">95% Confidence Interval</div>
                <div className="text-lg font-mono text-cyan-400">
                  [{result.confidenceInterval[0].toFixed(4)}, {result.confidenceInterval[1].toFixed(4)}]
                </div>
              </div>
            )}

            {/* Conclusion */}
            <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
              <div className="text-sm font-semibold text-blue-400 mb-2">Conclusion</div>
              <p className="text-sm text-slate-300">{result.conclusion}</p>
            </div>

            {/* Publication-Ready Output */}
            <Tabs defaultValue="apa" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="apa">APA Format</TabsTrigger>
                <TabsTrigger value="latex">LaTeX Format</TabsTrigger>
              </TabsList>

              <TabsContent value="apa" className="mt-4">
                <div className="p-4 bg-slate-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">APA 7th Edition</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.apaOutput, 'APA format')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-3 bg-slate-900 rounded border border-slate-700">
                    <p className="text-sm text-slate-300 leading-relaxed font-serif">
                      {result.apaOutput}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="latex" className="mt-4">
                <div className="p-4 bg-slate-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">LaTeX Code</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.latexOutput, 'LaTeX code')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-3 bg-slate-900 rounded border border-slate-700 overflow-x-auto">
                    <pre className="text-sm text-cyan-400 font-mono whitespace-pre">
                      {result.latexOutput}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Export Options */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const json = JSON.stringify(result, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `hypothesis-test-${Date.now()}.json`;
                  a.click();
                  toast.success('Results exported to JSON');
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const csv = `Test Statistic,${result.testStatistic}\nP-Value,${result.pValue}\nDegrees of Freedom,${result.degreesOfFreedom || 'N/A'}\n`;
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `hypothesis-test-${Date.now()}.csv`;
                  a.click();
                  toast.success('Results exported to CSV');
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <Alert className="bg-blue-900/20 border-blue-800">
        <AlertTitle className="text-blue-400">PhD-Level Statistical Rigor</AlertTitle>
        <AlertDescription className="text-slate-300">
          All tests use industry-standard statistical methods with proper assumptions checking.
          Output is formatted for direct inclusion in academic publications (APA, LaTeX).
          Effect sizes and confidence intervals are automatically computed.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default HypothesisTestingLab;
