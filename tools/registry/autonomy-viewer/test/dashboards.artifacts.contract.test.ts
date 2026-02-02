/**
 * Dashboard Artifacts Contract Tests
 * ==================================
 *
 * Phase IIIh: TDD contract tests for dashboard generator.
 *
 * These tests verify:
 * 1. Dashboard artifacts parse and validate schema
 * 2. Dashboards reference only known metrics and labels
 * 3. Panel IDs are unique
 * 4. SLOs are represented in dashboard
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
    exportDashboardJson,
    getDashboardLabels,
    getDashboardMetrics,
    getKnownMetrics,
    SECURITY_PLANE_DASHBOARD,
    validateDashboard,
    validateDashboardReferences,
} from '../src/security/ops/dashboards/generator.js';
import { ALLOWED_SLO_DIMENSIONS, SECURITY_SLO_CATALOG } from '../src/security/ops/slo/catalog.js';

describe('Dashboard Artifacts Contract', () => {
  describe('dashboard_artifacts_parse_and_validate_schema', () => {
    it('should export SECURITY_PLANE_DASHBOARD', () => {
      assert.ok(SECURITY_PLANE_DASHBOARD, 'SECURITY_PLANE_DASHBOARD must be exported');
      assert.ok(typeof SECURITY_PLANE_DASHBOARD === 'object', 'Must be an object');
    });

    it('should have required fields', () => {
      assert.ok(SECURITY_PLANE_DASHBOARD.id, 'id is required');
      assert.ok(SECURITY_PLANE_DASHBOARD.title, 'title is required');
      assert.ok(SECURITY_PLANE_DASHBOARD.schemaVersion, 'schemaVersion is required');
      assert.ok(SECURITY_PLANE_DASHBOARD.version, 'version is required');
    });

    it('should have correct schema version', () => {
      assert.strictEqual(
        SECURITY_PLANE_DASHBOARD.schemaVersion,
        'terrafusion.ops.dashboard.v1',
        'Schema version must match expected format'
      );
    });

    it('should reference source SLO version', () => {
      assert.strictEqual(
        SECURITY_PLANE_DASHBOARD.sourceSloVersion,
        SECURITY_SLO_CATALOG.version,
        'Must reference source SLO catalog version'
      );
    });

    it('should have rows with panels', () => {
      assert.ok(Array.isArray(SECURITY_PLANE_DASHBOARD.rows), 'rows must be an array');
      assert.ok(SECURITY_PLANE_DASHBOARD.rows.length > 0, 'Must have at least one row');

      for (const row of SECURITY_PLANE_DASHBOARD.rows) {
        assert.ok(row.title, 'Row must have title');
        assert.ok(Array.isArray(row.panels), 'Row must have panels array');
      }
    });

    it('should pass schema validation', () => {
      const result = validateDashboard(SECURITY_PLANE_DASHBOARD);
      assert.ok(result.valid, `Validation failed: ${result.errors.join(', ')}`);
    });

    it('should export valid JSON', () => {
      const json = exportDashboardJson(SECURITY_PLANE_DASHBOARD);
      assert.ok(json, 'Should export JSON');

      let parsed: unknown;
      assert.doesNotThrow(() => {
        parsed = JSON.parse(json);
      }, 'JSON should be parseable');

      assert.ok(parsed, 'Parsed JSON should be truthy');
    });
  });

  describe('dashboards_reference_only_known_metrics_and_labels', () => {
    it('should pass reference validation', () => {
      const result = validateDashboardReferences(SECURITY_PLANE_DASHBOARD);
      assert.ok(result.valid, `Reference validation failed: ${result.errors.join(', ')}`);
    });

    it('should use only metrics from SLO catalog', () => {
      const dashboardMetrics = getDashboardMetrics(SECURITY_PLANE_DASHBOARD);
      const knownMetrics = getKnownMetrics();

      for (const metric of dashboardMetrics) {
        assert.ok(knownMetrics.has(metric), `Dashboard references unknown metric: ${metric}`);
      }
    });

    it('should use only labels from SLO allowlist', () => {
      const dashboardLabels = getDashboardLabels(SECURITY_PLANE_DASHBOARD);
      const allowedLabels = new Set([...ALLOWED_SLO_DIMENSIONS, 'alertname', 'severity', 'slo_id']);

      for (const label of dashboardLabels) {
        assert.ok(
          allowedLabels.has(label as never),
          `Dashboard references non-allowlisted label: ${label}`
        );
      }
    });

    it('should not include high-cardinality labels', () => {
      const forbiddenLabels = ['user_id', 'email', 'ip_address', 'session_id', 'trace_id'];
      const dashboardLabels = getDashboardLabels(SECURITY_PLANE_DASHBOARD);

      for (const label of dashboardLabels) {
        assert.ok(
          !forbiddenLabels.includes(label),
          `Dashboard uses forbidden high-cardinality label: ${label}`
        );
      }
    });
  });

  describe('panel_ids_are_unique', () => {
    it('should have unique panel IDs', () => {
      const panelIds: string[] = [];
      for (const row of SECURITY_PLANE_DASHBOARD.rows) {
        for (const panel of row.panels) {
          panelIds.push(panel.id);
        }
      }

      const uniqueIds = [...new Set(panelIds)];
      assert.strictEqual(panelIds.length, uniqueIds.length, 'All panel IDs must be unique');
    });

    it('should have consistent panel ID format', () => {
      for (const row of SECURITY_PLANE_DASHBOARD.rows) {
        for (const panel of row.panels) {
          assert.ok(
            /^[a-z_]+_[a-z_.]+$/.test(panel.id),
            `Panel ID ${panel.id} should follow snake_case format`
          );
        }
      }
    });
  });

  describe('slos_represented_in_dashboard', () => {
    it('should have at least one panel per SLO', () => {
      const sloIds = SECURITY_SLO_CATALOG.slos.map(slo => slo.id);
      const panelSloIds: string[] = [];

      for (const row of SECURITY_PLANE_DASHBOARD.rows) {
        for (const panel of row.panels) {
          if (panel.sloId) {
            panelSloIds.push(panel.sloId);
          }
        }
      }

      for (const sloId of sloIds) {
        assert.ok(panelSloIds.includes(sloId), `SLO ${sloId} should be represented in dashboard`);
      }
    });

    it('should have stat panel for each SLO', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        let hasStatPanel = false;
        for (const row of SECURITY_PLANE_DASHBOARD.rows) {
          for (const panel of row.panels) {
            if (panel.sloId === slo.id && panel.type === 'stat') {
              hasStatPanel = true;
            }
          }
        }
        assert.ok(hasStatPanel, `SLO ${slo.id} should have a stat panel`);
      }
    });

    it('should have trend panel for each SLO', () => {
      for (const slo of SECURITY_SLO_CATALOG.slos) {
        let hasTrendPanel = false;
        for (const row of SECURITY_PLANE_DASHBOARD.rows) {
          for (const panel of row.panels) {
            if (panel.sloId === slo.id && panel.type === 'timeseries') {
              hasTrendPanel = true;
            }
          }
        }
        assert.ok(hasTrendPanel, `SLO ${slo.id} should have a trend panel`);
      }
    });
  });

  describe('grid_positions_valid', () => {
    it('should have valid grid positions', () => {
      for (const row of SECURITY_PLANE_DASHBOARD.rows) {
        for (const panel of row.panels) {
          assert.ok(panel.gridPos, `Panel ${panel.id} must have gridPos`);
          assert.ok(
            panel.gridPos.w > 0 && panel.gridPos.h > 0,
            `Panel ${panel.id} must have positive dimensions`
          );
          assert.ok(
            panel.gridPos.x >= 0 && panel.gridPos.y >= 0,
            `Panel ${panel.id} must have non-negative position`
          );
        }
      }
    });
  });

  describe('thresholds_defined', () => {
    it('stat panels should have thresholds', () => {
      for (const row of SECURITY_PLANE_DASHBOARD.rows) {
        for (const panel of row.panels) {
          if (panel.type === 'stat' || panel.type === 'gauge') {
            assert.ok(
              panel.thresholds && panel.thresholds.length > 0,
              `Panel ${panel.id} should have thresholds`
            );
          }
        }
      }
    });

    it('thresholds should have colors', () => {
      for (const row of SECURITY_PLANE_DASHBOARD.rows) {
        for (const panel of row.panels) {
          if (panel.thresholds) {
            for (const threshold of panel.thresholds) {
              assert.ok(threshold.color, 'Threshold must have color');
              assert.ok(typeof threshold.value === 'number', 'Threshold must have numeric value');
            }
          }
        }
      }
    });
  });
});
