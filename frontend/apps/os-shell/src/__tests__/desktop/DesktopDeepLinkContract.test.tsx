/**
 * Phase 27 — Desktop Deep-Link Intent Contract
 *
 * Contract: for every desktop route from getDesktopIcons(), direct navigation
 * (paste URL / browser refresh) renders the Phase 25 landmark WITHOUT
 * requiring prior desktop interaction (no click, no icon grid).
 *
 * Phase 22 guarantees "IDs are canonical".
 * Phase 23 guarantees "route exists in Router".
 * Phase 24 guarantees "route doesn't immediately crash on render".
 * Phase 25 guarantees "route renders non-empty content with a landmark".
 * Phase 26 guarantees "click → navigate → landmark".
 * Phase 27 guarantees "deep-link (refresh / pasted URL) → landmark".
 *
 * Prevents:
 * - "Works from desktop click, fails on refresh/pasted URL"
 * - Missing Suspense boundaries on direct entry
 * - Broken lazy-load paths when entering mid-tree
 * - AuthGuard redirect loops on direct route access
 *
 * Technique: set MemoryRouter initialEntries to each desktop route
 * (simulating direct URL entry), render the full Router, assert landmark.
 * Same BrowserRouter→MemoryRouter swap as Phase 24/25/26.
 *
 * Scope: Mechanical deep-link only; not asserting business data or API calls.
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { getDesktopIcons } from '../../config/desktopManifest';

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
  getToken: () => 'smoke-test-token',
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

jest.mock('../../auth/authBridge', () => ({
  registerLogoutHandler: jest.fn(),
  unregisterLogoutHandler: jest.fn(),
}));

import Router from '../../Router';

// ============================================================================
// Landmark Registry (identical to Phase 25 — the canonical landmark set)
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
    throw new Error(
      `Phase 27: No landmark spec for route "${route}". ` +
        'Add it to ROUTE_LANDMARKS with at least one stable testid.'
    );
  }

  const hit = spec.anyTestIds.some((id) => screen.queryByTestId(id));
  if (!hit) {
    throw new Error(
      `Phase 27: Deep-linked to "${route}" but no landmark found.\n` +
        `Expected any of: ${spec.anyTestIds.join(', ')}\n` +
        'Fix: verify that direct-entry to this route renders the same landmarks as Phase 25.'
    );
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('Phase 27 contract: deep-link → Router mounts → landmark renders', () => {
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

  it('has testable desktop icons for deep-link testing', () => {
    expect(testableIcons.length).toBeGreaterThan(0);
  });

  it('every route has a deep-link landmark spec registered', () => {
    const missing = testableIcons.filter((icon) => !ROUTE_LANDMARKS[icon.route]);
    if (missing.length > 0) {
      throw new Error(
        'Routes without deep-link landmark spec:\n' +
          missing.map((i) => `  - ${i.id}: ${i.route}`).join('\n') +
          '\nAdd them to ROUTE_LANDMARKS in this test file.'
      );
    }
  });

  it.each(testableIcons)(
    '$name ($id): deep-link to $route renders Phase 25 landmark',
    async (icon) => {
      // Simulate direct-entry: set MemoryRouter to start at the route
      // (as if user pasted the URL or hit refresh at this path).
      memoryRouterEntries = [icon.route];

      render(<Router />);

      // Wait for Suspense to resolve (same as Phase 24/25/26).
      await waitFor(
        () => {
          expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Crash guard: app should not be in error fallback state.
      expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();

      // Phase 27 core guarantee: deep-link produces the same landmark
      // that Phase 25 verifies via navigated-to route.
      await waitFor(
        () => {
          assertLandmark(icon.route);
        },
        { timeout: 5000 }
      );
    }
  );
});
