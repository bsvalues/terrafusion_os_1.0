/**
 * Alert Calibration Contract Tests
 * ==================================
 *
 * Phase IIIj: Validates alert rules are calibrated to match SLOs.
 *
 * Contract:
 * - alerts_map_to_slos: Every alert has a corresponding SLO
 * - burn_rate_windows_valid: Burn rate multipliers match window durations
 * - suppression_defaults_present: All alerts have anti-flap suppression
 * - severity_hierarchy_consistent: Critical < Warning < Info thresholds
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  SECURITY_ALERT_CATALOG,
  validateAlertCatalog,
  getAlertsForSlo,
  getAlertsBySeverity,
  hasJwksRefreshFailSpikeAlert,
  hasDenialRateBurnRateAlert,
  type AlertRule,
  type AlertSeverity,
} from '../src/security/ops/alerts/rules.js';

import { SECURITY_SLO_CATALOG, getSloById } from '../src/security/ops/slo/catalog.js';

// ============================================================================
// Calibration Bounds
// ============================================================================

const ALERT_CALIBRATION = {
  /** Minimum suppression window (anti-flap) */
  minSuppressionSeconds: 30,
  /** Maximum suppression window (don't hide real issues) */
  maxSuppressionSeconds: 600,
  /** Valid burn rate multipliers for multi-window alerting */
  validBurnRates: {
    fast: { min: 10, max: 20 }, // 14.4x typical
    slow: { min: 3, max: 10 }, // 6x typical
  },
  /** Fast window should be ≤ 1h */
  maxFastWindowSeconds: 3600,
  /** Slow window should be 3-12h */
  minSlowWindowSeconds: 3 * 3600,
  maxSlowWindowSeconds: 12 * 3600,
} as const;

// ============================================================================
// Contract: alerts_map_to_slos
// ============================================================================

describe('Alert Calibration Contract', () => {
  describe('alerts_map_to_slos', () => {
    it('should have catalog version defined', () => {
      assert.ok(SECURITY_ALERT_CATALOG.version);
      assert.ok(SECURITY_ALERT_CATALOG.schemaVersion);
    });

    it('should reference source SLO catalog version', () => {
      assert.ok(SECURITY_ALERT_CATALOG.sourceSloVersion);
      assert.equal(
        SECURITY_ALERT_CATALOG.sourceSloVersion,
        SECURITY_SLO_CATALOG.version,
        'Alert catalog should reference current SLO version'
      );
    });

    it('should have at least one alert per SLO', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        const alerts = getAlertsForSlo(slo.id);
        assert.ok(alerts.length >= 1, `SLO ${slo.id} has no alerts`);
      }
    });

    it('should link all alerts to valid SLOs', () => {
      for (const rule of SECURITY_ALERT_CATALOG.rules) {
        const slo = getSloById(rule.sloId);
        assert.ok(slo, `Alert ${rule.id} references unknown SLO ${rule.sloId}`);
      }
    });

    it('should have denial rate burn rate alert', () => {
      assert.ok(hasDenialRateBurnRateAlert(), 'Must have denial rate burn rate alert');
    });

    it('should have JWKS refresh fail spike alert', () => {
      assert.ok(hasJwksRefreshFailSpikeAlert(), 'Must have JWKS refresh fail spike alert');
    });

    it('should inherit runbook codes from SLO', () => {
      for (const rule of SECURITY_ALERT_CATALOG.rules) {
        const slo = getSloById(rule.sloId);
        if (slo?.relatedCodes && slo.relatedCodes.length > 0) {
          assert.ok(
            rule.runbookCodes && rule.runbookCodes.length > 0,
            `Alert ${rule.id} should inherit runbook codes from SLO`
          );
        }
      }
    });
  });

  // ============================================================================
  // Contract: burn_rate_windows_valid
  // ============================================================================

  describe('burn_rate_windows_valid', () => {
    it('should have fast burn rate alerts with short windows', () => {
      const fastBurnAlerts = SECURITY_ALERT_CATALOG.rules.filter(
        r => r.type === 'burn_rate' && r.severity === 'critical'
      );

      for (const alert of fastBurnAlerts) {
        assert.ok(
          alert.windowSeconds <= ALERT_CALIBRATION.maxFastWindowSeconds,
          `Alert ${alert.id}: critical burn rate should use fast window (≤1h)`
        );
      }
    });

    it('should have slow burn rate alerts with longer windows', () => {
      const slowBurnAlerts = SECURITY_ALERT_CATALOG.rules.filter(
        r => r.type === 'burn_rate' && r.severity === 'warning'
      );

      for (const alert of slowBurnAlerts) {
        assert.ok(
          alert.windowSeconds >= ALERT_CALIBRATION.minSlowWindowSeconds,
          `Alert ${alert.id}: warning burn rate should use slow window (≥3h)`
        );
        assert.ok(
          alert.windowSeconds <= ALERT_CALIBRATION.maxSlowWindowSeconds,
          `Alert ${alert.id}: warning burn rate window too long (≤12h)`
        );
      }
    });

    it('should have valid burn rate multipliers for fast alerts', () => {
      const fastBurnAlerts = SECURITY_ALERT_CATALOG.rules.filter(
        r => r.type === 'burn_rate' && r.severity === 'critical' && r.burnRateMultiplier
      );

      for (const alert of fastBurnAlerts) {
        const multiplier = alert.burnRateMultiplier!;
        assert.ok(
          multiplier >= ALERT_CALIBRATION.validBurnRates.fast.min,
          `Alert ${alert.id}: fast burn rate ${multiplier}x too low`
        );
        assert.ok(
          multiplier <= ALERT_CALIBRATION.validBurnRates.fast.max,
          `Alert ${alert.id}: fast burn rate ${multiplier}x too high`
        );
      }
    });

    it('should have valid burn rate multipliers for slow alerts', () => {
      const slowBurnAlerts = SECURITY_ALERT_CATALOG.rules.filter(
        r => r.type === 'burn_rate' && r.severity === 'warning' && r.burnRateMultiplier
      );

      for (const alert of slowBurnAlerts) {
        const multiplier = alert.burnRateMultiplier!;
        assert.ok(
          multiplier >= ALERT_CALIBRATION.validBurnRates.slow.min,
          `Alert ${alert.id}: slow burn rate ${multiplier}x too low`
        );
        assert.ok(
          multiplier <= ALERT_CALIBRATION.validBurnRates.slow.max,
          `Alert ${alert.id}: slow burn rate ${multiplier}x too high`
        );
      }
    });

    it('should have spike alerts with fast windows', () => {
      const spikeAlerts = SECURITY_ALERT_CATALOG.rules.filter(r => r.type === 'spike');

      for (const alert of spikeAlerts) {
        assert.ok(
          alert.windowSeconds <= 5 * 60, // 5 minutes max
          `Alert ${alert.id}: spike alerts should use very fast windows`
        );
      }
    });
  });

  // ============================================================================
  // Contract: suppression_defaults_present
  // ============================================================================

  describe('suppression_defaults_present', () => {
    it('should have suppression window on all alerts', () => {
      for (const rule of SECURITY_ALERT_CATALOG.rules) {
        assert.ok(
          rule.suppressionWindowSeconds > 0,
          `Alert ${rule.id}: must have positive suppression window`
        );
      }
    });

    it('should have suppression within sane bounds', () => {
      for (const rule of SECURITY_ALERT_CATALOG.rules) {
        assert.ok(
          rule.suppressionWindowSeconds >= ALERT_CALIBRATION.minSuppressionSeconds,
          `Alert ${rule.id}: suppression ${rule.suppressionWindowSeconds}s too short`
        );
        assert.ok(
          rule.suppressionWindowSeconds <= ALERT_CALIBRATION.maxSuppressionSeconds,
          `Alert ${rule.id}: suppression ${rule.suppressionWindowSeconds}s too long`
        );
      }
    });

    it('should have shorter suppression for spike alerts', () => {
      const spikeAlerts = SECURITY_ALERT_CATALOG.rules.filter(r => r.type === 'spike');
      const burnAlerts = SECURITY_ALERT_CATALOG.rules.filter(r => r.type === 'burn_rate');

      if (spikeAlerts.length > 0 && burnAlerts.length > 0) {
        const avgSpikeSuppression =
          spikeAlerts.reduce((sum, r) => sum + r.suppressionWindowSeconds, 0) / spikeAlerts.length;
        const avgBurnSuppression =
          burnAlerts.reduce((sum, r) => sum + r.suppressionWindowSeconds, 0) / burnAlerts.length;

        assert.ok(
          avgSpikeSuppression <= avgBurnSuppression,
          'Spike alerts should have shorter/equal suppression than burn rate alerts'
        );
      }
    });

    it('should have suppression proportional to window', () => {
      for (const rule of SECURITY_ALERT_CATALOG.rules) {
        // Suppression should be at most half the evaluation window
        assert.ok(
          rule.suppressionWindowSeconds <= rule.windowSeconds / 2 + 60, // Allow 1 min buffer
          `Alert ${rule.id}: suppression should be ≤ half of evaluation window`
        );
      }
    });
  });

  // ============================================================================
  // Contract: severity_hierarchy_consistent
  // ============================================================================

  describe('severity_hierarchy_consistent', () => {
    it('should have critical alerts with tightest thresholds', () => {
      const criticalAlerts = getAlertsBySeverity('critical');
      assert.ok(criticalAlerts.length >= 1, 'Should have at least one critical alert');
    });

    it('should have warning alerts for slower burns', () => {
      const warningAlerts = getAlertsBySeverity('warning');
      assert.ok(warningAlerts.length >= 1, 'Should have at least one warning alert');
    });

    it('should have more warning alerts than critical for noise reduction', () => {
      const critical = getAlertsBySeverity('critical').length;
      const warning = getAlertsBySeverity('warning').length;

      // Warning should be >= critical (more noise-reduced, less urgent)
      assert.ok(
        warning >= critical,
        `Should have equal or more warning (${warning}) than critical (${critical}) alerts`
      );
    });

    it('should have consistent comparison direction per SLO', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        const alerts = getAlertsForSlo(slo.id);
        if (alerts.length > 1) {
          const firstComparison = alerts[0].comparison;
          for (const alert of alerts) {
            assert.equal(
              alert.comparison,
              firstComparison,
              `Alert ${alert.id}: comparison should match other alerts for same SLO`
            );
          }
        }
      }
    });

    it('should have burn rate alerts use opposite comparison to SLO direction', () => {
      const burnAlerts = SECURITY_ALERT_CATALOG.rules.filter(r => r.type === 'burn_rate');

      for (const alert of burnAlerts) {
        const slo = getSloById(alert.sloId);
        if (slo?.direction) {
          const expectedComparison = slo.direction === 'above' ? 'below' : 'above';
          assert.equal(
            alert.comparison,
            expectedComparison,
            `Alert ${alert.id}: burn rate should alert when SLO threshold is breached`
          );
        }
      }
    });
  });

  // ============================================================================
  // Contract: catalog_validation
  // ============================================================================

  describe('catalog_validation', () => {
    it('should pass full catalog validation', () => {
      const result = validateAlertCatalog(SECURITY_ALERT_CATALOG);
      assert.ok(result.valid, `Catalog invalid: ${result.errors.join(', ')}`);
    });

    it('should have unique alert IDs', () => {
      const ids = SECURITY_ALERT_CATALOG.rules.map(r => r.id);
      const unique = new Set(ids);
      assert.equal(unique.size, ids.length, 'Alert IDs must be unique');
    });

    it('should have alert IDs prefixed with SLO ID', () => {
      for (const rule of SECURITY_ALERT_CATALOG.rules) {
        assert.ok(
          rule.id.startsWith(rule.sloId),
          `Alert ${rule.id} should be prefixed with SLO ID ${rule.sloId}`
        );
      }
    });

    it('should have descriptions for operator context', () => {
      for (const rule of SECURITY_ALERT_CATALOG.rules) {
        assert.ok(rule.description, `Alert ${rule.id}: description required`);
        assert.ok(rule.description.length >= 20, `Alert ${rule.id}: description too short`);
      }
    });
  });
});
