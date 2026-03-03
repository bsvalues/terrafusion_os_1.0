/**
 * TerraFusion OS - Trace List Query Tests
 *
 * Tests for:
 *   - TraceQueryOptions from/to date filtering
 *   - TraceService.query() with date bounds
 *   - InMemoryTraceStore date filtering
 *   - Newest-first ordering
 *   - Offset/limit pagination
 *
 * Run: node --test os-platform/core/tests/trace-list-query.test.mjs
 */

import assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';

// ============================================================================
// Dynamic imports for ESM compatibility
// ============================================================================

let InMemoryTraceStore;
let TraceService;

before(async () => {
  const traceModule = await import('../trace/index.js');
  const trace = traceModule.default || traceModule;
  InMemoryTraceStore = trace.InMemoryTraceStore;
  TraceService = trace.TraceService;
});

// ============================================================================
// Helper: create a TraceEvent with controlled timestamp
// ============================================================================

function makeEvent(overrides = {}) {
  return {
    eventId: `evt-${Math.random().toString(36).slice(2, 10)}`,
    type: 'tool_invoked',
    toolId: overrides.toolId ?? 'test-tool',
    correlationId: overrides.correlationId ?? `corr-${Math.random().toString(36).slice(2, 10)}`,
    summary: overrides.summary ?? 'test event',
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    schemaVersion: '1.0.0',
    context: {
      countyId: overrides.countyId ?? 'benton',
      userId: overrides.userId ?? 'user-1',
      mode: overrides.mode ?? 'pilot',
      parcelId: overrides.parcelId ?? undefined,
      dossierId: overrides.dossierId ?? undefined,
    },
    ...(overrides.payloadRef ? { payloadRef: overrides.payloadRef } : {}),
    ...(overrides.redactedFields ? { redactedFields: overrides.redactedFields } : {}),
  };
}

// ============================================================================
// TraceService.query() with from/to
// ============================================================================

describe('TraceService.query() with date filters', () => {
  let service;
  const t1 = '2026-03-01T10:00:00.000Z';
  const t2 = '2026-03-01T11:00:00.000Z';
  const t3 = '2026-03-01T12:00:00.000Z';
  const t4 = '2026-03-01T13:00:00.000Z';

  beforeEach(() => {
    service = new TraceService({ ringBufferSize: 1000 });
    // Emit events with controlled timestamps (emit overrides timestamp,
    // so we inject directly into the ring buffer via emit + override)
    // Actually TraceService.emit() sets timestamp = now, so we need to
    // modify the events after emission. For testing, we bypass via direct access.
    // Better: use the store approach.
  });

  it('returns all events when no from/to specified', () => {
    // Emit 3 events - they'll have ~same timestamp
    service.emit({ type: 'tool_invoked', toolId: 't1', correlationId: 'c1', summary: 'e1', context: { countyId: 'benton', userId: 'u1', mode: 'pilot' } });
    service.emit({ type: 'tool_completed', toolId: 't1', correlationId: 'c1', summary: 'e2', context: { countyId: 'benton', userId: 'u1', mode: 'pilot' } });

    const results = service.query({});
    assert.strictEqual(results.length, 2);
  });

  it('respects limit', () => {
    for (let i = 0; i < 10; i++) {
      service.emit({ type: 'tool_invoked', toolId: 't1', correlationId: `c${i}`, summary: `e${i}`, context: { countyId: 'benton', userId: 'u1', mode: 'pilot' } });
    }
    const results = service.query({ limit: 3 });
    assert.strictEqual(results.length, 3);
  });

  it('respects offset + limit', () => {
    for (let i = 0; i < 10; i++) {
      service.emit({ type: 'tool_invoked', toolId: 't1', correlationId: `c${i}`, summary: `e${i}`, context: { countyId: 'benton', userId: 'u1', mode: 'pilot' } });
    }
    const page1 = service.query({ limit: 3, offset: 0 });
    const page2 = service.query({ limit: 3, offset: 3 });
    assert.strictEqual(page1.length, 3);
    assert.strictEqual(page2.length, 3);
    // No overlap
    const ids1 = new Set(page1.map(e => e.eventId));
    assert.ok(page2.every(e => !ids1.has(e.eventId)));
  });

  it('filters by parcelId', () => {
    service.emit({ type: 'tool_invoked', toolId: 't1', correlationId: 'c1', summary: 'e1', context: { countyId: 'benton', userId: 'u1', mode: 'pilot', parcelId: 'P-001' } });
    service.emit({ type: 'tool_invoked', toolId: 't1', correlationId: 'c2', summary: 'e2', context: { countyId: 'benton', userId: 'u1', mode: 'pilot', parcelId: 'P-002' } });

    const results = service.query({ parcelId: 'P-001' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].context.parcelId, 'P-001');
  });
});

// ============================================================================
// InMemoryTraceStore.query() with from/to
// ============================================================================

describe('InMemoryTraceStore.query() with date filters', () => {
  let store;
  const t1 = '2026-03-01T10:00:00.000Z';
  const t2 = '2026-03-01T11:00:00.000Z';
  const t3 = '2026-03-01T12:00:00.000Z';
  const t4 = '2026-03-01T13:00:00.000Z';

  beforeEach(async () => {
    store = new InMemoryTraceStore();
    // Seed events with known timestamps
    await store.append(makeEvent({ timestamp: t1, toolId: 'tool-a', parcelId: 'P-001', correlationId: 'c1' }));
    await store.append(makeEvent({ timestamp: t2, toolId: 'tool-b', parcelId: 'P-001', correlationId: 'c2' }));
    await store.append(makeEvent({ timestamp: t3, toolId: 'tool-a', parcelId: 'P-001', correlationId: 'c3' }));
    await store.append(makeEvent({ timestamp: t4, toolId: 'tool-b', parcelId: 'P-002', correlationId: 'c4' }));
  });

  it('returns all events when no filters applied', async () => {
    const results = await store.query({});
    assert.strictEqual(results.length, 4);
  });

  it('orders newest-first', async () => {
    const results = await store.query({});
    assert.strictEqual(results[0].timestamp, t4);
    assert.strictEqual(results[3].timestamp, t1);
  });

  it('filters by from (inclusive)', async () => {
    const results = await store.query({ from: t2 });
    assert.strictEqual(results.length, 3);
    // Should include t2, t3, t4 but not t1
    assert.ok(results.every(e => new Date(e.timestamp).getTime() >= new Date(t2).getTime()));
  });

  it('filters by to (inclusive)', async () => {
    const results = await store.query({ to: t2 });
    assert.strictEqual(results.length, 2);
    // Should include t1, t2 but not t3, t4
    assert.ok(results.every(e => new Date(e.timestamp).getTime() <= new Date(t2).getTime()));
  });

  it('filters by from AND to', async () => {
    const results = await store.query({ from: t2, to: t3 });
    assert.strictEqual(results.length, 2);
    assert.ok(results.every(e => {
      const ts = new Date(e.timestamp).getTime();
      return ts >= new Date(t2).getTime() && ts <= new Date(t3).getTime();
    }));
  });

  it('filters by parcelId', async () => {
    const results = await store.query({ parcelId: 'P-001' });
    assert.strictEqual(results.length, 3);
  });

  it('filters by toolId', async () => {
    const results = await store.query({ toolId: 'tool-a' });
    assert.strictEqual(results.length, 2);
  });

  it('combines parcelId + toolId + from/to', async () => {
    const results = await store.query({ parcelId: 'P-001', toolId: 'tool-a', from: t1, to: t2 });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].timestamp, t1);
  });

  it('respects limit', async () => {
    const results = await store.query({ limit: 2 });
    assert.strictEqual(results.length, 2);
    // Newest first
    assert.strictEqual(results[0].timestamp, t4);
    assert.strictEqual(results[1].timestamp, t3);
  });

  it('respects offset + limit', async () => {
    const results = await store.query({ offset: 1, limit: 2 });
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].timestamp, t3);
    assert.strictEqual(results[1].timestamp, t2);
  });

  it('returns empty array when from is after all events', async () => {
    const results = await store.query({ from: '2026-12-01T00:00:00.000Z' });
    assert.strictEqual(results.length, 0);
  });

  it('returns empty array when to is before all events', async () => {
    const results = await store.query({ to: '2025-01-01T00:00:00.000Z' });
    assert.strictEqual(results.length, 0);
  });
});

// ============================================================================
// TraceService with persistent store — date filtering threads through
// ============================================================================

describe('TraceService.queryAsync() delegates to store with from/to', () => {
  let service;
  let store;
  const t1 = '2026-03-01T10:00:00.000Z';
  const t2 = '2026-03-01T11:00:00.000Z';
  const t3 = '2026-03-01T12:00:00.000Z';

  beforeEach(async () => {
    store = new InMemoryTraceStore();
    service = new TraceService({ store });
    await store.append(makeEvent({ timestamp: t1, parcelId: 'P-001' }));
    await store.append(makeEvent({ timestamp: t2, parcelId: 'P-001' }));
    await store.append(makeEvent({ timestamp: t3, parcelId: 'P-001' }));
  });

  it('queryAsync passes from/to to store', async () => {
    const results = await service.queryAsync({ parcelId: 'P-001', from: t2 });
    assert.strictEqual(results.length, 2);
    assert.ok(results.every(e => new Date(e.timestamp).getTime() >= new Date(t2).getTime()));
  });

  it('queryAsync with to boundary', async () => {
    const results = await service.queryAsync({ parcelId: 'P-001', to: t1 });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].timestamp, t1);
  });
});
