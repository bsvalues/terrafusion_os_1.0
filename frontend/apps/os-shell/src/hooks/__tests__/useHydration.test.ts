/**
 * TerraFusion OS Hydration Hook Tests
 *
 * Tests for the useHydration hook and related persistence hooks.
 *
 * @module hooks/__tests__/useHydration.test
 * @vitest-environment jsdom
 * @see SUCCESS CRITERIA SC-5.17, SC-5.18, SC-5.19: Hydration
 */

import { act, renderHook, waitFor } from '@testing-library/react';
// Jest globals used (describe, it, expect, beforeEach, afterEach, jest)
import { STORAGE_KEYS } from '../../services/persistenceService';
import { useDesktopStore } from '../../stores/desktopStore';
import { useModuleRegistryStore } from '../../stores/moduleRegistryStore';
import { useStartMenuStore, type Module } from '../../stores/startMenuStore';
import {
  useDesktopPersistence,
  useHydration,
  useRecentModules,
  useStartMenuPersistence,
} from '../useHydration';

// ============================================================================
// Test Setup
// ============================================================================

// Mock localStorage
let mockStorage: Record<string, string> = {};

const createTestModule = (id: string, name: string): Module => ({
  id,
  name,
  description: `Test ${name}`,
  icon: '📦',
  category: 'Test',
  status: 'active',
});

beforeEach(() => {
  // Reset stores
  useDesktopStore.setState({
    windows: [],
    activeWindowId: null,
    nextZIndex: 1,
    snapPreview: null,
  });
  useStartMenuStore.setState({
    isOpen: false,
    searchQuery: '',
    pinnedApps: [],
    allApps: [
      createTestModule('terra-levy', 'Levy Calculator'),
      createTestModule('terra-gis', 'GIS Viewer'),
      createTestModule('terra-pacs', 'PACS'),
    ],
  });
  useModuleRegistryStore.setState({
    modules: new Map([
      [
        'terra-levy',
        {
          id: 'terra-levy',
          name: 'Levy Calculator',
          displayName: 'Levy Calculator',
          description: 'Tax levy calculations',
          icon: '📊',
          version: '1.0.0',
          launchPath: '/modules/levy',
          category: 'Tax',
          tier: 'Tier1' as const,
          status: 'active' as const,
          isCore: true,
          priority: 1,
        },
      ],
      [
        'terra-gis',
        {
          id: 'terra-gis',
          name: 'GIS Viewer',
          displayName: 'GIS Viewer',
          description: 'Geographic information system',
          icon: '🗺️',
          version: '1.0.0',
          launchPath: '/modules/gis',
          category: 'Mapping',
          tier: 'Tier1' as const,
          status: 'active' as const,
          isCore: true,
          priority: 2,
        },
      ],
    ]),
    loadStates: new Map(),
    isInitialized: true,
    initError: null,
  });

  // Reset localStorage mock
  mockStorage = {};
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(
    (key: string) => mockStorage[key] ?? null
  );
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
    mockStorage[key] = value;
  });
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
    delete mockStorage[key];
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ============================================================================
// useHydration Tests
// ============================================================================

describe('useHydration', () => {
  describe('Initial State (SC-5.17)', () => {
    it('starts with isHydrating true', () => {
      const { result } = renderHook(() => useHydration());

      expect(result.current.isHydrating).toBe(true);
      expect(result.current.isHydrated).toBe(false);
    });

    it('completes hydration with no stored data', async () => {
      const { result } = renderHook(() => useHydration());

      await waitFor(() => {
        expect(result.current.isHydrating).toBe(false);
        expect(result.current.isHydrated).toBe(true);
      });
    });
  });

  describe('Desktop Hydration (SC-5.9)', () => {
    it('restores windows from persisted state', async () => {
      // Clear any existing windows first
      useDesktopStore.setState({ windows: [], activeWindowId: null, nextZIndex: 1 });

      // Setup persisted state
      mockStorage[STORAGE_KEYS.DESKTOP] = JSON.stringify({
        windows: [
          {
            moduleId: 'terra-levy',
            title: 'Levy Calculator',
            icon: '📊',
            position: { x: 100, y: 100 },
            size: { width: 800, height: 600 },
            state: 'normal',
          },
        ],
      });

      const { result } = renderHook(() => useHydration());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      // Check desktop store - expect exactly 1 window
      const { windows } = useDesktopStore.getState();
      const levyWindows = windows.filter((w) => w.moduleId === 'terra-levy');
      expect(levyWindows).toHaveLength(1);
      expect(levyWindows[0].position).toEqual({ x: 100, y: 100 });
    });

    it('skips windows for missing modules (SC-5.10)', async () => {
      // Clear any existing windows first
      useDesktopStore.setState({ windows: [], activeWindowId: null, nextZIndex: 1 });

      // Setup persisted state with a missing module
      mockStorage[STORAGE_KEYS.DESKTOP] = JSON.stringify({
        windows: [
          {
            moduleId: 'nonexistent-module',
            title: 'Deleted',
            icon: '❓',
            position: { x: 100, y: 100 },
            size: { width: 800, height: 600 },
            state: 'normal',
          },
          {
            moduleId: 'terra-levy',
            title: 'Levy',
            icon: '📊',
            position: { x: 200, y: 200 },
            size: { width: 800, height: 600 },
            state: 'normal',
          },
        ],
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useHydration());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      // Only valid window should be restored
      const { windows } = useDesktopStore.getState();
      const levyWindows = windows.filter((w) => w.moduleId === 'terra-levy');
      const nonexistentWindows = windows.filter((w) => w.moduleId === 'nonexistent-module');

      expect(nonexistentWindows).toHaveLength(0); // Missing module skipped
      expect(levyWindows).toHaveLength(1); // Valid module restored

      // Warning should be logged
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('nonexistent-module'));

      consoleSpy.mockRestore();
    });

    it('restores window positions (SC-5.6)', async () => {
      mockStorage[STORAGE_KEYS.DESKTOP] = JSON.stringify({
        windows: [
          {
            moduleId: 'terra-levy',
            title: 'Levy',
            icon: '📊',
            position: { x: 250, y: 175 },
            size: { width: 800, height: 600 },
            state: 'normal',
          },
        ],
      });

      const { result } = renderHook(() => useHydration());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      const { windows } = useDesktopStore.getState();
      expect(windows[0].position).toEqual({ x: 250, y: 175 });
    });

    it('restores window sizes (SC-5.7)', async () => {
      mockStorage[STORAGE_KEYS.DESKTOP] = JSON.stringify({
        windows: [
          {
            moduleId: 'terra-levy',
            title: 'Levy',
            icon: '📊',
            position: { x: 100, y: 100 },
            size: { width: 1024, height: 768 },
            state: 'normal',
          },
        ],
      });

      const { result } = renderHook(() => useHydration());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      const { windows } = useDesktopStore.getState();
      expect(windows[0].size).toEqual({ width: 1024, height: 768 });
    });
  });

  describe('Start Menu Hydration (SC-5.12)', () => {
    it('restores pinned apps from persisted state', async () => {
      mockStorage[STORAGE_KEYS.START_MENU] = JSON.stringify({
        pinnedAppIds: ['terra-levy', 'terra-gis'],
        recentModuleIds: [],
      });

      const { result } = renderHook(() => useHydration());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      const { pinnedApps } = useStartMenuStore.getState();
      expect(pinnedApps).toHaveLength(2);
      expect(pinnedApps.map((a) => a.id)).toEqual(['terra-levy', 'terra-gis']);
    });

    it('filters out missing pinned apps (SC-5.13)', async () => {
      mockStorage[STORAGE_KEYS.START_MENU] = JSON.stringify({
        pinnedAppIds: ['terra-levy', 'nonexistent-app', 'terra-gis'],
        recentModuleIds: [],
      });

      const { result } = renderHook(() => useHydration());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      const { pinnedApps } = useStartMenuStore.getState();
      expect(pinnedApps).toHaveLength(2);
      expect(pinnedApps.map((a) => a.id)).toEqual(['terra-levy', 'terra-gis']);
    });
  });

  describe('Reset (SC-5.19)', () => {
    it('clears all persisted state', async () => {
      // Setup persisted state
      mockStorage[STORAGE_KEYS.DESKTOP] = JSON.stringify({ windows: [] });
      mockStorage[STORAGE_KEYS.START_MENU] = JSON.stringify({
        pinnedAppIds: [],
        recentModuleIds: [],
      });

      const { result } = renderHook(() => useHydration());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify cleared
      expect(mockStorage[STORAGE_KEYS.DESKTOP]).toBeUndefined();
      expect(mockStorage[STORAGE_KEYS.START_MENU]).toBeUndefined();
    });

    it('resets stores to initial state', async () => {
      // Add some windows
      act(() => {
        useDesktopStore.getState().openWindow('terra-levy', 'Levy', '📊');
      });

      const { result } = renderHook(() => useHydration());

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify stores reset
      const { windows } = useDesktopStore.getState();
      expect(windows).toHaveLength(0);
    });
  });

  describe('Manual Hydrate', () => {
    it('can manually trigger hydration with force=true', async () => {
      mockStorage[STORAGE_KEYS.DESKTOP] = JSON.stringify({
        windows: [
          {
            moduleId: 'terra-levy',
            title: 'Levy',
            icon: '📊',
            position: { x: 100, y: 100 },
            size: { width: 800, height: 600 },
            state: 'normal',
          },
        ],
      });

      const { result } = renderHook(() => useHydration());

      // Wait for initial hydration
      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      // Clear store
      act(() => {
        useDesktopStore.setState({ windows: [], activeWindowId: null, nextZIndex: 1 });
      });

      // Manually hydrate again with force=true
      await act(async () => {
        await result.current.hydrate(true);
      });

      const { windows } = useDesktopStore.getState();
      const levyWindows = windows.filter((w) => w.moduleId === 'terra-levy');
      expect(levyWindows).toHaveLength(1);
    });
  });
});

// ============================================================================
// useDesktopPersistence Tests
// ============================================================================

describe('useDesktopPersistence', () => {
  it('persists desktop state on window changes', async () => {
    // Start with no state
    const { rerender } = renderHook(() => useDesktopPersistence());

    // Open a window
    act(() => {
      useDesktopStore.getState().openWindow('terra-levy', 'Levy', '📊');
    });

    // Re-render to trigger effect
    rerender();

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Verify persisted
    expect(mockStorage[STORAGE_KEYS.DESKTOP]).toBeDefined();
    const saved = JSON.parse(mockStorage[STORAGE_KEYS.DESKTOP]);
    expect(saved.windows).toHaveLength(1);
    expect(saved.windows[0].moduleId).toBe('terra-levy');
  });

  it('does not persist empty window state', () => {
    renderHook(() => useDesktopPersistence());

    // No windows = no save
    expect(mockStorage[STORAGE_KEYS.DESKTOP]).toBeUndefined();
  });
});

// ============================================================================
// useStartMenuPersistence Tests
// ============================================================================

describe('useStartMenuPersistence', () => {
  it('persists pinned apps on change', async () => {
    const { rerender } = renderHook(() => useStartMenuPersistence());

    // Add pinned apps
    act(() => {
      useStartMenuStore
        .getState()
        .setPinnedApps([
          createTestModule('terra-levy', 'Levy'),
          createTestModule('terra-gis', 'GIS'),
        ]);
    });

    // Re-render to trigger effect
    rerender();

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Verify persisted
    expect(mockStorage[STORAGE_KEYS.START_MENU]).toBeDefined();
    const saved = JSON.parse(mockStorage[STORAGE_KEYS.START_MENU]);
    expect(saved.pinnedAppIds).toEqual(['terra-levy', 'terra-gis']);
  });
});

// ============================================================================
// useRecentModules Tests
// ============================================================================

describe('useRecentModules', () => {
  it('loads recent modules on mount', async () => {
    // Setup persisted state
    mockStorage[STORAGE_KEYS.START_MENU] = JSON.stringify({
      pinnedAppIds: [],
      recentModuleIds: ['terra-levy', 'terra-gis'],
    });

    const { result } = renderHook(() => useRecentModules());

    await waitFor(() => {
      expect(result.current.recentModuleIds).toEqual(['terra-levy', 'terra-gis']);
    });
  });

  it('adds recent module to front of list', async () => {
    mockStorage[STORAGE_KEYS.START_MENU] = JSON.stringify({
      pinnedAppIds: [],
      recentModuleIds: ['old-module'],
    });

    const { result } = renderHook(() => useRecentModules());

    await waitFor(() => {
      expect(result.current.recentModuleIds).toHaveLength(1);
    });

    // Add new recent
    act(() => {
      result.current.addRecent('new-module');
    });

    expect(result.current.recentModuleIds[0]).toBe('new-module');
  });

  it('limits to 10 recent modules (SC-5.15)', async () => {
    // Start with 10 modules
    mockStorage[STORAGE_KEYS.START_MENU] = JSON.stringify({
      pinnedAppIds: [],
      recentModuleIds: Array.from({ length: 10 }, (_, i) => `module-${i}`),
    });

    const { result } = renderHook(() => useRecentModules());

    await waitFor(() => {
      expect(result.current.recentModuleIds).toHaveLength(10);
    });

    // Add one more
    act(() => {
      result.current.addRecent('new-module');
    });

    // Should still be 10, with new module at front
    expect(result.current.recentModuleIds).toHaveLength(10);
    expect(result.current.recentModuleIds[0]).toBe('new-module');
  });

  it('moves existing module to front on re-open (SC-5.16)', async () => {
    mockStorage[STORAGE_KEYS.START_MENU] = JSON.stringify({
      pinnedAppIds: [],
      recentModuleIds: ['first', 'second', 'third'],
    });

    const { result } = renderHook(() => useRecentModules());

    await waitFor(() => {
      expect(result.current.recentModuleIds[0]).toBe('first');
    });

    // Re-open 'third'
    act(() => {
      result.current.addRecent('third');
    });

    // Third should now be first
    expect(result.current.recentModuleIds[0]).toBe('third');
    expect(result.current.recentModuleIds).toHaveLength(3);
  });
});
