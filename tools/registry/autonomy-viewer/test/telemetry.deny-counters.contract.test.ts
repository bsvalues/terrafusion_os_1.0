/**
 * Telemetry Deny Counters Contract Tests
 * ========================================
 *
 * Phase IIIg: Verify structured telemetry for DENY_* outcomes.
 *
 * These tests ensure:
 * - Counters increment deterministically for each denial code
 * - Labels are cardinality-bounded (allowlist only)
 * - Telemetry failures do not affect auth decisions
 */

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
    ALLOWED_LABEL_KEYS,
    ALLOWED_PROVIDERS,
    getSecurityMetrics,
    InMemorySecurityMetrics,
    NoopSecurityMetrics,
    resetSecurityMetrics,
    setSecurityMetrics,
    validateLabels,
    type SecurityMetrics
} from '../src/security/telemetry/metrics.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const DENY_CODES = [
  'DENY_TOKEN_EXPIRED',
  'DENY_TOKEN_MALFORMED',
  'DENY_TOKEN_ISSUER_MISMATCH',
  'DENY_TOKEN_AUDIENCE_MISMATCH',
  'DENY_TOKEN_SIGNATURE_INVALID',
  'DENY_TOKEN_KEY_UNKNOWN',
  'DENY_TOKEN_MISSING',
  'DENY_PROVIDER_ERROR',
  'DENY_PROVIDER_TIMEOUT',
  'DENY_PROVIDER_CONFIG_ERROR',
] as const;

// ============================================================================
// Counter Increment Tests
// ============================================================================

describe('Telemetry Deny Counters Contract', () => {
  let metrics: SecurityMetrics;

  beforeEach(() => {
    resetSecurityMetrics();
    metrics = new InMemorySecurityMetrics();
    setSecurityMetrics(metrics);
  });

  afterEach(() => {
    resetSecurityMetrics();
  });

  describe('increments_counter_for_each_DENY_code', () => {
    it('should increment counter for DENY_TOKEN_EXPIRED', () => {
      const m = getSecurityMetrics();

      m.incrementDeny('entra-oidc', 'DENY_TOKEN_EXPIRED');
      m.incrementDeny('entra-oidc', 'DENY_TOKEN_EXPIRED');
      m.incrementDeny('entra-oidc', 'DENY_TOKEN_EXPIRED');

      const snapshot = m.snapshot();
      assert.strictEqual(snapshot.denyCounters.get('entra-oidc:DENY_TOKEN_EXPIRED'), 3);
    });

    it('should track different denial codes independently', () => {
      const m = getSecurityMetrics();

      m.incrementDeny('entra-oidc', 'DENY_TOKEN_EXPIRED');
      m.incrementDeny('entra-oidc', 'DENY_TOKEN_MALFORMED');
      m.incrementDeny('entra-oidc', 'DENY_TOKEN_EXPIRED');

      const snapshot = m.snapshot();
      assert.strictEqual(snapshot.denyCounters.get('entra-oidc:DENY_TOKEN_EXPIRED'), 2);
      assert.strictEqual(snapshot.denyCounters.get('entra-oidc:DENY_TOKEN_MALFORMED'), 1);
    });

    it('should track different providers independently', () => {
      const m = getSecurityMetrics();

      m.incrementDeny('entra-oidc', 'DENY_TOKEN_EXPIRED');
      m.incrementDeny('env', 'DENY_PROVIDER_ERROR');
      m.incrementDeny('file', 'DENY_PROVIDER_ERROR');

      const snapshot = m.snapshot();
      assert.strictEqual(snapshot.denyCounters.get('entra-oidc:DENY_TOKEN_EXPIRED'), 1);
      assert.strictEqual(snapshot.denyCounters.get('env:DENY_PROVIDER_ERROR'), 1);
      assert.strictEqual(snapshot.denyCounters.get('file:DENY_PROVIDER_ERROR'), 1);
    });

    it('should increment all known DENY codes without error', () => {
      const m = getSecurityMetrics();

      for (const code of DENY_CODES) {
        m.incrementDeny('entra-oidc', code);
      }

      const snapshot = m.snapshot();
      for (const code of DENY_CODES) {
        assert.strictEqual(
          snapshot.denyCounters.get(`entra-oidc:${code}`),
          1,
          `Counter for ${code} should be 1`
        );
      }
    });

    it('should track allow counter separately from deny', () => {
      const m = getSecurityMetrics();

      m.incrementAllow('entra-oidc');
      m.incrementAllow('entra-oidc');
      m.incrementDeny('entra-oidc', 'DENY_TOKEN_EXPIRED');

      const snapshot = m.snapshot();
      assert.strictEqual(snapshot.allowCounters.get('entra-oidc'), 2);
      assert.strictEqual(snapshot.denyCounters.get('entra-oidc:DENY_TOKEN_EXPIRED'), 1);
    });
  });

  describe('never_emits_unbounded_labels', () => {
    it('should only allow labels from the allowlist', () => {
      // Valid labels
      assert.doesNotThrow(() => {
        validateLabels({ provider: 'entra-oidc', code: 'DENY_TOKEN_EXPIRED' });
      });

      assert.doesNotThrow(() => {
        validateLabels({ stage: 'lookup', outcome: 'hit' });
      });
    });

    it('should reject labels not in allowlist', () => {
      // user_id is PII-derived, should be rejected
      assert.throws(
        () => validateLabels({ user_id: 'some-id' }),
        /TELEMETRY_CONFIG_ERROR.*user_id.*not in allowlist/
      );

      // email is PII, should be rejected
      assert.throws(
        () => validateLabels({ email: 'user@example.com' }),
        /TELEMETRY_CONFIG_ERROR.*email.*not in allowlist/
      );

      // tenant_id could be unbounded, should be rejected
      assert.throws(
        () => validateLabels({ tenant_id: 'tid-123' }),
        /TELEMETRY_CONFIG_ERROR.*tenant_id.*not in allowlist/
      );
    });

    it('should have a bounded set of allowed label keys', () => {
      // Ensure the allowlist is explicit and small
      assert.ok(
        ALLOWED_LABEL_KEYS.length <= 10,
        `Label allowlist should be bounded (got ${ALLOWED_LABEL_KEYS.length})`
      );

      // All expected keys are present
      assert.ok(ALLOWED_LABEL_KEYS.includes('provider'));
      assert.ok(ALLOWED_LABEL_KEYS.includes('code'));
      assert.ok(ALLOWED_LABEL_KEYS.includes('stage'));
      assert.ok(ALLOWED_LABEL_KEYS.includes('outcome'));
    });

    it('should have a bounded set of allowed provider values', () => {
      // Ensure providers are bounded
      assert.ok(
        ALLOWED_PROVIDERS.length <= 10,
        `Provider allowlist should be bounded (got ${ALLOWED_PROVIDERS.length})`
      );

      // All expected providers are present
      assert.ok(ALLOWED_PROVIDERS.includes('env'));
      assert.ok(ALLOWED_PROVIDERS.includes('file'));
      assert.ok(ALLOWED_PROVIDERS.includes('entra-oidc'));
      assert.ok(ALLOWED_PROVIDERS.includes('static'));
    });
  });

  describe('telemetry_failures_do_not_affect_auth_decision', () => {
    it('should not throw when incrementing counters', () => {
      const m = getSecurityMetrics();

      // This should never throw, even with unusual input
      assert.doesNotThrow(() => {
        m.incrementDeny('entra-oidc', 'DENY_TOKEN_EXPIRED');
        m.incrementDeny('entra-oidc', ''); // empty code
        m.incrementDeny('entra-oidc', 'CUSTOM_CODE'); // unknown code
      });
    });

    it('should not throw with NoopSecurityMetrics', () => {
      const noopMetrics = new NoopSecurityMetrics();

      // All methods should be no-ops that never throw
      assert.doesNotThrow(() => {
        noopMetrics.incrementDeny('entra-oidc', 'DENY_TOKEN_EXPIRED');
        noopMetrics.incrementAllow('entra-oidc');
        noopMetrics.recordJwksCacheHit('entra-oidc');
        noopMetrics.recordJwksCacheMiss('entra-oidc');
        noopMetrics.recordJwksRefresh('entra-oidc', true);
        noopMetrics.recordJwksRefresh('entra-oidc', false);
        noopMetrics.snapshot();
        noopMetrics.reset();
      });
    });

    it('should return empty snapshot from NoopSecurityMetrics', () => {
      const noopMetrics = new NoopSecurityMetrics();

      // Increment some counters
      noopMetrics.incrementDeny('entra-oidc', 'DENY_TOKEN_EXPIRED');
      noopMetrics.incrementAllow('entra-oidc');

      // Snapshot should always be empty
      const snapshot = noopMetrics.snapshot();
      assert.strictEqual(snapshot.denyCounters.size, 0);
      assert.strictEqual(snapshot.allowCounters.size, 0);
    });

    it('should continue working after reset', () => {
      const m = getSecurityMetrics();

      m.incrementDeny('entra-oidc', 'DENY_TOKEN_EXPIRED');
      m.reset();
      m.incrementDeny('entra-oidc', 'DENY_TOKEN_EXPIRED');

      const snapshot = m.snapshot();
      assert.strictEqual(snapshot.denyCounters.get('entra-oidc:DENY_TOKEN_EXPIRED'), 1);
    });
  });

  describe('counter_isolation', () => {
    it('should isolate counters between different metric instances', () => {
      const m1 = new InMemorySecurityMetrics();
      const m2 = new InMemorySecurityMetrics();

      m1.incrementDeny('entra-oidc', 'DENY_TOKEN_EXPIRED');
      m2.incrementDeny('entra-oidc', 'DENY_TOKEN_MALFORMED');

      assert.strictEqual(m1.snapshot().denyCounters.get('entra-oidc:DENY_TOKEN_EXPIRED'), 1);
      assert.strictEqual(
        m1.snapshot().denyCounters.get('entra-oidc:DENY_TOKEN_MALFORMED'),
        undefined
      );

      assert.strictEqual(m2.snapshot().denyCounters.get('entra-oidc:DENY_TOKEN_MALFORMED'), 1);
      assert.strictEqual(
        m2.snapshot().denyCounters.get('entra-oidc:DENY_TOKEN_EXPIRED'),
        undefined
      );
    });

    it('should use global singleton when using getSecurityMetrics', () => {
      const m1 = getSecurityMetrics();
      const m2 = getSecurityMetrics();

      m1.incrementDeny('entra-oidc', 'DENY_TOKEN_EXPIRED');

      // Both should see the same counter
      assert.strictEqual(m1.snapshot().denyCounters.get('entra-oidc:DENY_TOKEN_EXPIRED'), 1);
      assert.strictEqual(m2.snapshot().denyCounters.get('entra-oidc:DENY_TOKEN_EXPIRED'), 1);
    });
  });
});
