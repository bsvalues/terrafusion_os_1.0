import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

let memoryRouterEntries: string[] = ['/'];

const mockValidatePilotTool = jest.fn();
const mockInvokeTool = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter initialEntries={memoryRouterEntries}>{children}</actual.MemoryRouter>
    ),
  };
});

jest.mock('../../auth/authStorage', () => ({
  getToken: () => 'smoke-test-token',
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

jest.mock('../../auth/authBridge', () => ({
  registerLogoutHandler: jest.fn(),
  unregisterLogoutHandler: jest.fn(),
}));

jest.mock('../../api/pilotApi', () => ({
  validatePilotTool: (...args: unknown[]) => mockValidatePilotTool(...args),
  invokeTool: (...args: unknown[]) => mockInvokeTool(...args),
}));

import Router from '../../Router';

describe('Phase 49 contract: TerraCanon preflight allow invokes exactly once', () => {
  beforeEach(() => {
    mockValidatePilotTool.mockReset();
    mockInvokeTool.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  async function renderCanonAndWait() {
    memoryRouterEntries = ['/canon'];
    render(<Router />);

    await waitFor(
      () => {
        expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  }

  it('allow invokes once and correlationId is displayed', async () => {
    mockValidatePilotTool.mockResolvedValue({
      valid: true,
      violations: [],
      tool: { toolId: 'summarize_dossier', suite: 'dossier', risk: 'read_only' },
    });

    mockInvokeTool.mockImplementation(async (request: any) => ({
      success: true,
      correlationId: request.params.correlationId,
      result: {
        toolId: request.toolId,
        output: 'ok',
      },
    }));

    await renderCanonAndWait();

    fireEvent.click(screen.getByTestId('terracanon-run-governed-command'));

    await waitFor(() => {
      expect(mockInvokeTool).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('terracanon-command-correlation')).toBeInTheDocument();
    });

    const calledCorrelation = mockInvokeTool.mock.calls[0][0].params.correlationId;
    const shownCorrelation = (screen.getByTestId('terracanon-command-correlation').textContent ?? '').trim();

    expect(calledCorrelation).toBe(shownCorrelation);
    expect(shownCorrelation.startsWith('canon-')).toBe(true);
  });
});
