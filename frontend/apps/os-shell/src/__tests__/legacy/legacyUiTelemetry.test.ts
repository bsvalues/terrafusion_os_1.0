/**
 * legacyUiTelemetry.test.ts
 *
 * Phase 6.3: Tests for legacy UI telemetry emitter.
 *
 * Success Criteria:
 * - Emits legacy.ui_hit event with correct structure
 * - Rate-limits emissions (one per legacyAppId per session per N minutes)
 * - Aggregates counts (firstSeen, lastSeen, count)
 * - No PII fields present
 * - Uses session-scoped storage for aggregation
 */

import { vi } from 'vitest';
import {
    emitLegacyUiHit,
    getLegacyUiMetrics,
    LegacyUiHitPayload,
    resetLegacyUiMetrics,
} from '../../telemetry/legacyUiTelemetry';

// Mock sessionStorage
const mockSessionStorage: Record<string, string> = {};
beforeEach(() => {
  Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  jest
    .spyOn(Storage.prototype, 'getItem')
    .mockImplementation((key: string) => mockSessionStorage[key] ?? null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
    mockSessionStorage[key] = value;
  });

  // Reset telemetry state between tests
  resetLegacyUiMetrics();

  // Mock Date.now for time-based rate limiting
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-02-05T12:00:00Z'));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('legacyUiTelemetry', () => {
  describe('emitLegacyUiHit', () => {
    it('emits event with required fields', () => {
      const result = emitLegacyUiHit({
        legacyAppId: 'suites.appraisal',
        route: '/suites/appraisal',
      });

      expect(result).toEqual(
        expect.objectContaining({
          eventType: 'legacy.ui_hit',
          legacyAppId: 'suites.appraisal',
          route: '/suites/appraisal',
          timestamp: expect.any(String),
        })
      );
    });

    it('includes environment and appVersion', () => {
      const result = emitLegacyUiHit({
        legacyAppId: 'test.app',
        route: '/test',
      });

      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('appVersion');
    });

    it('generates opaque sessionId (non-PII)', () => {
      const result = emitLegacyUiHit({
        legacyAppId: 'test.app',
        route: '/test',
      });

      expect(result.sessionId).toBeDefined();
      expect(result.sessionId).toMatch(/^session-[a-z0-9]+$/);
      // Should not contain PII like email, IP, etc.
      expect(result.sessionId).not.toMatch(/@|\.com|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
    });

    it('includes optional referrerRoute when provided', () => {
      const result = emitLegacyUiHit({
        legacyAppId: 'test.app',
        route: '/test',
        referrerRoute: '/workbench/parcel/123',
      });

      expect(result.referrerRoute).toBe('/workbench/parcel/123');
    });
  });

  describe('Rate Limiting', () => {
    it('returns event on first emission', () => {
      const result = emitLegacyUiHit({
        legacyAppId: 'rate.test',
        route: '/rate-test',
      });

      expect(result).not.toBeNull();
      expect(result?.emitted).toBe(true);
    });

    it('rate-limits subsequent emissions within time window', () => {
      // First emission
      const first = emitLegacyUiHit({
        legacyAppId: 'rate.test',
        route: '/rate-test',
      });
      expect(first?.emitted).toBe(true);

      // Second emission within window (should be rate-limited)
      const second = emitLegacyUiHit({
        legacyAppId: 'rate.test',
        route: '/rate-test',
      });
      expect(second?.emitted).toBe(false);
      expect(second?.rateLimited).toBe(true);
    });

    it('allows emission after rate limit window expires', () => {
      // First emission
      emitLegacyUiHit({
        legacyAppId: 'rate.test',
        route: '/rate-test',
      });

      // Advance time beyond rate limit window (5 minutes)
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000);

      // Should emit again
      const result = emitLegacyUiHit({
        legacyAppId: 'rate.test',
        route: '/rate-test',
      });
      expect(result?.emitted).toBe(true);
    });

    it('rate-limits per legacyAppId independently', () => {
      // First app
      const app1First = emitLegacyUiHit({
        legacyAppId: 'app1',
        route: '/app1',
      });
      expect(app1First?.emitted).toBe(true);

      // Second app (different legacyAppId - should not be rate-limited)
      const app2First = emitLegacyUiHit({
        legacyAppId: 'app2',
        route: '/app2',
      });
      expect(app2First?.emitted).toBe(true);

      // First app again (same legacyAppId - should be rate-limited)
      const app1Second = emitLegacyUiHit({
        legacyAppId: 'app1',
        route: '/app1',
      });
      expect(app1Second?.emitted).toBe(false);
    });
  });

  describe('Aggregation', () => {
    it('tracks firstSeen timestamp', () => {
      emitLegacyUiHit({
        legacyAppId: 'agg.test',
        route: '/agg',
      });

      const metrics = getLegacyUiMetrics('agg.test');
      expect(metrics?.firstSeen).toBe('2026-02-05T12:00:00.000Z');
    });

    it('updates lastSeen on subsequent hits', () => {
      emitLegacyUiHit({
        legacyAppId: 'agg.test',
        route: '/agg',
      });

      // Advance time
      vi.advanceTimersByTime(60 * 1000);

      emitLegacyUiHit({
        legacyAppId: 'agg.test',
        route: '/agg',
      });

      const metrics = getLegacyUiMetrics('agg.test');
      expect(metrics?.lastSeen).toBe('2026-02-05T12:01:00.000Z');
    });

    it('increments count on each hit', () => {
      emitLegacyUiHit({ legacyAppId: 'count.test', route: '/count' });
      emitLegacyUiHit({ legacyAppId: 'count.test', route: '/count' });
      emitLegacyUiHit({ legacyAppId: 'count.test', route: '/count' });

      const metrics = getLegacyUiMetrics('count.test');
      expect(metrics?.count).toBe(3);
    });

    it('aggregates across routes for same legacyAppId', () => {
      emitLegacyUiHit({ legacyAppId: 'multi.route', route: '/path/a' });
      emitLegacyUiHit({ legacyAppId: 'multi.route', route: '/path/b' });

      const metrics = getLegacyUiMetrics('multi.route');
      expect(metrics?.count).toBe(2);
      expect(metrics?.routes).toContain('/path/a');
      expect(metrics?.routes).toContain('/path/b');
    });
  });

  describe('PII Compliance', () => {
    it('does not include user identifiers', () => {
      const result = emitLegacyUiHit({
        legacyAppId: 'pii.test',
        route: '/pii',
      });

      // Verify no PII fields
      expect(result).not.toHaveProperty('userId');
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('username');
      expect(result).not.toHaveProperty('ip');
      expect(result).not.toHaveProperty('userAgent');
    });

    it('sessionId is opaque and not traceable', () => {
      const result1 = emitLegacyUiHit({ legacyAppId: 'pii.1', route: '/1' });
      const result2 = emitLegacyUiHit({ legacyAppId: 'pii.2', route: '/2' });

      // Same session, same sessionId
      expect(result1?.sessionId).toBe(result2?.sessionId);

      // Session ID format is opaque
      expect(result1?.sessionId).toMatch(/^session-[a-z0-9]{8}$/);
    });
  });

  describe('Payload Structure', () => {
    it('matches LegacyUiHitPayload interface', () => {
      const result = emitLegacyUiHit({
        legacyAppId: 'structure.test',
        route: '/structure',
      });

      // Type check: all required fields present
      const payload: LegacyUiHitPayload = result!;
      expect(payload.eventType).toBe('legacy.ui_hit');
      expect(typeof payload.legacyAppId).toBe('string');
      expect(typeof payload.route).toBe('string');
      expect(typeof payload.environment).toBe('string');
      expect(typeof payload.appVersion).toBe('string');
      expect(typeof payload.sessionId).toBe('string');
      expect(typeof payload.timestamp).toBe('string');
    });
  });

  describe('Storage Persistence', () => {
    it('persists metrics to sessionStorage', () => {
      emitLegacyUiHit({ legacyAppId: 'persist.test', route: '/persist' });

      expect(sessionStorage.setItem).toHaveBeenCalledWith('legacy_ui_metrics', expect.any(String));
    });

    it('restores metrics from sessionStorage on init', () => {
      // Pre-populate storage
      mockSessionStorage['legacy_ui_metrics'] = JSON.stringify({
        'restore.test': {
          firstSeen: '2026-02-05T10:00:00.000Z',
          lastSeen: '2026-02-05T11:00:00.000Z',
          count: 5,
          routes: ['/restore'],
        },
      });

      // Reset to load from storage
      resetLegacyUiMetrics();

      const metrics = getLegacyUiMetrics('restore.test');
      expect(metrics?.count).toBe(5);
    });
  });
});
