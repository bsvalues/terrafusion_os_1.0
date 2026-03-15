import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ValuationSummary {
  currentValue: number;
  priorValue: number;
  effectiveDate: string;
}

interface ValuationWidgetProps {
  valuation: ValuationSummary | null;
  loading?: boolean;
  error?: string | null;
}

export function ValuationWidget({ valuation, loading, error }: ValuationWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          Loading valuation...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-4 text-center text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (!valuation) return null;

  const change = valuation.priorValue > 0
    ? ((valuation.currentValue - valuation.priorValue) / valuation.priorValue) * 100
    : 0;
  const changePositive = change >= 0;

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">Current Value</span>
          <Badge variant="outline" className="text-xs">BIV-105</Badge>
        </div>
        <div className="text-2xl font-bold">${valuation.currentValue.toLocaleString()}</div>
        <div className="flex items-center justify-between mt-2 text-sm">
          <span className="text-muted-foreground">
            Prior: ${valuation.priorValue.toLocaleString()}
          </span>
          <span className={changePositive ? 'text-green-600' : 'text-red-600'}>
            {changePositive ? '+' : ''}{change.toFixed(1)}%
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          As of {valuation.effectiveDate}
        </div>
      </CardContent>
    </Card>
  );
}
