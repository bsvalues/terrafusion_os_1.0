import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ValuationResults {
  costApproach: number | null;
  incomeApproach: number | null;
  salesComparison: number | null;
  reconciledValue: number;
  confidenceScore: number;
  effectiveDate: string;
  reconciliationMethod: string;
}

interface ValuationResultsWidgetProps {
  results: ValuationResults | null;
  loading?: boolean;
  error?: string | null;
}

export function ValuationResultsWidget({ results, loading, error }: ValuationResultsWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading valuation results...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No valuation results available.
        </CardContent>
      </Card>
    );
  }

  const approaches = [
    { label: 'Cost Approach', value: results.costApproach },
    { label: 'Income Approach', value: results.incomeApproach },
    { label: 'Sales Comparison', value: results.salesComparison },
  ];

  const confidenceColor =
    results.confidenceScore >= 0.8 ? 'text-green-600' :
    results.confidenceScore >= 0.6 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Valuation Results</h2>
        <Badge variant="outline">BIV-093</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {approaches.map((a) => (
          <Card key={a.label}>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">{a.label}</div>
              <div className="text-xl font-bold">
                {a.value != null ? `$${a.value.toLocaleString()}` : 'N/A'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reconciled Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold">${results.reconciledValue.toLocaleString()}</div>
            <div className="text-right">
              <div className={`text-lg font-semibold ${confidenceColor}`}>
                {(results.confidenceScore * 100).toFixed(0)}% confidence
              </div>
              <div className="text-sm text-muted-foreground">{results.reconciliationMethod}</div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Effective date: {results.effectiveDate}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
