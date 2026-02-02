/**
 * Phase 4N44d – Retention Policy Contract Tests
 * ==============================================
 *
 * TDD-first tests for tier-based retention automation.
 *
 * Invariants:
 *   - CI tier expires after N days (configurable)
 *   - Merged tier retains per policy
 *   - Incident tier retained indefinitely unless break-glass deletion
 *   - All deletions are recorded in the ledger (append-only)
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    computeExpiryDate,
    createDeletionIntent,
    DEFAULT_RETENTION_POLICY,
    type DeletionIntent,
    generateExpiryTargets,
    getRetentionForTier,
    isExpired,
    RETENTION_POLICY_SCHEMA,
    RETENTION_POLICY_VERSION,
    type RetentionEvent,
    type RetentionPolicy,
    type TierRetention,
    validateDeletionIntent
} from '../src/retention-policy.js';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44d – Retention Policy Schema
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44d – Retention Policy Schema', () => {
  it('schema matches expected version', () => {
    assert.strictEqual(RETENTION_POLICY_SCHEMA, 'terrafusion.autonomy.retention-policy.v1');
  });

  it('version is 4N44.1', () => {
    assert.strictEqual(RETENTION_POLICY_VERSION, '4N44.1');
  });

  it('default policy is defined for all tiers', () => {
    assert.ok(DEFAULT_RETENTION_POLICY.ci, 'ci tier missing');
    assert.ok(DEFAULT_RETENTION_POLICY.merged, 'merged tier missing');
    assert.ok(DEFAULT_RETENTION_POLICY.incident, 'incident tier missing');
  });

  it('ci tier has retentionDays defined', () => {
    assert.ok(typeof DEFAULT_RETENTION_POLICY.ci.retentionDays === 'number');
    assert.ok(DEFAULT_RETENTION_POLICY.ci.retentionDays > 0);
  });

  it('merged tier has retentionDays defined', () => {
    assert.ok(typeof DEFAULT_RETENTION_POLICY.merged.retentionDays === 'number');
    assert.ok(
      DEFAULT_RETENTION_POLICY.merged.retentionDays > DEFAULT_RETENTION_POLICY.ci.retentionDays
    );
  });

  it('incident tier is indefinite by default', () => {
    assert.strictEqual(DEFAULT_RETENTION_POLICY.incident.indefinite, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44d – CI Tier Expiry
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44d – CI Tier Expiry', () => {
  it('ci tier expiry schedule emits expected targets', () => {
    const releases = [
      { tag: 'ci-run-001', tier: 'ci' as const, createdAt: '2024-01-01T00:00:00Z' },
      { tag: 'ci-run-002', tier: 'ci' as const, createdAt: '2024-01-15T00:00:00Z' },
      { tag: 'ci-run-003', tier: 'ci' as const, createdAt: '2024-03-01T00:00:00Z' },
    ];

    const now = new Date('2024-04-01T00:00:00Z');
    const policy: RetentionPolicy = {
      ci: { retentionDays: 90, indefinite: false },
      merged: { retentionDays: 365, indefinite: false },
      incident: { retentionDays: 0, indefinite: true },
    };

    const targets = generateExpiryTargets(releases, now, policy);

    // ci-run-001: created Jan 1, expired after 90 days (Apr 1) - should be expired
    // ci-run-002: created Jan 15, expires Apr 15 - not yet expired
    // ci-run-003: created Mar 1, expires May 30 - not yet expired
    assert.strictEqual(targets.length, 1);
    assert.strictEqual(targets[0].tag, 'ci-run-001');
    assert.strictEqual(targets[0].tier, 'ci');
  });

  it('computeExpiryDate returns correct date', () => {
    const created = new Date('2024-01-01T00:00:00Z');
    const policy: TierRetention = { retentionDays: 90, indefinite: false };

    const expiry = computeExpiryDate(created, policy);

    assert.ok(expiry);
    // Allow for timezone variations - just check it's ~90 days after
    const diffDays = Math.round((expiry.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    assert.strictEqual(diffDays, 90);
  });

  it('isExpired returns true for expired releases', () => {
    const created = new Date('2024-01-01T00:00:00Z');
    const now = new Date('2024-06-01T00:00:00Z');
    const policy: TierRetention = { retentionDays: 90, indefinite: false };

    assert.strictEqual(isExpired(created, now, policy), true);
  });

  it('isExpired returns false for non-expired releases', () => {
    const created = new Date('2024-01-01T00:00:00Z');
    const now = new Date('2024-02-01T00:00:00Z');
    const policy: TierRetention = { retentionDays: 90, indefinite: false };

    assert.strictEqual(isExpired(created, now, policy), false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44d – Incident Tier Protected Deletion
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44d – Incident Tier Protected Deletion', () => {
  it('incident tier deletion requires break-glass signed intent', () => {
    const intent: DeletionIntent = {
      releaseTag: 'incident-2024-001',
      tier: 'incident',
      breakGlassFlag: false, // Not set
      reason: 'Test deletion',
      operatorId: 'admin@example.com',
      intendedAt: new Date().toISOString(),
    };

    const validation = validateDeletionIntent(intent);

    assert.strictEqual(validation.ok, false);
    assert.strictEqual(validation.error?.code, 'BREAK_GLASS_REQUIRED');
  });

  it('incident tier deletion succeeds with break-glass flag', () => {
    const intent: DeletionIntent = {
      releaseTag: 'incident-2024-001',
      tier: 'incident',
      breakGlassFlag: true,
      reason: 'Compliance requirement',
      operatorId: 'security-admin@example.com',
      intendedAt: new Date().toISOString(),
    };

    const validation = validateDeletionIntent(intent);

    assert.strictEqual(validation.ok, true);
    assert.ok(validation.intent);
  });

  it('ci tier deletion does not require break-glass', () => {
    const intent: DeletionIntent = {
      releaseTag: 'ci-run-999',
      tier: 'ci',
      breakGlassFlag: false,
      reason: 'Expired per policy',
      operatorId: 'automation',
      intendedAt: new Date().toISOString(),
    };

    const validation = validateDeletionIntent(intent);

    assert.strictEqual(validation.ok, true);
  });

  it('merged tier deletion requires reason', () => {
    const intent: DeletionIntent = {
      releaseTag: 'v1.0.0',
      tier: 'merged',
      breakGlassFlag: false,
      reason: '', // Empty reason
      operatorId: 'admin',
      intendedAt: new Date().toISOString(),
    };

    const validation = validateDeletionIntent(intent);

    assert.strictEqual(validation.ok, false);
    assert.strictEqual(validation.error?.code, 'REASON_REQUIRED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44d – Deletion Intent Artifact
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44d – Deletion Intent Artifact', () => {
  it('createDeletionIntent produces valid structure', () => {
    const intent = createDeletionIntent({
      releaseTag: 'ci-run-100',
      tier: 'ci',
      reason: 'Automatic expiry',
      operatorId: 'retention-automation',
    });

    assert.ok(intent.releaseTag);
    assert.ok(intent.tier);
    assert.ok(intent.reason);
    assert.ok(intent.operatorId);
    assert.ok(intent.intendedAt);
    assert.strictEqual(intent.breakGlassFlag, false);
  });

  it('deletion intent includes all required fields', () => {
    const intent = createDeletionIntent({
      releaseTag: 'incident-2024-001',
      tier: 'incident',
      reason: 'Legal hold expired',
      operatorId: 'legal-admin@org.gov',
      breakGlassFlag: true,
    });

    // Verify required fields for incident tier
    assert.strictEqual(intent.tier, 'incident');
    assert.strictEqual(intent.breakGlassFlag, true);
    assert.ok(intent.reason.length > 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44d – Retention Events
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44d – Retention Events', () => {
  it('expiry event is well-formed', () => {
    const event: RetentionEvent = {
      type: 'expiry',
      releaseTag: 'ci-run-001',
      tier: 'ci',
      eventAt: new Date().toISOString(),
      reason: 'Exceeded 90-day retention',
      operatorId: 'retention-automation',
    };

    assert.strictEqual(event.type, 'expiry');
    assert.ok(event.releaseTag);
    assert.ok(event.eventAt);
  });

  it('deletion event is well-formed', () => {
    const event: RetentionEvent = {
      type: 'deletion',
      releaseTag: 'incident-2024-001',
      tier: 'incident',
      eventAt: new Date().toISOString(),
      reason: 'Break-glass deletion by security-admin',
      operatorId: 'security-admin@example.com',
      breakGlassUsed: true,
    };

    assert.strictEqual(event.type, 'deletion');
    assert.strictEqual(event.breakGlassUsed, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44d – Edge Cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44d – Retention Edge Cases', () => {
  it('indefinite tier never expires', () => {
    const created = new Date('2000-01-01T00:00:00Z'); // 24+ years ago
    const now = new Date('2024-06-01T00:00:00Z');
    const policy: TierRetention = { retentionDays: 0, indefinite: true };

    assert.strictEqual(isExpired(created, now, policy), false);
  });

  it('getRetentionForTier returns correct policy', () => {
    const ciRetention = getRetentionForTier('ci');
    assert.deepStrictEqual(ciRetention, DEFAULT_RETENTION_POLICY.ci);

    const incidentRetention = getRetentionForTier('incident');
    assert.deepStrictEqual(incidentRetention, DEFAULT_RETENTION_POLICY.incident);
  });

  it('empty release list produces no targets', () => {
    const targets = generateExpiryTargets([], new Date());
    assert.strictEqual(targets.length, 0);
  });

  it('incident releases never appear in expiry targets', () => {
    const releases = [
      { tag: 'incident-001', tier: 'incident' as const, createdAt: '2000-01-01T00:00:00Z' },
    ];

    const targets = generateExpiryTargets(releases, new Date('2024-06-01T00:00:00Z'));

    assert.strictEqual(targets.length, 0);
  });
});
