import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

let memoryRouterEntries: string[] = ['/'];

const mockValidatePilotTool = vi.fn();
const mockInvokeTool = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter initialEntries={memoryRouterEntries}>{children}</actual.MemoryRouter>
    ),
  };
});

vi.mock('../../auth/authStorage', async () => ({
  getToken: () => 'smoke-test-token',
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

vi.mock('../../auth/authBridge', async () => ({
  registerLogoutHandler: vi.fn(),
  unregisterLogoutHandler: vi.fn(),
}));

vi.mock('../../api/pilotApi', async () => ({
  validatePilotTool: (...args: unknown[]) => mockValidatePilotTool(...args),
  invokeTool: (...args: unknown[]) => mockInvokeTool(...args),
}));

import Router from '../../Router';

describe('Phase 49 contract: TerraCanon preflight deny blocks invocation', () => {
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

  it('deny shows reason + correlationId and does not invoke tool', async () => {
    mockValidatePilotTool.mockResolvedValue({
      valid: false,
      violations: ['Denied by policy'],
      tool: { toolId: 'summarize_dossier', suite: 'dossier', risk: 'read_only' },
    });

    await renderCanonAndWait();

    fireEvent.click(screen.getByTestId('terracanon-run-governed-command'));

    await waitFor(() => {
      expect(screen.getByTestId('terracanon-command-deny-reason')).toBeInTheDocument();
    });

    expect(screen.getByTestId('terracanon-command-deny-reason')).toHaveTextContent('Denied by policy');

    const correlationText = (screen.getByTestId('terracanon-command-correlation').textContent ?? '').trim();
    expect(correlationText.length).toBeGreaterThan(0);
    expect(correlationText.startsWith('canon-')).toBe(true);

    expect(mockInvokeTool).toHaveBeenCalledTimes(0);
  });
});
