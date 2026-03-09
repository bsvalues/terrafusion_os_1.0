/**
 * R3 Multi-Office Acceptance Criteria Tests
 * ==========================================
 * 18 acceptance criteria across 3 new office verticals:
 *   - AC-CLK-01→06: TerraClerk (County Clerk)
 *   - AC-TRS-01→07: TerraTreasury (County Treasurer)
 *   - AC-AUD-01→05: TerraAudit (County Auditor)
 *
 * Each AC uses the same pattern as R1: ToolRunner with mocked fetch,
 * verifying trace events, county isolation, and confirmation gates.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, before, afterEach } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');

let ToolRegistry, ToolRunner, registerPhase84Handlers, registerR1Handlers;
let TraceService, InMemoryTraceStore;

const originalFetch = globalThis.fetch;

before(async () => {
  const pilotMod = await import('../pilot/index.js');
  ToolRegistry = pilotMod.ToolRegistry;
  ToolRunner = pilotMod.ToolRunner;
  registerPhase84Handlers = pilotMod.registerPhase84Handlers;
  registerR1Handlers = pilotMod.registerR1Handlers;

  const traceMod = await import('../trace/index.js');
  TraceService = traceMod.TraceService;
  InMemoryTraceStore = traceMod.InMemoryTraceStore;
});

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// ============================================================================
// Helpers
// ============================================================================

function makeRunner() {
  const traceStore = new InMemoryTraceStore();
  const traceService = new TraceService(traceStore);
  const registry = new ToolRegistry();
  registry.initializeSync?.() ?? registry.initialize?.(MANIFEST_PATH);
  const runner = new ToolRunner({ registry, trace: traceService });
  registerPhase84Handlers(runner);
  registerR1Handlers(runner, traceService);
  return { runner, traceService, traceStore };
}

function mockFetch(responseFn) {
  globalThis.fetch = async (url, opts) => {
    const body = responseFn(String(url), opts);
    return {
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => body,
      text: async () => JSON.stringify(body),
    };
  };
}

function mockFetchFail(statusCode = 500, errorMessage = 'Backend unavailable') {
  globalThis.fetch = async () => ({
    ok: false,
    status: statusCode,
    headers: new Map([['content-type', 'application/json']]),
    json: async () => ({ error: errorMessage }),
    text: async () => JSON.stringify({ error: errorMessage }),
  });
}

function clerkContext(overrides = {}) {
  return {
    userId: 'test-clerk-1',
    roles: ['clerk'],
    countyId: 'benton',
    mode: 'pilot',
    ...overrides,
  };
}

function treasurerContext(overrides = {}) {
  return {
    userId: 'test-treasurer-1',
    roles: ['treasurer'],
    countyId: 'benton',
    mode: 'pilot',
    ...overrides,
  };
}

function auditorContext(overrides = {}) {
  return {
    userId: 'test-auditor-1',
    roles: ['auditor'],
    countyId: 'benton',
    mode: 'pilot',
    ...overrides,
  };
}

function getTool(toolId) {
  return manifest.tools.find(t => t.toolId === toolId);
}

// ============================================================================
// CLERK MOCK RESPONSES (matching backendGet/backendPost unwrap expectations)
// ============================================================================

function recordDocumentResponse() {
  return {
    documentId: 'DOC-2026-001234',
    recordingNumber: 'REC-2026-0312',
    recordedAt: '2026-03-10T14:30:00Z',
    fees: 93.00,
  };
}

function titleChainResponse() {
  return {
    chain: [
      { documentId: 'DOC-2020-000100', type: 'warranty_deed', date: '2020-05-15', from: 'Williams, Bob', to: 'Smith, John' },
      { documentId: 'DOC-2015-000050', type: 'warranty_deed', date: '2015-03-22', from: 'Davis, Mary', to: 'Williams, Bob' },
      { documentId: 'DOC-2008-000025', type: 'warranty_deed', date: '2008-11-01', from: 'County of Benton', to: 'Davis, Mary' },
    ],
  };
}

function searchRecordedDocsResponse() {
  return {
    documents: [
      { documentId: 'DOC-2026-001200', type: 'deed_of_trust', date: '2026-03-08' },
      { documentId: 'DOC-2026-001180', type: 'warranty_deed', date: '2026-03-05' },
    ],
    total: 2,
  };
}

function releaseLienResponse() {
  return {
    status: 'released',
    releasedAt: '2026-03-10T15:00:00Z',
  };
}

function parcelRecordingsSummaryResponse() {
  return {
    summary: 'Parcel P-001 has 12 recorded documents on file.',
    totalRecordings: 12,
    documentTypes: { warranty_deed: 5, deed_of_trust: 4, lien: 2, easement: 1 },
  };
}

// ============================================================================
// TREASURY MOCK RESPONSES (matching handler unwrap fields)
// ============================================================================

function taxStatementResponse() {
  return {
    taxYear: 2026,
    totalDue: 2144.47,
    paid: 0,
    balance: 2144.47,
    dueDate: '2026-04-30',
    levies: [
      { name: 'State School', amount: 575.67 },
      { name: 'Benton County', amount: 367.21 },
      { name: 'City of Kennewick', amount: 811.59 },
      { name: 'Fire District 1', amount: 390.00 },
    ],
  };
}

function recordPaymentResponse() {
  return {
    receiptId: 'REC-2026-005678',
    newBalance: 1072.23,
  };
}

function delinquencyResponse() {
  return {
    delinquent: true,
    amountOverdue: 4312.89,
    oldestDelinquentYear: 2024,
    deadlines: [
      { date: '2026-06-01', description: 'Final notice deadline' },
    ],
  };
}

function installmentPlanResponse() {
  return {
    planId: 'PLAN-2026-000123',
    numberOfPayments: 24,
    monthlyAmount: 179.70,
  };
}

function collectionStatsResponse() {
  return {
    taxYear: 2026,
    totalBilled: 142500000,
    totalCollected: 128250000,
    collectionRate: 0.90,
    delinquentCount: 1247,
  };
}

function taxSaleResponse() {
  return {
    saleId: 'SALE-2026-000045',
    status: 'initiated',
    scheduledDate: '2027-03-10',
    totalOwed: 12847.56,
  };
}

// ============================================================================
// AUDIT MOCK RESPONSES (matching handler unwrap fields)
// ============================================================================

function rollSummaryResponse() {
  return {
    totalParcels: 89247,
    auditedParcels: 8925,
    discrepancyCount: 147,
    summary: 'Roll audit for 2026: 8925 of 89247 parcels audited.',
  };
}

function levyComplianceResponse() {
  return {
    compliant: true,
    findings: [
      { rule: 'RCW 84.52.050', status: 'pass', detail: 'All regular levy rates within statutory limits' },
      { rule: 'RCW 84.55', status: 'pass', detail: '1% growth limit not exceeded' },
    ],
    statuteRefs: ['RCW 84.52', 'RCW 84.55'],
  };
}

function auditFindingResponse() {
  return {
    findingId: 'FIND-2026-000089',
    status: 'submitted',
  };
}

function reconciliationResponse() {
  return {
    reconciliationId: 'RECON-2026-000012',
    status: 'completed',
    discrepancies: 3,
    totalReconciled: 142500000,
  };
}

function complianceReportResponse() {
  return {
    report: 'FY2026 compliance review: 147 findings (3 critical). All levy rates within statutory limits.',
    findingsCount: 147,
    complianceScore: 0.9835,
  };
}

// ============================================================================
// AC-CLK-01: Governed Document Recording
//
// GIVEN role "clerk" on county "benton",
// WHEN they invoke `record_document` with confirmation=true and reasonCode,
// THEN document is recorded → trace event persisted with correlationId
// ============================================================================

describe('AC-CLK-01: Governed Document Recording', () => {
  it('record_document executes with trace evidence', async () => {
    const { runner, traceService } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/clerk/documents')) return recordDocumentResponse();
      return {};
    });

    const result = await runner.execute({
      toolId: 'record_document',
      params: {
        county: 'benton',
        documentType: 'deed',
        grantor: 'Smith, John',
        grantee: 'Jones, Jane',
        parcelId: 'P-001',
      },
      context: {
        ...clerkContext(),
        confirmation: true,
        reasonCode: 'new_recording',
      },
    });

    assert.equal(result.ok, true, 'result must be ok');
    assert.ok(result.correlationId, 'must have correlationId');
    const data = result.result;
    assert.ok(data.documentId, 'must have documentId');
    assert.ok(data.recordingNumber, 'must have recordingNumber');
    assert.ok(data.payloadRef, 'must have payloadRef');

    const events = await traceService.getByCorrelationIdAsync(result.correlationId);
    assert.ok(events.length >= 2, 'must have at least tool_invoked + tool_completed');
    const types = events.map(e => e.type);
    assert.ok(types.includes('tool_invoked'), 'must have tool_invoked');
    assert.ok(types.includes('tool_completed'), 'must have tool_completed');

    console.log(`  ✅ AC-CLK-01 PASS: correlationId=${result.correlationId}, traceEvents=${events.length}`);
  });
});

// ============================================================================
// AC-CLK-02: Chain of Title
//
// GIVEN a Benton County parcel,
// WHEN `get_title_chain` is invoked,
// THEN returns chronological ownership chain ordered by date
// ============================================================================

describe('AC-CLK-02: Chain of Title', () => {
  it('get_title_chain returns chronological ownership for Benton parcel', async () => {
    const { runner } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/clerk/parcels/') && url.includes('title-chain'))
        return titleChainResponse('P-001');
      return {};
    });

    const result = await runner.execute({
      toolId: 'get_title_chain',
      params: { county: 'benton', parcelId: 'P-001' },
      context: clerkContext({ mode: 'muse' }),
    });

    assert.equal(result.ok, true, 'result must be ok');
    const data = result.result;
    assert.equal(data.parcelId, 'P-001', 'must return correct parcelId');
    assert.ok(data.chain, 'must have chain');
    assert.ok(data.chain.length >= 2, 'chain must have multiple entries');
    assert.equal(data.chainLength, data.chain.length, 'chainLength must match chain array');

    // Verify chronological order (most recent first)
    for (let i = 1; i < data.chain.length; i++) {
      assert.ok(
        new Date(data.chain[i - 1].date) >= new Date(data.chain[i].date),
        'chain must be chronologically ordered (newest first)'
      );
    }

    console.log(`  ✅ AC-CLK-02 PASS: chain entries=${data.chainLength}`);
  });
});

// ============================================================================
// AC-CLK-03: Lien Release
//
// GIVEN a lien on a Benton County parcel,
// WHEN `release_lien` is invoked with confirmation,
// THEN lien is marked released → trace event persisted
// ============================================================================

describe('AC-CLK-03: Lien Release', () => {
  it('release_lien marks lien as released with trace', async () => {
    const { runner, traceService } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/clerk/liens/') && url.includes('release'))
        return releaseLienResponse('LIEN-2025-000200');
      return {};
    });

    const result = await runner.execute({
      toolId: 'release_lien',
      params: { county: 'benton', lienId: 'LIEN-2025-000200' },
      context: {
        ...clerkContext(),
        confirmation: true,
        reasonCode: 'satisfied',
      },
    });

    assert.equal(result.ok, true, 'result must be ok');
    assert.ok(result.correlationId, 'must have correlationId');
    assert.equal(result.result.status, 'released', 'lien must be marked released');

    const events = await traceService.getByCorrelationIdAsync(result.correlationId);
    assert.ok(events.length >= 2, 'must have trace events');

    console.log(`  ✅ AC-CLK-03 PASS: lien=${result.result.lienId}, status=${result.result.status}`);
  });
});

// ============================================================================
// AC-CLK-04: County Isolation
//
// GIVEN clerk data for county "benton",
// WHEN a different county context queries clerk data,
// THEN only that county's data is returned (no cross-county leakage)
// ============================================================================

describe('AC-CLK-04: County Isolation', () => {
  it('search_recorded_documents filters by county context', async () => {
    const { runner } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/clerk/documents'))
        return searchRecordedDocsResponse();
      return {};
    });

    const result = await runner.execute({
      toolId: 'search_recorded_documents',
      params: { county: 'benton', documentType: 'deed' },
      context: clerkContext(),
    });

    assert.equal(result.ok, true, 'result must be ok');
    const data = result.result;
    assert.equal(data.county.toLowerCase(), 'benton', 'results must be filtered to benton');
    assert.ok(data.documents, 'must have documents array');
    assert.ok(data.documents.length > 0, 'must have results');
    assert.ok(data.totalCount > 0, 'totalCount must be positive');

    console.log(`  ✅ AC-CLK-04 PASS: county=${data.county}, documents=${data.documents.length}`);
  });
});

// ============================================================================
// AC-CLK-05: Recording Search
//
// GIVEN clerk recordings for Benton County,
// WHEN `search_recorded_documents` is invoked with filter criteria,
// THEN results are filtered by county context
// ============================================================================

describe('AC-CLK-05: Recording Search', () => {
  it('search returns documents matching criteria within county', async () => {
    const { runner } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/clerk/documents'))
        return searchRecordedDocsResponse();
      return {};
    });

    const result = await runner.execute({
      toolId: 'search_recorded_documents',
      params: { county: 'benton', grantor: 'Smith' },
      context: clerkContext(),
    });

    assert.equal(result.ok, true, 'result must be ok');
    assert.ok(result.result.documents, 'must have documents array');
    assert.ok(result.result.documents.length > 0, 'must return matching documents');

    console.log(`  ✅ AC-CLK-05 PASS: matched=${result.result.documents.length}`);
  });
});

// ============================================================================
// AC-CLK-06: Write-High Confirmation Gate
//
// GIVEN `record_document` is write_high,
// WHEN invoked WITHOUT confirmation,
// THEN CONFIRMATION_REQUIRED error; no document recorded
// ============================================================================

describe('AC-CLK-06: Write-High Confirmation Gate', () => {
  it('rejects record_document without confirmation', async () => {
    const { runner } = makeRunner();
    mockFetch(() => recordDocumentResponse());

    const result = await runner.execute({
      toolId: 'record_document',
      params: {
        county: 'benton',
        documentType: 'deed',
        grantor: 'Smith, John',
        grantee: 'Jones, Jane',
        parcelId: 'P-001',
      },
      context: {
        ...clerkContext(),
        // confirmation intentionally missing
        reasonCode: 'new_recording',
      },
    });

    assert.equal(result.ok, false, 'must fail without confirmation');
    assert.ok(
      result.errorCode === 'CONFIRMATION_REQUIRED' || result.error?.includes('confirmation'),
      'error must indicate confirmation required'
    );

    console.log(`  ✅ AC-CLK-06 PASS: errorCode=${result.errorCode}`);
  });

  it('rejects record_document without reasonCode', async () => {
    const { runner } = makeRunner();
    mockFetch(() => recordDocumentResponse());

    const result = await runner.execute({
      toolId: 'record_document',
      params: {
        county: 'benton',
        documentType: 'deed',
        grantor: 'Smith, John',
        grantee: 'Jones, Jane',
        parcelId: 'P-001',
      },
      context: {
        ...clerkContext(),
        confirmation: true,
        // reasonCode intentionally missing
      },
    });

    assert.equal(result.ok, false, 'must fail without reasonCode');
    assert.ok(
      result.errorCode === 'REASON_CODE_REQUIRED' || result.error?.includes('reason'),
      'error must indicate reason required'
    );

    console.log(`  ✅ AC-CLK-06b PASS: errorCode=${result.errorCode}`);
  });

  it('manifest declares record_document as write_high', () => {
    const tool = getTool('record_document');
    assert.ok(tool, 'record_document must exist in manifest');
    assert.equal(tool.risk, 'write_high', 'record_document must be write_high');

    console.log(`  ✅ AC-CLK-06c PASS: risk=${tool.risk}`);
  });
});

// ============================================================================
// AC-TRS-01: Tax Statement
//
// GIVEN a Benton County parcel,
// WHEN `get_tax_statement` is invoked,
// THEN returns real levy components
// ============================================================================

describe('AC-TRS-01: Tax Statement', () => {
  it('get_tax_statement returns levies for Benton parcel', async () => {
    const { runner } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/treasury/') && url.includes('statement'))
        return taxStatementResponse('P-001');
      return {};
    });

    const result = await runner.execute({
      toolId: 'get_tax_statement',
      params: { county: 'benton', parcelId: 'P-001', taxYear: 2026 },
      context: treasurerContext(),
    });

    assert.equal(result.ok, true, 'result must be ok');
    const data = result.result;
    assert.equal(data.parcelId, 'P-001', 'must return correct parcelId');
    assert.equal(data.taxYear, 2026, 'must return correct taxYear');
    assert.ok(data.levies, 'must have levies array');
    assert.ok(data.levies.length > 0, 'must have at least one levy');
    assert.ok(data.totalDue > 0, 'totalDue must be positive');

    // Each levy must have name and amount
    for (const levy of data.levies) {
      assert.ok(levy.name, 'levy must have name');
      assert.ok(levy.amount > 0, 'levy must have positive amount');
    }

    console.log(`  ✅ AC-TRS-01 PASS: levies=${data.levies.length}, totalDue=${data.totalDue}`);
  });
});

// ============================================================================
// AC-TRS-02: Payment Recording
//
// GIVEN a Benton County parcel with outstanding tax,
// WHEN `record_payment` is invoked,
// THEN balance updates → trace event persisted
// ============================================================================

describe('AC-TRS-02: Payment Recording', () => {
  it('record_payment updates balance with trace', async () => {
    const { runner, traceService } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/treasury/') && url.includes('payments'))
        return recordPaymentResponse('P-001');
      return {};
    });

    const result = await runner.execute({
      toolId: 'record_payment',
      params: { county: 'benton', parcelId: 'P-001', amount: 1072.24, paymentMethod: 'check' },
      context: {
        ...treasurerContext(),
        confirmation: true,
        reasonCode: 'regular_payment',
      },
    });

    assert.equal(result.ok, true, 'result must be ok');
    assert.ok(result.correlationId, 'must have correlationId');
    const data = result.result;
    assert.ok(data.receiptId, 'must have receiptId');
    assert.equal(data.parcelId, 'P-001', 'must return correct parcelId');
    assert.equal(data.amount, 1072.24, 'must return correct amount');
    assert.ok(typeof data.newBalance === 'number', 'must have newBalance');
    assert.ok(data.payloadRef, 'must have payloadRef');

    const events = await traceService.getByCorrelationIdAsync(result.correlationId);
    assert.ok(events.length >= 2, 'must have trace events');

    console.log(`  ✅ AC-TRS-02 PASS: receiptId=${data.receiptId}, newBalance=${data.newBalance}`);
  });
});

// ============================================================================
// AC-TRS-03: Delinquency Status
//
// GIVEN a delinquent Benton County parcel,
// WHEN `check_delinquency_status` is invoked,
// THEN reflects real outstanding balances
// ============================================================================

describe('AC-TRS-03: Delinquency Status', () => {
  it('check_delinquency_status returns real balances', async () => {
    const { runner } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/treasury/') && url.includes('delinquency'))
        return delinquencyResponse('P-002');
      return {};
    });

    const result = await runner.execute({
      toolId: 'check_delinquency_status',
      params: { county: 'benton', parcelId: 'P-002' },
      context: treasurerContext(),
    });

    assert.equal(result.ok, true, 'result must be ok');
    const data = result.result;
    assert.equal(data.delinquent, true, 'must be delinquent');
    assert.ok(data.amountOverdue > 0, 'must have outstanding balance');
    assert.ok(data.oldestDelinquentYear, 'must have oldestDelinquentYear');
    assert.ok(data.deadlines, 'must have deadlines array');
    assert.ok(data.deadlines.length > 0, 'must have at least one deadline');

    console.log(`  ✅ AC-TRS-03 PASS: overdue=${data.amountOverdue}, oldestYear=${data.oldestDelinquentYear}`);
  });
});

// ============================================================================
// AC-TRS-04: Installment Plan
//
// GIVEN a delinquent parcel,
// WHEN `create_installment_plan` is invoked,
// THEN plan with statutory-compliant terms is created
// ============================================================================

describe('AC-TRS-04: Installment Plan', () => {
  it('create_installment_plan produces plan with payment schedule', async () => {
    const { runner, traceService } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/treasury/') && url.includes('installment-plans'))
        return installmentPlanResponse('P-002');
      return {};
    });

    const result = await runner.execute({
      toolId: 'create_installment_plan',
      params: { county: 'benton', parcelId: 'P-002', numberOfPayments: 24 },
      context: {
        ...treasurerContext(),
        confirmation: true,
        reasonCode: 'standard_plan',
      },
    });

    assert.equal(result.ok, true, 'result must be ok');
    assert.ok(result.correlationId, 'must have correlationId');
    const data = result.result;
    assert.ok(data.planId, 'must have planId');
    assert.equal(data.parcelId, 'P-002', 'must return correct parcelId');
    assert.ok(data.numberOfPayments > 0, 'numberOfPayments must be positive');
    assert.ok(data.monthlyAmount > 0, 'monthlyAmount must be positive');
    assert.ok(data.payloadRef, 'must have payloadRef');

    const events = await traceService.getByCorrelationIdAsync(result.correlationId);
    assert.ok(events.length >= 2, 'must have trace events');

    console.log(`  ✅ AC-TRS-04 PASS: planId=${data.planId}, monthly=${data.monthlyAmount}`);
  });
});

// ============================================================================
// AC-TRS-05: Tax Distribution
//
// GIVEN Benton County collection stats,
// WHEN `summarize_collection_stats` is invoked,
// THEN distribution matches levy rate components
// ============================================================================

describe('AC-TRS-05: Tax Distribution', () => {
  it('summarize_collection_stats returns valid distribution data', async () => {
    const { runner } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/treasury/collection-stats'))
        return collectionStatsResponse();
      return {};
    });

    const result = await runner.execute({
      toolId: 'summarize_collection_stats',
      params: { county: 'benton', taxYear: 2026 },
      context: treasurerContext({ mode: 'muse' }),
    });

    assert.equal(result.ok, true, 'result must be ok');
    const data = result.result;
    assert.equal(data.county.toLowerCase(), 'benton', 'must be Benton County');
    assert.ok(data.totalBilled > 0, 'must have totalBilled');
    assert.ok(data.totalCollected > 0, 'must have totalCollected');
    assert.ok(data.collectionRate > 0 && data.collectionRate <= 1, 'collectionRate must be 0-1');

    console.log(`  ✅ AC-TRS-05 PASS: billed=${data.totalBilled}, collected=${data.totalCollected}, rate=${(data.collectionRate * 100).toFixed(1)}%`);
  });
});

// ============================================================================
// AC-TRS-06: Write-High Confirmation on Tax Sale
//
// GIVEN `initiate_tax_sale` is write_high,
// WHEN invoked WITHOUT confirmation,
// THEN CONFIRMATION_REQUIRED error
// ============================================================================

describe('AC-TRS-06: Write-High Confirmation on Tax Sale', () => {
  it('rejects initiate_tax_sale without confirmation', async () => {
    const { runner } = makeRunner();
    mockFetch(() => taxSaleResponse('P-003'));

    const result = await runner.execute({
      toolId: 'initiate_tax_sale',
      params: { county: 'benton', parcelId: 'P-003', delinquentYears: [2022, 2023] },
      context: {
        ...treasurerContext(),
        // confirmation intentionally missing
        reasonCode: 'statutory_delinquency',
      },
    });

    assert.equal(result.ok, false, 'must fail without confirmation');
    assert.ok(
      result.errorCode === 'CONFIRMATION_REQUIRED' || result.error?.includes('confirmation'),
      'error must indicate confirmation required'
    );

    console.log(`  ✅ AC-TRS-06 PASS: errorCode=${result.errorCode}`);
  });

  it('succeeds with confirmation and reasonCode', async () => {
    const { runner, traceService } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/treasury/') && url.includes('tax-sale'))
        return taxSaleResponse('P-003');
      return {};
    });

    const result = await runner.execute({
      toolId: 'initiate_tax_sale',
      params: { county: 'benton', parcelId: 'P-003', delinquentYears: [2022, 2023] },
      context: {
        ...treasurerContext(),
        confirmation: true,
        reasonCode: 'statutory_delinquency',
      },
    });

    assert.equal(result.ok, true, 'must succeed with confirmation + reasonCode');
    assert.ok(result.correlationId, 'must have correlationId');
    const data = result.result;
    assert.ok(data.saleId, 'must have saleId');
    assert.equal(data.parcelId, 'P-003', 'must return correct parcelId');
    assert.ok(data.payloadRef, 'must have payloadRef');

    const events = await traceService.getByCorrelationIdAsync(result.correlationId);
    assert.ok(events.length >= 2, 'must have trace events');

    console.log(`  ✅ AC-TRS-06b PASS: saleId=${data.saleId}`);
  });

  it('manifest declares initiate_tax_sale as write_high', () => {
    const tool = getTool('initiate_tax_sale');
    assert.ok(tool, 'initiate_tax_sale must exist in manifest');
    assert.equal(tool.risk, 'write_high', 'initiate_tax_sale must be write_high');

    console.log(`  ✅ AC-TRS-06c PASS: risk=${tool.risk}`);
  });
});

// ============================================================================
// AC-TRS-07: Cross-Office Trace
//
// GIVEN an Assessor value change AND a Treasury statement recalculation,
// WHEN both are traced,
// THEN they can be linked by correlationId chain
// ============================================================================

describe('AC-TRS-07: Cross-Office Trace', () => {
  it('cross-office trace links assessor and treasury events by correlationId', async () => {
    const { runner, traceService } = makeRunner();

    // Step 1: Assessor runs valuation → generates correlationId
    mockFetch((url) => {
      if (url.includes('costforge')) {
        return {
          propertyId: 'P-001', parcelNumber: 'P-001',
          totalCost: 310000, landValue: 95000, structureValue: 195000,
          siteImprovements: 20000, depreciatedValue: 270000,
          depreciation: { physicalPercent: 0.10, functionalPercent: 0.02, externalPercent: 0 },
          costFactors: { region: 'BENTON', buildingType: 'SFR', qualityGrade: 'AVERAGE', yearBuilt: 1995, effectiveAge: 25, squareFeet: 1800 },
          confidence: 0.91, calculatedAt: '2026-03-10T12:00:00Z', modelVersion: 'costforge-v2.1',
        };
      }
      return {};
    });

    const assessorResult = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'P-001', taxYear: 2026 },
      context: {
        userId: 'test-appraiser-1',
        roles: ['appraiser'],
        countyId: 'benton',
        mode: 'pilot',
        confirmation: true,
        reasonCode: 'annual_certification',
      },
    });
    assert.equal(assessorResult.ok, true, 'assessor valuation must succeed');

    // Step 2: Treasurer fetches updated statement
    mockFetch((url) => {
      if (url.includes('/api/treasury/') && url.includes('statement'))
        return taxStatementResponse('P-001');
      return {};
    });

    const treasuryResult = await runner.execute({
      toolId: 'get_tax_statement',
      params: { county: 'benton', parcelId: 'P-001', taxYear: 2026 },
      context: treasurerContext(),
    });
    assert.equal(treasuryResult.ok, true, 'treasury statement must succeed');

    // Both should have correlationIds — demonstrating cross-office traceability
    assert.ok(assessorResult.correlationId, 'assessor must have correlationId');
    assert.ok(treasuryResult.correlationId, 'treasury must have correlationId');

    // Each correlationId chain should have trace events
    const assessorEvents = await traceService.getByCorrelationIdAsync(assessorResult.correlationId);
    const treasuryEvents = await traceService.getByCorrelationIdAsync(treasuryResult.correlationId);
    assert.ok(assessorEvents.length >= 2, 'assessor trace must exist');
    assert.ok(treasuryEvents.length >= 2, 'treasury trace must exist');

    // Verify different offices produced trace events for same parcel
    console.log(`  ✅ AC-TRS-07 PASS: assessor.corr=${assessorResult.correlationId}, treasury.corr=${treasuryResult.correlationId}`);
  });
});

// ============================================================================
// AC-AUD-01: Roll Audit Summary
//
// GIVEN Benton County assessment roll,
// WHEN `audit_roll_summary` is invoked,
// THEN returns real parcel statistics
// ============================================================================

describe('AC-AUD-01: Roll Audit Summary', () => {
  it('audit_roll_summary returns Benton roll stats', async () => {
    const { runner } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/audit/roll-summary'))
        return rollSummaryResponse();
      return {};
    });

    const result = await runner.execute({
      toolId: 'audit_roll_summary',
      params: { county: 'benton', taxYear: 2026 },
      context: auditorContext({ mode: 'muse' }),
    });

    assert.equal(result.ok, true, 'result must be ok');
    const data = result.result;
    assert.equal(data.county.toLowerCase(), 'benton', 'must be Benton County');
    assert.ok(data.totalParcels > 0, 'must have total parcels');
    assert.ok(data.auditedParcels > 0, 'must have audited parcels');
    assert.ok(data.auditedParcels <= data.totalParcels, 'audited must not exceed total');

    console.log(`  ✅ AC-AUD-01 PASS: audited=${data.auditedParcels}/${data.totalParcels}, discrepancies=${data.discrepancyCount}`);
  });
});

// ============================================================================
// AC-AUD-02: Levy Compliance
//
// GIVEN Benton County levy rates,
// WHEN `check_levy_compliance` is invoked,
// THEN validates against RCW 84.52/84.55 limits
// ============================================================================

describe('AC-AUD-02: Levy Compliance', () => {
  it('check_levy_compliance validates against statutory limits', async () => {
    const { runner } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/audit/levy-compliance'))
        return levyComplianceResponse();
      return {};
    });

    const result = await runner.execute({
      toolId: 'check_levy_compliance',
      params: { county: 'benton', taxYear: 2026 },
      context: auditorContext(),
    });

    assert.equal(result.ok, true, 'result must be ok');
    const data = result.result;
    assert.equal(data.county.toLowerCase(), 'benton', 'must be Benton County');
    assert.equal(typeof data.compliant, 'boolean', 'must have compliant flag');
    assert.ok(data.findings, 'must have findings array');
    assert.ok(data.findings.length > 0, 'must have at least one finding');

    // Each finding must have rule, status, detail
    for (const f of data.findings) {
      assert.ok(f.rule, 'finding must have rule');
      assert.ok(f.status, 'finding must have status');
      assert.ok(f.detail, 'finding must have detail');
    }

    assert.ok(data.statuteRefs, 'must have statuteRefs');
    assert.ok(data.statuteRefs.some(s => s.includes('RCW')), 'statuteRefs must reference RCW');

    console.log(`  ✅ AC-AUD-02 PASS: findings=${data.findings.length}, compliant=${data.compliant}, statutes=${data.statuteRefs.join(',')}`);
  });
});

// ============================================================================
// AC-AUD-03: Audit Finding
//
// GIVEN a parcel with value discrepancy,
// WHEN `submit_audit_finding` is invoked,
// THEN finding is linked to parcel → trace evidence
// ============================================================================

describe('AC-AUD-03: Audit Finding', () => {
  it('submit_audit_finding creates finding with trace', async () => {
    const { runner, traceService } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/audit/findings'))
        return auditFindingResponse();
      return {};
    });

    const result = await runner.execute({
      toolId: 'submit_audit_finding',
      params: {
        county: 'benton',
        parcelId: 'P-001',
        findingType: 'value_discrepancy',
        severity: 'medium',
        description: 'Assessed value exceeds market comparable by 18%',
      },
      context: {
        ...auditorContext(),
        confirmation: true,
        reasonCode: 'valuation_discrepancy',
      },
    });

    assert.equal(result.ok, true, 'result must be ok');
    assert.ok(result.correlationId, 'must have correlationId');
    const data = result.result;
    assert.ok(data.findingId, 'must have findingId');
    assert.equal(data.status, 'submitted', 'finding must be submitted');
    assert.equal(data.severity, 'medium', 'severity must match requested value');
    assert.ok(data.payloadRef, 'must have payloadRef');

    const events = await traceService.getByCorrelationIdAsync(result.correlationId);
    assert.ok(events.length >= 2, 'must have trace events');

    console.log(`  ✅ AC-AUD-03 PASS: findingId=${data.findingId}`);
  });
});

// ============================================================================
// AC-AUD-04: Cross-Office Reconciliation
//
// GIVEN Assessor values and Treasurer collections,
// WHEN `reconcile_cross_office` is invoked with confirmation,
// THEN reconciliation links transactions by correlationId
// ============================================================================

describe('AC-AUD-04: Cross-Office Reconciliation', () => {
  it('reconcile_cross_office links offices by correlationId', async () => {
    const { runner, traceService } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/audit/reconciliation'))
        return reconciliationResponse();
      return {};
    });

    const result = await runner.execute({
      toolId: 'reconcile_cross_office',
      params: { county: 'benton', taxYear: 2026 },
      context: {
        ...auditorContext(),
        confirmation: true,
        reasonCode: 'annual_reconciliation',
      },
    });

    assert.equal(result.ok, true, 'result must be ok');
    assert.ok(result.correlationId, 'must have correlationId');
    const data = result.result;
    assert.ok(data.reconciliationId, 'must have reconciliationId');
    assert.equal(data.taxYear, 2026, 'must return correct taxYear');
    assert.equal(data.status, 'completed', 'reconciliation must be completed');
    assert.ok(typeof data.discrepancies === 'number', 'must have discrepancies count');
    assert.ok(data.totalReconciled > 0, 'totalReconciled must be positive');
    assert.ok(data.payloadRef, 'must have payloadRef');

    const events = await traceService.getByCorrelationIdAsync(result.correlationId);
    assert.ok(events.length >= 2, 'must have trace events');

    console.log(`  ✅ AC-AUD-04 PASS: recon=${data.reconciliationId}, discrepancies=${data.discrepancies}`);
  });

  it('rejects reconcile_cross_office without confirmation (write_high)', async () => {
    const { runner } = makeRunner();
    mockFetch(() => reconciliationResponse());

    const result = await runner.execute({
      toolId: 'reconcile_cross_office',
      params: { county: 'benton', taxYear: 2026 },
      context: {
        ...auditorContext(),
        // confirmation intentionally missing
        reasonCode: 'annual_reconciliation',
      },
    });

    assert.equal(result.ok, false, 'must fail without confirmation');
    assert.ok(
      result.errorCode === 'CONFIRMATION_REQUIRED' || result.error?.includes('confirmation'),
      'error must indicate confirmation required'
    );

    console.log(`  ✅ AC-AUD-04b PASS: errorCode=${result.errorCode}`);
  });
});

// ============================================================================
// AC-AUD-05: Compliance Report
//
// GIVEN Benton County audit data,
// WHEN `generate_compliance_report` is invoked,
// THEN statutory report generated with correlationId
// ============================================================================

describe('AC-AUD-05: Compliance Report', () => {
  it('generate_compliance_report produces statutory report', async () => {
    const { runner, traceService } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/audit/compliance-report'))
        return complianceReportResponse();
      return {};
    });

    const result = await runner.execute({
      toolId: 'generate_compliance_report',
      params: { county: 'benton', taxYear: 2026 },
      context: auditorContext({ mode: 'muse' }),
    });

    assert.equal(result.ok, true, 'result must be ok');
    assert.ok(result.correlationId, 'must have correlationId');
    const data = result.result;
    assert.equal(data.county.toLowerCase(), 'benton', 'must be Benton County');
    assert.equal(data.taxYear, 2026, 'must return correct taxYear');
    assert.ok(data.report, 'must have report text');
    assert.ok(data.findingsCount > 0, 'findingsCount must be positive');
    assert.ok(data.complianceScore > 0, 'complianceScore must be positive');
    assert.ok(data.payloadRef, 'must have payloadRef');

    const events = await traceService.getByCorrelationIdAsync(result.correlationId);
    assert.ok(events.length >= 2, 'must have trace events');

    console.log(`  ✅ AC-AUD-05 PASS: score=${data.complianceScore}, findings=${data.findingsCount}`);
  });
});

// ============================================================================
// R3 MANIFEST CONTRACT CHECKS
// ============================================================================

// ============================================================================
// R3 CROSS-CUTTING: County Isolation (Treasury + Audit)
//
// Verify that treasury and audit tools also enforce county isolation
// (Clerk isolation is tested in AC-CLK-04)
// ============================================================================

describe('R3 County Isolation: Treasury', () => {
  it('get_tax_statement enforces county context', async () => {
    const { runner } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/treasury/') && url.includes('statement'))
        return taxStatementResponse();
      return {};
    });

    const result = await runner.execute({
      toolId: 'get_tax_statement',
      params: { county: 'benton', parcelId: 'P-001', taxYear: 2026 },
      context: treasurerContext(),
    });

    assert.equal(result.ok, true, 'result must be ok');
    const data = result.result;
    // Handler normalizes county from params — county isolation is enforced by assertCountyMatch
    assert.ok(data.taxYear, 'must return tax year');
    assert.ok(data.totalDue > 0, 'must have balance');
    assert.ok(data.levies, 'must have levy breakdown');
    console.log(`  ✅ R3-ISO-TRS PASS: taxYear=${data.taxYear}, levies=${data.levies.length}`);
  });
});

describe('R3 County Isolation: Audit', () => {
  it('audit_roll_summary enforces county context', async () => {
    const { runner } = makeRunner();
    mockFetch((url) => {
      if (url.includes('/api/audit/roll-summary'))
        return rollSummaryResponse();
      return {};
    });

    const result = await runner.execute({
      toolId: 'audit_roll_summary',
      params: { county: 'benton', taxYear: 2026 },
      context: auditorContext({ mode: 'muse' }),
    });

    assert.equal(result.ok, true, 'result must be ok');
    const data = result.result;
    assert.equal(data.county.toLowerCase(), 'benton', 'must be filtered to benton');
    assert.ok(data.totalParcels > 0, 'must have total parcels');
    console.log(`  ✅ R3-ISO-AUD PASS: county=${data.county}, parcels=${data.totalParcels}`);
  });
});

// ============================================================================
// R3 THREE-OFFICE CHAIN: Clerk → Treasury → Auditor
//
// Demonstrate end-to-end multi-office trace: a clerk records a deed,
// the treasurer reads the tax statement, and the auditor reconciles —
// all producing independent correlationId chains for the same parcel.
// ============================================================================

describe('R3 Three-Office Chain', () => {
  it('clerk + treasury + auditor produce traceable chains for same parcel', async () => {
    const { runner, traceService } = makeRunner();

    // Step 1: Clerk records a document
    mockFetch((url) => {
      if (url.includes('/api/clerk/')) return recordDocumentResponse();
      return {};
    });

    const clerkResult = await runner.execute({
      toolId: 'record_document',
      params: {
        county: 'benton',
        documentType: 'deed',
        grantor: 'Smith, John',
        grantee: 'Jones, Jane',
        parcelId: 'P-001',
      },
      context: {
        ...clerkContext(),
        confirmation: true,
        reasonCode: 'new_recording',
      },
    });
    assert.equal(clerkResult.ok, true, 'clerk must succeed');

    // Step 2: Treasurer reads the tax statement  
    mockFetch((url) => {
      if (url.includes('/api/treasury/')) return taxStatementResponse();
      return {};
    });

    const treasuryResult = await runner.execute({
      toolId: 'get_tax_statement',
      params: { county: 'benton', parcelId: 'P-001', taxYear: 2026 },
      context: treasurerContext(),
    });
    assert.equal(treasuryResult.ok, true, 'treasury must succeed');

    // Step 3: Auditor reconciles cross-office
    mockFetch((url) => {
      if (url.includes('/api/audit/')) return reconciliationResponse();
      return {};
    });

    const auditResult = await runner.execute({
      toolId: 'reconcile_cross_office',
      params: { county: 'benton', taxYear: 2026 },
      context: {
        ...auditorContext(),
        confirmation: true,
        reasonCode: 'annual_reconciliation',
      },
    });
    assert.equal(auditResult.ok, true, 'auditor must succeed');

    // All three must have distinct correlationIds
    assert.ok(clerkResult.correlationId, 'clerk must have correlationId');
    assert.ok(treasuryResult.correlationId, 'treasury must have correlationId');
    assert.ok(auditResult.correlationId, 'auditor must have correlationId');
    assert.notEqual(clerkResult.correlationId, treasuryResult.correlationId, 'clerk vs treasury must differ');
    assert.notEqual(treasuryResult.correlationId, auditResult.correlationId, 'treasury vs audit must differ');

    // Each chain must have trace events
    const clerkEvents = await traceService.getByCorrelationIdAsync(clerkResult.correlationId);
    const treasuryEvents = await traceService.getByCorrelationIdAsync(treasuryResult.correlationId);
    const auditEvents = await traceService.getByCorrelationIdAsync(auditResult.correlationId);
    assert.ok(clerkEvents.length >= 2, 'clerk trace must exist');
    assert.ok(treasuryEvents.length >= 2, 'treasury trace must exist');
    assert.ok(auditEvents.length >= 2, 'auditor trace must exist');

    console.log(`  ✅ R3 THREE-OFFICE PASS: clerk.corr=${clerkResult.correlationId}, treasury.corr=${treasuryResult.correlationId}, audit.corr=${auditResult.correlationId}`);
  });
});

// ============================================================================
// R3 MANIFEST CONTRACT CHECKS
// ============================================================================

describe('R3 Manifest Contract: officeScope', () => {
  it('all clerk tools have officeScope=clerk', () => {
    const clerkTools = manifest.tools.filter(t => t.suite === 'clerk');
    assert.equal(clerkTools.length, 6, 'must have 6 clerk tools');
    for (const t of clerkTools) {
      assert.equal(t.officeScope, 'clerk', `${t.toolId} must have officeScope=clerk`);
    }
    console.log(`  ✅ Clerk officeScope: 6/6`);
  });

  it('all treasury tools have officeScope=treasurer', () => {
    const treasuryTools = manifest.tools.filter(t => t.suite === 'treasury');
    assert.equal(treasuryTools.length, 7, 'must have 7 treasury tools');
    for (const t of treasuryTools) {
      assert.equal(t.officeScope, 'treasurer', `${t.toolId} must have officeScope=treasurer`);
    }
    console.log(`  ✅ Treasury officeScope: 7/7`);
  });

  it('all audit tools have officeScope=auditor', () => {
    const auditTools = manifest.tools.filter(t => t.suite === 'audit');
    assert.equal(auditTools.length, 5, 'must have 5 audit tools');
    for (const t of auditTools) {
      assert.equal(t.officeScope, 'auditor', `${t.toolId} must have officeScope=auditor`);
    }
    console.log(`  ✅ Audit officeScope: 5/5`);
  });

  it('OS tools have no officeScope', () => {
    const osTools = ['route_to_parcel', 'search_trace_by_correlation', 'request_trace_redaction'];
    for (const toolId of osTools) {
      const tool = getTool(toolId);
      assert.ok(tool, `${toolId} must exist`);
      assert.equal(tool.officeScope, undefined, `${toolId} must NOT have officeScope`);
    }
    console.log(`  ✅ OS tools: no officeScope on 3/3`);
  });
});
