// TFT-108 — Model details component (compact)
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { ModelDetail } from '@/types/realEstate';

interface ModelDetailsComponentProps {
  model: ModelDetail | null;
  loading?: boolean;
}

export function ModelDetailsComponent({ model, loading }: ModelDetailsComponentProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Model Details</CardTitle></CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 rounded bg-primary/10" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!model) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Model Details</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a model to view details</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{model.name}</CardTitle>
          <Badge variant={model.status === 'active' ? 'success' : 'outline'}>
            {model.status}
          </Badge>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>R² = {model.rSquared.toFixed(4)}</span>
          <span>Adj R² = {model.adjustedRSquared.toFixed(4)}</span>
          <span>n = {model.sampleSize}</span>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variable</TableHead>
              <TableHead className="text-right">Coeff</TableHead>
              <TableHead className="text-right">t-Stat</TableHead>
              <TableHead className="text-right">p-Value</TableHead>
              <TableHead>Sig</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {model.coefficients.map((c) => (
              <TableRow key={c.variable}>
                <TableCell className="text-xs font-mono">{c.variable}</TableCell>
                <TableCell className="text-right text-xs">{c.coefficient.toFixed(4)}</TableCell>
                <TableCell className="text-right text-xs">{c.tStatistic.toFixed(3)}</TableCell>
                <TableCell className="text-right text-xs">{c.pValue.toFixed(4)}</TableCell>
                <TableCell>
                  {c.significant ? (
                    <Badge variant="success" className="text-[10px] px-1">Yes</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-1">No</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
