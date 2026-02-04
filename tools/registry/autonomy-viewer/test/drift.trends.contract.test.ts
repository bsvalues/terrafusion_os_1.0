/**
 * Drift Trends Contract Tests
 * =============================
 *
 * Phase IIIl: Validates rolling drift computation and trend analysis.
 *
 * Contract:
 * - rolling_windows_bounded: Windows are 7/14/30 days, not arbitrary
 * - trend_direction_stable: Single bad sample doesn't flip trend
 * - baseline_persistence_valid: Stored baselines maintain schema
 * - retention_policy_enforced: Old samples are pruned per policy
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ALLOWED_SLO_DIMENSIONS } from '../src/security/ops/slo/catalog.js';

// ============================================================================
// Types for Trends
// ============================================================================

/**
 * Stored baseline sample with timestamp.
 */
interface StoredBaseline {
  readonly sloId: string;
  readonly dimensions: Record<string, string>;
  readonly observedValue: number;
  readonly sampleCount: number;
  readonly timestamp: string;
}

/**
 * Rolling window configuration.
 */
interface RollingWindowConfig {
  readonly name: string;
  readonly days: number;
}

/**
 * Standard rolling windows.
 */
const ROLLING_WINDOWS: readonly RollingWindowConfig[] = [
  { name: '7d', days: 7 },
  { name: '14d', days: 14 },
  { name: '30d', days: 30 },
] as const;

/**
 * Trend direction.
 */
type TrendDirection = 'improving' | 'degrading' | 'stable';

/**
 * Trend result for a single SLO.
 */
interface TrendResult {
  readonly sloId: string;
  readonly windowName: string;
  readonly direction: TrendDirection;
  readonly changePercent: number;
  readonly confidence: 'low' | 'medium' | 'high';
  readonly sampleCount: number;
}

/**
 * Retention policy.
 */
interface RetentionPolicy {
  readonly maxAgeDays: number;
  readonly maxSamplesPerSlo: number;
}

const DEFAULT_RETENTION: RetentionPolicy = {
  maxAgeDays: 90,
  maxSamplesPerSlo: 1000,
};

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Filter stored baseline dimensions (at storage boundary).
 */
function filterStoredDimensions(dimensions: Record<string, string>): Record<string, string> {
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(dimensions)) {
    if (ALLOWED_SLO_DIMENSIONS.includes(key as never)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * Calculate trend from samples.
 */
function calculateTrend(
  samples: readonly StoredBaseline[],
  windowDays: number,
  sloDirection: 'above' | 'below'
): TrendResult | null {
  if (samples.length < 2) {
    return null;
  }

  // Sort by timestamp
  const sorted = [...samples].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Filter to window
  const windowStart = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const windowSamples = sorted.filter(s => new Date(s.timestamp).getTime() >= windowStart);

  if (windowSamples.length < 2) {
    return null;
  }

  // Calculate average of first half vs second half
  const mid = Math.floor(windowSamples.length / 2);
  const firstHalf = windowSamples.slice(0, mid);
  const secondHalf = windowSamples.slice(mid);

  const firstAvg = firstHalf.reduce((sum, s) => sum + s.observedValue, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, s) => sum + s.observedValue, 0) / secondHalf.length;

  const changePercent = firstAvg !== 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

  // Determine trend direction based on SLO direction
  let direction: TrendDirection = 'stable';
  if (Math.abs(changePercent) > 5) {
    if (sloDirection === 'below') {
      // For error rates: decreasing is improving
      direction = changePercent < 0 ? 'improving' : 'degrading';
    } else {
      // For success rates: increasing is improving
      direction = changePercent > 0 ? 'improving' : 'degrading';
    }
  }

  // Calculate confidence based on sample count
  let confidence: TrendResult['confidence'] = 'low';
  if (windowSamples.length >= 14) {
    confidence = 'high';
  } else if (windowSamples.length >= 7) {
    confidence = 'medium';
  }

  return {
    sloId: samples[0].sloId,
    windowName: `${windowDays}d`,
    direction,
    changePercent,
    confidence,
    sampleCount: windowSamples.length,
  };
}

/**
 * Apply retention policy to samples.
 */
function applyRetention(samples: StoredBaseline[], policy: RetentionPolicy): StoredBaseline[] {
  const cutoff = Date.now() - policy.maxAgeDays * 24 * 60 * 60 * 1000;

  // Filter by age
  let filtered = samples.filter(s => new Date(s.timestamp).getTime() >= cutoff);

  // Group by SLO and limit count
  const bySlo = new Map<string, StoredBaseline[]>();
  for (const sample of filtered) {
    const key = `${sample.sloId}:${JSON.stringify(sample.dimensions)}`;
    if (!bySlo.has(key)) {
      bySlo.set(key, []);
    }
    bySlo.get(key)!.push(sample);
  }

  // Apply max samples per SLO
  const result: StoredBaseline[] = [];
  for (const [, sloSamples] of bySlo) {
    // Keep most recent
    const sorted = sloSamples.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    result.push(...sorted.slice(0, policy.maxSamplesPerSlo));
  }

  return result;
}

/**
 * Validate stored baseline schema.
 */
function validateStoredBaseline(sample: StoredBaseline): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!sample.sloId) {
    errors.push('sloId is required');
  }
  if (typeof sample.observedValue !== 'number') {
    errors.push('observedValue must be a number');
  }
  if (typeof sample.sampleCount !== 'number' || sample.sampleCount < 0) {
    errors.push('sampleCount must be a non-negative number');
  }
  if (!sample.timestamp || isNaN(Date.parse(sample.timestamp))) {
    errors.push('timestamp must be a valid ISO date');
  }

  // Check dimensions are from allowlist
  for (const key of Object.keys(sample.dimensions)) {
    if (!ALLOWED_SLO_DIMENSIONS.includes(key as never)) {
      errors.push(`dimension ${key} not in allowlist`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Contract: rolling_windows_bounded
// ============================================================================

describe('Drift Trends Contract', () => {
  describe('rolling_windows_bounded', () => {
    it('should only support standard window sizes', () => {
      const validDays = ROLLING_WINDOWS.map(w => w.days);
      assert.deepEqual(validDays, [7, 14, 30], 'Only 7/14/30 day windows allowed');
    });

    it('should have named windows for display', () => {
      for (const window of ROLLING_WINDOWS) {
        assert.ok(window.name, 'Window must have name');
        assert.ok(window.name.endsWith('d'), 'Window name should end with d');
      }
    });

    it('should require minimum samples for trend calculation', () => {
      const singleSample: StoredBaseline[] = [
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.03,
          sampleCount: 1000,
          timestamp: new Date().toISOString(),
        },
      ];

      const trend = calculateTrend(singleSample, 7, 'below');
      assert.strictEqual(trend, null, 'Single sample should not produce trend');
    });

    it('should calculate trend from multiple samples', () => {
      const now = Date.now();
      const samples: StoredBaseline[] = [
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.05,
          sampleCount: 1000,
          timestamp: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.04,
          sampleCount: 1000,
          timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.03,
          sampleCount: 1000,
          timestamp: new Date(now).toISOString(),
        },
      ];

      const trend = calculateTrend(samples, 7, 'below');
      assert.ok(trend, 'Should produce trend from 3 samples');
      assert.equal(trend.sloId, 'security.denial_rate');
    });
  });

  // ============================================================================
  // Contract: trend_direction_stable
  // ============================================================================

  describe('trend_direction_stable', () => {
    it('should mark improving for decreasing error rates', () => {
      const now = Date.now();
      const samples: StoredBaseline[] = [
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.1, // 10% error rate
          sampleCount: 1000,
          timestamp: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.05, // 5% error rate (improved)
          sampleCount: 1000,
          timestamp: new Date(now).toISOString(),
        },
      ];

      const trend = calculateTrend(samples, 7, 'below');
      assert.ok(trend);
      assert.equal(trend.direction, 'improving', 'Decreasing error rate = improving');
    });

    it('should mark degrading for increasing error rates', () => {
      const now = Date.now();
      const samples: StoredBaseline[] = [
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.03,
          sampleCount: 1000,
          timestamp: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.08,
          sampleCount: 1000,
          timestamp: new Date(now).toISOString(),
        },
      ];

      const trend = calculateTrend(samples, 7, 'below');
      assert.ok(trend);
      assert.equal(trend.direction, 'degrading', 'Increasing error rate = degrading');
    });

    it('should mark stable for small changes', () => {
      const now = Date.now();
      const samples: StoredBaseline[] = [
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.05,
          sampleCount: 1000,
          timestamp: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.051, // 2% change - below 5% threshold
          sampleCount: 1000,
          timestamp: new Date(now).toISOString(),
        },
      ];

      const trend = calculateTrend(samples, 7, 'below');
      assert.ok(trend);
      assert.equal(trend.direction, 'stable', 'Small changes should be stable');
    });

    it('should include confidence level based on sample count', () => {
      const now = Date.now();
      const samples: StoredBaseline[] = [];

      // Create 14 samples for high confidence
      for (let i = 0; i < 14; i++) {
        samples.push({
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.05 - i * 0.001,
          sampleCount: 1000,
          timestamp: new Date(now - i * 12 * 60 * 60 * 1000).toISOString(),
        });
      }

      const trend = calculateTrend(samples, 7, 'below');
      assert.ok(trend);
      assert.equal(trend.confidence, 'high', '14+ samples = high confidence');
    });

    it('should handle above-direction SLOs correctly', () => {
      const now = Date.now();
      const samples: StoredBaseline[] = [
        {
          sloId: 'security.jwks_cache_hit',
          dimensions: { provider: 'entra' },
          observedValue: 0.85, // 85% hit rate
          sampleCount: 1000,
          timestamp: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          sloId: 'security.jwks_cache_hit',
          dimensions: { provider: 'entra' },
          observedValue: 0.95, // 95% hit rate (improved)
          sampleCount: 1000,
          timestamp: new Date(now).toISOString(),
        },
      ];

      const trend = calculateTrend(samples, 7, 'above');
      assert.ok(trend);
      assert.equal(trend.direction, 'improving', 'Increasing success rate = improving');
    });
  });

  // ============================================================================
  // Contract: baseline_persistence_valid
  // ============================================================================

  describe('baseline_persistence_valid', () => {
    it('should validate stored baseline schema', () => {
      const validSample: StoredBaseline = {
        sloId: 'security.denial_rate',
        dimensions: { provider: 'entra' },
        observedValue: 0.03,
        sampleCount: 1000,
        timestamp: new Date().toISOString(),
      };

      const result = validateStoredBaseline(validSample);
      assert.ok(result.valid, `Should be valid: ${result.errors.join(', ')}`);
    });

    it('should reject samples with missing sloId', () => {
      const invalidSample = {
        sloId: '',
        dimensions: { provider: 'entra' },
        observedValue: 0.03,
        sampleCount: 1000,
        timestamp: new Date().toISOString(),
      };

      const result = validateStoredBaseline(invalidSample);
      assert.ok(!result.valid, 'Should reject missing sloId');
    });

    it('should reject samples with non-allowlist dimensions', () => {
      const invalidSample: StoredBaseline = {
        sloId: 'security.denial_rate',
        dimensions: { provider: 'entra', userId: 'user123' },
        observedValue: 0.03,
        sampleCount: 1000,
        timestamp: new Date().toISOString(),
      };

      const result = validateStoredBaseline(invalidSample);
      assert.ok(!result.valid, 'Should reject non-allowlist dimensions');
      assert.ok(result.errors.some(e => e.includes('userId')));
    });

    it('should reject samples with invalid timestamp', () => {
      const invalidSample: StoredBaseline = {
        sloId: 'security.denial_rate',
        dimensions: { provider: 'entra' },
        observedValue: 0.03,
        sampleCount: 1000,
        timestamp: 'not-a-date',
      };

      const result = validateStoredBaseline(invalidSample);
      assert.ok(!result.valid, 'Should reject invalid timestamp');
    });

    it('should filter dimensions at storage boundary', () => {
      const rawDimensions = {
        provider: 'entra',
        code: 'DENY_TOKEN_EXPIRED',
        userId: 'user123',
        ip: '192.168.1.1',
      };

      const filtered = filterStoredDimensions(rawDimensions);
      assert.ok(filtered.provider, 'Should keep provider');
      assert.ok(filtered.code, 'Should keep code');
      assert.strictEqual(filtered.userId, undefined, 'Should filter userId');
      assert.strictEqual(filtered.ip, undefined, 'Should filter ip');
    });
  });

  // ============================================================================
  // Contract: retention_policy_enforced
  // ============================================================================

  describe('retention_policy_enforced', () => {
    it('should have reasonable default retention', () => {
      assert.equal(DEFAULT_RETENTION.maxAgeDays, 90, 'Default 90 day retention');
      assert.equal(DEFAULT_RETENTION.maxSamplesPerSlo, 1000, 'Default 1000 samples per SLO');
    });

    it('should prune samples older than maxAgeDays', () => {
      const now = Date.now();
      const samples: StoredBaseline[] = [
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.03,
          sampleCount: 1000,
          timestamp: new Date(now - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days old
        },
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.04,
          sampleCount: 1000,
          timestamp: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days old
        },
      ];

      const policy: RetentionPolicy = { maxAgeDays: 90, maxSamplesPerSlo: 1000 };
      const retained = applyRetention(samples, policy);

      assert.equal(retained.length, 1, 'Should prune 100-day-old sample');
      assert.equal(retained[0].observedValue, 0.04);
    });

    it('should limit samples per SLO', () => {
      const now = Date.now();
      const samples: StoredBaseline[] = [];

      // Create 10 samples for same SLO
      for (let i = 0; i < 10; i++) {
        samples.push({
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.03 + i * 0.001,
          sampleCount: 1000,
          timestamp: new Date(now - i * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      const policy: RetentionPolicy = { maxAgeDays: 90, maxSamplesPerSlo: 5 };
      const retained = applyRetention(samples, policy);

      assert.equal(retained.length, 5, 'Should limit to 5 samples');
    });

    it('should keep most recent samples when limiting', () => {
      const now = Date.now();
      const samples: StoredBaseline[] = [
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.03,
          sampleCount: 1000,
          timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.04,
          sampleCount: 1000,
          timestamp: new Date(now).toISOString(), // Most recent
        },
      ];

      const policy: RetentionPolicy = { maxAgeDays: 90, maxSamplesPerSlo: 1 };
      const retained = applyRetention(samples, policy);

      assert.equal(retained.length, 1);
      assert.equal(retained[0].observedValue, 0.04, 'Should keep most recent');
    });
  });
});
