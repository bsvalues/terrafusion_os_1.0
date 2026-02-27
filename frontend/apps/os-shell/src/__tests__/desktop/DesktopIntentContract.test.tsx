/**
 * Phase 26 — Desktop Click-to-Landmark Intent Contract
 *
 * Contract: double-clicking each desktop icon triggers navigation to
 * the expected route AND that route's Phase 25 landmark renders.
 *
 * This stitches Phase 22–25 into a single user-intent loop:
 *   double-click icon → navigate() fires → route renders → landmark appears
 *
 * Technique (two-stage per icon):
 * Stage 1: Render DesktopIconGrid in MemoryRouter, double-click icon,
 *          capture navigated path via LocationDisplay helper.
 * Stage 2: Render full Router at the captured path (Phase 24/25 pattern),
 *          verify the Phase 25 landmark is present.
 *
 * This avoids coupling the test to Router internals while proving the
 * full intent chain from click to rendered content.
 *
 * Scope: Mechanical intent only; not asserting business data.
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { getDesktopIcons, type DesktopIconEntry } from '../../config/desktopManifest';

// ============================================================================
// Stage 2 Mocks — for rendering the full Router at the navigated path
// ============================================================================

/**
 * We need a SEPARATE mock scope for Stage 2 (full Router render).
 * Stage 1 uses real MemoryRouter directly (no mock needed).
 * Stage 2 uses the Phase 24/25 pattern: mock BrowserRouter → MemoryRouter.
 *
 * Since vi.mock is module-scoped and hoisted, we handle this by:
 * - NOT mocking react-router-dom globally (Stage 1 needs the real one)
 * - Using a dynamic import of Router inside Stage 2 with manual mocking
 *
 * Actually, since DesktopIconGrid imports useNavigate from react-router-dom,
 * and Router also imports from react-router-dom, we need a unified approach.
 *
 * Solution: mock BrowserRouter → MemoryRouter (like Phase 24), but control
 * initialEntries. Stage 1 renders DesktopIconGrid with a LocationDisplay
 * at a catch-all route. Stage 2 re-renders Router at the navigated path.
 */

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

vi.mock('../../auth/authStorage', async () => ({
  getToken: () => 'smoke-test-token',
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

vi.mock('../../auth/authBridge', async () => ({
  registerLogoutHandler: vi.fn(),
  unregisterLogoutHandler: vi.fn(),
}));

// Stage 1 imports (DesktopIconGrid uses navigate() from react-router-dom)
import { DesktopIconGrid } from '../../shell/desktop/DesktopIconGrid';

// Stage 2 import (full Router for rendering destination routes)
import Router from '../../Router';

// ============================================================================
// Landmark Registry (same as Phase 25)
// ============================================================================

const ROUTE_LANDMARKS: Record<string, { anyTestIds: string[] }> = {
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
    anyTestIds: ['standalone-shell'],
  },
  '/trace': {
    anyTestIds: ['standalone-shell', 'trace-console-content'],
  },
  '/canon': {
    anyTestIds: ['terracanon-root', 'standalone-shell'],
  },
};

// ============================================================================
// Helpers
// ============================================================================

/** Captures current location pathname for Stage 1 navigation verification. */
function LocationDisplay() {
  const location = useLocation();
  return <div data-testid='navigated-path'>{location.pathname}</div>;
}

function isExternal(p: string): boolean {
  return p.startsWith('http://') || p.startsWith('https://');
}

function assertLandmark(route: string) {
  const spec = ROUTE_LANDMARKS[route];
  if (!spec) {
    throw new Error(`Phase 26: No landmark spec for route "${route}".`);
  }
  const hit = spec.anyTestIds.some((id) => screen.queryByTestId(id));
  if (!hit) {
    throw new Error(
      `Phase 26: Navigated to "${route}" but landmark not found.\n` +
        `Expected any of: ${spec.anyTestIds.join(', ')}`
    );
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('Phase 26 intent contract: click desktop icon → navigate → landmark renders', () => {
  afterEach(() => {
    cleanup();
  });

  const icons = getDesktopIcons();

  const testableIcons = icons.filter((icon) => {
    const r = icon.route;
    if (!r || typeof r !== 'string') return false;
    if (isExternal(r)) return false;
    return true;
  });

  it('has testable desktop icons', () => {
    expect(testableIcons.length).toBeGreaterThan(0);
  });

  it.each(testableIcons)(
    '$name ($id): double-click → navigates to $route → landmark appears',
    async (icon: DesktopIconEntry) => {
      // ================================================================
      // Stage 1: Double-click icon → verify navigate() fires correctly
      // ================================================================
      memoryRouterEntries = ['/'];

      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path='/' element={<DesktopIconGrid />} />
            {/* Catch-all to capture where navigate() goes */}
            <Route path='*' element={<LocationDisplay />} />
          </Routes>
        </MemoryRouter>
      );

      const iconEl = screen.getByTestId(`desktop-icon-${icon.id}`);
      expect(iconEl).toBeInTheDocument();

      // Double-click to launch (DesktopIconGrid calls navigate(route))
      fireEvent.doubleClick(iconEl);

      // Verify navigation occurred to the expected route
      const navigatedPath = screen.getByTestId('navigated-path');
      expect(navigatedPath.textContent).toBe(icon.route);

      cleanup();

      // ================================================================
      // Stage 2: Render full Router at navigated path → landmark appears
      // ================================================================
      memoryRouterEntries = [icon.route];

      render(<Router />);

      // Wait for Suspense to resolve
      await waitFor(
        () => {
          expect(screen.queryByText(/Loading TerraFusion OS/i)).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Phase 24 crash guard (redundant but cheap)
      expect(screen.queryByText(/Reset Application/i)).not.toBeInTheDocument();

      // Phase 25 landmark assertion — use waitFor to handle lazy tab rendering under load.
      await waitFor(
        () => {
          assertLandmark(icon.route);
        },
        { timeout: 5000 }
      );
    }
  );
});
