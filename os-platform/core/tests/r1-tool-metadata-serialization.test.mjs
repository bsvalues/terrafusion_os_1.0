/**
 * TerraFusion OS — R1 Tool Metadata Serialization Tests (CP-FORGE-03)
 *
 * Verifies that GET /pilot/tools response includes all governance fields:
 *   - risk, requiresConfirmation, reasonCodeRequired, reasonCodes
 *
 * This ensures the UI receives the metadata it needs to enforce
 * confirmation + reason-code gates for write_high tools.
 *
 * Run:
 *   node --test os-platform/core/tests/r1-tool-metadata-serialization.test.mjs
 */

import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

let ToolRegistry;

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;
  ToolRegistry = pilot.ToolRegistry;
});

/**
 * Simulate the exact serialization from GET /pilot/tools in PilotController.ts.
 * This mirrors the tools.map() callback to catch drift between the controller
 * and the manifest.
 */
function serializeToolForResponse(t) {
  return {
    toolId: t.toolId,
    displayName: t.displayName,
    suite: t.suite,
    mode: t.mode,
    risk: t.risk,
    description: t.description,
    requiresConfirmation: t.requiresConfirmation,
    reasonCodeRequired: t.reasonCodeRequired,
    reasonCodes: t.reasonCodes,
  };
}

describe('CP-FORGE-03: Tool metadata serialization for UI', () => {

  it('run_valuation_model exposes risk=write_high + requiresConfirmation + reasonCodeRequired', async () => {
    const registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);

    const tool = registry.getTool('run_valuation_model');
    assert.ok(tool, 'run_valuation_model must exist in registry');

    const serialized = serializeToolForResponse(tool);

    assert.equal(serialized.risk, 'write_high', 'risk must be write_high');
    assert.equal(serialized.requiresConfirmation, true, 'requiresConfirmation must be true');
    assert.equal(serialized.reasonCodeRequired, true, 'reasonCodeRequired must be true');
    assert.ok(
      Array.isArray(serialized.reasonCodes) && serialized.reasonCodes.length > 0,
      'reasonCodes must be a non-empty array'
    );
    assert.ok(
      serialized.reasonCodes.includes('annual_certification'),
      'reasonCodes must include annual_certification'
    );

    console.log('  ✅ run_valuation_model: governance metadata exposed correctly');
  });

  it('add_dossier_note exposes risk=write_low + requiresConfirmation + reasonCodeRequired', async () => {
    const registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);

    const tool = registry.getTool('add_dossier_note');
    assert.ok(tool, 'add_dossier_note must exist in registry');

    const serialized = serializeToolForResponse(tool);

    assert.equal(serialized.risk, 'write_low', 'risk must be write_low');
    assert.equal(serialized.requiresConfirmation, true, 'requiresConfirmation must be true');
    assert.equal(serialized.reasonCodeRequired, true, 'reasonCodeRequired must be true');
    assert.ok(
      Array.isArray(serialized.reasonCodes) && serialized.reasonCodes.length > 0,
      'reasonCodes must be a non-empty array'
    );

    console.log('  ✅ add_dossier_note: governance metadata exposed correctly');
  });

  it('read_only tools DO NOT require confirmation or reason codes', async () => {
    const registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);

    const readOnlyTools = registry.listTools().filter(t => t.risk === 'read_only');
    assert.ok(readOnlyTools.length > 0, 'Expected at least one read_only tool');

    for (const tool of readOnlyTools) {
      const serialized = serializeToolForResponse(tool);
      // read_only tools should NOT require confirmation
      assert.ok(
        !serialized.requiresConfirmation,
        `${tool.toolId}: read_only tool should not require confirmation`
      );
    }

    console.log(`  ✅ ${readOnlyTools.length} read_only tools: no confirmation required`);
  });

  it('every non-read_only tool exposes reasonCodeRequired in serialized form', async () => {
    const registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);

    const writeTools = registry.listTools().filter(t => t.risk !== 'read_only');
    assert.ok(writeTools.length > 0, 'Expected at least one write tool');

    for (const tool of writeTools) {
      const serialized = serializeToolForResponse(tool);
      assert.equal(
        serialized.reasonCodeRequired, true,
        `${tool.toolId}: write tool must expose reasonCodeRequired: true`
      );
      assert.ok(
        serialized.reasonCodes !== undefined,
        `${tool.toolId}: write tool must expose reasonCodes`
      );
    }

    console.log(`  ✅ ${writeTools.length} write tools: reasonCodeRequired serialized`);
  });

  it('all 5 proof tools are present with correct suite assignments', async () => {
    const registry = new ToolRegistry();
    await registry.initialize(MANIFEST_PATH);

    const proofTools = [
      { toolId: 'run_valuation_model', expectedSuite: 'forge', expectedRisk: 'write_high' },
      { toolId: 'explain_value_change', expectedSuite: 'forge', expectedRisk: 'read_only' },
      { toolId: 'search_trace_by_correlation', expectedSuite: 'os', expectedRisk: 'read_only' },
      { toolId: 'summarize_levy_rate_components', expectedSuite: 'dais', expectedRisk: 'read_only' },
      { toolId: 'summarize_parcel_casefile', expectedSuite: 'dossier', expectedRisk: 'read_only' },
    ];

    for (const { toolId, expectedSuite, expectedRisk } of proofTools) {
      const tool = registry.getTool(toolId);
      assert.ok(tool, `${toolId} must exist in manifest`);
      const serialized = serializeToolForResponse(tool);
      assert.equal(serialized.suite, expectedSuite, `${toolId}: suite must be ${expectedSuite}`);
      assert.equal(serialized.risk, expectedRisk, `${toolId}: risk must be ${expectedRisk}`);
    }

    console.log('  ✅ All 5 proof tools: present with correct suite/risk');
  });
});
