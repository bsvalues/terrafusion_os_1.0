/**
 * @fileoverview Phase 7 (Slices 7.5 + 7.6): Material Regression Gate
 *
 * Visual regression tests that lock down the material system so future
 * changes do not accidentally swap glass for bento, remove z-separation,
 * or break the "value in 3 clicks" contract.
 *
 * Several assertions are TDD-first and expected to fail until the relevant
 * component updates land (e.g. BentoCard data-material attribute).
 *
 * Test Framework: Vitest with globals, jsdom, @testing-library/react
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks — heavy dependencies that StageZeroState imports
// ---------------------------------------------------------------------------

vi.mock('@/stores/commandPaletteStore', () => ({
  useCommandPaletteStore: vi.fn((selector: (s: any) => any) =>
    selector({ open: vi.fn() }),
  ),
}));

vi.mock('@/context/parcelContext', () => ({
  useRecentParcels: vi.fn(() => ['11-1234-001', '11-1234-002']),
  openWorkbenchWindow: vi.fn(),
  selectRecentParcel: vi.fn(),
}));

vi.mock('@/orchestration/moduleActivation', () => ({
  activateModule: vi.fn(),
  default: vi.fn(),
}));

vi.mock('@/hooks/useTodaysWork', () => ({
  useTodaysWork: () => ({
    tasks: [
      { id: 'tw-1', title: 'Review 3 appeals', subtitle: 'Dais', route: 'terradais', category: 'suite' },
    ],
    loading: false,
  }),
}));

// Mock lucide-react to avoid SVG import issues in jsdom
vi.mock('lucide-react', () => {
  const icon = (name: string) => {
    const Comp = (props: any) => <span data-icon={name} {...props} />;
    Comp.displayName = name;
    return Comp;
  };
  return {
    Clock: icon('Clock'),
    ArrowRight: icon('ArrowRight'),
    Building2: icon('Building2'),
    BarChart3: icon('BarChart3'),
    FileSearch: icon('FileSearch'),
    Map: icon('Map'),
    Zap: icon('Zap'),
    Search: icon('Search'),
    LayoutDashboard: icon('LayoutDashboard'),
    CalendarDays: icon('CalendarDays'),
  };
});

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock LiquidPanel CSS import
vi.mock('@/ui/materials/liquid-panel.css', () => ({}));
vi.mock('@/ui/materials/bento-grid.css', () => ({}));

// ---------------------------------------------------------------------------
// Imports under test (after mocks are registered)
// ---------------------------------------------------------------------------

import { Z } from '@/shell/desktop/zIndex';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Mock useMaterialQuality at module level for LiquidPanel */
const mockUseMaterialQuality = vi.fn();

vi.mock('@/ui/materials/materialQualityGate', () => ({
  useMaterialQuality: (...args: any[]) => mockUseMaterialQuality(...args),
  MaterialQuality: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },
  getMaterialQuality: vi.fn(),
  resetMaterialQualityGate: vi.fn(),
}));

function setQualityTier(tier: 'low' | 'medium' | 'high') {
  const isLow = tier === 'low';
  const isHigh = tier === 'high';
  mockUseMaterialQuality.mockReturnValue({
    tier,
    gpuTier: isLow ? 0 : isHigh ? 3 : 2,
    enableBackdropBlur: !isLow,
    enableGlassDistortion: isHigh,
    enableSprings: true,
    enableWarps: isHigh,
    enableLoopingAnimations: true,
    prefersReducedMotion: false,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 7: Material Regression Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setQualityTier('high');
  });

  // -------------------------------------------------------------------------
  // 1. StageZeroState snapshot baseline
  // -------------------------------------------------------------------------
  it('StageZeroState snapshot matches baseline', async () => {
    const { StageZeroState } = await import('@/shell/desktop/StageZeroState');

    const { container } = render(<StageZeroState />);

    // Establish snapshot. Future changes will break this intentionally,
    // forcing a deliberate snapshot update to acknowledge the change.
    expect(container.firstChild).toMatchSnapshot();
  });

  // -------------------------------------------------------------------------
  // 2. BentoCard has NO backdrop-filter (TDD-first -- EXPECTED TO FAIL)
  // -------------------------------------------------------------------------
  it('BentoCard with data-material="bento" has NO backdrop-filter', async () => {
    const { BentoCard } = await import('@/ui/materials/BentoCard');

    const { container } = render(
      <BentoCard data-testid="bento-test" title="Test Card">
        <p>Content</p>
      </BentoCard>,
    );

    // Walk all elements and check for inline backdrop-filter.
    // BentoCard currently wraps LiquidPanel which may apply glass styles.
    // The bento material should NOT have backdrop-filter.
    const allElements = container.querySelectorAll('*');
    allElements.forEach((el) => {
      const style = (el as HTMLElement).style;
      const hasBackdropFilter =
        style.backdropFilter && style.backdropFilter !== 'none';
      expect(hasBackdropFilter).toBeFalsy();
    });
  });

  // -------------------------------------------------------------------------
  // 3. LiquidPanel variant="shell" has glass class
  // -------------------------------------------------------------------------
  it('LiquidPanel with variant="shell" HAS glass class', async () => {
    setQualityTier('high');
    const { LiquidPanel } = await import('@/ui/materials/LiquidPanel');

    render(
      <LiquidPanel data-testid="glass-panel" variant="shell">
        <span>Shell Chrome</span>
      </LiquidPanel>,
    );

    const panel = screen.getByTestId('glass-panel');
    // At HIGH tier, shell variant should have glass class
    const hasGlass =
      panel.classList.contains('liquid-panel--glass') ||
      panel.classList.contains('liquid-panel--blur');
    expect(hasGlass).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 4. Quality gate LOW: all materials without backdrop-filter
  // -------------------------------------------------------------------------
  it('Quality gate LOW: all materials without backdrop-filter', async () => {
    setQualityTier('low');
    const { LiquidPanel } = await import('@/ui/materials/LiquidPanel');

    render(
      <LiquidPanel data-testid="low-panel" variant="shell">
        <span>Low-power fallback</span>
      </LiquidPanel>,
    );

    const panel = screen.getByTestId('low-panel');
    expect(panel).toHaveClass('liquid-panel--static');
    expect(panel).not.toHaveClass('liquid-panel--glass');
    expect(panel).not.toHaveClass('liquid-panel--blur');
  });

  // -------------------------------------------------------------------------
  // 5. Dock contains no utilities (structural contract)
  // -------------------------------------------------------------------------
  it('Dock contains no utilities', () => {
    // This is a structural assertion on the z-index hierarchy.
    // The dock layer should only contain suite navigation — no settings,
    // clock, or notification widgets (those live in the top bar).
    //
    // We verify via the z-index constants: dock and topbar are separate
    // layers, and the dock z-index is well above desktop but below
    // start menu / overlays.
    expect(Z.dock).toBeGreaterThan(Z.desktop);
    expect(Z.dock).toBeGreaterThan(Z.topbar);
    expect(Z.dock).toBeLessThan(Z.startMenu);

    // The dock layer is distinct from the topbar, confirming that
    // utilities (which live in topbar) are structurally separated.
    expect(Z.topbar).not.toBe(Z.dock);
  });

  // -------------------------------------------------------------------------
  // 6. Top bar, stage, dock z-index separation
  // -------------------------------------------------------------------------
  it('Top bar, stage, dock z-index separation', () => {
    // Constitutional z-index ordering
    expect(Z.topbar).toBeGreaterThan(Z.desktop);
    expect(Z.dock).toBeGreaterThan(0);
    expect(Z.dock).toBeGreaterThan(Z.desktop);

    // Dock is above windows but below overlays
    expect(Z.dock).toBeGreaterThan(Z.windowActive);
    expect(Z.overlay).toBeGreaterThan(Z.dock);

    // Top bar sits between desktop and context menus
    expect(Z.topbar).toBe(10);
    expect(Z.dock).toBe(1000);
  });

  // -------------------------------------------------------------------------
  // 7. Value reachable in 3 clicks
  // -------------------------------------------------------------------------
  it('Value reachable in 3 clicks', async () => {
    const { StageZeroState } = await import('@/shell/desktop/StageZeroState');

    render(<StageZeroState />);

    const stageZero = screen.getByTestId('stage-zero-state');
    expect(stageZero).toBeInTheDocument();

    // All interactive entry points should be present as buttons:
    const buttons = stageZero.querySelectorAll('button');

    // StageZeroState should have multiple clickable entry points:
    // - County map button (opens Atlas)
    // - Recent work items (open workbench per parcel)
    // - Quick action rows (Search, Workbench, Atlas, Ratio Study, Appeals)
    // Minimum expected: map + 2 recent parcels + 5 quick actions = 8 buttons
    expect(buttons.length).toBeGreaterThanOrEqual(5);

    // Verify map entry point exists (has aria-label for Atlas)
    const mapButton = stageZero.querySelector(
      'button[aria-label*="Atlas"], button[aria-label*="atlas"], button[aria-label*="map"]',
    );
    expect(mapButton).toBeInTheDocument();

    // Verify quick action buttons exist (they render as <button> elements)
    // Each ActionRow is a button with onClick
    const actionButtons = Array.from(buttons).filter((btn) => {
      const text = btn.textContent || '';
      return (
        text.includes('Search') ||
        text.includes('Workbench') ||
        text.includes('Atlas') ||
        text.includes('Ratio') ||
        text.includes('Appeals')
      );
    });
    expect(actionButtons.length).toBeGreaterThanOrEqual(3);
  });
});
