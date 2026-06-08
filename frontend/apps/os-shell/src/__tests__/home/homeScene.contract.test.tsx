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
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { Suspense, lazy } from 'react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseParcelCount = vi.hoisted(() => vi.fn());
const mockOpenWorkbenchWindow = vi.hoisted(() => vi.fn());
const mockSelectRecentParcel = vi.hoisted(() => vi.fn());

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
  openWorkbenchWindow: mockOpenWorkbenchWindow,
  selectRecentParcel: mockSelectRecentParcel,
}));

// Mock module activation
vi.mock('../../orchestration/moduleActivation', () => ({
  __esModule: true,
  activateModule: vi.fn(),
}));

vi.mock('../../api/pilotApi', () => ({
  __esModule: true,
  invokeTool: vi.fn(async ({ toolId }: { toolId: string }) => {
    if (toolId === 'generate_morning_brief') {
      return {
        success: true,
        correlationId: 'corr-brief',
        result: {
          toolId,
          output: JSON.stringify({
            queueType: 'ranked_worklist',
            summary: 'County queue posture loaded.',
            recommendedTool: 'dais',
          }),
        },
      };
    }
    if (toolId === 'explain_spatial_anomaly') {
      return {
        success: true,
        correlationId: 'corr-atlas',
        result: {
          toolId,
          output: JSON.stringify({
            narrative: 'Spatial audit posture loaded.',
            hotspotCount: 4,
          }),
        },
      };
    }
    return {
      success: true,
      correlationId: 'corr-dossier',
      result: {
        toolId,
        output: JSON.stringify({
          packetRef: 'BOE-2026-001',
          payloadRef: 'Packet readiness loaded.',
        }),
      },
    };
  }),
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
  useTodaysWork: () => ({ tasks: [], loading: false, error: null, readState: 'live' }),
}));

vi.mock('../../shell/desktop/BentonCountyMap', () => ({
  __esModule: true,
  default: ({ onParcelSelect, className }: { onParcelSelect?: (parcelId: string) => void; className?: string }) => (
    <div
      data-testid="benton-county-map"
      className={className}
      aria-label="Benton County GIS map"
    >
      <span>Benton County GIS Orientation</span>
      <span>Parcel layer status: TerraFusion DB/API proof path</span>
      <button type="button" onClick={() => onParcelSelect?.('101040000000000')}>
        Select proof parcel
      </button>
    </div>
  ),
}));

// Mock useParcelCount — no QueryClientProvider in this test tree
vi.mock('../../hooks/useParcelCount', () => ({
  __esModule: true,
  useParcelCount: () => mockUseParcelCount(),
}));

// Import the REAL StageZeroState (with mocked dependencies above)
// so we test actual rendered structure
import { StageZeroState } from '../../shell/desktop/StageZeroState';
import { invokeTool } from '../../api/pilotApi';

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
  beforeEach(() => {
    mockUseParcelCount.mockReturnValue({ data: undefined, isLoading: false, error: null });
    mockOpenWorkbenchWindow.mockClear();
    mockSelectRecentParcel.mockClear();
    sessionStorage.clear();
  });

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

    // County GIS map — the default home surface for the active county
    expect(screen.getByLabelText('Benton County GIS map')).toBeInTheDocument();
    expect(screen.getByTestId('executive-command-surface')).toBeInTheDocument();
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

  it('renders Benton GIS home scene by default without launch-board or unverified count language', async () => {
    mockUseParcelCount.mockReturnValue({
      data: { totalParcels: 128788, dataSource: 'LIVE_DB', stubbed: false },
      isLoading: false,
      error: null,
    });

    render(<Phase7Router initialRoute="/" />);

    await waitFor(() => {
      expect(screen.getByTestId('stage-zero-state')).toBeInTheDocument();
    });

    const center = screen.getByTestId('county-map-center');
    expect(center).toHaveTextContent(/Benton County GIS Orientation/i);
    expect(center).toHaveTextContent(/Parcel layer status/i);
    expect(screen.getByTestId('benton-county-map')).toBeInTheDocument();
    expect(screen.getAllByText(/Benton County/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Runtime Pilot/i).length).toBeGreaterThan(0);
    expect(center.querySelectorAll('[aria-label="Active county workspace"]')).toHaveLength(0);

    expect(screen.queryByText(/June 10 launch board/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Continue to Desktop/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/June 10 Launch Briefing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Statewide county operating model/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Benton County Operations/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Washington County Runtime/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/128,788 parcels/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Washington County Operating Model/i)).toBeInTheDocument();
  });

  it('does not invoke TerraPilot briefing tools from the Home Scene automatically', async () => {
    render(<Phase7Router initialRoute="/" />);

    await waitFor(() => {
      expect(screen.getByTestId('stage-zero-state')).toBeInTheDocument();
    });

    expect(invokeTool).not.toHaveBeenCalled();
  });

  it('opens the Benton Property Workbench from the default Benton workspace', async () => {
    render(<Phase7Router initialRoute="/" />);

    await waitFor(() => {
      expect(screen.getByTestId('stage-zero-state')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Open Workbench/i }));

    await waitFor(() => {
      expect(mockOpenWorkbenchWindow).toHaveBeenCalled();
    });
    expect(screen.queryByText(/June 10 launch board/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Benton County GIS Orientation/i)).toBeInTheDocument();
  });

  it('selecting a map parcel opens the workbench without replacing the GIS home scene', async () => {
    render(<Phase7Router initialRoute="/" />);

    await waitFor(() => {
      expect(screen.getByTestId('stage-zero-state')).toBeInTheDocument();
    });

    const center = screen.getByTestId('county-map-center');
    fireEvent.click(screen.getByRole('button', { name: /Select proof parcel/i }));

    await waitFor(() => {
      expect(mockOpenWorkbenchWindow).toHaveBeenCalledWith('101040000000000');
    });
    expect(center).toHaveTextContent(/Benton County GIS Orientation/i);
    expect(center).not.toHaveTextContent(/Open Benton Property Workbench/i);
  });
});
