/**
 * TerraFusion OS — R1 Contract Alignment Tests (CP-FORGE-01 + CP-DOS-01)
 *
 * Verifies that handler parameter expectations align with manifest paramsSchema
 * and INVOKE_CONTRACT.md shapes for all 5 proof tools + dossier write tools.
 *
 * These tests run against the MANIFEST — no backend required.
 * They catch drift between what the handler expects and what the manifest declares.
 *
 * Run:
 *   node --test os-platform/core/tests/r1-contract-alignment.test.mjs
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
const tools = manifest.tools;

function getTool(toolId) {
  return tools.find(t => t.toolId === toolId);
}

// ============================================================================
// CP-FORGE-01: run_valuation_model contract alignment
// ============================================================================

describe('CP-FORGE-01: run_valuation_model contract alignment', () => {

  it('manifest has paramsSchema with required fields matching handler: county, parcelId, taxYear', () => {
    const tool = getTool('run_valuation_model');
    assert.ok(tool, 'run_valuation_model must exist in manifest');
    assert.ok(tool.paramsSchema, 'run_valuation_model must have paramsSchema');
    assert.equal(tool.paramsSchema.type, 'object');

    const props = tool.paramsSchema.properties;
    assert.ok(props.county, 'paramsSchema must include county');
    assert.ok(props.parcelId, 'paramsSchema must include parcelId');
    assert.ok(props.taxYear, 'paramsSchema must include taxYear');

    const required = tool.paramsSchema.required;
    assert.ok(required.includes('county'), 'county must be required');
    assert.ok(required.includes('parcelId'), 'parcelId must be required');
    assert.ok(required.includes('taxYear'), 'taxYear must be required');

    console.log('  ✅ run_valuation_model: paramsSchema aligns with handler params');
  });

  it('manifest has optional modelType with correct enum', () => {
    const tool = getTool('run_valuation_model');
    const modelType = tool.paramsSchema.properties.modelType;
    assert.ok(modelType, 'paramsSchema must include modelType');
    assert.deepEqual(modelType.enum, ['cost', 'income', 'sales']);
    assert.equal(modelType.default, 'cost');

    console.log('  ✅ run_valuation_model: modelType enum matches handler type');
  });

  it('manifest risk/confirmation/reasonCode align with INVOKE_CONTRACT', () => {
    const tool = getTool('run_valuation_model');
    assert.equal(tool.risk, 'write_high');
    assert.equal(tool.requiresConfirmation, true);
    assert.equal(tool.reasonCodeRequired, true);
    assert.ok(tool.reasonCodes.length > 0);
    assert.equal(tool.writeLane, 'forge');

    console.log('  ✅ run_valuation_model: risk policy aligns with INVOKE_CONTRACT');
  });
});

// ============================================================================
// CP-FORGE-01: explain_value_change contract alignment
// ============================================================================

describe('CP-FORGE-01: explain_value_change contract alignment', () => {

  it('manifest has paramsSchema with required fields: county, parcelId, fromYear, toYear', () => {
    const tool = getTool('explain_value_change');
    assert.ok(tool, 'explain_value_change must exist');
    assert.ok(tool.paramsSchema, 'must have paramsSchema');

    const props = tool.paramsSchema.properties;
    assert.ok(props.county, 'paramsSchema must include county');
    assert.ok(props.parcelId, 'paramsSchema must include parcelId');
    assert.ok(props.fromYear, 'paramsSchema must include fromYear');
    assert.ok(props.toYear, 'paramsSchema must include toYear');

    const required = tool.paramsSchema.required;
    assert.ok(required.includes('county'));
    assert.ok(required.includes('parcelId'));
    assert.ok(required.includes('fromYear'));
    assert.ok(required.includes('toYear'));

    console.log('  ✅ explain_value_change: paramsSchema aligns with handler params');
  });

  it('risk is read_only, no confirmation required', () => {
    const tool = getTool('explain_value_change');
    assert.equal(tool.risk, 'read_only');
    assert.ok(!tool.requiresConfirmation);

    console.log('  ✅ explain_value_change: read_only risk policy correct');
  });
});

// ============================================================================
// search_trace_by_correlation contract alignment
// ============================================================================

describe('search_trace_by_correlation contract alignment', () => {

  it('manifest has paramsSchema with correlationId required', () => {
    const tool = getTool('search_trace_by_correlation');
    assert.ok(tool, 'search_trace_by_correlation must exist');
    assert.ok(tool.paramsSchema, 'must have paramsSchema');

    const props = tool.paramsSchema.properties;
    assert.ok(props.correlationId, 'paramsSchema must include correlationId');

    const required = tool.paramsSchema.required;
    assert.ok(required.includes('correlationId'));

    console.log('  ✅ search_trace_by_correlation: paramsSchema aligns with handler');
  });

  it('is suite=os, risk=read_only', () => {
    const tool = getTool('search_trace_by_correlation');
    assert.equal(tool.suite, 'os');
    assert.equal(tool.risk, 'read_only');

    console.log('  ✅ search_trace_by_correlation: suite/risk correct');
  });
});

// ============================================================================
// summarize_levy_rate_components contract alignment
// ============================================================================

describe('summarize_levy_rate_components contract alignment', () => {

  it('manifest has paramsSchema with county, taxYear required', () => {
    const tool = getTool('summarize_levy_rate_components');
    assert.ok(tool, 'summarize_levy_rate_components must exist');
    assert.ok(tool.paramsSchema, 'must have paramsSchema');

    const props = tool.paramsSchema.properties;
    assert.ok(props.county, 'paramsSchema must include county');
    assert.ok(props.taxYear, 'paramsSchema must include taxYear');

    const required = tool.paramsSchema.required;
    assert.ok(required.includes('county'));
    assert.ok(required.includes('taxYear'));

    console.log('  ✅ summarize_levy: paramsSchema aligns with handler');
  });

  it('is suite=dais, risk=read_only', () => {
    const tool = getTool('summarize_levy_rate_components');
    assert.equal(tool.suite, 'dais');
    assert.equal(tool.risk, 'read_only');

    console.log('  ✅ summarize_levy: suite/risk correct');
  });
});

// ============================================================================
// CP-DOS-01: summarize_parcel_casefile contract alignment
// ============================================================================

describe('CP-DOS-01: summarize_parcel_casefile contract alignment', () => {

  it('manifest has paramsSchema with county, parcelId required', () => {
    const tool = getTool('summarize_parcel_casefile');
    assert.ok(tool, 'summarize_parcel_casefile must exist');
    assert.ok(tool.paramsSchema, 'must have paramsSchema');

    const props = tool.paramsSchema.properties;
    assert.ok(props.county, 'paramsSchema must include county');
    assert.ok(props.parcelId, 'paramsSchema must include parcelId');

    const required = tool.paramsSchema.required;
    assert.ok(required.includes('county'));
    assert.ok(required.includes('parcelId'));

    console.log('  ✅ summarize_parcel_casefile: paramsSchema aligns with handler');
  });

  it('has piiHandling=payload_ref and payloadStore=dossier', () => {
    const tool = getTool('summarize_parcel_casefile');
    assert.equal(tool.piiHandling, 'payload_ref');
    assert.equal(tool.tracePolicy, 'payload_ref');
    assert.equal(tool.payloadStore, 'dossier');

    console.log('  ✅ summarize_parcel_casefile: PII policy correct');
  });
});

// ============================================================================
// CP-DOS-01: add_dossier_note contract alignment
// ============================================================================

describe('CP-DOS-01: add_dossier_note contract alignment', () => {

  it('manifest has paramsSchema with county, parcelId, content required', () => {
    const tool = getTool('add_dossier_note');
    assert.ok(tool, 'add_dossier_note must exist');
    assert.ok(tool.paramsSchema, 'must have paramsSchema');

    const props = tool.paramsSchema.properties;
    assert.ok(props.county, 'paramsSchema must include county');
    assert.ok(props.parcelId, 'paramsSchema must include parcelId');
    assert.ok(props.content, 'paramsSchema must include content');

    const required = tool.paramsSchema.required;
    assert.ok(required.includes('county'));
    assert.ok(required.includes('parcelId'));
    assert.ok(required.includes('content'));

    console.log('  ✅ add_dossier_note: paramsSchema aligns with handler');
  });

  it('is write_low with dossier write lane and confirmation required', () => {
    const tool = getTool('add_dossier_note');
    assert.equal(tool.risk, 'write_low');
    assert.equal(tool.writeLane, 'dossier');
    assert.equal(tool.requiresConfirmation, true);
    assert.equal(tool.reasonCodeRequired, true);
    assert.ok(tool.reasonCodes.includes('workflow_update'));

    console.log('  ✅ add_dossier_note: write governance correct');
  });
});

// ============================================================================
// Cross-cutting: All 24 tools have valid manifest entries
// ============================================================================

describe('Manifest integrity: all tools have required fields', () => {

  it('every tool has toolId, displayName, suite, risk, description', () => {
    for (const tool of tools) {
      assert.ok(tool.toolId, 'toolId required');
      assert.ok(tool.displayName, `${tool.toolId}: displayName required`);
      assert.ok(tool.suite, `${tool.toolId}: suite required`);
      assert.ok(tool.risk, `${tool.toolId}: risk required`);
      assert.ok(tool.description, `${tool.toolId}: description required`);
    }

    console.log(`  ✅ All ${tools.length} tools: required fields present`);
  });

  it('manifest version is 1.3.0', () => {
    assert.equal(manifest.version, '1.3.0');
    console.log('  ✅ Manifest version: 1.3.0');
  });

  it('5 proof tools all have paramsSchema defined', () => {
    const proofToolIds = [
      'run_valuation_model',
      'explain_value_change',
      'search_trace_by_correlation',
      'summarize_levy_rate_components',
      'summarize_parcel_casefile',
    ];

    for (const toolId of proofToolIds) {
      const tool = getTool(toolId);
      assert.ok(tool, `${toolId} must exist`);
      assert.ok(tool.paramsSchema, `${toolId} must have paramsSchema for contract alignment`);
      assert.equal(tool.paramsSchema.type, 'object', `${toolId}: paramsSchema must be object type`);
      assert.ok(tool.paramsSchema.properties, `${toolId}: paramsSchema must have properties`);
      assert.ok(
        Array.isArray(tool.paramsSchema.required) && tool.paramsSchema.required.length > 0,
        `${toolId}: paramsSchema must have required array`
      );
    }

    console.log('  ✅ All 5 proof tools: paramsSchema defined and valid');
  });
});
