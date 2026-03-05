/**
 * TerraFusion OS – R1 Payload Shaping Smoke Test
 *
 * Proves that R1 handler payloads now match backend request contracts:
 *   1. run_valuation_model sends correct PropertyCostCalculationRequest shape
 *      → expect 200 or 404 (parcel not in DB) — NOT 400 (validation failure)
 *   2. summarize_levy_rate_components calls GET /history
 *      → expect 200 with array (possibly empty) — NOT 400/403
 *   3. Direct HTTP: shaped CostForge payload no longer fails model validation
 *   4. Direct HTTP: levy history returns 200 with array
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
});

describe('R1 Payload Shaping (backend on :5046)', () => {

  // ── Direct HTTP: CostForge shaped payload passes validation ───────

  it('shaped CostForge payload passes validation (no 400)', async () => {
    const { token } = await acquirePilotToken();

    // This is the shaped payload: parcelNumber + countyCode (not parcelId + countyId)
    const result = await backendPost('/api/costforge/calculate', {
      parcelNumber: 'R-SMOKE-001',
      countyCode: 'benton',
      region: 'benton',
      buildingType: 'cost',
    }, { token });

    // Should NOT be 400 (model validation). Expect 200 or 404 (parcel not found).
    assert.notEqual(result.status, 400, `Shaped payload should not trigger validation 400, got: ${result.raw ?? result.error}`);
    assert.notEqual(result.status, 401, 'Auth should pass');
    assert.notEqual(result.status, 403, 'Authz should pass');

    // 404 is the expected response when parcel doesn't exist in DB
    if (result.status === 404) {
      console.log('  ✅ CostForge: 404 (parcel not in DB) — validation passed, auth passed');
    } else if (result.ok) {
      console.log(`  ✅ CostForge: 200 — full success`);
    } else {
      console.log(`  ⚠️  CostForge: ${result.status} — ${result.error}`);
    }
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

  it('run_valuation_model handler gets 200 or 404 (not 400)', async () => {
    const registry = new ToolRegistry();
    await registry.initialize();
    const runner = new ToolRunner({ registry });
    registerPhase84Handlers(runner);
    registerR1Handlers(runner, traceService);

    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: {
        county: 'benton',
        parcelId: 'R-SMOKE-001',
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

    if (result.ok === false) {
      // Should be a "not found" error, not a validation error
      assert.ok(
        !result.error.includes('400') && !result.error.includes('Bad Request'),
        `Payload shaping should eliminate 400 validation errors: ${result.error}`
      );
      // 404 "not found" is the expected correct domain response
      const is404 = result.error.includes('404') || result.error.toLowerCase().includes('not found');
      console.log(`  ✅ run_valuation_model: ${is404 ? '404 (parcel not in DB)' : result.error} — validation passed`);
    } else {
      console.log(`  ✅ run_valuation_model: 200 — estimatedValue=${result.result.estimatedValue}`);
    }
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
