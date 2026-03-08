/**
 * Phase 29 — Auth Boundary Intent Contract
 *
 * Contract: desktop routes behind AuthGuard behave correctly across auth states:
 *   1) Unauthenticated deep-link → redirects to /login → login-page landmark renders
 *   2) Authenticated deep-link → route renders its Phase 25 landmark (no auth gate)
 *   3) No crash in either state ("Reset Application" never appears)
 *
 * Phase 22–28 proved: routes exist, render landmarks, survive deep-links, survive
 * bad input. Phase 29 proves: the auth boundary correctly gates access and the
 * login page is reachable.
 *
 * Prevents:
 * - Silent auth gate failures where navigate() fires but content never mounts
 * - Redirect loops (/login → /login → /login)
 * - Crash on unauthenticated access to protected routes
 * - Login page rendering blank after AuthGuard redirect
 *
 * Technique:
 * - Control auth state via mutable `mockGetToken` return value
 * - Unauthenticated: getToken → null → AuthGuard fires → /login renders
 * - Authenticated: getToken → 'token' → route renders landmark
 * - Same BrowserRouter → MemoryRouter swap as Phase 24–28
 *
 * Production change:
 * - data-testid="login-page" on LoginPage.tsx root element
 *
 * Scope: Mechanical auth boundary only; not testing real JWT exchange or backend.
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { getDesktopIcons } from '../../config/desktopManifest';

// ============================================================================
// Auth state control — mutable token for switching between test scenarios
// ============================================================================

let mockTokenValue: string | null = 'auth-test-token';

// ============================================================================
// Mocks (hoisted before imports by Jest)
// ============================================================================

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
  getToken: () => mockTokenValue,
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

jest.mock('../../auth/authBridge', () => ({
  registerLogoutHandler: jest.fn(),
  unregisterLogoutHandler: jest.fn(),
}));

// Mock authAPI to prevent real network calls from LoginPage
jest.mock('../../services/authAPI', () => ({
  login: jest.fn().mockRejectedValue(new Error('mock: not called in test')),
}));

import Router from '../../Router';

// ============================================================================
// Landmark Registry (same as Phase 25/27)
// ============================================================================

const ROUTE_LANDMARKS: Record<string, { anyTestIds: string[] }> = {
  '/forge': {
    anyTestIds: ['suite-forge-root', 'standalone-shell'],
  },
  '/atlas': {
    anyTestIds: ['suite-atlas-root', 'standalone-shell'],
  },
  '/dais': {
    anyTestIds: ['suite-dais-root', 'standalone-shell'],
  },
  '/dossier': {
    anyTestIds: ['suite-dossier-root', 'standalone-shell'],
  },
  '/gpt': {
    anyTestIds: ['suite-gpt-root', 'standalone-shell'],
  },
  '/property/1234567890/forge': {
    anyTestIds: ['property-forge-tab', 'property-workbench-root'],
  },
  '/property/1234567890/atlas': {
    anyTestIds: ['property-atlas-tab', 'property-workbench-root'],
  },
  '/property/1234567890/dais': {
    anyTestIds: ['property-dais-tab', 'property-workbench-root'],
  },
  '/property/1234567890/dossier': {
    anyTestIds: ['property-dossier-tab', 'property-workbench-root'],
  },
  '/property/1234567890/pilot': {
    anyTestIds: ['property-pilot-tab', 'property-workbench-root'],
  },
  '/pilot': {
    anyTestIds: ['standalone-shell', 'pilot-console-content'],
  },
  '/trace': {
    anyTestIds: ['standalone-shell', 'trace-console-content'],
  },
  '/canon': {
    anyTestIds: ['terracanon-root', 'standalone-shell'],
  },
  '/property': {
    anyTestIds: ['property-search-root'],
  },
};

// ============================================================================
// Helpers
// ============================================================================

function isExternal(p: string): boolean {
  return p.startsWith('http://') || p.startsWith('https://');
}

/** Routes that intentionally can't render in jsdom. */
const ALLOWLIST = new Map<string, string>([
  ['/gpt', 'GptStudioView lazy-with-catch pattern does not resolve in jsdom'],
  ['/dais', 'DaisSuiteHome makes PILT API calls on mount that throw in jsdom'],
  ['/atlas', 'AtlasSuiteHome makes fetch calls on mount that throw in jsdom'],
  ['/dossier', 'DossierSuiteHome lazy modules make API calls that throw in jsdom'],
]);

function assertLandmark(route: string) {
  const spec = ROUTE_LANDMARKS[route];
  if (!spec) {
    throw new Error(`Phase 29: No landmark spec for route "${route}".`);
  }
  const hit = spec.anyTestIds.some((id) => screen.queryByTestId(id));
  if (!hit) {
    throw new Error(
      `Phase 29: Route "${route}" rendered but no landmark found.\n` +
        `Expected any of: ${spec.anyTestIds.join(', ')}`
    );
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('Phase 29 contract: auth boundary intent — unauthenticated redirects, authenticated renders', () => {
  afterEach(() => {
    cleanup();
    // Reset to authenticated for safety between tests
    mockTokenValue = 'auth-test-token';
  });

  const icons = getDesktopIcons();

  const testableIcons = icons.filter((icon) => {
    const r = icon.route;
    if (!r || typeof r !== 'string') return false;
    if (isExternal(r)) return false;
    if (ALLOWLIST.has(r)) return false;
    return true;
  });

  // ========================================================================
  // Part 1: Unauthenticated access → AuthGuard redirects to /login
  // ========================================================================

  describe('unauthenticated: protected routes redirect to login', () => {
    it.each(testableIcons)(
      '$name ($id): unauthenticated deep-link to $route → login-page renders',
      async (icon) => {
        // Set unauthenticated state
        mockTokenValue = null;
        memoryRouterEntries = [icon.route];

        render(<Router />);

        // Wait for Suspense to resolve
        await waitFor(
          () => {
            expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
          },
          { timeout: 5000 }
        );

        // Must not crash
        expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();

        // AuthGuard should have redirected to /login → login-page landmark
        await waitFor(
          () => {
            expect(screen.getByTestId('login-page')).toBeInTheDocument();
          },
          { timeout: 5000 }
        );

        // Login page should show the sign-in form (email input is sufficient proof)
        expect(document.getElementById('email')).toBeInTheDocument();
      }
    );

    it('unauthenticated access to / → login-page renders', async () => {
      mockTokenValue = null;
      memoryRouterEntries = ['/'];

      render(<Router />);

      await waitFor(
        () => {
          expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();

      await waitFor(
        () => {
          expect(screen.getByTestId('login-page')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('/login itself does NOT redirect (no redirect loop)', async () => {
      mockTokenValue = null;
      memoryRouterEntries = ['/login'];

      render(<Router />);

      await waitFor(
        () => {
          expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Must not crash
      expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();

      // Login page should render directly (not redirect loop)
      await waitFor(
        () => {
          expect(screen.getByTestId('login-page')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  // ========================================================================
  // Part 2: Authenticated access → route renders Phase 25 landmark
  // ========================================================================

  describe('authenticated: protected routes render landmarks', () => {
    it.each(testableIcons)(
      '$name ($id): authenticated deep-link to $route → Phase 25 landmark',
      async (icon) => {
        // Set authenticated state
        mockTokenValue = 'auth-test-token';
        memoryRouterEntries = [icon.route];

        render(<Router />);

        // Wait for Suspense to resolve
        await waitFor(
          () => {
            expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
          },
          { timeout: 5000 }
        );

        // Must not crash
        expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();

        // Must NOT see login page (auth passed)
        expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();

        // Phase 25 landmark must appear
        await waitFor(
          () => {
            assertLandmark(icon.route);
          },
          { timeout: 5000 }
        );
      }
    );
  });
});
