// TFT-104 — Income approach component
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { IncomeApproachData } from '@/types/realEstate';
import { getIncomeApproach } from '@/services/forge/propertyValuationClientService';

interface IncomeApproachComponentProps {
  parcelId: string;
}

export function IncomeApproachComponent({ parcelId }: IncomeApproachComponentProps) {
  const [data, setData] = useState<IncomeApproachData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getIncomeApproach(parcelId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [parcelId]);

  const fmt = (v: number) => `$${v.toLocaleString()}`;

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Income Approach</CardTitle>
      </CardHeader>
      <CardContent>
        {loading || !data ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <Row label="Gross Income" value={fmt(data.grossIncome)} />
            <Row label="Vacancy" value={`${(data.vacancyRate * 100).toFixed(1)}%`} />
            <Row label="EGI" value={fmt(data.effectiveGrossIncome)} />
            <Row label="Operating Expenses" value={fmt(data.operatingExpenses)} />
            <div className="border-t pt-2">
              <Row label="NOI" value={fmt(data.netOperatingIncome)} bold />
            </div>
            <div className="flex gap-2 pt-1">
              <Badge variant="outline">Cap Rate {(data.capRate * 100).toFixed(2)}%</Badge>
              <Badge variant="outline">GRM {data.grm.toFixed(2)}</Badge>
            </div>
            <div className="border-t pt-2">
              <Row label="Indicated Value" value={fmt(data.indicatedValue)} bold />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={`text-muted-foreground ${bold ? 'font-medium text-foreground' : ''}`}>
        {label}
      </span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  );
}
