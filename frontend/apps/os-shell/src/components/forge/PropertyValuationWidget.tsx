// TFT-129 — Compact valuation widget
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PropertyValuation } from '@/types/realEstate';
import { getPropertyValuation } from '@/services/forge/propertyValuationClientService';

interface PropertyValuationWidgetProps {
  parcelId: string;
  previousValue?: number;
}

export function PropertyValuationWidget({ parcelId, previousValue }: PropertyValuationWidgetProps) {
  const [valuation, setValuation] = useState<PropertyValuation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPropertyValuation(parcelId)
      .then(setValuation)
      .catch(() => setValuation(null))
      .finally(() => setLoading(false));
  }, [parcelId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between p-3">
          <div className="animate-pulse h-5 w-24 rounded bg-primary/10" />
          <div className="animate-pulse h-5 w-16 rounded bg-primary/10" />
        </CardContent>
      </Card>
    );
  }

  if (!valuation) {
    return (
      <Card>
        <CardContent className="p-3">
          <span className="text-sm text-muted-foreground">No valuation</span>
        </CardContent>
      </Card>
    );
  }

  const change = previousValue
    ? ((valuation.reconciledValue - previousValue) / previousValue) * 100
    : null;

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">
            ${valuation.reconciledValue.toLocaleString()}
          </span>
          {change !== null && (
            <span className={`text-xs font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          )}
        </div>
        <Badge
          variant={valuation.confidence >= 0.85 ? 'success' : valuation.confidence >= 0.7 ? 'warning' : 'error'}
        >
          {(valuation.confidence * 100).toFixed(0)}%
        </Badge>
      </CardContent>
    </Card>
  );
}
