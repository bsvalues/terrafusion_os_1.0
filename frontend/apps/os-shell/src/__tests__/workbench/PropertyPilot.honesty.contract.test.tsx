/**
 * PropertyPilot.honesty.contract.test.tsx
 *
 * Source honesty contract for the PropertyPilot tab (WO-WB-INSTR-002).
 * Mirrors the Dossier/Dais honesty contracts. Ensures:
 *   1. Baseline disclosure box carries a WorkbenchSourceBadge
 *   2. That badge shows "unavailable" while the tool list is loading/empty
 *   3. It reflects "live" once the governed tool list loads (state-driven, not hardcoded)
 *   4. No aspirational "AI-powered" language
 *   5. Baseline disclosure uses governed read-only wording
 *   6. No tool is invoked on mount (the tab only lists tools)
 *
 * Reuses the mock setup from PropertyPilot.museFirst.test.tsx.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, vi } from 'vitest';

const listPilotToolsMock = vi.fn();
const invokeMock = vi.fn();

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
    invoke: invokeMock,
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
  WorkbenchSourceBadge: ({ source }: { source: string }) => (
    <span data-testid='workbench-source-badge' data-source={source} />
  ),
}));

vi.mock('../../ui/materials/BentoCard', () => ({
  BentoCard: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

import { PropertyPilot } from '../../pages/workbench/tabs/PropertyPilot';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter initialEntries={['/property/P-100/pilot']}>
    <Routes>
      <Route path='/property/:parcelId' element={<Outlet context={{ parcelId: 'P-100' }} />}>
        <Route path='pilot' element={children} />
      </Route>
    </Routes>
  </MemoryRouter>
);

describe('PropertyPilot source honesty contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listPilotToolsMock.mockResolvedValue({
      count: 1,
      tools: [
        {
          toolId: 'explain_value_change',
          displayName: 'Explain Value Change',
          suite: 'forge',
          mode: 'muse',
          risk: 'read_only',
          description: 'Explain the assessed value delta.',
        },
      ],
    });
  });

  it('baseline disclosure box carries a WorkbenchSourceBadge', () => {
    render(<Wrapper><PropertyPilot /></Wrapper>);
    const disclosure = screen.getByTestId('pilot-baseline-disclosure');
    expect(disclosure.querySelector('[data-testid="workbench-source-badge"]')).toBeInTheDocument();
  });

  it('baseline badge shows "unavailable" while the tool list is loading', () => {
    render(<Wrapper><PropertyPilot /></Wrapper>);
    const disclosure = screen.getByTestId('pilot-baseline-disclosure');
    const badge = disclosure.querySelector('[data-testid="workbench-source-badge"]');
    expect(badge).toHaveAttribute('data-source', 'unavailable');
  });

  it('baseline badge reflects live once the governed tool list loads', async () => {
    render(<Wrapper><PropertyPilot /></Wrapper>);
    const disclosure = screen.getByTestId('pilot-baseline-disclosure');
    await waitFor(() => {
      expect(disclosure.querySelector('[data-testid="workbench-source-badge"]')).toHaveAttribute('data-source', 'live');
    });
  });

  it('all badges avoid synthetic claims (unavailable or live only)', () => {
    render(<Wrapper><PropertyPilot /></Wrapper>);
    for (const badge of screen.getAllByTestId('workbench-source-badge')) {
      expect(['unavailable', 'live']).toContain(badge.getAttribute('data-source'));
    }
  });

  it('does not use aspirational "AI-powered" language', () => {
    render(<Wrapper><PropertyPilot /></Wrapper>);
    expect(screen.getByTestId('property-pilot-tab').textContent).not.toMatch(/AI-powered/i);
  });

  it('baseline disclosure uses governed read-only wording', () => {
    render(<Wrapper><PropertyPilot /></Wrapper>);
    expect(screen.getByTestId('pilot-baseline-disclosure').textContent).toMatch(/read-only|returned from|governed/i);
  });

  it('does not invoke any tool on mount without user action', () => {
    render(<Wrapper><PropertyPilot /></Wrapper>);
    expect(invokeMock).not.toHaveBeenCalled();
  });
});
