/**
 * SLO Definitions Contract Tests
 * ================================
 *
 * Phase IIIh: Verify SLO catalog structure and constraints.
 *
 * These tests ensure:
 * - SLO catalog exports required fields
 * - SLO targets are reasonable and non-zero
 * - SLO dimensions are cardinality-bounded (allowlist-only)
 * - SLO changes are tracked via version
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    ALLOWED_SLO_DIMENSIONS,
    getSloById,
    getSlosByDenialCode,
    SECURITY_SLO_CATALOG,
    SLO_WINDOWS,
    validateSloCatalog,
    validateSloDimensions,
    type SloDefinition,
} from '../src/security/ops/slo/catalog.js';

// ============================================================================
// Catalog Structure Tests
// ============================================================================

describe('SLO Definitions Contract', () => {
  describe('exports_slo_catalog_with_required_fields', () => {
    it('should export a catalog with version', () => {
      assert.ok(SECURITY_SLO_CATALOG.version, 'Catalog must have version');
      assert.ok(
        /^\d+\.\d+\.\d+$/.test(SECURITY_SLO_CATALOG.version),
        'Version must be semver format'
      );
    });

    it('should export a catalog with schema version', () => {
      assert.ok(SECURITY_SLO_CATALOG.schemaVersion, 'Catalog must have schemaVersion');
      assert.ok(
        SECURITY_SLO_CATALOG.schemaVersion.startsWith('terrafusion.'),
        'Schema version must follow terrafusion convention'
      );
    });

    it('should export at least one SLO', () => {
      assert.ok(SECURITY_SLO_CATALOG.slos.length > 0, 'Catalog must have at least one SLO');
    });

    it('should have unique SLO IDs', () => {
      const ids = new Set<string>();
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        assert.ok(!ids.has(slo.id), `Duplicate SLO ID: ${slo.id}`);
        ids.add(slo.id);
      }
    });

    it('should have required fields on each SLO', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        assert.ok(slo.id, `SLO must have id`);
        assert.ok(slo.name, `SLO ${slo.id} must have name`);
        assert.ok(slo.description, `SLO ${slo.id} must have description`);
        assert.ok(slo.type, `SLO ${slo.id} must have type`);
        assert.ok(slo.target !== undefined, `SLO ${slo.id} must have target`);
        assert.ok(slo.window, `SLO ${slo.id} must have window`);
        assert.ok(slo.dimensions, `SLO ${slo.id} must have dimensions`);
        assert.ok(slo.numeratorMetric, `SLO ${slo.id} must have numeratorMetric`);
        assert.ok(slo.version, `SLO ${slo.id} must have version`);
      }
    });

    it('should pass catalog validation', () => {
      const result = validateSloCatalog(SECURITY_SLO_CATALOG);
      assert.ok(result.valid, `Catalog validation failed: ${result.errors.join(', ')}`);
    });
  });

  describe('slo_targets_are_reasonable_and_nonzero', () => {
    it('should have positive targets', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        assert.ok(slo.target > 0, `SLO ${slo.id} target must be positive`);
      }
    });

    it('should have ratio targets <= 1', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        if (slo.type === 'ratio') {
          assert.ok(slo.target <= 1, `SLO ${slo.id} ratio target must be <= 1 (got ${slo.target})`);
        }
      }
    });

    it('should have reasonable denial rate baseline', () => {
      const denialSlo = getSloById('security.denial_rate');
      assert.ok(denialSlo, 'Denial rate SLO must exist');
      // Baseline should not be absurdly permissive (>50%) or restrictive (<0.1%)
      assert.ok(
        denialSlo.target >= 0.001 && denialSlo.target <= 0.5,
        `Denial rate target ${denialSlo.target} seems unreasonable`
      );
    });

    it('should have reasonable JWKS failure budget', () => {
      const jwksSlo = getSloById('security.jwks_refresh_failure');
      assert.ok(jwksSlo, 'JWKS refresh failure SLO must exist');
      // Failure budget should be tight (< 5%) but not impossible (> 0.001%)
      assert.ok(
        jwksSlo.target >= 0.00001 && jwksSlo.target <= 0.05,
        `JWKS failure budget ${jwksSlo.target} seems unreasonable`
      );
    });

    it('should have valid window durations', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        assert.ok(slo.window.durationSeconds > 0, `SLO ${slo.id} window duration must be positive`);
        assert.ok(
          slo.window.durationSeconds <= 30 * 24 * 60 * 60, // 30 days max
          `SLO ${slo.id} window duration seems too long`
        );
      }
    });
  });

  describe('slo_dimensions_are_allowlisted_only', () => {
    it('should only use allowed dimensions', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        assert.ok(validateSloDimensions(slo), `SLO ${slo.id} uses non-allowlisted dimensions`);
      }
    });

    it('should have a bounded dimension allowlist', () => {
      // Cardinality safety: dimension allowlist should be small
      assert.ok(
        ALLOWED_SLO_DIMENSIONS.length <= 10,
        `Dimension allowlist should be bounded (got ${ALLOWED_SLO_DIMENSIONS.length})`
      );
    });

    it('should not allow user/tenant/token derived dimensions', () => {
      const forbiddenDimensions = ['user', 'tenant', 'sub', 'oid', 'email', 'ip', 'session'];
      for (const forbidden of forbiddenDimensions) {
        assert.ok(
          !ALLOWED_SLO_DIMENSIONS.includes(forbidden as never),
          `Dimension '${forbidden}' should not be in allowlist (cardinality risk)`
        );
      }
    });

    it('should validate dimension check rejects invalid dimensions', () => {
      const invalidSlo: SloDefinition = {
        id: 'test.invalid',
        name: 'Test',
        description: 'Test',
        type: 'ratio',
        target: 0.5,
        window: SLO_WINDOWS.FAST,
        dimensions: ['user_id' as never], // Invalid dimension
        numeratorMetric: 'test.num',
        denominatorMetric: 'test.den',
        version: '1.0.0',
      };

      assert.ok(!validateSloDimensions(invalidSlo), 'Should reject SLO with invalid dimensions');
    });
  });

  describe('slo_denial_code_linkage', () => {
    it('should have SLOs linked to denial codes', () => {
      const linkedSlos = SECURITY_SLO_CATALOG.slos.filter(
        slo => slo.relatedCodes && slo.relatedCodes.length > 0
      );
      assert.ok(linkedSlos.length > 0, 'At least one SLO should be linked to denial codes');
    });

    it('should find SLOs by denial code', () => {
      const denySlos = getSlosByDenialCode('DENY_PROVIDER_ERROR');
      assert.ok(denySlos.length > 0, 'Should find SLOs for DENY_PROVIDER_ERROR');
    });

    it('should not find SLOs for non-existent code', () => {
      const slos = getSlosByDenialCode('DENY_FAKE_CODE_123');
      assert.strictEqual(slos.length, 0, 'Should not find SLOs for fake code');
    });
  });

  describe('slo_window_consistency', () => {
    it('should have standard window definitions', () => {
      assert.ok(SLO_WINDOWS.FAST.durationSeconds > 0, 'FAST window must exist');
      assert.ok(SLO_WINDOWS.SLOW.durationSeconds > 0, 'SLOW window must exist');
      assert.ok(SLO_WINDOWS.DAILY.durationSeconds > 0, 'DAILY window must exist');
      assert.ok(SLO_WINDOWS.WEEKLY.durationSeconds > 0, 'WEEKLY window must exist');
    });

    it('should have windows in increasing order', () => {
      assert.ok(SLO_WINDOWS.FAST.durationSeconds < SLO_WINDOWS.SLOW.durationSeconds, 'FAST < SLOW');
      assert.ok(
        SLO_WINDOWS.SLOW.durationSeconds < SLO_WINDOWS.DAILY.durationSeconds,
        'SLOW < DAILY'
      );
      assert.ok(
        SLO_WINDOWS.DAILY.durationSeconds < SLO_WINDOWS.WEEKLY.durationSeconds,
        'DAILY < WEEKLY'
      );
    });
  });

  describe('slo_metric_naming_consistency', () => {
    it('should have metric names starting with security.', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        assert.ok(
          slo.numeratorMetric.startsWith('security.'),
          `SLO ${slo.id} numerator metric should start with 'security.'`
        );
        if (slo.denominatorMetric) {
          assert.ok(
            slo.denominatorMetric.startsWith('security.'),
            `SLO ${slo.id} denominator metric should start with 'security.'`
          );
        }
      }
    });

    it('should have ratio SLOs with denominator metrics', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        if (slo.type === 'ratio') {
          assert.ok(
            slo.denominatorMetric,
            `SLO ${slo.id} is ratio type but missing denominatorMetric`
          );
        }
      }
    });
  });
});
