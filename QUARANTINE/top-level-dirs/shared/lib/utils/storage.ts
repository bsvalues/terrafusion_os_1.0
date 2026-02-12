/**
 * TerraFusion OS - Storage Utilities
 * 
 * Type-safe localStorage and sessionStorage utilities with:
 * - JSON serialization with error handling
 * - Expiration/TTL support for time-limited cache
 * - Cache invalidation strategies (pattern-based, version-based)
 * - Cross-tab synchronization via storage events
 * - Quota management with LRU eviction
 * - Fallback to in-memory storage when unavailable
 * - React hooks with automatic re-renders
 * 
 * @module storage
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Storage item with metadata
 */
export interface StorageItem<T = any> {
  /** The stored value */
  value: T;
  /** Unix timestamp when item was created */
  createdAt: number;
  /** Unix timestamp when item expires (optional) */
  expiresAt?: number;
  /** Version for cache invalidation (optional) */
  version?: string;
}

/**
 * Options for setting storage items
 */
export interface StorageSetOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Version for cache invalidation */
  version?: string;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  /** Number of items in storage */
  itemCount: number;
  /** Estimated size in bytes */
  estimatedSize: number;
  /** Available quota in bytes (if supported) */
  availableQuota?: number;
  /** Used quota in bytes (if supported) */
  usedQuota?: number;
}

/**
 * Storage backend type
 */
export type StorageBackend = 'localStorage' | 'sessionStorage' | 'memory';

// ============================================================================
// Storage Class
// ============================================================================

/**
 * Type-safe storage wrapper with advanced features
 */
export class Storage {
  private backend: globalThis.Storage | Map<string, string>;
  private backendType: StorageBackend;
  private prefix: string;

  /**
   * Create a new storage instance
   * 
   * @param backendType - Storage backend to use
   * @param prefix - Key prefix for namespacing (default: 'tf_')
   */
  constructor(backendType: StorageBackend = 'localStorage', prefix = 'tf_') {
    this.backendType = backendType;
    this.prefix = prefix;

    // Try to use requested backend, fallback to in-memory if unavailable
    try {
      if (typeof window === 'undefined') {
        // SSR - use in-memory storage
        this.backend = new Map();
        this.backendType = 'memory';
      } else if (backendType === 'localStorage') {
        // Test localStorage availability
        window.localStorage.setItem('__test__', 'test');
        window.localStorage.removeItem('__test__');
        this.backend = window.localStorage;
      } else if (backendType === 'sessionStorage') {
        // Test sessionStorage availability
        window.sessionStorage.setItem('__test__', 'test');
        window.sessionStorage.removeItem('__test__');
        this.backend = window.sessionStorage;
      } else {
        // Use in-memory storage
        this.backend = new Map();
      }
    } catch (error) {
      // Fallback to in-memory if storage unavailable (private browsing, etc.)
      console.warn(`${backendType} unavailable, using in-memory storage:`, error);
      this.backend = new Map();
      this.backendType = 'memory';
    }
  }

  /**
   * Get the full prefixed key
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Get an item from storage
   * 
   * @param key - Storage key
   * @returns The stored value or null if not found/expired
   */
  get<T = any>(key: string): T | null {
    try {
      const fullKey = this.getKey(key);
      const rawValue = this.backend instanceof Map
        ? this.backend.get(fullKey)
        : this.backend.getItem(fullKey);

      if (!rawValue) {
        return null;
      }

      const item: StorageItem<T> = JSON.parse(rawValue);

      // Check expiration
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.remove(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.warn(`Error reading storage key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set an item in storage
   * 
   * @param key - Storage key
   * @param value - Value to store
   * @param options - Storage options (ttl, version)
   * @returns True if successful, false otherwise
   */
  set<T = any>(key: string, value: T, options: StorageSetOptions = {}): boolean {
    try {
      const fullKey = this.getKey(key);
      const now = Date.now();

      const item: StorageItem<T> = {
        value,
        createdAt: now,
        ...(options.ttl && { expiresAt: now + options.ttl }),
        ...(options.version && { version: options.version }),
      };

      const serialized = JSON.stringify(item);

      // Check quota before writing (for browser storage)
      if (!(this.backend instanceof Map)) {
        this.checkQuota(serialized.length);
      }

      if (this.backend instanceof Map) {
        this.backend.set(fullKey, serialized);
      } else {
        this.backend.setItem(fullKey, serialized);
      }

      return true;
    } catch (error) {
      // Handle quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, attempting LRU eviction');
        this.evictLRU();
        
        // Retry after eviction
        try {
          const fullKey = this.getKey(key);
          const now = Date.now();
          const item: StorageItem<T> = {
            value,
            createdAt: now,
            ...(options.ttl && { expiresAt: now + options.ttl }),
            ...(options.version && { version: options.version }),
          };
          const serialized = JSON.stringify(item);

          if (this.backend instanceof Map) {
            this.backend.set(fullKey, serialized);
          } else {
            this.backend.setItem(fullKey, serialized);
          }

          return true;
        } catch (retryError) {
          console.error('Storage failed after LRU eviction:', retryError);
          return false;
        }
      }

      console.warn(`Error setting storage key "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove an item from storage
   * 
   * @param key - Storage key
   */
  remove(key: string): void {
    try {
      const fullKey = this.getKey(key);

      if (this.backend instanceof Map) {
        this.backend.delete(fullKey);
      } else {
        this.backend.removeItem(fullKey);
      }
    } catch (error) {
      console.warn(`Error removing storage key "${key}":`, error);
    }
  }

  /**
   * Clear all items with this storage's prefix
   */
  clear(): void {
    try {
      const keys = this.keys();
      keys.forEach(key => this.remove(key));
    } catch (error) {
      console.warn('Error clearing storage:', error);
    }
  }

  /**
   * Get all keys in storage (without prefix)
   * 
   * @returns Array of keys
   */
  keys(): string[] {
    try {
      if (this.backend instanceof Map) {
        return Array.from(this.backend.keys())
          .filter(key => key.startsWith(this.prefix))
          .map(key => key.slice(this.prefix.length));
      }

      const keys: string[] = [];
      for (let i = 0; i < this.backend.length; i++) {
        const key = this.backend.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.slice(this.prefix.length));
        }
      }
      return keys;
    } catch (error) {
      console.warn('Error getting storage keys:', error);
      return [];
    }
  }

  /**
   * Check if a key exists in storage (and is not expired)
   * 
   * @param key - Storage key
   * @returns True if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get the raw storage item with metadata
   * 
   * @param key - Storage key
   * @returns The storage item or null
   */
  getItem<T = any>(key: string): StorageItem<T> | null {
    try {
      const fullKey = this.getKey(key);
      const rawValue = this.backend instanceof Map
        ? this.backend.get(fullKey)
        : this.backend.getItem(fullKey);

      if (!rawValue) {
        return null;
      }

      return JSON.parse(rawValue);
    } catch (error) {
      console.warn(`Error reading storage item "${key}":`, error);
      return null;
    }
  }

  /**
   * Invalidate all items matching a pattern
   * 
   * @param pattern - RegExp pattern to match keys
   * @returns Number of items invalidated
   */
  invalidatePattern(pattern: RegExp): number {
    const keys = this.keys();
    const matchingKeys = keys.filter(key => pattern.test(key));
    matchingKeys.forEach(key => this.remove(key));
    return matchingKeys.length;
  }

  /**
   * Invalidate all items with a specific version
   * 
   * @param version - Version to invalidate
   * @returns Number of items invalidated
   */
  invalidateVersion(version: string): number {
    const keys = this.keys();
    let count = 0;

    keys.forEach(key => {
      const item = this.getItem(key);
      if (item && item.version === version) {
        this.remove(key);
        count++;
      }
    });

    return count;
  }

  /**
   * Remove all expired items
   * 
   * @returns Number of items removed
   */
  pruneExpired(): number {
    const keys = this.keys();
    const now = Date.now();
    let count = 0;

    keys.forEach(key => {
      const item = this.getItem(key);
      if (item && item.expiresAt && now > item.expiresAt) {
        this.remove(key);
        count++;
      }
    });

    return count;
  }

  /**
   * Get storage statistics
   * 
   * @returns Storage statistics
   */
  async getStats(): Promise<StorageStats> {
    const keys = this.keys();
    let estimatedSize = 0;

    // Calculate estimated size
    keys.forEach(key => {
      const fullKey = this.getKey(key);
      const value = this.backend instanceof Map
        ? this.backend.get(fullKey)
        : this.backend.getItem(fullKey);
      
      if (value) {
        // Rough estimate: 2 bytes per character (UTF-16)
        estimatedSize += value.length * 2;
      }
    });

    const stats: StorageStats = {
      itemCount: keys.length,
      estimatedSize,
    };

    // Try to get quota information (only available in browsers)
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        stats.usedQuota = estimate.usage;
        stats.availableQuota = estimate.quota;
      } catch (error) {
        // Quota API not available
      }
    }

    return stats;
  }

  /**
   * Check storage quota and warn if running low
   * 
   * @param additionalSize - Size to be added (optional)
   */
  private checkQuota(additionalSize = 0): void {
    if (this.backend instanceof Map) {
      return; // No quota limits for in-memory storage
    }

    try {
      // Try to estimate current usage
      let currentSize = 0;
      for (let i = 0; i < this.backend.length; i++) {
        const key = this.backend.key(i);
        if (key) {
          const value = this.backend.getItem(key);
          if (value) {
            currentSize += (key.length + value.length) * 2; // UTF-16 estimate
          }
        }
      }

      // Most browsers have ~5-10MB limit for localStorage
      const estimatedLimit = 10 * 1024 * 1024; // 10MB
      const estimatedUsage = currentSize + additionalSize;

      if (estimatedUsage > estimatedLimit * 0.9) {
        console.warn(
          `Storage usage approaching limit: ${(estimatedUsage / 1024 / 1024).toFixed(2)}MB / ${(estimatedLimit / 1024 / 1024).toFixed(2)}MB`
        );
      }
    } catch (error) {
      // Ignore errors in quota check
    }
  }

  /**
   * Evict least recently used items to free up space
   * 
   * @param targetCount - Number of items to evict (default: 10% of items)
   */
  private evictLRU(targetCount?: number): void {
    const keys = this.keys();
    const items: Array<{ key: string; createdAt: number }> = [];

    // Collect all items with their creation timestamps
    keys.forEach(key => {
      const item = this.getItem(key);
      if (item) {
        items.push({ key, createdAt: item.createdAt });
      }
    });

    // Sort by creation time (oldest first)
    items.sort((a, b) => a.createdAt - b.createdAt);

    // Evict oldest items
    const count = targetCount || Math.max(1, Math.floor(items.length * 0.1));
    const toEvict = items.slice(0, count);

    toEvict.forEach(item => {
      this.remove(item.key);
    });

    console.log(`Evicted ${toEvict.length} items from storage`);
  }

  /**
   * Get the backend type
   */
  getBackendType(): StorageBackend {
    return this.backendType;
  }

  /**
   * Export all storage data
   * 
   * @returns Object with all key-value pairs
   */
  export<T = any>(): Record<string, T> {
    const data: Record<string, T> = {};
    const keys = this.keys();

    keys.forEach(key => {
      const value = this.get<T>(key);
      if (value !== null) {
        data[key] = value;
      }
    });

    return data;
  }

  /**
   * Import storage data
   * 
   * @param data - Object with key-value pairs
   * @param options - Storage options for all items
   */
  import<T = any>(data: Record<string, T>, options: StorageSetOptions = {}): void {
    Object.entries(data).forEach(([key, value]) => {
      this.set(key, value, options);
    });
  }
}

// ============================================================================
// Global Storage Instances
// ============================================================================

/** Default localStorage instance */
export const localStorage = new Storage('localStorage');

/** Default sessionStorage instance */
export const sessionStorage = new Storage('sessionStorage');

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook to persist state in localStorage with automatic synchronization
 * 
 * @param key - Storage key
 * @param initialValue - Initial value
 * @param options - Storage options
 * @returns [value, setValue, remove] tuple
 * 
 * @example
 * ```tsx
 * const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
 * 
 * return (
 *   <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *     Toggle Theme
 *   </button>
 * );
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: StorageSetOptions = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Read from localStorage
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    const stored = localStorage.get<T>(key);
    return stored !== null ? stored : initialValue;
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Set value
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        localStorage.set(key, valueToStore, options);
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, options]
  );

  // Remove value
  const remove = useCallback(() => {
    try {
      setStoredValue(initialValue);
      localStorage.remove(key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for storage events (cross-tab synchronization)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      const fullKey = localStorage['getKey'](key);
      if (e.key === fullKey && e.newValue !== null) {
        try {
          const item: StorageItem<T> = JSON.parse(e.newValue);
          setStoredValue(item.value);
        } catch (error) {
          console.warn('Error parsing storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, remove];
}

/**
 * Hook to persist state in sessionStorage with automatic synchronization
 * 
 * @param key - Storage key
 * @param initialValue - Initial value
 * @param options - Storage options
 * @returns [value, setValue, remove] tuple
 * 
 * @example
 * ```tsx
 * const [token, setToken, removeToken] = useSessionStorage('auth-token', null);
 * ```
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options: StorageSetOptions = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Read from sessionStorage
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    const stored = sessionStorage.get<T>(key);
    return stored !== null ? stored : initialValue;
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Set value
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        sessionStorage.set(key, valueToStore, options);
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue, options]
  );

  // Remove value
  const remove = useCallback(() => {
    try {
      setStoredValue(initialValue);
      sessionStorage.remove(key);
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for storage events (cross-tab synchronization)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      const fullKey = sessionStorage['getKey'](key);
      if (e.key === fullKey && e.newValue !== null) {
        try {
          const item: StorageItem<T> = JSON.parse(e.newValue);
          setStoredValue(item.value);
        } catch (error) {
          console.warn('Error parsing storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, remove];
}

/**
 * Hook to create a custom storage instance
 * 
 * @param backendType - Storage backend type
 * @param prefix - Key prefix
 * @returns Storage instance
 * 
 * @example
 * ```tsx
 * const propertyStorage = useStorage('localStorage', 'property_');
 * 
 * propertyStorage.set('recent', recentProperties, { ttl: 3600000 }); // 1 hour
 * const recent = propertyStorage.get('recent');
 * ```
 */
export function useStorage(
  backendType: StorageBackend = 'localStorage',
  prefix = 'tf_'
): Storage {
  const [storage] = useState(() => new Storage(backendType, prefix));
  return storage;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a namespaced storage instance
 * 
 * @param namespace - Namespace for keys
 * @param backendType - Storage backend type
 * @returns Storage instance
 * 
 * @example
 * ```ts
 * const propertyStorage = createStorage('property', 'localStorage');
 * propertyStorage.set('recent', recentProperties);
 * ```
 */
export function createStorage(
  namespace: string,
  backendType: StorageBackend = 'localStorage'
): Storage {
  return new Storage(backendType, `tf_${namespace}_`);
}

/**
 * Check if storage is available
 * 
 * @param type - Storage type to check
 * @returns True if storage is available
 */
export function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    const storage = window[type];
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Migrate data from one storage to another
 * 
 * @param from - Source storage
 * @param to - Destination storage
 * @param options - Storage options for migrated items
 */
export function migrateStorage(
  from: Storage,
  to: Storage,
  options: StorageSetOptions = {}
): void {
  const data = from.export();
  to.import(data, options);
}
