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
  getToken: () => 'workbench-test-token',
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

jest.mock('../../auth/authBridge', () => ({
  registerLogoutHandler: jest.fn(),
  unregisterLogoutHandler: jest.fn(),
}));

import Router from '../../Router';

describe('PropertyWorkbench explain_model_inputs action', () => {
  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  async function renderWorkbenchRoute() {
    memoryRouterEntries = ['/property/12345-001'];
    render(<Router />);

    await waitFor(
      () => {
        expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  }

  function mockTextResponse(payload: unknown): Response {
    return {
      text: async () => JSON.stringify(payload),
    } as Response;
  }

  it('runs explain_model_inputs and renders normalized success fields', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/pilot/workbench/explain-model-inputs')) {
        return mockTextResponse({
          tool: 'terracanon-ping',
          version: 1,
          startedAt: '2026-02-20T00:00:00.000Z',
          dryRun: false,
          overallOk: true,
          normalized: {
            ok: true,
            ts: '2026-02-20T00:00:00.000Z',
            echo: 'hello',
            toolId: 'explain_model_inputs',
            inputCount: 3,
          },
        });
      }

      return mockTextResponse({ overallOk: true });
    });

    await renderWorkbenchRoute();

    fireEvent.click(screen.getByTestId('workbench-run-explain-model-inputs'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(screen.getByTestId('workbench-explain-model-inputs-status')).toHaveTextContent('PASS');
      expect(screen.getByTestId('workbench-explain-model-inputs-tool-id')).toHaveTextContent(
        'explain_model_inputs'
      );
      expect(screen.getByTestId('workbench-explain-model-inputs-input-count')).toHaveTextContent(
        '3'
      );
    });

    const calls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(calls.some((url) => url.includes('/pilot/workbench/explain-model-inputs'))).toBe(true);
  });

  it('renders failure and details for explain_model_inputs action', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/pilot/workbench/explain-model-inputs')) {
        return mockTextResponse({
          tool: 'terracanon-ping',
          version: 1,
          startedAt: '2026-02-20T00:01:00.000Z',
          dryRun: false,
          overallOk: false,
          error: 'workbench explain failed',
          rawStderr: 'tool failure details',
        });
      }

      return mockTextResponse({ overallOk: true });
    });

    await renderWorkbenchRoute();

    fireEvent.change(screen.getByTestId('workbench-explain-model-inputs-echo'), {
      target: { value: 'bad-input' },
    });
    fireEvent.click(screen.getByTestId('workbench-run-explain-model-inputs'));

    await waitFor(() => {
      expect(screen.getByTestId('workbench-explain-model-inputs-status')).toHaveTextContent('FAIL');
      expect(screen.getByTestId('workbench-explain-model-inputs-error')).toHaveTextContent(
        'workbench explain failed'
      );
    });

    const details = screen.getByTestId('workbench-explain-model-inputs-details');
    const summary = details.querySelector('summary');
    if (!summary) {
      throw new Error('missing details summary');
    }
    fireEvent.click(summary);

    expect(screen.getByTestId('workbench-explain-model-inputs-raw-stderr')).toHaveTextContent(
      'tool failure details'
    );
  });
});
