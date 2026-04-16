/**
 * ======================================================================
 * TERRAFUSION OS - PHASE 7 TODAY'S WORK PANEL TESTS (Slice 7.2)
 *
 * Validates the Today's Work panel in StageZeroState:
 *   - Panel renders with correct data-testid
 *   - Shows 3 mock tasks from useTodaysWork
 *   - Each task shows its title text
 *   - Empty state shows "No tasks for today"
 *   - Clicking a task calls activateModule with the task route
 * ======================================================================
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks (same pattern as homeScene.contract.test.tsx)
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
const mockActivateModule = vi.fn();
vi.mock('../../orchestration/moduleActivation', () => ({
  __esModule: true,
  activateModule: (...args: any[]) => mockActivateModule(...args),
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

vi.mock('../../hooks/useTodaysWork', () => ({
  __esModule: true,
  useTodaysWork: () => ({
    tasks: [
      { id: 'task-1', title: 'Review 3 appeals', subtitle: 'TerraDais queue', route: 'terradais' },
      { id: 'task-2', title: 'Inspect 12 parcels', subtitle: 'Field backlog', route: 'property-workbench' },
      { id: 'task-3', title: 'Ratio study due Friday', subtitle: 'TerraForge calibration', route: 'suite-forge' },
    ],
    loading: false,
    isSampleData: false,
  }),
}));

vi.mock('../../hooks/useParcelCount', () => ({
  __esModule: true,
  useParcelCount: () => ({ data: undefined, isLoading: false, error: null }),
}));

// Import AFTER mocks are set up
import { StageZeroState } from '../../shell/desktop/StageZeroState';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 7: Today\'s Work Panel', () => {
  beforeEach(() => {
    mockActivateModule.mockClear();
  });

  it('renders with data-testid="todays-work-panel"', () => {
    render(<StageZeroState />);
    expect(screen.getByTestId('todays-work-panel')).toBeInTheDocument();
  });

  it('shows 3 mock tasks', () => {
    render(<StageZeroState />);
    const panel = screen.getByTestId('todays-work-panel');
    // 3 task action rows inside the panel (buttons)
    const buttons = panel.querySelectorAll('button');
    expect(buttons).toHaveLength(3);
  });

  it('each task shows title text', () => {
    render(<StageZeroState />);
    expect(screen.getByText(/Review 3 appeals/)).toBeInTheDocument();
    expect(screen.getByText(/Inspect 12 parcels/)).toBeInTheDocument();
    expect(screen.getByText(/Ratio study due Friday/)).toBeInTheDocument();
  });

  it('empty state shows "No tasks for today"', async () => {
    // Mock useTodaysWork to return empty tasks
    const todaysWorkModule = await import('../../hooks/useTodaysWork');
    const spy = vi.spyOn(todaysWorkModule, 'useTodaysWork');
    spy.mockReturnValue({ tasks: [], loading: false, isSampleData: false });

    const { unmount } = render(<StageZeroState />);
    const panel = screen.getByTestId('todays-work-panel');
    expect(panel).toHaveTextContent('No tasks for today');

    spy.mockRestore();
    unmount();
  });

  it('clicking a task calls activateModule with the correct route', () => {
    render(<StageZeroState />);
    // Click the first task ("Review 3 appeals" -> route "terradais")
    const firstTask = screen.getByText(/Review 3 appeals/);
    fireEvent.click(firstTask.closest('button')!);
    expect(mockActivateModule).toHaveBeenCalledWith('terradais', { source: 'desktop' });
  });
});
