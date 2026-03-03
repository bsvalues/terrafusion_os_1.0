import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvidenceRail } from '../../components/pilot/EvidenceRail';
import { ExecutionConsole } from '../../components/pilot/ExecutionConsole';
import type { PilotTraceEvent } from '../../api/pilotApi';

const mockUseTraceByCorrelationId = jest.fn();
const mockUseTraceStats = jest.fn();
const mockGetSession = jest.fn();

jest.mock('../../ui/materials/LiquidPanel', () => ({
  LiquidPanel: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
}));

jest.mock('../../ui/materials/TactileButton', () => ({
  TactileButton: ({ children, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
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

describe('Governance evidence + execution surfaces', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    mockGetSession.mockReturnValue({
      userId: 'u-1',
      countyId: 'benton',
      role: 'viewer',
      permissions: [],
      mode: 'pilot',
    });
  });

  it('renders EvidenceRail timeline from trace events', () => {
    const events: PilotTraceEvent[] = [
      {
        eventId: 'evt-1',
        type: 'tool_completed',
        toolId: 'explain_value_change',
        correlationId: 'corr-1',
        summary: 'Value change explained.',
        timestamp: '2026-03-02T19:00:00.000Z',
        context: {
          countyId: 'benton',
          userId: 'u-1',
          mode: 'pilot',
          parcelId: 'parcel-123',
        },
      },
    ];

    render(<EvidenceRail phase="ready" events={events} error={null} onRetry={jest.fn()} />);

    expect(screen.getByText('Value change explained.')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-header')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-timeline')).toBeInTheDocument();
  });

  it('shows payloadRef as reference text (Gate 6 compliant)', () => {
    const events: PilotTraceEvent[] = [
      {
        eventId: 'evt-2',
        type: 'tool_completed',
        toolId: 'summarize_dossier',
        correlationId: 'corr-2',
        summary: 'Dossier summary generated.',
        timestamp: '2026-03-02T19:01:00.000Z',
        context: {
          countyId: 'benton',
          userId: 'u-1',
          mode: 'pilot',
          parcelId: 'parcel-123',
        },
        payloadRef: 'dossier://doc/42',
      },
    ];

    render(<EvidenceRail phase="ready" events={events} error={null} onRetry={jest.fn()} />);

    const payloadRef = screen.getByTestId('payload-ref');
    expect(payloadRef).toHaveTextContent('Payload stored: dossier://doc/42');
    // Gate 6: no link to dossier, reference only
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders ExecutionConsole lifecycle output with correlationId', async () => {
    const user = userEvent.setup();
    const confirm = jest.fn();
    const cancel = jest.fn();
    const reset = jest.fn();

    render(
      <ExecutionConsole
        invocation={{
          state: {
            phase: 'succeeded',
            toolId: 'explain_value_change',
            params: { parcelId: 'parcel-123' },
            validation: null,
            confirmation: null,
            response: {
              ok: true,
              correlationId: 'corr-console-1',
              result: { explanation: 'Market adjustment applied.' },
              traceEventId: 'evt-console-1',
            },
            correlationId: 'corr-console-1',
            error: null,
            errorCode: null,
          },
          invoke: jest.fn(),
          confirm,
          cancel,
          reset,
        }}
        tool={{
          toolId: 'explain_value_change',
          suite: 'forge',
          risk: 'read_only',
          description: 'Explain value delta.',
        }}
      />
    );

    expect(screen.getByTestId('correlation-badge')).toBeInTheDocument();
    expect(screen.getByText(/Market adjustment applied/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  // ── Confirmation gating ────────────────────────────────────────────────

  it('write_high tool blocks in confirming phase until reason code is selected', async () => {
    const user = userEvent.setup();
    const confirm = jest.fn();
    const cancel = jest.fn();

    render(
      <ExecutionConsole
        invocation={{
          state: {
            phase: 'confirming',
            toolId: 'run_valuation_model',
            params: { parcelId: 'parcel-456' },
            validation: null,
            confirmation: {
              confirmationRequired: true,
              reasonCodeRequired: true,
              reasonCodes: ['market_adjustment', 'correction'],
              supervisorRequired: false,
              supervisorRoles: [],
              risk: 'write_high',
              toolId: 'run_valuation_model',
              toolDescription: 'Run valuation model on parcel.',
            },
            response: null,
            correlationId: null,
            error: null,
            errorCode: null,
          },
          invoke: jest.fn(),
          confirm,
          cancel,
          reset: jest.fn(),
        }}
        tool={{
          toolId: 'run_valuation_model',
          suite: 'forge',
          risk: 'write_high',
          description: 'Run valuation model on parcel.',
        }}
      />
    );

    // Modal must be rendered for write_high confirmation
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Confirm button should be disabled (no reason code selected yet)
    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    expect(confirmBtn).toBeDisabled();

    // confirm() must NOT have been called yet
    expect(confirm).not.toHaveBeenCalled();

    // Select reason code
    await user.click(screen.getByText('market_adjustment'));

    // Now confirm button should be enabled — click it
    await waitFor(() => expect(confirmBtn).toBeEnabled());
    await user.click(confirmBtn);

    // confirm() should have been called with the reasonCode
    await waitFor(() => {
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(confirm).toHaveBeenCalledWith(
        expect.objectContaining({ reasonCode: 'market_adjustment' })
      );
    });
  });

  it('read_only tool bypasses confirmation — no dialog rendered', () => {
    render(
      <ExecutionConsole
        invocation={{
          state: {
            phase: 'succeeded',
            toolId: 'explain_value_change',
            params: { parcelId: 'parcel-789' },
            validation: null,
            confirmation: null,
            response: {
              ok: true,
              correlationId: 'corr-bypass-1',
              result: { explanation: 'No impact.' },
              traceEventId: 'evt-bypass-1',
            },
            correlationId: 'corr-bypass-1',
            error: null,
            errorCode: null,
          },
          invoke: jest.fn(),
          confirm: jest.fn(),
          cancel: jest.fn(),
          reset: jest.fn(),
        }}
        tool={{
          toolId: 'explain_value_change',
          suite: 'forge',
          risk: 'read_only',
          description: 'Explain value delta.',
        }}
      />
    );

    // No confirmation dialog should be present
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Phase indicator shows succeeded
    expect(screen.getByTestId('phase-indicator')).toHaveTextContent('Succeeded');
  });

  it('shows diagnostics values for elevated role', async () => {
    const user = userEvent.setup();
    mockGetSession.mockReturnValue({
      userId: 'admin-1',
      countyId: 'benton',
      role: 'administrator',
      permissions: ['admin:trace'],
      mode: 'pilot',
    });
    mockUseTraceByCorrelationId.mockReturnValue({
      phase: 'ready',
      events: [
        {
          eventId: 'evt-diag-1',
          type: 'tool_completed',
          toolId: 'explain_value_change',
          correlationId: 'corr-diag-1',
          summary: 'Completed with trace payload.',
          timestamp: '2026-03-03T10:00:00.000Z',
          context: { countyId: 'benton', userId: 'admin-1', mode: 'pilot', parcelId: 'P-1' },
        },
      ],
      error: null,
      refresh: jest.fn(),
    });
    mockUseTraceStats.mockReturnValue({
      diagnostics: {
        perParcelCap: 2000,
        cappedParcelsCount: 4,
        maxEventsInParcel: 2000,
        oldestEventTimestamp: '2026-01-01T00:00:00.000Z',
        newestEventTimestamp: '2026-03-03T10:00:00.000Z',
      },
      lastFetchedAt: new Date('2026-03-03T10:00:01.000Z'),
      fetchFailed: false,
      refresh: jest.fn(),
    });

    render(
      <ExecutionConsole
        invocation={{
          state: {
            phase: 'succeeded',
            toolId: 'explain_value_change',
            params: { parcelId: 'P-1' },
            validation: null,
            confirmation: null,
            response: {
              ok: true,
              correlationId: 'corr-diag-1',
              result: { ok: true },
              traceEventId: 'evt-diag-1',
            },
            correlationId: 'corr-diag-1',
            error: null,
            errorCode: null,
          },
          invoke: jest.fn(),
          confirm: jest.fn(),
          cancel: jest.fn(),
          reset: jest.fn(),
        }}
        tool={{
          toolId: 'explain_value_change',
          suite: 'forge',
          risk: 'read_only',
          description: 'Explain value delta.',
        }}
      />
    );

    await user.click(screen.getByTestId('evidence-toggle'));
    expect(screen.getByTestId('trace-diagnostics-label')).toHaveTextContent(
      /trace store diagnostics \(global\)/i
    );

    await user.click(screen.getByTestId('diagnostics-toggle'));
    expect(screen.getByTestId('diag-capped-parcels-count')).toHaveTextContent('4');
    expect(screen.getByTestId('diag-max-events-in-parcel')).toHaveTextContent('2000');
  });

  it('shows feed unavailable when diagnostics fetch fails (403 path)', async () => {
    const user = userEvent.setup();
    mockGetSession.mockReturnValue({
      userId: 'admin-1',
      countyId: 'benton',
      role: 'administrator',
      permissions: ['admin:trace'],
      mode: 'pilot',
    });
    mockUseTraceByCorrelationId.mockReturnValue({
      phase: 'ready',
      events: [
        {
          eventId: 'evt-diag-403',
          type: 'tool_completed',
          toolId: 'explain_value_change',
          correlationId: 'corr-diag-403',
          summary: 'Completed with trace payload.',
          timestamp: '2026-03-03T10:00:00.000Z',
          context: { countyId: 'benton', userId: 'admin-1', mode: 'pilot', parcelId: 'P-2' },
        },
      ],
      error: null,
      refresh: jest.fn(),
    });
    mockUseTraceStats.mockReturnValue({
      diagnostics: null,
      lastFetchedAt: null,
      fetchFailed: true,
      refresh: jest.fn(),
    });

    render(
      <ExecutionConsole
        invocation={{
          state: {
            phase: 'succeeded',
            toolId: 'explain_value_change',
            params: { parcelId: 'P-2' },
            validation: null,
            confirmation: null,
            response: {
              ok: true,
              correlationId: 'corr-diag-403',
              result: { ok: true },
              traceEventId: 'evt-diag-403',
            },
            correlationId: 'corr-diag-403',
            error: null,
            errorCode: null,
          },
          invoke: jest.fn(),
          confirm: jest.fn(),
          cancel: jest.fn(),
          reset: jest.fn(),
        }}
        tool={{
          toolId: 'explain_value_change',
          suite: 'forge',
          risk: 'read_only',
          description: 'Explain value delta.',
        }}
      />
    );

    await user.click(screen.getByTestId('evidence-toggle'));
    expect(screen.getByText(/feed unavailable/i)).toBeInTheDocument();
  });

  it('hides diagnostics affordance for non-elevated role', async () => {
    const user = userEvent.setup();
    mockGetSession.mockReturnValue({
      userId: 'viewer-1',
      countyId: 'benton',
      role: 'viewer',
      permissions: [],
      mode: 'pilot',
    });
    mockUseTraceByCorrelationId.mockReturnValue({
      phase: 'ready',
      events: [],
      error: null,
      refresh: jest.fn(),
    });

    render(
      <ExecutionConsole
        invocation={{
          state: {
            phase: 'succeeded',
            toolId: 'explain_value_change',
            params: { parcelId: 'P-3' },
            validation: null,
            confirmation: null,
            response: {
              ok: true,
              correlationId: 'corr-viewer-1',
              result: { ok: true },
              traceEventId: 'evt-viewer-1',
            },
            correlationId: 'corr-viewer-1',
            error: null,
            errorCode: null,
          },
          invoke: jest.fn(),
          confirm: jest.fn(),
          cancel: jest.fn(),
          reset: jest.fn(),
        }}
        tool={{
          toolId: 'explain_value_change',
          suite: 'forge',
          risk: 'read_only',
          description: 'Explain value delta.',
        }}
      />
    );

    await user.click(screen.getByTestId('evidence-toggle'));
    expect(screen.queryByTestId('trace-diagnostics-label')).not.toBeInTheDocument();
    expect(screen.queryByTestId('diagnostics-toggle')).not.toBeInTheDocument();
  });
});
