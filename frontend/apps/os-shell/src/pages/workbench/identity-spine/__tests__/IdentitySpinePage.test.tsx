/**
 * WORKBENCH-V0.3 SLICE-L — IdentitySpinePage component tests.
 *
 * Validates:
 *   1. Panel renders with run button and idle hint in initial state.
 *   2. Running state shown while mutation is pending.
 *   3. PASS banner rendered on all-PASS stdout.
 *   4. WARN banner rendered on deferred-drift-only stdout (owner link).
 *   5. FAIL banner rendered with fail-gate-notice on non-deferred drift.
 *   6. FAIL banner has no dismiss/proceed affordance (hard gate).
 *   7. Re-run button fires mutation again on result state.
 *   8. Raw output toggle shows stdout content.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { IdentitySpineRunResponse } from '@/api/syncIdentitySpine';
import { IdentitySpinePage } from '../IdentitySpinePage';

// ── Mock the API module ────────────────────────────────────────────────────────

vi.mock('@/api/syncIdentitySpine', async () => {
  const actual = await vi.importActual<typeof import('@/api/syncIdentitySpine')>(
    '@/api/syncIdentitySpine',
  );
  return {
    ...actual,
    runIdentitySpine: vi.fn(),
  };
});

// Import AFTER mock registration so we get the mocked version.
const { runIdentitySpine } = await import('@/api/syncIdentitySpine');
const mockedRun = vi.mocked(runIdentitySpine);

// ── Fixture stdout strings ─────────────────────────────────────────────────────

function tableRow(
  laneTable: string,
  total: number,
  live: number,
  dangling: number,
  nullRef: number,
  verdict: 'PASS' | 'FAIL',
): string {
  return [laneTable, total, live, dangling, nullRef, verdict].join('|');
}

const PASS_STDOUT = [
  tableRow('canonical_tf.tf_land', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_improvement', 89247, 89247, 0, 0, 'PASS'),
  tableRow('gis_tf.tf_parcel_geom', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_assessment', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_parcel_tax_area', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_exemption', 5124, 5124, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_tax_bill_line', 1200000, 1200000, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_tax_bill_current', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_assessment_bill_line', 313139, 313139, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_assessment_bill_current', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_parcel_owner_link', 89247, 89247, 0, 0, 'PASS'),
  'OVERALL: PASS — no identity drift',
].join('\n');

// Benton steady-state: owner link has dangling, all others PASS.
// SQL says FAIL, but panel must compute WARN (deferred lane).
const WARN_STDOUT = [
  tableRow('canonical_tf.tf_land', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_improvement', 89247, 89247, 0, 0, 'PASS'),
  tableRow('gis_tf.tf_parcel_geom', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_assessment', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_parcel_tax_area', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_exemption', 5124, 5124, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_tax_bill_line', 1200000, 1200000, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_tax_bill_current', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_assessment_bill_line', 313139, 313139, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_assessment_bill_current', 89247, 89247, 0, 0, 'PASS'),
  tableRow('canonical_tf.tf_parcel_owner_link', 3200000, 3200000, 1397252, 0, 'FAIL'),
  'OVERALL: FAIL — identity drift detected',
].join('\n');

// Non-deferred drift → true FAIL.
const FAIL_STDOUT = [
  tableRow('canonical_tf.tf_land', 89247, 80000, 9247, 0, 'FAIL'),
  'OVERALL: FAIL — identity drift detected',
].join('\n');

function makeResponse(
  exitCode: number,
  stdout: string,
): IdentitySpineRunResponse {
  return {
    exitCode,
    stdout,
    stderr: '',
    durationMs: 47300,
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
      <IdentitySpinePage />
    </QueryClientProvider>,
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('IdentitySpinePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Idle state ──────────────────────────────────────────────────────────

  it('renders run button and idle hint in initial state', () => {
    renderPage();

    expect(screen.getByTestId('run-button')).toBeInTheDocument();
    expect(screen.getByTestId('run-button')).toHaveTextContent('Run Identity Check');
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

  it('renders PASS banner on all-PASS stdout', async () => {
    mockedRun.mockResolvedValueOnce(makeResponse(0, PASS_STDOUT));

    renderPage();
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(screen.getByTestId('overall-verdict')).toBeInTheDocument();
    });

    expect(screen.getByTestId('overall-verdict')).toHaveTextContent('PASS');
    expect(screen.queryByTestId('fail-gate-notice')).not.toBeInTheDocument();
    expect(screen.getByTestId('result-state')).toBeInTheDocument();
    expect(screen.getByTestId('group-cards')).toBeInTheDocument();
  });

  // ── 4. WARN banner (deferred drift only) ──────────────────────────────────

  it('renders WARN banner on deferred-drift-only stdout', async () => {
    mockedRun.mockResolvedValueOnce(makeResponse(0, WARN_STDOUT));

    renderPage();
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(screen.getByTestId('overall-verdict')).toBeInTheDocument();
    });

    expect(screen.getByTestId('overall-verdict')).toHaveTextContent('WARN');
    expect(screen.queryByTestId('fail-gate-notice')).not.toBeInTheDocument();
  });

  // ── 5. FAIL banner with fail-gate-notice ──────────────────────────────────

  it('renders FAIL banner with fail-gate-notice on non-deferred drift', async () => {
    mockedRun.mockResolvedValueOnce(makeResponse(0, FAIL_STDOUT));

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
    mockedRun.mockResolvedValueOnce(makeResponse(0, FAIL_STDOUT));

    renderPage();
    fireEvent.click(screen.getByTestId('run-button'));

    await waitFor(() => {
      expect(screen.getByTestId('fail-gate-notice')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const dismissOrProceed = buttons.filter((b) => {
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

    expect(screen.getByTestId('run-button')).toHaveTextContent('Re-run Identity Check');
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
