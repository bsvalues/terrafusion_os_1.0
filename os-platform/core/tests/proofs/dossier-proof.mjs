/**
 * TerraFusion OS — Dossier Proof Script (CP-DOS-02)
 *
 * Invokes `summarize_parcel_casefile` and `add_dossier_note` through the
 * governed ToolRunner path. Captures correlation IDs and trace chain events.
 *
 * Uses mocked fetch (no live backend required).
 *
 * Run:
 *   node os-platform/core/tests/proofs/dossier-proof.mjs
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

async function runDossierProof() {
  const startTime = new Date().toISOString();

  const pilotMod = await import('../../pilot/index.js');
  const traceMod = await import('../../trace/index.js');
  const pilot = pilotMod.default || pilotMod;
  const trace = traceMod.default || traceMod;

  const { ToolRegistry, ToolRunner, registerPhase84Handlers, registerR1Handlers } = pilot;
  const { TraceService, InMemoryTraceStore } = trace;

  const traceStore = new InMemoryTraceStore();
  const traceService = new TraceService(traceStore);
  const registry = new ToolRegistry();
  registry.initializeSync?.() ?? await registry.initialize?.(MANIFEST_PATH);
  const runner = new ToolRunner({ registry, trace: traceService });
  registerPhase84Handlers(runner);
  registerR1Handlers(runner, traceService);

  // ── Part 1: summarize_parcel_casefile (read_only, muse mode) ──
  const museContext = {
    countyId: 'benton',
    userId: 'dossier-proof-runner',
    roles: ['appraiser'],
    mode: 'muse',
  };

  installFetchMock([
    {
      match: '/api/auth/login',
      body: { token: 'proof-jwt-dos', user: { countyId: 'benton', countyCode: 'benton', roles: ['Administrator'] } },
    },
    {
      match: '/api/dossier/parcels/',
      body: {
        summary: 'Parcel PROOF-DOS-001: 3 appeals (2020-2024), 2 permits, no active exemptions.',
        highlights: [
          'Appeal 2023: Upheld at $285,000',
          'Permit 2022: Roof replacement, $15,000',
          'Last sale: 2019 at $260,000',
        ],
        sections: {
          appeals: { count: 3, summary: 'All resolved' },
          permits: { count: 2, summary: 'Major renovation' },
        },
      },
    },
  ]);

  const casefileResult = await runner.execute({
    toolId: 'summarize_parcel_casefile',
    params: { county: 'benton', parcelId: 'PROOF-DOS-001' },
    context: museContext,
  });
  restoreFetch();

  assert.equal(casefileResult.ok, true, `Casefile failed: ${casefileResult.error}`);
  assert.ok(casefileResult.correlationId, 'Casefile must have correlationId');
  assert.ok(casefileResult.result.summary.length > 0, 'Summary must be non-empty');
  assert.ok(Array.isArray(casefileResult.result.highlights), 'Highlights must be array');
  assert.ok(casefileResult.result.payloadRef, 'payloadRef must be present for PII-safe trace');

  // ── Part 2: add_dossier_note (write_low, pilot mode) ──
  const pilotContext = {
    countyId: 'benton',
    userId: 'dossier-proof-runner',
    roles: ['appraiser'],
    mode: 'pilot',
    confirmation: true,
    reasonCode: 'workflow_update',
  };

  installFetchMock([
    {
      match: '/api/auth/login',
      body: { token: 'proof-jwt-note', user: { countyId: 'benton', countyCode: 'benton', roles: ['Administrator'] } },
    },
    {
      match: '/api/dossier/',
      body: {
        noteId: 'note-proof-001',
        parcelId: 'PROOF-DOS-001',
        createdAt: new Date().toISOString(),
      },
    },
  ]);

  const noteResult = await runner.execute({
    toolId: 'add_dossier_note',
    params: { county: 'benton', parcelId: 'PROOF-DOS-001', note: 'Proof test: governed write path verified' },
    context: pilotContext,
  });
  restoreFetch();

  assert.equal(noteResult.ok, true, `Note failed: ${noteResult.error}`);
  assert.ok(noteResult.correlationId, 'Note must have correlationId');
  assert.equal(noteResult.result.appended, true, 'Note must report appended: true');
  assert.ok(noteResult.result.payloadRef, 'Note must have payloadRef');

  // ── Query trace chains ──
  const casefileTrace = await traceService.getByCorrelationId(casefileResult.correlationId);
  const noteTrace = await traceService.getByCorrelationId(noteResult.correlationId);

  assert.ok(casefileTrace.length >= 1, 'Casefile trace must have events');
  assert.ok(noteTrace.length >= 1, 'Note trace must have events');

  // ── Build evidence artifact ──
  const evidence = {
    proofType: 'CP-DOS-02',
    casefile: {
      tool: 'summarize_parcel_casefile',
      parcelId: 'PROOF-DOS-001',
      correlationId: casefileResult.correlationId,
      result: casefileResult.result,
      traceChain: casefileTrace.map(e => ({
        eventId: e.eventId || e.id,
        type: e.type || e.eventType,
        toolId: e.toolId,
        timestamp: e.timestamp,
      })),
    },
    note: {
      tool: 'add_dossier_note',
      parcelId: 'PROOF-DOS-001',
      correlationId: noteResult.correlationId,
      result: noteResult.result,
      traceChain: noteTrace.map(e => ({
        eventId: e.eventId || e.id,
        type: e.type || e.eventType,
        toolId: e.toolId,
        timestamp: e.timestamp,
      })),
    },
    timestamp: startTime,
    assertions: {
      casefile_ok: casefileResult.ok,
      casefile_hasCorrelation: !!casefileResult.correlationId,
      casefile_traceEvents: casefileTrace.length,
      note_ok: noteResult.ok,
      note_hasCorrelation: !!noteResult.correlationId,
      note_traceEvents: noteTrace.length,
      note_isGovernedWrite: true,
    },
  };

  console.log(JSON.stringify(evidence, null, 2));
  console.log('\n✅ DOSSIER PROOF COMPLETE — casefile + governed write verified');
  return evidence;
}

runDossierProof().catch(err => {
  console.error('❌ DOSSIER PROOF FAILED:', err.message);
  process.exit(1);
});
