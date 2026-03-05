/**
 * TerraFusion OS – R1 Auth Smoke Test
 *
 * Proves auth enablement for R1 real handlers against a running backend.
 *
 * Evidence model:
 *   1. pilotAuth: Token acquisition succeeds via POST /api/auth/login.
 *   2. run_valuation_model: With auth token, backend returns non-401/403.
 *      (May return 400/404/500 for missing data — proving auth passed.)
 *   3. summarize_levy_rate_components: With auth token, non-401/403.
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
      parcelId: 'R-001',
      taxYear: 2026,
      modelType: 'cost',
      countyId: 'benton',
    });
    assert.equal(result.ok, false, 'Should fail without auth');
    assert.equal(result.status, 401, `Expected 401, got ${result.status}`);
    console.log('  ✅ Unauthenticated costforge call → 401');
  });

  it('unauthenticated POST to /api/levy-calculation/calculate-rate returns 401', async () => {
    const result = await backendPost('/api/levy-calculation/calculate-rate', {
      countyId: 'benton',
      taxYear: 2026,
    });
    assert.equal(result.ok, false, 'Should fail without auth');
    assert.equal(result.status, 401, `Expected 401, got ${result.status}`);
    console.log('  ✅ Unauthenticated levy call → 401');
  });

  // ── Auth 3: run_valuation_model passes auth (no 401/403) ─────────

  it('run_valuation_model with auth does not get 401/403', async () => {
    const registry = new ToolRegistry();
    await registry.initialize();
    const runner = new ToolRunner({ registry });

    registerPhase84Handlers(runner);
    registerR1Handlers(runner, traceService);

    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: {
        county: 'benton',
        parcelId: 'R-001',
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

    // With auth, the response should NOT be 401/403.
    // It may succeed (200) or fail with a data error (400/404/500).
    if (result.ok === false) {
      assert.ok(
        !result.error.includes('401') && !result.error.includes('Unauthorized'),
        `Auth should have passed, but got auth error: ${result.error}`
      );
      console.log(`  ✅ run_valuation_model passed auth, backend returned: ${result.error}`);
    } else {
      console.log(`  ✅ run_valuation_model returned success: estimatedValue=${result.result.estimatedValue}`);
    }
  });

  // ── Auth 4: summarize_levy_rate_components passes auth ────────────

  it('summarize_levy_rate_components with auth does not get 401/403', async () => {
    const registry = new ToolRegistry();
    await registry.initialize();
    const runner = new ToolRunner({ registry });

    registerPhase84Handlers(runner);
    registerR1Handlers(runner, traceService);

    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton', taxYear: 2026 },
      context: {
        countyId: 'benton',
        userId: 'auth-smoke-test',
        roles: ['appraiser'],
        mode: 'muse',
      },
    });

    if (result.ok === false) {
      assert.ok(
        !result.error.includes('401') && !result.error.includes('Unauthorized'),
        `Auth should have passed, but got auth error: ${result.error}`
      );
      console.log(`  ✅ summarize_levy_rate_components passed auth, backend returned: ${result.error}`);
    } else {
      console.log(`  ✅ summarize_levy_rate_components returned success: totalRate=${result.result.totalRate}`);
    }
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
