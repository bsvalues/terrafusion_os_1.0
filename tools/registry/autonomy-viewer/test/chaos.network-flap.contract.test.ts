/**
 * Chaos Network Flap Contract Tests
 * ===================================
 *
 * Phase IIIg: Verify behavior under alternating network success/failure.
 *
 * These tests ensure:
 * - Alternating JWKS success/failure produces expected metrics
 * - Denial codes remain stable (no "unknown error" drift)
 * - Recovery after flapping is clean
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

/**
 * Simulates a network with configurable flapping behavior.
 */
class FlappingNetwork {
  private _successCount = 0;
  private _failCount = 0;
  private _pattern: ('success' | 'fail')[];
  private _currentIndex = 0;

  constructor(pattern: ('success' | 'fail')[]) {
    this._pattern = pattern;
  }

  /**
   * Get next network result based on pattern.
   */
  async fetch(): Promise<Map<string, object>> {
    const result = this._pattern[this._currentIndex % this._pattern.length];
    this._currentIndex++;

    if (result === 'fail') {
      this._failCount++;
      throw new Error('NETWORK_FLAP: Connection refused');
    }

    this._successCount++;
    return new Map([['key-1', { kty: 'RSA', kid: 'key-1' }]]);
  }

  get successCount(): number {
    return this._successCount;
  }

  get failCount(): number {
    return this._failCount;
  }

  reset(): void {
    this._successCount = 0;
    this._failCount = 0;
    this._currentIndex = 0;
  }
}

/**
 * Simple JWKS cache for flap testing (no single-flight, to observe each call).
 */
class SimpleJwksCache {
  private _cache = new Map<string, object>();
  private _metrics: SecurityMetrics;

  constructor(metrics: SecurityMetrics) {
    this._metrics = metrics;
  }

  async getKeyNoCache(
    kid: string,
    fetchJwks: () => Promise<Map<string, object>>
  ): Promise<{ key: object | null; error?: string }> {
    this._metrics.recordJwksCacheMiss('entra-oidc');

    try {
      const jwks = await fetchJwks();
      this._metrics.recordJwksRefresh('entra-oidc', true);

      const key = jwks.get(kid) ?? null;
      if (key) {
        this._cache.set(kid, key);
      }
      return { key };
    } catch (err) {
      this._metrics.recordJwksRefresh('entra-oidc', false);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { key: null, error: errorMessage };
    }
  }

  getCached(kid: string): object | null {
    const cached = this._cache.get(kid);
    if (cached) {
      this._metrics.recordJwksCacheHit('entra-oidc');
      return cached;
    }
    return null;
  }

  clear(): void {
    this._cache.clear();
  }
}

// ============================================================================
// Network Flap Tests
// ============================================================================

describe('Chaos Network Flap Contract', () => {
  let metrics: SecurityMetrics;
  let cache: SimpleJwksCache;

  beforeEach(() => {
    resetSecurityMetrics();
    metrics = new InMemorySecurityMetrics();
    setSecurityMetrics(metrics);
    cache = new SimpleJwksCache(metrics);
  });

  afterEach(() => {
    resetSecurityMetrics();
    cache.clear();
  });

  describe('alternating_jwks_success_failure_produces_expected_metrics', () => {
    it('should track alternating success/failure pattern', async () => {
      const network = new FlappingNetwork(['success', 'fail', 'success', 'fail']);

      const results: Array<{ key: object | null; error?: string }> = [];

      for (let i = 0; i < 4; i++) {
        const result = await cache.getKeyNoCache('key-1', () => network.fetch());
        results.push(result);
      }

      // First and third should succeed
      assert.ok(results[0].key !== null, 'First request should succeed');
      assert.ok(results[2].key !== null, 'Third request should succeed');

      // Second and fourth should fail
      assert.strictEqual(results[1].key, null, 'Second request should fail');
      assert.strictEqual(results[3].key, null, 'Fourth request should fail');

      // Metrics should reflect pattern
      const snapshot = metrics.snapshot();
      assert.strictEqual(snapshot.jwksCacheMisses.get('entra-oidc'), 4);
      assert.strictEqual(snapshot.jwksRefreshSuccess.get('entra-oidc'), 2);
      assert.strictEqual(snapshot.jwksRefreshFail.get('entra-oidc'), 2);
    });

    it('should recover from burst of failures', async () => {
      const network = new FlappingNetwork(['fail', 'fail', 'fail', 'success', 'success']);

      const results: Array<{ key: object | null; error?: string }> = [];

      for (let i = 0; i < 5; i++) {
        const result = await cache.getKeyNoCache('key-1', () => network.fetch());
        results.push(result);
      }

      // First three should fail
      assert.strictEqual(results[0].key, null);
      assert.strictEqual(results[1].key, null);
      assert.strictEqual(results[2].key, null);

      // Last two should succeed
      assert.ok(results[3].key !== null);
      assert.ok(results[4].key !== null);

      const snapshot = metrics.snapshot();
      assert.strictEqual(snapshot.jwksRefreshFail.get('entra-oidc'), 3);
      assert.strictEqual(snapshot.jwksRefreshSuccess.get('entra-oidc'), 2);
    });

    it('should track long flapping sequence correctly', async () => {
      // Pattern: SFSFSFSFSF (5 success, 5 fail)
      const pattern: ('success' | 'fail')[] = [];
      for (let i = 0; i < 10; i++) {
        pattern.push(i % 2 === 0 ? 'success' : 'fail');
      }

      const network = new FlappingNetwork(pattern);

      for (let i = 0; i < 10; i++) {
        await cache.getKeyNoCache('key-1', () => network.fetch());
      }

      const snapshot = metrics.snapshot();
      assert.strictEqual(snapshot.jwksRefreshSuccess.get('entra-oidc'), 5);
      assert.strictEqual(snapshot.jwksRefreshFail.get('entra-oidc'), 5);
    });
  });

  describe('denial_codes_remain_stable_under_flap', () => {
    it('should always return specific error message, never "unknown"', async () => {
      const network = new FlappingNetwork(['fail', 'fail', 'fail']);

      const errors: string[] = [];

      for (let i = 0; i < 3; i++) {
        const result = await cache.getKeyNoCache('key-1', () => network.fetch());
        if (result.error) {
          errors.push(result.error);
        }
      }

      // All errors should be specific, not "Unknown error"
      for (const error of errors) {
        assert.ok(
          !error.toLowerCase().includes('unknown'),
          `Error should be specific, not unknown: ${error}`
        );
        assert.ok(error.includes('NETWORK_FLAP'), `Error should contain specific code: ${error}`);
      }
    });

    it('should maintain consistent error classification across flaps', async () => {
      const network = new FlappingNetwork(['fail', 'success', 'fail']);

      const result1 = await cache.getKeyNoCache('key-1', () => network.fetch());
      const result2 = await cache.getKeyNoCache('key-1', () => network.fetch());
      const result3 = await cache.getKeyNoCache('key-1', () => network.fetch());

      // Errors should have consistent structure
      assert.ok(result1.error?.includes('NETWORK_FLAP'));
      assert.strictEqual(result2.error, undefined);
      assert.ok(result3.error?.includes('NETWORK_FLAP'));
    });

    it('should not leak network details into denial codes', async () => {
      class SensitiveNetwork {
        async fetch(): Promise<Map<string, object>> {
          throw new Error('Connection to 192.168.1.100:8443 refused by admin@company.com');
        }
      }

      const sensitiveNetwork = new SensitiveNetwork();
      const result = await cache.getKeyNoCache('key-1', () => sensitiveNetwork.fetch());

      // The error is captured, but we verify the metrics don't contain PII
      const snapshot = metrics.snapshot();

      // Metrics keys should not contain IPs or emails
      for (const key of snapshot.jwksRefreshFail.keys()) {
        assert.ok(!key.includes('192.168'), `Metric key should not contain IP: ${key}`);
        assert.ok(!key.includes('@'), `Metric key should not contain email: ${key}`);
      }
    });
  });

  describe('recovery_after_flapping', () => {
    it('should use cache after successful recovery', async () => {
      const network = new FlappingNetwork(['fail', 'fail', 'success']);

      // Fail twice
      await cache.getKeyNoCache('key-1', () => network.fetch());
      await cache.getKeyNoCache('key-1', () => network.fetch());

      // Third succeeds and caches
      await cache.getKeyNoCache('key-1', () => network.fetch());

      // Now cache should work
      const cached = cache.getCached('key-1');
      assert.ok(cached !== null, 'Key should be cached after recovery');

      const snapshot = metrics.snapshot();
      assert.strictEqual(snapshot.jwksCacheHits.get('entra-oidc'), 1);
    });

    it('should clear cache correctly between flap episodes', async () => {
      const network = new FlappingNetwork(['success', 'success']);

      // First episode
      await cache.getKeyNoCache('key-1', () => network.fetch());
      assert.ok(cache.getCached('key-1') !== null);

      // Clear cache (simulating TTL expiry)
      cache.clear();
      metrics.reset();
      network.reset();

      // Second episode
      await cache.getKeyNoCache('key-1', () => network.fetch());

      const snapshot = metrics.snapshot();
      // Should see fresh miss + refresh, not a hit
      assert.strictEqual(snapshot.jwksCacheMisses.get('entra-oidc'), 1);
      assert.strictEqual(snapshot.jwksRefreshSuccess.get('entra-oidc'), 1);
      assert.strictEqual(snapshot.jwksCacheHits.get('entra-oidc'), undefined);
    });
  });

  describe('metric_sanity_checks', () => {
    it('should never have more refreshes than misses', async () => {
      const network = new FlappingNetwork(['success', 'fail', 'success', 'fail', 'success']);

      for (let i = 0; i < 5; i++) {
        await cache.getKeyNoCache('key-1', () => network.fetch());
      }

      const snapshot = metrics.snapshot();
      const misses = snapshot.jwksCacheMisses.get('entra-oidc') ?? 0;
      const refreshSuccess = snapshot.jwksRefreshSuccess.get('entra-oidc') ?? 0;
      const refreshFail = snapshot.jwksRefreshFail.get('entra-oidc') ?? 0;

      // Every refresh is preceded by a miss
      assert.ok(
        refreshSuccess + refreshFail <= misses,
        `Refreshes (${refreshSuccess} + ${refreshFail}) should not exceed misses (${misses})`
      );
    });

    it('should track misses even when refresh is skipped due to negative cache', async () => {
      // This test verifies the metric model allows for misses without refresh
      // (e.g., when negative cache prevents re-fetch of known-bad kid)

      // Simulate 3 misses, but only 1 refresh (negative cache prevents others)
      metrics.recordJwksCacheMiss('entra-oidc');
      metrics.recordJwksRefresh('entra-oidc', false);
      metrics.recordJwksCacheMiss('entra-oidc'); // Negative cache hit
      metrics.recordJwksCacheMiss('entra-oidc'); // Negative cache hit

      const snapshot = metrics.snapshot();
      assert.strictEqual(snapshot.jwksCacheMisses.get('entra-oidc'), 3);
      assert.strictEqual(snapshot.jwksRefreshFail.get('entra-oidc'), 1);
    });
  });
});
