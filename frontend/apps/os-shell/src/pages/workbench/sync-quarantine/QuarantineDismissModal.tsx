/**
 * SYNC-UX-1A: dismiss-decision modal (single + bulk).
 *
 * Form: DismissalReason (3 closed values), Operator Note. Submission
 * pattern mirrors QuarantineRouteModal — N parallel POSTs with a
 * concurrency cap, per-row outcome rendering, modal stays open on
 * partial failure so the operator can see exactly which rows
 * conflicted.
 */

import React, { useEffect, useState } from 'react';
import {
  DismissalReasons,
  QuarantineApiError,
  type DismissRequestBody,
  type DismissalReason,
} from '@/api/syncQuarantine';
import { useDismissQuarantineMutation } from './useQuarantineMutations';

interface QuarantineDismissModalProps {
  open: boolean;
  rowIds: readonly string[];
  contextLabel?: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function QuarantineDismissModal({
  open,
  rowIds,
  contextLabel,
  onClose,
  onSubmitted,
}: QuarantineDismissModalProps): React.ReactElement | null {
  const mutation = useDismissQuarantineMutation();
  const [reason, setReason] = useState<DismissalReason | ''>('');
  const [note, setNote] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setNote('');
      setValidationError(null);
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!reason) {
      setValidationError('Dismissal reason is required.');
      return;
    }
    setValidationError(null);
    const body: DismissRequestBody = {
      DismissalReason: reason,
      OperatorNote: note.trim() === '' ? null : note.trim(),
    };
    try {
      const results = await mutation.submit(rowIds, body);
      const allOk = results.every((r) => r.status === 'ok');
      if (allOk) {
        onSubmitted();
        onClose();
      }
    } catch {
      // captured in mutation state
    }
  };

  const errorRows = mutation.results.filter((r) => r.status === 'error');

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label='Dismiss quarantine rows'
      data-testid='dismiss-modal'
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
            Dismiss {rowIds.length === 1 ? '1 quarantine row' : `${rowIds.length} quarantine rows`}
          </h2>
          {contextLabel && (
            <p className='tf-text-secondary' style={{ fontSize: '0.8rem', marginTop: 4 }}>
              {contextLabel}
            </p>
          )}
        </header>

        <label className='tf-text-secondary' style={{ display: 'block', fontSize: '0.85rem', marginBottom: 8 }}>
          Dismissal reason <span className='tf-status-error' style={{ padding: '0 4px' }}>required</span>
          <select
            aria-label='Dismissal reason'
            data-testid='dismiss-reason'
            value={reason}
            onChange={(e) => setReason(e.target.value as DismissalReason | '')}
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
            <option value=''>Select a reason…</option>
            {DismissalReasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className='tf-text-secondary' style={{ display: 'block', fontSize: '0.85rem', marginBottom: 8 }}>
          Operator note <span style={{ opacity: 0.7 }}>(optional, audit-visible)</span>
          <textarea
            aria-label='Operator note'
            data-testid='dismiss-operator-note'
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
            data-testid='dismiss-validation-error'
            style={{ padding: '6px 8px', borderRadius: 3, fontSize: '0.85rem' }}
          >
            {validationError}
          </p>
        )}

        {mutation.isRunning && (
          <div
            data-testid='dismiss-progress'
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
            data-testid='dismiss-error-summary'
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
            aria-label='Cancel dismiss'
            data-testid='dismiss-cancel-button'
            onClick={onClose}
            disabled={mutation.isRunning}
            className='tf-status-info'
            style={{ padding: '6px 12px', borderRadius: 3, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type='submit'
            aria-label='Submit dismiss decision'
            data-testid='dismiss-submit-button'
            disabled={mutation.isRunning}
            className='tf-status-warning'
            style={{
              padding: '6px 12px',
              borderRadius: 3,
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: mutation.isRunning ? 'not-allowed' : 'pointer',
              opacity: mutation.isRunning ? 0.7 : 1,
            }}
          >
            {mutation.isRunning ? 'Dismissing…' : 'Dismiss'}
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
        : 'conflict: existing decision differs';
    if (error.status === 400)
      return error.body?.error ? `invalid: ${error.body.error}` : 'invalid input';
    return error.body?.error ? `${error.status}: ${error.body.error}` : `HTTP ${error.status}`;
  }
  return error.message;
}
