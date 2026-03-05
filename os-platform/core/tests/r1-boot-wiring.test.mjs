/**
 * TerraFusion OS – R1 Boot Wiring Tests
 *
 * Validates that the conditional activation logic works:
 *   - When TF_API_BASE_URL is set → real R1 handlers are registered (override stubs)
 *   - When TF_API_BASE_URL is NOT set → canned Phase 8.4 stubs remain active
 *
 * Narrow smoke: 3 tools hit mocked backend to prove wiring is live:
 *   1. run_valuation_model       → POST /api/costforge/calculate
 *   2. search_trace_by_correlation → real TraceService.getByCorrelationId()
 *   3. summarize_levy_rate_components → POST /api/levy-calculation/calculate-rate
 *
 * These tests use globalThis.fetch mocking (same pattern as r1-handlers.test.mjs)
 * to simulate backend responses without requiring a running .NET process.
 */

import assert from 'node:assert/strict';
import { before, after, afterEach, describe, it } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOOLS_JSON = path.resolve(__dirname, '..', '..', '..', 'tools/registry/terrapilot.tools.json');

let ToolRegistry, ToolRunner;
let registerPhase84Handlers, registerR1Handlers;
let TraceService;

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
});

// ── Mock Helpers ─────────────────────────────────────────────────────

const originalFetch = globalThis.fetch;

/** Mock a successful backend JSON response */
function mockFetch(data, status = 200) {
  globalThis.fetch = async (url, opts) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    text: async () => JSON.stringify(data),
  });
}

/** Mock a network failure (backend unreachable) */
function mockFetchError(message = 'ECONNREFUSED') {
  globalThis.fetch = async () => {
    throw new Error(message);
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

/** Muse-mode tools: summarize_levy_rate_components, compare_assessed_value_history, etc. */
const BENTON_MUSE = {
  countyId: 'benton',
  userId: 'appraiser-001',
  sessionId: 'sess-boot-test',
  roles: ['appraiser'],
  mode: 'muse',
};

/** Pilot-mode tools: run_valuation_model, search_trace_by_correlation, etc. */
const BENTON_PILOT = {
  countyId: 'benton',
  userId: 'appraiser-001',
  sessionId: 'sess-boot-test',
  roles: ['appraiser'],
  mode: 'pilot',
};

// ══════════════════════════════════════════════════════════════════════
// 1. Conditional Activation: Stub vs Live mode
// ══════════════════════════════════════════════════════════════════════

describe('Boot Wiring: Conditional Activation', () => {
  it('stub mode: summarize_levy_rate_components returns hardcoded data (no fetch)', async () => {
    // Register ONLY Phase 8.4 stubs — no R1 real handlers
    const registry = new ToolRegistry();
    await registry.initialize(TOOLS_JSON);
    const runner = new ToolRunner({ registry });
    registerPhase84Handlers(runner);

    // Stubs never call fetch — mock fetch to detect if called
    let fetchCalled = false;
    globalThis.fetch = async () => {
      fetchCalled = true;
      return { ok: true, status: 200, text: async () => '{}' };
    };

    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton', taxYear: 2026 },
      context: BENTON_MUSE,
    });

    assert.equal(result.ok, true, 'stub should succeed');
    assert.equal(fetchCalled, false, 'stub should NOT call fetch');
    // Stubs return hardcoded rates
    assert.ok(result.result.components.length > 0, 'stub returns components');
    assert.ok(result.result.totalRate > 0, 'stub returns totalRate');
  });

  it('live mode: summarize_levy_rate_components calls real backend via fetch', async () => {
    // Register Phase 8.4 stubs THEN R1 real handlers (override)
    const registry = new ToolRegistry();
    await registry.initialize(TOOLS_JSON);
    const runner = new ToolRunner({ registry });
    registerPhase84Handlers(runner);

    const traceService = new TraceService();
    registerR1Handlers(runner, traceService);

    // Mock the backend response
    mockFetch({
      components: [
        { name: 'State Schools', rate: 3.12 },
        { name: 'County General', rate: 1.85 },
      ],
      totalRate: 4.97,
    });

    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton', taxYear: 2026 },
      context: BENTON_MUSE,
    });

    assert.equal(result.ok, true, 'real handler should succeed');
    // Real handler returns data from mocked backend
    assert.equal(result.result.totalRate, 4.97);
    assert.equal(result.result.components.length, 2);
  });

  it('live mode overrides stub for same toolId', async () => {
    const registry = new ToolRegistry();
    await registry.initialize(TOOLS_JSON);
    const runner = new ToolRunner({ registry });

    // Register stubs first
    registerPhase84Handlers(runner);

    // Get stub result
    let stubResult;
    {
      let fetchCalled = false;
      globalThis.fetch = async () => {
        fetchCalled = true;
        return { ok: true, status: 200, text: async () => '{}' };
      };
      stubResult = await runner.execute({
        toolId: 'summarize_levy_rate_components',
        params: { county: 'benton', taxYear: 2026 },
        context: BENTON_MUSE,
      });
      assert.equal(fetchCalled, false, 'stub does not call fetch');
    }

    // Now register R1 real handlers (override)
    const traceService = new TraceService();
    registerR1Handlers(runner, traceService);

    // Get real result
    mockFetch({
      components: [{ name: 'Override Test', rate: 9.99 }],
      totalRate: 9.99,
    });

    const realResult = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton', taxYear: 2026 },
      context: BENTON_MUSE,
    });

    assert.equal(realResult.ok, true);
    // After R1 registration, the real handler's response should differ from stub
    assert.equal(realResult.result.totalRate, 9.99, 'real handler overrides stub');
    assert.notEqual(
      stubResult.result.totalRate,
      realResult.result.totalRate,
      'stub and real return different values'
    );
  });
});

// ══════════════════════════════════════════════════════════════════════
// 2. Narrow Smoke: run_valuation_model → POST /api/costforge/calculate
// ══════════════════════════════════════════════════════════════════════

describe('Boot Wiring Smoke: run_valuation_model', () => {
  let runner;

  before(async () => {
    const registry = new ToolRegistry();
    await registry.initialize(TOOLS_JSON);
    runner = new ToolRunner({ registry });
    registerPhase84Handlers(runner);
    const traceService = new TraceService();
    registerR1Handlers(runner, traceService);
  });

  it('returns valuation from mocked backend POST', async () => {
    mockFetch({
      estimatedValue: 325000,
      confidence: 0.92,
      components: { land: 150000, improvements: 175000 },
    });

    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'R12345', taxYear: 2026 },
      context: { ...BENTON_PILOT, confirmation: true, reasonCode: 'annual_certification' },
    });

    assert.equal(result.ok, true);
    assert.equal(result.result.parcelId, 'R12345');
    assert.equal(result.result.estimatedValue, 325000);
    assert.equal(result.result.confidence, 0.92);
    assert.deepEqual(result.result.components, { land: 150000, improvements: 175000 });
  });

  it('enforces county isolation (county mismatch → error)', async () => {
    mockFetch({});

    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'clark', parcelId: 'R12345', taxYear: 2026 },
      context: { ...BENTON_PILOT, confirmation: true, reasonCode: 'annual_certification' },
    });

    assert.equal(result.ok, false, 'county mismatch should fail');
    assert.ok(
      result.error?.includes('County mismatch') || result.error?.includes('county'),
      `error should mention county: ${result.error}`
    );
  });

  it('propagates backend errors cleanly', async () => {
    mockFetch({ error: 'internal server error' }, 500);

    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'R12345', taxYear: 2026 },
      context: { ...BENTON_PILOT, confirmation: true, reasonCode: 'annual_certification' },
    });

    assert.equal(result.ok, false, 'backend 500 should propagate as error');
  });
});

// ══════════════════════════════════════════════════════════════════════
// 3. Narrow Smoke: search_trace_by_correlation → real TraceService
// ══════════════════════════════════════════════════════════════════════

describe('Boot Wiring Smoke: search_trace_by_correlation', () => {
  let runner;
  let traceService;

  before(async () => {
    const registry = new ToolRegistry();
    await registry.initialize(TOOLS_JSON);
    runner = new ToolRunner({ registry });
    registerPhase84Handlers(runner);
    traceService = new TraceService();
    registerR1Handlers(runner, traceService);
  });

  it('returns real trace events from TraceService', async () => {
    // Emit trace events into the real TraceService
    traceService.emit({
      type: 'tool_invoked',
      toolId: 'run_valuation_model',
      correlationId: 'boot-test-corr-001',
      summary: 'valuation invoked',
      context: { countyId: 'benton', userId: 'u1', sessionId: 's1' },
    });
    traceService.emit({
      type: 'tool_succeeded',
      toolId: 'run_valuation_model',
      correlationId: 'boot-test-corr-001',
      summary: 'valuation succeeded',
      context: { countyId: 'benton', userId: 'u1', sessionId: 's1' },
    });

    const result = await runner.execute({
      toolId: 'search_trace_by_correlation',
      params: { county: 'benton', correlationId: 'boot-test-corr-001' },
      context: BENTON_PILOT,
    });

    assert.equal(result.ok, true);
    assert.equal(result.result.found, true);
    assert.equal(result.result.events.length, 2);
    const types = result.result.events.map(e => e.type).sort();
    assert.deepEqual(types, ['tool_invoked', 'tool_succeeded']);
  });

  it('returns found:false for nonexistent correlationId', async () => {
    const result = await runner.execute({
      toolId: 'search_trace_by_correlation',
      params: { county: 'benton', correlationId: 'nonexistent-boot-test' },
      context: BENTON_PILOT,
    });

    assert.equal(result.ok, true);
    assert.equal(result.result.found, false);
    assert.equal(result.result.events.length, 0);
  });

  it('returns metadata only (no summary/context leakage)', async () => {
    traceService.emit({
      type: 'tool_invoked',
      toolId: 'summarize_levy_rate_components',
      correlationId: 'boot-test-meta-check',
      summary: 'sensitive_internal_data',
      context: { countyId: 'benton', userId: 'u1', sessionId: 's1' },
    });

    const result = await runner.execute({
      toolId: 'search_trace_by_correlation',
      params: { county: 'benton', correlationId: 'boot-test-meta-check' },
      context: BENTON_PILOT,
    });

    assert.equal(result.ok, true);
    const event = result.result.events[0];
    assert.ok(typeof event.ts === 'number', 'has timestamp');
    assert.ok(typeof event.type === 'string', 'has type');
    assert.equal(event.summary, undefined, 'summary must not leak through');
    assert.equal(event.context, undefined, 'context must not leak through');
  });
});

// ══════════════════════════════════════════════════════════════════════
// 4. Narrow Smoke: summarize_levy_rate_components → POST /api/levy-calculation/calculate-rate
// ══════════════════════════════════════════════════════════════════════

describe('Boot Wiring Smoke: summarize_levy_rate_components', () => {
  let runner;

  before(async () => {
    const registry = new ToolRegistry();
    await registry.initialize(TOOLS_JSON);
    runner = new ToolRunner({ registry });
    registerPhase84Handlers(runner);
    const traceService = new TraceService();
    registerR1Handlers(runner, traceService);
  });

  it('returns levy components from mocked backend POST', async () => {
    mockFetch({
      components: [
        { name: 'State Schools', rate: 3.12 },
        { name: 'County General', rate: 1.85 },
        { name: 'Fire District', rate: 2.45 },
      ],
      totalRate: 7.42,
    });

    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton', taxYear: 2026 },
      context: BENTON_MUSE,
    });

    assert.equal(result.ok, true);
    assert.equal(result.result.totalRate, 7.42);
    assert.equal(result.result.components.length, 3);
    // Sorted descending by rate
    assert.ok(result.result.components[0].rate >= result.result.components[1].rate);
    assert.ok(result.result.explanation.includes('2026'));
  });

  it('handles alternative districtRates response shape', async () => {
    mockFetch({
      districtRates: [
        { district: 'City of Richland', rate: 2.5 },
        { district: 'Port', rate: 0.8 },
      ],
      levyRate: 3.3,
    });

    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton', taxYear: 2026 },
      context: BENTON_MUSE,
    });

    assert.equal(result.ok, true);
    assert.equal(result.result.totalRate, 3.3);
    assert.equal(result.result.components[0].name, 'City of Richland');
  });

  it('includes district scope when districtCode provided', async () => {
    mockFetch({
      components: [{ name: 'Tax Levy', rate: 5.0 }],
      totalRate: 5.0,
    });

    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton', taxYear: 2026, districtCode: 'RICH-001' },
      context: BENTON_MUSE,
    });

    assert.equal(result.ok, true);
    assert.ok(result.result.explanation.includes('RICH-001'));
  });

  it('enforces county isolation', async () => {
    mockFetch({});

    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'clark', taxYear: 2026 },
      context: BENTON_MUSE,
    });

    assert.equal(result.ok, false);
    assert.ok(result.error?.includes('County mismatch') || result.error?.includes('county'));
  });
});
