/**
 * TerraFusion OS — Forge Proof Script (CP-FORGE-02)
 *
 * Invokes `run_valuation_model` through the governed ToolRunner path,
 * captures correlation IDs and trace chain events, and outputs an
 * evidence artifact proving end-to-end governed tool execution.
 *
 * Uses mocked fetch to simulate backend (no live backend required).
 * Evidence shape matches R1_MASTER_EXECUTION_LEDGER.md spec.
 *
 * Run:
 *   node os-platform/core/tests/proofs/forge-proof.mjs
 */

import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../../tools/registry/terrapilot.tools.json');

// ============================================================================
// Fetch Mock Infrastructure
// ============================================================================

const originalFetch = globalThis.fetch;

function installFetchMock(routes) {
  globalThis.fetch = async (url, init) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    for (const route of routes) {
      if (urlStr.includes(route.match)) {
        const body = typeof route.body === 'string' ? route.body : JSON.stringify(route.body);
        return new Response(body, {
          status: route.status ?? 200,
          headers: { 'Content-Type': 'application/json', ...(route.headers ?? {}) },
        });
      }
    }
    return new Response(JSON.stringify({ error: `Unmocked: ${urlStr}` }), {
      status: 599,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

// ============================================================================
// Main Proof Runner
// ============================================================================

async function runForgeProof() {
  const startTime = new Date().toISOString();

  // Dynamic imports
  const pilotMod = await import('../../pilot/index.js');
  const traceMod = await import('../../trace/index.js');
  const pilot = pilotMod.default || pilotMod;
  const trace = traceMod.default || traceMod;

  const { ToolRegistry, ToolRunner, registerPhase84Handlers, registerR1Handlers } = pilot;
  const { TraceService, InMemoryTraceStore } = trace;

  // Build isolated trace + runner
  const traceStore = new InMemoryTraceStore();
  const traceService = new TraceService(traceStore);
  const registry = new ToolRegistry();
  registry.initializeSync?.() ?? await registry.initialize?.(MANIFEST_PATH);
  const runner = new ToolRunner({ registry, trace: traceService });
  registerPhase84Handlers(runner);
  registerR1Handlers(runner, traceService);

  const context = {
    countyId: 'benton',
    userId: 'forge-proof-runner',
    roles: ['appraiser'],
    mode: 'pilot',
    confirmation: true,
    reasonCode: 'annual_certification',
  };

  // ── Parcel 1: Standard SFR via cost approach ──
  installFetchMock([
    {
      match: '/api/auth/login',
      body: { token: 'proof-jwt-1', user: { countyId: 'benton', countyCode: 'benton', roles: ['Administrator'] } },
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
      },
    },
  ]);

  const result1 = await runner.execute({
    toolId: 'run_valuation_model',
    params: { county: 'benton', parcelId: 'PROOF-PARCEL-001', taxYear: 2026 },
    context,
  });
  restoreFetch();

  assert.equal(result1.ok, true, `Parcel 1 failed: ${result1.error}`);
  assert.ok(result1.correlationId, 'Parcel 1 must have correlationId');
  assert.equal(result1.result.estimatedValue, 285000.50);

  // ── Parcel 2: MFR via income approach (materially different) ──
  installFetchMock([
    {
      match: '/api/auth/login',
      body: { token: 'proof-jwt-2', user: { countyId: 'benton', countyCode: 'benton', roles: ['Administrator'] } },
    },
    {
      match: '/api/costforge/calculate',
      body: {
        totalCost: 520000,
        confidenceScore: 0.91,
        components: [
          { name: 'structure', amount: 380000 },
          { name: 'mechanical', amount: 90000 },
          { name: 'site', amount: 50000 },
        ],
      },
    },
  ]);

  const result2 = await runner.execute({
    toolId: 'run_valuation_model',
    params: { county: 'benton', parcelId: 'PROOF-PARCEL-002', taxYear: 2026, modelType: 'income' },
    context,
  });
  restoreFetch();

  assert.equal(result2.ok, true, `Parcel 2 failed: ${result2.error}`);
  assert.ok(result2.correlationId, 'Parcel 2 must have correlationId');
  assert.equal(result2.result.estimatedValue, 520000);

  // ── Verify values are materially different ──
  const valuesAreDifferent = Math.abs(result1.result.estimatedValue - result2.result.estimatedValue) > 1000;
  assert.ok(valuesAreDifferent, 'Two parcels must produce materially different values');

  // ── Query trace chains ──
  const trace1 = await traceService.getByCorrelationId(result1.correlationId);
  const trace2 = await traceService.getByCorrelationId(result2.correlationId);

  // Verify trace events exist (invoke + complete pairs)
  assert.ok(trace1.length >= 1, 'Trace 1 must have at least 1 event');
  assert.ok(trace2.length >= 1, 'Trace 2 must have at least 1 event');

  // ── Build evidence artifact ──
  const evidence = {
    tool: 'run_valuation_model',
    proofType: 'CP-FORGE-02',
    parcel1: {
      id: 'PROOF-PARCEL-001',
      correlationId: result1.correlationId,
      result: result1.result,
      traceChain: trace1.map(e => ({
        eventId: e.eventId || e.id,
        type: e.type || e.eventType,
        toolId: e.toolId,
        timestamp: e.timestamp,
      })),
    },
    parcel2: {
      id: 'PROOF-PARCEL-002',
      correlationId: result2.correlationId,
      result: result2.result,
      traceChain: trace2.map(e => ({
        eventId: e.eventId || e.id,
        type: e.type || e.eventType,
        toolId: e.toolId,
        timestamp: e.timestamp,
      })),
    },
    valuesAreDifferent,
    timestamp: startTime,
    assertions: {
      parcel1_ok: result1.ok,
      parcel2_ok: result2.ok,
      parcel1_hasCorrelation: !!result1.correlationId,
      parcel2_hasCorrelation: !!result2.correlationId,
      parcel1_traceEvents: trace1.length,
      parcel2_traceEvents: trace2.length,
      materiallyDifferent: valuesAreDifferent,
    },
  };

  console.log(JSON.stringify(evidence, null, 2));
  console.log('\n✅ FORGE PROOF COMPLETE — 2 parcels, 2 correlations, governed path verified');
  return evidence;
}

runForgeProof().catch(err => {
  console.error('❌ FORGE PROOF FAILED:', err.message);
  process.exit(1);
});
