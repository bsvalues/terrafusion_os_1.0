/**
 * Phase 4N46 – Ops SLO Contract Tests
 * ====================================
 *
 * TDD-first tests for operational SLO validation:
 *   - Runtime ceilings for verify/reconstitute
 *   - Pack generation time limits
 *   - Max artifact sizes
 *   - Rollup cadence validation
 *
 * @module ops-slo.test
 * @version 4N46.1
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    OPS_SLO_SCHEMA,
    OPS_SLO_VERSION,
    type SLOMetric,
    checkSLOCompliance,
    getDefaultSLOs,
    measurePackGenerationTime,
    measureReconstitutionRuntime,
    measureVerificationRuntime,
    validateSLODefinition
} from '../src/ops-slo.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Data
// ─────────────────────────────────────────────────────────────────────────────

function createTestMetric(name: string, value: number, ceiling: number): SLOMetric {
  return {
    name,
    value,
    ceiling,
    unit: 'ms',
    measuredAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – SLO Schema
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – SLO Schema', () => {
  it('schema matches expected identifier', () => {
    assert.strictEqual(OPS_SLO_SCHEMA, 'terrafusion.autonomy.ops-slo.v1');
  });

  it('version is 4N46.1', () => {
    assert.strictEqual(OPS_SLO_VERSION, '4N46.1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Default SLOs
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Default SLOs', () => {
  it('getDefaultSLOs returns valid definition', () => {
    const slos = getDefaultSLOs();

    assert.ok(slos);
    assert.strictEqual(slos.$schema, OPS_SLO_SCHEMA);
  });

  it('default SLOs include verification runtime', () => {
    const slos = getDefaultSLOs();

    const verifyBudget = slos.budgets.find(b => b.operation === 'verify-casefile');
    assert.ok(verifyBudget, 'Should have verify-casefile budget');
    assert.ok(verifyBudget.ceilingMs > 0, 'Ceiling should be positive');
  });

  it('default SLOs include reconstitution runtime', () => {
    const slos = getDefaultSLOs();

    const drBudget = slos.budgets.find(b => b.operation === 'dr-reconstitute');
    assert.ok(drBudget, 'Should have dr-reconstitute budget');
    assert.ok(drBudget.ceilingMs > 0, 'Ceiling should be positive');
  });

  it('default SLOs include pack generation time', () => {
    const slos = getDefaultSLOs();

    const packBudget = slos.budgets.find(b => b.operation === 'generate-pack');
    assert.ok(packBudget, 'Should have generate-pack budget');
    assert.ok(packBudget.ceilingMs > 0, 'Ceiling should be positive');
  });

  it('default SLOs include max artifact sizes', () => {
    const slos = getDefaultSLOs();

    assert.ok(slos.sizeLimits);
    assert.ok(slos.sizeLimits.maxCasefileSizeBytes > 0);
    assert.ok(slos.sizeLimits.maxRollupSizeBytes > 0);
    assert.ok(slos.sizeLimits.maxPackSizeBytes > 0);
  });

  it('default SLOs include rollup cadence', () => {
    const slos = getDefaultSLOs();

    assert.ok(slos.cadence);
    assert.ok(slos.cadence.rollupIntervalDays > 0);
    assert.ok(slos.cadence.maxDaysSinceLastRollup > 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – SLO Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – SLO Validation', () => {
  it('validateSLODefinition accepts valid definition', () => {
    const slos = getDefaultSLOs();
    const result = validateSLODefinition(slos);

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('validation fails with zero ceiling', () => {
    const slos = getDefaultSLOs();
    slos.budgets[0] = { ...slos.budgets[0], ceilingMs: 0 };

    const result = validateSLODefinition(slos);
    assert.strictEqual(result.valid, false);
  });

  it('validation fails with negative ceiling', () => {
    const slos = getDefaultSLOs();
    slos.budgets[0] = { ...slos.budgets[0], ceilingMs: -100 };

    const result = validateSLODefinition(slos);
    assert.strictEqual(result.valid, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – SLO Compliance Check
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – SLO Compliance Check', () => {
  it('checkSLOCompliance passes when under ceiling', () => {
    const slos = getDefaultSLOs();
    const metric = createTestMetric('verify-casefile', 500, 5000);

    const result = checkSLOCompliance(metric, slos);

    assert.strictEqual(result.compliant, true);
    assert.ok(result.headroomPercent > 0);
  });

  it('checkSLOCompliance fails when over ceiling', () => {
    const slos = getDefaultSLOs();
    const metric = createTestMetric('verify-casefile', 10000, 5000);

    const result = checkSLOCompliance(metric, slos);

    assert.strictEqual(result.compliant, false);
    assert.ok(result.overage > 0);
  });

  it('checkSLOCompliance tracks budget utilization', () => {
    const slos = getDefaultSLOs();
    const metric = createTestMetric('verify-casefile', 2500, 5000);

    const result = checkSLOCompliance(metric, slos);

    assert.strictEqual(result.utilizationPercent, 50);
  });

  it('checkSLOCompliance warns at 80% threshold', () => {
    const slos = getDefaultSLOs();
    // Get verify budget ceiling
    const verifyBudget = slos.budgets.find(b => b.operation === 'verify-casefile');
    const ceiling = verifyBudget?.ceilingMs ?? 5000;
    const metric = createTestMetric('verify-casefile', ceiling * 0.85, ceiling);

    const result = checkSLOCompliance(metric, slos);

    assert.strictEqual(result.compliant, true);
    assert.ok(result.warning, 'Should warn when over 80% utilized');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Verification Runtime
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Verification Runtime', () => {
  it('measureVerificationRuntime returns metric', async () => {
    // Use a fast mock verification
    const metric = await measureVerificationRuntime(async () => {
      // Simulate fast verification
      await new Promise(resolve => setTimeout(resolve, 10));
      return { ok: true };
    });

    assert.strictEqual(metric.name, 'verify-casefile');
    assert.ok(metric.value >= 0);
    assert.strictEqual(metric.unit, 'ms');
  });

  it('verification runtime meets SLO under normal load', async () => {
    const slos = getDefaultSLOs();

    const metric = await measureVerificationRuntime(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return { ok: true };
    });

    const result = checkSLOCompliance(metric, slos);
    assert.strictEqual(result.compliant, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Reconstitution Runtime
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Reconstitution Runtime', () => {
  it('measureReconstitutionRuntime returns metric', async () => {
    const metric = await measureReconstitutionRuntime(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
      return { ok: true };
    });

    assert.strictEqual(metric.name, 'dr-reconstitute');
    assert.ok(metric.value >= 0);
  });

  it('reconstitution runtime meets SLO for small artifact set', async () => {
    const slos = getDefaultSLOs();

    const metric = await measureReconstitutionRuntime(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { ok: true };
    });

    const result = checkSLOCompliance(metric, slos);
    assert.strictEqual(result.compliant, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Pack Generation Time
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Pack Generation Time', () => {
  it('measurePackGenerationTime returns metric', async () => {
    const metric = await measurePackGenerationTime(async () => {
      await new Promise(resolve => setTimeout(resolve, 30));
      return { ok: true, sizeBytes: 1024 };
    });

    assert.strictEqual(metric.name, 'generate-pack');
    assert.ok(metric.value >= 0);
  });

  it('pack generation meets SLO for standard pack', async () => {
    const slos = getDefaultSLOs();

    const metric = await measurePackGenerationTime(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { ok: true, sizeBytes: 1024 * 1024 };
    });

    const result = checkSLOCompliance(metric, slos);
    assert.strictEqual(result.compliant, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Size Budget Compliance
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Size Budget Compliance', () => {
  it('casefile under size limit is compliant', () => {
    const slos = getDefaultSLOs();
    const sizeBytes = 1024 * 1024; // 1MB

    const compliant = sizeBytes <= slos.sizeLimits.maxCasefileSizeBytes;
    assert.strictEqual(compliant, true);
  });

  it('rollup under size limit is compliant', () => {
    const slos = getDefaultSLOs();
    const sizeBytes = 10 * 1024 * 1024; // 10MB

    const compliant = sizeBytes <= slos.sizeLimits.maxRollupSizeBytes;
    assert.strictEqual(compliant, true);
  });

  it('default size limits are reasonable', () => {
    const slos = getDefaultSLOs();

    // Casefile should allow at least 50MB
    assert.ok(slos.sizeLimits.maxCasefileSizeBytes >= 50 * 1024 * 1024);

    // Rollup should allow at least 100MB
    assert.ok(slos.sizeLimits.maxRollupSizeBytes >= 100 * 1024 * 1024);

    // Pack should allow at least 500MB
    assert.ok(slos.sizeLimits.maxPackSizeBytes >= 500 * 1024 * 1024);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Rollup Cadence
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Rollup Cadence', () => {
  it('default rollup interval is at least 30 days', () => {
    const slos = getDefaultSLOs();

    assert.ok(slos.cadence.rollupIntervalDays >= 30);
  });

  it('max days since last rollup is reasonable', () => {
    const slos = getDefaultSLOs();

    // Should alert if no rollup for 45+ days
    assert.ok(slos.cadence.maxDaysSinceLastRollup >= 30);
    assert.ok(slos.cadence.maxDaysSinceLastRollup <= 90);
  });
});
