import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

// ---------------------------------------------------------------------------
// Helper: load a fresh TraceService instance with the given env vars
// ---------------------------------------------------------------------------
function loadFreshTraceService(envOverrides = {}) {
  for (const [k, v] of Object.entries(envOverrides)) {
    process.env[k] = v;
  }
  const require = createRequire(import.meta.url);
  const traceServicePath = path.resolve('os-platform/core/pilot/trace/TraceService.js');
  // Clear require caches so the new instance picks up env changes
  try { delete require.cache[require.resolve(traceServicePath)]; } catch (_) { }
  try { delete require.cache[require.resolve(path.resolve('os-platform/core/pilot/trace/devAuditAdapter.cjs'))]; } catch (_) { }
  try { delete require.cache[require.resolve(path.resolve('os-platform/core/pilot/trace/devSqliteAdapter.cjs'))]; } catch (_) { }
  const mod = require(traceServicePath);
  return mod;
}

async function waitFor(description, predicate, timeoutMs = 5000, intervalMs = 100) {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const result = await predicate();
      if (result) return result;
    } catch (err) {
      lastError = err;
    }

    await new Promise(r => setTimeout(r, intervalMs));
  }

  if (lastError) {
    throw new Error(`${description} timed out: ${lastError.message}`);
  }
  throw new Error(`${description} timed out`);
}

// ---------------------------------------------------------------------------
// Test 1: file-based adapter
// ---------------------------------------------------------------------------
test('dev-audit file adapter writes events and payloads', async () => {
  const { TraceService } = loadFreshTraceService({
    TF_DEV_AUDIT: '1',
    TF_DEV_AUDIT_STORE: 'file',
  });
  // build an isolated instance
  const svc = new TraceService();

  // Cleanup prior artifacts
  const eventsPath = path.resolve('dev-audit/events.log.jsonl');
  const payloadsPath = path.resolve('dev-audit/payloads.json');
  await fs.rm(eventsPath, { force: true }).catch(() => { });
  await fs.rm(payloadsPath, { force: true }).catch(() => { });

  const correlationId = `file-corr-${Date.now()}`;
  svc.emit({
    type: 'tool_invoked',
    correlationId,
    toolId: 'test-file-emitter',
    summary: 'file invocation',
    context: { env: 'test' },
  });

  const successEvent = svc.emitWithPiiHandling({
    type: 'tool_succeeded',
    correlationId,
    toolId: 'test-file-emitter',
    summary: 'file success',
    context: { env: 'test' },
  }, 'payload_ref', { secret: 'xxx', note: 'file-only' }, 'dev');

  await new Promise(r => setTimeout(r, 150));

  const eventsData = await fs.readFile(eventsPath, 'utf8');
  assert(eventsData.includes(correlationId), 'events.log.jsonl must contain correlationId');

  const payloadsJson = JSON.parse(await fs.readFile(payloadsPath, 'utf8'));
  assert(payloadsJson[successEvent.payloadRef], 'payloads.json must contain payloadRef entry');
});

// ---------------------------------------------------------------------------
// Test 2: sqlite-backed adapter (skips gracefully if sqlite3 not installed)
// ---------------------------------------------------------------------------
test('dev-audit sqlite adapter persists events and payloads', async () => {
  // Check sqlite3 availability before attempting the test
  let sqlite3Available = false;
  try {
    const require2 = createRequire(import.meta.url);
    require2('sqlite3');
    sqlite3Available = true;
  } catch (_) { }
  if (!sqlite3Available) {
    // Graceful skip — not a failure, just unavailable in this env
    console.log('  ⏭  sqlite3 not installed — skipping sqlite adapter test');
    return;
  }

  const dbPath = path.resolve('.tmp/test-dev-audit.db');
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  await fs.rm(dbPath, { force: true }).catch(() => { });

  const { TraceService } = loadFreshTraceService({
    TF_DEV_AUDIT: '1',
    TF_DEV_AUDIT_STORE: 'sqlite',
    TF_DEV_AUDIT_DB: dbPath,
  });
  const svc = new TraceService();

  const correlationId = `sqlite-corr-${Date.now()}`;
  svc.emit({
    type: 'tool_invoked',
    correlationId,
    toolId: 'test-sqlite-emitter',
    summary: 'sqlite invocation',
    context: { env: 'test' },
  });

  svc.emitWithPiiHandling({
    type: 'tool_succeeded',
    correlationId,
    toolId: 'test-sqlite-emitter',
    summary: 'sqlite success',
    context: { env: 'test' },
  }, 'payload_ref', { secret: 'yyy', note: 'sqlite-only' }, 'dev');

  await waitFor('sqlite DB file to be created', async () => {
    const stat = await fs.stat(dbPath);
    return stat.size > 0 ? stat : false;
  });

  // Query the DB directly to verify rows
  const require3 = createRequire(import.meta.url);
  const sqlite3Mod = require3('sqlite3').verbose();
  const queryEvents = () => new Promise((resolve, reject) => {
    const db = new sqlite3Mod.Database(dbPath, sqlite3Mod.OPEN_READONLY);
    db.all(`SELECT event_json FROM events WHERE event_json LIKE ?`, [`%${correlationId}%`], (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows);
    });
  });
  const rows = await waitFor('sqlite events to be persisted', async () => {
    const currentRows = await queryEvents();
    return currentRows.length >= 2 ? currentRows : false;
  });
  assert(rows.length >= 2, `expected at least 2 events with correlationId, got ${rows.length}`);

  // Verify payload row
  const queryPayloads = () => new Promise((resolve, reject) => {
    const db = new sqlite3Mod.Database(dbPath, sqlite3Mod.OPEN_READONLY);
    db.all(`SELECT ref, payload_json FROM payloads`, [], (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows);
    });
  });
  const payloadRows = await waitFor('sqlite payloads to be persisted', async () => {
    const currentRows = await queryPayloads();
    return currentRows.length >= 1 ? currentRows : false;
  });
  assert(payloadRows.length >= 1, `expected at least 1 payload row, got ${payloadRows.length}`);
});
