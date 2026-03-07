/**
 * TerraFusion OS — R1 Acceptance Criteria (AC-1 through AC-11)
 *
 * ALL-PROOF-02: Formal acceptance criteria test suite.
 * Exercises every R1 acceptance criterion with evidence.
 *
 * Run: node --test os-platform/core/tests/r1-acceptance-criteria.test.mjs
 */

import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { afterEach, before, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// ============================================================================
// Dynamic imports
// ============================================================================

let ToolRegistry, ToolRunner, InMemoryTraceStore, TraceService;
let registerR1Handlers;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const traceModule = await import('../trace/index.js');
  const pilot = pilotModule.default || pilotModule;
  const trace = traceModule.default || traceModule;

  ToolRegistry = pilot.ToolRegistry;
  ToolRunner = pilot.ToolRunner;
  registerR1Handlers = pilot.registerR1Handlers;
  InMemoryTraceStore = trace.InMemoryTraceStore;
  TraceService = trace.TraceService;
});

// ============================================================================
// Test fixtures
// ============================================================================

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');

const originalFetch = globalThis.fetch;

function mockFetch(data, status = 200) {
  globalThis.fetch = async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    text: async () => JSON.stringify(data),
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

/** Pilot-mode appraiser context */
function pilotContext(overrides = {}) {
  return {
    countyId: 'benton',
    userId: 'appraiser-001',
    roles: ['appraiser'],
    mode: 'pilot',
    ...overrides,
  };
}

/** Muse-mode appraiser context */
function museContext(overrides = {}) {
  return {
    countyId: 'benton',
    userId: 'appraiser-001',
    roles: ['appraiser'],
    mode: 'muse',
    ...overrides,
  };
}

// ============================================================================
// AC-1: Governed Tool Execution with Trace Evidence
// ============================================================================

describe('AC-1: Governed Tool Execution', () => {
  let registry, traceStore, traceService, runner;

  beforeEach(async () => {
    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);
    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceService = new TraceService({ store: traceStore });
    runner = new ToolRunner({ registry, trace: traceService });
    registerR1Handlers(runner, traceService);
  });

  it('run_valuation_model produces result with correlationId and trace', async () => {
    mockFetch({ estimatedValue: 325000, confidence: 0.92, components: { land: 150000 } });

    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'R12345', taxYear: 2026 },
      context: pilotContext({ confirmation: true, reasonCode: 'annual_certification' }),
    });

    assert.ok(result.ok, `Expected ok=true, got error: ${result.error}`);
    assert.ok(result.correlationId, 'Must have correlationId');
    assert.equal(result.result.estimatedValue, 325000);

    const events = await traceStore.query({ correlationId: result.correlationId });
    assert.ok(events.length >= 2, 'Need tool_invoked + tool_completed events');
    assert.ok(events.find(e => e.type === 'tool_invoked'), 'tool_invoked event required');
    assert.ok(events.find(e => e.type === 'tool_completed'), 'tool_completed event required');
  });
});

// ============================================================================
// AC-2: Confirmation + Reason Code Gates
// ============================================================================

describe('AC-2: Confirmation Gate Enforcement', () => {
  let registry, traceStore, traceService, runner;

  beforeEach(async () => {
    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);
    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceService = new TraceService({ store: traceStore });
    runner = new ToolRunner({ registry, trace: traceService });
    registerR1Handlers(runner, traceService);
  });

  it('write_high tool rejected without confirmation', async () => {
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'R12345', taxYear: 2026 },
      context: pilotContext(),
    });

    assert.equal(result.ok, false);
    assert.ok(
      ['CONFIRMATION_REQUIRED', 'REASON_CODE_REQUIRED'].includes(result.errorCode),
      `Expected confirmation/reason error, got: ${result.errorCode}`
    );
  });

  it('write_high tool rejected without reasonCode', async () => {
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'R12345', taxYear: 2026 },
      context: pilotContext({ confirmation: true }),
    });

    assert.equal(result.ok, false);
    assert.ok(
      ['REASON_CODE_REQUIRED', 'CONFIRMATION_REQUIRED'].includes(result.errorCode),
      `Expected reason code error, got: ${result.errorCode}`
    );
  });

  it('write_high tool succeeds with confirmation + reasonCode', async () => {
    mockFetch({ estimatedValue: 100000, confidence: 0.8, components: {} });

    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'R12345', taxYear: 2026 },
      context: pilotContext({ confirmation: true, reasonCode: 'annual_certification' }),
    });

    assert.ok(result.ok, `Expected ok=true, got: ${result.error}`);
  });
});

// ============================================================================
// AC-3: Trace Lifecycle for Proof Tools
// ============================================================================

describe('AC-3: Trace Lifecycle', () => {
  let registry, traceStore, traceService, runner;

  beforeEach(async () => {
    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);
    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceService = new TraceService({ store: traceStore });
    runner = new ToolRunner({ registry, trace: traceService });
    registerR1Handlers(runner, traceService);
  });

  const proofTools = [
    {
      toolId: 'run_valuation_model', mode: 'pilot',
      params: { county: 'benton', parcelId: 'R12345', taxYear: 2026 },
      contextExtra: { confirmation: true, reasonCode: 'annual_certification' },
      mockData: { estimatedValue: 100000, confidence: 0.8, components: {} },
    },
    {
      toolId: 'explain_value_change', mode: 'muse',
      params: { parcelId: 'R12345', county: 'benton' },
      contextExtra: {},
      mockData: { parcelId: 'R12345', currentValue: 325000, previousValue: 310000, changeAmount: 15000, changePercent: 4.84, factors: ['market'], taxYear: 2026, assessmentDate: '2026-01-01' },
    },
    {
      toolId: 'summarize_levy_rate_components', mode: 'muse',
      params: { districtId: 'D001', county: 'benton' },
      contextExtra: {},
      mockData: { districtId: 'D001', totalRate: 10.5, components: [], county: 'benton', effectiveDate: '2026-01-01', rateLimit: 15.0, utilizationPercent: 70.0 },
    },
    {
      toolId: 'search_trace_by_correlation', mode: 'pilot',
      params: { correlationId: 'test-corr-123', county: 'benton' },
      contextExtra: {},
      mockData: null,
    },
  ];

  for (const pt of proofTools) {
    it(`${pt.toolId} emits tool_invoked + tool_completed`, async () => {
      if (pt.mockData !== null) mockFetch(pt.mockData);

      const ctx = pt.mode === 'pilot' ? pilotContext(pt.contextExtra) : museContext(pt.contextExtra);
      const result = await runner.execute({ toolId: pt.toolId, params: pt.params, context: ctx });

      assert.ok(result.ok, `${pt.toolId} failed: ${result.error}`);

      const events = await traceStore.query({ correlationId: result.correlationId });
      const types = events.map(e => e.type);
      assert.ok(types.includes('tool_invoked'), `${pt.toolId} missing tool_invoked`);
      assert.ok(types.includes('tool_completed'), `${pt.toolId} missing tool_completed`);
    });
  }
});

// ============================================================================
// AC-4: Evidence Rail Retrieval by CorrelationId
// ============================================================================

describe('AC-4: Evidence Rail', () => {
  let registry, traceStore, traceService, runner;

  beforeEach(async () => {
    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);
    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceService = new TraceService({ store: traceStore });
    runner = new ToolRunner({ registry, trace: traceService });
    registerR1Handlers(runner, traceService);
  });

  it('trace events retrievable by correlationId', async () => {
    mockFetch({ estimatedValue: 200000, confidence: 0.85, components: {} });

    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'R99999', taxYear: 2026 },
      context: pilotContext({ confirmation: true, reasonCode: 'annual_certification' }),
    });

    assert.ok(result.ok);
    const events = await traceStore.query({ correlationId: result.correlationId });
    assert.ok(events.length >= 2, 'Evidence rail must have >= 2 events');

    for (const event of events) {
      assert.ok(event.eventId, 'eventId required');
      assert.ok(event.timestamp, 'timestamp required');
      assert.ok(event.toolId, 'toolId required');
      assert.ok(event.correlationId, 'correlationId required');
    }
  });
});

// ============================================================================
// AC-5: Context Propagation (countyId, roles, mode)
// ============================================================================

describe('AC-5: Context Propagation', () => {
  let registry, traceStore, traceService, runner;

  beforeEach(async () => {
    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);
    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceService = new TraceService({ store: traceStore });
    runner = new ToolRunner({ registry, trace: traceService });
    registerR1Handlers(runner, traceService);
  });

  it('trace events carry countyId from execution context', async () => {
    mockFetch({ estimatedValue: 100000, confidence: 0.8, components: {} });

    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'R12345', taxYear: 2026 },
      context: pilotContext({ confirmation: true, reasonCode: 'annual_certification' }),
    });

    assert.ok(result.ok);
    const events = await traceStore.query({ correlationId: result.correlationId });
    const invokedEvent = events.find(e => e.type === 'tool_invoked');
    assert.ok(invokedEvent, 'tool_invoked event required');
    assert.equal(invokedEvent.context.countyId, 'benton');
    assert.deepEqual(invokedEvent.context.roles, ['appraiser']);
    assert.equal(invokedEvent.context.mode, 'pilot');
  });
});

// ============================================================================
// AC-6: County Isolation (cross-county rejection)
// ============================================================================

describe('AC-6: County Isolation', () => {
  let registry, traceStore, traceService, runner;

  beforeEach(async () => {
    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);
    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceService = new TraceService({ store: traceStore });
    runner = new ToolRunner({ registry, trace: traceService });
    registerR1Handlers(runner, traceService);
  });

  it('run_valuation_model rejects cross-county invocation', async () => {
    mockFetch({ estimatedValue: 100000, confidence: 0.8, components: {} });

    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'king', parcelId: 'K99999', taxYear: 2026 },
      context: pilotContext({ countyId: 'benton', confirmation: true, reasonCode: 'annual_certification' }),
    });

    assert.equal(result.ok, false, 'Cross-county should be rejected');
  });
});

// ============================================================================
// AC-7: Write Lane Enforcement
// ============================================================================

describe('AC-7: Write Lane Enforcement', () => {
  let registry, traceStore, traceService, runner;

  beforeEach(async () => {
    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);
    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceService = new TraceService({ store: traceStore });
    runner = new ToolRunner({ registry, trace: traceService });
    registerR1Handlers(runner, traceService);
  });

  it('write_high tool requires confirmation gate', async () => {
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'R12345', taxYear: 2026 },
      context: pilotContext(),
    });

    assert.equal(result.ok, false);
  });

  it('read_only tool executes without confirmation', async () => {
    mockFetch({ parcelId: 'R12345', summary: 'test', assessmentHistory: [] });

    const result = await runner.execute({
      toolId: 'summarize_parcel_casefile',
      params: { parcelId: 'R12345', county: 'benton' },
      context: museContext(),
    });

    assert.ok(result.ok, `read_only tool should not require confirmation: ${result.error}`);
  });
});

// ============================================================================
// AC-8: Forge Differentiated Output Per Parcel
// ============================================================================

describe('AC-8: Forge Differentiated Output', () => {
  let registry, traceStore, traceService, runner;

  beforeEach(async () => {
    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);
    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceService = new TraceService({ store: traceStore });
    runner = new ToolRunner({ registry, trace: traceService });
    registerR1Handlers(runner, traceService);
  });

  it('different parcels produce different results', async () => {
    mockFetch({ estimatedValue: 325000, confidence: 0.92, components: { land: 150000 } });
    const r1 = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'R12345', taxYear: 2026 },
      context: pilotContext({ confirmation: true, reasonCode: 'annual_certification' }),
    });

    mockFetch({ estimatedValue: 485000, confidence: 0.88, components: { land: 200000 } });
    const r2 = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'R67890', taxYear: 2026 },
      context: pilotContext({ confirmation: true, reasonCode: 'annual_certification' }),
    });

    assert.ok(r1.ok && r2.ok);
    assert.notEqual(r1.result.parcelId, r2.result.parcelId);
    assert.notEqual(r1.result.estimatedValue, r2.result.estimatedValue);
    assert.notEqual(r1.correlationId, r2.correlationId);
  });
});

// ============================================================================
// AC-9: Atlas/Dossier Real-Shaped Responses
// ============================================================================

describe('AC-9: Real Response Shapes', () => {
  let registry, traceStore, traceService, runner;

  beforeEach(async () => {
    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);
    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceService = new TraceService({ store: traceStore });
    runner = new ToolRunner({ registry, trace: traceService });
    registerR1Handlers(runner, traceService);
  });

  it('summarize_parcel_casefile returns dossier-shaped result', async () => {
    mockFetch({ parcelId: 'R12345', summary: 'Residential parcel', assessmentHistory: [{ year: 2025, value: 300000 }], notes: [], evidenceItems: [] });

    const result = await runner.execute({
      toolId: 'summarize_parcel_casefile',
      params: { parcelId: 'R12345', county: 'benton' },
      context: museContext(),
    });

    assert.ok(result.ok, `Casefile query failed: ${result.error}`);
    assert.ok(result.result, 'Result must have data');
    assert.ok(result.correlationId, 'Must have correlationId');
  });

  it('query_parcel_layers returns atlas-shaped result', async () => {
    mockFetch({ parcelId: 'R12345', layers: [{ id: 'zoning', name: 'Zoning', type: 'vector' }], county: 'benton' });

    const result = await runner.execute({
      toolId: 'query_parcel_layers',
      params: { parcelId: 'R12345', county: 'benton' },
      context: pilotContext(),
    });

    assert.ok(result.ok, `Layer query failed: ${result.error}`);
    assert.ok(result.result, 'Result must have data');
  });
});

// ============================================================================
// AC-10: 10 Real Handlers, No Canned Markers
// ============================================================================

describe('AC-10: Real Handler Registry', () => {
  let registry, traceStore, traceService, runner;

  beforeEach(async () => {
    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);
    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceService = new TraceService({ store: traceStore });
    runner = new ToolRunner({ registry, trace: traceService });
    registerR1Handlers(runner, traceService);
  });

  it('runner has >= 15 registered handlers (10 R1 + 5 R2)', () => {
    const handlers = runner.getRegisteredHandlers();
    assert.ok(handlers.length >= 15, `Expected >= 15 handlers (10 R1 + 5 R2), got ${handlers.length}`);
  });

  it('proof tools produce real-shaped output without canned markers', async () => {
    const readOnlyTools = [
      { toolId: 'explain_value_change', mode: 'muse', params: { parcelId: 'R12345', county: 'benton' }, mockData: { parcelId: 'R12345', currentValue: 325000, previousValue: 310000, changeAmount: 15000, changePercent: 4.84, factors: ['market'], taxYear: 2026, assessmentDate: '2026-01-01' } },
      { toolId: 'summarize_levy_rate_components', mode: 'muse', params: { districtId: 'D001', county: 'benton' }, mockData: { districtId: 'D001', totalRate: 10.5, components: [], county: 'benton', effectiveDate: '2026-01-01', rateLimit: 15.0, utilizationPercent: 70.0 } },
      { toolId: 'summarize_parcel_casefile', mode: 'muse', params: { parcelId: 'R12345', county: 'benton' }, mockData: { parcelId: 'R12345', summary: 'test', assessmentHistory: [] } },
    ];

    for (const t of readOnlyTools) {
      mockFetch(t.mockData);
      const ctx = t.mode === 'pilot' ? pilotContext() : museContext();
      const result = await runner.execute({ toolId: t.toolId, params: t.params, context: ctx });
      assert.ok(result.ok, `${t.toolId} failed: ${result.error}`);

      const resultStr = JSON.stringify(result.result);
      assert.ok(!resultStr.includes('[CANNED]'), `${t.toolId} has canned marker`);
      assert.ok(!resultStr.includes('[STUB]'), `${t.toolId} has stub marker`);
    }
  });
});

// ============================================================================
// AC-11: Mode Classification, Risk Levels, Error Codes
// ============================================================================

describe('AC-11: Mode/Risk/Error Classification', () => {
  let registry, traceStore, traceService, runner;

  beforeEach(async () => {
    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);
    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceService = new TraceService({ store: traceStore });
    runner = new ToolRunner({ registry, trace: traceService });
    registerR1Handlers(runner, traceService);
  });

  it('pilot-mode tool rejects muse-mode context', async () => {
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'R12345', taxYear: 2026 },
      context: museContext({ confirmation: true, reasonCode: 'annual_certification' }),
    });

    assert.equal(result.ok, false);
    assert.equal(result.errorCode, 'MODE_MISMATCH');
  });

  it('muse-mode tool rejects pilot-mode context', async () => {
    const result = await runner.execute({
      toolId: 'explain_value_change',
      params: { parcelId: 'R12345', county: 'benton' },
      context: pilotContext(),
    });

    assert.equal(result.ok, false);
    assert.equal(result.errorCode, 'MODE_MISMATCH');
  });

  it('risk levels are correctly assigned in manifest', () => {
    const writeHigh = registry.getTool('run_valuation_model');
    assert.equal(writeHigh.risk, 'write_high');

    const readOnly = registry.getTool('explain_value_change');
    assert.equal(readOnly.risk, 'read_only');

    const writeLow = registry.getTool('add_dossier_note');
    assert.equal(writeLow.risk, 'write_low');
  });

  it('error codes are machine-readable UPPER_SNAKE strings', async () => {
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'R12345', taxYear: 2026 },
      context: museContext(),
    });

    assert.equal(result.ok, false);
    assert.ok(typeof result.errorCode === 'string');
    assert.ok(result.errorCode.length > 0);
    assert.ok(/^[A-Z_]+$/.test(result.errorCode), `Error code should be UPPER_SNAKE: ${result.errorCode}`);
  });
});
