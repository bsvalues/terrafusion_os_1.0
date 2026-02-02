import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { BreakGlassResult, RoleBindingResult, TPIResult } from '../src/evidence-index.js';
import { evaluateRbac, loadRbacPolicies } from '../src/security/rbac/rbac.js';

function createTpi(ok: boolean, approverCount: number, minApprovals = 2): TPIResult {
  return {
    ok,
    minApprovals,
    approverLogins: Array.from({ length: approverCount }, (_value, i) => `approver-${i + 1}`),
    policyVersion: 'test',
    evaluatedAt: '2026-02-01T00:00:00.000Z',
  };
}

function createBreakGlass(overrides?: Partial<BreakGlassResult>): BreakGlassResult {
  return {
    activated: true,
    reason: 'test',
    action: 'republish_evidence',
    approvers: ['approver-1', 'approver-2', 'approver-3'],
    approvalsRequired: 3,
    policySha: 'sha256:test',
    policyVersion: '1.1.0',
    evaluatedAt: '2026-02-01T00:00:00.000Z',
    checks: {
      pinned: true,
      rekor: true,
      verifyBundleStrict: true,
      rollbackVerified: true,
      noAutomerge: true,
    },
    ...overrides,
  };
}

function createRoleBinding(
  ok: boolean,
  requiredRoles: string[],
  satisfiedRoles: string[]
): RoleBindingResult {
  return {
    ok,
    requiredRoles,
    satisfiedRoles,
    missingRoles: requiredRoles.filter(role => !satisfiedRoles.includes(role)),
    approverRoles: { security: [], cio: [], engineering: [] },
    approvalCountEligible: 2,
    excludedApprovers: [],
    approverSource: 'test',
    evaluatedAt: '2026-02-01T00:00:00.000Z',
  };
}

describe('Phase IIIa – RBAC Policy Alignment', () => {
  it('denies unknown action', () => {
    const policyResult = loadRbacPolicies();
    assert.ok(policyResult.ok && policyResult.policySet);

    const decision = evaluateRbac(
      {
        actionId: 'autonomy.unknown.action' as unknown as 'autonomy.bootstrap.write',
        tier: 'ci',
        now: new Date('2026-02-01T00:00:00.000Z'),
      },
      policyResult.policySet
    );

    assert.strictEqual(decision.allowed, false);
    assert.ok(decision.reasonCodes.includes('RBAC_UNKNOWN_ACTION'));
  });

  it('denies when tier is missing', () => {
    const policyResult = loadRbacPolicies();
    assert.ok(policyResult.ok && policyResult.policySet);

    const decision = evaluateRbac(
      {
        actionId: 'autonomy.bootstrap.write',
        now: new Date('2026-02-01T00:00:00.000Z'),
      },
      policyResult.policySet
    );

    assert.strictEqual(decision.allowed, false);
    assert.ok(decision.reasonCodes.includes('RBAC_AMBIGUOUS_CONTEXT'));
  });

  it('denies when TPI approvals are insufficient for merged tier', () => {
    const policyResult = loadRbacPolicies();
    assert.ok(policyResult.ok && policyResult.policySet);

    const decision = evaluateRbac(
      {
        actionId: 'autonomy.county_kit.write',
        tier: 'merged',
        tpi: createTpi(false, 0),
        now: new Date('2026-02-01T00:00:00.000Z'),
      },
      policyResult.policySet
    );

    assert.strictEqual(decision.allowed, false);
    assert.ok(decision.reasonCodes.includes('RBAC_TPI_INSUFFICIENT_APPROVALS'));
  });

  it('allows when TPI approvals meet policy minimum', () => {
    const policyResult = loadRbacPolicies();
    assert.ok(policyResult.ok && policyResult.policySet);

    const decision = evaluateRbac(
      {
        actionId: 'autonomy.county_kit.write',
        tier: 'merged',
        tpi: createTpi(true, 2, policyResult.policySet.tpi.enforcement.minApprovals),
        now: new Date('2026-02-01T00:00:00.000Z'),
      },
      policyResult.policySet
    );

    assert.strictEqual(decision.allowed, true);
  });

  it('denies when break-glass checks fail', () => {
    const policyResult = loadRbacPolicies();
    assert.ok(policyResult.ok && policyResult.policySet);

    const decision = evaluateRbac(
      {
        actionId: 'autonomy.mirror.publish.write',
        tier: 'incident',
        tpi: createTpi(true, 3),
        breakGlass: createBreakGlass({
          checks: {
            pinned: false,
            rekor: true,
            verifyBundleStrict: true,
            rollbackVerified: true,
            noAutomerge: true,
          },
        }),
        now: new Date('2026-02-01T00:00:00.000Z'),
      },
      policyResult.policySet
    );

    assert.strictEqual(decision.allowed, false);
    assert.ok(decision.reasonCodes.includes('RBAC_BREAK_GLASS_REQUIRED'));
  });

  it('denies when role binding is required but missing', () => {
    const policyResult = loadRbacPolicies();
    assert.ok(policyResult.ok && policyResult.policySet);

    const requiredRoles =
      policyResult.policySet.breakGlass.roleBinding?.requiredApproverRoles ?? [];

    const decision = evaluateRbac(
      {
        actionId: 'autonomy.mirror.publish.write',
        tier: 'incident',
        tpi: createTpi(true, 3),
        breakGlass: createBreakGlass(),
        roleBinding: createRoleBinding(false, requiredRoles, []),
        now: new Date('2026-02-01T00:00:00.000Z'),
      },
      policyResult.policySet
    );

    assert.strictEqual(decision.allowed, false);
    assert.ok(decision.reasonCodes.includes('RBAC_ROLE_BINDING_REQUIRED'));
  });
});
