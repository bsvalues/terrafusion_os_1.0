/**
 * SYNC-UX-1C: reconciliation panel.
 *
 * Renders the 6-row reconciliation table once the run reaches
 * Completed. Hidden while the run is still in flight.
 */

import React from 'react';
import { useCorpusReconciliation } from './useCorpusReconciliation';
import ReconciliationRow from './ReconciliationRow';
import { LaneOrder, type RunStatus } from '@/api/syncCorpus';

interface Props {
  runId: string;
  runStatus: RunStatus;
}

export default function ReconciliationPanel({
  runId,
  runStatus,
}: Props): React.ReactElement | null {
  const query = useCorpusReconciliation(runId, runStatus);

  if (runStatus !== 'Completed') return null;

  return (
    <section
      aria-label='Reconciliation'
      data-testid='reconciliation-panel'
      className='tf-panel p-4 mt-4'
    >
      <h3 className='tf-text font-medium mb-3' style={{ fontSize: '0.95rem' }}>
        Reconciliation (PACS source vs TerraFusion canonical)
      </h3>
      {query.isLoading && (
        <p className='tf-text-secondary' style={{ fontSize: '0.85rem' }}>
          Loading reconciliation…
        </p>
      )}
      {query.isError && (
        <p className='tf-status-error p-2 rounded' style={{ fontSize: '0.85rem' }}>
          Failed to load reconciliation.
        </p>
      )}
      {query.data && query.data.reconciliations.length === 0 && (
        <p className='tf-text-secondary' style={{ fontSize: '0.85rem' }}>
          No reconciliation rows yet.
        </p>
      )}
      {query.data && query.data.reconciliations.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr className='tf-text-secondary'>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Lane</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Expected basis</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>PACS</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>TF</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Δ</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Δ %</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Tol %</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {sortByLaneOrder(query.data.reconciliations).map((row) => (
                <ReconciliationRow key={row.reconciliationId} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function sortByLaneOrder<T extends { lane: string }>(rows: T[]): T[] {
  const idx = new Map<string, number>(LaneOrder.map((l, i) => [l, i]));
  return [...rows].sort(
    (a, b) => (idx.get(a.lane) ?? 999) - (idx.get(b.lane) ?? 999),
  );
}
