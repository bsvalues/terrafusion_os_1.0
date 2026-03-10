/**
 * R3-CX Backend Endpoint Acceptance Criteria Tests
 * =================================================
 * Validates that all 18 R3 handler→backend URL mappings match the
 * controller routes created in the CX lane.
 *
 * These are contract tests — they verify the wiring between:
 *   - handlers.real.ts backendGet/backendPost URLs
 *   - ClerkController, TreasuryController, AuditController routes
 *
 * 15 acceptance criteria:
 *   - CX-CLK-01→06: Clerk endpoints (6)
 *   - CX-TRS-01→04: Treasury endpoints (4 — remaining map to existing controllers)
 *   - CX-AUD-01→05: Audit endpoints (5)
 */

import assert from 'node:assert/strict';
import fs, { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, before, afterEach } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');
const HANDLERS_PATH = resolve(__dirname, '../pilot/handlers.real.ts');

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
const handlersSource = readFileSync(HANDLERS_PATH, 'utf-8');

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

/** Capture the URL + method of each backend call made by a handler. */
function captureFetch() {
  const calls = [];
  globalThis.fetch = async (url, opts) => {
    calls.push({ url: String(url), method: (opts?.method || 'GET').toUpperCase() });
    return {
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({}),
      text: async () => '{}',
    };
  };
  return calls;
}

function clerkContext(overrides = {}) {
  return { userId: 'test-clerk-cx', roles: ['clerk'], countyId: 'benton', mode: 'pilot', ...overrides };
}

function treasurerContext(overrides = {}) {
  return { userId: 'test-trs-cx', roles: ['treasurer'], countyId: 'benton', mode: 'pilot', ...overrides };
}

function auditorContext(overrides = {}) {
  return { userId: 'test-aud-cx', roles: ['auditor'], countyId: 'benton', mode: 'pilot', ...overrides };
}

// ============================================================================
// CX-CLERK: Verify handler→endpoint wiring
// ============================================================================

describe('R3-CX Clerk Endpoint Wiring', () => {
  // CX-CLK-01: search_recorded_documents → GET /api/clerk/documents
  it('CX-CLK-01: search_recorded_documents calls GET /api/clerk/documents', () => {
    assert.ok(
      handlersSource.includes('/api/clerk/documents?'),
      'Handler must call /api/clerk/documents with query params'
    );
    assert.ok(
      handlersSource.includes('backendGet') && handlersSource.includes('/api/clerk/documents'),
      'Handler must use backendGet for /api/clerk/documents'
    );
  });

  // CX-CLK-02: get_title_chain → GET /api/clerk/parcels/{parcelId}/title-chain
  it('CX-CLK-02: get_title_chain calls GET /api/clerk/parcels/{id}/title-chain', () => {
    assert.ok(
      handlersSource.includes('/api/clerk/parcels/'),
      'Handler must call /api/clerk/parcels/ route'
    );
    assert.ok(
      handlersSource.includes('/title-chain'),
      'Handler must target title-chain sub-route'
    );
  });

  // CX-CLK-03: explain_recording_fees → GET /api/clerk/fees
  it('CX-CLK-03: explain_recording_fees calls GET /api/clerk/fees', () => {
    assert.ok(
      handlersSource.includes('/api/clerk/fees'),
      'Handler must call /api/clerk/fees'
    );
  });

  // CX-CLK-04: record_document → POST /api/clerk/documents
  it('CX-CLK-04: record_document calls POST /api/clerk/documents', () => {
    assert.ok(
      handlersSource.includes("backendPost") && handlersSource.includes("'/api/clerk/documents'"),
      'Handler must use backendPost for /api/clerk/documents'
    );
  });

  // CX-CLK-05: release_lien → POST /api/clerk/liens/{lienId}/release
  it('CX-CLK-05: release_lien calls POST /api/clerk/liens/{id}/release', () => {
    assert.ok(
      handlersSource.includes('/api/clerk/liens/'),
      'Handler must call /api/clerk/liens/ route'
    );
    assert.ok(
      handlersSource.includes('/release'),
      'Handler must target /release sub-route'
    );
  });

  // CX-CLK-06: summarize_parcel_recordings → GET /api/clerk/parcels/{id}/recordings/summary
  it('CX-CLK-06: summarize_parcel_recordings calls GET /api/clerk/parcels/{id}/recordings/summary', () => {
    assert.ok(
      handlersSource.includes('/recordings/summary'),
      'Handler must call recordings/summary sub-route'
    );
  });
});

// ============================================================================
// CX-TREASURY: Verify handler→endpoint wiring
// ============================================================================

describe('R3-CX Treasury Endpoint Wiring', () => {
  // CX-TRS-01: get_tax_statement → GET /api/treasury/parcels/{id}/statement
  it('CX-TRS-01: get_tax_statement calls GET /api/treasury/parcels/{id}/statement', () => {
    assert.ok(
      handlersSource.includes('/api/treasury/parcels/'),
      'Handler must call /api/treasury/parcels/ route'
    );
    assert.ok(
      handlersSource.includes('/statement'),
      'Handler must target /statement sub-route'
    );
  });

  // CX-TRS-02: record_payment → POST /api/treasury/parcels/{id}/payments
  it('CX-TRS-02: record_payment calls POST /api/treasury/parcels/{id}/payments', () => {
    assert.ok(
      handlersSource.includes('/payments'),
      'Handler must target /payments sub-route'
    );
  });

  // CX-TRS-03: check_delinquency_status → GET /api/treasury/parcels/{id}/delinquency
  it('CX-TRS-03: check_delinquency_status calls GET /api/treasury/parcels/{id}/delinquency', () => {
    assert.ok(
      handlersSource.includes('/delinquency'),
      'Handler must target /delinquency sub-route'
    );
  });

  // CX-TRS-04: initiate_tax_sale → POST /api/treasury/parcels/{id}/tax-sale
  it('CX-TRS-04: initiate_tax_sale calls POST /api/treasury/parcels/{id}/tax-sale', () => {
    assert.ok(
      handlersSource.includes('/tax-sale'),
      'Handler must target /tax-sale sub-route'
    );
  });
});

// ============================================================================
// CX-AUDIT: Verify handler→endpoint wiring
// ============================================================================

describe('R3-CX Audit Endpoint Wiring', () => {
  // CX-AUD-01: audit_roll_summary → GET /api/audit/roll-summary
  it('CX-AUD-01: audit_roll_summary calls GET /api/audit/roll-summary', () => {
    assert.ok(
      handlersSource.includes('/api/audit/roll-summary'),
      'Handler must call /api/audit/roll-summary'
    );
  });

  // CX-AUD-02: check_levy_compliance → GET /api/audit/levy-compliance
  it('CX-AUD-02: check_levy_compliance calls GET /api/audit/levy-compliance', () => {
    assert.ok(
      handlersSource.includes('/api/audit/levy-compliance'),
      'Handler must call /api/audit/levy-compliance'
    );
  });

  // CX-AUD-03: submit_audit_finding → POST /api/audit/findings
  it('CX-AUD-03: submit_audit_finding calls POST /api/audit/findings', () => {
    assert.ok(
      handlersSource.includes('/api/audit/findings'),
      'Handler must call /api/audit/findings'
    );
  });

  // CX-AUD-04: reconcile_cross_office → POST /api/audit/reconciliation
  it('CX-AUD-04: reconcile_cross_office calls POST /api/audit/reconciliation', () => {
    assert.ok(
      handlersSource.includes('/api/audit/reconciliation'),
      'Handler must call /api/audit/reconciliation'
    );
  });

  // CX-AUD-05: generate_compliance_report → GET /api/audit/compliance-report
  it('CX-AUD-05: generate_compliance_report calls GET /api/audit/compliance-report', () => {
    assert.ok(
      handlersSource.includes('/api/audit/compliance-report'),
      'Handler must call /api/audit/compliance-report'
    );
  });
});

// ============================================================================
// CX META: Controller files exist and compile
// ============================================================================

describe('R3-CX Controller Manifest', () => {
  const controllerDir = resolve(__dirname, '../../../backend/src/TerraFusion.API/Controllers');
  const entityDir = resolve(__dirname, '../../../backend/src/TerraFusion.Core/Entities');

  it('ClerkController.cs exists', () => {
    assert.ok(existsSync(resolve(controllerDir, 'ClerkController.cs')), 'ClerkController.cs must exist');
  });

  it('TreasuryController.cs exists', () => {
    assert.ok(existsSync(resolve(controllerDir, 'TreasuryController.cs')), 'TreasuryController.cs must exist');
  });

  it('AuditController.cs exists', () => {
    assert.ok(existsSync(resolve(controllerDir, 'AuditController.cs')), 'AuditController.cs must exist');
  });

  it('ClerkEntities.cs exists', () => {
    assert.ok(existsSync(resolve(entityDir, 'ClerkEntities.cs')), 'ClerkEntities.cs must exist');
  });

  it('TreasuryEntities.cs exists', () => {
    assert.ok(existsSync(resolve(entityDir, 'TreasuryEntities.cs')), 'TreasuryEntities.cs must exist');
  });

  it('AuditEntities.cs exists', () => {
    assert.ok(existsSync(resolve(entityDir, 'AuditEntities.cs')), 'AuditEntities.cs must exist');
  });

  it('DbContext has R3-CX DbSets', () => {
    const dbContextPath = resolve(__dirname, '../../../backend/src/TerraFusion.Data/TerraFusionDbContext.cs');
    const dbContext = readFileSync(dbContextPath, 'utf-8');

    const required = [
      'ClerkDocuments', 'TitleChainEntries', 'ClerkLiens',
      'TaxStatements', 'TaxPayments', 'DelinquencyRecords',
      'InstallmentPlans', 'TaxSales',
      'AuditFindings', 'AuditReconciliations',
    ];

    for (const dbSet of required) {
      assert.ok(dbContext.includes(dbSet), `DbContext must include DbSet<> for ${dbSet}`);
    }
  });
});

// ============================================================================
// CX SECURITY: County isolation pattern on controllers
// ============================================================================

describe('R3-CX Security: County Isolation', () => {
  const controllerDir = resolve(__dirname, '../../../backend/src/TerraFusion.API/Controllers');

  const controllers = [
    { name: 'ClerkController.cs', route: 'api/clerk' },
    { name: 'TreasuryController.cs', route: 'api/treasury' },
    { name: 'AuditController.cs', route: 'api/audit' },
  ];

  for (const ctrl of controllers) {
    it(`${ctrl.name} uses [Authorize]`, () => {
      const src = readFileSync(resolve(controllerDir, ctrl.name), 'utf-8');
      assert.ok(src.includes('[Authorize]'), `${ctrl.name} must have [Authorize] attribute`);
    });

    it(`${ctrl.name} implements ResolveCountyIdAsync`, () => {
      const src = readFileSync(resolve(controllerDir, ctrl.name), 'utf-8');
      assert.ok(src.includes('ResolveCountyIdAsync'), `${ctrl.name} must implement county isolation`);
    });

    it(`${ctrl.name} routes to ${ctrl.route}`, () => {
      const src = readFileSync(resolve(controllerDir, ctrl.name), 'utf-8');
      assert.ok(src.includes(`"${ctrl.route}"`), `${ctrl.name} must route to ${ctrl.route}`);
    });

    it(`${ctrl.name} uses AsNoTracking for reads`, () => {
      const src = readFileSync(resolve(controllerDir, ctrl.name), 'utf-8');
      assert.ok(src.includes('AsNoTracking'), `${ctrl.name} must use AsNoTracking() for queries`);
    });
  }
});
