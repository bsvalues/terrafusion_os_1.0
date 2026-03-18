/**
 * TerraFusion OS Persistence Service Tests
 * 
 * Tests for localStorage persistence layer:
 * - Save/load state
 * - Error handling
 * - Version migrations
 * - Data validation
 * 
 * @module services/__tests__/persistenceService.test
 * @vitest-environment jsdom
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  persistenceService,
  STORAGE_KEYS,
  CURRENT_VERSION,
  type PersistedDesktopState,
  type PersistedStartMenuState,
} from '../persistenceService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  };
})();

// Setup/teardown
beforeEach(() => {
  // Reset mock
  localStorageMock.clear();
  vi.clearAllMocks();
  
  // Install mock
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Test data
const mockDesktopState: PersistedDesktopState = {
  windows: [
    {
      moduleId: 'government-edition',
      title: 'Government Edition',
      icon: '🏛️',
      position: { x: 100, y: 50 },
      size: { width: 800, height: 600 },
      state: 'normal',
    },
    {
      moduleId: 'gispro',
      title: 'GIS Pro',
      icon: '🗺️',
      position: { x: 200, y: 100 },
      size: { width: 1000, height: 700 },
      state: 'snapped',
      snapZone: 'left',
    },
  ],
};

const mockStartMenuState: PersistedStartMenuState = {
  pinnedAppIds: ['government-edition', 'costforge-ai', 'gispro'],
  recentModuleIds: ['government-edition', 'gispro'],
};

describe('Persistence Service', () => {
  describe('Constants', () => {
    it('exports storage keys', () => {
      expect(STORAGE_KEYS).toBeDefined();
      expect(STORAGE_KEYS.DESKTOP).toBe('terrafusion:desktop');
      expect(STORAGE_KEYS.START_MENU).toBe('terrafusion:startmenu');
      expect(STORAGE_KEYS.VERSION).toBe('terrafusion:version');
    });

    it('exports current version', () => {
      expect(CURRENT_VERSION).toBeDefined();
      expect(typeof CURRENT_VERSION).toBe('number');
    });
  });

  describe('saveDesktopState', () => {
    it('saves desktop state to localStorage', () => {
      persistenceService.saveDesktopState(mockDesktopState);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.DESKTOP,
        expect.any(String)
      );

      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.windows).toHaveLength(2);
      expect(saved.windows[0].moduleId).toBe('government-edition');
    });

    it('saves version with state', () => {
      persistenceService.saveDesktopState(mockDesktopState);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.VERSION,
        String(CURRENT_VERSION)
      );
    });

    it('handles localStorage error gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      expect(() => {
        persistenceService.saveDesktopState(mockDesktopState);
      }).not.toThrow();
    });

    it('strips runtime-only properties from windows', () => {
      const stateWithRuntimeProps = {
        windows: [
          {
            id: 'window-123', // Should be stripped
            moduleId: 'test',
            title: 'Test',
            icon: '📄',
            position: { x: 0, y: 0 },
            size: { width: 800, height: 600 },
            state: 'normal' as const,
            zIndex: 5, // Should be stripped
          },
        ],
      };

      persistenceService.saveDesktopState(stateWithRuntimeProps);

      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.windows[0].id).toBeUndefined();
      expect(saved.windows[0].zIndex).toBeUndefined();
    });
  });

  describe('loadDesktopState', () => {
    it('loads desktop state from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockDesktopState));

      const result = persistenceService.loadDesktopState();

      expect(result).not.toBeNull();
      expect(result?.windows).toHaveLength(2);
      expect(result?.windows[0].moduleId).toBe('government-edition');
    });

    it('returns null when no stored state', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = persistenceService.loadDesktopState();

      expect(result).toBeNull();
    });

    it('returns null on invalid JSON', () => {
      localStorageMock.getItem.mockReturnValue('not valid json{{{');

      const result = persistenceService.loadDesktopState();

      expect(result).toBeNull();
    });

    it('returns null on schema mismatch', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        somethingElse: 'wrong schema',
      }));

      const result = persistenceService.loadDesktopState();

      expect(result).toBeNull();
    });

    it('handles localStorage error gracefully', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('SecurityError');
      });

      const result = persistenceService.loadDesktopState();

      expect(result).toBeNull();
    });
  });

  describe('saveStartMenuState', () => {
    it('saves start menu state to localStorage', () => {
      persistenceService.saveStartMenuState(mockStartMenuState);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.START_MENU,
        expect.any(String)
      );

      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.pinnedAppIds).toEqual(['government-edition', 'costforge-ai', 'gispro']);
    });

    it('saves recent module IDs', () => {
      persistenceService.saveStartMenuState(mockStartMenuState);

      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.recentModuleIds).toEqual(['government-edition', 'gispro']);
    });
  });

  describe('loadStartMenuState', () => {
    it('loads start menu state from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStartMenuState));

      const result = persistenceService.loadStartMenuState();

      expect(result).not.toBeNull();
      expect(result?.pinnedAppIds).toEqual(['government-edition', 'costforge-ai', 'gispro']);
    });

    it('returns null when no stored state', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = persistenceService.loadStartMenuState();

      expect(result).toBeNull();
    });

    it('returns null on invalid data', () => {
      localStorageMock.getItem.mockReturnValue('corrupted');

      const result = persistenceService.loadStartMenuState();

      expect(result).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('removes all TerraFusion keys from localStorage', () => {
      persistenceService.clearAll();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.DESKTOP);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.START_MENU);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.VERSION);
    });
  });

  describe('isStorageAvailable', () => {
    it('returns true when localStorage is available', () => {
      expect(persistenceService.isStorageAvailable()).toBe(true);
    });

    it('returns false when localStorage throws', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage disabled');
      });

      expect(persistenceService.isStorageAvailable()).toBe(false);
    });
  });

  describe('Version Migration', () => {
    it('detects version mismatch', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.VERSION) return '0'; // Old version
        if (key === STORAGE_KEYS.DESKTOP) return JSON.stringify(mockDesktopState);
        return null;
      });

      const needsMigration = persistenceService.needsMigration();
      expect(needsMigration).toBe(true);
    });

    it('returns false when versions match', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.VERSION) return String(CURRENT_VERSION);
        return null;
      });

      const needsMigration = persistenceService.needsMigration();
      expect(needsMigration).toBe(false);
    });

    it('clears old data on version mismatch (for now)', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.VERSION) return '0';
        return null;
      });

      persistenceService.migrateIfNeeded();

      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('addRecentModule', () => {
    it('adds module to recent list', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        pinnedAppIds: [],
        recentModuleIds: ['existing-module'],
      }));

      persistenceService.addRecentModule('new-module');

      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.recentModuleIds).toContain('new-module');
    });

    it('moves existing module to front', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        pinnedAppIds: [],
        recentModuleIds: ['first', 'second', 'third'],
      }));

      persistenceService.addRecentModule('second');

      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.recentModuleIds[0]).toBe('second');
    });

    it('limits recent modules to MAX_RECENT', () => {
      const manyModules = Array.from({ length: 15 }, (_, i) => `module-${i}`);
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        pinnedAppIds: [],
        recentModuleIds: manyModules,
      }));

      persistenceService.addRecentModule('new-module');

      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.recentModuleIds.length).toBeLessThanOrEqual(10);
      expect(saved.recentModuleIds[0]).toBe('new-module');
    });
  });

  describe('Debounced Save', () => {
    it('debounces rapid saves', async () => {
      vi.useFakeTimers();

      persistenceService.saveDesktopStateDebounced(mockDesktopState);
      persistenceService.saveDesktopStateDebounced(mockDesktopState);
      persistenceService.saveDesktopStateDebounced(mockDesktopState);

      // Should not have saved yet
      expect(localStorageMock.setItem).not.toHaveBeenCalled();

      // Fast forward debounce time
      vi.advanceTimersByTime(500);

      // Now it should have saved once
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2); // desktop + version

      vi.useRealTimers();
    });
  });
});
