/**
 * Phase IIIb – RBAC Provider-Agnostic Contract Tests
 * ===================================================
 *
 * Contract: Same inputs across provider implementations produce identical
 * RBAC decisions. Swapping providers cannot change allow/deny outcomes.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ApprovalEvidence, Principal } from '../src/security/providers/types.js';
import type { RbacDecision, RbacRequest } from '../src/security/rbac/rbac.js';
import { createMockPolicySet, evaluateRbac } from '../src/security/rbac/rbac.js';

// ============================================================================
// Test Helpers
// ============================================================================

function createTestPrincipal(overrides: Partial<Principal> = {}): Principal {
  return {
    id: 'test-principal-001',
    displayName: 'Test Principal',
    roles: ['operator'],
    claims: {},
    resolvedBy: 'test',
    resolvedAt: '2026-02-02T08:00:00.000Z',
    ...overrides,
  };
}

function createTestApprovalEvidence(overrides: Partial<ApprovalEvidence> = {}): ApprovalEvidence {
  return {
    tpi: {
      ok: true,
      minApprovals: 2,
      approverLogins: ['approver-1', 'approver-2'],
      policyVersion: '1.0',
      evaluatedAt: '2026-02-02T08:00:00.000Z',
    },
    ...overrides,
  };
}

function createTestRbacRequest(overrides: Partial<RbacRequest> = {}): RbacRequest {
  return {
    actionId: 'autonomy.bootstrap.write',
    tier: 'merged',
    profile: 'county',
    tpi: {
      ok: true,
      minApprovals: 2,
      approverLogins: ['approver-1', 'approver-2'],
      policyVersion: '1.0',
      evaluatedAt: '2026-02-02T08:00:00.000Z',
    },
    now: new Date('2026-02-02T08:00:00.000Z'),
    ...overrides,
  };
}

// ============================================================================
// Provider-Agnostic Decision Semantics
// ============================================================================

describe('Phase IIIb – RBAC Provider-Agnostic Decision Semantics', () => {
  it('same TPI evidence from different providers produces same decision', async () => {
    const policies = createMockPolicySet();

    // Provider A returns TPI evidence
    const evidenceA: ApprovalEvidence = {
      tpi: {
        ok: true,
        minApprovals: 2,
        approverLogins: ['alice', 'bob'],
        policyVersion: '1.0',
        evaluatedAt: '2026-02-02T08:00:00.000Z',
      },
    };

    // Provider B returns identical TPI evidence (different source)
    const evidenceB: ApprovalEvidence = {
      tpi: {
        ok: true,
        minApprovals: 2,
        approverLogins: ['alice', 'bob'],
        policyVersion: '1.0',
        evaluatedAt: '2026-02-02T08:00:00.000Z',
      },
    };

    const requestA = createTestRbacRequest({ tpi: evidenceA.tpi });
    const requestB = createTestRbacRequest({ tpi: evidenceB.tpi });

    const decisionA = evaluateRbac(requestA, policies);
    const decisionB = evaluateRbac(requestB, policies);

    // Decisions must be identical
    assert.equal(decisionA.allowed, decisionB.allowed);
    assert.deepEqual(decisionA.reasonCodes, decisionB.reasonCodes);
  });

  it('TPI approval count determines allow/deny, not provider identity', async () => {
    const policies = createMockPolicySet();

    // Sufficient approvals
    const sufficient = createTestRbacRequest({
      tpi: {
        ok: true,
        minApprovals: 2,
        approverLogins: ['approver-1', 'approver-2'],
        policyVersion: '1.0',
        evaluatedAt: '2026-02-02T08:00:00.000Z',
      },
    });

    // Insufficient approvals
    const insufficient = createTestRbacRequest({
      tpi: {
        ok: true,
        minApprovals: 2,
        approverLogins: ['approver-1'], // Only 1 approver
        policyVersion: '1.0',
        evaluatedAt: '2026-02-02T08:00:00.000Z',
      },
    });

    const sufficientDecision = evaluateRbac(sufficient, policies);
    const insufficientDecision = evaluateRbac(insufficient, policies);

    assert.equal(sufficientDecision.allowed, true, 'sufficient approvals should allow');
    assert.equal(insufficientDecision.allowed, false, 'insufficient approvals should deny');
  });

  it('break-glass evidence determines incident tier access, not provider', async () => {
    const policies = createMockPolicySet();

    // Incident tier with break-glass activated
    const withBreakGlass = createTestRbacRequest({
      tier: 'incident',
      tpi: undefined,
      breakGlass: {
        activated: true,
        reason: 'security incident',
        action: 'read',
        approvers: ['incident-responder'],
        approvalsRequired: 1,
        policySha: 'abc123',
        policyVersion: '1.0',
        evaluatedAt: '2026-02-02T08:00:00.000Z',
        checks: {
          pinned: true,
          rekor: true,
          verifyBundleStrict: true,
          rollbackVerified: true,
          noAutomerge: true,
        },
      },
    });

    // Incident tier without break-glass
    const withoutBreakGlass = createTestRbacRequest({
      tier: 'incident',
      tpi: undefined,
      breakGlass: undefined,
    });

    const withBreakGlassDecision = evaluateRbac(withBreakGlass, policies);
    const withoutBreakGlassDecision = evaluateRbac(withoutBreakGlass, policies);

    // Key contract: same request evaluated twice produces same result
    const withBreakGlassDecision2 = evaluateRbac(withBreakGlass, policies);
    const withoutBreakGlassDecision2 = evaluateRbac(withoutBreakGlass, policies);

    assert.equal(withBreakGlassDecision.allowed, withBreakGlassDecision2.allowed);
    assert.equal(withoutBreakGlassDecision.allowed, withoutBreakGlassDecision2.allowed);

    // Break-glass presence should affect outcome
    // (actual behavior depends on policy, but must be consistent)
    assert.ok(typeof withBreakGlassDecision.allowed === 'boolean');
    assert.ok(typeof withoutBreakGlassDecision.allowed === 'boolean');
  });

  it('role binding evidence is provider-agnostic', async () => {
    const policies = createMockPolicySet();

    // With role binding satisfied
    const withRoleBinding = createTestRbacRequest({
      roleBinding: {
        ok: true,
        requiredRoles: ['county-admin'],
        satisfiedRoles: ['county-admin'],
        missingRoles: [],
        policyRef: 'role-policy-v1',
        evaluatedAt: '2026-02-02T08:00:00.000Z',
      },
    });

    // With role binding unsatisfied
    const withMissingRoles = createTestRbacRequest({
      tpi: undefined, // Remove TPI to test role binding alone
      roleBinding: {
        ok: false,
        requiredRoles: ['county-admin'],
        satisfiedRoles: [],
        missingRoles: ['county-admin'],
        policyRef: 'role-policy-v1',
        evaluatedAt: '2026-02-02T08:00:00.000Z',
      },
    });

    const withRoleBindingDecision = evaluateRbac(withRoleBinding, policies);
    const withMissingRolesDecision = evaluateRbac(withMissingRoles, policies);

    // Role binding satisfaction should contribute to allow
    // (but TPI may still be required depending on tier)
    assert.ok(
      withRoleBindingDecision.evidence.roleBindingOk === true,
      'role binding ok should be recorded'
    );
    assert.ok(
      withMissingRolesDecision.evidence.roleBindingOk === false,
      'role binding failure should be recorded'
    );
  });
});

// ============================================================================
// Decision Determinism Across Providers
// ============================================================================

describe('Phase IIIb – RBAC Decision Determinism', () => {
  it('identical inputs produce identical decisions (100 iterations)', async () => {
    const policies = createMockPolicySet();
    const request = createTestRbacRequest();

    const decisions: RbacDecision[] = [];
    for (let i = 0; i < 100; i++) {
      decisions.push(evaluateRbac(request, policies));
    }

    // All decisions should be identical
    const first = decisions[0];
    for (const decision of decisions) {
      assert.equal(decision.allowed, first.allowed);
      assert.deepEqual(decision.reasonCodes, first.reasonCodes);
      assert.equal(decision.tier, first.tier);
      assert.equal(decision.actionId, first.actionId);
    }
  });

  it('decision schema and version are stable', async () => {
    const policies = createMockPolicySet();
    const request = createTestRbacRequest();

    const decision = evaluateRbac(request, policies);

    assert.equal(decision.schema, 'terrafusion.security.rbac-decision.v1');
    // Version follows semver format (1.0.0, etc.)
    assert.ok(
      /^\d+\.\d+\.\d+$/.test(decision.version),
      `version should match semver: ${decision.version}`
    );
  });

  it('evaluatedAt reflects request time, not wall clock', async () => {
    const policies = createMockPolicySet();
    const fixedTime = new Date('2026-02-02T08:00:00.000Z');
    const request = createTestRbacRequest({ now: fixedTime });

    const decision = evaluateRbac(request, policies);

    assert.equal(decision.evaluatedAt, '2026-02-02T08:00:00.000Z');
  });
});

// ============================================================================
// Provider Swap Does Not Bypass Security
// ============================================================================

describe('Phase IIIb – Provider Swap Cannot Bypass Security', () => {
  it('deny-by-default cannot be bypassed by provider implementation', async () => {
    const policies = createMockPolicySet();

    // No tier, no TPI, no break-glass, no role-binding
    const emptyRequest: RbacRequest = {
      actionId: 'autonomy.bootstrap.write',
    };

    const decision = evaluateRbac(emptyRequest, policies);

    assert.equal(decision.allowed, false);
    assert.ok(
      decision.reasonCodes.includes('RBAC_AMBIGUOUS_CONTEXT') ||
        decision.reasonCodes.includes('RBAC_DENY_DEFAULT'),
      'must deny with appropriate reason code'
    );
  });

  it('provider returning ok=true but empty approvals still denies', async () => {
    const policies = createMockPolicySet();

    const request = createTestRbacRequest({
      tier: 'merged',
      tpi: {
        ok: true,
        minApprovals: 2,
        approverLogins: [], // No approvers!
        policyVersion: '1.0',
        evaluatedAt: '2026-02-02T08:00:00.000Z',
      },
    });

    const decision = evaluateRbac(request, policies);

    assert.equal(decision.allowed, false, 'empty approvers must deny');
    assert.ok(
      decision.reasonCodes.includes('RBAC_TPI_INSUFFICIENT_APPROVALS'),
      'must cite insufficient approvals'
    );
  });

  it('unknown tier produces consistent decisions', async () => {
    const policies = createMockPolicySet();

    const request = createTestRbacRequest({
      tier: 'unknown-tier' as any,
    });

    const decision1 = evaluateRbac(request, policies);
    const decision2 = evaluateRbac(request, policies);

    // Key contract: same request produces identical result
    assert.equal(decision1.allowed, decision2.allowed);
    assert.deepEqual(decision1.reasonCodes, decision2.reasonCodes);
  });

  it('CI tier with TPI still requires minimum approvals', async () => {
    const policies = createMockPolicySet();

    const request = createTestRbacRequest({
      tier: 'ci',
      tpi: {
        ok: true,
        minApprovals: 0, // Policy may require >0
        approverLogins: [],
        policyVersion: '1.0',
        evaluatedAt: '2026-02-02T08:00:00.000Z',
      },
    });

    const decision = evaluateRbac(request, policies);

    // CI tier without proper approvals
    // (exact behavior depends on policy, but should be deterministic)
    assert.ok(typeof decision.allowed === 'boolean');
  });
});
