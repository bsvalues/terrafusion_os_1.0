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

let memoryRouterEntries: string[] = ['/'];

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  const ActualMemoryRouter = actual.MemoryRouter;
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <ActualMemoryRouter initialEntries={memoryRouterEntries}>{children}</ActualMemoryRouter>
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

// Mock activateModule (suite icons now open windows instead of navigating)
const mockActivateModule = jest.fn();
jest.mock('../../orchestration/moduleActivation', () => ({
  activateModule: (...args: unknown[]) => mockActivateModule(...args),
}));

// Mock openWorkbenchWindow (surface icon opens a desktop window, not navigate)
const mockOpenWorkbenchWindow = jest.fn();
jest.mock('../../context/parcelContext', () => ({
  ...jest.requireActual('../../context/parcelContext'),
  openWorkbenchWindow: (...args: unknown[]) => mockOpenWorkbenchWindow(...args),
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

// Suite IDs that now open as windows (not navigate)
const SUITE_IDS = new Set(['forge', 'atlas', 'dais', 'dossier', 'gpt']);

// Surface icons open desktop windows (not navigate)
const SURFACE_PREFIX = 'surface-';

describe('Phase 26 intent contract: click desktop icon → navigate → landmark renders', () => {
  afterEach(() => {
    cleanup();
    mockActivateModule.mockClear();
    mockOpenWorkbenchWindow.mockClear();
  });

  const icons = getDesktopIcons();

  // OS feature icons still navigate (pilot, trace, canon)
  const navigatingIcons = icons.filter((icon) => {
    if (SUITE_IDS.has(icon.id)) return false; // Suites open windows now
    if (icon.id.startsWith(SURFACE_PREFIX)) return false; // Surfaces open desktop windows
    const r = icon.route;
    if (!r || typeof r !== 'string') return false;
    if (isExternal(r)) return false;
    return true;
  });

  // Suite icons that activate modules
  const suiteIcons = icons.filter((icon) => SUITE_IDS.has(icon.id));

  // Surface icons that open desktop windows
  const surfaceIcons = icons.filter((icon) => icon.id.startsWith(SURFACE_PREFIX));

  it('has testable desktop icons', () => {
    expect(navigatingIcons.length + suiteIcons.length + surfaceIcons.length).toBeGreaterThan(0);
  });

  // Suite icons: verify they call activateModule (open as window)
  it.each(suiteIcons)(
    '$name ($id): double-click → activates module window',
    (icon: DesktopIconEntry) => {
      memoryRouterEntries = ['/'];

      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path='/' element={<DesktopIconGrid />} />
            <Route path='*' element={<LocationDisplay />} />
          </Routes>
        </MemoryRouter>
      );

      const iconEl = screen.getByTestId(`desktop-icon-${icon.id}`);
      expect(iconEl).toBeInTheDocument();

      fireEvent.doubleClick(iconEl);

      // Suite icons open windowed modules via activateModule
      expect(mockActivateModule).toHaveBeenCalledWith(icon.id, { source: 'desktop' });
    }
  );

  // Surface icons: verify they open desktop windows (not navigate)
  it.each(surfaceIcons)(
    '$name ($id): double-click → opens desktop window',
    async (icon: DesktopIconEntry) => {
      memoryRouterEntries = ['/'];

      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path='/' element={<DesktopIconGrid />} />
          </Routes>
        </MemoryRouter>
      );

      const iconEl = screen.getByTestId(`desktop-icon-${icon.id}`);
      expect(iconEl).toBeInTheDocument();

      fireEvent.doubleClick(iconEl);

      // Surface icons open windows via openWorkbenchWindow (async dynamic import)
      await waitFor(() => {
        expect(mockOpenWorkbenchWindow).toHaveBeenCalled();
      });
    }
  );

  // OS feature icons: verify they navigate to standalone routes with landmarks
  it.each(navigatingIcons)(
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

      // Double-click to launch (OS features call navigate(route))
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
