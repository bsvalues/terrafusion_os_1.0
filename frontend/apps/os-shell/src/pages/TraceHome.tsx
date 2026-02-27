/**
 * TerraFusion Trace Home
 *
 * Standalone home page for TerraTrace using the shared StandaloneHomeShell.
 * Provides system observability, audit trails, and telemetry visualization.
 *
 * @module pages/TraceHome
 * @see Slice 6.1: Unskip + Harden Standalone Contract Suite
 * @see Slice 17: Action Observability Surface
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { StandaloneHomeShell } from '../components/standalone';
import { ActionStreamModule } from '../components/Trace/ActionStreamModule';
import { PolicyPanel } from '../components/Trace/PolicyPanel';
import type { StoredTraceEvent, TelemetryStore } from '../services/telemetry';
import { getTelemetryStore } from '../services/telemetry';

export interface TraceHomeProps {
  /** Optional telemetry store for testing (defaults to singleton) */
  telemetryStore?: TelemetryStore;
}

/* ------------------------------------------------------------------ */
/*  Metrics Computation                                                */
/* ------------------------------------------------------------------ */

interface TraceMetrics {
  eventsToday: number;
  activeTraces: number;
  errorRate: string;           // e.g. "2.4%"
  totalEvents: number;
  byType: Record<string, number>;
  recentErrors: StoredTraceEvent[];
  hourlyBuckets: { hour: string; count: number; errors: number }[];
}

function computeMetrics(events: StoredTraceEvent[]): TraceMetrics {
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTs = todayStart.getTime();

  const todayEvents = events.filter((e) => e.timestamp >= todayTs);
  const failedToday = todayEvents.filter((e) => e.type === 'os_action_failed');
  const activeTraces = todayEvents.filter((e) => e.type === 'os_action_invoked').length;

  const byType: Record<string, number> = {};
  for (const e of todayEvents) {
    byType[e.type] = (byType[e.type] || 0) + 1;
  }

  // Build 24-hour histogram buckets
  const hourlyBuckets: { hour: string; count: number; errors: number }[] = [];
  for (let h = 0; h < 24; h++) {
    const label = `${h.toString().padStart(2, '0')}:00`;
    const bucketStart = todayTs + h * 60 * 60 * 1000;
    const bucketEnd = bucketStart + 60 * 60 * 1000;
    const bucketEvents = todayEvents.filter(
      (e) => e.timestamp >= bucketStart && e.timestamp < bucketEnd,
    );
    hourlyBuckets.push({
      hour: label,
      count: bucketEvents.length,
      errors: bucketEvents.filter((e) => e.type === 'os_action_failed').length,
    });
  }

  const errorRate =
    todayEvents.length > 0
      ? ((failedToday.length / todayEvents.length) * 100).toFixed(1) + '%'
      : '0.0%';

  return {
    eventsToday: todayEvents.length,
    activeTraces,
    errorRate,
    totalEvents: events.length,
    byType,
    recentErrors: failedToday.slice(0, 5),
    hourlyBuckets,
  };
}

/* ------------------------------------------------------------------ */
/*  Metrics Mini-Chart (pure SVG — no extra deps)                      */
/* ------------------------------------------------------------------ */

function MiniBarChart({ buckets }: { buckets: TraceMetrics['hourlyBuckets'] }) {
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));
  const barWidth = 100 / buckets.length;
  const currentHour = new Date().getHours();

  return (
    <svg viewBox='0 0 100 40' className='w-full h-24' preserveAspectRatio='none'>
      {buckets.map((b, i) => {
        const h = (b.count / maxCount) * 36;
        const errH = (b.errors / maxCount) * 36;
        const isCurrent = i === currentHour;
        return (
          <g key={i}>
            <rect
              x={i * barWidth + 0.2}
              y={40 - h}
              width={barWidth - 0.4}
              height={h}
              rx={0.5}
              fill={isCurrent ? 'hsl(var(--tf-transcend-cyan-hs) 60%)' : 'hsl(var(--tf-transcend-cyan-hs) 30%)'}
            />
            {errH > 0 && (
              <rect
                x={i * barWidth + 0.2}
                y={40 - errH}
                width={barWidth - 0.4}
                height={errH}
                rx={0.5}
                fill='hsl(0 70% 55%)'
              />
            )}
          </g>
        );
      })}
      {/* X-axis line */}
      <line x1='0' y1='40' x2='100' y2='40' stroke='hsl(var(--tf-muted))' strokeWidth='0.3' />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Audit Log Search                                                   */
/* ------------------------------------------------------------------ */

function AuditLogSearch({
  store,
}: {
  store: TelemetryStore;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StoredTraceEvent[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const all = await store.list({ limit: 1000 });
    const q = query.toLowerCase();
    const filtered = q
      ? all.filter(
          (e) =>
            e.payload.actionId.toLowerCase().includes(q) ||
            e.payload.actionType.toLowerCase().includes(q) ||
            e.payload.suiteId.toLowerCase().includes(q) ||
            e.type.toLowerCase().includes(q) ||
            (e.payload.errorCode && e.payload.errorCode.toLowerCase().includes(q)),
        )
      : all.slice(0, 50);
    setResults(filtered.slice(0, 50));
    setSearched(true);
  }, [store, query]);

  return (
    <div className='space-y-3'>
      <div className='flex gap-2'>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder='Search by action ID, type, suite, error code...'
          className='flex-1 px-3 py-2 rounded-lg text-sm'
          style={{
            background: 'hsl(var(--tf-bg-elevated))',
            color: 'hsl(var(--tf-fg))',
            border: '1px solid hsl(var(--tf-border))',
          }}
        />
        <button
          onClick={handleSearch}
          className='px-4 py-2 rounded-lg text-sm font-medium'
          style={{
            background: 'hsl(var(--tf-transcend-cyan-hs) 30%)',
            color: 'hsl(var(--tf-fg))',
          }}
        >
          Search
        </button>
      </div>

      {searched && (
        <div
          className='rounded-lg overflow-hidden text-sm'
          style={{ border: '1px solid hsl(var(--tf-border))' }}
        >
          <table className='w-full'>
            <thead>
              <tr style={{ background: 'hsl(var(--tf-bg-elevated))' }}>
                <th className='px-3 py-2 text-left' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Time
                </th>
                <th className='px-3 py-2 text-left' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Type
                </th>
                <th className='px-3 py-2 text-left' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Action
                </th>
                <th className='px-3 py-2 text-left' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Suite
                </th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={4} className='px-3 py-6 text-center' style={{ color: 'hsl(var(--tf-muted))' }}>
                    No events found.
                  </td>
                </tr>
              ) : (
                results.map((e) => (
                  <tr
                    key={e.id}
                    style={{ borderTop: '1px solid hsl(var(--tf-border))' }}
                  >
                    <td className='px-3 py-2 font-mono' style={{ color: 'hsl(var(--tf-muted))' }}>
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </td>
                    <td className='px-3 py-2'>
                      <span
                        className='px-2 py-0.5 rounded text-xs font-medium'
                        style={{
                          background:
                            e.type === 'os_action_failed'
                              ? 'hsl(0 70% 30%)'
                              : e.type === 'os_action_completed'
                                ? 'hsl(140 50% 25%)'
                                : 'hsl(var(--tf-transcend-cyan-hs) 20%)',
                          color: 'hsl(var(--tf-fg))',
                        }}
                      >
                        {e.type.replace('os_action_', '')}
                      </span>
                    </td>
                    <td className='px-3 py-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                      {e.payload.actionId}
                    </td>
                    <td className='px-3 py-2' style={{ color: 'hsl(var(--tf-muted))' }}>
                      {e.payload.suiteId || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Console Content                                                    */
/* ------------------------------------------------------------------ */

function TraceConsoleContent({ telemetryStore }: TraceHomeProps): React.ReactElement {
  const store = useMemo(() => telemetryStore ?? getTelemetryStore(), [telemetryStore]);
  const [metrics, setMetrics] = useState<TraceMetrics | null>(null);

  const refreshMetrics = useCallback(async () => {
    const events = await store.list({ limit: 5000 });
    setMetrics(computeMetrics(events));
  }, [store]);

  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 15_000); // refresh every 15s
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  return (
    <div className='trace-console' data-testid='trace-console-content'>
      <section className='trace-console__overview'>
        <h2>System Telemetry</h2>
        <p>Real-time observability and audit trail visualization.</p>

        <div className='trace-console__stats'>
          <div className='trace-console__stat'>
            <span className='trace-console__stat-label'>Events Today</span>
            <span className='trace-console__stat-value'>
              {metrics ? metrics.eventsToday.toLocaleString() : '…'}
            </span>
          </div>
          <div className='trace-console__stat'>
            <span className='trace-console__stat-label'>Active Traces</span>
            <span className='trace-console__stat-value'>
              {metrics ? metrics.activeTraces.toLocaleString() : '…'}
            </span>
          </div>
          <div className='trace-console__stat'>
            <span className='trace-console__stat-label'>Error Rate</span>
            <span className='trace-console__stat-value'>
              {metrics ? metrics.errorRate : '…'}
            </span>
          </div>
        </div>
      </section>

      {/* Metrics Dashboard — hourly event histogram */}
      {metrics && (
        <section className='trace-console__metrics' style={{ marginTop: '1.5rem' }}>
          <h3>Event Volume (Today)</h3>
          <MiniBarChart buckets={metrics.hourlyBuckets} />
          <div
            className='flex justify-between text-xs'
            style={{ color: 'hsl(var(--tf-muted))', marginTop: '0.25rem' }}
          >
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>

          {/* Event type breakdown */}
          <div className='flex gap-4 flex-wrap' style={{ marginTop: '0.75rem' }}>
            {Object.entries(metrics.byType).map(([type, count]) => (
              <div
                key={type}
                className='px-3 py-1.5 rounded-lg text-sm'
                style={{
                  background: 'hsl(var(--tf-bg-elevated))',
                  border: '1px solid hsl(var(--tf-border))',
                  color: 'hsl(var(--tf-fg))',
                }}
              >
                <span style={{ color: 'hsl(var(--tf-muted))' }}>
                  {type.replace('os_action_', '')}:
                </span>{' '}
                {count}
              </div>
            ))}
          </div>

          {/* Recent errors */}
          {metrics.recentErrors.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <h4 style={{ color: 'hsl(0 70% 65%)', marginBottom: '0.5rem' }}>Recent Errors</h4>
              <div className='space-y-1'>
                {metrics.recentErrors.map((e) => (
                  <div
                    key={e.id}
                    className='flex items-center gap-3 px-3 py-2 rounded-lg text-sm'
                    style={{
                      background: 'hsl(0 50% 15%)',
                      border: '1px solid hsl(0 50% 25%)',
                    }}
                  >
                    <span style={{ color: 'hsl(var(--tf-muted))' }}>
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </span>
                    <span style={{ color: 'hsl(0 70% 65%)' }}>
                      {e.payload.errorCode || 'UNKNOWN'}
                    </span>
                    <span style={{ color: 'hsl(var(--tf-fg))' }}>{e.payload.actionId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Action Stream - Real-time OS action visibility */}
      <section className='trace-console__action-stream'>
        <ActionStreamModule maxHeight='400px' showFilters telemetryStore={telemetryStore} />
      </section>

      {/* Audit Log Search */}
      <section className='trace-console__audit-search' style={{ marginTop: '1.5rem' }}>
        <h3>Audit Log Search</h3>
        <AuditLogSearch store={store} />
      </section>

      {/* Policy Panel - Visual rule management */}
      <section className='trace-console__policy-panel'>
        <h3>Policy Management</h3>
        <PolicyPanel />
      </section>
    </div>
  );
}

/**
 * TraceHome - Standalone entry point for TerraTrace.
 *
 * Uses StandaloneHomeShell for consistent chrome (header, badge, actions)
 * and renders TraceConsoleContent inside the content slot.
 */
export function TraceHome(props: TraceHomeProps = {}): React.ReactElement {
  return (
    <StandaloneHomeShell
      featureId='trace'
      meta={{
        title: 'TerraTrace Console',
        description: 'System observability, audit trails, and telemetry visualization.',
        primaryActions: [
          {
            id: 'refresh',
            label: 'Refresh',
            intent: 'system',
          },
          {
            id: 'export',
            label: 'Export Logs',
            intent: 'standalone',
          },
        ],
      }}
    >
      <TraceConsoleContent {...props} />
    </StandaloneHomeShell>
  );
}

export default TraceHome;
