/**
 * TerraFusion OS — C3 Golden Fixture Contracts
 *
 * Validates that write-gate tool handlers produce deterministic, golden
 * response shapes. Fixtures contain expectedResponse — the handler MUST
 * produce this exact output for the given inputs.
 *
 * Also includes:
 *   - Negative-path contract tests (blocked → expectedErrorCode)
 *   - Signature guard (positional args rejected)
 *
 * Golden fixtures are the contract: if a handler changes output shape,
 * the fixture must be deliberately updated (deliberate PR, not silent drift).
 */

import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadToolFixture } from './fixtureLoader.mjs';
import { assertNoRawPII } from './_helpers/tracePii.mjs';

let ToolRegistry;
let ToolRunner;
let registerPhase84Handlers;
let registerWriteGateHandlers;
let InMemoryTraceStore;
let TraceService;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const traceModule = await import('../trace/index.js');

  const pilot = pilotModule.default || pilotModule;
  const trace = traceModule.default || traceModule;

  ToolRegistry = pilot.ToolRegistry;
  ToolRunner = pilot.ToolRunner;
  registerPhase84Handlers = pilot.registerPhase84Handlers;
  registerWriteGateHandlers = pilot.registerWriteGateHandlers;
  InMemoryTraceStore = trace.InMemoryTraceStore;
  TraceService = trace.TraceService;
});

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');

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

/** Build an authorized context able to reach the handler. */
function authorizedContext(tool, fixtureContext = {}) {
  const roleForRisk = {
    write_high: 'supervisor',
    irreversible: 'administrator',
  };
  return {
    countyId: 'benton',
    userId: 'golden-fixture-test',
    roles: [roleForRisk[tool] || 'supervisor'],
    mode: 'pilot',
    ...fixtureContext,
  };
}

// ============================================================================
// C3: Golden response contracts — happy path
// ============================================================================

describe('C3 Golden Fixture: assemble_boe_packet (happy)', () => {
  it('produces the exact golden response', async () => {
    const { runner } = await setupRunner();
    const fixture = loadToolFixture('assemble_boe_packet', 'happy');

    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: fixture.params,
      context: authorizedContext('write_high', fixture.context),
    });

    assert.strictEqual(result.ok, true, `Expected ok=true, got error: ${result.error}`);
    assert.deepStrictEqual(result.result, fixture.expectedResponse);
    assert.ok(result.correlationId, 'Missing correlationId on success');
    assertNoRawPII(result.result);
  });
});

describe('C3 Golden Fixture: request_trace_redaction (happy)', () => {
  it('produces the exact golden response', async () => {
    const { runner } = await setupRunner();
    const fixture = loadToolFixture('request_trace_redaction', 'happy');

    const result = await runner.execute({
      toolId: 'request_trace_redaction',
      params: fixture.params,
      context: authorizedContext('irreversible', fixture.context),
    });

    assert.strictEqual(result.ok, true, `Expected ok=true, got error: ${result.error}`);
    assert.deepStrictEqual(result.result, fixture.expectedResponse);
    assert.ok(result.correlationId, 'Missing correlationId on success');
    assertNoRawPII(result.result);
  });
});

// ============================================================================
// C3: Golden response contracts — negative path (blocked + errorCode)
// ============================================================================

describe('C3 Golden Fixture: negative paths produce expected errorCode', () => {
  for (const toolId of ['assemble_boe_packet', 'request_trace_redaction', 'run_valuation_model']) {
    it(`${toolId} negative fixture is blocked with expectedErrorCode`, async () => {
      const { runner } = await setupRunner();
      const fixture = loadToolFixture(toolId, 'negative');

      // Negative fixtures have no context overrides → no confirmation, no reasonCode
      const result = await runner.execute({
        toolId,
        params: fixture.params,
        context: {
          countyId: 'benton',
          userId: 'golden-negative-test',
          roles: ['viewer'],
          mode: 'pilot',
        },
      });

      assert.strictEqual(result.ok, false, `Expected blocked, but tool succeeded`);
      assert.ok(result.correlationId, 'Blocked response must include correlationId');
      if (fixture.expectedErrorCode) {
        assert.ok(
          result.error.includes(fixture.expectedErrorCode),
          `Expected error to include "${fixture.expectedErrorCode}", got: ${result.error}`
        );
      }
    });
  }
});

// ============================================================================
// C3: Signature guard — ToolRunner.execute rejects positional args
// ============================================================================

describe('C3 Signature guard: ToolRunner.execute requires object arg', () => {
  // Acceptable failure codes when positional args are mis-parsed.
  // Today: TOOL_NOT_FOUND (toolId destructures as undefined).
  // Future: INVALID_INPUT if ToolRunner adds explicit input validation.
  const ACCEPTED_FAILURE_CODES = ['TOOL_NOT_FOUND', 'INVALID_INPUT', 'not found', 'undefined'];

  it('positional args must not succeed and must not reach handler', async () => {
    const { runner } = await setupRunner();
    // Positional call: execute(toolId, params, context) — wrong signature
    // ToolRunner destructures { toolId } from the first arg;
    // if first arg is a string, toolId is undefined → fails before handler
    const result = await runner.execute(
      'assemble_boe_packet',
      { county: 'benton', caseId: 'BOE-1' },
      { countyId: 'benton', userId: 'u1', roles: ['supervisor'], mode: 'pilot' }
    );
    // Primary invariant: must not succeed
    assert.strictEqual(result.ok, false, 'Positional call must never succeed');
    // Secondary: error matches known failure code set (spec guard, not behavioral guard)
    const matchesKnownCode = ACCEPTED_FAILURE_CODES.some(code => result.error.includes(code));
    assert.ok(
      matchesKnownCode,
      `Positional call failed with unexpected code: ${result.error}. ` +
      `Accepted codes: ${ACCEPTED_FAILURE_CODES.join(', ')}`
    );
  });

  it('succeeds with correct object signature', async () => {
    const { runner } = await setupRunner();
    const fixture = loadToolFixture('assemble_boe_packet', 'happy');
    const result = await runner.execute({
      toolId: 'assemble_boe_packet',
      params: fixture.params,
      context: authorizedContext('write_high', fixture.context),
    });
    assert.strictEqual(result.ok, true, `Object signature must work, got: ${result.error}`);
  });
});

// ============================================================================
// C3: Fixture completeness — every write-gate tool has golden expectedResponse
// ============================================================================

describe('C3 Fixture completeness', () => {
  const writeGateTools = ['assemble_boe_packet', 'request_trace_redaction'];

  for (const toolId of writeGateTools) {
    it(`${toolId} happy fixture has expectedResponse`, () => {
      const fixture = loadToolFixture(toolId, 'happy');
      assert.ok(fixture.expectedResponse, `${toolId}/happy.json missing expectedResponse`);
      assert.ok(typeof fixture.expectedResponse === 'object', 'expectedResponse must be an object');
    });

    it(`${toolId} negative fixture has expectedErrorCode`, () => {
      const fixture = loadToolFixture(toolId, 'negative');
      assert.ok(fixture.expectedErrorCode, `${toolId}/negative.json missing expectedErrorCode`);
      assert.ok(typeof fixture.expectedErrorCode === 'string', 'expectedErrorCode must be a string');
    });
  }
});
