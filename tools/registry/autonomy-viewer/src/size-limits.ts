/**
 * Phase 4N44a – Size Limits Enforcement
 * ======================================
 *
 * Tiered size ceilings for assets, packs, and releases.
 * All limits enforced fail-closed.
 *
 * Invariants:
 *   - Per-asset max prevents single large files from bloating packs
 *   - Per-pack max constrains distribution ZIP sizes
 *   - Per-release max caps total footprint per release tag
 *   - Override path: incident tier + break-glass only
 */

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const SIZE_LIMITS_SCHEMA = 'terrafusion.autonomy.size-limits.v1';
export const SIZE_LIMITS_VERSION = '4N44.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Size limits for a single tier.
 */
export interface TierSizeLimits {
  /** Maximum size for a single asset in bytes */
  maxAssetBytes: number;
  /** Maximum size for a distribution pack (public or internal) in bytes */
  maxPackBytes: number;
  /** Maximum total footprint for a release in bytes */
  maxReleaseBytes: number;
}

/**
 * Size limits for all tiers.
 */
export interface SizeLimits {
  ci: TierSizeLimits;
  merged: TierSizeLimits;
  incident: TierSizeLimits;
}

/**
 * Error codes for size limit violations.
 */
export type SizeLimitErrorCode =
  | 'SIZE_LIMIT_EXCEEDED'
  | 'RELEASE_FOOTPRINT_EXCEEDED'
  | 'BREAK_GLASS_INVALID_TIER'
  | 'OVERRIDE_REQUIRED';

/**
 * Size validation error.
 */
export interface SizeLimitError {
  code: SizeLimitErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Result of size validation.
 */
export interface SizeValidationResult {
  ok: boolean;
  errors: SizeLimitError[];
  /** Whether break-glass override was used */
  breakGlassUsed?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Limits
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default size limits.
 *
 * CI tier: Smallest limits (ephemeral builds)
 * Merged tier: Standard limits (production releases)
 * Incident tier: Highest limits (post-incident evidence)
 */
export const DEFAULT_SIZE_LIMITS: SizeLimits = {
  ci: {
    maxAssetBytes: 50 * 1024 * 1024, // 50MB per asset
    maxPackBytes: 100 * 1024 * 1024, // 100MB per pack
    maxReleaseBytes: 500 * 1024 * 1024, // 500MB per release
  },
  merged: {
    maxAssetBytes: 100 * 1024 * 1024, // 100MB per asset
    maxPackBytes: 250 * 1024 * 1024, // 250MB per pack
    maxReleaseBytes: 1024 * 1024 * 1024, // 1GB per release
  },
  incident: {
    maxAssetBytes: 200 * 1024 * 1024, // 200MB per asset
    maxPackBytes: 500 * 1024 * 1024, // 500MB per pack
    maxReleaseBytes: 2 * 1024 * 1024 * 1024, // 2GB per release
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get size limits for a specific tier.
 */
export function getSizeLimitsForTier(
  tier: 'ci' | 'merged' | 'incident',
  limits: SizeLimits = DEFAULT_SIZE_LIMITS
): TierSizeLimits {
  return limits[tier];
}

/**
 * Format bytes as human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ─────────────────────────────────────────────────────────────────────────────
// Asset Size Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for validating asset size.
 */
export interface ValidateAssetSizeOptions {
  /** Path to the asset */
  assetPath: string;
  /** Size in bytes */
  sizeBytes: number;
  /** Release tier */
  tier: 'ci' | 'merged' | 'incident';
  /** Custom size limits (optional) */
  limits?: SizeLimits;
  /** Break-glass override flag */
  breakGlassFlag?: boolean;
}

/**
 * Validate a single asset's size against tier limits.
 */
export function validateAssetSize(options: ValidateAssetSizeOptions): SizeValidationResult {
  const {
    assetPath,
    sizeBytes,
    tier,
    limits = DEFAULT_SIZE_LIMITS,
    breakGlassFlag = false,
  } = options;

  const errors: SizeLimitError[] = [];

  // Break-glass is only valid for incident tier
  if (breakGlassFlag && tier !== 'incident') {
    return {
      ok: false,
      errors: [
        {
          code: 'BREAK_GLASS_INVALID_TIER',
          message: `Break-glass override is only valid for incident tier, got: ${tier}`,
          details: { tier },
        },
      ],
    };
  }

  const tierLimits = getSizeLimitsForTier(tier, limits);

  // Check if asset exceeds limit
  if (sizeBytes > tierLimits.maxAssetBytes) {
    // Break-glass override for incident tier
    if (breakGlassFlag && tier === 'incident') {
      return {
        ok: true,
        errors: [],
        breakGlassUsed: true,
      };
    }

    errors.push({
      code: 'SIZE_LIMIT_EXCEEDED',
      message: `Asset ${assetPath} exceeds ${tier} tier limit: ${formatBytes(sizeBytes)} > ${formatBytes(tierLimits.maxAssetBytes)}`,
      details: {
        assetPath,
        actualBytes: sizeBytes,
        limitBytes: tierLimits.maxAssetBytes,
        tier,
      },
    });
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pack Size Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for validating pack size.
 */
export interface ValidatePackSizeOptions {
  /** Pack type */
  packType: 'public' | 'internal';
  /** Size in bytes */
  sizeBytes: number;
  /** Release tier */
  tier: 'ci' | 'merged' | 'incident';
  /** Custom size limits (optional) */
  limits?: SizeLimits;
  /** Break-glass override flag */
  breakGlassFlag?: boolean;
}

/**
 * Validate a distribution pack's size against tier limits.
 */
export function validatePackSize(options: ValidatePackSizeOptions): SizeValidationResult {
  const {
    packType,
    sizeBytes,
    tier,
    limits = DEFAULT_SIZE_LIMITS,
    breakGlassFlag = false,
  } = options;

  const errors: SizeLimitError[] = [];

  // Break-glass is only valid for incident tier
  if (breakGlassFlag && tier !== 'incident') {
    return {
      ok: false,
      errors: [
        {
          code: 'BREAK_GLASS_INVALID_TIER',
          message: `Break-glass override is only valid for incident tier, got: ${tier}`,
          details: { tier },
        },
      ],
    };
  }

  const tierLimits = getSizeLimitsForTier(tier, limits);

  // Check if pack exceeds limit
  if (sizeBytes > tierLimits.maxPackBytes) {
    // Break-glass override for incident tier
    if (breakGlassFlag && tier === 'incident') {
      return {
        ok: true,
        errors: [],
        breakGlassUsed: true,
      };
    }

    errors.push({
      code: 'SIZE_LIMIT_EXCEEDED',
      message: `${packType} pack exceeds ${tier} tier limit: ${formatBytes(sizeBytes)} > ${formatBytes(tierLimits.maxPackBytes)}`,
      details: {
        packType,
        actualBytes: sizeBytes,
        limitBytes: tierLimits.maxPackBytes,
        tier,
      },
    });
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Release Footprint Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for validating release footprint.
 */
export interface ValidateReleaseFootprintOptions {
  /** Release tag */
  releaseTag: string;
  /** Total bytes across all assets */
  totalBytes: number;
  /** Release tier */
  tier: 'ci' | 'merged' | 'incident';
  /** Custom size limits (optional) */
  limits?: SizeLimits;
  /** Break-glass override flag */
  breakGlassFlag?: boolean;
}

/**
 * Validate a release's total footprint against tier limits.
 */
export function validateReleaseFootprint(
  options: ValidateReleaseFootprintOptions
): SizeValidationResult {
  const {
    releaseTag,
    totalBytes,
    tier,
    limits = DEFAULT_SIZE_LIMITS,
    breakGlassFlag = false,
  } = options;

  const errors: SizeLimitError[] = [];

  // Break-glass is only valid for incident tier
  if (breakGlassFlag && tier !== 'incident') {
    return {
      ok: false,
      errors: [
        {
          code: 'BREAK_GLASS_INVALID_TIER',
          message: `Break-glass override is only valid for incident tier, got: ${tier}`,
          details: { tier },
        },
      ],
    };
  }

  const tierLimits = getSizeLimitsForTier(tier, limits);

  // Check if release exceeds footprint limit
  if (totalBytes > tierLimits.maxReleaseBytes) {
    // Break-glass override for incident tier
    if (breakGlassFlag && tier === 'incident') {
      return {
        ok: true,
        errors: [],
        breakGlassUsed: true,
      };
    }

    errors.push({
      code: 'RELEASE_FOOTPRINT_EXCEEDED',
      message: `Release ${releaseTag} exceeds ${tier} tier footprint limit: ${formatBytes(totalBytes)} > ${formatBytes(tierLimits.maxReleaseBytes)}`,
      details: {
        releaseTag,
        actualBytes: totalBytes,
        limitBytes: tierLimits.maxReleaseBytes,
        tier,
      },
    });
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulk Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Asset entry for bulk validation.
 */
export interface AssetEntry {
  path: string;
  sizeBytes: number;
}

/**
 * Options for bulk validation.
 */
export interface ValidateBulkOptions {
  /** Assets to validate */
  assets: AssetEntry[];
  /** Release tier */
  tier: 'ci' | 'merged' | 'incident';
  /** Release tag (for footprint validation) */
  releaseTag?: string;
  /** Custom size limits (optional) */
  limits?: SizeLimits;
  /** Break-glass override flag */
  breakGlassFlag?: boolean;
}

/**
 * Bulk validation result.
 */
export interface BulkValidationResult {
  ok: boolean;
  errors: SizeLimitError[];
  /** Total bytes across all assets */
  totalBytes: number;
  /** Number of assets over limit */
  oversizedAssets: number;
  /** Whether break-glass override was used */
  breakGlassUsed?: boolean;
}

/**
 * Validate multiple assets and total footprint.
 */
export function validateBulk(options: ValidateBulkOptions): BulkValidationResult {
  const {
    assets,
    tier,
    releaseTag,
    limits = DEFAULT_SIZE_LIMITS,
    breakGlassFlag = false,
  } = options;

  const errors: SizeLimitError[] = [];
  let totalBytes = 0;
  let oversizedAssets = 0;
  let breakGlassUsed = false;

  // Validate each asset
  for (const asset of assets) {
    totalBytes += asset.sizeBytes;

    const result = validateAssetSize({
      assetPath: asset.path,
      sizeBytes: asset.sizeBytes,
      tier,
      limits,
      breakGlassFlag,
    });

    if (!result.ok) {
      errors.push(...result.errors);
      oversizedAssets++;
    }

    if (result.breakGlassUsed) {
      breakGlassUsed = true;
    }
  }

  // Validate release footprint
  if (releaseTag) {
    const footprintResult = validateReleaseFootprint({
      releaseTag,
      totalBytes,
      tier,
      limits,
      breakGlassFlag,
    });

    if (!footprintResult.ok) {
      errors.push(...footprintResult.errors);
    }

    if (footprintResult.breakGlassUsed) {
      breakGlassUsed = true;
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    totalBytes,
    oversizedAssets,
    breakGlassUsed: breakGlassUsed || undefined,
  };
}
