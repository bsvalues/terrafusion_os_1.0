/**
 * Phase 4N44d – Retention Policy
 * ===============================
 *
 * Tier-based retention automation with protected incident deletion.
 *
 * Invariants:
 *   - CI tier expires after N days (configurable, default 90)
 *   - Merged tier retains per policy (default 365 days)
 *   - Incident tier retained indefinitely unless break-glass deletion
 *   - All deletions recorded in ledger (append-only)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const RETENTION_POLICY_SCHEMA = 'terrafusion.autonomy.retention-policy.v1';
export const RETENTION_POLICY_VERSION = '4N44.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retention settings for a single tier.
 */
export interface TierRetention {
  /** Number of days to retain (0 if indefinite) */
  retentionDays: number;
  /** Whether retention is indefinite (ignores retentionDays) */
  indefinite: boolean;
}

/**
 * Retention policy for all tiers.
 */
export interface RetentionPolicy {
  ci: TierRetention;
  merged: TierRetention;
  incident: TierRetention;
}

/**
 * Error codes for retention operations.
 */
export type RetentionErrorCode =
  | 'BREAK_GLASS_REQUIRED'
  | 'REASON_REQUIRED'
  | 'INVALID_TIER'
  | 'INTENT_MALFORMED';

/**
 * Retention operation error.
 */
export interface RetentionError {
  code: RetentionErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Intent to delete a release.
 */
export interface DeletionIntent {
  /** Release tag to delete */
  releaseTag: string;
  /** Tier of the release */
  tier: 'ci' | 'merged' | 'incident';
  /** Break-glass override flag */
  breakGlassFlag: boolean;
  /** Reason for deletion */
  reason: string;
  /** Operator who initiated deletion */
  operatorId: string;
  /** When deletion was intended */
  intendedAt: string;
  /** Optional signature (hex-encoded) */
  signature?: string;
}

/**
 * Result of deletion intent validation.
 */
export interface DeletionIntentValidation {
  ok: boolean;
  intent?: DeletionIntent;
  error?: RetentionError;
}

/**
 * Release info for expiry calculation.
 */
export interface ReleaseInfo {
  tag: string;
  tier: 'ci' | 'merged' | 'incident';
  createdAt: string;
}

/**
 * Target for expiry/deletion.
 */
export interface ExpiryTarget {
  tag: string;
  tier: 'ci' | 'merged' | 'incident';
  createdAt: string;
  expiresAt: string;
}

/**
 * Retention event for ledger recording.
 */
export interface RetentionEvent {
  type: 'expiry' | 'deletion' | 'extension';
  releaseTag: string;
  tier: 'ci' | 'merged' | 'incident';
  eventAt: string;
  reason: string;
  operatorId: string;
  breakGlassUsed?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Policy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default retention policy.
 *
 * CI: 90 days (ephemeral builds)
 * Merged: 365 days (production releases)
 * Incident: Indefinite (post-incident evidence)
 */
export const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
  ci: {
    retentionDays: 90,
    indefinite: false,
  },
  merged: {
    retentionDays: 365,
    indefinite: false,
  },
  incident: {
    retentionDays: 0,
    indefinite: true,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get retention settings for a tier.
 */
export function getRetentionForTier(
  tier: 'ci' | 'merged' | 'incident',
  policy: RetentionPolicy = DEFAULT_RETENTION_POLICY
): TierRetention {
  return policy[tier];
}

/**
 * Compute expiry date for a release.
 * Returns null for indefinite retention.
 */
export function computeExpiryDate(created: Date, retention: TierRetention): Date | null {
  if (retention.indefinite) {
    return null;
  }

  const expiry = new Date(created);
  expiry.setDate(expiry.getDate() + retention.retentionDays);
  return expiry;
}

/**
 * Check if a release is expired.
 */
export function isExpired(created: Date, now: Date, retention: TierRetention): boolean {
  if (retention.indefinite) {
    return false;
  }

  const expiry = computeExpiryDate(created, retention);
  if (!expiry) {
    return false;
  }

  return now >= expiry;
}

// ─────────────────────────────────────────────────────────────────────────────
// Expiry Target Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate list of releases that have expired per policy.
 */
export function generateExpiryTargets(
  releases: ReleaseInfo[],
  now: Date = new Date(),
  policy: RetentionPolicy = DEFAULT_RETENTION_POLICY
): ExpiryTarget[] {
  const targets: ExpiryTarget[] = [];

  for (const release of releases) {
    const retention = getRetentionForTier(release.tier, policy);

    // Skip indefinite retention
    if (retention.indefinite) {
      continue;
    }

    const created = new Date(release.createdAt);
    const expiryDate = computeExpiryDate(created, retention);

    if (expiryDate && now >= expiryDate) {
      targets.push({
        tag: release.tag,
        tier: release.tier,
        createdAt: release.createdAt,
        expiresAt: expiryDate.toISOString(),
      });
    }
  }

  return targets;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deletion Intent
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for creating a deletion intent.
 */
export interface CreateDeletionIntentOptions {
  releaseTag: string;
  tier: 'ci' | 'merged' | 'incident';
  reason: string;
  operatorId: string;
  breakGlassFlag?: boolean;
}

/**
 * Create a deletion intent artifact.
 */
export function createDeletionIntent(options: CreateDeletionIntentOptions): DeletionIntent {
  return {
    releaseTag: options.releaseTag,
    tier: options.tier,
    breakGlassFlag: options.breakGlassFlag ?? false,
    reason: options.reason,
    operatorId: options.operatorId,
    intendedAt: new Date().toISOString(),
  };
}

/**
 * Validate a deletion intent.
 */
export function validateDeletionIntent(intent: DeletionIntent): DeletionIntentValidation {
  // Incident tier requires break-glass
  if (intent.tier === 'incident' && !intent.breakGlassFlag) {
    return {
      ok: false,
      error: {
        code: 'BREAK_GLASS_REQUIRED',
        message: 'Incident tier deletion requires break-glass flag',
        details: { tier: intent.tier, releaseTag: intent.releaseTag },
      },
    };
  }

  // All tiers except CI require a reason
  if (intent.tier !== 'ci' && !intent.reason.trim()) {
    return {
      ok: false,
      error: {
        code: 'REASON_REQUIRED',
        message: 'Deletion reason is required for merged/incident tiers',
        details: { tier: intent.tier },
      },
    };
  }

  // Validate required fields
  if (!intent.releaseTag || !intent.operatorId || !intent.intendedAt) {
    return {
      ok: false,
      error: {
        code: 'INTENT_MALFORMED',
        message: 'Deletion intent is missing required fields',
        details: {
          hasReleaseTag: !!intent.releaseTag,
          hasOperatorId: !!intent.operatorId,
          hasIntendedAt: !!intent.intendedAt,
        },
      },
    };
  }

  return {
    ok: true,
    intent,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Retention Event Creation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create an expiry event for ledger recording.
 */
export function createExpiryEvent(
  target: ExpiryTarget,
  operatorId: string = 'retention-automation'
): RetentionEvent {
  return {
    type: 'expiry',
    releaseTag: target.tag,
    tier: target.tier,
    eventAt: new Date().toISOString(),
    reason: `Expired per ${target.tier} tier retention policy (created ${target.createdAt})`,
    operatorId,
  };
}

/**
 * Create a deletion event for ledger recording.
 */
export function createDeletionEvent(intent: DeletionIntent): RetentionEvent {
  return {
    type: 'deletion',
    releaseTag: intent.releaseTag,
    tier: intent.tier,
    eventAt: new Date().toISOString(),
    reason: intent.reason,
    operatorId: intent.operatorId,
    breakGlassUsed: intent.breakGlassFlag,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Policy Extension
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a custom retention policy with overrides.
 */
export function createRetentionPolicy(overrides: Partial<RetentionPolicy>): RetentionPolicy {
  return {
    ci: overrides.ci ?? DEFAULT_RETENTION_POLICY.ci,
    merged: overrides.merged ?? DEFAULT_RETENTION_POLICY.merged,
    incident: overrides.incident ?? DEFAULT_RETENTION_POLICY.incident,
  };
}
