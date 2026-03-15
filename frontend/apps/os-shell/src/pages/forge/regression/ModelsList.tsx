import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RegressionModelSummary {
  id: string;
  name: string;
  type: string;
  rSquared: number;
  sampleSize: number;
  status: 'active' | 'draft' | 'archived';
  lastUpdated: string;
}

interface ModelsListProps {
  onSelectModel?: (modelId: string) => void;
}

export function ModelsList({ onSelectModel }: ModelsListProps) {
  const [models, setModels] = useState<RegressionModelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/regression/models');
        if (!res.ok) throw new Error('Failed to fetch models');
        setModels(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  const statusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default' as const;
      case 'draft': return 'secondary' as const;
      case 'archived': return 'outline' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Regression Models</h1>
          <p className="text-muted-foreground">All available regression models</p>
        </div>
        <Badge variant="outline">BIV-092</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading && <div className="p-8 text-center text-muted-foreground">Loading models...</div>}
          {error && <div className="p-8 text-center text-destructive">{error}</div>}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">R-Squared</TableHead>
                  <TableHead className="text-right">Sample Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow
                    key={model.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectModel?.(model.id)}
                  >
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell>{model.type}</TableCell>
                    <TableCell className="text-right">{model.rSquared.toFixed(4)}</TableCell>
                    <TableCell className="text-right">{model.sampleSize.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(model.status)}>{model.status}</Badge>
                    </TableCell>
                    <TableCell>{model.lastUpdated}</TableCell>
                  </TableRow>
                ))}
                {models.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No regression models found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
