/**
 * JWKS Cache Metrics Contract Tests
 * ===================================
 *
 * Phase IIIg: Verify JWKS cache telemetry (hit/miss/refresh/fail).
 *
 * These tests ensure:
 * - Cache hits are recorded when key is found in cache
 * - Cache misses trigger refresh and record appropriately
 * - Refresh failures are recorded and auth still denies
 */

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
    InMemorySecurityMetrics,
    resetSecurityMetrics,
    setSecurityMetrics,
    type SecurityMetrics
} from '../src/security/telemetry/metrics.js';

// ============================================================================
// Test Fixtures
// ============================================================================

// Simulated JWKS cache behavior
class MockJwksCache {
  private _cache = new Map<string, { key: object; timestamp: number }>();
  private _metrics: SecurityMetrics;
  private readonly _cacheTtlMs = 5 * 60 * 1000; // 5 minutes

  constructor(metrics: SecurityMetrics) {
    this._metrics = metrics;
  }

  /**
   * Simulate JWKS key lookup with metrics emission.
   */
  async getKey(
    kid: string,
    fetchJwks: () => Promise<Map<string, object>>
  ): Promise<{ key: object | null; fromCache: boolean }> {
    // Check cache first
    const cached = this._cache.get(kid);
    const now = Date.now();

    if (cached && now - cached.timestamp < this._cacheTtlMs) {
      this._metrics.recordJwksCacheHit('entra-oidc');
      return { key: cached.key, fromCache: true };
    }

    // Cache miss - need to refresh
    this._metrics.recordJwksCacheMiss('entra-oidc');

    try {
      const jwks = await fetchJwks();

      // Record successful refresh
      this._metrics.recordJwksRefresh('entra-oidc', true);

      // Update cache with all keys
      for (const [keyId, keyData] of jwks) {
        this._cache.set(keyId, { key: keyData, timestamp: now });
      }

      // Return the requested key
      const key = jwks.get(kid) ?? null;
      return { key, fromCache: false };
    } catch {
      // Record failed refresh
      this._metrics.recordJwksRefresh('entra-oidc', false);
      return { key: null, fromCache: false };
    }
  }

  /**
   * Pre-populate cache for testing.
   */
  setCache(kid: string, key: object): void {
    this._cache.set(kid, { key, timestamp: Date.now() });
  }

  /**
   * Clear cache.
   */
  clear(): void {
    this._cache.clear();
  }
}

// ============================================================================
// JWKS Cache Metrics Tests
// ============================================================================

describe('JWKS Cache Metrics Contract', () => {
  let metrics: SecurityMetrics;
  let cache: MockJwksCache;

  beforeEach(() => {
    resetSecurityMetrics();
    metrics = new InMemorySecurityMetrics();
    setSecurityMetrics(metrics);
    cache = new MockJwksCache(metrics);
  });

  afterEach(() => {
    resetSecurityMetrics();
  });

  describe('emits_hit_on_cached_key_resolution', () => {
    it('should emit cache hit when key is in cache', async () => {
      const mockKey = { kty: 'RSA', kid: 'key-1', n: 'abc', e: 'AQAB' };
      cache.setCache('key-1', mockKey);

      const result = await cache.getKey('key-1', async () => new Map());

      assert.ok(result.fromCache, 'Key should be from cache');
      assert.deepStrictEqual(result.key, mockKey);

      const snapshot = metrics.snapshot();
      assert.strictEqual(snapshot.jwksCacheHits.get('entra-oidc'), 1);
      assert.strictEqual(snapshot.jwksCacheMisses.get('entra-oidc'), undefined);
    });

    it('should emit multiple cache hits for repeated lookups', async () => {
      const mockKey = { kty: 'RSA', kid: 'key-1', n: 'abc', e: 'AQAB' };
      cache.setCache('key-1', mockKey);

      await cache.getKey('key-1', async () => new Map());
      await cache.getKey('key-1', async () => new Map());
      await cache.getKey('key-1', async () => new Map());

      const snapshot = metrics.snapshot();
      assert.strictEqual(snapshot.jwksCacheHits.get('entra-oidc'), 3);
    });
  });

  describe('emits_miss_then_refresh_on_unknown_kid', () => {
    it('should emit cache miss and refresh on unknown key', async () => {
      const fetchedKeys = new Map([
        ['key-new', { kty: 'RSA', kid: 'key-new', n: 'xyz', e: 'AQAB' }],
      ]);

      const result = await cache.getKey('key-new', async () => fetchedKeys);

      assert.ok(!result.fromCache, 'Key should not be from cache');
      assert.deepStrictEqual(result.key, fetchedKeys.get('key-new'));

      const snapshot = metrics.snapshot();
      assert.strictEqual(snapshot.jwksCacheMisses.get('entra-oidc'), 1);
      assert.strictEqual(snapshot.jwksRefreshSuccess.get('entra-oidc'), 1);
      assert.strictEqual(snapshot.jwksCacheHits.get('entra-oidc'), undefined);
    });

    it('should emit miss then hit on second lookup after refresh', async () => {
      const fetchedKeys = new Map([
        ['key-new', { kty: 'RSA', kid: 'key-new', n: 'xyz', e: 'AQAB' }],
      ]);

      // First lookup - miss + refresh
      await cache.getKey('key-new', async () => fetchedKeys);

      // Second lookup - should be cached now
      await cache.getKey('key-new', async () => fetchedKeys);

      const snapshot = metrics.snapshot();
      assert.strictEqual(snapshot.jwksCacheMisses.get('entra-oidc'), 1);
      assert.strictEqual(snapshot.jwksRefreshSuccess.get('entra-oidc'), 1);
      assert.strictEqual(snapshot.jwksCacheHits.get('entra-oidc'), 1);
    });
  });

  describe('emits_fail_on_refresh_error_and_auth_denies', () => {
    it('should emit refresh failure on network error', async () => {
      const result = await cache.getKey('key-missing', async () => {
        throw new Error('Network timeout');
      });

      assert.strictEqual(result.key, null, 'Key should be null on failure');
      assert.ok(!result.fromCache, 'Should not be from cache');

      const snapshot = metrics.snapshot();
      assert.strictEqual(snapshot.jwksCacheMisses.get('entra-oidc'), 1);
      assert.strictEqual(snapshot.jwksRefreshFail.get('entra-oidc'), 1);
      assert.strictEqual(snapshot.jwksRefreshSuccess.get('entra-oidc'), undefined);
    });

    it('should track multiple refresh failures independently', async () => {
      // First failure
      await cache.getKey('key-1', async () => {
        throw new Error('Network timeout');
      });

      // Second failure
      await cache.getKey('key-2', async () => {
        throw new Error('DNS error');
      });

      // Third attempt succeeds
      await cache.getKey('key-3', async () => new Map([['key-3', { kty: 'RSA' }]]));

      const snapshot = metrics.snapshot();
      assert.strictEqual(snapshot.jwksCacheMisses.get('entra-oidc'), 3);
      assert.strictEqual(snapshot.jwksRefreshFail.get('entra-oidc'), 2);
      assert.strictEqual(snapshot.jwksRefreshSuccess.get('entra-oidc'), 1);
    });

    it('should return null key on refresh failure (auth should deny)', async () => {
      const result = await cache.getKey('key-missing', async () => {
        throw new Error('JWKS endpoint unavailable');
      });

      // Auth decision should fail-closed when key is null
      assert.strictEqual(result.key, null);
      // The auth layer would use this null to deny
    });
  });

  describe('metric_correctness_under_mixed_workload', () => {
    it('should correctly track hit/miss/refresh ratios', async () => {
      // Pre-populate some keys
      cache.setCache('key-cached-1', { kty: 'RSA' });
      cache.setCache('key-cached-2', { kty: 'RSA' });

      // Simulate mixed workload
      await cache.getKey('key-cached-1', async () => new Map()); // hit
      await cache.getKey('key-cached-2', async () => new Map()); // hit
      await cache.getKey('key-new-1', async () => new Map([['key-new-1', { kty: 'RSA' }]])); // miss + refresh
      await cache.getKey('key-cached-1', async () => new Map()); // hit
      await cache.getKey('key-fail', async () => {
        throw new Error('fail');
      }); // miss + fail

      const snapshot = metrics.snapshot();
      assert.strictEqual(snapshot.jwksCacheHits.get('entra-oidc'), 3, '3 cache hits');
      assert.strictEqual(snapshot.jwksCacheMisses.get('entra-oidc'), 2, '2 cache misses');
      assert.strictEqual(snapshot.jwksRefreshSuccess.get('entra-oidc'), 1, '1 successful refresh');
      assert.strictEqual(snapshot.jwksRefreshFail.get('entra-oidc'), 1, '1 failed refresh');
    });
  });

  describe('metrics_are_pii_free', () => {
    it('should not include token data in metric keys', async () => {
      // Simulate lookup with various keys (which could contain token-derived data)
      const tokenDerivedKid = 'user-123-session-abc-tid-xyz';
      cache.setCache(tokenDerivedKid, { kty: 'RSA' });

      await cache.getKey(tokenDerivedKid, async () => new Map());

      const snapshot = metrics.snapshot();

      // Verify the metric key is provider-only, not kid-derived
      for (const key of snapshot.jwksCacheHits.keys()) {
        assert.ok(!key.includes('user'), `Metric key should not contain user data: ${key}`);
        assert.ok(!key.includes('session'), `Metric key should not contain session data: ${key}`);
        assert.ok(!key.includes('tid'), `Metric key should not contain tenant data: ${key}`);
      }
    });
  });
});
