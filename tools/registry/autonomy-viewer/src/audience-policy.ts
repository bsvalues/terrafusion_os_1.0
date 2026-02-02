/**
 * Phase 4N42a – Audience + Sensitivity Classification Schema
 * ============================================================
 *
 * First-class governance primitives for audience separation and
 * sensitivity classification. Machine-enforced at generator,
 * publisher, and verifier stages.
 *
 * Invariants:
 *   - Every artifact has an explicit audience classification
 *   - Every tier has explicit allowed audiences
 *   - Policy violations fail closed at publish time
 *   - No implicit audience inheritance
 */

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const AUDIENCE_POLICY_SCHEMA = 'terrafusion.autonomy.audience-policy.v1';
export const AUDIENCE_POLICY_VERSION = '4N42.1';

// ─────────────────────────────────────────────────────────────────────────────
// Audience Classification Enum
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Audience classification levels (ordered by restriction).
 *
 * PUBLIC: Safe for external distribution, no PII, no sensitive data
 * INTERNAL: Organization-internal only, may contain operational details
 * RESTRICTED: Limited distribution, contains sensitive operational data
 * BREAK_GLASS: Emergency access only, requires explicit operator intent
 */
export type AudienceLevel = 'PUBLIC' | 'INTERNAL' | 'RESTRICTED' | 'BREAK_GLASS';

/**
 * Sensitivity classification for artifacts.
 * Maps to PII handling requirements.
 */
export type SensitivityLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Release tier (maps to retention policy).
 */
export type ReleaseTier = 'ci' | 'merged' | 'incident';

// ─────────────────────────────────────────────────────────────────────────────
// Tier → Audience ACL Mapping
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default tier → allowed audience mappings.
 *
 * CI tier: INTERNAL only (short-lived, operational)
 * Merged tier: PUBLIC, INTERNAL, RESTRICTED (allows public distribution)
 * Incident tier: RESTRICTED + BREAK_GLASS only, explicit operator intent required
 */
export const DEFAULT_TIER_AUDIENCE_ACL: Record<ReleaseTier, AudienceLevel[]> = {
  ci: ['INTERNAL'],
  merged: ['PUBLIC', 'INTERNAL', 'RESTRICTED'],
  incident: ['RESTRICTED', 'BREAK_GLASS'],
};

/**
 * Minimum required audiences per tier (for public distribution).
 * CI tier cannot have public distribution.
 */
export const PUBLIC_DISTRIBUTION_ALLOWED: Record<ReleaseTier, boolean> = {
  ci: false,
  merged: true,
  incident: false, // Incidents are never public
};

// ─────────────────────────────────────────────────────────────────────────────
// Artifact Audience Metadata
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Audience metadata for a single artifact.
 */
export interface ArtifactAudienceMetadata {
  /** Artifact path relative to casefile root */
  path: string;
  /** Assigned audience level */
  audience: AudienceLevel;
  /** Sensitivity classification */
  sensitivity: SensitivityLevel;
  /** Whether this artifact contains PII (requires redaction for lower audiences) */
  containsPii: boolean;
  /** Redaction status (if applicable) */
  redacted?: boolean;
  /** Reason for classification (audit trail) */
  classificationReason?: string;
}

/**
 * Audience classification for a complete casefile.
 */
export interface CasefileAudienceClassification {
  /** Schema identifier */
  $schema: typeof AUDIENCE_POLICY_SCHEMA;
  /** Tool version */
  toolVersion: typeof AUDIENCE_POLICY_VERSION;
  /** Generation timestamp */
  generatedAt: string;
  /** Record/run identifier */
  recordId: string;
  /** Release tier */
  tier: ReleaseTier;
  /** Overall audience level (most restrictive of all artifacts) */
  overallAudience: AudienceLevel;
  /** Overall sensitivity level (most sensitive of all artifacts) */
  overallSensitivity: SensitivityLevel;
  /** Per-artifact classification */
  artifacts: ArtifactAudienceMetadata[];
  /** Whether public distribution pack can be generated */
  publicDistributionAllowed: boolean;
  /** Whether internal distribution pack can be generated */
  internalDistributionAllowed: boolean;
  /** Policy snapshot used for classification */
  policyVersion: string;
  /** Classification errors (if any) */
  errors: AudienceClassificationError[];
}

/**
 * Classification error (fail-closed on policy violations).
 */
export interface AudienceClassificationError {
  code: AudienceErrorCode;
  message: string;
  artifact?: string;
  details?: Record<string, unknown>;
}

export type AudienceErrorCode =
  | 'AUDIENCE_VIOLATION'
  | 'SENSITIVITY_MISMATCH'
  | 'PII_DETECTED_NOT_REDACTED'
  | 'PUBLIC_PACK_CONTAINS_RESTRICTED'
  | 'INTERNAL_ONLY_IN_PUBLIC'
  | 'BREAK_GLASS_WITHOUT_FLAG'
  | 'TIER_AUDIENCE_MISMATCH'
  | 'REDACTION_REQUIRED'
  | 'POLICY_INCOMPLETE';

// ─────────────────────────────────────────────────────────────────────────────
// Policy Definition
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Audience policy definition (loaded from policy file).
 */
export interface AudiencePolicy {
  /** Schema identifier */
  $schema: typeof AUDIENCE_POLICY_SCHEMA;
  /** Policy version */
  version: string;
  /** Tier → allowed audience mappings */
  tierAudienceAcl: Record<ReleaseTier, AudienceLevel[]>;
  /** Per-path audience rules (glob patterns) */
  pathRules: AudiencePathRule[];
  /** Sensitivity thresholds for PII detection */
  sensitivityThresholds: SensitivityThreshold[];
  /** Whether to fail closed on policy violations */
  failClosed: boolean;
  /** Break-glass requirements */
  breakGlassRequirements: BreakGlassRequirement;
}

/**
 * Path-based audience rule (glob pattern matching).
 */
export interface AudiencePathRule {
  /** Glob pattern to match artifact paths */
  pattern: string;
  /** Assigned audience level for matching paths */
  audience: AudienceLevel;
  /** Sensitivity level for matching paths */
  sensitivity: SensitivityLevel;
  /** Whether matching paths contain PII */
  containsPii: boolean;
  /** Rule priority (higher = evaluated first) */
  priority: number;
}

/**
 * Sensitivity threshold for automatic PII detection.
 */
export interface SensitivityThreshold {
  /** Pattern type (regex, keyword, etc.) */
  type: 'regex' | 'keyword' | 'file_extension';
  /** Pattern to match */
  pattern: string;
  /** Sensitivity level when matched */
  sensitivity: SensitivityLevel;
  /** Whether pattern indicates PII */
  indicatesPii: boolean;
}

/**
 * Break-glass requirements for BREAK_GLASS audience.
 */
export interface BreakGlassRequirement {
  /** Minimum approvals required */
  minApprovals: number;
  /** Required roles for approvers */
  requiredRoles: string[];
  /** Whether explicit flag is required */
  requireExplicitFlag: boolean;
  /** Time limit for break-glass access (hours) */
  timeLimitHours: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Policy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default audience policy (fail-closed, conservative).
 */
export const DEFAULT_AUDIENCE_POLICY: AudiencePolicy = {
  $schema: AUDIENCE_POLICY_SCHEMA,
  version: '1.0.0',
  tierAudienceAcl: DEFAULT_TIER_AUDIENCE_ACL,
  pathRules: [
    // Evidence bundles are INTERNAL by default
    {
      pattern: 'autonomy-evidence-*.zip',
      audience: 'INTERNAL',
      sensitivity: 'MEDIUM',
      containsPii: false,
      priority: 10,
    },
    // Manifests are PUBLIC (contain only hashes)
    {
      pattern: '*-manifest.json',
      audience: 'PUBLIC',
      sensitivity: 'NONE',
      containsPii: false,
      priority: 10,
    },
    // Custody attestations are INTERNAL
    {
      pattern: '*custody*.json',
      audience: 'INTERNAL',
      sensitivity: 'LOW',
      containsPii: false,
      priority: 10,
    },
    // Rekor proofs are PUBLIC (transparency log)
    {
      pattern: 'rekor-*.json',
      audience: 'PUBLIC',
      sensitivity: 'NONE',
      containsPii: false,
      priority: 10,
    },
    // Break-glass proofs are RESTRICTED
    {
      pattern: 'break-glass-*.json',
      audience: 'RESTRICTED',
      sensitivity: 'HIGH',
      containsPii: false,
      priority: 20,
    },
    // Incident proofs are RESTRICTED
    {
      pattern: 'incident-*.json',
      audience: 'RESTRICTED',
      sensitivity: 'HIGH',
      containsPii: false,
      priority: 20,
    },
    // PII-containing files (by extension)
    {
      pattern: '*.pii.json',
      audience: 'RESTRICTED',
      sensitivity: 'CRITICAL',
      containsPii: true,
      priority: 100,
    },
    // Default: INTERNAL
    { pattern: '*', audience: 'INTERNAL', sensitivity: 'LOW', containsPii: false, priority: 0 },
  ],
  sensitivityThresholds: [
    {
      type: 'regex',
      pattern: '\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b',
      sensitivity: 'HIGH',
      indicatesPii: true,
    },
    {
      type: 'regex',
      pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
      sensitivity: 'CRITICAL',
      indicatesPii: true,
    }, // SSN pattern
    { type: 'regex', pattern: '\\b\\d{9}\\b', sensitivity: 'HIGH', indicatesPii: true }, // 9-digit number
    { type: 'keyword', pattern: 'social_security', sensitivity: 'CRITICAL', indicatesPii: true },
    { type: 'keyword', pattern: 'ssn', sensitivity: 'CRITICAL', indicatesPii: true },
    { type: 'keyword', pattern: 'tax_id', sensitivity: 'HIGH', indicatesPii: true },
    { type: 'keyword', pattern: 'parcel_owner_name', sensitivity: 'MEDIUM', indicatesPii: true },
    { type: 'keyword', pattern: 'owner_address', sensitivity: 'MEDIUM', indicatesPii: true },
    { type: 'file_extension', pattern: '.pii', sensitivity: 'CRITICAL', indicatesPii: true },
  ],
  failClosed: true,
  breakGlassRequirements: {
    minApprovals: 2,
    requiredRoles: ['security', 'cio'],
    requireExplicitFlag: true,
    timeLimitHours: 24,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Audience Level Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Audience level ordering (higher = more restricted).
 */
const AUDIENCE_LEVEL_ORDER: Record<AudienceLevel, number> = {
  PUBLIC: 0,
  INTERNAL: 1,
  RESTRICTED: 2,
  BREAK_GLASS: 3,
};

/**
 * Sensitivity level ordering (higher = more sensitive).
 */
const SENSITIVITY_LEVEL_ORDER: Record<SensitivityLevel, number> = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

/**
 * Compare two audience levels. Returns positive if a > b (more restricted).
 */
export function compareAudienceLevels(a: AudienceLevel, b: AudienceLevel): number {
  return AUDIENCE_LEVEL_ORDER[a] - AUDIENCE_LEVEL_ORDER[b];
}

/**
 * Compare two sensitivity levels. Returns positive if a > b (more sensitive).
 */
export function compareSensitivityLevels(a: SensitivityLevel, b: SensitivityLevel): number {
  return SENSITIVITY_LEVEL_ORDER[a] - SENSITIVITY_LEVEL_ORDER[b];
}

/**
 * Get the most restrictive audience level from a list.
 */
export function getMostRestrictiveAudience(levels: AudienceLevel[]): AudienceLevel {
  if (levels.length === 0) return 'INTERNAL';
  return levels.reduce((max, level) => (compareAudienceLevels(level, max) > 0 ? level : max));
}

/**
 * Get the most sensitive sensitivity level from a list.
 */
export function getMostSensitiveSensitivity(levels: SensitivityLevel[]): SensitivityLevel {
  if (levels.length === 0) return 'NONE';
  return levels.reduce((max, level) => (compareSensitivityLevels(level, max) > 0 ? level : max));
}

/**
 * Check if an audience level is allowed for a tier.
 */
export function isAudienceAllowedForTier(
  audience: AudienceLevel,
  tier: ReleaseTier,
  policy: AudiencePolicy = DEFAULT_AUDIENCE_POLICY
): boolean {
  const allowedAudiences = policy.tierAudienceAcl[tier];
  return allowedAudiences.includes(audience);
}

/**
 * Check if an artifact can be included in a public distribution pack.
 */
export function canIncludeInPublicPack(artifact: ArtifactAudienceMetadata): boolean {
  // Only PUBLIC artifacts with no PII (or redacted PII) can be public
  if (artifact.audience !== 'PUBLIC') return false;
  if (artifact.containsPii && !artifact.redacted) return false;
  return true;
}

/**
 * Check if an artifact can be included in an internal distribution pack.
 */
export function canIncludeInInternalPack(artifact: ArtifactAudienceMetadata): boolean {
  // PUBLIC and INTERNAL artifacts with no PII (or redacted) can be internal
  if (artifact.audience === 'RESTRICTED' || artifact.audience === 'BREAK_GLASS') return false;
  if (artifact.containsPii && !artifact.redacted) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Classification Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for classifying artifacts.
 */
export interface ClassifyOptions {
  /** Artifact paths to classify */
  paths: string[];
  /** Release tier */
  tier: ReleaseTier;
  /** Policy to use (defaults to DEFAULT_AUDIENCE_POLICY) */
  policy?: AudiencePolicy;
  /** Whether break-glass flag is set */
  breakGlassFlag?: boolean;
  /** Content scanner for PII detection (optional) */
  contentScanner?: (path: string) => SensitivityLevel | null;
}

/**
 * Match a path against glob-like patterns.
 * Simple implementation: * matches any characters.
 */
function matchPattern(path: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
    .replace(/\*/g, '.*') // Convert * to .*
    .replace(/\?/g, '.'); // Convert ? to .
  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(path);
}

/**
 * Classify a single artifact path using policy rules.
 */
export function classifyArtifact(
  path: string,
  policy: AudiencePolicy = DEFAULT_AUDIENCE_POLICY,
  contentSensitivity?: SensitivityLevel
): ArtifactAudienceMetadata {
  // Find matching rules (sorted by priority descending)
  const sortedRules = [...policy.pathRules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (matchPattern(path, rule.pattern)) {
      // If content scanner detected higher sensitivity, use that
      const sensitivity =
        contentSensitivity && compareSensitivityLevels(contentSensitivity, rule.sensitivity) > 0
          ? contentSensitivity
          : rule.sensitivity;

      // Upgrade audience if sensitivity is high
      let audience = rule.audience;
      if (sensitivity === 'CRITICAL' && audience === 'PUBLIC') {
        audience = 'RESTRICTED';
      } else if (sensitivity === 'HIGH' && audience === 'PUBLIC') {
        audience = 'INTERNAL';
      }

      return {
        path,
        audience,
        sensitivity,
        containsPii:
          rule.containsPii || contentSensitivity === 'HIGH' || contentSensitivity === 'CRITICAL',
        classificationReason: `Matched pattern: ${rule.pattern} (priority: ${rule.priority})`,
      };
    }
  }

  // Default classification
  return {
    path,
    audience: 'INTERNAL',
    sensitivity: 'LOW',
    containsPii: false,
    classificationReason: 'Default classification (no matching rules)',
  };
}

/**
 * Classify all artifacts and generate casefile audience classification.
 */
export function classifyArtifacts(options: ClassifyOptions): CasefileAudienceClassification {
  const policy = options.policy || DEFAULT_AUDIENCE_POLICY;
  const errors: AudienceClassificationError[] = [];
  const artifacts: ArtifactAudienceMetadata[] = [];

  // Classify each artifact
  for (const path of options.paths) {
    const contentSensitivity = options.contentScanner?.(path) ?? undefined;
    const artifact = classifyArtifact(path, policy, contentSensitivity);
    artifacts.push(artifact);

    // Check tier audience ACL
    if (!isAudienceAllowedForTier(artifact.audience, options.tier, policy)) {
      errors.push({
        code: 'TIER_AUDIENCE_MISMATCH',
        message: `Artifact "${path}" has audience ${artifact.audience} but tier ${options.tier} only allows ${policy.tierAudienceAcl[options.tier].join(', ')}`,
        artifact: path,
      });
    }

    // Check break-glass requirements
    if (artifact.audience === 'BREAK_GLASS') {
      if (!options.breakGlassFlag && policy.breakGlassRequirements.requireExplicitFlag) {
        errors.push({
          code: 'BREAK_GLASS_WITHOUT_FLAG',
          message: `Artifact "${path}" requires BREAK_GLASS audience but --break-glass flag not set`,
          artifact: path,
        });
      }
    }

    // Check PII without redaction
    if (artifact.containsPii && !artifact.redacted) {
      errors.push({
        code: 'PII_DETECTED_NOT_REDACTED',
        message: `Artifact "${path}" contains PII but has not been redacted`,
        artifact: path,
      });
    }
  }

  // Calculate overall levels
  const overallAudience = getMostRestrictiveAudience(artifacts.map(a => a.audience));
  const overallSensitivity = getMostSensitiveSensitivity(artifacts.map(a => a.sensitivity));

  // Determine distribution availability
  const anyContainsUnredactedPii = artifacts.some(a => a.containsPii && !a.redacted);
  const allPublicSafe = artifacts.every(a => canIncludeInPublicPack(a));
  const allInternalSafe = artifacts.every(a => canIncludeInInternalPack(a) || a.redacted);

  const publicDistributionAllowed =
    PUBLIC_DISTRIBUTION_ALLOWED[options.tier] && allPublicSafe && !anyContainsUnredactedPii;

  const internalDistributionAllowed = allInternalSafe && !anyContainsUnredactedPii;

  return {
    $schema: AUDIENCE_POLICY_SCHEMA,
    toolVersion: AUDIENCE_POLICY_VERSION,
    generatedAt: new Date().toISOString(),
    recordId: '', // Filled by caller
    tier: options.tier,
    overallAudience,
    overallSensitivity,
    artifacts,
    publicDistributionAllowed,
    internalDistributionAllowed,
    policyVersion: policy.version,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate that a casefile classification passes all policy checks.
 * Returns true if classification is valid, false if errors exist.
 */
export function validateClassification(
  classification: CasefileAudienceClassification,
  policy: AudiencePolicy = DEFAULT_AUDIENCE_POLICY
): { ok: boolean; errors: AudienceClassificationError[] } {
  const errors: AudienceClassificationError[] = [...classification.errors];

  // Check policy completeness
  const tiers: ReleaseTier[] = ['ci', 'merged', 'incident'];
  for (const tier of tiers) {
    if (!policy.tierAudienceAcl[tier] || policy.tierAudienceAcl[tier].length === 0) {
      errors.push({
        code: 'POLICY_INCOMPLETE',
        message: `Policy missing audience ACL for tier: ${tier}`,
      });
    }
  }

  // Check for unredacted PII
  for (const artifact of classification.artifacts) {
    if (artifact.containsPii && !artifact.redacted) {
      // Only add if not already in errors
      const alreadyReported = errors.some(
        e => e.code === 'PII_DETECTED_NOT_REDACTED' && e.artifact === artifact.path
      );
      if (!alreadyReported) {
        errors.push({
          code: 'REDACTION_REQUIRED',
          message: `Artifact "${artifact.path}" requires redaction before distribution`,
          artifact: artifact.path,
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * Validate a public pack against classification.
 * Ensures no restricted/internal-only artifacts are included.
 */
export function validatePublicPack(
  packPaths: string[],
  classification: CasefileAudienceClassification
): { ok: boolean; errors: AudienceClassificationError[] } {
  const errors: AudienceClassificationError[] = [];

  for (const path of packPaths) {
    const artifact = classification.artifacts.find(a => a.path === path);
    if (!artifact) continue;

    if (!canIncludeInPublicPack(artifact)) {
      if (artifact.audience !== 'PUBLIC') {
        errors.push({
          code: 'PUBLIC_PACK_CONTAINS_RESTRICTED',
          message: `Public pack contains ${artifact.audience} artifact: ${path}`,
          artifact: path,
        });
      } else if (artifact.containsPii && !artifact.redacted) {
        errors.push({
          code: 'PII_DETECTED_NOT_REDACTED',
          message: `Public pack contains unredacted PII: ${path}`,
          artifact: path,
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * Validate an internal pack against classification.
 */
export function validateInternalPack(
  packPaths: string[],
  classification: CasefileAudienceClassification
): { ok: boolean; errors: AudienceClassificationError[] } {
  const errors: AudienceClassificationError[] = [];

  for (const path of packPaths) {
    const artifact = classification.artifacts.find(a => a.path === path);
    if (!artifact) continue;

    if (!canIncludeInInternalPack(artifact) && !artifact.redacted) {
      if (artifact.audience === 'RESTRICTED' || artifact.audience === 'BREAK_GLASS') {
        errors.push({
          code: 'AUDIENCE_VIOLATION',
          message: `Internal pack contains ${artifact.audience} artifact: ${path}`,
          artifact: path,
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Policy Loading
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Load audience policy from file.
 */
export function loadAudiencePolicy(policyPath: string): AudiencePolicy {
  if (!fs.existsSync(policyPath)) {
    return DEFAULT_AUDIENCE_POLICY;
  }

  try {
    const content = fs.readFileSync(policyPath, 'utf-8');
    const policy = JSON.parse(content) as AudiencePolicy;

    // Validate schema
    if (policy.$schema !== AUDIENCE_POLICY_SCHEMA) {
      console.warn(
        `Warning: Policy schema mismatch. Expected ${AUDIENCE_POLICY_SCHEMA}, got ${policy.$schema}`
      );
    }

    // Merge with defaults for missing fields
    return {
      ...DEFAULT_AUDIENCE_POLICY,
      ...policy,
      tierAudienceAcl: {
        ...DEFAULT_AUDIENCE_POLICY.tierAudienceAcl,
        ...policy.tierAudienceAcl,
      },
      breakGlassRequirements: {
        ...DEFAULT_AUDIENCE_POLICY.breakGlassRequirements,
        ...policy.breakGlassRequirements,
      },
    };
  } catch (e) {
    console.warn(`Warning: Failed to load policy from ${policyPath}: ${e}`);
    return DEFAULT_AUDIENCE_POLICY;
  }
}

/**
 * Save audience policy to file.
 */
export function saveAudiencePolicy(policy: AudiencePolicy, policyPath: string): void {
  const dir = path.dirname(policyPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(policyPath, JSON.stringify(policy, null, 2));
}
