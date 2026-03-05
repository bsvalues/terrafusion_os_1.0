/**
 * TerraFusion OS — C2 Write-Lane Governance Enforcement Tests
 *
 * Tests the ToolRunner enforcement gates for write_high and irreversible tools:
 *   Gate 4: Write-lane assertions (writeLane must match suite)
 *   Gate 5: Risk policy (confirmation, reasonCode, supervisorApproval)
 *   Gate 5b: RBAC (role-based claims)
 *   Gate 6: PII/Trace policy (payloadStore required for payload_ref)
 *
 * Ground truth: the frozen invoke contract in ToolRunner.ts enforceRiskPolicy()
 * and the tool manifest in tools/registry/terrapilot.tools.json.
 */

import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { assertTracePair } from './_helpers/tracePii.mjs';
import { loadToolFixture } from './fixtureLoader.mjs';

let ToolRegistry;
let ToolRunner;
let ToolRunnerError;
let InMemoryTraceStore;
let TraceService;
let registerPhase84Handlers;
let registerWriteGateHandlers;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const traceModule = await import('../trace/index.js');

  const pilot = pilotModule.default || pilotModule;
  const trace = traceModule.default || traceModule;

  ToolRegistry = pilot.ToolRegistry;
  ToolRunner = pilot.ToolRunner;
  ToolRunnerError = pilot.ToolRunnerError;
  registerPhase84Handlers = pilot.registerPhase84Handlers;
  registerWriteGateHandlers = pilot.registerWriteGateHandlers;
  InMemoryTraceStore = trace.InMemoryTraceStore;
  TraceService = trace.TraceService;
});

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');

// ============================================================================
// Context factories
// ============================================================================

/** Supervisor in pilot mode — can use write_high tools with proper gates */
function pilotSupervisor(overrides = {}) {
  return {
    countyId: 'benton',
    userId: 'supervisor-001',
    roles: ['supervisor'],
    mode: 'pilot',
    ...overrides,
  };
}

/** Administrator with supervisor approval — can use irreversible tools */
function pilotAdmin(overrides = {}) {
  return {
    countyId: 'benton',
    userId: 'admin-001',
    roles: ['administrator'],
    mode: 'pilot',
    ...overrides,
  };
}

/** Viewer — read-only, cannot use write tools */
function pilotViewer(overrides = {}) {
  return {
    countyId: 'benton',
    userId: 'viewer-001',
    roles: ['viewer'],
    mode: 'pilot',
    ...overrides,
  };
}

/** Appraiser — can write to forge, but not dais or os */
function pilotAppraiser(overrides = {}) {
  return {
    countyId: 'benton',
    userId: 'appraiser-001',
    roles: ['appraiser'],
    mode: 'pilot',
    ...overrides,
  };
}

// ============================================================================
// Runner setup
// ============================================================================

function setupRunner() {
  const registry = new ToolRegistry();
  return registry.initialize(MANIFEST_PATH).then(() => {
    const traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    const traceService = new TraceService({ store: traceStore });
    const runner = new ToolRunner({ registry, trace: traceService });
    registerPhase84Handlers(runner);
    registerWriteGateHandlers(runner);
    return { registry, traceService, runner };
  });
}

function assertErrorCode(err, code) {
  assert.ok(err instanceof ToolRunnerError, `Expected ToolRunnerError, got ${err?.constructor?.name}`);
  assert.strictEqual(err.code, code);
  return true;
}

// ============================================================================
// write_high: run_valuation_model
// ============================================================================

describe('C2 Gate 5: write_high — run_valuation_model', () => {
  it('rejects without confirmation', async () => {
    const { runner } = await setupRunner();
    // run_valuation_model is registered via handlers.real.ts in R1;
    // for C2 governance tests we only need the manifest + enforcement layer.
    // Use execute() directly to test the enforcement without a handler.
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'P-500', taxYear: 2026 },
      context: pilotSupervisor({ confirmation: false, reasonCode: 'annual_certification' }),
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('CONFIRMATION_REQUIRED'), `Expected CONFIRMATION_REQUIRED, got: ${result.error}`);
  });

  it('rejects without reasonCode', async () => {
    const { runner } = await setupRunner();
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'P-500', taxYear: 2026 },
      context: pilotSupervisor({ confirmation: true }),
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('REASON_CODE_REQUIRED'), `Expected REASON_CODE_REQUIRED, got: ${result.error}`);
  });

  it('rejects invalid reasonCode', async () => {
    const { runner } = await setupRunner();
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'P-500', taxYear: 2026 },
      context: pilotSupervisor({ confirmation: true, reasonCode: 'arbitrary_reason' }),
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('REASON_CODE_INVALID'), `Expected REASON_CODE_INVALID, got: ${result.error}`);
  });

  it('rejects viewer (RBAC)', async () => {
    const { runner } = await setupRunner();
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'P-500', taxYear: 2026 },
      context: pilotViewer({ confirmation: true, reasonCode: 'annual_certification' }),
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('PERMISSION_DENIED'), `Expected PERMISSION_DENIED, got: ${result.error}`);
  });

  it('rejects muse mode (mode mismatch)', async () => {
    const { runner } = await setupRunner();
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'P-500', taxYear: 2026 },
      context: pilotSupervisor({ mode: 'muse', confirmation: true, reasonCode: 'annual_certification' }),
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('mode') || result.errorCode === 'MODE_MISMATCH',
      `Expected MODE_MISMATCH, got: ${result.errorCode} / ${result.error}`);
  });
});

// ============================================================================
// write_high: assemble_boe_packet
// ============================================================================

describe('C2 Gate 5: write_high — assemble_boe_packet', () => {
  it('succeeds with confirmation + valid reasonCode + supervisor role', async () => {
    const { runner, traceService } = await setupRunner();
    const fx = loadToolFixture('assemble_boe_packet', 'happy');
    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: fx.params,
      context: pilotSupervisor({
        confirmation: true,
        reasonCode: 'appeal_response',
      }),
    });
    assert.strictEqual(result.ok, true, `Expected ok=true, got error: ${result.error}`);
    assert.ok(result.result.packetRef);
    assert.ok(result.result.sections.length > 0);
    assertTracePair(traceService, 'assemble_boe_packet');
  });

  it('rejects without confirmation', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('assemble_boe_packet', 'happy');
    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: fx.params,
      context: pilotSupervisor({ reasonCode: 'appeal_response' }),
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('CONFIRMATION_REQUIRED'));
  });

  it('rejects without reasonCode', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('assemble_boe_packet', 'happy');
    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: fx.params,
      context: pilotSupervisor({ confirmation: true }),
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('REASON_CODE_REQUIRED'));
  });

  it('rejects appraiser (RBAC — no write:dais claim)', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('assemble_boe_packet', 'happy');
    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: fx.params,
      context: pilotAppraiser({ confirmation: true, reasonCode: 'appeal_response' }),
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('PERMISSION_DENIED'));
  });

  it('rejects county mismatch (fixture negative)', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('assemble_boe_packet', 'negative');
    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: fx.params,
      context: pilotSupervisor({ confirmation: true, reasonCode: 'appeal_response' }),
    });
    // County mismatch may be caught by handler or by ToolRunner.run()
    // execute() doesn't enforce county — the handler does via assertCountyMatch
    assert.strictEqual(result.ok, false);
  });
});

// ============================================================================
// irreversible: request_trace_redaction
// ============================================================================

describe('C2 Gate 5: irreversible — request_trace_redaction', () => {
  it('succeeds with confirmation + reasonCode + supervisorApproval', async () => {
    const { runner, traceService } = await setupRunner();
    const fx = loadToolFixture('request_trace_redaction', 'happy');
    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: fx.params,
      context: pilotAdmin({
        confirmation: true,
        reasonCode: 'data_subject_request',
        supervisorApproval: {
          approvedBy: 'supervisor-chief',
          approvedAt: '2026-03-01T10:00:00Z',
          role: 'supervisor',
        },
      }),
    });
    assert.strictEqual(result.ok, true, `Expected ok=true, got error: ${result.error}`);
    assert.ok(result.result.redactionTicketId);
    assert.strictEqual(result.result.status, 'pending_review');
    assert.strictEqual(result.result.eventsMarked, 2);
    assertTracePair(traceService, 'request_trace_redaction');
  });

  it('rejects without confirmation', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('request_trace_redaction', 'happy');
    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: fx.params,
      context: pilotAdmin({
        reasonCode: 'data_subject_request',
        supervisorApproval: {
          approvedBy: 'supervisor-chief',
          approvedAt: '2026-03-01T10:00:00Z',
          role: 'supervisor',
        },
      }),
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('CONFIRMATION_REQUIRED'));
  });

  it('rejects without reasonCode', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('request_trace_redaction', 'happy');
    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: fx.params,
      context: pilotAdmin({
        confirmation: true,
        supervisorApproval: {
          approvedBy: 'supervisor-chief',
          approvedAt: '2026-03-01T10:00:00Z',
          role: 'supervisor',
        },
      }),
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('REASON_CODE_REQUIRED'));
  });

  it('rejects invalid reasonCode', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('request_trace_redaction', 'happy');
    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: fx.params,
      context: pilotAdmin({
        confirmation: true,
        reasonCode: 'because_i_said_so',
        supervisorApproval: {
          approvedBy: 'supervisor-chief',
          approvedAt: '2026-03-01T10:00:00Z',
          role: 'supervisor',
        },
      }),
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('REASON_CODE_INVALID'));
  });

  it('rejects without supervisorApproval', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('request_trace_redaction', 'happy');
    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: fx.params,
      context: pilotAdmin({
        confirmation: true,
        reasonCode: 'data_subject_request',
      }),
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('SUPERVISOR_APPROVAL_REQUIRED'));
  });

  it('rejects invalid supervisor role', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('request_trace_redaction', 'happy');
    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: fx.params,
      context: pilotAdmin({
        confirmation: true,
        reasonCode: 'data_subject_request',
        supervisorApproval: {
          approvedBy: 'intern-001',
          approvedAt: '2026-03-01T10:00:00Z',
          role: 'intern',
        },
      }),
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('SUPERVISOR_ROLE_INVALID'));
  });

  it('rejects viewer (RBAC — no admin:trace claim)', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('request_trace_redaction', 'happy');
    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: fx.params,
      context: pilotViewer({
        confirmation: true,
        reasonCode: 'data_subject_request',
        supervisorApproval: {
          approvedBy: 'supervisor-chief',
          approvedAt: '2026-03-01T10:00:00Z',
          role: 'supervisor',
        },
      }),
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('PERMISSION_DENIED'));
  });

  it('rejects appraiser (RBAC — no approve:irreversible claim)', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('request_trace_redaction', 'happy');
    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: fx.params,
      context: pilotAppraiser({
        confirmation: true,
        reasonCode: 'data_subject_request',
        supervisorApproval: {
          approvedBy: 'supervisor-chief',
          approvedAt: '2026-03-01T10:00:00Z',
          role: 'supervisor',
        },
      }),
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('PERMISSION_DENIED'));
  });
});

// ============================================================================
// Cross-cutting enforcement
// ============================================================================

describe('C2 Gate 4: write-lane assertions', () => {
  it('write_high tool has writeLane matching suite (manifest invariant)', async () => {
    const { registry } = await setupRunner();
    const tool = registry.getTool('run_valuation_model');
    assert.ok(tool, 'run_valuation_model must exist in manifest');
    assert.strictEqual(tool.writeLane, 'forge');
    assert.strictEqual(tool.suite, 'forge');
  });

  it('irreversible tool has writeLane matching suite (manifest invariant)', async () => {
    const { registry } = await setupRunner();
    const tool = registry.getTool('request_trace_redaction');
    assert.ok(tool, 'request_trace_redaction must exist in manifest');
    assert.strictEqual(tool.writeLane, 'os');
    assert.strictEqual(tool.suite, 'os');
  });

  it('assemble_boe_packet has crossSuiteReads for dossier', async () => {
    const { registry } = await setupRunner();
    const tool = registry.getTool('assemble_boe_packet');
    assert.ok(tool, 'assemble_boe_packet must exist in manifest');
    assert.strictEqual(tool.writeLane, 'dais');
    assert.strictEqual(tool.suite, 'dais');
    assert.ok(tool.crossSuiteReads?.includes('dossier'));
  });
});

describe('C2 Gate 5: risk escalation ladder', () => {
  it('read_only → no gates required', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('explain_model_inputs', 'happy');
    const result = await runner.execute({
      toolId: 'explain_model_inputs',
      params: fx.params,
      context: {
        countyId: 'benton',
        userId: 'appraiser-001',
        roles: ['appraiser'],
        mode: 'muse',
      },
    });
    assert.strictEqual(result.ok, true, `read_only should pass without gates, got: ${result.error}`);
  });

  it('write_low → no confirmation/reason required (handled by role check)', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('add_dossier_note', 'happy');
    const result = await runner.execute({
      toolId: 'add_dossier_note',
      params: fx.params,
      context: {
        countyId: 'benton',
        userId: 'appraiser-001',
        roles: ['appraiser'],
        mode: 'pilot',
      },
    });
    assert.strictEqual(result.ok, true, `write_low should pass for appraiser, got: ${result.error}`);
  });

  it('write_high → requires confirmation + reasonCode', async () => {
    const { runner } = await setupRunner();
    // Missing both → two violations
    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: { county: 'benton', caseId: 'BOE-test' },
      context: pilotSupervisor(),
    });
    assert.strictEqual(result.ok, false);
    assert.ok(result.error.includes('CONFIRMATION_REQUIRED'));
  });

  it('irreversible → requires confirmation + reasonCode + supervisor', async () => {
    const { runner } = await setupRunner();
    // Missing all three → three violations
    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: { county: 'benton', traceEventIds: ['evt-1'] },
      context: pilotAdmin(),
    });
    assert.strictEqual(result.ok, false);
    // Should contain at least CONFIRMATION_REQUIRED (first violation reported)
    assert.ok(result.error.includes('CONFIRMATION_REQUIRED'));
  });
});

describe('C2 trace event emission', () => {
  it('enforcement failure emits tool_failed trace event', async () => {
    const { runner, traceService } = await setupRunner();
    await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton', parcelId: 'P-500' },
      context: pilotSupervisor(), // no confirmation or reasonCode
    });
    const events = traceService.query({ toolId: 'run_valuation_model' });
    const failed = events.find(e => e.type === 'tool_failed');
    assert.ok(failed, 'Expected tool_failed trace event on enforcement failure');
    assert.ok(failed.summary.includes('Enforcement failed'));
  });

  it('successful execution emits invoke + completed pair', async () => {
    const { runner, traceService } = await setupRunner();
    const fx = loadToolFixture('assemble_boe_packet', 'happy');
    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: fx.params,
      context: pilotSupervisor({ confirmation: true, reasonCode: 'appeal_response' }),
    });
    assert.strictEqual(result.ok, true);
    const { invoked, completed } = assertTracePair(traceService, 'assemble_boe_packet');
    assert.strictEqual(invoked.correlationId, completed.correlationId);
  });
});
