import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PilotConsole } from '@/pages/PilotConsole';
import { PilotConsoleContent } from '@/pages/PilotConsoleContent';

const listPilotToolsMock = vi.fn();
const getPilotHealthMock = vi.fn();
const getPilotTraceMock = vi.fn();
const validatePilotToolMock = vi.fn();
const invokePilotToolMock = vi.fn();

vi.mock('@/api/pilotApi', async () => {
  const actual = await vi.importActual<typeof import('@/api/pilotApi')>('@/api/pilotApi');
  return {
    ...actual,
    listPilotTools: (...args: unknown[]) => listPilotToolsMock(...args),
    getPilotHealth: (...args: unknown[]) => getPilotHealthMock(...args),
    getPilotTrace: (...args: unknown[]) => getPilotTraceMock(...args),
    validatePilotTool: (...args: unknown[]) => validatePilotToolMock(...args),
    invokePilotTool: (...args: unknown[]) => invokePilotToolMock(...args),
  };
});

const museToolsFixture = {
  count: 3,
  tools: [
    {
      toolId: 'explain_value_change',
      displayName: 'Explain Value Change',
      suite: 'forge',
      mode: 'muse',
      risk: 'read_only',
      description: 'Explain the assessed value delta.',
    },
    {
      toolId: 'draft_appeal_response',
      displayName: 'Draft Appeal Response',
      suite: 'dais',
      mode: 'muse',
      risk: 'write_low',
      description: 'Draft a response.',
    },
    {
      toolId: 'search_trace_by_correlation',
      displayName: 'Search Trace',
      suite: 'pilot',
      mode: 'pilot',
      risk: 'read_only',
      description: 'Search a trace chain.',
    },
  ],
};

function renderInRouter(node: React.ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

describe('Pilot Muse surface filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listPilotToolsMock.mockResolvedValue(museToolsFixture);
    getPilotHealthMock.mockResolvedValue({
      status: 'healthy',
      toolCount: 3,
      traceEventCount: 4,
    });
    getPilotTraceMock.mockResolvedValue({ events: [] });
    validatePilotToolMock.mockResolvedValue({
      valid: true,
      violations: [],
      tool: {
        toolId: 'explain_value_change',
        suite: 'forge',
        risk: 'read_only',
      },
    });
    invokePilotToolMock.mockResolvedValue({
      ok: true,
      correlationId: 'cid-test-123',
    });
  });

  it('PilotConsole requests muse tools and hides non-muse or write-capable tools', async () => {
    renderInRouter(<PilotConsole />);

    fireEvent.click(screen.getByRole('button', { name: 'Load Tools' }));

    await waitFor(() => {
      expect(listPilotToolsMock).toHaveBeenCalledWith('muse');
    });

    expect(await screen.findByText('Explain Value Change')).toBeInTheDocument();
    expect(screen.queryByText('Draft Appeal Response')).not.toBeInTheDocument();
    expect(screen.queryByText('Search Trace')).not.toBeInTheDocument();
  });

  it('PilotConsoleContent requests muse tools and hides non-muse or write-capable tools', async () => {
    renderInRouter(<PilotConsoleContent />);

    await waitFor(() => {
      expect(listPilotToolsMock).toHaveBeenCalledWith('muse');
    });

    expect(await screen.findByText('Explain Value Change')).toBeInTheDocument();
    expect(screen.queryByText('Draft Appeal Response')).not.toBeInTheDocument();
    expect(screen.queryByText('Search Trace')).not.toBeInTheDocument();
  });
});
