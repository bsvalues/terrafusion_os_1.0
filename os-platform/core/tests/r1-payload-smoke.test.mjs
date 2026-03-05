/**
 * TerraFusion OS – R1 Payload Shaping Smoke Test
 *
 * Proves that R1 handler payloads now match backend request contracts:
 *   1. run_valuation_model sends correct PropertyCostCalculationRequest shape
 *      → expect 200 using known-good seeded parcel fixture
 *   2. summarize_levy_rate_components sends valid LevyMeasureRequest shape
 *      → expect 200 (no auth-only pass, no validation failure)
 *   3. Direct HTTP: shaped CostForge payload no longer fails model validation
 *   4. Direct HTTP: shaped levy calculate-rate payload returns 200
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
const BENTON_FIXTURE_PARCEL = process.env.TF_R1_FIXTURE_PARCEL_NUMBER || '1-0531-100-0001-000';
const BENTON_FIXTURE_DISTRICT = process.env.TF_R1_FIXTURE_DISTRICT_ID || 'DIST-BENTON-SMOKE';

let ToolRegistry, ToolRunner, registerPhase84Handlers, registerR1Handlers;
let acquirePilotToken, clearPilotToken, backendPost;
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
  acquirePilotToken = pilot.acquirePilotToken;
  clearPilotToken = pilot.clearPilotToken;
  backendPost = pilot.backendPost;
  TraceService = trace.TraceService;
  traceService = trace.traceService;
});

describe('R1 Payload Shaping (backend on :5046)', () => {

  // ── Direct HTTP: CostForge shaped payload passes validation ───────

  it('shaped CostForge payload returns 200 with known fixture parcel', async () => {
    const { token } = await acquirePilotToken();

    // This is the shaped payload: parcelNumber + countyCode (not parcelId + countyId)
    const result = await backendPost('/api/costforge/calculate', {
      propertyId: '00000000-0000-0000-0000-000000000000',
      parcelNumber: BENTON_FIXTURE_PARCEL,
      countyCode: 'BENTON',
      region: 'BENTON',
      buildingType: 'SFR',
    }, { token });

    assert.equal(result.ok, true, `CostForge should return 200, got ${result.status}: ${result.error}`);
    assert.equal(result.status, 200, `Expected 200, got ${result.status}`);
    console.log('  ✅ CostForge: 200 with shaped payload + known fixture parcel');
  });

  // ── Direct HTTP: Levy calculate-rate returns 200 ──────────────────

  it('shaped levy calculate-rate payload returns 200', async () => {
    const { token } = await acquirePilotToken();

    const result = await backendPost('/api/levy-calculation/calculate-rate', {
      districtId: BENTON_FIXTURE_DISTRICT,
      districtName: 'Benton Smoke District',
      assessedValue: 1500000,
      budgetAmount: 45000,
      districtType: 'county-regular',
      measureType: 'regular',
      countyCode: 'BENTON',
    }, { token });

    assert.equal(result.ok, true, `Levy calculate-rate should return 200, got ${result.status}: ${result.error}`);
    assert.equal(typeof result.data.aiOptimalRate, 'number', 'aiOptimalRate should be present');
    assert.ok(Number.isFinite(result.data.aiOptimalRate));
    console.log(`  ✅ Levy calculate-rate: 200, aiOptimalRate=${result.data.aiOptimalRate}`);
  });

  // ── Handler: run_valuation_model no longer 400 ────────────────────

  it('run_valuation_model handler returns 200 with known fixture payload', async () => {
    const registry = new ToolRegistry();
    await registry.initialize();
    const runner = new ToolRunner({ registry });
    registerPhase84Handlers(runner);
    registerR1Handlers(runner, traceService);

    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: {
        county: 'benton',
        parcelId: BENTON_FIXTURE_PARCEL,
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

    assert.equal(result.ok, true, `Expected run_valuation_model success, got ${result.error}`);
    assert.equal(typeof result.result.estimatedValue, 'number');
    assert.ok(Number.isFinite(result.result.estimatedValue));
    console.log(`  ✅ run_valuation_model: 200 — estimatedValue=${result.result.estimatedValue}`);
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
      params: { county: 'benton', taxYear: 2025, districtCode: BENTON_FIXTURE_DISTRICT },
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
    assert.ok(result.result.totalRate > 0, 'totalRate should be > 0 for valid levy payload');
    assert.ok(result.result.explanation, 'explanation should be non-empty');
    console.log(`  ✅ summarize_levy: 200 — ${result.result.components.length} components, totalRate=${result.result.totalRate}`);
    console.log(`     explanation: "${result.result.explanation}"`);
  });

  // ── Regression: auth smoke still holds ────────────────────────────

  it('unauthenticated calls still return 401', async () => {
    const noAuth = await backendPost('/api/costforge/calculate', {
      parcelNumber: 'R-001',
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
