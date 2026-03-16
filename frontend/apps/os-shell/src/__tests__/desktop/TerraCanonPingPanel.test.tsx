import { vi, describe, it, expect, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

let memoryRouterEntries: string[] = ['/'];

vi.mock('react-router-dom', () => {
  const actual = vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter initialEntries={memoryRouterEntries}>{children}</actual.MemoryRouter>
    ),
  };
});

vi.mock('../../auth/authStorage', () => ({
  getToken: () => 'canon-ping-test-token',
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

vi.mock('../../auth/authBridge', () => ({
  registerLogoutHandler: vi.fn(),
  unregisterLogoutHandler: vi.fn(),
}));

import Router from '../../Router';

describe('TerraCanon ping panel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
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

  function mockTextResponse(payload: unknown): Response {
    return {
      text: async () => JSON.stringify(payload),
    } as Response;
  }

  it('click -> request fires and normalized result renders', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
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
    vi.spyOn(global, 'fetch').mockResolvedValue({
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

  it('runs canon doctor and renders PASS status', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/pilot/canon/doctor')) {
        return mockTextResponse({
          tool: 'terracanon-doctor',
          version: 1,
          startedAt: '2026-02-19T01:00:00.000Z',
          dryRun: false,
          overallOk: true,
        });
      }

      return mockTextResponse({
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
      });
    });

    await renderCanonRoute();
    fireEvent.click(screen.getByTestId('terracanon-run-canon-doctor'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(screen.getByTestId('terracanon-canon-doctor-status')).toHaveTextContent('PASS');
      expect(screen.getByTestId('terracanon-canon-doctor-started')).toHaveTextContent(
        '2026-02-19T01:00:00.000Z'
      );
    });

    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/pilot/canon/doctor'))).toBe(
      true
    );
  });

  it('runs gatefast and renders failure with details', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/pilot/canon/gatefast')) {
        return mockTextResponse({
          tool: 'terracanon-gatefast',
          version: 1,
          startedAt: '2026-02-19T01:05:00.000Z',
          dryRun: false,
          overallOk: false,
          error: 'gatefast failed',
          rawStderr: 'boom',
        });
      }

      return mockTextResponse({
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
      });
    });

    await renderCanonRoute();
    fireEvent.click(screen.getByTestId('terracanon-run-canon-gatefast'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(screen.getByTestId('terracanon-canon-gatefast-status')).toHaveTextContent('FAIL');
      expect(screen.getByTestId('terracanon-canon-gatefast-error')).toHaveTextContent(
        'gatefast failed'
      );
    });

    const details = screen.getByTestId('terracanon-canon-gatefast-details');
    const summary = details.querySelector('summary');
    if (!summary) {
      throw new Error('missing gatefast details summary');
    }
    fireEvent.click(summary);
    expect(details).toHaveTextContent('boom');

    expect(
      fetchMock.mock.calls.some(([url]) => String(url).includes('/pilot/canon/gatefast'))
    ).toBe(true);
  });

  it('Run All runs Doctor -> GateFast -> Ping and stops on first failure', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/pilot/canon/doctor')) {
        return mockTextResponse({
          tool: 'terracanon-doctor',
          version: 1,
          startedAt: '2026-02-19T02:00:00.000Z',
          dryRun: false,
          overallOk: true,
        });
      }

      if (url.includes('/pilot/canon/gatefast')) {
        return mockTextResponse({
          tool: 'terracanon-gatefast',
          version: 1,
          startedAt: '2026-02-19T02:00:01.000Z',
          dryRun: false,
          overallOk: false,
          error: 'gatefast failed',
          rawStderr: 'boom',
        });
      }

      if (url.includes('/pilot/canon/ping')) {
        return mockTextResponse({
          tool: 'terracanon-ping',
          version: 1,
          startedAt: '2026-02-19T02:00:02.000Z',
          dryRun: false,
          overallOk: true,
          normalized: {
            ok: true,
            ts: '2026-02-19T02:00:02.000Z',
            echo: 'hello',
            toolId: 'explain_model_inputs',
            inputCount: 3,
          },
        });
      }

      return mockTextResponse({ overallOk: false, error: 'not found' });
    });

    await renderCanonRoute();

    fireEvent.click(screen.getByTestId('terracanon-run-all'));

    await waitFor(() => {
      expect(screen.getByTestId('terracanon-run-all-step-doctor')).toHaveTextContent('PASS');
      expect(screen.getByTestId('terracanon-run-all-step-gatefast')).toHaveTextContent('FAIL');
    });

    expect(screen.getByTestId('terracanon-run-all-step-gatefast-error')).toHaveTextContent(
      'gatefast failed'
    );
    expect(screen.getByTestId('terracanon-run-all-step-ping')).toHaveTextContent('IDLE');

    const calls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(calls.some((url) => url.includes('/pilot/canon/doctor'))).toBe(true);
    expect(calls.some((url) => url.includes('/pilot/canon/gatefast'))).toBe(true);
    expect(calls.some((url) => url.includes('/pilot/canon/ping'))).toBe(false);
  });
});
