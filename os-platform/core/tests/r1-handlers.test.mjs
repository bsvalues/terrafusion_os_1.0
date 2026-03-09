/**
 * TerraFusion OS – R1 Handler Unit Tests (CP-8)
 *
 * Tests all 5 real MVP handlers with mocked HTTP backend.
 * Validates:
 *   1. run_valuation_model       — POST /api/costforge/calculate
 *   2. explain_value_change      — GET  /api/properties/{id}
 *   3. route_to_parcel           — navigation (no backend)
 *   4. search_trace_by_correlation — real TraceService
 *   5. summarize_levy_rate_components — POST /api/levy-calculation/calculate-rate
 *   6. RBAC: county mismatch enforcement across all handlers
 *   7. Backend error propagation
 */

import assert from 'node:assert/strict';
import { before, afterEach, describe, it } from 'node:test';

let runValuationModelHandler,
  explainValueChangeHandler,
  routeToParcelHandler,
  createSearchTraceHandler,
  summarizeLevyRateRealHandler,
  TraceService;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const traceModule = await import('../trace/index.js');

  const pilot = pilotModule.default || pilotModule;
  const trace = traceModule.default || traceModule;

  runValuationModelHandler = pilot.runValuationModelHandler;
  explainValueChangeHandler = pilot.explainValueChangeHandler;
  routeToParcelHandler = pilot.routeToParcelHandler;
  createSearchTraceHandler = pilot.createSearchTraceHandler;
  summarizeLevyRateRealHandler = pilot.summarizeLevyRateRealHandler;
  TraceService = trace.TraceService;
});

// ── Mock Helpers ─────────────────────────────────────────────────────

const originalFetch = globalThis.fetch;

/** Mock a successful backend JSON response */
function mockFetch(data, status = 200) {
  globalThis.fetch = async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    text: async () => JSON.stringify(data),
  });
}

/** Mock a network failure */
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

// ══════════════════════════════════════════════════════════════════════
// 1. run_valuation_model
// ══════════════════════════════════════════════════════════════════════

describe('Handler: run_valuation_model', () => {
  it('returns valuation from backend POST', async () => {
    mockFetch({
      estimatedValue: 325000,
      confidence: 0.92,
      components: { land: 150000, improvements: 175000 },
    });

    const result = await runValuationModelHandler(
      { county: 'benton', parcelId: 'R12345', taxYear: 2026 },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.parcelId, 'R12345');
    assert.equal(result.taxYear, 2026);
    assert.equal(result.estimatedValue, 325000);
    assert.equal(result.confidence, 0.92);
    assert.ok(result.components.land === 150000);
  });

  it('defaults modelType to cost', async () => {
    mockFetch({ estimatedValue: 100000, confidence: 0.8, components: {} });

    const result = await runValuationModelHandler(
      { county: 'benton', parcelId: 'R99', taxYear: 2026 },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.modelType, 'cost');
  });

  it('passes through modelType when specified', async () => {
    mockFetch({ estimatedValue: 200000, confidence: 0.85, components: {} });

    const result = await runValuationModelHandler(
      { county: 'benton', parcelId: 'R99', taxYear: 2026, modelType: 'income' },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.modelType, 'income');
  });

  it('throws on county mismatch', async () => {
    mockFetch({});

    await assert.rejects(
      () => runValuationModelHandler(
        { county: 'clark', parcelId: 'R12345', taxYear: 2026 },
        BENTON_CONTEXT,
        TOOL_STUB
      ),
      /County mismatch/
    );
  });

  it('throws on missing county param', async () => {
    mockFetch({});

    await assert.rejects(
      () => runValuationModelHandler(
        { parcelId: 'R12345', taxYear: 2026 },
        BENTON_CONTEXT,
        TOOL_STUB
      ),
      /county is required/
    );
  });

  it('throws on backend error (500)', async () => {
    mockFetch({ error: 'internal' }, 500);

    await assert.rejects(
      () => runValuationModelHandler(
        { county: 'benton', parcelId: 'R12345', taxYear: 2026 },
        BENTON_CONTEXT,
        TOOL_STUB
      ),
      /Valuation model failed|Pilot auth failed/
    );
  });

  it('throws on network failure', async () => {
    mockFetchError('ECONNREFUSED');

    await assert.rejects(
      () => runValuationModelHandler(
        { county: 'benton', parcelId: 'R12345', taxYear: 2026 },
        BENTON_CONTEXT,
        TOOL_STUB
      ),
      /Valuation model failed|Backend unreachable/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════
// 2. explain_value_change
// ══════════════════════════════════════════════════════════════════════

describe('Handler: explain_value_change', () => {
  it('generates explanation from property history', async () => {
    mockFetch({
      assessedValue: 350000,
      previousAssessedValue: 300000,
      valuationHistory: [
        { year: 2025, value: 300000 },
        { year: 2026, value: 350000 },
      ],
    });

    const result = await explainValueChangeHandler(
      { county: 'benton', parcelId: 'R100', fromYear: 2025, toYear: 2026 },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.parcelId, 'R100');
    assert.equal(result.fromYear, 2025);
    assert.equal(result.toYear, 2026);
    assert.equal(result.delta, 50000);
    assert.ok(result.explanation.includes('300,000'));
    assert.ok(result.explanation.includes('350,000'));
    assert.ok(result.drivers.includes('market_appreciation'));
  });

  it('uses taxpayer-friendly prefix when audience=taxpayer', async () => {
    mockFetch({
      valuationHistory: [
        { year: 2025, value: 200000 },
        { year: 2026, value: 210000 },
      ],
    });

    const result = await explainValueChangeHandler(
      { county: 'benton', parcelId: 'R200', fromYear: 2025, toYear: 2026, audience: 'taxpayer' },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.ok(result.explanation.startsWith("Your property's assessed value"));
  });

  it('detects significant_adjustment when delta > 10%', async () => {
    mockFetch({
      valuationHistory: [
        { year: 2025, value: 100000 },
        { year: 2026, value: 200000 },
      ],
    });

    const result = await explainValueChangeHandler(
      { county: 'benton', parcelId: 'R300', fromYear: 2025, toYear: 2026 },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.ok(result.drivers.includes('significant_adjustment'));
  });

  it('detects stable_market when no change', async () => {
    mockFetch({
      valuationHistory: [
        { year: 2025, value: 200000 },
        { year: 2026, value: 200000 },
      ],
    });

    const result = await explainValueChangeHandler(
      { county: 'benton', parcelId: 'R400', fromYear: 2025, toYear: 2026 },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.ok(result.drivers.includes('stable_market'));
    assert.equal(result.delta, 0);
  });

  it('throws on county mismatch', async () => {
    await assert.rejects(
      () => explainValueChangeHandler(
        { county: 'clark', parcelId: 'R100', fromYear: 2025, toYear: 2026 },
        BENTON_CONTEXT,
        TOOL_STUB
      ),
      /County mismatch/
    );
  });
});

// ══════════════════════════════════════════════════════════════════════
// 3. route_to_parcel
// ══════════════════════════════════════════════════════════════════════

describe('Handler: route_to_parcel', () => {
  it('generates canonical navigation URL', async () => {
    const result = await routeToParcelHandler(
      { county: 'benton', parcelId: 'R12345' },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.navigateTo, '/property/R12345/summary');
    assert.equal(result.parcelId, 'R12345');
    assert.equal(result.tab, 'summary');
  });

  it('respects tab parameter', async () => {
    const result = await routeToParcelHandler(
      { county: 'benton', parcelId: 'R12345', tab: 'forge' },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.navigateTo, '/property/R12345/forge');
    assert.equal(result.tab, 'forge');
  });

  it('encodes special characters in parcelId', async () => {
    const result = await routeToParcelHandler(
      { county: 'benton', parcelId: 'R 123/45' },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.ok(result.navigateTo.includes('R%20123%2F45'));
  });

  it('throws on county mismatch', async () => {
    await assert.rejects(
      () => routeToParcelHandler(
        { county: 'clark', parcelId: 'R12345' },
        BENTON_CONTEXT,
        TOOL_STUB
      ),
      /County mismatch/
    );
  });

  it('supports all valid tabs', async () => {
    const tabs = ['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot'];
    for (const tab of tabs) {
      const result = await routeToParcelHandler(
        { county: 'benton', parcelId: 'R1', tab },
        BENTON_CONTEXT,
        TOOL_STUB
      );
      assert.equal(result.tab, tab);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
// 4. search_trace_by_correlation
// ══════════════════════════════════════════════════════════════════════

describe('Handler: search_trace_by_correlation', () => {
  it('returns events from TraceService', async () => {
    const svc = new TraceService();
    const handler = createSearchTraceHandler(svc);

    // Emit some events
    svc.emit({
      type: 'tool_invoked',
      toolId: 'run_valuation_model',
      correlationId: 'corr-abc',
      summary: 'invoked',
      context: { countyId: 'benton', userId: 'u1', sessionId: 's1' },
    });
    svc.emit({
      type: 'tool_succeeded',
      toolId: 'run_valuation_model',
      correlationId: 'corr-abc',
      summary: 'success',
      context: { countyId: 'benton', userId: 'u1', sessionId: 's1' },
    });

    const result = await handler(
      { county: 'benton', correlationId: 'corr-abc' },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.found, true);
    assert.equal(result.events.length, 2);
    // query() returns newest-first; within same-ms events the order may vary,
    // so assert on set membership rather than positional type.
    const types = result.events.map(e => e.type).sort();
    assert.deepEqual(types, ['tool_invoked', 'tool_succeeded']);
  });

  it('returns found:false when no matching events', async () => {
    const svc = new TraceService();
    const handler = createSearchTraceHandler(svc);

    const result = await handler(
      { county: 'benton', correlationId: 'nonexistent' },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.found, false);
    assert.equal(result.events.length, 0);
  });

  it('respects limit parameter', async () => {
    const svc = new TraceService();
    const handler = createSearchTraceHandler(svc);

    for (let i = 0; i < 10; i++) {
      svc.emit({
        type: 'tool_invoked',
        toolId: `tool_${i}`,
        correlationId: 'corr-many',
        summary: `event ${i}`,
        context: { countyId: 'benton', userId: 'u1', sessionId: 's1' },
      });
    }

    const result = await handler(
      { county: 'benton', correlationId: 'corr-many', limit: 3 },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.events.length, 3);
  });

  it('throws on county mismatch', async () => {
    const svc = new TraceService();
    const handler = createSearchTraceHandler(svc);

    await assert.rejects(
      () => handler(
        { county: 'clark', correlationId: 'corr-abc' },
        BENTON_CONTEXT,
        TOOL_STUB
      ),
      /County mismatch/
    );
  });

  it('returns metadata only (no full events)', async () => {
    const svc = new TraceService();
    const handler = createSearchTraceHandler(svc);

    svc.emit({
      type: 'tool_invoked',
      toolId: 'run_valuation_model',
      correlationId: 'corr-meta',
      summary: 'secret info here',
      context: { countyId: 'benton', userId: 'u1', sessionId: 's1' },
    });

    const result = await handler(
      { county: 'benton', correlationId: 'corr-meta' },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    // Should only have ts, type, toolId — NOT full summary/context
    const event = result.events[0];
    assert.ok(typeof event.ts === 'number');
    assert.ok(typeof event.type === 'string');
    assert.equal(event.summary, undefined, 'no summary in metadata');
    assert.equal(event.context, undefined, 'no context in metadata');
  });
});

// ══════════════════════════════════════════════════════════════════════
// 5. summarize_levy_rate_components
// ══════════════════════════════════════════════════════════════════════

describe('Handler: summarize_levy_rate_components', () => {
  it('returns levy components from calculate-rate response', async () => {
    mockFetch({
      aiOptimalRate: 7.42,
      baseRate: 7.5,
      statutoryLimit: 10.0,
      projectedRevenue: 11130,
    });

    const result = await summarizeLevyRateRealHandler(
      { county: 'benton', taxYear: 2026 },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.components.length, 3);
    assert.equal(result.totalRate, 7.42);
    assert.ok(result.explanation.includes('2026'));
    assert.ok(result.explanation.includes('7.42'));
    // Sorted by rate descending
    assert.ok(result.components[0].rate >= result.components[1].rate);
  });

  it('maps named component fields from backend response', async () => {
    mockFetch({
      aiOptimalRate: 3.3,
      baseRate: 3.1,
      statutoryLimit: 5.9,
      projectedRevenue: 4950,
    });

    const result = await summarizeLevyRateRealHandler(
      { county: 'benton', taxYear: 2026 },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.equal(result.components.length, 3);
    assert.equal(result.totalRate, 3.3);
    assert.equal(result.components[0].name, 'Statutory Limit');
  });

  it('includes district scope in explanation when districtCode provided', async () => {
    mockFetch({
      components: [{ name: 'Tax Levy', rate: 5.0 }],
      totalRate: 5.0,
    });

    const result = await summarizeLevyRateRealHandler(
      { county: 'benton', taxYear: 2026, districtCode: 'RICH-001' },
      BENTON_CONTEXT,
      TOOL_STUB
    );

    assert.ok(result.explanation.includes('RICH-001'));
  });

  it('throws on county mismatch', async () => {
    mockFetch({});

    await assert.rejects(
      () => summarizeLevyRateRealHandler(
        { county: 'clark', taxYear: 2026 },
        BENTON_CONTEXT,
        TOOL_STUB
      ),
      /County mismatch/
    );
  });

  it('throws on backend error', async () => {
    mockFetch({ error: 'calculation failed' }, 500);

    await assert.rejects(
      () => summarizeLevyRateRealHandler(
        { county: 'benton', taxYear: 2026 },
        BENTON_CONTEXT,
        TOOL_STUB
      ),
      /Levy rate calculation failed|Pilot auth failed/
    );
  });
});
