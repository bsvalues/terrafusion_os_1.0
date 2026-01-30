/**
 * TerraFusion OS - PostgresTraceStore Tests
 * Phase 8.1: Append-only trace persistence
 *
 * TESTS:
 *   1. Append events (immutable, no updates)
 *   2. Query by county + time window
 *   3. Get by correlation ID with county isolation
 *   4. Count by county
 *   5. Health check
 *
 * Run (InMemory): node --test os-platform/core/tests/postgres-trace-store.test.mjs
 * Run (Postgres): DATABASE_URL=... node --test os-platform/core/tests/postgres-trace-store.test.mjs
 */

import assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';

// ============================================================================
// Dynamic imports for ESM compatibility
// ============================================================================

let InMemoryTraceStore;
let PostgresTraceStore;

before(async () => {
  const traceModule = await import('../trace/TraceStore.js');
  InMemoryTraceStore = traceModule.InMemoryTraceStore;
  PostgresTraceStore = traceModule.PostgresTraceStore;
});

// ============================================================================
// Test Fixtures
// ============================================================================

function createEvent(countyId, toolId = 'test_tool', correlationId = 'corr-123') {
  const id = Math.random().toString(36).slice(2, 10);
  return {
    eventId: `evt-${id}`,
    correlationId,
    toolId,
    type: 'tool_invoked',
    summary: `Test event ${id}`,
    context: {
      countyId,
      userId: `user-${countyId}`,
      roles: ['appraiser'],
      mode: 'live',
    },
    payloadRef: null,
    payloadStore: 'inline',
    redactedFields: null,
    schemaVersion: 1,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// InMemoryTraceStore Tests (baseline behavior)
// ============================================================================

describe('InMemoryTraceStore', () => {
  let store;

  beforeEach(() => {
    store = new InMemoryTraceStore({ maxEvents: 1000 });
  });

  it('appends and retrieves events', async () => {
    const event = createEvent('benton');
    const stored = await store.append(event);

    assert.strictEqual(stored.eventId, event.eventId);

    const retrieved = await store.getById(event.eventId);
    assert.ok(retrieved);
    assert.strictEqual(retrieved.eventId, event.eventId);
  });

  it('queries by toolId', async () => {
    await store.append(createEvent('benton', 'tool_a'));
    await store.append(createEvent('benton', 'tool_b'));
    await store.append(createEvent('benton', 'tool_a'));

    const results = await store.query({ toolId: 'tool_a' });
    assert.strictEqual(results.length, 2);
    assert.ok(results.every(e => e.toolId === 'tool_a'));
  });

  it('queries by correlationId', async () => {
    await store.append(createEvent('benton', 'tool_a', 'corr-abc'));
    await store.append(createEvent('benton', 'tool_a', 'corr-xyz'));
    await store.append(createEvent('benton', 'tool_b', 'corr-abc'));

    const results = await store.query({ correlationId: 'corr-abc' });
    assert.strictEqual(results.length, 2);
    assert.ok(results.every(e => e.correlationId === 'corr-abc'));
  });

  it('gets by correlationId with county isolation', async () => {
    await store.append(createEvent('benton', 'tool_a', 'shared-corr'));
    await store.append(createEvent('yakima', 'tool_a', 'shared-corr'));

    const bentonResults = await store.getByCorrelationId('shared-corr', 'benton');
    assert.strictEqual(bentonResults.length, 1);
    assert.strictEqual(bentonResults[0].context.countyId, 'benton');

    const allResults = await store.getByCorrelationId('shared-corr');
    assert.strictEqual(allResults.length, 2);
  });

  it('counts by county', async () => {
    await store.append(createEvent('benton'));
    await store.append(createEvent('benton'));
    await store.append(createEvent('yakima'));

    const bentonCount = await store.count('benton');
    assert.strictEqual(bentonCount, 2);

    const totalCount = await store.count();
    assert.strictEqual(totalCount, 3);
  });

  it('queryByCountyAndWindow filters by time', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Old event
    const oldEvent = createEvent('benton');
    oldEvent.timestamp = twoHoursAgo.toISOString();
    await store.append(oldEvent);

    // Recent event
    const recentEvent = createEvent('benton');
    recentEvent.timestamp = now.toISOString();
    await store.append(recentEvent);

    const results = await store.queryByCountyAndWindow('benton', oneHourAgo);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].eventId, recentEvent.eventId);
  });

  it('respects maxEvents capacity', async () => {
    const smallStore = new InMemoryTraceStore({ maxEvents: 3 });

    await smallStore.append(createEvent('benton'));
    await smallStore.append(createEvent('benton'));
    await smallStore.append(createEvent('benton'));
    await smallStore.append(createEvent('benton'));
    await smallStore.append(createEvent('benton'));

    const count = await smallStore.count();
    assert.strictEqual(count, 3);
  });

  it('healthy returns true', async () => {
    const healthy = await store.healthy();
    assert.strictEqual(healthy, true);
  });

  it('returns events sorted newest first in query', async () => {
    const event1 = createEvent('benton');
    event1.timestamp = new Date(2024, 0, 1).toISOString();

    const event2 = createEvent('benton');
    event2.timestamp = new Date(2024, 0, 2).toISOString();

    const event3 = createEvent('benton');
    event3.timestamp = new Date(2024, 0, 3).toISOString();

    await store.append(event1);
    await store.append(event2);
    await store.append(event3);

    const results = await store.query({});
    assert.strictEqual(results[0].eventId, event3.eventId); // newest first
    assert.strictEqual(results[2].eventId, event1.eventId); // oldest last
  });

  it('applies pagination correctly', async () => {
    for (let i = 0; i < 10; i++) {
      await store.append(createEvent('benton'));
    }

    const page1 = await store.query({ limit: 3, offset: 0 });
    assert.strictEqual(page1.length, 3);

    const page2 = await store.query({ limit: 3, offset: 3 });
    assert.strictEqual(page2.length, 3);

    // Ensure no duplicates between pages
    const page1Ids = new Set(page1.map(e => e.eventId));
    const page2Ids = new Set(page2.map(e => e.eventId));
    for (const id of page2Ids) {
      assert.ok(!page1Ids.has(id), 'Pages should not overlap');
    }
  });
});

// ============================================================================
// PostgresTraceStore Tests (requires DATABASE_URL env var)
// ============================================================================

describe('PostgresTraceStore', { skip: !process.env.DATABASE_URL }, () => {
  let store;

  before(async () => {
    store = new PostgresTraceStore({
      connectionString: process.env.DATABASE_URL,
    });
  });

  after(async () => {
    if (store?.close) {
      await store.close();
    }
  });

  it('healthy returns true when connected', async () => {
    const healthy = await store.healthy();
    assert.strictEqual(healthy, true, 'PostgresTraceStore should be healthy');
  });

  it('appends and retrieves events', async () => {
    const event = createEvent('test-county-' + Date.now());
    const stored = await store.append(event);

    assert.strictEqual(stored.eventId, event.eventId);

    const retrieved = await store.getById(event.eventId);
    assert.ok(retrieved, 'Should retrieve appended event');
    assert.strictEqual(retrieved.eventId, event.eventId);
    assert.strictEqual(retrieved.context.countyId, event.context.countyId);
  });

  it('queries by county and time window', async () => {
    const countyId = 'test-county-window-' + Date.now();
    const now = new Date();

    // Append test events
    await store.append(createEvent(countyId));
    await store.append(createEvent(countyId));

    const results = await store.queryByCountyAndWindow(
      countyId,
      new Date(now.getTime() - 60 * 1000), // 1 minute ago
      100
    );

    assert.ok(results.length >= 2, 'Should find recent events');
    assert.ok(results.every(e => e.context.countyId === countyId));
  });

  it('isolates by correlationId and county', async () => {
    const correlationId = 'corr-pg-' + Date.now();
    const county1 = 'county-a-' + Date.now();
    const county2 = 'county-b-' + Date.now();

    await store.append(createEvent(county1, 'tool_x', correlationId));
    await store.append(createEvent(county2, 'tool_x', correlationId));

    const county1Results = await store.getByCorrelationId(correlationId, county1);
    assert.strictEqual(county1Results.length, 1);
    assert.strictEqual(county1Results[0].context.countyId, county1);

    const allResults = await store.getByCorrelationId(correlationId);
    assert.strictEqual(allResults.length, 2);
  });

  it('counts by county', async () => {
    const countyId = 'count-test-' + Date.now();

    await store.append(createEvent(countyId));
    await store.append(createEvent(countyId));
    await store.append(createEvent(countyId));

    const count = await store.count(countyId);
    assert.strictEqual(count, 3);
  });
});
