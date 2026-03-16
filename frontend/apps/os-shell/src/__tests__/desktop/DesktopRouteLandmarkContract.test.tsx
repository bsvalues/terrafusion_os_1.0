/**
 * Phase 25 — Route Content Sanity Contract (Landmark Smoke)
 *
 * Contract: every route from getDesktopIcons() must render at least one
 * stable "landmark" proving actual content mounted — not just a blank div.
 *
 * Phase 22 guarantees "IDs are canonical".
 * Phase 23 guarantees "route exists in Router".
 * Phase 24 guarantees "route doesn't immediately crash on render".
 * Phase 25 guarantees "route renders non-empty content with a landmark".
 *
 * Landmark strategy (lowest churn):
 * - Prefer data-testid on route root containers (already present on most).
 * - Accept shared wrapper testids (e.g. standalone-shell) + unique inner testid.
 *
 * Scope: Mechanical landmark only; not asserting business data or API calls.
 */

import { vi, describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { getDesktopIcons } from '../../config/desktopManifest';

// ============================================================================
// Mocks (hoisted before imports by Jest)
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
// Landmark Registry — the ONLY list of expected landmarks per route
// ============================================================================

/**
 * Each route maps to a set of testid candidates. At least ONE must be
 * present after render for the contract to pass.
 *
 * Strategy:
 * - Workbench tab routes: tab-specific testid + shared workbench root
 * - Standalone routes: standalone-shell wrapper + feature-specific content testid
 */
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

/** Routes that intentionally can't produce landmarks in jsdom. Keep empty. */
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
      `Phase 25: No landmark spec for route "${route}". ` +
        'Add it to ROUTE_LANDMARKS with at least one stable testid.'
    );
  }

  const hits: string[] = [];
  for (const id of spec.anyTestIds) {
    if (screen.queryByTestId(id)) hits.push(id);
  }

  if (hits.length === 0) {
    throw new Error(
      `Phase 25: Route "${route}" rendered but no landmark found.\n` +
        `Expected any of: ${spec.anyTestIds.join(', ')}\n` +
        'Fix: add a data-testid on the route root container, then rerun.'
    );
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('Phase 25 contract: desktop routes render stable content landmarks', () => {
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

  it('every route has a landmark spec registered', () => {
    const missing = testableIcons.filter((icon) => !ROUTE_LANDMARKS[icon.route]);
    if (missing.length > 0) {
      throw new Error(
        'Routes without landmark spec:\n' +
          missing.map((i) => `  - ${i.id}: ${i.route}`).join('\n') +
          '\nAdd them to ROUTE_LANDMARKS in this test file.'
      );
    }
  });

  it.each(testableIcons)('$name ($id) at $route has a content landmark', async (icon) => {
    memoryRouterEntries = [icon.route];

    render(<Router />);

    // Wait for Suspense to resolve (same as Phase 24).
    await waitFor(
      () => {
        expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Phase 24 crash guard (redundant but cheap).
    expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();

    // Phase 25 landmark assertion — use waitFor to handle lazy tab rendering under load.
    await waitFor(
      () => {
        assertLandmark(icon.route);
      },
      { timeout: 5000 }
    );
  });
});
