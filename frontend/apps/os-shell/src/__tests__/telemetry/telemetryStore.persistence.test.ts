/**
 * Telemetry Store Persistence Tests
 *
 * TDD tests for telemetry store persistence mechanics:
 * - IndexedDB adapter CRUD operations
 * - Wipe functionality
 * - Graceful degradation
 * - Batched writes
 *
 * @module __tests__/telemetry/telemetryStore.persistence.test
 * @see Slice 20: Persisted Telemetry Backend
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createTelemetrySink,
    type TelemetrySink,
    type TelemetrySinkConfig,
} from '../../services/telemetry/telemetrySink';
import {
    createMemoryAdapter,
    type TelemetryStorageAdapter,
} from '../../services/telemetry/telemetryStorageAdapter';
import {
    createTelemetryStore,
    type StoredTraceEvent,
    type TelemetryStore,
    type TelemetryStoreConfig,
} from '../../services/telemetry/telemetryStore';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockEvent(id: number, timestamp?: number): StoredTraceEvent {
  return {
    id: `event-${id}`,
    type: 'os_action_invoked',
    timestamp: timestamp ?? Date.now() - id * 1000,
    payload: {
      actionId: `action-${id}`,
      actionType: 'navigation',
      intent: 'standalone',
      surface: 'launcher',
      suiteId: 'test',
      href: `/test/${id}`,
    },
  };
}

function createMockTraceEvent(id: number) {
  return {
    type: 'os_action_invoked' as const,
    payload: {
      actionId: `action-${id}`,
      actionType: 'navigation' as const,
      intent: 'standalone' as const,
      surface: 'launcher' as const,
      suiteId: 'test',
      href: `/test/${id}`,
    },
    timestamp: Date.now(),
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('Telemetry Store Persistence', () => {
  let adapter: TelemetryStorageAdapter;
  let store: TelemetryStore;

  const defaultConfig: TelemetryStoreConfig = {
    maxEvents: 5000,
    maxAgeDays: 7,
  };

  beforeEach(() => {
    adapter = createMemoryAdapter();
    store = createTelemetryStore(adapter, defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic CRUD operations', () => {
    it('appends events via append()', async () => {
      const event = createMockEvent(1);
      await store.append(event);

      const events = await store.list({ limit: 10 });
      expect(events.length).toBe(1);
      expect(events[0].id).toBe('event-1');
    });

    it('retrieves events via list()', async () => {
      await store.append(createMockEvent(1));
      await store.append(createMockEvent(2));
      await store.append(createMockEvent(3));

      const events = await store.list({ limit: 10 });
      expect(events.length).toBe(3);
    });

    it('clears all events via wipe()', async () => {
      await store.append(createMockEvent(1));
      await store.append(createMockEvent(2));
      await store.append(createMockEvent(3));

      await store.wipe();

      const events = await store.list({ limit: 10 });
      expect(events.length).toBe(0);
    });

    it('wipe() resets stats', async () => {
      await store.append(createMockEvent(1));
      await store.append(createMockEvent(2));

      let stats = await store.stats();
      expect(stats.eventCount).toBe(2);

      await store.wipe();

      stats = await store.stats();
      expect(stats.eventCount).toBe(0);
    });
  });

  describe('Adapter interface contract', () => {
    it('adapter.append adds single event', async () => {
      const event = createMockEvent(1);
      await adapter.append(event);

      const events = await adapter.list({ limit: 10 });
      expect(events.length).toBe(1);
    });

    it('adapter.appendBatch adds multiple events atomically', async () => {
      const events = [createMockEvent(1), createMockEvent(2), createMockEvent(3)];
      await adapter.appendBatch(events);

      const stored = await adapter.list({ limit: 10 });
      expect(stored.length).toBe(3);
    });

    it('adapter.wipe clears all events', async () => {
      await adapter.append(createMockEvent(1));
      await adapter.wipe();

      const events = await adapter.list({ limit: 10 });
      expect(events.length).toBe(0);
    });

    it('adapter.count returns accurate count', async () => {
      await adapter.append(createMockEvent(1));
      await adapter.append(createMockEvent(2));

      const count = await adapter.count();
      expect(count).toBe(2);
    });

    it('adapter.pruneOlderThan removes old events', async () => {
      const now = Date.now();
      await adapter.append(createMockEvent(1, now - 10000)); // 10s ago
      await adapter.append(createMockEvent(2, now - 5000)); // 5s ago
      await adapter.append(createMockEvent(3, now)); // now

      await adapter.pruneOlderThan(now - 7000); // Prune older than 7s ago

      const events = await adapter.list({ limit: 10 });
      expect(events.length).toBe(2);
      expect(events.map((e) => e.id)).toContain('event-2');
      expect(events.map((e) => e.id)).toContain('event-3');
    });

    it('adapter.pruneToMaxCount keeps only N newest events', async () => {
      const now = Date.now();
      for (let i = 1; i <= 10; i++) {
        await adapter.append(createMockEvent(i, now - (10 - i) * 1000));
      }

      await adapter.pruneToMaxCount(5);

      const events = await adapter.list({ limit: 10 });
      expect(events.length).toBe(5);
      // Should keep newest 5: events 6-10
      const ids = events.map((e) => e.id);
      expect(ids).toContain('event-10');
      expect(ids).toContain('event-9');
      expect(ids).toContain('event-8');
      expect(ids).toContain('event-7');
      expect(ids).toContain('event-6');
    });
  });

  describe('Graceful degradation', () => {
    it('store continues working if adapter throws on append', async () => {
      const failingAdapter = createMemoryAdapter();
      const originalAppend = failingAdapter.append.bind(failingAdapter);
      let callCount = 0;
      failingAdapter.append = async (event: StoredTraceEvent) => {
        callCount++;
        if (callCount === 2) throw new Error('Simulated failure');
        return originalAppend(event);
      };

      const failStore = createTelemetryStore(failingAdapter, defaultConfig);

      await failStore.append(createMockEvent(1)); // success
      await failStore.append(createMockEvent(2)); // fails (swallowed)
      await failStore.append(createMockEvent(3)); // success

      const events = await failStore.list({ limit: 10 });
      // Should have 1 and 3, but not 2
      expect(events.length).toBe(2);
      expect(events.map((e) => e.id)).toContain('event-1');
      expect(events.map((e) => e.id)).toContain('event-3');
    });

    it('list() returns empty array if adapter throws', async () => {
      const failingAdapter = createMemoryAdapter();
      failingAdapter.list = async () => {
        throw new Error('Simulated read failure');
      };

      const failStore = createTelemetryStore(failingAdapter, defaultConfig);
      const events = await failStore.list({ limit: 10 });

      expect(events).toEqual([]);
    });
  });
});

describe('Telemetry Sink (Batched Writes)', () => {
  let adapter: TelemetryStorageAdapter;
  let store: TelemetryStore;
  let sink: TelemetrySink;

  const defaultStoreConfig: TelemetryStoreConfig = {
    maxEvents: 5000,
    maxAgeDays: 7,
  };

  const defaultSinkConfig: TelemetrySinkConfig = {
    batchSize: 5,
    flushIntervalMs: 100,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    adapter = createMemoryAdapter();
    store = createTelemetryStore(adapter, defaultStoreConfig);
    sink = createTelemetrySink(store, defaultSinkConfig);
  });

  afterEach(() => {
    sink.stop();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Batching behavior', () => {
    it('buffers events until batchSize reached', async () => {
      // Add 4 events (under batch size of 5)
      for (let i = 1; i <= 4; i++) {
        sink.ingest(createMockTraceEvent(i));
      }

      // Should not be written yet (buffered)
      const events = await store.list({ limit: 10 });
      expect(events.length).toBe(0);
    });

    it('flushes when batchSize is reached', async () => {
      // Add 5 events (equals batch size)
      for (let i = 1; i <= 5; i++) {
        sink.ingest(createMockTraceEvent(i));
      }

      // Flush should trigger synchronously when batch size reached
      await sink.flush();

      const events = await store.list({ limit: 10 });
      expect(events.length).toBe(5);
    });

    it('flushes on timer when under batchSize', async () => {
      // Add 3 events (under batch size)
      for (let i = 1; i <= 3; i++) {
        sink.ingest(createMockTraceEvent(i));
      }

      // First, verify events are buffered
      const bufferedStats = sink.stats();
      expect(bufferedStats.bufferedCount).toBe(3);

      // Advance timer past flush interval
      vi.advanceTimersByTime(150);

      // Stop sink to ensure all flushes complete (clears timer)
      await sink.stop();

      const events = await store.list({ limit: 10 });
      expect(events.length).toBe(3);
    });

    it('flush() writes all buffered events immediately', async () => {
      sink.ingest(createMockTraceEvent(1));
      sink.ingest(createMockTraceEvent(2));

      await sink.flush();

      const events = await store.list({ limit: 10 });
      expect(events.length).toBe(2);
    });

    it('stop() flushes remaining events', async () => {
      sink.ingest(createMockTraceEvent(1));
      sink.ingest(createMockTraceEvent(2));

      await sink.stop();

      const events = await store.list({ limit: 10 });
      expect(events.length).toBe(2);
    });
  });

  describe('Event transformation', () => {
    it('assigns unique IDs to ingested events', async () => {
      sink.ingest(createMockTraceEvent(1));
      sink.ingest(createMockTraceEvent(1)); // Same input

      await sink.flush();

      const events = await store.list({ limit: 10 });
      expect(events.length).toBe(2);
      expect(events[0].id).not.toBe(events[1].id); // Unique IDs
    });

    it('preserves event payload and type', async () => {
      const traceEvent = createMockTraceEvent(42);
      sink.ingest(traceEvent);
      await sink.flush();

      const events = await store.list({ limit: 10 });
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('os_action_invoked');
      expect(events[0].payload.actionId).toBe('action-42');
    });
  });

  describe('Stats', () => {
    it('tracks ingested count', async () => {
      sink.ingest(createMockTraceEvent(1));
      sink.ingest(createMockTraceEvent(2));
      sink.ingest(createMockTraceEvent(3));

      const stats = sink.stats();
      expect(stats.ingestedCount).toBe(3);
    });

    it('tracks flushed count after flush', async () => {
      sink.ingest(createMockTraceEvent(1));
      sink.ingest(createMockTraceEvent(2));
      await sink.flush();

      const stats = sink.stats();
      expect(stats.flushedCount).toBe(2);
    });

    it('tracks buffered count', async () => {
      sink.ingest(createMockTraceEvent(1));
      sink.ingest(createMockTraceEvent(2));

      const stats = sink.stats();
      expect(stats.bufferedCount).toBe(2);

      await sink.flush();

      const statsAfter = sink.stats();
      expect(statsAfter.bufferedCount).toBe(0);
    });
  });
});
