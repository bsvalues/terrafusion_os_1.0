/**
 * Phase 4N50 — Ops Status Contract Tests
 * =======================================
 *
 * Tests for unified operational status snapshot.
 *
 * CONTRACTS:
 * - Reports last verification, oracle health, DR reconstitution
 * - Output is deterministic given same inputs
 * - Output is PII-safe (no raw payloads, only hashes/IDs)
 * - Includes "what to do next" if degraded
 * - Fails-closed on missing/invalid state
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    type OpsStatusInput,
    computeOpsStatus,
    OPS_STATUS_SCHEMA,
    OPS_STATUS_VERSION
} from '../src/ops/ops-status.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function createValidInput(): OpsStatusInput {
  return {
    profile: 'county',
    lastVerification: {
      ok: true,
      verifiedAt: '2026-01-31T12:00:00.000Z',
      bundleName: 'autonomy-evidence-12345.zip',
      manifestSha256: 'a'.repeat(64),
      errors: [],
    },
    lastOracleHealth: {
      ok: true,
      checkedAt: '2026-01-31T11:00:00.000Z',
      healthScore: 100,
      warnings: [],
    },
    lastDrReconstitution: {
      ok: true,
      reconstitutedAt: '2026-01-31T10:00:00.000Z',
      ledgerHeadSha256: 'b'.repeat(64),
      chunksRecovered: 5,
      durationMs: 1200,
    },
    signerEpoch: {
      epochId: 3,
      keyId: 'key-2026-01',
      revocationState: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    retentionStatus: {
      pending: 0,
      executed: 42,
      blocked: 0,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

describe('OpsStatus: Schema & Version', () => {
  it('exports OPS_STATUS_SCHEMA', () => {
    assert.equal(OPS_STATUS_SCHEMA, 'terrafusion.autonomy.ops-status.v1');
  });

  it('exports OPS_STATUS_VERSION matching 4N50.x', () => {
    assert.match(OPS_STATUS_VERSION, /^4N50\.\d+$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: computeOpsStatus
// ─────────────────────────────────────────────────────────────────────────────

describe('OpsStatus: computeOpsStatus', () => {
  it('status_reports_last_oracle_health_run', () => {
    const input = createValidInput();
    const result = computeOpsStatus(input);

    assert.equal(result.oracleHealth.ok, true);
    assert.equal(result.oracleHealth.checkedAt, '2026-01-31T11:00:00.000Z');
    assert.equal(result.oracleHealth.healthScore, 100);
  });

  it('status_reports_last_external_verification', () => {
    const input = createValidInput();
    const result = computeOpsStatus(input);

    assert.equal(result.verification.ok, true);
    assert.equal(result.verification.verifiedAt, '2026-01-31T12:00:00.000Z');
    assert.equal(result.verification.bundleName, 'autonomy-evidence-12345.zip');
    // SHA is included (deterministic, not PII)
    assert.equal(result.verification.manifestSha256, 'a'.repeat(64));
  });

  it('status_reports_last_dr_reconstitution', () => {
    const input = createValidInput();
    const result = computeOpsStatus(input);

    assert.equal(result.drReconstitution.ok, true);
    assert.equal(result.drReconstitution.reconstitutedAt, '2026-01-31T10:00:00.000Z');
    assert.equal(result.drReconstitution.ledgerHeadSha256, 'b'.repeat(64));
    assert.equal(result.drReconstitution.chunksRecovered, 5);
  });

  it('status_reports_signer_epoch', () => {
    const input = createValidInput();
    const result = computeOpsStatus(input);

    assert.equal(result.signerEpoch.epochId, 3);
    assert.equal(result.signerEpoch.keyId, 'key-2026-01');
    assert.equal(result.signerEpoch.revocationState, 'active');
  });

  it('status_reports_retention_status', () => {
    const input = createValidInput();
    const result = computeOpsStatus(input);

    assert.equal(result.retention.pending, 0);
    assert.equal(result.retention.executed, 42);
    assert.equal(result.retention.blocked, 0);
  });

  it('status_overall_ok_when_all_subsystems_ok', () => {
    const input = createValidInput();
    const result = computeOpsStatus(input);

    assert.equal(result.overall.ok, true);
    assert.equal(result.overall.degraded, false);
    assert.deepEqual(result.overall.degradedSubsystems, []);
  });

  it('status_overall_degraded_when_verification_fails', () => {
    const input = createValidInput();
    input.lastVerification.ok = false;
    input.lastVerification.errors = ['CASEFILE_HASH_MISMATCH'];

    const result = computeOpsStatus(input);

    assert.equal(result.overall.ok, false);
    assert.equal(result.overall.degraded, true);
    assert.ok(result.overall.degradedSubsystems.includes('verification'));
  });

  it('status_overall_degraded_when_oracle_fails', () => {
    const input = createValidInput();
    input.lastOracleHealth.ok = false;
    input.lastOracleHealth.warnings = ['oracle_stale'];

    const result = computeOpsStatus(input);

    assert.equal(result.overall.ok, false);
    assert.ok(result.overall.degradedSubsystems.includes('oracleHealth'));
  });

  it('status_overall_degraded_when_dr_fails', () => {
    const input = createValidInput();
    input.lastDrReconstitution.ok = false;

    const result = computeOpsStatus(input);

    assert.equal(result.overall.ok, false);
    assert.ok(result.overall.degradedSubsystems.includes('drReconstitution'));
  });

  it('status_overall_degraded_when_signer_revoked', () => {
    const input = createValidInput();
    input.signerEpoch.revocationState = 'revoked';

    const result = computeOpsStatus(input);

    assert.equal(result.overall.ok, false);
    assert.ok(result.overall.degradedSubsystems.includes('signerEpoch'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Determinism
// ─────────────────────────────────────────────────────────────────────────────

describe('OpsStatus: Determinism', () => {
  it('status_is_deterministic_given_same_inputs', () => {
    const input = createValidInput();

    const results: string[] = [];
    for (let i = 0; i < 10; i++) {
      const result = computeOpsStatus(input);
      // Exclude generatedAt for comparison
      const { generatedAt, ...rest } = result;
      results.push(JSON.stringify(rest));
    }

    // All results should be identical
    for (let i = 1; i < results.length; i++) {
      assert.equal(results[i], results[0]);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: PII Safety
// ─────────────────────────────────────────────────────────────────────────────

describe('OpsStatus: PII Safety', () => {
  it('status_is_pii_safe', () => {
    const input = createValidInput();
    const result = computeOpsStatus(input);
    const jsonStr = JSON.stringify(result);

    // No PII patterns in output
    const piiPatterns = [
      /email/i,
      /phone/i,
      /ssn/i,
      /password/i,
      /secret/i,
      /apiKey/i,
      /rawContent/i,
    ];

    for (const pattern of piiPatterns) {
      assert.ok(!pattern.test(jsonStr), `Output contains PII pattern: ${pattern}`);
    }
  });

  it('status_contains_only_hashes_and_ids', () => {
    const input = createValidInput();
    const result = computeOpsStatus(input);

    // Verify we have hashes (64 char hex)
    assert.match(result.verification.manifestSha256, /^[a-f0-9]{64}$/);
    assert.match(result.drReconstitution.ledgerHeadSha256, /^[a-f0-9]{64}$/);

    // Verify we have IDs, not raw content
    assert.equal(result.signerEpoch.keyId, 'key-2026-01');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Fail-Closed
// ─────────────────────────────────────────────────────────────────────────────

describe('OpsStatus: Fail-Closed', () => {
  it('fails_closed_on_missing_verification', () => {
    const input = createValidInput();
    // @ts-expect-error - Testing fail-closed behavior
    input.lastVerification = undefined;

    const result = computeOpsStatus(input);

    assert.equal(result.overall.ok, false);
    assert.ok(result.overall.degradedSubsystems.includes('verification'));
    assert.ok(result.verification.errors.includes('VERIFICATION_STATE_MISSING'));
  });

  it('fails_closed_on_missing_oracle_health', () => {
    const input = createValidInput();
    // @ts-expect-error - Testing fail-closed behavior
    input.lastOracleHealth = undefined;

    const result = computeOpsStatus(input);

    assert.equal(result.overall.ok, false);
    assert.ok(result.overall.degradedSubsystems.includes('oracleHealth'));
  });

  it('fails_closed_on_missing_dr_status', () => {
    const input = createValidInput();
    // @ts-expect-error - Testing fail-closed behavior
    input.lastDrReconstitution = undefined;

    const result = computeOpsStatus(input);

    assert.equal(result.overall.ok, false);
    assert.ok(result.overall.degradedSubsystems.includes('drReconstitution'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Runbook Hints
// ─────────────────────────────────────────────────────────────────────────────

describe('OpsStatus: Runbook Hints', () => {
  it('includes_runbook_hints_when_degraded', () => {
    const input = createValidInput();
    input.lastVerification.ok = false;
    input.lastVerification.errors = ['CASEFILE_HASH_MISMATCH'];

    const result = computeOpsStatus(input);

    assert.ok(result.runbookHints.length > 0);
    assert.ok(
      result.runbookHints.some(hint => hint.subsystem === 'verification'),
      'Should include verification runbook hint'
    );
  });

  it('no_runbook_hints_when_ok', () => {
    const input = createValidInput();
    const result = computeOpsStatus(input);

    assert.equal(result.runbookHints.length, 0);
  });

  it('runbook_hints_include_action_url', () => {
    const input = createValidInput();
    input.lastDrReconstitution.ok = false;

    const result = computeOpsStatus(input);

    const drHint = result.runbookHints.find(h => h.subsystem === 'drReconstitution');
    assert.ok(drHint, 'Should have DR runbook hint');
    assert.ok(drHint.action, 'Hint should have action');
    assert.ok(drHint.runbookPath, 'Hint should have runbook path');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Result Shape
// ─────────────────────────────────────────────────────────────────────────────

describe('OpsStatus: Result Shape', () => {
  it('returns_OpsStatusResult_contract', () => {
    const input = createValidInput();
    const result = computeOpsStatus(input);

    // Required fields
    assert.ok('$schema' in result);
    assert.ok('version' in result);
    assert.ok('profile' in result);
    assert.ok('generatedAt' in result);
    assert.ok('overall' in result);
    assert.ok('verification' in result);
    assert.ok('oracleHealth' in result);
    assert.ok('drReconstitution' in result);
    assert.ok('signerEpoch' in result);
    assert.ok('retention' in result);
    assert.ok('runbookHints' in result);

    // Schema matches
    assert.equal(result.$schema, OPS_STATUS_SCHEMA);
    assert.equal(result.version, OPS_STATUS_VERSION);
  });
});
