/**
 * Dashboards Publish Contract Tests
 * ==================================
 *
 * Phase IIIi: TDD contracts for dashboard publishing pipeline.
 *
 * These tests verify:
 * 1. Schema validation of generated dashboards
 * 2. Unknown metrics/dimensions rejection
 * 3. Publish idempotency and versioning
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
    SECURITY_PLANE_DASHBOARD,
    validateDashboard,
} from '../src/security/ops/dashboards/generator.js';
import {
    createDashboardsPublisher,
    validateDashboardSchema
} from '../src/security/ops/publish/dashboards.publisher.js';

describe('Dashboards Publish Contract', () => {
  describe('validates_generated_dashboards_against_schema', () => {
    it('should validate dashboard against schema', () => {
      const result = validateDashboardSchema(SECURITY_PLANE_DASHBOARD);

      assert.strictEqual(
        result.valid,
        true,
        `Schema validation failed: ${result.errors.join(', ')}`
      );
    });

    it('should reject dashboard missing required fields', () => {
      const invalidDashboard = {
        // Missing id, title, schemaVersion, etc.
        rows: [],
      };

      const result = validateDashboardSchema(invalidDashboard as never);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('should reject dashboard with invalid row structure', () => {
      const invalidDashboard = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        schemaVersion: 'terrafusion.ops.dashboard.v1',
        version: '1.0.0',
        sourceSloVersion: '1.0.0',
        rows: [
          {
            // Missing title, panels
            collapsed: false,
          },
        ],
        generatedAt: new Date().toISOString(),
      };

      const result = validateDashboardSchema(invalidDashboard as never);

      assert.strictEqual(result.valid, false);
    });

    it('should reject panels without required fields', () => {
      const invalidDashboard = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        schemaVersion: 'terrafusion.ops.dashboard.v1',
        version: '1.0.0',
        sourceSloVersion: '1.0.0',
        rows: [
          {
            title: 'Row 1',
            collapsed: false,
            panels: [
              {
                // Missing id, title, type, metrics, labels, gridPos
              },
            ],
          },
        ],
        generatedAt: new Date().toISOString(),
      };

      const result = validateDashboardSchema(invalidDashboard as never);

      assert.strictEqual(result.valid, false);
    });
  });

  describe('rejects_unknown_metrics_or_dimensions', () => {
    it('should detect unknown labels in dashboard', () => {
      const dashboardWithBadLabels = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        schemaVersion: 'terrafusion.ops.dashboard.v1',
        version: '1.0.0',
        sourceSloVersion: '1.0.0',
        rows: [
          {
            title: 'Row 1',
            collapsed: false,
            panels: [
              {
                id: 'panel1',
                title: 'Panel 1',
                description: 'Test panel',
                type: 'stat',
                metrics: ['security.deny.total'],
                labels: ['user_id', 'email'], // Not in allowlist
                gridPos: { x: 0, y: 0, w: 6, h: 4 },
              },
            ],
          },
        ],
        generatedAt: new Date().toISOString(),
      };

      const result = validateDashboard(dashboardWithBadLabels as never);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('label') || e.includes('unknown')));
    });

    it('should accept dashboard with only allowlisted labels', () => {
      const result = validateDashboard(SECURITY_PLANE_DASHBOARD);

      assert.strictEqual(result.valid, true, `Validation failed: ${result.errors.join(', ')}`);
    });

    it('should validate metrics exist in SLO catalog', () => {
      const dashboardWithUnknownMetric = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        schemaVersion: 'terrafusion.ops.dashboard.v1',
        version: '1.0.0',
        sourceSloVersion: '1.0.0',
        rows: [
          {
            title: 'Row 1',
            collapsed: false,
            panels: [
              {
                id: 'panel1',
                title: 'Panel 1',
                description: 'Test panel',
                type: 'stat',
                metrics: ['unknown.metric.does.not.exist'],
                labels: ['provider'],
                gridPos: { x: 0, y: 0, w: 6, h: 4 },
              },
            ],
          },
        ],
        generatedAt: new Date().toISOString(),
      };

      const result = validateDashboard(dashboardWithUnknownMetric as never);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('metric') || e.includes('unknown')));
    });
  });

  describe('publish_is_idempotent_and_versioned', () => {
    it('should produce same result for same input', async () => {
      const publishedVersions: string[] = [];

      const publisher = createDashboardsPublisher({
        backend: {
          push: async dashboard => {
            publishedVersions.push(dashboard.version);
          },
        },
      });

      await publisher.publish(SECURITY_PLANE_DASHBOARD);
      await publisher.publish(SECURITY_PLANE_DASHBOARD);

      assert.strictEqual(publishedVersions.length, 2);
      assert.strictEqual(publishedVersions[0], publishedVersions[1]);
    });

    it('should skip publish if version unchanged', async () => {
      let publishCount = 0;

      const publisher = createDashboardsPublisher({
        skipIfUnchanged: true,
        backend: {
          push: async () => {
            publishCount++;
          },
          getCurrentVersion: async () => SECURITY_PLANE_DASHBOARD.version,
        },
      });

      await publisher.publish(SECURITY_PLANE_DASHBOARD);

      assert.strictEqual(publishCount, 0, 'Should skip if version matches');
    });

    it('should publish if version changed', async () => {
      let publishCount = 0;

      const publisher = createDashboardsPublisher({
        skipIfUnchanged: true,
        backend: {
          push: async () => {
            publishCount++;
          },
          getCurrentVersion: async () => '0.0.0', // Different version
        },
      });

      await publisher.publish(SECURITY_PLANE_DASHBOARD);

      assert.strictEqual(publishCount, 1);
    });

    it('should include version in publish result', async () => {
      const publisher = createDashboardsPublisher({
        backend: {
          push: async () => {},
        },
      });

      const result = await publisher.publish(SECURITY_PLANE_DASHBOARD);

      assert.strictEqual(result.publishedVersion, SECURITY_PLANE_DASHBOARD.version);
    });
  });

  describe('publish_failure_handling', () => {
    it('should not throw when backend fails', async () => {
      const publisher = createDashboardsPublisher({
        backend: {
          push: async () => {
            throw new Error('Backend unavailable');
          },
        },
      });

      await assert.doesNotReject(async () => {
        await publisher.publish(SECURITY_PLANE_DASHBOARD);
      });
    });

    it('should return failure result', async () => {
      const publisher = createDashboardsPublisher({
        backend: {
          push: async () => {
            throw new Error('Network error');
          },
        },
      });

      const result = await publisher.publish(SECURITY_PLANE_DASHBOARD);

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should validate before publish', async () => {
      let publishCalled = false;

      const publisher = createDashboardsPublisher({
        backend: {
          push: async () => {
            publishCalled = true;
          },
        },
      });

      const invalidDashboard = { rows: [] } as never;
      const result = await publisher.publish(invalidDashboard);

      assert.strictEqual(result.success, false);
      assert.strictEqual(publishCalled, false, 'Should not push invalid dashboard');
    });
  });

  describe('dry_run_mode', () => {
    it('should support dry-run mode', async () => {
      let pushCalled = false;

      const publisher = createDashboardsPublisher({
        mode: 'dry-run',
        backend: {
          push: async () => {
            pushCalled = true;
          },
        },
      });

      const result = await publisher.publish(SECURITY_PLANE_DASHBOARD);

      assert.strictEqual(result.dryRun, true);
      assert.strictEqual(pushCalled, false);
    });

    it('should validate in dry-run mode', async () => {
      const publisher = createDashboardsPublisher({ mode: 'dry-run' });

      const result = await publisher.publish(SECURITY_PLANE_DASHBOARD);

      assert.strictEqual(result.validated, true);
    });
  });
});
