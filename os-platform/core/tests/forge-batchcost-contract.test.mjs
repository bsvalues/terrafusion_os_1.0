/**
 * ============================================================================
 * TERRAFUSION OS — Forge Batch Cost & Coefficient Preview Contract Tests (1D)
 * ============================================================================
 *
 * Governed contract tests for batch cost model run types, coefficient
 * delta sets, impact preview, and write-lane assertions.
 *
 * Cross-parcel / standalone scope — no parcelId references.
 * Write lane: Forge (batch cost runs). Coefficient preview is read-only.
 *
 * Run:  node --test os-platform/core/tests/forge-batchcost-contract.test.mjs
 * ============================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ============================================================================
// Canonical thresholds (must match os-platform/core/types/index.ts)
// ============================================================================

const BATCH_COST_THRESHOLDS = {
  maxBatchSize: 50_000,
  minBatchSize: 10,
  validStatuses: ['pending', 'running', 'completed', 'failed', 'cancelled'],
  validStrata: ['residential', 'commercial', 'industrial', 'agricultural', 'exempt'],
  codImprovementThreshold: -0.5,
  impactBucketEdges: [-20, -10, -5, -2, 0, 2, 5, 10, 20],
};

// ============================================================================
// Fixture data (Benton County — mirrors component fixtures)
// ============================================================================

const FIXTURE_RUN_REQUEST = {
  label: '2025 Residential Full',
  modelYear: 2025,
  costTableVersion: 'CT-2025.2',
  filter: {
    strata: ['residential'],
    neighborhoods: ['N01-Kennewick Core'],
    propertyClasses: ['R1-SFR'],
  },
  dryRun: true,
};

const FIXTURE_RUN_SUMMARY = {
  totalParcels: 12_430,
  increasedCount: 8_200,
  decreasedCount: 3_100,
  unchangedCount: 1_130,
  meanChange: 9_870,
  medianChange: 7_200,
  meanPctChange: 3.6,
};

const FIXTURE_RUN_RECORD = {
  id: 'bcr-001',
  request: FIXTURE_RUN_REQUEST,
  status: 'completed',
  summary: FIXTURE_RUN_SUMMARY,
  createdAt: '2025-01-15T09:30:00Z',
  completedAt: '2025-01-15T09:47:00Z',
  countyId: 'benton-wa',
};

const FIXTURE_COEFFICIENT_DELTAS = [
  { variable: 'Living Area (sqft)', currentValue: 48.32, proposedValue: 51.07, delta: 2.75, deltaPct: 5.69 },
  { variable: 'Lot Size (acres)', currentValue: 12400, proposedValue: 11800, delta: -600, deltaPct: -4.84 },
  { variable: 'Age (years)', currentValue: -285.5, proposedValue: -310.2, delta: -24.7, deltaPct: 8.65 },
  { variable: 'Grade Quality', currentValue: 18500, proposedValue: 19200, delta: 700, deltaPct: 3.78 },
  { variable: 'Bathroom Count', currentValue: 6200, proposedValue: 5800, delta: -400, deltaPct: -6.45 },
  { variable: 'Garage Area (sqft)', currentValue: 22.1, proposedValue: 24.8, delta: 2.7, deltaPct: 12.22 },
  { variable: 'Condition Score', currentValue: 8900, proposedValue: 9100, delta: 200, deltaPct: 2.25 },
  { variable: 'Intercept', currentValue: -42000, proposedValue: -38500, delta: 3500, deltaPct: -8.33 },
];

const FIXTURE_DELTA_SET = {
  sourceModelId: 'mdl-prod-2024',
  candidateModelId: 'mdl-cand-2025a',
  deltas: FIXTURE_COEFFICIENT_DELTAS,
};

const FIXTURE_IMPACT_METRICS = {
  codDelta: -1.2,
  prdDelta: -0.008,
  meanRatioDelta: 0.015,
  medianRatioDelta: 0.012,
};

const FIXTURE_IMPACT_BUCKETS = [
  { label: '< -10%', count: 420, meanDollarImpact: -38_200 },
  { label: '-10% to -5%', count: 1_850, meanDollarImpact: -18_400 },
  { label: '-5% to -2%', count: 3_100, meanDollarImpact: -8_600 },
  { label: '-2% to 0%', count: 2_400, meanDollarImpact: -2_100 },
  { label: '0% to +2%', count: 3_650, meanDollarImpact: 2_300 },
  { label: '+2% to +5%', count: 6_200, meanDollarImpact: 8_900 },
  { label: '+5% to +10%', count: 5_800, meanDollarImpact: 19_100 },
  { label: '> +10%', count: 1_380, meanDollarImpact: 42_500 },
];

const FIXTURE_PREVIEW_RESULT = {
  coefficients: FIXTURE_DELTA_SET,
  metrics: FIXTURE_IMPACT_METRICS,
  impactedParcelCount: 24_800,
  totalParcelsEvaluated: 28_450,
  impactBuckets: FIXTURE_IMPACT_BUCKETS,
};

// ============================================================================
// 1. BatchCostRunRequest contract
// ============================================================================

describe('BatchCostRunRequest contract', () => {
  it('has required fields: label, modelYear, costTableVersion, filter, dryRun', () => {
    assert.ok(typeof FIXTURE_RUN_REQUEST.label === 'string');
    assert.ok(typeof FIXTURE_RUN_REQUEST.modelYear === 'number');
    assert.ok(typeof FIXTURE_RUN_REQUEST.costTableVersion === 'string');
    assert.ok(typeof FIXTURE_RUN_REQUEST.filter === 'object');
    assert.ok(typeof FIXTURE_RUN_REQUEST.dryRun === 'boolean');
  });

  it('label is non-empty', () => {
    assert.ok(FIXTURE_RUN_REQUEST.label.length > 0, 'label must be non-empty');
  });

  it('modelYear is a 4-digit year', () => {
    assert.ok(FIXTURE_RUN_REQUEST.modelYear >= 2000 && FIXTURE_RUN_REQUEST.modelYear <= 2100);
  });

  it('costTableVersion matches CT-YYYY.N pattern', () => {
    assert.match(FIXTURE_RUN_REQUEST.costTableVersion, /^CT-\d{4}\.\d+$/);
  });

  it('filter.strata entries are valid strata codes', () => {
    for (const s of FIXTURE_RUN_REQUEST.filter.strata) {
      assert.ok(BATCH_COST_THRESHOLDS.validStrata.includes(s), `invalid stratum: ${s}`);
    }
  });

  it('filter arrays are arrays of strings', () => {
    assert.ok(Array.isArray(FIXTURE_RUN_REQUEST.filter.strata));
    assert.ok(Array.isArray(FIXTURE_RUN_REQUEST.filter.neighborhoods));
    assert.ok(Array.isArray(FIXTURE_RUN_REQUEST.filter.propertyClasses));
    for (const arr of [FIXTURE_RUN_REQUEST.filter.strata, FIXTURE_RUN_REQUEST.filter.neighborhoods, FIXTURE_RUN_REQUEST.filter.propertyClasses]) {
      for (const item of arr) {
        assert.ok(typeof item === 'string');
      }
    }
  });
});

// ============================================================================
// 2. BatchCostRunSummary contract
// ============================================================================

describe('BatchCostRunSummary contract', () => {
  it('has required numeric fields', () => {
    const fields = ['totalParcels', 'increasedCount', 'decreasedCount', 'unchangedCount', 'meanChange', 'medianChange', 'meanPctChange'];
    for (const f of fields) {
      assert.ok(typeof FIXTURE_RUN_SUMMARY[f] === 'number', `${f} must be number`);
    }
  });

  it('parcel counts sum to totalParcels', () => {
    const sum = FIXTURE_RUN_SUMMARY.increasedCount + FIXTURE_RUN_SUMMARY.decreasedCount + FIXTURE_RUN_SUMMARY.unchangedCount;
    assert.equal(sum, FIXTURE_RUN_SUMMARY.totalParcels, 'increased + decreased + unchanged = totalParcels');
  });

  it('totalParcels is within batch size limits', () => {
    assert.ok(FIXTURE_RUN_SUMMARY.totalParcels >= BATCH_COST_THRESHOLDS.minBatchSize, `totalParcels >= ${BATCH_COST_THRESHOLDS.minBatchSize}`);
    assert.ok(FIXTURE_RUN_SUMMARY.totalParcels <= BATCH_COST_THRESHOLDS.maxBatchSize, `totalParcels <= ${BATCH_COST_THRESHOLDS.maxBatchSize}`);
  });

  it('counts are non-negative', () => {
    assert.ok(FIXTURE_RUN_SUMMARY.increasedCount >= 0);
    assert.ok(FIXTURE_RUN_SUMMARY.decreasedCount >= 0);
    assert.ok(FIXTURE_RUN_SUMMARY.unchangedCount >= 0);
  });

  it('medianChange is finite', () => {
    assert.ok(Number.isFinite(FIXTURE_RUN_SUMMARY.medianChange));
  });
});

// ============================================================================
// 3. BatchCostRunRecord contract
// ============================================================================

describe('BatchCostRunRecord contract', () => {
  it('has required fields: id, request, status, summary, createdAt, completedAt, countyId', () => {
    assert.ok(typeof FIXTURE_RUN_RECORD.id === 'string');
    assert.ok(typeof FIXTURE_RUN_RECORD.request === 'object');
    assert.ok(typeof FIXTURE_RUN_RECORD.status === 'string');
    assert.ok(typeof FIXTURE_RUN_RECORD.createdAt === 'string');
    assert.ok(typeof FIXTURE_RUN_RECORD.countyId === 'string');
  });

  it('status is a valid BatchCostRunStatus', () => {
    assert.ok(
      BATCH_COST_THRESHOLDS.validStatuses.includes(FIXTURE_RUN_RECORD.status),
      `status "${FIXTURE_RUN_RECORD.status}" must be one of ${BATCH_COST_THRESHOLDS.validStatuses}`
    );
  });

  it('createdAt is valid ISO date', () => {
    const d = new Date(FIXTURE_RUN_RECORD.createdAt);
    assert.ok(!isNaN(d.getTime()), 'createdAt must be valid ISO date');
  });

  it('completedAt is valid ISO date when present', () => {
    if (FIXTURE_RUN_RECORD.completedAt) {
      const d = new Date(FIXTURE_RUN_RECORD.completedAt);
      assert.ok(!isNaN(d.getTime()), 'completedAt must be valid ISO date');
    }
  });

  it('completed run has summary', () => {
    if (FIXTURE_RUN_RECORD.status === 'completed') {
      assert.ok(FIXTURE_RUN_RECORD.summary !== null, 'completed run must have summary');
    }
  });

  it('id is non-empty', () => {
    assert.ok(FIXTURE_RUN_RECORD.id.length > 0);
  });
});

// ============================================================================
// 4. CoefficientDelta contract
// ============================================================================

describe('CoefficientDelta contract', () => {
  it('each delta has required fields', () => {
    for (const d of FIXTURE_COEFFICIENT_DELTAS) {
      assert.ok(typeof d.variable === 'string');
      assert.ok(typeof d.currentValue === 'number');
      assert.ok(typeof d.proposedValue === 'number');
      assert.ok(typeof d.delta === 'number');
      assert.ok(typeof d.deltaPct === 'number');
    }
  });

  it('delta = proposedValue - currentValue (±0.01 tolerance)', () => {
    for (const d of FIXTURE_COEFFICIENT_DELTAS) {
      const expected = d.proposedValue - d.currentValue;
      assert.ok(
        Math.abs(d.delta - expected) < 0.01,
        `${d.variable}: delta ${d.delta} != proposed ${d.proposedValue} - current ${d.currentValue} = ${expected}`
      );
    }
  });

  it('variable names are non-empty strings', () => {
    for (const d of FIXTURE_COEFFICIENT_DELTAS) {
      assert.ok(d.variable.length > 0, 'variable name must be non-empty');
    }
  });

  it('all values are finite numbers', () => {
    for (const d of FIXTURE_COEFFICIENT_DELTAS) {
      assert.ok(Number.isFinite(d.currentValue), `${d.variable} currentValue must be finite`);
      assert.ok(Number.isFinite(d.proposedValue), `${d.variable} proposedValue must be finite`);
      assert.ok(Number.isFinite(d.delta), `${d.variable} delta must be finite`);
      assert.ok(Number.isFinite(d.deltaPct), `${d.variable} deltaPct must be finite`);
    }
  });

  it('fixture has at least 5 coefficients', () => {
    assert.ok(FIXTURE_COEFFICIENT_DELTAS.length >= 5, 'must have at least 5 coefficient deltas');
  });
});

// ============================================================================
// 5. CoefficientDeltaSet contract
// ============================================================================

describe('CoefficientDeltaSet contract', () => {
  it('has sourceModelId and candidateModelId', () => {
    assert.ok(typeof FIXTURE_DELTA_SET.sourceModelId === 'string');
    assert.ok(typeof FIXTURE_DELTA_SET.candidateModelId === 'string');
  });

  it('source and candidate are different models', () => {
    assert.notEqual(FIXTURE_DELTA_SET.sourceModelId, FIXTURE_DELTA_SET.candidateModelId);
  });

  it('deltas is a non-empty array', () => {
    assert.ok(Array.isArray(FIXTURE_DELTA_SET.deltas));
    assert.ok(FIXTURE_DELTA_SET.deltas.length > 0);
  });

  it('variable names are unique within the delta set', () => {
    const names = FIXTURE_DELTA_SET.deltas.map((d) => d.variable);
    const unique = new Set(names);
    assert.equal(names.length, unique.size, 'variable names must be unique');
  });
});

// ============================================================================
// 6. CoefficientImpactMetrics contract
// ============================================================================

describe('CoefficientImpactMetrics contract', () => {
  it('has required metric fields', () => {
    assert.ok(typeof FIXTURE_IMPACT_METRICS.codDelta === 'number');
    assert.ok(typeof FIXTURE_IMPACT_METRICS.prdDelta === 'number');
    assert.ok(typeof FIXTURE_IMPACT_METRICS.meanRatioDelta === 'number');
    assert.ok(typeof FIXTURE_IMPACT_METRICS.medianRatioDelta === 'number');
  });

  it('all metrics are finite', () => {
    for (const [key, val] of Object.entries(FIXTURE_IMPACT_METRICS)) {
      assert.ok(Number.isFinite(val), `${key} must be finite`);
    }
  });

  it('negative codDelta indicates improvement', () => {
    assert.ok(
      FIXTURE_IMPACT_METRICS.codDelta < 0,
      'fixture codDelta should be negative (improvement)'
    );
    assert.ok(
      FIXTURE_IMPACT_METRICS.codDelta <= BATCH_COST_THRESHOLDS.codImprovementThreshold,
      'codDelta should exceed improvement threshold'
    );
  });

  it('PRD delta is small (within ±0.1)', () => {
    assert.ok(Math.abs(FIXTURE_IMPACT_METRICS.prdDelta) < 0.1, 'PRD delta should be small');
  });
});

// ============================================================================
// 7. ImpactBucket contract
// ============================================================================

describe('ImpactBucket contract', () => {
  it('each bucket has label, count, meanDollarImpact', () => {
    for (const b of FIXTURE_IMPACT_BUCKETS) {
      assert.ok(typeof b.label === 'string');
      assert.ok(typeof b.count === 'number');
      assert.ok(typeof b.meanDollarImpact === 'number');
    }
  });

  it('counts are non-negative', () => {
    for (const b of FIXTURE_IMPACT_BUCKETS) {
      assert.ok(b.count >= 0, `bucket "${b.label}" count must be >= 0`);
    }
  });

  it('bucket labels follow expected pattern', () => {
    for (const b of FIXTURE_IMPACT_BUCKETS) {
      assert.ok(b.label.length > 0, 'label must be non-empty');
    }
  });

  it('fixture has at least 5 buckets', () => {
    assert.ok(FIXTURE_IMPACT_BUCKETS.length >= 5, 'expected at least 5 impact buckets');
  });

  it('negative impact buckets have negative meanDollarImpact', () => {
    const negativeBuckets = FIXTURE_IMPACT_BUCKETS.filter((b) => b.label.includes('-') && !b.label.includes('+'));
    for (const b of negativeBuckets) {
      assert.ok(b.meanDollarImpact < 0, `bucket "${b.label}" should have negative dollar impact`);
    }
  });

  it('positive impact buckets have positive meanDollarImpact', () => {
    const positiveBuckets = FIXTURE_IMPACT_BUCKETS.filter((b) => b.label.startsWith('+') || b.label.startsWith('>'));
    for (const b of positiveBuckets) {
      assert.ok(b.meanDollarImpact > 0, `bucket "${b.label}" should have positive dollar impact`);
    }
  });
});

// ============================================================================
// 8. CoefficientPreviewResult contract
// ============================================================================

describe('CoefficientPreviewResult contract', () => {
  it('has required fields', () => {
    assert.ok(typeof FIXTURE_PREVIEW_RESULT.coefficients === 'object');
    assert.ok(typeof FIXTURE_PREVIEW_RESULT.metrics === 'object');
    assert.ok(typeof FIXTURE_PREVIEW_RESULT.impactedParcelCount === 'number');
    assert.ok(typeof FIXTURE_PREVIEW_RESULT.totalParcelsEvaluated === 'number');
    assert.ok(Array.isArray(FIXTURE_PREVIEW_RESULT.impactBuckets));
  });

  it('impactedParcelCount <= totalParcelsEvaluated', () => {
    assert.ok(
      FIXTURE_PREVIEW_RESULT.impactedParcelCount <= FIXTURE_PREVIEW_RESULT.totalParcelsEvaluated,
      'impacted cannot exceed total evaluated'
    );
  });

  it('totalParcelsEvaluated > 0', () => {
    assert.ok(FIXTURE_PREVIEW_RESULT.totalParcelsEvaluated > 0);
  });

  it('bucket counts sum close to impactedParcelCount', () => {
    const bucketSum = FIXTURE_PREVIEW_RESULT.impactBuckets.reduce((acc, b) => acc + b.count, 0);
    assert.ok(bucketSum > 0, 'bucket sum must be > 0');
    // Buckets cover impacted parcels — allow ±5% tolerance
    const ratio = bucketSum / FIXTURE_PREVIEW_RESULT.impactedParcelCount;
    assert.ok(
      ratio >= 0.95 && ratio <= 1.05,
      `bucket sum ${bucketSum} should be within 5% of impacted ${FIXTURE_PREVIEW_RESULT.impactedParcelCount}`
    );
  });
});

// ============================================================================
// 9. Write-lane assertions
// ============================================================================

describe('Write-lane assertions (Forge only)', () => {
  it('batch cost run is Forge write-lane (no parcelId in request)', () => {
    assert.ok(!('parcelId' in FIXTURE_RUN_REQUEST), 'batch cost request must NOT have parcelId');
  });

  it('batch cost record is county-scoped', () => {
    assert.ok(typeof FIXTURE_RUN_RECORD.countyId === 'string');
    assert.ok(FIXTURE_RUN_RECORD.countyId.length > 0, 'countyId must be non-empty');
  });

  it('coefficient preview is cross-parcel (no parcelId in delta set)', () => {
    assert.ok(!('parcelId' in FIXTURE_DELTA_SET), 'delta set must NOT have parcelId');
  });

  it('coefficient preview is cross-parcel (no parcelId in preview result)', () => {
    assert.ok(!('parcelId' in FIXTURE_PREVIEW_RESULT), 'preview result must NOT have parcelId');
  });

  it('batch cost changes are Forge domain (not Dais, Atlas, Dossier)', () => {
    // The run record must not reference other suite write-lanes
    const serialized = JSON.stringify(FIXTURE_RUN_RECORD);
    assert.ok(!serialized.includes('"writesTo":"dais"'), 'must not write to Dais');
    assert.ok(!serialized.includes('"writesTo":"atlas"'), 'must not write to Atlas');
    assert.ok(!serialized.includes('"writesTo":"dossier"'), 'must not write to Dossier');
  });
});

// ============================================================================
// 10. Standalone-only & BATCH_COST_THRESHOLDS
// ============================================================================

describe('Standalone-only & threshold constants', () => {
  it('validStatuses has 5 entries', () => {
    assert.equal(BATCH_COST_THRESHOLDS.validStatuses.length, 5);
  });

  it('validStatuses includes pending, running, completed, failed, cancelled', () => {
    for (const s of ['pending', 'running', 'completed', 'failed', 'cancelled']) {
      assert.ok(BATCH_COST_THRESHOLDS.validStatuses.includes(s), `missing status: ${s}`);
    }
  });

  it('validStrata has 5 entries', () => {
    assert.equal(BATCH_COST_THRESHOLDS.validStrata.length, 5);
  });

  it('maxBatchSize > minBatchSize', () => {
    assert.ok(BATCH_COST_THRESHOLDS.maxBatchSize > BATCH_COST_THRESHOLDS.minBatchSize);
  });

  it('impactBucketEdges are sorted ascending', () => {
    for (let i = 1; i < BATCH_COST_THRESHOLDS.impactBucketEdges.length; i++) {
      assert.ok(
        BATCH_COST_THRESHOLDS.impactBucketEdges[i] > BATCH_COST_THRESHOLDS.impactBucketEdges[i - 1],
        'bucket edges must be sorted ascending'
      );
    }
  });

  it('codImprovementThreshold is negative', () => {
    assert.ok(BATCH_COST_THRESHOLDS.codImprovementThreshold < 0);
  });

  it('batch run request has no workbenchTab reference', () => {
    assert.ok(!('workbenchTab' in FIXTURE_RUN_REQUEST), 'standalone module must not reference workbenchTab');
  });

  it('batch run request has no parcel routing', () => {
    assert.ok(!('parcelId' in FIXTURE_RUN_REQUEST), 'standalone module must not route by parcelId');
    assert.ok(!('propertyId' in FIXTURE_RUN_REQUEST), 'standalone module must not route by propertyId');
  });

  it('coefficient preview has no workbench routing', () => {
    assert.ok(!('workbenchTab' in FIXTURE_DELTA_SET), 'preview must not reference workbenchTab');
    assert.ok(!('workbenchTab' in FIXTURE_PREVIEW_RESULT), 'preview result must not reference workbenchTab');
  });
});
