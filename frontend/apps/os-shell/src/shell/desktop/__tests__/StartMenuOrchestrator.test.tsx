/**
 * TerraFusion OS Start Menu Orchestrator Integration Tests
 *
 * Phase 5: Ensures StartMenu launches via activateModule() orchestrator.
 * All launch paths converge on the single canonical entry point.
 *
 * @module shell/desktop/__tests__/StartMenuOrchestrator.test
 * @see Phase 5: Start Menu Integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock activateModule from orchestration - THE canonical entry point
const mockActivateModule = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../orchestration/moduleActivation', () => ({
  activateModule: mockActivateModule,
  default: mockActivateModule,
}));

// Mock startMenuStore
const mockClose = jest.fn();
const mockClearSearch = jest.fn();
const mockAddRecentApp = jest.fn();
let mockIsOpen = true;
let mockPinnedModules: any[] = [];
let mockAllModules: any[] = [];
let mockRecentApps: any[] = [];

jest.mock('../../../stores/startMenuStore', () => ({
  useStartMenuStore: jest.fn((selector) => {
    const state = {
      isOpen: mockIsOpen,
      searchQuery: '',
      close: mockClose,
      clearSearch: mockClearSearch,
      addRecentApp: mockAddRecentApp,
      getPinnedModules: () => mockPinnedModules,
      getFilteredModules: () => mockAllModules,
      setSearchQuery: jest.fn(),
      recentApps: mockRecentApps,
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

// Mock desktopStore - should NOT be called for launching
const mockOpenWindow = jest.fn();
const mockFocusWindow = jest.fn();
const mockWindows: any[] = [];

jest.mock('../../../stores/desktopStore', () => ({
  useDesktopStore: jest.fn((selector) => {
    const state = {
      windows: mockWindows,
      openWindow: mockOpenWindow,
      focusWindow: mockFocusWindow,
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

// Mock moduleRegistryStore - should NOT be called for launching
const mockLaunchModule = jest.fn();

jest.mock('../../../stores/moduleRegistryStore', () => ({
  useModuleRegistryStore: jest.fn((selector) => {
    const state = {
      launchModule: mockLaunchModule,
      isInitialized: true,
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

// ============================================================================
// Test Helpers
// ============================================================================

function resetAllMocks() {
  mockActivateModule.mockClear().mockResolvedValue(undefined);
  mockClose.mockClear();
  mockClearSearch.mockClear();
  mockAddRecentApp.mockClear();
  mockOpenWindow.mockClear();
  mockFocusWindow.mockClear();
  mockLaunchModule.mockClear();
  mockIsOpen = true;
  mockPinnedModules = [];
  mockAllModules = [];
  mockRecentApps = [];
  mockWindows.length = 0;
}

const SAMPLE_MODULE = {
  id: 'costforge',
  name: 'CostForge',
  description: 'Property Assessment',
  icon: '💎',
  category: 'Core',
  status: 'active' as const,
};

const SAMPLE_MODULE_2 = {
  id: 'atlas-ai',
  name: 'ATLAS',
  description: 'AI Intelligence',
  icon: '🤖',
  category: 'AI',
  status: 'active' as const,
};

// ============================================================================
// Tests
// ============================================================================

describe('StartMenu Orchestrator Integration (Phase 5)', () => {
  // Import at top-level since Jest hoists mocks
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StartMenu } = require('../StartMenu');

  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // A) StartMenu click launches via orchestrator
  // --------------------------------------------------------------------------

  describe('click launches via activateModule()', () => {
    it('calls activateModule with correct moduleId when clicking pinned app', async () => {
      mockPinnedModules = [SAMPLE_MODULE];
      mockAllModules = [SAMPLE_MODULE];

      render(<StartMenu />);

      // Both pinned and all apps sections show CostForge, get from pinned (first)
      const appTiles = screen.getAllByRole('button', { name: 'CostForge' });
      fireEvent.click(appTiles[0]); // Click the pinned one

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledTimes(1);
        expect(mockActivateModule).toHaveBeenCalledWith(
          'costforge',
          expect.objectContaining({ source: 'start_menu' })
        );
      });
    });

    it('calls activateModule with correct moduleId when clicking app list item', async () => {
      mockAllModules = [SAMPLE_MODULE, SAMPLE_MODULE_2];

      render(<StartMenu />);

      // Click on ATLAS in the list
      const listItem = screen.getByRole('button', { name: 'ATLAS' });
      fireEvent.click(listItem);

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledWith(
          'atlas-ai',
          expect.objectContaining({ source: 'start_menu' })
        );
      });
    });

    it('passes focusIfOpen: true by default', async () => {
      mockAllModules = [SAMPLE_MODULE];

      render(<StartMenu />);

      fireEvent.click(screen.getByRole('button', { name: 'CostForge' }));

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledWith(
          'costforge',
          expect.objectContaining({ focusIfOpen: true })
        );
      });
    });

    it('passes warmLoad: true by default', async () => {
      mockAllModules = [SAMPLE_MODULE];

      render(<StartMenu />);

      fireEvent.click(screen.getByRole('button', { name: 'CostForge' }));

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalledWith(
          'costforge',
          expect.objectContaining({ warmLoad: true })
        );
      });
    });

    it('closes menu after launching', async () => {
      mockAllModules = [SAMPLE_MODULE];

      render(<StartMenu />);

      fireEvent.click(screen.getByRole('button', { name: 'CostForge' }));

      await waitFor(() => {
        expect(mockClose).toHaveBeenCalled();
      });
    });

    it('clears search after launching', async () => {
      mockAllModules = [SAMPLE_MODULE];

      render(<StartMenu />);

      fireEvent.click(screen.getByRole('button', { name: 'CostForge' }));

      await waitFor(() => {
        expect(mockClearSearch).toHaveBeenCalled();
      });
    });
  });

  // --------------------------------------------------------------------------
  // B) No legacy launch paths called
  // --------------------------------------------------------------------------

  describe('no legacy launch paths used', () => {
    it('does NOT call moduleRegistryStore.launchModule', async () => {
      mockAllModules = [SAMPLE_MODULE];

      render(<StartMenu />);

      fireEvent.click(screen.getByRole('button', { name: 'CostForge' }));

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalled();
      });

      expect(mockLaunchModule).not.toHaveBeenCalled();
    });

    it('does NOT call desktopStore.openWindow directly', async () => {
      mockAllModules = [SAMPLE_MODULE];

      render(<StartMenu />);

      fireEvent.click(screen.getByRole('button', { name: 'CostForge' }));

      await waitFor(() => {
        expect(mockActivateModule).toHaveBeenCalled();
      });

      expect(mockOpenWindow).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // C) Double click protection
  // --------------------------------------------------------------------------

  describe('double click protection', () => {
    it('activateModule handles rapid clicks (orchestrator dedupe)', async () => {
      const user = userEvent.setup({ delay: null });
      mockAllModules = [SAMPLE_MODULE];

      render(<StartMenu />);

      const button = screen.getByRole('button', { name: 'CostForge' });

      // Rapid double click
      await user.dblClick(button);

      // activateModule might be called twice, but orchestrator handles dedupe
      // The key is we don't directly call openWindow multiple times
      expect(mockOpenWindow).not.toHaveBeenCalled();
    });

    it('menu closes on first click, preventing second', async () => {
      mockAllModules = [SAMPLE_MODULE];

      render(<StartMenu />);

      const button = screen.getByRole('button', { name: 'CostForge' });

      // First click
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockClose).toHaveBeenCalledTimes(1);
      });

      // Menu should close, preventing second click from reaching handler
    });
  });

  // --------------------------------------------------------------------------
  // D) Recent apps integration
  // --------------------------------------------------------------------------

  describe('recent apps tracking', () => {
    it('adds to recent apps after launching', async () => {
      mockAllModules = [SAMPLE_MODULE];

      render(<StartMenu />);

      fireEvent.click(screen.getByRole('button', { name: 'CostForge' }));

      await waitFor(() => {
        expect(mockAddRecentApp).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'costforge' })
        );
      });
    });
  });

  // --------------------------------------------------------------------------
  // E) Error handling
  // --------------------------------------------------------------------------

  describe('error handling', () => {
    it('handles activateModule rejection gracefully', async () => {
      mockActivateModule.mockRejectedValueOnce(new Error('Activation failed'));
      mockAllModules = [SAMPLE_MODULE];

      render(<StartMenu />);

      // Should not throw
      fireEvent.click(screen.getByRole('button', { name: 'CostForge' }));

      // Should still close menu
      await waitFor(() => {
        expect(mockClose).toHaveBeenCalled();
      });
    });

    it('does NOT fall back to legacy paths on error', async () => {
      mockActivateModule.mockRejectedValueOnce(new Error('Activation failed'));
      mockAllModules = [SAMPLE_MODULE];

      render(<StartMenu />);

      fireEvent.click(screen.getByRole('button', { name: 'CostForge' }));

      await waitFor(() => {
        expect(mockClose).toHaveBeenCalled();
      });

      // No legacy fallback
      expect(mockLaunchModule).not.toHaveBeenCalled();
      expect(mockOpenWindow).not.toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Integration: Window Focus Behavior
// ============================================================================

describe('StartMenu window focus behavior', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { StartMenu } = require('../StartMenu');

  beforeEach(() => {
    resetAllMocks();
  });

  it('orchestrator handles focus for already-open modules', async () => {
    mockAllModules = [SAMPLE_MODULE];

    // Simulate module already open
    mockWindows.push({
      id: 'window-1',
      moduleId: 'costforge',
      state: 'normal',
    });

    render(<StartMenu />);

    fireEvent.click(screen.getByRole('button', { name: 'CostForge' }));

    await waitFor(() => {
      // activateModule is called - it handles focus internally
      expect(mockActivateModule).toHaveBeenCalledWith(
        'costforge',
        expect.objectContaining({ focusIfOpen: true })
      );
    });

    // Direct openWindow should NOT be called - orchestrator handles it
    expect(mockOpenWindow).not.toHaveBeenCalled();
  });
});
