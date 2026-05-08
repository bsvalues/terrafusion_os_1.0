/**
 * SYNC-UX-1C: ReconciliationPanel tests.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/api/syncCorpus', async () => {
  const actual = await vi.importActual<typeof import('@/api/syncCorpus')>(
    '@/api/syncCorpus',
  );
  return {
    ...actual,
    getCorpusReconciliation: vi.fn(),
  };
});

import * as api from '@/api/syncCorpus';
import ReconciliationPanel from '../ReconciliationPanel';
import {
  RUN_ID,
  makeReconciliationEnvelope,
  makeReconciliationRow,
  renderInProviders,
} from './testHelpers';
import { LaneOrder } from '@/api/syncCorpus';

describe('ReconciliationPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not render while the run is still Running', () => {
    renderInProviders(
      <ReconciliationPanel runId={RUN_ID} runStatus='Running' />,
    );
    expect(screen.queryByTestId('reconciliation-panel')).not.toBeInTheDocument();
  });

  it('renders six rows once the run is Completed', async () => {
    (api.getCorpusReconciliation as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeReconciliationEnvelope(),
    );
    renderInProviders(
      <ReconciliationPanel runId={RUN_ID} runStatus='Completed' />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('reconciliation-panel')).toBeInTheDocument(),
    );
    for (const lane of LaneOrder) {
      expect(await screen.findByTestId(`recon-row-${lane}`)).toBeInTheDocument();
    }
  });

  it('marks Investigate rows with data-recon-status', async () => {
    (api.getCorpusReconciliation as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeReconciliationEnvelope([
        makeReconciliationRow('parcel', 'Match'),
        makeReconciliationRow('owner-wsdor', 'Investigate', {
          delta: 5000,
          deltaPct: 5,
          notes: 'PACS unreachable',
        }),
        makeReconciliationRow('improvement', 'AcceptableDelta'),
        makeReconciliationRow('land', 'Match'),
        makeReconciliationRow('sales', 'Match'),
        makeReconciliationRow('geometry', 'AcceptableDelta'),
      ]),
    );
    renderInProviders(
      <ReconciliationPanel runId={RUN_ID} runStatus='Completed' />,
    );
    const investigateRow = await screen.findByTestId('recon-row-owner-wsdor');
    expect(investigateRow.getAttribute('data-recon-status')).toBe('Investigate');
  });
});
