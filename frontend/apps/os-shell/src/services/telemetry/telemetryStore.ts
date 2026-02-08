/**
 * Telemetry Store
 *
 * High-level store for persisting telemetry events with retention policies.
 * Wraps the storage adapter and enforces count/age limits.
 *
 * @module services/telemetry/telemetryStore
 * @see Slice 20: Persisted Telemetry Backend
 */

import type { ListOptions, TelemetryStorageAdapter } from './telemetryStorageAdapter';
import { getStorageAdapter } from './telemetryStorageAdapter';

// ============================================================================
// Types
// ============================================================================

export interface StoredTraceEvent {
  /** Unique event ID */
  id: string;

  /** Event type */
  type: 'os_action_invoked' | 'os_action_completed' | 'os_action_failed';

  /** Unix timestamp (ms) */
  timestamp: number;

  /** Event payload (normalized, privacy-safe) */
  payload: {
    actionId: string;
    actionType: string;
    intent: string;
    surface: string;
    suiteId: string;
    href?: string;
    tabId?: string;
    parcelIdHash?: string;
    errorCode?: string;
    durationMs?: number;
    [key: string]: unknown;
  };
}

export interface TelemetryStoreConfig {
  /** Maximum number of events to retain (default: 5000) */
  maxEvents: number;

  /** Maximum age in days (0 = no limit, default: 7) */
  maxAgeDays: number;
}

export interface TelemetryStoreStats {
  eventCount: number;
}

export interface TelemetryStore {
  /** Append event (enforces retention after append) */
  append(event: StoredTraceEvent): Promise<void>;

  /** List events (newest first) */
  list(options: ListOptions): Promise<StoredTraceEvent[]>;

  /** Clear all events */
  wipe(): Promise<void>;

  /** Get store statistics */
  stats(): Promise<TelemetryStoreStats>;
}

// ============================================================================
// Store Implementation
// ============================================================================

export function createTelemetryStore(
  adapter: TelemetryStorageAdapter,
  config: TelemetryStoreConfig
): TelemetryStore {
  async function enforceRetention(): Promise<void> {
    try {
      // Age-based pruning
      if (config.maxAgeDays > 0) {
        const cutoff = Date.now() - config.maxAgeDays * 24 * 60 * 60 * 1000;
        await adapter.pruneOlderThan(cutoff);
      }

      // Count-based pruning
      if (config.maxEvents > 0) {
        await adapter.pruneToMaxCount(config.maxEvents);
      }
    } catch (error) {
      // Log but don't throw - retention enforcement is best-effort
      console.warn('[TelemetryStore] Retention enforcement failed:', error);
    }
  }

  return {
    async append(event: StoredTraceEvent): Promise<void> {
      try {
        await adapter.append(event);
        await enforceRetention();
      } catch (error) {
        // Swallow errors for graceful degradation
        console.warn('[TelemetryStore] Failed to append event:', error);
      }
    },

    async list(options: ListOptions): Promise<StoredTraceEvent[]> {
      try {
        return await adapter.list(options);
      } catch (error) {
        console.warn('[TelemetryStore] Failed to list events:', error);
        return [];
      }
    },

    async wipe(): Promise<void> {
      try {
        await adapter.wipe();
      } catch (error) {
        console.warn('[TelemetryStore] Failed to wipe events:', error);
      }
    },

    async stats(): Promise<TelemetryStoreStats> {
      try {
        const count = await adapter.count();
        return { eventCount: count };
      } catch (error) {
        console.warn('[TelemetryStore] Failed to get stats:', error);
        return { eventCount: 0 };
      }
    },
  };
}

// ============================================================================
// Singleton Instance
// ============================================================================

const DEFAULT_CONFIG: TelemetryStoreConfig = {
  maxEvents: 5000,
  maxAgeDays: 7,
};

let defaultStore: TelemetryStore | null = null;

export function getTelemetryStore(): TelemetryStore {
  if (!defaultStore) {
    defaultStore = createTelemetryStore(getStorageAdapter(), DEFAULT_CONFIG);
  }
  return defaultStore;
}

// For testing: reset the default store
export function resetTelemetryStore(): void {
  defaultStore = null;
}
