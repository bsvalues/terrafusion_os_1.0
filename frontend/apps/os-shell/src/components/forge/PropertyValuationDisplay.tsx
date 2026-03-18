// TFT-110 — Property valuation display
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PropertyValuation } from '@/types/realEstate';

interface PropertyValuationDisplayProps {
  valuation: PropertyValuation | null;
  loading?: boolean;
}

function confidenceVariant(confidence: number) {
  if (confidence >= 0.85) return 'success' as const;
  if (confidence >= 0.7) return 'warning' as const;
  return 'error' as const;
}

export function PropertyValuationDisplay({ valuation, loading }: PropertyValuationDisplayProps) {
  const fmt = (v: number) => `$${v.toLocaleString()}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Property Valuation</CardTitle>
          {valuation && (
            <Badge variant={confidenceVariant(valuation.confidence)}>
              {(valuation.confidence * 100).toFixed(0)}% confidence
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-primary/10" />
            ))}
          </div>
        ) : !valuation ? (
          <p className="text-sm text-muted-foreground">No valuation data available</p>
        ) : (
          <div className="space-y-3">
            <ApproachRow label="Cost Approach" value={fmt(valuation.costValue)} weight={valuation.approachWeights.cost} />
            <ApproachRow label="Sales Comparison" value={fmt(valuation.salesValue)} weight={valuation.approachWeights.sales} />
            <ApproachRow label="Income Approach" value={fmt(valuation.incomeValue)} weight={valuation.approachWeights.income} />
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Reconciled Value</span>
                <span className="text-xl font-bold">{fmt(valuation.reconciledValue)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                As of {valuation.valuationDate}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ApproachRow({ label, value, weight }: { label: string; value: string; weight: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">Weight: {(weight * 100).toFixed(0)}%</p>
      </div>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
