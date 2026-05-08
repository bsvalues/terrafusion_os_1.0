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
    readRecentRuns: vi.fn(() => []),
    recordRecentRun: vi.fn(),
  };
});

import * as api from '@/api/syncCorpus';
import SyncCorpusPage from '../SyncCorpusPage';
import { renderWithRouter } from './testHelpers';

describe('SyncCorpusPage — list view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.readRecentRuns as ReturnType<typeof vi.fn>).mockReturnValue([]);
  });

  it('renders header and Start button when no runs are recorded', () => {
    renderWithRouter(SyncCorpusPage, '/workbench/sync/corpus');
    expect(screen.getByTestId('sync-corpus-page')).toBeInTheDocument();
    expect(screen.getByTestId('active-county-badge')).toHaveTextContent(
      /Benton County/,
    );
    expect(screen.getByTestId('open-start-modal')).toBeInTheDocument();
    expect(screen.getByTestId('recent-runs-empty')).toBeInTheDocument();
  });

  it('renders the recent runs list when entries exist in localStorage', () => {
    (api.readRecentRuns as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        runId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        operatorName: 'b.svalues',
        workingYear: 2026,
        startedAt: '2026-05-08T09:00:00Z',
      },
    ]);
    renderWithRouter(SyncCorpusPage, '/workbench/sync/corpus');
    expect(
      screen.getByTestId('recent-run-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('recent-runs-empty')).not.toBeInTheDocument();
  });

  it('does not render the modal until the Start button is clicked', () => {
    renderWithRouter(SyncCorpusPage, '/workbench/sync/corpus');
    expect(screen.queryByTestId('corpus-start-modal')).not.toBeInTheDocument();
  });
});
