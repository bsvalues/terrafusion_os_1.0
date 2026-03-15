// TFT-106 — Ratio study panel
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RatioStudyResult } from '@/types/realEstate';

interface RatioStudyPanelProps {
  data: RatioStudyResult | null;
  loading?: boolean;
}

const IAAO_RANGES = {
  cod: { label: 'COD', min: 5, max: 20, unit: '' },
  prd: { label: 'PRD', min: 0.98, max: 1.03, unit: '' },
  prb: { label: 'PRB', min: -0.05, max: 0.05, unit: '' },
};

function getVariant(value: number, min: number, max: number) {
  if (value >= min && value <= max) return 'success' as const;
  const margin = (max - min) * 0.2;
  if (value >= min - margin && value <= max + margin) return 'warning' as const;
  return 'error' as const;
}

export function RatioStudyPanel({ data, loading }: RatioStudyPanelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Ratio Study</CardTitle></CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded bg-primary/10" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Ratio Study</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No ratio study data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Ratio Study</CardTitle>
        <p className="text-xs text-muted-foreground">
          Period: {data.period} | Sample: {data.sampleSize.toLocaleString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {(Object.entries(IAAO_RANGES) as [keyof typeof IAAO_RANGES, typeof IAAO_RANGES['cod']][]).map(
          ([key, range]) => {
            const value = data[key];
            const variant = getVariant(value, range.min, range.max);
            return (
              <div key={key} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{range.label}</p>
                  <p className="text-xs text-muted-foreground">
                    IAAO: {range.min} - {range.max}
                  </p>
                </div>
                <Badge variant={variant} className="text-base px-3 py-1">
                  {value.toFixed(key === 'cod' ? 1 : 3)}
                </Badge>
              </div>
            );
          }
        )}
        <div className="flex justify-between text-sm border-t pt-2">
          <span className="text-muted-foreground">Median Ratio</span>
          <span className="font-medium">{data.medianRatio.toFixed(4)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Mean Ratio</span>
          <span className="font-medium">{data.meanRatio.toFixed(4)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
