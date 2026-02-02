/**
 * Observation Window Contract Tests
 * ===================================
 *
 * Phase IVb: Validates observation window enforcement for live acceptance.
 *
 * Contract:
 * - critical_paging_blocked_until_7d_baseline: minimum observation enforced
 * - baseline_must_meet_min_samples_and_confidence: statistical validity
 * - clock_skew_and_partial_days_handled_safely: robust time handling
 * - window_extension_on_incident: pauses during degradation
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Observation Window
// ============================================================================

/**
 * Observation window state.
 */
interface ObservationWindow {
  readonly id: string;
  readonly environment: 'development' | 'staging' | 'production';
  readonly startedAt: string;
  readonly lastSampleAt: string;
  readonly sampleCount: number;
  readonly pausedIntervals: readonly PausedInterval[];
  readonly status: ObservationStatus;
}

/**
 * Paused interval during incidents.
 */
interface PausedInterval {
  readonly startedAt: string;
  readonly endedAt?: string;
  readonly reason: string;
}

/**
 * Observation status.
 */
type ObservationStatus = 'collecting' | 'paused' | 'sufficient' | 'expired';

/**
 * Observation requirements.
 */
interface ObservationRequirements {
  readonly minimumDays: number;
  readonly minimumSamples: number;
  readonly minimumConfidence: number;
  readonly maxClockSkewMs: number;
  readonly sampleDecayDays: number;
}

/**
 * Observation validation result.
 */
interface ObservationValidationResult {
  readonly valid: boolean;
  readonly effectiveDays: number;
  readonly effectiveSamples: number;
  readonly confidence: number;
  readonly blockers: readonly ObservationBlocker[];
}

/**
 * Observation blocker.
 */
interface ObservationBlocker {
  readonly type:
    | 'insufficient_days'
    | 'insufficient_samples'
    | 'low_confidence'
    | 'clock_skew'
    | 'stale_data';
  readonly description: string;
  readonly requiredValue: number;
  readonly actualValue: number;
}

/**
 * Sample data point.
 */
interface SampleDataPoint {
  readonly timestamp: string;
  readonly value: number;
  readonly valid: boolean;
}

/**
 * Confidence calculation result.
 */
interface ConfidenceResult {
  readonly confidence: number;
  readonly sampleStdDev: number;
  readonly sampleMean: number;
  readonly marginOfError: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_REQUIREMENTS: ObservationRequirements = {
  minimumDays: 7,
  minimumSamples: 100,
  minimumConfidence: 0.95,
  maxClockSkewMs: 60000, // 1 minute
  sampleDecayDays: 30,
};

const PRODUCTION_REQUIREMENTS: ObservationRequirements = {
  minimumDays: 14,
  minimumSamples: 1000,
  minimumConfidence: 0.99,
  maxClockSkewMs: 30000, // 30 seconds
  sampleDecayDays: 60,
};

const CRITICAL_PAGING_MIN_DAYS = 7;

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Calculate effective observation days excluding paused intervals.
 */
function calculateEffectiveDays(window: ObservationWindow, now: Date = new Date()): number {
  const startTime = new Date(window.startedAt).getTime();
  const endTime = now.getTime();
  let totalMs = endTime - startTime;

  // Subtract paused intervals
  for (const pause of window.pausedIntervals) {
    const pauseStart = new Date(pause.startedAt).getTime();
    const pauseEnd = pause.endedAt ? new Date(pause.endedAt).getTime() : endTime;
    totalMs -= Math.max(0, pauseEnd - pauseStart);
  }

  return Math.max(0, totalMs / (24 * 60 * 60 * 1000));
}

/**
 * Calculate confidence from samples using Wilson score interval.
 */
function calculateConfidence(samples: readonly SampleDataPoint[]): ConfidenceResult {
  const validSamples = samples.filter(s => s.valid);
  const n = validSamples.length;

  if (n === 0) {
    return { confidence: 0, sampleStdDev: 0, sampleMean: 0, marginOfError: 1 };
  }

  const values = validSamples.map(s => s.value);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  // Simplified confidence based on sample size and standard error
  const standardError = stdDev / Math.sqrt(n);
  const marginOfError = 1.96 * standardError; // 95% CI

  // Confidence increases with sample size and decreases with variance
  const confidence = Math.min(1 - marginOfError / (mean || 1), 0.999);

  return {
    confidence: Math.max(0, confidence),
    sampleStdDev: stdDev,
    sampleMean: mean,
    marginOfError,
  };
}

/**
 * Check for clock skew - detects out-of-order timestamps in the original sequence.
 */
function checkClockSkew(
  timestamps: readonly string[],
  maxSkewMs: number
): { valid: boolean; maxSkewDetected: number } {
  if (timestamps.length < 2) {
    return { valid: true, maxSkewDetected: 0 };
  }

  let maxSkewDetected = 0;
  const times = timestamps.map(t => new Date(t).getTime());

  // Check for backwards time jumps in original sequence (not sorted)
  for (let i = 1; i < times.length; i++) {
    if (times[i] < times[i - 1]) {
      const skew = times[i - 1] - times[i];
      maxSkewDetected = Math.max(maxSkewDetected, skew);
    }
  }

  return { valid: maxSkewDetected <= maxSkewMs, maxSkewDetected };
}

/**
 * Check for stale data.
 */
function checkDataFreshness(
  lastSampleAt: string,
  decayDays: number,
  now: Date = new Date()
): { fresh: boolean; staleDays: number } {
  const lastSampleTime = new Date(lastSampleAt).getTime();
  const nowTime = now.getTime();
  const daysSinceLastSample = (nowTime - lastSampleTime) / (24 * 60 * 60 * 1000);

  return {
    fresh: daysSinceLastSample <= decayDays,
    staleDays: daysSinceLastSample,
  };
}

/**
 * Validate observation window.
 */
function validateObservationWindow(
  window: ObservationWindow,
  requirements: ObservationRequirements,
  samples: readonly SampleDataPoint[],
  now: Date = new Date()
): ObservationValidationResult {
  const blockers: ObservationBlocker[] = [];

  // Calculate effective days
  const effectiveDays = calculateEffectiveDays(window, now);
  if (effectiveDays < requirements.minimumDays) {
    blockers.push({
      type: 'insufficient_days',
      description: `Observation period: ${effectiveDays.toFixed(1)}d < required ${requirements.minimumDays}d`,
      requiredValue: requirements.minimumDays,
      actualValue: effectiveDays,
    });
  }

  // Check sample count
  const effectiveSamples = samples.filter(s => s.valid).length;
  if (effectiveSamples < requirements.minimumSamples) {
    blockers.push({
      type: 'insufficient_samples',
      description: `Sample count: ${effectiveSamples} < required ${requirements.minimumSamples}`,
      requiredValue: requirements.minimumSamples,
      actualValue: effectiveSamples,
    });
  }

  // Calculate confidence
  const confidenceResult = calculateConfidence(samples);
  if (confidenceResult.confidence < requirements.minimumConfidence) {
    blockers.push({
      type: 'low_confidence',
      description: `Confidence: ${(confidenceResult.confidence * 100).toFixed(1)}% < required ${(requirements.minimumConfidence * 100).toFixed(1)}%`,
      requiredValue: requirements.minimumConfidence,
      actualValue: confidenceResult.confidence,
    });
  }

  // Check clock skew
  const clockCheck = checkClockSkew(
    samples.map(s => s.timestamp),
    requirements.maxClockSkewMs
  );
  if (!clockCheck.valid) {
    blockers.push({
      type: 'clock_skew',
      description: `Clock skew detected: ${clockCheck.maxSkewDetected}ms > max ${requirements.maxClockSkewMs}ms`,
      requiredValue: requirements.maxClockSkewMs,
      actualValue: clockCheck.maxSkewDetected,
    });
  }

  // Check data freshness
  const freshnessCheck = checkDataFreshness(window.lastSampleAt, requirements.sampleDecayDays, now);
  if (!freshnessCheck.fresh) {
    blockers.push({
      type: 'stale_data',
      description: `Data stale: ${freshnessCheck.staleDays.toFixed(1)}d since last sample`,
      requiredValue: requirements.sampleDecayDays,
      actualValue: freshnessCheck.staleDays,
    });
  }

  return {
    valid: blockers.length === 0,
    effectiveDays,
    effectiveSamples,
    confidence: confidenceResult.confidence,
    blockers,
  };
}

/**
 * Check if critical paging can be enabled.
 */
function canEnableCriticalPaging(
  window: ObservationWindow,
  samples: readonly SampleDataPoint[],
  now: Date = new Date()
): { allowed: boolean; reason: string } {
  const effectiveDays = calculateEffectiveDays(window, now);

  if (effectiveDays < CRITICAL_PAGING_MIN_DAYS) {
    return {
      allowed: false,
      reason: `Minimum ${CRITICAL_PAGING_MIN_DAYS}d observation required; currently ${effectiveDays.toFixed(1)}d`,
    };
  }

  const validSamples = samples.filter(s => s.valid).length;
  if (validSamples < DEFAULT_REQUIREMENTS.minimumSamples) {
    return {
      allowed: false,
      reason: `Minimum ${DEFAULT_REQUIREMENTS.minimumSamples} samples required; currently ${validSamples}`,
    };
  }

  return { allowed: true, reason: 'Observation window sufficient for critical paging' };
}

/**
 * Create sample data points.
 */
function createSamples(count: number, validRatio: number = 1.0): SampleDataPoint[] {
  const samples: SampleDataPoint[] = [];
  const baseTime = Date.now() - count * 60000; // 1 minute apart

  for (let i = 0; i < count; i++) {
    samples.push({
      timestamp: new Date(baseTime + i * 60000).toISOString(),
      value: 0.99 + Math.random() * 0.01, // 99-100% success
      valid: Math.random() < validRatio,
    });
  }

  return samples;
}

/**
 * Create observation window.
 */
function createWindow(
  daysAgo: number,
  sampleCount: number,
  paused: boolean = false
): ObservationWindow {
  const now = new Date();
  const startedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  return {
    id: `window-${Date.now()}`,
    environment: 'staging',
    startedAt: startedAt.toISOString(),
    lastSampleAt: now.toISOString(),
    sampleCount,
    pausedIntervals: paused
      ? [
          {
            startedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            endedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            reason: 'incident',
          },
        ]
      : [],
    status: 'collecting',
  };
}

// ============================================================================
// Contract: critical_paging_blocked_until_7d_baseline
// ============================================================================

describe('Observation Window Contract', () => {
  describe('critical_paging_blocked_until_7d_baseline', () => {
    it('should block critical paging before 7 days', () => {
      const window = createWindow(5, 200);
      const samples = createSamples(200);
      const result = canEnableCriticalPaging(window, samples);

      assert.ok(!result.allowed);
      assert.ok(result.reason.includes('7d'));
    });

    it('should allow critical paging after 7 days', () => {
      const window = createWindow(10, 200);
      const samples = createSamples(200);
      const result = canEnableCriticalPaging(window, samples);

      assert.ok(result.allowed);
    });

    it('should require minimum 7 days regardless of sample count', () => {
      const window = createWindow(3, 10000); // Lots of samples but only 3 days
      const samples = createSamples(10000);
      const result = canEnableCriticalPaging(window, samples);

      assert.ok(!result.allowed);
    });

    it('should enforce 7 day minimum as non-negotiable', () => {
      assert.strictEqual(CRITICAL_PAGING_MIN_DAYS, 7);
    });

    it('should account for paused intervals in calculation', () => {
      // 8 days total but 1 day paused = 7 effective days
      const window = createWindow(8, 200, true);
      const samples = createSamples(200);
      const result = canEnableCriticalPaging(window, samples);

      assert.ok(result.allowed);
    });
  });

  // ============================================================================
  // Contract: baseline_must_meet_min_samples_and_confidence
  // ============================================================================

  describe('baseline_must_meet_min_samples_and_confidence', () => {
    it('should require minimum sample count', () => {
      const window = createWindow(10, 50);
      const samples = createSamples(50);
      const result = validateObservationWindow(window, DEFAULT_REQUIREMENTS, samples);

      assert.ok(!result.valid);
      assert.ok(result.blockers.some(b => b.type === 'insufficient_samples'));
    });

    it('should accept sufficient sample count', () => {
      const window = createWindow(10, 200);
      const samples = createSamples(200);
      const result = validateObservationWindow(window, DEFAULT_REQUIREMENTS, samples);

      assert.ok(!result.blockers.some(b => b.type === 'insufficient_samples'));
    });

    it('should calculate confidence from sample variance', () => {
      const samples = createSamples(500);
      const confidence = calculateConfidence(samples);

      assert.ok(confidence.confidence > 0);
      assert.ok(confidence.confidence <= 1);
      assert.ok(typeof confidence.sampleStdDev === 'number');
    });

    it('should require minimum confidence level', () => {
      // Create highly variable samples
      const samples: SampleDataPoint[] = [];
      for (let i = 0; i < 50; i++) {
        samples.push({
          timestamp: new Date().toISOString(),
          value: Math.random(), // High variance 0-1
          valid: true,
        });
      }

      const confidence = calculateConfidence(samples);
      assert.ok(confidence.confidence < 0.95); // Should be low confidence
    });

    it('should exclude invalid samples from count', () => {
      const window = createWindow(10, 200);
      const samples = createSamples(200, 0.3); // Only 30% valid
      const result = validateObservationWindow(window, DEFAULT_REQUIREMENTS, samples);

      assert.ok(result.effectiveSamples < 200);
    });
  });

  // ============================================================================
  // Contract: clock_skew_and_partial_days_handled_safely
  // ============================================================================

  describe('clock_skew_and_partial_days_handled_safely', () => {
    it('should detect clock skew in timestamps', () => {
      const timestamps = [
        '2026-01-03T10:00:00Z',
        '2026-01-03T09:00:00Z', // Backwards!
        '2026-01-03T11:00:00Z',
      ];

      const result = checkClockSkew(timestamps, 60000);

      assert.ok(!result.valid);
      assert.ok(result.maxSkewDetected > 60000);
    });

    it('should allow minor clock skew within threshold', () => {
      const now = Date.now();
      const timestamps = [
        new Date(now).toISOString(),
        new Date(now + 1000).toISOString(),
        new Date(now + 2000).toISOString(),
      ];

      const result = checkClockSkew(timestamps, 60000);

      assert.ok(result.valid);
    });

    it('should handle partial days correctly', () => {
      // Window started 7.5 days ago
      const window = createWindow(7.5, 200);
      const effectiveDays = calculateEffectiveDays(window);

      assert.ok(effectiveDays >= 7);
      assert.ok(effectiveDays <= 8);
    });

    it('should subtract paused intervals from effective days', () => {
      const window = createWindow(10, 200, true); // 1 day paused
      const effectiveDays = calculateEffectiveDays(window);

      assert.ok(effectiveDays < 10);
      assert.ok(effectiveDays >= 9);
    });

    it('should have stricter clock skew threshold in production', () => {
      assert.ok(PRODUCTION_REQUIREMENTS.maxClockSkewMs < DEFAULT_REQUIREMENTS.maxClockSkewMs);
    });
  });

  // ============================================================================
  // Contract: stale_data_detection
  // ============================================================================

  describe('stale_data_detection', () => {
    it('should detect stale data', () => {
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ago
      const result = checkDataFreshness(oldDate, 30);

      assert.ok(!result.fresh);
      assert.ok(result.staleDays > 30);
    });

    it('should accept fresh data', () => {
      const recentDate = new Date().toISOString();
      const result = checkDataFreshness(recentDate, 30);

      assert.ok(result.fresh);
    });

    it('should block validation with stale data', () => {
      const window: ObservationWindow = {
        id: 'stale-window',
        environment: 'staging',
        startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        lastSampleAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
        sampleCount: 200,
        pausedIntervals: [],
        status: 'collecting',
      };

      const samples = createSamples(200);
      const result = validateObservationWindow(window, DEFAULT_REQUIREMENTS, samples);

      assert.ok(result.blockers.some(b => b.type === 'stale_data'));
    });

    it('should have longer decay period in production', () => {
      assert.ok(PRODUCTION_REQUIREMENTS.sampleDecayDays > DEFAULT_REQUIREMENTS.sampleDecayDays);
    });
  });
});
