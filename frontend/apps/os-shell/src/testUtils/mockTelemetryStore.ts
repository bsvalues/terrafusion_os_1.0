/**
 * Mock Telemetry Store for Testing
 *
 * Provides an in-memory telemetry store for deterministic integration tests.
 * Supports all TelemetryStore operations with controllable behavior.
 *
 * @module testUtils/mockTelemetryStore
 * @see Slice 24.1: Policy Integration Test Enablement
 */

import type { ListOptions } from '../services/telemetry/telemetryStorageAdapter';
import { createMemoryAdapter } from '../services/telemetry/telemetryStorageAdapter';
import type {
    StoredTraceEvent,
    TelemetryStore,
    TelemetryStoreStats,
} from '../services/telemetry/telemetryStore';
import { createTelemetryStore } from '../services/telemetry/telemetryStore';

// ============================================================================
// Mock Store Factory
// ============================================================================

export interface MockTelemetryStoreOptions {
  /** Seed events (for testing history mode) */
  seedEvents?: StoredTraceEvent[];

  /** Clock override for deterministic timestamps (default: Date.now) */
  now?: () => number;

  /** Max event retention count (default: 1000) */
  maxEvents?: number;

  /** Max age in days (default: 7) */
  maxAgeDays?: number;
}

/**
 * Create a mock telemetry store for testing.
 *
 * Uses in-memory storage adapter for fast, deterministic tests.
 * Supports seeding with initial events for history mode tests.
 *
 * @param options - Configuration options
 * @returns Mock telemetry store instance
 *
 * @example
 * ```ts
 * const mockStore = createMockTelemetryStore({
 *   seedEvents: [
 *     { id: '1', type: 'os_action_invoked', timestamp: 1000, payload: { ... } }
 *   ],
 *   now: () => 2000
 * });
 * ```
 */
export function createMockTelemetryStore(options: MockTelemetryStoreOptions = {}): TelemetryStore {
  const { seedEvents = [], maxEvents = 1000, maxAgeDays = 7 } = options;

  // Create in-memory adapter
  const adapter = createMemoryAdapter();

  // Seed with initial events
  if (seedEvents.length > 0) {
    void adapter.appendBatch(seedEvents);
  }

  // Create store with config
  return createTelemetryStore(adapter, {
    maxEvents,
    maxAgeDays,
  });
}

// ============================================================================
// Stub Store (No-op)
// ============================================================================

/**
 * Create a stub telemetry store that does nothing.
 *
 * Useful for tests that don't care about history mode.
 * All operations succeed silently without side effects.
 */
export function createStubTelemetryStore(): TelemetryStore {
  return {
    async append(): Promise<void> {
      // No-op
    },
    async list(): Promise<StoredTraceEvent[]> {
      return [];
    },
    async wipe(): Promise<void> {
      // No-op
    },
    async stats(): Promise<TelemetryStoreStats> {
      return { eventCount: 0 };
    },
  };
}

// ============================================================================
// Spy Store (Captures Operations)
// ============================================================================

export interface TelemetryStoreSpy {
  store: TelemetryStore;
  calls: {
    append: StoredTraceEvent[];
    list: ListOptions[];
    wipe: number;
    stats: number;
  };
}

/**
 * Create a spy telemetry store that captures all operations.
 *
 * Wraps a real store and records all method calls for assertion.
 *
 * @param wrappedStore - Optional store to wrap (defaults to stub)
 * @returns Spy store with call history
 *
 * @example
 * ```ts
 * const spy = createSpyTelemetryStore();
 * await spy.store.append(event);
 * expect(spy.calls.append).toHaveLength(1);
 * ```
 */
export function createSpyTelemetryStore(wrappedStore?: TelemetryStore): TelemetryStoreSpy {
  const baseStore = wrappedStore ?? createStubTelemetryStore();

  const calls = {
    append: [] as StoredTraceEvent[],
    list: [] as ListOptions[],
    wipe: 0,
    stats: 0,
  };

  const store: TelemetryStore = {
    async append(event: StoredTraceEvent): Promise<void> {
      calls.append.push(event);
      await baseStore.append(event);
    },

    async list(options: ListOptions): Promise<StoredTraceEvent[]> {
      calls.list.push(options);
      return await baseStore.list(options);
    },

    async wipe(): Promise<void> {
      calls.wipe += 1;
      await baseStore.wipe();
    },

    async stats(): Promise<TelemetryStoreStats> {
      calls.stats += 1;
      return await baseStore.stats();
    },
  };

  return { store, calls };
}
