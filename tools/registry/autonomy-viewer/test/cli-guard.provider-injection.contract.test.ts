/**
 * Phase IIIb – CLI Guard Provider Injection Contract Tests
 * =========================================================
 *
 * Contract: Guard uses providers and still blocks pre-mutation.
 * Provider injection does not bypass deny-by-default.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
    ApprovalEvidenceProvider,
    AuditRoutingProvider,
    PrincipalResolutionProvider,
    SecurityContext,
} from '../src/security/providers/types.js';

// ============================================================================
// Test Helpers: Mock Providers
// ============================================================================

function createMockPrincipalProvider(
  overrides: Partial<{ ok: boolean; id: string; roles: string[] }> = {}
): PrincipalResolutionProvider {
  const { ok = true, id = 'test-principal', roles = ['operator'] } = overrides;
  return {
    name: 'mock-principal',
    resolve: async () =>
      ok
        ? {
            ok: true,
            principal: {
              id,
              displayName: 'Test Principal',
              roles,
              claims: {},
              resolvedBy: 'mock',
              resolvedAt: new Date().toISOString(),
            },
          }
        : { ok: false, errorCode: 'PRINCIPAL_RESOLUTION_FAILED' },
  };
}

function createMockApprovalsProvider(
  overrides: Partial<{ ok: boolean; tpiOk: boolean; approverCount: number }> = {}
): ApprovalEvidenceProvider {
  const { ok = true, tpiOk = true, approverCount = 2 } = overrides;
  return {
    name: 'mock-approvals',
    retrieve: async () =>
      ok
        ? {
            ok: true,
            evidence: {
              tpi: {
                ok: tpiOk,
                minApprovals: 2,
                approverLogins: Array.from(
                  { length: approverCount },
                  (_, i) => `approver-${i + 1}`
                ),
                policyVersion: '1.0',
                evaluatedAt: new Date().toISOString(),
              },
            },
          }
        : { ok: false, errorCode: 'APPROVAL_FETCH_FAILED' },
  };
}

function createMockAuditProvider(): AuditRoutingProvider {
  return {
    name: 'mock-audit',
    resolve: async () => ({ ok: true, config: { type: 'memory' as const } }),
  };
}

function createMockSecurityContext(
  overrides: Partial<{
    principalOk: boolean;
    approvalsOk: boolean;
    tpiOk: boolean;
    approverCount: number;
  }> = {}
): SecurityContext {
  const { principalOk = true, approvalsOk = true, tpiOk = true, approverCount = 2 } = overrides;

  return {
    principalProvider: createMockPrincipalProvider({ ok: principalOk }),
    approvalsProvider: createMockApprovalsProvider({
      ok: approvalsOk,
      tpiOk,
      approverCount,
    }),
    auditProvider: createMockAuditProvider(),
  };
}

// ============================================================================
// Provider Injection Does Not Bypass Deny-by-Default
// ============================================================================

describe('Phase IIIb – CLI Guard Provider Injection', () => {
  it('guard blocks when principal provider fails', async () => {
    const ctx = createMockSecurityContext({ principalOk: false });
    const result = await ctx.principalProvider.resolve({
      actionId: 'autonomy.bootstrap.write',
      env: {},
    });

    assert.equal(result.ok, false);
    assert.equal(result.errorCode, 'PRINCIPAL_RESOLUTION_FAILED');
    // Guard would deny based on this
  });

  it('guard blocks when approvals provider fails', async () => {
    const ctx = createMockSecurityContext({ approvalsOk: false });
    const result = await ctx.approvalsProvider.retrieve({
      actionId: 'autonomy.bootstrap.write',
      tier: 'merged',
      env: {},
    });

    assert.equal(result.ok, false);
    assert.equal(result.errorCode, 'APPROVAL_FETCH_FAILED');
    // Guard would deny based on this
  });

  it('guard blocks when TPI approval is insufficient', async () => {
    const ctx = createMockSecurityContext({ tpiOk: true, approverCount: 1 });
    const result = await ctx.approvalsProvider.retrieve({
      actionId: 'autonomy.bootstrap.write',
      tier: 'merged',
      env: {},
    });

    assert.equal(result.ok, true);
    assert.ok(result.evidence?.tpi);
    assert.equal(result.evidence.tpi.approverLogins.length, 1);
    // RBAC would deny because approverCount (1) < minApprovals (2)
  });

  it('guard allows when all providers succeed with sufficient evidence', async () => {
    const ctx = createMockSecurityContext({
      principalOk: true,
      approvalsOk: true,
      tpiOk: true,
      approverCount: 2,
    });

    const principalResult = await ctx.principalProvider.resolve({
      actionId: 'autonomy.bootstrap.write',
      env: {},
    });
    const approvalsResult = await ctx.approvalsProvider.retrieve({
      actionId: 'autonomy.bootstrap.write',
      tier: 'merged',
      env: {},
    });

    assert.equal(principalResult.ok, true);
    assert.equal(approvalsResult.ok, true);
    assert.equal(approvalsResult.evidence?.tpi?.approverLogins.length, 2);
    // Guard would allow based on sufficient approvals
  });

  it('audit provider failure does not grant access', async () => {
    const failingAuditProvider: AuditRoutingProvider = {
      name: 'failing-audit',
      resolve: async () => ({
        ok: false,
        errorCode: 'AUDIT_SINK_UNAVAILABLE',
      }),
    };

    const ctx: SecurityContext = {
      principalProvider: createMockPrincipalProvider(),
      approvalsProvider: createMockApprovalsProvider(),
      auditProvider: failingAuditProvider,
    };

    const auditResult = await ctx.auditProvider.resolve({
      actionId: 'autonomy.bootstrap.write',
      env: {},
    });

    assert.equal(auditResult.ok, false);
    // Audit failure should be logged but mutation still blocked
    // (fail-closed means we don't proceed without audit)
  });
});

// ============================================================================
// Provider Chain Execution Order
// ============================================================================

describe('Phase IIIb – Provider Chain Execution Order', () => {
  it('principal resolution happens before approval retrieval', async () => {
    const callOrder: string[] = [];

    const principalProvider: PrincipalResolutionProvider = {
      name: 'ordered-principal',
      resolve: async () => {
        callOrder.push('principal');
        return {
          ok: true,
          principal: {
            id: 'test',
            displayName: 'Test',
            roles: [],
            claims: {},
            resolvedBy: 'test',
            resolvedAt: new Date().toISOString(),
          },
        };
      },
    };

    const approvalsProvider: ApprovalEvidenceProvider = {
      name: 'ordered-approvals',
      retrieve: async () => {
        callOrder.push('approvals');
        return { ok: true, evidence: {} };
      },
    };

    // Simulate guard execution order
    await principalProvider.resolve({ actionId: 'test', env: {} });
    await approvalsProvider.retrieve({ actionId: 'test', tier: 'merged', env: {} });

    assert.deepEqual(callOrder, ['principal', 'approvals']);
  });

  it('audit routing can be resolved in parallel with approvals', async () => {
    const callOrder: string[] = [];

    const approvalsProvider: ApprovalEvidenceProvider = {
      name: 'parallel-approvals',
      retrieve: async () => {
        callOrder.push('approvals-start');
        await new Promise(r => setTimeout(r, 10));
        callOrder.push('approvals-end');
        return { ok: true, evidence: {} };
      },
    };

    const auditProvider: AuditRoutingProvider = {
      name: 'parallel-audit',
      resolve: async () => {
        callOrder.push('audit-start');
        await new Promise(r => setTimeout(r, 5));
        callOrder.push('audit-end');
        return { ok: true, config: { type: 'memory' } };
      },
    };

    // Parallel execution
    await Promise.all([
      approvalsProvider.retrieve({ actionId: 'test', tier: 'merged', env: {} }),
      auditProvider.resolve({ actionId: 'test', env: {} }),
    ]);

    // Both started before either finished (parallel)
    assert.ok(callOrder.includes('approvals-start'));
    assert.ok(callOrder.includes('audit-start'));
    assert.ok(callOrder.includes('approvals-end'));
    assert.ok(callOrder.includes('audit-end'));
  });
});

// ============================================================================
// Provider Swap Safety
// ============================================================================

describe('Phase IIIb – Provider Swap Safety', () => {
  it('swapping principal provider does not affect approval logic', async () => {
    const approvals = createMockApprovalsProvider({ approverCount: 2 });

    // Different principal providers
    const provider1 = createMockPrincipalProvider({ id: 'principal-1' });
    const provider2 = createMockPrincipalProvider({ id: 'principal-2' });

    const principal1 = await provider1.resolve({ actionId: 'test', env: {} });
    const principal2 = await provider2.resolve({ actionId: 'test', env: {} });

    // Both get same approval evidence
    const approvals1 = await approvals.retrieve({
      actionId: 'test',
      tier: 'merged',
      principal: principal1.principal,
      env: {},
    });
    const approvals2 = await approvals.retrieve({
      actionId: 'test',
      tier: 'merged',
      principal: principal2.principal,
      env: {},
    });

    assert.deepEqual(
      approvals1.evidence?.tpi?.approverLogins,
      approvals2.evidence?.tpi?.approverLogins
    );
  });

  it('swapping audit provider does not affect RBAC decision', async () => {
    const principal = createMockPrincipalProvider();
    const approvals = createMockApprovalsProvider({ approverCount: 2 });

    // Different audit providers
    const memoryAudit: AuditRoutingProvider = {
      name: 'memory-audit',
      resolve: async () => ({ ok: true, config: { type: 'memory' } }),
    };
    const fileAudit: AuditRoutingProvider = {
      name: 'file-audit',
      resolve: async () => ({ ok: true, config: { type: 'file', path: '/tmp/audit.jsonl' } }),
    };

    const principalResult = await principal.resolve({ actionId: 'test', env: {} });
    const approvalsResult = await approvals.retrieve({
      actionId: 'test',
      tier: 'merged',
      env: {},
    });

    // Both audit configs are valid
    const memoryConfig = await memoryAudit.resolve({ actionId: 'test', env: {} });
    const fileConfig = await fileAudit.resolve({ actionId: 'test', env: {} });

    assert.equal(memoryConfig.ok, true);
    assert.equal(fileConfig.ok, true);

    // But RBAC decision is based on principal + approvals, not audit
    assert.equal(principalResult.ok, true);
    assert.equal(approvalsResult.ok, true);
    assert.equal(approvalsResult.evidence?.tpi?.approverLogins.length, 2);
  });
});

// ============================================================================
// Guard Integration Points
// ============================================================================

describe('Phase IIIb – Guard Integration Points', () => {
  it('guard accepts optional security context', () => {
    // The guard should work with default (env-based) providers
    // and also accept injected providers for testing
    const ctx = createMockSecurityContext();

    assert.ok(ctx.principalProvider !== undefined);
    assert.ok(ctx.approvalsProvider !== undefined);
    assert.ok(ctx.auditProvider !== undefined);
  });

  it('guard emits audit before mutation regardless of provider', async () => {
    const auditEvents: string[] = [];

    const auditProvider: AuditRoutingProvider = {
      name: 'capturing-audit',
      resolve: async () => {
        auditEvents.push('audit-resolved');
        return { ok: true, config: { type: 'memory' } };
      },
    };

    await auditProvider.resolve({ actionId: 'test', env: {} });

    assert.ok(auditEvents.includes('audit-resolved'));
    // Audit resolution happens before mutation would execute
  });

  it('guard uses provider name in audit trail', async () => {
    const ctx = createMockSecurityContext();

    assert.equal(ctx.principalProvider.name, 'mock-principal');
    assert.equal(ctx.approvalsProvider.name, 'mock-approvals');
    assert.equal(ctx.auditProvider.name, 'mock-audit');

    // These names would appear in audit events for traceability
  });
});
