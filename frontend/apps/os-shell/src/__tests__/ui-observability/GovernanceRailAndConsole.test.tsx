import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvidenceRail } from '../../components/pilot/EvidenceRail';
import { ExecutionConsole } from '../../components/pilot/ExecutionConsole';
import type { PilotTraceResponse } from '../../api/pilotApi';
import { getPilotTrace } from '../../api/pilotApi';

jest.mock('../../api/pilotApi', () => {
  const actual = jest.requireActual('../../api/pilotApi');
  return {
    ...actual,
    getPilotTrace: jest.fn(),
  };
});

const mockGetPilotTrace = getPilotTrace as jest.MockedFunction<typeof getPilotTrace>;

describe('Governance evidence + execution surfaces', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders EvidenceRail from real trace query responses', async () => {
    const traceResponse: PilotTraceResponse = {
      events: [
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
      ],
    };
    mockGetPilotTrace.mockResolvedValue(traceResponse);

    render(<EvidenceRail correlationIds={['corr-1']} parcelId='parcel-123' />);

    await waitFor(() => {
      expect(screen.getByText('Value change explained.')).toBeInTheDocument();
    });
    expect(screen.getByText('corr-1')).toBeInTheDocument();
    expect(mockGetPilotTrace).toHaveBeenCalledWith('corr-1');
  });

  it('shows payload_ref entries with a dossier link', async () => {
    mockGetPilotTrace.mockResolvedValue({
      events: [
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
      ],
    });

    render(<EvidenceRail correlationIds={['corr-2']} parcelId='parcel-123' />);

    await waitFor(() => {
      expect(screen.getByTestId('payload-ref-link')).toBeInTheDocument();
    });
    expect(screen.getByTestId('payload-ref-link')).toHaveTextContent('View in Dossier');
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

