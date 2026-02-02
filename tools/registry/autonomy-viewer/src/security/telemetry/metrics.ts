/**
 * TerraFusion Security Telemetry Facade
 * =======================================
 *
 * Phase IIIg: Bounded-cardinality, PII-clean metrics for security plane.
 *
 * Design Constraints:
 * - All labels must be from the ALLOWED_LABELS allowlist (cardinality-capped)
 * - No PII in labels (no sub, oid, email, tid, iss, aud, ip, user-agent)
 * - Telemetry failures MUST NOT affect auth decisions (fail-silent)
 * - All counters are monotonic (no resets except process restart)
 *
 * Usage:
 *   const metrics = getSecurityMetrics();
 *   metrics.incrementDeny('entra-oidc', 'DENY_TOKEN_EXPIRED');
 *   metrics.recordJwksCacheHit('entra-oidc');
 */

// ============================================================================
// Label Allowlist (cardinality-bounded)
// ============================================================================

/**
 * Allowed label keys for security metrics.
 * Adding new labels requires RC gate approval.
 */
export const ALLOWED_LABEL_KEYS = ['provider', 'code', 'stage', 'outcome'] as const;
export type AllowedLabelKey = (typeof ALLOWED_LABEL_KEYS)[number];

/**
 * Allowed provider values (bounded set).
 */
export const ALLOWED_PROVIDERS = ['env', 'file', 'entra-oidc', 'static'] as const;
export type AllowedProvider = (typeof ALLOWED_PROVIDERS)[number];

/**
 * Allowed JWKS cache stages (bounded set).
 */
export const ALLOWED_JWKS_STAGES = ['lookup', 'refresh_start', 'refresh_success', 'refresh_fail'] as const;
export type AllowedJwksStage = (typeof ALLOWED_JWKS_STAGES)[number];

/**
 * Allowed JWKS cache outcomes (bounded set).
 */
export const ALLOWED_JWKS_OUTCOMES = ['hit', 'miss', 'refresh', 'fail'] as const;
export type AllowedJwksOutcome = (typeof ALLOWED_JWKS_OUTCOMES)[number];

/**
 * Validate that a label set contains only allowed keys.
 * Returns true if valid, throws if config error (not runtime).
 */
export function validateLabels(labels: Record<string, string>): boolean {
  for (const key of Object.keys(labels)) {
    if (!ALLOWED_LABEL_KEYS.includes(key as AllowedLabelKey)) {
      throw new Error(
        `TELEMETRY_CONFIG_ERROR: Label key '${key}' is not in allowlist. ` +
          `Allowed: ${ALLOWED_LABEL_KEYS.join(', ')}`
      );
    }
  }
  return true;
}

// ============================================================================
// Metrics Interface
// ============================================================================

/**
 * Security metrics facade.
 * Implementations must be fail-silent (no exceptions propagated to auth path).
 */
export interface SecurityMetrics {
  /**
   * Increment the DENY counter for a specific denial code.
   * @param provider - The provider that issued the denial
   * @param code - The DENY_* code (e.g., 'DENY_TOKEN_EXPIRED')
   */
  incrementDeny(provider: AllowedProvider, code: string): void;

  /**
   * Increment the ALLOW counter (successful auth).
   * @param provider - The provider that allowed the request
   */
  incrementAllow(provider: AllowedProvider): void;

  /**
   * Record a JWKS cache hit (key found in cache).
   * @param provider - The provider name
   */
  recordJwksCacheHit(provider: AllowedProvider): void;

  /**
   * Record a JWKS cache miss (key not in cache, refresh required).
   * @param provider - The provider name
   */
  recordJwksCacheMiss(provider: AllowedProvider): void;

  /**
   * Record a JWKS refresh attempt.
   * @param provider - The provider name
   * @param success - Whether the refresh succeeded
   */
  recordJwksRefresh(provider: AllowedProvider, success: boolean): void;

  /**
   * Get current metric values (for testing/debugging).
   * Returns a snapshot of all counters.
   */
  snapshot(): MetricsSnapshot;

  /**
   * Reset all counters (for testing only).
   */
  reset(): void;
}

/**
 * Snapshot of current metric values.
 */
export interface MetricsSnapshot {
  readonly denyCounters: ReadonlyMap<string, number>;
  readonly allowCounters: ReadonlyMap<string, number>;
  readonly jwksCacheHits: ReadonlyMap<string, number>;
  readonly jwksCacheMisses: ReadonlyMap<string, number>;
  readonly jwksRefreshSuccess: ReadonlyMap<string, number>;
  readonly jwksRefreshFail: ReadonlyMap<string, number>;
}

// ============================================================================
// In-Memory Implementation (default, no external dependencies)
// ============================================================================

/**
 * In-memory metrics implementation.
 * Thread-safe for single-process Node.js (no SharedArrayBuffer needed).
 * Fail-silent: all methods catch and log errors internally.
 */
export class InMemorySecurityMetrics implements SecurityMetrics {
  private readonly _denyCounters = new Map<string, number>();
  private readonly _allowCounters = new Map<string, number>();
  private readonly _jwksCacheHits = new Map<string, number>();
  private readonly _jwksCacheMisses = new Map<string, number>();
  private readonly _jwksRefreshSuccess = new Map<string, number>();
  private readonly _jwksRefreshFail = new Map<string, number>();

  private _safeIncrement(map: Map<string, number>, key: string): void {
    try {
      const current = map.get(key) ?? 0;
      map.set(key, current + 1);
    } catch {
      // Fail-silent: telemetry must not affect auth
    }
  }

  incrementDeny(provider: AllowedProvider, code: string): void {
    const key = `${provider}:${code}`;
    this._safeIncrement(this._denyCounters, key);
  }

  incrementAllow(provider: AllowedProvider): void {
    this._safeIncrement(this._allowCounters, provider);
  }

  recordJwksCacheHit(provider: AllowedProvider): void {
    this._safeIncrement(this._jwksCacheHits, provider);
  }

  recordJwksCacheMiss(provider: AllowedProvider): void {
    this._safeIncrement(this._jwksCacheMisses, provider);
  }

  recordJwksRefresh(provider: AllowedProvider, success: boolean): void {
    if (success) {
      this._safeIncrement(this._jwksRefreshSuccess, provider);
    } else {
      this._safeIncrement(this._jwksRefreshFail, provider);
    }
  }

  snapshot(): MetricsSnapshot {
    return {
      denyCounters: new Map(this._denyCounters),
      allowCounters: new Map(this._allowCounters),
      jwksCacheHits: new Map(this._jwksCacheHits),
      jwksCacheMisses: new Map(this._jwksCacheMisses),
      jwksRefreshSuccess: new Map(this._jwksRefreshSuccess),
      jwksRefreshFail: new Map(this._jwksRefreshFail),
    };
  }

  reset(): void {
    this._denyCounters.clear();
    this._allowCounters.clear();
    this._jwksCacheHits.clear();
    this._jwksCacheMisses.clear();
    this._jwksRefreshSuccess.clear();
    this._jwksRefreshFail.clear();
  }
}

// ============================================================================
// No-op Implementation (for environments where metrics are disabled)
// ============================================================================

/**
 * No-op metrics implementation.
 * All methods are empty; used when telemetry is disabled.
 */
export class NoopSecurityMetrics implements SecurityMetrics {
  incrementDeny(): void {
    // No-op
  }

  incrementAllow(): void {
    // No-op
  }

  recordJwksCacheHit(): void {
    // No-op
  }

  recordJwksCacheMiss(): void {
    // No-op
  }

  recordJwksRefresh(): void {
    // No-op
  }

  snapshot(): MetricsSnapshot {
    return {
      denyCounters: new Map(),
      allowCounters: new Map(),
      jwksCacheHits: new Map(),
      jwksCacheMisses: new Map(),
      jwksRefreshSuccess: new Map(),
      jwksRefreshFail: new Map(),
    };
  }

  reset(): void {
    // No-op
  }
}

// ============================================================================
// Global Singleton Access
// ============================================================================

let _globalMetrics: SecurityMetrics | null = null;

/**
 * Get the global security metrics instance.
 * Creates InMemorySecurityMetrics if not set.
 */
export function getSecurityMetrics(): SecurityMetrics {
  if (!_globalMetrics) {
    _globalMetrics = new InMemorySecurityMetrics();
  }
  return _globalMetrics;
}

/**
 * Set the global security metrics instance.
 * Use at application startup to inject OpenTelemetry adapter, etc.
 */
export function setSecurityMetrics(metrics: SecurityMetrics): void {
  _globalMetrics = metrics;
}

/**
 * Reset the global metrics instance (for testing).
 */
export function resetSecurityMetrics(): void {
  _globalMetrics = null;
}
