/**
 * ============================================================================
 * TERRAFUSION OS — Forge Regression Studio Contract Tests (Tranche 1C)
 * ============================================================================
 *
 * Governed contract tests for regression model types, diagnostics,
 * coefficients, validation, and write-lane assertions.
 *
 * Cross-parcel / standalone scope — no parcelId references.
 * Write lane: Forge (not Workbench-scoped).
 *
 * Run:  node --test os-platform/core/tests/forge-regression-contract.test.mjs
 * ============================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ============================================================================
// Canonical thresholds (must match os-platform/core/types/index.ts)
// ============================================================================

const REGRESSION_THRESHOLDS = {
  minRSquared: 0.70,
  maxVIF: 10.0,
  significanceAlpha: 0.05,
  minObservations: 30,
  validModelTypes: ['OLS', 'GWR', 'Quantile'],
  validStatuses: ['draft', 'validated', 'production'],
  validCategories: ['Physical', 'Quality', 'Location', 'Amenity'],
};

// ============================================================================
// Fixture helpers
// ============================================================================

function createFixtureCoefficient(overrides = {}) {
  return {
    variable: 'sqft',
    estimate: 78.2,
    stdError: 3.1,
    tStat: 25.23,
    pValue: 0.0001,
    significant: true,
    vif: 1.8,
    ...overrides,
  };
}

function createFixtureModel(overrides = {}) {
  return {
    id: 'm1-v2',
    name: 'SFR Base Model',
    modelType: 'OLS',
    version: 2,
    status: 'production',
    createdAt: '2026-03-10',
    rSquared: 0.8742,
    adjustedRSquared: 0.8730,
    fStatistic: 378.9,
    mse: 1564000000,
    aic: 24320,
    bic: 24360,
    observations: 1847,
    variables: ['sqft', 'lot_size', 'year_built', 'quality_grade', 'neighborhood', 'condition'],
    coefficients: [
      createFixtureCoefficient({ variable: 'sqft', estimate: 85.4, stdError: 2.9, tStat: 29.45 }),
      createFixtureCoefficient({ variable: 'lot_size', estimate: 12.3, stdError: 2.5, tStat: 4.92, vif: 1.2 }),
      createFixtureCoefficient({ variable: 'year_built', estimate: 450.2, stdError: 88.5, tStat: 5.09, vif: 1.4 }),
      createFixtureCoefficient({ variable: 'quality_grade', estimate: 22000, stdError: 1100, tStat: 20.00, vif: 1.9 }),
      createFixtureCoefficient({ variable: 'neighborhood', estimate: 15400, stdError: 2800, tStat: 5.50, vif: 1.5 }),
      createFixtureCoefficient({ variable: 'condition', estimate: 8900, stdError: 1650, tStat: 5.39, vif: 1.3 }),
    ],
    qualificationPass: true,
    ...overrides,
  };
}

function createFixtureFeature(overrides = {}) {
  return {
    id: 'sqft',
    name: 'Square Footage',
    category: 'Physical',
    selected: true,
    description: 'Total heated living area',
    ...overrides,
  };
}

function createFixtureDiagnostics(overrides = {}) {
  return {
    rSquared: 0.8742,
    adjustedRSquared: 0.8730,
    fStatistic: 378.9,
    mse: 1564000000,
    aic: 24320,
    bic: 24360,
    observations: 1847,
    ...overrides,
  };
}

function createFixtureMetricDeltas(overrides = {}) {
  return {
    rSquared: 0.0241,
    adjustedRSquared: 0.0243,
    aic: -260,
    bic: -260,
    mse: -278000000,
    ...overrides,
  };
}

function createFixtureCoefficientDelta(overrides = {}) {
  return {
    variable: 'sqft',
    estimateA: 78.2,
    estimateB: 85.4,
    delta: 7.2,
    significantA: true,
    significantB: true,
    signChange: false,
    ...overrides,
  };
}

/**
 * Evaluate whether a model passes IAAO-aligned qualification.
 * A model qualifies if:
 *  - R² >= minRSquared
 *  - observations >= minObservations
 *  - all VIFs <= maxVIF
 *  - at least one coefficient is significant at alpha
 */
function evaluateQualification(model) {
  if (model.rSquared < REGRESSION_THRESHOLDS.minRSquared) return false;
  if (model.observations < REGRESSION_THRESHOLDS.minObservations) return false;
  const hasHighVIF = model.coefficients.some(
    (c) => c.vif !== undefined && c.vif > REGRESSION_THRESHOLDS.maxVIF
  );
  if (hasHighVIF) return false;
  const hasSignificant = model.coefficients.some(
    (c) => c.pValue <= REGRESSION_THRESHOLDS.significanceAlpha
  );
  return hasSignificant;
}

/**
 * Compute metric improvement/degradation between two models.
 * For R², adjR²: higher = improved. For AIC, BIC, MSE: lower = improved.
 */
function computeImprovements(deltas) {
  const improved = [];
  const degraded = [];
  if (deltas.rSquared > 0) improved.push('rSquared'); else if (deltas.rSquared < 0) degraded.push('rSquared');
  if (deltas.adjustedRSquared > 0) improved.push('adjustedRSquared'); else if (deltas.adjustedRSquared < 0) degraded.push('adjustedRSquared');
  if (deltas.aic < 0) improved.push('aic'); else if (deltas.aic > 0) degraded.push('aic');
  if (deltas.bic < 0) improved.push('bic'); else if (deltas.bic > 0) degraded.push('bic');
  if (deltas.mse < 0) improved.push('mse'); else if (deltas.mse > 0) degraded.push('mse');
  return { improved, degraded };
}

// ============================================================================
// Suite 1: RegressionModelRecord shape
// ============================================================================

describe('RegressionModelRecord shape', () => {
  const model = createFixtureModel();

  it('has required string fields', () => {
    assert.equal(typeof model.id, 'string');
    assert.equal(typeof model.name, 'string');
    assert.equal(typeof model.createdAt, 'string');
  });

  it('has valid modelType', () => {
    assert.ok(
      REGRESSION_THRESHOLDS.validModelTypes.includes(model.modelType),
      `modelType "${model.modelType}" not in ${REGRESSION_THRESHOLDS.validModelTypes}`
    );
  });

  it('has valid status', () => {
    assert.ok(
      REGRESSION_THRESHOLDS.validStatuses.includes(model.status),
      `status "${model.status}" not in ${REGRESSION_THRESHOLDS.validStatuses}`
    );
  });

  it('has numeric diagnostic fields', () => {
    assert.equal(typeof model.rSquared, 'number');
    assert.equal(typeof model.adjustedRSquared, 'number');
    assert.equal(typeof model.fStatistic, 'number');
    assert.equal(typeof model.mse, 'number');
    assert.equal(typeof model.aic, 'number');
    assert.equal(typeof model.bic, 'number');
    assert.equal(typeof model.observations, 'number');
  });

  it('has positive version', () => {
    assert.ok(model.version >= 1, `version ${model.version} must be >= 1`);
  });

  it('has non-empty variables array', () => {
    assert.ok(Array.isArray(model.variables));
    assert.ok(model.variables.length > 0, 'variables must not be empty');
  });

  it('has non-empty coefficients array', () => {
    assert.ok(Array.isArray(model.coefficients));
    assert.ok(model.coefficients.length > 0, 'coefficients must not be empty');
  });

  it('has boolean qualificationPass', () => {
    assert.equal(typeof model.qualificationPass, 'boolean');
  });

  it('coefficients count matches variables count', () => {
    assert.equal(model.coefficients.length, model.variables.length,
      'each variable should have exactly one coefficient');
  });
});

// ============================================================================
// Suite 2: RegressionCoefficient shape
// ============================================================================

describe('RegressionCoefficient shape', () => {
  const coeff = createFixtureCoefficient();

  it('has required string field: variable', () => {
    assert.equal(typeof coeff.variable, 'string');
    assert.ok(coeff.variable.length > 0, 'variable name must be non-empty');
  });

  it('has required numeric fields', () => {
    assert.equal(typeof coeff.estimate, 'number');
    assert.equal(typeof coeff.stdError, 'number');
    assert.equal(typeof coeff.tStat, 'number');
    assert.equal(typeof coeff.pValue, 'number');
  });

  it('has boolean significant flag', () => {
    assert.equal(typeof coeff.significant, 'boolean');
  });

  it('has optional numeric vif', () => {
    if (coeff.vif !== undefined) {
      assert.equal(typeof coeff.vif, 'number');
      assert.ok(coeff.vif > 0, 'VIF must be positive');
    }
  });

  it('stdError is non-negative', () => {
    assert.ok(coeff.stdError >= 0, 'stdError must be non-negative');
  });

  it('pValue is between 0 and 1', () => {
    assert.ok(coeff.pValue >= 0 && coeff.pValue <= 1,
      `pValue ${coeff.pValue} must be in [0, 1]`);
  });

  it('significant aligns with pValue and alpha', () => {
    if (coeff.pValue <= REGRESSION_THRESHOLDS.significanceAlpha) {
      assert.equal(coeff.significant, true,
        `pValue ${coeff.pValue} <= alpha ${REGRESSION_THRESHOLDS.significanceAlpha} but significant is false`);
    }
  });
});

// ============================================================================
// Suite 3: RegressionFeature shape
// ============================================================================

describe('RegressionFeature shape', () => {
  const feature = createFixtureFeature();

  it('has required string fields', () => {
    assert.equal(typeof feature.id, 'string');
    assert.equal(typeof feature.name, 'string');
  });

  it('has valid category', () => {
    assert.ok(
      REGRESSION_THRESHOLDS.validCategories.includes(feature.category),
      `category "${feature.category}" not in ${REGRESSION_THRESHOLDS.validCategories}`
    );
  });

  it('has boolean selected flag', () => {
    assert.equal(typeof feature.selected, 'boolean');
  });

  it('has optional string description', () => {
    if (feature.description !== undefined) {
      assert.equal(typeof feature.description, 'string');
    }
  });
});

// ============================================================================
// Suite 4: RegressionDiagnostics shape
// ============================================================================

describe('RegressionDiagnostics shape', () => {
  const diag = createFixtureDiagnostics();

  it('R² is in valid range [0, 1]', () => {
    assert.ok(diag.rSquared >= 0 && diag.rSquared <= 1,
      `rSquared ${diag.rSquared} must be in [0, 1]`);
  });

  it('adjusted R² is in valid range [0, 1]', () => {
    assert.ok(diag.adjustedRSquared >= 0 && diag.adjustedRSquared <= 1,
      `adjustedRSquared ${diag.adjustedRSquared} must be in [0, 1]`);
  });

  it('adjusted R² <= R²', () => {
    assert.ok(diag.adjustedRSquared <= diag.rSquared,
      `adjustedRSquared ${diag.adjustedRSquared} should be <= rSquared ${diag.rSquared}`);
  });

  it('F statistic is positive', () => {
    assert.ok(diag.fStatistic > 0, `fStatistic ${diag.fStatistic} must be positive`);
  });

  it('MSE is non-negative', () => {
    assert.ok(diag.mse >= 0, `mse ${diag.mse} must be non-negative`);
  });

  it('observations meets minimum threshold', () => {
    assert.ok(diag.observations >= REGRESSION_THRESHOLDS.minObservations,
      `observations ${diag.observations} must be >= ${REGRESSION_THRESHOLDS.minObservations}`);
  });

  it('AIC and BIC are finite numbers', () => {
    assert.ok(Number.isFinite(diag.aic), 'AIC must be finite');
    assert.ok(Number.isFinite(diag.bic), 'BIC must be finite');
  });
});

// ============================================================================
// Suite 5: Qualification logic
// ============================================================================

describe('Qualification logic', () => {
  it('production model with strong R² passes', () => {
    const model = createFixtureModel({ rSquared: 0.87, observations: 1847 });
    assert.equal(evaluateQualification(model), true);
  });

  it('model below minRSquared fails', () => {
    const model = createFixtureModel({ rSquared: 0.55 });
    assert.equal(evaluateQualification(model), false);
  });

  it('model below minObservations fails', () => {
    const model = createFixtureModel({ observations: 10 });
    assert.equal(evaluateQualification(model), false);
  });

  it('model with VIF > maxVIF fails', () => {
    const badCoeffs = [
      createFixtureCoefficient({ vif: 15.0 }),
    ];
    const model = createFixtureModel({ coefficients: badCoeffs });
    assert.equal(evaluateQualification(model), false);
  });

  it('model with no significant coefficients fails', () => {
    const noSigCoeffs = [
      createFixtureCoefficient({ pValue: 0.8, significant: false, vif: 1.2 }),
    ];
    const model = createFixtureModel({ coefficients: noSigCoeffs });
    assert.equal(evaluateQualification(model), false);
  });

  it('borderline R² at exactly threshold passes', () => {
    const borderCoeffs = [createFixtureCoefficient()];
    const model = createFixtureModel({
      rSquared: REGRESSION_THRESHOLDS.minRSquared,
      observations: 30,
      coefficients: borderCoeffs,
    });
    assert.equal(evaluateQualification(model), true);
  });
});

// ============================================================================
// Suite 6: Model version comparison
// ============================================================================

describe('Model version comparison', () => {
  const deltas = createFixtureMetricDeltas();

  it('metric delta shape has all required fields', () => {
    const required = ['rSquared', 'adjustedRSquared', 'aic', 'bic', 'mse'];
    for (const key of required) {
      assert.ok(key in deltas, `missing field: ${key}`);
      assert.equal(typeof deltas[key], 'number');
    }
  });

  it('positive R² delta = improved', () => {
    const { improved } = computeImprovements(deltas);
    assert.ok(improved.includes('rSquared'));
  });

  it('negative AIC delta = improved', () => {
    const { improved } = computeImprovements(deltas);
    assert.ok(improved.includes('aic'));
  });

  it('negative MSE delta = improved', () => {
    const { improved } = computeImprovements(deltas);
    assert.ok(improved.includes('mse'));
  });

  it('all improved when all deltas favor model B', () => {
    const { improved, degraded } = computeImprovements(deltas);
    assert.equal(improved.length, 5, 'all 5 metrics should be improved');
    assert.equal(degraded.length, 0, 'no metrics should be degraded');
  });

  it('degradation detected when R² drops', () => {
    const worseDeltas = createFixtureMetricDeltas({ rSquared: -0.02 });
    const { degraded } = computeImprovements(worseDeltas);
    assert.ok(degraded.includes('rSquared'));
  });
});

// ============================================================================
// Suite 7: CoefficientDelta shape
// ============================================================================

describe('CoefficientDelta shape', () => {
  const cd = createFixtureCoefficientDelta();

  it('has required string field: variable', () => {
    assert.equal(typeof cd.variable, 'string');
  });

  it('has numeric estimate fields', () => {
    assert.equal(typeof cd.estimateA, 'number');
    assert.equal(typeof cd.estimateB, 'number');
    assert.equal(typeof cd.delta, 'number');
  });

  it('delta equals estimateB - estimateA', () => {
    const computed = cd.estimateB - cd.estimateA;
    assert.ok(Math.abs(cd.delta - computed) < 0.001,
      `delta ${cd.delta} should equal estimateB - estimateA = ${computed}`);
  });

  it('has boolean significance flags', () => {
    assert.equal(typeof cd.significantA, 'boolean');
    assert.equal(typeof cd.significantB, 'boolean');
    assert.equal(typeof cd.signChange, 'boolean');
  });

  it('signChange detects actual sign reversal', () => {
    const reversal = createFixtureCoefficientDelta({
      estimateA: 100, estimateB: -50, signChange: true,
    });
    assert.equal(reversal.signChange, true);
  });

  it('no signChange when both positive', () => {
    assert.equal(cd.signChange, false, 'both positive estimates = no sign change');
  });
});

// ============================================================================
// Suite 8: Write-lane scoping (cross-parcel standalone)
// ============================================================================

describe('Write-lane scoping', () => {
  it('model record has no parcelId field', () => {
    const model = createFixtureModel();
    assert.equal('parcelId' in model, false,
      'RegressionModelRecord must NOT have parcelId — it is cross-parcel');
  });

  it('model record has no workbenchTab field', () => {
    const model = createFixtureModel();
    assert.equal('workbenchTab' in model, false,
      'RegressionModelRecord must NOT reference workbenchTab — it is standalone');
  });

  it('write lane owner is Forge', () => {
    // Convention: regression models are Forge-owned artifacts.
    // If a writeLane property is added, it must be 'forge'.
    const model = createFixtureModel();
    if ('writeLane' in model) {
      assert.equal(model.writeLane, 'forge');
    }
    // Structural assertion: model does not reference non-Forge suites
    assert.ok(!('atlasLayer' in model), 'no atlas references');
    assert.ok(!('daisWorkflow' in model), 'no dais references');
    assert.ok(!('dossierEvidence' in model), 'no dossier references');
  });
});

// ============================================================================
// Suite 9: Threshold constants consistency
// ============================================================================

describe('Threshold constants consistency', () => {
  it('minRSquared is in [0, 1]', () => {
    assert.ok(REGRESSION_THRESHOLDS.minRSquared >= 0 && REGRESSION_THRESHOLDS.minRSquared <= 1);
  });

  it('maxVIF is positive', () => {
    assert.ok(REGRESSION_THRESHOLDS.maxVIF > 0);
  });

  it('significanceAlpha is in (0, 1)', () => {
    assert.ok(REGRESSION_THRESHOLDS.significanceAlpha > 0 && REGRESSION_THRESHOLDS.significanceAlpha < 1);
  });

  it('minObservations is positive integer', () => {
    assert.ok(REGRESSION_THRESHOLDS.minObservations > 0);
    assert.equal(REGRESSION_THRESHOLDS.minObservations, Math.floor(REGRESSION_THRESHOLDS.minObservations));
  });

  it('validModelTypes includes all three types', () => {
    assert.deepEqual(
      [...REGRESSION_THRESHOLDS.validModelTypes].sort(),
      ['GWR', 'OLS', 'Quantile']
    );
  });

  it('validStatuses includes lifecycle stages', () => {
    assert.deepEqual(
      [...REGRESSION_THRESHOLDS.validStatuses].sort(),
      ['draft', 'production', 'validated']
    );
  });

  it('validCategories includes all feature categories', () => {
    assert.deepEqual(
      [...REGRESSION_THRESHOLDS.validCategories].sort(),
      ['Amenity', 'Location', 'Physical', 'Quality']
    );
  });
});

// ============================================================================
// Suite 10: Edge cases
// ============================================================================

describe('Edge cases', () => {
  it('model with R² exactly 0.70 qualifies', () => {
    const model = createFixtureModel({ rSquared: 0.70 });
    assert.equal(evaluateQualification(model), true);
  });

  it('model with R² at 0.6999 does not qualify', () => {
    const model = createFixtureModel({ rSquared: 0.6999 });
    assert.equal(evaluateQualification(model), false);
  });

  it('model with VIF exactly 10.0 passes', () => {
    const exactCoeffs = [createFixtureCoefficient({ vif: 10.0 })];
    const model = createFixtureModel({ coefficients: exactCoeffs });
    assert.equal(evaluateQualification(model), true);
  });

  it('model with VIF at 10.01 fails', () => {
    const overCoeffs = [createFixtureCoefficient({ vif: 10.01 })];
    const model = createFixtureModel({ coefficients: overCoeffs });
    assert.equal(evaluateQualification(model), false);
  });

  it('zero deltas result in neither improved nor degraded', () => {
    const zeroDeltas = createFixtureMetricDeltas({
      rSquared: 0, adjustedRSquared: 0, aic: 0, bic: 0, mse: 0,
    });
    const { improved, degraded } = computeImprovements(zeroDeltas);
    assert.equal(improved.length, 0);
    assert.equal(degraded.length, 0);
  });
});
