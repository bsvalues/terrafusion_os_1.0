/**
 * TerraFusion OS – R1 Auth Smoke Test
 *
 * Proves auth enablement for R1 real handlers against a running backend.
 *
 * Evidence model:
 *   1. pilotAuth: Token acquisition succeeds via POST /api/auth/login.
 *   2. run_valuation_model: With auth token + valid payload fixture, returns 200-path success.
 *   3. summarize_levy_rate_components: With auth token + valid payload fixture, returns 200.
 *   4. search_trace_by_correlation: Still works full e2e (no regression).
 *   5. Unauthenticated direct calls return 401 (backend requires auth).
 *
 * Requires:
 *   TF_API_PORT=5046 (or backend running on 5046)
 *   Backend started: dotnet run --project backend/src/TerraFusion.API
 *
 * Run:
 *   TF_API_PORT=5046 node --test os-platform/core/tests/r1-auth-smoke.test.mjs
 */

import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

// Force backend target
process.env.TF_API_PORT = process.env.TF_API_PORT || '5046';
const BENTON_FIXTURE_PARCEL = process.env.TF_R1_FIXTURE_PARCEL_NUMBER || '';
const LAST_RESORT_PARCEL = '1-0531-100-0001-000';
const BENTON_FIXTURE_DISTRICT = process.env.TF_R1_FIXTURE_DISTRICT_ID || 'DIST-BENTON-SMOKE';
let RESOLVED_BENTON_PARCEL = BENTON_FIXTURE_PARCEL;

let ToolRegistry, ToolRunner, registerPhase84Handlers, registerR1Handlers;
let acquirePilotToken, clearPilotToken, backendPost, backendGet;
let TraceService, traceService;

function discoverParcelNumber(payload) {
  const items = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray(payload.items)
      ? payload.items
      : [];

  for (const item of items) {
    const parcelNumber = item?.parcelNumber;
    if (typeof parcelNumber === 'string' && parcelNumber.trim().length > 0) {
      return parcelNumber.trim();
    }
  }

  return null;
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

  if (!RESOLVED_BENTON_PARCEL) {
    try {
      const { token } = await acquirePilotToken();
      const propertiesResponse = await backendGet('/api/properties', { token });
      if (propertiesResponse.ok) {
        RESOLVED_BENTON_PARCEL = discoverParcelNumber(propertiesResponse.data) || '';
      }
    } catch {
      // fall through to last-resort fixture below
    } finally {
      clearPilotToken();
    }
  }

  if (!RESOLVED_BENTON_PARCEL) {
    RESOLVED_BENTON_PARCEL = LAST_RESORT_PARCEL;
    console.log(`  ⚠️ parcel discovery unavailable, using fallback parcel ${RESOLVED_BENTON_PARCEL}`);
  } else if (!BENTON_FIXTURE_PARCEL) {
    console.log(`  ✅ discovered Benton parcel fixture: ${RESOLVED_BENTON_PARCEL}`);
  }
});

describe('R1 Auth Smoke (backend on :5046)', () => {

  // ── Preflight: backend reachable ──────────────────────────────────

  it('preflight: backend /health responds', async () => {
    const port = process.env.TF_API_PORT || '5046';
    const res = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    assert.equal(res.status, 200, 'Backend /health must return 200');
    const body = await res.json();
    assert.equal(body.status, 'Healthy');
  });

  // ── Auth 1: Token acquisition works ───────────────────────────────

  it('acquirePilotToken returns valid token', async () => {
    clearPilotToken(); // ensure fresh acquisition
    const tokenData = await acquirePilotToken();

    assert.ok(tokenData.token, 'Token string must be non-empty');
    assert.ok(tokenData.token.length > 50, 'Token must be a substantial JWT');
    assert.ok(tokenData.email, 'Email must be present');
    assert.ok(Array.isArray(tokenData.roles), 'Roles must be an array');
    assert.ok(tokenData.roles.includes('Administrator'), 'Admin role expected');
    assert.ok(tokenData.expiresAt instanceof Date, 'expiresAt must be a Date');
    assert.ok(tokenData.expiresAt.getTime() > Date.now(), 'Token must not be expired');
    console.log(`  ✅ Token acquired: roles=[${tokenData.roles.join(',')}], expires=${tokenData.expiresAt.toISOString()}`);
  });

  // ── Auth 2: Unauthenticated calls return 401 ─────────────────────

  it('unauthenticated POST to /api/costforge/calculate returns 401', async () => {
    const result = await backendPost('/api/costforge/calculate', {
      propertyId: '00000000-0000-0000-0000-000000000000',
      parcelNumber: RESOLVED_BENTON_PARCEL,
      countyCode: 'BENTON',
      region: 'BENTON',
      buildingType: 'SFR',
    });
    assert.equal(result.ok, false, 'Should fail without auth');
    assert.equal(result.status, 401, `Expected 401, got ${result.status}`);
    console.log('  ✅ Unauthenticated costforge call → 401');
  });

  it('unauthenticated POST to /api/levy-calculation/calculate-rate returns 401', async () => {
    const result = await backendPost('/api/levy-calculation/calculate-rate', {
      districtId: BENTON_FIXTURE_DISTRICT,
      districtName: 'Benton Smoke District',
      assessedValue: 1500000,
      budgetAmount: 45000,
      districtType: 'county-regular',
      measureType: 'regular',
      countyCode: 'BENTON',
    });
    assert.equal(result.ok, false, 'Should fail without auth');
    assert.equal(result.status, 401, `Expected 401, got ${result.status}`);
    console.log('  ✅ Unauthenticated levy call → 401');
  });

  // ── Auth 3: run_valuation_model passes auth (no 401/403) ─────────

  it('run_valuation_model with auth returns success (200-path)', async () => {
    const registry = new ToolRegistry();
    await registry.initialize();
    const runner = new ToolRunner({ registry });

    registerPhase84Handlers(runner);
    registerR1Handlers(runner, traceService);

    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: {
        county: 'benton',
        parcelId: RESOLVED_BENTON_PARCEL,
        taxYear: 2026,
      },
      context: {
        countyId: 'benton',
        userId: 'auth-smoke-test',
        roles: ['appraiser'],
        mode: 'pilot',
        confirmation: true,
        reasonCode: 'annual_certification',
      },
    });

    assert.equal(result.ok, true, `Expected success, got: ${result.error}`);
    assert.equal(typeof result.result.estimatedValue, 'number');
    assert.ok(Number.isFinite(result.result.estimatedValue));
    console.log(`  ✅ run_valuation_model 200-path success: estimatedValue=${result.result.estimatedValue}`);
  });

  // ── Auth 4: summarize_levy_rate_components passes auth ────────────

  it('summarize_levy_rate_components with auth returns success (200)', async () => {
    const registry = new ToolRegistry();
    await registry.initialize();
    const runner = new ToolRunner({ registry });

    registerPhase84Handlers(runner);
    registerR1Handlers(runner, traceService);

    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton', taxYear: 2026, districtCode: BENTON_FIXTURE_DISTRICT },
      context: {
        countyId: 'benton',
        userId: 'auth-smoke-test',
        roles: ['appraiser'],
        mode: 'muse',
      },
    });

    assert.equal(result.ok, true, `Expected success, got: ${result.error}`);
    assert.equal(typeof result.result.totalRate, 'number');
    assert.ok(Number.isFinite(result.result.totalRate));
    assert.ok(result.result.totalRate > 0, 'totalRate should be > 0 for valid levy payload');
    console.log(`  ✅ summarize_levy_rate_components 200 success: totalRate=${result.result.totalRate}`);
  });

  // ── Auth 5: search_trace_by_correlation still works (no regression)

  it('search_trace_by_correlation full e2e (no regression)', async () => {
    const registry = new ToolRegistry();
    await registry.initialize();
    const localTrace = new TraceService();
    const runner = new ToolRunner({ registry, trace: localTrace });

    registerR1Handlers(runner, localTrace);

    // Emit a real trace event
    const corrId = `auth-smoke-${Date.now()}`;
    localTrace.emitWithPiiHandling(
      {
        type: 'tool_invoked',
        toolId: 'run_valuation_model',
        correlationId: corrId,
        context: { countyId: 'benton', userId: 'smoke', roles: ['appraiser'], mode: 'pilot' },
        summary: 'Auth smoke test trace event',
      },
      'none'
    );

    const result = await runner.execute({
      toolId: 'search_trace_by_correlation',
      params: { county: 'benton', correlationId: corrId },
      context: {
        countyId: 'benton',
        userId: 'auth-smoke-test',
        roles: ['administrator'],
        mode: 'pilot',
      },
    });

    assert.ok(result.ok, `Expected ok=true, got error: ${result.error}`);
    assert.ok(result.result.found, 'Expected found=true');
    assert.ok(result.result.events.length >= 1, 'Expected at least 1 trace event');
    console.log(`  ✅ search_trace_by_correlation returned ${result.result.events.length} event(s)`);
  });
});
