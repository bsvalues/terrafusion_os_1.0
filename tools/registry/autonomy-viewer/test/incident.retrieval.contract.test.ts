/**
 * Incident Retrieval Contract Tests
 * ===================================
 *
 * Phase IIIi: TDD contracts for incident bundle retrieval endpoint.
 *
 * These tests verify:
 * 1. Operator authz scope required
 * 2. Non-privileged caller rejection
 * 3. PII-clean response only
 * 4. Endpoint failure isolation from auth path
 * 5. Bounded and deterministic bundle size
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
    DEFAULT_MAX_EVENTS,
    isBundlePiiClean,
    type RawSecurityEvent
} from '../src/security/ops/incident/bundle.js';
import {
    createIncidentEndpoint,
    type OperatorContext,
    type RetrievalRequest
} from '../src/security/ops/incident/endpoint.js';

describe('Incident Retrieval Contract', () => {
  describe('requires_operator_authz_scope', () => {
    it('should require operator scope in context', async () => {
      const endpoint = createIncidentEndpoint();

      const request: RetrievalRequest = {
        timeRange: { start: '2024-01-01T00:00:00Z', end: '2024-01-02T00:00:00Z' },
      };

      const context: OperatorContext = {
        authenticated: true,
        scopes: [], // No operator scope
        userId: 'sha256:abc123',
      };

      const response = await endpoint.retrieve(request, context);

      assert.strictEqual(response.authorized, false);
      assert.ok(response.error?.includes('scope') || response.error?.includes('unauthorized'));
    });

    it('should accept request with operator scope', async () => {
      const endpoint = createIncidentEndpoint({
        eventSource: {
          getEvents: async () => [],
        },
      });

      const request: RetrievalRequest = {
        timeRange: { start: '2024-01-01T00:00:00Z', end: '2024-01-02T00:00:00Z' },
      };

      const context: OperatorContext = {
        authenticated: true,
        scopes: ['security:operator', 'read:incidents'],
        userId: 'sha256:abc123',
      };

      const response = await endpoint.retrieve(request, context);

      assert.strictEqual(response.authorized, true);
    });

    it('should require security:operator specifically', async () => {
      const endpoint = createIncidentEndpoint({
        requiredScope: 'security:operator',
      });

      const contextWithWrongScope: OperatorContext = {
        authenticated: true,
        scopes: ['admin', 'read:all'], // Not security:operator
        userId: 'sha256:abc123',
      };

      const response = await endpoint.retrieve({}, contextWithWrongScope);

      assert.strictEqual(response.authorized, false);
    });
  });

  describe('rejects_non_privileged_callers', () => {
    it('should reject unauthenticated requests', async () => {
      const endpoint = createIncidentEndpoint();

      const context: OperatorContext = {
        authenticated: false,
        scopes: [],
      };

      const response = await endpoint.retrieve({}, context);

      assert.strictEqual(response.authorized, false);
      assert.ok(
        response.error?.includes('authenticated') || response.error?.includes('unauthorized')
      );
    });

    it('should reject requests without required scope', async () => {
      const endpoint = createIncidentEndpoint({
        requiredScope: 'security:operator',
      });

      const context: OperatorContext = {
        authenticated: true,
        scopes: ['user:read'], // Wrong scope
        userId: 'sha256:abc123',
      };

      const response = await endpoint.retrieve({}, context);

      assert.strictEqual(response.authorized, false);
    });

    it('should log authorization failures', async () => {
      const auditLog: string[] = [];

      const endpoint = createIncidentEndpoint({
        audit: entry => auditLog.push(entry),
      });

      const context: OperatorContext = {
        authenticated: true,
        scopes: [], // Missing required scope
        userId: 'sha256:abc123',
      };

      await endpoint.retrieve({}, context);

      assert.ok(auditLog.length > 0);
      assert.ok(
        auditLog.some(
          e => e.toLowerCase().includes('denied') || e.toLowerCase().includes('unauthorized')
        )
      );
    });
  });

  describe('response_is_pii_clean_only', () => {
    it('should return PII-clean bundle', async () => {
      const rawEvents: RawSecurityEvent[] = [
        {
          type: 'AUTH_DENIED',
          timestamp: new Date().toISOString(),
          userId: 'raw-user-id',
          email: 'user@example.com',
          ipAddress: '192.168.1.1',
          provider: 'entra',
        },
      ];

      const endpoint = createIncidentEndpoint({
        eventSource: {
          getEvents: async () => rawEvents,
        },
      });

      const context: OperatorContext = {
        authenticated: true,
        scopes: ['security:operator'],
        userId: 'sha256:operator',
      };

      const response = await endpoint.retrieve({}, context);

      assert.ok(response.bundle, 'Should return bundle');
      assert.ok(isBundlePiiClean(response.bundle!), 'Bundle must be PII-clean');
    });

    it('should hash all identifiers with sha256: prefix', async () => {
      const rawEvents: RawSecurityEvent[] = [
        {
          type: 'AUTH_DENIED',
          timestamp: new Date().toISOString(),
          userId: 'user-123',
          sessionId: 'session-abc',
        },
      ];

      const endpoint = createIncidentEndpoint({
        eventSource: {
          getEvents: async () => rawEvents,
        },
      });

      const context: OperatorContext = {
        authenticated: true,
        scopes: ['security:operator'],
        userId: 'sha256:operator',
      };

      const response = await endpoint.retrieve({}, context);
      const event = response.bundle!.events[0];

      assert.ok(event.userIdHash?.startsWith('sha256:'), 'userIdHash must have sha256: prefix');
      assert.ok(
        event.sessionIdHash?.startsWith('sha256:'),
        'sessionIdHash must have sha256: prefix'
      );
      assert.ok(!('userId' in event), 'Raw userId must not be present');
      assert.ok(!('sessionId' in event), 'Raw sessionId must not be present');
    });

    it('should sanitize error messages', async () => {
      const rawEvents: RawSecurityEvent[] = [
        {
          type: 'AUTH_DENIED',
          timestamp: new Date().toISOString(),
          errorMessage: 'Failed for user@example.com from 192.168.1.1',
        },
      ];

      const endpoint = createIncidentEndpoint({
        eventSource: {
          getEvents: async () => rawEvents,
        },
      });

      const context: OperatorContext = {
        authenticated: true,
        scopes: ['security:operator'],
        userId: 'sha256:operator',
      };

      const response = await endpoint.retrieve({}, context);
      const event = response.bundle!.events[0];

      assert.ok(event.errorMessageSanitized, 'Should have sanitized error message');
      assert.ok(!event.errorMessageSanitized.includes('@'), 'Email should be redacted');
      assert.ok(!event.errorMessageSanitized.includes('192.168'), 'IP should be redacted');
    });
  });

  describe('endpoint_failure_does_not_affect_auth_path', () => {
    it('should not throw when event source fails', async () => {
      const endpoint = createIncidentEndpoint({
        eventSource: {
          getEvents: async () => {
            throw new Error('Event source unavailable');
          },
        },
      });

      const context: OperatorContext = {
        authenticated: true,
        scopes: ['security:operator'],
        userId: 'sha256:operator',
      };

      await assert.doesNotReject(async () => {
        await endpoint.retrieve({}, context);
      });
    });

    it('should return error response when event source fails', async () => {
      const endpoint = createIncidentEndpoint({
        eventSource: {
          getEvents: async () => {
            throw new Error('Database error');
          },
        },
      });

      const context: OperatorContext = {
        authenticated: true,
        scopes: ['security:operator'],
        userId: 'sha256:operator',
      };

      const response = await endpoint.retrieve({}, context);

      assert.strictEqual(response.success, false);
      assert.ok(response.error);
    });

    it('should isolate retrieval failures from auth decisions', async () => {
      const endpoint = createIncidentEndpoint({
        eventSource: {
          getEvents: async () => {
            throw new Error('Critical failure');
          },
        },
      });

      const context: OperatorContext = {
        authenticated: true,
        scopes: ['security:operator'],
        userId: 'sha256:operator',
      };

      // Simulate auth decision path that also retrieves bundles
      let authDecision = 'pending';
      try {
        await endpoint.retrieve({}, context);
        authDecision = 'allowed'; // Would proceed to auth decision
      } catch {
        authDecision = 'error'; // Should NOT happen
      }

      assert.strictEqual(authDecision, 'allowed', 'Auth path must not be affected');
    });
  });

  describe('bundle_size_is_bounded_and_deterministic', () => {
    it('should limit bundle to maxEvents', async () => {
      const rawEvents: RawSecurityEvent[] = [];
      for (let i = 0; i < 2000; i++) {
        rawEvents.push({
          type: 'AUTH_DENIED',
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
        });
      }

      const endpoint = createIncidentEndpoint({
        maxEvents: 100,
        eventSource: {
          getEvents: async () => rawEvents,
        },
      });

      const context: OperatorContext = {
        authenticated: true,
        scopes: ['security:operator'],
        userId: 'sha256:operator',
      };

      const response = await endpoint.retrieve({}, context);

      assert.ok(response.bundle!.events.length <= 100, 'Should be bounded to maxEvents');
      assert.strictEqual(response.bundle!.truncated, true);
    });

    it('should use default maxEvents if not specified', async () => {
      const endpoint = createIncidentEndpoint();
      assert.strictEqual(endpoint.getMaxEvents(), DEFAULT_MAX_EVENTS);
    });

    it('should produce deterministic bundle for same input', async () => {
      const events: RawSecurityEvent[] = [
        { type: 'AUTH_DENIED', timestamp: '2024-01-01T00:00:00Z', provider: 'entra' },
        { type: 'AUTH_SUCCESS', timestamp: '2024-01-01T00:01:00Z', provider: 'entra' },
      ];

      const endpoint = createIncidentEndpoint({
        eventSource: {
          getEvents: async () => events,
        },
      });

      const context: OperatorContext = {
        authenticated: true,
        scopes: ['security:operator'],
        userId: 'sha256:operator',
      };

      const response1 = await endpoint.retrieve({}, context);
      const response2 = await endpoint.retrieve({}, context);

      // Bundle structure should be same (ignoring generatedAt timestamp)
      assert.strictEqual(response1.bundle!.events.length, response2.bundle!.events.length);
      assert.strictEqual(
        response1.bundle!.summary.totalEvents,
        response2.bundle!.summary.totalEvents
      );
    });

    it('should enforce rate limiting', async () => {
      const endpoint = createIncidentEndpoint({
        rateLimit: { maxRequests: 2, windowSeconds: 60 },
        eventSource: {
          getEvents: async () => [],
        },
      });

      const context: OperatorContext = {
        authenticated: true,
        scopes: ['security:operator'],
        userId: 'sha256:operator',
      };

      await endpoint.retrieve({}, context);
      await endpoint.retrieve({}, context);
      const response = await endpoint.retrieve({}, context);

      assert.strictEqual(response.rateLimited, true);
    });
  });

  describe('audit_logging', () => {
    it('should log successful retrievals', async () => {
      const auditLog: string[] = [];

      const endpoint = createIncidentEndpoint({
        audit: entry => auditLog.push(entry),
        eventSource: {
          getEvents: async () => [],
        },
      });

      const context: OperatorContext = {
        authenticated: true,
        scopes: ['security:operator'],
        userId: 'sha256:operator',
      };

      await endpoint.retrieve({}, context);

      assert.ok(auditLog.length > 0);
      assert.ok(auditLog.some(e => e.includes('retrieved') || e.includes('success')));
    });

    it('should include hashed operator ID in audit', async () => {
      const auditLog: string[] = [];

      const endpoint = createIncidentEndpoint({
        audit: entry => auditLog.push(entry),
        eventSource: {
          getEvents: async () => [],
        },
      });

      const context: OperatorContext = {
        authenticated: true,
        scopes: ['security:operator'],
        userId: 'sha256:abc123def456',
      };

      await endpoint.retrieve({}, context);

      assert.ok(auditLog.some(e => e.includes('sha256:abc123')));
    });
  });
});
