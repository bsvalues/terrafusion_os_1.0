/**
 * TerraFusion OS – R1 Live Smoke Test
 *
 * Narrow end-to-end smoke against a running backend (port 5046).
 * Proves R1 real handlers dispatch to real endpoints — NOT canned stubs.
 *
 * Evidence model:
 *   - run_valuation_model: Handler calls POST /api/costforge/calculate.
 *     Backend returns 401/403 (auth required). Canned stub would return fake data.
 *     A backend-sourced error proves real dispatch.
 *   - search_trace_by_correlation: Uses real TraceService in-process. Full e2e.
 *   - summarize_levy_rate_components: Handler calls POST /api/levy-calculation/calculate-rate.
 *     Backend returns 401/403. Canned stub would return hardcoded rates.
 *     A backend-sourced error proves real dispatch.
 *
 * Requires:
 *   TF_API_PORT=5046 (or backend running on 5046)
 *   Backend started: dotnet run --project backend/src/TerraFusion.API
 *
 * Run:
 *   TF_API_PORT=5046 node --test os-platform/core/tests/r1-live-smoke.test.mjs
 */

import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

// Force backend target — this test MUST hit the real backend.
process.env.TF_API_PORT = process.env.TF_API_PORT || '5046';

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

// ── Preflight: verify backend is reachable ──────────────────────────

describe('R1 Live Smoke (backend on :5046)', () => {
  it('preflight: backend /health responds', async () => {
    const port = process.env.TF_API_PORT || '5046';
    const res = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    assert.equal(res.status, 200, 'Backend /health must return 200');
    const body = await res.json();
    assert.equal(body.status, 'Healthy');
  });

  // ── Smoke 1: run_valuation_model → real backend dispatch ────────

  it('run_valuation_model dispatches to real backend (not canned)', async () => {
    const registry = new ToolRegistry();
    await registry.initialize();
    const runner = new ToolRunner({ registry });

    // Register canned first, then R1 real handlers (production order)
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
        userId: 'smoke-test',
        roles: ['appraiser'],
        mode: 'pilot',
        confirmation: true,
        reasonCode: 'annual_certification',
      },
    });

    // Real handler hits backend → backend returns 401/403 (no auth token).
    // Canned handler would return ok=true with fake estimatedValue.
    // An error containing "Backend" or status code proves real dispatch.
    assert.equal(result.ok, false, 'Expected error (backend auth required)');
    assert.ok(
      result.error && (result.error.includes('Backend') || result.error.includes('401') || result.error.includes('403')),
      `Error should reference backend HTTP status, got: ${result.error}`
    );
    console.log(`  ✅ run_valuation_model dispatched to real backend → ${result.error}`);
  });

  // ── Smoke 2: search_trace_by_correlation → real TraceService e2e ─

  it('search_trace_by_correlation full e2e via real TraceService', async () => {
    const registry = new ToolRegistry();
    await registry.initialize();
    const localTrace = new TraceService();
    const runner = new ToolRunner({ registry, trace: localTrace });

    registerR1Handlers(runner, localTrace);

    // Emit a real trace event
    const corrId = `smoke-${Date.now()}`;
    localTrace.emitWithPiiHandling(
      {
        type: 'tool_invoked',
        toolId: 'run_valuation_model',
        correlationId: corrId,
        context: { countyId: 'benton', userId: 'smoke', roles: ['appraiser'], mode: 'pilot' },
        summary: 'Smoke test trace event',
      },
      'none'
    );

    const result = await runner.execute({
      toolId: 'search_trace_by_correlation',
      params: { county: 'benton', correlationId: corrId },
      context: {
        countyId: 'benton',
        userId: 'smoke-test',
        roles: ['administrator'],
        mode: 'pilot',
      },
    });

    assert.ok(result.ok, `Expected ok=true, got error: ${result.error}`);
    assert.ok(result.result.found, 'Expected found=true');
    assert.ok(result.result.events.length >= 1, 'Expected at least 1 trace event');
    assert.equal(result.result.events[0].type, 'tool_invoked');
    assert.equal(result.result.events[0].toolId, 'run_valuation_model');
    console.log(`  ✅ search_trace_by_correlation returned ${result.result.events.length} event(s) for ${corrId}`);
  });

  // ── Smoke 3: summarize_levy_rate_components → real backend dispatch

  it('summarize_levy_rate_components dispatches to real backend (not canned)', async () => {
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
        userId: 'smoke-test',
        roles: ['appraiser'],
        mode: 'muse',
      },
    });

    // Real handler hits backend → backend returns 401/403 (no auth token).
    // Canned handler would return ok=true with hardcoded rates [3.12, 2.45, 1.85].
    // An error containing "Backend" or status code proves real dispatch.
    assert.equal(result.ok, false, 'Expected error (backend auth required)');
    assert.ok(
      result.error && (result.error.includes('Backend') || result.error.includes('401') || result.error.includes('403')),
      `Error should reference backend HTTP status, got: ${result.error}`
    );
    console.log(`  ✅ summarize_levy_rate_components dispatched to real backend → ${result.error}`);
  });
});
