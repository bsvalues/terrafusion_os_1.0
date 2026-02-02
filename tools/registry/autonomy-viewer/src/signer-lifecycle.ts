/**
 * Phase 4N45a – Signer Lifecycle Governance
 * ==========================================
 *
 * Signer epochs, rotation, and trust bundle management.
 *
 * Invariants:
 *   - Signer epochs are explicitly versioned and auditable
 *   - Key rotation creates new epoch, retires old (never deletes)
 *   - Time-bounded trust: signatures valid at signing time remain verifiable
 *   - Trust bundles are versioned for offline verification
 */

import * as crypto from 'node:crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const SIGNER_LIFECYCLE_SCHEMA = 'terrafusion.autonomy.signer-lifecycle.v1';
export const SIGNER_LIFECYCLE_VERSION = '4N45.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Status of a signer epoch.
 */
export type SignerEpochStatus = 'active' | 'retired' | 'revoked';

/**
 * A signer epoch - represents a signing key's validity period.
 */
export interface SignerEpoch {
  /** Epoch number (sequential, starting from 1) */
  epochNumber: number;
  /** OIDC identity (workflow or user) */
  identity: string;
  /** OIDC issuer */
  issuer: string;
  /** When this epoch became valid (ISO timestamp) */
  validFrom: string;
  /** Public key fingerprint (for verification) */
  publicKeyFingerprint: string;
  /** Current status */
  status: SignerEpochStatus;
  /** When this epoch was retired (null if active) */
  retiredAt: string | null;
  /** When this epoch was revoked (null if not revoked) */
  revokedAt: string | null;
  /** Revocation reason (null if not revoked) */
  revocationReason: string | null;
  /** Previous epoch number (null for first epoch) */
  previousEpochNumber: number | null;
}

/**
 * Rotation event - recorded when keys are rotated.
 */
export interface SignerRotationEvent {
  type: 'rotation';
  timestamp: string;
  fromEpoch: number;
  toEpoch: number;
  reason: string;
  /** SHA256 of the event content for immutability */
  eventHash: string;
}

/**
 * Trust bundle - collection of epochs for offline verification.
 */
export interface TrustBundle {
  /** Schema identifier */
  $schema: typeof SIGNER_LIFECYCLE_SCHEMA;
  /** Bundle version */
  version: typeof SIGNER_LIFECYCLE_VERSION;
  /** When this bundle was generated */
  generatedAt: string;
  /** Point-in-time this bundle represents */
  asOfTime: string;
  /** All epochs (active, retired, revoked) */
  epochs: SignerEpoch[];
  /** Currently active epoch (null if none) */
  activeEpoch: SignerEpoch | null;
  /** SHA256 of bundle content */
  sha256: string;
}

/**
 * Error codes for signer chain verification.
 */
export type SignerChainErrorCode =
  | 'NO_EPOCHS'
  | 'EPOCH_GAP'
  | 'CHAIN_LINK_BROKEN'
  | 'DUPLICATE_EPOCH'
  | 'INVALID_EPOCH_ORDER';

/**
 * Signer chain error.
 */
export interface SignerChainError {
  code: SignerChainErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Result of signer chain verification.
 */
export interface SignerChainVerificationResult {
  ok: boolean;
  errors: SignerChainError[];
  epochCount: number;
  activeEpoch: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// Epoch Creation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for creating a signer epoch.
 */
export interface CreateSignerEpochOptions {
  epochNumber: number;
  identity: string;
  issuer: string;
  validFrom: string;
  publicKeyFingerprint: string;
  previousEpochNumber?: number | null;
}

/**
 * Create a new signer epoch.
 */
export function createSignerEpoch(options: CreateSignerEpochOptions): SignerEpoch {
  return {
    epochNumber: options.epochNumber,
    identity: options.identity,
    issuer: options.issuer,
    validFrom: options.validFrom,
    publicKeyFingerprint: options.publicKeyFingerprint,
    status: 'active',
    retiredAt: null,
    revokedAt: null,
    revocationReason: null,
    previousEpochNumber: options.previousEpochNumber ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Key Rotation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for rotating a signer key.
 */
export interface RotateSignerKeyOptions {
  currentEpoch: SignerEpoch;
  newIdentity: string;
  newPublicKeyFingerprint: string;
  rotationTime: string;
  reason: string;
}

/**
 * Result of key rotation.
 */
export interface RotateSignerKeyResult {
  previousEpoch: SignerEpoch;
  newEpoch: SignerEpoch;
  rotationEvent: SignerRotationEvent;
}

/**
 * Rotate a signer key.
 *
 * Creates a new epoch and retires the current one.
 */
export function rotateSignerKey(options: RotateSignerKeyOptions): RotateSignerKeyResult {
  const { currentEpoch, newIdentity, newPublicKeyFingerprint, rotationTime, reason } = options;

  // Retire the current epoch
  const previousEpoch: SignerEpoch = {
    ...currentEpoch,
    status: 'retired',
    retiredAt: rotationTime,
  };

  // Create new epoch
  const newEpoch = createSignerEpoch({
    epochNumber: currentEpoch.epochNumber + 1,
    identity: newIdentity,
    issuer: currentEpoch.issuer, // Keep same issuer
    validFrom: rotationTime,
    publicKeyFingerprint: newPublicKeyFingerprint,
    previousEpochNumber: currentEpoch.epochNumber,
  });

  // Create rotation event
  const eventContent = JSON.stringify({
    type: 'rotation',
    timestamp: rotationTime,
    fromEpoch: currentEpoch.epochNumber,
    toEpoch: newEpoch.epochNumber,
    reason,
  });

  const rotationEvent: SignerRotationEvent = {
    type: 'rotation',
    timestamp: rotationTime,
    fromEpoch: currentEpoch.epochNumber,
    toEpoch: newEpoch.epochNumber,
    reason,
    eventHash: sha256(eventContent),
  };

  return {
    previousEpoch,
    newEpoch,
    rotationEvent,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Time-Bounded Trust
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a signer epoch is valid at a given time.
 *
 * For signing: epoch must be active (not retired/revoked) at that time.
 * For verifying old signatures: epoch was active when signature was made.
 */
export function isSignerValidAtTime(epoch: SignerEpoch, timeIso: string): boolean {
  const queryTime = new Date(timeIso);
  const validFrom = new Date(epoch.validFrom);

  // Not valid before epoch started
  if (queryTime < validFrom) {
    return false;
  }

  // If revoked, not valid at any time after revocation
  if (epoch.status === 'revoked' && epoch.revokedAt) {
    const revokedAt = new Date(epoch.revokedAt);
    if (queryTime >= revokedAt) {
      return false;
    }
  }

  // If retired, still valid for times during active period (for verification)
  if (epoch.status === 'retired' && epoch.retiredAt) {
    const retiredAt = new Date(epoch.retiredAt);
    // Only valid for times before retirement
    if (queryTime >= retiredAt) {
      return false;
    }
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Trust Bundle
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a trust bundle for a specific point in time.
 */
export function getTrustBundleForTime(epochs: SignerEpoch[], asOfTime: string): TrustBundle {
  const queryTime = new Date(asOfTime);

  // Find active epoch at query time
  let activeEpoch: SignerEpoch | null = null;
  for (const epoch of epochs) {
    if (isSignerValidAtTime(epoch, asOfTime)) {
      if (!activeEpoch || epoch.epochNumber > activeEpoch.epochNumber) {
        activeEpoch = epoch;
      }
    }
  }

  // Build bundle content for hashing
  const bundleContent = JSON.stringify({
    asOfTime,
    epochs: epochs.map(e => ({
      epochNumber: e.epochNumber,
      identity: e.identity,
      publicKeyFingerprint: e.publicKeyFingerprint,
      status: e.status,
    })),
    activeEpoch: activeEpoch?.epochNumber ?? null,
  });

  return {
    $schema: SIGNER_LIFECYCLE_SCHEMA,
    version: SIGNER_LIFECYCLE_VERSION,
    generatedAt: new Date().toISOString(),
    asOfTime,
    epochs: [...epochs].sort((a, b) => a.epochNumber - b.epochNumber),
    activeEpoch,
    sha256: sha256(bundleContent),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Chain Verification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify a chain of signer epochs for integrity.
 */
export function verifySignerChain(epochs: SignerEpoch[]): SignerChainVerificationResult {
  const errors: SignerChainError[] = [];

  if (epochs.length === 0) {
    return {
      ok: false,
      errors: [
        {
          code: 'NO_EPOCHS',
          message: 'No signer epochs provided',
        },
      ],
      epochCount: 0,
      activeEpoch: null,
    };
  }

  // Sort by epoch number
  const sorted = [...epochs].sort((a, b) => a.epochNumber - b.epochNumber);

  // Check for gaps and linkage
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    // Check sequential epoch numbers
    if (curr.epochNumber !== prev.epochNumber + 1) {
      errors.push({
        code: 'EPOCH_GAP',
        message: `Gap between epoch ${prev.epochNumber} and ${curr.epochNumber}`,
        details: { expected: prev.epochNumber + 1, actual: curr.epochNumber },
      });
    }

    // Check previousEpochNumber linkage
    if (curr.previousEpochNumber !== prev.epochNumber) {
      errors.push({
        code: 'CHAIN_LINK_BROKEN',
        message: `Epoch ${curr.epochNumber} claims previous is ${curr.previousEpochNumber} but should be ${prev.epochNumber}`,
        details: {
          epochNumber: curr.epochNumber,
          expected: prev.epochNumber,
          actual: curr.previousEpochNumber,
        },
      });
    }
  }

  // Find active epoch
  const activeEpochs = sorted.filter(e => e.status === 'active');
  const activeEpoch =
    activeEpochs.length > 0 ? activeEpochs[activeEpochs.length - 1].epochNumber : null;

  return {
    ok: errors.length === 0,
    errors,
    epochCount: sorted.length,
    activeEpoch,
  };
}
