/**
 * Storage Adapter for Launcher Personalization
 *
 * Injectable localStorage wrapper for pins and recents persistence.
 * Allows tests to run without global storage.
 *
 * @module launcher/storageAdapter
 */

// ============================================================================
// Types
// ============================================================================

export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

// ============================================================================
// Key Prefix (namespace)
// ============================================================================

const STORAGE_PREFIX = 'tf_launcher_';

// ============================================================================
// Local Storage Implementation
// ============================================================================

function prefixKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

/**
 * Default localStorage adapter.
 * Handles JSON serialization and graceful error handling.
 */
export const localStorageAdapter: StorageAdapter = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const raw = localStorage.getItem(prefixKey(key));
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      // Parse error or storage error - return null
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      localStorage.setItem(prefixKey(key), JSON.stringify(value));
    } catch {
      // Storage full or error - silently fail
      // Could log to telemetry in production
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      localStorage.removeItem(prefixKey(key));
    } catch {
      // Silent fail
    }
  },
};

// ============================================================================
// In-Memory Adapter (for testing)
// ============================================================================

/**
 * Create an in-memory storage adapter for testing.
 * Does not persist across test runs.
 */
export function createMemoryAdapter(): StorageAdapter {
  const store = new Map<string, unknown>();

  return {
    get<T>(key: string): T | null {
      const value = store.get(prefixKey(key));
      return value !== undefined ? (value as T) : null;
    },

    set<T>(key: string, value: T): void {
      store.set(prefixKey(key), value);
    },

    remove(key: string): void {
      store.delete(prefixKey(key));
    },
  };
}

// ============================================================================
// Singleton Default Adapter
// ============================================================================

let defaultAdapter: StorageAdapter = localStorageAdapter;

/**
 * Get the current storage adapter.
 */
export function getStorageAdapter(): StorageAdapter {
  return defaultAdapter;
}

/**
 * Set the storage adapter (for dependency injection in tests).
 */
export function setStorageAdapter(adapter: StorageAdapter): void {
  defaultAdapter = adapter;
}

/**
 * Reset to default localStorage adapter.
 */
export function resetStorageAdapter(): void {
  defaultAdapter = localStorageAdapter;
}
