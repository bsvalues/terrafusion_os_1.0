/**
 * Alerts Publish Contract Tests
 * ==============================
 *
 * Phase IIIi: TDD contracts for alert publishing pipeline.
 *
 * These tests verify:
 * 1. Dry-run validation in CI mode
 * 2. Invalid rule rejection
 * 3. Publish idempotency
 * 4. Fail-silent relative to auth
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { SECURITY_ALERT_CATALOG } from '../src/security/ops/alerts/rules.js';
import {
    createAlertsPublisher,
    validateAlertRules
} from '../src/security/ops/publish/alerts.publisher.js';

describe('Alerts Publish Contract', () => {
  describe('dry_run_validation_runs_in_ci_mode', () => {
    it('should support dry-run mode', async () => {
      const publisher = createAlertsPublisher({ mode: 'dry-run' });

      const result = await publisher.publish(SECURITY_ALERT_CATALOG);

      assert.strictEqual(result.dryRun, true);
      assert.ok(result.validated, 'Should validate rules in dry-run');
    });

    it('should not actually publish in dry-run mode', async () => {
      let publishCalled = false;

      const publisher = createAlertsPublisher({
        mode: 'dry-run',
        backend: {
          push: async () => {
            publishCalled = true;
          },
        },
      });

      await publisher.publish(SECURITY_ALERT_CATALOG);

      assert.strictEqual(publishCalled, false, 'Backend should not be called in dry-run');
    });

    it('should detect CI environment', () => {
      const publisher = createAlertsPublisher({ ciMode: true });
      assert.strictEqual(publisher.isCiMode(), true);
    });

    it('should default to dry-run in CI mode', async () => {
      const publisher = createAlertsPublisher({ ciMode: true });

      const result = await publisher.publish(SECURITY_ALERT_CATALOG);

      assert.strictEqual(result.dryRun, true);
    });
  });

  describe('rejects_invalid_rule_payload', () => {
    it('should reject rules without required fields', () => {
      const invalidRules = {
        version: '1.0.0',
        schemaVersion: 'terrafusion.ops.alerts.v1',
        rules: [
          {
            // Missing id, name, sloId, etc.
            severity: 'critical',
          },
        ],
        sourceSloVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
      };

      const result = validateAlertRules(invalidRules as never);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('should reject rules with invalid severity', () => {
      const invalidRules = {
        version: '1.0.0',
        schemaVersion: 'terrafusion.ops.alerts.v1',
        rules: [
          {
            id: 'test.rule',
            name: 'Test Rule',
            description: 'Test',
            severity: 'mega-critical', // Invalid
            sloId: 'test.slo',
            type: 'threshold',
            threshold: 0.99,
            comparison: 'above',
            windowSeconds: 300,
            labels: [],
            suppressionWindowSeconds: 60,
          },
        ],
        sourceSloVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
      };

      const result = validateAlertRules(invalidRules as never);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('severity')));
    });

    it('should reject rules with non-allowlisted labels', () => {
      const invalidRules = {
        version: '1.0.0',
        schemaVersion: 'terrafusion.ops.alerts.v1',
        rules: [
          {
            id: 'test.rule',
            name: 'Test Rule',
            description: 'Test',
            severity: 'critical',
            sloId: 'test.slo',
            type: 'threshold',
            threshold: 0.99,
            comparison: 'above',
            windowSeconds: 300,
            labels: ['user_id', 'email'], // Not in allowlist
            suppressionWindowSeconds: 60,
          },
        ],
        sourceSloVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
      };

      const result = validateAlertRules(invalidRules as never);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('label') || e.includes('dimension')));
    });

    it('should accept valid alert catalog', () => {
      const result = validateAlertRules(SECURITY_ALERT_CATALOG);

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });
  });

  describe('publish_is_idempotent', () => {
    it('should produce same result for same input', async () => {
      const publishedVersions: string[] = [];

      const publisher = createAlertsPublisher({
        mode: 'live',
        backend: {
          push: async catalog => {
            publishedVersions.push(catalog.version);
          },
        },
      });

      await publisher.publish(SECURITY_ALERT_CATALOG);
      await publisher.publish(SECURITY_ALERT_CATALOG);

      assert.strictEqual(publishedVersions.length, 2);
      assert.strictEqual(publishedVersions[0], publishedVersions[1]);
    });

    it('should skip publish if version unchanged', async () => {
      let publishCount = 0;

      const publisher = createAlertsPublisher({
        mode: 'live',
        skipIfUnchanged: true,
        backend: {
          push: async () => {
            publishCount++;
          },
          getCurrentVersion: async () => SECURITY_ALERT_CATALOG.version,
        },
      });

      await publisher.publish(SECURITY_ALERT_CATALOG);
      await publisher.publish(SECURITY_ALERT_CATALOG);

      assert.strictEqual(publishCount, 0, 'Should skip if version matches');
    });

    it('should publish if version changed', async () => {
      let publishCount = 0;

      const publisher = createAlertsPublisher({
        mode: 'live',
        skipIfUnchanged: true,
        backend: {
          push: async () => {
            publishCount++;
          },
          getCurrentVersion: async () => '0.0.0', // Different version
        },
      });

      await publisher.publish(SECURITY_ALERT_CATALOG);

      assert.strictEqual(publishCount, 1, 'Should publish when version differs');
    });
  });

  describe('publish_failure_is_fail_silent_relative_to_auth', () => {
    it('should not throw when backend fails', async () => {
      const publisher = createAlertsPublisher({
        mode: 'live',
        backend: {
          push: async () => {
            throw new Error('Backend unavailable');
          },
        },
      });

      await assert.doesNotReject(async () => {
        await publisher.publish(SECURITY_ALERT_CATALOG);
      });
    });

    it('should return failure result without throwing', async () => {
      const publisher = createAlertsPublisher({
        mode: 'live',
        backend: {
          push: async () => {
            throw new Error('Network error');
          },
        },
      });

      const result = await publisher.publish(SECURITY_ALERT_CATALOG);

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });

    it('should count publish failures', async () => {
      const publisher = createAlertsPublisher({
        mode: 'live',
        backend: {
          push: async () => {
            throw new Error('Failure');
          },
        },
      });

      await publisher.publish(SECURITY_ALERT_CATALOG);
      await publisher.publish(SECURITY_ALERT_CATALOG);

      const stats = publisher.getStats();
      assert.strictEqual(stats.failures, 2);
    });

    it('should isolate failures from auth decision path', async () => {
      const publisher = createAlertsPublisher({
        mode: 'live',
        backend: {
          push: async () => {
            throw new Error('Critical failure');
          },
        },
      });

      // Simulate auth decision path that also publishes alerts
      let authDecision = 'pending';
      try {
        await publisher.publish(SECURITY_ALERT_CATALOG);
        authDecision = 'allowed'; // Would proceed to auth decision
      } catch {
        authDecision = 'error'; // Should NOT happen
      }

      assert.strictEqual(authDecision, 'allowed', 'Auth path must not be affected');
    });
  });

  describe('validation_output', () => {
    it('should provide detailed validation errors', () => {
      const invalidRules = {
        version: '',
        schemaVersion: '',
        rules: [],
        sourceSloVersion: '',
        generatedAt: '',
      };

      const result = validateAlertRules(invalidRules as never);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
      // Should have specific error messages
      assert.ok(result.errors.some(e => e.includes('version') || e.includes('rules')));
    });
  });
});
