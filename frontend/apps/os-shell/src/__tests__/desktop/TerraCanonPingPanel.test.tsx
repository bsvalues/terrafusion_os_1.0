import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

let memoryRouterEntries: string[] = ['/'];

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
  getToken: () => 'canon-ping-test-token',
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

jest.mock('../../auth/authBridge', () => ({
  registerLogoutHandler: jest.fn(),
  unregisterLogoutHandler: jest.fn(),
}));

import Router from '../../Router';

describe('TerraCanon ping panel', () => {
  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  async function renderCanonRoute() {
    memoryRouterEntries = ['/canon'];
    render(<Router />);

    await waitFor(
      () => {
        expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  }

  it('click -> request fires and normalized result renders', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      text: async () =>
        JSON.stringify({
          tool: 'terracanon-ping',
          version: 1,
          startedAt: '2026-02-19T00:00:00.000Z',
          dryRun: false,
          overallOk: true,
          normalized: {
            ok: true,
            ts: '2026-02-19T00:00:00.000Z',
            echo: 'hello',
            toolId: 'explain_model_inputs',
            inputCount: 3,
          },
        }),
    } as Response);

    await renderCanonRoute();

    fireEvent.click(screen.getByTestId('terracanon-run-canon-ping'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/pilot/canon/ping');
    expect((init as RequestInit).method).toBe('POST');

    await waitFor(() => {
      expect(screen.getByTestId('terracanon-canon-ping-tool-id')).toHaveTextContent(
        'explain_model_inputs'
      );
      expect(screen.getByTestId('terracanon-canon-ping-input-count')).toHaveTextContent('3');
      expect(screen.getByTestId('terracanon-canon-ping-echo-value')).toHaveTextContent('hello');
    });
  });

  it('renders failure message when backend returns overallOk=false', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      text: async () =>
        JSON.stringify({
          tool: 'terracanon-ping',
          version: 1,
          startedAt: '2026-02-19T00:00:00.000Z',
          dryRun: false,
          overallOk: false,
          error: 'canon:ping exited with code 1',
          stderr: 'spawn timeout',
          normalized: null,
        }),
    } as Response);

    await renderCanonRoute();

    fireEvent.change(screen.getByTestId('terracanon-canon-ping-echo'), {
      target: { value: 'broken' },
    });
    fireEvent.click(screen.getByTestId('terracanon-run-canon-ping'));

    await waitFor(() => {
      expect(screen.getByTestId('terracanon-canon-ping-error')).toHaveTextContent(
        'canon:ping exited with code 1'
      );
      expect(screen.getByTestId('terracanon-canon-ping-error-details')).toHaveTextContent(
        'spawn timeout'
      );
    });
  });
});
