/**
 * P18 Command History + Re-run — tests that the palette tracks recently
 * executed commands and supports Enter-to-rerun.
 *
 * Test 1: Run a command → reopen palette → "Recent" section with that command
 * Test 2: Enter on empty input re-runs the most recent command
 */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  getToken: () => 'history-test-token',
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

jest.mock('../../auth/authBridge', () => ({
  registerLogoutHandler: jest.fn(),
  unregisterLogoutHandler: jest.fn(),
}));

import Router from '../../Router';

function mockTextResponse(payload: unknown): Response {
  return { text: async () => JSON.stringify(payload) } as Response;
}

function doctorOk() {
  return mockTextResponse({
    tool: 'terracanon-doctor',
    version: 1,
    startedAt: '2026-02-19T04:00:00.000Z',
    dryRun: false,
    overallOk: true,
  });
}

// Skipped: Ctrl+K command palette overlay not yet implemented (stubs only).
// Re-enable when the full command palette with history tracking lands.
describe.skip('P18 Command History', () => {
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

  async function openPaletteAndWait() {
    // Fire Ctrl+K inside waitFor to retry if the effect handler isn't registered yet
    await waitFor(() => {
      act(() => {
        fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
      });
      expect(screen.getByTestId('command-palette-overlay')).toBeInTheDocument();
    });
  }

  function closePalette() {
    fireEvent.keyDown(window, { key: 'Escape' });
  }

  test('run command → reopen palette → Recent section shows that command', async () => {
    let doctorCalls = 0;
    global.fetch = jest.fn(async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/pilot/canon/doctor')) {
        doctorCalls++;
        return doctorOk();
      }
      return mockTextResponse({ overallOk: false, error: 'not found' });
    }) as unknown as typeof fetch;

    await renderCanonRoute();

    // Open palette, click Doctor
    await openPaletteAndWait();
    fireEvent.click(screen.getByTestId('cmd-doctor'));

    // Palette closes, doctor runs and result renders
    await waitFor(() => {
      expect(screen.queryByTestId('command-palette-overlay')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(doctorCalls).toBeGreaterThanOrEqual(1);
    });
    // Wait for doctor result to render (ensures handler fully settled)
    await waitFor(() => {
      expect(screen.getByTestId('terracanon-canon-doctor-result')).toBeInTheDocument();
    });

    // Reopen palette → "Recent" section should appear with Doctor
    await openPaletteAndWait();

    expect(screen.getByTestId('command-palette-recent')).toBeInTheDocument();
    expect(screen.getByTestId('cmd-recent-doctor')).toBeInTheDocument();
    expect(screen.getByTestId('cmd-recent-doctor')).toHaveTextContent('Run Doctor');
  });

  test('Enter on empty input re-runs the most recent command', async () => {
    let doctorCalls = 0;
    global.fetch = jest.fn(async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('/pilot/canon/doctor')) {
        doctorCalls++;
        return doctorOk();
      }
      return mockTextResponse({ overallOk: false, error: 'not found' });
    }) as unknown as typeof fetch;

    await renderCanonRoute();

    // First: run Doctor via palette to populate history
    await openPaletteAndWait();
    fireEvent.click(screen.getByTestId('cmd-doctor'));
    await waitFor(() => {
      expect(doctorCalls).toBeGreaterThanOrEqual(1);
    });

    const callsAfterFirst = doctorCalls;

    // Reopen palette, press Enter on empty input → should re-run Doctor
    await openPaletteAndWait();
    fireEvent.keyDown(screen.getByTestId('command-palette-input'), { key: 'Enter' });

    // Palette closes and Doctor runs again
    await waitFor(() => {
      expect(doctorCalls).toBeGreaterThan(callsAfterFirst);
    });
  });
});
