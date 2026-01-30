/**
 * TerraFusion OS - Phase 8.5 Tool Integration Tests
 */

import assert from 'node:assert';
import { resolve } from 'node:path';
import { before, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { assertNoRawPII, assertTracePair } from './_helpers/tracePii.mjs';
import { loadToolFixture } from './fixtureLoader.mjs';

let ToolRegistry;
let ToolRunner;
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

const YAKIMA_MUSE = {
  countyId: 'yakima',
  userId: 'appraiser-002',
  roles: ['appraiser'],
  mode: 'muse',
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

function assertFixture(result, fixture) {
  if (fixture.assert?.rejects) {
    assert.strictEqual(result.ok, false);
    return;
  }

  assert.strictEqual(result.ok, true);
  const resultKeys = fixture.assert?.resultKeys ?? [];
  for (const key of resultKeys) {
    assert.ok(key in result.result, `Missing result key: ${key}`);
  }
  if (fixture.assert?.noPii) {
    assertNoRawPII(result.result);
  }
}

describe('Phase 8.5 Tools - Muse read_only', () => {
  it('explain_senior_exemption_impact returns summary and trace', async () => {
    const { runner, traceService } = await setupRunner();
    const fx = loadToolFixture('explain_senior_exemption_impact', 'happy');
    const result = await runner.execute({
      toolId: 'explain_senior_exemption_impact',
      params: fx.params,
      context: BENTON_MUSE,
    });

    assertFixture(result, fx);
    assertTracePair(traceService, 'explain_senior_exemption_impact');
  });

  it('explain_senior_exemption_impact rejects county mismatch', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('explain_senior_exemption_impact', 'negative');
    const result = await runner.execute({
      toolId: 'explain_senior_exemption_impact',
      params: fx.params,
      context: BENTON_MUSE,
    });
    assertFixture(result, fx);
  });

  it('summarize_parcel_casefile returns payloadRef and no PII', async () => {
    const { runner, traceService } = await setupRunner();
    const fx = loadToolFixture('summarize_parcel_casefile', 'happy');
    const result = await runner.execute({
      toolId: 'summarize_parcel_casefile',
      params: fx.params,
      context: BENTON_MUSE,
    });

    assertFixture(result, fx);
    assertTracePair(traceService, 'summarize_parcel_casefile');
  });

  it('summarize_parcel_casefile rejects county mismatch', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('summarize_parcel_casefile', 'negative');
    const result = await runner.execute({
      toolId: 'summarize_parcel_casefile',
      params: fx.params,
      context: BENTON_MUSE,
    });
    assertFixture(result, fx);
  });

  it('compare_assessed_value_history returns sorted trend', async () => {
    const { runner, traceService } = await setupRunner();
    const fx = loadToolFixture('compare_assessed_value_history', 'happy');
    const result = await runner.execute({
      toolId: 'compare_assessed_value_history',
      params: fx.params,
      context: BENTON_MUSE,
    });

    assertFixture(result, fx);
    const years = result.result.trend.map(t => t.year);
    assert.deepStrictEqual(years, [2022, 2023, 2024]);
    assertTracePair(traceService, 'compare_assessed_value_history');
  });

  it('compare_assessed_value_history rejects county mismatch', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('compare_assessed_value_history', 'negative');
    const result = await runner.execute({
      toolId: 'compare_assessed_value_history',
      params: fx.params,
      context: BENTON_MUSE,
    });
    assertFixture(result, fx);
  });

  it('summarize_levy_rate_components returns sorted components and total', async () => {
    const { runner, traceService } = await setupRunner();
    const fx = loadToolFixture('summarize_levy_rate_components', 'happy');
    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: fx.params,
      context: BENTON_MUSE,
    });

    assertFixture(result, fx);
    const rates = result.result.components.map(c => c.rate);
    const sorted = [...rates].sort((a, b) => b - a);
    assert.deepStrictEqual(rates, sorted);
    const sum = rates.reduce((a, b) => a + b, 0);
    assert.strictEqual(result.result.totalRate, Math.round(sum * 100) / 100);
    assertTracePair(traceService, 'summarize_levy_rate_components');
  });

  it('summarize_levy_rate_components rejects county mismatch', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('summarize_levy_rate_components', 'negative');
    const result = await runner.execute({
      toolId: 'summarize_levy_rate_components',
      params: fx.params,
      context: BENTON_MUSE,
    });
    assertFixture(result, fx);
  });

  it('explain_model_inputs returns sorted inputs without raw values', async () => {
    const { runner, traceService } = await setupRunner();
    const fx = loadToolFixture('explain_model_inputs', 'happy');
    const result = await runner.execute({
      toolId: 'explain_model_inputs',
      params: fx.params,
      context: BENTON_MUSE,
    });

    assertFixture(result, fx);
    const names = result.result.inputs.map(i => i.name);
    const sorted = [...names].sort();
    assert.deepStrictEqual(names, sorted);
    assertTracePair(traceService, 'explain_model_inputs');
  });

  it('explain_model_inputs rejects county mismatch', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('explain_model_inputs', 'negative');
    const result = await runner.execute({
      toolId: 'explain_model_inputs',
      params: fx.params,
      context: BENTON_MUSE,
    });
    assertFixture(result, fx);
  });

  it('summarize_sales_comps_rationale returns comps sorted by similarity', async () => {
    const { runner, traceService } = await setupRunner();
    const fx = loadToolFixture('summarize_sales_comps_rationale', 'happy');
    const result = await runner.execute({
      toolId: 'summarize_sales_comps_rationale',
      params: fx.params,
      context: BENTON_MUSE,
    });

    assertFixture(result, fx);
    const sims = result.result.comps.map(c => c.similarity);
    const sorted = [...sims].sort((a, b) => b - a);
    assert.deepStrictEqual(sims, sorted);
    assertTracePair(traceService, 'summarize_sales_comps_rationale');
  });

  it('summarize_sales_comps_rationale rejects county mismatch', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('summarize_sales_comps_rationale', 'negative');
    const result = await runner.execute({
      toolId: 'summarize_sales_comps_rationale',
      params: fx.params,
      context: BENTON_MUSE,
    });
    assertFixture(result, fx);
  });
});

describe('Phase 8.5 Tools - Muse write_low', () => {
  it('draft_value_change_notice returns required sections and payloadRef', async () => {
    const { runner, traceService } = await setupRunner();
    const fx = loadToolFixture('draft_value_change_notice', 'happy');
    const result = await runner.execute({
      toolId: 'draft_value_change_notice',
      params: fx.params,
      context: BENTON_MUSE,
    });

    assertFixture(result, fx);
    assert.ok(result.result.document.body.includes('Reason:'));
    assert.ok(result.result.document.body.includes('Appeal Rights:'));
    assert.ok(result.result.document.body.includes('Dates:'));
    assertTracePair(traceService, 'draft_value_change_notice');
  });

  it('draft_value_change_notice rejects county mismatch', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('draft_value_change_notice', 'negative');
    const result = await runner.execute({
      toolId: 'draft_value_change_notice',
      params: fx.params,
      context: BENTON_MUSE,
    });
    assertFixture(result, fx);
  });

  it('draft_boe_appeal_response respects position and payloadRef', async () => {
    const { runner, traceService } = await setupRunner();
    const fx = loadToolFixture('draft_boe_appeal_response', 'happy');
    const result = await runner.execute({
      toolId: 'draft_boe_appeal_response',
      params: fx.params,
      context: BENTON_MUSE,
    });

    assertFixture(result, fx);
    assert.ok(result.result.document.body.includes('support assessor'));
    assertTracePair(traceService, 'draft_boe_appeal_response');
  });

  it('draft_boe_appeal_response rejects county mismatch', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('draft_boe_appeal_response', 'negative');
    const result = await runner.execute({
      toolId: 'draft_boe_appeal_response',
      params: fx.params,
      context: BENTON_MUSE,
    });
    assertFixture(result, fx);
  });
});

describe('Phase 8.5 Tools - Pilot', () => {
  it('search_trace_by_correlation returns limited metadata only', async () => {
    const { runner, traceService } = await setupRunner();
    const fx = loadToolFixture('search_trace_by_correlation', 'happy');
    const result = await runner.execute({
      toolId: 'search_trace_by_correlation',
      params: fx.params,
      context: BENTON_PILOT,
    });

    assertFixture(result, fx);
    assert.strictEqual(result.result.events.length, Math.min(fx.params.limit ?? 100, 2));
    assert.ok(result.result.events[0].ts);
    assertTracePair(traceService, 'search_trace_by_correlation');
  });

  it('search_trace_by_correlation rejects county mismatch', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('search_trace_by_correlation', 'negative');
    const result = await runner.execute({
      toolId: 'search_trace_by_correlation',
      params: fx.params,
      context: BENTON_PILOT,
    });
    assertFixture(result, fx);
  });

  it('add_dossier_note appends and sanitizes', async () => {
    const { runner, traceService } = await setupRunner();
    const fx = loadToolFixture('add_dossier_note', 'happy');
    const result = await runner.execute({
      toolId: 'add_dossier_note',
      params: fx.params,
      context: BENTON_PILOT,
    });

    assertFixture(result, fx);
    assertTracePair(traceService, 'add_dossier_note');
  });

  it('add_dossier_note rejects overwrite attempts', async () => {
    const { runner } = await setupRunner();
    const fx = loadToolFixture('add_dossier_note', 'negative');
    const result = await runner.execute({
      toolId: 'add_dossier_note',
      params: fx.params,
      context: BENTON_PILOT,
    });
    assertFixture(result, fx);
  });
});
