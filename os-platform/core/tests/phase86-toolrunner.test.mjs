/**
 * TerraFusion OS - Phase 8.6 ToolRunner Integration Tests
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

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const traceModule = await import('../trace/index.js');

  const pilot = pilotModule.default || pilotModule;
  const trace = traceModule.default || traceModule;

  ToolRegistry = pilot.ToolRegistry;
  ToolRunner = pilot.ToolRunner;
  ToolRunnerError = pilot.ToolRunnerError;
  registerPhase84Handlers = pilot.registerPhase84Handlers;
  InMemoryTraceStore = trace.InMemoryTraceStore;
  TraceService = trace.TraceService;
});

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');

const BENTON_MUSE = {
  countyId: 'benton',
  userId: 'appraiser-001',
  roles: ['appraiser'],
  mode: 'muse',
};

const BENTON_PILOT = {
  countyId: 'benton',
  userId: 'supervisor-001',
  roles: ['supervisor'],
  mode: 'pilot',
};

function setupRunner() {
  const registry = new ToolRegistry();
  return registry.initialize(MANIFEST_PATH).then(() => {
    const traceStore = new InMemoryTraceStore({ maxEvents: 1000 });
    const traceService = new TraceService({ store: traceStore });
    const runner = new ToolRunner({ registry, trace: traceService });
    registerPhase84Handlers(runner);
    return { registry, traceService, runner };
  });
}

function assertErrorCode(err, code) {
  assert.ok(err instanceof ToolRunnerError, 'Expected ToolRunnerError');
  assert.strictEqual(err.code, code);
  return true;
}

describe('Phase 8.6 ToolRunner - canonical execution', () => {
  it('runs muse read_only tool via ToolRunner.run', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('explain_model_inputs', 'happy');
    const result = await runner.run('explain_model_inputs', fx.params, BENTON_MUSE);

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.toolId, 'explain_model_inputs');
    assert.strictEqual(result.mode, 'muse');
    assert.ok(result.result.inputs.length > 0);
  });

  it('runs muse write_low tool via ToolRunner.run', async () => {
    const { runner, traceService } = await setupRunner();
    const fx = loadToolFixture('draft_value_change_notice', 'happy');
    const result = await runner.run('draft_value_change_notice', fx.params, BENTON_MUSE);

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.toolId, 'draft_value_change_notice');
    assert.strictEqual(result.risk, 'write_low');
    assert.ok(result.payloadRef);
    assertTracePair(traceService, 'draft_value_change_notice');
  });

  it('runs pilot read_only tool via ToolRunner.run', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('search_trace_by_correlation', 'happy');
    const result = await runner.run('search_trace_by_correlation', fx.params, BENTON_PILOT);

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.toolId, 'search_trace_by_correlation');
    assert.strictEqual(result.mode, 'pilot');
    assert.ok(Array.isArray(result.result.events));
  });

  it('rejects muse tool invoked under pilot context', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('explain_model_inputs', 'happy');
    await assert.rejects(
      () => runner.run('explain_model_inputs', fx.params, BENTON_PILOT),
      err => assertErrorCode(err, 'MODE_DENIED')
    );
  });

  it('rejects county mismatch', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('explain_senior_exemption_impact', 'negative');
    await assert.rejects(
      () => runner.run('explain_senior_exemption_impact', fx.params, BENTON_MUSE),
      err => assertErrorCode(err, 'COUNTY_MISMATCH')
    );
  });

  it('emits payloadRef in trace for payload_ref tools', async () => {
    const { runner, traceService } = await setupRunner();
    const fx = loadToolFixture('summarize_parcel_casefile', 'happy');
    const result = await runner.run('summarize_parcel_casefile', fx.params, BENTON_MUSE);

    assert.strictEqual(result.ok, true);
    const { completed } = assertTracePair(traceService, 'summarize_parcel_casefile');
    assert.ok(completed.payloadRef, 'Expected payloadRef on completed trace event');
  });

  it('search_trace_by_correlation returns metadata only', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('search_trace_by_correlation', 'happy');
    const result = await runner.run('search_trace_by_correlation', fx.params, BENTON_PILOT);

    assert.strictEqual(result.ok, true);
    for (const event of result.result.events) {
      const keys = Object.keys(event).sort();
      assert.deepStrictEqual(keys, ['toolId', 'ts', 'type'].filter(k => k in event).sort());
    }
  });
});
