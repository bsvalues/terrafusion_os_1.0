/**
 * TerraFusion OS - R1 Final Governance Validation (CP-11)
 *
 * Comprehensive tests for ALL ToolRunner enforcement gates:
 *   Gate 4: Write-lane assertions (WRITE_LANE_MISMATCH, WRITE_LANE_REQUIRED)
 *   Gate 5: Risk-policy enforcement (CONFIRMATION/REASON/SUPERVISOR error codes)
 *   Gate 5b: RBAC permission enforcement (PERMISSION_DENIED - major gap filled)
 *   Gate 6: PII/Trace policy (PAYLOAD_STORE_REQUIRED)
 *   County isolation via ToolRunner.run()
 *
 * Strategy:
 * - RBAC tests: real manifest tools with wrong-role contexts
 * - Write-lane/PII runtime tests: monkey-patch registry after init
 * - Risk-policy: real manifest write_high/irreversible tools
 *
 * Tests: 28
 */

import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

let ToolRunner, ToolRegistry, ToolRunnerError, ErrorCodes;
let TraceService, InMemoryTraceStore;
let registerPhase84Handlers;

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const traceModule = await import('../trace/index.js');
  const pilot = pilotModule.default || pilotModule;
  const trace = traceModule.default || traceModule;

  ToolRunner = pilot.ToolRunner;
  ToolRegistry = pilot.ToolRegistry;
  ToolRunnerError = pilot.ToolRunnerError;
  ErrorCodes = pilot.ErrorCodes;
  registerPhase84Handlers = pilot.registerPhase84Handlers;
  TraceService = trace.TraceService;
  InMemoryTraceStore = trace.InMemoryTraceStore;
});

// -- Helpers -----------------------------------------------------------------

async function setupRunner(preflightPolicy) {
  const registry = new ToolRegistry();
  await registry.initialize(MANIFEST_PATH);
  const store = new InMemoryTraceStore({ maxEvents: 1000 });
  const trace = new TraceService({ store });
  const runner = new ToolRunner({ registry, trace, preflightPolicy });
  registerPhase84Handlers(runner);
  return { runner, registry, trace, store };
}

function injectSyntheticTool(registry, tool) {
  registry.tools.set(tool.toolId, tool);
}

const noopHandler = async () => ({ ok: true });

// -- Contexts ----------------------------------------------------------------

const VIEWER_PILOT = { countyId: 'benton', userId: 'viewer-001', roles: ['viewer'], mode: 'pilot' };
const VIEWER_MUSE = { countyId: 'benton', userId: 'viewer-001', roles: ['viewer'], mode: 'muse' };
const APPRAISER_PILOT = { countyId: 'benton', userId: 'appraiser-001', roles: ['appraiser'], mode: 'pilot' };
const APPRAISER_MUSE = { countyId: 'benton', userId: 'appraiser-001', roles: ['appraiser'], mode: 'muse' };
const SUPERVISOR_PILOT = { countyId: 'benton', userId: 'super-001', roles: ['supervisor'], mode: 'pilot' };
const SUPERVISOR_MUSE = { countyId: 'benton', userId: 'super-001', roles: ['supervisor'], mode: 'muse' };
const ADMIN_PILOT = { countyId: 'benton', userId: 'admin-001', roles: ['administrator'], mode: 'pilot' };
const FABRICATED_PILOT = { countyId: 'benton', userId: 'hacker-001', roles: ['superadmin'], mode: 'pilot' };
const MULTI_ROLE_MUSE = { countyId: 'benton', userId: 'multi-001', roles: ['appraiser', 'supervisor'], mode: 'muse' };
const WRITE_LOW_PILOT_APPROVED = { confirmation: true, reasonCode: 'workflow_update' };
const WRITE_LOW_MUSE_APPROVED = { confirmation: true, reasonCode: 'appeal_response' };

// == Gate 5b: RBAC Permission Enforcement ====================================

describe('Gate 5b: RBAC Permission Enforcement', () => {
  it('viewer -> add_dossier_note (write:dossier) -> PERMISSION_DENIED', async () => {
    const { runner } = await setupRunner();
    const result = await runner.execute({
      toolId: 'add_dossier_note',
      params: { county: 'benton' },
      context: { ...VIEWER_PILOT, ...WRITE_LOW_PILOT_APPROVED },
    });
    assert.equal(result.ok, false);
    assert.equal(result.errorCode, ErrorCodes.PERMISSION_DENIED);
    assert.ok(result.error.includes('write:dossier'));
  });

  it('appraiser -> draft_appeal_response (write:dais) -> PERMISSION_DENIED', async () => {
    const { runner } = await setupRunner();
    const result = await runner.execute({
      toolId: 'draft_appeal_response',
      params: { county: 'benton' },
      context: { ...APPRAISER_MUSE, ...WRITE_LOW_MUSE_APPROVED },
    });
    assert.equal(result.ok, false);
    assert.equal(result.errorCode, ErrorCodes.PERMISSION_DENIED);
    assert.ok(result.error.includes('write:dais'));
  });

  it('supervisor -> draft_appeal_response (write:dais) -> PASS (has write:dais)', async () => {
    const { runner } = await setupRunner();
    const result = runner.validate({
      toolId: 'draft_appeal_response',
      params: { county: 'benton' },
      context: { ...SUPERVISOR_MUSE, ...WRITE_LOW_MUSE_APPROVED },
    });
    assert.equal(result.valid, true);
    assert.equal(result.violations.length, 0);
  });

  it('fabricated role -> add_dossier_note -> PERMISSION_DENIED (no claims)', async () => {
    const { runner } = await setupRunner();
    const result = await runner.execute({
      toolId: 'add_dossier_note',
      params: { county: 'benton' },
      context: { ...FABRICATED_PILOT, ...WRITE_LOW_PILOT_APPROVED },
    });
    assert.equal(result.ok, false);
    assert.equal(result.errorCode, ErrorCodes.PERMISSION_DENIED);
  });

  it('fabricated role -> explain_value_change (read_only) -> PERMISSION_DENIED', async () => {
    const { runner } = await setupRunner();
    const result = await runner.execute({
      toolId: 'explain_value_change',
      params: { county: 'benton' },
      context: { ...FABRICATED_PILOT, mode: 'muse' },
    });
    assert.equal(result.ok, false);
    assert.equal(result.errorCode, ErrorCodes.PERMISSION_DENIED);
    assert.ok(result.error.includes('read:parcel'));
  });

  it('multi-role [appraiser+supervisor] -> draft_appeal_response -> PASS (union claims)', async () => {
    const { runner } = await setupRunner();
    const result = runner.validate({
      toolId: 'draft_appeal_response',
      params: { county: 'benton' },
      context: { ...MULTI_ROLE_MUSE, ...WRITE_LOW_MUSE_APPROVED },
    });
    assert.equal(result.valid, true);
    assert.equal(result.violations.length, 0);
  });

  it('viewer -> explain_value_change (read_only, touches parcel) -> PASS', async () => {
    const { runner } = await setupRunner();
    const result = runner.validate({
      toolId: 'explain_value_change',
      params: { county: 'benton' },
      context: VIEWER_MUSE,
    });
    assert.equal(result.valid, true);
    assert.equal(result.violations.length, 0);
  });

  it('appraiser -> run_valuation_model -> CONFIRMATION_REQUIRED (risk-policy fires first)', async () => {
    const { runner } = await setupRunner();
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton' },
      context: APPRAISER_PILOT,
    });
    assert.equal(result.ok, false);
    assert.equal(result.errorCode, ErrorCodes.CONFIRMATION_REQUIRED);
  });

  it('appraiser -> request_trace_redaction -> multiple denials (risk + RBAC)', async () => {
    const { runner } = await setupRunner();
    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: { county: 'benton' },
      context: APPRAISER_PILOT,
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.error.includes('SUPERVISOR_APPROVAL_REQUIRED') ||
      result.error.includes('PERMISSION_DENIED'),
      'Should contain supervisor or permission denial'
    );
  });
});

// == Gate 4: Write-Lane Enforcement (runtime) ================================

describe('Gate 4: Write-Lane Enforcement (runtime)', () => {
  it('WRITE_LANE_MISMATCH: synthetic tool with writeLane !== suite -> rejected', async () => {
    const { runner, registry } = await setupRunner();
    injectSyntheticTool(registry, {
      toolId: 'synth_bad_lane',
      displayName: 'Synthetic Bad Lane',
      suite: 'forge',
      mode: 'pilot',
      risk: 'write_low',
      writeLane: 'dais',
      touches: ['parcel'],
      piiHandling: 'sanitize',
      tracePolicy: 'summary_only',
    });
    runner.registerHandler('synth_bad_lane', noopHandler);
    const result = await runner.execute({
      toolId: 'synth_bad_lane',
      params: { county: 'benton' },
      context: SUPERVISOR_PILOT,
    });
    assert.equal(result.ok, false);
    assert.equal(result.errorCode, ErrorCodes.WRITE_LANE_MISMATCH);
  });

  it('WRITE_LANE_REQUIRED: synthetic write_low tool with null writeLane -> rejected', async () => {
    const { runner, registry } = await setupRunner();
    injectSyntheticTool(registry, {
      toolId: 'synth_no_lane',
      displayName: 'No Lane',
      suite: 'forge',
      mode: 'pilot',
      risk: 'write_low',
      writeLane: null,
      touches: ['parcel'],
      piiHandling: 'sanitize',
      tracePolicy: 'summary_only',
    });
    runner.registerHandler('synth_no_lane', noopHandler);
    const result = await runner.execute({
      toolId: 'synth_no_lane',
      params: { county: 'benton' },
      context: SUPERVISOR_PILOT,
    });
    assert.equal(result.ok, false);
    assert.equal(result.errorCode, ErrorCodes.WRITE_LANE_REQUIRED);
  });

  it('read_only tool with null writeLane -> passes Gate 4', async () => {
    const { runner } = await setupRunner();
    const result = runner.validate({
      toolId: 'explain_value_change',
      params: { county: 'benton' },
      context: APPRAISER_MUSE,
    });
    assert.equal(result.valid, true);
  });

  it('write tool with writeLane === suite -> passes Gate 4', async () => {
    const { runner } = await setupRunner();
    const result = runner.validate({
      toolId: 'add_dossier_note',
      params: { county: 'benton' },
      context: { ...APPRAISER_PILOT, ...WRITE_LOW_PILOT_APPROVED },
    });
    assert.equal(result.valid, true);
  });
});

// == Gate 5: Risk-Policy Enforcement =========================================

describe('Gate 5: Risk-Policy Enforcement', () => {
  it('write_high without confirmation -> CONFIRMATION_REQUIRED', async () => {
    const { runner } = await setupRunner();
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton' },
      context: APPRAISER_PILOT,
    });
    assert.equal(result.ok, false);
    assert.equal(result.errorCode, ErrorCodes.CONFIRMATION_REQUIRED);
  });

  it('write_high with invalid reasonCode -> REASON_CODE_INVALID', async () => {
    const { runner } = await setupRunner();
    const result = await runner.execute({
      toolId: 'run_valuation_model',
      params: { county: 'benton' },
      context: {
        ...APPRAISER_PILOT,
        confirmation: true,
        reasonCode: 'because_i_said_so',
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.errorCode, ErrorCodes.REASON_CODE_INVALID);
  });

  it('irreversible without confirmation -> CONFIRMATION_REQUIRED (before supervisor check)', async () => {
    const { runner } = await setupRunner();
    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: { county: 'benton' },
      context: ADMIN_PILOT,
    });
    assert.equal(result.ok, false);
    assert.equal(result.errorCode, ErrorCodes.CONFIRMATION_REQUIRED);
  });

  it('write_high with valid reasonCode + confirmation -> passes Gate 5', async () => {
    const { runner } = await setupRunner();
    const result = runner.validate({
      toolId: 'run_valuation_model',
      params: { county: 'benton' },
      context: {
        ...APPRAISER_PILOT,
        confirmation: true,
        reasonCode: 'annual_certification',
      },
    });
    assert.equal(result.valid, true);
    assert.equal(result.violations.length, 0);
  });
});

// == Gate 6: PII/Trace Policy Enforcement (runtime) ==========================

describe('Gate 6: PII/Trace Policy Enforcement (runtime)', () => {
  it('PAYLOAD_STORE_REQUIRED: synthetic payload_ref without payloadStore -> rejected', async () => {
    const { runner, registry } = await setupRunner();
    injectSyntheticTool(registry, {
      toolId: 'synth_bad_pii',
      displayName: 'Bad PII',
      suite: 'forge',
      mode: 'pilot',
      risk: 'read_only',
      writeLane: null,
      touches: ['parcel'],
      piiHandling: 'payload_ref',
      tracePolicy: 'payload_ref',
    });
    runner.registerHandler('synth_bad_pii', noopHandler);
    const result = await runner.execute({
      toolId: 'synth_bad_pii',
      params: { county: 'benton' },
      context: APPRAISER_PILOT,
    });
    assert.equal(result.ok, false);
    assert.equal(result.errorCode, ErrorCodes.PAYLOAD_STORE_REQUIRED);
  });

  it('payload_ref WITH payloadStore -> passes Gate 6', async () => {
    const { runner } = await setupRunner();
    const result = runner.validate({
      toolId: 'add_dossier_note',
      params: { county: 'benton' },
      context: { ...APPRAISER_PILOT, ...WRITE_LOW_PILOT_APPROVED },
    });
    assert.equal(result.valid, true);
  });

  it('summary_only tools pass Gate 6 without payloadStore', async () => {
    const { runner } = await setupRunner();
    const result = runner.validate({
      toolId: 'explain_value_change',
      params: { county: 'benton' },
      context: APPRAISER_MUSE,
    });
    assert.equal(result.valid, true);
  });
});

// == Preflight Policy Alignment ==============================================

describe('Preflight Policy Alignment', () => {
  it('validate reports POLICY_DENIED when preflight blocks an otherwise valid invocation', async () => {
    const denyTool = ({ toolId }) =>
      toolId === 'summarize_levy_rate_components'
        ? { allow: false, reason: 'County freeze' }
        : { allow: true };
    const { runner } = await setupRunner(denyTool);

    const result = runner.validate({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton' },
      context: APPRAISER_MUSE,
    });

    assert.equal(result.valid, false);
    assert.ok(result.violations.some(v => v.includes('POLICY_DENIED')));
    assert.ok(result.violations.some(v => v.includes('County freeze')));
  });

  it('execute still returns POLICY_DENIED for the same preflight block', async () => {
    const denyTool = ({ toolId }) =>
      toolId === 'summarize_levy_rate_components'
        ? { allow: false, reason: 'County freeze' }
        : { allow: true };
    const { runner } = await setupRunner(denyTool);

    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton' },
      context: APPRAISER_MUSE,
    });

    assert.equal(result.ok, false);
    assert.equal(result.errorCode, ErrorCodes.POLICY_DENIED);
    assert.equal(result.error, 'County freeze');
  });
});

// == Combined Gate + Trace Emission ==========================================

describe('Combined Gate + Trace Emission', () => {
  it('multiple violations: first error code wins, all reported in error string', async () => {
    const { runner, registry } = await setupRunner();
    injectSyntheticTool(registry, {
      toolId: 'synth_multi_fail',
      displayName: 'Multi Fail',
      suite: 'forge',
      mode: 'pilot',
      risk: 'write_low',
      writeLane: 'dais',
      touches: ['parcel'],
      piiHandling: 'payload_ref',
      tracePolicy: 'payload_ref',
    });
    runner.registerHandler('synth_multi_fail', noopHandler);
    const result = await runner.execute({
      toolId: 'synth_multi_fail',
      params: { county: 'benton' },
      context: SUPERVISOR_PILOT,
    });
    assert.equal(result.ok, false);
    assert.equal(result.errorCode, ErrorCodes.WRITE_LANE_MISMATCH);
    assert.ok(result.error.includes('PAYLOAD_STORE_REQUIRED'));
  });

  it('enforcement failure emits tool_failed trace event', async () => {
    const { runner, store } = await setupRunner();
    await runner.execute({
      toolId: 'add_dossier_note',
      params: { county: 'benton' },
      context: { ...VIEWER_PILOT, ...WRITE_LOW_PILOT_APPROVED },
    });
    const events = await store.query({ toolId: 'add_dossier_note', type: 'tool_failed' });
    assert.ok(events.length >= 1, 'Should emit tool_failed trace event');
    assert.ok(events[0].summary.includes('Enforcement failed'));
  });

  it('successful execution emits tool_invoked + tool_completed trace pair', async () => {
    const { runner, store } = await setupRunner();
    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: { county: 'benton' },
      context: { ...APPRAISER_MUSE, mode: 'muse' },
    });
    assert.equal(result.ok, true);
    const events = await store.query({ toolId: 'summarize_levy_rate_components' });
    const types = events.map(e => e.type);
    assert.ok(types.includes('tool_invoked'), 'Should have tool_invoked');
    assert.ok(types.includes('tool_completed'), 'Should have tool_completed');
  });

  it('mode mismatch returns MODE_MISMATCH before gate checks', async () => {
    const { runner } = await setupRunner();
    const result = await runner.execute({
      toolId: 'explain_value_change',
      params: { county: 'benton' },
      context: APPRAISER_PILOT,
    });
    assert.equal(result.ok, false);
    assert.equal(result.errorCode, ErrorCodes.MODE_MISMATCH);
  });
});

// == County Isolation (ToolRunner.run) =======================================

describe('County Isolation (ToolRunner.run)', () => {
  it('validate reports COUNTY_MISMATCH before handler execution', async () => {
    const { runner } = await setupRunner();
    const result = runner.validate({
      toolId: 'request_trace_redaction',
      params: { county: 'yakima', traceEventIds: ['trace-1'], reason: 'Mismatch check' },
      context: {
        ...ADMIN_PILOT,
        confirmation: true,
        reasonCode: 'court_order',
        supervisorApproval: {
          approvedBy: 'supervisor-1',
          approvedAt: new Date().toISOString(),
          role: 'supervisor',
        },
      },
    });

    assert.equal(result.valid, false);
    assert.ok(result.violations.some(v => v.includes('COUNTY_MISMATCH')));
  });

  it('execute returns COUNTY_MISMATCH before handler execution', async () => {
    const { runner } = await setupRunner();
    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: { county: 'yakima', traceEventIds: ['trace-1'], reason: 'Mismatch check' },
      context: {
        ...ADMIN_PILOT,
        confirmation: true,
        reasonCode: 'court_order',
        supervisorApproval: {
          approvedBy: 'supervisor-1',
          approvedAt: new Date().toISOString(),
          role: 'supervisor',
        },
      },
    });

    assert.equal(result.ok, false);
    assert.equal(result.errorCode, ErrorCodes.COUNTY_MISMATCH);
  });

  it('county mismatch throws COUNTY_MISMATCH', async () => {
    const { runner } = await setupRunner();
    await assert.rejects(
      () => runner.run('explain_value_change', { county: 'yakima' }, APPRAISER_MUSE),
      (err) => {
        assert.ok(err instanceof ToolRunnerError);
        assert.equal(err.code, 'COUNTY_MISMATCH');
        return true;
      }
    );
  });

  it('missing county throws VALIDATION', async () => {
    const { runner } = await setupRunner();
    await assert.rejects(
      () => runner.run('explain_value_change', {}, APPRAISER_MUSE),
      (err) => {
        assert.ok(err instanceof ToolRunnerError);
        assert.equal(err.code, 'VALIDATION');
        return true;
      }
    );
  });

  it('matching county passes isolation', async () => {
    const { runner } = await setupRunner();
    const result = await runner.run(
      'summarize_levy_rate_components',
      { county: 'benton' },
      APPRAISER_MUSE
    );
    assert.equal(result.ok, true);
  });

  it('unknown tool via run() throws TOOL_NOT_FOUND', async () => {
    const { runner } = await setupRunner();
    await assert.rejects(
      () => runner.run('nonexistent_tool', { county: 'benton' }, APPRAISER_MUSE),
      (err) => {
        assert.ok(err instanceof ToolRunnerError);
        assert.equal(err.code, 'TOOL_NOT_FOUND');
        return true;
      }
    );
  });
});
