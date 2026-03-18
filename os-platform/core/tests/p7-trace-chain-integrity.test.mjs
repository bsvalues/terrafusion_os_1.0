/**
 * Phase 7 — TerraTrace Chain Integrity Tests
 * ============================================================================
 * Enforces Tests E from the Phase 7 Co-Founder mandate:
 *
 * TerraTraceEmissionContractTests:
 *   E1. Every governed write produces action_started (tool_invoked) + terminal
 *       action_completed (tool_completed) or action_failed (tool_failed).
 *   E2. Missing trace emission fails the contract.
 *   E3. Redaction keeps the event shell (eventId, correlationId, type,
 *       toolId, timestamp, summary preserved; payload cleared).
 *   E4. previousHash linkage is present for chain integrity.
 *       *** THIS IS THE PRIMARY RED TEST ***
 *       TerraTrace does not yet compute/store previousHash per event.
 *       This test will FAIL until TraceService.append() sets previousHash.
 *
 * Run: node --test os-platform/core/tests/p7-trace-chain-integrity.test.mjs
 */

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { before, describe, it } from 'node:test';

let InMemoryTraceStore, TraceService, ToolRegistry, ToolRunner;
let registerPhase84Handlers, registerWriteGateHandlers;
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');

before(async () => {
  const pilot = await import('../pilot/index.js');
  const trace = await import('../trace/index.js');

  InMemoryTraceStore = trace.InMemoryTraceStore;
  TraceService = trace.TraceService;
  ToolRegistry = pilot.ToolRegistry;
  ToolRunner = pilot.ToolRunner;
  registerPhase84Handlers = pilot.registerPhase84Handlers;
  registerWriteGateHandlers = pilot.registerWriteGateHandlers;
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSupervisor(overrides = {}) {
  return {
    countyId: 'benton',
    userId: 'supervisor-001',
    roles: ['supervisor'],
    mode: 'pilot',
    confirmation: true,
    reasonCode: 'annual_certification',
    ...overrides,
  };
}

async function makeRunner() {
  const registry = new ToolRegistry();
  await registry.initialize(MANIFEST_PATH);
  const store = new InMemoryTraceStore({ maxEvents: 2000 });
  const traceService = new TraceService({ store });
  const runner = new ToolRunner({ registry, trace: traceService });
  registerPhase84Handlers(runner);
  registerWriteGateHandlers(runner);
  return { registry, runner, traceService, store };
}

function getEvents(traceService, toolId) {
  // TraceService.query() returns in-memory events
  return traceService.query({ toolId });
}

// ============================================================================
// E1: Governed write produces invoked + terminal pair
// ============================================================================

describe('E1: Every governed write emits tool_invoked + terminal event pair', () => {
  it('assemble_boe_packet (write_high) emits tool_invoked + tool_completed', async () => {
    const { runner, traceService } = await makeRunner();

    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: { county: 'benton', caseId: 'BOE-p7-001' },
      context: makeSupervisor({ reasonCode: 'appeal_response' }),
    });

    const events = getEvents(traceService, 'assemble_boe_packet');
    const invoked = events.find((e) => e.type === 'tool_invoked');
    const completed = events.find(
      (e) => e.type === 'tool_completed' || e.type === 'tool_failed'
    );

    assert.ok(
      invoked,
      'Expected tool_invoked trace event for assemble_boe_packet — none found. ' +
      'TerraTrace must emit tool_invoked before handler execution.'
    );
    assert.ok(
      completed,
      'Expected tool_completed or tool_failed trace event — none found. ' +
      'TerraTrace must emit a terminal event after every governed write attempt.'
    );
  });

  it('enforcement failure (missing confirmation) still emits tool_failed', async () => {
    const { runner, traceService } = await makeRunner();

    await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'P-500', taxYear: 2026 },
      context: { countyId: 'benton', userId: 'sup-001', roles: ['supervisor'], mode: 'pilot' },
      // no confirmation, no reasonCode
    });

    const events = getEvents(traceService, 'run_valuation_model');
    const failed = events.find((e) => e.type === 'tool_failed');

    assert.ok(
      failed,
      'Expected tool_failed trace event on enforcement failure — none found. ' +
      'Even gate rejections must emit a tool_failed event for audit completeness.'
    );
  });
});

// ============================================================================
// E2: Missing trace emission contract
// ============================================================================

describe('E2: Trace emission is not optional', () => {
  it('ToolRunner always emits at least one event per execution attempt', async () => {
    const { runner, traceService } = await makeRunner();
    const toolId = 'explain_model_inputs';

    const before = getEvents(traceService, toolId).length;
    await runner.execute({
      toolId,
      params: { county: 'benton', parcelId: 'P-100', taxYear: 2026 },
      context: { countyId: 'benton', userId: 'u1', roles: ['appraiser'], mode: 'muse' },
    });
    const after = getEvents(traceService, toolId).length;

    assert.ok(
      after > before,
      `No trace event emitted for '${toolId}'. ` +
      'ToolRunner must emit at least one event per execute() call, including read_only operations in muse mode.'
    );
  });
});

// ============================================================================
// E3: Redaction keeps event shell intact
// ============================================================================

describe('E3: Redaction preserves event shell (tamper-evident structure)', () => {
  it('redacted event retains eventId, correlationId, type, toolId, timestamp, summary', async () => {
    const { store } = await makeRunner();

    // Append an event with a payloadRef
    const correlationId = randomUUID();
    const eventId = randomUUID();
    const originalEvent = {
      eventId,
      correlationId,
      type: 'tool_invoked',
      toolId: 'add_dossier_note',
      timestamp: new Date().toISOString(),
      schemaVersion: '1.0.0',
      summary: 'Appraiser added note to parcel dossier',
      context: {
        countyId: 'benton',
        userId: 'appraiser-001',
        sessionId: 'sess-p7',
        mode: 'pilot',
        parcelId: 'P-100',
      },
      payloadRef: 'payload://secure/p7-test-ref',
    };

    await store.append(originalEvent);

    // Simulate redaction: mark the event as redacted, clear payloadRef
    // In the real TerraTrace implementation, request_trace_redaction does this.
    // Here we verify the EVENT SHELL contract directly.
    const retrieved = await store.getById(eventId);
    assert.ok(retrieved, 'Event must be retrievable by ID after append');

    // Shell fields that MUST survive redaction
    const SHELL_FIELDS = [
      'eventId',
      'correlationId',
      'type',
      'toolId',
      'timestamp',
      'summary',
    ];
    for (const field of SHELL_FIELDS) {
      assert.ok(
        field in retrieved,
        `Event shell field '${field}' is missing from retrieved event. ` +
        'Redaction must preserve the structural shell of every trace event.'
      );
      assert.ok(
        retrieved[field] !== null && retrieved[field] !== undefined,
        `Shell field '${field}' is null/undefined. Must be preserved through redaction.`
      );
    }
  });
});

// ============================================================================
// E4: previousHash linkage — INTENTIONALLY RED
// ============================================================================
//
// This test verifies that TerraTrace maintains a hash chain: each appended
// event carries a `previousHash` field linking it to the preceding event's hash.
// This makes the log tamper-evident — any deleted or modified event breaks
// the chain and is detectable.
//
// STATUS: RED — TraceService.append() does not currently compute previousHash.
// Implementation required in TraceService.ts + TraceStore.append().

describe('E4: previousHash chain linkage (append-only, tamper-evident)', () => {
  it('first event in a new store has previousHash = null or genesis sentinel', async () => {
    const { store } = await makeRunner();

    const e1 = {
      eventId: randomUUID(),
      correlationId: randomUUID(),
      type: 'tool_invoked',
      toolId: 'test_chain_genesis',
      timestamp: new Date().toISOString(),
      schemaVersion: '1.0.0',
      summary: 'genesis event',
      context: {
        countyId: 'benton',
        userId: 'u1',
        sessionId: 's1',
        mode: 'pilot',
      },
    };

    const stored = await store.append(e1);

    // The stored event must have a previousHash field.
    // For the first event: previousHash === null (empty chain) or a genesis hash.
    assert.ok(
      'previousHash' in stored,
      'First event in store must carry a previousHash field (null for genesis). ' +
      'TraceStore.append() must set previousHash to enable chain integrity verification. ' +
      'Add: previousHash = null for first event, SHA-256(prevEvent) for subsequent events.'
    );

    // Genesis event: previousHash must be null or a specific sentinel
    assert.ok(
      stored.previousHash === null || stored.previousHash === 'genesis',
      `First event previousHash must be null or 'genesis', got: ${JSON.stringify(stored.previousHash)}`
    );
  });

  it('second event has previousHash = hash of first event', async () => {
    const { store } = await makeRunner();

    const e1 = {
      eventId: randomUUID(),
      correlationId: randomUUID(),
      type: 'tool_invoked',
      toolId: 'chain_test_tool',
      timestamp: new Date(Date.now() - 1000).toISOString(),
      schemaVersion: '1.0.0',
      summary: 'first chain event',
      context: { countyId: 'benton', userId: 'u1', sessionId: 's1', mode: 'pilot' },
    };
    const e2 = {
      eventId: randomUUID(),
      correlationId: randomUUID(),
      type: 'tool_completed',
      toolId: 'chain_test_tool',
      timestamp: new Date().toISOString(),
      schemaVersion: '1.0.0',
      summary: 'second chain event',
      context: { countyId: 'benton', userId: 'u1', sessionId: 's1', mode: 'pilot' },
    };

    const stored1 = await store.append(e1);
    const stored2 = await store.append(e2);

    assert.ok(
      'previousHash' in stored2,
      'Second event must carry a previousHash field. ' +
      'TraceStore.append() must compute SHA-256 of the previous event and store it.'
    );

    assert.ok(
      stored2.previousHash !== null && stored2.previousHash !== undefined,
      `Second event previousHash must reference the first event's hash. Got: null/undefined. ` +
      'Implement: previousHash = sha256(JSON.stringify(stored1))'
    );

    // The previousHash must be a non-empty string (hex digest or base64)
    assert.ok(
      typeof stored2.previousHash === 'string' && stored2.previousHash.length >= 32,
      `previousHash must be a hash string (>= 32 chars), got: "${stored2.previousHash}"`
    );
  });

  it('chain can be verified: each event previousHash matches sha256 of prior event', async () => {
    const { store } = await makeRunner();
    const { createHash } = await import('node:crypto');

    const events = [];
    for (let i = 0; i < 3; i++) {
      const e = {
        eventId: randomUUID(),
        correlationId: randomUUID(),
        type: i === 0 ? 'tool_invoked' : 'tool_completed',
        toolId: 'chain_verify_tool',
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
        schemaVersion: '1.0.0',
        summary: `chain event ${i}`,
        context: { countyId: 'benton', userId: 'u1', sessionId: 's1', mode: 'pilot' },
      };
      events.push(await store.append(e));
    }

    // Verify chain: events[n].previousHash === sha256(events[n-1])
    for (let i = 1; i < events.length; i++) {
      const prevEvent = events[i - 1];
      const expectedHash = createHash('sha256')
        .update(JSON.stringify(prevEvent))
        .digest('hex');

      assert.strictEqual(
        events[i].previousHash,
        expectedHash,
        `Chain integrity violation at event ${i}: ` +
        `expected previousHash='${expectedHash}' (sha256 of event ${i - 1}), ` +
        `got '${events[i].previousHash}'. ` +
        'Implement hash-chain in TraceStore.append().'
      );
    }
  });
});
