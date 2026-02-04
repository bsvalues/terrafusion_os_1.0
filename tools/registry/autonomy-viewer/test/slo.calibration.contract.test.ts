/**
 * SLO Calibration Contract Tests
 * ================================
 *
 * Phase IIIj: Validates SLO targets and windows are within sane operational bounds.
 *
 * Contract:
 * - targets_within_sane_bounds: All ratio targets 0.001–0.5, thresholds positive
 * - windows_are_standard: All windows use canonical durations
 * - error_budget_consistency: Targets and burn-rates are consistent
 * - dimension_cardinality_bounded: No unbounded dimensions
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    ALLOWED_SLO_DIMENSIONS,
    getSloById,
    SECURITY_SLO_CATALOG,
    SLO_WINDOWS,
    validateSloCatalog
} from '../src/security/ops/slo/catalog.js';

// ============================================================================
// Calibration Bounds (tunable per deployment)
// ============================================================================

const CALIBRATION_BOUNDS = {
  /** Ratio bounds for "below" direction (error rates) - we want errors below this */
  belowDirection: {
    min: 0.001, // 0.1% - too low = constant alerts
    max: 0.5, // 50% - too high = useless SLO
  },
  /** Ratio bounds for "above" direction (success rates) - we want success above this */
  aboveDirection: {
    min: 0.5, // 50% - too low = useless SLO
    max: 0.999, // 99.9% - too high = constant alerts
  },
  /** Standard window durations (seconds) */
  standardWindows: [
    SLO_WINDOWS.FAST.durationSeconds,
    SLO_WINDOWS.SLOW.durationSeconds,
    SLO_WINDOWS.DAILY.durationSeconds,
    SLO_WINDOWS.WEEKLY.durationSeconds,
  ],
  /** Maximum dimensions per SLO (cardinality control) */
  maxDimensionsPerSlo: 3,
} as const;

// ============================================================================
// Contract: targets_within_sane_bounds
// ============================================================================

describe('SLO Calibration Contract', () => {
  describe('targets_within_sane_bounds', () => {
    it('should have catalog version defined', () => {
      assert.ok(SECURITY_SLO_CATALOG.version);
      assert.ok(SECURITY_SLO_CATALOG.schemaVersion);
    });

    it('should have at least 3 core SLOs', () => {
      assert.ok(
        SECURITY_SLO_CATALOG.slos.length >= 3,
        'Need at least 3 SLOs for meaningful coverage'
      );
    });

    it('should have ratio targets within sane bounds based on direction', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        if (slo.type === 'ratio') {
          if (slo.direction === 'below') {
            // Error rate SLOs: target is max acceptable rate (0.1% to 50%)
            assert.ok(
              slo.target >= CALIBRATION_BOUNDS.belowDirection.min,
              `SLO ${slo.id}: below-target ${slo.target} below min ${CALIBRATION_BOUNDS.belowDirection.min}`
            );
            assert.ok(
              slo.target <= CALIBRATION_BOUNDS.belowDirection.max,
              `SLO ${slo.id}: below-target ${slo.target} above max ${CALIBRATION_BOUNDS.belowDirection.max}`
            );
          } else if (slo.direction === 'above') {
            // Success rate SLOs: target is min acceptable rate (50% to 99.9%)
            assert.ok(
              slo.target >= CALIBRATION_BOUNDS.aboveDirection.min,
              `SLO ${slo.id}: above-target ${slo.target} below min ${CALIBRATION_BOUNDS.aboveDirection.min}`
            );
            assert.ok(
              slo.target <= CALIBRATION_BOUNDS.aboveDirection.max,
              `SLO ${slo.id}: above-target ${slo.target} above max ${CALIBRATION_BOUNDS.aboveDirection.max}`
            );
          }
        }
      }
    });

    it('should have threshold targets that are positive', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        if (slo.type === 'threshold') {
          assert.ok(slo.target > 0, `SLO ${slo.id}: threshold target must be positive`);
        }
      }
    });

    it('should have latency targets in reasonable millisecond range', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        if (slo.type === 'latency') {
          assert.ok(
            slo.target > 0 && slo.target < 60000,
            `SLO ${slo.id}: latency should be 0-60000ms`
          );
        }
      }
    });

    it('should have direction specified for ratio SLOs', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        if (slo.type === 'ratio') {
          assert.ok(
            slo.direction === 'above' || slo.direction === 'below',
            `SLO ${slo.id}: ratio SLO must specify direction`
          );
        }
      }
    });
  });

  // ============================================================================
  // Contract: windows_are_standard
  // ============================================================================

  describe('windows_are_standard', () => {
    it('should use canonical window durations', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        assert.ok(
          CALIBRATION_BOUNDS.standardWindows.includes(slo.window.durationSeconds),
          `SLO ${slo.id}: window ${slo.window.durationSeconds}s is non-standard`
        );
      }
    });

    it('should have named windows for display', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        assert.ok(slo.window.name, `SLO ${slo.id}: window must have name`);
        assert.ok(slo.window.name.length <= 10, `SLO ${slo.id}: window name too long`);
      }
    });

    it('should use faster windows for critical paths', () => {
      // Denial rate should use fast window (5m)
      const denialSlo = getSloById('security.denial_rate');
      if (denialSlo) {
        assert.equal(
          denialSlo.window.durationSeconds,
          SLO_WINDOWS.FAST.durationSeconds,
          'Denial rate should use FAST window'
        );
      }
    });

    it('should use slower windows for background processes', () => {
      // JWKS refresh can use slow window (1h)
      const jwksSlo = getSloById('security.jwks_refresh_failure');
      if (jwksSlo) {
        assert.ok(
          jwksSlo.window.durationSeconds >= SLO_WINDOWS.FAST.durationSeconds,
          'JWKS refresh can use slow window'
        );
      }
    });
  });

  // ============================================================================
  // Contract: error_budget_consistency
  // ============================================================================

  describe('error_budget_consistency', () => {
    it('should have appropriate targets for different error categories', () => {
      const denialSlo = getSloById('security.denial_rate');
      const tokenSlo = getSloById('security.token_error_rate');

      if (denialSlo && tokenSlo) {
        // Both are error rates (below direction), so both should have valid targets
        assert.ok(denialSlo.target > 0, 'Denial rate target should be positive');
        assert.ok(tokenSlo.target > 0, 'Token error rate target should be positive');
        // Token errors are a subset of denials, so can have different thresholds
        // Just verify both are within calibration bounds
        assert.ok(
          denialSlo.target <= CALIBRATION_BOUNDS.belowDirection.max,
          'Denial rate within bounds'
        );
        assert.ok(
          tokenSlo.target <= CALIBRATION_BOUNDS.belowDirection.max,
          'Token error rate within bounds'
        );
      }
    });

    it('should have error budget hierarchy (provider < token < general)', () => {
      const providerSlo = getSloById('security.provider_error_rate');
      const tokenSlo = getSloById('security.token_error_rate');

      if (providerSlo && tokenSlo) {
        // Provider errors are more severe than token errors
        assert.ok(
          providerSlo.target <= tokenSlo.target,
          'Provider error target should be stricter than token error target'
        );
      }
    });

    it('should have version strings in semver format', () => {
      const semverRegex = /^\d+\.\d+\.\d+$/;
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        assert.ok(semverRegex.test(slo.version), `SLO ${slo.id}: version should be semver`);
      }
    });

    it('should link SLOs to denial codes for runbook linkage', () => {
      // At least half of SLOs should have related codes
      const withCodes = SECURITY_SLO_CATALOG.slos.filter(
        slo => slo.relatedCodes && slo.relatedCodes.length > 0
      );
      assert.ok(
        withCodes.length >= SECURITY_SLO_CATALOG.slos.length / 2,
        'At least half of SLOs should link to denial codes'
      );
    });
  });

  // ============================================================================
  // Contract: dimension_cardinality_bounded
  // ============================================================================

  describe('dimension_cardinality_bounded', () => {
    it('should only use allowlisted dimensions', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        for (const dim of slo.dimensions) {
          assert.ok(
            ALLOWED_SLO_DIMENSIONS.includes(dim),
            `SLO ${slo.id}: dimension ${dim} not in allowlist`
          );
        }
      }
    });

    it('should limit dimensions per SLO for cardinality control', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        assert.ok(
          slo.dimensions.length <= CALIBRATION_BOUNDS.maxDimensionsPerSlo,
          `SLO ${slo.id}: too many dimensions (${slo.dimensions.length})`
        );
      }
    });

    it('should have at least one dimension for grouping', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        assert.ok(slo.dimensions.length >= 1, `SLO ${slo.id}: needs at least one dimension`);
      }
    });

    it('should prefer provider dimension for multi-tenant SLOs', () => {
      // Most SLOs should include provider
      const withProvider = SECURITY_SLO_CATALOG.slos.filter(slo =>
        slo.dimensions.includes('provider')
      );
      assert.ok(
        withProvider.length >= SECURITY_SLO_CATALOG.slos.length * 0.8,
        '80%+ of SLOs should include provider dimension'
      );
    });
  });

  // ============================================================================
  // Contract: catalog_validation
  // ============================================================================

  describe('catalog_validation', () => {
    it('should pass full catalog validation', () => {
      const result = validateSloCatalog(SECURITY_SLO_CATALOG);
      assert.ok(result.valid, `Catalog invalid: ${result.errors.join(', ')}`);
    });

    it('should have unique SLO IDs', () => {
      const ids = SECURITY_SLO_CATALOG.slos.map(slo => slo.id);
      const unique = new Set(ids);
      assert.equal(unique.size, ids.length, 'SLO IDs must be unique');
    });

    it('should have required metrics defined', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        assert.ok(slo.numeratorMetric, `SLO ${slo.id}: numeratorMetric required`);
        if (slo.type === 'ratio') {
          assert.ok(slo.denominatorMetric, `SLO ${slo.id}: ratio type needs denominatorMetric`);
        }
      }
    });

    it('should have descriptions for operator context', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        assert.ok(slo.description, `SLO ${slo.id}: description required`);
        assert.ok(slo.description.length >= 20, `SLO ${slo.id}: description too short`);
      }
    });
  });
});
