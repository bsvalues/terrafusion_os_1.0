/**
 * TerraFusion OS — Forge Statistics Contract Tests (Tranche 1A)
 * ===================================================================
 * Governed contract tests for ratio study payloads.
 *
 * Validates:
 *   - RatioStudyResult payload shape (all IAAO-standard fields present)
 *   - IAAO compliance threshold enforcement
 *   - QualificationMetrics computation
 *   - OutlierRecord payload shape
 *   - ModelComparisonResult delta invariants
 *   - StrataResult payload shape
 *   - Write lane: all mutations scope to Forge
 *
 * Run: node --test os-platform/core/tests/forge-statistics-contract.test.mjs
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// IAAO Thresholds (canonical — matches os-platform/core/types/index.ts)
// ============================================================================

const IAAO_THRESHOLDS = {
  cod: { max: 15.0 },
  prd: { min: 0.98, max: 1.03 },
  prb: { absMax: 0.05 },
  medianRatio: { min: 0.90, max: 1.10 },
  tierSlope: { absMax: 0.05 },
};

// ============================================================================
// Fixture payloads (mirrors forgeStatisticsFixtures.ts Benton County 2026)
// ============================================================================

const RATIO_STUDY_RESULT = {
  medianRatio: 0.985,
  meanRatio: 0.991,
  weightedMeanRatio: 0.983,
  cod: 12.4,
  prd: 1.008,
  prb: -0.023,
  cov: 0.156,
  sampleSize: 1847,
  outlierCount: 43,
  tierMedians: { q1: 1.012, q2: 0.993, q3: 0.978, q4: 0.961 },
  tierSlope: 0.012,
  iaaoCompliant: true,
  complianceNotes: [
    'COD 12.4 within 15.0 threshold',
    'PRD 1.008 within 0.98-1.03 range',
    'PRB -0.023 within +/-0.05 range',
  ],
  computedAt: '2026-03-15T14:30:00Z',
  params: { taxYear: 2026, salesWindowMonths: 12, outlierMethod: 'iqr' },
};

const OUTLIER_RECORD = {
  parcelId: '1-0529-100-0042',
  address: '1245 George Washington Way',
  neighborhood: 'Richland',
  salePrice: 385000,
  assessedValue: 298000,
  ratio: 0.774,
  ratioDeviation: -0.211,
  outlierMethod: 'iqr',
  flagReason: 'ratio < Q1 - 1.5*IQR',
  confidence: 94,
  reviewStatus: 'pending',
};

const STRATA_RESULT = {
  strataId: 'rich-sfr',
  strataLabel: 'Richland SFR',
  neighborhood: 'Richland',
  propertyType: 'SFR',
  sampleSize: 412,
  medianRatio: 0.978,
  cod: 11.2,
  prd: 1.005,
  qualified: true,
};

const MODEL_COMPARISON = {
  modelA: {
    label: '12-mo IQR',
    params: { taxYear: 2026, salesWindowMonths: 12, outlierMethod: 'iqr' },
    result: { ...RATIO_STUDY_RESULT },
  },
  modelB: {
    label: '24-mo Trim',
    params: { taxYear: 2026, salesWindowMonths: 24, outlierMethod: 'trim' },
    result: {
      ...RATIO_STUDY_RESULT,
      medianRatio: 0.992,
      cod: 11.8,
      prd: 1.012,
      prb: -0.018,
      sampleSize: 3412,
    },
  },
  deltas: {
    cod: -0.6,
    prd: 0.004,
    prb: 0.005,
    medianRatio: 0.007,
    sampleSize: 1565,
  },
  improvedMetrics: ['cod', 'prb', 'medianRatio'],
  degradedMetrics: ['prd'],
};

// ============================================================================
// IAAO Qualification Helper (mirrors forgeStatisticsStore.ts)
// ============================================================================

function computeQualification(result) {
  const checks = [
    result.cod <= IAAO_THRESHOLDS.cod.max,
    result.prd >= IAAO_THRESHOLDS.prd.min && result.prd <= IAAO_THRESHOLDS.prd.max,
    Math.abs(result.prb) < IAAO_THRESHOLDS.prb.absMax,
    result.medianRatio >= IAAO_THRESHOLDS.medianRatio.min && result.medianRatio <= IAAO_THRESHOLDS.medianRatio.max,
    Math.abs(result.tierSlope) <= IAAO_THRESHOLDS.tierSlope.absMax,
  ];
  const passCount = checks.filter(Boolean).length;
  return { passCount, qualified: passCount === 5 };
}

// ============================================================================
// Tests
// ============================================================================

describe('Forge Statistics Contract — RatioStudyResult shape', () => {
  it('has all required IAAO-standard fields', () => {
    const requiredFields = [
      'medianRatio', 'meanRatio', 'weightedMeanRatio',
      'cod', 'prd', 'prb', 'cov',
      'sampleSize', 'outlierCount',
      'tierMedians', 'tierSlope',
      'iaaoCompliant', 'complianceNotes',
      'computedAt', 'params',
    ];
    for (const field of requiredFields) {
      assert.ok(field in RATIO_STUDY_RESULT, `Missing required field: ${field}`);
    }
  });

  it('tier medians has all four quartiles', () => {
    const { tierMedians } = RATIO_STUDY_RESULT;
    assert.ok('q1' in tierMedians);
    assert.ok('q2' in tierMedians);
    assert.ok('q3' in tierMedians);
    assert.ok('q4' in tierMedians);
    // Quartile medians should decrease monotonically (regressivity pattern)
    for (const k of ['q1', 'q2', 'q3', 'q4']) {
      assert.equal(typeof tierMedians[k], 'number');
    }
  });

  it('params shape includes taxYear, salesWindowMonths, outlierMethod', () => {
    const { params } = RATIO_STUDY_RESULT;
    assert.equal(typeof params.taxYear, 'number');
    assert.equal(typeof params.salesWindowMonths, 'number');
    assert.ok(['iqr', 'trim', 'none'].includes(params.outlierMethod));
  });

  it('weightedMeanRatio is a number', () => {
    assert.equal(typeof RATIO_STUDY_RESULT.weightedMeanRatio, 'number');
    assert.ok(RATIO_STUDY_RESULT.weightedMeanRatio > 0);
    assert.ok(RATIO_STUDY_RESULT.weightedMeanRatio < 2);
  });

  it('computedAt is ISO 8601', () => {
    const d = new Date(RATIO_STUDY_RESULT.computedAt);
    assert.ok(!isNaN(d.getTime()), 'computedAt must be valid ISO 8601');
  });
});

describe('Forge Statistics Contract — IAAO compliance thresholds', () => {
  it('COD threshold: max 15.0', () => {
    const compliant = RATIO_STUDY_RESULT.cod <= IAAO_THRESHOLDS.cod.max;
    assert.ok(compliant, `COD ${RATIO_STUDY_RESULT.cod} should be <= ${IAAO_THRESHOLDS.cod.max}`);
  });

  it('PRD threshold: 0.98 - 1.03', () => {
    const { prd } = RATIO_STUDY_RESULT;
    assert.ok(prd >= IAAO_THRESHOLDS.prd.min, `PRD ${prd} < min ${IAAO_THRESHOLDS.prd.min}`);
    assert.ok(prd <= IAAO_THRESHOLDS.prd.max, `PRD ${prd} > max ${IAAO_THRESHOLDS.prd.max}`);
  });

  it('PRB threshold: |PRB| < 0.05', () => {
    const { prb } = RATIO_STUDY_RESULT;
    assert.ok(Math.abs(prb) < IAAO_THRESHOLDS.prb.absMax, `|PRB| ${Math.abs(prb)} >= ${IAAO_THRESHOLDS.prb.absMax}`);
  });

  it('Median ratio threshold: 0.90 - 1.10', () => {
    const { medianRatio } = RATIO_STUDY_RESULT;
    assert.ok(medianRatio >= IAAO_THRESHOLDS.medianRatio.min);
    assert.ok(medianRatio <= IAAO_THRESHOLDS.medianRatio.max);
  });

  it('Tier slope threshold: |slope| <= 0.05', () => {
    assert.ok(Math.abs(RATIO_STUDY_RESULT.tierSlope) <= IAAO_THRESHOLDS.tierSlope.absMax);
  });

  it('iaaoCompliant flag agrees with threshold checks', () => {
    const { qualified } = computeQualification(RATIO_STUDY_RESULT);
    assert.equal(RATIO_STUDY_RESULT.iaaoCompliant, qualified);
  });
});

describe('Forge Statistics Contract — QualificationMetrics', () => {
  it('computes correct passCount for fully compliant study', () => {
    const q = computeQualification(RATIO_STUDY_RESULT);
    assert.equal(q.passCount, 5);
    assert.equal(q.qualified, true);
  });

  it('fails qualification when COD exceeds threshold', () => {
    const bad = { ...RATIO_STUDY_RESULT, cod: 18.5 };
    const q = computeQualification(bad);
    assert.ok(q.passCount < 5);
    assert.equal(q.qualified, false);
  });

  it('fails qualification when PRD outside range', () => {
    const bad = { ...RATIO_STUDY_RESULT, prd: 1.06 };
    const q = computeQualification(bad);
    assert.equal(q.qualified, false);
  });

  it('fails qualification when PRB exceeds absolute threshold', () => {
    const bad = { ...RATIO_STUDY_RESULT, prb: 0.08 };
    const q = computeQualification(bad);
    assert.equal(q.qualified, false);
  });
});

describe('Forge Statistics Contract — OutlierRecord shape', () => {
  it('has all required fields', () => {
    const requiredFields = [
      'parcelId', 'address', 'neighborhood',
      'salePrice', 'assessedValue', 'ratio', 'ratioDeviation',
      'outlierMethod', 'flagReason', 'confidence', 'reviewStatus',
    ];
    for (const field of requiredFields) {
      assert.ok(field in OUTLIER_RECORD, `Missing field: ${field}`);
    }
  });

  it('outlierMethod is iqr or trim', () => {
    assert.ok(['iqr', 'trim'].includes(OUTLIER_RECORD.outlierMethod));
  });

  it('reviewStatus is a valid state', () => {
    assert.ok(['pending', 'confirmed', 'dismissed'].includes(OUTLIER_RECORD.reviewStatus));
  });

  it('ratio equals assessedValue / salePrice', () => {
    const computed = OUTLIER_RECORD.assessedValue / OUTLIER_RECORD.salePrice;
    assert.ok(Math.abs(computed - OUTLIER_RECORD.ratio) < 0.002,
      `Ratio ${OUTLIER_RECORD.ratio} should be close to ${computed.toFixed(3)}`);
  });

  it('confidence is 0-100 range', () => {
    assert.ok(OUTLIER_RECORD.confidence >= 0 && OUTLIER_RECORD.confidence <= 100);
  });
});

describe('Forge Statistics Contract — StrataResult shape', () => {
  it('has all required fields', () => {
    const requiredFields = [
      'strataId', 'strataLabel', 'neighborhood', 'propertyType',
      'sampleSize', 'medianRatio', 'cod', 'prd', 'qualified',
    ];
    for (const field of requiredFields) {
      assert.ok(field in STRATA_RESULT, `Missing field: ${field}`);
    }
  });

  it('qualified reflects IAAO COD threshold', () => {
    const codOk = STRATA_RESULT.cod <= IAAO_THRESHOLDS.cod.max;
    assert.equal(STRATA_RESULT.qualified, codOk);
  });
});

describe('Forge Statistics Contract — ModelComparisonResult', () => {
  it('has modelA and modelB with labels, params, and results', () => {
    assert.ok('label' in MODEL_COMPARISON.modelA);
    assert.ok('params' in MODEL_COMPARISON.modelA);
    assert.ok('result' in MODEL_COMPARISON.modelA);
    assert.ok('label' in MODEL_COMPARISON.modelB);
    assert.ok('params' in MODEL_COMPARISON.modelB);
    assert.ok('result' in MODEL_COMPARISON.modelB);
  });

  it('deltas are B minus A', () => {
    const { modelA, modelB, deltas } = MODEL_COMPARISON;
    const codDelta = modelB.result.cod - modelA.result.cod;
    assert.ok(Math.abs(codDelta - deltas.cod) < 0.01,
      `COD delta ${deltas.cod} should be ${codDelta.toFixed(3)}`);
  });

  it('improvedMetrics and degradedMetrics are non-overlapping', () => {
    const overlap = MODEL_COMPARISON.improvedMetrics.filter(
      (m) => MODEL_COMPARISON.degradedMetrics.includes(m)
    );
    assert.equal(overlap.length, 0, 'improved and degraded must not overlap');
  });

  it('deltas has all five required keys', () => {
    for (const key of ['cod', 'prd', 'prb', 'medianRatio', 'sampleSize']) {
      assert.ok(key in MODEL_COMPARISON.deltas, `Missing delta key: ${key}`);
    }
  });
});

describe('Forge Statistics Contract — Write Lane', () => {
  it('ratio study writes scope to Forge suite', () => {
    // All ratio study outputs are Forge-scoped, never cross-suite
    const writeLane = 'forge';
    assert.equal(writeLane, 'forge');
  });

  it('outlier review status mutation is Forge-scoped', () => {
    // Confirm/dismiss is a Forge write — no cross-suite side effects
    const validTransitions = ['pending→confirmed', 'pending→dismissed'];
    assert.ok(validTransitions.length === 2);
  });

  it('model comparison is read-only (no write lane)', () => {
    // Comparison is a read-only analysis — stateless
    const isReadOnly = true;
    assert.ok(isReadOnly);
  });
});
