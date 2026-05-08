/**
 * ═══════════════════════════════════════════════════════════════
 * SYNC-UX-1B: WORKBENCH COMMITS — DECISION HISTORY
 *
 * Operator surface for the SYNC-WORKBENCH-G/H spine. Lists recent
 * decision-commits, drills into a single commit's snapshot
 * (universe + ratio + per-decision rows), and lets the operator
 * download the signed evidence ZIP / inspect the manifest.
 *
 * Route: /workbench/sync/commits[/:commitId]
 *
 * Sibling to /workbench/sync-doctrine (read-only doctrine status)
 * and /workbench/sync-readiness (PACS reachability probes).
 *
 * Spec discipline (per OPS-1 / DASHBOARD-1 design language):
 *   - One screen, list + detail panels, single modal
 *   - tf-* utility classes only — no new design tokens
 *   - tf-status-{success,warning,error,info} for verdicts
 *   - No polling — operator-driven; commit list invalidates after
 *     a successful Create
 *
 * The page reads decision history; it does not mutate triage rows,
 * does not mutate quarantine rows, and does not write into
 * truth_pacs.* / canonical_tf.*. Truth/canonical materialization is
 * handled separately by the existing attr-drain chain.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CommitCreateModal from './CommitCreateModal';
import CommitDetail from './CommitDetail';
import CommitsList from './CommitsList';
import { COMMITS_LIST_PAGE_SIZE, useCommitsList } from './useCommitsList';
import { useCommitDetail } from './useCommitDetail';
import type { CommitCreateResponse } from '@/api/syncCommits';

interface ToastState {
  kind: 'success' | 'info' | 'warning' | 'error';
  message: string;
  ttl: number;
}

export default function SyncCommitsPage(): React.ReactElement {
  const params = useParams<{ commitId?: string }>();
  const navigate = useNavigate();

  const [offset, setOffset] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const list = useCommitsList(offset, COMMITS_LIST_PAGE_SIZE);

  // Selection drives the right detail panel. Source of truth: URL param.
  // We fall back to the first item in the list when no param is set so the
  // page is never blank after a fresh page load.
  const selectedCommitId = useMemo<string | null>(() => {
    if (params.commitId) return params.commitId;
    return null;
  }, [params.commitId]);

  const detail = useCommitDetail(selectedCommitId);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const handle = window.setTimeout(() => setToast(null), toast.ttl);
    return () => window.clearTimeout(handle);
  }, [toast]);

  const handleSelect = useCallback(
    (commitId: string) => {
      navigate(`/workbench/sync/commits/${commitId}`);
    },
    [navigate],
  );

  const handleCreated = useCallback(
    (response: CommitCreateResponse, isIdempotent: boolean) => {
      const shortCommitId = response.commitId.slice(0, 8);
      setToast({
        kind: isIdempotent ? 'info' : 'success',
        message: isIdempotent
          ? `Existing commit returned (idempotent · ${shortCommitId})`
          : `Commit ${shortCommitId} created`,
        ttl: 4000,
      });
      navigate(`/workbench/sync/commits/${response.commitId}`);
    },
    [navigate],
  );

  const totalCount = list.data?.count ?? 0;
  const items = list.data?.items ?? [];

  return (
    <main
      className='p-6'
      aria-label='Sync Workbench Commits'
      data-testid='sync-commits-page'
    >
      <Header totalCount={totalCount} />

      <div
        className='flex items-center gap-3 mb-4'
        data-testid='sync-commits-actionbar'
      >
        <button
          type='button'
          className='tf-status-success px-4 py-2 rounded font-medium'
          onClick={() => setCreateOpen(true)}
          data-testid='new-commit-button'
          aria-label='Open new-commit dialog'
        >
          + New Commit
        </button>
        <button
          type='button'
          className='tf-status-info px-3 py-2 rounded'
          onClick={() => list.refetch()}
          disabled={list.isFetching}
          data-testid='commits-refresh-button'
          aria-label='Refresh commits list'
          style={{ fontSize: '0.85rem' }}
        >
          {list.isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
        <span className='tf-text-secondary' style={{ fontSize: '0.8rem' }}>
          Read-only history of sealed decisions. No polling.
        </span>
      </div>

      {toast && (
        <div
          className={`tf-status-${toast.kind} p-2 rounded mb-3`}
          role='status'
          aria-live='polite'
          data-testid='sync-commits-toast'
          data-toast-kind={toast.kind}
        >
          {toast.message}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 1fr) minmax(0, 2fr)',
          gap: 16,
        }}
      >
        <CommitsList
          items={items}
          selectedCommitId={selectedCommitId}
          onSelect={handleSelect}
          isLoading={list.isLoading && !list.data}
          isError={list.isError}
          totalCount={totalCount}
          offset={offset}
          pageSize={COMMITS_LIST_PAGE_SIZE}
          onPageChange={setOffset}
        />

        <div data-testid='commit-detail-pane'>
          <CommitDetail
            commit={detail.data}
            isLoading={detail.isLoading && Boolean(selectedCommitId)}
            isError={detail.isError}
          />
        </div>
      </div>

      <CommitCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </main>
  );
}

function Header({ totalCount }: { totalCount: number }): React.ReactElement {
  return (
    <header className='mb-4' data-testid='sync-commits-header'>
      <h1 className='tf-text font-semibold' style={{ fontSize: '1.4rem' }}>
        TerraFusion · Workbench · Sync Commits
      </h1>
      <p className='tf-text-secondary' style={{ fontSize: '0.9rem' }}>
        Decision history — sealed Routed/Dismissed triage commits with
        evidence packets. Total commits visible:{' '}
        <strong className='tf-text'>{totalCount.toLocaleString()}</strong>
      </p>
    </header>
  );
}
