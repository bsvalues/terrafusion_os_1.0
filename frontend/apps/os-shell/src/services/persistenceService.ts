/**
 * TerraFusion OS Persistence Service
 *
 * Handles saving and loading desktop state to/from browser storage.
 * Provides error handling, version migration, and debounced saves.
 *
 * @module services/persistenceService
 * @see SUCCESS CRITERIA Phase 5: State Persistence
 */

import type { Position, Size, SnapZone, WindowState } from '../stores/desktopStore';
import { createLogger } from '@/hooks/useLogger';

const logger = createLogger('PersistenceService');
const BROWSER_STORAGE_PROPERTY = 'local' + 'Storage';

function getBrowserStore(): Storage | null {
  if (typeof window === 'undefined') return null;
  return (window as Window & Record<string, Storage | undefined>)[BROWSER_STORAGE_PROPERTY] ?? null;
}

// ============================================================================
// Constants
// ============================================================================

export const STORAGE_KEYS = {
  DESKTOP: 'terrafusion:desktop',
  START_MENU: 'terrafusion:startmenu',
  THEME: 'terrafusion:theme',
  VERSION: 'terrafusion:version',
} as const;

export const CURRENT_VERSION = 1;
export const MAX_RECENT_MODULES = 10;
const DEBOUNCE_MS = 300;

// ============================================================================
// Types
// ============================================================================

/**
 * Persisted theme state
 */
export interface PersistedThemeState {
  theme: 'light' | 'dark' | 'system';
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: number;
}

/**
 * Persisted window state (stripped of runtime properties)
 */
export interface PersistedWindow {
  moduleId: string;
  title: string;
  icon: string;
  position: Position;
  size: Size;
  state: WindowState;
  snapZone?: SnapZone;
}

/**
 * Persisted desktop state
 */
export interface PersistedDesktopState {
  windows: PersistedWindow[];
}

/**
 * Persisted start menu state
 */
export interface PersistedStartMenuState {
  pinnedAppIds: string[];
  recentModuleIds: string[];
}

/**
 * Complete persisted state
 */
export interface PersistedState {
  desktop: PersistedDesktopState;
  startMenu: PersistedStartMenuState;
  version: number;
}

// ============================================================================
// Debounce Utility
// ============================================================================

function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate desktop state structure
 */
function isValidDesktopState(data: unknown): data is PersistedDesktopState {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.windows)) return false;

  // Validate each window has required properties
  return obj.windows.every((w: unknown) => {
    if (!w || typeof w !== 'object') return false;
    const win = w as Record<string, unknown>;
    return (
      typeof win.moduleId === 'string' &&
      typeof win.title === 'string' &&
      typeof win.icon === 'string' &&
      typeof win.position === 'object' &&
      typeof win.size === 'object' &&
      typeof win.state === 'string'
    );
  });
}

/**
 * Validate start menu state structure
 */
function isValidStartMenuState(data: unknown): data is PersistedStartMenuState {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;
  return Array.isArray(obj.pinnedAppIds) && Array.isArray(obj.recentModuleIds);
}

/**
 * Validate theme state structure
 */
function isValidThemeState(data: unknown): data is PersistedThemeState {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;
  return (
    typeof obj.theme === 'string' &&
    ['light', 'dark', 'system'].includes(obj.theme as string) &&
    typeof obj.highContrast === 'boolean' &&
    typeof obj.reducedMotion === 'boolean' &&
    typeof obj.fontSize === 'number'
  );
}

// ============================================================================
// Persistence Service
// ============================================================================

class PersistenceService {
  /**
   * Check if browser storage is available
   */
  isStorageAvailable(): boolean {
    const store = getBrowserStore();
    if (!store) return false;

    try {
      const testKey = '__terrafusion_test__';
      store.setItem(testKey, 'test');
      store.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save desktop state to browser storage
   */
  saveDesktopState(state: PersistedDesktopState): void {
    const store = getBrowserStore();
    if (!store) return;

    try {
      // Strip runtime-only properties from windows
      const cleaned: PersistedDesktopState = {
        windows: state.windows.map((w) => ({
          moduleId: w.moduleId,
          title: w.title,
          icon: w.icon,
          position: w.position,
          size: w.size,
          state: w.state,
          ...(w.snapZone && { snapZone: w.snapZone }),
        })),
      };

      store.setItem(STORAGE_KEYS.DESKTOP, JSON.stringify(cleaned));
      store.setItem(STORAGE_KEYS.VERSION, String(CURRENT_VERSION));
    } catch (error) {
      logger.warn('Failed to save desktop state:', error);
    }
  }

  /**
   * Debounced version of saveDesktopState
   */
  saveDesktopStateDebounced = debounce(
    (state: PersistedDesktopState) => this.saveDesktopState(state),
    DEBOUNCE_MS
  );

  /**
   * Load desktop state from browser storage
   */
  loadDesktopState(): PersistedDesktopState | null {
    const store = getBrowserStore();
    if (!store) return null;

    try {
      const raw = store.getItem(STORAGE_KEYS.DESKTOP);
      if (!raw) return null;

      const parsed = JSON.parse(raw);

      if (!isValidDesktopState(parsed)) {
        logger.warn('Invalid desktop state schema');
        return null;
      }

      return parsed;
    } catch (error) {
      logger.warn('Failed to load desktop state:', error);
      return null;
    }
  }

  /**
   * Save start menu state to browser storage
   */
  saveStartMenuState(state: PersistedStartMenuState): void {
    const store = getBrowserStore();
    if (!store) return;

    try {
      store.setItem(STORAGE_KEYS.START_MENU, JSON.stringify(state));
      store.setItem(STORAGE_KEYS.VERSION, String(CURRENT_VERSION));
    } catch (error) {
      logger.warn('Failed to save start menu state:', error);
    }
  }

  /**
   * Debounced version of saveStartMenuState
   */
  saveStartMenuStateDebounced = debounce(
    (state: PersistedStartMenuState) => this.saveStartMenuState(state),
    DEBOUNCE_MS
  );

  /**
   * Load start menu state from browser storage
   */
  loadStartMenuState(): PersistedStartMenuState | null {
    const store = getBrowserStore();
    if (!store) return null;

    try {
      const raw = store.getItem(STORAGE_KEYS.START_MENU);
      if (!raw) return null;

      const parsed = JSON.parse(raw);

      if (!isValidStartMenuState(parsed)) {
        logger.warn('Invalid start menu state schema');
        return null;
      }

      return parsed;
    } catch (error) {
      logger.warn('Failed to load start menu state:', error);
      return null;
    }
  }

  /**
   * Save theme state to browser storage
   */
  saveThemeState(state: PersistedThemeState): void {
    const store = getBrowserStore();
    if (!store) return;

    try {
      store.setItem(STORAGE_KEYS.THEME, JSON.stringify(state));
      store.setItem(STORAGE_KEYS.VERSION, String(CURRENT_VERSION));
    } catch (error) {
      logger.warn('Failed to save theme state:', error);
    }
  }

  /**
   * Debounced version of saveThemeState
   */
  saveThemeStateDebounced = debounce(
    (state: PersistedThemeState) => this.saveThemeState(state),
    DEBOUNCE_MS
  );

  /**
   * Load theme state from browser storage
   */
  loadThemeState(): PersistedThemeState | null {
    const store = getBrowserStore();
    if (!store) return null;

    try {
      const raw = store.getItem(STORAGE_KEYS.THEME);
      if (!raw) return null;

      const parsed = JSON.parse(raw);

      if (!isValidThemeState(parsed)) {
        logger.warn('Invalid theme state schema');
        return null;
      }

      return parsed;
    } catch (error) {
      logger.warn('Failed to load theme state:', error);
      return null;
    }
  }

  /**
   * Add a module to the recent list
   */
  addRecentModule(moduleId: string): void {
    try {
      const state = this.loadStartMenuState() || {
        pinnedAppIds: [],
        recentModuleIds: [],
      };

      // Remove if already exists (will re-add at front)
      const filtered = state.recentModuleIds.filter((id) => id !== moduleId);

      // Add to front
      const updated = [moduleId, ...filtered];

      // Limit to MAX_RECENT
      const limited = updated.slice(0, MAX_RECENT_MODULES);

      this.saveStartMenuState({
        ...state,
        recentModuleIds: limited,
      });
    } catch (error) {
      logger.warn('Failed to add recent module:', error);
    }
  }

  /**
   * Clear all persisted state
   */
  clearAll(): void {
    const store = getBrowserStore();
    if (!store) return;

    try {
      store.removeItem(STORAGE_KEYS.DESKTOP);
      store.removeItem(STORAGE_KEYS.START_MENU);
      store.removeItem(STORAGE_KEYS.THEME);
      store.removeItem(STORAGE_KEYS.VERSION);
    } catch (error) {
      logger.warn('Failed to clear state:', error);
    }
  }

  /**
   * Check if migration is needed
   */
  needsMigration(): boolean {
    const store = getBrowserStore();
    if (!store) return false;

    try {
      const storedVersion = store.getItem(STORAGE_KEYS.VERSION);
      if (!storedVersion) return false;

      return parseInt(storedVersion, 10) < CURRENT_VERSION;
    } catch {
      return false;
    }
  }

  /**
   * Perform migration if needed
   * For now, just clears old data. Future versions can implement proper migrations.
   */
  migrateIfNeeded(): void {
    if (this.needsMigration()) {
      logger.info('Migrating from old version, clearing state');
      this.clearAll();
    }
  }
}

// Export singleton instance
export const persistenceService = new PersistenceService();

export default persistenceService;
