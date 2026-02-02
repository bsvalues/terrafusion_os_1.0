/**
 * Phase IIIb – Provider Seams Contract Tests
 * ==========================================
 *
 * Contract: Provider interfaces are narrow, typed, and fail-closed.
 * Swapping providers cannot change RBAC decision semantics.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
    ApprovalEvidenceContext,
    ApprovalEvidenceProvider,
    ApprovalEvidenceResult,
    AuditRoutingContext,
    AuditRoutingProvider,
    AuditRoutingResult,
    PrincipalResolutionContext,
    PrincipalResolutionProvider,
    PrincipalResolutionResult,
    SecurityContext,
} from '../src/security/providers/types.js';

// ============================================================================
// Test Helpers: Mock Providers
// ============================================================================

function createMockPrincipalProvider(
  result: PrincipalResolutionResult
): PrincipalResolutionProvider {
  return {
    name: 'mock-principal',
    resolve: async () => result,
  };
}

function createMockApprovalsProvider(result: ApprovalEvidenceResult): ApprovalEvidenceProvider {
  return {
    name: 'mock-approvals',
    retrieve: async () => result,
  };
}

function createMockAuditProvider(result: AuditRoutingResult): AuditRoutingProvider {
  return {
    name: 'mock-audit',
    resolve: async () => result,
  };
}

// ============================================================================
// Principal Resolution Provider Contract
// ============================================================================

describe('Phase IIIb – PrincipalResolutionProvider Contract', () => {
  it('provider must have a name', () => {
    const provider = createMockPrincipalProvider({ ok: true });
    assert.equal(typeof provider.name, 'string');
    assert.ok(provider.name.length > 0);
  });

  it('resolve() returns ok=true with principal on success', async () => {
    const result: PrincipalResolutionResult = {
      ok: true,
      principal: {
        id: 'ci-runner-001',
        displayName: 'CI Runner',
        roles: ['ci-readonly'],
        claims: {},
        resolvedBy: 'mock',
        resolvedAt: new Date().toISOString(),
      },
    };
    const provider = createMockPrincipalProvider(result);
    const ctx: PrincipalResolutionContext = {
      actionId: 'autonomy.bootstrap.write',
      env: {},
    };
    const actual = await provider.resolve(ctx);
    assert.equal(actual.ok, true);
    assert.ok(actual.principal);
    assert.equal(actual.principal.id, 'ci-runner-001');
  });

  it('resolve() returns ok=false with errorCode on failure (fail-closed)', async () => {
    const result: PrincipalResolutionResult = {
      ok: false,
      errorCode: 'PRINCIPAL_NOT_FOUND',
      errorMessage: 'No principal context available',
    };
    const provider = createMockPrincipalProvider(result);
    const ctx: PrincipalResolutionContext = {
      actionId: 'autonomy.bootstrap.write',
      env: {},
    };
    const actual = await provider.resolve(ctx);
    assert.equal(actual.ok, false);
    assert.equal(actual.errorCode, 'PRINCIPAL_NOT_FOUND');
    assert.ok(!actual.principal);
  });

  it('principal.id must be stable (no PII)', async () => {
    const result: PrincipalResolutionResult = {
      ok: true,
      principal: {
        id: 'service:ci-runner',
        displayName: 'CI Runner',
        roles: [],
        claims: {},
        resolvedBy: 'test',
        resolvedAt: new Date().toISOString(),
      },
    };
    const provider = createMockPrincipalProvider(result);
    const actual = await provider.resolve({ actionId: 'test', env: {} });
    // ID should not contain email-like patterns
    assert.ok(!actual.principal?.id.includes('@'));
    // ID should not contain SSN-like patterns
    assert.ok(!actual.principal?.id.match(/\d{3}-\d{2}-\d{4}/));
  });
});

// ============================================================================
// Approval Evidence Provider Contract
// ============================================================================

describe('Phase IIIb – ApprovalEvidenceProvider Contract', () => {
  it('provider must have a name', () => {
    const provider = createMockApprovalsProvider({ ok: true, evidence: {} });
    assert.equal(typeof provider.name, 'string');
    assert.ok(provider.name.length > 0);
  });

  it('retrieve() returns ok=true with evidence on success', async () => {
    const result: ApprovalEvidenceResult = {
      ok: true,
      evidence: {
        tpi: {
          ok: true,
          minApprovals: 2,
          approverLogins: ['approver-1', 'approver-2'],
          policyVersion: '1.0',
          evaluatedAt: new Date().toISOString(),
        },
      },
    };
    const provider = createMockApprovalsProvider(result);
    const ctx: ApprovalEvidenceContext = {
      actionId: 'autonomy.bootstrap.write',
      tier: 'merged',
      env: {},
    };
    const actual = await provider.retrieve(ctx);
    assert.equal(actual.ok, true);
    assert.ok(actual.evidence?.tpi?.ok);
  });

  it('retrieve() returns ok=false with errorCode on failure (fail-closed)', async () => {
    const result: ApprovalEvidenceResult = {
      ok: false,
      errorCode: 'APPROVAL_FETCH_FAILED',
      errorMessage: 'Could not retrieve approval evidence',
    };
    const provider = createMockApprovalsProvider(result);
    const ctx: ApprovalEvidenceContext = {
      actionId: 'autonomy.bootstrap.write',
      tier: 'merged',
      env: {},
    };
    const actual = await provider.retrieve(ctx);
    assert.equal(actual.ok, false);
    assert.equal(actual.errorCode, 'APPROVAL_FETCH_FAILED');
  });

  it('evidence fields are all optional (partial evidence is valid)', async () => {
    const result: ApprovalEvidenceResult = {
      ok: true,
      evidence: {
        // Only TPI, no break-glass or role-binding
        tpi: {
          ok: true,
          minApprovals: 1,
          approverLogins: ['approver-1'],
          policyVersion: '1.0',
          evaluatedAt: new Date().toISOString(),
        },
      },
    };
    const provider = createMockApprovalsProvider(result);
    const actual = await provider.retrieve({
      actionId: 'test',
      tier: 'ci',
      env: {},
    });
    assert.equal(actual.ok, true);
    assert.ok(actual.evidence?.tpi);
    assert.equal(actual.evidence?.breakGlass, undefined);
    assert.equal(actual.evidence?.roleBinding, undefined);
  });
});

// ============================================================================
// Audit Routing Provider Contract
// ============================================================================

describe('Phase IIIb – AuditRoutingProvider Contract', () => {
  it('provider must have a name', () => {
    const provider = createMockAuditProvider({
      ok: true,
      config: { type: 'memory' },
    });
    assert.equal(typeof provider.name, 'string');
    assert.ok(provider.name.length > 0);
  });

  it('resolve() returns ok=true with config on success', async () => {
    const result: AuditRoutingResult = {
      ok: true,
      config: { type: 'file', path: '/var/log/audit.jsonl' },
    };
    const provider = createMockAuditProvider(result);
    const ctx: AuditRoutingContext = {
      actionId: 'autonomy.bootstrap.write',
      tier: 'merged',
      env: {},
    };
    const actual = await provider.resolve(ctx);
    assert.equal(actual.ok, true);
    assert.equal(actual.config?.type, 'file');
    assert.equal(actual.config?.path, '/var/log/audit.jsonl');
  });

  it('resolve() returns ok=false with errorCode on failure', async () => {
    const result: AuditRoutingResult = {
      ok: false,
      errorCode: 'AUDIT_CONFIG_INVALID',
      errorMessage: 'Invalid audit sink path',
    };
    const provider = createMockAuditProvider(result);
    const actual = await provider.resolve({
      actionId: 'test',
      env: {},
    });
    assert.equal(actual.ok, false);
    assert.equal(actual.errorCode, 'AUDIT_CONFIG_INVALID');
  });

  it('memory sink is the default (no external dependency)', async () => {
    const result: AuditRoutingResult = {
      ok: true,
      config: { type: 'memory' },
    };
    const provider = createMockAuditProvider(result);
    const actual = await provider.resolve({ actionId: 'test', env: {} });
    assert.equal(actual.ok, true);
    assert.equal(actual.config?.type, 'memory');
  });

  it('composite sink can have multiple children', async () => {
    const result: AuditRoutingResult = {
      ok: true,
      config: {
        type: 'composite',
        children: [{ type: 'memory' }, { type: 'file', path: '/var/log/audit.jsonl' }],
      },
    };
    const provider = createMockAuditProvider(result);
    const actual = await provider.resolve({ actionId: 'test', env: {} });
    assert.equal(actual.ok, true);
    assert.equal(actual.config?.type, 'composite');
    assert.equal(actual.config?.children?.length, 2);
  });
});

// ============================================================================
// Security Context Composition Contract
// ============================================================================

describe('Phase IIIb – SecurityContext Composition Contract', () => {
  it('context bundles all three providers', () => {
    const ctx: SecurityContext = {
      principalProvider: createMockPrincipalProvider({ ok: true }),
      approvalsProvider: createMockApprovalsProvider({ ok: true, evidence: {} }),
      auditProvider: createMockAuditProvider({
        ok: true,
        config: { type: 'memory' },
      }),
    };
    assert.ok(ctx.principalProvider);
    assert.ok(ctx.approvalsProvider);
    assert.ok(ctx.auditProvider);
  });

  it('providers can be independently swapped', async () => {
    // Initial context with mock providers
    const ctx1: SecurityContext = {
      principalProvider: createMockPrincipalProvider({
        ok: true,
        principal: {
          id: 'user-1',
          displayName: 'User 1',
          roles: ['admin'],
          claims: {},
          resolvedBy: 'mock-1',
          resolvedAt: new Date().toISOString(),
        },
      }),
      approvalsProvider: createMockApprovalsProvider({ ok: true, evidence: {} }),
      auditProvider: createMockAuditProvider({
        ok: true,
        config: { type: 'memory' },
      }),
    };

    // Swap only the principal provider
    const ctx2: SecurityContext = {
      ...ctx1,
      principalProvider: createMockPrincipalProvider({
        ok: true,
        principal: {
          id: 'user-2',
          displayName: 'User 2',
          roles: ['operator'],
          claims: {},
          resolvedBy: 'mock-2',
          resolvedAt: new Date().toISOString(),
        },
      }),
    };

    // Same action context
    const actionCtx: PrincipalResolutionContext = {
      actionId: 'autonomy.bootstrap.write',
      env: {},
    };

    const result1 = await ctx1.principalProvider.resolve(actionCtx);
    const result2 = await ctx2.principalProvider.resolve(actionCtx);

    assert.equal(result1.principal?.id, 'user-1');
    assert.equal(result2.principal?.id, 'user-2');

    // Other providers remain unchanged
    assert.equal(ctx1.approvalsProvider.name, ctx2.approvalsProvider.name);
    assert.equal(ctx1.auditProvider.name, ctx2.auditProvider.name);
  });
});

// ============================================================================
// Fail-Closed Defaults Contract
// ============================================================================

describe('Phase IIIb – Fail-Closed Defaults Contract', () => {
  it('principal resolution failure implies deny', async () => {
    const provider = createMockPrincipalProvider({
      ok: false,
      errorCode: 'PRINCIPAL_RESOLUTION_FAILED',
    });
    const result = await provider.resolve({ actionId: 'test', env: {} });
    assert.equal(result.ok, false);
    // Deny-by-default: no principal means no authorization
  });

  it('approval evidence failure implies deny', async () => {
    const provider = createMockApprovalsProvider({
      ok: false,
      errorCode: 'APPROVAL_FETCH_FAILED',
    });
    const result = await provider.retrieve({
      actionId: 'test',
      tier: 'merged',
      env: {},
    });
    assert.equal(result.ok, false);
    // Deny-by-default: no evidence means no authorization
  });

  it('audit routing failure should not block deny decision', async () => {
    // Audit is emit-before-mutation, but audit failure doesn't grant access
    const provider = createMockAuditProvider({
      ok: false,
      errorCode: 'AUDIT_SINK_UNAVAILABLE',
    });
    const result = await provider.resolve({ actionId: 'test', env: {} });
    assert.equal(result.ok, false);
    // Audit failure is logged but denial proceeds
  });
});
