/**
 * TFR-066: Sync operations dashboard.
 * Shows active sync jobs, recent history, connector health, and next scheduled sync.
 * canon-sync = synchronization, connectors, orchestration. No appraisal math.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SyncJob, ConnectorHealth, SyncSchedule, SyncResult } from '../../types/sync';
import { listSyncJobs, getConnectorHealth, listSchedules, getSyncHistory } from '../../services/canon/syncService';

// --- Status helpers ---

function statusColor(status: string): string {
  switch (status) {
    case 'running':
      return 'bg-blue-500';
    case 'completed':
      return 'bg-green-600';
    case 'failed':
      return 'bg-red-600';
    case 'cancelled':
      return 'bg-yellow-600';
    case 'queued':
      return 'bg-gray-500';
    default:
      return 'bg-gray-400';
  }
}

function healthBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'healthy':
      return 'default';
    case 'degraded':
      return 'secondary';
    case 'unhealthy':
      return 'destructive';
    default:
      return 'outline';
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleString();
}

// --- Component ---

export default function SyncDashboard() {
  const [activeJobs, setActiveJobs] = useState<SyncJob[]>([]);
  const [history, setHistory] = useState<SyncResult[]>([]);
  const [connectors, setConnectors] = useState<ConnectorHealth[]>([]);
  const [schedules, setSchedules] = useState<SyncSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [jobsRes, healthRes, schedRes, histRes] = await Promise.all([
        listSyncJobs(1, 50),
        getConnectorHealth(),
        listSchedules(),
        getSyncHistory(undefined, 1, 10),
      ]);

      setActiveJobs(jobsRes.items.filter((j) => j.status === 'running' || j.status === 'queued'));
      setConnectors(healthRes.data);
      setSchedules(schedRes.data);
      setHistory(histRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sync dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const nextScheduled = schedules
    .filter((s) => s.enabled && s.nextRunAt)
    .sort((a, b) => new Date(a.nextRunAt!).getTime() - new Date(b.nextRunAt!).getTime())[0] ?? null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sync Dashboard</h1>
        <Button onClick={refresh} variant="outline" disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <Card className="border-red-500">
          <CardContent className="py-3 text-red-600">{error}</CardContent>
        </Card>
      )}

      {/* Next Scheduled Sync */}
      {nextScheduled && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Next Scheduled Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <span className="font-semibold">{nextScheduled.connectorName}</span>
            <span className="text-sm text-muted-foreground">
              {nextScheduled.frequency} &middot; {nextScheduled.mode}
            </span>
            <span className="ml-auto text-sm">{formatDate(nextScheduled.nextRunAt)}</span>
          </CardContent>
        </Card>
      )}

      {/* Active Sync Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sync Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {activeJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sync jobs.</p>
          ) : (
            <div className="space-y-4">
              {activeJobs.map((job) => (
                <div key={job.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{job.name}</span>
                    <span className="text-muted-foreground">
                      {job.recordsProcessed} / {job.recordsTotal} records
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full ${statusColor(job.status)}`}
                      style={{ width: `${Math.min(job.progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{job.connectorName}</span>
                    <span>&middot;</span>
                    <span>{job.mode}</span>
                    <span>&middot;</span>
                    <span>Started {formatDate(job.startedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connector Health */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Connector Health</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {connectors.map((c) => (
            <Card key={c.name}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{c.name}</CardTitle>
                  <Badge variant={healthBadgeVariant(c.status)}>{c.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uptime</span>
                  <span>{c.uptime.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Latency</span>
                  <span>{c.metrics.avgLatencyMs.toFixed(0)} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Syncs</span>
                  <span>
                    {c.metrics.successfulSyncs}/{c.metrics.totalSyncs}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Check</span>
                  <span>{formatDate(c.lastCheckAt)}</span>
                </div>
                {c.errorMessage && (
                  <p className="mt-1 text-xs text-red-500">{c.errorMessage}</p>
                )}
              </CardContent>
            </Card>
          ))}
          {connectors.length === 0 && !loading && (
            <p className="col-span-full text-sm text-muted-foreground">
              No connectors configured.
            </p>
          )}
        </div>
      </div>

      {/* Recent Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Inserted</TableHead>
                <TableHead className="text-right">Updated</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h.jobId}>
                  <TableCell className="font-mono text-xs">{h.jobId.slice(0, 8)}</TableCell>
                  <TableCell>
                    <Badge variant={h.status === 'completed' ? 'default' : 'destructive'}>
                      {h.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{h.recordsInserted}</TableCell>
                  <TableCell className="text-right">{h.recordsUpdated}</TableCell>
                  <TableCell className="text-right">{h.recordsFailed}</TableCell>
                  <TableCell className="text-right">
                    {(h.duration / 1000).toFixed(1)}s
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(h.completedAt)}</TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No sync history yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
