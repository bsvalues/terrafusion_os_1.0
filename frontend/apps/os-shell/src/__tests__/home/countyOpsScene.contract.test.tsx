/**
 * ======================================================================
 * TERRAFUSION OS - PHASE 24 COUNTY OPS SCENE CONTRACT TESTS (Task 6)
 * Constitutional Lock: StageZeroState renders county operations dashboard
 *
 * Rendering (5 assertions):
 *   1. County map area renders
 *   2. Recent Work panel renders
 *   3. Quick Actions render
 *   4. County status info renders
 *   5. Search is NOT the hero surface
 *
 * Scene Orchestration (3 assertions):
 *   6. Quick Action buttons call activateModule(), not navigate()
 *   7. Recent parcel click activates property workbench
 *   8. activateScene('daily-appraiser') sets activeSceneId with >=2 windows
 * ======================================================================
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — match patterns from homeScene.contract.test.tsx
// ---------------------------------------------------------------------------

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
  };
});

// Mock parcel context — provide two recent parcels so we can test click
vi.mock('../../context/parcelContext', () => {
  const selectRecentParcel = vi.fn();
  return {
    __esModule: true,
    useRecentParcels: () => ['10-1234-001', '10-5678-002'],
    openWorkbenchWindow: vi.fn(),
    selectRecentParcel,
    _selectRecentParcel: selectRecentParcel,
  };
});

// Mock module activation — the core assertion target
vi.mock('../../orchestration/moduleActivation', () => {
  const activateModule = vi.fn();
  return {
    __esModule: true,
    activateModule,
    _activateModule: activateModule,
  };
});

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

// Mock LiquidPanel material (render a simple div passing through children + props)
vi.mock('../../ui/materials', () => ({
  __esModule: true,
  LiquidPanel: ({ children, className, ...rest }: any) => (
    <div className={className} {...rest}>{children}</div>
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

// Mock useTodaysWork
vi.mock('../../hooks/useTodaysWork', () => ({
  __esModule: true,
  useTodaysWork: () => ({ tasks: [], loading: false, error: null, readState: 'live' }),
}));

// Mock useParcelCount — unavailable stays unavailable
vi.mock('../../hooks/useParcelCount', () => ({
  __esModule: true,
  useParcelCount: () => ({ data: undefined, isLoading: false, error: null }),
}));

// Import the REAL components/stores after mocks
import { StageZeroState } from '../../shell/desktop/StageZeroState';
import { useSceneStore, SCENE_LIBRARY } from '../../stores/sceneStore';
import { activateModule } from '../../orchestration/moduleActivation';
import { selectRecentParcel } from '../../context/parcelContext';
import { WASHINGTON_COUNTY_RUNTIME_POSTURES } from '../../config/countyRuntimePosture';

// Get mock references
const mockActivateModule = activateModule as ReturnType<typeof vi.fn>;
const mockSelectRecentParcel = selectRecentParcel as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Rendering Tests
// ---------------------------------------------------------------------------

describe('Phase 24: County Ops Scene — Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. county map area renders', () => {
    render(<StageZeroState />);
    expect(screen.getByTestId('county-map-center')).toBeInTheDocument();
    // The SVG map button has an aria-label
    expect(screen.getByLabelText('Open TerraAtlas for full county map')).toBeInTheDocument();
  });

  it('2. Recent Work panel renders', () => {
    render(<StageZeroState />);
    expect(screen.getByTestId('recent-work-panel')).toBeInTheDocument();
    expect(screen.getByText('Recent Work')).toBeInTheDocument();
  });

  it('3. Quick Actions render', () => {
    render(<StageZeroState />);
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    // Verify specific quick action buttons exist
    expect(screen.getByText('Launch Atlas')).toBeInTheDocument();
    expect(screen.getByText('Open Workbench')).toBeInTheDocument();
    expect(screen.getByText('Open Ratio Study')).toBeInTheDocument();
  });

  it('4. County status info renders', () => {
    render(<StageZeroState />);
    expect(screen.getByTestId('executive-command-surface')).toBeInTheDocument();
    expect(screen.getByText('Cross-suite county posture')).toBeInTheDocument();
  });

  it('4b. runtime posture summary exposes the 39-county source/runtime boundary', () => {
    render(<StageZeroState />);

    const summary = screen.getByTestId('county-runtime-posture-summary');
    expect(summary).toHaveAttribute('data-total-counties', '39');
    expect(summary).toHaveAttribute('data-runtime-enabled-count', '1');
    expect(summary).toHaveAttribute('data-source-intake-count', '38');
    expect(summary).toHaveAttribute('data-benton-runtime-mode', 'runtime-enabled');
    expect(summary).toHaveAttribute('data-intake-canonical-import-allowed', 'false');
    expect(WASHINGTON_COUNTY_RUNTIME_POSTURES).toHaveLength(39);
    expect(screen.getByText(/39 Washington counties registered/i)).toBeInTheDocument();
    expect(screen.getByText(/38 County Data Intake only/i)).toBeInTheDocument();
    expect(screen.getByText(/canonicalImportAllowed: false for intake counties/i)).toBeInTheDocument();
    expect(screen.getByText(/Non-Benton runtime actions remain blocked/i)).toBeInTheDocument();
  });

  it('5. County status info renders', () => {
    render(<StageZeroState />);
    expect(screen.getByTestId('county-status-strip')).toBeInTheDocument();
    expect(screen.getByText('Benton County, WA')).toBeInTheDocument();
    expect(screen.getByText('Parcel count unavailable')).toBeInTheDocument();
  });

  it('6. Search is NOT the hero surface — no prominent search bar', () => {
    render(<StageZeroState />);
    const stageZero = screen.getByTestId('stage-zero-state');
    // No search input elements on the home surface
    const inputs = stageZero.querySelectorAll(
      'input[type="text"], input[type="search"], input:not([type])'
    );
    expect(inputs).toHaveLength(0);
    // Search Parcels exists as a Quick Action row, NOT as a hero input
    expect(screen.getByText('Search Parcels')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Scene Orchestration Tests
// ---------------------------------------------------------------------------

describe('Phase 24: County Ops Scene — Orchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSceneStore.getState().clearScene();
  });

  it('7. Quick Action buttons call activateModule(), not navigate()', () => {
    render(<StageZeroState />);

    // Click "Launch Atlas" quick action
    fireEvent.click(screen.getByText('Launch Atlas'));
    expect(mockActivateModule).toHaveBeenCalledWith('suite-atlas', { source: 'desktop' });

    // Click "Open Ratio Study" quick action
    fireEvent.click(screen.getByText('Open Ratio Study'));
    expect(mockActivateModule).toHaveBeenCalledWith('suite-forge', { source: 'desktop' });

    // Click "Review Appeals" quick action
    fireEvent.click(screen.getByText('Review Appeals'));
    expect(mockActivateModule).toHaveBeenCalledWith('suite-dais', { source: 'desktop' });
  });

  it('8. Recent parcel click opens workbench via selectRecentParcel', async () => {
    render(<StageZeroState />);

    // The mock provides two parcels: '10-1234-001' and '10-5678-002'
    const parcelButton = screen.getByText('10-1234-001');
    fireEvent.click(parcelButton);

    // selectRecentParcel is dynamically imported — wait for the promise
    await vi.waitFor(() => {
      expect(mockSelectRecentParcel).toHaveBeenCalledWith('10-1234-001');
    });
  });

  it('9. activateScene("daily-appraiser") sets activeSceneId with >=2 windows', () => {
    // Verify the scene exists in the library
    const dailyAppraiser = SCENE_LIBRARY.find((s) => s.id === 'daily-appraiser');
    expect(dailyAppraiser).toBeDefined();
    expect(dailyAppraiser!.windows.length).toBeGreaterThanOrEqual(2);

    // Activate the scene
    useSceneStore.getState().activateScene('daily-appraiser');
    expect(useSceneStore.getState().activeSceneId).toBe('daily-appraiser');

    // Verify getScene returns it with correct windows
    const scene = useSceneStore.getState().getScene('daily-appraiser');
    expect(scene).toBeDefined();
    expect(scene!.windows.length).toBeGreaterThanOrEqual(2);
    expect(scene!.windows.map((w) => w.moduleId)).toContain('suite-forge');
    expect(scene!.windows.map((w) => w.moduleId)).toContain('suite-atlas');

    // Clean up
    useSceneStore.getState().clearScene();
    expect(useSceneStore.getState().activeSceneId).toBeNull();
  });
});
