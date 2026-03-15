// TFT-134 — Neighborhood comparison wizard
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { NeighborhoodMetrics } from '@/types/realEstate';
import {
  getNeighborhoods,
  compareNeighborhoods,
} from '@/services/forge/neighborhoodClientService';

type Step = 'select' | 'compare' | 'report';

export function NeighborhoodComparisonWizard() {
  const [step, setStep] = useState<Step>('select');
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodMetrics[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [compared, setCompared] = useState<NeighborhoodMetrics[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getNeighborhoods().then(setNeighborhoods).catch(() => {});
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCompare = async () => {
    setLoading(true);
    try {
      const results = await compareNeighborhoods(selected);
      setCompared(results);
      setStep('compare');
    } catch {
      // stay on select step
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Neighborhood Comparison</CardTitle>
        <div className="flex gap-2 mt-2">
          {(['select', 'compare', 'report'] as Step[]).map((s, i) => (
            <Badge key={s} variant={step === s ? 'default' : 'outline'}>
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {step === 'select' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Select neighborhoods to compare ({selected.length} selected)
            </p>
            <ul className="max-h-64 overflow-auto space-y-1">
              {neighborhoods.map((n) => (
                <li
                  key={n.neighborhoodId}
                  className={`cursor-pointer rounded p-2 text-sm hover:bg-muted/50 ${
                    selected.includes(n.neighborhoodId) ? 'bg-muted' : ''
                  }`}
                  onClick={() => toggleSelect(n.neighborhoodId)}
                >
                  {n.name}
                </li>
              ))}
            </ul>
            <button
              onClick={handleCompare}
              disabled={selected.length < 2 || loading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Comparing...' : 'Compare Selected'}
            </button>
          </div>
        )}

        {step === 'compare' && (
          <div className="space-y-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  {compared.map((n) => (
                    <TableHead key={n.neighborhoodId} className="text-center">{n.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <MetricRow label="Median Value" values={compared.map((n) => `$${n.medianValue.toLocaleString()}`)} />
                <MetricRow label="Sales Volume" values={compared.map((n) => String(n.salesVolume))} />
                <MetricRow label="Price Change" values={compared.map((n) => `${n.priceChangePercent.toFixed(1)}%`)} />
                <MetricRow label="COD" values={compared.map((n) => n.cod.toFixed(1))} />
                <MetricRow label="Total Parcels" values={compared.map((n) => n.totalParcels.toLocaleString())} />
              </TableBody>
            </Table>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('select')}
                className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
              >
                Back
              </button>
              <button
                onClick={() => setStep('report')}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Generate Report
              </button>
            </div>
          </div>
        )}

        {step === 'report' && (
          <div className="space-y-3">
            <p className="text-sm">
              Comparison report for {compared.length} neighborhoods generated.
            </p>
            <div className="rounded-md border p-4 text-sm space-y-2">
              {compared.map((n) => (
                <div key={n.neighborhoodId}>
                  <span className="font-medium">{n.name}</span>: Median $
                  {n.medianValue.toLocaleString()}, {n.salesVolume} sales,{' '}
                  {n.priceChangePercent >= 0 ? '+' : ''}{n.priceChangePercent.toFixed(1)}% change
                </div>
              ))}
            </div>
            <button
              onClick={() => { setStep('select'); setSelected([]); setCompared([]); }}
              className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
            >
              Start Over
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, values }: { label: string; values: string[] }) {
  return (
    <TableRow>
      <TableCell className="text-xs font-medium">{label}</TableCell>
      {values.map((v, i) => (
        <TableCell key={i} className="text-center text-xs">{v}</TableCell>
      ))}
    </TableRow>
  );
}
