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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';

interface Coefficient {
  variable: string;
  estimate: number;
  stdError: number;
  tStat: number;
  pValue: number;
}

interface RegressionModel {
  id: string;
  name: string;
  type: string;
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  sampleSize: number;
  coefficients: Coefficient[];
  residuals: Array<{ predicted: number; residual: number }>;
}

interface ModelDetailsProps {
  modelId: string;
}

export function ModelDetails({ modelId }: ModelDetailsProps) {
  const [model, setModel] = useState<RegressionModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModel = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/regression/models/${modelId}`);
        if (!res.ok) throw new Error('Failed to fetch model details');
        setModel(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    if (modelId) fetchModel();
  }, [modelId]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading model details...</div>;
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>;
  if (!model) return null;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{model.name}</h1>
          <p className="text-muted-foreground">{model.type} regression model</p>
        </div>
        <Badge variant="outline">BIV-091</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="R-Squared" value={model.rSquared.toFixed(4)} />
        <StatCard label="Adjusted R-Squared" value={model.adjustedRSquared.toFixed(4)} />
        <StatCard label="F-Statistic" value={model.fStatistic.toFixed(2)} />
        <StatCard label="Sample Size" value={model.sampleSize.toLocaleString()} />
      </div>

      <Card>
        <CardHeader><CardTitle>Coefficients</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variable</TableHead>
                <TableHead className="text-right">Estimate</TableHead>
                <TableHead className="text-right">Std Error</TableHead>
                <TableHead className="text-right">t-Stat</TableHead>
                <TableHead className="text-right">p-Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {model.coefficients.map((c) => (
                <TableRow key={c.variable}>
                  <TableCell className="font-medium">{c.variable}</TableCell>
                  <TableCell className="text-right">{c.estimate.toFixed(4)}</TableCell>
                  <TableCell className="text-right">{c.stdError.toFixed(4)}</TableCell>
                  <TableCell className="text-right">{c.tStat.toFixed(3)}</TableCell>
                  <TableCell className="text-right">
                    <span className={c.pValue < 0.05 ? 'text-green-600 font-semibold' : ''}>
                      {c.pValue.toFixed(4)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Residuals Plot</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="predicted" name="Predicted" type="number" />
              <YAxis dataKey="residual" name="Residual" type="number" />
              <Tooltip />
              <Scatter data={model.residuals} fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
