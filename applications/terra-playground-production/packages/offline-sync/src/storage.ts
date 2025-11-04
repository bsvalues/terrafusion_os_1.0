/**
 * Storage
 *
 * Storage providers for offline sync.
 */

import { openDB, IDBPDatabase } from 'idb';
import { retry } from './utils';

/**
 * Storage provider interface
 */
export interface StorageProvider {
  /**
   * Initialize storage
   *
   * @returns Promise<void>
   */
  initialize(): Promise<void>;

  /**
   * Get item
   *
   * @param key Key
   * @returns Item if found
   */
  getItem<T>(key: string): Promise<T | null>;

  /**
   * Set item
   *
   * @param key Key
   * @param value Value
   * @returns Whether item was set
   */
  setItem<T>(key: string, value: T): Promise<boolean>;

  /**
   * Remove item
   *
   * @param key Key
   * @returns Whether item was removed
   */
  removeItem(key: string): Promise<boolean>;

  /**
   * Clear all items
   *
   * @returns Whether all items were cleared
   */
  clear(): Promise<boolean>;

  /**
   * Get all keys
   *
   * @returns Array of keys
   */
  keys(): Promise<string[]>;

  /**
   * Get all items
   *
   * @returns Record of key-value pairs
   */
  getAll<T>(): Promise<Record<string, T>>;
}

/**
 * Local storage provider
 */
export class LocalStorageProvider implements StorageProvider {
  private prefix: string;

  /**
   * Initialize a new local storage provider
   *
   * @param prefix Key prefix
   */
  constructor(prefix: string = 'terrafusion') {
    this.prefix = prefix;
  }

  /**
   * Initialize storage
   *
   * @returns Promise<void>
   */
  async initialize(): Promise<void> {
    // Local storage is always available
    return Promise.resolve();
  }

  /**
   * Get item
   *
   * @param key Key
   * @returns Item if found
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = localStorage.getItem(`${this.prefix}:${key}`);

      if (value === null) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (err) {
      console.error('Error getting item from local storage:', err);
      return null;
    }
  }

  /**
   * Set item
   *
   * @param key Key
   * @param value Value
   * @returns Whether item was set
   */
  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      localStorage.setItem(`${this.prefix}:${key}`, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error('Error setting item in local storage:', err);
      return false;
    }
  }

  /**
   * Remove item
   *
   * @param key Key
   * @returns Whether item was removed
   */
  async removeItem(key: string): Promise<boolean> {
    try {
      localStorage.removeItem(`${this.prefix}:${key}`);
      return true;
    } catch (err) {
      console.error('Error removing item from local storage:', err);
      return false;
    }
  }

  /**
   * Clear all items
   *
   * @returns Whether all items were cleared
   */
  async clear(): Promise<boolean> {
    try {
      const allKeys = Object.keys(localStorage);

      for (const key of allKeys) {
        if (key.startsWith(`${this.prefix}:`)) {
          localStorage.removeItem(key);
        }
      }

      return true;
    } catch (err) {
      console.error('Error clearing local storage:', err);
      return false;
    }
  }

  /**
   * Get all keys
   *
   * @returns Array of keys
   */
  async keys(): Promise<string[]> {
    try {
      const allKeys = Object.keys(localStorage);
      const prefixLength = `${this.prefix}:`.length;

      return allKeys
        .filter(key => key.startsWith(`${this.prefix}:`))
        .map(key => key.substring(prefixLength));
    } catch (err) {
      console.error('Error getting keys from local storage:', err);
      return [];
    }
  }

  /**
   * Get all items
   *
   * @returns Record of key-value pairs
   */
  async getAll<T>(): Promise<Record<string, T>> {
    try {
      const keys = await this.keys();
      const items: Record<string, T> = {};

      for (const key of keys) {
        const value = await this.getItem<T>(key);

        if (value !== null) {
          items[key] = value;
        }
      }

      return items;
    } catch (err) {
      console.error('Error getting all items from local storage:', err);
      return {};
    }
  }
}

/**
 * IndexedDB storage provider
 */
export class IndexedDBStorageProvider implements StorageProvider {
  private dbName: string;
  private storeName: string;
  private db: IDBPDatabase | null = null;

  /**
   * Initialize a new IndexedDB storage provider
   *
   * @param dbName Database name
   * @param storeName Store name
   */
  constructor(dbName: string = 'terrafusion', storeName: string = 'offline-sync') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  /**
   * Initialize storage
   *
   * @returns Promise<void>
   */
  async initialize(): Promise<void> {
    try {
      this.db = await openDB(this.dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('offline-sync')) {
            db.createObjectStore('offline-sync');
          }
        },
      });
    } catch (err) {
      console.error('Error initializing IndexedDB:', err);
      throw err;
    }
  }

  /**
   * Get item
   *
   * @param key Key
   * @returns Item if found
   */
  async getItem<T>(key: string): Promise<T | null> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      return await retry(async () => {
        if (!this.db) {
          throw new Error('Database not initialized');
        }

        return this.db.get(this.storeName, key) as Promise<T | null>;
      });
    } catch (err) {
      console.error('Error getting item from IndexedDB:', err);
      return null;
    }
  }

  /**
   * Set item
   *
   * @param key Key
   * @param value Value
   * @returns Whether item was set
   */
  async setItem<T>(key: string, value: T): Promise<boolean> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      await retry(async () => {
        if (!this.db) {
          throw new Error('Database not initialized');
        }

        await this.db.put(this.storeName, value, key);
      });

      return true;
    } catch (err) {
      console.error('Error setting item in IndexedDB:', err);
      return false;
    }
  }

  /**
   * Remove item
   *
   * @param key Key
   * @returns Whether item was removed
   */
  async removeItem(key: string): Promise<boolean> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      await retry(async () => {
        if (!this.db) {
          throw new Error('Database not initialized');
        }

        await this.db.delete(this.storeName, key);
      });

      return true;
    } catch (err) {
      console.error('Error removing item from IndexedDB:', err);
      return false;
    }
  }

  /**
   * Clear all items
   *
   * @returns Whether all items were cleared
   */
  async clear(): Promise<boolean> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      await retry(async () => {
        if (!this.db) {
          throw new Error('Database not initialized');
        }

        await this.db.clear(this.storeName);
      });

      return true;
    } catch (err) {
      console.error('Error clearing IndexedDB:', err);
      return false;
    }
  }

  /**
   * Get all keys
   *
   * @returns Array of keys
   */
  async keys(): Promise<string[]> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      return await retry(async () => {
        if (!this.db) {
          throw new Error('Database not initialized');
        }

        return this.db.getAllKeys(this.storeName) as Promise<string[]>;
      });
    } catch (err) {
      console.error('Error getting keys from IndexedDB:', err);
      return [];
    }
  }

  /**
   * Get all items
   *
   * @returns Record of key-value pairs
   */
  async getAll<T>(): Promise<Record<string, T>> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      return await retry(async () => {
        if (!this.db) {
          throw new Error('Database not initialized');
        }

        const keys = (await this.db.getAllKeys(this.storeName)) as string[];
        const values = (await this.db.getAll(this.storeName)) as T[];

        return keys.reduce(
          (acc, key /* , index */) => {
            acc[key] = values[index];
            return acc;
          },
          {} as Record<string, T>
        );
      });
    } catch (err) {
      console.error('Error getting all items from IndexedDB:', err);
      return {};
    }
  }
}
