/**
 * TerraFusion OS – Lane E: Trace Authorization + Audit Tests
 *
 * Tests for:
 *   1. trace_accessed / permission_denied event types are valid TraceEventTypes
 *   2. Access control correctly filters cross-county & cross-user events
 *   3. Audit trail: trace_accessed events are emittable via TraceService
 *   4. Audit trail: permission_denied events are emittable via TraceService
 *   5. Access denied metrics increment on cross-county and user-mismatch
 *   6. ToolId filtering is bounded by parcelId (no cross-parcel inference)
 *
 * Run: node --test os-platform/core/tests/lane-e-trace-authz.test.mjs
 */

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { before, beforeEach, describe, it } from 'node:test';

// ============================================================================
// Dynamic imports
// ============================================================================

let TraceService, InMemoryTraceStore;
let evaluateTraceAccess, filterVisibleTraceEvents, hasElevatedTraceRole;
let recordAccessDenied, getAccessDeniedMetrics, resetAccessDeniedMetrics;

before(async () => {
  const trace = await import('../trace/index.js');
  TraceService = trace.TraceService;
  InMemoryTraceStore = trace.InMemoryTraceStore;
  evaluateTraceAccess = trace.evaluateTraceAccess;
  filterVisibleTraceEvents = trace.filterVisibleTraceEvents;
  hasElevatedTraceRole = trace.hasElevatedTraceRole;
  recordAccessDenied = trace.recordAccessDenied;
  getAccessDeniedMetrics = trace.getAccessDeniedMetrics;
  resetAccessDeniedMetrics = trace.resetAccessDeniedMetrics;
});

// ── Fixtures ─────────────────────────────────────────────────────────

const USER_ALICE = { userId: 'alice', roles: ['appraiser'], countyId: 'benton' };
const USER_BOB = { userId: 'bob', roles: ['appraiser'], countyId: 'benton' };
const ADMIN_BENTON = { userId: 'admin-b', roles: ['admin'], countyId: 'benton' };
const ADMIN_YAKIMA = { userId: 'admin-y', roles: ['admin'], countyId: 'yakima' };
const VIEWER = { userId: 'viewer', roles: ['viewer'], countyId: 'benton' };

function makeEvent(overrides = {}) {
  return {
    eventId: randomUUID(),
    type: overrides.type ?? 'tool_invoked',
    toolId: overrides.toolId ?? 'test_tool',
    correlationId: overrides.correlationId ?? `corr-${randomUUID().slice(0, 8)}`,
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    schemaVersion: '1.0.0',
    summary: overrides.summary ?? 'test event',
    context: {
      countyId: overrides.countyId ?? 'benton',
      userId: overrides.userId ?? 'alice',
      sessionId: 'sess-001',
      mode: 'pilot',
      parcelId: overrides.parcelId ?? undefined,
      ...(overrides.context || {}),
    },
  };
}

// ══════════════════════════════════════════════════════════════════════
// New event types: trace_accessed + permission_denied
// ══════════════════════════════════════════════════════════════════════

describe('Audit event types', () => {
  it('trace_accessed is emittable via TraceService', () => {
    const store = new InMemoryTraceStore();
    const svc = new TraceService({ store });

    svc.emit({
      type: 'trace_accessed',
      toolId: 'pilot:traces:list',
      correlationId: `trace-list-${randomUUID().slice(0, 8)}`,
      summary: 'Trace list accessed: parcelId=P-100',
      context: {
        countyId: 'benton',
        userId: 'alice',
        sessionId: '',
        mode: 'pilot',
        parcelId: 'P-100',
      },
    });

    const events = svc.query({ type: 'trace_accessed' });
    assert.equal(events.length, 1);
    assert.equal(events[0].toolId, 'pilot:traces:list');
  });

  it('permission_denied is emittable via TraceService', () => {
    const store = new InMemoryTraceStore();
    const svc = new TraceService({ store });

    svc.emit({
      type: 'permission_denied',
      toolId: 'pilot:traces:list',
      correlationId: `trace-list-${randomUUID().slice(0, 8)}`,
      summary: 'Trace list: 3 event(s) filtered by access control',
      context: {
        countyId: 'benton',
        userId: 'bob',
        sessionId: '',
        mode: 'pilot',
        parcelId: 'P-100',
      },
    });

    const events = svc.query({ type: 'permission_denied' });
    assert.equal(events.length, 1);
    assert.ok(events[0].summary.includes('filtered'));
  });

  it('trace_accessed for stats endpoint', () => {
    const store = new InMemoryTraceStore();
    const svc = new TraceService({ store });

    svc.emit({
      type: 'trace_accessed',
      toolId: 'pilot:traces:stats',
      correlationId: `trace-stats-${randomUUID().slice(0, 8)}`,
      summary: 'Trace stats accessed by admin-b',
      context: {
        countyId: 'benton',
        userId: 'admin-b',
        sessionId: '',
        mode: 'pilot',
      },
    });

    const events = svc.query({ type: 'trace_accessed' });
    assert.equal(events.length, 1);
    assert.equal(events[0].toolId, 'pilot:traces:stats');
  });
});

// ══════════════════════════════════════════════════════════════════════
// Cross-county isolation for trace list
// ══════════════════════════════════════════════════════════════════════

describe('Cross-county trace list isolation', () => {
  it('cross-county events are filtered out', () => {
    const bentonEvent = makeEvent({ countyId: 'benton', userId: 'alice' });
    const yakimaEvent = makeEvent({ countyId: 'yakima', userId: 'alice' });

    const visible = filterVisibleTraceEvents(USER_ALICE, [bentonEvent, yakimaEvent]);
    assert.equal(visible.length, 1);
    assert.equal(visible[0].context.countyId, 'benton');
  });

  it('admin cannot see cross-county events', () => {
    const yakimaEvent = makeEvent({ countyId: 'yakima', userId: 'alice' });
    const decision = evaluateTraceAccess(ADMIN_BENTON, yakimaEvent);
    assert.equal(decision.allowed, false);
    assert.ok(decision.reason.includes('Cross-county'));
  });
});

// ══════════════════════════════════════════════════════════════════════
// Cross-user isolation for trace list
// ══════════════════════════════════════════════════════════════════════

describe('Cross-user trace list isolation', () => {
  it('non-elevated user cannot see other users events', () => {
    const aliceEvent = makeEvent({ countyId: 'benton', userId: 'alice' });
    const decision = evaluateTraceAccess(USER_BOB, aliceEvent);
    assert.equal(decision.allowed, false);
    assert.ok(decision.reason.includes('cannot view traces'));
  });

  it('elevated admin CAN see other users events in same county', () => {
    const aliceEvent = makeEvent({ countyId: 'benton', userId: 'alice' });
    const decision = evaluateTraceAccess(ADMIN_BENTON, aliceEvent);
    assert.equal(decision.allowed, true);
    assert.equal(decision.elevatedAccess, true);
  });

  it('viewer role has no elevated access', () => {
    assert.equal(hasElevatedTraceRole(VIEWER), false);
  });
});

// ══════════════════════════════════════════════════════════════════════
// ToolId filtering bounded by parcel (no cross-parcel inference)
// ══════════════════════════════════════════════════════════════════════

describe('ToolId filtering is parcel-bounded', () => {
  it('querying with toolId + parcelId returns only matching parcel events', async () => {
    const store = new InMemoryTraceStore();
    await store.append(makeEvent({ parcelId: 'P-100', toolId: 'run_valuation_model' }));
    await store.append(makeEvent({ parcelId: 'P-200', toolId: 'run_valuation_model' }));
    await store.append(makeEvent({ parcelId: 'P-100', toolId: 'explain_value_change' }));

    // Query scoped to P-100 + run_valuation_model
    const results = await store.query({ parcelId: 'P-100', toolId: 'run_valuation_model' });
    assert.equal(results.length, 1);
    assert.equal(results[0].context.parcelId, 'P-100');
    assert.equal(results[0].toolId, 'run_valuation_model');
  });

  it('toolId filter on wrong parcel returns empty (no existence leak)', async () => {
    const store = new InMemoryTraceStore();
    await store.append(makeEvent({ parcelId: 'P-200', toolId: 'secret_tool' }));

    // Query scoped to P-100 — should NOT reveal that secret_tool exists on P-200
    const results = await store.query({ parcelId: 'P-100', toolId: 'secret_tool' });
    assert.equal(results.length, 0);
  });
});

// ══════════════════════════════════════════════════════════════════════
// Access denied metrics
// ══════════════════════════════════════════════════════════════════════

describe('Access denied metrics', () => {
  beforeEach(() => {
    resetAccessDeniedMetrics();
  });

  it('records cross_county denials', () => {
    recordAccessDenied('cross_county');
    recordAccessDenied('cross_county');
    const m = getAccessDeniedMetrics();
    assert.equal(m.total, 2);
    assert.equal(m.crossCounty, 2);
    assert.equal(m.userMismatch, 0);
  });

  it('records user_mismatch denials', () => {
    recordAccessDenied('user_mismatch');
    const m = getAccessDeniedMetrics();
    assert.equal(m.total, 1);
    assert.equal(m.userMismatch, 1);
  });

  it('tracks mixed denial types', () => {
    recordAccessDenied('cross_county');
    recordAccessDenied('user_mismatch');
    recordAccessDenied('user_mismatch');
    const m = getAccessDeniedMetrics();
    assert.equal(m.total, 3);
    assert.equal(m.crossCounty, 1);
    assert.equal(m.userMismatch, 2);
  });
});

// ══════════════════════════════════════════════════════════════════════
// Stats endpoint: elevated role gate
// ══════════════════════════════════════════════════════════════════════

describe('Trace stats: elevated role gate', () => {
  it('admin has elevated access', () => {
    assert.equal(hasElevatedTraceRole(ADMIN_BENTON), true);
  });

  it('viewer does NOT have elevated access', () => {
    assert.equal(hasElevatedTraceRole(VIEWER), false);
  });

  it('appraiser does NOT have elevated access', () => {
    assert.equal(hasElevatedTraceRole(USER_ALICE), false);
  });

  it('compliance_officer has elevated access', () => {
    const co = { userId: 'co-1', roles: ['compliance_officer'], countyId: 'benton' };
    assert.equal(hasElevatedTraceRole(co), true);
  });
});
