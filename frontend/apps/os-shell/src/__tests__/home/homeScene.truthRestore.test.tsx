/**
 * Phase 0A — Home Scene Truth Restore
 *
 * These tests assert that the county map overview is a spatial orientation
 * surface — NOT a primary suite launcher. The "Click to launch TerraAtlas"
 * CTA was a lie: the map is not a button, it is a visual anchor.
 *
 * Tests BELOW FAIL until StageZeroState is fixed:
 *   - CountyMapOverview must NOT be a <button>
 *   - "Click to launch TerraAtlas" text must NOT appear in the DOM
 *
 * Launch Atlas affordance is preserved in the Quick Actions panel.
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — same contract as homeScene.contract.test.tsx
// ---------------------------------------------------------------------------

vi.mock('../../stores/commandPaletteStore', () => {
  const openFn = vi.fn();
  return {
    __esModule: true,
    useCommandPaletteStore: (selector?: (s: unknown) => unknown) => {
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
  };
});

vi.mock('../../context/parcelContext', () => ({
  __esModule: true,
  useRecentParcels: () => [],
  openWorkbenchWindow: vi.fn(),
}));

vi.mock('../../orchestration/moduleActivation', () => ({
  __esModule: true,
  activateModule: vi.fn(),
}));

vi.mock('../../ui/materials', () => ({
  __esModule: true,
  LiquidPanel: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('../../shell/desktop/zIndex', () => ({
  __esModule: true,
  Z: { desktop: 1 },
}));

vi.mock('../../lib/utils', () => ({
  __esModule: true,
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('../../hooks/useTodaysWork', () => ({
  __esModule: true,
  useTodaysWork: () => ({ tasks: [], loading: false, isSampleData: false }),
}));

vi.mock('../../hooks/useParcelCount', () => ({
  __esModule: true,
  useParcelCount: () => ({ data: undefined, isLoading: false, error: null }),
}));

vi.mock('../../components/governance/DemoDataBanner', () => ({
  __esModule: true,
  DemoDataBanner: () => null,
}));

import { StageZeroState } from '../../shell/desktop/StageZeroState';

// ---------------------------------------------------------------------------
// Phase 0A: Home Scene Truth Restore
// ---------------------------------------------------------------------------

describe('Phase 0A: Home Scene Truth Restore', () => {
  /**
   * HomeScene_CenterMap_IsNotPrimarySuiteLauncher
   *
   * The county map is a spatial orientation visual.
   * It MUST NOT wrap the SVG in a <button> element.
   * The Quick Actions panel provides the "Launch Atlas" affordance.
   *
   * FAILS until CountyMapOverview <button> wrapper is removed.
   */
  it('HomeScene_CenterMap_IsNotPrimarySuiteLauncher: county map is not a button', () => {
    render(<StageZeroState />);

    const mapCenter = screen.getByTestId('county-map-center');

    // The county map MUST NOT contain a button as its primary interactive element
    const buttons = mapCenter.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });

  /**
   * HomeScene_DoesNotRender_ClickToLaunchTerraAtlas
   *
   * The text "Click to launch TerraAtlas" is a CTA that misrepresents the
   * county map as an Atlas launch surface. It must not appear anywhere in
   * the home scene render.
   *
   * FAILS until the SVG <text> element is removed from CountyMapOverview.
   */
  it('HomeScene_DoesNotRender_ClickToLaunchTerraAtlas: launch CTA is absent', () => {
    render(<StageZeroState />);

    expect(
      screen.queryByText(/Click to launch TerraAtlas/i)
    ).not.toBeInTheDocument();
  });

  /**
   * Quick Actions panel still exposes "Launch Atlas" affordance.
   * This PASSES before and after the fix — it is a regression guard.
   */
  it('Quick Actions panel retains Launch Atlas affordance', () => {
    render(<StageZeroState />);

    expect(screen.getByText(/Launch Atlas/i)).toBeInTheDocument();
  });
});
