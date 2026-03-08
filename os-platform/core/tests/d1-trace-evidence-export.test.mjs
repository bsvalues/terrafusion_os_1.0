/**
 * TerraFusion OS — D1 Trace Evidence Export
 *
 * Validates that every blocked write attempt produces exportable trace evidence
 * sufficient for FISMA audit and incident response:
 *   - who attempted the write (userId, roles)
 *   - what toolId
 *   - what reasonCode (if provided)
 *   - what decision (blocked)
 *   - what errorCode
 *   - correlationId
 *   - timestamp
 *
 * Also validates:
 *   - NDJSON export produces parseable, deterministic audit records
 *   - toAuditRecord maps governance failures → decision: "blocked"
 *   - toAuditRecord maps handler errors → decision: "failed"
 *   - toAuditRecord maps success → decision: "allowed"
 *   - Multiple blocked writes produce independent trace chains
 */

import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

let ToolRegistry;
let ToolRunner;
let registerPhase84Handlers;
let registerWriteGateHandlers;
let InMemoryTraceStore;
let TraceService;
let toAuditRecord;
let exportNDJSON;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const traceModule = await import('../trace/index.js');

  const pilot = pilotModule.default || pilotModule;
  const trace = traceModule.default || traceModule;

  ToolRegistry = pilot.ToolRegistry;
  ToolRunner = pilot.ToolRunner;
  registerPhase84Handlers = pilot.registerPhase84Handlers;
  registerWriteGateHandlers = pilot.registerWriteGateHandlers;
  InMemoryTraceStore = trace.InMemoryTraceStore;
  TraceService = trace.TraceService;
  toAuditRecord = trace.toAuditRecord;
  exportNDJSON = trace.exportNDJSON;
});

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');

function setupRunner() {
  const registry = new ToolRegistry();
  return registry.initialize(MANIFEST_PATH).then(() => {
    const traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    const traceService = new TraceService({ store: traceStore });
    const runner = new ToolRunner({ registry, trace: traceService });
    registerPhase84Handlers(runner);
    registerWriteGateHandlers(runner);
    return { registry, traceService, traceStore, runner };
  });
}

// ============================================================================
// D1: Blocked write produces trace evidence with all audit fields
// ============================================================================

describe('D1 Trace Evidence: blocked write emits audit-complete trace event', () => {
  it('assemble_boe_packet blocked → trace has correlationId, toolId, errorCode, userId, countyId', async () => {
    const { runner, traceService } = await setupRunner();

    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: { county: 'benton', caseId: 'BOE-2026-AUDIT', sections: ['cover_sheet'] },
      context: {
        countyId: 'benton',
        userId: 'auditor-probe',
        roles: ['viewer'],
        mode: 'pilot',
      },
    });

    assert.strictEqual(result.ok, false, 'Expected blocked');

    // Query trace by correlationId
    const events = traceService.getByCorrelationId(result.correlationId);
    assert.ok(events.length >= 1, `Expected at least 1 trace event, got ${events.length}`);

    const failedEvent = events.find(e => e.type === 'tool_failed');
    assert.ok(failedEvent, 'Missing tool_failed trace event');
    assert.strictEqual(failedEvent.toolId, 'assemble_boe_packet');
    assert.strictEqual(failedEvent.correlationId, result.correlationId);
    assert.ok(failedEvent.errorCode, 'Missing errorCode on trace event');
    assert.strictEqual(failedEvent.context.userId, 'auditor-probe');
    assert.strictEqual(failedEvent.context.countyId, 'benton');
    assert.ok(failedEvent.timestamp, 'Missing timestamp');
    assert.strictEqual(failedEvent.component, 'ToolRunner');
  });

  it('request_trace_redaction blocked → trace has all audit fields', async () => {
    const { runner, traceService } = await setupRunner();

    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: { county: 'benton', eventIds: ['evt-1'], reason: 'test' },
      context: {
        countyId: 'benton',
        userId: 'auditor-probe-2',
        roles: ['viewer'],
        mode: 'pilot',
      },
    });

    assert.strictEqual(result.ok, false);

    const events = traceService.getByCorrelationId(result.correlationId);
    const failedEvent = events.find(e => e.type === 'tool_failed');
    assert.ok(failedEvent, 'Missing tool_failed trace event');
    assert.strictEqual(failedEvent.context.userId, 'auditor-probe-2');
    assert.ok(failedEvent.errorCode);
  });
});

// ============================================================================
// D1: toAuditRecord maps decisions correctly
// ============================================================================

describe('D1 toAuditRecord: decision mapping', () => {
  it('governance-blocked → decision: "blocked"', async () => {
    const { runner, traceService } = await setupRunner();

    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: { county: 'benton', caseId: 'BOE-MAP-1' },
      context: { countyId: 'benton', userId: 'u1', roles: ['viewer'], mode: 'pilot' },
    });

    const events = traceService.getByCorrelationId(result.correlationId);
    const failedEvent = events.find(e => e.type === 'tool_failed');
    const record = toAuditRecord(failedEvent);

    assert.strictEqual(record.decision, 'blocked');
    assert.strictEqual(record.toolId, 'assemble_boe_packet');
    assert.strictEqual(record.userId, 'u1');
    assert.strictEqual(record.countyId, 'benton');
    assert.ok(record.correlationId);
    assert.ok(record.timestamp);
    assert.ok(record.errorCode);
    assert.deepStrictEqual(record.roles, ['viewer']);
  });

  it('successful execution → decision: "allowed"', async () => {
    // Use a synthetic completion event so mapping tests are stable even when
    // runtime governance policy for specific tools evolves.
    const syntheticCompletedEvent = {
      eventId: 'test-evt-complete',
      type: 'tool_completed',
      toolId: 'run_valuation_model',
      correlationId: 'corr-complete-1',
      context: { countyId: 'benton', userId: 'u2', roles: ['appraiser'], mode: 'pilot' },
      summary: 'Completed run_valuation_model in 5ms',
      component: 'ToolRunner',
      timestamp: new Date().toISOString(),
      schemaVersion: '1.0.0',
    };

    const record = toAuditRecord(syntheticCompletedEvent);
    assert.strictEqual(record.decision, 'allowed');
    assert.strictEqual(record.errorCode, null);
  });

  it('handler error → decision: "failed"', async () => {
    // Simulate a tool_failed with EXECUTION_FAILED errorCode
    // We construct a synthetic event to test the mapper directly
    const syntheticEvent = {
      eventId: 'test-evt-1',
      type: 'tool_failed',
      toolId: 'some_tool',
      correlationId: 'corr-handler-err',
      context: { countyId: 'benton', userId: 'u3', roles: ['appraiser'], mode: 'pilot' },
      summary: 'Failed some_tool: unexpected error',
      errorCode: 'EXECUTION_FAILED',
      component: 'Handler',
      timestamp: new Date().toISOString(),
      schemaVersion: '1.0.0',
    };

    const record = toAuditRecord(syntheticEvent);
    assert.strictEqual(record.decision, 'failed');
    assert.strictEqual(record.errorCode, 'EXECUTION_FAILED');
  });
});

// ============================================================================
// D1: NDJSON export produces parseable audit records
// ============================================================================

describe('D1 NDJSON Export: blocked writes are exportable', () => {
  it('exportNDJSON with auditFormat=true yields parseable audit records', async () => {
    const { runner, traceService } = await setupRunner();

    // Trigger a blocked write
    await runner.execute({
      toolId: 'assemble_boe_packet',
      params: { county: 'benton', caseId: 'BOE-NDJSON-1' },
      context: { countyId: 'benton', userId: 'export-test', roles: ['viewer'], mode: 'pilot' },
    });

    const events = traceService.query({ toolId: 'assemble_boe_packet' });
    assert.ok(events.length >= 1);

    const ndjson = exportNDJSON(events, { auditFormat: true });
    const lines = ndjson.split('\n').filter(l => l.trim());
    assert.ok(lines.length >= 1, 'Expected at least 1 NDJSON line');

    // Every line must be valid JSON with audit fields
    for (const line of lines) {
      const record = JSON.parse(line);
      assert.ok(record.correlationId, 'Missing correlationId in NDJSON');
      assert.ok(record.toolId, 'Missing toolId in NDJSON');
      assert.ok(record.decision, 'Missing decision in NDJSON');
      assert.ok(record.userId, 'Missing userId in NDJSON');
      assert.ok(record.countyId, 'Missing countyId in NDJSON');
      assert.ok(record.timestamp, 'Missing timestamp in NDJSON');
    }
  });

  it('exportNDJSON without auditFormat yields raw trace events', async () => {
    const { runner, traceService } = await setupRunner();

    await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'P-RAW' },
      context: { countyId: 'benton', userId: 'raw-test', roles: ['viewer'], mode: 'pilot' },
    });

    const events = traceService.query({ toolId: 'run_valuation_model' });
    const ndjson = exportNDJSON(events);
    const lines = ndjson.split('\n').filter(l => l.trim());
    assert.ok(lines.length >= 1);

    const parsed = JSON.parse(lines[0]);
    // Raw format includes eventId (not present in audit format)
    assert.ok(parsed.eventId, 'Raw export should include eventId');
    assert.ok(parsed.schemaVersion, 'Raw export should include schemaVersion');
  });
});

// ============================================================================
// D1: Multiple blocked writes produce independent trace chains
// ============================================================================

describe('D1 Independent trace chains: each blocked write has unique evidence', () => {
  it('two blocked writes produce separate correlationIds and trace events', async () => {
    const { runner, traceService } = await setupRunner();

    const result1 = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: { county: 'benton', caseId: 'CHAIN-A' },
      context: { countyId: 'benton', userId: 'chain-test-a', roles: ['viewer'], mode: 'pilot' },
    });

    const result2 = await runner.execute({
      toolId: 'request_trace_redaction',
      params: { county: 'benton', eventIds: ['evt-1'] },
      context: { countyId: 'benton', userId: 'chain-test-b', roles: ['viewer'], mode: 'pilot' },
    });

    assert.notStrictEqual(result1.correlationId, result2.correlationId);

    const chain1 = traceService.getByCorrelationId(result1.correlationId);
    const chain2 = traceService.getByCorrelationId(result2.correlationId);

    assert.ok(chain1.length >= 1, 'Chain A missing trace events');
    assert.ok(chain2.length >= 1, 'Chain B missing trace events');

    // Each chain references only its own tool
    assert.strictEqual(chain1[0].toolId, 'assemble_boe_packet');
    assert.strictEqual(chain2[0].toolId, 'request_trace_redaction');

    // Verify both export to NDJSON independently
    const allEvents = traceService.query({});
    const ndjson = exportNDJSON(allEvents, { auditFormat: true });
    const records = ndjson.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

    const chain1Records = records.filter(r => r.correlationId === result1.correlationId);
    const chain2Records = records.filter(r => r.correlationId === result2.correlationId);

    assert.ok(chain1Records.length >= 1, 'NDJSON missing chain A records');
    assert.ok(chain2Records.length >= 1, 'NDJSON missing chain B records');
    assert.strictEqual(chain1Records[0].decision, 'blocked');
    assert.strictEqual(chain2Records[0].decision, 'blocked');
  });
});

// ============================================================================
// D1: Audit record includes reasonCode when provided (even if blocked)
// ============================================================================

describe('D1 reasonCode capture: blocked write with reasonCode preserves it', () => {
  it('blocked write with invalid role but valid reasonCode captures reasonCode in trace', async () => {
    const { runner, traceService } = await setupRunner();

    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: { county: 'benton', caseId: 'BOE-REASON-1' },
      context: {
        countyId: 'benton',
        userId: 'reason-test',
        roles: ['viewer'],
        mode: 'pilot',
        confirmation: true,
        reasonCode: 'annual_certification',
      },
    });

    assert.strictEqual(result.ok, false);

    const events = traceService.getByCorrelationId(result.correlationId);
    const failedEvent = events.find(e => e.type === 'tool_failed');
    const record = toAuditRecord(failedEvent);

    assert.strictEqual(record.decision, 'blocked');
    assert.strictEqual(record.reasonCode, 'annual_certification');
    assert.strictEqual(record.userId, 'reason-test');
  });

  it('blocked write without reasonCode shows null in audit record', async () => {
    const { runner, traceService } = await setupRunner();

    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: { county: 'benton', caseId: 'BOE-NO-REASON' },
      context: { countyId: 'benton', userId: 'no-reason', roles: ['viewer'], mode: 'pilot' },
    });

    const events = traceService.getByCorrelationId(result.correlationId);
    const record = toAuditRecord(events.find(e => e.type === 'tool_failed'));

    assert.strictEqual(record.reasonCode, null);
  });
});
