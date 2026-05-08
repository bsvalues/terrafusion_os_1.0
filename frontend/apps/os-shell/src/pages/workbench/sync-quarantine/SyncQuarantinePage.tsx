/**
 * ═══════════════════════════════════════════════════════════════
 * SYNC-UX-1A: SYNC QUARANTINE TRIAGE PAGE
 *
 * Operator triage surface for the imprv_attr quarantine cohort.
 * Sibling to /workbench/sync-doctrine (read-only status board);
 * this surface is read-write and lives at /workbench/sync/quarantine.
 *
 * Renders:
 *   - Header + count badge (rows visible vs total page)
 *   - Sticky filter bar (reason, universe, propId, status)
 *   - Paged quarantine table with Route / Dismiss per-row + bulk
 *   - Route + Dismiss modals (single + bulk)
 *   - Manual refresh button (TanStack Query staleTime=30s,
 *     refetchOnWindowFocus=true)
 *
 * Spec discipline (matches SyncDoctrineConsole):
 *   - tf-* utility classes only
 *   - tf-status-success / -warning / -error / -info for verdicts
 *   - one screen, one filter bar, modals only on operator-initiated
 *     decisions
 *   - tabular-nums for counts
 *
 * Decisions are doctrine-immutable on the source quarantine row;
 * the page only writes the sibling triage table via the
 * SYNC-WORKBENCH-F controller.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  QuarantineApiError,
  type QuarantineRowResponse,
  type TriageStatus,
} from '@/api/syncQuarantine';
import QuarantineFilterBar, { type QuarantineFilterValue } from './QuarantineFilterBar';
import QuarantineTable, { type PageSize } from './QuarantineTable';
import QuarantineRouteModal from './QuarantineRouteModal';
import QuarantineDismissModal from './QuarantineDismissModal';
import { useQuarantineList } from './useQuarantineList';

type ToastKind = 'info' | 'success' | 'warning' | 'error';
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const DEFAULT_FILTER: QuarantineFilterValue = {
  reason: '',
  universe: '',
  propId: null,
  status: 'Open',
};

export default function SyncQuarantinePage(): React.ReactElement {
  const [filter, setFilter] = useState<QuarantineFilterValue>(DEFAULT_FILTER);
  const [pageSize, setPageSize] = useState<PageSize>(100);
  const [page, setPage] = useState<number>(1); // 1-based
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [routeTargetIds, setRouteTargetIds] = useState<readonly string[] | null>(null);
  const [routeContextLabel, setRouteContextLabel] = useState<string | undefined>(undefined);
  const [dismissTargetIds, setDismissTargetIds] = useState<readonly string[] | null>(null);
  const [dismissContextLabel, setDismissContextLabel] = useState<string | undefined>(undefined);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const offset = (page - 1) * pageSize;
  const query = useQuarantineList({
    reason: filter.reason,
    universe: filter.universe,
    propId: filter.propId,
    limit: pageSize,
    offset,
  });

  // Reset pagination + selection when filters or page-size change.
  // We deliberately leave selection intact across server refetches so
  // the operator can refresh the list without losing their queue.
  const onFilterChange = useCallback((next: QuarantineFilterValue) => {
    setFilter(next);
    setPage(1);
  }, []);

  const onPageSizeChange = useCallback((next: PageSize) => {
    setPageSize(next);
    setPage(1);
  }, []);

  // Apply the client-side status filter over the fetched page. This
  // is intentional: server today filters only by reason/universe/propId.
  const visibleRows: QuarantineRowResponse[] = useMemo(() => {
    const items = query.data?.items ?? [];
    if (filter.status === 'All') return items;
    return items.filter((r) => normalizeStatus(r.triageStatus) === filter.status);
  }, [query.data, filter.status]);

  const hasNextPage = (query.data?.items.length ?? 0) >= pageSize;

  const onToggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onToggleAll = useCallback(
    (checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (checked) {
          for (const r of visibleRows) next.add(r.unprovenRowId);
        } else {
          for (const r of visibleRows) next.delete(r.unprovenRowId);
        }
        return next;
      });
    },
    [visibleRows],
  );

  const pushToast = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 6000);
  }, []);

  const handleQueryError = useCallback(() => {
    if (!query.error) return;
    const e = query.error as Error | QuarantineApiError;
    if (e instanceof QuarantineApiError && e.status === 404) {
      pushToast('warning', 'Row not found, refreshing list…');
      void query.refetch();
    } else {
      pushToast('error', `Failed to load quarantine list: ${e.message}`);
    }
  }, [query, pushToast]);

  React.useEffect(() => {
    if (query.isError) handleQueryError();
    // intentional: only run when the error toggles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.isError]);

  const onRouteRow = useCallback((row: QuarantineRowResponse) => {
    setRouteTargetIds([row.unprovenRowId]);
    setRouteContextLabel(`PropId ${row.propId} · imprv ${row.imprvId}/${row.imprvDetId} · ${row.iAttrValCd}`);
  }, []);

  const onDismissRow = useCallback((row: QuarantineRowResponse) => {
    setDismissTargetIds([row.unprovenRowId]);
    setDismissContextLabel(`PropId ${row.propId} · imprv ${row.imprvId}/${row.imprvDetId} · ${row.iAttrValCd}`);
  }, []);

  const onBulkRoute = useCallback(() => {
    if (selectedIds.size === 0) return;
    setRouteTargetIds([...selectedIds]);
    setRouteContextLabel(`${selectedIds.size} selected rows`);
  }, [selectedIds]);

  const onBulkDismiss = useCallback(() => {
    if (selectedIds.size === 0) return;
    setDismissTargetIds([...selectedIds]);
    setDismissContextLabel(`${selectedIds.size} selected rows`);
  }, [selectedIds]);

  const onModalSubmitted = useCallback(() => {
    setSelectedIds(new Set());
    pushToast('success', 'Decision recorded.');
  }, [pushToast]);

  const totalOnPage = query.data?.items.length ?? 0;

  return (
    <main
      className='p-6'
      aria-label='Sync Quarantine Triage'
      data-testid='sync-quarantine-page'
      data-state={query.isFetching ? 'refreshing' : query.isError ? 'error' : 'loaded'}
    >
      <header className='mb-4'>
        <h1 className='tf-text font-semibold' style={{ fontSize: '1.4rem' }}>
          TerraFusion · Workbench · Improvement-Attr Quarantine
        </h1>
        <p className='tf-text-secondary' style={{ fontSize: '0.9rem' }}>
          Triage imprv_attr quarantine cohort: route to a target universe / dictionary
          code, or dismiss as noise / legitimate-missing / conversion artifact. Decisions
          are recorded on the sibling triage table; the doctrine quarantine row is never
          mutated.{' '}
          <span className='tf-text' data-testid='count-badge'>
            {visibleRows.length}
          </span>{' '}
          shown
          {filter.status !== 'All' ? ` (status=${filter.status})` : ''} · {totalOnPage} fetched on page
        </p>
      </header>

      <div className='flex items-center gap-4 my-4' style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          type='button'
          aria-label='Refresh quarantine list'
          data-testid='refresh-button'
          className='tf-status-info'
          style={{
            padding: '6px 12px',
            borderRadius: 3,
            fontWeight: 600,
            fontSize: '0.85rem',
            opacity: query.isFetching ? 0.6 : 1,
            cursor: query.isFetching ? 'not-allowed' : 'pointer',
          }}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {query.isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
        <span className='tf-text-secondary' style={{ fontSize: '0.85rem' }}>
          {query.dataUpdatedAt
            ? `last refresh: ${new Date(query.dataUpdatedAt).toLocaleTimeString()}`
            : 'no fetch yet'}
          {' · staleTime 30s · refetch on window focus'}
        </span>
      </div>

      <QuarantineFilterBar value={filter} onChange={onFilterChange} disabled={query.isFetching} />

      {selectedIds.size > 0 && (
        <div
          data-testid='bulk-actions-bar'
          className='tf-panel p-2 mt-4'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '8px 12px',
            border: '1px solid var(--tf-border)',
            borderRadius: 3,
          }}
        >
          <span className='tf-text-secondary' style={{ fontSize: '0.85rem' }}>
            <strong className='tf-text'>{selectedIds.size}</strong> rows selected
            <button
              type='button'
              aria-label='Clear selection'
              data-testid='bulk-clear-selection'
              onClick={() => setSelectedIds(new Set())}
              className='tf-text-secondary'
              style={{
                marginLeft: 8,
                padding: '2px 6px',
                background: 'transparent',
                border: '1px solid var(--tf-border)',
                borderRadius: 3,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              clear
            </button>
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type='button'
              aria-label='Bulk route selected rows'
              data-testid='bulk-route-button'
              onClick={onBulkRoute}
              className='tf-status-success'
              style={{
                padding: '4px 10px',
                borderRadius: 3,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Bulk Route
            </button>
            <button
              type='button'
              aria-label='Bulk dismiss selected rows'
              data-testid='bulk-dismiss-button'
              onClick={onBulkDismiss}
              className='tf-status-warning'
              style={{
                padding: '4px 10px',
                borderRadius: 3,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Bulk Dismiss
            </button>
          </div>
        </div>
      )}

      {query.isLoading && !query.data && (
        <p className='tf-text-secondary' data-testid='quarantine-loading' style={{ marginTop: 12 }}>
          Loading quarantine rows…
        </p>
      )}

      {query.isError && (
        <p
          className='tf-status-error p-3 rounded'
          data-testid='quarantine-error'
          style={{ marginTop: 12, padding: 12, borderRadius: 3 }}
        >
          Failed to load quarantine list.{' '}
          <button
            type='button'
            data-testid='quarantine-error-retry'
            onClick={() => void query.refetch()}
            className='tf-status-info'
            style={{ padding: '2px 8px', borderRadius: 3, marginLeft: 8, cursor: 'pointer' }}
          >
            Retry
          </button>
        </p>
      )}

      {(query.data || !query.isLoading) && (
        <QuarantineTable
          rows={visibleRows}
          selectedIds={selectedIds}
          onToggleRow={onToggleRow}
          onToggleAll={onToggleAll}
          onRouteRow={onRouteRow}
          onDismissRow={onDismissRow}
          page={page}
          pageSize={pageSize}
          hasNextPage={hasNextPage}
          onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
          onNextPage={() => setPage((p) => p + 1)}
          onPageSizeChange={onPageSizeChange}
          isFetching={query.isFetching}
        />
      )}

      <QuarantineRouteModal
        open={routeTargetIds !== null}
        rowIds={routeTargetIds ?? []}
        contextLabel={routeContextLabel}
        onClose={() => {
          setRouteTargetIds(null);
          setRouteContextLabel(undefined);
        }}
        onSubmitted={onModalSubmitted}
      />

      <QuarantineDismissModal
        open={dismissTargetIds !== null}
        rowIds={dismissTargetIds ?? []}
        contextLabel={dismissContextLabel}
        onClose={() => {
          setDismissTargetIds(null);
          setDismissContextLabel(undefined);
        }}
        onSubmitted={onModalSubmitted}
      />

      {toasts.length > 0 && (
        <div
          data-testid='toast-container'
          aria-live='polite'
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            zIndex: 60,
            maxWidth: 380,
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              data-testid={`toast-${t.kind}`}
              className={`tf-status-${toastClassSuffix(t.kind)}`}
              style={{
                padding: '8px 12px',
                borderRadius: 3,
                fontSize: '0.85rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function normalizeStatus(raw: string): TriageStatus {
  if (raw === 'Routed' || raw === 'Dismissed' || raw === 'Open') return raw;
  return 'Open';
}

function toastClassSuffix(kind: ToastKind): string {
  switch (kind) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'info':
    default:
      return 'info';
  }
}
