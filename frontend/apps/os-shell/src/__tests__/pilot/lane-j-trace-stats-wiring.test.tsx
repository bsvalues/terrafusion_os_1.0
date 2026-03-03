/**
 * lane-j-trace-stats-wiring.test.tsx
 *
 * Lane J — Contract tests for trace stats wiring:
 *  - getTraceStats API call
 *  - useTraceStats hook mapping
 *  - ExecutionConsole admin diagnostics wiring
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ---------------------------------------------------------------------------
// Mocks (must be before imports that use them)
// ---------------------------------------------------------------------------

const mockGetTraceStats = jest.fn();
jest.mock('../../api/pilotApi', () => ({
  ...jest.requireActual('../../api/pilotApi'),
  getTraceStats: (...args: unknown[]) => mockGetTraceStats(...args),
  requestApprovalToken: jest.fn(),
}));

jest.mock('../../auth/session', () => ({
  getSession: jest.fn(() => ({
    userId: 'admin-user',
    countyId: 'benton',
    role: 'admin',
  })),
}));

jest.mock('../../ui/materials/LiquidPanel', () => ({
  LiquidPanel: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
}));

jest.mock('../../ui/materials/TactileButton', () => ({
  TactileButton: ({
    children,
    onClick,
    ...props
  }: React.PropsWithChildren<{ onClick?: () => void } & Record<string, unknown>>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('../../components/pilot/RiskConfirmationModal', () => ({
  RiskConfirmationModal: () => null,
}));

const mockTraceRefresh = jest.fn();
jest.mock('../../hooks/useTraceByCorrelationId', () => ({
  useTraceByCorrelationId: () => ({
    phase: 'ready' as const,
    events: [],
    error: null,
    refresh: mockTraceRefresh,
  }),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { ExecutionConsole } from '../../components/pilot/ExecutionConsole';
import type { UseToolInvocationResult } from '../../hooks/useToolInvocation';
import { getSession } from '../../auth/session';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_STATS_RESPONSE = {
  totalEvents: 1500,
  oldestTimestamp: '2026-02-01T00:00:00.000Z',
  newestTimestamp: '2026-03-03T12:00:00.000Z',
  perParcelCap: 2000,
  cappedParcelsCount: 3,
  maxEventsInParcel: 1999,
};

function makeTerminalInvocation(
  phase: 'succeeded' | 'failed' = 'succeeded'
): UseToolInvocationResult {
  return {
    state: {
      phase,
      correlationId: 'corr-test-123',
      error: phase === 'failed' ? 'Tool failed' : null,
      errorCode: phase === 'failed' ? 'EXECUTION_FAILED' : null,
      response: phase === 'succeeded' ? { ok: true, correlationId: 'corr-test-123', result: {} } : null,
      confirmation: null,
      toolId: 'test:tool',
      params: {},
    },
    invoke: jest.fn(),
    confirm: jest.fn(),
    cancel: jest.fn(),
    reset: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Lane J — Trace stats wiring', () => {
  beforeEach(() => {
    mockGetTraceStats.mockReset();
    mockTraceRefresh.mockReset();
    (getSession as jest.Mock).mockReturnValue({
      userId: 'admin-user',
      countyId: 'benton',
      role: 'admin',
    });
  });

  it('fetches stats and renders diagnostics drawer when admin clicks Show evidence', async () => {
    mockGetTraceStats.mockResolvedValueOnce(MOCK_STATS_RESPONSE);

    render(
      <ExecutionConsole
        invocation={makeTerminalInvocation('succeeded')}
        tool={{ toolId: 'test:tool', name: 'Test', suite: 'os', risk: 'read_only', modes: ['pilot'] }}
      />
    );

    const user = userEvent.setup();

    // Click "Show evidence" to reveal the EvidenceRail
    await user.click(screen.getByTestId('evidence-toggle'));

    // Stats are fetched when admin + evidence visible
    await waitFor(() => {
      expect(mockGetTraceStats).toHaveBeenCalledTimes(1);
    });

    // Diagnostics drawer should be present (collapsed)
    const drawer = await screen.findByTestId('diagnostics-drawer');
    expect(drawer).toBeInTheDocument();

    // Toggle text should indicate global scope
    const toggle = screen.getByTestId('diagnostics-toggle');
    expect(toggle).toHaveTextContent(/trace store diagnostics/i);
    expect(toggle).toHaveTextContent(/global/i);
  });

  it('shows stats values when admin expands diagnostics drawer', async () => {
    mockGetTraceStats.mockResolvedValueOnce(MOCK_STATS_RESPONSE);

    render(
      <ExecutionConsole
        invocation={makeTerminalInvocation('succeeded')}
        tool={{ toolId: 'test:tool', name: 'Test', suite: 'os', risk: 'read_only', modes: ['pilot'] }}
      />
    );

    const user = userEvent.setup();

    // Open evidence rail
    await user.click(screen.getByTestId('evidence-toggle'));

    // Wait for stats to load
    await waitFor(() => {
      expect(mockGetTraceStats).toHaveBeenCalled();
    });

    // Expand diagnostics
    await user.click(screen.getByTestId('diagnostics-toggle'));

    // Verify mapped values
    expect(screen.getByTestId('diag-per-parcel-cap')).toHaveTextContent('2000');
    expect(screen.getByTestId('diag-capped-parcels-count')).toHaveTextContent('3');
    expect(screen.getByTestId('diag-max-events-in-parcel')).toHaveTextContent('1999');
  });

  it('does not fetch stats or show drawer for non-admin user', async () => {
    (getSession as jest.Mock).mockReturnValue({
      userId: 'viewer-user',
      countyId: 'benton',
      role: 'viewer',
    });

    render(
      <ExecutionConsole
        invocation={makeTerminalInvocation('succeeded')}
        tool={{ toolId: 'test:tool', name: 'Test', suite: 'os', risk: 'read_only', modes: ['pilot'] }}
      />
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId('evidence-toggle'));

    // Should NOT fetch stats for non-elevated role
    expect(mockGetTraceStats).not.toHaveBeenCalled();

    // Diagnostics drawer should NOT be present
    expect(screen.queryByTestId('diagnostics-drawer')).not.toBeInTheDocument();
  });

  it('handles stats 403 gracefully (fetchFailed renders Feed unavailable)', async () => {
    mockGetTraceStats.mockRejectedValueOnce(new Error('Failed to get trace stats (403): ACCESS_DENIED'));

    render(
      <ExecutionConsole
        invocation={makeTerminalInvocation('succeeded')}
        tool={{ toolId: 'test:tool', name: 'Test', suite: 'os', risk: 'read_only', modes: ['pilot'] }}
      />
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId('evidence-toggle'));

    // Wait for fetch failure
    await waitFor(() => {
      expect(mockGetTraceStats).toHaveBeenCalled();
    });

    // fetchFailed=true → StalenessFooter should show "Feed unavailable"
    await waitFor(() => {
      expect(screen.getByTestId('staleness-indicator')).toHaveTextContent(/feed unavailable/i);
    });
  });
});
