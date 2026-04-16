/**
 * BatchCostApplyPanel (TFR-102) — Batch cost schedule application.
 * Select properties by filter, apply cost schedule update in batch.
 * Progress tracking with polling + cancel. Backend does the work.
 */
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/apiBase';

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
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [job, setJob] = useState<BatchJob | null>(null);
  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Poll job status every 5 s while running
  useEffect(() => {
    if (!job || job.status !== 'running') return;
    const interval = setInterval(async () => {
      try {
        const updated = await apiFetch<BatchJob>(`/costforge/batch/status/${job.jobId}`);
        setJob(updated);
        if (updated.status === 'completed' || updated.status === 'failed') {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [job?.jobId, job?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const previewMatch = async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setMatchLoading(true);
    setMatchError(null);
    try {
      const params = new URLSearchParams();
      if (neighborhoodFilter) params.set('neighborhood', neighborhoodFilter);
      if (propertyType) params.set('propertyType', propertyType);
      const data = await apiFetch<{ matchCount: number }>(
        `/costforge/batch/preview?${params.toString()}`,
        { signal: abortRef.current.signal }
      );
      setMatchCount(data.matchCount);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setMatchError(err instanceof Error ? err.message : 'Preview failed');
      setMatchCount(null);
    } finally {
      setMatchLoading(false);
    }
  };

  const startBatch = async () => {
    setStartLoading(true);
    setStartError(null);
    try {
      const newJob = await apiFetch<BatchJob>('/costforge/batch/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ neighborhoodFilter, propertyType, costScheduleId }),
      });
      setJob(newJob);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Batch start failed');
    } finally {
      setStartLoading(false);
    }
  };

  const cancelJob = async () => {
    if (!job) return;
    try {
      await apiFetch(`/costforge/batch/cancel/${job.jobId}`, { method: 'POST' });
      setJob((prev) => prev ? { ...prev, status: 'failed' } : null);
    } catch {
      // ignore cancel errors — polling will pick up final state
    }
  };

  const progress =
    job && job.totalParcels > 0
      ? Math.min(100, (job.processedParcels / job.totalParcels) * 100)
      : 0;

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
              <Input
                value={neighborhoodFilter}
                onChange={(e) => setNeighborhoodFilter(e.target.value)}
                placeholder="e.g., N01"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Property Type</label>
              <Input
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                placeholder="e.g., SFR"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cost Schedule</label>
              <Input
                value={costScheduleId}
                onChange={(e) => setCostScheduleId(e.target.value)}
                placeholder="Schedule ID"
              />
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <Button variant="outline" onClick={() => void previewMatch()} disabled={matchLoading}>
              {matchLoading ? 'Previewing…' : 'Preview Match'}
            </Button>
            {matchCount !== null && (
              <span className="text-sm">{matchCount.toLocaleString()} parcels matched</span>
            )}
            {matchError && (
              <span className="text-sm text-destructive">{matchError}</span>
            )}
          </div>

          {startError && (
            <p className="text-sm text-destructive">{startError}</p>
          )}
          <Button
            onClick={() => void startBatch()}
            disabled={startLoading || !costScheduleId || (job?.status === 'running')}
            className="w-full"
          >
            {startLoading ? 'Starting…' : 'Apply Cost Schedule'}
          </Button>
        </CardContent>
      </Card>

      {job && (
        <Card>
          <CardHeader>
            <CardTitle>Batch Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>
                Status:{' '}
                <Badge variant={
                  job.status === 'completed' ? 'default' :
                  job.status === 'failed' ? 'destructive' :
                  'outline'
                }>
                  {job.status}
                </Badge>
              </span>
              <span className="tabular-nums">
                {job.processedParcels.toLocaleString()} / {job.totalParcels.toLocaleString()}
              </span>
            </div>

            {/* cf-* progress bar */}
            <div className="cf-progress-track">
              <div
                className="cf-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            {job.status === 'running' && (
              <Button
                type="button"
                variant="outline"
                className="w-full text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => void cancelJob()}
              >
                Cancel Job
              </Button>
            )}

            {job.status === 'completed' && (
              <p className="text-sm text-green-600 dark:text-green-400">
                ✓ Completed — {(job.totalParcels - job.errorCount).toLocaleString()} parcels updated
                {job.errorCount > 0 && (
                  <span className="text-destructive ml-2">({job.errorCount} errors)</span>
                )}
              </p>
            )}

            {job.status === 'failed' && (
              <p className="text-sm text-destructive">
                Batch failed{job.errorCount > 0 ? ` — ${job.errorCount} errors` : ''}.
              </p>
            )}

            {job.errorCount > 0 && job.status !== 'completed' && job.status !== 'failed' && (
              <p className="text-sm text-destructive">{job.errorCount} errors so far</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
