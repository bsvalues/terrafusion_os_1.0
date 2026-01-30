/**
 * TerraFusion OS - Trace Isolation Proof Test
 * Phase 7.1: Multi-user safety
 *
 * PROVES:
 *   1. User A invokes tool → gets correlationId
 *   2. User B queries that correlationId → 403
 *   3. Admin in same county can view User A's trace
 *   4. Admin in different county → 403 (cross-county isolation)
 *
 * Run: node --test os-platform/core/tests/trace-isolation.test.mjs
 */

import assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';

// ============================================================================
// Dynamic imports for ESM compatibility
// ============================================================================

let evaluateTraceAccess;
let filterVisibleTraceEvents;
let canViewCorrelation;
let hasElevatedTraceRole;
let resetAccessDeniedMetrics;
let getAccessDeniedMetrics;
let recordAccessDenied;

before(async () => {
  const traceModule = await import('../trace/index.js');

  evaluateTraceAccess = traceModule.evaluateTraceAccess;
  filterVisibleTraceEvents = traceModule.filterVisibleTraceEvents;
  canViewCorrelation = traceModule.canViewCorrelation;
  hasElevatedTraceRole = traceModule.hasElevatedTraceRole;
  resetAccessDeniedMetrics = traceModule.resetAccessDeniedMetrics;
  getAccessDeniedMetrics = traceModule.getAccessDeniedMetrics;
  recordAccessDenied = traceModule.recordAccessDenied;
});

// ============================================================================
// Test Fixtures
// ============================================================================

const USER_A = {
  userId: 'user-a-123',
  roles: ['appraiser'],
  countyId: 'benton',
};

const USER_B = {
  userId: 'user-b-456',
  roles: ['appraiser'],
  countyId: 'benton',
};

const ADMIN_SAME_COUNTY = {
  userId: 'admin-benton',
  roles: ['admin'],
  countyId: 'benton',
};

const COMPLIANCE_OFFICER = {
  userId: 'compliance-001',
  roles: ['compliance_officer'],
  countyId: 'benton',
};

const ADMIN_OTHER_COUNTY = {
  userId: 'admin-yakima',
  roles: ['admin'],
  countyId: 'yakima',
};

function createTraceEvent(userId, countyId, correlationId = 'corr-123') {
  return {
    eventId: `evt-${Math.random().toString(36).slice(2)}`,
    type: 'tool_invoked',
    toolId: 'test_tool',
    correlationId,
    summary: 'Test invocation',
    timestamp: new Date().toISOString(),
    schemaVersion: '1.0.0',
    context: {
      userId,
      countyId,
      roles: ['appraiser'],
      mode: 'pilot',
    },
  };
}

// ============================================================================
// Unit Tests: evaluateTraceAccess
// ============================================================================

describe('evaluateTraceAccess', () => {
  it('allows user to view their own trace', () => {
    const event = createTraceEvent(USER_A.userId, USER_A.countyId);
    const decision = evaluateTraceAccess(USER_A, event);

    assert.strictEqual(decision.allowed, true);
    assert.match(decision.reason, /actor\.userId match/);
  });

  it('denies user viewing another user trace in same county', () => {
    const event = createTraceEvent(USER_A.userId, USER_A.countyId);
    const decision = evaluateTraceAccess(USER_B, event);

    assert.strictEqual(decision.allowed, false);
    assert.match(decision.reason, /cannot view traces owned by/);
  });

  it('allows admin to view any user trace in same county', () => {
    const event = createTraceEvent(USER_A.userId, USER_A.countyId);
    const decision = evaluateTraceAccess(ADMIN_SAME_COUNTY, event);

    assert.strictEqual(decision.allowed, true);
    assert.strictEqual(decision.elevatedAccess, true);
  });

  it('allows compliance_officer to view any user trace in same county', () => {
    const event = createTraceEvent(USER_A.userId, USER_A.countyId);
    const decision = evaluateTraceAccess(COMPLIANCE_OFFICER, event);

    assert.strictEqual(decision.allowed, true);
    assert.strictEqual(decision.elevatedAccess, true);
  });

  it('denies admin cross-county access', () => {
    const event = createTraceEvent(USER_A.userId, USER_A.countyId);
    const decision = evaluateTraceAccess(ADMIN_OTHER_COUNTY, event);

    assert.strictEqual(decision.allowed, false);
    assert.match(decision.reason, /Cross-county/);
  });

  it('denies regular user cross-county access', () => {
    const event = createTraceEvent(USER_A.userId, 'yakima');
    const decision = evaluateTraceAccess(USER_A, event);

    assert.strictEqual(decision.allowed, false);
    assert.match(decision.reason, /Cross-county/);
  });
});

// ============================================================================
// Unit Tests: hasElevatedTraceRole
// ============================================================================

describe('hasElevatedTraceRole', () => {
  it('returns true for admin', () => {
    assert.strictEqual(
      hasElevatedTraceRole({ userId: 'x', roles: ['admin'], countyId: 'y' }),
      true
    );
  });

  it('returns true for compliance_officer', () => {
    assert.strictEqual(
      hasElevatedTraceRole({ userId: 'x', roles: ['compliance_officer'], countyId: 'y' }),
      true
    );
  });

  it('returns true for supervisor', () => {
    assert.strictEqual(
      hasElevatedTraceRole({ userId: 'x', roles: ['supervisor'], countyId: 'y' }),
      true
    );
  });

  it('returns true for auditor', () => {
    assert.strictEqual(
      hasElevatedTraceRole({ userId: 'x', roles: ['auditor'], countyId: 'y' }),
      true
    );
  });

  it('returns false for appraiser', () => {
    assert.strictEqual(
      hasElevatedTraceRole({ userId: 'x', roles: ['appraiser'], countyId: 'y' }),
      false
    );
  });

  it('returns false for viewer', () => {
    assert.strictEqual(
      hasElevatedTraceRole({ userId: 'x', roles: ['viewer'], countyId: 'y' }),
      false
    );
  });

  it('returns true if any role is elevated', () => {
    assert.strictEqual(
      hasElevatedTraceRole({ userId: 'x', roles: ['viewer', 'admin'], countyId: 'y' }),
      true
    );
  });
});

// ============================================================================
// Unit Tests: filterVisibleTraceEvents
// ============================================================================

describe('filterVisibleTraceEvents', () => {
  it('filters out events user cannot view', () => {
    const events = [
      createTraceEvent(USER_A.userId, 'benton', 'corr-1'),
      createTraceEvent(USER_B.userId, 'benton', 'corr-2'),
      createTraceEvent(USER_A.userId, 'benton', 'corr-3'),
    ];

    const visible = filterVisibleTraceEvents(USER_A, events);

    assert.strictEqual(visible.length, 2);
    assert.ok(visible.every(e => e.context.userId === USER_A.userId));
  });

  it('admin sees all events in same county', () => {
    const events = [
      createTraceEvent(USER_A.userId, 'benton', 'corr-1'),
      createTraceEvent(USER_B.userId, 'benton', 'corr-2'),
    ];

    const visible = filterVisibleTraceEvents(ADMIN_SAME_COUNTY, events);

    assert.strictEqual(visible.length, 2);
  });

  it('admin from other county sees zero events', () => {
    const events = [
      createTraceEvent(USER_A.userId, 'benton', 'corr-1'),
      createTraceEvent(USER_B.userId, 'benton', 'corr-2'),
    ];

    const visible = filterVisibleTraceEvents(ADMIN_OTHER_COUNTY, events);

    assert.strictEqual(visible.length, 0);
  });
});

// ============================================================================
// Unit Tests: canViewCorrelation
// ============================================================================

describe('canViewCorrelation', () => {
  it('returns true for empty events (nothing to hide)', () => {
    assert.strictEqual(canViewCorrelation(USER_A, []), true);
  });

  it('returns true if user owns at least one event', () => {
    const events = [createTraceEvent(USER_A.userId, 'benton')];
    assert.strictEqual(canViewCorrelation(USER_A, events), true);
  });

  it('returns false if user has no access to any event', () => {
    const events = [createTraceEvent(USER_B.userId, 'benton')];
    assert.strictEqual(canViewCorrelation(USER_A, events), false);
  });

  it('returns false for cross-county even if user owns event conceptually', () => {
    const events = [createTraceEvent(USER_A.userId, 'yakima')];
    assert.strictEqual(canViewCorrelation(USER_A, events), false);
  });
});

// ============================================================================
// Unit Tests: Metrics
// ============================================================================

describe('access denied metrics', () => {
  beforeEach(() => {
    resetAccessDeniedMetrics();
  });

  it('counts cross-county denials', () => {
    recordAccessDenied('cross_county');
    recordAccessDenied('cross_county');

    const metrics = getAccessDeniedMetrics();
    assert.strictEqual(metrics.total, 2);
    assert.strictEqual(metrics.crossCounty, 2);
    assert.strictEqual(metrics.userMismatch, 0);
  });

  it('counts user mismatch denials', () => {
    recordAccessDenied('user_mismatch');

    const metrics = getAccessDeniedMetrics();
    assert.strictEqual(metrics.total, 1);
    assert.strictEqual(metrics.crossCounty, 0);
    assert.strictEqual(metrics.userMismatch, 1);
  });

  it('resets metrics', () => {
    recordAccessDenied('cross_county');
    recordAccessDenied('user_mismatch');
    resetAccessDeniedMetrics();

    const metrics = getAccessDeniedMetrics();
    assert.strictEqual(metrics.total, 0);
  });
});

// ============================================================================
// Integration Scenario: The 403 Proof
// ============================================================================

describe('403 Isolation Proof', () => {
  it('User B cannot view User A trace → MUST return 403 equivalent', () => {
    // Setup: User A invokes a tool → creates trace event
    const userAEvent = createTraceEvent(USER_A.userId, 'benton', 'corr-user-a');

    // User B tries to query it
    const canView = canViewCorrelation(USER_B, [userAEvent]);

    // PROOF: User B cannot view → endpoint should return 403
    assert.strictEqual(canView, false, 'User B MUST NOT view User A trace');
  });

  it('Admin in same county CAN view User A trace', () => {
    const userAEvent = createTraceEvent(USER_A.userId, 'benton', 'corr-user-a');
    const canView = canViewCorrelation(ADMIN_SAME_COUNTY, [userAEvent]);

    assert.strictEqual(canView, true, 'Admin in same county SHOULD view any trace');
  });

  it('Admin in different county CANNOT view User A trace → 403', () => {
    const userAEvent = createTraceEvent(USER_A.userId, 'benton', 'corr-user-a');
    const canView = canViewCorrelation(ADMIN_OTHER_COUNTY, [userAEvent]);

    assert.strictEqual(canView, false, 'Cross-county admin MUST NOT view trace');
  });
});

console.log('✓ Trace isolation proof tests loaded. Running...');
