// TFT-109 — Models list component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { ModelSummary } from '@/types/realEstate';

interface ModelsListComponentProps {
  models: ModelSummary[];
  selectedModelId?: string;
  onSelect?: (model: ModelSummary) => void;
  loading?: boolean;
}

export function ModelsListComponent({
  models,
  selectedModelId,
  onSelect,
  loading,
}: ModelsListComponentProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Valuation Models</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-primary/10" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">R²</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow
                  key={model.modelId}
                  className={`cursor-pointer ${selectedModelId === model.modelId ? 'bg-muted' : ''}`}
                  onClick={() => onSelect?.(model)}
                >
                  <TableCell className="text-sm font-medium">{model.name}</TableCell>
                  <TableCell className="text-xs">{model.propertyType}</TableCell>
                  <TableCell className="text-right text-xs">
                    {model.rSquared.toFixed(4)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={model.status === 'active' ? 'success' : model.status === 'training' ? 'warning' : 'outline'}
                    >
                      {model.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {models.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No models available
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
