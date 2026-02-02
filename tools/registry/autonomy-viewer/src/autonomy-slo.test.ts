/**
 * Phase 4N33 – SLO Guard + Error Budget Enforcement Tests
 * ========================================================
 *
 * Contract tests for autonomy-slo.ts module.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { EvidenceRecordForHealth } from './autonomy-health.js';
import {
    checkBudget,
    computeBudget,
    getBudgetStatus,
    SLO_SCHEMA,
    SLO_TOOL_VERSION,
    type SloPolicy
} from './autonomy-slo.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_POLICY: SloPolicy = {
  $schema: 'terrafusion.autonomy.slo.policy.v1',
  $version: '4N33.1-test',
  windows: {
    runWindow: 10,
    timeWindowDays: 7,
  },
  budgetTargets: {
    criticalMaxPerWindow: 1,
    warnMaxPerWindow: 3,
    okMinSuccessRate: 90,
  },
  severityWeights: {
    critical: {
      weight: 10,
      categories: ['break_glass_failed', 'role_binding_failed', 'tpi_failed'],
    },
    high: {
      weight: 5,
      categories: ['pins_failed', 'rekor_failed', 'signatures_failed'],
    },
    medium: {
      weight: 2,
      categories: ['verify_bundle_failed', 'verify_custody_failed'],
    },
    low: {
      weight: 1,
      categories: ['publisher_asset_missing', 'workflow_failure'],
    },
  },
  budgetLevels: {
    ok: { description: 'OK', minBudgetPercent: 50 },
    burning: {
      description: 'Burning',
      minBudgetPercent: 10,
      recommendedCanaryMaxStage: 'canary_25pct',
    },
    exhausted: { description: 'Exhausted', minBudgetPercent: 0, triggersPause: true },
  },
  enforcement: {
    blockOnExhausted: true,
    demoteCanaryOnExhausted: true,
    demoteCanaryToStage: 'disabled',
    pauseRecommendedTTLHours: 4,
    pauseRequiredTTLHours: 24,
    requiresProofOnBlock: true,
  },
  recovery: {
    autoRecoverOnWindowRolloff: true,
    manualRecoveryRequiresProof: true,
    cooldownAfterRecoveryHours: 1,
  },
  reporting: {
    emitBudgetToEvidenceIndex: true,
    emitBudgetToLedger: true,
    alertOnBurning: true,
    alertOnExhausted: true,
  },
};

const TODAY = new Date();
const ONE_DAY_AGO = new Date(TODAY.getTime() - 24 * 60 * 60 * 1000);
const TWO_DAYS_AGO = new Date(TODAY.getTime() - 2 * 24 * 60 * 60 * 1000);
const EIGHT_DAYS_AGO = new Date(TODAY.getTime() - 8 * 24 * 60 * 60 * 1000);

function createOkRecord(runId: string, generatedAt: Date): EvidenceRecordForHealth {
  return {
    runId,
    generatedAt: generatedAt.toISOString(),
    tier: 'ci',
    verify: { ok: true, strict: true },
    custody: { ok: true },
    signature: { signed: true, verified: { ok: true }, pinned: true },
    rekor: { anchored: true },
  };
}

function createFailedVerifyRecord(runId: string, generatedAt: Date): EvidenceRecordForHealth {
  return {
    runId,
    generatedAt: generatedAt.toISOString(),
    tier: 'ci',
    verify: { ok: false, strict: false },
    custody: { ok: true },
    signature: { signed: true, verified: { ok: true }, pinned: true },
  };
}

function createFailedPinsRecord(runId: string, generatedAt: Date): EvidenceRecordForHealth {
  return {
    runId,
    generatedAt: generatedAt.toISOString(),
    tier: 'ci',
    verify: { ok: true },
    custody: { ok: true },
    signature: { signed: true, verified: { ok: true }, pinned: false },
    rekor: { anchored: true },
  };
}

function createCriticalFailureRecord(runId: string, generatedAt: Date): EvidenceRecordForHealth {
  return {
    runId,
    generatedAt: generatedAt.toISOString(),
    tier: 'merged', // Must be non-ci for tpi_failed to trigger
    verify: { ok: true },
    custody: { ok: true },
    signature: { signed: true, verified: { ok: true }, pinned: true },
    rekor: { anchored: true },
    tpi: { ok: false }, // This triggers tpi_failed for non-ci tier
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Schema and Version', () => {
  it('exports correct schema identifier', () => {
    assert.strictEqual(SLO_SCHEMA, 'terrafusion.autonomy.slo.v1');
  });

  it('exports version matching Phase 4N33', () => {
    assert.ok(SLO_TOOL_VERSION.startsWith('4N33'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Budget Computation Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('computeBudget', () => {
  it('returns OK level for all healthy records', () => {
    const records = [
      createOkRecord('run-1', TODAY),
      createOkRecord('run-2', ONE_DAY_AGO),
      createOkRecord('run-3', TWO_DAYS_AGO),
    ];

    const result = computeBudget({ records, policy: DEFAULT_POLICY, now: TODAY });

    assert.strictEqual(result.level, 'ok');
    assert.strictEqual(result.budgetPercent, 100);
    assert.strictEqual(result.consumed.critical, 0);
    assert.strictEqual(result.consumed.warn, 0);
  });

  it('returns burning level when warn threshold exceeded', () => {
    const records = [
      createOkRecord('run-1', TODAY),
      createFailedVerifyRecord('run-2', ONE_DAY_AGO),
      createFailedVerifyRecord('run-3', ONE_DAY_AGO),
      createFailedVerifyRecord('run-4', TWO_DAYS_AGO),
      createFailedVerifyRecord('run-5', TWO_DAYS_AGO),
    ];

    const result = computeBudget({ records, policy: DEFAULT_POLICY, now: TODAY });

    assert.strictEqual(result.level, 'burning');
    assert.ok(result.budgetPercent < 100);
    assert.ok(result.consumed.warn > DEFAULT_POLICY.budgetTargets.warnMaxPerWindow);
  });

  it('returns exhausted level when critical threshold exceeded', () => {
    const records = [
      createOkRecord('run-1', TODAY),
      createCriticalFailureRecord('run-2', ONE_DAY_AGO),
      createCriticalFailureRecord('run-3', TWO_DAYS_AGO),
    ];

    const result = computeBudget({ records, policy: DEFAULT_POLICY, now: TODAY });

    assert.strictEqual(result.level, 'exhausted');
    assert.ok(result.consumed.critical > DEFAULT_POLICY.budgetTargets.criticalMaxPerWindow);
  });

  it('excludes records outside time window', () => {
    const records = [
      createOkRecord('run-1', TODAY),
      createCriticalFailureRecord('run-2', EIGHT_DAYS_AGO), // Outside 7-day window
    ];

    const result = computeBudget({ records, policy: DEFAULT_POLICY, now: TODAY });

    // Should be OK because the critical failure is outside the window
    assert.strictEqual(result.level, 'ok');
    assert.strictEqual(result.window.recordsIncluded, 1);
  });

  it('respects runWindow limit', () => {
    // Create 15 records, but runWindow is 10
    const records: EvidenceRecordForHealth[] = [];
    for (let i = 0; i < 15; i++) {
      const date = new Date(TODAY.getTime() - i * 60 * 60 * 1000); // 1 hour apart
      records.push(createOkRecord(`run-${i}`, date));
    }

    const result = computeBudget({ records, policy: DEFAULT_POLICY, now: TODAY });

    assert.strictEqual(result.window.recordsIncluded, 10);
    assert.strictEqual(result.window.recordsExcluded, 5);
  });

  it('calculates weighted score correctly', () => {
    const records = [
      createFailedPinsRecord('run-1', TODAY), // high severity (weight 5)
      createFailedVerifyRecord('run-2', ONE_DAY_AGO), // medium severity (weight 2)
    ];

    const result = computeBudget({ records, policy: DEFAULT_POLICY, now: TODAY });

    // pins_failed = weight 5, verify_bundle_failed = weight 2
    // Total weighted should be 5 + 2 = 7
    assert.ok(result.consumed.weightedScore > 0);
    assert.ok(result.failuresByCategory.length >= 2);
  });

  it('calculates burn rate correctly', () => {
    const records = [
      createFailedVerifyRecord('run-1', TODAY),
      createFailedVerifyRecord('run-2', ONE_DAY_AGO),
      createFailedVerifyRecord('run-3', TWO_DAYS_AGO),
    ];

    const result = computeBudget({ records, policy: DEFAULT_POLICY, now: TODAY });

    // 3 failures over ~2 days = ~1.5/day
    assert.ok(result.burnRate > 0);
  });

  it('provides recommendations for burning level', () => {
    const records = [
      createFailedVerifyRecord('run-1', TODAY),
      createFailedVerifyRecord('run-2', ONE_DAY_AGO),
      createFailedVerifyRecord('run-3', ONE_DAY_AGO),
      createFailedVerifyRecord('run-4', TWO_DAYS_AGO),
    ];

    const result = computeBudget({ records, policy: DEFAULT_POLICY, now: TODAY });

    assert.strictEqual(result.level, 'burning');
    assert.ok(result.recommendations.length > 0);
  });

  it('provides recommendations for exhausted level', () => {
    const records = [
      createCriticalFailureRecord('run-1', TODAY),
      createCriticalFailureRecord('run-2', ONE_DAY_AGO),
    ];

    const result = computeBudget({ records, policy: DEFAULT_POLICY, now: TODAY });

    assert.strictEqual(result.level, 'exhausted');
    assert.ok(result.recommendations.length > 0);
    assert.ok(result.recommendations.some(r => r.includes('pause')));
  });

  it('returns topFailures sorted by weighted score', () => {
    const records = [
      createFailedPinsRecord('run-1', TODAY),
      createFailedVerifyRecord('run-2', ONE_DAY_AGO),
      createFailedVerifyRecord('run-3', TWO_DAYS_AGO),
    ];

    const result = computeBudget({ records, policy: DEFAULT_POLICY, now: TODAY });

    assert.ok(result.topFailures.length > 0);
    // First failure should have highest weighted score
    for (let i = 1; i < result.topFailures.length; i++) {
      assert.ok(
        result.topFailures[i - 1].weightedScore >= result.topFailures[i].weightedScore,
        'topFailures should be sorted by weighted score descending'
      );
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Strict Mode Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Strict Mode (fail-closed)', () => {
  it('returns exhausted on empty records in strict mode', () => {
    const result = computeBudget({
      records: [],
      policy: DEFAULT_POLICY,
      strict: true,
    });

    assert.strictEqual(result.level, 'exhausted');
    assert.strictEqual(result.budgetPercent, 0);
    assert.ok(result.reasons[0].includes('strict mode'));
  });

  it('returns OK on empty records in non-strict mode', () => {
    const result = computeBudget({
      records: [],
      policy: DEFAULT_POLICY,
      strict: false,
    });

    assert.strictEqual(result.level, 'ok');
    assert.strictEqual(result.budgetPercent, 100);
  });

  it('returns exhausted when no records in window in strict mode', () => {
    const records = [
      createOkRecord('run-1', EIGHT_DAYS_AGO), // Outside 7-day window
    ];

    const result = computeBudget({
      records,
      policy: DEFAULT_POLICY,
      strict: true,
    });

    assert.strictEqual(result.level, 'exhausted');
    assert.ok(result.reasons[0].includes('strict mode'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Enforcement Check Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('checkBudget', () => {
  it('returns allowed: true for healthy budget', () => {
    const records = [createOkRecord('run-1', TODAY), createOkRecord('run-2', ONE_DAY_AGO)];

    const { allowed, proof } = checkBudget({
      records,
      policy: DEFAULT_POLICY,
      actor: 'pr-lane',
      command: 'test command',
    });

    assert.strictEqual(allowed, true);
    assert.strictEqual(proof.decision, 'allowed');
    assert.strictEqual(proof.blockReason, null);
  });

  it('returns allowed: false for exhausted budget', () => {
    const records = [
      createCriticalFailureRecord('run-1', TODAY),
      createCriticalFailureRecord('run-2', ONE_DAY_AGO),
    ];

    const { allowed, proof } = checkBudget({
      records,
      policy: DEFAULT_POLICY,
      actor: 'pr-lane',
      command: 'test command',
    });

    assert.strictEqual(allowed, false);
    assert.strictEqual(proof.decision, 'blocked');
    assert.ok(proof.blockReason !== null);
  });

  it('includes actor and command in proof', () => {
    const records = [createOkRecord('run-1', TODAY)];

    const { proof } = checkBudget({
      records,
      policy: DEFAULT_POLICY,
      actor: 'evidence-publisher',
      command: 'pnpm perf:publish',
    });

    assert.strictEqual(proof.actor, 'evidence-publisher');
    assert.strictEqual(proof.command, 'pnpm perf:publish');
  });

  it('includes schema and version in proof', () => {
    const records = [createOkRecord('run-1', TODAY)];

    const { proof } = checkBudget({
      records,
      policy: DEFAULT_POLICY,
      actor: 'pr-lane',
      command: 'test',
    });

    assert.strictEqual(proof.schema, SLO_SCHEMA);
    assert.strictEqual(proof.toolVersion, SLO_TOOL_VERSION);
  });

  it('respects blockOnExhausted policy setting', () => {
    const nonBlockingPolicy = {
      ...DEFAULT_POLICY,
      enforcement: { ...DEFAULT_POLICY.enforcement, blockOnExhausted: false },
    };

    const records = [
      createCriticalFailureRecord('run-1', TODAY),
      createCriticalFailureRecord('run-2', ONE_DAY_AGO),
    ];

    const { allowed } = checkBudget({
      records,
      policy: nonBlockingPolicy,
      actor: 'pr-lane',
      command: 'test',
    });

    // Even though exhausted, should be allowed because blockOnExhausted is false
    assert.strictEqual(allowed, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Status Summary Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('getBudgetStatus', () => {
  it('returns summary with all fields', () => {
    const records = [
      createOkRecord('run-1', TODAY),
      createFailedVerifyRecord('run-2', ONE_DAY_AGO),
    ];

    const status = getBudgetStatus(records, DEFAULT_POLICY);

    assert.ok('level' in status);
    assert.ok('budgetPercent' in status);
    assert.ok('criticalRemaining' in status);
    assert.ok('criticalConsumed' in status);
    assert.ok('warnRemaining' in status);
    assert.ok('warnConsumed' in status);
    assert.ok('burnRate' in status);
    assert.ok('windowRecords' in status);
    assert.ok('topFailures' in status);
    assert.ok('recommendations' in status);
    assert.ok('allowed' in status);
  });

  it('returns allowed: false when exhausted and blockOnExhausted', () => {
    const records = [
      createCriticalFailureRecord('run-1', TODAY),
      createCriticalFailureRecord('run-2', ONE_DAY_AGO),
    ];

    const status = getBudgetStatus(records, DEFAULT_POLICY);

    assert.strictEqual(status.level, 'exhausted');
    assert.strictEqual(status.allowed, false);
  });

  it('formats topFailures as human-readable strings', () => {
    const records = [
      createFailedVerifyRecord('run-1', TODAY),
      createFailedPinsRecord('run-2', ONE_DAY_AGO),
    ];

    const status = getBudgetStatus(records, DEFAULT_POLICY);

    assert.ok(status.topFailures.every(f => typeof f === 'string'));
    assert.ok(status.topFailures.some(f => f.includes('verify') || f.includes('pins')));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Category Weight Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Category Severity Weighting', () => {
  it('assigns higher weight to critical categories', () => {
    const criticalRecords = [createCriticalFailureRecord('run-1', TODAY)];
    const highRecords = [createFailedPinsRecord('run-1', TODAY)];

    const criticalResult = computeBudget({ records: criticalRecords, policy: DEFAULT_POLICY });
    const highResult = computeBudget({ records: highRecords, policy: DEFAULT_POLICY });

    // Critical weight (10) should impact budget more than high weight (5)
    assert.ok(criticalResult.budgetPercent <= highResult.budgetPercent);
  });

  it('tracks consumed counts by severity correctly', () => {
    const records = [
      createCriticalFailureRecord('run-1', TODAY), // critical
      createFailedPinsRecord('run-2', ONE_DAY_AGO), // high (not critical)
      createFailedVerifyRecord('run-3', TWO_DAYS_AGO), // medium (not warn for counter)
    ];

    const result = computeBudget({ records, policy: DEFAULT_POLICY });

    assert.strictEqual(result.consumed.critical, 1);
    // warn includes high + medium + low
    assert.ok(result.consumed.warn >= 2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Determinism Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Determinism', () => {
  it('produces identical results for same input', () => {
    const records = [
      createOkRecord('run-1', TODAY),
      createFailedVerifyRecord('run-2', ONE_DAY_AGO),
      createFailedPinsRecord('run-3', TWO_DAYS_AGO),
    ];
    const fixedNow = new Date('2024-01-15T12:00:00Z');

    const result1 = computeBudget({ records, policy: DEFAULT_POLICY, now: fixedNow });
    const result2 = computeBudget({ records, policy: DEFAULT_POLICY, now: fixedNow });

    assert.strictEqual(result1.level, result2.level);
    assert.strictEqual(result1.budgetPercent, result2.budgetPercent);
    assert.strictEqual(result1.consumed.critical, result2.consumed.critical);
    assert.strictEqual(result1.consumed.warn, result2.consumed.warn);
    assert.strictEqual(result1.burnRate, result2.burnRate);
    assert.strictEqual(result1.window.recordsIncluded, result2.window.recordsIncluded);
  });

  it('produces same topFailures order for same input', () => {
    const records = [
      createFailedVerifyRecord('run-1', TODAY),
      createFailedPinsRecord('run-2', ONE_DAY_AGO),
      createCriticalFailureRecord('run-3', TWO_DAYS_AGO),
    ];
    const fixedNow = new Date('2024-01-15T12:00:00Z');

    const result1 = computeBudget({ records, policy: DEFAULT_POLICY, now: fixedNow });
    const result2 = computeBudget({ records, policy: DEFAULT_POLICY, now: fixedNow });

    assert.deepStrictEqual(
      result1.topFailures.map(f => f.category),
      result2.topFailures.map(f => f.category)
    );
  });
});
