/**
 * TerraFusion OS - R1 Write Governance Contract Tests (C2)
 *
 * Contract:
 * - Every non-read_only tool requires confirmation and reasonCode policy metadata.
 * - Write tool invocation is blocked unless confirmation + valid reasonCode are supplied.
 *
 * Run:
 *   node --test os-platform/core/tests/r1-write-governance.contract.test.mjs
 */

import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

let ToolRegistry;
let ToolRunner;
let registerPhase83Handlers;

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');

const BASE_MUSE_CONTEXT = {
  countyId: 'benton',
  userId: 'governance-contract-test',
  roles: ['supervisor'],
  mode: 'muse',
};

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;
  ToolRegistry = pilot.ToolRegistry;
  ToolRunner = pilot.ToolRunner;
  registerPhase83Handlers = pilot.registerPhase83Handlers;
});

describe('R1 C2 Write Governance Manifest Contract', () => {
  it('all non-read_only tools require confirmation + reason code metadata', async () => {
    const registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);

    const writeTools = registry.listTools().filter(tool => tool.risk !== 'read_only');
    assert.ok(writeTools.length > 0, 'expected at least one write tool');

    for (const tool of writeTools) {
      assert.strictEqual(
        tool.requiresConfirmation,
        true,
        `${tool.toolId} must set requiresConfirmation: true`
      );
      assert.strictEqual(
        tool.reasonCodeRequired,
        true,
        `${tool.toolId} must set reasonCodeRequired: true`
      );
      assert.ok(
        Array.isArray(tool.reasonCodes) && tool.reasonCodes.length > 0,
        `${tool.toolId} must provide reasonCodes[]`
      );
    }
  });
});

describe('R1 C2 Write Governance Runtime Contract', () => {
  async function createRunner() {
    const registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);
    const runner = new ToolRunner({ registry });
    registerPhase83Handlers(runner);
    return runner;
  }

  it('write_low blocks when confirmation is missing', async () => {
    const runner = await createRunner();
    const result = await runner.execute({
      toolId: 'draft_appeal_response',
      params: { county: 'benton', parcelId: 'P-001', appealId: 'A-001' },
      context: {
        ...BASE_MUSE_CONTEXT,
        confirmation: false,
      },
    });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorCode, 'CONFIRMATION_REQUIRED');
    assert.ok(result.correlationId);
  });

  it('write_low blocks when reasonCode is missing', async () => {
    const runner = await createRunner();
    const result = await runner.execute({
      toolId: 'draft_appeal_response',
      params: { county: 'benton', parcelId: 'P-001', appealId: 'A-002' },
      context: {
        ...BASE_MUSE_CONTEXT,
        confirmation: true,
      },
    });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorCode, 'REASON_CODE_REQUIRED');
    assert.ok(result.correlationId);
  });

  it('write_low blocks when reasonCode is invalid', async () => {
    const runner = await createRunner();
    const result = await runner.execute({
      toolId: 'draft_appeal_response',
      params: { county: 'benton', parcelId: 'P-001', appealId: 'A-003' },
      context: {
        ...BASE_MUSE_CONTEXT,
        confirmation: true,
        reasonCode: 'invalid_reason_code',
      },
    });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorCode, 'REASON_CODE_INVALID');
    assert.ok(result.correlationId);
  });

  it('write_low allows execution with confirmation + valid reasonCode', async () => {
    const runner = await createRunner();
    const result = await runner.execute({
      toolId: 'draft_appeal_response',
      params: { county: 'benton', parcelId: 'P-001', appealId: 'A-004' },
      context: {
        ...BASE_MUSE_CONTEXT,
        confirmation: true,
        reasonCode: 'appeal_response',
      },
    });

    assert.strictEqual(result.ok, true);
    assert.ok(result.correlationId);
  });
});
