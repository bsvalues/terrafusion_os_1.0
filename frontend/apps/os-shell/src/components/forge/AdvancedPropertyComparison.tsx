// TFT-131 — Advanced property comparison
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { compareProperties } from '@/services/forge/propertyComparisonClientService';

interface AdvancedPropertyComparisonProps {
  parcelIds: string[];
}

export function AdvancedPropertyComparison({ parcelIds }: AdvancedPropertyComparisonProps) {
  const [data, setData] = useState<Record<string, Record<string, string | number>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (parcelIds.length < 2) return;
    setLoading(true);
    compareProperties(parcelIds)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [parcelIds]);

  if (parcelIds.length < 2) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Property Comparison</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select at least 2 properties to compare</p>
        </CardContent>
      </Card>
    );
  }

  const attributes = data ? Object.keys(Object.values(data)[0] ?? {}) : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Property Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : data ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attribute</TableHead>
                {parcelIds.map((id) => (
                  <TableHead key={id} className="text-center">{id}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributes.map((attr) => (
                <TableRow key={attr}>
                  <TableCell className="text-xs font-medium">{attr}</TableCell>
                  {parcelIds.map((id) => (
                    <TableCell key={id} className="text-center text-xs">
                      {data[id]?.[attr] ?? '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </CardContent>
    </Card>
  );
}
