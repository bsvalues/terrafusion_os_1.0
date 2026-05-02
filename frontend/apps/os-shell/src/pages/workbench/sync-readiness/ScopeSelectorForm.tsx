/**
 * OPS-1-B: ScopeSelectorForm — empty-state form rendered when
 * the URL params (countyId, sourceConnectionId, workbookId) are
 * missing. Per OPS-1 policy: no implicit defaults from session;
 * the operator MUST pick a scope explicitly.
 */

import React, { useState } from 'react';

interface ScopeSelectorFormProps {
  /** Optional defaults sourced from useSession() — not implicit data-layer fallback. */
  initialCountyId?: string;
  onLoad: (scope: { countyId: string; sourceConnectionId: string; workbookId: string }) => void;
}

export function ScopeSelectorForm({
  initialCountyId,
  onLoad,
}: ScopeSelectorFormProps): React.ReactElement {
  const [countyId, setCountyId] = useState(initialCountyId ?? '');
  const [sourceConnectionId, setSourceConnectionId] = useState('');
  const [workbookId, setWorkbookId] = useState('');

  const valid = Boolean(countyId && sourceConnectionId && workbookId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onLoad({ countyId, sourceConnectionId, workbookId });
  }

  return (
    <form
      onSubmit={submit}
      className='tf-panel p-6 max-w-xl mx-auto'
      aria-label='Sync Readiness scope selector'
      data-testid='scope-selector-form'
    >
      <h2 className='tf-text font-medium mb-4' style={{ fontSize: '1.1rem' }}>
        Pick a scope to inspect
      </h2>
      <p className='tf-text-secondary mb-4' style={{ fontSize: '0.9rem' }}>
        County, source connection, and mapping workbook are all required.
      </p>

      <label className='block mb-3'>
        <span className='tf-text-secondary block mb-1' style={{ fontSize: '0.85rem' }}>
          County id
        </span>
        <input
          type='text'
          value={countyId}
          onChange={(e) => setCountyId(e.target.value.trim())}
          className='w-full tf-panel-elevated tf-text px-3 py-2'
          placeholder='00000000-0000-0000-0000-000000000000'
          data-testid='scope-county-id'
        />
      </label>

      <label className='block mb-3'>
        <span className='tf-text-secondary block mb-1' style={{ fontSize: '0.85rem' }}>
          PACS source connection id
        </span>
        <input
          type='text'
          value={sourceConnectionId}
          onChange={(e) => setSourceConnectionId(e.target.value.trim())}
          className='w-full tf-panel-elevated tf-text px-3 py-2'
          placeholder='00000000-0000-0000-0000-000000000000'
          data-testid='scope-source-connection-id'
        />
      </label>

      <label className='block mb-4'>
        <span className='tf-text-secondary block mb-1' style={{ fontSize: '0.85rem' }}>
          Workbook id
        </span>
        <input
          type='text'
          value={workbookId}
          onChange={(e) => setWorkbookId(e.target.value.trim())}
          className='w-full tf-panel-elevated tf-text px-3 py-2'
          placeholder='00000000-0000-0000-0000-000000000000'
          data-testid='scope-workbook-id'
        />
      </label>

      <button
        type='submit'
        disabled={!valid}
        className='tf-status-info px-4 py-2 rounded'
        style={{ opacity: valid ? 1 : 0.5 }}
        data-testid='scope-load-button'
      >
        Load
      </button>
    </form>
  );
}
