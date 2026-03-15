/**
 * BatchCostApplyPanel (TFR-102) — Batch cost schedule application.
 * Select properties by filter, apply cost schedule update in batch.
 * Progress tracking. Backend does the work.
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface BatchJob {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalParcels: number;
  processedParcels: number;
  startedAt?: string;
  completedAt?: string;
  errorCount: number;
}

export function BatchCostApplyPanel() {
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [costScheduleId, setCostScheduleId] = useState('');
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [job, setJob] = useState<BatchJob | null>(null);
  const [loading, setLoading] = useState(false);

  const previewMatch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (neighborhoodFilter) params.set('neighborhood', neighborhoodFilter);
      if (propertyType) params.set('propertyType', propertyType);
      const res = await fetch(`/api/forge/cost/batch/preview?${params}`);
      if (!res.ok) throw new Error('Preview failed');
      const data = await res.json();
      setMatchCount(data.matchCount);
    } catch {
      setMatchCount(null);
    } finally {
      setLoading(false);
    }
  };

  const startBatch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/forge/cost/batch/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ neighborhoodFilter, propertyType, costScheduleId }),
      });
      if (!res.ok) throw new Error('Batch start failed');
      setJob(await res.json());
    } catch {
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  const progress = job ? (job.processedParcels / job.totalParcels) * 100 : 0;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Batch Cost Apply</h1>
        <Badge variant="outline">Cost Schedule Batch</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Filter Properties</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Neighborhood</label>
              <Input value={neighborhoodFilter} onChange={e => setNeighborhoodFilter(e.target.value)} placeholder="e.g., N01" />
            </div>
            <div>
              <label className="text-sm font-medium">Property Type</label>
              <Input value={propertyType} onChange={e => setPropertyType(e.target.value)} placeholder="e.g., SFR" />
            </div>
            <div>
              <label className="text-sm font-medium">Cost Schedule</label>
              <Input value={costScheduleId} onChange={e => setCostScheduleId(e.target.value)} placeholder="Schedule ID" />
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={previewMatch} disabled={loading}>
              Preview Match
            </Button>
            {matchCount !== null && (
              <span className="text-sm self-center">{matchCount.toLocaleString()} parcels matched</span>
            )}
          </div>
          <Button onClick={startBatch} disabled={loading || !costScheduleId} className="w-full">
            {loading ? 'Processing...' : 'Apply Cost Schedule'}
          </Button>
        </CardContent>
      </Card>

      {job && (
        <Card>
          <CardHeader><CardTitle>Batch Progress</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Status: <Badge>{job.status}</Badge></span>
              <span>{job.processedParcels}/{job.totalParcels}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            {job.errorCount > 0 && (
              <p className="text-sm text-destructive">{job.errorCount} errors</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
