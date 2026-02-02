/**
 * Phase 4N45b – Signer Revocation System
 * ======================================
 *
 * Revocation semantics for signer epochs:
 *   - Revoked signers cannot sign new evidence
 *   - Historic signatures remain cryptographically valid
 *   - Time-bounded trust explains signature provenance
 *   - Revocation records are immutable and auditable
 *
 * @module revocation
 * @version 4N45.1
 */

import { createHash } from 'node:crypto';
import type { SignerEpoch } from './signer-lifecycle.js';

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const REVOCATION_SCHEMA = 'terrafusion.autonomy.revocation.v1';
export const REVOCATION_VERSION = '4N45.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Immutable revocation record for audit trail
 */
export interface RevocationRecord {
  readonly schema: typeof REVOCATION_SCHEMA;
  readonly version: typeof REVOCATION_VERSION;
  readonly epochNumber: number;
  readonly signerIdentity: string;
  readonly timestamp: string;
  readonly reason: string;
  readonly revokedBy: string;
  readonly recordHash: string; // SHA256 of record contents
}

/**
 * Result of revoking a signer epoch
 */
export interface RevocationResult {
  readonly revokedEpoch: SignerEpoch;
  readonly revocationRecord?: RevocationRecord;
  readonly alreadyRevoked?: boolean;
  readonly error?: {
    readonly code: 'REVOCATION_TIME_INVALID' | 'REASON_REQUIRED' | 'ALREADY_REVOKED';
    readonly message: string;
  };
}

/**
 * Result of verifying a signature with revocation check
 */
export interface RevocationVerificationResult {
  readonly ok: boolean;
  readonly timeBoundedTrust?: boolean;
  readonly warnings?: readonly string[];
  readonly error?: {
    readonly code: 'SIGNER_REVOKED' | 'EPOCH_NOT_VALID';
    readonly message: string;
  };
}

/**
 * Explanation for historic signature validation
 */
export interface HistoricSignatureExplanation {
  readonly explainable: boolean;
  readonly wasValidAtSigningTime: boolean;
  readonly currentEpochStatus: 'active' | 'retired' | 'revoked';
  readonly explanation: string;
  readonly signatureTime: string;
  readonly epochValidFrom: string;
  readonly epochRevokedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Revocation Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Revoke a signer epoch
 */
export function revokeSignerEpoch(params: {
  readonly epoch: SignerEpoch;
  readonly revocationTime: string;
  readonly reason: string;
  readonly revokedBy: string;
}): RevocationResult {
  const { epoch, revocationTime, reason, revokedBy } = params;

  // Check if already revoked
  if (epoch.status === 'revoked') {
    return {
      revokedEpoch: epoch,
      alreadyRevoked: true,
    };
  }

  // Validate reason is provided
  if (!reason || reason.trim() === '') {
    return {
      revokedEpoch: epoch,
      error: {
        code: 'REASON_REQUIRED',
        message: 'Revocation reason is required for audit trail',
      },
    };
  }

  // Validate revocation time is after epoch start
  const revokeTime = new Date(revocationTime);
  const validFrom = new Date(epoch.validFrom);
  if (revokeTime < validFrom) {
    return {
      revokedEpoch: epoch,
      error: {
        code: 'REVOCATION_TIME_INVALID',
        message: `Revocation time ${revocationTime} is before epoch start ${epoch.validFrom}`,
      },
    };
  }

  // Create revocation record
  const recordData = {
    epochNumber: epoch.epochNumber,
    signerIdentity: epoch.identity,
    timestamp: revocationTime,
    reason,
    revokedBy,
  };

  const recordHash = createHash('sha256').update(JSON.stringify(recordData)).digest('hex');

  const revocationRecord: RevocationRecord = {
    schema: REVOCATION_SCHEMA,
    version: REVOCATION_VERSION,
    ...recordData,
    recordHash: `sha256:${recordHash}`,
  };

  // Create revoked epoch
  const revokedEpoch: SignerEpoch = {
    ...epoch,
    status: 'revoked',
    revokedAt: revocationTime,
    revocationReason: reason,
  };

  return {
    revokedEpoch,
    revocationRecord,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// State Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if an epoch is revoked
 */
export function isRevoked(epoch: SignerEpoch): boolean {
  return epoch.status === 'revoked';
}

/**
 * Get revocation reason, or null if not revoked
 */
export function getRevocationReason(epoch: SignerEpoch): string | null {
  if (epoch.status === 'revoked' && epoch.revocationReason) {
    return epoch.revocationReason;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Verification with Revocation Check
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify a signature considering revocation status
 *
 * Key rules:
 *   - New signatures from revoked signers are rejected
 *   - Historic signatures (made before revocation) are valid with warning
 */
export function verifySignatureWithRevocationCheck(params: {
  readonly epoch: SignerEpoch;
  readonly signatureTime: string;
  readonly verificationTime: string;
}): RevocationVerificationResult {
  const { epoch, signatureTime, verificationTime } = params;

  const sigTime = new Date(signatureTime);
  const validFrom = new Date(epoch.validFrom);

  // Signature before epoch started is always invalid
  if (sigTime < validFrom) {
    return {
      ok: false,
      error: {
        code: 'EPOCH_NOT_VALID',
        message: `Signature time ${signatureTime} is before epoch start ${epoch.validFrom}`,
      },
    };
  }

  // Check if epoch is revoked
  if (epoch.status === 'revoked' && epoch.revokedAt) {
    const revokedAt = new Date(epoch.revokedAt);

    // Signature made AFTER revocation - reject
    if (sigTime >= revokedAt) {
      return {
        ok: false,
        error: {
          code: 'SIGNER_REVOKED',
          message: `Signer was revoked at ${epoch.revokedAt}, signature at ${signatureTime} is invalid`,
        },
      };
    }

    // Signature made BEFORE revocation - accept with warning (time-bounded trust)
    return {
      ok: true,
      timeBoundedTrust: true,
      warnings: [
        `Signer epoch ${epoch.epochNumber} was revoked at ${epoch.revokedAt}. ` +
          `This signature was made at ${signatureTime}, before revocation, and is considered valid ` +
          `under time-bounded trust semantics.`,
      ],
    };
  }

  // Check if epoch is retired
  if (epoch.status === 'retired' && epoch.retiredAt) {
    const retiredAt = new Date(epoch.retiredAt);
    if (sigTime >= retiredAt) {
      return {
        ok: false,
        error: {
          code: 'EPOCH_NOT_VALID',
          message: `Signature time ${signatureTime} is after epoch retirement ${epoch.retiredAt}`,
        },
      };
    }
  }

  // Active or valid at signature time
  return {
    ok: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Historic Signature Explanation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Explain whether a historic signature can be validated
 *
 * This is critical for auditors: they need to understand why a signature
 * from a now-revoked signer should still be trusted.
 */
export function canExplainHistoricSignature(params: {
  readonly epoch: SignerEpoch;
  readonly signatureTime: string;
}): HistoricSignatureExplanation {
  const { epoch, signatureTime } = params;

  const sigTime = new Date(signatureTime);
  const validFrom = new Date(epoch.validFrom);

  // Determine current status
  const currentStatus = epoch.status;

  // Was the epoch valid at the time of signing?
  let wasValidAtSigningTime = false;
  let explainable = false;
  let explanation = '';

  // Must have been active at signing time
  if (sigTime >= validFrom) {
    // Check if it was revoked after signing
    if (epoch.status === 'revoked' && epoch.revokedAt) {
      const revokedAt = new Date(epoch.revokedAt);
      if (sigTime < revokedAt) {
        wasValidAtSigningTime = true;
        explainable = true;
        explanation =
          `This signature was valid at the time of signing (${signatureTime}). ` +
          `The signer epoch was active from ${epoch.validFrom} and was later ` +
          `revoked at ${epoch.revokedAt}. The signature predates the revocation ` +
          `and is considered valid under time-bounded trust semantics.`;
      } else {
        explainable = false;
        explanation =
          `This signature was made at ${signatureTime}, after the epoch was ` +
          `revoked at ${epoch.revokedAt}. It cannot be validated.`;
      }
    } else if (epoch.status === 'retired' && epoch.retiredAt) {
      const retiredAt = new Date(epoch.retiredAt);
      if (sigTime < retiredAt) {
        wasValidAtSigningTime = true;
        explainable = true;
        explanation =
          `This signature was valid at the time of signing (${signatureTime}). ` +
          `The signer epoch was active from ${epoch.validFrom} until retirement ` +
          `at ${epoch.retiredAt}.`;
      }
    } else {
      // Active epoch
      wasValidAtSigningTime = true;
      explainable = true;
      explanation =
        `This signature was made at ${signatureTime} when the signer epoch ` +
        `was active containing validFrom ${epoch.validFrom}. The epoch is currently active.`;
    }
  } else {
    // Signature before epoch started
    explainable = false;
    wasValidAtSigningTime = false;
    explanation =
      `This signature claims to be from ${signatureTime}, but the signer epoch ` +
      `did not become valid until ${epoch.validFrom}. This signature cannot be validated.`;
  }

  return {
    explainable,
    wasValidAtSigningTime,
    currentEpochStatus: currentStatus,
    explanation,
    signatureTime,
    epochValidFrom: epoch.validFrom,
    epochRevokedAt: epoch.revokedAt,
  };
}
