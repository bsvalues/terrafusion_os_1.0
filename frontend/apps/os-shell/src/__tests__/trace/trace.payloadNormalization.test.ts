/**
 * TerraFusion Trace Payload Normalization Tests
 *
 * Ensures payload normalization:
 * - Removes volatile fields (timestamps)
 * - Normalizes hashes (parcelIdHash)
 * - Preserves semantic fields for deterministic comparison
 *
 * @module __tests__/trace/trace.payloadNormalization.test
 * @see Slice 18: Deterministic Replay + Golden Trace Regression
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  normalizeTraceEvent,
  normalizeTraces,
  compareTraces,
  assertTracesMatch,
  type NormalizedTraceEvent,
} from '../../testUtils/traceHarness';
import type { OsActionTraceEvent, OsActionBlockedEvent } from '../../services/osActions';

// ============================================================================
// Invoked Event Normalization
// ============================================================================

describe('Trace Payload Normalization', () => {
  describe('normalizeTraceEvent - invoked events', () => {
    it('replaces timestamp with NORMALIZED marker', () => {
      const event: OsActionTraceEvent = {
        type: 'os_action_invoked',
        timestamp: 1707350400000, // Actual timestamp
        payload: {
          actionId: 'test-action',
          actionType: 'navigation',
          intent: 'standalone',
          surface: 'launcher',
          suiteId: 'pilot',
          href: '/pilot/dashboard',
        },
      };

      const normalized = normalizeTraceEvent(event);

      expect(normalized.timestamp).toBe('NORMALIZED');
    });

    it('preserves all semantic fields', () => {
      const event: OsActionTraceEvent = {
        type: 'os_action_invoked',
        timestamp: Date.now(),
        payload: {
          actionId: 'nav-action',
          actionType: 'navigation',
          intent: 'workbench',
          surface: 'standalone_home',
          suiteId: 'trace',
          href: '/trace/console',
        },
      };

      const normalized = normalizeTraceEvent(event);

      expect(normalized.type).toBe('os_action_invoked');
      expect(normalized.payload).toMatchObject({
        actionId: 'nav-action',
        actionType: 'navigation',
        intent: 'workbench',
        surface: 'standalone_home',
        suiteId: 'trace',
        href: '/trace/console',
      });
    });

    it('normalizes parcelIdHash to NORMALIZED marker', () => {
      const event: OsActionTraceEvent = {
        type: 'os_action_invoked',
        timestamp: Date.now(),
        payload: {
          actionId: 'parcel-action',
          actionType: 'navigation',
          intent: 'standalone',
          surface: 'module',
          suiteId: 'pilot',
          parcelIdHash: 'a1b2c3d4e5f6', // Volatile hash
          href: '/pilot/parcel',
        },
      };

      const normalized = normalizeTraceEvent(event);

      expect(normalized.payload).toHaveProperty('parcelIdHash', 'NORMALIZED');
    });

    it('omits parcelIdHash when not present', () => {
      const event: OsActionTraceEvent = {
        type: 'os_action_invoked',
        timestamp: Date.now(),
        payload: {
          actionId: 'no-parcel',
          actionType: 'navigation',
          intent: 'standalone',
          surface: 'launcher',
          suiteId: 'pilot',
          href: '/pilot',
        },
      };

      const normalized = normalizeTraceEvent(event);

      expect(normalized.payload).not.toHaveProperty('parcelIdHash');
    });

    it('includes moduleId when present', () => {
      const event: OsActionTraceEvent = {
        type: 'os_action_invoked',
        timestamp: Date.now(),
        payload: {
          actionId: 'module-action',
          actionType: 'handler',
          intent: 'workbench',
          surface: 'module',
          suiteId: 'pilot',
          moduleId: 'costforge',
          handlerKey: 'costforge:analyze',
        },
      };

      const normalized = normalizeTraceEvent(event);

      expect(normalized.payload).toHaveProperty('moduleId', 'costforge');
      expect(normalized.payload).toHaveProperty('handlerKey', 'costforge:analyze');
    });
  });

  describe('normalizeTraceEvent - blocked events', () => {
    it('replaces timestamp with NORMALIZED marker', () => {
      const event: OsActionBlockedEvent = {
        type: 'os_action_blocked',
        timestamp: 1707350400000,
        payload: {
          actionId: 'blocked-action',
          actionType: 'navigation',
          intent: 'standalone',
          surface: 'launcher',
          suiteId: 'pilot',
          blockReason: 'disabled',
        },
      };

      const normalized = normalizeTraceEvent(event);

      expect(normalized.timestamp).toBe('NORMALIZED');
    });

    it('preserves blockReason and disabledReason', () => {
      const event: OsActionBlockedEvent = {
        type: 'os_action_blocked',
        timestamp: Date.now(),
        payload: {
          actionId: 'disabled-action',
          actionType: 'navigation',
          intent: 'standalone',
          surface: 'standalone_home',
          suiteId: 'pilot',
          blockReason: 'disabled',
          disabledReason: 'Feature not available',
        },
      };

      const normalized = normalizeTraceEvent(event);

      expect(normalized.type).toBe('os_action_blocked');
      expect(normalized.payload).toMatchObject({
        actionId: 'disabled-action',
        blockReason: 'disabled',
        disabledReason: 'Feature not available',
      });
    });

    it('preserves policyReason for policy blocks', () => {
      const event: OsActionBlockedEvent = {
        type: 'os_action_blocked',
        timestamp: Date.now(),
        payload: {
          actionId: 'policy-blocked',
          actionType: 'handler',
          intent: 'system',
          surface: 'workbench',
          suiteId: 'trace',
          blockReason: 'policy',
          policyReason: 'Insufficient permissions',
        },
      };

      const normalized = normalizeTraceEvent(event);

      expect(normalized.payload).toMatchObject({
        blockReason: 'policy',
        policyReason: 'Insufficient permissions',
      });
    });
  });

  describe('normalizeTraces - batch normalization', () => {
    it('normalizes array of mixed events', () => {
      const events = [
        {
          type: 'os_action_invoked' as const,
          timestamp: 1000,
          payload: {
            actionId: 'first',
            actionType: 'navigation' as const,
            intent: 'standalone' as const,
            surface: 'launcher' as const,
            suiteId: 'pilot',
            href: '/first',
          },
        },
        {
          type: 'os_action_blocked' as const,
          timestamp: 2000,
          payload: {
            actionId: 'second',
            actionType: 'navigation' as const,
            intent: 'standalone' as const,
            surface: 'launcher' as const,
            suiteId: 'pilot',
            blockReason: 'disabled' as const,
          },
        },
      ];

      const normalized = normalizeTraces(events);

      expect(normalized).toHaveLength(2);
      expect(normalized[0].type).toBe('os_action_invoked');
      expect(normalized[0].timestamp).toBe('NORMALIZED');
      expect(normalized[1].type).toBe('os_action_blocked');
      expect(normalized[1].timestamp).toBe('NORMALIZED');
    });

    it('returns empty array for empty input', () => {
      const normalized = normalizeTraces([]);
      expect(normalized).toEqual([]);
    });
  });
});

// ============================================================================
// Trace Comparison
// ============================================================================

describe('Trace Comparison', () => {
  describe('compareTraces', () => {
    it('returns match: true for identical sequences', () => {
      const actual: NormalizedTraceEvent[] = [
        {
          type: 'os_action_invoked',
          timestamp: 'NORMALIZED',
          payload: { actionId: 'a', actionType: 'navigation', intent: 'standalone', surface: 'launcher', suiteId: 'pilot', href: '/a' },
        },
      ];
      const expected = [...actual];

      const result = compareTraces(actual, expected);

      expect(result.match).toBe(true);
    });

    it('detects length mismatch', () => {
      const actual: NormalizedTraceEvent[] = [
        {
          type: 'os_action_invoked',
          timestamp: 'NORMALIZED',
          payload: { actionId: 'a', actionType: 'navigation', intent: 'standalone', surface: 'launcher', suiteId: 'pilot', href: '/a' },
        },
      ];
      const expected: NormalizedTraceEvent[] = [];

      const result = compareTraces(actual, expected);

      expect(result.match).toBe(false);
      if (!result.match) {
        expect(result.error).toContain('Length mismatch');
      }
    });

    it('detects payload differences', () => {
      const actual: NormalizedTraceEvent[] = [
        {
          type: 'os_action_invoked',
          timestamp: 'NORMALIZED',
          payload: { actionId: 'a', actionType: 'navigation', intent: 'standalone', surface: 'launcher', suiteId: 'pilot', href: '/a' },
        },
      ];
      const expected: NormalizedTraceEvent[] = [
        {
          type: 'os_action_invoked',
          timestamp: 'NORMALIZED',
          payload: { actionId: 'b', actionType: 'navigation', intent: 'standalone', surface: 'launcher', suiteId: 'pilot', href: '/b' },
        },
      ];

      const result = compareTraces(actual, expected);

      expect(result.match).toBe(false);
      if (!result.match) {
        expect(result.index).toBe(0);
      }
    });

    it('detects type differences', () => {
      const actual: NormalizedTraceEvent[] = [
        {
          type: 'os_action_invoked',
          timestamp: 'NORMALIZED',
          payload: { actionId: 'a', actionType: 'navigation', intent: 'standalone', surface: 'launcher', suiteId: 'pilot', href: '/a' },
        },
      ];
      const expected: NormalizedTraceEvent[] = [
        {
          type: 'os_action_blocked',
          timestamp: 'NORMALIZED',
          payload: { actionId: 'a', actionType: 'navigation', intent: 'standalone', surface: 'launcher', suiteId: 'pilot', blockReason: 'disabled' },
        },
      ];

      const result = compareTraces(actual, expected);

      expect(result.match).toBe(false);
    });
  });

  describe('assertTracesMatch', () => {
    it('does not throw for matching traces', () => {
      const actual = [
        {
          type: 'os_action_invoked' as const,
          timestamp: 12345,
          payload: {
            actionId: 'test',
            actionType: 'navigation' as const,
            intent: 'standalone' as const,
            surface: 'launcher' as const,
            suiteId: 'pilot',
            href: '/test',
          },
        },
      ];
      const expected: NormalizedTraceEvent[] = [
        {
          type: 'os_action_invoked',
          timestamp: 'NORMALIZED',
          payload: { actionId: 'test', actionType: 'navigation', intent: 'standalone', surface: 'launcher', suiteId: 'pilot', href: '/test' },
        },
      ];

      expect(() => assertTracesMatch(actual, expected)).not.toThrow();
    });

    it('throws for mismatched traces', () => {
      const actual = [
        {
          type: 'os_action_invoked' as const,
          timestamp: 12345,
          payload: {
            actionId: 'actual',
            actionType: 'navigation' as const,
            intent: 'standalone' as const,
            surface: 'launcher' as const,
            suiteId: 'pilot',
            href: '/actual',
          },
        },
      ];
      const expected: NormalizedTraceEvent[] = [
        {
          type: 'os_action_invoked',
          timestamp: 'NORMALIZED',
          payload: { actionId: 'expected', actionType: 'navigation', intent: 'standalone', surface: 'launcher', suiteId: 'pilot', href: '/expected' },
        },
      ];

      expect(() => assertTracesMatch(actual, expected)).toThrow(/mismatch/i);
    });
  });
});
