/**
 * Phase 4N45b – Revocation Contract Tests
 * ========================================
 *
 * TDD-first tests for signer revocation semantics.
 *
 * Invariants:
 *   - Revoked signer fails all new verification
 *   - Historic verification remains explainable (time-bounded trust)
 *   - Revocation is append-only (recorded, never deleted)
 *   - Revocation includes reason and proof
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    createSignerEpoch,
    isSignerValidAtTime,
    type SignerEpoch
} from '../src/signer-lifecycle.js';

import {
    canExplainHistoricSignature,
    getRevocationReason,
    isRevoked,
    REVOCATION_SCHEMA,
    REVOCATION_VERSION,
    revokeSignerEpoch,
    verifySignatureWithRevocationCheck
} from '../src/revocation.js';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45b – Revocation Schema
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45b – Revocation Schema', () => {
  it('schema matches expected version', () => {
    assert.strictEqual(REVOCATION_SCHEMA, 'terrafusion.autonomy.revocation.v1');
  });

  it('version is 4N45.1', () => {
    assert.strictEqual(REVOCATION_VERSION, '4N45.1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45b – Signer Revocation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45b – Signer Revocation', () => {
  it('revokeSignerEpoch marks epoch as revoked', () => {
    const epoch = createSignerEpoch({
      epochNumber: 1,
      identity: 'signer-v1@github',
      issuer: 'https://token.actions.githubusercontent.com',
      validFrom: '2024-01-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:key1',
    });

    const result = revokeSignerEpoch({
      epoch,
      revocationTime: '2024-06-01T00:00:00Z',
      reason: 'Key compromise detected',
      revokedBy: 'security-admin@terrafusion.gov',
    });

    assert.strictEqual(result.revokedEpoch.status, 'revoked');
    assert.strictEqual(result.revokedEpoch.revokedAt, '2024-06-01T00:00:00Z');
    assert.strictEqual(result.revokedEpoch.revocationReason, 'Key compromise detected');
  });

  it('revocation record is auditable', () => {
    const epoch = createSignerEpoch({
      epochNumber: 1,
      identity: 'signer-v1@github',
      issuer: 'https://token.actions.githubusercontent.com',
      validFrom: '2024-01-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:key1',
    });

    const result = revokeSignerEpoch({
      epoch,
      revocationTime: '2024-06-01T00:00:00Z',
      reason: 'Key compromise',
      revokedBy: 'security-admin',
    });

    assert.ok(result.revocationRecord);
    assert.strictEqual(result.revocationRecord.epochNumber, 1);
    assert.ok(result.revocationRecord.timestamp);
    assert.ok(result.revocationRecord.reason);
    assert.ok(result.revocationRecord.revokedBy);
    assert.ok(result.revocationRecord.recordHash); // For immutability
  });

  it('revoked epoch cannot be rotated', () => {
    const epoch = createSignerEpoch({
      epochNumber: 1,
      identity: 'signer-v1@github',
      issuer: 'https://token.actions.githubusercontent.com',
      validFrom: '2024-01-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:key1',
    });

    const result = revokeSignerEpoch({
      epoch,
      revocationTime: '2024-06-01T00:00:00Z',
      reason: 'Key compromise',
      revokedBy: 'admin',
    });

    // Attempting to use revoked epoch for anything should fail
    assert.strictEqual(result.revokedEpoch.status, 'revoked');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45b – Revocation State Queries
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45b – Revocation State Queries', () => {
  it('isRevoked returns true for revoked epoch', () => {
    const epoch: SignerEpoch = {
      ...createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
      status: 'revoked',
      revokedAt: '2024-06-01T00:00:00Z',
      revocationReason: 'Compromised',
    };

    assert.strictEqual(isRevoked(epoch), true);
  });

  it('isRevoked returns false for active epoch', () => {
    const epoch = createSignerEpoch({
      epochNumber: 1,
      identity: 'signer-v1',
      issuer: 'oidc',
      validFrom: '2024-01-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:key1',
    });

    assert.strictEqual(isRevoked(epoch), false);
  });

  it('isRevoked returns false for retired epoch', () => {
    const epoch: SignerEpoch = {
      ...createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
      status: 'retired',
      retiredAt: '2024-06-01T00:00:00Z',
    };

    assert.strictEqual(isRevoked(epoch), false);
  });

  it('getRevocationReason returns reason for revoked epoch', () => {
    const epoch: SignerEpoch = {
      ...createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
      status: 'revoked',
      revokedAt: '2024-06-01T00:00:00Z',
      revocationReason: 'Key was exposed in public repo',
    };

    assert.strictEqual(getRevocationReason(epoch), 'Key was exposed in public repo');
  });

  it('getRevocationReason returns null for non-revoked epoch', () => {
    const epoch = createSignerEpoch({
      epochNumber: 1,
      identity: 'signer-v1',
      issuer: 'oidc',
      validFrom: '2024-01-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:key1',
    });

    assert.strictEqual(getRevocationReason(epoch), null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45b – Revoked Signer Verification
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45b – Revoked Signer Verification', () => {
  it('revoked signer fails new verification', () => {
    const epoch: SignerEpoch = {
      ...createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
      status: 'revoked',
      revokedAt: '2024-06-01T00:00:00Z',
      revocationReason: 'Compromised',
    };

    const result = verifySignatureWithRevocationCheck({
      epoch,
      signatureTime: '2024-07-01T00:00:00Z', // After revocation
      verificationTime: '2024-07-15T00:00:00Z',
    });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.error?.code, 'SIGNER_REVOKED');
  });

  it('historic signature by revoked signer is explainable', () => {
    const epoch: SignerEpoch = {
      ...createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
      status: 'revoked',
      revokedAt: '2024-06-01T00:00:00Z',
      revocationReason: 'Compromised',
    };

    // Signature made before revocation
    const explanation = canExplainHistoricSignature({
      epoch,
      signatureTime: '2024-03-01T00:00:00Z', // Before revocation
    });

    assert.strictEqual(explanation.explainable, true);
    assert.strictEqual(explanation.wasValidAtSigningTime, true);
    assert.strictEqual(explanation.currentEpochStatus, 'revoked');
    assert.ok(explanation.explanation.includes('valid at the time of signing'));
  });

  it('signature before epoch started is not explainable', () => {
    const epoch: SignerEpoch = {
      ...createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
      status: 'revoked',
      revokedAt: '2024-06-01T00:00:00Z',
      revocationReason: 'Compromised',
    };

    // Signature claimed to be made before epoch started
    const explanation = canExplainHistoricSignature({
      epoch,
      signatureTime: '2023-06-01T00:00:00Z', // Before epoch started
    });

    assert.strictEqual(explanation.explainable, false);
    assert.strictEqual(explanation.wasValidAtSigningTime, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45b – Time-Bounded Trust with Revocation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45b – Time-Bounded Trust with Revocation', () => {
  it('pre-revocation signatures remain cryptographically valid', () => {
    const epoch: SignerEpoch = {
      ...createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
      status: 'revoked',
      revokedAt: '2024-06-01T00:00:00Z',
      revocationReason: 'Compromised',
    };

    // Check validity AT signing time (before revocation)
    const wasValidAtSigningTime = isSignerValidAtTime(epoch, '2024-03-01T00:00:00Z');
    assert.strictEqual(wasValidAtSigningTime, true);
  });

  it('post-revocation time shows epoch as invalid', () => {
    const epoch: SignerEpoch = {
      ...createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
      status: 'revoked',
      revokedAt: '2024-06-01T00:00:00Z',
      revocationReason: 'Compromised',
    };

    const isValidNow = isSignerValidAtTime(epoch, '2024-07-01T00:00:00Z');
    assert.strictEqual(isValidNow, false);
  });

  it('verification result includes time-bounded trust explanation', () => {
    const epoch: SignerEpoch = {
      ...createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
      status: 'revoked',
      revokedAt: '2024-06-01T00:00:00Z',
      revocationReason: 'Compromised',
    };

    const result = verifySignatureWithRevocationCheck({
      epoch,
      signatureTime: '2024-03-01T00:00:00Z', // Before revocation
      verificationTime: '2024-07-15T00:00:00Z', // After revocation
    });

    // Historic signature verification should succeed with warning
    assert.strictEqual(result.ok, true);
    assert.ok(result.warnings?.some(w => w.includes('revoked')));
    assert.strictEqual(result.timeBoundedTrust, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45b – Revocation Edge Cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45b – Revocation Edge Cases', () => {
  it('cannot revoke already-revoked epoch', () => {
    const epoch: SignerEpoch = {
      ...createSignerEpoch({
        epochNumber: 1,
        identity: 'signer-v1',
        issuer: 'oidc',
        validFrom: '2024-01-01T00:00:00Z',
        publicKeyFingerprint: 'sha256:key1',
      }),
      status: 'revoked',
      revokedAt: '2024-06-01T00:00:00Z',
      revocationReason: 'Already revoked',
    };

    const result = revokeSignerEpoch({
      epoch,
      revocationTime: '2024-07-01T00:00:00Z',
      reason: 'Trying to revoke again',
      revokedBy: 'admin',
    });

    assert.strictEqual(result.alreadyRevoked, true);
    assert.strictEqual(result.revokedEpoch.revokedAt, '2024-06-01T00:00:00Z'); // Unchanged
  });

  it('revocation before validFrom is rejected', () => {
    const epoch = createSignerEpoch({
      epochNumber: 1,
      identity: 'signer-v1',
      issuer: 'oidc',
      validFrom: '2024-06-01T00:00:00Z', // Starts June
      publicKeyFingerprint: 'sha256:key1',
    });

    const result = revokeSignerEpoch({
      epoch,
      revocationTime: '2024-01-01T00:00:00Z', // Before start
      reason: 'Invalid time',
      revokedBy: 'admin',
    });

    assert.strictEqual(result.error?.code, 'REVOCATION_TIME_INVALID');
  });

  it('revocation reason is required', () => {
    const epoch = createSignerEpoch({
      epochNumber: 1,
      identity: 'signer-v1',
      issuer: 'oidc',
      validFrom: '2024-01-01T00:00:00Z',
      publicKeyFingerprint: 'sha256:key1',
    });

    const result = revokeSignerEpoch({
      epoch,
      revocationTime: '2024-06-01T00:00:00Z',
      reason: '', // Empty
      revokedBy: 'admin',
    });

    assert.strictEqual(result.error?.code, 'REASON_REQUIRED');
  });
});
