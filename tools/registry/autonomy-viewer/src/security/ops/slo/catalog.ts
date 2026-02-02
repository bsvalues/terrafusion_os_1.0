/**
 * TerraFusion Security Plane SLO Catalog
 * ========================================
 *
 * Phase IIIh: Declarative SLO definitions for security observability.
 *
 * Design Principles:
 * - SLOs are versioned, test-validated artifacts (single source of truth)
 * - Dimensions are cardinality-bounded (allowlist-only)
 * - Objectives are reasonable defaults; policy decisions are left to operators
 * - All SLOs can be consumed by alert generators + dashboards
 */

import { ALLOWED_PROVIDERS, type AllowedProvider } from '../../telemetry/metrics.js';

// ============================================================================
// SLO Types
// ============================================================================

/**
 * Time window for SLO evaluation.
 */
export interface SloWindow {
  /** Window name for display */
  readonly name: string;
  /** Duration in seconds */
  readonly durationSeconds: number;
}

/**
 * Standard SLO windows.
 */
export const SLO_WINDOWS = {
  FAST: { name: '5m', durationSeconds: 5 * 60 } as SloWindow,
  SLOW: { name: '1h', durationSeconds: 60 * 60 } as SloWindow,
  DAILY: { name: '24h', durationSeconds: 24 * 60 * 60 } as SloWindow,
  WEEKLY: { name: '7d', durationSeconds: 7 * 24 * 60 * 60 } as SloWindow,
} as const;

/**
 * Allowed dimensions for SLO grouping.
 * Strictly bounded to prevent cardinality explosion.
 */
export const ALLOWED_SLO_DIMENSIONS = ['provider', 'code', 'stage'] as const;
export type AllowedSloDimension = (typeof ALLOWED_SLO_DIMENSIONS)[number];

/**
 * SLO objective type.
 */
export type SloObjectiveType = 'ratio' | 'threshold' | 'latency';

/**
 * SLO definition.
 */
export interface SloDefinition {
  /** Unique SLO identifier */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Description for operators */
  readonly description: string;
  /** Objective type */
  readonly type: SloObjectiveType;
  /** Target value (interpretation depends on type) */
  readonly target: number;
  /** Primary evaluation window */
  readonly window: SloWindow;
  /** Dimensions for grouping (must be from allowlist) */
  readonly dimensions: readonly AllowedSloDimension[];
  /** Numerator metric name */
  readonly numeratorMetric: string;
  /** Denominator metric name (for ratio type) */
  readonly denominatorMetric?: string;
  /** Threshold direction ('above' or 'below') */
  readonly direction?: 'above' | 'below';
  /** Version for change tracking */
  readonly version: string;
  /** Related denial codes (for runbook linkage) */
  readonly relatedCodes?: readonly string[];
}

/**
 * SLO catalog - all security plane SLOs.
 */
export interface SloCatalog {
  /** Catalog version */
  readonly version: string;
  /** Catalog schema version */
  readonly schemaVersion: string;
  /** All SLO definitions */
  readonly slos: readonly SloDefinition[];
  /** Last updated timestamp */
  readonly updatedAt: string;
}

// ============================================================================
// SLO Definitions
// ============================================================================

/**
 * Denial Rate SLO (per provider).
 * Objective: Denial rate should stay below baseline.
 */
const DENIAL_RATE_SLO: SloDefinition = {
  id: 'security.denial_rate',
  name: 'Auth Denial Rate',
  description:
    'Percentage of auth requests resulting in denial. Elevated rates indicate misconfig or attack.',
  type: 'ratio',
  target: 0.05, // 5% baseline (adjust per deployment)
  window: SLO_WINDOWS.FAST,
  dimensions: ['provider'],
  numeratorMetric: 'security.deny.total',
  denominatorMetric: 'security.auth.total',
  direction: 'below',
  version: '1.0.0',
  relatedCodes: ['DENY_DEFAULT', 'DENY_PROVIDER_ERROR', 'DENY_TOKEN_EXPIRED'],
};

/**
 * JWKS Refresh Failure Budget SLO.
 * Objective: JWKS refresh failures should stay within budget.
 */
const JWKS_REFRESH_FAILURE_SLO: SloDefinition = {
  id: 'security.jwks_refresh_failure',
  name: 'JWKS Refresh Failure Rate',
  description: 'Ratio of failed JWKS refreshes to total refreshes. Spikes indicate IdP issues.',
  type: 'ratio',
  target: 0.01, // 1% failure budget
  window: SLO_WINDOWS.SLOW,
  dimensions: ['provider'],
  numeratorMetric: 'security.jwks.refresh_fail',
  denominatorMetric: 'security.jwks.refresh_total',
  direction: 'below',
  version: '1.0.0',
  relatedCodes: ['DENY_PROVIDER_ERROR', 'DENY_TOKEN_KEY_UNKNOWN'],
};

/**
 * JWKS Cache Hit Rate SLO.
 * Objective: Cache should serve most key lookups.
 */
const JWKS_CACHE_HIT_SLO: SloDefinition = {
  id: 'security.jwks_cache_hit',
  name: 'JWKS Cache Hit Rate',
  description: 'Percentage of key lookups served from cache. Low rates indicate rotation churn.',
  type: 'ratio',
  target: 0.9, // 90% hit rate
  window: SLO_WINDOWS.SLOW,
  dimensions: ['provider'],
  numeratorMetric: 'security.jwks.cache_hit',
  denominatorMetric: 'security.jwks.cache_total',
  direction: 'above',
  version: '1.0.0',
  relatedCodes: ['DENY_TOKEN_KEY_UNKNOWN'],
};

/**
 * Provider Error Rate SLO.
 * Objective: Provider-level errors should be rare.
 */
const PROVIDER_ERROR_RATE_SLO: SloDefinition = {
  id: 'security.provider_error_rate',
  name: 'Provider Error Rate',
  description: 'Rate of provider-level errors across all auth attempts.',
  type: 'ratio',
  target: 0.001, // 0.1% error budget
  window: SLO_WINDOWS.FAST,
  dimensions: ['provider'],
  numeratorMetric: 'security.provider_error.total',
  denominatorMetric: 'security.auth.total',
  direction: 'below',
  version: '1.0.0',
  relatedCodes: ['DENY_PROVIDER_ERROR', 'DENY_PROVIDER_TIMEOUT', 'DENY_PROVIDER_CONFIG_ERROR'],
};

/**
 * Token Validation Error SLO (per code).
 * Objective: Specific token errors should be low (indicates client issues).
 */
const TOKEN_ERROR_RATE_SLO: SloDefinition = {
  id: 'security.token_error_rate',
  name: 'Token Validation Error Rate',
  description: 'Rate of token validation errors by code. Spikes indicate client misconfig.',
  type: 'ratio',
  target: 0.02, // 2% per code (high for expired, low for signature)
  window: SLO_WINDOWS.SLOW,
  dimensions: ['provider', 'code'],
  numeratorMetric: 'security.token_error.total',
  denominatorMetric: 'security.auth.total',
  direction: 'below',
  version: '1.0.0',
  relatedCodes: [
    'DENY_TOKEN_EXPIRED',
    'DENY_TOKEN_MALFORMED',
    'DENY_TOKEN_ISSUER_MISMATCH',
    'DENY_TOKEN_AUDIENCE_MISMATCH',
    'DENY_TOKEN_SIGNATURE_INVALID',
  ],
};

// ============================================================================
// Catalog Export
// ============================================================================

/**
 * The canonical SLO catalog for TerraFusion Security Plane.
 */
export const SECURITY_SLO_CATALOG: SloCatalog = {
  version: '1.0.0',
  schemaVersion: 'terrafusion.ops.slo.v1',
  slos: [
    DENIAL_RATE_SLO,
    JWKS_REFRESH_FAILURE_SLO,
    JWKS_CACHE_HIT_SLO,
    PROVIDER_ERROR_RATE_SLO,
    TOKEN_ERROR_RATE_SLO,
  ],
  updatedAt: new Date().toISOString(),
};

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate that an SLO uses only allowed dimensions.
 */
export function validateSloDimensions(slo: SloDefinition): boolean {
  for (const dim of slo.dimensions) {
    if (!ALLOWED_SLO_DIMENSIONS.includes(dim)) {
      return false;
    }
  }
  return true;
}

/**
 * Validate entire catalog.
 */
export function validateSloCatalog(catalog: SloCatalog): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!catalog.version) {
    errors.push('Catalog version is required');
  }
  if (!catalog.schemaVersion) {
    errors.push('Schema version is required');
  }
  if (!catalog.slos || catalog.slos.length === 0) {
    errors.push('At least one SLO is required');
  }

  // Validate each SLO
  const ids = new Set<string>();
  for (const slo of catalog.slos) {
    if (!slo.id) {
      errors.push('SLO id is required');
    } else if (ids.has(slo.id)) {
      errors.push(`Duplicate SLO id: ${slo.id}`);
    } else {
      ids.add(slo.id);
    }

    if (!slo.name) {
      errors.push(`SLO ${slo.id}: name is required`);
    }
    if (!slo.target || slo.target <= 0) {
      errors.push(`SLO ${slo.id}: target must be positive`);
    }
    if (slo.type === 'ratio' && slo.target > 1) {
      errors.push(`SLO ${slo.id}: ratio target must be <= 1`);
    }
    if (!validateSloDimensions(slo)) {
      errors.push(`SLO ${slo.id}: uses non-allowlisted dimensions`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get SLO by ID.
 */
export function getSloById(id: string): SloDefinition | undefined {
  return SECURITY_SLO_CATALOG.slos.find(slo => slo.id === id);
}

/**
 * Get SLOs related to a denial code.
 */
export function getSlosByDenialCode(code: string): readonly SloDefinition[] {
  return SECURITY_SLO_CATALOG.slos.filter(slo => slo.relatedCodes?.includes(code));
}

/**
 * Get all providers that have SLOs.
 */
export function getSloProviders(): readonly AllowedProvider[] {
  return ALLOWED_PROVIDERS;
}
