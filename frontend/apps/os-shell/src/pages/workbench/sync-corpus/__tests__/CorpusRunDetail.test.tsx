/**
 * SYNC-UX-1C: CorpusRunDetail tests covering status badges,
 * Resume button visibility (only Failed | Interrupted), the
 * lane progress strip, and reconciliation panel gating.
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
    getCorpusStatus: vi.fn(),
    getCorpusReconciliation: vi.fn(),
    postCorpusResume: vi.fn(),
  };
});

import * as api from '@/api/syncCorpus';
import CorpusRunDetail from '../CorpusRunDetail';
import { renderInProviders, RUN_ID, makeStatus, makeReconciliationEnvelope } from './testHelpers';

describe('CorpusRunDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the run header with status badge for a Running run', async () => {
    (api.getCorpusStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeStatus({ status: 'Running' }),
    );
    renderInProviders(<CorpusRunDetail runId={RUN_ID} />);
    await waitFor(() =>
      expect(screen.getByTestId('run-header')).toBeInTheDocument(),
    );
    const badge = screen.getByTestId('run-status-badge');
    expect(badge.getAttribute('data-status')).toBe('Running');
    expect(badge).toHaveTextContent('Running');
  });

  it('shows the auto-refresh indicator for in-flight runs', async () => {
    (api.getCorpusStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeStatus({ status: 'Running' }),
    );
    renderInProviders(<CorpusRunDetail runId={RUN_ID} />);
    await waitFor(() =>
      expect(screen.getByTestId('auto-refresh-indicator')).toBeInTheDocument(),
    );
  });

  it('hides the auto-refresh indicator for terminal runs', async () => {
    (api.getCorpusStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeStatus({ status: 'Completed', finishedAt: '2026-05-08T20:00:00Z' }),
    );
    (api.getCorpusReconciliation as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeReconciliationEnvelope(),
    );
    renderInProviders(<CorpusRunDetail runId={RUN_ID} />);
    await waitFor(() =>
      expect(screen.getByTestId('run-header')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('auto-refresh-indicator')).not.toBeInTheDocument();
  });

  it('renders the Resume button for a Failed run', async () => {
    (api.getCorpusStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeStatus({
        status: 'Failed',
        errorMessage: 'connection timeout',
        nextLaneOnResume: 'sales',
      }),
    );
    renderInProviders(<CorpusRunDetail runId={RUN_ID} />);
    await waitFor(() =>
      expect(screen.getByTestId('resume-run-button')).toBeInTheDocument(),
    );
  });

  it('renders the Resume button for an Interrupted run', async () => {
    (api.getCorpusStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeStatus({
        status: 'Interrupted',
        nextLaneOnResume: 'parcel',
      }),
    );
    renderInProviders(<CorpusRunDetail runId={RUN_ID} />);
    await waitFor(() =>
      expect(screen.getByTestId('resume-run-button')).toBeInTheDocument(),
    );
  });

  it('hides the Resume button for a Running run', async () => {
    (api.getCorpusStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeStatus({ status: 'Running' }),
    );
    renderInProviders(<CorpusRunDetail runId={RUN_ID} />);
    await waitFor(() =>
      expect(screen.getByTestId('run-header')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('resume-run-button')).not.toBeInTheDocument();
  });

  it('hides the Resume button for a Completed run', async () => {
    (api.getCorpusStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeStatus({ status: 'Completed', finishedAt: '2026-05-08T20:00:00Z' }),
    );
    (api.getCorpusReconciliation as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeReconciliationEnvelope(),
    );
    renderInProviders(<CorpusRunDetail runId={RUN_ID} />);
    await waitFor(() =>
      expect(screen.getByTestId('run-header')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('resume-run-button')).not.toBeInTheDocument();
  });

  it('renders the lane progress strip for any loaded run', async () => {
    (api.getCorpusStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeStatus({ status: 'Running', currentLane: 'land' }, { land: { status: 'Running' } }),
    );
    renderInProviders(<CorpusRunDetail runId={RUN_ID} />);
    await waitFor(() =>
      expect(screen.getByTestId('lane-progress-strip')).toBeInTheDocument(),
    );
    expect(
      screen.getByTestId('lane-pill-land').getAttribute('data-running'),
    ).toBe('true');
  });

  it('hides reconciliation panel while Running', async () => {
    (api.getCorpusStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeStatus({ status: 'Running' }),
    );
    renderInProviders(<CorpusRunDetail runId={RUN_ID} />);
    await waitFor(() =>
      expect(screen.getByTestId('run-header')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('reconciliation-panel')).not.toBeInTheDocument();
  });

  it('shows reconciliation panel when Completed', async () => {
    (api.getCorpusStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeStatus({ status: 'Completed', finishedAt: '2026-05-08T20:00:00Z' }),
    );
    (api.getCorpusReconciliation as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeReconciliationEnvelope(),
    );
    renderInProviders(<CorpusRunDetail runId={RUN_ID} />);
    await waitFor(() =>
      expect(screen.getByTestId('reconciliation-panel')).toBeInTheDocument(),
    );
  });

  it('renders the evidence download link when Completed', async () => {
    (api.getCorpusStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeStatus({ status: 'Completed', finishedAt: '2026-05-08T20:00:00Z' }),
    );
    (api.getCorpusReconciliation as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeReconciliationEnvelope(),
    );
    renderInProviders(<CorpusRunDetail runId={RUN_ID} />);
    const link = (await screen.findByTestId('download-evidence')) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toContain(`/api/sync/corpus/${RUN_ID}/evidence.zip`);
    expect(link.hasAttribute('download')).toBe(true);
  });
});
