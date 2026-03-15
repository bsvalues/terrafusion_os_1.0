// TFT-105 — Sales comparison grid component
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { SalesComp } from '@/types/realEstate';
import { getSalesComps } from '@/services/forge/propertyComparisonClientService';

interface SalesCompGridComponentProps {
  parcelId: string;
  limit?: number;
  onCompSelect?: (comp: SalesComp) => void;
}

export function SalesCompGridComponent({
  parcelId,
  limit = 10,
  onCompSelect,
}: SalesCompGridComponentProps) {
  const [comps, setComps] = useState<SalesComp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getSalesComps(parcelId, { limit })
      .then(setComps)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [parcelId, limit]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Sales Comparables</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Sale Date</TableHead>
                <TableHead className="text-right">Sale Price</TableHead>
                <TableHead className="text-right">Adjusted</TableHead>
                <TableHead className="text-right">Sq Ft</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comps.map((comp) => (
                <TableRow
                  key={comp.compId}
                  className={onCompSelect ? 'cursor-pointer' : ''}
                  onClick={() => onCompSelect?.(comp)}
                >
                  <TableCell className="text-xs">{comp.address}</TableCell>
                  <TableCell className="text-xs">{comp.saleDate}</TableCell>
                  <TableCell className="text-right text-xs">
                    ${comp.salePrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    ${comp.adjustedPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {comp.squareFeet.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={comp.similarityScore >= 0.8 ? 'success' : comp.similarityScore >= 0.6 ? 'warning' : 'outline'}
                    >
                      {(comp.similarityScore * 100).toFixed(0)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {comps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No comparables found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
