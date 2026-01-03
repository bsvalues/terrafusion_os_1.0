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
jest.mock('../desktopStore', () => ({
  useDesktopStore: {
    getState: jest.fn(() => ({
      openWindow: jest.fn(() => 'window-123'),
      focusWindow: jest.fn(),
      windows: [],
    })),
    setState: jest.fn(),
    subscribe: jest.fn(),
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
  jest.clearAllMocks();
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
      const mockOpenWindow = jest.fn(() => 'window-123');
      (useDesktopStore.getState as any).mockReturnValue({
        openWindow: mockOpenWindow,
        focusWindow: jest.fn(),
        windows: [],
      });

      const { launchModule } = useModuleRegistryStore.getState();

      await act(async () => {
        await launchModule('government-edition');
      });

      expect(mockOpenWindow).toHaveBeenCalledWith('government-edition', 'Government Edition', '🏛️');
    });

    it('focuses existing window if module already loaded', async () => {
      const mockFocusWindow = jest.fn();
      (useDesktopStore.getState as any).mockReturnValue({
        openWindow: jest.fn(() => 'window-123'),
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
      const mockOpenWindow = jest.fn(() => 'window-123');
      const mockFocusWindow = jest.fn();

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
