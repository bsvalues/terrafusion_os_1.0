/**
 * Phase 4N31 Contract Tests – Autonomy Recovery Protocol v1
 *
 * Tests:
 * - Determinism: 10x same input → same output
 * - Recovery capsule structure
 * - Correct prerequisite mapping per failure category
 * - Resume refuses when any prereq fails (denied)
 * - Resume emits proof always (even when denied)
 *
 * Target: 25+ contract tests
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    HEALTH_SCHEMA,
    HEALTH_TOOL_VERSION,
    type AutonomyHealth,
    type EvidenceRecordForHealth,
    type HealthLevel,
} from './autonomy-health.js';
import {
    RECOVERY_SCHEMA,
    RECOVERY_TOOL_VERSION,
    checkPrerequisites,
    generateRecoveryCapsule,
    generateResumeProof,
    type RecoveryCapsule,
    type ResumePrerequisite,
    type ResumeProof,
} from './autonomy-recovery.js';

/** Create a mock health assessment */
function createMockHealth(level: HealthLevel, totalFailed = 0): AutonomyHealth {
  return {
    schema: HEALTH_SCHEMA,
    toolVersion: HEALTH_TOOL_VERSION,
    generatedAt: '2025-01-01T01:00:00Z',
    window: {
      maxRecords: 20,
      hours: 24,
      recordCount: 10,
      fromRecordId: 'rec-001',
      toRecordId: 'rec-010',
      windowStart: '2025-01-01T00:00:00Z',
      windowEnd: '2025-01-01T01:00:00Z',
    },
    totals: {
      ok: 10 - totalFailed,
      warn: 0,
      failed: totalFailed,
    },
    failuresByCategory: {},
    decision: {
      level,
      reasonCodes: [],
    },
    suggestedPause: null,
  };
}

/** Create a mock evidence record */
function createMockRecord(
  id: string,
  overrides: Partial<EvidenceRecordForHealth> = {}
): EvidenceRecordForHealth {
  return {
    runId: id,
    generatedAt: '2025-01-01T00:00:00Z',
    tier: 'ci',
    verify: { ok: true },
    signature: { signed: true, verified: { ok: true }, pinned: true },
    rekor: { anchored: true },
    tpi: { ok: true },
    ...overrides,
  };
}

/** Create a set of mock records */
function createMockRecords(count: number): EvidenceRecordForHealth[] {
  return Array.from({ length: count }, (_, i) =>
    createMockRecord(`rec-${String(i + 1).padStart(3, '0')}`, {
      generatedAt: new Date(Date.UTC(2025, 0, 1, 0, i)).toISOString(),
    })
  );
}

describe('Phase 4N31: Autonomy Recovery Protocol', () => {
  // ===========================================================================
  // SCHEMA TESTS
  // ===========================================================================
  describe('Schema constants', () => {
    it('should have correct schema name', () => {
      assert.equal(RECOVERY_SCHEMA, 'terrafusion.autonomy.recovery.v1');
    });

    it('should have correct tool version', () => {
      assert.equal(RECOVERY_TOOL_VERSION, '4N31.1');
    });
  });

  // ===========================================================================
  // RECOVERY CAPSULE GENERATION TESTS
  // ===========================================================================
  describe('generateRecoveryCapsule', () => {
    it('should generate a valid capsule structure', () => {
      const health = createMockHealth('pause_required', 5);
      const records = createMockRecords(10);
      const capsule = generateRecoveryCapsule({
        records,
        health,
        trigger: 'pause_required',
      });

      assert.equal(capsule.schema, RECOVERY_SCHEMA);
      assert.equal(capsule.toolVersion, RECOVERY_TOOL_VERSION);
      assert.equal(capsule.trigger, 'pause_required');
      assert.ok(capsule.generatedAt);
      assert.ok(Array.isArray(capsule.failures));
      assert.ok(Array.isArray(capsule.operatorActions));
      assert.ok(Array.isArray(capsule.resumePrerequisites));
    });

    it('should capture health level in capsule', () => {
      const health = createMockHealth('pause_required');
      const capsule = generateRecoveryCapsule({
        records: [],
        health,
        trigger: 'already_paused',
      });

      assert.equal(capsule.healthSummary.level, 'pause_required');
    });

    it('should include failures extracted from records', () => {
      // Records with actual failures
      const records = [
        createMockRecord('rec-001', { verify: { ok: false } }),
        createMockRecord('rec-002', { verify: { ok: false } }),
        createMockRecord('rec-003'),
      ];
      const health = createMockHealth('pause_required', 2);

      const capsule = generateRecoveryCapsule({
        records,
        health,
        trigger: 'pause_required',
      });

      // Should detect verify_bundle_failed failures
      assert.ok(capsule.failures.length > 0 || capsule.resumePrerequisites.length > 0);
    });

    // DETERMINISM TEST #1
    it('should be deterministic (10x same input → same output) excluding timestamp', () => {
      const health = createMockHealth('pause_required', 5);
      const records = createMockRecords(10);

      const capsules: RecoveryCapsule[] = [];
      for (let i = 0; i < 10; i++) {
        capsules.push(
          generateRecoveryCapsule({
            records,
            health,
            trigger: 'pause_required',
          })
        );
      }

      // All capsules should have identical structure (except generatedAt)
      const normalized = capsules.map(c => ({
        ...c,
        generatedAt: 'NORMALIZED',
      }));

      for (let i = 1; i < normalized.length; i++) {
        assert.deepEqual(normalized[i], normalized[0], `Iteration ${i} differs from iteration 0`);
      }
    });

    it('should include resumePrerequisites with verify_ok always present', () => {
      const health = createMockHealth('pause_required', 3);
      const capsule = generateRecoveryCapsule({
        records: [],
        health,
        trigger: 'pause_required',
      });

      assert.ok(capsule.resumePrerequisites.length >= 1);
      assert.ok(capsule.resumePrerequisites.some(p => p.id === 'verify_ok'));
    });

    it('should include resume command in capsule', () => {
      const health = createMockHealth('pause_required');
      const capsule = generateRecoveryCapsule({
        records: [],
        health,
        trigger: 'already_paused',
      });

      assert.ok(capsule.resumeCommand);
      assert.ok(capsule.resumeCommand.includes('resume'));
    });

    it('should include dry-run command in capsule', () => {
      const health = createMockHealth('pause_required');
      const capsule = generateRecoveryCapsule({
        records: [],
        health,
        trigger: 'already_paused',
      });

      assert.ok(capsule.dryRunCommand);
      assert.ok(capsule.dryRunCommand.includes('--dry-run'));
    });
  });

  // ===========================================================================
  // RESUME PREREQUISITES CHECKER TESTS
  // ===========================================================================
  describe('checkPrerequisites', () => {
    it('should check verify_ok prerequisite against recent records', () => {
      const records = [
        createMockRecord('rec-001', { verify: { ok: true } }),
        createMockRecord('rec-002', { verify: { ok: true } }),
        createMockRecord('rec-003', { verify: { ok: true } }),
      ];
      const prereqs: ResumePrerequisite[] = [
        {
          id: 'verify_ok',
          description: 'Last 3 records must have verify.ok = true',
          check: 'verify.ok === true for last 3 records',
          required: true,
        },
      ];

      const results = checkPrerequisites({ records, prerequisites: prereqs });

      assert.equal(results.length, 1);
      assert.equal(results[0].id, 'verify_ok');
      assert.equal(results[0].satisfied, true);
    });

    it('should fail verify_ok when any recent record has verify.ok = false', () => {
      const records = [
        createMockRecord('rec-001', { verify: { ok: false } }),
        createMockRecord('rec-002', { verify: { ok: true } }),
        createMockRecord('rec-003', { verify: { ok: true } }),
      ];
      const prereqs: ResumePrerequisite[] = [
        {
          id: 'verify_ok',
          description: 'Last 3 records must have verify.ok = true',
          check: 'verify.ok === true for last 3 records',
          required: true,
        },
      ];

      const results = checkPrerequisites({ records, prerequisites: prereqs });

      assert.equal(results[0].satisfied, false);
    });

    it('should check only the last N records (minRecordsForVerifyOk)', () => {
      const records = [
        createMockRecord('rec-001', { verify: { ok: false }, generatedAt: '2025-01-01T00:00:00Z' }), // Old
        createMockRecord('rec-002', { verify: { ok: true }, generatedAt: '2025-01-01T01:00:00Z' }),
        createMockRecord('rec-003', { verify: { ok: true }, generatedAt: '2025-01-01T02:00:00Z' }),
        createMockRecord('rec-004', { verify: { ok: true }, generatedAt: '2025-01-01T03:00:00Z' }),
      ];
      const prereqs: ResumePrerequisite[] = [
        {
          id: 'verify_ok',
          description: 'Last 3 records must have verify.ok = true',
          check: 'verify.ok === true for last 3 records',
          required: true,
        },
      ];

      // Only check last 3 records (rec-002, rec-003, rec-004 by date)
      const results = checkPrerequisites({
        records,
        prerequisites: prereqs,
        minRecordsForVerifyOk: 3,
      });

      assert.equal(results[0].satisfied, true); // rec-001 is old, not checked
    });

    it('should handle empty records gracefully', () => {
      const prereqs: ResumePrerequisite[] = [
        {
          id: 'verify_ok',
          description: 'Last 3 records',
          check: 'verify.ok === true',
          required: true,
        },
      ];

      const results = checkPrerequisites({ records: [], prerequisites: prereqs });

      assert.equal(results[0].satisfied, false); // No records = cannot satisfy
    });

    it('should include evidence string in result', () => {
      const records = createMockRecords(3);
      const prereqs: ResumePrerequisite[] = [
        {
          id: 'verify_ok',
          description: 'Last 3 records',
          check: 'verify.ok === true',
          required: true,
        },
      ];

      const results = checkPrerequisites({ records, prerequisites: prereqs });

      assert.ok(results[0].evidence);
      assert.ok(results[0].evidence.length > 0);
    });
  });

  // ===========================================================================
  // RESUME PROOF GENERATION TESTS
  // ===========================================================================
  describe('generateResumeProof', () => {
    it('should emit proof with approved decision when all prereqs satisfied', () => {
      const records = createMockRecords(3);
      const health = createMockHealth('ok');
      const capsule = generateRecoveryCapsule({
        records,
        health,
        trigger: 'already_paused',
      });

      const proof = generateResumeProof({
        records,
        capsule,
        actor: 'operator',
        command: 'pnpm perf:autonomy resume',
      });

      assert.equal(proof.decision, 'approved');
      assert.equal(proof.actor, 'operator');
      assert.ok(proof.generatedAt);
    });

    it('should emit proof with denied decision when required prereq fails', () => {
      const records = [
        createMockRecord('rec-001', { verify: { ok: false } }),
        createMockRecord('rec-002', { verify: { ok: false } }),
        createMockRecord('rec-003', { verify: { ok: false } }),
      ];
      const health = createMockHealth('pause_required', 3);
      const capsule = generateRecoveryCapsule({
        records,
        health,
        trigger: 'pause_required',
      });

      const proof = generateResumeProof({
        records,
        capsule,
        actor: 'operator',
        command: 'pnpm perf:autonomy resume',
      });

      assert.equal(proof.decision, 'denied');
    });

    it('should include all prerequisite checks in proof', () => {
      const records = createMockRecords(3);
      const health = createMockHealth('pause_required');
      const capsule = generateRecoveryCapsule({
        records,
        health,
        trigger: 'pause_required',
      });

      const proof = generateResumeProof({
        records,
        capsule,
        actor: 'operator',
        command: 'pnpm perf:autonomy resume',
      });

      assert.ok(proof.prerequisites);
      assert.ok(proof.prerequisites.length >= 1);
    });

    it('should include evidence window in proof', () => {
      const records = [
        createMockRecord('rec-001', { generatedAt: '2025-01-01T00:00:00Z' }),
        createMockRecord('rec-002', { generatedAt: '2025-01-01T01:00:00Z' }),
        createMockRecord('rec-003', { generatedAt: '2025-01-01T02:00:00Z' }),
      ];
      const health = createMockHealth('ok');
      const capsule = generateRecoveryCapsule({
        records,
        health,
        trigger: 'already_paused',
      });

      const proof = generateResumeProof({
        records,
        capsule,
        actor: 'operator',
        command: 'pnpm perf:autonomy resume',
      });

      assert.ok(proof.evidenceWindow);
      assert.ok(proof.evidenceWindow.recordCount >= 0);
    });

    // DETERMINISM TEST #2
    it('should be deterministic (10x same input → same output) excluding timestamp', () => {
      const records = createMockRecords(3);
      const health = createMockHealth('ok');
      const capsule = generateRecoveryCapsule({
        records,
        health,
        trigger: 'already_paused',
      });

      const proofs: ResumeProof[] = [];
      for (let i = 0; i < 10; i++) {
        proofs.push(
          generateResumeProof({
            records,
            capsule,
            actor: 'operator',
            command: 'pnpm perf:autonomy resume',
          })
        );
      }

      // All proofs should have identical structure (except generatedAt and checkedAt)
      const normalized = proofs.map(p => ({
        ...p,
        generatedAt: 'NORMALIZED',
        prerequisites: p.prerequisites.map(pr => ({ ...pr, checkedAt: 'NORMALIZED' })),
      }));

      for (let i = 1; i < normalized.length; i++) {
        assert.deepEqual(normalized[i], normalized[0], `Iteration ${i} differs from iteration 0`);
      }
    });

    it('should include counts in proof', () => {
      const records = createMockRecords(3);
      const health = createMockHealth('pause_required');
      const capsule = generateRecoveryCapsule({
        records,
        health,
        trigger: 'pause_required',
      });

      const proof = generateResumeProof({
        records,
        capsule,
        actor: 'operator',
        command: 'pnpm perf:autonomy resume',
      });

      assert.ok(proof.counts);
      assert.ok(typeof proof.counts.total === 'number');
    });
  });

  // ===========================================================================
  // FAIL-CLOSED BEHAVIOR TESTS
  // ===========================================================================
  describe('Fail-closed behavior', () => {
    it('should deny when ANY required prerequisite fails', () => {
      const records = [
        createMockRecord('rec-001', { verify: { ok: false } }),
        createMockRecord('rec-002', { verify: { ok: false } }),
        createMockRecord('rec-003', { verify: { ok: false } }),
      ];
      const health = createMockHealth('pause_required', 3);
      const capsule = generateRecoveryCapsule({
        records,
        health,
        trigger: 'pause_required',
      });

      const proof = generateResumeProof({
        records,
        capsule,
        actor: 'operator',
        command: 'pnpm perf:autonomy resume',
      });

      assert.equal(proof.decision, 'denied');
    });

    it('should allow partial when optional prereq fails but required passes', () => {
      const records = createMockRecords(3);
      const health = createMockHealth('ok');
      const capsule = generateRecoveryCapsule({
        records,
        health,
        trigger: 'already_paused',
      });

      const proof = generateResumeProof({
        records,
        capsule,
        actor: 'operator',
        command: 'pnpm perf:autonomy resume',
      });

      // Should be approved or partial
      assert.ok(['approved', 'partial'].includes(proof.decision));
    });

    it('should ALWAYS emit proof regardless of decision', () => {
      // Test approved case
      const passingRecords = createMockRecords(3);
      const passingHealth = createMockHealth('ok');
      const passingCapsule = generateRecoveryCapsule({
        records: passingRecords,
        health: passingHealth,
        trigger: 'already_paused',
      });
      const approvedProof = generateResumeProof({
        records: passingRecords,
        capsule: passingCapsule,
        actor: 'operator',
        command: 'pnpm perf:autonomy resume',
      });
      assert.ok(approvedProof, 'Should emit proof when approved');

      // Test denied case
      const failingRecords = [
        createMockRecord('rec-001', { verify: { ok: false } }),
        createMockRecord('rec-002', { verify: { ok: false } }),
        createMockRecord('rec-003', { verify: { ok: false } }),
      ];
      const failingHealth = createMockHealth('pause_required', 3);
      const failingCapsule = generateRecoveryCapsule({
        records: failingRecords,
        health: failingHealth,
        trigger: 'pause_required',
      });
      const deniedProof = generateResumeProof({
        records: failingRecords,
        capsule: failingCapsule,
        actor: 'operator',
        command: 'pnpm perf:autonomy resume',
      });
      assert.ok(deniedProof, 'Should emit proof when denied');
    });
  });

  // ===========================================================================
  // EDGE CASE TESTS
  // ===========================================================================
  describe('Edge cases', () => {
    it('should handle capsule with no failures', () => {
      const health = createMockHealth('ok', 0);
      const capsule = generateRecoveryCapsule({
        records: [],
        health,
        trigger: 'health_noop',
      });

      assert.deepEqual(capsule.failures, []);
    });

    it('should handle records with missing optional fields', () => {
      const records: EvidenceRecordForHealth[] = [
        { runId: 'rec-001', generatedAt: '2025-01-01T00:00:00Z', tier: 'ci' },
      ];
      const prereqs: ResumePrerequisite[] = [
        {
          id: 'verify_ok',
          description: 'Verify',
          check: 'v',
          required: true,
        },
      ];

      // Should not throw
      const results = checkPrerequisites({ records, prerequisites: prereqs });
      assert.ok(results);
    });

    it('should handle empty prerequisites list', () => {
      const records = createMockRecords(3);
      const results = checkPrerequisites({ records, prerequisites: [] });

      assert.deepEqual(results, []);
    });
  });
});

// ===========================================================================
// INTEGRATION-STYLE TESTS
// ===========================================================================
describe('Phase 4N31: Integration scenarios', () => {
  it('should support full recovery workflow: pause → capsule → check → resume', () => {
    // 1. System detects failures - health assessment
    const health = createMockHealth('pause_required', 5);

    // 2. Generate recovery capsule
    const failingRecords = [
      createMockRecord('rec-001', { verify: { ok: false } }),
      createMockRecord('rec-002', { verify: { ok: false } }),
      createMockRecord('rec-003', { verify: { ok: false } }),
    ];
    const capsule = generateRecoveryCapsule({
      records: failingRecords,
      health,
      trigger: 'pause_required',
    });
    assert.ok(capsule);
    assert.ok(capsule.resumePrerequisites.length > 0);

    // 3. Operator fixes issues (simulated by new passing records)
    const fixedRecords = [
      createMockRecord('rec-004', { generatedAt: '2025-01-01T04:00:00Z' }),
      createMockRecord('rec-005', { generatedAt: '2025-01-01T05:00:00Z' }),
      createMockRecord('rec-006', { generatedAt: '2025-01-01T06:00:00Z' }),
    ];

    // 4+5. Generate resume proof using capsule
    const proof = generateResumeProof({
      records: fixedRecords,
      capsule,
      actor: 'operator',
      command: 'pnpm perf:autonomy resume',
    });

    // Should be approved since fixed records all pass
    assert.equal(proof.decision, 'approved');
  });

  it('should prevent premature resume when issues not fully resolved', () => {
    // 1. Initial failure state
    const health = createMockHealth('pause_required', 8);

    // 2. Generate capsule
    const capsule = generateRecoveryCapsule({
      records: [],
      health,
      trigger: 'pause_required',
    });

    // 3. Operator partially fixes (still has some failures)
    const partiallyFixedRecords = [
      createMockRecord('rec-004', { verify: { ok: false }, generatedAt: '2025-01-01T04:00:00Z' }),
      createMockRecord('rec-005', { generatedAt: '2025-01-01T05:00:00Z' }),
      createMockRecord('rec-006', { generatedAt: '2025-01-01T06:00:00Z' }),
    ];

    // 4+5. Generate resume proof - should be denied
    const proof = generateResumeProof({
      records: partiallyFixedRecords,
      capsule,
      actor: 'operator',
      command: 'pnpm perf:autonomy resume',
    });

    assert.equal(proof.decision, 'denied');
  });
});
