/**
 * Baseline Drift Detection Contract Tests
 * =========================================
 *
 * Phase IIIk: Validates baseline ingestion and drift detection behavior.
 *
 * Contract:
 * - baseline_ingestion_bounded: Ingestion respects allowed dimensions only
 * - drift_detection_thresholds: Drift calculated correctly vs catalog targets
 * - report_is_pii_clean: All identifiers hashed, no raw user data
 * - report_is_operator_consumable: Structured output with actionable insights
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    determineSeverity,
    hashIdentifier,
    ingestBaseline,
    type BaselineSample
} from '../src/security/ops/calibration/baseline.js';
import {
    generateCalibrationReport
} from '../src/security/ops/calibration/report.js';
import { ALLOWED_SLO_DIMENSIONS } from '../src/security/ops/slo/catalog.js';

// ============================================================================
// Contract: baseline_ingestion_bounded
// ============================================================================

describe('Baseline Drift Detection Contract', () => {
  describe('baseline_ingestion_bounded', () => {
    it('should only include allowed dimensions in drift results', () => {
      const sample: BaselineSample = {
        sloId: 'security.denial_rate',
        dimensions: {
          provider: 'entra',
          code: 'DENY_TOKEN_EXPIRED',
          stage: 'prod',
          userId: 'user123', // PII - should be filtered
          ip: '192.168.1.1', // High cardinality - should be filtered
        },
        observedValue: 0.03,
        sampleCount: 1000,
        windowStart: '2026-01-01T00:00:00Z',
        windowEnd: '2026-01-07T00:00:00Z',
      };

      const result = ingestBaseline([sample]);
      assert.equal(result.results.length, 1);

      const dims = result.results[0].dimensions;
      assert.ok(dims.provider, 'Should include provider');
      assert.ok(dims.code, 'Should include code');
      assert.ok(dims.stage, 'Should include stage');
      assert.strictEqual(dims.userId, undefined, 'Should filter userId');
      assert.strictEqual(dims.ip, undefined, 'Should filter ip');
    });

    it('should handle empty dimensions', () => {
      const sample: BaselineSample = {
        sloId: 'security.denial_rate',
        dimensions: {},
        observedValue: 0.03,
        sampleCount: 1000,
        windowStart: '2026-01-01T00:00:00Z',
        windowEnd: '2026-01-07T00:00:00Z',
      };

      const result = ingestBaseline([sample]);
      assert.equal(result.results.length, 1);
      assert.deepEqual(result.results[0].dimensions, {});
    });

    it('should ignore samples for unknown SLOs', () => {
      const sample: BaselineSample = {
        sloId: 'unknown.slo',
        dimensions: { provider: 'entra' },
        observedValue: 0.5,
        sampleCount: 100,
        windowStart: '2026-01-01T00:00:00Z',
        windowEnd: '2026-01-07T00:00:00Z',
      };

      const result = ingestBaseline([sample]);
      assert.equal(result.results.length, 0, 'Should skip unknown SLO');
    });

    it('should process multiple samples', () => {
      const samples: BaselineSample[] = [
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.03,
          sampleCount: 1000,
          windowStart: '2026-01-01T00:00:00Z',
          windowEnd: '2026-01-07T00:00:00Z',
        },
        {
          sloId: 'security.jwks_refresh_failure',
          dimensions: { provider: 'entra' },
          observedValue: 0.005,
          sampleCount: 500,
          windowStart: '2026-01-01T00:00:00Z',
          windowEnd: '2026-01-07T00:00:00Z',
        },
      ];

      const result = ingestBaseline(samples);
      assert.equal(result.results.length, 2);
    });
  });

  // ============================================================================
  // Contract: drift_detection_thresholds
  // ============================================================================

  describe('drift_detection_thresholds', () => {
    it('should calculate drift correctly for below-direction SLOs', () => {
      // Denial rate: target 0.05 (5%), below direction (error rate)
      const sample: BaselineSample = {
        sloId: 'security.denial_rate',
        dimensions: { provider: 'entra' },
        observedValue: 0.08, // 8% observed (worse than 5% target)
        sampleCount: 1000,
        windowStart: '2026-01-01T00:00:00Z',
        windowEnd: '2026-01-07T00:00:00Z',
      };

      const result = ingestBaseline([sample]);
      assert.equal(result.results.length, 1);
      assert.equal(
        result.results[0].direction,
        'above_target',
        'Observed > target is bad for below-direction'
      );
      assert.ok(result.results[0].driftPercent > 0, 'Drift should be positive');
    });

    it('should mark within-target as ok for below-direction', () => {
      const sample: BaselineSample = {
        sloId: 'security.denial_rate',
        dimensions: { provider: 'entra' },
        observedValue: 0.03, // 3% observed (better than 5% target)
        sampleCount: 1000,
        windowStart: '2026-01-01T00:00:00Z',
        windowEnd: '2026-01-07T00:00:00Z',
      };

      const result = ingestBaseline([sample]);
      assert.equal(result.results.length, 1);
      assert.equal(result.results[0].direction, 'within');
      assert.equal(result.results[0].severity, 'ok');
    });

    it('should calculate drift correctly for above-direction SLOs', () => {
      // JWKS cache hit: target 0.9 (90%), above direction (success rate)
      const sample: BaselineSample = {
        sloId: 'security.jwks_cache_hit',
        dimensions: { provider: 'entra' },
        observedValue: 0.75, // 75% observed (worse than 90% target)
        sampleCount: 1000,
        windowStart: '2026-01-01T00:00:00Z',
        windowEnd: '2026-01-07T00:00:00Z',
      };

      const result = ingestBaseline([sample]);
      assert.equal(result.results.length, 1);
      assert.equal(
        result.results[0].direction,
        'below_target',
        'Observed < target is bad for above-direction'
      );
    });

    it('should mark within-target as ok for above-direction', () => {
      const sample: BaselineSample = {
        sloId: 'security.jwks_cache_hit',
        dimensions: { provider: 'entra' },
        observedValue: 0.95, // 95% observed (better than 90% target)
        sampleCount: 1000,
        windowStart: '2026-01-01T00:00:00Z',
        windowEnd: '2026-01-07T00:00:00Z',
      };

      const result = ingestBaseline([sample]);
      assert.equal(result.results.length, 1);
      assert.equal(result.results[0].direction, 'within');
      assert.equal(result.results[0].severity, 'ok');
    });

    it('should assign warning severity for moderate drift', () => {
      const sample: BaselineSample = {
        sloId: 'security.denial_rate',
        dimensions: { provider: 'entra' },
        observedValue: 0.07, // 40% over target (5% * 1.4 = 7%)
        sampleCount: 1000,
        windowStart: '2026-01-01T00:00:00Z',
        windowEnd: '2026-01-07T00:00:00Z',
      };

      const result = ingestBaseline([sample]);
      assert.equal(result.results[0].severity, 'warning');
    });

    it('should assign critical severity for severe drift', () => {
      const sample: BaselineSample = {
        sloId: 'security.denial_rate',
        dimensions: { provider: 'entra' },
        observedValue: 0.1, // 100% over target (5% * 2 = 10%)
        sampleCount: 1000,
        windowStart: '2026-01-01T00:00:00Z',
        windowEnd: '2026-01-07T00:00:00Z',
      };

      const result = ingestBaseline([sample]);
      assert.equal(result.results[0].severity, 'critical');
    });
  });

  // ============================================================================
  // Contract: report_is_pii_clean
  // ============================================================================

  describe('report_is_pii_clean', () => {
    it('should hash identifiers for PII safety', () => {
      const hashed = hashIdentifier('user@example.com');
      assert.ok(hashed.startsWith('sha256:'), 'Hash should have sha256: prefix');
      assert.ok(hashed.length > 10, 'Hash should have meaningful length');
    });

    it('should produce deterministic hashes', () => {
      const hash1 = hashIdentifier('test-value');
      const hash2 = hashIdentifier('test-value');
      assert.equal(hash1, hash2, 'Same input should produce same hash');
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashIdentifier('value1');
      const hash2 = hashIdentifier('value2');
      assert.notEqual(hash1, hash2, 'Different inputs should produce different hashes');
    });

    it('should not include raw user data in report dimensions', () => {
      const sample: BaselineSample = {
        sloId: 'security.denial_rate',
        dimensions: {
          provider: 'entra',
          userId: 'user@example.com',
          email: 'test@test.com',
        },
        observedValue: 0.03,
        sampleCount: 1000,
        windowStart: '2026-01-01T00:00:00Z',
        windowEnd: '2026-01-07T00:00:00Z',
      };

      const report = generateCalibrationReport(
        [sample],
        '2026-01-01T00:00:00Z',
        '2026-01-07T00:00:00Z'
      );

      for (const result of report.results) {
        for (const key of Object.keys(result.dimensions)) {
          assert.ok(
            ALLOWED_SLO_DIMENSIONS.includes(key as never),
            `Dimension ${key} should be in allowlist`
          );
        }
      }
    });
  });

  // ============================================================================
  // Contract: report_is_operator_consumable
  // ============================================================================

  describe('report_is_operator_consumable', () => {
    it('should generate report with required fields', () => {
      const samples: BaselineSample[] = [
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.03,
          sampleCount: 1000,
          windowStart: '2026-01-01T00:00:00Z',
          windowEnd: '2026-01-07T00:00:00Z',
        },
      ];

      const report = generateCalibrationReport(
        samples,
        '2026-01-01T00:00:00Z',
        '2026-01-07T00:00:00Z'
      );

      assert.ok(report.version, 'Report should have version');
      assert.ok(report.generatedAt, 'Report should have generatedAt');
      assert.ok(report.baselineWindow, 'Report should have baselineWindow');
      assert.ok(report.results, 'Report should have results');
      assert.ok(report.summary, 'Report should have summary');
    });

    it('should calculate summary counts correctly', () => {
      const samples: BaselineSample[] = [
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'entra' },
          observedValue: 0.03, // ok
          sampleCount: 1000,
          windowStart: '2026-01-01T00:00:00Z',
          windowEnd: '2026-01-07T00:00:00Z',
        },
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'azure-b2c' },
          observedValue: 0.07, // warning (~40% drift)
          sampleCount: 1000,
          windowStart: '2026-01-01T00:00:00Z',
          windowEnd: '2026-01-07T00:00:00Z',
        },
        {
          sloId: 'security.denial_rate',
          dimensions: { provider: 'google' },
          observedValue: 0.15, // critical (200% drift)
          sampleCount: 1000,
          windowStart: '2026-01-01T00:00:00Z',
          windowEnd: '2026-01-07T00:00:00Z',
        },
      ];

      const report = generateCalibrationReport(
        samples,
        '2026-01-01T00:00:00Z',
        '2026-01-07T00:00:00Z'
      );

      assert.equal(report.summary.total, 3);
      assert.equal(report.summary.ok, 1);
      assert.equal(report.summary.warning, 1);
      assert.equal(report.summary.critical, 1);
    });

    it('should include baseline window in report', () => {
      const report = generateCalibrationReport([], '2026-01-01T00:00:00Z', '2026-01-07T00:00:00Z');

      assert.equal(report.baselineWindow.start, '2026-01-01T00:00:00Z');
      assert.equal(report.baselineWindow.end, '2026-01-07T00:00:00Z');
    });

    it('should handle empty samples gracefully', () => {
      const report = generateCalibrationReport([], '2026-01-01T00:00:00Z', '2026-01-07T00:00:00Z');

      assert.equal(report.summary.total, 0);
      assert.equal(report.summary.ok, 0);
      assert.equal(report.results.length, 0);
    });

    it('should include target vs observed values for context', () => {
      const sample: BaselineSample = {
        sloId: 'security.denial_rate',
        dimensions: { provider: 'entra' },
        observedValue: 0.03,
        sampleCount: 1000,
        windowStart: '2026-01-01T00:00:00Z',
        windowEnd: '2026-01-07T00:00:00Z',
      };

      const report = generateCalibrationReport(
        [sample],
        '2026-01-01T00:00:00Z',
        '2026-01-07T00:00:00Z'
      );

      const result = report.results[0];
      assert.ok(result.targetValue !== undefined, 'Should include target value');
      assert.ok(result.observedValue !== undefined, 'Should include observed value');
      assert.ok(result.driftPercent !== undefined, 'Should include drift percent');
    });
  });

  // ============================================================================
  // Contract: drift_thresholds_configurable
  // ============================================================================

  describe('drift_thresholds_configurable', () => {
    it('should have severity thresholds at reasonable defaults', () => {
      // Verify our severity determination uses 20% and 50% thresholds
      const okDrift = determineSeverity(15, 'above_target');
      const warningDrift = determineSeverity(30, 'above_target');
      const criticalDrift = determineSeverity(60, 'above_target');

      assert.equal(okDrift, 'ok', '<20% drift should be ok');
      assert.equal(warningDrift, 'warning', '20-50% drift should be warning');
      assert.equal(criticalDrift, 'critical', '>50% drift should be critical');
    });

    it('should treat within-target as ok regardless of drift magnitude', () => {
      // Even if drift is high, if direction is within, it's ok
      const severity = determineSeverity(100, 'within');
      assert.equal(severity, 'ok');
    });

    it('should use absolute drift for severity', () => {
      // Negative drift (better than target) should still use absolute value
      const severity = determineSeverity(-30, 'below_target');
      assert.equal(severity, 'warning');
    });
  });
});
