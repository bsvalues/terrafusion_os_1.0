/**
 * SYNC-UX-1C: SyncCorpusPage tests covering the no-active-run state
 * (header + empty list + Start button + recent-runs render).
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/api/syncCorpus', async () => {
  const actual = await vi.importActual<typeof import('@/api/syncCorpus')>(
    '@/api/syncCorpus',
  );
  return {
    ...actual,
    postCorpusStart: vi.fn(),
    postCorpusResume: vi.fn(),
    getCorpusStatus: vi.fn(),
    getCorpusReconciliation: vi.fn(),
    getCorpusRecentRuns: vi.fn(() => Promise.resolve([])),
  };
});

import * as api from '@/api/syncCorpus';
import SyncCorpusPage from '../SyncCorpusPage';
import { renderWithRouter } from './testHelpers';

describe('SyncCorpusPage — list view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.getCorpusRecentRuns as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it('renders header and Start button when no runs are returned', async () => {
    renderWithRouter(SyncCorpusPage, '/workbench/sync/corpus');
    expect(screen.getByTestId('sync-corpus-page')).toBeInTheDocument();
    expect(screen.getByTestId('active-county-badge')).toHaveTextContent(
      /Benton County/,
    );
    expect(screen.getByTestId('open-start-modal')).toBeInTheDocument();
    expect(await screen.findByTestId('recent-runs-empty')).toBeInTheDocument();
  });

  it('renders the recent runs list from backend persisted state', async () => {
    (api.getCorpusRecentRuns as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        runId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        operatorName: 'b.svalues',
        workingYear: 2026,
        status: 'Queued',
        currentLane: null,
        nextLaneOnResume: 'parcel',
        startedAt: '2026-05-08T09:00:00Z',
        finishedAt: null,
        errorMessage: null,
      },
    ]);
    renderWithRouter(SyncCorpusPage, '/workbench/sync/corpus');
    expect(
      await screen.findByTestId('recent-run-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('recent-runs-empty')).not.toBeInTheDocument();
  });

  it('fails visibly when the backend recent-runs endpoint is unavailable', async () => {
    (api.getCorpusRecentRuns as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('HTTP 500'),
    );
    renderWithRouter(SyncCorpusPage, '/workbench/sync/corpus');

    expect(await screen.findByTestId('recent-runs-error')).toHaveTextContent(
      /Recent runs unavailable: HTTP 500/,
    );
  });

  it('does not render the modal until the Start button is clicked', () => {
    renderWithRouter(SyncCorpusPage, '/workbench/sync/corpus');
    expect(screen.queryByTestId('corpus-start-modal')).not.toBeInTheDocument();
  });
});
