/**
 * SYNC-UX-1C: corpus run detail view.
 *
 * Shows the run header, status badge, lane progress strip,
 * inline lane detail (when a lane is selected), the
 * reconciliation panel (Completed runs only), and the evidence
 * ZIP download (Completed runs only).
 *
 * Auto-refresh every 10s while the run is in flight; refresh-only
 * (manual) once the run is terminal.
 */

import React, { useState } from 'react';
import { useCorpusRun } from './useCorpusRun';
import { useResumeCorpusRun } from './useCorpusMutations';
import LaneProgressStrip from './LaneProgressStrip';
import LaneDetailPanel from './LaneDetailPanel';
import ReconciliationPanel from './ReconciliationPanel';
import {
  getCorpusEvidenceZipUrl,
  type LaneName,
  type RunStatus,
} from '@/api/syncCorpus';

interface Props {
  runId: string;
}

const RESUMABLE = new Set<RunStatus>(['Failed', 'Interrupted']);

export default function CorpusRunDetail({ runId }: Props): React.ReactElement {
  const query = useCorpusRun(runId);
  const resumeMutation = useResumeCorpusRun();
  const [selectedLane, setSelectedLane] = useState<LaneName | null>(null);
  const [resumeMessage, setResumeMessage] = useState<string | null>(null);

  const run = query.data?.run;
  const lanes = query.data?.lanes ?? [];

  const handleResume = () => {
    setResumeMessage(null);
    resumeMutation.mutate(runId, {
      onSuccess: (outcome) => {
        if (outcome.kind === 'conflict') {
          setResumeMessage(
            outcome.error || 'Run not in resumable state.',
          );
        } else if (outcome.kind === 'notFound') {
          setResumeMessage(outcome.error || 'Run not found.');
        } else {
          setResumeMessage(`Resumed; status=${outcome.status}.`);
        }
      },
      onError: (err) => setResumeMessage(err.message),
    });
  };

  return (
    <section
      data-testid='corpus-run-detail'
      data-run-id={runId}
      data-run-status={run?.status ?? 'Loading'}
    >
      <div className='flex items-center gap-4 my-4'>
        <button
          type='button'
          className='tf-status-info px-4 py-2 rounded font-medium'
          style={{ opacity: query.isFetching ? 0.6 : 1 }}
          disabled={query.isFetching}
          onClick={() => query.refetch()}
          data-testid='refresh-run-button'
        >
          {query.isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
        {run && isActive(run.status) && (
          <span
            className='tf-text-secondary'
            data-testid='auto-refresh-indicator'
            style={{ fontSize: '0.8rem' }}
          >
            auto-refresh every 10s
          </span>
        )}
      </div>

      {query.isLoading && !query.data && (
        <p className='tf-text-secondary' data-testid='run-loading'>
          Loading run…
        </p>
      )}
      {query.isError && (
        <p className='tf-status-error p-3 rounded' data-testid='run-error'>
          Failed to load run.
        </p>
      )}

      {run && (
        <>
          <RunHeader
            run={run}
            onResume={handleResume}
            resumePending={resumeMutation.isPending}
            resumeMessage={resumeMessage}
          />

          <LaneProgressStrip
            lanes={lanes}
            selectedLane={selectedLane}
            onSelectLane={setSelectedLane}
          />

          {selectedLane && (
            <LaneDetailPanel
              lane={selectedLane}
              laneResult={lanes.find((l) => l.lane === selectedLane)}
            />
          )}

          <ReconciliationPanel runId={runId} runStatus={run.status} />

          {run.status === 'Completed' && (
            <section
              aria-label='Evidence packet'
              data-testid='evidence-section'
              className='tf-panel p-4 mt-4'
            >
              <h3
                className='tf-text font-medium mb-2'
                style={{ fontSize: '0.95rem' }}
              >
                Evidence packet
              </h3>
              <p
                className='tf-text-secondary mb-3'
                style={{ fontSize: '0.85rem' }}
              >
                HMAC-signed ZIP: manifest, run.csv, lane-results.csv,
                reconciliation.csv, gate-summaries.json.
              </p>
              <a
                href={getCorpusEvidenceZipUrl(runId)}
                download
                data-testid='download-evidence'
                className='tf-status-info px-4 py-2 rounded font-medium'
                style={{ display: 'inline-block', textDecoration: 'none' }}
              >
                Download corpus evidence ZIP
              </a>
            </section>
          )}
        </>
      )}
    </section>
  );
}

function isActive(s: RunStatus): boolean {
  return s === 'Queued' || s === 'Running' || s === 'Resumed';
}

function RunHeader({
  run,
  onResume,
  resumePending,
  resumeMessage,
}: {
  run: NonNullable<ReturnType<typeof useCorpusRun>['data']>['run'];
  onResume: () => void;
  resumePending: boolean;
  resumeMessage: string | null;
}): React.ReactElement {
  const showResume = RESUMABLE.has(run.status);
  return (
    <section
      aria-label='Run header'
      data-testid='run-header'
      className={`${runStatusClass(run.status)} p-4 rounded`}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85, marginBottom: 4 }}>
            <code>{run.runId}</code>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            <span data-testid='run-status-badge' data-status={run.status}>
              {run.status}
            </span>
            {run.currentLane && (
              <>
                {' · current lane '}
                <code>{run.currentLane}</code>
              </>
            )}
          </div>
          <div style={{ fontSize: '0.85rem', marginTop: 4 }}>
            Operator <strong>{run.operatorName}</strong> · year{' '}
            <strong>{run.workingYear}</strong> · started{' '}
            <strong>{new Date(run.startedAt).toLocaleString()}</strong>
            {run.finishedAt && (
              <>
                {' · finished '}
                <strong>{new Date(run.finishedAt).toLocaleString()}</strong>
              </>
            )}
          </div>
          {run.errorMessage && (
            <div
              style={{ fontSize: '0.8rem', marginTop: 6, opacity: 0.95 }}
              data-testid='run-error-message'
            >
              {run.errorMessage}
            </div>
          )}
        </div>
        {showResume && (
          <button
            type='button'
            onClick={onResume}
            disabled={resumePending}
            data-testid='resume-run-button'
            className='tf-status-warning px-4 py-2 rounded font-medium'
            style={{
              cursor: resumePending ? 'wait' : 'pointer',
              opacity: resumePending ? 0.6 : 1,
            }}
          >
            {resumePending ? 'Resuming…' : 'Resume run'}
          </button>
        )}
      </div>
      {resumeMessage && (
        <div
          data-testid='resume-message'
          style={{ marginTop: 8, fontSize: '0.85rem' }}
        >
          {resumeMessage}
        </div>
      )}
    </section>
  );
}

function runStatusClass(s: RunStatus): string {
  switch (s) {
    case 'Completed':
      return 'tf-status-success';
    case 'Running':
    case 'Queued':
    case 'Resumed':
      return 'tf-status-info';
    case 'Failed':
      return 'tf-status-error';
    case 'Interrupted':
      return 'tf-status-warning';
    default:
      return 'tf-text-secondary';
  }
}
