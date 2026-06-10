/**
 * SYNC-UX-1A: route-decision modal (single + bulk).
 *
 * Form: Target Universe (closed dropdown), Target IAttrValCd (text),
 * Operator Note (textarea). Submits one or N parallel route POSTs
 * via useRouteQuarantineMutation. Stays open on conflict so the
 * operator can read the per-row error and amend the target without
 * losing form state.
 */

import React, { useEffect, useState } from 'react';
import {
  QuarantineApiError,
  UniverseCodes,
  type RouteRequestBody,
  type UniverseCode,
} from '@/api/syncQuarantine';
import { useRouteQuarantineMutation } from './useQuarantineMutations';

interface QuarantineRouteModalProps {
  open: boolean;
  rowIds: readonly string[];
  /** Optional summary line for the bulk header (e.g. "PropId 12345" for single). */
  contextLabel?: string;
  onClose: () => void;
  /** Called after a successful, all-rows-accepted submission. */
  onSubmitted: () => void;
}

export default function QuarantineRouteModal({
  open,
  rowIds,
  contextLabel,
  onClose,
  onSubmitted,
}: QuarantineRouteModalProps): React.ReactElement | null {
  const mutation = useRouteQuarantineMutation();
  const [targetUniverse, setTargetUniverse] = useState<UniverseCode | ''>('');
  const [targetCode, setTargetCode] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form whenever the modal opens.
  useEffect(() => {
    if (open) {
      setTargetUniverse('');
      setTargetCode('');
      setNote('');
      setValidationError(null);
      mutation.reset();
    }
    // mutation.reset is stable; intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!targetUniverse) {
      setValidationError('Target universe is required.');
      return;
    }
    setValidationError(null);
    const body: RouteRequestBody = {
      TargetUniverse: targetUniverse,
      TargetIAttrValCd: targetCode.trim() === '' ? null : targetCode.trim(),
      OperatorNote: note.trim() === '' ? null : note.trim(),
    };
    try {
      const results = await mutation.submit(rowIds, body);
      const allOk = results.every((r) => r.status === 'ok');
      if (allOk) {
        onSubmitted();
        onClose();
      }
      // else: keep modal open so operator can review per-row errors
    } catch {
      // mutation already captured the top-level error in state
    }
  };

  const errorRows = mutation.results.filter((r) => r.status === 'error');

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label='Route quarantine rows'
      data-testid='route-modal'
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !mutation.isRunning) onClose();
      }}
    >
      <form
        onSubmit={onSubmit}
        className='tf-panel p-4'
        style={{
          width: 'min(560px, 92vw)',
          maxHeight: '90vh',
          overflow: 'auto',
          background: 'var(--tf-bg, #0f172a)',
          border: '1px solid var(--tf-border)',
          borderRadius: 6,
        }}
      >
        <header style={{ marginBottom: 12 }}>
          <h2 className='tf-text font-semibold' style={{ fontSize: '1.05rem', margin: 0 }}>
            Route {rowIds.length === 1 ? '1 quarantine row' : `${rowIds.length} quarantine rows`}
          </h2>
          {contextLabel && (
            <p className='tf-text-secondary' style={{ fontSize: '0.8rem', marginTop: 4 }}>
              {contextLabel}
            </p>
          )}
        </header>

        <label className='tf-text-secondary' style={{ display: 'block', fontSize: '0.85rem', marginBottom: 8 }}>
          Target universe <span className='tf-status-error' style={{ padding: '0 4px' }}>required</span>
          <select
            aria-label='Target universe'
            data-testid='route-target-universe'
            value={targetUniverse}
            onChange={(e) => setTargetUniverse(e.target.value as UniverseCode | '')}
            disabled={mutation.isRunning}
            className='tf-text'
            style={{
              display: 'block',
              width: '100%',
              marginTop: 2,
              padding: '6px 8px',
              background: 'transparent',
              border: '1px solid var(--tf-border)',
              borderRadius: 3,
              fontSize: '0.9rem',
            }}
          >
            <option value=''>Select a universe…</option>
            {UniverseCodes.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>

        <label className='tf-text-secondary' style={{ display: 'block', fontSize: '0.85rem', marginBottom: 8 }}>
          Target IAttrValCd <span style={{ opacity: 0.7 }}>(optional)</span>
          <input
            type='text'
            aria-label='Target IAttrValCd'
            data-testid='route-target-code'
            value={targetCode}
            onChange={(e) => setTargetCode(e.target.value)}
            disabled={mutation.isRunning}
            className='tf-text'
            style={{
              display: 'block',
              width: '100%',
              marginTop: 2,
              padding: '6px 8px',
              background: 'transparent',
              border: '1px solid var(--tf-border)',
              borderRadius: 3,
              fontSize: '0.9rem',
            }}
          />
        </label>

        <label className='tf-text-secondary' style={{ display: 'block', fontSize: '0.85rem', marginBottom: 8 }}>
          Operator note <span style={{ opacity: 0.7 }}>(optional, audit-visible)</span>
          <textarea
            aria-label='Operator note'
            data-testid='route-operator-note'
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={mutation.isRunning}
            rows={3}
            className='tf-text'
            style={{
              display: 'block',
              width: '100%',
              marginTop: 2,
              padding: '6px 8px',
              background: 'transparent',
              border: '1px solid var(--tf-border)',
              borderRadius: 3,
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </label>

        {validationError && (
          <p
            className='tf-status-error'
            data-testid='route-validation-error'
            style={{ padding: '6px 8px', borderRadius: 3, fontSize: '0.85rem' }}
          >
            {validationError}
          </p>
        )}

        {mutation.isRunning && (
          <div
            data-testid='route-progress'
            className='tf-text-secondary'
            style={{ fontSize: '0.85rem', marginTop: 8 }}
          >
            Submitting… {mutation.completed}/{mutation.total}
            <div
              aria-hidden
              style={{
                marginTop: 4,
                height: 4,
                width: '100%',
                background: 'var(--tf-border)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${mutation.total > 0 ? Math.round((mutation.completed / mutation.total) * 100) : 0}%`,
                  background: 'var(--tf-transcend-cyan, #00ffee)',
                  transition: 'width 100ms linear',
                }}
              />
            </div>
          </div>
        )}

        {errorRows.length > 0 && (
          <div
            data-testid='route-error-summary'
            className='tf-status-error'
            style={{ padding: '6px 8px', borderRadius: 3, fontSize: '0.8rem', marginTop: 8 }}
          >
            <strong>{errorRows.length}</strong> of {mutation.results.length} rows failed.
            <ul style={{ marginTop: 4, paddingLeft: 16 }}>
              {errorRows.slice(0, 5).map((r) => (
                <li key={r.unprovenRowId} style={{ wordBreak: 'break-all' }}>
                  <code>{r.unprovenRowId.slice(0, 8)}…</code>{': '}
                  {describeError(r.status === 'error' ? r.error : null)}
                </li>
              ))}
              {errorRows.length > 5 && <li>… and {errorRows.length - 5} more</li>}
            </ul>
          </div>
        )}

        <footer
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--tf-border)',
          }}
        >
          <button
            type='button'
            aria-label='Cancel route'
            data-testid='route-cancel-button'
            onClick={onClose}
            disabled={mutation.isRunning}
            className='tf-status-info'
            style={{ padding: '6px 12px', borderRadius: 3, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type='submit'
            aria-label='Submit route decision'
            data-testid='route-submit-button'
            disabled={mutation.isRunning}
            className='tf-status-success'
            style={{
              padding: '6px 12px',
              borderRadius: 3,
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: mutation.isRunning ? 'not-allowed' : 'pointer',
              opacity: mutation.isRunning ? 0.7 : 1,
            }}
          >
            {mutation.isRunning ? 'Routing…' : 'Route'}
          </button>
        </footer>
      </form>
    </div>
  );
}

function describeError(error: Error | QuarantineApiError | null): string {
  if (!error) return 'unknown error';
  if (error instanceof QuarantineApiError) {
    if (error.status === 404) return 'row not found (refresh and retry)';
    if (error.status === 409)
      return error.body?.error
        ? `conflict: ${error.body.error}`
        : 'conflict: existing decision differs (dismiss first then re-route)';
    if (error.status === 400)
      return error.body?.error ? `invalid: ${error.body.error}` : 'invalid input';
    return error.body?.error ? `${error.status}: ${error.body.error}` : `HTTP ${error.status}`;
  }
  return error.message;
}
