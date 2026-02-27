/**
 * Phase 24 — Desktop Launch Smoke Contract
 *
 * Contract: every route from getDesktopIcons() must render in the app
 * without tripping the global ErrorBoundary crash fallback.
 *
 * Phase 22 guarantees "IDs are canonical".
 * Phase 23 guarantees "route exists in Router".
 * Phase 24 guarantees "route doesn't immediately crash on render".
 *
 * Technique: mock BrowserRouter as a passthrough controlled by a mutable
 * entries variable, mock auth as authenticated, render full Router for
 * each desktop icon route, wait for Suspense, verify no ErrorBoundary.
 *
 * Scope: Mechanical smoke only; not asserting business behavior or data loading.
 */

import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { getDesktopIcons } from '../../config/desktopManifest';

// ============================================================================
// Mocks (hoisted before imports by Jest)
// ============================================================================

// Mutable entries array — set per-test to control initial route.
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

// Mock auth to be authenticated — bypasses AuthGuard redirect to /login.
jest.mock('../../auth/authStorage', () => ({
  getToken: () => 'smoke-test-token',
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

// Mock authBridge to avoid registration side effects.
jest.mock('../../auth/authBridge', () => ({
  registerLogoutHandler: jest.fn(),
  unregisterLogoutHandler: jest.fn(),
}));

// Top-level import — Router.tsx uses getViteEnv() (not import.meta directly),
// so this is safe in Jest's CJS context.
import Router from '../../Router';

// ============================================================================
// Allowlist
// ============================================================================

/** Routes that intentionally can't render in jsdom. Keep empty + audited. */
const ALLOWLIST = new Map<string, string>([
  ['/gpt', 'GptStudioView lazy-with-catch pattern does not resolve in jsdom'],
]);

// ============================================================================
// Helpers
// ============================================================================

function isExternal(p: string): boolean {
  return p.startsWith('http://') || p.startsWith('https://');
}

// ============================================================================
// Tests
// ============================================================================

describe('Phase 24 contract: every desktop icon route renders without crashing', () => {
  afterEach(() => {
    cleanup();
  });

  const icons = getDesktopIcons();

  const testableIcons = icons.filter((icon) => {
    const r = icon.route;
    if (!r || typeof r !== 'string') return false;
    if (isExternal(r)) return false;
    if (ALLOWLIST.has(r)) return false;
    return true;
  });

  it('has testable desktop icons', () => {
    expect(testableIcons.length).toBeGreaterThan(0);
  });

  it.each(testableIcons)(
    '$name ($id) renders at $route without crashing',
    async (icon) => {
      memoryRouterEntries = [icon.route];

      render(<Router />);

      // Wait for React.lazy Suspense fallback to resolve.
      await waitFor(
        () => {
          expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Let async effects settle (useEffect, nested lazy loads).
      await new Promise((resolve) => setTimeout(resolve, 50));

      // ErrorBoundary crash fallback must NOT be present.
      expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();
    }
  );
});
