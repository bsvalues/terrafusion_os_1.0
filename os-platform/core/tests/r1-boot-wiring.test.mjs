/**
 * TerraFusion OS – R1 Boot Wiring Test
 *
 * Validates that registerR1Handlers properly overrides canned Phase 8.4 stubs.
 * Ensures the execution spine is wired: when real handlers are registered,
 * they replace the canned handlers for the same toolIds.
 *
 * This is a critical integration test for AC-1/AC-4 (governed execution path).
 */

import assert from 'node:assert/strict';
import { before, afterEach, describe, it } from 'node:test';

let ToolRegistry,
  ToolRunner,
  registerPhase84Handlers,
  registerR1Handlers,
  TraceService,
  traceService;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const traceModule = await import('../trace/index.js');

  const pilot = pilotModule.default || pilotModule;
  const trace = traceModule.default || traceModule;

  ToolRegistry = pilot.ToolRegistry;
  ToolRunner = pilot.ToolRunner;
  registerPhase84Handlers = pilot.registerPhase84Handlers;
  registerR1Handlers = pilot.registerR1Handlers;
  TraceService = trace.TraceService;
  traceService = trace.traceService;
});

// ── Helpers ──────────────────────────────────────────────────────────

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

const R1_MVP_TOOL_IDS = [
  'run_valuation_model',
  'explain_value_change',
  'route_to_parcel',
  'search_trace_by_correlation',
  'summarize_levy_rate_components',
];

const R1_WEEK3_TOOL_IDS = [
  'explain_model_inputs',
  'compare_assessed_value_history',
  'summarize_parcel_casefile',
  'add_dossier_note',
  'query_parcel_layers',
];

// ══════════════════════════════════════════════════════════════════════
// Registration Tests
// ══════════════════════════════════════════════════════════════════════

describe('R1 Boot Wiring', () => {
  it('registerR1Handlers registers all 10 real handlers', async () => {
    const registry = new ToolRegistry();
    await registry.initialize();
    const runner = new ToolRunner({ registry });

    // First register canned handlers (baseline)
    registerPhase84Handlers(runner);
    const cannedHandlers = runner.getRegisteredHandlers();

    // Now override with R1 real handlers
    registerR1Handlers(runner, traceService);
    const realHandlers = runner.getRegisteredHandlers();

    // All 10 R1 tool IDs should be registered
    for (const toolId of [...R1_MVP_TOOL_IDS, ...R1_WEEK3_TOOL_IDS]) {
      assert.ok(
        realHandlers.includes(toolId),
        `Expected ${toolId} to be registered after registerR1Handlers`
      );
    }
  });

  it('R1 real handlers override canned stubs (run_valuation_model calls backend)', async () => {
    const registry = new ToolRegistry();
    await registry.initialize();
    const runner = new ToolRunner({ registry });

    registerPhase84Handlers(runner);
    registerR1Handlers(runner, traceService);

    // Mock backend response for CostForge
    mockFetch({
      estimatedValue: 250000,
      confidence: 0.88,
      components: { land: 100000, improvements: 150000 },
    });

    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: {
        county: 'benton',
        parcelId: 'R-001',
        taxYear: 2026,
      },
      context: {
        countyId: 'benton',
        userId: 'test-user',
        roles: ['appraiser'],
        mode: 'pilot',
        confirmation: true,
        reasonCode: 'annual_certification',
      },
    });

    assert.ok(result.ok, `Expected ok=true, got error: ${result.error}`);
    assert.equal(result.result.estimatedValue, 250000);
    assert.equal(result.result.confidence, 0.88);
  });

  it('search_trace_by_correlation uses real TraceService', async () => {
    const registry = new ToolRegistry();
    await registry.initialize();
    const localTrace = new TraceService();
    const runner = new ToolRunner({ registry, trace: localTrace });

    registerR1Handlers(runner, localTrace);

    // Emit a test trace event so there's data to find
    const testCorrelationId = 'test-corr-123';
    localTrace.emitWithPiiHandling(
      {
        type: 'tool_invoked',
        toolId: 'test_tool',
        correlationId: testCorrelationId,
        context: { countyId: 'benton', userId: 'test', roles: ['appraiser'], mode: 'pilot' },
        summary: 'Test event',
      },
      'none'
    );

    const result = await runner.execute({
      toolId: 'search_trace_by_correlation',
      params: { county: 'benton', correlationId: testCorrelationId },
      context: {
        countyId: 'benton',
        userId: 'test-user',
        roles: ['administrator'],
        mode: 'pilot',
      },
    });

    assert.ok(result.ok, `Expected ok=true, got error: ${result.error}`);
    assert.ok(result.result.found, 'Expected found=true for matching correlationId');
    assert.ok(result.result.events.length > 0, 'Expected at least one event');
  });

  it('summarize_levy_rate_components calls real backend', async () => {
    const registry = new ToolRegistry();
    await registry.initialize();
    const runner = new ToolRunner({ registry });

    registerR1Handlers(runner, traceService);

    mockFetch({
      components: [
        { name: 'State School', rate: 3.12 },
        { name: 'Local School', rate: 2.45 },
        { name: 'County General', rate: 1.85 },
      ],
      totalRate: 7.42,
    });

    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton', taxYear: 2026 },
      context: {
        countyId: 'benton',
        userId: 'test-user',
        roles: ['appraiser'],
        mode: 'muse',
      },
    });

    assert.ok(result.ok, `Expected ok=true, got error: ${result.error}`);
    assert.equal(result.result.totalRate, 7.42);
    assert.equal(result.result.components.length, 3);
    assert.ok(result.result.explanation.includes('2026'));
  });
});
