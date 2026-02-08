/**
 * Telemetry Storage Adapter
 *
 * Interface and implementations for telemetry event persistence.
 * Supports IndexedDB (primary) and in-memory (testing/fallback).
 *
 * @module services/telemetry/telemetryStorageAdapter
 * @see Slice 20: Persisted Telemetry Backend
 */

import type { StoredTraceEvent } from './telemetryStore';

// ============================================================================
// Adapter Interface
// ============================================================================

export interface ListOptions {
  limit: number;
  offset?: number;
}

export interface TelemetryStorageAdapter {
  /** Append a single event */
  append(event: StoredTraceEvent): Promise<void>;

  /** Append multiple events atomically */
  appendBatch(events: StoredTraceEvent[]): Promise<void>;

  /** List events (newest first) */
  list(options: ListOptions): Promise<StoredTraceEvent[]>;

  /** Get total event count */
  count(): Promise<number>;

  /** Clear all events */
  wipe(): Promise<void>;

  /** Remove events older than timestamp */
  pruneOlderThan(timestamp: number): Promise<number>;

  /** Keep only the N newest events */
  pruneToMaxCount(maxCount: number): Promise<number>;
}

// ============================================================================
// In-Memory Adapter (Testing/Fallback)
// ============================================================================

export function createMemoryAdapter(): TelemetryStorageAdapter {
  let events: StoredTraceEvent[] = [];

  return {
    async append(event: StoredTraceEvent): Promise<void> {
      events.push(event);
    },

    async appendBatch(batch: StoredTraceEvent[]): Promise<void> {
      events.push(...batch);
    },

    async list(options: ListOptions): Promise<StoredTraceEvent[]> {
      const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp);
      const start = options.offset ?? 0;
      return sorted.slice(start, start + options.limit);
    },

    async count(): Promise<number> {
      return events.length;
    },

    async wipe(): Promise<void> {
      events = [];
    },

    async pruneOlderThan(timestamp: number): Promise<number> {
      const before = events.length;
      events = events.filter((e) => e.timestamp >= timestamp);
      return before - events.length;
    },

    async pruneToMaxCount(maxCount: number): Promise<number> {
      if (events.length <= maxCount) return 0;

      // Sort by timestamp descending, keep newest
      events.sort((a, b) => b.timestamp - a.timestamp);
      const removed = events.length - maxCount;
      events = events.slice(0, maxCount);
      return removed;
    },
  };
}

// ============================================================================
// IndexedDB Adapter
// ============================================================================

const DB_NAME = 'TerraFusion_Telemetry';
const DB_VERSION = 1;
const STORE_NAME = 'trace_events';

interface IndexedDBHandle {
  db: IDBDatabase;
}

async function openDatabase(): Promise<IndexedDBHandle> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      resolve({ db: request.result });
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store with auto-increment key
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        });

        // Index for timestamp-based queries
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

export function createIndexedDBAdapter(): TelemetryStorageAdapter {
  let dbHandle: IndexedDBHandle | null = null;

  async function getDb(): Promise<IDBDatabase> {
    if (!dbHandle) {
      dbHandle = await openDatabase();
    }
    return dbHandle.db;
  }

  return {
    async append(event: StoredTraceEvent): Promise<void> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.add(event);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },

    async appendBatch(events: StoredTraceEvent[]): Promise<void> {
      if (events.length === 0) return;

      const db = await getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        let completed = 0;
        let failed = false;

        for (const event of events) {
          const request = store.add(event);
          request.onsuccess = () => {
            completed++;
            if (completed === events.length && !failed) {
              resolve();
            }
          };
          request.onerror = () => {
            if (!failed) {
              failed = true;
              reject(request.error);
            }
          };
        }

        transaction.onerror = () => reject(transaction.error);
      });
    },

    async list(options: ListOptions): Promise<StoredTraceEvent[]> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');

        // Open cursor in descending order (newest first)
        const results: StoredTraceEvent[] = [];
        const request = index.openCursor(null, 'prev');

        let skipped = 0;
        const offset = options.offset ?? 0;

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;

          if (cursor) {
            if (skipped < offset) {
              skipped++;
              cursor.continue();
              return;
            }

            if (results.length < options.limit) {
              results.push(cursor.value as StoredTraceEvent);
              cursor.continue();
            } else {
              resolve(results);
            }
          } else {
            resolve(results);
          }
        };

        request.onerror = () => reject(request.error);
      });
    },

    async count(): Promise<number> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },

    async wipe(): Promise<void> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },

    async pruneOlderThan(timestamp: number): Promise<number> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');

        // Find all events older than timestamp
        const range = IDBKeyRange.upperBound(timestamp, true);
        const request = index.openCursor(range);

        let deletedCount = 0;

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;

          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            resolve(deletedCount);
          }
        };

        request.onerror = () => reject(request.error);
      });
    },

    async pruneToMaxCount(maxCount: number): Promise<number> {
      const db = await getDb();
      const totalCount = await this.count();

      if (totalCount <= maxCount) return 0;

      const toDelete = totalCount - maxCount;

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');

        // Open cursor in ascending order (oldest first) and delete
        const request = index.openCursor(null, 'next');

        let deletedCount = 0;

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;

          if (cursor && deletedCount < toDelete) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            resolve(deletedCount);
          }
        };

        request.onerror = () => reject(request.error);
      });
    },
  };
}

// ============================================================================
// Adapter Factory
// ============================================================================

let defaultAdapter: TelemetryStorageAdapter | null = null;

export function getStorageAdapter(): TelemetryStorageAdapter {
  if (defaultAdapter) return defaultAdapter;

  // Check for IndexedDB availability
  if (typeof indexedDB !== 'undefined') {
    defaultAdapter = createIndexedDBAdapter();
  } else {
    // Fallback to in-memory (SSR, test environments)
    console.warn('[Telemetry] IndexedDB not available, using in-memory adapter');
    defaultAdapter = createMemoryAdapter();
  }

  return defaultAdapter;
}

// For testing: reset the default adapter
export function resetStorageAdapter(): void {
  defaultAdapter = null;
}
