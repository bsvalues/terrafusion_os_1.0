import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvidenceRail } from '../../components/pilot/EvidenceRail';
import { ExecutionConsole } from '../../components/pilot/ExecutionConsole';
import type { PilotTraceEvent } from '../../api/pilotApi';

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

describe('Governance evidence + execution surfaces', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});

