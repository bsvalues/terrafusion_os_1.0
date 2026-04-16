/**
 * SupervisorFlagQueue.tsx
 *
 * TerraDais — Supervisor Workbench Flag Queue
 * ──────────────────────────────────────────────
 * Shows all open PropertyWorkbenchFlags (PENDING_REVIEW + RECONCILIATION_PENDING).
 * Supervisor can approve or reject each flag with an optional note.
 * Every action requires an explicit confirmation checkbox (human-gate pattern).
 *
 * Data flow:
 *   GET  /api/workbench/flags?status=PENDING_REVIEW,RECONCILIATION_PENDING
 *   PATCH /api/workbench/flags/{id}/status  →  { status, supervisorNote }
 */

import React, { useCallback, useEffect, useState } from 'react';
import { apiFetchJson } from '@/lib/apiBase';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FlagSummary {
  id: number;
  parcelId: string;
  status: string;
  reason: string;
  createdAt: string;
  createdBy: string;
}

interface FlagPageResult {
  total: number;
  page: number;
  pageSize: number;
  items: FlagSummary[];
}

interface FlagResolutionResult {
  id: number;
  parcelId: string;
  status: string;
  resolvedBy: string;
  resolvedAt: string;
}

// ─── Status badge helpers ─────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW: 'Field Review',
  RECONCILIATION_PENDING: 'Recon Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING_REVIEW: 'hsl(var(--tf-warning))',
  RECONCILIATION_PENDING: 'hsl(var(--tf-suite-forge))',
  APPROVED: 'hsl(var(--tf-success))',
  REJECTED: 'hsl(var(--tf-error, 0 80% 60%))',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
      style={{
        background: `${STATUS_COLOR[status] ?? 'hsl(var(--tf-muted))'} / 0.15`,
        color: STATUS_COLOR[status] ?? 'hsl(var(--tf-muted))',
        border: `1px solid ${STATUS_COLOR[status] ?? 'hsl(var(--tf-muted))'} / 0.3`,
      }}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// ─── Resolution row ────────────────────────────────────────────────────────────

interface ResolutionRowProps {
  flag: FlagSummary;
  onResolved: (id: number, result: FlagResolutionResult) => void;
}

function ResolutionRow({ flag, onResolved }: ResolutionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [supervisorNote, setSupervisorNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResolve = useCallback(
    async (status: 'APPROVED' | 'REJECTED') => {
      if (!confirmed) return;
      setPending(true);
      setError(null);
      try {
        const result = await apiFetchJson<FlagResolutionResult>(
          `/api/workbench/flags/${flag.id}/status`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, supervisorNote: supervisorNote.trim() || undefined }),
          }
        );
        onResolved(flag.id, result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Action failed. Try again.');
        setPending(false);
      }
    },
    [confirmed, supervisorNote, flag.id, onResolved]
  );

  // Parse reason JSON if possible
  let reasonLabel = flag.reason;
  let reasonMeta: Record<string, unknown> = {};
  try {
    reasonMeta = JSON.parse(flag.reason) as Record<string, unknown>;
    const method = reasonMeta['method'] as string | undefined;
    const finalValue = reasonMeta['finalValue'] as number | undefined;
    const taxYear = reasonMeta['taxYear'] as number | undefined;
    if (method || finalValue) {
      reasonLabel = [method, finalValue != null ? `$${finalValue.toLocaleString()}` : null, taxYear]
        .filter(Boolean)
        .join(' · ');
    } else {
      reasonLabel = Object.entries(reasonMeta)
        .filter(([k]) => !['supervisorNote', 'resolvedBy', 'resolvedAt'].includes(k))
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ');
    }
  } catch {
    // plain string — use as-is
  }

  const isTerminal = ['APPROVED', 'REJECTED'].includes(flag.status);

  return (
    <div
      data-testid={`flag-row-${flag.id}`}
      className="rounded-xl border"
      style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.45)' }}
    >
      {/* Summary row */}
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => !isTerminal && setExpanded((v) => !v)}
        role={!isTerminal ? 'button' : undefined}
        aria-expanded={expanded}
      >
        <StatusBadge status={flag.status} />
        <span className="font-mono text-xs" style={{ color: 'hsl(var(--tf-suite-dais))' }}>
          {flag.parcelId}
        </span>
        <span className="text-xs flex-1 truncate" style={{ color: 'hsl(var(--tf-fg))' }}>
          {reasonLabel}
        </span>
        <span className="text-[10px] shrink-0" style={{ color: 'hsl(var(--tf-muted))' }}>
          {new Date(flag.createdAt).toLocaleDateString()} · {flag.createdBy}
        </span>
        {!isTerminal && (
          <span className="text-[10px] shrink-0" style={{ color: 'hsl(var(--tf-muted))' }}>
            {expanded ? '▲' : '▼'}
          </span>
        )}
      </div>

      {/* Expand: resolution panel */}
      {!isTerminal && expanded && (
        <div
          className="px-4 pb-4 space-y-3 border-t"
          style={{ borderColor: 'hsl(var(--tf-border) / 0.5)' }}
        >
          {/* Full reason detail */}
          {Object.keys(reasonMeta).length > 0 && (
            <div
              className="rounded-lg p-3 text-xs space-y-1"
              style={{ background: 'hsl(var(--tf-bg) / 0.5)', color: 'hsl(var(--tf-muted))' }}
            >
              {Object.entries(reasonMeta)
                .filter(([k]) => !['supervisorNote', 'resolvedBy', 'resolvedAt'].includes(k))
                .map(([k, v]) => (
                  <div key={k}>
                    <span className="font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{k}: </span>
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </div>
                ))}
            </div>
          )}

          {/* Supervisor note */}
          <div>
            <label
              className="block text-xs font-semibold mb-1"
              style={{ color: 'hsl(var(--tf-muted))' }}
            >
              Supervisor Note (optional, max 500 chars)
            </label>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
              style={{
                borderColor: 'hsl(var(--tf-border))',
                background: 'hsl(var(--tf-bg) / 0.7)',
                color: 'hsl(var(--tf-fg))',
              }}
              rows={2}
              maxLength={500}
              value={supervisorNote}
              onChange={(e) => setSupervisorNote(e.target.value)}
              placeholder="Optional note for the record…"
            />
          </div>

          {/* Human gate */}
          <label className="flex items-start gap-2 cursor-pointer text-sm" style={{ color: 'hsl(var(--tf-fg))' }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5"
            />
            I have reviewed this flag and confirm my decision
          </label>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleResolve('APPROVED')}
              disabled={!confirmed || pending}
              className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{
                background: 'hsl(var(--tf-success) / 0.18)',
                color: 'hsl(var(--tf-success))',
                border: '1px solid hsl(var(--tf-success) / 0.3)',
              }}
            >
              {pending ? 'Saving…' : 'Approve'}
            </button>
            <button
              onClick={() => handleResolve('REJECTED')}
              disabled={!confirmed || pending}
              className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{
                background: 'hsl(var(--tf-error, 0 80% 60%) / 0.15)',
                color: 'hsl(var(--tf-error, 0 80% 60%))',
                border: '1px solid hsl(var(--tf-error, 0 80% 60%) / 0.25)',
              }}
            >
              {pending ? 'Saving…' : 'Reject'}
            </button>
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'hsl(var(--tf-error, 0 80% 60%))' }}>{error}</p>
          )}
        </div>
      )}

      {/* Terminal: resolved indicator */}
      {isTerminal && (
        <div
          className="px-4 pb-3 text-xs"
          style={{ color: 'hsl(var(--tf-muted))' }}
        >
          Resolved {flag.status.toLowerCase()} by {flag.createdBy} · {new Date(flag.createdAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SupervisorFlagQueueProps {
  /** When provided, filters to a single parcel's flags */
  parcelId?: string;
  /** Default: shows open flags only. Pass "ALL" to include resolved. */
  showAll?: boolean;
}

export default function SupervisorFlagQueue({ parcelId, showAll = false }: SupervisorFlagQueueProps) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<FlagPageResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number) => {
      setPhase('loading');
      setError(null);
      try {
        const statusParam = showAll ? '' : 'PENDING_REVIEW,RECONCILIATION_PENDING';
        const parcelParam = parcelId ? `&parcelId=${encodeURIComponent(parcelId)}` : '';
        const statusQuery = statusParam ? `status=${encodeURIComponent(statusParam)}&` : '';
        const result = await apiFetchJson<FlagPageResult>(
          `/api/workbench/flags?${statusQuery}page=${p}&pageSize=20${parcelParam}`
        );
        setData(result);
        setPhase('success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load flags.');
        setPhase('error');
      }
    },
    [parcelId, showAll]
  );

  useEffect(() => {
    void load(page);
  }, [load, page]);

  const handleResolved = useCallback(
    (id: number, result: FlagResolutionResult) => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((f) =>
            f.id === id ? { ...f, status: result.status, createdBy: result.resolvedBy } : f
          ),
        };
      });
    },
    []
  );

  const openCount = data?.items.filter((f) => ['PENDING_REVIEW', 'RECONCILIATION_PENDING'].includes(f.status)).length ?? 0;

  return (
    <div
      data-testid="supervisor-flag-queue"
      className="rounded-xl border p-5 space-y-4"
      style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.5)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: 'hsl(var(--tf-muted))' }}
          >
            Supervisor Review
          </p>
          <h2 className="mt-1 text-base font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>
            Workbench Flag Queue
            {phase === 'success' && openCount > 0 && (
              <span
                className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold"
                style={{ background: 'hsl(var(--tf-warning) / 0.18)', color: 'hsl(var(--tf-warning))' }}
              >
                {openCount} open
              </span>
            )}
          </h2>
          <p className="mt-1 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
            Field inspection flags (PENDING_REVIEW) and reconciliation submissions (RECONCILIATION_PENDING) awaiting supervisor action.
          </p>
        </div>
        <button
          onClick={() => void load(page)}
          disabled={phase === 'loading'}
          className="rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition-opacity disabled:opacity-50"
          style={{
            borderColor: 'hsl(var(--tf-suite-dais) / 0.35)',
            background: 'hsl(var(--tf-suite-dais) / 0.12)',
            color: 'hsl(var(--tf-suite-dais))',
          }}
        >
          {phase === 'loading' ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* Loading */}
      {phase === 'loading' && (
        <div className="flex items-center gap-3 py-6 justify-center" role="status">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: 'hsl(var(--tf-muted) / 0.3)', borderTopColor: 'hsl(var(--tf-fg))' }}
          />
          <span className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Loading flags…</span>
        </div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: 'hsl(var(--tf-suite-dais) / 0.24)', background: 'hsl(var(--tf-suite-dais) / 0.08)', color: 'hsl(var(--tf-suite-dais))' }}
        >
          {error}
        </div>
      )}

      {/* Empty */}
      {phase === 'success' && data && data.items.length === 0 && (
        <div className="py-8 text-center text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
          No flags pending review.
        </div>
      )}

      {/* Flag list */}
      {phase === 'success' && data && data.items.length > 0 && (
        <div className="space-y-2">
          {data.items.map((flag) => (
            <ResolutionRow key={flag.id} flag={flag} onResolved={handleResolved} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {phase === 'success' && data && data.total > data.pageSize && (
        <div className="flex items-center justify-between pt-2 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
          <span>{data.total} total · page {data.page}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={data.page <= 1}
              className="rounded border px-2 py-1 disabled:opacity-40"
              style={{ borderColor: 'hsl(var(--tf-border))' }}
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={data.page * data.pageSize >= data.total}
              className="rounded border px-2 py-1 disabled:opacity-40"
              style={{ borderColor: 'hsl(var(--tf-border))' }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
