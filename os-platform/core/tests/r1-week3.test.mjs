/**
 * TerraFusion OS – R1 Week 3 Tests (CP-9 + CP-10)
 *
 * CP-9: Tests for 5 new real handlers:
 *   6. explain_model_inputs           → GET /api/costforge/models/{modelId}
 *   7. compare_assessed_value_history → GET /api/properties/{parcelId}
 *   8. summarize_parcel_casefile      → GET /api/dossier/parcels/{parcelId}/casefile
 *   9. add_dossier_note               → POST /api/dossier/{parcelId}/notes
 *  10. query_parcel_layers            → GET /api/atlas/parcels/{parcelId}/layers
 *
 * CP-10: Tests for TraceFeedAdapter bridging FileTraceStore → trace-feed
 *
 * All handlers use mocked fetch. Adapter uses InMemoryTraceStore.
 */

import assert from 'node:assert/strict';
import { before, afterEach, describe, it } from 'node:test';

let explainModelInputsRealHandler,
  compareAssessedValueHistoryRealHandler,
  summarizeParcelCasefileRealHandler,
  addDossierNoteRealHandler,
  queryParcelLayersRealHandler,
  TraceFeedAdapter,
  InMemoryTraceStore,
  TraceService;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const traceModule = await import('../trace/index.js');

  const pilot = pilotModule.default || pilotModule;
  const trace = traceModule.default || traceModule;

  explainModelInputsRealHandler = pilot.explainModelInputsRealHandler;
  compareAssessedValueHistoryRealHandler = pilot.compareAssessedValueHistoryRealHandler;
  summarizeParcelCasefileRealHandler = pilot.summarizeParcelCasefileRealHandler;
  addDossierNoteRealHandler = pilot.addDossierNoteRealHandler;
  queryParcelLayersRealHandler = pilot.queryParcelLayersRealHandler;
  InMemoryTraceStore = trace.InMemoryTraceStore;
  TraceService = trace.TraceService;

  // Load adapter
  const adapterModule = await import('../terratrc/trace-feed-adapter.js');
  const adapter = adapterModule.default || adapterModule;
  TraceFeedAdapter = adapter.TraceFeedAdapter;
});

// ── Mock Helpers ─────────────────────────────────────────────────────

const originalFetch = globalThis.fetch;

function mockFetch(data, status = 200) {
  globalThis.fetch = async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    text: async () => JSON.stringify(data),
  });
}

/**
 * URL-aware mock: returns valid auth for /api/auth/login, error for other paths.
 * Needed for error-propagation tests where the handler calls acquirePilotToken()
 * (via fetch) before making its real backend call.
 */
function mockFetchWithAuth(data, status = 200) {
  globalThis.fetch = async (url) => {
    if (typeof url === 'string' && url.includes('/api/auth/login')) {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify({
          token: 'mock-token',
          email: 'admin@gov.',
          roles: ['appraiser'],
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      };
    }
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      text: async () => JSON.stringify(data),
    };
  };
}

function mockFetchError(message = 'ECONNREFUSED') {
  globalThis.fetch = async () => {
    throw new Error(message);
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const BENTON_CONTEXT = {
  countyId: 'benton',
  userId: 'appraiser-001',
  sessionId: 'sess-test',
  roles: ['appraiser'],
};

const TOOL_STUB = { id: 'test', suite: 'forge', risk: 'read_only' };
const DOSSIER_TOOL_STUB = { id: 'test', suite: 'dossier', risk: 'read_only' };

// ══════════════════════════════════════════════════════════════════════
// CP-9: Handler 6 — explain_model_inputs
// ══════════════════════════════════════════════════════════════════════

describe('Handler: explain_model_inputs (real)', () => {
  it('returns model inputs from backend GET', async () => {
    mockFetch({
      inputs: [
        { name: 'condition', source: 'inspection', pii: false },
        { name: 'effective_age', source: 'records', pii: false },
        { name: 'owner_name', source: 'title', pii: true },
      ],
    });

    const result = await explainModelInputsRealHandler(
      { county: 'benton', modelId: 'cost-v2', asOfYear: 2026 },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.inputs.length, 3);
    assert.ok(result.summary.includes('cost-v2'));
    assert.ok(result.summary.includes('2026'));
    // Sorted by name
    assert.equal(result.inputs[0].name, 'condition');
    assert.equal(result.inputs[2].name, 'owner_name');
    assert.equal(result.inputs[2].pii, true);
  });

  it('normalizes modelInputs alternate response shape', async () => {
    mockFetch({
      modelInputs: [
        { field: 'location_factor', dataSource: 'geospatial', containsPii: false },
        { field: 'sale_comps', dataSource: 'market' },
      ],
    });

    const result = await explainModelInputsRealHandler(
      { county: 'benton', modelId: 'sales-v1', asOfYear: 2025 },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.inputs.length, 2);
    assert.equal(result.inputs[0].name, 'location_factor');
    assert.equal(result.inputs[0].source, 'geospatial');
    assert.equal(result.inputs[1].pii, false); // default
  });

  it('rejects county mismatch', async () => {
    await assert.rejects(
      () => explainModelInputsRealHandler(
        { county: 'yakima', modelId: 'cost-v2', asOfYear: 2026 },
        BENTON_CONTEXT,
        TOOL_STUB
      ),
      /County mismatch/
    );
  });

  it('propagates backend errors', async () => {
    mockFetchWithAuth({ error: 'Not found' }, 404);

    await assert.rejects(
      () => explainModelInputsRealHandler(
        { county: 'benton', modelId: 'nonexistent', asOfYear: 2026 },
        BENTON_CONTEXT,
        TOOL_STUB
      ),
      /Model inputs lookup failed/
    );
  });

  it('handles network failure', async () => {
    mockFetchError('ECONNREFUSED');

    await assert.rejects(
      () => explainModelInputsRealHandler(
        { county: 'benton', modelId: 'cost-v2', asOfYear: 2026 },
        BENTON_CONTEXT,
        TOOL_STUB
      ),
      /Backend unreachable/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════
// CP-9: Handler 7 — compare_assessed_value_history
// ══════════════════════════════════════════════════════════════════════

describe('Handler: compare_assessed_value_history (real)', () => {
  it('returns trend from backend property data', async () => {
    mockFetch({
      valuationHistory: [
        { year: 2023, value: 250000, taxableValue: 210000 },
        { year: 2024, value: 265000, taxableValue: 225000 },
        { year: 2025, value: 280000, taxableValue: 240000 },
      ],
    });

    const result = await compareAssessedValueHistoryRealHandler(
      { county: 'benton', parcelId: 'P-100', years: [2023, 2024, 2025] },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.trend.length, 3);
    assert.equal(result.trend[0].year, 2023);
    assert.equal(result.trend[0].av, 250000);
    assert.equal(result.trend[2].av, 280000);
    assert.ok(result.narrative.includes('250,000'));
    assert.ok(result.narrative.includes('280,000'));
    // No breakdown by default
    assert.equal(result.trend[0].tv, undefined);
  });

  it('includes taxable value when includeBreakdown=true', async () => {
    mockFetch({
      valuationHistory: [
        { year: 2024, value: 265000, taxableValue: 225000 },
        { year: 2025, value: 280000, taxableValue: 240000 },
      ],
    });

    const result = await compareAssessedValueHistoryRealHandler(
      { county: 'benton', parcelId: 'P-100', years: [2024, 2025], includeBreakdown: true },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.trend[0].tv, 225000);
    assert.equal(result.trend[1].tv, 240000);
    assert.ok(result.flags?.includes('breakdown_included'));
  });

  it('flags missing years when history is incomplete', async () => {
    mockFetch({
      valuationHistory: [
        { year: 2024, value: 265000 },
      ],
    });

    const result = await compareAssessedValueHistoryRealHandler(
      { county: 'benton', parcelId: 'P-100', years: [2023, 2024] },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.trend.length, 2);
    assert.equal(result.trend[0].av, 0); // 2023 not found
    assert.equal(result.trend[1].av, 265000);
    assert.ok(result.flags?.includes('missing_years'));
  });

  it('rejects county mismatch', async () => {
    await assert.rejects(
      () => compareAssessedValueHistoryRealHandler(
        { county: 'yakima', parcelId: 'P-100', years: [2024] },
        BENTON_CONTEXT,
        TOOL_STUB
      ),
      /County mismatch/
    );
  });

  it('propagates backend errors', async () => {
    mockFetchWithAuth({ error: 'Server error' }, 500);

    await assert.rejects(
      () => compareAssessedValueHistoryRealHandler(
        { county: 'benton', parcelId: 'P-100', years: [2024] },
        BENTON_CONTEXT,
        TOOL_STUB
      ),
      /Property history lookup failed/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════
// CP-9: Handler 8 — summarize_parcel_casefile
// ══════════════════════════════════════════════════════════════════════

describe('Handler: summarize_parcel_casefile (real)', () => {
  it('returns casefile summary from backend', async () => {
    mockFetch({
      summary: 'Casefile for parcel P-200 with 3 appeal records.',
      highlights: ['Appeal BOE-2024-001 resolved', 'Permit issued 2023-06', 'Sale recorded 2024-01'],
    });

    const result = await summarizeParcelCasefileRealHandler(
      { county: 'benton', parcelId: 'P-200', include: ['appeals', 'permits', 'sales'] },
      BENTON_CONTEXT,
      DOSSIER_TOOL_STUB
    );

    assert.ok(result.summary.includes('P-200'));
    assert.equal(result.highlights.length, 3);
    assert.ok(result.payloadRef.includes('benton'));
    assert.ok(result.payloadRef.includes('P-200'));
  });

  it('builds highlights from sections when highlights are missing', async () => {
    mockFetch({
      sections: {
        appeals: { count: 2, summary: 'Both resolved' },
        permits: { count: 1, summary: 'Closed' },
      },
    });

    const result = await summarizeParcelCasefileRealHandler(
      { county: 'benton', parcelId: 'P-300' },
      BENTON_CONTEXT,
      DOSSIER_TOOL_STUB
    );

    assert.equal(result.highlights.length, 2);
    assert.ok(result.highlights[0].includes('appeals'));
    assert.ok(result.highlights[1].includes('permits'));
  });

  it('builds highlights from documents when sections are missing', async () => {
    mockFetch({
      documents: [
        { type: 'Notice', date: '2024-03-15' },
        { type: 'Appeal Response', date: '2024-05-20' },
      ],
    });

    const result = await summarizeParcelCasefileRealHandler(
      { county: 'benton', parcelId: 'P-400' },
      BENTON_CONTEXT,
      DOSSIER_TOOL_STUB
    );

    assert.equal(result.highlights.length, 2);
    assert.ok(result.highlights[0].includes('Notice'));
  });

  it('generates default summary when backend has no summary field', async () => {
    mockFetch({ documents: [] });

    const result = await summarizeParcelCasefileRealHandler(
      { county: 'benton', parcelId: 'P-500', include: ['appeals'] },
      BENTON_CONTEXT,
      DOSSIER_TOOL_STUB
    );

    assert.ok(result.summary.includes('P-500'));
    assert.ok(result.summary.includes('1 section'));
  });

  it('rejects county mismatch', async () => {
    await assert.rejects(
      () => summarizeParcelCasefileRealHandler(
        { county: 'yakima', parcelId: 'P-200' },
        BENTON_CONTEXT,
        DOSSIER_TOOL_STUB
      ),
      /County mismatch/
    );
  });

  it('propagates backend errors (404 = endpoint not ready)', async () => {
    mockFetchWithAuth({ error: 'Not found' }, 404);

    await assert.rejects(
      () => summarizeParcelCasefileRealHandler(
        { county: 'benton', parcelId: 'P-200' },
        BENTON_CONTEXT,
        DOSSIER_TOOL_STUB
      ),
      /Casefile lookup failed/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════
// CP-10: TraceFeedAdapter
// ══════════════════════════════════════════════════════════════════════

describe('TraceFeedAdapter', () => {
  function makeTraceEvent(overrides = {}) {
    return {
      type: 'tool_invoked',
      toolId: 'run_valuation_model',
      correlationId: 'corr-001',
      context: {
        countyId: 'benton',
        userId: 'appraiser-001',
        roles: ['appraiser'],
        mode: 'pilot',
        parcelId: 'P-100',
      },
      summary: 'Valuation model invoked',
      ...overrides,
    };
  }

  async function createStoreWithEvents(events) {
    const store = new InMemoryTraceStore();
    const ts = new TraceService({ store });
    for (const e of events) {
      ts.emit(e);
    }
    // Small delay for fire-and-forget append
    await new Promise(r => setTimeout(r, 50));
    return store;
  }

  it('maps core events to feed events', async () => {
    const coreStore = await createStoreWithEvents([makeTraceEvent()]);
    const adapter = new TraceFeedAdapter(coreStore);

    const events = await adapter.listEvents({ countyId: 'benton' });

    assert.equal(events.length, 1);
    const e = events[0];
    assert.ok(e.id); // eventId mapped
    assert.ok(e.ts); // timestamp mapped
    assert.equal(e.countyId, 'benton');
    assert.equal(e.actorId, 'appraiser-001');
    assert.equal(e.subjectId, 'P-100');
    assert.equal(e.tool, 'run_valuation_model');
    assert.equal(e.kind, 'tool_invoked');
    assert.equal(e.message, 'Valuation model invoked');
    assert.equal(e.correlationId, 'corr-001');
  });

  it('filters by countyId', async () => {
    const coreStore = await createStoreWithEvents([
      makeTraceEvent(),
      makeTraceEvent({
        context: {
          countyId: 'yakima',
          userId: 'user-002',
          roles: ['appraiser'],
          mode: 'pilot',
          parcelId: 'P-200',
        },
      }),
    ]);
    const adapter = new TraceFeedAdapter(coreStore);

    const bentonEvents = await adapter.listEvents({ countyId: 'benton' });
    assert.equal(bentonEvents.length, 1);
    assert.equal(bentonEvents[0].countyId, 'benton');

    const yakimaEvents = await adapter.listEvents({ countyId: 'yakima' });
    assert.equal(yakimaEvents.length, 1);
    assert.equal(yakimaEvents[0].countyId, 'yakima');
  });

  it('filters by subjectId (parcelId)', async () => {
    const coreStore = await createStoreWithEvents([
      makeTraceEvent(),
      makeTraceEvent({
        context: {
          countyId: 'benton',
          userId: 'user-002',
          roles: ['appraiser'],
          mode: 'pilot',
          parcelId: 'P-999',
        },
      }),
    ]);
    const adapter = new TraceFeedAdapter(coreStore);

    const events = await adapter.listEvents({
      countyId: 'benton',
      subjectId: 'P-100',
    });

    assert.equal(events.length, 1);
    assert.equal(events[0].subjectId, 'P-100');
  });

  it('filters by since timestamp', async () => {
    const oldTime = '2020-01-01T00:00:00.000Z';
    const coreStore = await createStoreWithEvents([
      makeTraceEvent(),
    ]);
    const adapter = new TraceFeedAdapter(coreStore);

    // Since before events → should return event
    const events = await adapter.listEvents({
      countyId: 'benton',
      since: oldTime,
    });
    assert.equal(events.length, 1);

    // Since far future → should return 0
    const futureEvents = await adapter.listEvents({
      countyId: 'benton',
      since: '2099-01-01T00:00:00.000Z',
    });
    assert.equal(futureEvents.length, 0);
  });

  it('respects limit parameter', async () => {
    const events = Array.from({ length: 5 }, (_, i) =>
      makeTraceEvent({
        toolId: `tool_${i}`,
        correlationId: `corr-${i}`,
      })
    );
    const coreStore = await createStoreWithEvents(events);
    const adapter = new TraceFeedAdapter(coreStore);

    const limited = await adapter.listEvents({ countyId: 'benton', limit: 2 });
    assert.equal(limited.length, 2);
  });

  it('uses risk lookup map when provided', async () => {
    const coreStore = await createStoreWithEvents([makeTraceEvent()]);
    const riskMap = new Map([['run_valuation_model', 'write_high']]);
    const adapter = new TraceFeedAdapter(coreStore, riskMap);

    const events = await adapter.listEvents({ countyId: 'benton' });
    assert.equal(events[0].risk, 'write_high');
  });

  it('defaults risk to read_only when no lookup provided', async () => {
    const coreStore = await createStoreWithEvents([makeTraceEvent()]);
    const adapter = new TraceFeedAdapter(coreStore);

    const events = await adapter.listEvents({ countyId: 'benton' });
    assert.equal(events[0].risk, 'read_only');
  });

  it('returns empty array for county with no events', async () => {
    const coreStore = await createStoreWithEvents([makeTraceEvent()]);
    const adapter = new TraceFeedAdapter(coreStore);

    const events = await adapter.listEvents({ countyId: 'clark' });
    assert.equal(events.length, 0);
  });
});

// ══════════════════════════════════════════════════════════════════════
// CP-9: Handler 9 — add_dossier_note
// ══════════════════════════════════════════════════════════════════════

describe('Handler: add_dossier_note (real)', () => {
  it('posts note to backend and returns noteId', async () => {
    mockFetch({
      noteId: 'note-uuid-001',
      parcelId: 'P-100',
      createdAt: '2026-03-03T10:00:00Z',
    }, 201);

    const result = await addDossierNoteRealHandler(
      { county: 'benton', parcelId: 'P-100', note: 'Inspection complete' },
      BENTON_CONTEXT,
      DOSSIER_TOOL_STUB
    );

    assert.equal(result.noteId, 'note-uuid-001');
    assert.equal(result.appended, true);
    assert.ok(result.payloadRef.includes('benton'));
    assert.ok(result.payloadRef.includes('P-100'));
  });

  it('rejects empty note', async () => {
    await assert.rejects(
      () => addDossierNoteRealHandler(
        { county: 'benton', parcelId: 'P-100', note: '' },
        BENTON_CONTEXT,
        DOSSIER_TOOL_STUB
      ),
      /Note content is required/
    );
  });

  it('rejects notes exceeding 2000 characters', async () => {
    const longNote = 'x'.repeat(2001);
    await assert.rejects(
      () => addDossierNoteRealHandler(
        { county: 'benton', parcelId: 'P-100', note: longNote },
        BENTON_CONTEXT,
        DOSSIER_TOOL_STUB
      ),
      /Note exceeds 2000 character limit/
    );
  });

  it('rejects county mismatch', async () => {
    await assert.rejects(
      () => addDossierNoteRealHandler(
        { county: 'yakima', parcelId: 'P-100', note: 'Test' },
        BENTON_CONTEXT,
        DOSSIER_TOOL_STUB
      ),
      /County mismatch/
    );
  });

  it('propagates backend errors', async () => {
    mockFetchWithAuth({ error: 'Internal error' }, 500);

    await assert.rejects(
      () => addDossierNoteRealHandler(
        { county: 'benton', parcelId: 'P-100', note: 'Test' },
        BENTON_CONTEXT,
        DOSSIER_TOOL_STUB
      ),
      /Dossier note creation failed/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════
// CP-9: Handler 10 — query_parcel_layers
// ══════════════════════════════════════════════════════════════════════

describe('Handler: query_parcel_layers (real)', () => {
  it('returns layer list from backend', async () => {
    mockFetch({
      parcelId: 'P-100',
      layers: [
        { id: 'boundary', name: 'Parcel Boundary', available: true },
        { id: 'zoning', name: 'Zoning Districts', available: true },
        { id: 'flood', name: 'FEMA Flood Zones', available: true },
      ],
    });

    const result = await queryParcelLayersRealHandler(
      { county: 'benton', parcelId: 'P-100' },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.parcelId, 'P-100');
    assert.equal(result.layers.length, 3);
    assert.equal(result.layers[0].id, 'boundary');
    assert.equal(result.format, 'summary');
  });

  it('filters to requested layers', async () => {
    mockFetch({
      parcelId: 'P-100',
      layers: [
        { id: 'boundary', name: 'Parcel Boundary', available: true },
        { id: 'zoning', name: 'Zoning Districts', available: true },
        { id: 'flood', name: 'FEMA Flood Zones', available: true },
      ],
    });

    const result = await queryParcelLayersRealHandler(
      { county: 'benton', parcelId: 'P-100', layers: ['boundary', 'flood'] },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.layers.length, 2);
    assert.equal(result.layers[0].id, 'boundary');
    assert.equal(result.layers[1].id, 'flood');
  });

  it('rejects county mismatch', async () => {
    await assert.rejects(
      () => queryParcelLayersRealHandler(
        { county: 'yakima', parcelId: 'P-100' },
        BENTON_CONTEXT,
        TOOL_STUB
      ),
      /County mismatch/
    );
  });

  it('propagates backend 404 for unknown parcel', async () => {
    mockFetchWithAuth({ error: 'Parcel not found' }, 404);

    await assert.rejects(
      () => queryParcelLayersRealHandler(
        { county: 'benton', parcelId: 'P-UNKNOWN' },
        BENTON_CONTEXT,
        TOOL_STUB
      ),
      /Atlas layer query failed/
    );
  });
});
