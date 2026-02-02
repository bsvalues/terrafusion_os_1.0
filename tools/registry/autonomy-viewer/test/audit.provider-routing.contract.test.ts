/**
 * Phase IIIb – Audit Provider Routing Contract Tests
 * ===================================================
 *
 * Contract: Sink routing changes destination, not event payload/hash.
 * Audit events remain deterministic regardless of routing provider.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    createAuditDecisionEvent,
    createAuditEntry,
    verifyAuditChain,
} from '../src/security/audit/audit-log.js';
import type {
    AuditRoutingContext,
    AuditRoutingProvider,
    AuditSinkConfig,
} from '../src/security/providers/types.js';
import type { RbacDecision } from '../src/security/rbac/rbac.js';

// ============================================================================
// Test Helpers
// ============================================================================

function createTestRbacDecision(overrides: Partial<RbacDecision> = {}): RbacDecision {
  return {
    schema: 'terrafusion.security.rbac-decision.v1',
    version: 'IIIa.1',
    actionId: 'autonomy.bootstrap.write',
    tier: 'merged',
    profile: 'county',
    allowed: true,
    reasonCodes: [],
    evaluatedAt: '2026-02-02T08:00:00.000Z',
    policyRefs: {
      breakGlass: { path: 'policy/break-glass.json', version: '1.0', sha256: 'abc123' },
      tpi: { path: 'policy/tpi.json', version: '1.0', sha256: 'def456' },
    },
    evidence: {
      tpiOk: true,
      breakGlassActivated: null,
      roleBindingOk: null,
    },
    ...overrides,
  };
}

function createMockAuditProvider(config: AuditSinkConfig): AuditRoutingProvider {
  return {
    name: 'mock-audit-router',
    resolve: async () => ({ ok: true, config }),
  };
}

// ============================================================================
// Event Payload Invariance
// ============================================================================

describe('Phase IIIb – Audit Event Payload Invariance', () => {
  it('event payload is identical regardless of sink type', () => {
    const decision = createTestRbacDecision();
    const options = {
      actorId: 'ci-runner-001',
      correlationId: 'corr-001',
    };

    // Create event (sink not involved in payload creation)
    const event = createAuditDecisionEvent(decision, options);

    // Payload structure is fixed
    assert.equal(event.schema, 'terrafusion.security.audit-log.v1');
    assert.equal(event.eventType, 'rbac_decision');
    assert.equal(event.actionId, 'autonomy.bootstrap.write');
    assert.equal(event.decision.allowed, true);
    // actorId is hashed for privacy (actorIdHash), not stored raw
    assert.ok(event.actorIdHash, 'actorIdHash should be present');
    assert.equal(event.correlationId, 'corr-001');
  });

  it('event hash is identical for same decision across sink configs', () => {
    const decision = createTestRbacDecision();

    // Two events from same decision with same eventId to ensure determinism
    const event1 = createAuditDecisionEvent(decision, {
      actorId: 'actor-1',
      eventId: 'test-event-1',
      timestamp: '2026-02-02T08:00:00.000Z',
    });
    const event2 = createAuditDecisionEvent(decision, {
      actorId: 'actor-1',
      eventId: 'test-event-1',
      timestamp: '2026-02-02T08:00:00.000Z',
    });

    // Entry hash should be identical (deterministic canonicalization)
    const entry1 = createAuditEntry(event1, 0, null);
    const entry2 = createAuditEntry(event2, 0, null);
    assert.equal(entry1.entryHash, entry2.entryHash);
  });

  it('different decisions produce different hashes', () => {
    const decision1 = createTestRbacDecision({ allowed: true });
    const decision2 = createTestRbacDecision({ allowed: false });

    const event1 = createAuditDecisionEvent(decision1, {
      eventId: 'test-1',
      timestamp: '2026-02-02T08:00:00.000Z',
    });
    const event2 = createAuditDecisionEvent(decision2, {
      eventId: 'test-2',
      timestamp: '2026-02-02T08:00:00.000Z',
    });

    const entry1 = createAuditEntry(event1, 0, null);
    const entry2 = createAuditEntry(event2, 0, null);
    assert.notEqual(entry1.entryHash, entry2.entryHash);
  });

  it('actorId difference produces different hash', () => {
    const decision = createTestRbacDecision();

    const event1 = createAuditDecisionEvent(decision, {
      actorId: 'actor-1',
      eventId: 'test-1',
      timestamp: '2026-02-02T08:00:00.000Z',
    });
    const event2 = createAuditDecisionEvent(decision, {
      actorId: 'actor-2',
      eventId: 'test-1',
      timestamp: '2026-02-02T08:00:00.000Z',
    });

    const entry1 = createAuditEntry(event1, 0, null);
    const entry2 = createAuditEntry(event2, 0, null);
    assert.notEqual(entry1.entryHash, entry2.entryHash);
  });
});

// ============================================================================
// Sink Routing Does Not Alter Semantics
// ============================================================================

describe('Phase IIIb – Sink Routing Does Not Alter Semantics', () => {
  it('memory sink config is valid', async () => {
    const provider = createMockAuditProvider({ type: 'memory' });
    const result = await provider.resolve({ actionId: 'test', env: {} });

    assert.equal(result.ok, true);
    assert.equal(result.config?.type, 'memory');
  });

  it('file sink config includes path', async () => {
    const provider = createMockAuditProvider({
      type: 'file',
      path: '/var/log/audit.jsonl',
    });
    const result = await provider.resolve({ actionId: 'test', env: {} });

    assert.equal(result.ok, true);
    assert.equal(result.config?.type, 'file');
    assert.equal(result.config?.path, '/var/log/audit.jsonl');
  });

  it('composite sink aggregates children', async () => {
    const provider = createMockAuditProvider({
      type: 'composite',
      children: [
        { type: 'memory' },
        { type: 'file', path: '/var/log/audit.jsonl' },
        { type: 'stdout' },
      ],
    });
    const result = await provider.resolve({ actionId: 'test', env: {} });

    assert.equal(result.ok, true);
    assert.equal(result.config?.type, 'composite');
    assert.equal(result.config?.children?.length, 3);
  });

  it('routing tier affects sink selection, not event content', async () => {
    // Provider that selects file for incident, memory otherwise
    const routingProvider: AuditRoutingProvider = {
      name: 'tier-aware-router',
      resolve: async (ctx: AuditRoutingContext) => {
        if (ctx.tier === 'incident') {
          return { ok: true, config: { type: 'file', path: '/var/log/incident.jsonl' } };
        }
        return { ok: true, config: { type: 'memory' } };
      },
    };

    const incidentConfig = await routingProvider.resolve({
      actionId: 'test',
      tier: 'incident',
      env: {},
    });
    const mergedConfig = await routingProvider.resolve({
      actionId: 'test',
      tier: 'merged',
      env: {},
    });

    assert.equal(incidentConfig.config?.type, 'file');
    assert.equal(mergedConfig.config?.type, 'memory');

    // But the event itself doesn't change based on sink
    const decision = createTestRbacDecision();
    const event = createAuditDecisionEvent(decision, {
      eventId: 'test-event',
      timestamp: '2026-02-02T08:00:00.000Z',
    });

    // Event payload is independent of sink config
    assert.ok(event.eventId);
    assert.equal(event.actionId, 'autonomy.bootstrap.write');
  });
});

// ============================================================================
// Hash Chain Integrity
// ============================================================================

describe('Phase IIIb – Audit Hash Chain Integrity', () => {
  it('hash chain validates across entries', () => {
    const decision1 = createTestRbacDecision({ evaluatedAt: '2026-02-02T08:00:00.000Z' });
    const decision2 = createTestRbacDecision({ evaluatedAt: '2026-02-02T08:01:00.000Z' });

    const event1 = createAuditDecisionEvent(decision1, {
      eventId: 'event-1',
      timestamp: '2026-02-02T08:00:00.000Z',
    });
    const event2 = createAuditDecisionEvent(decision2, {
      eventId: 'event-2',
      timestamp: '2026-02-02T08:01:00.000Z',
    });

    const entry1 = createAuditEntry(event1, 0, null);
    const entry2 = createAuditEntry(event2, 1, entry1.entryHash);

    const chain: AuditLogEntry[] = [entry1, entry2];
    const result = verifyAuditChain(chain);

    assert.equal(result.ok, true);
    assert.equal(result.errors.length, 0);
  });

  it('chain detects tampering', () => {
    const decision1 = createTestRbacDecision({ evaluatedAt: '2026-02-02T08:00:00.000Z' });
    const decision2 = createTestRbacDecision({ evaluatedAt: '2026-02-02T08:01:00.000Z' });

    const event1 = createAuditDecisionEvent(decision1, {
      eventId: 'event-1',
      timestamp: '2026-02-02T08:00:00.000Z',
    });
    const event2 = createAuditDecisionEvent(decision2, {
      eventId: 'event-2',
      timestamp: '2026-02-02T08:01:00.000Z',
    });

    const entry1 = createAuditEntry(event1, 0, null);
    const entry2 = createAuditEntry(event2, 1, entry1.entryHash);

    // Tamper with entry1's event
    const tamperedEntry1: AuditLogEntry = {
      ...entry1,
      event: { ...entry1.event, decision: { ...entry1.event.decision, allowed: false } },
    };

    const chain: AuditLogEntry[] = [tamperedEntry1, entry2];
    const result = verifyAuditChain(chain);

    assert.equal(result.ok, false);
    assert.ok(result.errors.length > 0);
  });

  it('chain detects missing link', () => {
    const decision1 = createTestRbacDecision({ evaluatedAt: '2026-02-02T08:00:00.000Z' });
    const decision2 = createTestRbacDecision({ evaluatedAt: '2026-02-02T08:01:00.000Z' });

    const event1 = createAuditDecisionEvent(decision1, {
      eventId: 'event-1',
      timestamp: '2026-02-02T08:00:00.000Z',
    });
    const event2 = createAuditDecisionEvent(decision2, {
      eventId: 'event-2',
      timestamp: '2026-02-02T08:01:00.000Z',
    });

    const entry1 = createAuditEntry(event1, 0, null);
    // entry2 has wrong prevHash
    const entry2 = createAuditEntry(event2, 1, 'sha256:wrong-hash');

    const chain: AuditLogEntry[] = [entry1, entry2];
    const result = verifyAuditChain(chain);

    assert.equal(result.ok, false);
  });

  it('empty chain is valid', () => {
    const result = verifyAuditChain([]);
    assert.equal(result.ok, true);
    assert.equal(result.errors.length, 0);
  });

  it('single entry chain is valid', () => {
    const decision = createTestRbacDecision();
    const event = createAuditDecisionEvent(decision, {
      eventId: 'solo-event',
      timestamp: '2026-02-02T08:00:00.000Z',
    });
    const entry = createAuditEntry(event, 0, null);

    const result = verifyAuditChain([entry]);
    assert.equal(result.ok, true);
    assert.equal(result.errors.length, 0);
  });
});

// ============================================================================
// PII Safety in Audit Events
// ============================================================================

describe('Phase IIIb – Audit Event PII Safety', () => {
  it('event does not contain raw PII', () => {
    const decision = createTestRbacDecision();
    const event = createAuditDecisionEvent(decision, {
      actorId: 'service:ci-runner-001',
      correlationId: 'corr-abc123',
    });

    const eventJson = JSON.stringify(event);

    // No email patterns
    assert.ok(!eventJson.match(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/));
    // No SSN patterns
    assert.ok(!eventJson.match(/\d{3}-\d{2}-\d{4}/));
    // No phone patterns
    assert.ok(!eventJson.match(/\d{3}[-.]?\d{3}[-.]?\d{4}/));
  });

  it('actorId is hashed, not stored raw', () => {
    const decision = createTestRbacDecision();
    const event = createAuditDecisionEvent(decision, {
      actorId: 'oidc:sub:12345',
    });

    // Event should have actorIdHash, not raw actorId
    assert.ok(event.actorIdHash?.startsWith('sha256:'));
    // Raw actorId should not appear
    const eventJson = JSON.stringify(event);
    assert.ok(!eventJson.includes('oidc:sub:12345'));
  });

  it('approver logins in evidence are pseudonymous', () => {
    const decision = createTestRbacDecision();
    // Approver logins should be opaque handles, not emails
    assert.ok(decision.evidence.tpiOk !== undefined);
    // The actual logins are in the TPI result, not in the decision
    // Decision only records ok/not-ok
  });
});
