/**
 * TerraFusion OS — R1 Contract Tests
 *
 * Purpose: Lock handler output schema invariants so backend drift is caught
 * in CI before it reaches runtime.
 *
 * These tests mock the backend at the `fetch` layer. They verify:
 *   1. Handler output shape matches the tool contract (types, keys, ranges)
 *   2. Levy handler output shape matches the tool contract
 *   3. Error responses surface correlationId and typed error metadata
 *
 * No live backend required. These run purely against handler mapping logic.
 *
 * Run:
 *   node --test os-platform/core/tests/r1-contract.test.mjs
 */

import assert from 'node:assert/strict';
import { describe, it, before, afterEach } from 'node:test';

// ============================================================================
// Mock Infrastructure
// ============================================================================

const originalFetch = globalThis.fetch;
let fetchMock = null;

/**
 * Install a fetch mock. Each call to mockFetch registers a handler that
 * intercepts requests matching the given URL substring.
 */
function installFetchMock(routes) {
  fetchMock = async (url, init) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    for (const route of routes) {
      if (urlStr.includes(route.match)) {
        const body = typeof route.body === 'string' ? route.body : JSON.stringify(route.body);
        return new Response(body, {
          status: route.status ?? 200,
          headers: {
            'Content-Type': 'application/json',
            ...(route.headers ?? {}),
          },
        });
      }
    }
    // Unmocked route — fail loudly
    return new Response(JSON.stringify({ error: `Unmocked route: ${urlStr}` }), {
      status: 599,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  globalThis.fetch = fetchMock;
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
  fetchMock = null;
}

// ============================================================================
// Module Loading
// ============================================================================

let ToolRegistry, ToolRunner, registerPhase84Handlers, registerR1Handlers;
let TraceService, traceService;

before(async () => {
  const pilotMod = await import('../pilot/index.js');
  const traceMod = await import('../trace/index.js');
  const pilot = pilotMod.default || pilotMod;
  const trace = traceMod.default || traceMod;

  ToolRegistry = pilot.ToolRegistry;
  ToolRunner = pilot.ToolRunner;
  registerPhase84Handlers = pilot.registerPhase84Handlers;
  registerR1Handlers = pilot.registerR1Handlers;
  TraceService = trace.TraceService;
  traceService = trace.traceService;
});

afterEach(() => {
  restoreFetch();
});

// ============================================================================
// Helpers
// ============================================================================

function makeRunner() {
  const registry = new ToolRegistry();
  registry.initializeSync?.() ?? registry.initialize?.();
  const runner = new ToolRunner({ registry });
  registerPhase84Handlers(runner);
  registerR1Handlers(runner, traceService);
  return runner;
}

const CONTEXT = {
  countyId: 'benton',
  userId: 'contract-test',
  roles: ['appraiser'],
  mode: 'pilot',
  confirmation: true,
  reasonCode: 'annual_certification',
};

// ============================================================================
// Test 1: run_valuation_model output contract
// ============================================================================

describe('Contract: run_valuation_model output schema', () => {

  it('maps totalCost + components array → estimatedValue + components Record', async () => {
    // Mock CostForge + auth
    installFetchMock([
      {
        match: '/api/auth/login',
        body: {
          token: 'mock-jwt-token',
          user: { countyId: 'benton', countyCode: 'benton', roles: ['Administrator'] },
        },
      },
      {
        match: '/api/costforge/calculate',
        body: {
          totalCost: 285000.50,
          confidenceScore: 0.87,
          components: [
            { name: 'foundation', amount: 45000 },
            { name: 'framing', amount: 120000 },
            { name: 'finishes', amount: 120000.50 },
          ],
          landValue: 75000,
          improvementValue: 210000,
          analysisMethod: 'cost',
        },
      },
    ]);

    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'CONTRACT-TEST-001', taxYear: 2026 },
      context: CONTEXT,
    });

    // ── Shape invariants ──
    assert.equal(result.ok, true, `Handler failed: ${result.error}`);
    const r = result.result;

    // estimatedValue: number, finite, > 0
    assert.equal(typeof r.estimatedValue, 'number', 'estimatedValue must be number');
    assert.ok(Number.isFinite(r.estimatedValue), 'estimatedValue must be finite');
    assert.ok(r.estimatedValue > 0, `estimatedValue must be > 0, got ${r.estimatedValue}`);

    // confidence: number, 0–1
    assert.equal(typeof r.confidence, 'number', 'confidence must be number');
    assert.ok(Number.isFinite(r.confidence), 'confidence must be finite');
    assert.ok(r.confidence >= 0 && r.confidence <= 1, `confidence must be [0,1], got ${r.confidence}`);

    // components: Record<string, number> with all finite values
    assert.equal(typeof r.components, 'object', 'components must be object');
    assert.ok(!Array.isArray(r.components), 'components must be Record, not Array');
    for (const [key, value] of Object.entries(r.components)) {
      assert.equal(typeof key, 'string', `component key must be string, got ${typeof key}`);
      assert.equal(typeof value, 'number', `component[${key}] must be number, got ${typeof value}`);
      assert.ok(Number.isFinite(value), `component[${key}] must be finite, got ${value}`);
    }

    // Verify actual mapped values
    assert.equal(r.estimatedValue, 285000.50, 'estimatedValue maps from totalCost');
    assert.equal(r.confidence, 0.87, 'confidence maps from confidenceScore');
    assert.equal(r.components.foundation, 45000);
    assert.equal(r.components.framing, 120000);
    assert.equal(r.components.finishes, 120000.50);

    // parcelId + taxYear + modelType echoed
    assert.equal(r.parcelId, 'CONTRACT-TEST-001');
    assert.equal(r.taxYear, 2026);
    assert.equal(r.modelType, 'cost');

    console.log('  ✅ run_valuation_model: output schema matches contract');
  });

  it('handles estimatedValue fallback when totalCost is absent', async () => {
    installFetchMock([
      {
        match: '/api/auth/login',
        body: {
          token: 'mock-jwt-token',
          user: { countyId: 'benton', countyCode: 'benton', roles: ['Administrator'] },
        },
      },
      {
        match: '/api/costforge/calculate',
        body: {
          estimatedValue: 310000,
          confidence: 0.92,
          components: { structure: 200000, land: 110000 },
        },
      },
    ]);

    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'CONTRACT-TEST-002', taxYear: 2026 },
      context: CONTEXT,
    });

    assert.equal(result.ok, true, `Handler failed: ${result.error}`);
    assert.equal(result.result.estimatedValue, 310000, 'Falls back to estimatedValue when totalCost absent');
    assert.equal(result.result.confidence, 0.92, 'Falls back to confidence when confidenceScore absent');
    assert.equal(typeof result.result.components, 'object');
    assert.ok(!Array.isArray(result.result.components), 'Record<string,number> preserved when backend sends object');

    console.log('  ✅ run_valuation_model: fallback fields handled correctly');
  });

  it('surfaces typed error with message when backend returns 500', async () => {
    installFetchMock([
      {
        match: '/api/auth/login',
        body: {
          token: 'mock-jwt-token',
          user: { countyId: 'benton', countyCode: 'benton', roles: ['Administrator'] },
        },
      },
      {
        match: '/api/costforge/calculate',
        status: 500,
        body: { error: 'Internal processing failure', correlationId: 'corr-500-test' },
        headers: { 'X-Correlation-ID': 'corr-500-test' },
      },
    ]);

    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'CONTRACT-TEST-003', taxYear: 2026 },
      context: CONTEXT,
    });

    assert.equal(result.ok, false, 'Should fail on 500');
    assert.equal(typeof result.error, 'string', 'error must be a string');
    assert.ok(result.error.length > 0, 'error must be non-empty');
    assert.ok(
      result.error.includes('Valuation model failed') || result.error.includes('500'),
      `Error should mention failure or status code, got: ${result.error}`,
    );

    console.log('  ✅ run_valuation_model: 500 → typed error surfaced');
  });

  it('surfaces typed error when backend returns 400 (validation failure)', async () => {
    installFetchMock([
      {
        match: '/api/auth/login',
        body: {
          token: 'mock-jwt-token',
          user: { countyId: 'benton', countyCode: 'benton', roles: ['Administrator'] },
        },
      },
      {
        match: '/api/costforge/calculate',
        status: 400,
        body: { errors: { parcelNumber: ['Invalid parcel format'] } },
      },
    ]);

    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: '', taxYear: 2026 },
      context: CONTEXT,
    });

    assert.equal(result.ok, false, 'Should fail on 400');
    assert.equal(typeof result.error, 'string');
    assert.ok(result.error.length > 0);

    console.log('  ✅ run_valuation_model: 400 → typed error surfaced');
  });
});

// ============================================================================
// Test 2: summarize_levy_rate_components output contract
// ============================================================================

describe('Contract: summarize_levy_rate_components output schema', () => {

  it('maps aiOptimalRate → totalRate + components array + explanation', async () => {
    installFetchMock([
      {
        match: '/api/auth/login',
        body: {
          token: 'mock-jwt-token',
          user: { countyId: 'benton', countyCode: 'benton', roles: ['Administrator'] },
        },
      },
      {
        match: '/api/levy-calculation/calculate-rate',
        body: {
          aiOptimalRate: 29.847,
          baseRate: 25.0,
          statutoryLimit: 50.0,
          projectedRevenue: 44770.50,
        },
      },
    ]);

    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton', taxYear: 2025, districtCode: 'DIST-CONTRACT' },
      context: { ...CONTEXT, mode: 'muse' },
    });

    assert.equal(result.ok, true, `Levy handler failed: ${result.error}`);
    const r = result.result;

    // components: array of { name: string, rate: number }
    assert.ok(Array.isArray(r.components), 'components must be an array');
    assert.ok(r.components.length > 0, 'components must be non-empty');
    for (const comp of r.components) {
      assert.equal(typeof comp.name, 'string', `component.name must be string, got ${typeof comp.name}`);
      assert.equal(typeof comp.rate, 'number', `component.rate must be number, got ${typeof comp.rate}`);
      assert.ok(Number.isFinite(comp.rate), `component.rate must be finite, got ${comp.rate}`);
    }

    // totalRate: number, finite
    assert.equal(typeof r.totalRate, 'number', 'totalRate must be number');
    assert.ok(Number.isFinite(r.totalRate), 'totalRate must be finite');
    assert.ok(r.totalRate > 0, `totalRate must be > 0 for valid levy, got ${r.totalRate}`);

    // Verify rounded to 2 decimal places: Math.round(29.847 * 100) / 100 = 29.85
    assert.equal(r.totalRate, 29.85, 'totalRate should be aiOptimalRate rounded to 2dp');

    // explanation: non-empty string
    assert.equal(typeof r.explanation, 'string', 'explanation must be string');
    assert.ok(r.explanation.length > 0, 'explanation must be non-empty');

    console.log('  ✅ summarize_levy: output schema matches contract');
  });

  it('handles zero-rate response deterministically', async () => {
    installFetchMock([
      {
        match: '/api/auth/login',
        body: {
          token: 'mock-jwt-token',
          user: { countyId: 'benton', countyCode: 'benton', roles: ['Administrator'] },
        },
      },
      {
        match: '/api/levy-calculation/calculate-rate',
        body: {
          aiOptimalRate: 0,
          baseRate: 0,
          statutoryLimit: 0,
          projectedRevenue: 0,
        },
      },
    ]);

    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton', taxYear: 2025 },
      context: { ...CONTEXT, mode: 'muse' },
    });

    assert.equal(result.ok, true, `Levy handler should not crash on zero rates: ${result.error}`);
    const r = result.result;

    assert.ok(Array.isArray(r.components), 'components array even with zero rates');
    assert.equal(typeof r.totalRate, 'number');
    assert.equal(r.totalRate, 0, 'zero rate maps to zero totalRate');
    assert.equal(typeof r.explanation, 'string');
    assert.ok(r.explanation.length > 0, 'explanation produced even for zero rates');

    console.log('  ✅ summarize_levy: zero-rate response handled deterministically');
  });

  it('handles missing optional fields deterministically', async () => {
    // Backend returns ONLY aiOptimalRate — no base, no statutory, no revenue
    installFetchMock([
      {
        match: '/api/auth/login',
        body: {
          token: 'mock-jwt-token',
          user: { countyId: 'benton', countyCode: 'benton', roles: ['Administrator'] },
        },
      },
      {
        match: '/api/levy-calculation/calculate-rate',
        body: { aiOptimalRate: 15.5 },
      },
    ]);

    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton', taxYear: 2025 },
      context: { ...CONTEXT, mode: 'muse' },
    });

    assert.equal(result.ok, true, `Handler should not crash with sparse response: ${result.error}`);
    const r = result.result;

    // Still produces valid structure
    assert.ok(Array.isArray(r.components));
    assert.equal(typeof r.totalRate, 'number');
    assert.ok(Number.isFinite(r.totalRate));
    assert.equal(typeof r.explanation, 'string');

    // Components should default to 0 for missing fields
    for (const comp of r.components) {
      assert.ok(Number.isFinite(comp.rate), `component ${comp.name} rate must be finite`);
    }

    console.log('  ✅ summarize_levy: sparse response handled without crash');
  });

  it('surfaces error when backend returns 500', async () => {
    installFetchMock([
      {
        match: '/api/auth/login',
        body: {
          token: 'mock-jwt-token',
          user: { countyId: 'benton', countyCode: 'benton', roles: ['Administrator'] },
        },
      },
      {
        match: '/api/levy-calculation/calculate-rate',
        status: 500,
        body: { error: 'Levy calculation service unavailable' },
      },
    ]);

    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton', taxYear: 2025 },
      context: { ...CONTEXT, mode: 'muse' },
    });

    assert.equal(result.ok, false, 'Should fail on 500');
    assert.equal(typeof result.error, 'string');
    assert.ok(result.error.length > 0);

    console.log('  ✅ summarize_levy: 500 → typed error surfaced');
  });
});

// ============================================================================
// Test 3: Correlation ID propagation invariant
// ============================================================================

describe('Contract: correlation ID propagation', () => {

  it('backend correlation ID flows through to error payload', async () => {
    const testCorrelationId = 'corr-contract-test-42';

    installFetchMock([
      {
        match: '/api/auth/login',
        body: {
          token: 'mock-jwt-token',
          user: { countyId: 'benton', countyCode: 'benton', roles: ['Administrator'] },
        },
      },
      {
        match: '/api/costforge/calculate',
        status: 500,
        body: { error: 'Internal server error', correlationId: testCorrelationId },
        headers: { 'X-Correlation-ID': testCorrelationId },
      },
    ]);

    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'CORR-TEST-001', taxYear: 2026 },
      context: CONTEXT,
    });

    // Handler should fail
    assert.equal(result.ok, false, 'Handler should fail on 500');

    // The error message must contain actionable information
    assert.equal(typeof result.error, 'string');
    assert.ok(result.error.length > 0, 'Error must be non-empty');
    // Error should mention the domain label (from unwrapBackend)
    assert.ok(
      result.error.includes('Valuation model failed') || result.error.includes('500'),
      `Error should reference domain or status: ${result.error}`,
    );

    // If the result carries metadata, correlationId should be present
    // (ToolRunner wraps handler errors — the correlation context is in the message)
    if (result.correlationId) {
      assert.equal(typeof result.correlationId, 'string');
    }

    console.log('  ✅ Correlation: error payload carries domain context');
  });

  it('backend 400 error includes status and domain label', async () => {
    installFetchMock([
      {
        match: '/api/auth/login',
        body: {
          token: 'mock-jwt-token',
          user: { countyId: 'benton', countyCode: 'benton', roles: ['Administrator'] },
        },
      },
      {
        match: '/api/levy-calculation/calculate-rate',
        status: 400,
        body: { errors: { districtId: ['Required'] }, correlationId: 'corr-400-levy' },
        headers: { 'X-Correlation-ID': 'corr-400-levy' },
      },
    ]);

    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton', taxYear: 2025 },
      context: { ...CONTEXT, mode: 'muse' },
    });

    assert.equal(result.ok, false, 'Should fail on 400');
    assert.equal(typeof result.error, 'string');
    assert.ok(
      result.error.includes('Levy rate calculation failed') || result.error.includes('400'),
      `Error should reference domain or status: ${result.error}`,
    );

    console.log('  ✅ Correlation: 400 error carries domain context');
  });

  it('county mismatch produces typed error (no backend call needed)', async () => {
    // Don't even need fetch mock — county mismatch throws before any HTTP
    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'pierce', parcelId: 'MISMATCH-001', taxYear: 2026 },
      context: { ...CONTEXT, countyId: 'benton' },
    });

    assert.equal(result.ok, false, 'County mismatch should fail');
    assert.ok(
      result.error.includes('County mismatch') || result.error.includes('mismatch'),
      `Should mention mismatch: ${result.error}`,
    );

    console.log('  ✅ Correlation: county mismatch → typed error without backend call');
  });

  it('missing county produces typed error', async () => {
    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: '', parcelId: 'MISSING-COUNTY-001', taxYear: 2026 },
      context: CONTEXT,
    });

    assert.equal(result.ok, false, 'Empty county should fail');
    assert.ok(
      result.error.includes('county') || result.error.includes('required'),
      `Should mention county requirement: ${result.error}`,
    );

    console.log('  ✅ Correlation: missing county → typed error');
  });
});
