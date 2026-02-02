/**
 * Alert Rules Contract Tests
 * ==========================
 *
 * Phase IIIh: TDD contract tests for alert rules generator.
 *
 * These tests verify:
 * 1. Alert rules are generated for each SLO
 * 2. JWKS refresh fail spike alert is present
 * 3. Denial rate burn rate alert is present
 * 4. No unbounded labels in alerts
 * 5. Alert IDs are unique
 * 6. Suppression windows are anti-flap
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
    getAlertsBySeverity,
    getAlertsForSlo,
    hasDenialRateBurnRateAlert,
    hasJwksRefreshFailSpikeAlert,
    SECURITY_ALERT_CATALOG,
    validateAlertCatalog,
    validateAlertLabels,
} from '../src/security/ops/alerts/rules.js';
import { ALLOWED_SLO_DIMENSIONS, SECURITY_SLO_CATALOG } from '../src/security/ops/slo/catalog.js';

describe('Alert Rules Contract', () => {
  describe('exports_alert_catalog_with_required_fields', () => {
    it('should export SECURITY_ALERT_CATALOG', () => {
      assert.ok(SECURITY_ALERT_CATALOG, 'SECURITY_ALERT_CATALOG must be exported');
      assert.ok(typeof SECURITY_ALERT_CATALOG === 'object', 'Must be an object');
    });

    it('should have version and schemaVersion', () => {
      assert.ok(SECURITY_ALERT_CATALOG.version, 'version is required');
      assert.ok(SECURITY_ALERT_CATALOG.schemaVersion, 'schemaVersion is required');
      assert.strictEqual(
        SECURITY_ALERT_CATALOG.schemaVersion,
        'terrafusion.ops.alerts.v1',
        'Schema version must match expected format'
      );
    });

    it('should have rules array', () => {
      assert.ok(Array.isArray(SECURITY_ALERT_CATALOG.rules), 'rules must be an array');
      assert.ok(SECURITY_ALERT_CATALOG.rules.length > 0, 'Must have at least one rule');
    });

    it('should reference source SLO version', () => {
      assert.strictEqual(
        SECURITY_ALERT_CATALOG.sourceSloVersion,
        SECURITY_SLO_CATALOG.version,
        'Must reference source SLO catalog version'
      );
    });
  });

  describe('alert_rules_generated_for_each_slo', () => {
    it('should generate rules for every SLO', () => {
      const sloIds = SECURITY_SLO_CATALOG.slos.map(slo => slo.id);
      const alertSloIds = [...new Set(SECURITY_ALERT_CATALOG.rules.map(r => r.sloId))];

      for (const sloId of sloIds) {
        assert.ok(alertSloIds.includes(sloId), `Missing alert rules for SLO: ${sloId}`);
      }
    });

    it('should generate at least one alert per SLO', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        const alerts = getAlertsForSlo(slo.id);
        assert.ok(alerts.length >= 1, `SLO ${slo.id} should have at least one alert`);
      }
    });
  });

  describe('jwks_refresh_fail_spike_alert_present', () => {
    it('should have JWKS refresh fail spike alert', () => {
      assert.ok(hasJwksRefreshFailSpikeAlert(), 'JWKS refresh fail spike alert must be present');
    });

    it('should have spike alert with warning severity', () => {
      const alerts = getAlertsForSlo('security.jwks_refresh_failure');
      const spikeAlerts = alerts.filter(a => a.type === 'spike');
      assert.ok(spikeAlerts.length > 0, 'Must have spike alert');
      assert.strictEqual(spikeAlerts[0].severity, 'warning', 'Spike should be warning');
    });
  });

  describe('deny_rate_burn_rate_alert_present', () => {
    it('should have denial rate burn rate alert', () => {
      assert.ok(hasDenialRateBurnRateAlert(), 'Denial rate burn rate alert must be present');
    });

    it('should have both fast and slow burn rate alerts', () => {
      const alerts = getAlertsForSlo('security.denial_rate');
      const burnRateAlerts = alerts.filter(a => a.type === 'burn_rate');
      assert.ok(burnRateAlerts.length >= 2, 'Should have fast and slow burn rate alerts');

      const criticalBurn = burnRateAlerts.find(a => a.severity === 'critical');
      const warningBurn = burnRateAlerts.find(a => a.severity === 'warning');
      assert.ok(criticalBurn, 'Must have critical (fast) burn rate');
      assert.ok(warningBurn, 'Must have warning (slow) burn rate');
    });
  });

  describe('no_unbounded_labels_in_alerts', () => {
    it('should have all labels from allowlist', () => {
      for (const rule of SECURITY_ALERT_CATALOG.rules) {
        assert.ok(
          validateAlertLabels(rule),
          `Alert ${rule.id} uses non-allowlisted labels: ${rule.labels.join(', ')}`
        );
      }
    });

    it('should not include high-cardinality labels', () => {
      const forbiddenLabels = ['user_id', 'email', 'ip_address', 'session_id', 'trace_id'];

      for (const rule of SECURITY_ALERT_CATALOG.rules) {
        for (const label of rule.labels) {
          assert.ok(
            !forbiddenLabels.includes(label),
            `Alert ${rule.id} has forbidden high-cardinality label: ${label}`
          );
        }
      }
    });

    it('labels must be subset of ALLOWED_SLO_DIMENSIONS', () => {
      for (const rule of SECURITY_ALERT_CATALOG.rules) {
        for (const label of rule.labels) {
          assert.ok(
            ALLOWED_SLO_DIMENSIONS.includes(label as never),
            `Label "${label}" is not in ALLOWED_SLO_DIMENSIONS`
          );
        }
      }
    });
  });

  describe('alert_ids_are_unique', () => {
    it('should have unique alert rule IDs', () => {
      const ids = SECURITY_ALERT_CATALOG.rules.map(r => r.id);
      const uniqueIds = [...new Set(ids)];
      assert.strictEqual(ids.length, uniqueIds.length, 'All alert IDs must be unique');
    });

    it('should have consistent ID format', () => {
      for (const rule of SECURITY_ALERT_CATALOG.rules) {
        assert.ok(
          rule.id.startsWith(rule.sloId),
          `Alert ID ${rule.id} should start with SLO ID ${rule.sloId}`
        );
        // ID format: sloId.type.suffix (may have 3-5 segments)
        assert.ok(
          /^[a-z_]+(\.[a-z_]+){2,4}$/.test(rule.id),
          `Alert ID ${rule.id} should follow dotted lowercase format`
        );
      }
    });
  });

  describe('suppression_windows_are_antiflap', () => {
    it('should have positive suppression windows', () => {
      for (const rule of SECURITY_ALERT_CATALOG.rules) {
        assert.ok(
          rule.suppressionWindowSeconds > 0,
          `Alert ${rule.id} must have positive suppression window`
        );
      }
    });

    it('should have suppression window less than evaluation window', () => {
      for (const rule of SECURITY_ALERT_CATALOG.rules) {
        assert.ok(
          rule.suppressionWindowSeconds <= rule.windowSeconds,
          `Alert ${rule.id} suppression must not exceed window`
        );
      }
    });

    it('critical alerts should have fast suppression', () => {
      const criticalAlerts = getAlertsBySeverity('critical');
      for (const rule of criticalAlerts) {
        assert.ok(
          rule.suppressionWindowSeconds <= 600, // 10 minutes max
          `Critical alert ${rule.id} should have fast suppression`
        );
      }
    });
  });

  describe('catalog_validation', () => {
    it('should pass full validation', () => {
      const result = validateAlertCatalog(SECURITY_ALERT_CATALOG);
      assert.ok(result.valid, `Validation failed: ${result.errors.join(', ')}`);
      assert.strictEqual(result.errors.length, 0, 'Should have no validation errors');
    });
  });

  describe('severity_distribution', () => {
    it('should have at least one critical alert', () => {
      const criticalAlerts = getAlertsBySeverity('critical');
      assert.ok(criticalAlerts.length > 0, 'Must have at least one critical alert');
    });

    it('should have at least one warning alert', () => {
      const warningAlerts = getAlertsBySeverity('warning');
      assert.ok(warningAlerts.length > 0, 'Must have at least one warning alert');
    });
  });

  describe('runbook_references', () => {
    it('critical alerts should have runbook codes', () => {
      const criticalAlerts = getAlertsBySeverity('critical');
      for (const rule of criticalAlerts) {
        assert.ok(
          rule.runbookCodes && rule.runbookCodes.length > 0,
          `Critical alert ${rule.id} should reference runbook codes`
        );
      }
    });
  });
});
