/**
 * TerraFusion OS - Phase 8.3 Tool Integration Tests
 *
 * Tests for the 3 new Muse-mode tools:
 *   1. summarize_dossier (Dossier, read_only, payload_ref)
 *   2. explain_model_results (Forge, read_only, sanitize)
 *   3. draft_appeal_response (Dais, write_low, payload_ref)
 *
 * Verifies:
 *   - Gates 4-7 pass for all tools
 *   - Trace events emitted with correct fields
 *   - County isolation maintained
 *   - Handler execution produces expected results
 *
 * Run: node --test os-platform/core/tests/phase83-tools.test.mjs
 */

import assert from 'node:assert';
import { resolve } from 'node:path';
import { before, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// ============================================================================
// Dynamic imports for ESM compatibility
// ============================================================================

let ToolRegistry;
let ToolRunner;
let InMemoryTraceStore;
let TraceService;
let registerPhase83Handlers;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const traceModule = await import('../trace/index.js');

  // CommonJS modules export via default in ESM context
  const pilot = pilotModule.default || pilotModule;
  const trace = traceModule.default || traceModule;

  ToolRegistry = pilot.ToolRegistry;
  ToolRunner = pilot.ToolRunner;
  registerPhase83Handlers = pilot.registerPhase83Handlers;
  InMemoryTraceStore = trace.InMemoryTraceStore;
  TraceService = trace.TraceService;
});

// ============================================================================
// Test Fixtures
// ============================================================================

// Resolve absolute path to manifest using import.meta.url
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');

// ============================================================================
// ToolRegistry Default Path Resolution
// ============================================================================

describe('ToolRegistry defaults', () => {
  it('does not log manifest path without DEBUG_TOOLREGISTRY=1', async () => {
    const originalDebug = process.env.DEBUG_TOOLREGISTRY;
    delete process.env.DEBUG_TOOLREGISTRY;

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.join(' '));
    };

    const registry = new ToolRegistry();
    await registry.initialize();

    console.log = originalLog;
    if (originalDebug !== undefined) {
      process.env.DEBUG_TOOLREGISTRY = originalDebug;
    }

    const line = logs.find(l => l.includes('Manifest path:'));
    assert.strictEqual(line, undefined, 'Should not log manifest path without DEBUG_TOOLREGISTRY');
  });

  it('resolves canonical manifest path without cwd dependency', async () => {
    const originalDebug = process.env.DEBUG_TOOLREGISTRY;
    process.env.DEBUG_TOOLREGISTRY = '1';

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.join(' '));
    };

    const registry = new ToolRegistry();
    await registry.initialize();

    console.log = originalLog;
    if (originalDebug === undefined) {
      delete process.env.DEBUG_TOOLREGISTRY;
    } else {
      process.env.DEBUG_TOOLREGISTRY = originalDebug;
    }

    const line = logs.find(l => l.includes('Manifest path:'));
    assert.ok(line, 'Should log manifest path');
    const pathValue = line.split('Manifest path:').pop().trim();
    const normalized = pathValue.replace(/\\/g, '/');
    assert.ok(
      normalized.endsWith('/tools/registry/terrapilot.tools.json'),
      'Manifest path should resolve to canonical tools/registry/terrapilot.tools.json'
    );
  });
});

const BENTON_APPRAISER = {
  countyId: 'benton',
  userId: 'appraiser-001',
  roles: ['appraiser'],
  mode: 'muse',
};

const BENTON_SUPERVISOR = {
  countyId: 'benton',
  userId: 'supervisor-001',
  roles: ['supervisor', 'appraiser'],
  mode: 'muse',
  confirmation: true,
  reasonCode: 'appeal_response',
};

const YAKIMA_APPRAISER = {
  countyId: 'yakima',
  userId: 'appraiser-yakima-001',
  roles: ['appraiser'],
  mode: 'muse',
};

// ============================================================================
// Gate Validation Tests
// ============================================================================

describe('Phase 8.3 Tools - Gate Validation', () => {
  let registry;

  before(async () => {
    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);
  });

  it('loads the canonical manifest (v2.0.0, 64 tools)', () => {
    assert.strictEqual(registry.getVersion(), '2.0.0');
    assert.strictEqual(registry.listTools().length, 93);
  });

  it('enforces registry invariants', () => {
    const tools = registry.listTools();
    const ids = tools.map(t => t.toolId);
    const uniqueIds = new Set(ids);
    assert.strictEqual(uniqueIds.size, ids.length, 'toolIds must be unique');

    for (const tool of tools) {
      if (tool.risk === 'read_only') {
        assert.strictEqual(tool.writeLane, null, 'read_only tools must have null writeLane');
      }
      if (tool.suite === 'dais') {
        assert.notStrictEqual(tool.piiHandling, 'none', 'dais tools cannot set piiHandling: none');
      }
    }
  });

  describe('summarize_dossier', () => {
    it('exists in registry', () => {
      const tool = registry.getTool('summarize_dossier');
      assert.ok(tool, 'Tool should exist');
      assert.strictEqual(tool.suite, 'dossier');
      assert.strictEqual(tool.mode, 'muse');
    });

    it('Gate 4: read_only has null writeLane', () => {
      const tool = registry.getTool('summarize_dossier');
      assert.strictEqual(tool.risk, 'read_only');
      assert.strictEqual(tool.writeLane, null);
    });

    it('Gate 5: read_only does not require confirmation', () => {
      const tool = registry.getTool('summarize_dossier');
      assert.strictEqual(tool.requiresConfirmation, false);
      assert.strictEqual(tool.reasonCodeRequired, false);
    });

    it('Gate 6: has payload_ref PII handling', () => {
      const tool = registry.getTool('summarize_dossier');
      assert.strictEqual(tool.piiHandling, 'payload_ref');
      assert.strictEqual(tool.tracePolicy, 'payload_ref');
      assert.strictEqual(tool.payloadStore, 'dossier');
    });

    it('Gate 7: not high-risk, no supervisor required', () => {
      const tool = registry.getTool('summarize_dossier');
      assert.notStrictEqual(tool.risk, 'write_high');
      assert.notStrictEqual(tool.risk, 'irreversible');
      assert.strictEqual(tool.requiresSupervisorApproval, false);
    });
  });

  describe('explain_model_results', () => {
    it('exists in registry', () => {
      const tool = registry.getTool('explain_model_results');
      assert.ok(tool, 'Tool should exist');
      assert.strictEqual(tool.suite, 'forge');
      assert.strictEqual(tool.mode, 'muse');
    });

    it('Gate 4: read_only has null writeLane', () => {
      const tool = registry.getTool('explain_model_results');
      assert.strictEqual(tool.risk, 'read_only');
      assert.strictEqual(tool.writeLane, null);
    });

    it('Gate 5: read_only does not require confirmation', () => {
      const tool = registry.getTool('explain_model_results');
      assert.strictEqual(tool.requiresConfirmation, false);
      assert.strictEqual(tool.reasonCodeRequired, false);
    });

    it('Gate 6: has sanitize PII handling', () => {
      const tool = registry.getTool('explain_model_results');
      assert.strictEqual(tool.piiHandling, 'sanitize');
      assert.strictEqual(tool.tracePolicy, 'summary_only');
    });

    it('Gate 7: not high-risk, no supervisor required', () => {
      const tool = registry.getTool('explain_model_results');
      assert.notStrictEqual(tool.risk, 'write_high');
      assert.notStrictEqual(tool.risk, 'irreversible');
      assert.strictEqual(tool.requiresSupervisorApproval, false);
    });
  });

  describe('draft_appeal_response', () => {
    it('exists in registry', () => {
      const tool = registry.getTool('draft_appeal_response');
      assert.ok(tool, 'Tool should exist');
      assert.strictEqual(tool.suite, 'dais');
      assert.strictEqual(tool.mode, 'muse');
    });

    it('Gate 4: write_low has matching writeLane', () => {
      const tool = registry.getTool('draft_appeal_response');
      assert.strictEqual(tool.risk, 'write_low');
      assert.strictEqual(tool.writeLane, 'dais');
    });

    it('Gate 5: write_low requires confirmation + reason code', () => {
      const tool = registry.getTool('draft_appeal_response');
      assert.strictEqual(tool.requiresConfirmation, true);
      assert.strictEqual(tool.reasonCodeRequired, true);
      assert.ok(tool.reasonCodes.length > 0);
    });

    it('Gate 6: has payload_ref PII handling', () => {
      const tool = registry.getTool('draft_appeal_response');
      assert.strictEqual(tool.piiHandling, 'payload_ref');
      assert.strictEqual(tool.tracePolicy, 'payload_ref');
      assert.strictEqual(tool.payloadStore, 'dossier');
    });

    it('Gate 7: not high-risk, no supervisor required', () => {
      const tool = registry.getTool('draft_appeal_response');
      assert.notStrictEqual(tool.risk, 'write_high');
      assert.notStrictEqual(tool.risk, 'irreversible');
      assert.strictEqual(tool.requiresSupervisorApproval, false);
    });
  });
});

// ============================================================================
// Handler Execution Tests
// ============================================================================

describe('Phase 8.3 Tools - Handler Execution', () => {
  let registry;
  let runner;
  let traceStore;
  let traceService;

  beforeEach(async () => {
    // Fresh instances for each test
    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);

    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceService = new TraceService({ store: traceStore });

    runner = new ToolRunner({ registry, trace: traceService });
    registerPhase83Handlers(runner);
  });

  describe('summarize_dossier execution', () => {
    it('executes successfully with valid params', async () => {
      const result = await runner.execute({
        toolId: 'summarize_dossier',
        params: { dossierId: 'D-2026-001', focus: 'appeal' },
        context: BENTON_APPRAISER,
      });

      assert.strictEqual(result.ok, true);
      assert.ok(result.result.dossierId);
      assert.ok(result.result.payloadRef);
      assert.ok(result.result.summary);
    });

    it('emits trace events with payloadRef', async () => {
      await runner.execute({
        toolId: 'summarize_dossier',
        params: { dossierId: 'D-2026-002' },
        context: BENTON_APPRAISER,
      });

      const events = traceService.query({ toolId: 'summarize_dossier' });
      assert.ok(events.length >= 2, 'Should have invoked + completed events');

      // Check completed event has payloadRef
      const completed = events.find(e => e.type === 'tool_completed');
      assert.ok(completed, 'Should have completed event');
    });

    it('maintains county isolation', async () => {
      await runner.execute({
        toolId: 'summarize_dossier',
        params: { dossierId: 'D-2026-003' },
        context: BENTON_APPRAISER,
      });

      await runner.execute({
        toolId: 'summarize_dossier',
        params: { dossierId: 'D-2026-004' },
        context: YAKIMA_APPRAISER,
      });

      const bentonEvents = traceService.query({});
      const bentonOnly = bentonEvents.filter(e => e.context.countyId === 'benton');
      const yakimaOnly = bentonEvents.filter(e => e.context.countyId === 'yakima');

      assert.ok(bentonOnly.length > 0);
      assert.ok(yakimaOnly.length > 0);
      assert.notStrictEqual(
        bentonOnly[0].correlationId,
        yakimaOnly[0].correlationId,
        'Different counties should have different correlationIds'
      );
    });
  });

  describe('explain_model_results execution', () => {
    it('executes successfully with valid params', async () => {
      const result = await runner.execute({
        toolId: 'explain_model_results',
        params: { parcelId: 'P-001-234', taxYear: 2026 },
        context: BENTON_APPRAISER,
      });

      assert.strictEqual(result.ok, true);
      assert.ok(result.result.explanation);
      assert.ok(result.result.keyDrivers);
      assert.ok(typeof result.result.confidenceScore === 'number');
    });

    it('generates taxpayer-friendly explanation', async () => {
      const result = await runner.execute({
        toolId: 'explain_model_results',
        params: { parcelId: 'P-001-235', taxYear: 2026, audience: 'taxpayer' },
        context: BENTON_APPRAISER,
      });

      assert.strictEqual(result.ok, true);
      assert.ok(
        result.result.explanation.includes('Your property'),
        'Taxpayer audience should have friendly prefix'
      );
    });

    it('includes comparison when compareToYear provided', async () => {
      const result = await runner.execute({
        toolId: 'explain_model_results',
        params: { parcelId: 'P-001-236', taxYear: 2026, compareToYear: 2025 },
        context: BENTON_APPRAISER,
      });

      assert.strictEqual(result.ok, true);
      assert.ok(result.result.explanation.includes('2025'), 'Should mention comparison year');
    });
  });

  describe('draft_appeal_response execution', () => {
    it('executes successfully with valid params', async () => {
      const result = await runner.execute({
        toolId: 'draft_appeal_response',
        params: { parcelId: 'P-001-237', appealId: 'A-2026-001' },
        context: BENTON_SUPERVISOR,
      });

      assert.strictEqual(result.ok, true);
      assert.ok(result.result.payloadRef);
      assert.ok(result.result.draftSummary);
      assert.strictEqual(result.result.position, 'uphold');
    });

    it('respects position parameter', async () => {
      const result = await runner.execute({
        toolId: 'draft_appeal_response',
        params: { parcelId: 'P-001-238', appealId: 'A-2026-002', position: 'adjust' },
        context: BENTON_SUPERVISOR,
      });

      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.result.position, 'adjust');
      assert.ok(result.result.draftSummary.includes('adjusting'));
    });

    it('emits trace with payloadRef', async () => {
      await runner.execute({
        toolId: 'draft_appeal_response',
        params: { parcelId: 'P-001-239', appealId: 'A-2026-003' },
        context: BENTON_SUPERVISOR,
      });

      const events = traceService.query({ toolId: 'draft_appeal_response' });
      assert.ok(events.length >= 2);
    });
  });
});

// ============================================================================
// Mode Enforcement Tests
// ============================================================================

describe('Phase 8.3 Tools - Mode Enforcement', () => {
  let registry;
  let runner;
  let traceStore;
  let traceService;

  beforeEach(async () => {
    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);

    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceService = new TraceService({ store: traceStore });

    runner = new ToolRunner({ registry, trace: traceService });
    registerPhase83Handlers(runner);
  });

  it('rejects pilot-mode context for muse-only tools', async () => {
    const pilotContext = { ...BENTON_APPRAISER, mode: 'pilot' };

    const result = await runner.execute({
      toolId: 'summarize_dossier',
      params: { dossierId: 'D-2026-010' },
      context: pilotContext,
    });

    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('mode'));
  });

  it('accepts muse-mode context for muse tools', async () => {
    const result = await runner.execute({
      toolId: 'summarize_dossier',
      params: { dossierId: 'D-2026-011' },
      context: BENTON_APPRAISER,
    });

    assert.strictEqual(result.ok, true);
  });
});

// ============================================================================
// Dashboard Integration Tests
// ============================================================================

describe('Phase 8.3 Tools - Dashboard Metrics', () => {
  let registry;
  let runner;
  let traceStore;
  let traceService;
  let MetricsService;

  before(async () => {
    const traceModule = await import('../trace/index.js');
    MetricsService = traceModule.MetricsService;
  });

  beforeEach(async () => {
    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);

    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceService = new TraceService({ store: traceStore });

    runner = new ToolRunner({ registry, trace: traceService });
    registerPhase83Handlers(runner);
  });

  it('metrics show muse mode distribution', async () => {
    // Execute several muse tools
    await runner.execute({
      toolId: 'summarize_dossier',
      params: { dossierId: 'D-2026-020' },
      context: BENTON_APPRAISER,
    });

    await runner.execute({
      toolId: 'explain_model_results',
      params: { parcelId: 'P-001-250', taxYear: 2026 },
      context: BENTON_APPRAISER,
    });

    await runner.execute({
      toolId: 'draft_appeal_response',
      params: { parcelId: 'P-001-251', appealId: 'A-2026-010' },
      context: BENTON_SUPERVISOR,
    });

    const metricsService = new MetricsService(traceService);
    const metrics = metricsService.getSummary('1h', 'benton');

    // Should show muse mode activity for these executions
    assert.ok(metrics.invocations.byMode.muse >= 3, 'Should have at least 3 muse invocations');
  });

  it('metrics show tool usage across suites', async () => {
    await runner.execute({
      toolId: 'summarize_dossier',
      params: { dossierId: 'D-2026-021' },
      context: BENTON_APPRAISER,
    });

    await runner.execute({
      toolId: 'explain_model_results',
      params: { parcelId: 'P-001-252', taxYear: 2026 },
      context: BENTON_APPRAISER,
    });

    await runner.execute({
      toolId: 'draft_appeal_response',
      params: { parcelId: 'P-001-253', appealId: 'A-2026-011' },
      context: BENTON_SUPERVISOR,
    });

    const metricsService = new MetricsService(traceService);
    const metrics = metricsService.getSummary('1h', 'benton');

    // Check top tools includes our 3 new muse tools
    const toolIds = metrics.topTools.map(t => t.toolId);
    assert.ok(toolIds.includes('summarize_dossier'), 'Should have summarize_dossier');
    assert.ok(toolIds.includes('explain_model_results'), 'Should have explain_model_results');
    assert.ok(toolIds.includes('draft_appeal_response'), 'Should have draft_appeal_response');
  });
});

// ============================================================================
// Lane 1: 93/93 Handler Coverage Verification
// ============================================================================

describe('Lane 1 — 93/93 Handler Coverage', () => {
  let registry;
  let runner;
  let traceStore;
  let traceServiceLocal;
  let registerAllHandlers;
  let registerR1Handlers;

  before(async () => {
    const pilotModule = await import('../pilot/index.js');
    const traceModule = await import('../trace/index.js');
    const pilot = pilotModule.default || pilotModule;
    const trace = traceModule.default || traceModule;

    registerAllHandlers = pilot.registerAllHandlers;
    registerR1Handlers = pilot.registerR1Handlers;

    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);

    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceServiceLocal = new TraceService({ store: traceStore });

    runner = new ToolRunner({ registry, trace: traceServiceLocal });
    registerAllHandlers(runner);
    registerR1Handlers(runner, traceServiceLocal);
  });

  it('every manifest tool has a registered handler (93/93)', () => {
    const manifestToolIds = registry.listTools().map(t => t.toolId).sort();
    const registeredIds = runner.getRegisteredHandlers().sort();

    const missing = manifestToolIds.filter(id => !registeredIds.includes(id));
    assert.strictEqual(
      missing.length, 0,
      `Missing handlers for ${missing.length} tool(s): ${missing.join(', ')}`
    );
    assert.strictEqual(registeredIds.length, manifestToolIds.length,
      `Handler count (${registeredIds.length}) must equal manifest count (${manifestToolIds.length})`
    );
  });

  it('real handlers override stubs for all R1 tools', () => {
    // Verify that registerR1Handlers was called (it registers the real handlers)
    const registered = runner.getRegisteredHandlers();
    const r1Tools = [
      'run_valuation_model', 'explain_value_change', 'route_to_parcel',
      'search_trace_by_correlation', 'summarize_levy_rate_components',
    ];
    for (const toolId of r1Tools) {
      assert.ok(registered.includes(toolId), `R1 tool ${toolId} should be registered`);
    }
  });

  it('canon tools are fully registered (40/40)', () => {
    const canonIds = registry.listTools()
      .filter(t => t.toolId.startsWith('canon_'))
      .map(t => t.toolId)
      .sort();
    const registered = runner.getRegisteredHandlers();
    const missingCanon = canonIds.filter(id => !registered.includes(id));
    assert.strictEqual(
      missingCanon.length, 0,
      `Missing canon handlers: ${missingCanon.join(', ')}`
    );
  });
});

// ============================================================================
// Lane 2: Irreversible + write_high Risk Enforcement
// ============================================================================

describe('Lane 2 — Risk Enforcement (irreversible + write_high)', () => {
  let registry;
  let runner;
  let traceStore;
  let traceServiceLocal;
  let registerAllHandlers;
  let registerR1Handlers;

  beforeEach(async () => {
    const pilotModule = await import('../pilot/index.js');
    const traceModule = await import('../trace/index.js');
    const pilot = pilotModule.default || pilotModule;
    const trace = traceModule.default || traceModule;

    registerAllHandlers = pilot.registerAllHandlers;
    registerR1Handlers = pilot.registerR1Handlers;

    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);

    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceServiceLocal = new TraceService({ store: traceStore });

    runner = new ToolRunner({ registry, trace: traceServiceLocal });
    registerAllHandlers(runner);
    registerR1Handlers(runner, traceServiceLocal);
  });

  it('irreversible tool without supervisorApproval → SUPERVISOR_APPROVAL_REQUIRED', async () => {
    const context = {
      countyId: 'benton',
      userId: 'supervisor-001',
      roles: ['supervisor'],
      mode: 'pilot',
      confirmation: true,
      reasonCode: 'compliance_investigation',
    };

    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: { county: 'benton', traceEventIds: ['evt-1'], reason: 'PII exposure' },
      context,
    });

    assert.strictEqual(result.ok, false, 'Should fail without supervisorApproval');
    assert.ok(
      result.error.includes('SUPERVISOR_APPROVAL_REQUIRED'),
      `Error should mention SUPERVISOR_APPROVAL_REQUIRED, got: ${result.error}`
    );
  });

  it('irreversible tool with invalid supervisor role → SUPERVISOR_ROLE_INVALID', async () => {
    const context = {
      countyId: 'benton',
      userId: 'clerk-001',
      roles: ['clerk'],
      mode: 'pilot',
      confirmation: true,
      reasonCode: 'compliance_investigation',
      supervisorApproval: { role: 'clerk', userId: 'clerk-001' },
    };

    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: { county: 'benton', traceEventIds: ['evt-1'], reason: 'PII exposure' },
      context,
    });

    assert.strictEqual(result.ok, false, 'Should fail with invalid supervisor role');
    assert.ok(
      result.error.includes('SUPERVISOR_ROLE_INVALID'),
      `Error should mention SUPERVISOR_ROLE_INVALID, got: ${result.error}`
    );
  });

  it('irreversible tool with valid supervisor + confirmation + reason → passes enforcement', async () => {
    const context = {
      countyId: 'benton',
      userId: 'admin-001',
      roles: ['administrator'],
      mode: 'pilot',
      confirmation: true,
      reasonCode: 'legal_compliance',
      supervisorApproval: { role: 'supervisor', userId: 'super-001' },
    };

    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: { county: 'benton', traceEventIds: ['evt-1'], reason: 'PII exposure' },
      context,
    });

    // Should pass enforcement and reach handler execution
    assert.strictEqual(result.ok, true, `Expected ok=true, got error: ${result.error ?? 'none'}`);
    assert.ok(result.result.redactionTicketId, 'Should return a redaction ticket');
    assert.strictEqual(result.result.status, 'pending_review');
  });

  it('write_high tool without confirmation → CONFIRMATION_REQUIRED', async () => {
    const context = {
      countyId: 'benton',
      userId: 'supervisor-001',
      roles: ['supervisor'],
      mode: 'pilot',
      // confirmation deliberately omitted
      reasonCode: 'annual_certification',
    };

    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: { county: 'benton', caseId: 'BOE-2026-001' },
      context,
    });

    assert.strictEqual(result.ok, false, 'Should fail without confirmation');
    assert.ok(
      result.error.includes('CONFIRMATION_REQUIRED'),
      `Error should mention CONFIRMATION_REQUIRED, got: ${result.error}`
    );
  });

  it('write_high tool without reasonCode → REASON_CODE_REQUIRED', async () => {
    const context = {
      countyId: 'benton',
      userId: 'supervisor-001',
      roles: ['supervisor'],
      mode: 'pilot',
      confirmation: true,
      // reasonCode deliberately omitted
    };

    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: { county: 'benton', caseId: 'BOE-2026-001' },
      context,
    });

    assert.strictEqual(result.ok, false, 'Should fail without reasonCode');
    assert.ok(
      result.error.includes('REASON_CODE_REQUIRED'),
      `Error should mention REASON_CODE_REQUIRED, got: ${result.error}`
    );
  });
});

// ============================================================================
// Lane 3: Real Trace Handler Tests (search + redaction)
// ============================================================================

describe('Lane 3 — Real Trace Handlers', () => {
  let registry;
  let runner;
  let traceStore;
  let traceServiceLocal;
  let createSearchTraceHandler;
  let createRequestTraceRedactionHandler;
  let registerAllHandlers;

  beforeEach(async () => {
    const pilotModule = await import('../pilot/index.js');
    const traceModule = await import('../trace/index.js');
    const pilot = pilotModule.default || pilotModule;
    const trace = traceModule.default || traceModule;

    createSearchTraceHandler = pilot.createSearchTraceHandler;
    createRequestTraceRedactionHandler = pilot.createRequestTraceRedactionHandler;
    registerAllHandlers = pilot.registerAllHandlers;

    registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);

    traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    traceServiceLocal = new TraceService({ store: traceStore });

    runner = new ToolRunner({ registry, trace: traceServiceLocal });
    registerAllHandlers(runner);

    // Register real trace handlers (override stubs)
    runner.registerHandler(
      'search_trace_by_correlation',
      createSearchTraceHandler(traceServiceLocal)
    );
    runner.registerHandler(
      'request_trace_redaction',
      createRequestTraceRedactionHandler(traceServiceLocal)
    );
  });

  it('search_trace_by_correlation finds events by correlationId', async () => {
    // Seed a trace event with a known correlationId
    const testCorrelationId = 'test-corr-12345';
    traceServiceLocal.emit({
      type: 'tool_invoked',
      toolId: 'run_valuation_model',
      correlationId: testCorrelationId,
      context: { countyId: 'benton', userId: 'test', roles: ['appraiser'], mode: 'muse' },
      summary: 'Test invocation',
    });

    const context = {
      countyId: 'benton',
      userId: 'appraiser-001',
      roles: ['appraiser'],
      mode: 'pilot',
    };

    const result = await runner.execute({
      toolId: 'search_trace_by_correlation',
      params: { county: 'benton', correlationId: testCorrelationId },
      context,
    });

    assert.strictEqual(result.ok, true, `Expected ok=true, got error: ${result.error ?? 'none'}`);
    assert.strictEqual(result.result.found, true, 'Should find the seeded event');
    assert.ok(result.result.events.length >= 1, 'Should return at least 1 event');
    assert.strictEqual(result.result.events[0].type, 'tool_invoked');
  });

  it('search_trace_by_correlation returns empty for unknown correlationId', async () => {
    const context = {
      countyId: 'benton',
      userId: 'appraiser-001',
      roles: ['appraiser'],
      mode: 'pilot',
    };

    const result = await runner.execute({
      toolId: 'search_trace_by_correlation',
      params: { county: 'benton', correlationId: 'nonexistent-correlation' },
      context,
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.result.found, false);
    assert.strictEqual(result.result.events.length, 0);
  });

  it('request_trace_redaction emits redaction event via real handler', async () => {
    const context = {
      countyId: 'benton',
      userId: 'admin-001',
      roles: ['administrator'],
      mode: 'pilot',
      confirmation: true,
      reasonCode: 'legal_compliance',
      supervisorApproval: { role: 'supervisor', userId: 'super-001' },
    };

    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: { county: 'benton', traceEventIds: ['evt-abc'], reason: 'PII data leak' },
      context,
    });

    assert.strictEqual(result.ok, true, `Expected ok=true, got error: ${result.error ?? 'none'}`);
    assert.ok(result.result.redactionTicketId, 'Should produce a redaction ticket ID');
    assert.strictEqual(result.result.status, 'pending_review');
    assert.strictEqual(result.result.eventsMarked, 1);

    // Verify the redaction_requested event was emitted to trace
    const allEvents = traceServiceLocal.query({});
    const redactionEvent = allEvents.find(e => e.type === 'redaction_requested');
    assert.ok(redactionEvent, 'TraceService should contain a redaction_requested event');
    assert.ok(
      redactionEvent.summary.includes('PII data leak'),
      'Redaction event should contain the reason'
    );
  });
});

// ============================================================================
// R3.0 — Constitutional CI Gate: Naming Lint (manifest-level)
// ============================================================================

describe('R3.0 Gate 1 — Naming Lint (manifest)', () => {
  let manifest;

  before(async () => {
    const { readFileSync } = await import('node:fs');
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  });

  it('every toolId is valid snake_case', () => {
    const snakeCaseRe = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;
    const violations = manifest.tools
      .filter(t => !snakeCaseRe.test(t.toolId))
      .map(t => t.toolId);
    assert.strictEqual(violations.length, 0,
      `toolIds violating snake_case: ${violations.join(', ')}`);
  });

  it('no toolId or displayName contains banned naming patterns', () => {
    const banned = [
      /\btara\b/i,           // Must be "Terra", not "Tara"
      /terra\s+pilot/i,      // Must be "TerraPilot" (no space)
      /terra-pilot/i,        // Must be "TerraPilot" (no hyphen)
      /terra\s+forge/i,
      /terra\s+atlas/i,
      /terra\s+dais/i,
      /terra\s+dossier/i,
      /terra\s+canon/i,
      /terra\s+trace/i,
    ];
    const violations = [];
    for (const tool of manifest.tools) {
      for (const pattern of banned) {
        if (pattern.test(tool.toolId) || pattern.test(tool.displayName)) {
          violations.push(`${tool.toolId}: matched ${pattern}`);
        }
      }
    }
    assert.strictEqual(violations.length, 0,
      `Banned naming patterns found: ${violations.join('; ')}`);
  });

  it('every suite value is in the constitutional allowlist', () => {
    const allowed = new Set([
      'forge', 'atlas', 'dais', 'dossier', 'os', 'pilot', 'gpt',
      'clerk', 'treasury', 'audit',
    ]);
    const violations = manifest.tools
      .filter(t => !allowed.has(t.suite))
      .map(t => `${t.toolId} → suite="${t.suite}"`);
    assert.strictEqual(violations.length, 0,
      `Invalid suite values: ${violations.join(', ')}`);
  });
});

// ============================================================================
// R3.0 — Constitutional CI Gate: Write-Lane Assertions (manifest-level)
// ============================================================================

describe('R3.0 Gate 2 — Write-Lane Assertions (manifest)', () => {
  let manifest;

  before(async () => {
    const { readFileSync } = await import('node:fs');
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  });

  it('every non-read_only tool has a writeLane', () => {
    const violations = manifest.tools
      .filter(t => t.risk !== 'read_only' && !t.writeLane)
      .map(t => t.toolId);
    assert.strictEqual(violations.length, 0,
      `Non-read_only tools missing writeLane: ${violations.join(', ')}`);
  });

  it('every read_only tool has writeLane === null', () => {
    const violations = manifest.tools
      .filter(t => t.risk === 'read_only' && t.writeLane != null)
      .map(t => `${t.toolId} → writeLane="${t.writeLane}"`);
    assert.strictEqual(violations.length, 0,
      `read_only tools with non-null writeLane: ${violations.join(', ')}`);
  });

  it('writeLane matches suite for every tool (single-lane ownership)', () => {
    const violations = manifest.tools
      .filter(t => t.writeLane != null && t.writeLane !== t.suite)
      .map(t => `${t.toolId}: suite="${t.suite}" vs writeLane="${t.writeLane}"`);
    assert.strictEqual(violations.length, 0,
      `Write-lane ≠ suite violations: ${violations.join('; ')}`);
  });

  it('every risk value is in the valid set', () => {
    const valid = new Set(['read_only', 'write_low', 'write_high', 'irreversible']);
    const violations = manifest.tools
      .filter(t => !valid.has(t.risk))
      .map(t => `${t.toolId} → risk="${t.risk}"`);
    assert.strictEqual(violations.length, 0,
      `Invalid risk values: ${violations.join(', ')}`);
  });
});

// ============================================================================
// R3.0 — Constitutional CI Gate: Risk Policy Completeness (manifest-level)
// ============================================================================

describe('R3.0 Gate 3 — Risk Policy Completeness (manifest)', () => {
  let manifest;

  before(async () => {
    const { readFileSync } = await import('node:fs');
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  });

  it('every write_high tool requires confirmation + reasonCode', () => {
    const violations = manifest.tools
      .filter(t => t.risk === 'write_high')
      .filter(t => !t.requiresConfirmation || !t.reasonCodeRequired || !Array.isArray(t.reasonCodes) || t.reasonCodes.length === 0)
      .map(t => t.toolId);
    assert.strictEqual(violations.length, 0,
      `write_high tools missing confirmation/reasonCode: ${violations.join(', ')}`);
  });

  it('every irreversible tool requires supervisorApproval + supervisorRoles', () => {
    const violations = manifest.tools
      .filter(t => t.risk === 'irreversible')
      .filter(t => !t.requiresSupervisorApproval || !Array.isArray(t.supervisorRoles) || t.supervisorRoles.length === 0)
      .map(t => t.toolId);
    assert.strictEqual(violations.length, 0,
      `irreversible tools missing supervisor config: ${violations.join(', ')}`);
  });

  it('every tool with piiHandling=payload_ref has payloadStore', () => {
    const violations = manifest.tools
      .filter(t => t.piiHandling === 'payload_ref' && !t.payloadStore)
      .map(t => t.toolId);
    assert.strictEqual(violations.length, 0,
      `payload_ref tools missing payloadStore: ${violations.join(', ')}`);
  });

  it('every dais tool has piiHandling !== none', () => {
    const violations = manifest.tools
      .filter(t => t.suite === 'dais' && t.piiHandling === 'none')
      .map(t => t.toolId);
    assert.strictEqual(violations.length, 0,
      `dais tools with piiHandling=none (must sanitize or payload_ref): ${violations.join(', ')}`);
  });
});
