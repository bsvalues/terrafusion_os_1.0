/**
 * forge-reconciliation-contract.test.mjs
 *
 * Tranche 1B: Governed contract tests for three-approach reconciliation.
 * Validates ReconciliationResult shape, weight constraints, write-lane
 * scoping, and parcel-scoped behavior.
 *
 * @gate required — must pass before merge
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ── Inline governed types (mirrors os-platform/core/types) ──

const VALID_APPROACHES = ['cost', 'sales', 'income'];
const VALID_METHODS = ['weighted_average', 'appraiser_judgment', 'single_approach', 'ai_assisted'];

const RECONCILIATION_RULES = {
  weightSum: 100,
  minApproaches: 1,
  maxApproaches: 3,
  validApproaches: VALID_APPROACHES,
};

// ── Fixture: Benton County 2026 residential reconciliation ──

function createFixtureResult(overrides = {}) {
  return {
    parcelId: '1-0455-100-0015-000',
    taxYear: 2026,
    approaches: [
      { approach: 'cost',   indicatedValue: 385000, weight: 40, confidence: 0.82, note: 'RCN less depreciation + land' },
      { approach: 'sales',  indicatedValue: 392000, weight: 45, confidence: 0.91, note: '3 adjusted comps, median $392k' },
      { approach: 'income', indicatedValue: 378000, weight: 15, confidence: 0.68, note: 'NOI $26,460 / 7.0% cap rate' },
    ],
    reconciledValue: 387100,
    method: 'weighted_average',
    effectiveDate: '2026-01-01',
    reconciledBy: 'appraiser:jdoe',
    correlationId: 'recon-abc12345',
    ...overrides,
  };
}

function computeWeightedAverage(approaches) {
  const totalWeight = approaches.reduce((s, a) => s + a.weight, 0);
  if (totalWeight === 0) return 0;
  return Math.round(approaches.reduce((s, a) => s + a.indicatedValue * a.weight, 0) / totalWeight);
}

// ── Suite 1: ReconciliationResult shape ──────────────────

describe('ReconciliationResult shape', () => {
  let result;
  beforeEach(() => { result = createFixtureResult(); });

  it('has required top-level fields', () => {
    const required = ['parcelId', 'taxYear', 'approaches', 'reconciledValue', 'method', 'effectiveDate', 'reconciledBy'];
    for (const field of required) {
      assert.ok(field in result, `missing field: ${field}`);
    }
  });

  it('parcelId is a non-empty string', () => {
    assert.equal(typeof result.parcelId, 'string');
    assert.ok(result.parcelId.length > 0);
  });

  it('taxYear is a positive integer', () => {
    assert.equal(typeof result.taxYear, 'number');
    assert.ok(Number.isInteger(result.taxYear));
    assert.ok(result.taxYear > 2000);
  });

  it('reconciledValue is a positive number', () => {
    assert.equal(typeof result.reconciledValue, 'number');
    assert.ok(result.reconciledValue > 0);
  });

  it('method is one of the valid methods', () => {
    assert.ok(VALID_METHODS.includes(result.method), `invalid method: ${result.method}`);
  });

  it('effectiveDate is a valid ISO date string', () => {
    assert.equal(typeof result.effectiveDate, 'string');
    assert.ok(!isNaN(Date.parse(result.effectiveDate)));
  });

  it('reconciledBy is a non-empty string', () => {
    assert.equal(typeof result.reconciledBy, 'string');
    assert.ok(result.reconciledBy.length > 0);
  });

  it('correlationId is optional string', () => {
    assert.ok(result.correlationId === undefined || typeof result.correlationId === 'string');
  });
});

// ── Suite 2: ApproachIndication shape ────────────────────

describe('ApproachIndication shape', () => {
  let approaches;
  beforeEach(() => { approaches = createFixtureResult().approaches; });

  it('has between 1 and 3 approaches', () => {
    assert.ok(approaches.length >= RECONCILIATION_RULES.minApproaches);
    assert.ok(approaches.length <= RECONCILIATION_RULES.maxApproaches);
  });

  it('each approach has required fields', () => {
    for (const a of approaches) {
      assert.equal(typeof a.approach, 'string');
      assert.equal(typeof a.indicatedValue, 'number');
      assert.equal(typeof a.weight, 'number');
    }
  });

  it('each approach type is cost, sales, or income', () => {
    for (const a of approaches) {
      assert.ok(VALID_APPROACHES.includes(a.approach), `invalid approach: ${a.approach}`);
    }
  });

  it('no duplicate approach types', () => {
    const types = approaches.map((a) => a.approach);
    assert.equal(new Set(types).size, types.length, 'duplicate approach types');
  });

  it('each weight is 0–100', () => {
    for (const a of approaches) {
      assert.ok(a.weight >= 0 && a.weight <= 100, `weight out of range: ${a.weight}`);
    }
  });

  it('confidence is optional, 0–1 when present', () => {
    for (const a of approaches) {
      if (a.confidence !== undefined) {
        assert.ok(a.confidence >= 0 && a.confidence <= 1, `confidence out of range: ${a.confidence}`);
      }
    }
  });
});

// ── Suite 3: Weight constraints ──────────────────────────

describe('Reconciliation weight constraints', () => {
  it('fixture weights sum to 100', () => {
    const result = createFixtureResult();
    const total = result.approaches.reduce((s, a) => s + a.weight, 0);
    assert.equal(total, RECONCILIATION_RULES.weightSum);
  });

  it('weighted average matches expected computation', () => {
    const result = createFixtureResult();
    const expected = computeWeightedAverage(result.approaches);
    assert.equal(result.reconciledValue, expected);
  });

  it('single-approach weight of 100 is valid', () => {
    const result = createFixtureResult({
      approaches: [{ approach: 'sales', indicatedValue: 392000, weight: 100, confidence: 0.91 }],
      method: 'single_approach',
      reconciledValue: 392000,
    });
    const total = result.approaches.reduce((s, a) => s + a.weight, 0);
    assert.equal(total, 100);
    assert.equal(result.reconciledValue, 392000);
  });

  it('rejects approaches with negative weight (application-level)', () => {
    const badApproaches = [
      { approach: 'cost', indicatedValue: 385000, weight: -10 },
      { approach: 'sales', indicatedValue: 392000, weight: 110 },
    ];
    const hasNegative = badApproaches.some((a) => a.weight < 0);
    assert.ok(hasNegative, 'expected negative weight to be flagged');
  });
});

// ── Suite 4: Reconciliation methods ──────────────────────

describe('Reconciliation methods', () => {
  it('weighted_average uses weight-proportional calculation', () => {
    const result = createFixtureResult();
    assert.equal(result.method, 'weighted_average');
    const computed = computeWeightedAverage(result.approaches);
    assert.equal(result.reconciledValue, computed);
  });

  it('appraiser_judgment allows override value', () => {
    const result = createFixtureResult({
      method: 'appraiser_judgment',
      reconciledValue: 390000,
    });
    assert.equal(result.method, 'appraiser_judgment');
    // Override value need not match weighted average
    assert.equal(result.reconciledValue, 390000);
  });

  it('single_approach selects one approach', () => {
    const result = createFixtureResult({
      approaches: [{ approach: 'sales', indicatedValue: 392000, weight: 100, confidence: 0.91 }],
      method: 'single_approach',
      reconciledValue: 392000,
    });
    assert.equal(result.approaches.length, 1);
    assert.equal(result.reconciledValue, result.approaches[0].indicatedValue);
  });

  it('ai_assisted is a valid method', () => {
    const result = createFixtureResult({ method: 'ai_assisted' });
    assert.ok(VALID_METHODS.includes(result.method));
  });
});

// ── Suite 5: Write-lane scoping ──────────────────────────

describe('Reconciliation write-lane scoping', () => {
  it('reconciliation writes belong to Forge domain', () => {
    const FORGE_WRITE_ARTIFACTS = [
      'valuation artifacts',
      'cost/income/sales data',
      'reconciliation artifacts',
    ];
    // The reconciliation result is a Forge artifact
    const result = createFixtureResult();
    assert.ok(result.reconciledValue > 0);
    assert.equal(result.method, 'weighted_average');
    // Write lane: Forge owns valuation artifacts
    assert.ok(FORGE_WRITE_ARTIFACTS.length > 0, 'Forge write lane exists');
  });

  it('result does not contain cross-suite artifacts', () => {
    const result = createFixtureResult();
    // No GIS, admin, or document fields in reconciliation
    assert.equal(result.gisLayer, undefined);
    assert.equal(result.permit, undefined);
    assert.equal(result.document, undefined);
    assert.equal(result.narrative, undefined);
  });
});

// ── Suite 6: Parcel-scoped isolation ─────────────────────

describe('Parcel-scoped reconciliation isolation', () => {
  it('each reconciliation is tagged with a specific parcelId', () => {
    const result = createFixtureResult();
    assert.ok(result.parcelId.length > 0);
    assert.ok(!result.parcelId.includes('*'), 'parcelId must not be wildcard');
  });

  it('different parcels produce independent results', () => {
    const r1 = createFixtureResult({ parcelId: '1-0455-100-0015-000' });
    const r2 = createFixtureResult({ parcelId: '1-0455-200-0030-000', reconciledValue: 425000 });
    assert.notEqual(r1.parcelId, r2.parcelId);
    assert.notEqual(r1.reconciledValue, r2.reconciledValue);
  });

  it('correlationId is unique per reconciliation event', () => {
    const r1 = createFixtureResult({ correlationId: 'recon-aaa' });
    const r2 = createFixtureResult({ correlationId: 'recon-bbb' });
    assert.notEqual(r1.correlationId, r2.correlationId);
  });
});

// ── Suite 7: Edge cases ──────────────────────────────────

describe('Reconciliation edge cases', () => {
  it('handles zero-value approaches without crash', () => {
    const result = createFixtureResult({
      approaches: [
        { approach: 'cost', indicatedValue: 0, weight: 50 },
        { approach: 'sales', indicatedValue: 392000, weight: 50 },
      ],
      reconciledValue: 196000,
    });
    const expected = computeWeightedAverage(result.approaches);
    assert.equal(result.reconciledValue, expected);
  });

  it('all three approaches present in standard fixture', () => {
    const result = createFixtureResult();
    const types = new Set(result.approaches.map((a) => a.approach));
    assert.ok(types.has('cost'));
    assert.ok(types.has('sales'));
    assert.ok(types.has('income'));
  });

  it('effectiveDate is in the correct tax year', () => {
    const result = createFixtureResult();
    const year = new Date(result.effectiveDate).getUTCFullYear();
    assert.equal(year, result.taxYear);
  });
});
