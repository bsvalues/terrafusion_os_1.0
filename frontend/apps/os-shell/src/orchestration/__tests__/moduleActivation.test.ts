/**
 * TerraFusion OS Module Activation Orchestrator Tests
 *
 * Tests for the single canonical launch pathway.
 * Every module activation source (menu, route, shortcut, deep link, automation)
 * goes through activateModule().
 *
 * @module orchestration/__tests__/moduleActivation.test
 * @see Phase 3 Design Contract
 */

// ============================================================================
// Mock Setup - Must be before imports
// ============================================================================

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted so mock variables are available when vi.mock factories run
const {
  mockOpenWindow,
  mockFocusWindow,
  mockGetWindows,
  mockLoadModule,
  mockGetLoadState,
  mockNormalizeModuleId,
  mockIsModuleRegistered,
  mockTrackEvent,
} = vi.hoisted(() => ({
  mockOpenWindow: vi.fn().mockReturnValue('window-123'),
  mockFocusWindow: vi.fn(),
  mockGetWindows: vi.fn().mockReturnValue([]),
  mockLoadModule: vi.fn().mockResolvedValue(undefined),
  mockGetLoadState: vi.fn().mockReturnValue({ status: 'idle' }),
  mockNormalizeModuleId: vi.fn((id: string) => {
    const aliases: Record<string, string> = {
      terrabuild: 'costforge',
      assessment: 'costforge',
    };
    return aliases[id] || id;
  }),
  mockIsModuleRegistered: vi.fn((id: string) => {
    const registry = ['costforge', 'terra-gaia', 'atlas-ai'];
    return registry.includes(id);
  }),
  mockTrackEvent: vi.fn(),
}));

vi.mock('../../stores/desktopStore', () => ({
  useDesktopStore: {
    getState: () => ({
      windows: mockGetWindows(),
      openWindow: mockOpenWindow,
      focusWindow: mockFocusWindow,
    }),
  },
}));

vi.mock('../../stores/moduleLoaderStore', () => ({
  useModuleLoaderStore: {
    getState: () => ({
      loadModule: mockLoadModule,
      getLoadState: mockGetLoadState,
    }),
  },
}));

vi.mock('../../config/moduleComponents', () => ({
  normalizeModuleId: mockNormalizeModuleId,
  isModuleRegistered: mockIsModuleRegistered,
}));

vi.mock('../../services/telemetry', () => ({
  telemetry: {
    trackEvent: mockTrackEvent,
  },
}));

vi.mock('../../stores/notificationStore', () => ({
  useNotificationStore: {
    getState: () => ({
      addNotification: vi.fn(),
    }),
  },
}));

// Import AFTER mocks
import {
  activateModule,
  type ModuleActivationSource,
} from '../moduleActivation';

// ============================================================================
// Test Helpers
// ============================================================================

function resetAllMocks() {
  mockOpenWindow.mockClear().mockReturnValue('window-123');
  mockFocusWindow.mockClear();
  mockGetWindows.mockClear().mockReturnValue([]);
  mockLoadModule.mockClear().mockResolvedValue(undefined);
  mockGetLoadState.mockClear().mockReturnValue({ status: 'idle' });
  mockTrackEvent.mockClear();
  mockNormalizeModuleId.mockClear().mockImplementation((id: string) => {
    const aliases: Record<string, string> = {
      terrabuild: 'costforge',
      assessment: 'costforge',
    };
    return aliases[id] || id;
  });
  mockIsModuleRegistered.mockClear().mockImplementation((id: string) => {
    const registry = ['costforge', 'terra-gaia', 'atlas-ai'];
    return registry.includes(id);
  });
}

function simulateExistingWindow(
  moduleId: string,
  windowId: string = 'existing-window-456'
) {
  mockGetWindows.mockReturnValue([{ id: windowId, moduleId, state: 'normal' }]);
}

// ============================================================================
// Tests
// ============================================================================

describe('moduleActivation', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Core Behavior
  // --------------------------------------------------------------------------

  describe('core behavior', () => {
    it('activates a registered module', async () => {
      await activateModule('costforge', { source: 'start_menu' });

      // Should open exactly one window
      expect(mockOpenWindow).toHaveBeenCalledTimes(1);
      expect(mockOpenWindow).toHaveBeenCalledWith(
        'costforge', // moduleId
        expect.any(String), // title
        expect.any(String), // icon
        undefined // metadata (none passed)
      );
    });

    it('normalizes aliases to canonical ID', async () => {
      // 'terrabuild' is an alias for 'costforge'
      await activateModule('terrabuild', { source: 'start_menu' });

      // Should open window with canonical ID
      expect(mockOpenWindow).toHaveBeenCalledWith(
        'costforge', // canonical ID, not alias
        expect.any(String), // title
        expect.any(String), // icon
        undefined // metadata
      );
    });

    it('emits module.activate telemetry with correct source', async () => {
      await activateModule('costforge', { source: 'desktop' });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'module.activate',
        expect.objectContaining({
          moduleId: 'costforge',
          source: 'desktop',
        })
      );
    });

    it('opens exactly one window per activation', async () => {
      await activateModule('terra-gaia', { source: 'route' });

      expect(mockOpenWindow).toHaveBeenCalledTimes(1);
    });

    it('triggers exactly one load (deduped by loader)', async () => {
      await activateModule('atlas-ai', { source: 'shortcut' });

      expect(mockLoadModule).toHaveBeenCalledTimes(1);
      expect(mockLoadModule).toHaveBeenCalledWith('atlas-ai');
    });

    it('includes metadata in telemetry when provided', async () => {
      const metadata = { parcelId: '12345', fromDashboard: true };
      await activateModule('costforge', { source: 'deep_link', metadata });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'module.activate',
        expect.objectContaining({
          moduleId: 'costforge',
          source: 'deep_link',
          metadata,
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // Focus Behavior (Window Already Open)
  // --------------------------------------------------------------------------

  describe('focus behavior', () => {
    it('focuses existing window instead of opening new one', async () => {
      // Simulate costforge already open
      simulateExistingWindow('costforge', 'existing-costforge-window');

      await activateModule('costforge', { source: 'start_menu' });

      // Should NOT open new window
      expect(mockOpenWindow).not.toHaveBeenCalled();

      // Should focus existing window
      expect(mockFocusWindow).toHaveBeenCalledTimes(1);
      expect(mockFocusWindow).toHaveBeenCalledWith('existing-costforge-window');
    });

    it('does not trigger a new load when focusing existing window', async () => {
      simulateExistingWindow('costforge');

      await activateModule('costforge', { source: 'start_menu' });

      // Should NOT trigger a new load
      expect(mockLoadModule).not.toHaveBeenCalled();
    });

    it('emits module.focus telemetry when focusing existing window', async () => {
      simulateExistingWindow('costforge');

      await activateModule('costforge', { source: 'desktop' });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'module.focus',
        expect.objectContaining({
          moduleId: 'costforge',
          source: 'desktop',
        })
      );
    });

    it('respects focusIfOpen: false option', async () => {
      simulateExistingWindow('costforge');

      await activateModule('costforge', {
        source: 'system',
        focusIfOpen: false,
      });

      // Should NOT focus existing window
      expect(mockFocusWindow).not.toHaveBeenCalled();
      // Should NOT open new window either (module already active)
      expect(mockOpenWindow).not.toHaveBeenCalled();
    });

    it('activating same module twice does not open second window', async () => {
      // First activation - no window exists
      mockGetWindows.mockReturnValue([]);
      await activateModule('costforge', { source: 'start_menu' });

      expect(mockOpenWindow).toHaveBeenCalledTimes(1);

      // Simulate window now exists
      simulateExistingWindow('costforge', 'window-123');

      // Second activation - window already exists
      await activateModule('costforge', { source: 'start_menu' });

      // Should still only have 1 openWindow call total
      expect(mockOpenWindow).toHaveBeenCalledTimes(1);
      // Should have focused instead
      expect(mockFocusWindow).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // Failure Behavior
  // --------------------------------------------------------------------------

  describe('failure behavior', () => {
    it('handles unregistered module gracefully (no throw)', async () => {
      // Should NOT throw
      await expect(
        activateModule('nonexistent-module', { source: 'start_menu' })
      ).resolves.not.toThrow();
    });

    it('does not open window for unregistered module', async () => {
      await activateModule('nonexistent-module', { source: 'start_menu' });

      expect(mockOpenWindow).not.toHaveBeenCalled();
    });

    it('emits module.reject telemetry for unregistered module', async () => {
      await activateModule('nonexistent-module', { source: 'desktop' });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'module.reject',
        expect.objectContaining({
          moduleId: 'nonexistent-module',
          reason: 'not_registered',
          source: 'desktop',
        })
      );
    });

    it('does not load unregistered module', async () => {
      await activateModule('nonexistent-module', { source: 'route' });

      expect(mockLoadModule).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Warm Load Behavior
  // --------------------------------------------------------------------------

  describe('warm load behavior', () => {
    it('triggers warm load by default (non-blocking)', async () => {
      await activateModule('costforge', { source: 'start_menu' });

      expect(mockLoadModule).toHaveBeenCalledWith('costforge');
    });

    it('respects warmLoad: false option', async () => {
      await activateModule('costforge', {
        source: 'system',
        warmLoad: false,
      });

      // Should still open window
      expect(mockOpenWindow).toHaveBeenCalledTimes(1);
      // But should NOT trigger warm load
      expect(mockLoadModule).not.toHaveBeenCalled();
    });

    it('warm load does not block activation completion', async () => {
      // Make loadModule take a long time
      let resolveLoad: () => void;
      const loadPromise = new Promise<void>((resolve) => {
        resolveLoad = resolve;
      });
      mockLoadModule.mockReturnValue(loadPromise);

      // Activation should complete immediately
      const activationPromise = activateModule('costforge', {
        source: 'start_menu',
      });

      // Window should be opened immediately
      expect(mockOpenWindow).toHaveBeenCalledTimes(1);

      // Activation should resolve without waiting for load
      await activationPromise;

      // Now resolve the load
      resolveLoad!();
      await loadPromise;
    });
  });

  // --------------------------------------------------------------------------
  // Source Variations
  // --------------------------------------------------------------------------

  describe('source variations', () => {
    const sources: ModuleActivationSource[] = [
      'start_menu',
      'desktop',
      'route',
      'shortcut',
      'deep_link',
      'system',
    ];

    sources.forEach((source) => {
      it(`handles source: ${source}`, async () => {
        resetAllMocks();

        await activateModule('costforge', { source });

        expect(mockTrackEvent).toHaveBeenCalledWith(
          'module.activate',
          expect.objectContaining({ source })
        );
      });
    });
  });

  // --------------------------------------------------------------------------
  // Integration: Call Ordering
  // --------------------------------------------------------------------------

  describe('call ordering', () => {
    it('follows correct pipeline order: normalize → telemetry → window → load', async () => {
      const callOrder: string[] = [];

      // Track call order
      mockNormalizeModuleId.mockImplementation((id: string) => {
        callOrder.push('normalize');
        return id === 'terrabuild' ? 'costforge' : id;
      });

      mockTrackEvent.mockImplementation(() => {
        callOrder.push('telemetry');
      });

      mockOpenWindow.mockImplementation(() => {
        callOrder.push('openWindow');
        return 'window-123';
      });

      mockLoadModule.mockImplementation(() => {
        callOrder.push('loadModule');
        return Promise.resolve();
      });

      await activateModule('terrabuild', { source: 'start_menu' });

      // Verify order
      expect(callOrder).toEqual([
        'normalize',
        'telemetry', // module.activate
        'openWindow',
        'loadModule',
      ]);
    });
  });

  // --------------------------------------------------------------------------
  // Type Tests (compile-time only)
  // --------------------------------------------------------------------------

  describe('type safety', () => {
    it('ModuleActivationSource accepts valid sources', async () => {
      // These should all compile without error
      await activateModule('costforge', { source: 'start_menu' });
      await activateModule('costforge', { source: 'desktop' });
      await activateModule('costforge', { source: 'route' });
      await activateModule('costforge', { source: 'shortcut' });
      await activateModule('costforge', { source: 'deep_link' });
      await activateModule('costforge', { source: 'system' });

      expect(true).toBe(true); // If we get here, types are correct
    });

    it('ActivateModuleOptions supports all optional fields', async () => {
      // Full options
      await activateModule('costforge', {
        source: 'start_menu',
        focusIfOpen: true,
        warmLoad: false,
        metadata: { parcelId: '12345' },
      });

      // Minimal options
      await activateModule('costforge', { source: 'system' });

      expect(true).toBe(true);
    });
  });
});
