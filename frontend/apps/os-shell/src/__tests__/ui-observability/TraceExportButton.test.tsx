/**
 * TraceExportButton.test.tsx
 *
 * Lane K4: Contract tests for the admin-only "Export evidence pack" button
 * in ExecutionConsole.
 *
 * Coverage:
 *   1. Non-admin: button not rendered
 *   2. Admin: button rendered
 *   3. Click issues correct request URL (parcelId + correlationId when present)
 *   4. 403/500 handled gracefully (error state visible)
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExecutionConsole } from '../../components/pilot/ExecutionConsole';

// ── Mocks ──────────────────────────────────────────────────────────────

const mockUseTraceByCorrelationId = jest.fn();
const mockUseTraceStats = jest.fn();
const mockGetSession = jest.fn();
const mockExportTraces = jest.fn();

jest.mock('../../ui/materials/LiquidPanel', () => ({
  LiquidPanel: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
}));

jest.mock('../../ui/materials/TactileButton', () => ({
  TactileButton: ({
    children,
    ...props
  }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('../../hooks/useTraceByCorrelationId', () => ({
  useTraceByCorrelationId: (...args: unknown[]) => mockUseTraceByCorrelationId(...args),
}));

jest.mock('../../hooks/useTraceStats', () => ({
  useTraceStats: (...args: unknown[]) => mockUseTraceStats(...args),
}));

jest.mock('../../auth/session', () => ({
  ...jest.requireActual('../../auth/session'),
  getSession: () => mockGetSession(),
}));

jest.mock('../../api/pilotApi', () => ({
  ...jest.requireActual('../../api/pilotApi'),
  exportTraces: (...args: unknown[]) => mockExportTraces(...args),
  requestApprovalToken: jest.fn(),
}));

// ── Helpers ────────────────────────────────────────────────────────────

function hooksDefaults() {
  mockUseTraceByCorrelationId.mockReturnValue({
    phase: 'ready',
    events: [],
    error: null,
    refresh: jest.fn(),
  });
  mockUseTraceStats.mockReturnValue({
    diagnostics: null,
    lastFetchedAt: null,
    fetchFailed: false,
    refresh: jest.fn(),
  });
}

const succeededState = (overrides?: Record<string, unknown>) => ({
  phase: 'succeeded' as const,
  toolId: 'explain_value_change',
  params: { parcelId: 'P-123' },
  validation: null,
  confirmation: null,
  response: {
    ok: true,
    correlationId: 'corr-k4-1',
    result: 'ok',
  },
  correlationId: 'corr-k4-1',
  error: null,
  errorCode: null,
  ...overrides,
});

const noop = jest.fn();
const invocation = (stateOverrides?: Record<string, unknown>) => ({
  state: succeededState(stateOverrides),
  invoke: noop,
  confirm: noop,
  cancel: noop,
  reset: noop,
});

const tool = {
  toolId: 'explain_value_change',
  suite: 'forge' as const,
  risk: 'read_only' as const,
  description: 'Explain value delta.',
};

// suppress URL.createObjectURL / revokeObjectURL in jsdom
beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:mock');
  global.URL.revokeObjectURL = jest.fn();
});

beforeEach(() => {
  jest.clearAllMocks();
  hooksDefaults();
});

// ── Tests ──────────────────────────────────────────────────────────────

describe('Lane K4: Trace export button', () => {
  it('does NOT render export button for non-admin user', () => {
    mockGetSession.mockReturnValue({
      userId: 'u-viewer',
      countyId: 'benton',
      role: 'viewer',
      permissions: [],
      mode: 'pilot',
    });

    render(<ExecutionConsole invocation={invocation()} tool={tool} />);

    expect(screen.queryByTestId('trace-export-btn')).not.toBeInTheDocument();
  });

  it('renders export button for admin user on terminal state with parcelId', () => {
    mockGetSession.mockReturnValue({
      userId: 'u-admin',
      countyId: 'benton',
      role: 'admin',
      permissions: [],
      mode: 'pilot',
    });

    render(<ExecutionConsole invocation={invocation()} tool={tool} />);

    const btn = screen.getByTestId('trace-export-btn');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Export evidence pack (NDJSON)');
  });

  it('click calls exportTraces with parcelId and correlationId', async () => {
    const user = userEvent.setup();
    mockGetSession.mockReturnValue({
      userId: 'u-admin',
      countyId: 'benton',
      role: 'admin',
      permissions: [],
      mode: 'pilot',
    });
    mockExportTraces.mockResolvedValue(new Blob(['{}'], { type: 'application/x-ndjson' }));

    // Spy on createElement to verify download was triggered
    const appendSpy = jest.spyOn(document.body, 'appendChild');

    render(<ExecutionConsole invocation={invocation()} tool={tool} />);

    await user.click(screen.getByTestId('trace-export-btn'));

    await waitFor(() => {
      expect(mockExportTraces).toHaveBeenCalledWith({
        parcelId: 'P-123',
        correlationId: 'corr-k4-1',
      });
    });

    // Verify a download anchor was appended
    await waitFor(() => {
      const anchors = appendSpy.mock.calls
        .map((c) => c[0])
        .filter((el): el is HTMLAnchorElement => el instanceof HTMLAnchorElement);
      expect(anchors.length).toBeGreaterThanOrEqual(1);
      const a = anchors[anchors.length - 1];
      expect(a.download).toMatch(/^trace-export_P-123_corr-k4-1_/);
      expect(a.download).toMatch(/\.ndjson$/);
    });

    appendSpy.mockRestore();
  });

  it('shows error banner on 403 response without crashing console', async () => {
    const user = userEvent.setup();
    mockGetSession.mockReturnValue({
      userId: 'u-admin',
      countyId: 'benton',
      role: 'admin',
      permissions: [],
      mode: 'pilot',
    });
    const err = new Error('Forbidden') as Error & { correlationId?: string; status?: number };
    err.correlationId = 'corr-denied-1';
    err.status = 403;
    mockExportTraces.mockRejectedValue(err);

    render(<ExecutionConsole invocation={invocation()} tool={tool} />);

    await user.click(screen.getByTestId('trace-export-btn'));

    await waitFor(() => {
      const errEl = screen.getByTestId('trace-export-error');
      expect(errEl).toHaveTextContent('Forbidden');
      expect(errEl).toHaveTextContent('corr-denied-1');
    });

    // Console should still be rendered (not crashed)
    expect(screen.getByTestId('phase-indicator')).toBeInTheDocument();
  });

  it('shows error banner on 500 response without crashing console', async () => {
    const user = userEvent.setup();
    mockGetSession.mockReturnValue({
      userId: 'u-admin',
      countyId: 'benton',
      role: 'admin',
      permissions: [],
      mode: 'pilot',
    });
    mockExportTraces.mockRejectedValue(new Error('Internal Server Error'));

    render(<ExecutionConsole invocation={invocation()} tool={tool} />);

    await user.click(screen.getByTestId('trace-export-btn'));

    await waitFor(() => {
      const errEl = screen.getByTestId('trace-export-error');
      expect(errEl).toHaveTextContent('Internal Server Error');
    });

    // Console should still be rendered
    expect(screen.getByTestId('phase-indicator')).toBeInTheDocument();
  });

  it('does NOT render export button when parcelId is absent from params', () => {
    mockGetSession.mockReturnValue({
      userId: 'u-admin',
      countyId: 'benton',
      role: 'admin',
      permissions: [],
      mode: 'pilot',
    });

    render(
      <ExecutionConsole
        invocation={invocation({ params: {} })}
        tool={tool}
      />
    );

    expect(screen.queryByTestId('trace-export-btn')).not.toBeInTheDocument();
  });
});
