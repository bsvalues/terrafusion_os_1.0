/**
 * SYNC-UX-1B: New-commit modal.
 *
 * Operator inputs:
 *   - Operator Id (text, required)
 *   - Idempotency Key (text, auto v4 UUID; editable)
 *   - Commit Note (textarea, optional)
 *
 * Outcomes:
 *   - 200 / Created   → onCreated(commitId)  + soft "created" toast
 *   - 200 / Idempotent → onCreated(commitId) + soft "idempotent" toast
 *   - 400              → inline error (input validation)
 *   - 409              → inline soft-warning ("no pending decisions")
 *   - 5xx              → inline generic error
 *
 * The component is uncontrolled w.r.t. mount state — the parent
 * mounts/unmounts it. We do not build a backdrop; the parent panel
 * styling supplies the surface.
 */

import React, { useEffect, useState } from 'react';
import {
  CommitApiError,
  type CommitCreateResponse,
  generateIdempotencyKey,
} from '@/api/syncCommits';
import { useCommitCreate } from './useCommitCreate';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called with the new commitId after a successful Create or Idempotent. */
  onCreated: (response: CommitCreateResponse, isIdempotent: boolean) => void;
}

export default function CommitCreateModal({
  open,
  onClose,
  onCreated,
}: Props): React.ReactElement | null {
  const [operatorId, setOperatorId] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(() => generateIdempotencyKey());
  const [commitNote, setCommitNote] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useCommitCreate();

  // Reset form whenever the modal re-opens. We refresh the idempotency
  // key too so accidental re-opens don't reuse the previous key.
  useEffect(() => {
    if (open) {
      setOperatorId('');
      setIdempotencyKey(generateIdempotencyKey());
      setCommitNote('');
      setValidationError(null);
      mutation.reset();
    }
    // mutation.reset is stable for the lifetime of the mutation object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedOperator = operatorId.trim();
    if (!trimmedOperator) {
      setValidationError('Operator Id is required.');
      return;
    }
    if (!idempotencyKey.trim()) {
      setValidationError('Idempotency key is required.');
      return;
    }

    try {
      const result = await mutation.mutateAsync({
        IdempotencyKey: idempotencyKey.trim(),
        OperatorId: trimmedOperator,
        CommitNote: commitNote.trim() ? commitNote.trim() : null,
      });
      onCreated(result.response, result.isIdempotent);
      onClose();
    } catch {
      // Error is surfaced via mutation.error below; nothing to do here.
    }
  };

  const apiError = mutation.error instanceof CommitApiError ? mutation.error : null;
  const isConflict = apiError?.status === 409;

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label='New commit'
      data-testid='commit-create-modal'
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
        zIndex: 50,
      }}
    >
      <form
        onSubmit={handleSubmit}
        className='tf-panel p-5 rounded'
        style={{ width: 'min(520px, 92vw)', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div className='flex items-center justify-between'>
          <h2 className='tf-text font-semibold' style={{ fontSize: '1.1rem' }}>
            New commit
          </h2>
          <button
            type='button'
            onClick={onClose}
            className='tf-text-secondary'
            aria-label='Close new-commit dialog'
            data-testid='commit-create-close'
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            ×
          </button>
        </div>

        <p className='tf-text-secondary' style={{ fontSize: '0.8rem' }}>
          Seals all pending Routed/Dismissed triage decisions plus a doctrine-gate
          snapshot into one atomic commit.
        </p>

        <label className='tf-text' style={{ fontSize: '0.85rem' }}>
          Operator Id
          <span aria-hidden='true' style={{ color: 'var(--tf-status-error, #f00)' }}>
            {' '}
            *
          </span>
          <input
            type='text'
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
            data-testid='commit-create-operator-id'
            aria-required='true'
            className='tf-panel p-2 rounded'
            style={{ width: '100%', marginTop: 4, fontSize: '0.85rem' }}
            autoComplete='off'
          />
        </label>

        <label className='tf-text' style={{ fontSize: '0.85rem' }}>
          Idempotency key
          <input
            type='text'
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            data-testid='commit-create-idempotency-key'
            className='tf-panel p-2 rounded'
            style={{
              width: '100%',
              marginTop: 4,
              fontSize: '0.8rem',
              fontFamily: 'monospace',
            }}
            autoComplete='off'
          />
        </label>

        <label className='tf-text' style={{ fontSize: '0.85rem' }}>
          Commit note (optional)
          <textarea
            value={commitNote}
            onChange={(e) => setCommitNote(e.target.value)}
            data-testid='commit-create-note'
            className='tf-panel p-2 rounded'
            style={{
              width: '100%',
              marginTop: 4,
              fontSize: '0.85rem',
              minHeight: 72,
              resize: 'vertical',
            }}
          />
        </label>

        {validationError && (
          <p
            className='tf-status-error p-2 rounded'
            data-testid='commit-create-validation-error'
            style={{ fontSize: '0.8rem' }}
          >
            {validationError}
          </p>
        )}

        {isConflict && (
          <p
            className='tf-status-warning p-2 rounded'
            data-testid='commit-create-conflict'
            style={{ fontSize: '0.8rem' }}
          >
            No pending decisions to commit. Triage some quarantine rows first.
          </p>
        )}

        {apiError && !isConflict && (
          <p
            className='tf-status-error p-2 rounded'
            data-testid='commit-create-error'
            style={{ fontSize: '0.8rem' }}
          >
            Commit failed (HTTP {apiError.status}):{' '}
            {apiError.serverMessage ?? 'see backend logs.'}
          </p>
        )}

        <div className='flex items-center justify-end gap-2 mt-2'>
          <button
            type='button'
            onClick={onClose}
            className='tf-panel px-3 py-1.5 rounded'
            data-testid='commit-create-cancel'
            style={{ fontSize: '0.85rem' }}
          >
            Cancel
          </button>
          <button
            type='submit'
            className='tf-status-info px-4 py-1.5 rounded font-medium'
            disabled={mutation.isPending}
            data-testid='commit-create-submit'
            style={{ fontSize: '0.85rem' }}
          >
            {mutation.isPending ? 'Committing…' : 'Commit'}
          </button>
        </div>
      </form>
    </div>
  );
}
