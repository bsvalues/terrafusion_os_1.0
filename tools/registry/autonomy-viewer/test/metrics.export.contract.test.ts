/**
 * Metrics Export Contract Tests
 * ==============================
 *
 * Phase IIIi: TDD contracts for metrics export adapter.
 *
 * These tests verify:
 * 1. Dimension filtering at export boundary
 * 2. Fail-silent exporter behavior
 * 3. No auth-path coupling
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
    DimensionFilter,
    SecurityMetricsExporter,
    createMetricsExporter
} from '../src/security/ops/metrics/exporter.js';
import { ALLOWED_SLO_DIMENSIONS } from '../src/security/ops/slo/catalog.js';

describe('Metrics Export Contract', () => {
  describe('filters_dimensions_to_allowlist_only', () => {
    it('should only include allowed dimensions in exported metrics', () => {
      const filter = new DimensionFilter(ALLOWED_SLO_DIMENSIONS);

      const rawLabels = {
        provider: 'entra',
        code: 'DENY_NO_TOKEN',
        stage: 'validation',
        user_id: 'should-be-removed',
        email: 'also-removed',
        ip_address: '1.2.3.4',
      };

      const filtered = filter.filterLabels(rawLabels);

      assert.strictEqual(filtered.provider, 'entra');
      assert.strictEqual(filtered.code, 'DENY_NO_TOKEN');
      assert.strictEqual(filtered.stage, 'validation');
      assert.ok(!('user_id' in filtered), 'user_id must be filtered');
      assert.ok(!('email' in filtered), 'email must be filtered');
      assert.ok(!('ip_address' in filtered), 'ip_address must be filtered');
    });

    it('should handle empty labels', () => {
      const filter = new DimensionFilter(ALLOWED_SLO_DIMENSIONS);
      const filtered = filter.filterLabels({});
      assert.deepStrictEqual(filtered, {});
    });

    it('should preserve only allowlisted keys', () => {
      const filter = new DimensionFilter(['provider', 'code', 'stage']);

      const labels = { provider: 'test', unknown: 'drop-me' };
      const filtered = filter.filterLabels(labels);

      assert.strictEqual(Object.keys(filtered).length, 1);
      assert.strictEqual(filtered.provider, 'test');
    });
  });

  describe('drops_or_redacts_disallowed_labels', () => {
    it('should drop labels not in allowlist', () => {
      const filter = new DimensionFilter(ALLOWED_SLO_DIMENSIONS);

      const labels = {
        provider: 'entra',
        session_id: 'abc123',
        trace_id: 'xyz789',
      };

      const filtered = filter.filterLabels(labels);

      assert.ok(!('session_id' in filtered));
      assert.ok(!('trace_id' in filtered));
      assert.ok('provider' in filtered);
    });

    it('should count dropped labels', () => {
      const filter = new DimensionFilter(ALLOWED_SLO_DIMENSIONS);

      const labels = {
        provider: 'entra',
        user_id: 'drop',
        email: 'drop',
        ip: 'drop',
      };

      const result = filter.filterLabelsWithStats(labels);

      assert.strictEqual(result.kept, 1);
      assert.strictEqual(result.dropped, 3);
    });
  });

  describe('exporter_failure_is_swallowed_and_counted', () => {
    it('should not throw when exporter fails', async () => {
      const failingExporter = createMetricsExporter({
        export: async () => {
          throw new Error('Exporter unavailable');
        },
      });

      await assert.doesNotReject(async () => {
        await failingExporter.export({
          name: 'security.deny.total',
          value: 1,
          labels: { provider: 'entra' },
          timestamp: Date.now(),
        });
      });
    });

    it('should count export failures', async () => {
      let callCount = 0;
      const failingExporter = createMetricsExporter({
        export: async () => {
          callCount++;
          throw new Error('Exporter unavailable');
        },
      });

      await failingExporter.export({
        name: 'security.deny.total',
        value: 1,
        labels: {},
        timestamp: Date.now(),
      });

      const stats = failingExporter.getStats();
      assert.strictEqual(stats.failures, 1);
      assert.strictEqual(callCount, 1);
    });

    it('should return failure result without throwing', async () => {
      const failingExporter = createMetricsExporter({
        export: async () => {
          throw new Error('Network error');
        },
      });

      const result = await failingExporter.export({
        name: 'test.metric',
        value: 1,
        labels: {},
        timestamp: Date.now(),
      });

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  describe('does_not_throw_across_auth_boundary', () => {
    it('should isolate export errors from caller', async () => {
      const exporter = createMetricsExporter({
        export: async () => {
          throw new Error('Critical exporter failure');
        },
      });

      // Simulate auth decision path calling metrics
      let authDecision = 'pending';
      try {
        await exporter.export({
          name: 'security.auth.total',
          value: 1,
          labels: { provider: 'entra' },
          timestamp: Date.now(),
        });
        authDecision = 'allowed'; // Would proceed to auth decision
      } catch {
        authDecision = 'error'; // Should NOT happen
      }

      assert.strictEqual(
        authDecision,
        'allowed',
        'Auth path must not be affected by export failure'
      );
    });

    it('should complete export synchronously if possible', () => {
      const exporter = createMetricsExporter({
        export: async () => {
          // Simulate slow exporter
          await new Promise(r => setTimeout(r, 10));
        },
      });

      // Fire-and-forget export should return immediately
      const startTime = Date.now();
      exporter.exportAsync({
        name: 'security.auth.total',
        value: 1,
        labels: {},
        timestamp: Date.now(),
      });
      const elapsed = Date.now() - startTime;

      // Should return immediately (< 5ms), not wait for the 10ms delay
      assert.ok(elapsed < 5, `Export should be async, took ${elapsed}ms`);
    });
  });

  describe('exporter_lifecycle', () => {
    it('should support registering multiple backends', () => {
      const exporter = new SecurityMetricsExporter();

      let backend1Calls = 0;
      let backend2Calls = 0;

      exporter.registerBackend({
        name: 'backend1',
        export: async () => {
          backend1Calls++;
        },
      });

      exporter.registerBackend({
        name: 'backend2',
        export: async () => {
          backend2Calls++;
        },
      });

      assert.strictEqual(exporter.getBackendCount(), 2);
    });

    it('should export to all registered backends', async () => {
      const exporter = new SecurityMetricsExporter();

      let backend1Calls = 0;
      let backend2Calls = 0;

      exporter.registerBackend({
        name: 'backend1',
        export: async () => {
          backend1Calls++;
        },
      });

      exporter.registerBackend({
        name: 'backend2',
        export: async () => {
          backend2Calls++;
        },
      });

      await exporter.export({
        name: 'test.metric',
        value: 1,
        labels: {},
        timestamp: Date.now(),
      });

      assert.strictEqual(backend1Calls, 1);
      assert.strictEqual(backend2Calls, 1);
    });

    it('should continue exporting to other backends if one fails', async () => {
      const exporter = new SecurityMetricsExporter();

      let backend2Calls = 0;

      exporter.registerBackend({
        name: 'failing-backend',
        export: async () => {
          throw new Error('Backend 1 failed');
        },
      });

      exporter.registerBackend({
        name: 'working-backend',
        export: async () => {
          backend2Calls++;
        },
      });

      await exporter.export({
        name: 'test.metric',
        value: 1,
        labels: {},
        timestamp: Date.now(),
      });

      assert.strictEqual(backend2Calls, 1, 'Backend 2 should still receive export');
    });
  });

  describe('dimension_filtering_at_export_boundary', () => {
    it('should filter labels before sending to backend', async () => {
      let receivedLabels: Record<string, string> = {};

      const exporter = createMetricsExporter({
        export: async point => {
          receivedLabels = point.labels;
        },
      });

      await exporter.export({
        name: 'security.deny.total',
        value: 1,
        labels: {
          provider: 'entra',
          user_id: 'should-be-filtered',
        },
        timestamp: Date.now(),
      });

      assert.strictEqual(receivedLabels.provider, 'entra');
      assert.ok(!('user_id' in receivedLabels), 'user_id must be filtered before export');
    });
  });
});
