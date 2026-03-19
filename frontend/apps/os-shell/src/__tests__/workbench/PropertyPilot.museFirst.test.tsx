import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PropertyPilot } from '../../pages/workbench/tabs/PropertyPilot';

const listPilotToolsMock = vi.fn();

vi.mock('../../api/pilotApi', async () => {
  const actual = await vi.importActual<typeof import('../../api/pilotApi')>('../../api/pilotApi');
  return {
    ...actual,
    listPilotTools: (...args: unknown[]) => listPilotToolsMock(...args),
  };
});

vi.mock('../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({ parcelId: 'P-100' }),
}));

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: (state: { operations: unknown[] }) => unknown) =>
    selector({ operations: [] }),
}));

vi.mock('../../hooks/useToolInvocation', () => ({
  useToolInvocation: () => ({
    invoke: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
    reset: vi.fn(),
    state: {
      phase: 'idle',
      toolId: null,
      correlationId: null,
      errorCode: null,
      response: null,
      validation: null,
      confirmation: null,
      params: null,
      error: null,
    },
  }),
}));

vi.mock('../../hooks/usePilotTraceList', () => ({
  usePilotTraceList: () => ({ phase: 'ready', events: [], error: null, refresh: vi.fn() }),
}));

vi.mock('../../components/pilot/ExecutionConsole', () => ({
  ExecutionConsole: () => <div data-testid='execution-console' />,
}));

vi.mock('../../components/pilot/EvidenceRail', () => ({
  EvidenceRail: () => <div data-testid='evidence-rail' />,
}));

vi.mock('../../components/workbench', () => ({
  ParcelContextHeader: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  ),
  InvocationHistory: () => <div data-testid='invocation-history' />,
}));

vi.mock('../../ui/materials/BentoCard', () => ({
  BentoCard: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/property/P-100/pilot']}>
      <Routes>
        <Route path='/property/:parcelId' element={<Outlet context={{ parcelId: 'P-100' }} />}>
          <Route path='pilot' element={children} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('PropertyPilot Muse-first surface', () => {
  it('loads only muse tools and hides write-capable or pilot-mode tools', async () => {
    listPilotToolsMock.mockResolvedValue({
      count: 4,
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
          toolId: 'summarize_dossier',
          displayName: 'Summarize Dossier',
          suite: 'dossier',
          mode: 'muse',
          risk: 'read_only',
          description: 'Summarize the current dossier.',
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
    });

    render(
      <Wrapper>
        <PropertyPilot />
      </Wrapper>
    );

    await waitFor(() => {
      expect(listPilotToolsMock).toHaveBeenCalledWith('muse');
    });

    expect(await screen.findByTestId('pilot-muse-scope')).toHaveTextContent(/only read-only reasoning and explanation tools/i);
    expect(await screen.findByText('Explain Value Change')).toBeInTheDocument();
    expect(screen.getByText('Summarize Dossier')).toBeInTheDocument();
    expect(screen.queryByText('Draft Appeal Response')).not.toBeInTheDocument();
    expect(screen.queryByText('Search Trace')).not.toBeInTheDocument();
  });
});
