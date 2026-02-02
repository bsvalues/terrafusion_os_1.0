import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    createAuditDecisionEvent,
    createAuditLogger,
    verifyAuditChain,
} from '../src/security/audit/audit-log.js';
import { createMemoryAuditSink } from '../src/security/audit/audit-sinks.js';
import type { RbacDecision } from '../src/security/rbac/rbac.js';

function createDecision(overrides?: Partial<RbacDecision>): RbacDecision {
  return {
    schema: 'terrafusion.security.rbac-decision.v1',
    version: '1.0.0',
    actionId: 'autonomy.bootstrap.write',
    tier: 'ci',
    profile: 'county',
    allowed: true,
    reasonCodes: [],
    evaluatedAt: '2026-02-01T00:00:00.000Z',
    policyRefs: {
      breakGlass: {
        path: 'policy/AUTONOMY_BREAK_GLASS_POLICY.json',
        version: '1.1.0',
        sha256: 'sha256:break',
      },
      tpi: { path: 'policy/AUTONOMY_TPI_POLICY.json', version: '1.0.0', sha256: 'sha256:tpi' },
    },
    evidence: {
      tpiOk: null,
      breakGlassActivated: null,
      roleBindingOk: null,
    },
    ...overrides,
  };
}

describe('Phase IIIa – Audit Log Contract', () => {
  it('appends hash-chained entries', () => {
    const sink = createMemoryAuditSink();
    const logger = createAuditLogger(sink);

    const decision = createDecision();
    logger.append(createAuditDecisionEvent(decision, { eventId: 'event-1' }));
    logger.append(createAuditDecisionEvent(decision, { eventId: 'event-2' }));

    assert.strictEqual(sink.entries.length, 2);
    assert.strictEqual(sink.entries[1].prevHash, sink.entries[0].entryHash);

    const verification = verifyAuditChain(sink.entries);
    assert.strictEqual(verification.ok, true);
  });

  it('detects tampering', () => {
    const sink = createMemoryAuditSink();
    const logger = createAuditLogger(sink);

    const decision = createDecision();
    logger.append(createAuditDecisionEvent(decision, { eventId: 'event-1' }));
    logger.append(createAuditDecisionEvent(decision, { eventId: 'event-2' }));

    const tampered = [...sink.entries];
    tampered[0] = {
      ...tampered[0],
      event: { ...tampered[0].event, actionId: 'autonomy.county_kit.write' },
    };

    const verification = verifyAuditChain(tampered);
    assert.strictEqual(verification.ok, false);
  });

  it('is deterministic for identical inputs', () => {
    const sinkA = createMemoryAuditSink();
    const sinkB = createMemoryAuditSink();
    const loggerA = createAuditLogger(sinkA);
    const loggerB = createAuditLogger(sinkB);

    const decision = createDecision();
    const eventA = createAuditDecisionEvent(decision, {
      eventId: 'event-1',
      timestamp: '2026-02-01T00:00:00.000Z',
    });
    const eventB = createAuditDecisionEvent(decision, {
      eventId: 'event-1',
      timestamp: '2026-02-01T00:00:00.000Z',
    });

    const entryA = loggerA.append(eventA).entry;
    const entryB = loggerB.append(eventB).entry;

    assert.strictEqual(entryA.entryHash, entryB.entryHash);
  });

  it('hashes actor identifiers before logging', () => {
    const sink = createMemoryAuditSink();
    const logger = createAuditLogger(sink);

    const decision = createDecision();
    const event = createAuditDecisionEvent(decision, {
      actorId: 'user@example.com',
      eventId: 'event-actor',
    });

    const entry = logger.append(event).entry;
    assert.ok(entry.event.actorIdHash?.startsWith('sha256:'));
    assert.ok(!entry.event.actorIdHash?.includes('@'));
  });
});
