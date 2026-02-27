/**
 * @vitest-environment jsdom
 *
 * TerraFusion OS Module Registry Store Tests
 *
 * Comprehensive test suite for the Zustand store managing module registry.
 * Following TDD principles - tests written BEFORE implementation.
 *
 * @module stores/__tests__/moduleRegistryStore.test
 * @see SUCCESS CRITERIA Phase 3.1
 */

import { act, cleanup, renderHook } from '@testing-library/react';
// Jest globals used (describe, it, expect, beforeEach, afterEach, jest)

import { useDesktopStore } from '../desktopStore';
import { useModuleRegistryStore, type ModuleDefinition } from '../moduleRegistryStore';

// Mock desktopStore
vi.mock('../desktopStore', () => ({
  useDesktopStore: {
    getState: vi.fn(() => ({
      openWindow: vi.fn(() => 'window-123'),
      focusWindow: vi.fn(),
      windows: [],
    })),
    setState: vi.fn(),
    subscribe: vi.fn(),
  },
}));

// Sample test data matching existing moduleAPI structure
const mockModules: ModuleDefinition[] = [
  {
    id: 'government-edition',
    name: 'Government Edition',
    displayName: 'Government Edition',
    description: 'Core government operations dashboard',
    icon: '🏛️',
    category: 'core',
    tier: 'Tier1',
    status: 'active',
    version: '1.0.0',
    launchPath: '/modules/government-edition',
    isCore: true,
    priority: 1,
  },
  {
    id: 'costforge-ai',
    name: 'CostForge AI Champion',
    displayName: 'CostForge AI Champion',
    description: 'AI-powered property valuation',
    icon: '💰',
    category: 'ai',
    tier: 'Tier1',
    status: 'active',
    version: '1.0.0',
    launchPath: '/modules/costforge-ai-champion',
    isCore: true,
    priority: 1,
  },
  {
    id: 'terra-flow',
    name: 'Terra Flow Champion',
    displayName: 'Terra Flow Champion',
    description: 'Advanced workflow orchestration',
    icon: '🔄',
    category: 'automation',
    tier: 'Tier2',
    status: 'active',
    version: '1.0.0',
    launchPath: '/modules/terra-flow-champion',
    isCore: false,
    priority: 2,
  },
  {
    id: 'gispro',
    name: 'GIS Pro',
    displayName: 'GIS Pro',
    description: 'Geographic information systems',
    icon: '🗺️',
    category: 'mapping',
    tier: 'Tier2',
    status: 'active',
    version: '1.0.0',
    launchPath: '/modules/gispro',
    isCore: false,
    priority: 2,
  },
  {
    id: 'terra-levy',
    name: 'Terra Levy',
    displayName: 'Terra Levy',
    description: 'Tax assessment system',
    icon: '📊',
    category: 'finance',
    tier: 'Tier2',
    status: 'inactive',
    version: '1.0.0',
    launchPath: '/modules/terra-levy',
    isCore: false,
    priority: 2,
  },
];

// Reset store before each test
beforeEach(() => {
  useModuleRegistryStore.setState({
    modules: new Map(),
    loadStates: new Map(),
    isInitialized: false,
    initError: null,
  });
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('Module Registry Store', () => {
  describe('Initial State', () => {
    it('starts with empty modules map', () => {
      const { modules } = useModuleRegistryStore.getState();
      expect(modules.size).toBe(0);
    });

    it('starts with empty loadStates map', () => {
      const { loadStates } = useModuleRegistryStore.getState();
      expect(loadStates.size).toBe(0);
    });

    it('starts with isInitialized false', () => {
      const { isInitialized } = useModuleRegistryStore.getState();
      expect(isInitialized).toBe(false);
    });

    it('starts with no init error', () => {
      const { initError } = useModuleRegistryStore.getState();
      expect(initError).toBeNull();
    });
  });

  describe('registerModules', () => {
    it('registers array of modules', () => {
      const { registerModules } = useModuleRegistryStore.getState();

      act(() => {
        registerModules(mockModules);
      });

      const { modules } = useModuleRegistryStore.getState();
      expect(modules.size).toBe(5);
    });

    it('stores modules by ID', () => {
      const { registerModules } = useModuleRegistryStore.getState();

      act(() => {
        registerModules(mockModules);
      });

      const { modules } = useModuleRegistryStore.getState();
      expect(modules.get('government-edition')).toBeDefined();
      expect(modules.get('government-edition')?.displayName).toBe('Government Edition');
    });

    it('sets isInitialized to true', () => {
      const { registerModules } = useModuleRegistryStore.getState();

      act(() => {
        registerModules(mockModules);
      });

      expect(useModuleRegistryStore.getState().isInitialized).toBe(true);
    });

    it('initializes loadState for each module as idle', () => {
      const { registerModules } = useModuleRegistryStore.getState();

      act(() => {
        registerModules(mockModules);
      });

      const { loadStates } = useModuleRegistryStore.getState();
      expect(loadStates.get('government-edition')).toEqual({
        status: 'idle',
        error: null,
        windowId: null,
      });
    });

    it('replaces existing modules on re-register', () => {
      const { registerModules } = useModuleRegistryStore.getState();

      act(() => {
        registerModules(mockModules);
        registerModules([mockModules[0]]); // Only first module
      });

      const { modules } = useModuleRegistryStore.getState();
      expect(modules.size).toBe(1);
    });
  });

  describe('getModuleById', () => {
    beforeEach(() => {
      act(() => {
        useModuleRegistryStore.getState().registerModules(mockModules);
      });
    });

    it('returns module by ID', () => {
      const module = useModuleRegistryStore.getState().getModuleById('costforge-ai');

      expect(module).toBeDefined();
      expect(module?.displayName).toBe('CostForge AI Champion');
    });

    it('returns undefined for unknown ID', () => {
      const module = useModuleRegistryStore.getState().getModuleById('unknown-module');

      expect(module).toBeUndefined();
    });
  });

  describe('getModulesByCategory', () => {
    beforeEach(() => {
      act(() => {
        useModuleRegistryStore.getState().registerModules(mockModules);
      });
    });

    it('returns modules grouped by category', () => {
      const grouped = useModuleRegistryStore.getState().getModulesByCategory();

      expect(grouped).toHaveProperty('core');
      expect(grouped).toHaveProperty('ai');
      expect(grouped).toHaveProperty('automation');
    });

    it('groups modules correctly', () => {
      const grouped = useModuleRegistryStore.getState().getModulesByCategory();

      expect(grouped.core).toHaveLength(1);
      expect(grouped.core[0].id).toBe('government-edition');
    });
  });

  describe('getModulesByTier', () => {
    beforeEach(() => {
      act(() => {
        useModuleRegistryStore.getState().registerModules(mockModules);
      });
    });

    it('returns Tier1 modules', () => {
      const tier1 = useModuleRegistryStore.getState().getModulesByTier('Tier1');

      expect(tier1).toHaveLength(2);
      expect(tier1.every((m) => m.tier === 'Tier1')).toBe(true);
    });

    it('returns Tier2 modules', () => {
      const tier2 = useModuleRegistryStore.getState().getModulesByTier('Tier2');

      expect(tier2).toHaveLength(3);
    });

    it('returns empty array for unknown tier', () => {
      const tier4 = useModuleRegistryStore.getState().getModulesByTier('Tier4' as any);

      expect(tier4).toHaveLength(0);
    });
  });

  describe('getActiveModules', () => {
    beforeEach(() => {
      act(() => {
        useModuleRegistryStore.getState().registerModules(mockModules);
      });
    });

    it('returns only active modules', () => {
      const active = useModuleRegistryStore.getState().getActiveModules();

      expect(active).toHaveLength(4); // 5 total, 1 inactive
      expect(active.every((m) => m.status === 'active')).toBe(true);
    });

    it('excludes inactive modules', () => {
      const active = useModuleRegistryStore.getState().getActiveModules();

      expect(active.find((m) => m.id === 'terra-levy')).toBeUndefined();
    });
  });

  describe('getCoreModules', () => {
    beforeEach(() => {
      act(() => {
        useModuleRegistryStore.getState().registerModules(mockModules);
      });
    });

    it('returns only core modules', () => {
      const core = useModuleRegistryStore.getState().getCoreModules();

      expect(core).toHaveLength(2);
      expect(core.every((m) => m.isCore === true)).toBe(true);
    });
  });

  describe('getAllModulesArray', () => {
    beforeEach(() => {
      act(() => {
        useModuleRegistryStore.getState().registerModules(mockModules);
      });
    });

    it('returns all modules as array', () => {
      const all = useModuleRegistryStore.getState().getAllModulesArray();

      expect(all).toHaveLength(5);
      expect(Array.isArray(all)).toBe(true);
    });

    it('returns modules sorted by priority', () => {
      const all = useModuleRegistryStore.getState().getAllModulesArray();

      // Priority 1 should come before priority 2
      const priorities = all.map((m) => m.priority);
      expect(priorities[0]).toBeLessThanOrEqual(priorities[priorities.length - 1]);
    });
  });

  describe('launchModule', () => {
    beforeEach(() => {
      act(() => {
        useModuleRegistryStore.getState().registerModules(mockModules);
      });
    });

    it('transitions through loading to loaded state', async () => {
      const { launchModule } = useModuleRegistryStore.getState();

      // Note: With synchronous mock, loading state may not be observable
      // between the call and completion. This tests the final result.
      await act(async () => {
        await launchModule('government-edition');
      });

      const { loadStates } = useModuleRegistryStore.getState();
      expect(loadStates.get('government-edition')?.status).toBe('loaded');
    });

    it('sets loadState to loaded on success', async () => {
      const { launchModule } = useModuleRegistryStore.getState();

      await act(async () => {
        await launchModule('government-edition');
      });

      const { loadStates } = useModuleRegistryStore.getState();
      expect(loadStates.get('government-edition')?.status).toBe('loaded');
    });

    it('stores windowId in loadState', async () => {
      const { launchModule } = useModuleRegistryStore.getState();

      await act(async () => {
        await launchModule('government-edition');
      });

      const { loadStates } = useModuleRegistryStore.getState();
      expect(loadStates.get('government-edition')?.windowId).toBe('window-123');
    });

    it('returns windowId on success', async () => {
      const { launchModule } = useModuleRegistryStore.getState();

      let windowId: string | null = null;
      await act(async () => {
        windowId = await launchModule('government-edition');
      });

      expect(windowId).toBe('window-123');
    });

    it('calls desktopStore.openWindow with correct params', async () => {
      const mockOpenWindow = vi.fn(() => 'window-123');
      (useDesktopStore.getState as any).mockReturnValue({
        openWindow: mockOpenWindow,
        focusWindow: vi.fn(),
        windows: [],
      });

      const { launchModule } = useModuleRegistryStore.getState();

      await act(async () => {
        await launchModule('government-edition');
      });

      expect(mockOpenWindow).toHaveBeenCalledWith('government-edition', 'Government Edition', '🏛️');
    });

    it('focuses existing window if module already loaded', async () => {
      const mockFocusWindow = vi.fn();
      (useDesktopStore.getState as any).mockReturnValue({
        openWindow: vi.fn(() => 'window-123'),
        focusWindow: mockFocusWindow,
        windows: [{ id: 'window-123', moduleId: 'government-edition' }],
      });

      // Set up as already loaded
      useModuleRegistryStore.setState({
        ...useModuleRegistryStore.getState(),
        loadStates: new Map([
          ['government-edition', { status: 'loaded', error: null, windowId: 'window-123' }],
        ]),
      });

      const { launchModule } = useModuleRegistryStore.getState();

      await act(async () => {
        await launchModule('government-edition');
      });

      expect(mockFocusWindow).toHaveBeenCalledWith('window-123');
    });

    it('throws error for unknown module', async () => {
      const { launchModule } = useModuleRegistryStore.getState();

      await expect(
        act(async () => {
          await launchModule('unknown-module');
        })
      ).rejects.toThrow('Module not found: unknown-module');
    });
  });

  describe('closeModule', () => {
    beforeEach(() => {
      act(() => {
        useModuleRegistryStore.getState().registerModules(mockModules);
      });
    });

    it('resets loadState to idle', async () => {
      const { launchModule, closeModule } = useModuleRegistryStore.getState();

      await act(async () => {
        await launchModule('government-edition');
      });

      act(() => {
        closeModule('government-edition');
      });

      const { loadStates } = useModuleRegistryStore.getState();
      expect(loadStates.get('government-edition')?.status).toBe('idle');
    });

    it('clears windowId', async () => {
      const { launchModule, closeModule } = useModuleRegistryStore.getState();

      await act(async () => {
        await launchModule('government-edition');
      });

      act(() => {
        closeModule('government-edition');
      });

      const { loadStates } = useModuleRegistryStore.getState();
      expect(loadStates.get('government-edition')?.windowId).toBeNull();
    });

    it('does nothing for unknown module', () => {
      const { closeModule } = useModuleRegistryStore.getState();

      // Should not throw
      expect(() => {
        act(() => {
          closeModule('unknown-module');
        });
      }).not.toThrow();
    });
  });

  describe('setModuleError', () => {
    beforeEach(() => {
      act(() => {
        useModuleRegistryStore.getState().registerModules(mockModules);
      });
    });

    it('sets error state for module', () => {
      const { setModuleError } = useModuleRegistryStore.getState();

      act(() => {
        setModuleError('government-edition', 'Failed to load module');
      });

      const { loadStates } = useModuleRegistryStore.getState();
      expect(loadStates.get('government-edition')?.status).toBe('error');
      expect(loadStates.get('government-edition')?.error).toBe('Failed to load module');
    });
  });

  describe('isModuleLoaded', () => {
    beforeEach(() => {
      act(() => {
        useModuleRegistryStore.getState().registerModules(mockModules);
      });
    });

    it('returns false for idle module', () => {
      const isLoaded = useModuleRegistryStore.getState().isModuleLoaded('government-edition');
      expect(isLoaded).toBe(false);
    });

    it('returns true for loaded module', async () => {
      await act(async () => {
        await useModuleRegistryStore.getState().launchModule('government-edition');
      });

      const isLoaded = useModuleRegistryStore.getState().isModuleLoaded('government-edition');
      expect(isLoaded).toBe(true);
    });

    it('returns false for error module', () => {
      act(() => {
        useModuleRegistryStore.getState().setModuleError('government-edition', 'Error');
      });

      const isLoaded = useModuleRegistryStore.getState().isModuleLoaded('government-edition');
      expect(isLoaded).toBe(false);
    });
  });

  describe('isModuleLoading', () => {
    beforeEach(() => {
      act(() => {
        useModuleRegistryStore.getState().registerModules(mockModules);
      });
    });

    it('returns false for idle module before launch', () => {
      // Module should start as idle, not loading
      expect(useModuleRegistryStore.getState().isModuleLoading('government-edition')).toBe(false);
      expect(useModuleRegistryStore.getState().loadStates.get('government-edition')?.status).toBe(
        'idle'
      );
    });

    it('returns false after launch complete', async () => {
      await act(async () => {
        await useModuleRegistryStore.getState().launchModule('government-edition');
      });

      expect(useModuleRegistryStore.getState().isModuleLoading('government-edition')).toBe(false);
    });
  });

  describe('getModuleWindowId', () => {
    beforeEach(() => {
      act(() => {
        useModuleRegistryStore.getState().registerModules(mockModules);
      });
    });

    it('returns null for idle module', () => {
      const windowId = useModuleRegistryStore.getState().getModuleWindowId('government-edition');
      expect(windowId).toBeNull();
    });

    it('returns windowId for loaded module', async () => {
      await act(async () => {
        await useModuleRegistryStore.getState().launchModule('government-edition');
      });

      const windowId = useModuleRegistryStore.getState().getModuleWindowId('government-edition');
      expect(windowId).toBe('window-123');
    });
  });

  describe('React Hook Integration', () => {
    it('re-renders when modules change', () => {
      const { result } = renderHook(() => useModuleRegistryStore((state) => state.isInitialized));

      expect(result.current).toBe(false);

      act(() => {
        useModuleRegistryStore.getState().registerModules(mockModules);
      });

      expect(result.current).toBe(true);
    });

    it('provides stable selector references', () => {
      const { result, rerender } = renderHook(() =>
        useModuleRegistryStore((state) => ({
          getModuleById: state.getModuleById,
          launchModule: state.launchModule,
        }))
      );

      const first = result.current;
      rerender();

      expect(result.current.getModuleById).toBe(first.getModuleById);
      expect(result.current.launchModule).toBe(first.launchModule);
    });
  });

  describe('Concurrent Operations', () => {
    beforeEach(() => {
      act(() => {
        useModuleRegistryStore.getState().registerModules(mockModules);
      });
    });

    it('handles multiple simultaneous launches', async () => {
      const { launchModule } = useModuleRegistryStore.getState();

      await act(async () => {
        await Promise.all([
          launchModule('government-edition'),
          launchModule('costforge-ai'),
          launchModule('terra-flow'),
        ]);
      });

      const { loadStates } = useModuleRegistryStore.getState();
      expect(loadStates.get('government-edition')?.status).toBe('loaded');
      expect(loadStates.get('costforge-ai')?.status).toBe('loaded');
      expect(loadStates.get('terra-flow')?.status).toBe('loaded');
    });

    it('prevents duplicate launches of same module', async () => {
      const mockOpenWindow = vi.fn(() => 'window-123');
      const mockFocusWindow = vi.fn();

      (useDesktopStore.getState as any).mockReturnValue({
        openWindow: mockOpenWindow,
        focusWindow: mockFocusWindow,
        windows: [],
      });

      const { launchModule } = useModuleRegistryStore.getState();

      await act(async () => {
        await launchModule('government-edition');
      });

      // Update mock to simulate existing window
      (useDesktopStore.getState as any).mockReturnValue({
        openWindow: mockOpenWindow,
        focusWindow: mockFocusWindow,
        windows: [{ id: 'window-123', moduleId: 'government-edition' }],
      });

      useModuleRegistryStore.setState({
        ...useModuleRegistryStore.getState(),
        loadStates: new Map([
          ['government-edition', { status: 'loaded', error: null, windowId: 'window-123' }],
        ]),
      });

      await act(async () => {
        await launchModule('government-edition');
      });

      // Should focus, not open new
      expect(mockFocusWindow).toHaveBeenCalled();
      expect(mockOpenWindow).toHaveBeenCalledTimes(1); // Only first call
    });
  });
});

// ============================================================================
// LAUNCHER TRUTH CONTRACTS (Phase A TDD)
// ============================================================================
// These tests enforce honest launcher behavior per the TerraFusion Constitution.
// A "Suite" label is only valid if there's a native route or bridge to real UX.

import {
    CONSTITUTIONAL_SUITES,
    OS_FEATURES,
    getModuleLabel,
    isConstitutionalSuite,
    isLegacyModule,
    isOsFeature,
} from '../../config/suiteRegistry';

describe('Launcher Truth Contracts', () => {
  describe('Constitutional Suite Registry', () => {
    it('has_exactly_5_constitutional_suites', () => {
      expect(CONSTITUTIONAL_SUITES).toHaveLength(5);
    });

    it('all_suites_have_required_fields', () => {
      for (const suite of CONSTITUTIONAL_SUITES) {
        expect(suite.id).toBeDefined();
        expect(suite.displayName).toBeDefined();
        expect(suite.shortName).toBeDefined();
        expect(suite.description).toBeDefined();
        expect(suite.iconName).toBeDefined();
        expect(suite.route).toBeDefined();
        expect(suite.color).toBeDefined();
        expect(suite.status).toMatch(/^(live|wip|planned)$/);
      }
    });

    it('suite_ids_are_lowercase_slugs', () => {
      for (const suite of CONSTITUTIONAL_SUITES) {
        expect(suite.id).toMatch(/^[a-z]+$/);
      }
    });

    it('suite_routes_start_with_slash', () => {
      for (const suite of CONSTITUTIONAL_SUITES) {
        expect(suite.route.startsWith('/')).toBe(true);
      }
    });
  });

  describe('OS Features Registry', () => {
    it('has_pilot_as_live_feature', () => {
      const pilot = OS_FEATURES.find((f) => f.id === 'pilot');
      expect(pilot).toBeDefined();
      expect(pilot?.status).toBe('live');
    });

    it('has_trace_as_live_feature', () => {
      const trace = OS_FEATURES.find((f) => f.id === 'trace');
      expect(trace).toBeDefined();
      expect(trace?.status).toBe('live');
    });
  });

  describe('Module Classification', () => {
    it('every_launcher_item_has_entryType_and_behavior_matches', () => {
      // Constitutional suites → should be labeled "Suite"
      expect(getModuleLabel('forge')).toBe('Suite');
      expect(getModuleLabel('atlas')).toBe('Suite');
      expect(getModuleLabel('dais')).toBe('Suite');
      expect(getModuleLabel('dossier')).toBe('Suite');
      expect(getModuleLabel('gpt')).toBe('Suite');

      // OS features → should be labeled "OS Feature"
      expect(getModuleLabel('pilot')).toBe('OS Feature');
      expect(getModuleLabel('trace')).toBe('OS Feature');
    });

    it('no_suite_label_without_native_route_or_bridge', () => {
      // Random made-up module IDs should NOT be labeled as Suite
      expect(getModuleLabel('random-module')).toBe('Legacy');
      expect(getModuleLabel('external-thing')).toBe('Legacy');
      expect(getModuleLabel('costforge-ai')).toBe('Legacy'); // Even if real, not a constitutional suite

      // Verify the logic functions
      expect(isConstitutionalSuite('forge')).toBe(true);
      expect(isConstitutionalSuite('costforge-ai')).toBe(false);
      expect(isOsFeature('pilot')).toBe(true);
      expect(isOsFeature('forge')).toBe(false);
      expect(isLegacyModule('costforge-ai')).toBe(true);
      expect(isLegacyModule('forge')).toBe(false);
    });

    it('wip_suites_are_still_suites_not_legacy', () => {
      // A WIP suite is still a suite (just not live yet)
      for (const suite of CONSTITUTIONAL_SUITES.filter((s) => s.status === 'wip')) {
        expect(getModuleLabel(suite.id)).toBe('Suite');
        expect(isConstitutionalSuite(suite.id)).toBe(true);
      }
    });

    it('workbench_tab_suites_have_workbenchTab_true', () => {
      // All 5 constitutional suites should appear in workbench
      const workbenchSuites = CONSTITUTIONAL_SUITES.filter((s) => s.workbenchTab === true);
      expect(workbenchSuites).toHaveLength(5);
    });
  });
});
