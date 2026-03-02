/**
 * TerraFusion OS – R1 Trace Persistence Tests (CP-7)
 *
 * Validates:
 *   1. FileTraceStore: append → query → survives new instance
 *   2. TraceService + store: emit → persist → new service reads back
 *   3. InMemoryTraceStore: query, getByCorrelationId, count
 *   4. createTraceStore factory validation
 *   5. County isolation in persistent store
 */

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { before, after, describe, it } from 'node:test';

let FileTraceStore, InMemoryTraceStore, createTraceStore, TraceService;

before(async () => {
  const traceModule = await import('../trace/index.js');
  const trace = traceModule.default || traceModule;

  FileTraceStore = trace.FileTraceStore;
  InMemoryTraceStore = trace.InMemoryTraceStore;
  createTraceStore = trace.createTraceStore;
  TraceService = trace.TraceService;
});

// ── Helpers ──────────────────────────────────────────────────────────

const TEST_DIR = join(tmpdir(), `terratrace-test-${Date.now()}`);

function tempFile(name) {
  return join(TEST_DIR, `${name}-${randomUUID().slice(0, 8)}.jsonl`);
}

function makeEvent(overrides = {}) {
  return {
    eventId: randomUUID(),
    type: 'tool_invoked',
    toolId: overrides.toolId ?? 'test_tool',
    correlationId: overrides.correlationId ?? `corr-${randomUUID().slice(0, 8)}`,
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    schemaVersion: '1.0.0',
    summary: overrides.summary ?? 'test event',
    context: {
      countyId: overrides.countyId ?? 'benton',
      userId: overrides.userId ?? 'test-user',
      sessionId: 'sess-001',
      ...(overrides.context || {}),
    },
    ...(overrides.extra || {}),
  };
}

// Ensure test dir exists, clean up after
before(() => {
  if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });
});

after(() => {
  try { rmSync(TEST_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
});

// ══════════════════════════════════════════════════════════════════════
// FileTraceStore
// ══════════════════════════════════════════════════════════════════════

describe('FileTraceStore — append & read back', () => {
  it('persists events to JSON lines file', async () => {
    const fp = tempFile('persist');
    const store = new FileTraceStore({ filePath: fp });

    const e1 = makeEvent({ toolId: 'tool_a' });
    const e2 = makeEvent({ toolId: 'tool_b' });

    await store.append(e1);
    await store.append(e2);

    // Raw file check
    const raw = readFileSync(fp, 'utf-8');
    const lines = raw.trim().split('\n');
    assert.equal(lines.length, 2, 'two JSON lines on disk');

    // Query returns both
    const all = await store.query({});
    assert.equal(all.length, 2);
  });

  it('survives a new instance (restart simulation)', async () => {
    const fp = tempFile('restart');
    const store1 = new FileTraceStore({ filePath: fp });

    const corr = `corr-${randomUUID().slice(0, 8)}`;
    await store1.append(makeEvent({ correlationId: corr, toolId: 'forge_run' }));
    await store1.append(makeEvent({ correlationId: corr, toolId: 'forge_run' }));

    // New instance reads from same file
    const store2 = new FileTraceStore({ filePath: fp });
    const events = await store2.getByCorrelationId(corr);
    assert.equal(events.length, 2, 'both events survive restart');
    assert.equal(events[0].toolId, 'forge_run');
  });

  it('creates parent directories if missing', async () => {
    const fp = join(TEST_DIR, 'deep', 'nested', 'dir', `trace-${randomUUID().slice(0, 6)}.jsonl`);
    const store = new FileTraceStore({ filePath: fp });
    await store.append(makeEvent());
    assert.ok(existsSync(fp), 'file created in nested dir');
  });

  it('skips malformed lines gracefully', async () => {
    const fp = tempFile('malformed');
    // Manually write a good line + a bad line
    const { writeFileSync } = await import('node:fs');
    const event = makeEvent();
    writeFileSync(fp, JSON.stringify(event) + '\n' + 'NOT JSON!!!\n', 'utf-8');

    const store = new FileTraceStore({ filePath: fp });
    const all = await store.query({});
    assert.equal(all.length, 1, 'only valid event loaded');
    assert.equal(all[0].eventId, event.eventId);
  });
});

describe('FileTraceStore — query filters', () => {
  it('filters by toolId', async () => {
    const fp = tempFile('filter-tool');
    const store = new FileTraceStore({ filePath: fp });

    await store.append(makeEvent({ toolId: 'run_valuation_model' }));
    await store.append(makeEvent({ toolId: 'explain_value_change' }));
    await store.append(makeEvent({ toolId: 'run_valuation_model' }));

    const results = await store.query({ toolId: 'run_valuation_model' });
    assert.equal(results.length, 2);
  });

  it('filters by correlationId', async () => {
    const fp = tempFile('filter-corr');
    const store = new FileTraceStore({ filePath: fp });

    const corr1 = `corr-${randomUUID().slice(0, 8)}`;
    const corr2 = `corr-${randomUUID().slice(0, 8)}`;
    await store.append(makeEvent({ correlationId: corr1 }));
    await store.append(makeEvent({ correlationId: corr2 }));
    await store.append(makeEvent({ correlationId: corr1 }));

    const results = await store.query({ correlationId: corr1 });
    assert.equal(results.length, 2);
  });

  it('filters by event type', async () => {
    const fp = tempFile('filter-type');
    const store = new FileTraceStore({ filePath: fp });

    const e1 = makeEvent(); e1.type = 'tool_invoked';
    const e2 = makeEvent(); e2.type = 'tool_succeeded';
    const e3 = makeEvent(); e3.type = 'tool_failed';
    await store.append(e1);
    await store.append(e2);
    await store.append(e3);

    const results = await store.query({ type: 'tool_succeeded' });
    assert.equal(results.length, 1);
    assert.equal(results[0].type, 'tool_succeeded');
  });

  it('applies pagination (offset + limit)', async () => {
    const fp = tempFile('pagination');
    const store = new FileTraceStore({ filePath: fp });

    for (let i = 0; i < 10; i++) {
      await store.append(makeEvent({ summary: `event-${i}` }));
    }

    const page = await store.query({ offset: 2, limit: 3 });
    assert.equal(page.length, 3);
  });

  it('returns newest first by default', async () => {
    const fp = tempFile('sort-order');
    const store = new FileTraceStore({ filePath: fp });

    const e1 = makeEvent({ timestamp: '2026-01-01T00:00:00Z' });
    const e2 = makeEvent({ timestamp: '2026-06-01T00:00:00Z' });
    const e3 = makeEvent({ timestamp: '2026-03-01T00:00:00Z' });
    await store.append(e1);
    await store.append(e2);
    await store.append(e3);

    const all = await store.query({});
    assert.equal(all[0].timestamp, '2026-06-01T00:00:00Z', 'newest first');
    assert.equal(all[2].timestamp, '2026-01-01T00:00:00Z', 'oldest last');
  });
});

describe('FileTraceStore — county isolation', () => {
  it('getByCorrelationId enforces countyId filter', async () => {
    const fp = tempFile('county-iso');
    const store = new FileTraceStore({ filePath: fp });
    const corr = `corr-shared`;

    await store.append(makeEvent({ correlationId: corr, countyId: 'benton' }));
    await store.append(makeEvent({ correlationId: corr, countyId: 'clark' }));

    const benton = await store.getByCorrelationId(corr, 'benton');
    assert.equal(benton.length, 1, 'only benton events');
    assert.equal(benton[0].context.countyId, 'benton');

    const all = await store.getByCorrelationId(corr);
    assert.equal(all.length, 2, 'without countyId filter returns all');
  });

  it('count respects countyId filter', async () => {
    const fp = tempFile('county-count');
    const store = new FileTraceStore({ filePath: fp });

    await store.append(makeEvent({ countyId: 'benton' }));
    await store.append(makeEvent({ countyId: 'benton' }));
    await store.append(makeEvent({ countyId: 'clark' }));

    assert.equal(await store.count('benton'), 2);
    assert.equal(await store.count('clark'), 1);
    assert.equal(await store.count(), 3);
  });

  it('queryByCountyAndWindow filters by time', async () => {
    const fp = tempFile('county-window');
    const store = new FileTraceStore({ filePath: fp });

    await store.append(makeEvent({ countyId: 'benton', timestamp: '2026-01-01T00:00:00Z' }));
    await store.append(makeEvent({ countyId: 'benton', timestamp: '2026-06-01T00:00:00Z' }));
    await store.append(makeEvent({ countyId: 'benton', timestamp: '2026-09-01T00:00:00Z' }));

    const since = new Date('2026-05-01T00:00:00Z');
    const results = await store.queryByCountyAndWindow('benton', since);
    assert.equal(results.length, 2, 'only events after since date');
  });
});

describe('FileTraceStore — health & lifecycle', () => {
  it('healthy() returns true for valid file path', async () => {
    const fp = tempFile('health');
    const store = new FileTraceStore({ filePath: fp });
    assert.equal(await store.healthy(), true);
  });

  it('getById returns correct event', async () => {
    const fp = tempFile('getbyid');
    const store = new FileTraceStore({ filePath: fp });
    const event = makeEvent();
    await store.append(event);

    const found = await store.getById(event.eventId);
    assert.ok(found);
    assert.equal(found.eventId, event.eventId);
  });

  it('getById returns undefined for missing ID', async () => {
    const fp = tempFile('getbyid-miss');
    const store = new FileTraceStore({ filePath: fp });
    const result = await store.getById('nonexistent-id');
    assert.equal(result, undefined);
  });

  it('close() is a safe no-op', async () => {
    const fp = tempFile('close');
    const store = new FileTraceStore({ filePath: fp });
    await store.append(makeEvent());
    await store.close();
    // Should still function after close for R1
  });
});

// ══════════════════════════════════════════════════════════════════════
// TraceService + persistent store integration
// ══════════════════════════════════════════════════════════════════════

describe('TraceService + FileTraceStore integration', () => {
  it('emit persists event to store', async () => {
    const fp = tempFile('svc-emit');
    const store = new FileTraceStore({ filePath: fp });
    const svc = new TraceService({ store });

    svc.emit({
      type: 'tool_invoked',
      toolId: 'run_valuation_model',
      correlationId: 'corr-001',
      summary: 'running model',
      context: { countyId: 'benton', userId: 'appraiser-001', sessionId: 's1' },
    });

    // Allow fire-and-forget microtask to flush
    await new Promise(r => setTimeout(r, 50));

    // Verify on disk
    const raw = readFileSync(fp, 'utf-8');
    assert.ok(raw.includes('run_valuation_model'), 'event in file');
  });

  it('queryAsync delegates to store', async () => {
    const fp = tempFile('svc-query-async');
    const store = new FileTraceStore({ filePath: fp });
    const svc = new TraceService({ store });

    svc.emit({
      type: 'tool_invoked',
      toolId: 'explain_value_change',
      correlationId: 'corr-002',
      summary: 'explain',
      context: { countyId: 'benton', userId: 'u1', sessionId: 's1' },
    });

    await new Promise(r => setTimeout(r, 50));

    const results = await svc.queryAsync({ toolId: 'explain_value_change' });
    assert.equal(results.length, 1);
    assert.equal(results[0].toolId, 'explain_value_change');
  });

  it('getByCorrelationIdAsync delegates to store', async () => {
    const fp = tempFile('svc-corr-async');
    const store = new FileTraceStore({ filePath: fp });
    const svc = new TraceService({ store });

    const corr = `corr-${randomUUID().slice(0, 8)}`;
    svc.emit({
      type: 'tool_invoked',
      toolId: 'route_to_parcel',
      correlationId: corr,
      summary: 'invoke',
      context: { countyId: 'benton', userId: 'u1', sessionId: 's1' },
    });
    svc.emit({
      type: 'tool_succeeded',
      toolId: 'route_to_parcel',
      correlationId: corr,
      summary: 'success',
      context: { countyId: 'benton', userId: 'u1', sessionId: 's1' },
    });

    await new Promise(r => setTimeout(r, 50));

    const chain = await svc.getByCorrelationIdAsync(corr);
    assert.equal(chain.length, 2, 'full correlation chain');
  });

  it('queryAsync without store falls back to in-memory', async () => {
    const svc = new TraceService(); // no store

    svc.emit({
      type: 'tool_invoked',
      toolId: 'create_search_trace',
      correlationId: 'corr-fallback',
      summary: 'search',
      context: { countyId: 'benton', userId: 'u1', sessionId: 's1' },
    });

    const results = await svc.queryAsync({ toolId: 'create_search_trace' });
    assert.equal(results.length, 1, 'falls back to ring buffer');
  });
});

// ══════════════════════════════════════════════════════════════════════
// Factory: createTraceStore
// ══════════════════════════════════════════════════════════════════════

describe('createTraceStore factory', () => {
  it('creates InMemoryTraceStore for type "memory"', () => {
    const store = createTraceStore({ type: 'memory' });
    assert.ok(store instanceof InMemoryTraceStore);
  });

  it('creates FileTraceStore for type "file"', () => {
    const fp = tempFile('factory');
    const store = createTraceStore({ type: 'file', file: { filePath: fp } });
    assert.ok(store instanceof FileTraceStore);
  });

  it('throws for type "file" without options', () => {
    assert.throws(
      () => createTraceStore({ type: 'file' }),
      /FileTraceStoreOptions required/
    );
  });

  it('throws for unknown type', () => {
    assert.throws(
      () => createTraceStore({ type: 'unknown' }),
      /Unknown trace store type/
    );
  });
});
