/**
 * TerraFusion OS — R1 Fake-Path Anti-Regression Tests (CP-FAKE-01)
 *
 * Ensures the 5 proof tools (+ add_dossier_note) never silently return
 * canned fixture data. Real handlers should either succeed with live-shaped
 * data or fail honestly — never fake.
 *
 * Strategy:
 * 1. Invoke each tool with a fetch mock that returns realistic data
 * 2. Assert the response does NOT contain known canned fixture markers
 * 3. Invoke each tool with NO fetch mock (599 unmocked) and assert honest failure
 *
 * Run:
 *   node --test os-platform/core/tests/r1-fake-path-regression.test.mjs
 */

import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { afterEach, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');

let ToolRegistry, ToolRunner, registerPhase84Handlers, registerR1Handlers;
let TraceService, InMemoryTraceStore;

const originalFetch = globalThis.fetch;

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
  InMemoryTraceStore = trace.InMemoryTraceStore;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// ============================================================================
// Helpers
// ============================================================================

function makeRunner() {
  const traceStore = new InMemoryTraceStore();
  const traceService = new TraceService(traceStore);
  const registry = new ToolRegistry();
  registry.initializeSync?.() ?? registry.initialize?.(MANIFEST_PATH);
  const runner = new ToolRunner({ registry, trace: traceService });
  registerPhase84Handlers(runner);
  registerR1Handlers(runner, traceService);
  return runner;
}

function installFetchMock(routes) {
  globalThis.fetch = async (url) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    for (const route of routes) {
      if (urlStr.includes(route.match)) {
        const body = typeof route.body === 'string' ? route.body : JSON.stringify(route.body);
        return new Response(body, {
          status: route.status ?? 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    return new Response(JSON.stringify({ error: `Unmocked: ${urlStr}` }), {
      status: 599,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

/** Install a fetch mock that returns 599 for everything (no backend). */
function installDeadFetch() {
  globalThis.fetch = async (url) => {
    return new Response(JSON.stringify({ error: 'No backend' }), {
      status: 599,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

// Known canned fixture markers from old Phase 8.3/8.4 stubs
const CANNED_MARKERS = [
  'stableHash',         // Canned handlers used stableHash for fake IDs
  'CANNED-',            // Marker prefix in old canned data
  'fake-',              // Generic fake marker
  'mock-parcel',        // Test fixture parcel IDs
  'STUB_',              // Stub result markers
  'placeholder',        // Placeholder data
  '999999',             // Common canned numeric value
];

function assertNoCannedMarkers(result, toolId) {
  const json = JSON.stringify(result);
  for (const marker of CANNED_MARKERS) {
    assert.ok(
      !json.includes(marker),
      `${toolId}: response contains canned marker "${marker}" — possible fake-path regression`
    );
  }
}

const AUTH_MOCK = {
  match: '/api/auth/login',
  body: { token: 'anti-reg-jwt', user: { countyId: 'benton', countyCode: 'benton', roles: ['Administrator'] } },
};

const PILOT_CTX = {
  countyId: 'benton', userId: 'anti-reg', roles: ['appraiser'], mode: 'pilot',
  confirmation: true, reasonCode: 'annual_certification',
};

const MUSE_CTX = {
  countyId: 'benton', userId: 'anti-reg', roles: ['appraiser'], mode: 'muse',
};

// ============================================================================
// Test: Proof tools don't silently fake data
// ============================================================================

describe('CP-FAKE-01: Anti fake-path regression', () => {

  it('run_valuation_model: no canned markers in live-shaped response', async () => {
    installFetchMock([
      AUTH_MOCK,
      { match: '/api/costforge/calculate', body: { totalCost: 310000, confidenceScore: 0.89, components: [{ name: 'structure', amount: 310000 }] } },
    ]);

    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'ANTI-REG-001', taxYear: 2026 },
      context: PILOT_CTX,
    });

    assert.equal(result.ok, true, `Should succeed: ${result.error}`);
    assertNoCannedMarkers(result.result, 'run_valuation_model');
    console.log('  ✅ run_valuation_model: no canned markers');
  });

  it('run_valuation_model: fails honestly when backend unreachable', async () => {
    installDeadFetch();
    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'ANTI-REG-DEAD', taxYear: 2026 },
      context: PILOT_CTX,
    });

    assert.equal(result.ok, false, 'Must fail — not silently return canned data');
    console.log('  ✅ run_valuation_model: honest failure on dead backend');
  });

  it('explain_value_change: fails honestly when backend unreachable', async () => {
    installDeadFetch();
    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'explain_value_change',
      params: { county: 'benton', parcelId: 'EVC-DEAD', fromYear: 2024, toYear: 2025 },
      context: MUSE_CTX,
    });

    assert.equal(result.ok, false, 'Must fail honestly');
    console.log('  ✅ explain_value_change: honest failure on dead backend');
  });

  it('summarize_levy_rate_components: no canned markers', async () => {
    installFetchMock([
      AUTH_MOCK,
      { match: '/api/levy-calculation/calculate-rate', body: { aiOptimalRate: 12.5, baseRate: 10, statutoryLimit: 50, projectedRevenue: 18750 } },
    ]);

    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton', taxYear: 2025 },
      context: MUSE_CTX,
    });

    assert.equal(result.ok, true, `Should succeed: ${result.error}`);
    assertNoCannedMarkers(result.result, 'summarize_levy_rate_components');
    console.log('  ✅ summarize_levy: no canned markers');
  });

  it('summarize_parcel_casefile: no canned markers', async () => {
    installFetchMock([
      AUTH_MOCK,
      { match: '/api/dossier/parcels/', body: { summary: 'Active casefile with 2 appeals', highlights: ['2023 appeal resolved'] } },
    ]);

    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'summarize_parcel_casefile',
      params: { county: 'benton', parcelId: 'ANTI-REG-DOS' },
      context: MUSE_CTX,
    });

    assert.equal(result.ok, true, `Should succeed: ${result.error}`);
    assertNoCannedMarkers(result.result, 'summarize_parcel_casefile');
    console.log('  ✅ summarize_parcel_casefile: no canned markers');
  });

  it('add_dossier_note: no canned markers in governed write response', async () => {
    installFetchMock([
      AUTH_MOCK,
      { match: '/api/dossier/', body: { noteId: 'real-note-123', parcelId: 'ANTI-REG-NOTE', createdAt: new Date().toISOString() } },
    ]);

    const runner = makeRunner();
    const result = await runner.execute({
      toolId: 'add_dossier_note',
      params: { county: 'benton', parcelId: 'ANTI-REG-NOTE', note: 'Test note' },
      context: { ...PILOT_CTX, reasonCode: 'workflow_update' },
    });

    assert.equal(result.ok, true, `Should succeed: ${result.error}`);
    assertNoCannedMarkers(result.result, 'add_dossier_note');
    console.log('  ✅ add_dossier_note: no canned markers');
  });

  it('search_trace_by_correlation: returns trace data (no backend call needed)', async () => {
    const runner = makeRunner();
    // This tool uses real TraceService, not backend HTTP — it should work without fetch
    const result = await runner.execute({
      toolId: 'search_trace_by_correlation',
      params: { county: 'benton', correlationId: 'nonexistent-corr-id' },
      context: { ...PILOT_CTX, roles: ['administrator'] },
    });

    // search_trace succeeds even with no matching events (returns empty)
    assert.equal(result.ok, true);
    assertNoCannedMarkers(result.result, 'search_trace_by_correlation');
    console.log('  ✅ search_trace_by_correlation: no canned markers');
  });
});
