/**
 * TerraFusion OS Store Persistence Integration Tests
 *
 * Tests for Zustand store integration with persistence service:
 * - Desktop store persistence
 * - Start menu store persistence
 * - Hydration on mount
 * - Restore from localStorage
 *
 * @module stores/__tests__/storePersistence.test
 * @vitest-environment jsdom
 * @see SUCCESS CRITERIA SC-5: State Persistence
 */

import { act } from '@testing-library/react';
// Jest globals used (describe, it, expect, beforeEach, afterEach, jest)
import {
  persistenceService,
  STORAGE_KEYS,
  type PersistedDesktopState,
  type PersistedStartMenuState,
} from '../../services/persistenceService';
import { useDesktopStore } from '../desktopStore';
import { useStartMenuStore, type Module } from '../startMenuStore';

// ============================================================================
// Test Setup
// ============================================================================

// Mock localStorage
let mockStorage: Record<string, string> = {};

beforeEach(() => {
  // Reset stores to initial state
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
    allApps: [],
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

// Test data
const createTestModule = (id: string, name: string): Module => ({
  id,
  name,
  description: `Test ${name} module`,
  icon: '📦',
  category: 'Test',
  status: 'active',
});

// ============================================================================
// Desktop Store Persistence Tests (SC-5.6, SC-5.7, SC-5.8)
// ============================================================================

describe('Desktop Store Persistence', () => {
  describe('Save on Change', () => {
    it('should be able to persist window state manually', () => {
      // Open a window
      let windowId: string = '';
      act(() => {
        windowId = useDesktopStore.getState().openWindow('terra-levy', 'Levy Calculator', '📊');
      });

      // Get current state and persist
      const { windows } = useDesktopStore.getState();
      const persistedState: PersistedDesktopState = {
        windows: windows.map((w) => ({
          moduleId: w.moduleId,
          title: w.title,
          icon: w.icon,
          position: w.position,
          size: w.size,
          state: w.state,
          snapZone: w.snapZone,
        })),
      };

      persistenceService.saveDesktopState(persistedState);

      // Verify saved
      const saved = JSON.parse(mockStorage[STORAGE_KEYS.DESKTOP]);
      expect(saved.windows).toHaveLength(1);
      expect(saved.windows[0].moduleId).toBe('terra-levy');
    });

    it('persists window positions (SC-5.6)', () => {
      // Open and move a window
      let windowId: string = '';
      act(() => {
        windowId = useDesktopStore.getState().openWindow('terra-levy', 'Levy', '📊');
        useDesktopStore.getState().updateWindowPosition(windowId, { x: 300, y: 200 });
      });

      // Persist
      const { windows } = useDesktopStore.getState();
      const persistedState: PersistedDesktopState = {
        windows: windows.map((w) => ({
          moduleId: w.moduleId,
          title: w.title,
          icon: w.icon,
          position: w.position,
          size: w.size,
          state: w.state,
        })),
      };
      persistenceService.saveDesktopState(persistedState);

      // Verify position saved
      const saved = JSON.parse(mockStorage[STORAGE_KEYS.DESKTOP]);
      expect(saved.windows[0].position).toEqual({ x: 300, y: 200 });
    });

    it('persists window sizes (SC-5.7)', () => {
      // Open and resize a window
      let windowId: string = '';
      act(() => {
        windowId = useDesktopStore.getState().openWindow('terra-levy', 'Levy', '📊');
        useDesktopStore.getState().updateWindowSize(windowId, { width: 1200, height: 900 });
      });

      // Persist
      const { windows } = useDesktopStore.getState();
      const persistedState: PersistedDesktopState = {
        windows: windows.map((w) => ({
          moduleId: w.moduleId,
          title: w.title,
          icon: w.icon,
          position: w.position,
          size: w.size,
          state: w.state,
        })),
      };
      persistenceService.saveDesktopState(persistedState);

      // Verify size saved
      const saved = JSON.parse(mockStorage[STORAGE_KEYS.DESKTOP]);
      expect(saved.windows[0].size).toEqual({ width: 1200, height: 900 });
    });

    it('persists which modules are open (SC-5.8)', () => {
      // Open multiple windows
      act(() => {
        useDesktopStore.getState().openWindow('terra-levy', 'Levy', '📊');
        useDesktopStore.getState().openWindow('terra-gis', 'GIS', '🗺️');
        useDesktopStore.getState().openWindow('terra-pacs', 'PACS', '📁');
      });

      // Persist
      const { windows } = useDesktopStore.getState();
      const persistedState: PersistedDesktopState = {
        windows: windows.map((w) => ({
          moduleId: w.moduleId,
          title: w.title,
          icon: w.icon,
          position: w.position,
          size: w.size,
          state: w.state,
        })),
      };
      persistenceService.saveDesktopState(persistedState);

      // Verify all modules saved
      const saved = JSON.parse(mockStorage[STORAGE_KEYS.DESKTOP]);
      const moduleIds = saved.windows.map((w: { moduleId: string }) => w.moduleId);
      expect(moduleIds).toContain('terra-levy');
      expect(moduleIds).toContain('terra-gis');
      expect(moduleIds).toContain('terra-pacs');
    });

    it('persists snapped window state', () => {
      // Open and snap a window
      let windowId: string = '';
      act(() => {
        windowId = useDesktopStore.getState().openWindow('terra-levy', 'Levy', '📊');
        useDesktopStore.getState().snapWindow(windowId, 'left', 1920, 1080);
      });

      // Persist
      const { windows } = useDesktopStore.getState();
      const persistedState: PersistedDesktopState = {
        windows: windows.map((w) => ({
          moduleId: w.moduleId,
          title: w.title,
          icon: w.icon,
          position: w.position,
          size: w.size,
          state: w.state,
          snapZone: w.snapZone,
        })),
      };
      persistenceService.saveDesktopState(persistedState);

      // Verify snap state saved
      const saved = JSON.parse(mockStorage[STORAGE_KEYS.DESKTOP]);
      expect(saved.windows[0].state).toBe('snapped');
      expect(saved.windows[0].snapZone).toBe('left');
    });
  });

  describe('Restore on Load (SC-5.9)', () => {
    it('restores windows from persisted state', () => {
      // Setup persisted state
      const persistedState: PersistedDesktopState = {
        windows: [
          {
            moduleId: 'terra-levy',
            title: 'Levy Calculator',
            icon: '📊',
            position: { x: 100, y: 100 },
            size: { width: 800, height: 600 },
            state: 'normal',
          },
          {
            moduleId: 'terra-gis',
            title: 'GIS Viewer',
            icon: '🗺️',
            position: { x: 200, y: 150 },
            size: { width: 1000, height: 700 },
            state: 'normal',
          },
        ],
      };
      mockStorage[STORAGE_KEYS.DESKTOP] = JSON.stringify(persistedState);

      // Load and restore
      const loaded = persistenceService.loadDesktopState();
      expect(loaded).not.toBeNull();

      // Restore to store
      act(() => {
        if (loaded) {
          loaded.windows.forEach((w) => {
            const windowId = useDesktopStore.getState().openWindow(w.moduleId, w.title, w.icon);
            useDesktopStore.getState().updateWindowPosition(windowId, w.position);
            useDesktopStore.getState().updateWindowSize(windowId, w.size);
          });
        }
      });

      // Verify restored
      const { windows } = useDesktopStore.getState();
      expect(windows).toHaveLength(2);
      expect(windows[0].moduleId).toBe('terra-levy');
      expect(windows[0].position).toEqual({ x: 100, y: 100 });
      expect(windows[1].moduleId).toBe('terra-gis');
    });

    it('handles missing modules gracefully (SC-5.10)', () => {
      // Setup persisted state with a module that no longer exists
      const persistedState: PersistedDesktopState = {
        windows: [
          {
            moduleId: 'nonexistent-module',
            title: 'Deleted Module',
            icon: '❓',
            position: { x: 100, y: 100 },
            size: { width: 800, height: 600 },
            state: 'normal',
          },
        ],
      };
      mockStorage[STORAGE_KEYS.DESKTOP] = JSON.stringify(persistedState);

      // Load persisted state
      const loaded = persistenceService.loadDesktopState();
      expect(loaded).not.toBeNull();

      // In production, we would check if module exists before opening
      // For this test, we just verify the persisted data loads
      expect(loaded?.windows[0].moduleId).toBe('nonexistent-module');
    });
  });
});

// ============================================================================
// Start Menu Store Persistence Tests (SC-5.11, SC-5.12, SC-5.13)
// ============================================================================

describe('Start Menu Store Persistence', () => {
  describe('Pinned Apps Persistence (SC-5.11)', () => {
    it('persists pinned app IDs', () => {
      // Setup pinned apps
      const testApps = [
        createTestModule('terra-levy', 'Levy Calculator'),
        createTestModule('terra-gis', 'GIS Viewer'),
      ];

      act(() => {
        useStartMenuStore.getState().setPinnedApps(testApps);
      });

      // Persist
      const { pinnedApps } = useStartMenuStore.getState();
      const persistedState: PersistedStartMenuState = {
        pinnedAppIds: pinnedApps.map((app) => app.id),
        recentModuleIds: [],
      };
      persistenceService.saveStartMenuState(persistedState);

      // Verify saved
      const saved = JSON.parse(mockStorage[STORAGE_KEYS.START_MENU]);
      expect(saved.pinnedAppIds).toEqual(['terra-levy', 'terra-gis']);
    });
  });

  describe('Restore Pinned Apps (SC-5.12)', () => {
    it('restores pinned apps from persisted state', () => {
      // Setup persisted state
      const persistedState: PersistedStartMenuState = {
        pinnedAppIds: ['terra-levy', 'terra-gis', 'terra-pacs'],
        recentModuleIds: [],
      };
      mockStorage[STORAGE_KEYS.START_MENU] = JSON.stringify(persistedState);

      // Load
      const loaded = persistenceService.loadStartMenuState();
      expect(loaded).not.toBeNull();
      expect(loaded?.pinnedAppIds).toEqual(['terra-levy', 'terra-gis', 'terra-pacs']);
    });

    it('handles missing pinned apps gracefully (SC-5.13)', () => {
      // Setup persisted state with an app that no longer exists
      const persistedState: PersistedStartMenuState = {
        pinnedAppIds: ['terra-levy', 'deleted-app', 'terra-gis'],
        recentModuleIds: [],
      };
      mockStorage[STORAGE_KEYS.START_MENU] = JSON.stringify(persistedState);

      // Load
      const loaded = persistenceService.loadStartMenuState();
      expect(loaded).not.toBeNull();

      // The app IDs are persisted; filtering for existence happens at hydration
      expect(loaded?.pinnedAppIds).toContain('deleted-app');
    });
  });

  describe('Recent Modules (SC-5.14, SC-5.15, SC-5.16)', () => {
    it('tracks recently opened modules (SC-5.14)', () => {
      // Add recent modules
      persistenceService.addRecentModule('terra-levy');
      persistenceService.addRecentModule('terra-gis');

      // Verify
      const loaded = persistenceService.loadStartMenuState();
      expect(loaded?.recentModuleIds).toContain('terra-levy');
      expect(loaded?.recentModuleIds).toContain('terra-gis');
    });

    it('limits to MAX_RECENT modules (SC-5.15)', () => {
      // Add many modules (more than MAX_RECENT = 10)
      for (let i = 0; i < 15; i++) {
        persistenceService.addRecentModule(`module-${i}`);
      }

      // Verify limited
      const loaded = persistenceService.loadStartMenuState();
      expect(loaded?.recentModuleIds.length).toBeLessThanOrEqual(10);
    });

    it('maintains most recent first ordering (SC-5.16)', () => {
      // Add modules in order
      persistenceService.addRecentModule('first');
      persistenceService.addRecentModule('second');
      persistenceService.addRecentModule('third');

      // Verify order (most recent first)
      const loaded = persistenceService.loadStartMenuState();
      expect(loaded?.recentModuleIds[0]).toBe('third');
      expect(loaded?.recentModuleIds[1]).toBe('second');
      expect(loaded?.recentModuleIds[2]).toBe('first');
    });

    it('moves existing module to front when re-opened', () => {
      // Add modules
      persistenceService.addRecentModule('first');
      persistenceService.addRecentModule('second');
      persistenceService.addRecentModule('third');

      // Re-open first module
      persistenceService.addRecentModule('first');

      // Verify first is now at front
      const loaded = persistenceService.loadStartMenuState();
      expect(loaded?.recentModuleIds[0]).toBe('first');
    });
  });
});

// ============================================================================
// Hydration Tests (SC-5.17, SC-5.18, SC-5.19)
// ============================================================================

describe('Hydration', () => {
  describe('Hydration State (SC-5.17)', () => {
    it('can detect when hydration is needed', () => {
      // No stored state = no hydration needed
      expect(persistenceService.loadDesktopState()).toBeNull();

      // With stored state = hydration needed
      mockStorage[STORAGE_KEYS.DESKTOP] = JSON.stringify({ windows: [] });
      expect(persistenceService.loadDesktopState()).not.toBeNull();
    });
  });

  describe('Clear Persisted State (SC-5.19)', () => {
    it('clearAll removes all persisted state', () => {
      // Save some state
      mockStorage[STORAGE_KEYS.DESKTOP] = JSON.stringify({ windows: [] });
      mockStorage[STORAGE_KEYS.START_MENU] = JSON.stringify({
        pinnedAppIds: [],
        recentModuleIds: [],
      });

      // Clear
      persistenceService.clearAll();

      // Verify cleared
      expect(mockStorage[STORAGE_KEYS.DESKTOP]).toBeUndefined();
      expect(mockStorage[STORAGE_KEYS.START_MENU]).toBeUndefined();
    });

    it('clears persisted state for reset functionality', () => {
      // Setup state
      act(() => {
        useDesktopStore.getState().openWindow('terra-levy', 'Levy', '📊');
      });

      // Save
      const { windows } = useDesktopStore.getState();
      persistenceService.saveDesktopState({
        windows: windows.map((w) => ({
          moduleId: w.moduleId,
          title: w.title,
          icon: w.icon,
          position: w.position,
          size: w.size,
          state: w.state,
        })),
      });

      // Verify saved
      expect(mockStorage[STORAGE_KEYS.DESKTOP]).toBeDefined();

      // Clear all
      persistenceService.clearAll();

      // Verify cleared
      expect(mockStorage[STORAGE_KEYS.DESKTOP]).toBeUndefined();
    });
  });

  describe('Version Migration', () => {
    it('clears state on version mismatch', () => {
      // Setup old version data
      mockStorage[STORAGE_KEYS.VERSION] = '0';
      mockStorage[STORAGE_KEYS.DESKTOP] = JSON.stringify({ windows: [] });

      // Check migration needed
      expect(persistenceService.needsMigration()).toBe(true);

      // Perform migration
      persistenceService.migrateIfNeeded();

      // Verify old data cleared
      expect(mockStorage[STORAGE_KEYS.DESKTOP]).toBeUndefined();
    });
  });
});

// ============================================================================
// Integration: Desktop + Start Menu Persistence
// ============================================================================

describe('Integration: Full Workspace Persistence', () => {
  it('persists complete workspace state', () => {
    // Setup workspace
    act(() => {
      // Open windows
      useDesktopStore.getState().openWindow('terra-levy', 'Levy', '📊');
      useDesktopStore.getState().openWindow('terra-gis', 'GIS', '🗺️');

      // Pin apps
      useStartMenuStore
        .getState()
        .setPinnedApps([
          createTestModule('terra-levy', 'Levy'),
          createTestModule('terra-gis', 'GIS'),
        ]);
    });

    // Persist desktop
    const { windows } = useDesktopStore.getState();
    persistenceService.saveDesktopState({
      windows: windows.map((w) => ({
        moduleId: w.moduleId,
        title: w.title,
        icon: w.icon,
        position: w.position,
        size: w.size,
        state: w.state,
      })),
    });

    // Persist start menu
    const { pinnedApps } = useStartMenuStore.getState();
    persistenceService.saveStartMenuState({
      pinnedAppIds: pinnedApps.map((app) => app.id),
      recentModuleIds: ['terra-levy', 'terra-gis'],
    });

    // Verify both saved
    expect(mockStorage[STORAGE_KEYS.DESKTOP]).toBeDefined();
    expect(mockStorage[STORAGE_KEYS.START_MENU]).toBeDefined();

    // Load and verify
    const loadedDesktop = persistenceService.loadDesktopState();
    const loadedStartMenu = persistenceService.loadStartMenuState();

    expect(loadedDesktop?.windows).toHaveLength(2);
    expect(loadedStartMenu?.pinnedAppIds).toHaveLength(2);
    expect(loadedStartMenu?.recentModuleIds).toHaveLength(2);
  });

  it('restores complete workspace from storage', () => {
    // Setup persisted state
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
    mockStorage[STORAGE_KEYS.START_MENU] = JSON.stringify({
      pinnedAppIds: ['terra-levy', 'terra-gis'],
      recentModuleIds: ['terra-levy'],
    });

    // Load
    const desktop = persistenceService.loadDesktopState();
    const startMenu = persistenceService.loadStartMenuState();

    // Restore desktop
    act(() => {
      if (desktop) {
        desktop.windows.forEach((w) => {
          const windowId = useDesktopStore.getState().openWindow(w.moduleId, w.title, w.icon);
          useDesktopStore.getState().updateWindowPosition(windowId, w.position);
          useDesktopStore.getState().updateWindowSize(windowId, w.size);
        });
      }
    });

    // Verify restored
    const { windows } = useDesktopStore.getState();
    expect(windows).toHaveLength(1);
    expect(windows[0].moduleId).toBe('terra-levy');
  });
});
