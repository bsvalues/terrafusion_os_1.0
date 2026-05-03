/**
 * ═══════════════════════════════════════════════════════════════
 * OPS-1-B: SYNC READINESS CONSOLE
 *
 * One screen, six pinned questions, one click. Read-only OS
 * control surface that surfaces Benton Sync bridge readiness
 * by consuming the OPS-1-A backend facade.
 *
 * Route: /workbench/sync-readiness
 *
 * Per the OPS-1 policy at
 * docs/workbench/sync-readiness-console-policy.md:
 *   1. Is Harris PACS reachable?
 *   2. Is the schema catalog healthy?
 *   3. Are invariants clean?
 *   4. Are dictionary preflights clean?
 *   5. Are canonical rows stale or missing?
 *   6. What was the last successful proof?
 *
 * No auto-refresh. No polling. No probes on page load. The
 * operator decides when to query live state via the Refresh
 * button.
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '../../../auth/useSession';
import { ReadinessPanel } from './ReadinessPanel';
import { ScopeSelectorForm } from './ScopeSelectorForm';
import { useSyncReadiness, useSyncReadinessRefresh } from './useSyncReadiness';

const SYNC_READINESS_PATH = '/workbench/sync-readiness';

export default function SyncReadinessConsole(): React.ReactElement {
  const session = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // URL is the source of truth for scope. No implicit defaults.
  const countyId = params.get('countyId');
  const sourceConnectionId = params.get('sourceConnectionId');
  const workbookId = params.get('workbookId');

  const scope = useMemo(
    () => ({ countyId, sourceConnectionId, workbookId }),
    [countyId, sourceConnectionId, workbookId],
  );

  const readinessQuery = useSyncReadiness(scope);
  const refresh = useSyncReadinessRefresh();

  // Empty selector page: any of the three required URL params missing.
  const scopeMissing = !countyId || !sourceConnectionId || !workbookId;

  if (scopeMissing) {
    return (
      <main
        className='p-6'
        aria-label='Sync Readiness Console'
        data-testid='sync-readiness-console'
        data-state='scope-empty'
      >
        <Header />
        <ScopeSelectorForm
          initialCountyId={session.countyId}
          onLoad={(s) => {
            navigate(
              `${SYNC_READINESS_PATH}?countyId=${encodeURIComponent(s.countyId)}` +
                `&sourceConnectionId=${encodeURIComponent(s.sourceConnectionId)}` +
                `&workbookId=${encodeURIComponent(s.workbookId)}`,
            );
          }}
        />
      </main>
    );
  }

  const data = readinessQuery.data;
  const lastRefreshLabel = data?.assembledAtUtc ?? 'never';
  const refreshing = refresh.isPending;

  return (
    <main
      className='p-6'
      aria-label='Sync Readiness Console'
      data-testid='sync-readiness-console'
      data-state={refreshing ? 'refreshing' : 'loaded'}
    >
      <Header />

      <ScopeStrip
        countyId={countyId!}
        sourceConnectionId={sourceConnectionId!}
        workbookId={workbookId!}
      />

      <div className='flex items-center gap-4 my-4'>
        <button
          type='button'
          className='tf-status-info px-4 py-2 rounded font-medium'
          style={{ opacity: refreshing ? 0.6 : 1 }}
          disabled={refreshing}
          onClick={() =>
            refresh.mutate({
              countyId: countyId!,
              sourceConnectionId: sourceConnectionId!,
              workbookId: workbookId!,
            })
          }
          data-testid='refresh-button'
        >
          {refreshing ? 'Refreshing…' : 'Refresh diagnostics'}
        </button>
        <span className='tf-text-secondary' style={{ fontSize: '0.85rem' }}>
          last refreshed: {lastRefreshLabel}
        </span>
      </div>

      {readinessQuery.isLoading && !data && (
        <p className='tf-text-secondary' data-testid='readiness-loading'>
          Loading captured artifact state…
        </p>
      )}

      {readinessQuery.isError && (
        <p className='tf-status-error p-3 rounded' data-testid='readiness-error'>
          Failed to load readiness state.
        </p>
      )}

      {data && (
        <div
          className='grid gap-4'
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
          data-testid='readiness-panels'
        >
          <ReadinessPanel
            panel={data.reachability}
            questionLabel='1. Is Harris PACS reachable?'
          />
          <ReadinessPanel
            panel={data.catalogHealth}
            questionLabel='2. Is the schema catalog healthy?'
          />
          <ReadinessPanel
            panel={data.invariants}
            questionLabel='3. Are invariants clean?'
          />
          <ReadinessPanel
            panel={data.preflights}
            questionLabel='4. Are dictionary preflights clean?'
          />
          <ReadinessPanel
            panel={data.coverage}
            questionLabel='5. Are canonical rows stale or missing?'
          />
          <LastProofPanel proof={data.lastProof} />
        </div>
      )}
    </main>
  );
}

function Header(): React.ReactElement {
  return (
    <header className='mb-4'>
      <h1 className='tf-text font-semibold' style={{ fontSize: '1.4rem' }}>
        TerraFusion · Workbench · Sync Readiness
      </h1>
      <p className='tf-text-secondary' style={{ fontSize: '0.9rem' }}>
        Read-only operator control surface. Probes are operator-driven; no auto-refresh.
      </p>
    </header>
  );
}

function ScopeStrip({
  countyId,
  sourceConnectionId,
  workbookId,
}: {
  countyId: string;
  sourceConnectionId: string;
  workbookId: string;
}): React.ReactElement {
  return (
    <section className='tf-panel p-3 mb-3' aria-label='Scope'>
      <p className='tf-text-secondary' style={{ fontSize: '0.85rem' }}>
        <span className='tf-text font-medium'>Scope</span>
        {' · County '}
        <code>{countyId}</code>
        {' · PACS source '}
        <code>{sourceConnectionId}</code>
        {' · Workbook '}
        <code>{workbookId}</code>
      </p>
    </section>
  );
}

function LastProofPanel({
  proof,
}: {
  proof: import('@/api/workbenchSyncReadiness').SyncReadinessLastProof;
}): React.ReactElement {
  return (
    <section className='tf-panel p-4' aria-label='6. Last successful proof per surface'>
      <h3 className='tf-text font-medium mb-2' style={{ fontSize: '0.95rem' }}>
        6. Last successful proof per surface
      </h3>
      <ul className='tf-text-secondary' style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
        <li>
          <span className='tf-text'>Catalog health</span>: <code>{proof.catalogHealth}</code>
        </li>
        <li>
          <span className='tf-text'>Invariant artifact</span>:{' '}
          <code>{proof.invariantArtifact}</code>
        </li>
        <li>
          <span className='tf-text'>Preflight evidence</span>:{' '}
          <code>{proof.preflightEvidence}</code>
        </li>
        <li>
          <span className='tf-text'>Coverage report</span>: <code>{proof.coverageReport}</code>
        </li>
      </ul>
    </section>
  );
}
