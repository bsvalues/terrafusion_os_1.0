/**
 * Phase 31-A — Shell Chrome Integration Contract
 *
 * Contract: shell-routed-content wraps all non-home OS routes.
 * Home route / must NOT render shell-routed-content (StageZeroState only).
 *
 * Routes tested:
 *   /forge  /atlas  /dais  /dossier  /gpt  /property
 *
 * Chrome partitioning: home has no shell-routed-content container;
 * every suite/property route does.
 */

import { vi, describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';

// ============================================================================
// Mocks — copied verbatim from DesktopRouteLandmarkContract.test.tsx
// ============================================================================

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
  getToken: () => 'smoke-test-token',
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

vi.mock('../../auth/authBridge', () => ({
  registerLogoutHandler: vi.fn(),
  unregisterLogoutHandler: vi.fn(),
}));

import Router from '../../Router';

// ============================================================================
// Tests
// ============================================================================

describe('Phase 31-A: Shell Chrome Integration Contract', () => {
  afterEach(() => {
    cleanup();
    memoryRouterEntries = ['/'];
  });

  it('home route / renders StageZeroState, NOT shell-routed-content', async () => {
    memoryRouterEntries = ['/'];
    render(<Router />);

    // Give Suspense time to settle
    await new Promise((r) => setTimeout(r, 100));

    expect(screen.queryByTestId('shell-routed-content')).toBeNull();
  });

  it('/forge renders inside shell-routed-content', async () => {
    memoryRouterEntries = ['/forge'];
    render(<Router />);

    // ForgeSuiteHome has the heaviest lazy-import graph of the suite
    // routes; under sweep load the 10s findBy can race the Suspense
    // resolve. Match the per-test budget of the surrounding contract
    // tests but bump it to 20s for the Forge surface specifically.
    await screen.findByTestId('shell-routed-content', {}, { timeout: 20000 });
  }, 30000);

  it('/atlas renders inside shell-routed-content', async () => {
    memoryRouterEntries = ['/atlas'];
    render(<Router />);

    // Lazy suite imports under sweep load can race a 10s budget; 25s gives
    // headroom for saturated workers without masking real regressions.
    await screen.findByTestId('shell-routed-content', {}, { timeout: 25000 });
  }, 35000);

  it('/dais renders inside shell-routed-content', async () => {
    memoryRouterEntries = ['/dais'];
    render(<Router />);

    // Lazy suite imports under sweep load can race a 10s budget; 25s gives
    // headroom for saturated workers without masking real regressions.
    await screen.findByTestId('shell-routed-content', {}, { timeout: 25000 });
  }, 35000);

  it('/dossier renders inside shell-routed-content', async () => {
    memoryRouterEntries = ['/dossier'];
    render(<Router />);

    // Lazy suite imports under sweep load can race a 10s budget; 25s gives
    // headroom for saturated workers without masking real regressions.
    await screen.findByTestId('shell-routed-content', {}, { timeout: 25000 });
  }, 35000);

  it('/gpt renders inside shell-routed-content', async () => {
    memoryRouterEntries = ['/gpt'];
    render(<Router />);

    // Lazy suite imports under sweep load can race a 10s budget; 25s gives
    // headroom for saturated workers without masking real regressions.
    await screen.findByTestId('shell-routed-content', {}, { timeout: 25000 });
  }, 35000);

  it('/property renders inside shell-routed-content', async () => {
    memoryRouterEntries = ['/property'];
    render(<Router />);

    // Lazy suite imports under sweep load can race a 10s budget; 25s gives
    // headroom for saturated workers without masking real regressions.
    await screen.findByTestId('shell-routed-content', {}, { timeout: 25000 });
  }, 35000);

  it('chrome partitioning — home has no container, /forge has it', async () => {
    // Verify home has no shell-routed-content
    memoryRouterEntries = ['/'];
    const { unmount } = render(<Router />);
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.queryByTestId('shell-routed-content')).toBeNull();
    unmount();

    // Verify /forge has shell-routed-content
    memoryRouterEntries = ['/forge'];
    render(<Router />);
    // Lazy suite imports under sweep load can race a 10s budget; 25s gives
    // headroom for saturated workers without masking real regressions.
    await screen.findByTestId('shell-routed-content', {}, { timeout: 25000 });
  }, 35000);
});
