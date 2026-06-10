/**
 * WORKBENCH-V0.3 SLICE-J — SyncDoctorPage component tests.
 *
 * Validates:
 *   1. Panel renders with run button in idle state.
 *   2. Loading state shown while run is pending.
 *   3. PASS banner rendered on exitCode=0 all-pass stdout.
 *   4. WARN banner rendered on exitCode=0 warn stdout.
 *   5. FAIL banner rendered on exitCode=1 stdout.
 *   6. FAIL banner has no dismiss/proceed button (hard gate).
 *   7. Re-run button fires mutation again on result state.
 *   8. Raw output toggle shows stdout content.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { DoctorRunResponse } from '@/api/syncDoctor';
import { SyncDoctorPage } from '../SyncDoctorPage';

// ── Mock the API module ────────────────────────────────────────────────────────

vi.mock('@/api/syncDoctor', async () => {
  const actual = await vi.importActual<typeof import('@/api/syncDoctor')>('@/api/syncDoctor');
  return {
    ...actual,
    runDoctor: vi.fn(),
  };
});

// Import AFTER mock registration so we get the mocked version.
const { runDoctor } = await import('@/api/syncDoctor');
const mockedRunDoctor = vi.mocked(runDoctor);

// ── Fixture stdout strings ─────────────────────────────────────────────────────

const PASS_STDOUT = [
  '══════════════════════════════════════════════',
  '  tf-sync doctor — TerraFusion Sync Health Check',
  '══════════════════════════════════════════════',
  'DB: 127.0.0.1:5432/terrafusion',
  '    #0  Harris PACS Pack Validator...',
  '✓  All 62 checks passed',
  '══════════════════════════════════════════════',
  '✓ OVERALL: PASS — substrate clean',
  '══════════════════════════════════════════════',
].join('\n');

const WARN_STDOUT = [
  '══════════════════════════════════════════════',
  '  tf-sync doctor',
  '══════════════════════════════════════════════',
  'DB: 127.0.0.1:5432/terrafusion',
  '    #0  Harris PACS Pack Validator...',
  '⚠  1 deferred boundary',
  '══════════════════════════════════════════════',
  '⚠ OVERALL: WARN — known deferred items',
  '══════════════════════════════════════════════',
].join('\n');

const FAIL_STDOUT = [
  '══════════════════════════════════════════════',
  '  tf-sync doctor',
  '══════════════════════════════════════════════',
  'DB: 127.0.0.1:5432/terrafusion',
  '    #0  Harris PACS Pack Validator...',
  '✗  pack mismatch detected',
  '══════════════════════════════════════════════',
  '✗ OVERALL: FAIL — do not drain',
  '══════════════════════════════════════════════',
].join('\n');

function makeResponse(exitCode: number, stdout: string): DoctorRunResponse {
  return {
    exitCode,
    stdout,
    stderr: '',
    durationMs: 1200,
    timestamp: '2026-06-09T18:00:00.000Z',
    runningNow: false,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <SyncDoctorPage />
    </QueryClientProvider>,
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('SyncDoctorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Idle state ──────────────────────────────────────────────────────────

  it('renders run button and idle hint in initial state', () => {
    renderPage();

    expect(screen.getByTestId('run-button')).toBeInTheDocument();
    expect(screen.getByTestId('run-button')).toHaveTextContent('Run Doctor');
    expect(screen.getByTestId('idle-hint')).toBeInTheDocument();
    expect(screen.queryByTestId('result-state')).not.toBeInTheDocument();
  });

  // ── 2. Loading state ───────────────────────────────────────────────────────

  it('shows running state while mutation is pending', async () => {
    mockedRunDoctor.mockReturnValue(new Promise(() => {}));

    renderPage();
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(screen.getByTestId('running-state')).toBeInTheDocument();
    });
    expect(screen.getByTestId('run-button')).toBeDisabled();
  });

  // ── 3. PASS banner ─────────────────────────────────────────────────────────

  it('renders PASS banner on exitCode=0 all-pass stdout', async () => {
    mockedRunDoctor.mockResolvedValueOnce(makeResponse(0, PASS_STDOUT));

    renderPage();
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(screen.getByTestId('overall-verdict')).toBeInTheDocument();
    });

    expect(screen.getByTestId('overall-verdict')).toHaveTextContent('PASS');
    expect(screen.queryByTestId('fail-gate-notice')).not.toBeInTheDocument();
  });

  // ── 4. WARN banner ─────────────────────────────────────────────────────────

  it('renders WARN banner on exitCode=0 warn stdout', async () => {
    mockedRunDoctor.mockResolvedValueOnce(makeResponse(0, WARN_STDOUT));

    renderPage();
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(screen.getByTestId('overall-verdict')).toBeInTheDocument();
    });

    expect(screen.getByTestId('overall-verdict')).toHaveTextContent('WARN');
    expect(screen.queryByTestId('fail-gate-notice')).not.toBeInTheDocument();
  });

  // ── 5. FAIL banner ─────────────────────────────────────────────────────────

  it('renders FAIL banner on exitCode=1 stdout', async () => {
    mockedRunDoctor.mockResolvedValueOnce(makeResponse(1, FAIL_STDOUT));

    renderPage();
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(screen.getByTestId('overall-verdict')).toBeInTheDocument();
    });

    expect(screen.getByTestId('overall-verdict')).toHaveTextContent('FAIL');
    expect(screen.getByTestId('fail-gate-notice')).toBeInTheDocument();
  });

  // ── 6. FAIL banner has no dismiss / proceed button ─────────────────────────

  it('FAIL banner has no dismiss or proceed-anyway affordance', async () => {
    mockedRunDoctor.mockResolvedValueOnce(makeResponse(1, FAIL_STDOUT));

    renderPage();
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(screen.getByTestId('fail-gate-notice')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const dismissOrProceed = buttons.filter(b => {
      const text = b.textContent?.toLowerCase() ?? '';
      return (
        text.includes('dismiss') ||
        text.includes('proceed') ||
        text.includes('continue') ||
        text.includes('ignore') ||
        text.includes('anyway')
      );
    });
    expect(dismissOrProceed).toHaveLength(0);
  });

  // ── 7. Re-run button fires mutation again ─────────────────────────────────

  it('re-run button fires mutation on result state', async () => {
    mockedRunDoctor.mockResolvedValue(makeResponse(0, PASS_STDOUT));

    renderPage();
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(screen.getByTestId('result-state')).toBeInTheDocument();
    });

    expect(screen.getByTestId('run-button')).toHaveTextContent('Re-run Doctor');
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(mockedRunDoctor).toHaveBeenCalledTimes(2);
    });
  });

  // ── 8. Raw output toggle ───────────────────────────────────────────────────

  it('raw output toggle shows stdout content', async () => {
    mockedRunDoctor.mockResolvedValueOnce(makeResponse(0, PASS_STDOUT));

    renderPage();
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(screen.getByTestId('raw-output-toggle')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('raw-output')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('raw-output-toggle'));

    expect(screen.getByTestId('raw-output')).toBeInTheDocument();
    expect(screen.getByTestId('raw-output')).toHaveTextContent('PASS');
  });
});
