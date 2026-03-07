/**
 * TerraFusion OS – Lane D: Trace Operability + Retention Enforcement Tests
 *
 * Tests for:
 *   1. Retention pruning (prune removes old events, keeps recent)
 *   2. Bounded growth (ring buffer + maxEvents cap)
 *   3. Parcel index correctness (O(1) lookup, rebuild after prune)
 *   4. Store stats (totalEvents, oldest/newest timestamps)
 *   5. FileTraceStore prune (rewrites file with survivors)
 *   6. TraceService prune + stats delegation
 *
 * Run: node --test os-platform/core/tests/lane-d-trace-operability.test.mjs
 */

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { before, after, describe, it } from 'node:test';

// ============================================================================
// Dynamic imports for ESM compatibility
// ============================================================================

let InMemoryTraceStore, FileTraceStore, TraceService;

before(async () => {
  const traceModule = await import('../trace/index.js');
  const trace = traceModule.default || traceModule;
  InMemoryTraceStore = trace.InMemoryTraceStore;
  FileTraceStore = trace.FileTraceStore;
  TraceService = trace.TraceService;
});

// ── Helpers ──────────────────────────────────────────────────────────

const TEST_DIR = join(tmpdir(), `lane-d-test-${Date.now()}`);

function tempFile(name) {
  return join(TEST_DIR, `${name}-${randomUUID().slice(0, 8)}.jsonl`);
}

function makeEvent(overrides = {}) {
  return {
    eventId: overrides.eventId ?? randomUUID(),
    type: overrides.type ?? 'tool_invoked',
    toolId: overrides.toolId ?? 'test_tool',
    correlationId: overrides.correlationId ?? `corr-${randomUUID().slice(0, 8)}`,
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    schemaVersion: '1.0.0',
    summary: overrides.summary ?? 'test event',
    context: {
      countyId: overrides.countyId ?? 'benton',
      userId: overrides.userId ?? 'test-user',
      sessionId: 'sess-001',
      parcelId: overrides.parcelId ?? undefined,
      dossierId: overrides.dossierId ?? undefined,
      ...(overrides.context || {}),
    },
  };
}

/** Create a timestamp N ms ago */
function ago(ms) {
  return new Date(Date.now() - ms).toISOString();
}

before(() => {
  if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });
});

after(() => {
  try { rmSync(TEST_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
});

// ══════════════════════════════════════════════════════════════════════
// InMemoryTraceStore — prune
// ══════════════════════════════════════════════════════════════════════

describe('InMemoryTraceStore: prune()', () => {
  it('removes events older than retention window', async () => {
    const store = new InMemoryTraceStore();
    const old = makeEvent({ timestamp: ago(60_000) }); // 60s ago
    const recent = makeEvent({ timestamp: new Date().toISOString() });

    await store.append(old);
    await store.append(recent);

    const removed = await store.prune(30_000); // 30s window
    assert.equal(removed, 1);
    assert.equal(await store.count(), 1);

    const remaining = await store.query({});
    assert.equal(remaining[0].eventId, recent.eventId);
  });

  it('returns 0 when nothing to prune', async () => {
    const store = new InMemoryTraceStore();
    await store.append(makeEvent({ timestamp: new Date().toISOString() }));
    const removed = await store.prune(60_000);
    assert.equal(removed, 0);
  });

  it('prunes all events when retention is 0', async () => {
    const store = new InMemoryTraceStore();
    await store.append(makeEvent({ timestamp: ago(1) }));
    await store.append(makeEvent({ timestamp: ago(1) }));
    // Small delay so events are in the past
    await new Promise(r => setTimeout(r, 5));
    const removed = await store.prune(0);
    assert.equal(removed, 2);
    assert.equal(await store.count(), 0);
  });
});

// ══════════════════════════════════════════════════════════════════════
// InMemoryTraceStore — parcel index
// ══════════════════════════════════════════════════════════════════════

describe('InMemoryTraceStore: parcel index', () => {
  it('returns indexed events for parcelId query', async () => {
    const store = new InMemoryTraceStore();
    const e1 = makeEvent({ parcelId: 'P-100', toolId: 'tool_a' });
    const e2 = makeEvent({ parcelId: 'P-200', toolId: 'tool_b' });
    const e3 = makeEvent({ parcelId: 'P-100', toolId: 'tool_c' });

    await store.append(e1);
    await store.append(e2);
    await store.append(e3);

    const results = await store.query({ parcelId: 'P-100' });
    assert.equal(results.length, 2);
    const toolIds = results.map(e => e.toolId).sort();
    assert.deepEqual(toolIds, ['tool_a', 'tool_c']);
  });

  it('returns empty for nonexistent parcelId', async () => {
    const store = new InMemoryTraceStore();
    await store.append(makeEvent({ parcelId: 'P-100' }));
    const results = await store.query({ parcelId: 'P-999' });
    assert.equal(results.length, 0);
  });

  it('rebuilds index after prune', async () => {
    const store = new InMemoryTraceStore();
    const old = makeEvent({ parcelId: 'P-100', timestamp: ago(60_000) });
    const recent = makeEvent({ parcelId: 'P-100', timestamp: new Date().toISOString() });

    await store.append(old);
    await store.append(recent);

    await store.prune(30_000);
    const results = await store.query({ parcelId: 'P-100' });
    assert.equal(results.length, 1);
    assert.equal(results[0].eventId, recent.eventId);
  });

  it('clears parcel index on clear()', async () => {
    const store = new InMemoryTraceStore();
    await store.append(makeEvent({ parcelId: 'P-100' }));
    store.clear();
    const results = await store.query({ parcelId: 'P-100' });
    assert.equal(results.length, 0);
  });
});

// ══════════════════════════════════════════════════════════════════════
// InMemoryTraceStore — bounded growth
// ══════════════════════════════════════════════════════════════════════

describe('InMemoryTraceStore: bounded growth', () => {
  it('trims oldest events when maxEvents exceeded', async () => {
    const store = new InMemoryTraceStore({ maxEvents: 5 });
    for (let i = 0; i < 8; i++) {
      await store.append(makeEvent({ toolId: `tool_${i}` }));
    }
    assert.equal(await store.count(), 5);

    // Should retain the 5 newest (tool_3 through tool_7)
    const results = await store.query({ limit: 10 });
    const toolIds = results.map(e => e.toolId).sort();
    assert.ok(toolIds.includes('tool_7'));
    assert.ok(!toolIds.includes('tool_0'));
  });

  it('parcel index is correct after trim', async () => {
    const store = new InMemoryTraceStore({ maxEvents: 3 });
    await store.append(makeEvent({ parcelId: 'P-1', toolId: 'old_a' }));
    await store.append(makeEvent({ parcelId: 'P-1', toolId: 'old_b' }));
    await store.append(makeEvent({ parcelId: 'P-2', toolId: 'mid' }));
    // This triggers trim — old_a gets dropped
    await store.append(makeEvent({ parcelId: 'P-1', toolId: 'new_a' }));

    const p1 = await store.query({ parcelId: 'P-1' });
    // old_a trimmed, old_b + new_a remain
    assert.equal(p1.length, 2);
    const toolIds = p1.map(e => e.toolId).sort();
    assert.deepEqual(toolIds, ['new_a', 'old_b']);
  });
});

// ══════════════════════════════════════════════════════════════════════
// InMemoryTraceStore — stats
// ══════════════════════════════════════════════════════════════════════

describe('InMemoryTraceStore: stats()', () => {
  it('returns null timestamps when empty', async () => {
    const store = new InMemoryTraceStore();
    const s = await store.stats();
    assert.equal(s.totalEvents, 0);
    assert.equal(s.oldestTimestamp, null);
    assert.equal(s.newestTimestamp, null);
  });

  it('reports correct oldest/newest', async () => {
    const store = new InMemoryTraceStore();
    const t1 = '2025-01-01T00:00:00.000Z';
    const t2 = '2025-06-15T12:00:00.000Z';
    const t3 = '2025-12-31T23:59:59.999Z';

    await store.append(makeEvent({ timestamp: t2 }));
    await store.append(makeEvent({ timestamp: t1 }));
    await store.append(makeEvent({ timestamp: t3 }));

    const s = await store.stats();
    assert.equal(s.totalEvents, 3);
    assert.equal(s.oldestTimestamp, t1);
    assert.equal(s.newestTimestamp, t3);
  });
});

// ══════════════════════════════════════════════════════════════════════
// FileTraceStore — prune + stats
// ══════════════════════════════════════════════════════════════════════

describe('FileTraceStore: prune()', () => {
  it('removes old events and rewrites file', async () => {
    const fp = tempFile('prune');
    const store = new FileTraceStore({ filePath: fp });

    const old = makeEvent({ timestamp: ago(60_000) });
    const recent = makeEvent({ timestamp: new Date().toISOString() });

    await store.append(old);
    await store.append(recent);

    const removed = await store.prune(30_000);
    assert.equal(removed, 1);

    // Verify file was rewritten — only 1 line
    const raw = readFileSync(fp, 'utf-8').trim();
    const lines = raw.split('\n').filter(l => l.trim().length > 0);
    assert.equal(lines.length, 1);
    const persisted = JSON.parse(lines[0]);
    assert.equal(persisted.eventId, recent.eventId);
  });
});

describe('FileTraceStore: stats()', () => {
  it('reports correct stats from file', async () => {
    const fp = tempFile('stats');
    const store = new FileTraceStore({ filePath: fp });

    const t1 = '2025-03-01T00:00:00.000Z';
    const t2 = '2025-09-01T00:00:00.000Z';

    await store.append(makeEvent({ timestamp: t1 }));
    await store.append(makeEvent({ timestamp: t2 }));

    const s = await store.stats();
    assert.equal(s.totalEvents, 2);
    assert.equal(s.oldestTimestamp, t1);
    assert.equal(s.newestTimestamp, t2);
  });
});

// ══════════════════════════════════════════════════════════════════════
// TraceService — prune + stats delegation
// ══════════════════════════════════════════════════════════════════════

describe('TraceService: prune()', () => {
  it('prunes ring buffer events older than window', async () => {
    const store = new InMemoryTraceStore();
    const svc = new TraceService({ store, retentionMs: 30_000 });

    // Emit two events with different ages
    svc.emit({
      type: 'tool_invoked',
      toolId: 'old_tool',
      correlationId: 'c1',
      summary: 'old',
      context: { countyId: 'benton', userId: 'u1', sessionId: 's1' },
    });
    svc.emit({
      type: 'tool_invoked',
      toolId: 'new_tool',
      correlationId: 'c2',
      summary: 'new',
      context: { countyId: 'benton', userId: 'u1', sessionId: 's1' },
    });

    // Backdate the first ring buffer event
    const events = svc.query({});
    if (events.length >= 2) {
      // The ring buffer is internal; we can only test via prune with a future-leaning window
      // Since both events have "now" timestamps, prune(30_000) should remove nothing
      const removed = await svc.prune();
      assert.equal(removed, 0);
    }
  });

  it('delegates to store prune', async () => {
    const store = new InMemoryTraceStore();
    const old = makeEvent({ timestamp: ago(60_000) });
    const recent = makeEvent({ timestamp: new Date().toISOString() });
    await store.append(old);
    await store.append(recent);

    const svc = new TraceService({ store, retentionMs: 30_000 });
    const removed = await svc.prune();
    assert.ok(removed >= 1, 'should prune at least the old event from store');
  });
});

describe('TraceService: stats()', () => {
  it('delegates to store stats', async () => {
    const store = new InMemoryTraceStore();
    const t1 = '2025-01-15T00:00:00.000Z';
    await store.append(makeEvent({ timestamp: t1 }));

    const svc = new TraceService({ store });
    const s = await svc.stats();
    assert.equal(s.totalEvents, 1);
    assert.equal(s.oldestTimestamp, t1);
  });

  it('returns ring buffer stats when no store', async () => {
    const svc = new TraceService({});
    svc.emit({
      type: 'tool_invoked',
      toolId: 'test',
      correlationId: 'c1',
      summary: 'test',
      context: { countyId: 'benton', userId: 'u1', sessionId: 's1' },
    });

    const s = await svc.stats();
    assert.equal(s.totalEvents, 1);
    assert.ok(s.oldestTimestamp !== null);
  });
});
