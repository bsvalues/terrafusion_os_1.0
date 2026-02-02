/**
 * Phase 4N45a – Key Rotation Contract Tests
 * ==========================================
 *
 * TDD-first tests for signer lifecycle governance.
 *
 * Invariants:
 *   - Signer epochs are explicit and auditable
 *   - Key rotation preserves verification continuity
 *   - Each casefile records the signer epoch at time of signing
 *   - Trust bundles are versioned and offline-verifiable
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    createSignerEpoch,
    getTrustBundleForTime,
    isSignerValidAtTime,
    rotateSignerKey,
    SIGNER_LIFECYCLE_SCHEMA,
    SIGNER_LIFECYCLE_VERSION,
    verifySignerChain,
    type SignerEpoch
} from '../src/signer-lifecycle.js';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45a – Signer Lifecycle Schema
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45a – Signer Lifecycle Schema', () => {
  it('schema matches expected version', () => {
    assert.strictEqual(SIGNER_LIFECYCLE_SCHEMA, 'terrafusion.autonomy.signer-lifecycle.v1');
  });

  it('version is 4N45.1', () => {
    assert.strictEqual(SIGNER_LIFECYCLE_VERSION, '4N45.1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45a – Signer Epoch Creation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45a – Signer Epoch Creation', () => {
  it('createSignerEpoch produces valid structure', () => {
    const epoch = createSignerEpoch({
      epochNumber: 1,
      identity: 'https://github.com/terrafusion-os/.github/workflows/release.yml@refs/heads/main',
      issuer: 'https://token.actions.githubusercontent.com',
      validFrom: '2024-01-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:abc123def456',
    });

    assert.strictEqual(epoch.epochNumber, 1);
    assert.ok(epoch.identity);
    assert.ok(epoch.issuer);
    assert.ok(epoch.validFrom);
    assert.strictEqual(epoch.revokedAt, null);
    assert.strictEqual(epoch.status, 'active');
  });

  it('epoch includes public key fingerprint', () => {
    const epoch = createSignerEpoch({
      epochNumber: 1,
      identity: 'workflow@github',
      issuer: 'https://token.actions.githubusercontent.com',
      validFrom: '2024-01-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:abc123',
    });

    assert.strictEqual(epoch.publicKeyFingerprint, 'sha256:abc123');
  });

  it('epoch numbers are sequential', () => {
    const epoch1 = createSignerEpoch({
      epochNumber: 1,
      identity: 'signer-v1',
      issuer: 'oidc-issuer',
      validFrom: '2024-01-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:key1',
    });

    const epoch2 = createSignerEpoch({
      epochNumber: 2,
      identity: 'signer-v2',
      issuer: 'oidc-issuer',
      validFrom: '2024-06-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:key2',
      previousEpochNumber: 1,
    });

    assert.strictEqual(epoch2.previousEpochNumber, 1);
    assert.ok(epoch2.epochNumber > epoch1.epochNumber);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45a – Key Rotation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45a – Key Rotation', () => {
  it('rotateSignerKey creates new epoch and retires old', () => {
    const epoch1 = createSignerEpoch({
      epochNumber: 1,
      identity: 'signer-v1@github',
      issuer: 'https://token.actions.githubusercontent.com',
      validFrom: '2024-01-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:oldkey',
    });

    const rotationResult = rotateSignerKey({
      currentEpoch: epoch1,
      newIdentity: 'signer-v2@github',
      newPublicKeyFingerprint: 'sha256:newkey',
      rotationTime: '2024-06-01T00:00:00Z',
      reason: 'Scheduled rotation',
    });

    assert.strictEqual(rotationResult.previousEpoch.status, 'retired');
    assert.strictEqual(rotationResult.previousEpoch.retiredAt, '2024-06-01T00:00:00Z');
    assert.strictEqual(rotationResult.newEpoch.epochNumber, 2);
    assert.strictEqual(rotationResult.newEpoch.status, 'active');
    assert.strictEqual(rotationResult.newEpoch.previousEpochNumber, 1);
  });

  it('rotation event is auditable', () => {
    const epoch1 = createSignerEpoch({
      epochNumber: 1,
      identity: 'signer-v1@github',
      issuer: 'https://token.actions.githubusercontent.com',
      validFrom: '2024-01-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:oldkey',
    });

    const rotationResult = rotateSignerKey({
      currentEpoch: epoch1,
      newIdentity: 'signer-v2@github',
      newPublicKeyFingerprint: 'sha256:newkey',
      rotationTime: '2024-06-01T00:00:00Z',
      reason: 'Scheduled rotation',
    });

    const event = rotationResult.rotationEvent;
    assert.strictEqual(event.type, 'rotation');
    assert.strictEqual(event.fromEpoch, 1);
    assert.strictEqual(event.toEpoch, 2);
    assert.ok(event.reason);
    assert.ok(event.timestamp);
  });

  it('rotation preserves verification continuity', () => {
    const epoch1 = createSignerEpoch({
      epochNumber: 1,
      identity: 'signer-v1@github',
      issuer: 'https://token.actions.githubusercontent.com',
      validFrom: '2024-01-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:oldkey',
    });

    const rotationResult = rotateSignerKey({
      currentEpoch: epoch1,
      newIdentity: 'signer-v2@github',
      newPublicKeyFingerprint: 'sha256:newkey',
      rotationTime: '2024-06-01T00:00:00Z',
      reason: 'Scheduled rotation',
    });

    // Old epoch should still be valid for signatures made during its active period
    assert.ok(isSignerValidAtTime(epoch1, '2024-03-01T00:00:00Z'));
    // Old epoch should NOT be valid for new signatures after rotation
    assert.ok(!isSignerValidAtTime(rotationResult.previousEpoch, '2024-07-01T00:00:00Z'));
    // New epoch should be valid after rotation
    assert.ok(isSignerValidAtTime(rotationResult.newEpoch, '2024-07-01T00:00:00Z'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45a – Trust Bundle
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45a – Trust Bundle', () => {
  it('trust bundle contains all epochs', () => {
    const epochs: SignerEpoch[] = [
      createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
      createSignerEpoch({
        epochNumber: 2,
        identity: 'signer-v2',
        issuer: 'oidc',
        validFrom: '2024-06-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key2',
        previousEpochNumber: 1,
      }),
    ];

    // Retire epoch 1
    epochs[0] = { ...epochs[0], status: 'retired', retiredAt: '2024-06-01T00:00:00Z' };

    const bundle = getTrustBundleForTime(epochs, '2024-07-01T00:00:00Z');

    assert.strictEqual(bundle.epochs.length, 2);
    assert.strictEqual(bundle.activeEpoch?.epochNumber, 2);
  });

  it('trust bundle is versioned', () => {
    const epochs: SignerEpoch[] = [
      createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
    ];

    const bundle = getTrustBundleForTime(epochs, '2024-03-01T00:00:00Z');

    assert.ok(bundle.version);
    assert.ok(bundle.generatedAt);
    assert.ok(bundle.sha256);
  });

  it('trust bundle for past time includes historical epochs', () => {
    const epochs: SignerEpoch[] = [
      createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
    ];

    // Query for a time before epoch 1
    const bundle = getTrustBundleForTime(epochs, '2023-06-01T00:00:00Z');

    // Should still include epoch 1 for reference but mark no active epoch
    assert.strictEqual(bundle.activeEpoch, null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45a – Time-Bounded Trust
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45a – Time-Bounded Trust', () => {
  it('isSignerValidAtTime returns true for active epoch', () => {
    const epoch = createSignerEpoch({
      epochNumber: 1,
      identity: 'signer-v1',
      issuer: 'oidc',
      validFrom: '2024-01-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:key1',
    });

    assert.strictEqual(isSignerValidAtTime(epoch, '2024-06-01T00:00:00Z'), true);
  });

  it('isSignerValidAtTime returns false before validFrom', () => {
    const epoch = createSignerEpoch({
      epochNumber: 1,
      identity: 'signer-v1',
      issuer: 'oidc',
      validFrom: '2024-01-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:key1',
    });

    assert.strictEqual(isSignerValidAtTime(epoch, '2023-06-01T00:00:00Z'), false);
  });

  it('isSignerValidAtTime returns false after retirement for new signatures', () => {
    const epoch = createSignerEpoch({
      epochNumber: 1,
      identity: 'signer-v1',
      issuer: 'oidc',
      validFrom: '2024-01-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:key1',
    });

    const retired = { ...epoch, status: 'retired' as const, retiredAt: '2024-06-01T00:00:00Z' };

    // Query for new signature at time after retirement
    assert.strictEqual(isSignerValidAtTime(retired, '2024-07-01T00:00:00Z'), false);
  });

  it('retired epoch is still valid for verifying old signatures', () => {
    const epoch = createSignerEpoch({
      epochNumber: 1,
      identity: 'signer-v1',
      issuer: 'oidc',
      validFrom: '2024-01-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:key1',
    });

    const retired = { ...epoch, status: 'retired' as const, retiredAt: '2024-06-01T00:00:00Z' };

    // Verifying a signature made during active period should still work
    assert.strictEqual(isSignerValidAtTime(retired, '2024-03-01T00:00:00Z'), true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45a – Signer Chain Verification
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45a – Signer Chain Verification', () => {
  it('verifySignerChain accepts valid chain', () => {
    const epochs: SignerEpoch[] = [
      {
        ...createSignerEpoch({
          epochNumber: 1,
          identity: 'signer-v1',
          issuer: 'oidc',
          validFrom: '2024-01-01T00:00:00Z',
          publicKeyFingerprint: 'sha256:key1',
        }),
        status: 'retired',
        retiredAt: '2024-06-01T00:00:00Z',
      },
      createSignerEpoch({
        epochNumber: 2,
        identity: 'signer-v2',
        issuer: 'oidc',
        validFrom: '2024-06-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key2',
        previousEpochNumber: 1,
      }),
    ];

    const result = verifySignerChain(epochs);

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('verifySignerChain rejects gap in epoch numbers', () => {
    const epochs: SignerEpoch[] = [
      createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
      createSignerEpoch({
        epochNumber: 5, // Gap!
        identity: 'signer-v5',
        issuer: 'oidc',
        validFrom: '2024-06-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key5',
        previousEpochNumber: 1,
      }),
    ];

    const result = verifySignerChain(epochs);

    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.code === 'EPOCH_GAP'));
  });

  it('verifySignerChain rejects broken previousEpochNumber link', () => {
    const epochs: SignerEpoch[] = [
      createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
      createSignerEpoch({
        epochNumber: 2,
        identity: 'signer-v2',
        issuer: 'oidc',
        validFrom: '2024-06-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key2',
        previousEpochNumber: 99, // Wrong!
      }),
    ];

    const result = verifySignerChain(epochs);

    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.code === 'CHAIN_LINK_BROKEN'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45a – Edge Cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45a – Signer Lifecycle Edge Cases', () => {
  it('single epoch chain is valid', () => {
    const epochs: SignerEpoch[] = [
      createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
    ];

    const result = verifySignerChain(epochs);
    assert.strictEqual(result.ok, true);
  });

  it('empty epoch list fails', () => {
    const result = verifySignerChain([]);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.code === 'NO_EPOCHS'));
  });

  it('trust bundle for exact validFrom time includes that epoch', () => {
    const epochs: SignerEpoch[] = [
      createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
    ];

    const bundle = getTrustBundleForTime(epochs, '2024-01-01T00:00:00Z');
    assert.strictEqual(bundle.activeEpoch?.epochNumber, 1);
  });
});
