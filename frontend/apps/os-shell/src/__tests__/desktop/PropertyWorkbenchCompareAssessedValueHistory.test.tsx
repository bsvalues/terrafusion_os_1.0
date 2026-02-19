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
  getToken: () => 'workbench-compare-test-token',
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

jest.mock('../../auth/authBridge', () => ({
  registerLogoutHandler: jest.fn(),
  unregisterLogoutHandler: jest.fn(),
}));

import Router from '../../Router';

describe('PropertyWorkbench compare_assessed_value_history action', () => {
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

  it('runs compare_assessed_value_history and renders success output', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/pilot/workbench/compare-assessed-value-history')) {
        return mockTextResponse({
          tool: 'compare_assessed_value_history',
          version: 1,
          startedAt: '2026-02-20T10:00:00.000Z',
          dryRun: false,
          overallOk: true,
          normalized: {
            trend: [
              { year: 2022, av: 250000 },
              { year: 2023, av: 255000 },
              { year: 2024, av: 260000 },
            ],
            narrative:
              'Assessed value trend shows 3 year(s) with a consistent step-up pattern.',
          },
        });
      }

      return mockTextResponse({ overallOk: true });
    });

    await renderWorkbenchRoute();
    fireEvent.click(screen.getByTestId('workbench-run-compare-assessed-value-history'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(screen.getByTestId('workbench-compare-assessed-value-history-status')).toHaveTextContent(
        'PASS'
      );
      expect(
        screen.getByTestId('workbench-compare-assessed-value-history-narrative')
      ).toHaveTextContent('Assessed value trend shows 3 year(s)');
      expect(screen.getByTestId('workbench-compare-assessed-value-history-json')).toHaveTextContent(
        '"trend"'
      );
    });
  });

  it('renders compare_assessed_value_history failure and details toggle', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/pilot/workbench/compare-assessed-value-history')) {
        return mockTextResponse({
          tool: 'compare_assessed_value_history',
          version: 1,
          startedAt: '2026-02-20T10:01:00.000Z',
          dryRun: false,
          overallOk: false,
          error: 'compare_assessed_value_history failed',
          rawStderr: 'MODE_MISMATCH',
        });
      }

      return mockTextResponse({ overallOk: true });
    });

    await renderWorkbenchRoute();
    fireEvent.click(screen.getByTestId('workbench-run-compare-assessed-value-history'));

    await waitFor(() => {
      expect(screen.getByTestId('workbench-compare-assessed-value-history-status')).toHaveTextContent(
        'FAIL'
      );
      expect(screen.getByTestId('workbench-compare-assessed-value-history-error')).toHaveTextContent(
        'compare_assessed_value_history failed'
      );
    });

    const details = screen.getByTestId('workbench-compare-assessed-value-history-details');
    const summary = details.querySelector('summary');
    if (!summary) {
      throw new Error('missing compare details summary');
    }
    fireEvent.click(summary);

    expect(
      screen.getByTestId('workbench-compare-assessed-value-history-raw-stderr')
    ).toHaveTextContent('MODE_MISMATCH');
  });
});
