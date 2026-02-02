/**
 * Phase 4N32 – Autonomy Canary Lane Contract Tests
 * =================================================
 *
 * Contract tests that verify:
 * 1. Stage calculation determinism (same inputs → same stage always)
 * 2. Promotion eligibility correctness
 * 3. Demotion trigger accuracy
 * 4. Rate limit enforcement
 * 5. Lock/unlock behavior
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    CANARY_SCHEMA,
    CANARY_TOOL_VERSION,
    type CanaryPolicy,
    type CanaryState,
    type PromotionProof,
    checkDemotion,
    checkPromotionEligibility,
    checkRateLimit,
    demote,
    getNextStage,
    getPreviousStage,
    getStageIndex,
    lock,
    promote,
    recordActivity,
    unlock
} from './autonomy-canary.js';
import type { AutonomyHealth, EvidenceRecordForHealth } from './autonomy-health.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const NOW = new Date();
const ONE_HOUR_AGO = new Date(NOW.getTime() - 60 * 60 * 1000);
const TWENTY_FIVE_HOURS_AGO = new Date(NOW.getTime() - 25 * 60 * 60 * 1000);
const TODAY = NOW.toISOString().slice(0, 10);

function makePolicy(): CanaryPolicy {
  return {
    $schema: 'terrafusion.autonomy.canary.policy.v1',
    $version: '4N32.1',
    stages: [
      {
        id: 'disabled',
        label: 'Disabled',
        blastRadius: 0,
        maxPRsPerDay: 0,
        maxAppliesPerRun: 0,
        description: 'Off',
      },
      {
        id: 'canary_1pct',
        label: 'Canary 1%',
        blastRadius: 1,
        maxPRsPerDay: 1,
        maxAppliesPerRun: 1,
        description: '1%',
      },
      {
        id: 'canary_5pct',
        label: 'Canary 5%',
        blastRadius: 5,
        maxPRsPerDay: 2,
        maxAppliesPerRun: 1,
        description: '5%',
      },
      {
        id: 'canary_10pct',
        label: 'Canary 10%',
        blastRadius: 10,
        maxPRsPerDay: 3,
        maxAppliesPerRun: 2,
        description: '10%',
      },
      {
        id: 'canary_25pct',
        label: 'Canary 25%',
        blastRadius: 25,
        maxPRsPerDay: 5,
        maxAppliesPerRun: 3,
        description: '25%',
      },
      {
        id: 'canary_50pct',
        label: 'Canary 50%',
        blastRadius: 50,
        maxPRsPerDay: 10,
        maxAppliesPerRun: 5,
        description: '50%',
      },
      {
        id: 'full',
        label: 'Full',
        blastRadius: 100,
        maxPRsPerDay: -1,
        maxAppliesPerRun: -1,
        description: 'Full',
      },
    ],
    promotionRules: {
      minSuccessfulRunsForPromotion: 3,
      minHoursAtStage: 24,
      requiredHealthLevel: 'ok',
      requiredChecks: [
        { id: 'verify_ok', description: 'Verify OK' },
        { id: 'pins_ok', description: 'Pins OK' },
      ],
      promotionCooldownHours: 24,
    },
    demotionRules: {
      immediateDemotionTriggers: [
        {
          condition: "health.level === 'pause_required'",
          demoteTo: 'disabled',
          reason: 'Critical',
        },
        {
          condition: "health.level === 'pause_recommended'",
          demoteTo: 'canary_1pct',
          reason: 'Degraded',
        },
        { condition: 'pins_failed', demoteTo: 'canary_1pct', reason: 'Pin failure' },
      ],
      autoPauseOnDemotion: true,
      demotionRequiresProof: true,
    },
    lockPolicy: {
      lockOnManualDemotion: true,
      lockDurationHours: 4,
      unlockRequiresOperatorApproval: true,
    },
    defaults: {
      initialStage: 'disabled',
      maxAutoPromotionStage: 'canary_50pct',
      fullRequiresManualApproval: true,
    },
  };
}

function makeState(overrides: Partial<CanaryState> = {}): CanaryState {
  return {
    currentStage: 'canary_1pct',
    stageEnteredAt: TWENTY_FIVE_HOURS_AGO.toISOString(),
    successfulRunsAtStage: 5,
    lastPromotionAt: null,
    lastDemotionAt: null,
    locked: false,
    lockedAt: null,
    lockedReason: null,
    lockedBy: null,
    lockExpiresAt: null,
    todayStats: {
      date: TODAY,
      prsCreated: 0,
      appliesExecuted: 0,
    },
    history: [],
    ...overrides,
  };
}

function makeHealth(
  level: 'ok' | 'warn' | 'pause_recommended' | 'pause_required' = 'ok'
): AutonomyHealth {
  return {
    schema: 'terrafusion.autonomy.health.v1',
    toolVersion: '4N30.1',
    generatedAt: NOW.toISOString(),
    window: {
      recordCount: 10,
      windowStart: TWENTY_FIVE_HOURS_AGO.toISOString(),
      windowEnd: NOW.toISOString(),
    },
    decision: {
      level,
      reason: `Health is ${level}`,
    },
    failuresByCategory: {},
    successRate: {
      total: 10,
      ok: 9,
      failed: 1,
      rate: 90,
    },
    thresholds: {
      warnRateBelow: 90,
      pauseRecommendedRateBelow: 75,
      pauseRequiredRateBelow: 60,
      pauseRequiredOnFailures: ['break_glass_failed'],
    },
  };
}

function makeRecords(count: number = 5, allOk: boolean = true): EvidenceRecordForHealth[] {
  const records: EvidenceRecordForHealth[] = [];
  for (let i = 0; i < count; i++) {
    records.push({
      runId: `run-${i}`,
      generatedAt: new Date(NOW.getTime() - i * 3600000).toISOString(),
      tier: 'ci',
      verify: { ok: allOk, strict: allOk },
      signature: { signed: true, verified: { ok: true }, pinned: allOk },
      rekor: { anchored: allOk },
      tpi: { ok: allOk },
    });
  }
  return records;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contract: Stage Ordering
// ─────────────────────────────────────────────────────────────────────────────

describe('4N32 Contract: Stage Ordering', () => {
  it('should have correct stage order', () => {
    assert.strictEqual(getStageIndex('disabled'), 0);
    assert.strictEqual(getStageIndex('canary_1pct'), 1);
    assert.strictEqual(getStageIndex('canary_5pct'), 2);
    assert.strictEqual(getStageIndex('canary_10pct'), 3);
    assert.strictEqual(getStageIndex('canary_25pct'), 4);
    assert.strictEqual(getStageIndex('canary_50pct'), 5);
    assert.strictEqual(getStageIndex('full'), 6);
  });

  it('should get next stage correctly', () => {
    assert.strictEqual(getNextStage('disabled'), 'canary_1pct');
    assert.strictEqual(getNextStage('canary_1pct'), 'canary_5pct');
    assert.strictEqual(getNextStage('canary_50pct'), 'full');
    assert.strictEqual(getNextStage('full'), null);
  });

  it('should get previous stage correctly', () => {
    assert.strictEqual(getPreviousStage('disabled'), null);
    assert.strictEqual(getPreviousStage('canary_1pct'), 'disabled');
    assert.strictEqual(getPreviousStage('full'), 'canary_50pct');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract: Promotion Eligibility
// ─────────────────────────────────────────────────────────────────────────────

describe('4N32 Contract: Promotion Eligibility', () => {
  it('should be eligible when all criteria met', () => {
    const policy = makePolicy();
    const state = makeState({
      stageEnteredAt: TWENTY_FIVE_HOURS_AGO.toISOString(),
      successfulRunsAtStage: 5,
    });
    const health = makeHealth('ok');
    const records = makeRecords(5, true);

    const eligibility = checkPromotionEligibility({ policy, state, health, records });

    assert.strictEqual(eligibility.eligible, true);
    assert.strictEqual(eligibility.currentStage, 'canary_1pct');
    assert.strictEqual(eligibility.targetStage, 'canary_5pct');
    assert.deepStrictEqual(eligibility.blockers, []);
  });

  it('should not be eligible when locked', () => {
    const policy = makePolicy();
    const state = makeState({ locked: true, lockedReason: 'maintenance' });
    const health = makeHealth('ok');
    const records = makeRecords(5, true);

    const eligibility = checkPromotionEligibility({ policy, state, health, records });

    assert.strictEqual(eligibility.eligible, false);
    assert.ok(eligibility.blockers.some(b => b.includes('locked')));
  });

  it('should not be eligible when not enough time at stage', () => {
    const policy = makePolicy();
    const state = makeState({
      stageEnteredAt: ONE_HOUR_AGO.toISOString(), // Only 1 hour ago
    });
    const health = makeHealth('ok');
    const records = makeRecords(5, true);

    const eligibility = checkPromotionEligibility({ policy, state, health, records });

    assert.strictEqual(eligibility.eligible, false);
    assert.ok(eligibility.blockers.some(b => b.includes('at stage')));
  });

  it('should not be eligible when not enough successful runs', () => {
    const policy = makePolicy();
    const state = makeState({
      successfulRunsAtStage: 1, // Only 1 run
    });
    const health = makeHealth('ok');
    const records = makeRecords(5, true);

    const eligibility = checkPromotionEligibility({ policy, state, health, records });

    assert.strictEqual(eligibility.eligible, false);
    assert.ok(eligibility.blockers.some(b => b.includes('run')));
  });

  it('should not be eligible when health is not ok', () => {
    const policy = makePolicy();
    const state = makeState();
    const health = makeHealth('warn');
    const records = makeRecords(5, true);

    const eligibility = checkPromotionEligibility({ policy, state, health, records });

    assert.strictEqual(eligibility.eligible, false);
    assert.ok(eligibility.blockers.some(b => b.includes('Health')));
  });

  it('should not be eligible when already at full stage', () => {
    const policy = makePolicy();
    const state = makeState({ currentStage: 'full' });
    const health = makeHealth('ok');
    const records = makeRecords(5, true);

    const eligibility = checkPromotionEligibility({ policy, state, health, records });

    assert.strictEqual(eligibility.eligible, false);
    assert.ok(eligibility.blockers.some(b => b.includes('maximum')));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract: Promotion Determinism
// ─────────────────────────────────────────────────────────────────────────────

describe('4N32 Contract: Promotion Determinism', () => {
  it('should produce identical proofs for identical inputs (10x)', () => {
    const policy = makePolicy();
    const state = makeState();
    const health = makeHealth('ok');
    const records = makeRecords(5, true);

    const proofs: PromotionProof[] = [];
    for (let i = 0; i < 10; i++) {
      const result = promote({
        policy,
        state: { ...state },
        health,
        records,
        actor: 'test-actor',
        command: 'test-command',
        dryRun: true,
      });
      proofs.push(result.proof);
    }

    // All proofs should have same decision
    const decisions = new Set(proofs.map(p => p.decision));
    assert.strictEqual(decisions.size, 1, 'All proofs should have identical decisions');

    // All proofs should have same eligibility
    const eligibilities = new Set(proofs.map(p => JSON.stringify(p.eligibility.blockers)));
    assert.strictEqual(eligibilities.size, 1, 'All proofs should have identical eligibility');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract: Demotion Triggers
// ─────────────────────────────────────────────────────────────────────────────

describe('4N32 Contract: Demotion Triggers', () => {
  it('should trigger demotion on pause_required health', () => {
    const policy = makePolicy();
    const state = makeState({ currentStage: 'canary_25pct' });
    const health = makeHealth('pause_required');
    const records = makeRecords(5, true);

    const check = checkDemotion({ policy, state, health, records });

    assert.strictEqual(check.shouldDemote, true);
    assert.strictEqual(check.targetStage, 'disabled');
    assert.ok(check.trigger);
    assert.strictEqual(check.trigger.condition.includes('pause_required'), true);
  });

  it('should trigger demotion on pause_recommended health', () => {
    const policy = makePolicy();
    const state = makeState({ currentStage: 'canary_25pct' });
    const health = makeHealth('pause_recommended');
    const records = makeRecords(5, true);

    const check = checkDemotion({ policy, state, health, records });

    assert.strictEqual(check.shouldDemote, true);
    assert.strictEqual(check.targetStage, 'canary_1pct');
  });

  it('should trigger demotion on pin failure', () => {
    const policy = makePolicy();
    const state = makeState({ currentStage: 'canary_25pct' });
    const health = makeHealth('ok');
    // Set pin failure in one of the last 3 records (slice(-3) checks indices -3, -2, -1)
    const records = makeRecords(5, true);
    records[3].signature = { signed: true, verified: { ok: true }, pinned: false };

    const check = checkDemotion({ policy, state, health, records });

    assert.strictEqual(check.shouldDemote, true);
    assert.strictEqual(check.targetStage, 'canary_1pct');
  });

  it('should not trigger demotion when healthy', () => {
    const policy = makePolicy();
    const state = makeState();
    const health = makeHealth('ok');
    const records = makeRecords(5, true);

    const check = checkDemotion({ policy, state, health, records });

    assert.strictEqual(check.shouldDemote, false);
    assert.strictEqual(check.trigger, null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract: Rate Limiting
// ─────────────────────────────────────────────────────────────────────────────

describe('4N32 Contract: Rate Limiting', () => {
  it('should allow when within rate limits', () => {
    const policy = makePolicy();
    const state = makeState({
      currentStage: 'canary_1pct',
      todayStats: { date: TODAY, prsCreated: 0, appliesExecuted: 0 },
    });

    const check = checkRateLimit({ policy, state, requestedApplies: 1 });

    assert.strictEqual(check.allowed, true);
    assert.deepStrictEqual(check.blockers, []);
  });

  it('should block when daily PR limit reached', () => {
    const policy = makePolicy();
    const state = makeState({
      currentStage: 'canary_1pct',
      todayStats: { date: TODAY, prsCreated: 1, appliesExecuted: 0 },
    });

    const check = checkRateLimit({ policy, state, requestedApplies: 1 });

    assert.strictEqual(check.allowed, false);
    assert.ok(check.blockers.some(b => b.includes('limit')));
  });

  it('should block when applies per run exceeded', () => {
    const policy = makePolicy();
    const state = makeState({
      currentStage: 'canary_1pct',
      todayStats: { date: TODAY, prsCreated: 0, appliesExecuted: 0 },
    });

    // Requesting 5 applies but max is 1
    const check = checkRateLimit({ policy, state, requestedApplies: 5 });

    assert.strictEqual(check.allowed, false);
    assert.ok(check.blockers.some(b => b.includes('run limit')));
  });

  it('should block when locked', () => {
    const policy = makePolicy();
    const state = makeState({
      locked: true,
      lockedReason: 'maintenance',
    });

    const check = checkRateLimit({ policy, state, requestedApplies: 1 });

    assert.strictEqual(check.allowed, false);
    assert.ok(check.blockers.some(b => b.includes('locked')));
  });

  it('should block when disabled', () => {
    const policy = makePolicy();
    const state = makeState({ currentStage: 'disabled' });

    const check = checkRateLimit({ policy, state, requestedApplies: 1 });

    assert.strictEqual(check.allowed, false);
    assert.ok(check.blockers.some(b => b.includes('blast radius')));
  });

  it('should allow unlimited at full stage', () => {
    const policy = makePolicy();
    const state = makeState({
      currentStage: 'full',
      todayStats: { date: TODAY, prsCreated: 100, appliesExecuted: 50 },
    });

    const check = checkRateLimit({ policy, state, requestedApplies: 100 });

    assert.strictEqual(check.allowed, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract: Lock/Unlock
// ─────────────────────────────────────────────────────────────────────────────

describe('4N32 Contract: Lock/Unlock', () => {
  it('should lock correctly', () => {
    const policy = makePolicy();
    const state = makeState();

    const newState = lock({
      state,
      policy,
      actor: 'test-actor',
      reason: 'maintenance',
    });

    assert.strictEqual(newState.locked, true);
    assert.strictEqual(newState.lockedReason, 'maintenance');
    assert.strictEqual(newState.lockedBy, 'test-actor');
    assert.ok(newState.lockedAt);
    assert.ok(newState.lockExpiresAt);
    assert.strictEqual(newState.history.length, 1);
    assert.strictEqual(newState.history[0].action, 'lock');
  });

  it('should unlock correctly', () => {
    const state = makeState({
      locked: true,
      lockedAt: NOW.toISOString(),
      lockedReason: 'maintenance',
      lockedBy: 'admin',
      lockExpiresAt: new Date(NOW.getTime() + 4 * 3600000).toISOString(),
    });

    const newState = unlock(state, 'test-actor', 'maintenance complete');

    assert.strictEqual(newState.locked, false);
    assert.strictEqual(newState.lockedReason, null);
    assert.strictEqual(newState.lockedBy, null);
    assert.strictEqual(newState.lockedAt, null);
    assert.strictEqual(newState.lockExpiresAt, null);
    assert.strictEqual(newState.history.length, 1);
    assert.strictEqual(newState.history[0].action, 'unlock');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract: Activity Recording
// ─────────────────────────────────────────────────────────────────────────────

describe('4N32 Contract: Activity Recording', () => {
  it('should increment successful runs on success', () => {
    const state = makeState({ successfulRunsAtStage: 5 });

    const newState = recordActivity(state, 1, 1, true);

    assert.strictEqual(newState.successfulRunsAtStage, 6);
    assert.strictEqual(newState.todayStats.prsCreated, 1);
    assert.strictEqual(newState.todayStats.appliesExecuted, 1);
  });

  it('should not increment successful runs on failure', () => {
    const state = makeState({ successfulRunsAtStage: 5 });

    const newState = recordActivity(state, 1, 1, false);

    assert.strictEqual(newState.successfulRunsAtStage, 5);
    assert.strictEqual(newState.todayStats.prsCreated, 1);
    assert.strictEqual(newState.todayStats.appliesExecuted, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract: Proof Schema
// ─────────────────────────────────────────────────────────────────────────────

describe('4N32 Contract: Proof Schema', () => {
  it('should emit correct schema and version', () => {
    const policy = makePolicy();
    const state = makeState();
    const health = makeHealth('ok');
    const records = makeRecords(5, true);

    const result = promote({
      policy,
      state,
      health,
      records,
      actor: 'test',
      command: 'test',
      dryRun: true,
    });

    assert.strictEqual(result.proof.schema, CANARY_SCHEMA);
    assert.strictEqual(result.proof.toolVersion, CANARY_TOOL_VERSION);
    assert.strictEqual(result.proof.action, 'promote');
    assert.ok(result.proof.generatedAt);
  });

  it('should emit demotion proof correctly', () => {
    const policy = makePolicy();
    const state = makeState({ currentStage: 'canary_10pct' });
    const health = makeHealth('pause_required');
    const records = makeRecords(5, true);

    const result = demote({
      policy,
      state,
      health,
      records,
      actor: 'test',
      command: 'test',
    });

    assert.strictEqual(result.proof.schema, CANARY_SCHEMA);
    assert.strictEqual(result.proof.action, 'demote');
    assert.strictEqual(result.proof.decision, 'approved');
    assert.ok(result.proof.trigger);
    assert.ok(result.proof.reason);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract: Fail-Closed Behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('4N32 Contract: Fail-Closed', () => {
  it('should deny promotion when checks fail', () => {
    const policy = makePolicy();
    const state = makeState({
      stageEnteredAt: ONE_HOUR_AGO.toISOString(), // Not enough time
      successfulRunsAtStage: 0, // Not enough runs
    });
    const health = makeHealth('warn');
    const records = makeRecords(5, false); // Failures

    const result = promote({
      policy,
      state,
      health,
      records,
      actor: 'test',
      command: 'test',
      dryRun: false,
    });

    assert.strictEqual(result.proof.decision, 'denied');
    assert.strictEqual(result.newState, null);
    assert.ok(result.proof.eligibility.blockers.length > 0);
  });

  it('should deny rate limit when disabled', () => {
    const policy = makePolicy();
    const state = makeState({ currentStage: 'disabled' });

    const check = checkRateLimit({ policy, state, requestedApplies: 1 });

    assert.strictEqual(check.allowed, false);
    assert.ok(check.blockers.length > 0);
  });
});
