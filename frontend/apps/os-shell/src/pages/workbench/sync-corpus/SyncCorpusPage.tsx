/**
 * ═══════════════════════════════════════════════════════════════
 * SYNC-UX-1C: FULL-CORPUS SYNC RUNNER PAGE
 *
 * Operator surface for the durable full-corpus drain runner
 * shipped by SYNC-COMPLETE-2 / FullCorpusController.
 *
 * Routes:
 *   /workbench/sync/corpus            → list + start
 *   /workbench/sync/corpus/:runId     → run detail
 *
 * 6+ hour drains exceed any reasonable HTTP timeout, so the
 * orchestrator owns durable state and this page polls every 10s
 * while the run is in flight (Queued | Running | Resumed) and
 * stops polling once it terminates (Completed | Failed |
 * Interrupted).
 *
 * Sibling to:
 *   /workbench/sync-readiness   (operator-driven PACS probes)
 *   /workbench/sync-doctrine    (canonical pipeline status board)
 *
 * tf-* utility classes only — no new design tokens.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CorpusRunsList from './CorpusRunsList';
import CorpusRunDetail from './CorpusRunDetail';
import CorpusStartModal from './CorpusStartModal';

export default function SyncCorpusPage(): React.ReactElement {
  const params = useParams<{ runId?: string }>();
  const navigate = useNavigate();
  const [startOpen, setStartOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  const handleStarted = (runId: string) => {
    setStartOpen(false);
    navigate(`/workbench/sync/corpus/${encodeURIComponent(runId)}`);
  };

  return (
    <main
      className='p-6'
      aria-label='Full-corpus sync runner'
      data-testid='sync-corpus-page'
    >
      <Header />

      {!params.runId && (
        <>
          <div className='flex items-center gap-4 my-4'>
            <button
              type='button'
              onClick={() => setStartOpen(true)}
              data-testid='open-start-modal'
              className='tf-status-info px-4 py-2 rounded font-medium'
            >
              Start new drain
            </button>
            <span className='tf-text-secondary' style={{ fontSize: '0.85rem' }}>
              Drains all six lanes against the full Benton County PACS corpus.
              Wall-clock typically 6+ hours.
            </span>
          </div>
          <CorpusRunsList />
        </>
      )}

      {params.runId && <CorpusRunDetail runId={params.runId} />}

      <CorpusStartModal
        open={startOpen}
        defaultWorkingYear={currentYear}
        onClose={() => setStartOpen(false)}
        onStarted={handleStarted}
      />
    </main>
  );
}

function Header(): React.ReactElement {
  return (
    <header className='mb-2'>
      <h1
        className='tf-text font-semibold'
        style={{ fontSize: '1.4rem' }}
      >
        TerraFusion · Workbench · Full-Corpus Sync Runner
        <span
          className='tf-status-info'
          style={{
            marginLeft: 12,
            padding: '2px 8px',
            borderRadius: 999,
            fontSize: '0.7rem',
            verticalAlign: 'middle',
          }}
          data-testid='active-county-badge'
        >
          Benton County
        </span>
      </h1>
      <p className='tf-text-secondary' style={{ fontSize: '0.9rem' }}>
        Launch and monitor full-county PACS drains. State is durable; runs
        survive backend restarts and can be resumed after interruption.
      </p>
    </header>
  );
}
