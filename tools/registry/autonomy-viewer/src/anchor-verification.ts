/**
 * Phase 4N38 – Two-Channel Anchoring v1 (Defense-in-Depth)
 * =========================================================
 *
 * Provides redundant trust anchors so a single ecosystem dependency
 * cannot be the only "truth." Auditors get resilience under partial failure.
 *
 * Anchor Types:
 *   1. Rekor: Sigstore transparency log (immutable, public)
 *   2. Release: GitHub Release asset (immutable URL + SHA match)
 *   3. Signature: Local signature bundle verification
 *
 * Tier Requirements:
 *   - CI: 1/3 anchors (warn if 0)
 *   - Merged: 2/3 anchors (fail-closed if <2)
 *   - Incident: 2/3 anchors (fail-closed if <2)
 *
 * Usage:
 *   import { computeAnchors, verifyAnchors } from './anchor-verification.js';
 *
 * Invariants:
 *   - Deterministic anchor computation
 *   - Fail-closed for merged/incident tiers with insufficient anchors
 *   - No network calls in verification (anchors must be pre-computed)
 */

import {
    ANCHOR_TIER_REQUIREMENTS,
    ANCHOR_TOOL_VERSION,
    type AnchorType,
    type RekorAnchor,
    type RekorAnchorDetail,
    type ReleaseAnchorDetail,
    type SignatureAnchorDetail,
    type TransparencyAnchors,
} from './evidence-index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AnchorTier = 'ci' | 'merged' | 'incident';

export interface AnchorInput {
  /** Tier for anchor requirements */
  tier: AnchorTier;
  /** Primary artifact SHA256 */
  artifactSha256: string;
  /** Primary artifact name */
  artifactName: string;
  /** Rekor anchor data (if available) */
  rekor?: RekorAnchor;
  /** Release info (if available) */
  release?: {
    tag: string;
    assetName: string;
    assetUrl: string;
    expectedSha256: string;
    actualSha256?: string;
  };
  /** Signature info (if available) */
  signature?: {
    artifact: string;
    identity: string;
    issuer: string;
    tripletComplete: boolean;
    verified: boolean;
  };
}

export interface AnchorVerificationResult {
  /** Anchor summary */
  anchors: TransparencyAnchors;
  /** Whether tier requirements are met */
  ok: boolean;
  /** Error messages if not ok */
  errors: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Anchor Computation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute transparency anchors from input data.
 * Deterministic: same input → same output.
 */
export function computeAnchors(input: AnchorInput): TransparencyAnchors {
  const now = new Date().toISOString();

  // Build Rekor anchor detail
  let rekorAnchor: RekorAnchorDetail | undefined;
  if (input.rekor) {
    rekorAnchor = {
      type: 'rekor',
      ok: input.rekor.bundleValid,
      checkedAt: now,
      uuid: input.rekor.uuid,
      logIndex: input.rekor.logIndex,
      integratedTime: input.rekor.integratedTime,
      entryUrl: input.rekor.entryUrl,
      error: input.rekor.bundleValid ? undefined : 'Rekor bundle invalid',
    };
  }

  // Build Release anchor detail
  let releaseAnchor: ReleaseAnchorDetail | undefined;
  if (input.release) {
    const shaMatch = input.release.actualSha256 === input.release.expectedSha256;
    releaseAnchor = {
      type: 'release',
      ok: shaMatch && !!input.release.actualSha256,
      checkedAt: now,
      releaseTag: input.release.tag,
      assetName: input.release.assetName,
      expectedSha256: input.release.expectedSha256,
      actualSha256: input.release.actualSha256,
      shaMatch,
      assetUrl: input.release.assetUrl,
      error: shaMatch ? undefined : 'Release asset SHA256 mismatch',
    };
  }

  // Build Signature anchor detail
  let signatureAnchor: SignatureAnchorDetail | undefined;
  if (input.signature) {
    signatureAnchor = {
      type: 'signature',
      ok: input.signature.verified && input.signature.tripletComplete,
      checkedAt: now,
      artifact: input.signature.artifact,
      identity: input.signature.identity,
      issuer: input.signature.issuer,
      tripletComplete: input.signature.tripletComplete,
      error: input.signature.verified ? undefined : 'Signature verification failed',
    };
  }

  // Count successful anchors
  const anchorCount = [rekorAnchor, releaseAnchor, signatureAnchor].filter(a => a?.ok).length;

  // Determine status
  let status: TransparencyAnchors['status'];
  if (anchorCount === 3) {
    status = 'ok';
  } else if (anchorCount === 2) {
    status = 'ok';
  } else if (anchorCount === 1) {
    status = 'partial';
  } else {
    status = 'none';
  }

  // Tier-specific requirements
  const required = ANCHOR_TIER_REQUIREMENTS[input.tier];
  const tierOk = anchorCount >= required;

  // If tier requirement not met, status is insufficient
  if (!tierOk && status !== 'none') {
    status = 'insufficient';
  }

  return {
    schema: 'terrafusion.autonomy.anchors.v1',
    toolVersion: ANCHOR_TOOL_VERSION,
    evaluatedAt: now,
    artifactSha256: input.artifactSha256,
    artifactName: input.artifactName,
    rekor: rekorAnchor,
    release: releaseAnchor,
    signature: signatureAnchor,
    anchorCount,
    anchorTotal: 3,
    status,
    tierResult: {
      required,
      ok: tierOk,
      tier: input.tier,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Anchor Verification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify transparency anchors meet tier requirements.
 * No network calls - works purely on pre-computed anchor data.
 */
export function verifyAnchors(
  anchors: TransparencyAnchors,
  tier: AnchorTier
): AnchorVerificationResult {
  const errors: string[] = [];
  const required = ANCHOR_TIER_REQUIREMENTS[tier];

  // Check anchor count meets tier requirements
  if (anchors.anchorCount < required) {
    errors.push(
      `Insufficient anchors: ${anchors.anchorCount}/${required} required for ${tier} tier`
    );
  }

  // Check individual anchor errors
  if (anchors.rekor && !anchors.rekor.ok && anchors.rekor.error) {
    errors.push(`Rekor: ${anchors.rekor.error}`);
  }
  if (anchors.release && !anchors.release.ok && anchors.release.error) {
    errors.push(`Release: ${anchors.release.error}`);
  }
  if (anchors.signature && !anchors.signature.ok && anchors.signature.error) {
    errors.push(`Signature: ${anchors.signature.error}`);
  }

  // CI tier allows warnings, merged/incident fail-closed
  const ok =
    tier === 'ci'
      ? true // CI always passes but may warn
      : anchors.anchorCount >= required;

  return {
    anchors,
    ok,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Anchor Badge Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate anchor badge for ledger display.
 *
 * Badge states:
 *   - ✅ 3/3 or 2/3 (green)
 *   - ⚠️ 1/3 (yellow, CI tier only - meets minimum but below best practice)
 *   - 🚨 0/3 or insufficient (red, fail-closed for merged/incident)
 */
export function getAnchorBadge(anchors: TransparencyAnchors): {
  text: string;
  class: 'anchor-ok' | 'anchor-warn' | 'anchor-fail';
  title: string;
} {
  const { anchorCount, tierResult } = anchors;

  // Build anchor list for tooltip
  const anchorList: string[] = [];
  if (anchors.rekor?.ok) anchorList.push('Rekor');
  if (anchors.release?.ok) anchorList.push('Release');
  if (anchors.signature?.ok) anchorList.push('Signature');

  const tooltip =
    anchorList.length > 0 ? `Verified: ${anchorList.join(', ')}` : 'No anchors verified';

  // CI tier with 1/3: warn (meets minimum but below best practice)
  if (tierResult.ok && anchorCount === 1 && tierResult.tier === 'ci') {
    return {
      text: `${anchorCount}/3`,
      class: 'anchor-warn',
      title: `${tooltip} (below minimum for production)`,
    };
  }

  // Tier requirements met with 2+ anchors: ok
  if (tierResult.ok) {
    return {
      text: `${anchorCount}/3`,
      class: 'anchor-ok',
      title: tooltip,
    };
  }

  // CI tier with 0 anchors: warn (not fail)
  if (anchorCount === 0 && tierResult.tier === 'ci') {
    return {
      text: `${anchorCount}/3`,
      class: 'anchor-warn',
      title: `${tooltip} (below minimum for production)`,
    };
  }

  return {
    text: `${anchorCount}/3`,
    class: 'anchor-fail',
    title: `${tooltip} (insufficient for ${tierResult.tier} tier)`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Export Types
// ─────────────────────────────────────────────────────────────────────────────

export type {
    AnchorType,
    RekorAnchorDetail,
    ReleaseAnchorDetail,
    SignatureAnchorDetail,
    TransparencyAnchors
};

