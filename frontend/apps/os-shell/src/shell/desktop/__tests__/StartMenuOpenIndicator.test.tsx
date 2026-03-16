/**
 * TerraFusion OS Start Menu Open Indicator Tests
 *
 * Phase 6: Visual indicator for running modules in StartMenu.
 * Shows "● running" indicator next to modules with open windows.
 *
 * @module shell/desktop/__tests__/StartMenuOpenIndicator.test
 * @see Phase 6: Open Indicator
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock activateModule
vi.mock('../../../orchestration/moduleActivation', () => ({
  activateModule: vi.fn().mockResolvedValue(undefined),
}));

// Mock startMenuStore
let mockIsOpen = true;
let mockPinnedModules: any[] = [];
let mockAllModules: any[] = [];
let mockRecentApps: any[] = [];

vi.mock('../../../stores/startMenuStore', () => ({
  useStartMenuStore: vi.fn((selector) => {
    const state = {
      isOpen: mockIsOpen,
      searchQuery: '',
      recentApps: mockRecentApps,
      close: vi.fn(),
      clearSearch: vi.fn(),
      addRecentApp: vi.fn(),
      getPinnedModules: () => mockPinnedModules,
      getFilteredModules: () => mockAllModules,
      getRecentModules: () => mockRecentApps,
      setSearchQuery: vi.fn(),
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

// Mock desktopStore - THIS IS THE KEY for open indicator
let mockWindows: any[] = [];

vi.mock('../../../stores/desktopStore', () => ({
  useDesktopStore: vi.fn((selector) => {
    const state = {
      windows: mockWindows,
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

// ============================================================================
// Test Helpers
// ============================================================================

function resetAllMocks() {
  mockIsOpen = true;
  mockPinnedModules = [];
  mockAllModules = [];
  mockRecentApps = [];
  mockWindows = [];
}

const COSTFORGE_MODULE = {
  id: 'costforge',
  name: 'CostForge',
  description: 'Property Assessment',
  icon: 'Layers',
  category: 'Core',
  status: 'active' as const,
};

const ATLAS_MODULE = {
  id: 'atlas-ai',
  name: 'ATLAS',
  description: 'AI Intelligence',
  icon: 'Brain',
  category: 'AI',
  status: 'active' as const,
};

const ANALYTICS_MODULE = {
  id: 'reporting',
  name: 'Analytics',
  description: 'Reporting Dashboard',
  icon: 'BarChart3',
  category: 'Analytics',
  status: 'active' as const,
};

// ============================================================================
// Tests
// ============================================================================

describe('StartMenu Open Indicator (Phase 6)', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StartMenu } = require('../StartMenu');

  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Pinned Apps Indicator
  // --------------------------------------------------------------------------

  describe('pinned apps indicator', () => {
    it('shows running indicator for pinned app with open window', () => {
      mockPinnedModules = [COSTFORGE_MODULE];
      mockAllModules = [COSTFORGE_MODULE];
      mockWindows = [{ id: 'win-1', moduleId: 'costforge', state: 'normal' }];

      render(<StartMenu />);

      // Find the pinned app tile
      const pinnedSection = screen.getByTestId('pinned-apps');
      const indicator = pinnedSection.querySelector('[data-testid="running-indicator"]');

      expect(indicator).toBeInTheDocument();
    });

    it('does NOT show indicator for pinned app without open window', () => {
      mockPinnedModules = [COSTFORGE_MODULE];
      mockAllModules = [COSTFORGE_MODULE];
      mockWindows = []; // No windows open

      render(<StartMenu />);

      const pinnedSection = screen.getByTestId('pinned-apps');
      const indicator = pinnedSection.querySelector('[data-testid="running-indicator"]');

      expect(indicator).not.toBeInTheDocument();
    });

    it('shows indicator only for running apps in pinned grid', () => {
      mockPinnedModules = [COSTFORGE_MODULE, ATLAS_MODULE];
      mockAllModules = [COSTFORGE_MODULE, ATLAS_MODULE];
      // Only CostForge is running
      mockWindows = [{ id: 'win-1', moduleId: 'costforge', state: 'normal' }];

      render(<StartMenu />);

      const pinnedSection = screen.getByTestId('pinned-apps');
      const indicators = pinnedSection.querySelectorAll('[data-testid="running-indicator"]');

      // Should only have 1 indicator (for CostForge)
      expect(indicators).toHaveLength(1);
    });
  });

  // --------------------------------------------------------------------------
  // All Apps List Indicator
  // --------------------------------------------------------------------------

  describe('all apps list indicator', () => {
    it('shows running indicator in app list for open module', () => {
      mockAllModules = [COSTFORGE_MODULE, ATLAS_MODULE];
      mockWindows = [{ id: 'win-1', moduleId: 'costforge', state: 'normal' }];

      render(<StartMenu />);

      // CostForge should have indicator
      const costforgeItem = screen.getByRole('button', { name: 'CostForge' });
      const indicator = costforgeItem.querySelector('[data-testid="running-indicator"]');

      expect(indicator).toBeInTheDocument();
    });

    it('does NOT show indicator for closed modules in list', () => {
      mockAllModules = [COSTFORGE_MODULE, ATLAS_MODULE];
      mockWindows = [{ id: 'win-1', moduleId: 'costforge', state: 'normal' }];

      render(<StartMenu />);

      // ATLAS should NOT have indicator
      const atlasItem = screen.getByRole('button', { name: 'ATLAS' });
      const indicator = atlasItem.querySelector('[data-testid="running-indicator"]');

      expect(indicator).not.toBeInTheDocument();
    });

    it('shows multiple indicators for multiple running modules', () => {
      mockAllModules = [COSTFORGE_MODULE, ATLAS_MODULE, ANALYTICS_MODULE];
      mockWindows = [
        { id: 'win-1', moduleId: 'costforge', state: 'normal' },
        { id: 'win-2', moduleId: 'reporting', state: 'normal' },
      ];

      render(<StartMenu />);

      const allAppsSection = screen.getByTestId('all-apps');
      const indicators = allAppsSection.querySelectorAll('[data-testid="running-indicator"]');

      // CostForge and Analytics should have indicators
      expect(indicators).toHaveLength(2);
    });
  });

  // --------------------------------------------------------------------------
  // Window State Handling
  // --------------------------------------------------------------------------

  describe('window state handling', () => {
    it('shows indicator for minimized window (still running)', () => {
      mockAllModules = [COSTFORGE_MODULE];
      mockWindows = [{ id: 'win-1', moduleId: 'costforge', state: 'minimized' }];

      render(<StartMenu />);

      const costforgeItem = screen.getByRole('button', { name: 'CostForge' });
      const indicator = costforgeItem.querySelector('[data-testid="running-indicator"]');

      // Minimized is still running
      expect(indicator).toBeInTheDocument();
    });

    it('shows indicator for maximized window', () => {
      mockAllModules = [COSTFORGE_MODULE];
      mockWindows = [{ id: 'win-1', moduleId: 'costforge', state: 'maximized' }];

      render(<StartMenu />);

      const costforgeItem = screen.getByRole('button', { name: 'CostForge' });
      const indicator = costforgeItem.querySelector('[data-testid="running-indicator"]');

      expect(indicator).toBeInTheDocument();
    });

    it('handles multiple windows for same module (shows single indicator)', () => {
      mockAllModules = [COSTFORGE_MODULE];
      // Two CostForge windows (edge case)
      mockWindows = [
        { id: 'win-1', moduleId: 'costforge', state: 'normal' },
        { id: 'win-2', moduleId: 'costforge', state: 'minimized' },
      ];

      render(<StartMenu />);

      const costforgeItem = screen.getByRole('button', { name: 'CostForge' });
      const indicators = costforgeItem.querySelectorAll('[data-testid="running-indicator"]');

      // Should only show ONE indicator, not two
      expect(indicators).toHaveLength(1);
    });
  });

  // --------------------------------------------------------------------------
  // Indicator Styling
  // --------------------------------------------------------------------------

  describe('indicator styling', () => {
    it('indicator has accessible label', () => {
      mockAllModules = [COSTFORGE_MODULE];
      mockWindows = [{ id: 'win-1', moduleId: 'costforge', state: 'normal' }];

      render(<StartMenu />);

      // Should have aria-label for accessibility
      const indicator = screen.getByLabelText(/running/i);
      expect(indicator).toBeInTheDocument();
    });

    it('indicator is visually subtle (green dot)', () => {
      mockAllModules = [COSTFORGE_MODULE];
      mockWindows = [{ id: 'win-1', moduleId: 'costforge', state: 'normal' }];

      render(<StartMenu />);

      const costforgeItem = screen.getByRole('button', { name: 'CostForge' });
      const indicator = costforgeItem.querySelector('[data-testid="running-indicator"]');

      // Should have green color class
      expect(indicator).toHaveClass('text-green-400');
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles empty windows array', () => {
      mockAllModules = [COSTFORGE_MODULE];
      mockWindows = [];

      render(<StartMenu />);

      // Should render without errors
      expect(screen.getByTestId('all-apps')).toBeInTheDocument();

      // No indicators
      const indicators = screen.queryAllByTestId('running-indicator');
      expect(indicators).toHaveLength(0);
    });

    it('handles unknown moduleId in windows gracefully', () => {
      mockAllModules = [COSTFORGE_MODULE];
      // Window for unknown module
      mockWindows = [{ id: 'win-1', moduleId: 'unknown-module', state: 'normal' }];

      render(<StartMenu />);

      // Should render without errors
      expect(screen.getByTestId('all-apps')).toBeInTheDocument();

      // CostForge should NOT have indicator
      const costforgeItem = screen.getByRole('button', { name: 'CostForge' });
      const indicator = costforgeItem.querySelector('[data-testid="running-indicator"]');
      expect(indicator).not.toBeInTheDocument();
    });
  });
});

// ============================================================================
// Recent Apps Section Indicator
// ============================================================================

describe('Recent Apps Open Indicator', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { RecentAppsSection } = require('../RecentAppsSection');

  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows indicator for running recent app', () => {
    mockRecentApps = [COSTFORGE_MODULE];
    mockWindows = [{ id: 'win-1', moduleId: 'costforge', state: 'normal' }];

    render(<RecentAppsSection onLaunch={vi.fn()} />);

    const indicator = screen.queryByTestId('running-indicator');
    expect(indicator).toBeInTheDocument();
  });

  it('does NOT show indicator for closed recent app', () => {
    mockRecentApps = [COSTFORGE_MODULE];
    mockWindows = []; // No windows

    render(<RecentAppsSection onLaunch={vi.fn()} />);

    const indicator = screen.queryByTestId('running-indicator');
    expect(indicator).not.toBeInTheDocument();
  });
});
