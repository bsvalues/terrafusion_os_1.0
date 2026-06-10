/**
 * WORKBENCH-V0.3 SLICE-K — SourcePackFitPage component tests.
 *
 * Validates:
 *   1. Panel renders with run button and idle hint in initial state.
 *   2. Running state shown while mutation is pending.
 *   3. PASS banner rendered on exitCode=0 all-pass stdout.
 *   4. WARN banner rendered on exitCode=0 warn stdout.
 *   5. FAIL banner rendered — fail-gate-notice visible.
 *   6. FAIL banner has no dismiss/proceed affordance (hard gate).
 *   7. Re-run button fires mutation again on result state.
 *   8. Raw output toggle shows stdout content.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { PackValidatorRunResponse } from '@/api/syncPackValidator';
import { SourcePackFitPage } from '../SourcePackFitPage';

// ── Mock the API module ────────────────────────────────────────────────────────

vi.mock('@/api/syncPackValidator', async () => {
  const actual = await vi.importActual<typeof import('@/api/syncPackValidator')>(
    '@/api/syncPackValidator',
  );
  return {
    ...actual,
    runPackValidator: vi.fn(),
  };
});

// Import AFTER mock registration so we get the mocked version.
const { runPackValidator } = await import('@/api/syncPackValidator');
const mockedRun = vi.mocked(runPackValidator);

// ── Fixture stdout strings ─────────────────────────────────────────────────────

function row(
  category: string,
  check: string,
  measured: string,
  expected: string,
  verdict: string,
  severity = 'CRITICAL',
): string {
  return [category, check, measured, expected, verdict, severity, ''].join('|');
}

const PASS_STDOUT = [
  row('table_presence', 'parcel_base_exists', 'YES', 'YES', 'PASS'),
  row('column_structure', 'col_check', 'present', 'present', 'PASS'),
  row('dictionary', 'dict_check', '3', '3', 'PASS', 'INFO'),
  row('data_content', 'row_count', '89247', '>0', 'INFO', 'INFO'),
  'OVERALL: PASS|fail=0|warn=0|pass=65|info=1',
].join('\n');

const WARN_STDOUT = [
  row('table_presence', 'parcel_base_exists', 'YES', 'YES', 'PASS'),
  row('column_structure', 'col_check', 'null', 'not_null', 'WARN', 'WARN'),
  'OVERALL: WARN|fail=0|warn=1|pass=1|info=0',
].join('\n');

const FAIL_STDOUT = [
  row('table_presence', 'parcel_base_exists', 'NO', 'YES', 'FAIL'),
  'OVERALL: FAIL|fail=1|warn=0|pass=0|info=0',
].join('\n');

function makeResponse(
  exitCode: number,
  stdout: string,
): PackValidatorRunResponse {
  return {
    exitCode,
    stdout,
    stderr: '',
    durationMs: 2400,
    timestamp: '2026-06-09T18:00:00.000Z',
    runningNow: false,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={qc}>
      <SourcePackFitPage />
    </QueryClientProvider>,
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('SourcePackFitPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Idle state ──────────────────────────────────────────────────────────

  it('renders run button and idle hint in initial state', () => {
    renderPage();

    expect(screen.getByTestId('run-button')).toBeInTheDocument();
    expect(screen.getByTestId('run-button')).toHaveTextContent('Run Pack Validator');
    expect(screen.getByTestId('idle-hint')).toBeInTheDocument();
    expect(screen.queryByTestId('result-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('running-state')).not.toBeInTheDocument();
  });

  // ── 2. Running state ───────────────────────────────────────────────────────

  it('shows running state while mutation is pending', async () => {
    mockedRun.mockReturnValue(new Promise(() => {}));

    renderPage();
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(screen.getByTestId('running-state')).toBeInTheDocument();
    });
    expect(screen.getByTestId('run-button')).toBeDisabled();
  });

  // ── 3. PASS banner ─────────────────────────────────────────────────────────

  it('renders PASS banner on all-pass stdout', async () => {
    mockedRun.mockResolvedValueOnce(makeResponse(0, PASS_STDOUT));

    renderPage();
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(screen.getByTestId('overall-verdict')).toBeInTheDocument();
    });

    expect(screen.getByTestId('overall-verdict')).toHaveTextContent('PASS');
    expect(screen.queryByTestId('fail-gate-notice')).not.toBeInTheDocument();
    expect(screen.getByTestId('result-state')).toBeInTheDocument();
  });

  // ── 4. WARN banner ─────────────────────────────────────────────────────────

  it('renders WARN banner on warn stdout', async () => {
    mockedRun.mockResolvedValueOnce(makeResponse(0, WARN_STDOUT));

    renderPage();
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(screen.getByTestId('overall-verdict')).toBeInTheDocument();
    });

    expect(screen.getByTestId('overall-verdict')).toHaveTextContent('WARN');
    expect(screen.queryByTestId('fail-gate-notice')).not.toBeInTheDocument();
  });

  // ── 5. FAIL banner ─────────────────────────────────────────────────────────

  it('renders FAIL banner with fail-gate-notice', async () => {
    mockedRun.mockResolvedValueOnce(makeResponse(2, FAIL_STDOUT));

    renderPage();
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(screen.getByTestId('overall-verdict')).toBeInTheDocument();
    });

    expect(screen.getByTestId('overall-verdict')).toHaveTextContent('FAIL');
    expect(screen.getByTestId('fail-gate-notice')).toBeInTheDocument();
  });

  // ── 6. FAIL hard gate — no dismiss / proceed affordance ───────────────────

  it('FAIL banner has no dismiss or proceed-anyway affordance', async () => {
    mockedRun.mockResolvedValueOnce(makeResponse(2, FAIL_STDOUT));

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

  // ── 7. Re-run fires mutation ───────────────────────────────────────────────

  it('re-run button fires mutation again on result state', async () => {
    mockedRun.mockResolvedValue(makeResponse(0, PASS_STDOUT));

    renderPage();
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(screen.getByTestId('result-state')).toBeInTheDocument();
    });

    expect(screen.getByTestId('run-button')).toHaveTextContent('Re-run Pack Validator');
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(mockedRun).toHaveBeenCalledTimes(2);
    });
  });

  // ── 8. Raw output toggle ───────────────────────────────────────────────────

  it('raw output toggle shows stdout content', async () => {
    mockedRun.mockResolvedValueOnce(makeResponse(0, PASS_STDOUT));

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
