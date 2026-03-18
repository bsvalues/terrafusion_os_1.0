/**
 * TFR-067: Integrated Data Services (IDS) command center.
 * Master view of all data sources, sync status, data quality scores, pipeline health.
 * canon-sync = synchronization, connectors, orchestration. No appraisal math.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  ConnectorStatus,
  ConnectorHealth,
  SyncJob,
  SyncSchedule,
  HealthStatus,
} from '../../types/sync';
import { listConnectors } from '../../services/canon/connectorService';
import { getConnectorHealth, listSyncJobs, listSchedules } from '../../services/canon/syncService';

// --- Helpers ---

function healthIcon(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-500';
    case 'degraded':
      return 'bg-yellow-500';
    case 'unhealthy':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}

interface DataSourceView {
  name: string;
  type: string;
  connected: boolean;
  health: HealthStatus;
  latencyMs: number | null;
  lastSyncAt: string | null;
  successRate: number;
  totalRecords: number;
}

function buildSourceViews(
  connectors: ConnectorStatus[],
  healthMap: Map<string, ConnectorHealth>,
): DataSourceView[] {
  return connectors.map((c) => {
    const h = healthMap.get(c.name);
    const total = h?.metrics.totalSyncs ?? 0;
    const success = h?.metrics.successfulSyncs ?? 0;
    return {
      name: c.displayName || c.name,
      type: c.type,
      connected: c.connected,
      health: h?.status ?? 'unknown',
      latencyMs: c.latencyMs,
      lastSyncAt: h?.metrics.lastSyncAt ?? null,
      successRate: total > 0 ? (success / total) * 100 : 0,
      totalRecords: h?.metrics.recordsSyncedTotal ?? 0,
    };
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleString();
}

// --- Component ---

export default function IDSCommandCenter() {
  const [sources, setSources] = useState<DataSourceView[]>([]);
  const [activeJobs, setActiveJobs] = useState<SyncJob[]>([]);
  const [schedules, setSchedules] = useState<SyncSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [connRes, healthRes, jobsRes, schedRes] = await Promise.all([
        listConnectors(),
        getConnectorHealth(),
        listSyncJobs(1, 100),
        listSchedules(),
      ]);

      const healthMap = new Map(healthRes.data.map((h) => [h.name, h]));
      setSources(buildSourceViews(connRes.data, healthMap));
      setActiveJobs(jobsRes.items.filter((j) => j.status === 'running' || j.status === 'queued'));
      setSchedules(schedRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load IDS data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 20_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const healthySources = sources.filter((s) => s.health === 'healthy').length;
  const totalSources = sources.length;
  const pipelineHealthPct = totalSources > 0 ? (healthySources / totalSources) * 100 : 0;

  const overallQuality =
    sources.length > 0
      ? sources.reduce((sum, s) => sum + s.successRate, 0) / sources.length
      : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">IDS Command Center</h1>
        <Button onClick={refresh} variant="outline" disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <Card className="border-red-500">
          <CardContent className="py-3 text-red-600">{error}</CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalSources}</p>
            <p className="text-xs text-muted-foreground">
              {healthySources} healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">Pipeline Health</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pipelineHealthPct.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">of connectors operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">Data Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{overallQuality.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">avg sync success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeJobs.length}</p>
            <p className="text-xs text-muted-foreground">
              {activeJobs.filter((j) => j.status === 'running').length} running,{' '}
              {activeJobs.filter((j) => j.status === 'queued').length} queued
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Source Grid */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Data Sources</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((src) => (
            <Card key={src.name}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{src.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${healthIcon(src.health)}`} />
                    <Badge variant="outline" className="text-xs">
                      {src.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connected</span>
                  <span>{src.connected ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latency</span>
                  <span>{src.latencyMs !== null ? `${src.latencyMs} ms` : '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span>{src.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Records Synced</span>
                  <span>{src.totalRecords.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span className="text-xs">{formatDate(src.lastSyncAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {sources.length === 0 && !loading && (
            <p className="col-span-full text-sm text-muted-foreground">
              No data sources configured.
            </p>
          )}
        </div>
      </div>

      {/* Scheduled Syncs */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No schedules configured.</p>
          ) : (
            <div className="space-y-2">
              {schedules.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${s.enabled ? 'bg-green-500' : 'bg-gray-400'}`}
                    />
                    <span className="font-medium">{s.connectorName}</span>
                    <Badge variant="outline">{s.frequency}</Badge>
                    <Badge variant="outline">{s.mode}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Next: {formatDate(s.nextRunAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
