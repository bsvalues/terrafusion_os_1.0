/**
 * ═══════════════════════════════════════════════════════════════
 * WORKBENCH-V0.2 SLICE-I: QUARANTINE REVIEW PANEL
 *
 * Browse imprv_attr quarantine rows and save append-only review
 * decisions through the Slice I backend endpoints.
 *
 * Scope: UI only. No drain execution. No canonical mutation.
 * No quarantine release. No approval flow. No bulk disposition.
 * No F2. No history lanes.
 *
 * Doctrine invariants displayed at all times:
 *   - ACCEPT_AS_IS = reviewed + acknowledged only. NOT promoted.
 *   - Review decisions do not release quarantine records.
 *   - Source rows are never mutated.
 *   - Lane: imprv_attr (fixed for this slice).
 *
 * Per docs/sync/workbench/SLICE_I_QUARANTINE_REVIEW_CONTRACT.md.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  ReviewDispositions,
  type ReviewDisposition,
  type QuarantineReviewRow,
  saveQuarantineReviewDecision,
  QuarantineReviewApiError,
} from '@/api/syncQuarantineReview';
import { useQuarantineReview } from './useQuarantineReview';

// ── Disposition labels ─────────────────────────────────────────────────────────

const DISPOSITION_LABELS: Record<ReviewDisposition, string> = {
  ACCEPT_AS_IS: 'Accept as-is',
  REJECT_PERMANENTLY: 'Reject permanently',
  NEEDS_RESEARCH: 'Needs research',
};

// ── Disposition chip colours ───────────────────────────────────────────────────

function dispositionClass(d: string): string {
  if (d === 'ACCEPT_AS_IS') return 'tf-status-info';
  if (d === 'REJECT_PERMANENTLY') return 'tf-status-error';
  if (d === 'NEEDS_RESEARCH') return 'tf-status-warning';
  // UNREVIEWED
  return 'tf-status-info';
}

// ── Per-row save state ─────────────────────────────────────────────────────────

interface RowSaveState {
  saving: boolean;
  error: string | null;
  savedAt: string | null;
  savedDisposition: string | null;
}

// ── QuarantineReviewCard ───────────────────────────────────────────────────────

interface ReviewCardProps {
  row: QuarantineReviewRow;
  onSaved: (ref: string, disposition: string, savedAt: string) => void;
}

function QuarantineReviewCard({ row, onSaved }: ReviewCardProps): React.ReactElement {
  const [selectedDisposition, setSelectedDisposition] = useState<ReviewDisposition | null>(null);
  const [note, setNote] = useState('');
  const [saveState, setSaveState] = useState<RowSaveState>({
    saving: false,
    error: null,
    savedAt: null,
    savedDisposition: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const handleSave = useCallback(async () => {
    if (!selectedDisposition) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setSaveState({ saving: true, error: null, savedAt: null, savedDisposition: null });

    try {
      const result = await saveQuarantineReviewDecision(
        row.quarantineRowRef,
        {
          lane: 'imprv_attr',
          disposition: selectedDisposition,
          note: note.trim() || undefined,
          operatorIdentity: 'operator',
        },
        ctrl.signal,
      );

      if (!ctrl.signal.aborted) {
        setSaveState({
          saving: false,
          error: null,
          savedAt: result.savedAt,
          savedDisposition: result.disposition,
        });
        onSaved(row.quarantineRowRef, result.disposition, result.savedAt);
      }
    } catch (err) {
      if (!ctrl.signal.aborted) {
        const msg =
          err instanceof QuarantineReviewApiError
            ? (err.body?.error ?? err.message)
            : err instanceof Error
              ? err.message
              : 'Save failed.';
        setSaveState({ saving: false, error: msg, savedAt: null, savedDisposition: null });
      }
    }
  }, [row.quarantineRowRef, selectedDisposition, note, onSaved]);

  const currentDisp = saveState.savedDisposition ?? row.currentDisposition;
  const lastReviewedAt = saveState.savedAt ?? row.reviewedAt;

  return (
    <div
      className="tf-panel mb-3 p-4"
      data-testid="quarantine-review-card"
      data-row-ref={row.quarantineRowRef}
    >
      {/* ── Source row identity ─────────────────────────────────── */}
      <div className="mb-2 flex flex-wrap items-start gap-x-4 gap-y-1">
        <span className="tf-text font-mono text-xs" data-testid="row-ref-display">
          {row.quarantineRowRef}
        </span>
        <span className="tf-text-secondary text-xs">
          Prop {row.propId} · ImprvDet {row.imprvDetId} · AttrValId {row.iAttrValId}
        </span>
        <span className="tf-text-secondary text-xs font-mono">{row.iAttrValCd}</span>
        {row.attrValueText && (
          <span className="tf-text-secondary text-xs">= {row.attrValueText}</span>
        )}
        {row.attrValueNumeric != null && (
          <span className="tf-text-secondary text-xs">= {row.attrValueNumeric}</span>
        )}
      </div>

      {/* ── Quarantine reason + universe ────────────────────────── */}
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          className="tf-status-error rounded px-2 py-0.5 text-xs font-semibold"
          data-testid="quarantine-reason"
        >
          {row.quarantineReason}
        </span>
        {row.quarantineReasonDetail && (
          <span className="tf-text-secondary text-xs">{row.quarantineReasonDetail}</span>
        )}
        {row.universeCode && (
          <span className="tf-status-info rounded px-2 py-0.5 text-xs">
            {row.universeCode}
          </span>
        )}
      </div>

      {/* ── Current disposition ─────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="tf-text-secondary text-xs">Current disposition:</span>
        <span
          className={`rounded px-2 py-0.5 text-xs font-semibold ${dispositionClass(currentDisp)}`}
          data-testid="current-disposition"
        >
          {currentDisp}
        </span>
        {lastReviewedAt && (
          <span className="tf-text-secondary text-xs">
            saved {new Date(lastReviewedAt).toLocaleString()}
          </span>
        )}
        {(row.reviewedBy ?? null) && !saveState.savedAt && (
          <span className="tf-text-secondary text-xs">by {row.reviewedBy}</span>
        )}
      </div>

      {/* ── Review controls ─────────────────────────────────────── */}
      <fieldset className="mb-2" data-testid="disposition-fieldset">
        <legend className="tf-text-secondary mb-1 text-xs">Set disposition:</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {ReviewDispositions.map((d) => (
            <label
              key={d}
              className="flex cursor-pointer items-center gap-1.5"
              data-testid={`radio-label-${d}`}
            >
              <input
                type="radio"
                name={`disposition-${row.quarantineRowRef}`}
                value={d}
                checked={selectedDisposition === d}
                onChange={() => setSelectedDisposition(d)}
                disabled={saveState.saving}
                data-testid={`radio-${d}`}
                aria-label={DISPOSITION_LABELS[d]}
              />
              <span className="tf-text text-sm">{DISPOSITION_LABELS[d]}</span>
            </label>
          ))}
        </div>
        {selectedDisposition === 'ACCEPT_AS_IS' && (
          <p
            className="tf-text-secondary mt-1 text-xs"
            data-testid="accept-notice"
          >
            Accept as-is means reviewed + acknowledged only. This does not promote the record.
          </p>
        )}
      </fieldset>

      {/* ── Note textarea ─────────────────────────────────────────── */}
      <textarea
        className="tf-panel mb-2 w-full resize-y rounded p-2 text-sm"
        rows={2}
        maxLength={500}
        placeholder="Operator note (optional, max 500 chars)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={saveState.saving}
        data-testid="note-textarea"
        aria-label="Operator note"
      />

      {/* ── Save button ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="tf-panel rounded px-4 py-1.5 text-sm font-semibold disabled:opacity-50"
          disabled={!selectedDisposition || saveState.saving}
          onClick={() => void handleSave()}
          data-testid="save-button"
          aria-label="Save review decision"
        >
          {saveState.saving ? 'Saving…' : 'Save'}
        </button>

        {saveState.error && (
          <span
            className="tf-status-error text-xs"
            role="alert"
            data-testid="save-error"
          >
            {saveState.error}
          </span>
        )}

        {saveState.savedAt && !saveState.error && (
          <span
            className="tf-status-success text-xs"
            role="status"
            data-testid="save-success"
          >
            Saved {new Date(saveState.savedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* ── Doctrine notice ───────────────────────────────────────── */}
      <p className="tf-text-secondary mt-2 text-xs" data-testid="doctrine-notice">
        Review decisions are append-only and do not release quarantine records.
      </p>
    </div>
  );
}

// ── SyncQuarantineReviewPage ───────────────────────────────────────────────────

export default function SyncQuarantineReviewPage(): React.ReactElement {
  const query = useQuarantineReview(50);

  // Track in-session disposition overrides so refreshed rows reflect the
  // latest save without a full refetch.
  const [sessionOverrides, setSessionOverrides] = useState<
    Map<string, { disposition: string; savedAt: string }>
  >(new Map());

  const handleSaved = useCallback((ref: string, disposition: string, savedAt: string) => {
    setSessionOverrides((prev) => {
      const next = new Map(prev);
      next.set(ref, { disposition, savedAt });
      return next;
    });
  }, []);

  const handleRefresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  // Apply session overrides onto server data
  const rows = (query.data?.items ?? []).map((r) => {
    const override = sessionOverrides.get(r.quarantineRowRef);
    if (!override) return r;
    return {
      ...r,
      currentDisposition: override.disposition as QuarantineReviewRow['currentDisposition'],
      reviewedAt: override.savedAt,
    };
  });

  const totalSourceCount = query.data?.totalSourceCount ?? 0;
  const returnedCount = query.data?.returnedCount ?? 0;

  return (
    <div className="tf-text mx-auto max-w-5xl p-6" data-testid="sync-quarantine-review-page">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" data-testid="page-title">
            Quarantine Review
          </h1>
          <p className="tf-text-secondary text-sm">
            Lane:{' '}
            <span className="font-mono font-semibold" data-testid="lane-label">
              imprv_attr
            </span>
            {' · '}
            Showing{' '}
            <span
              className="font-mono tabular-nums font-semibold"
              data-testid="returned-count"
            >
              {returnedCount}
            </span>{' '}
            of{' '}
            <span
              className="font-mono tabular-nums font-semibold"
              data-testid="total-count"
            >
              {totalSourceCount}
            </span>{' '}
            quarantine rows
          </p>
        </div>

        <button
          type="button"
          className="tf-panel rounded px-3 py-1.5 text-sm"
          onClick={handleRefresh}
          disabled={query.isFetching}
          data-testid="refresh-button"
          aria-label="Refresh quarantine list"
        >
          {query.isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── Doctrine banner ───────────────────────────────────────── */}
      <div
        className="tf-status-info mb-4 rounded p-3 text-sm"
        role="note"
        data-testid="doctrine-banner"
      >
        <strong>Note:</strong> ACCEPT_AS_IS records operator acknowledgement only — it does not
        promote the record to canonical. Review decisions are append-only. Source quarantine rows
        are never mutated.
      </div>

      {/* ── Error state ───────────────────────────────────────────── */}
      {query.isError && (
        <div
          className="tf-status-error mb-4 rounded p-3 text-sm"
          role="alert"
          data-testid="load-error"
        >
          {query.error instanceof Error ? query.error.message : 'Failed to load quarantine rows.'}
        </div>
      )}

      {/* ── Loading state ─────────────────────────────────────────── */}
      {query.isLoading && (
        <div
          className="tf-text-secondary py-8 text-center text-sm"
          data-testid="loading-state"
        >
          Loading quarantine rows…
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────── */}
      {!query.isLoading && !query.isError && rows.length === 0 && (
        <div
          className="tf-text-secondary py-8 text-center text-sm"
          data-testid="empty-state"
        >
          No quarantine records for imprv_attr.
        </div>
      )}

      {/* ── Row list ──────────────────────────────────────────────── */}
      {rows.length > 0 && (
        <div data-testid="quarantine-review-list">
          {rows.map((row) => (
            <QuarantineReviewCard key={row.quarantineRowRef} row={row} onSaved={handleSaved} />
          ))}
        </div>
      )}
    </div>
  );
}
