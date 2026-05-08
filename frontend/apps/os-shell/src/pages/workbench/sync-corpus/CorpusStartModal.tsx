/**
 * SYNC-UX-1C: modal that collects OperatorName + WorkingYear and
 * fires POST /api/sync/corpus/start. On success the parent page
 * navigates to /workbench/sync/corpus/{runId}.
 */

import React, { useState } from 'react';
import { useStartCorpusRun } from './useCorpusMutations';

interface Props {
  open: boolean;
  defaultWorkingYear: number;
  onClose: () => void;
  onStarted: (runId: string) => void;
}

const MIN_YEAR = 2020;
const MAX_YEAR = 2030;

export default function CorpusStartModal({
  open,
  defaultWorkingYear,
  onClose,
  onStarted,
}: Props): React.ReactElement | null {
  const [operatorName, setOperatorName] = useState('');
  const [workingYear, setWorkingYear] = useState<number>(defaultWorkingYear);
  const [error, setError] = useState<string | null>(null);
  const startMutation = useStartCorpusRun();

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = operatorName.trim();
    if (!trimmed) {
      setError('OperatorName is required.');
      return;
    }
    if (
      !Number.isInteger(workingYear) ||
      workingYear < MIN_YEAR ||
      workingYear > MAX_YEAR
    ) {
      setError(`WorkingYear must be an integer between ${MIN_YEAR} and ${MAX_YEAR}.`);
      return;
    }
    startMutation.mutate(
      { operatorName: trimmed, workingYear },
      {
        onSuccess: (data) => onStarted(data.runId),
        onError: (err) => setError(err.message),
      },
    );
  };

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label='Start new full-corpus drain'
      data-testid='corpus-start-modal'
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className='tf-panel p-6'
        style={{ width: 'min(520px, 92vw)', maxHeight: '90vh', overflow: 'auto' }}
      >
        <h2
          className='tf-text font-semibold mb-2'
          style={{ fontSize: '1.15rem' }}
        >
          Start new full-corpus drain
        </h2>
        <p
          className='tf-text-secondary mb-4'
          style={{ fontSize: '0.85rem' }}
        >
          Drains all six lanes (parcel → owner-wsdor → improvement → land →
          sales → geometry) against the full Benton County PACS corpus.
          Wall-clock typically 6+ hours.
        </p>

        <label
          className='tf-text'
          style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}
        >
          Operator name
        </label>
        <input
          type='text'
          required
          value={operatorName}
          onChange={(e) => setOperatorName(e.target.value)}
          data-testid='operator-name-input'
          className='tf-text'
          style={{
            width: '100%',
            padding: '6px 8px',
            background: 'hsl(var(--tf-bg))',
            border: '1px solid hsl(var(--tf-border))',
            borderRadius: 4,
            marginBottom: 12,
            fontSize: '0.9rem',
          }}
        />

        <label
          className='tf-text'
          style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}
        >
          Working year
        </label>
        <input
          type='number'
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={workingYear}
          onChange={(e) => setWorkingYear(Number(e.target.value))}
          data-testid='working-year-input'
          className='tf-text'
          style={{
            width: '100%',
            padding: '6px 8px',
            background: 'hsl(var(--tf-bg))',
            border: '1px solid hsl(var(--tf-border))',
            borderRadius: 4,
            marginBottom: 16,
            fontSize: '0.9rem',
          }}
        />

        <fieldset
          className='tf-panel'
          style={{ padding: 12, marginBottom: 16, fontSize: '0.8rem' }}
        >
          <legend className='tf-text-secondary'>Pre-flight checklist</legend>
          <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0 0' }}>
            <li className='tf-text-secondary' data-testid='preflight-backend'>
              Backend running (will be verified at start)
            </li>
            <li className='tf-text-secondary' data-testid='preflight-migrations'>
              Migrations applied (will be verified at start)
            </li>
            <li className='tf-text-secondary' data-testid='preflight-pacs'>
              PACS reachable (will be verified at start)
            </li>
          </ul>
        </fieldset>

        {error && (
          <p
            className='tf-status-error p-2 rounded'
            data-testid='start-error'
            style={{ fontSize: '0.85rem', marginBottom: 12 }}
          >
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type='button'
            onClick={onClose}
            data-testid='cancel-start'
            className='tf-text-secondary px-4 py-2 rounded'
            style={{
              border: '1px solid hsl(var(--tf-border))',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={startMutation.isPending}
            data-testid='submit-start'
            className='tf-status-info px-4 py-2 rounded font-medium'
            style={{
              opacity: startMutation.isPending ? 0.6 : 1,
              cursor: startMutation.isPending ? 'wait' : 'pointer',
            }}
          >
            {startMutation.isPending ? 'Starting…' : 'Start drain'}
          </button>
        </div>
      </form>
    </div>
  );
}
