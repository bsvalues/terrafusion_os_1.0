/**
 * TerraFusion OS – R1 CostForge 200-Path Smoke Test
 *
 * Proves that R1 handler payloads produce full 200-path success:
 *   1. run_valuation_model sends correct PropertyCostCalculationRequest shape
 *      → expect 200 with real cost analysis for known Benton County parcel
 *   2. summarize_levy_rate_components calls GET /history
 *      → expect 200 with array (possibly empty)
 *   3. Direct HTTP: CostForge returns 200 with real parcel
 *   4. Direct HTTP: levy history returns 200 with array
 *
 * Parcel discovery: queries GET /api/properties?pageSize=1 for a real parcel.
 * Falls back to 1-0531-100-0001-000 (Benton County seed parcel) if the
 * endpoint is unavailable. If the fallback parcel is also missing, the test
 * fails with instructions to reseed the dev DB.
 *
 * Requires:
 *   TF_API_PORT=5046 (or backend running on 5046)
 *
 * Run:
 *   TF_API_PORT=5046 node --test os-platform/core/tests/r1-payload-smoke.test.mjs
 */

import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

process.env.TF_API_PORT = process.env.TF_API_PORT || '5046';

let ToolRegistry, ToolRunner, registerPhase84Handlers, registerR1Handlers;
let acquirePilotToken, clearPilotToken, backendPost, backendGet;
let TraceService, traceService;

/** Parcel number resolved at runtime — see discoverTestParcel(). */
let TEST_PARCEL = '1-0531-100-0001-000'; // fallback if discovery unavailable
const FALLBACK_PARCEL = TEST_PARCEL;

/**
 * Discover a real parcel from the backend. Uses GET /api/properties?pageSize=1
 * so the test does not break when the dev DB is reseeded with different data.
 */
async function discoverTestParcel(token) {
  try {
    const result = await backendGet('/api/properties?pageSize=1', { token });
    if (result.ok && result.data?.items?.[0]?.parcelNumber) {
      TEST_PARCEL = result.data.items[0].parcelNumber;
      console.log(`  🔍 Discovered test parcel: ${TEST_PARCEL}`);
      return;
    }
  } catch { /* fall through to fallback */ }
  console.log(`  ⚠️  Parcel discovery unavailable — using fallback: ${FALLBACK_PARCEL}`);
}

before(async () => {
  const pilotMod = await import('../pilot/index.js');
  const traceMod = await import('../trace/index.js');
  const pilot = pilotMod.default || pilotMod;
  const trace = traceMod.default || traceMod;

  ToolRegistry = pilot.ToolRegistry;
  ToolRunner = pilot.ToolRunner;
  registerPhase84Handlers = pilot.registerPhase84Handlers;
  registerR1Handlers = pilot.registerR1Handlers;
  acquirePilotToken = pilot.acquirePilotToken;
  clearPilotToken = pilot.clearPilotToken;
  backendPost = pilot.backendPost;
  backendGet = pilot.backendGet;
  TraceService = trace.TraceService;
  traceService = trace.traceService;

  // Discover a real parcel before any CostForge tests run
  const { token } = await acquirePilotToken();
  await discoverTestParcel(token);
});

describe('R1 Payload Shaping (backend on :5046)', () => {

  // ── Direct HTTP: CostForge returns 200 with real parcel ─────────

  it('CostForge returns 200 for known Benton County parcel', async () => {
    const { token } = await acquirePilotToken();

    const result = await backendPost('/api/costforge/calculate', {
      parcelNumber: TEST_PARCEL,
      countyCode: 'benton',
      region: 'benton',
      buildingType: 'cost',
    }, { token });

    assert.equal(result.ok, true,
      `CostForge should return 200 for parcel ${TEST_PARCEL}, got ${result.status}: ${result.error}` +
      (result.status === 404 ? '\n  → Dev DB may have been reseeded. Run: sqlite3 backend/src/TerraFusion.API/terrafusion-dev.db "SELECT ParcelNumber FROM Properties LIMIT 1;" and update FALLBACK_PARCEL.' : ''));
    assert.ok(result.data.totalCost > 0, `totalCost should be > 0, got ${result.data.totalCost}`);
    assert.ok(result.data.confidenceScore > 0, `confidenceScore should be > 0, got ${result.data.confidenceScore}`);
    assert.ok(Array.isArray(result.data.components), 'components should be an array');
    console.log(`  ✅ CostForge: 200 — totalCost=$${result.data.totalCost.toFixed(2)}, confidence=${result.data.confidenceScore}`);
  });

  // ── Direct HTTP: Levy history returns 200 ─────────────────────────

  it('levy history endpoint returns 200 with array', async () => {
    const { token } = await acquirePilotToken();

    const result = await backendGet('/api/levy-calculation/history?taxYear=2025', { token });

    assert.equal(result.ok, true, `Levy history should return 200, got ${result.status}: ${result.error}`);
    assert.ok(Array.isArray(result.data), 'Levy history should return an array');
    console.log(`  ✅ Levy history: 200 with ${result.data.length} records`);
  });

  // ── Handler: run_valuation_model no longer 400 ────────────────────

  it('run_valuation_model handler returns 200 with cost analysis', async () => {
    const registry = new ToolRegistry();
    await registry.initialize();
    const runner = new ToolRunner({ registry });
    registerPhase84Handlers(runner);
    registerR1Handlers(runner, traceService);

    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: {
        county: 'benton',
        parcelId: TEST_PARCEL,
        taxYear: 2026,
      },
      context: {
        countyId: 'benton',
        userId: 'payload-smoke-test',
        roles: ['appraiser'],
        mode: 'pilot',
        confirmation: true,
        reasonCode: 'annual_certification',
      },
    });

    assert.equal(result.ok, true, `Handler should succeed, got error: ${result.error}`);
    assert.ok(result.result.estimatedValue > 0, `estimatedValue should be > 0, got ${result.result.estimatedValue}`);
    assert.ok(result.result.confidence > 0, `confidence should be > 0, got ${result.result.confidence}`);
    assert.equal(typeof result.result.components, 'object', 'components should be an object');
    console.log(`  ✅ run_valuation_model: 200 — estimatedValue=$${result.result.estimatedValue.toFixed(2)}, confidence=${result.result.confidence}`);
  });

  // ── Handler: summarize_levy_rate_components returns success ────────

  it('summarize_levy_rate_components handler returns 200', async () => {
    const registry = new ToolRegistry();
    await registry.initialize();
    const runner = new ToolRunner({ registry });
    registerPhase84Handlers(runner);
    registerR1Handlers(runner, traceService);

    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton', taxYear: 2025 },
      context: {
        countyId: 'benton',
        userId: 'payload-smoke-test',
        roles: ['appraiser'],
        mode: 'muse',
      },
    });

    assert.equal(result.ok, true, `Levy handler should succeed, got error: ${result.error}`);
    assert.ok(Array.isArray(result.result.components), 'components should be an array');
    assert.equal(typeof result.result.totalRate, 'number', 'totalRate should be a number');
    assert.ok(result.result.explanation, 'explanation should be non-empty');
    console.log(`  ✅ summarize_levy: 200 — ${result.result.components.length} components, totalRate=${result.result.totalRate}`);
    console.log(`     explanation: "${result.result.explanation}"`);
  });

  // ── Regression: auth smoke still holds ────────────────────────────

  it('unauthenticated calls still return 401', async () => {
    const noAuth = await backendPost('/api/costforge/calculate', {
      parcelNumber: TEST_PARCEL,
      countyCode: 'benton',
    });
    assert.equal(noAuth.status, 401, 'Unauthenticated CostForge should be 401');

    const port = process.env.TF_API_PORT || '5046';
    const levyRes = await fetch(`http://localhost:${port}/api/levy-calculation/history`, {
      signal: AbortSignal.timeout(5_000),
    });
    assert.equal(levyRes.status, 401, 'Unauthenticated Levy history should be 401');
    console.log('  ✅ Unauthenticated calls still blocked (401)');
  });
});
