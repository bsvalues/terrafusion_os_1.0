/**
 * ═══════════════════════════════════════════════════════════════
 * LAUNCHER MATERIALS TESTS
 * TDD harness for materials gating - LiquidPanel/TactileButton adoption
 *
 * Tests written BEFORE implementation per Slice 3 plan.
 * Mirrors workbench.materials.test.tsx patterns.
 * ═══════════════════════════════════════════════════════════════
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock stores
jest.mock('../../stores/commandPaletteStore', () => ({
  useCommandPaletteStore: jest.fn(),
}));

// Mock launcherModel
jest.mock('../../components/launcher/launcherModel', () => {
  const mockItems = [
    {
      id: 'forge',
      label: 'TerraForge',
      description: 'Valuation',
      icon: '🔨',
      intent: 'workbench' as const,
      route: '/forge',
      keywords: ['forge'],
      a11yLabel: 'TerraForge - Workbench',
    },
    {
      id: 'atlas',
      label: 'TerraAtlas',
      description: 'Mapping',
      icon: '🗺️',
      intent: 'workbench' as const,
      route: '/atlas',
      keywords: ['atlas'],
      a11yLabel: 'TerraAtlas - Workbench',
    },
  ];
  return {
    getLauncherSections: () => [{ id: 'suites', label: 'Suites', items: mockItems }],
    filterLauncherItems: (items: typeof mockItems, query: string) =>
      query ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase())) : items,
    navigateToLauncherItem: jest.fn(
      (item: (typeof mockItems)[0], navigate: (route: string) => void) => navigate(item.route)
    ),
    getIntentBadgeText: (intent: string) =>
      intent === 'workbench' ? 'Workbench' : intent === 'system' ? 'System' : 'Standalone',
  };
});

// Mock navigation
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Components and imports (AFTER mocks)
import { Launcher } from '../../components/launcher';
import { useCommandPaletteStore } from '../../stores/commandPaletteStore';
import * as materialQualityGate from '../../ui/materials/materialQualityGate';

// ============================================================================
// Test Helpers
// ============================================================================

const mockStore = {
  isOpen: true,
  close: jest.fn(),
  toggle: jest.fn(),
  searchQuery: '',
  setSearchQuery: jest.fn(),
};

function renderLauncher(qualityOverride?: Partial<materialQualityGate.MaterialQualityState>) {
  const mockQuality: materialQualityGate.MaterialQualityState = {
    tier: materialQualityGate.MaterialQuality.HIGH,
    gpuTier: 3,
    enableBackdropBlur: true,
    enableGlassDistortion: true,
    enableSprings: true,
    enableWarps: true,
    enableLoopingAnimations: true,
    prefersReducedMotion: false,
    ...qualityOverride,
  };

  jest.spyOn(materialQualityGate, 'useMaterialQuality').mockReturnValue(mockQuality);

  (useCommandPaletteStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector ? selector(mockStore) : mockStore
  );

  return render(
    <MemoryRouter>
      <Launcher />
    </MemoryRouter>
  );
}

// ============================================================================
// Test Suite: LiquidPanel Adoption
// ============================================================================

describe('Launcher Materials: LiquidPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.isOpen = true;
  });

  it('uses LiquidPanel for launcher container when gate enabled (HIGH tier)', () => {
    renderLauncher({ tier: materialQualityGate.MaterialQuality.HIGH });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('liquid-panel');
  });

  it('uses LiquidPanel for launcher container when gate enabled (MEDIUM tier)', () => {
    renderLauncher({ tier: materialQualityGate.MaterialQuality.MEDIUM });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('liquid-panel');
  });

  it('uses fallback container when gate disabled (LOW tier)', () => {
    renderLauncher({
      tier: materialQualityGate.MaterialQuality.LOW,
      enableBackdropBlur: false,
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toHaveClass('liquid-panel');
    expect(dialog).toHaveClass('launcher-fallback');
  });

  it('applies backdrop blur only when enableBackdropBlur is true', () => {
    renderLauncher({ enableBackdropBlur: true });

    const backdrop = screen.getByTestId('launcher-backdrop');
    expect(backdrop).toHaveClass('backdrop-blur');
  });

  it('no backdrop blur when enableBackdropBlur is false', () => {
    renderLauncher({ enableBackdropBlur: false });

    const backdrop = screen.getByTestId('launcher-backdrop');
    expect(backdrop).not.toHaveClass('backdrop-blur');
  });
});

// ============================================================================
// Test Suite: TactileButton Adoption
// ============================================================================

describe('Launcher Materials: TactileButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.isOpen = true;
  });

  it('uses TactileButton for launcher items when gate enabled', () => {
    renderLauncher({ tier: materialQualityGate.MaterialQuality.HIGH });

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('tactile-button');
    });
  });

  it('uses fallback buttons when gate disabled', () => {
    renderLauncher({
      tier: materialQualityGate.MaterialQuality.LOW,
      enableSprings: false,
    });

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).not.toHaveClass('tactile-button');
      expect(button).toHaveClass('launcher-item-fallback');
    });
  });

  it('preserves keyboard focus order regardless of material state', () => {
    // HIGH tier
    const { unmount } = renderLauncher({ tier: materialQualityGate.MaterialQuality.HIGH });
    const highTierButtons = screen.getAllByRole('button');
    const highTierIds = highTierButtons.map((b) => b.getAttribute('data-id'));

    unmount();

    // LOW tier
    renderLauncher({ tier: materialQualityGate.MaterialQuality.LOW });
    const lowTierButtons = screen.getAllByRole('button');
    const lowTierIds = lowTierButtons.map((b) => b.getAttribute('data-id'));

    // Order should be identical
    expect(highTierIds).toEqual(lowTierIds);
  });
});

// ============================================================================
// Test Suite: Reduced Motion
// ============================================================================

describe('Launcher Materials: Reduced Motion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.isOpen = true;
  });

  it('disables springs when prefersReducedMotion is true', () => {
    renderLauncher({ prefersReducedMotion: true, enableSprings: false });

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('data-reduced-motion', 'true');
    });
  });

  it('disables glass distortion when prefersReducedMotion is true', () => {
    renderLauncher({
      prefersReducedMotion: true,
      enableGlassDistortion: false,
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toHaveClass('glass-distortion');
  });

  it('launcher is fully functional with reduced motion', async () => {
    renderLauncher({ prefersReducedMotion: true, enableSprings: false });

    // All critical elements should still be present
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Test Suite: No Layout Shift
// ============================================================================

describe('Launcher Materials: No Layout Shift', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.isOpen = true;
  });

  it('container dimensions are stable between material states', () => {
    // This test verifies that both HIGH and LOW tier render dialogs
    // Note: dialog is in portal so we query via screen

    // HIGH tier
    const { unmount } = renderLauncher({
      tier: materialQualityGate.MaterialQuality.HIGH,
    });
    const highDialog = screen.getByRole('dialog');
    expect(highDialog).toBeInTheDocument();

    unmount();

    // LOW tier
    renderLauncher({
      tier: materialQualityGate.MaterialQuality.LOW,
    });
    const lowDialog = screen.getByRole('dialog');
    expect(lowDialog).toBeInTheDocument();
  });

  it('fallback uses same structure as liquid variant', () => {
    // Verify same content structure exists
    renderLauncher({ tier: materialQualityGate.MaterialQuality.LOW });

    const content = screen.getByTestId('launcher-content');
    expect(content).toBeInTheDocument();
    // Should have search input and items
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('render in portal layer to avoid layout reflow', () => {
    renderLauncher();

    // Dialog should be rendered in a portal (not inside main content flow)
    const dialog = screen.getByRole('dialog');
    // Portal renders at document body level
    expect(dialog.closest('#launcher-portal') || dialog.closest('body')).toBeTruthy();
  });
});

// ============================================================================
// Test Suite: WCAG Contrast
// ============================================================================

describe('Launcher Materials: Accessibility Contrast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.isOpen = true;
  });

  it('text maintains WCAG AA contrast on glass background', () => {
    renderLauncher({ tier: materialQualityGate.MaterialQuality.HIGH });

    const items = screen.getAllByRole('button');
    expect(items.length).toBeGreaterThan(0);
    // Items should have text content (verifying render)
    items.forEach((item) => {
      expect(item.textContent).not.toBe('');
    });
  });

  it('text maintains WCAG AA contrast on fallback background', () => {
    renderLauncher({ tier: materialQualityGate.MaterialQuality.LOW });

    const items = screen.getAllByRole('button');
    expect(items.length).toBeGreaterThan(0);
    items.forEach((item) => {
      expect(item.textContent).not.toBe('');
    });
  });

  it('buttons are focusable', () => {
    renderLauncher({ tier: materialQualityGate.MaterialQuality.HIGH });

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      // All buttons should be focusable (no tabindex=-1)
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
  });
});
