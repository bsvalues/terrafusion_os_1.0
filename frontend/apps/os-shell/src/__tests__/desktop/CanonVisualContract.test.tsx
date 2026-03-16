/**
 * P20 Canon Visual Contract — DOM regression tests.
 *
 * Test 1: Canon root uses `canon-shell` class and contains exactly 3
 *         primary regions: header, devCockpit, suiteLauncher
 * Test 2: No `.animate-pulse` exists on Canon in dev preview
 */
import { vi, describe, test, expect, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

let memoryRouterEntries: string[] = ['/'];

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter initialEntries={memoryRouterEntries}>{children}</actual.MemoryRouter>
    ),
  };
});

vi.mock('../../auth/authStorage', () => ({
  getToken: () => 'visual-contract-token',
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

vi.mock('../../auth/authBridge', () => ({
  registerLogoutHandler: vi.fn(),
  unregisterLogoutHandler: vi.fn(),
}));

import Router from '../../Router';

describe('P20 Canon Visual Contract', () => {
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

  test('canon root has canon-shell class and contains header, devCockpit, suiteLauncher', async () => {
    global.fetch = vi.fn(async () => ({
      text: async () => JSON.stringify({ overallOk: false }),
    })) as unknown as typeof fetch;

    await renderCanonRoute();

    // Root element uses canon-shell class
    const root = screen.getByTestId('terracanon-root');
    expect(root.classList.contains('canon-shell')).toBe(true);

    // Three primary regions exist
    const header = screen.getByTestId('canon-header');
    expect(header).toBeInTheDocument();
    expect(header.tagName.toLowerCase()).toBe('header');

    const devCockpit = screen.getByTestId('canon-devCockpit');
    expect(devCockpit).toBeInTheDocument();
    expect(devCockpit.tagName.toLowerCase()).toBe('section');

    const suiteLauncher = screen.getByTestId('canon-suiteLauncher');
    expect(suiteLauncher).toBeInTheDocument();

    // All three are children (direct or nested) of the root
    expect(root.contains(header)).toBe(true);
    expect(root.contains(devCockpit)).toBe(true);
    expect(root.contains(suiteLauncher)).toBe(true);
  });

  test('no .animate-pulse elements exist inside Canon', async () => {
    global.fetch = vi.fn(async () => ({
      text: async () => JSON.stringify({ overallOk: false }),
    })) as unknown as typeof fetch;

    await renderCanonRoute();

    const root = screen.getByTestId('terracanon-root');

    // Query for any element with animate-pulse class
    const pulseElements = root.querySelectorAll(
      '.animate-pulse, .animate-pulse-slow, .animate-pulse-glow, [class*="animate-pulse"]'
    );
    expect(pulseElements.length).toBe(0);
  });
});
