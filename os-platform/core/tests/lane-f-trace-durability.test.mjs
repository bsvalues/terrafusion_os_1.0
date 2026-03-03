/**
 * TerraFusion OS – Lane F: Trace Durability + Restart Correctness Tests
 *
 * Tests for:
 *   1. Restart persistence: write N events, new instance reads same N
 *   2. Deterministic ordering after restart
 *   3. Corruption handling: malformed lines skipped, count exposed
 *   4. Atomic prune: temp+rename pattern (no partial writes)
 *   5. Empty file recovery: new store on empty file works
 *   6. Partial corruption: valid events survive alongside corrupt lines
 *
 * Run: node --test os-platform/core/tests/lane-f-trace-durability.test.mjs
 */

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { before, after, describe, it } from 'node:test';

// ============================================================================
// Dynamic imports
// ============================================================================

let FileTraceStore, InMemoryTraceStore, TraceService;

before(async () => {
  const trace = await import('../trace/index.js');
  FileTraceStore = trace.FileTraceStore;
  InMemoryTraceStore = trace.InMemoryTraceStore;
  TraceService = trace.TraceService;
});

// ── Helpers ──────────────────────────────────────────────────────────

const TEST_DIR = join(tmpdir(), `lane-f-test-${Date.now()}`);

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
      mode: 'pilot',
      parcelId: overrides.parcelId ?? undefined,
      ...(overrides.context || {}),
    },
  };
}

before(() => {
  if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });
});

after(() => {
  try { rmSync(TEST_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
});

// ══════════════════════════════════════════════════════════════════════
// Restart persistence
// ══════════════════════════════════════════════════════════════════════

describe('FileTraceStore: restart persistence', () => {
  it('new instance reads events written by previous instance', async () => {
    const fp = tempFile('restart');
    const store1 = new FileTraceStore({ filePath: fp });

    const e1 = makeEvent({ toolId: 'tool_a', timestamp: '2025-06-01T00:00:00.000Z' });
    const e2 = makeEvent({ toolId: 'tool_b', timestamp: '2025-06-02T00:00:00.000Z' });
    const e3 = makeEvent({ toolId: 'tool_c', timestamp: '2025-06-03T00:00:00.000Z' });

    await store1.append(e1);
    await store1.append(e2);
    await store1.append(e3);

    // "Restart" — new instance from same file
    const store2 = new FileTraceStore({ filePath: fp });
    const count = await store2.count();
    assert.equal(count, 3);

    const all = await store2.query({ limit: 10 });
    assert.equal(all.length, 3);
  });

  it('events are in deterministic order after restart', async () => {
    const fp = tempFile('order');
    const store1 = new FileTraceStore({ filePath: fp });

    const e1 = makeEvent({ toolId: 'first', timestamp: '2025-01-01T00:00:00.000Z', correlationId: 'c1' });
    const e2 = makeEvent({ toolId: 'second', timestamp: '2025-06-01T00:00:00.000Z', correlationId: 'c2' });
    const e3 = makeEvent({ toolId: 'third', timestamp: '2025-12-01T00:00:00.000Z', correlationId: 'c3' });

    await store1.append(e1);
    await store1.append(e2);
    await store1.append(e3);

    // Restart
    const store2 = new FileTraceStore({ filePath: fp });
    const results = await store2.query({ limit: 10 });

    // Newest first
    assert.equal(results[0].toolId, 'third');
    assert.equal(results[1].toolId, 'second');
    assert.equal(results[2].toolId, 'first');
  });

  it('getById works after restart', async () => {
    const fp = tempFile('getbyid');
    const store1 = new FileTraceStore({ filePath: fp });
    const e = makeEvent({ toolId: 'target' });
    await store1.append(e);

    const store2 = new FileTraceStore({ filePath: fp });
    const found = await store2.getById(e.eventId);
    assert.ok(found);
    assert.equal(found.toolId, 'target');
  });

  it('getByCorrelationId works after restart', async () => {
    const fp = tempFile('corr');
    const store1 = new FileTraceStore({ filePath: fp });
    const corrId = `corr-${randomUUID().slice(0, 8)}`;
    await store1.append(makeEvent({ correlationId: corrId, type: 'tool_invoked' }));
    await store1.append(makeEvent({ correlationId: corrId, type: 'tool_completed' }));
    await store1.append(makeEvent({ correlationId: 'other' }));

    const store2 = new FileTraceStore({ filePath: fp });
    const chain = await store2.getByCorrelationId(corrId);
    assert.equal(chain.length, 2);
  });
});

// ══════════════════════════════════════════════════════════════════════
// Corruption handling
// ══════════════════════════════════════════════════════════════════════

describe('FileTraceStore: corruption handling', () => {
  it('skips malformed lines and counts them', async () => {
    const fp = tempFile('corrupt');
    const valid = makeEvent({ toolId: 'good' });

    // Write file with mix of valid and corrupt lines
    const content = [
      JSON.stringify(valid),
      'THIS IS NOT JSON',
      '{"partial": true',
      JSON.stringify(makeEvent({ toolId: 'also_good' })),
      '',
    ].join('\n');
    writeFileSync(fp, content, 'utf-8');

    const store = new FileTraceStore({ filePath: fp });
    const count = await store.count();
    assert.equal(count, 2, 'should load only valid events');
    assert.equal(store.getCorruptLineCount(), 2, 'should count 2 corrupt lines');
  });

  it('healthy() returns true even with some corrupt lines', async () => {
    const fp = tempFile('partial-corrupt');
    writeFileSync(fp, 'NOT JSON\n' + JSON.stringify(makeEvent()) + '\n', 'utf-8');

    const store = new FileTraceStore({ filePath: fp });
    assert.equal(await store.healthy(), true);
    assert.equal(store.getCorruptLineCount(), 1);
  });

  it('completely corrupt file loads as empty', async () => {
    const fp = tempFile('all-corrupt');
    writeFileSync(fp, 'garbage\nmore garbage\n', 'utf-8');

    const store = new FileTraceStore({ filePath: fp });
    const count = await store.count();
    assert.equal(count, 0);
    assert.equal(store.getCorruptLineCount(), 2);
  });

  it('empty file loads cleanly with zero corruption', async () => {
    const fp = tempFile('empty');
    writeFileSync(fp, '', 'utf-8');

    const store = new FileTraceStore({ filePath: fp });
    const count = await store.count();
    assert.equal(count, 0);
    assert.equal(store.getCorruptLineCount(), 0);
  });
});

// ══════════════════════════════════════════════════════════════════════
// Atomic prune (temp + rename)
// ══════════════════════════════════════════════════════════════════════

describe('FileTraceStore: atomic prune', () => {
  it('prune rewrites file atomically (no .tmp residue)', async () => {
    const fp = tempFile('atomic');
    const store = new FileTraceStore({ filePath: fp });

    await store.append(makeEvent({ timestamp: new Date(Date.now() - 60000).toISOString() }));
    await store.append(makeEvent({ timestamp: new Date().toISOString() }));

    await store.prune(30000);

    // No temp file left behind
    assert.equal(existsSync(fp + '.tmp'), false, 'temp file should not survive');

    // File has exactly 1 line
    const raw = readFileSync(fp, 'utf-8').trim();
    const lines = raw.split('\n').filter(l => l.trim().length > 0);
    assert.equal(lines.length, 1);
  });

  it('prune to empty writes empty file', async () => {
    const fp = tempFile('prune-empty');
    const store = new FileTraceStore({ filePath: fp });
    await store.append(makeEvent({ timestamp: new Date(Date.now() - 60000).toISOString() }));

    // Small delay for timestamp precision
    await new Promise(r => setTimeout(r, 5));
    await store.prune(0);

    const raw = readFileSync(fp, 'utf-8');
    assert.equal(raw, '');
  });

  it('file survives restart after prune', async () => {
    const fp = tempFile('prune-restart');
    const store1 = new FileTraceStore({ filePath: fp });

    const old = makeEvent({ toolId: 'old', timestamp: new Date(Date.now() - 120000).toISOString() });
    const recent = makeEvent({ toolId: 'recent', timestamp: new Date().toISOString() });

    await store1.append(old);
    await store1.append(recent);
    await store1.prune(60000);

    // Restart
    const store2 = new FileTraceStore({ filePath: fp });
    const count = await store2.count();
    assert.equal(count, 1);

    const all = await store2.query({ limit: 10 });
    assert.equal(all[0].toolId, 'recent');
  });
});

// ══════════════════════════════════════════════════════════════════════
// TraceService + FileTraceStore integration: restart
// ══════════════════════════════════════════════════════════════════════

describe('TraceService: restart with FileTraceStore', () => {
  it('events persisted via service are available after restart', async () => {
    const fp = tempFile('svc-restart');
    const store1 = new FileTraceStore({ filePath: fp });
    const svc1 = new TraceService({ store: store1 });

    svc1.emit({
      type: 'tool_invoked',
      toolId: 'test_tool',
      correlationId: 'c1',
      summary: 'invoked',
      context: { countyId: 'benton', userId: 'u1', sessionId: 's1' },
    });

    // Wait for fire-and-forget persistence
    await new Promise(r => setTimeout(r, 50));

    // Restart with new store and service
    const store2 = new FileTraceStore({ filePath: fp });
    const svc2 = new TraceService({ store: store2 });

    const events = await svc2.queryAsync({ limit: 10 });
    assert.equal(events.length, 1);
    assert.equal(events[0].toolId, 'test_tool');
  });
});
