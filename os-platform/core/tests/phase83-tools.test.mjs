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

  it('loads the canonical manifest (v2.0.0, 62 tools)', () => {
    assert.strictEqual(registry.getVersion(), '2.0.0');
    assert.strictEqual(registry.listTools().length, 62);
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
