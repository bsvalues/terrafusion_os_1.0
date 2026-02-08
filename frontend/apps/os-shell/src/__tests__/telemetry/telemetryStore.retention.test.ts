/**
 * Telemetry Store Retention Tests
 *
 * TDD tests for telemetry store retention policies:
 * - Count-based capping
 * - Age-based expiration
 * - Newest-first ordering preservation
 *
 * @module __tests__/telemetry/telemetryStore.retention.test
 * @see Slice 20: Persisted Telemetry Backend
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    timestamp: timestamp ?? Date.now() - id * 1000, // Older events have earlier timestamps
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

// ============================================================================
// Tests
// ============================================================================

describe('Telemetry Store Retention', () => {
  let adapter: TelemetryStorageAdapter;
  let store: TelemetryStore;

  beforeEach(() => {
    adapter = createMemoryAdapter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Count-based capping', () => {
    it('caps by count when maxEvents is reached', async () => {
      const config: TelemetryStoreConfig = {
        maxEvents: 5,
        maxAgeDays: 30,
      };
      store = createTelemetryStore(adapter, config);

      // Add 10 events
      for (let i = 0; i < 10; i++) {
        await store.append(createMockEvent(i));
      }

      const events = await store.list({ limit: 100 });

      // Should only have 5 events (most recent)
      expect(events.length).toBe(5);
    });

    it('keeps newest events when capping by count', async () => {
      const config: TelemetryStoreConfig = {
        maxEvents: 3,
        maxAgeDays: 30,
      };
      store = createTelemetryStore(adapter, config);

      const now = Date.now();
      await store.append(createMockEvent(1, now - 3000)); // oldest
      await store.append(createMockEvent(2, now - 2000));
      await store.append(createMockEvent(3, now - 1000));
      await store.append(createMockEvent(4, now)); // newest

      const events = await store.list({ limit: 100 });

      // Should have events 2, 3, 4 (newest 3)
      expect(events.length).toBe(3);
      expect(events.map((e) => e.id)).toContain('event-4');
      expect(events.map((e) => e.id)).toContain('event-3');
      expect(events.map((e) => e.id)).toContain('event-2');
      expect(events.map((e) => e.id)).not.toContain('event-1');
    });

    it('does not cap when under maxEvents', async () => {
      const config: TelemetryStoreConfig = {
        maxEvents: 100,
        maxAgeDays: 30,
      };
      store = createTelemetryStore(adapter, config);

      for (let i = 0; i < 50; i++) {
        await store.append(createMockEvent(i));
      }

      const events = await store.list({ limit: 100 });
      expect(events.length).toBe(50);
    });
  });

  describe('Age-based expiration', () => {
    it('expires events older than maxAgeDays', async () => {
      const config: TelemetryStoreConfig = {
        maxEvents: 1000,
        maxAgeDays: 7,
      };
      store = createTelemetryStore(adapter, config);

      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;

      // Add events with different ages
      await store.append(createMockEvent(1, now)); // current - keep
      await store.append(createMockEvent(2, sevenDaysAgo + 1000)); // just under 7 days - keep
      await store.append(createMockEvent(3, eightDaysAgo)); // over 7 days - expire

      const events = await store.list({ limit: 100 });

      expect(events.length).toBe(2);
      expect(events.map((e) => e.id)).toContain('event-1');
      expect(events.map((e) => e.id)).toContain('event-2');
      expect(events.map((e) => e.id)).not.toContain('event-3');
    });

    it('respects maxAgeDays=0 as no age limit', async () => {
      const config: TelemetryStoreConfig = {
        maxEvents: 1000,
        maxAgeDays: 0, // No age limit
      };
      store = createTelemetryStore(adapter, config);

      const oldTimestamp = Date.now() - 365 * 24 * 60 * 60 * 1000; // 1 year ago
      await store.append(createMockEvent(1, oldTimestamp));
      await store.append(createMockEvent(2, Date.now()));

      const events = await store.list({ limit: 100 });
      expect(events.length).toBe(2);
    });
  });

  describe('Ordering preservation', () => {
    it('preserves newest-first ordering in list()', async () => {
      const config: TelemetryStoreConfig = {
        maxEvents: 100,
        maxAgeDays: 30,
      };
      store = createTelemetryStore(adapter, config);

      const now = Date.now();
      await store.append(createMockEvent(1, now - 3000)); // 3 seconds ago
      await store.append(createMockEvent(2, now - 1000)); // 1 second ago
      await store.append(createMockEvent(3, now)); // now

      const events = await store.list({ limit: 100 });

      expect(events.length).toBe(3);
      expect(events[0].id).toBe('event-3'); // newest first
      expect(events[1].id).toBe('event-2');
      expect(events[2].id).toBe('event-1'); // oldest last
    });

    it('maintains ordering after cap enforcement', async () => {
      const config: TelemetryStoreConfig = {
        maxEvents: 3,
        maxAgeDays: 30,
      };
      store = createTelemetryStore(adapter, config);

      const now = Date.now();
      for (let i = 1; i <= 5; i++) {
        await store.append(createMockEvent(i, now - (5 - i) * 1000));
      }

      const events = await store.list({ limit: 100 });

      expect(events.length).toBe(3);
      // Should be newest first: 5, 4, 3
      expect(events[0].id).toBe('event-5');
      expect(events[1].id).toBe('event-4');
      expect(events[2].id).toBe('event-3');
    });

    it('respects limit parameter in list()', async () => {
      const config: TelemetryStoreConfig = {
        maxEvents: 100,
        maxAgeDays: 30,
      };
      store = createTelemetryStore(adapter, config);

      for (let i = 0; i < 20; i++) {
        await store.append(createMockEvent(i));
      }

      const events = await store.list({ limit: 5 });
      expect(events.length).toBe(5);
    });
  });

  describe('Stats', () => {
    it('returns accurate event count', async () => {
      const config: TelemetryStoreConfig = {
        maxEvents: 100,
        maxAgeDays: 30,
      };
      store = createTelemetryStore(adapter, config);

      await store.append(createMockEvent(1));
      await store.append(createMockEvent(2));
      await store.append(createMockEvent(3));

      const stats = await store.stats();
      expect(stats.eventCount).toBe(3);
    });

    it('updates count after cap enforcement', async () => {
      const config: TelemetryStoreConfig = {
        maxEvents: 3,
        maxAgeDays: 30,
      };
      store = createTelemetryStore(adapter, config);

      for (let i = 0; i < 10; i++) {
        await store.append(createMockEvent(i));
      }

      const stats = await store.stats();
      expect(stats.eventCount).toBe(3);
    });
  });
});
