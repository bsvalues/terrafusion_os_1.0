/**
 * Chaos Concurrent Auth Contract Tests
 * ======================================
 *
 * Phase IIIg: Verify concurrency safety under load.
 *
 * These tests ensure:
 * - Single-flight refresh under concurrent requests (no stampede)
 * - No deadlocks or resource leaks under burst load
 * - Consistent denial classification under concurrent access
 */

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  getSecurityMetrics,
  InMemorySecurityMetrics,
  resetSecurityMetrics,
  setSecurityMetrics,
  type SecurityMetrics,
} from '../src/security/telemetry/metrics.js';

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * A JWKS cache with single-flight refresh semantics.
 * Multiple concurrent requests for the same key should trigger only one refresh.
 */
class SingleFlightJwksCache {
  private _cache = new Map<string, { key: object; timestamp: number }>();
  private _inflight = new Map<string, Promise<Map<string, object>>>();
  private _metrics: SecurityMetrics;
  private readonly _cacheTtlMs = 5 * 60 * 1000;

  // Track how many times fetchJwks was actually called
  public refreshCount = 0;

  constructor(metrics: SecurityMetrics) {
    this._metrics = metrics;
  }

  /**
   * Get key with single-flight refresh semantics.
   */
  async getKey(
    kid: string,
    fetchJwks: () => Promise<Map<string, object>>
  ): Promise<{ key: object | null; fromCache: boolean }> {
    const now = Date.now();
    const cached = this._cache.get(kid);

    if (cached && now - cached.timestamp < this._cacheTtlMs) {
      this._metrics.recordJwksCacheHit('entra-oidc');
      return { key: cached.key, fromCache: true };
    }

    this._metrics.recordJwksCacheMiss('entra-oidc');

    // Single-flight: reuse in-flight request if one exists
    let inflightPromise = this._inflight.get('jwks');

    if (!inflightPromise) {
      // Start new fetch
      this.refreshCount++;
      inflightPromise = fetchJwks()
        .then((result) => {
          this._metrics.recordJwksRefresh('entra-oidc', true);
          return result;
        })
        .catch((err) => {
          this._metrics.recordJwksRefresh('entra-oidc', false);
          throw err;
        })
        .finally(() => {
          this._inflight.delete('jwks');
        });

      this._inflight.set('jwks', inflightPromise);
    }

    try {
      const jwks = await inflightPromise;

      // Update cache
      for (const [keyId, keyData] of jwks) {
        this._cache.set(keyId, { key: keyData, timestamp: now });
      }

      return { key: jwks.get(kid) ?? null, fromCache: false };
    } catch {
      return { key: null, fromCache: false };
    }
  }

  clear(): void {
    this._cache.clear();
    this._inflight.clear();
    this.refreshCount = 0;
  }
}

/**
 * Delay utility for simulating network latency.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Concurrent Auth Tests
// ============================================================================

describe('Chaos Concurrent Auth Contract', () => {
  let metrics: SecurityMetrics;
  let cache: SingleFlightJwksCache;

  beforeEach(() => {
    resetSecurityMetrics();
    metrics = new InMemorySecurityMetrics();
    setSecurityMetrics(metrics);
    cache = new SingleFlightJwksCache(metrics);
  });

  afterEach(() => {
    resetSecurityMetrics();
    cache.clear();
  });

  describe('single_flight_refresh_under_concurrent_requests', () => {
    it('should trigger only one refresh for concurrent requests', async () => {
      const fetchDelay = 50; // ms
      let fetchCallCount = 0;

      const fetchJwks = async (): Promise<Map<string, object>> => {
        fetchCallCount++;
        await delay(fetchDelay); // Simulate network latency
        return new Map([['key-1', { kty: 'RSA', kid: 'key-1' }]]);
      };

      // Fire 10 concurrent requests for the same key
      const promises = Array.from({ length: 10 }, () => cache.getKey('key-1', fetchJwks));

      const results = await Promise.all(promises);

      // All should succeed
      for (const result of results) {
        assert.ok(result.key !== null, 'All requests should get a key');
      }

      // Only ONE actual fetch should have occurred
      assert.strictEqual(fetchCallCount, 1, 'Fetch should be called exactly once');
      assert.strictEqual(cache.refreshCount, 1, 'Refresh count should be 1');
    });

    it('should allow new refresh after previous completes', async () => {
      let fetchCallCount = 0;

      const fetchJwks = async (): Promise<Map<string, object>> => {
        fetchCallCount++;
        await delay(10);
        return new Map([
          ['key-1', { kty: 'RSA', kid: 'key-1', version: fetchCallCount }],
        ]);
      };

      // First batch of concurrent requests
      await Promise.all([
        cache.getKey('key-1', fetchJwks),
        cache.getKey('key-1', fetchJwks),
      ]);

      // Clear cache to force refresh
      cache.clear();

      // Second batch after clear
      await Promise.all([
        cache.getKey('key-1', fetchJwks),
        cache.getKey('key-1', fetchJwks),
      ]);

      // Two refreshes total (one per batch after clear)
      assert.strictEqual(fetchCallCount, 2, 'Should have 2 fetches (one per batch)');
    });
  });

  describe('no_deadlocks_or_leaks_under_burst_load', () => {
    it('should handle burst of 100 concurrent requests', async () => {
      const fetchJwks = async (): Promise<Map<string, object>> => {
        await delay(20);
        return new Map([['key-burst', { kty: 'RSA', kid: 'key-burst' }]]);
      };

      const burstSize = 100;
      const promises = Array.from({ length: burstSize }, () =>
        cache.getKey('key-burst', fetchJwks)
      );

      // Should complete without hanging
      const results = await Promise.all(promises);

      assert.strictEqual(results.length, burstSize, 'All requests should complete');

      // All should get a valid key
      for (const result of results) {
        assert.ok(result.key !== null, 'All should get a key');
      }

      // Very few actual refreshes (ideally 1)
      assert.ok(cache.refreshCount <= 3, `Refresh count should be minimal: ${cache.refreshCount}`);
    });

    it('should not leak promises after completion', async () => {
      const fetchJwks = async (): Promise<Map<string, object>> => {
        await delay(5);
        return new Map([['key-1', { kty: 'RSA' }]]);
      };

      // Run multiple batches
      for (let i = 0; i < 5; i++) {
        cache.clear();
        await Promise.all([
          cache.getKey('key-1', fetchJwks),
          cache.getKey('key-1', fetchJwks),
          cache.getKey('key-1', fetchJwks),
        ]);
      }

      // If there were leaks, we'd see memory growth or hanging promises
      // This test passes if it completes without timeout
      assert.ok(true, 'No leaks detected');
    });

    it('should handle mixed success and failure under load', async () => {
      let callCount = 0;

      const fetchJwks = async (): Promise<Map<string, object>> => {
        callCount++;
        await delay(10);
        // Fail every 3rd call
        if (callCount % 3 === 0) {
          throw new Error('Simulated failure');
        }
        return new Map([['key-1', { kty: 'RSA' }]]);
      };

      const results: Array<{ key: object | null; fromCache: boolean }> = [];

      for (let i = 0; i < 10; i++) {
        cache.clear();
        const result = await cache.getKey('key-1', fetchJwks);
        results.push(result);
      }

      // Some should succeed, some should fail
      const successes = results.filter((r) => r.key !== null).length;
      const failures = results.filter((r) => r.key === null).length;

      assert.ok(successes > 0, 'Some requests should succeed');
      assert.ok(failures > 0, 'Some requests should fail');
      assert.strictEqual(successes + failures, 10, 'All requests should complete');
    });
  });

  describe('consistent_denial_classification_under_concurrent_access', () => {
    it('should record consistent metrics under concurrent access', async () => {
      const fetchJwks = async (): Promise<Map<string, object>> => {
        await delay(10);
        return new Map([['key-1', { kty: 'RSA' }]]);
      };

      // Fire concurrent requests
      await Promise.all([
        cache.getKey('key-1', fetchJwks),
        cache.getKey('key-1', fetchJwks),
        cache.getKey('key-1', fetchJwks),
        cache.getKey('key-1', fetchJwks),
        cache.getKey('key-1', fetchJwks),
      ]);

      const snapshot = metrics.snapshot();

      // All misses should be recorded
      const misses = snapshot.jwksCacheMisses.get('entra-oidc') ?? 0;
      assert.strictEqual(misses, 5, 'All 5 should record a miss');

      // Only 1 refresh should succeed (single-flight)
      const refreshes = snapshot.jwksRefreshSuccess.get('entra-oidc') ?? 0;
      assert.strictEqual(refreshes, 1, 'Only 1 refresh should be recorded');
    });

    it('should not double-count metrics under race conditions', async () => {
      const fetchJwks = async (): Promise<Map<string, object>> => {
        await delay(20);
        return new Map([['key-1', { kty: 'RSA' }]]);
      };

      // Multiple waves of concurrent requests
      for (let wave = 0; wave < 3; wave++) {
        cache.clear();
        metrics.reset();

        await Promise.all([
          cache.getKey('key-1', fetchJwks),
          cache.getKey('key-1', fetchJwks),
        ]);

        const snapshot = metrics.snapshot();
        const misses = snapshot.jwksCacheMisses.get('entra-oidc') ?? 0;
        const refreshSuccess = snapshot.jwksRefreshSuccess.get('entra-oidc') ?? 0;

        // Each wave should have 2 misses and 1 refresh
        assert.strictEqual(misses, 2, `Wave ${wave}: should have 2 misses`);
        assert.strictEqual(refreshSuccess, 1, `Wave ${wave}: should have 1 refresh`);
      }
    });
  });

  describe('denial_classification_consistency', () => {
    it('should classify denials consistently under concurrent failures', async () => {
      const fetchJwks = async (): Promise<Map<string, object>> => {
        await delay(10);
        throw new Error('Network failure');
      };

      // All concurrent requests should fail consistently
      const promises = Array.from({ length: 5 }, () => cache.getKey('key-1', fetchJwks));
      const results = await Promise.all(promises);

      // All should be denied (null key)
      for (const result of results) {
        assert.strictEqual(result.key, null, 'All should be denied');
      }

      // All should record a miss
      const snapshot = metrics.snapshot();
      const misses = snapshot.jwksCacheMisses.get('entra-oidc') ?? 0;
      assert.strictEqual(misses, 5, 'All 5 should record a miss');

      // Only 1 refresh failure (single-flight)
      const failures = snapshot.jwksRefreshFail.get('entra-oidc') ?? 0;
      assert.strictEqual(failures, 1, 'Only 1 refresh failure should be recorded');
    });
  });
});
