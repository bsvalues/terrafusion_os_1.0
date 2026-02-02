/**
 * Incident Bundle Contract Tests
 * ===============================
 *
 * Phase IIIh: TDD contract tests for incident bundle builder.
 *
 * These tests verify:
 * 1. Bundle contains last N events
 * 2. Bundle is PII-clean
 * 3. Bundle generation is fail-silent
 * 4. Hash format is correct
 * 5. Error messages are sanitized
 */

import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

import {
    cleanSecurityEvent,
    EventRingBuffer,
    exportBundleJson,
    generateIncidentBundle,
    hashPii,
    isBundlePiiClean,
    isPiiHash,
    sanitizeErrorMessage,
    type RawSecurityEvent
} from '../src/security/ops/incident/bundle.js';

describe('Incident Bundle Contract', () => {
  describe('bundle_contains_last_n_events', () => {
    it('should limit events to maxEvents', () => {
      const events: RawSecurityEvent[] = [];
      for (let i = 0; i < 100; i++) {
        events.push({
          type: 'AUTH_DENIED',
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
          provider: 'entra',
        });
      }

      const bundle = generateIncidentBundle(events, { maxEvents: 50 });

      assert.strictEqual(bundle.events.length, 50, 'Should limit to 50 events');
      assert.strictEqual(bundle.truncated, true, 'Should mark as truncated');
      assert.strictEqual(bundle.maxEvents, 50, 'Should record maxEvents');
    });

    it('should keep last N events (not first N)', () => {
      const events: RawSecurityEvent[] = [];
      for (let i = 0; i < 20; i++) {
        events.push({
          type: 'AUTH_DENIED',
          timestamp: `2024-01-01T00:00:${String(i).padStart(2, '0')}.000Z`,
          denyCode: `CODE_${i}`,
        });
      }

      const bundle = generateIncidentBundle(events, { maxEvents: 5 });

      // Should keep events 15-19
      assert.strictEqual(bundle.events.length, 5);
      assert.strictEqual(bundle.events[0].denyCode, 'CODE_15');
      assert.strictEqual(bundle.events[4].denyCode, 'CODE_19');
    });

    it('should not truncate if under limit', () => {
      const events: RawSecurityEvent[] = [
        { type: 'AUTH_SUCCESS', timestamp: new Date().toISOString() },
      ];

      const bundle = generateIncidentBundle(events, { maxEvents: 10 });

      assert.strictEqual(bundle.events.length, 1);
      assert.strictEqual(bundle.truncated, false);
    });

    it('should handle empty events', () => {
      const bundle = generateIncidentBundle([], { maxEvents: 10 });

      assert.strictEqual(bundle.events.length, 0);
      assert.strictEqual(bundle.truncated, false);
      assert.strictEqual(bundle.summary.totalEvents, 0);
    });
  });

  describe('bundle_is_pii_clean', () => {
    it('should hash userId', () => {
      const events: RawSecurityEvent[] = [
        {
          type: 'AUTH_DENIED',
          timestamp: new Date().toISOString(),
          userId: 'user-12345',
        },
      ];

      const bundle = generateIncidentBundle(events);
      const cleanEvent = bundle.events[0];

      assert.ok(cleanEvent.userIdHash, 'Should have userIdHash');
      assert.ok(cleanEvent.userIdHash?.startsWith('sha256:'), 'Hash should have prefix');
      assert.ok(!('userId' in cleanEvent), 'Should not have raw userId');
    });

    it('should hash email', () => {
      const events: RawSecurityEvent[] = [
        {
          type: 'AUTH_DENIED',
          timestamp: new Date().toISOString(),
          email: 'user@example.com',
        },
      ];

      const bundle = generateIncidentBundle(events);
      const cleanEvent = bundle.events[0];

      assert.ok(cleanEvent.emailHash, 'Should have emailHash');
      assert.ok(cleanEvent.emailHash?.startsWith('sha256:'));
      assert.ok(!('email' in cleanEvent), 'Should not have raw email');
    });

    it('should hash ipAddress', () => {
      const events: RawSecurityEvent[] = [
        {
          type: 'AUTH_DENIED',
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.1',
        },
      ];

      const bundle = generateIncidentBundle(events);
      const cleanEvent = bundle.events[0];

      assert.ok(cleanEvent.ipAddressHash, 'Should have ipAddressHash');
      assert.ok(cleanEvent.ipAddressHash?.startsWith('sha256:'));
      assert.ok(!('ipAddress' in cleanEvent), 'Should not have raw ipAddress');
    });

    it('should hash sessionId', () => {
      const events: RawSecurityEvent[] = [
        {
          type: 'AUTH_DENIED',
          timestamp: new Date().toISOString(),
          sessionId: 'abc123-session',
        },
      ];

      const bundle = generateIncidentBundle(events);
      const cleanEvent = bundle.events[0];

      assert.ok(cleanEvent.sessionIdHash);
      assert.ok(cleanEvent.sessionIdHash?.startsWith('sha256:'));
    });

    it('should pass PII-clean check for all events', () => {
      const events: RawSecurityEvent[] = [
        {
          type: 'AUTH_DENIED',
          timestamp: new Date().toISOString(),
          userId: 'user-1',
          email: 'a@b.c',
          ipAddress: '1.2.3.4',
          sessionId: 'sess-1',
        },
        {
          type: 'AUTH_SUCCESS',
          timestamp: new Date().toISOString(),
          userId: 'user-2',
        },
      ];

      const bundle = generateIncidentBundle(events);
      assert.ok(isBundlePiiClean(bundle), 'Bundle should be PII-clean');
    });

    it('should produce same hash for same input', () => {
      const hash1 = hashPii('same-value');
      const hash2 = hashPii('same-value');
      assert.strictEqual(hash1, hash2, 'Hashes should be deterministic');
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashPii('value-1');
      const hash2 = hashPii('value-2');
      assert.notStrictEqual(hash1, hash2, 'Different inputs should produce different hashes');
    });
  });

  describe('bundle_generation_is_fail_silent', () => {
    it('should not throw on null/undefined values', () => {
      const events: RawSecurityEvent[] = [
        {
          type: 'AUTH_DENIED',
          timestamp: new Date().toISOString(),
          userId: undefined,
          email: undefined,
        },
      ];

      assert.doesNotThrow(() => {
        const bundle = generateIncidentBundle(events);
        assert.ok(bundle, 'Should return bundle');
      });
    });

    it('should handle malformed events gracefully', () => {
      const events = [{ type: 'AUTH_DENIED' as const, timestamp: '' }, {} as RawSecurityEvent];

      assert.doesNotThrow(() => {
        const bundle = generateIncidentBundle(events);
        assert.ok(bundle);
      });
    });

    it('should return empty bundle on complete failure', () => {
      // Empty array should still return valid bundle structure
      const bundle = generateIncidentBundle([]);

      assert.ok(bundle.bundleId, 'Should have bundleId');
      assert.ok(bundle.generatedAt, 'Should have generatedAt');
      assert.ok(bundle.schemaVersion, 'Should have schemaVersion');
      assert.ok(bundle.timeRange, 'Should have timeRange');
      assert.ok(Array.isArray(bundle.events), 'Should have events array');
      assert.ok(bundle.summary, 'Should have summary');
    });

    it('should not throw when serializing', () => {
      const bundle = generateIncidentBundle([]);
      assert.doesNotThrow(() => {
        const json = exportBundleJson(bundle);
        assert.ok(json, 'Should produce JSON');
      });
    });
  });

  describe('error_message_sanitization', () => {
    it('should redact email addresses in error messages', () => {
      const sanitized = sanitizeErrorMessage('Failed for user@example.com');
      assert.ok(!sanitized?.includes('@'), 'Should not contain @');
      assert.ok(sanitized?.includes('[REDACTED]'), 'Should have redaction marker');
    });

    it('should redact IP addresses in error messages', () => {
      const sanitized = sanitizeErrorMessage('Connection from 192.168.1.1 failed');
      assert.ok(!sanitized?.includes('192.168'), 'Should not contain IP');
      assert.ok(sanitized?.includes('[REDACTED]'), 'Should have redaction marker');
    });

    it('should redact UUIDs in error messages', () => {
      const sanitized = sanitizeErrorMessage(
        'Session 550e8400-e29b-41d4-a716-446655440000 expired'
      );
      assert.ok(!sanitized?.includes('550e8400'), 'Should not contain UUID');
      assert.ok(sanitized?.includes('[REDACTED]'), 'Should have redaction marker');
    });

    it('should redact Bearer tokens', () => {
      const sanitized = sanitizeErrorMessage('Authorization: Bearer abc123xyz789def');
      assert.ok(!sanitized?.includes('abc123'), 'Should not contain token');
    });

    it('should truncate very long messages', () => {
      // Use mixed characters that won't match the 32+ alphanumeric PII pattern
      const longMessage = 'Error with problem - '.repeat(50);
      const sanitized = sanitizeErrorMessage(longMessage);
      assert.ok(sanitized!.length < 600, 'Should be truncated');
      assert.ok(sanitized?.includes('[TRUNCATED]'), 'Should have truncation marker');
    });

    it('should handle undefined gracefully', () => {
      const sanitized = sanitizeErrorMessage(undefined);
      assert.strictEqual(sanitized, undefined);
    });
  });

  describe('event_ring_buffer', () => {
    let buffer: EventRingBuffer;

    beforeEach(() => {
      buffer = new EventRingBuffer(10);
    });

    it('should store events up to max size', () => {
      for (let i = 0; i < 10; i++) {
        buffer.push({
          type: 'AUTH_SUCCESS',
          timestamp: new Date().toISOString(),
        });
      }

      assert.strictEqual(buffer.eventCount, 10);
    });

    it('should evict oldest events when over max', () => {
      for (let i = 0; i < 15; i++) {
        buffer.push({
          type: 'AUTH_SUCCESS',
          timestamp: `2024-01-01T00:00:${String(i).padStart(2, '0')}.000Z`,
          denyCode: `CODE_${i}`,
        });
      }

      assert.strictEqual(buffer.eventCount, 10);

      const events = buffer.getLastEvents(10);
      // Should have events 5-14
      assert.ok(events[0].denyCode === 'CODE_5');
      assert.ok(events[9].denyCode === 'CODE_14');
    });

    it('should filter by time range', () => {
      buffer.push({
        type: 'AUTH_SUCCESS',
        timestamp: '2024-01-01T00:00:00.000Z',
      });
      buffer.push({
        type: 'AUTH_DENIED',
        timestamp: '2024-01-01T12:00:00.000Z',
      });
      buffer.push({
        type: 'AUTH_SUCCESS',
        timestamp: '2024-01-02T00:00:00.000Z',
      });

      const events = buffer.getEventsInRange(
        '2024-01-01T06:00:00.000Z',
        '2024-01-01T18:00:00.000Z'
      );

      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].type, 'AUTH_DENIED');
    });

    it('should clear all events', () => {
      buffer.push({ type: 'AUTH_SUCCESS', timestamp: new Date().toISOString() });
      buffer.push({ type: 'AUTH_SUCCESS', timestamp: new Date().toISOString() });

      buffer.clear();

      assert.strictEqual(buffer.eventCount, 0);
    });
  });

  describe('hash_format', () => {
    it('should produce sha256: prefixed hashes', () => {
      const hash = hashPii('test-value');
      assert.ok(hash?.startsWith('sha256:'), 'Should have sha256: prefix');
    });

    it('should produce 16-char hex suffix', () => {
      const hash = hashPii('test-value');
      const suffix = hash?.replace('sha256:', '');
      assert.strictEqual(suffix?.length, 16, 'Suffix should be 16 chars');
      assert.ok(/^[0-9a-f]+$/.test(suffix!), 'Should be hex');
    });

    it('isPiiHash should validate correctly', () => {
      assert.ok(isPiiHash('sha256:abcd1234abcd1234'));
      assert.ok(!isPiiHash('plain-text'));
      assert.ok(!isPiiHash(undefined));
      assert.ok(!isPiiHash(''));
    });
  });

  describe('bundle_summary', () => {
    it('should count events by type', () => {
      const events: RawSecurityEvent[] = [
        { type: 'AUTH_DENIED', timestamp: new Date().toISOString() },
        { type: 'AUTH_DENIED', timestamp: new Date().toISOString() },
        { type: 'AUTH_SUCCESS', timestamp: new Date().toISOString() },
        { type: 'JWKS_REFRESH_FAIL', timestamp: new Date().toISOString() },
      ];

      const bundle = generateIncidentBundle(events);

      assert.strictEqual(bundle.summary.totalEvents, 4);
      assert.strictEqual(bundle.summary.byType['AUTH_DENIED'], 2);
      assert.strictEqual(bundle.summary.byType['AUTH_SUCCESS'], 1);
      assert.strictEqual(bundle.summary.byType['JWKS_REFRESH_FAIL'], 1);
    });

    it('should calculate time range', () => {
      const events: RawSecurityEvent[] = [
        { type: 'AUTH_DENIED', timestamp: '2024-01-01T00:00:00.000Z' },
        { type: 'AUTH_DENIED', timestamp: '2024-01-01T12:00:00.000Z' },
        { type: 'AUTH_SUCCESS', timestamp: '2024-01-02T00:00:00.000Z' },
      ];

      const bundle = generateIncidentBundle(events);

      assert.strictEqual(bundle.timeRange.start, '2024-01-01T00:00:00.000Z');
      assert.strictEqual(bundle.timeRange.end, '2024-01-02T00:00:00.000Z');
    });
  });

  describe('allowlisted_dimensions_only', () => {
    it('should include provider from allowlist', () => {
      const event: RawSecurityEvent = {
        type: 'AUTH_DENIED',
        timestamp: new Date().toISOString(),
        provider: 'entra',
      };

      const cleaned = cleanSecurityEvent(event);
      assert.strictEqual(cleaned.provider, 'entra');
    });

    it('should include deny_code from allowlist', () => {
      const event: RawSecurityEvent = {
        type: 'AUTH_DENIED',
        timestamp: new Date().toISOString(),
        denyCode: 'DENY_NO_PRINCIPAL',
      };

      const cleaned = cleanSecurityEvent(event);
      assert.strictEqual(cleaned.denyCode, 'DENY_NO_PRINCIPAL');
    });

    it('should include stage from allowlist', () => {
      const event: RawSecurityEvent = {
        type: 'AUTH_DENIED',
        timestamp: new Date().toISOString(),
        stage: 'token_validation',
      };

      const cleaned = cleanSecurityEvent(event);
      assert.strictEqual(cleaned.stage, 'token_validation');
    });

    it('should not pass through context (may contain PII)', () => {
      const event: RawSecurityEvent = {
        type: 'AUTH_DENIED',
        timestamp: new Date().toISOString(),
        context: { sensitive: 'data', userId: '12345' },
      };

      const cleaned = cleanSecurityEvent(event);
      assert.ok(!('context' in cleaned), 'Should not have context');
    });
  });
});
