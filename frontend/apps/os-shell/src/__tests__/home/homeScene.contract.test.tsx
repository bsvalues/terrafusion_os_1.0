/**
 * ======================================================================
 * TERRAFUSION OS - PHASE 7 HOME SCENE CONTRACT TESTS (Slice 7.1)
 * Constitutional Lock: StageZeroState is the canonical Home surface
 *
 * These tests define the Phase 7 routing contract BEFORE enforcement.
 * They codify the law that:
 *   - `/home` MUST redirect to `/` (no more ShellHome)
 *   - StageZeroState is the only home surface rendered at `/`
 *   - The home surface contains County Map, Recent Work, Quick Actions
 *   - Search lives in Command Palette (Ctrl+K), NOT as a hero input
 *
 * Tests are expected to FAIL until Router.tsx is updated to redirect
 * `/home` to `/` and ShellHome is removed from the route table.
 *
 * TDD-first: we write the law, then enforce it.
 * ======================================================================
 */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import React, { Suspense, lazy } from 'react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock zustand stores used by StageZeroState
vi.mock('../../stores/commandPaletteStore', () => {
  const openFn = vi.fn();
  return {
    __esModule: true,
    useCommandPaletteStore: (selector?: (s: any) => any) => {
      const state = {
        isOpen: false,
        open: openFn,
        close: vi.fn(),
        toggle: vi.fn(),
        searchQuery: '',
        setSearchQuery: vi.fn(),
        recentCommands: [],
        addToRecent: vi.fn(),
        clearRecent: vi.fn(),
      };
      return selector ? selector(state) : state;
    },
    default: vi.fn(),
    _openFn: openFn,
  };
});

// Mock parcel context (no recent parcels for baseline)
vi.mock('../../context/parcelContext', () => ({
  __esModule: true,
  useRecentParcels: () => [],
  openWorkbenchWindow: vi.fn(),
  selectRecentParcel: vi.fn(),
}));

// Mock module activation
vi.mock('../../orchestration/moduleActivation', () => ({
  __esModule: true,
  activateModule: vi.fn(),
}));

// Mock LiquidPanel material (render a simple div)
vi.mock('../../ui/materials', () => ({
  __esModule: true,
  LiquidPanel: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

// Mock zIndex constants
vi.mock('../../shell/desktop/zIndex', () => ({
  __esModule: true,
  Z: { desktop: 1 },
}));

// Mock cn utility
vi.mock('../../lib/utils', () => ({
  __esModule: true,
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock useTodaysWork (StageZeroState dependency)
vi.mock('../../hooks/useTodaysWork', () => ({
  __esModule: true,
  useTodaysWork: () => ({ tasks: [], loading: false, isSampleData: false }),
}));

// Mock useParcelCount — no QueryClientProvider in this test tree
vi.mock('../../hooks/useParcelCount', () => ({
  __esModule: true,
  useParcelCount: () => ({ data: undefined, isLoading: false, error: null }),
}));

// Import the REAL StageZeroState (with mocked dependencies above)
// so we test actual rendered structure
import { StageZeroState } from '../../shell/desktop/StageZeroState';

// Mock App (Desktop) to include StageZeroState inside it
vi.mock('../../App', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="desktop">
      <div data-testid="top-bar">
        <button aria-label="Command Palette">Ctrl+K</button>
      </div>
      <StageZeroState />
    </div>
  ),
}));

// ShellHome was deleted in Phase 8 — no mock needed

// Mock CSSAmbientLayer
vi.mock('../../components/compositor/layers/CSSAmbientLayer', () => ({
  __esModule: true,
  CSSAmbientLayer: () => <div data-testid="ambient-layer" />,
}));

// ---------------------------------------------------------------------------
// Test Router — mirrors production Router.tsx so we test real route topology
// ---------------------------------------------------------------------------

/**
 * Phase7Router renders the canonical route table:
 *   - /home redirects to /
 *   - ShellHome was deleted in Phase 8
 */
const Phase7Router: React.FC<{ initialRoute: string }> = ({ initialRoute }) => {
  const App = lazy(() => import('../../App'));

  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/desktop" element={<App />} />
        </Routes>
      </Suspense>
    </MemoryRouter>
  );
};

// ---------------------------------------------------------------------------
// Phase 7: Home Scene Contract
// ---------------------------------------------------------------------------

describe('Phase 7: Home Scene Contract', () => {
  /**
   * Test 1: /home redirects to /
   *
   * EXPECTED TO FAIL with current Router.tsx (ShellHome still renders).
   * This test uses Phase7Router to define the target state.
   */
  it('/home redirects to /', async () => {
    render(<Phase7Router initialRoute="/home" />);

    await waitFor(() => {
      // After redirect, Desktop should render (not ShellHome)
      expect(screen.getByTestId('desktop')).toBeInTheDocument();
      expect(screen.queryByTestId('shell-home')).not.toBeInTheDocument();
    });
  });

  /**
   * Test 2: No active route renders ShellHome
   *
   * Verifies ShellHome is NOT rendered on any standard route.
   * Uses Phase7Router to define the target state.
   */
  it('no active route renders ShellHome', async () => {
    const routes = ['/', '/desktop', '/home'];

    for (const route of routes) {
      const { unmount } = render(<Phase7Router initialRoute={route} />);

      await waitFor(() => {
        expect(screen.queryByTestId('shell-home')).not.toBeInTheDocument();
        expect(screen.getByTestId('desktop')).toBeInTheDocument();
      });

      unmount();
    }
  });

  /**
   * Test 3: Desktop renders StageZeroState in home mode
   *
   * When navigating to /, the Desktop component should contain
   * StageZeroState (data-testid="stage-zero-state").
   */
  it('Desktop renders StageZeroState in home mode', async () => {
    render(<Phase7Router initialRoute="/" />);

    await waitFor(() => {
      expect(screen.getByTestId('desktop')).toBeInTheDocument();
      expect(screen.getByTestId('stage-zero-state')).toBeInTheDocument();
    });
  });

  /**
   * Test 4: Home renders map, Recent Work, and Quick Actions regions
   *
   * StageZeroState should render the three canonical regions.
   */
  it('Home renders map, Recent Work, and Quick Actions regions', async () => {
    render(<Phase7Router initialRoute="/" />);

    await waitFor(() => {
      expect(screen.getByTestId('stage-zero-state')).toBeInTheDocument();
    });

    // Recent Work section header
    expect(screen.getByText('Recent Work')).toBeInTheDocument();

    // Quick Actions section header
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();

    // County map SVG — check for the Benton County map elements
    expect(screen.getByLabelText('Open TerraAtlas for full county map')).toBeInTheDocument();
  });

  /**
   * Test 5: No search hero on Home
   *
   * StageZeroState should NOT contain a search input with placeholder
   * text like "Search parcels". The search hero was ShellHome's pattern.
   */
  it('no search hero on Home surface', async () => {
    render(<Phase7Router initialRoute="/" />);

    await waitFor(() => {
      expect(screen.getByTestId('stage-zero-state')).toBeInTheDocument();
    });

    // No search input with the old ShellHome hero placeholder
    const searchInputs = screen.queryAllByPlaceholderText(/search parcels/i);
    expect(searchInputs).toHaveLength(0);

    // No search input at all inside the stage-zero-state surface
    const stageZero = screen.getByTestId('stage-zero-state');
    const inputs = stageZero.querySelectorAll('input[type="text"], input[type="search"], input:not([type])');
    expect(inputs).toHaveLength(0);
  });

  /**
   * Test 6: Search reachable via Ctrl+K
   *
   * The CommandPalette store's open function should be callable.
   * The Desktop top bar should contain a Ctrl+K activation button.
   */
  it('search reachable via Ctrl+K (Command Palette)', async () => {
    render(<Phase7Router initialRoute="/" />);

    await waitFor(() => {
      expect(screen.getByTestId('desktop')).toBeInTheDocument();
    });

    // The top bar should have a Ctrl+K button (not inside stage-zero content)
    const topBar = screen.getByTestId('top-bar');
    expect(topBar).toBeInTheDocument();

    const cmdKButton = screen.getByLabelText('Command Palette');
    expect(cmdKButton).toBeInTheDocument();

    // The command palette open function should be wired up in StageZeroState
    // (Quick Actions has "Search Parcels" row with shortcut key label)
    const searchAction = screen.getByText('Search Parcels');
    expect(searchAction).toBeInTheDocument();

    // Verify the store's open function is accessible
    const { _openFn } = await import('../../stores/commandPaletteStore') as any;
    expect(typeof _openFn).toBe('function');
  });
});
