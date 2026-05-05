/**
 * ═══════════════════════════════════════════════════════════════
 * DASHBOARD-1: SYNC DOCTRINE CONSOLE
 *
 * Read-only operator status board for the doctrine pipeline.
 * Renders the snapshot from GET /api/sync/doctrine/state across
 * canonical / truth / raw / quarantine layers, plus per-lane
 * freshness and recent gate failures.
 *
 * Route: /workbench/sync-doctrine
 *
 * Sibling to /workbench/sync-readiness:
 *   - sync-readiness = "is PACS reachable?" (operator-driven probes)
 *   - sync-doctrine  = "what's in our canonical layer?" (DB reads, polled)
 *
 * Spec discipline (per OPS-1 design language):
 *   - One screen, structured panels, no tabs, no modals
 *   - tf-* utility classes only — no new design tokens
 *   - tf-status-success / -warning / -error / -info for verdicts
 *   - Operator can scan in <10s to answer "is the doctrine green?"
 *
 * 30s polling is appropriate here (DB reads, not PACS probes).
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';
import { useDoctrineState } from './useDoctrineState';
import type {
  DoctrineState,
  DoctrineCanonicalCounts,
  DoctrineQuarantineCounts,
  DoctrineLastCompletedRow,
  DoctrineGateFailureRow,
} from '@/api/syncDoctrine';

export default function SyncDoctrineConsole(): React.ReactElement {
  const query = useDoctrineState();

  return (
    <main
      className='p-6'
      aria-label='Sync Doctrine Console'
      data-testid='sync-doctrine-console'
      data-state={query.isFetching ? 'refreshing' : query.isError ? 'error' : 'loaded'}
    >
      <Header />

      <div className='flex items-center gap-4 my-4'>
        <button
          type='button'
          className='tf-status-info px-4 py-2 rounded font-medium'
          style={{ opacity: query.isFetching ? 0.6 : 1 }}
          disabled={query.isFetching}
          onClick={() => query.refetch()}
          data-testid='refresh-button'
        >
          {query.isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
        <span className='tf-text-secondary' style={{ fontSize: '0.85rem' }}>
          {query.data?.snapshotAt
            ? `snapshot: ${query.data.snapshotAt}`
            : 'no snapshot yet'}
          {' · auto-refresh every 30s'}
        </span>
      </div>

      {query.isLoading && !query.data && (
        <p className='tf-text-secondary' data-testid='doctrine-loading'>
          Loading doctrine state…
        </p>
      )}

      {query.isError && (
        <p className='tf-status-error p-3 rounded' data-testid='doctrine-error'>
          Failed to load doctrine state.
        </p>
      )}

      {query.data && (
        <div data-testid='doctrine-panels'>
          <OverallVerdictPanel state={query.data} />

          <div
            className='grid gap-4 mt-4'
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
          >
            <CanonicalCountsPanel canonical={query.data.canonical} />
            <QuarantinePanel quarantine={query.data.quarantine} />
            <LastCompletedPanel rows={query.data.lastCompleted} />
            <CountiesPanel counties={query.data.counties} />
            <BatchSummaryPanel summary={query.data.batchOutcomeSummary} />
            <GateSummaryPanel summary={query.data.gateOutcomeSummary} />
          </div>

          {query.data.recentGateFailures.length > 0 && (
            <RecentGateFailuresPanel rows={query.data.recentGateFailures} />
          )}
        </div>
      )}
    </main>
  );
}

function Header(): React.ReactElement {
  return (
    <header className='mb-4'>
      <h1 className='tf-text font-semibold' style={{ fontSize: '1.4rem' }}>
        TerraFusion · Workbench · Sync Doctrine
      </h1>
      <p className='tf-text-secondary' style={{ fontSize: '0.9rem' }}>
        Read-only operator status board for the doctrine pipeline. Counts,
        freshness, and gate signal across canonical / truth / raw / quarantine
        layers. Polls every 30 seconds.
      </p>
    </header>
  );
}

function OverallVerdictPanel({ state }: { state: DoctrineState }): React.ReactElement {
  const statusClass = state.operational ? 'tf-status-success' : 'tf-status-warning';
  const verdict = state.operational
    ? 'OPERATIONAL — all canonical lanes have rows'
    : 'PARTIAL — one or more canonical lanes are empty';

  return (
    <section
      className={`${statusClass} p-4 rounded`}
      aria-label='Overall doctrine verdict'
      data-testid='verdict-panel'
    >
      <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{verdict}</div>
      <div style={{ fontSize: '0.85rem', marginTop: 4 }}>
        Canonical rows: <strong>{state.summary.canonicalRowsTotal.toLocaleString()}</strong>
        {' · Quarantine rows: '}
        <strong>{state.summary.quarantineRowsTotal.toLocaleString()}</strong>
        {' · Counties bound: '}
        <strong>{state.summary.countiesBound}</strong>
      </div>
    </section>
  );
}

function CanonicalCountsPanel({
  canonical,
}: {
  canonical: DoctrineCanonicalCounts;
}): React.ReactElement {
  const rows: Array<[string, number]> = [
    ['tf_parcel', canonical.tf_parcel],
    ['tf_sale', canonical.tf_sale],
    ['tf_owner', canonical.tf_owner],
    ['tf_parcel_owner_link', canonical.tf_parcel_owner_link],
    ['tf_assessment_wsdor', canonical.tf_assessment_wsdor],
    ['tf_improvement', canonical.tf_improvement],
    ['tf_improvement_feature', canonical.tf_improvement_feature],
    ['tf_land', canonical.tf_land],
    ['tf_parcel_geom', canonical.tf_parcel_geom],
  ];

  return (
    <section className='tf-panel p-4' aria-label='Canonical counts' data-testid='canonical-panel'>
      <h3 className='tf-text font-medium mb-3' style={{ fontSize: '0.95rem' }}>
        Canonical layer
      </h3>
      <table style={{ width: '100%', fontSize: '0.85rem' }}>
        <tbody>
          {rows.map(([name, count]) => (
            <tr key={name}>
              <td className='tf-text-secondary' style={{ paddingBottom: 4 }}>
                <code>{name}</code>
              </td>
              <td
                className='tf-text'
                style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
              >
                {count.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function QuarantinePanel({
  quarantine,
}: {
  quarantine: DoctrineQuarantineCounts;
}): React.ReactElement {
  const rows: Array<[string, number]> = [
    ['legacy_tf_unproven_sale', quarantine.legacy_tf_unproven_sale],
    ['legacy_tf_unproven_owner_current', quarantine.legacy_tf_unproven_owner_current],
    ['legacy_tf_unproven_wash_prop_owner_val', quarantine.legacy_tf_unproven_wash_prop_owner_val],
    ['legacy_tf_unproven_imprv_current', quarantine.legacy_tf_unproven_imprv_current],
    ['legacy_tf_unproven_imprv_attr', quarantine.legacy_tf_unproven_imprv_attr],
    ['legacy_tf_unproven_land_current', quarantine.legacy_tf_unproven_land_current],
  ];
  const total = rows.reduce((acc, [, n]) => acc + n, 0);

  return (
    <section
      className='tf-panel p-4'
      aria-label='Quarantine counts'
      data-testid='quarantine-panel'
    >
      <h3 className='tf-text font-medium mb-3' style={{ fontSize: '0.95rem' }}>
        Quarantine ({total.toLocaleString()} preserved)
      </h3>
      <table style={{ width: '100%', fontSize: '0.85rem' }}>
        <tbody>
          {rows.map(([name, count]) => (
            <tr key={name}>
              <td className='tf-text-secondary' style={{ paddingBottom: 4 }}>
                <code>{name.replace('legacy_tf_unproven_', '')}</code>
              </td>
              <td
                className={count > 0 ? 'tf-status-warning' : 'tf-text'}
                style={{
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  padding: count > 0 ? '0 4px' : 0,
                  borderRadius: count > 0 ? 3 : 0,
                }}
              >
                {count.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function LastCompletedPanel({
  rows,
}: {
  rows: DoctrineLastCompletedRow[];
}): React.ReactElement {
  const sorted = [...rows].sort((a, b) =>
    (b.lastCompletedAt ?? '').localeCompare(a.lastCompletedAt ?? ''),
  );

  return (
    <section
      className='tf-panel p-4'
      aria-label='Last-completed batches'
      data-testid='last-completed-panel'
    >
      <h3 className='tf-text font-medium mb-3' style={{ fontSize: '0.95rem' }}>
        Last completed per source-system
      </h3>
      <ul
        className='tf-text-secondary'
        style={{ fontSize: '0.8rem', lineHeight: 1.6, listStyle: 'none', padding: 0 }}
      >
        {sorted.map((r) => (
          <li key={r.sourceSystem} style={{ marginBottom: 6 }}>
            <code className='tf-text'>{r.sourceSystem}</code>
            <br />
            {r.lastCompletedAt
              ? new Date(r.lastCompletedAt).toLocaleString()
              : 'never'}
            {' · ext '}
            <strong className='tf-text'>{r.rowsExtracted ?? '—'}</strong>
            {' · prom '}
            <strong className='tf-text'>{r.rowsPromoted ?? '—'}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CountiesPanel({
  counties,
}: {
  counties: DoctrineState['counties'];
}): React.ReactElement {
  return (
    <section className='tf-panel p-4' aria-label='Counties bound' data-testid='counties-panel'>
      <h3 className='tf-text font-medium mb-3' style={{ fontSize: '0.95rem' }}>
        Counties bound
      </h3>
      {counties.length === 0 ? (
        <p className='tf-text-secondary' style={{ fontSize: '0.85rem' }}>
          No counties bound yet.
        </p>
      ) : (
        <ul
          className='tf-text-secondary'
          style={{ fontSize: '0.85rem', listStyle: 'none', padding: 0 }}
        >
          {counties.map((c) => (
            <li key={c.id} style={{ marginBottom: 4 }}>
              <span className='tf-text font-medium'>
                {c.name}, {c.state}
              </span>
              {c.fipsCode ? ` (FIPS ${c.fipsCode})` : ''}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BatchSummaryPanel({
  summary,
}: {
  summary: DoctrineState['batchOutcomeSummary'];
}): React.ReactElement {
  return (
    <section className='tf-panel p-4' aria-label='Batch outcomes' data-testid='batch-panel'>
      <h3 className='tf-text font-medium mb-3' style={{ fontSize: '0.95rem' }}>
        Batch outcomes (all-time)
      </h3>
      <table style={{ width: '100%', fontSize: '0.85rem' }}>
        <tbody>
          {summary.map((r) => (
            <tr key={r.status}>
              <td
                className={
                  r.status === 'COMPLETED'
                    ? 'tf-text'
                    : r.status === 'FAILED'
                      ? 'tf-status-error'
                      : 'tf-text-secondary'
                }
                style={{ paddingBottom: 4 }}
              >
                <code>{r.status}</code>
              </td>
              <td
                className='tf-text'
                style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
              >
                {r.count.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function GateSummaryPanel({
  summary,
}: {
  summary: DoctrineState['gateOutcomeSummary'];
}): React.ReactElement {
  return (
    <section className='tf-panel p-4' aria-label='Gate outcomes' data-testid='gate-summary-panel'>
      <h3 className='tf-text font-medium mb-3' style={{ fontSize: '0.95rem' }}>
        Gate outcomes (all-time)
      </h3>
      <table style={{ width: '100%', fontSize: '0.85rem' }}>
        <tbody>
          {summary.map((r) => (
            <tr key={r.status}>
              <td
                className={
                  r.status === 'PASS'
                    ? 'tf-status-success'
                    : r.status === 'FAIL'
                      ? 'tf-status-error'
                      : r.status === 'WARN'
                        ? 'tf-status-warning'
                        : 'tf-text-secondary'
                }
                style={{ paddingBottom: 4, padding: '2px 6px', borderRadius: 3 }}
              >
                <code>{r.status}</code>
              </td>
              <td
                className='tf-text'
                style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
              >
                {r.count.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function RecentGateFailuresPanel({
  rows,
}: {
  rows: DoctrineGateFailureRow[];
}): React.ReactElement {
  return (
    <section
      className='tf-panel p-4 mt-4'
      aria-label='Recent gate failures'
      data-testid='gate-failures-panel'
    >
      <h3 className='tf-text font-medium mb-3' style={{ fontSize: '0.95rem' }}>
        Recent gate failures (most recent first)
      </h3>
      <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr className='tf-text-secondary'>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Gate</th>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Stage</th>
            <th style={{ textAlign: 'right', padding: '4px 8px' }}>Expected</th>
            <th style={{ textAlign: 'right', padding: '4px 8px' }}>Actual</th>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Detail</th>
            <th style={{ textAlign: 'right', padding: '4px 8px' }}>When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.loadBatchId}-${r.gateName}-${i}`}>
              <td
                className={r.status === 'FAIL' ? 'tf-status-error' : 'tf-status-warning'}
                style={{ padding: '4px 8px', borderRadius: 3 }}
              >
                <code>{r.status}</code>
              </td>
              <td className='tf-text' style={{ padding: '4px 8px' }}>
                <code>{r.gateName}</code>
              </td>
              <td className='tf-text-secondary' style={{ padding: '4px 8px' }}>
                {r.gateStage}
              </td>
              <td className='tf-text-secondary' style={{ padding: '4px 8px', textAlign: 'right' }}>
                {r.expected ?? '—'}
              </td>
              <td className='tf-text' style={{ padding: '4px 8px', textAlign: 'right' }}>
                {r.actual ?? '—'}
              </td>
              <td
                className='tf-text-secondary'
                style={{
                  padding: '4px 8px',
                  maxWidth: 360,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={r.detail ?? ''}
              >
                {r.detail ?? '—'}
              </td>
              <td className='tf-text-secondary' style={{ padding: '4px 8px', textAlign: 'right' }}>
                {new Date(r.executedAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
