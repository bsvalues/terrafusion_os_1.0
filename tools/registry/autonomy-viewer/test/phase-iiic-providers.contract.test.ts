/**
 * Phase IIIc – File-Based Provider Contract Tests
 * ================================================
 *
 * Tests for offline-capable providers:
 * - StaticPrincipalProvider
 * - FilePrincipalProvider
 * - FileApprovalEvidenceProvider
 * - Attestation placeholder in audit events
 */

import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

import { createAuditDecisionEvent } from '../src/security/audit/audit-log.js';
import {
    EnvApprovalEvidenceProvider,
    EnvAuditRoutingProvider,
    EnvPrincipalProvider,
    FileApprovalEvidenceProvider,
    FilePrincipalProvider,
    StaticPrincipalProvider,
    TierBasedAuditRoutingProvider,
    createSecurityContext,
} from '../src/security/providers/providers.js';
import type { Principal } from '../src/security/providers/types.js';
import type { RbacDecision } from '../src/security/rbac/rbac.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const TEST_DIR = join(tmpdir(), 'tf-provider-tests-' + Date.now());

function createTestPrincipal(overrides: Partial<Principal> = {}): Principal {
  return {
    id: 'test-principal-001',
    displayName: 'Test Principal',
    roles: ['operator', 'reviewer'],
    claims: { team: 'engineering' },
    resolvedBy: 'test',
    resolvedAt: '2026-02-02T08:00:00.000Z',
    ...overrides,
  };
}

function createTestRbacDecision(overrides: Partial<RbacDecision> = {}): RbacDecision {
  return {
    schema: 'terrafusion.security.rbac-decision.v1',
    version: '1.0.0',
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

// ============================================================================
// StaticPrincipalProvider Tests
// ============================================================================

describe('Phase IIIc – StaticPrincipalProvider', () => {
  it('returns configured principal', async () => {
    const principal = createTestPrincipal();
    const provider = new StaticPrincipalProvider({ principal });

    const result = await provider.resolve({
      actionId: 'test.action',
      env: {},
    });

    assert.equal(result.ok, true);
    assert.equal(result.principal?.id, principal.id);
    assert.deepEqual(result.principal?.roles, principal.roles);
  });

  it('provider name is static', () => {
    const provider = new StaticPrincipalProvider({ principal: createTestPrincipal() });
    assert.equal(provider.name, 'static');
  });

  it('always succeeds (no fail-closed path)', async () => {
    const provider = new StaticPrincipalProvider({ principal: createTestPrincipal() });

    // Even with empty env, static provider succeeds
    const result = await provider.resolve({ actionId: 'any', env: {} });
    assert.equal(result.ok, true);
  });
});

// ============================================================================
// FilePrincipalProvider Tests
// ============================================================================

describe('Phase IIIc – FilePrincipalProvider', () => {
  const mappingPath = join(TEST_DIR, 'principal-mapping.json');

  before(async () => {
    await mkdir(TEST_DIR, { recursive: true });

    const mapping = {
      schema: 'terrafusion.security.principal-mapping.v1',
      version: '1.0.0',
      principals: {
        'operator-001': {
          id: 'operator-001',
          displayName: 'Operator One',
          roles: ['admin', 'operator'],
          claims: { department: 'IT' },
        },
        'operator-002': {
          id: 'operator-002',
          displayName: 'Operator Two',
          roles: ['reviewer'],
          claims: {},
        },
      },
    };

    await writeFile(mappingPath, JSON.stringify(mapping, null, 2));
  });

  after(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('resolves principal from mapping file', async () => {
    const provider = new FilePrincipalProvider({ mappingFilePath: mappingPath });

    const result = await provider.resolve({
      actionId: 'test.action',
      env: { TF_OPERATOR_ID: 'operator-001' },
    });

    assert.equal(result.ok, true);
    assert.equal(result.principal?.id, 'operator-001');
    assert.equal(result.principal?.displayName, 'Operator One');
    assert.deepEqual(result.principal?.roles, ['admin', 'operator']);
  });

  it('fails closed when operator ID missing', async () => {
    const provider = new FilePrincipalProvider({ mappingFilePath: mappingPath });

    const result = await provider.resolve({
      actionId: 'test.action',
      env: {},
    });

    assert.equal(result.ok, false);
    assert.equal(result.errorCode, 'DENY_PROVIDER_ERROR');
    assert.ok(result.errorMessage?.includes('TF_OPERATOR_ID'));
  });

  it('fails closed when operator not in mapping', async () => {
    const provider = new FilePrincipalProvider({ mappingFilePath: mappingPath });

    const result = await provider.resolve({
      actionId: 'test.action',
      env: { TF_OPERATOR_ID: 'unknown-operator' },
    });

    assert.equal(result.ok, false);
    assert.equal(result.errorCode, 'DENY_PROVIDER_ERROR');
    assert.ok(result.errorMessage?.includes('unknown-operator'));
  });

  it('fails closed when mapping file missing', async () => {
    const provider = new FilePrincipalProvider({ mappingFilePath: '/nonexistent/path.json' });

    const result = await provider.resolve({
      actionId: 'test.action',
      env: { TF_OPERATOR_ID: 'operator-001' },
    });

    assert.equal(result.ok, false);
    assert.equal(result.errorCode, 'DENY_PROVIDER_ERROR');
  });

  it('provider name is file', () => {
    const provider = new FilePrincipalProvider({ mappingFilePath: mappingPath });
    assert.equal(provider.name, 'file');
  });
});

// ============================================================================
// FileApprovalEvidenceProvider Tests
// ============================================================================

describe('Phase IIIc – FileApprovalEvidenceProvider', () => {
  const evidenceDir = join(TEST_DIR, 'evidence');

  before(async () => {
    await mkdir(evidenceDir, { recursive: true });

    const evidence = {
      schema: 'terrafusion.security.approval-evidence.v1',
      version: '1.0.0',
      tpi: {
        approvals: 3,
        approvers: ['alice', 'bob', 'carol'],
        policyVersion: '2.1.0',
      },
      breakGlass: {
        activated: true,
        reason: 'incident-response',
        activatedAt: '2026-02-02T07:00:00.000Z',
        expiresAt: '2026-02-02T09:00:00.000Z',
      },
    };

    await writeFile(
      join(evidenceDir, 'evidence-autonomy-bootstrap-write.json'),
      JSON.stringify(evidence, null, 2)
    );
  });

  after(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('loads approval evidence from file', async () => {
    const provider = new FileApprovalEvidenceProvider({ evidenceDir });

    const result = await provider.retrieve({
      actionId: 'autonomy.bootstrap.write',
      tier: 'merged',
      env: {},
    });

    assert.equal(result.ok, true);
    assert.equal(result.evidence?.tpi?.approvals, 3);
    assert.equal(result.evidence?.breakGlass?.activated, true);
  });

  it('returns empty evidence when file not found', async () => {
    const provider = new FileApprovalEvidenceProvider({ evidenceDir });

    const result = await provider.retrieve({
      actionId: 'unknown.action',
      tier: 'ci',
      env: {},
    });

    assert.equal(result.ok, true);
    assert.deepEqual(result.evidence, {});
  });

  it('provider name is file', () => {
    const provider = new FileApprovalEvidenceProvider({ evidenceDir });
    assert.equal(provider.name, 'file');
  });
});

// ============================================================================
// EnvPrincipalProvider Tests
// ============================================================================

describe('Phase IIIc – EnvPrincipalProvider', () => {
  it('resolves principal from environment', async () => {
    const provider = new EnvPrincipalProvider();

    const result = await provider.resolve({
      actionId: 'test.action',
      env: {
        TF_PRINCIPAL_ID: 'ci-bot-001',
        TF_PRINCIPAL_ROLES: 'operator,reviewer',
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.principal?.id, 'ci-bot-001');
    assert.deepEqual(result.principal?.roles, ['operator', 'reviewer']);
  });

  it('fails closed when principal ID missing (default)', async () => {
    const provider = new EnvPrincipalProvider();

    const result = await provider.resolve({
      actionId: 'test.action',
      env: {},
    });

    assert.equal(result.ok, false);
    assert.equal(result.errorCode, 'DENY_PROVIDER_ERROR');
  });

  it('allows anonymous when configured', async () => {
    const provider = new EnvPrincipalProvider({ allowAnonymous: true });

    const result = await provider.resolve({
      actionId: 'test.action',
      env: {},
    });

    assert.equal(result.ok, true);
    assert.equal(result.principal?.id, 'anonymous');
  });
});

// ============================================================================
// EnvApprovalEvidenceProvider Tests
// ============================================================================

describe('Phase IIIc – EnvApprovalEvidenceProvider', () => {
  it('loads TPI approvals from environment', async () => {
    const provider = new EnvApprovalEvidenceProvider();

    const result = await provider.retrieve({
      actionId: 'test.action',
      tier: 'merged',
      env: { TF_TPI_APPROVALS: '2' },
    });

    assert.equal(result.ok, true);
    assert.equal(result.evidence?.tpi?.approvals, 2);
  });

  it('loads break-glass from environment', async () => {
    const provider = new EnvApprovalEvidenceProvider();

    const result = await provider.retrieve({
      actionId: 'test.action',
      tier: 'incident',
      env: { TF_BREAK_GLASS: 'true' },
    });

    assert.equal(result.ok, true);
    assert.equal(result.evidence?.breakGlass?.activated, true);
  });

  it('returns empty evidence when no env vars set', async () => {
    const provider = new EnvApprovalEvidenceProvider();

    const result = await provider.retrieve({
      actionId: 'test.action',
      tier: 'ci',
      env: {},
    });

    assert.equal(result.ok, true);
    assert.deepEqual(result.evidence, {});
  });
});

// ============================================================================
// TierBasedAuditRoutingProvider Tests
// ============================================================================

describe('Phase IIIc – TierBasedAuditRoutingProvider', () => {
  it('routes CI tier to memory sink', async () => {
    const provider = new TierBasedAuditRoutingProvider();

    const result = await provider.resolve({
      actionId: 'test.action',
      tier: 'ci',
      env: {},
    });

    assert.equal(result.ok, true);
    assert.equal(result.config?.type, 'memory');
  });

  it('routes incident tier to composite sink', async () => {
    const provider = new TierBasedAuditRoutingProvider();

    const result = await provider.resolve({
      actionId: 'test.action',
      tier: 'incident',
      env: {},
    });

    assert.equal(result.ok, true);
    assert.equal(result.config?.type, 'composite');
    assert.ok(result.config?.children?.length === 2);
  });

  it('routes merged tier to file sink', async () => {
    const provider = new TierBasedAuditRoutingProvider();

    const result = await provider.resolve({
      actionId: 'test.action',
      tier: 'merged',
      env: {},
    });

    assert.equal(result.ok, true);
    assert.equal(result.config?.type, 'file');
  });
});

// ============================================================================
// Attestation Placeholder Tests
// ============================================================================

describe('Phase IIIc – Audit Attestation Placeholder', () => {
  it('audit event includes attestation field', () => {
    const decision = createTestRbacDecision();
    const event = createAuditDecisionEvent(decision);

    assert.ok(event.attestation);
    assert.equal(event.attestation.type, 'none');
  });

  it('attestation type is none by default', () => {
    const decision = createTestRbacDecision();
    const event = createAuditDecisionEvent(decision);

    assert.equal(event.attestation?.type, 'none');
    assert.equal(event.attestation?.keyId, undefined);
    assert.equal(event.attestation?.signature, undefined);
  });

  it('audit event includes decision digest', () => {
    const decision = createTestRbacDecision();
    const event = createAuditDecisionEvent(decision);

    assert.ok(event.decisionDigestSha256);
    // Hash format includes sha256: prefix
    assert.match(event.decisionDigestSha256, /^sha256:[a-f0-9]{64}$/);
  });

  it('audit event includes policy digest', () => {
    const decision = createTestRbacDecision();
    const event = createAuditDecisionEvent(decision);

    assert.ok(event.policyDigestSha256);
    // Hash format includes sha256: prefix
    assert.match(event.policyDigestSha256, /^sha256:[a-f0-9]{64}$/);
  });

  it('decision digest is deterministic', () => {
    const decision = createTestRbacDecision();

    const event1 = createAuditDecisionEvent(decision, {
      eventId: 'e1',
      timestamp: '2026-02-02T08:00:00.000Z',
    });
    const event2 = createAuditDecisionEvent(decision, {
      eventId: 'e2',
      timestamp: '2026-02-02T08:00:00.000Z',
    });

    assert.equal(event1.decisionDigestSha256, event2.decisionDigestSha256);
  });

  it('different decisions produce different digests', () => {
    const decision1 = createTestRbacDecision({ allowed: true });
    const decision2 = createTestRbacDecision({ allowed: false });

    const event1 = createAuditDecisionEvent(decision1);
    const event2 = createAuditDecisionEvent(decision2);

    assert.notEqual(event1.decisionDigestSha256, event2.decisionDigestSha256);
  });
});

// ============================================================================
// SecurityContext Factory Tests
// ============================================================================

describe('Phase IIIc – SecurityContext Factory', () => {
  it('creates default context with env providers', () => {
    const ctx = createSecurityContext();

    assert.equal(ctx.principalProvider.name, 'env');
    assert.equal(ctx.approvalsProvider.name, 'env');
    assert.equal(ctx.auditProvider.name, 'env');
  });

  it('allows custom provider injection', () => {
    const staticPrincipal = new StaticPrincipalProvider({
      principal: createTestPrincipal(),
    });

    const ctx = createSecurityContext({
      principalProvider: staticPrincipal,
    });

    assert.equal(ctx.principalProvider.name, 'static');
    assert.equal(ctx.approvalsProvider.name, 'env');
  });
});

// ============================================================================
// Cross-Platform Env Simulation Tests
// ============================================================================

describe('Phase IIIc – Env Simulation (fail-closed)', () => {
  it('EnvPrincipalProvider: malformed env handled gracefully', async () => {
    const provider = new EnvPrincipalProvider();

    // Empty string for principal ID should fail closed
    const result = await provider.resolve({
      actionId: 'test.action',
      env: { TF_PRINCIPAL_ID: '' },
    });

    // Empty string is falsy, should fail closed
    assert.equal(result.ok, false);
  });

  it('EnvApprovalEvidenceProvider: non-numeric TPI approvals ignored', async () => {
    const provider = new EnvApprovalEvidenceProvider();

    const result = await provider.retrieve({
      actionId: 'test.action',
      tier: 'merged',
      env: { TF_TPI_APPROVALS: 'not-a-number' },
    });

    // Invalid number is ignored, returns empty evidence
    assert.equal(result.ok, true);
    assert.equal(result.evidence?.tpi, undefined);
  });

  it('EnvAuditRoutingProvider: invalid sink type fails closed', async () => {
    const provider = new EnvAuditRoutingProvider();

    const result = await provider.resolve({
      actionId: 'test.action',
      env: { TF_AUDIT_SINK: 'invalid-sink-type' },
    });

    assert.equal(result.ok, false);
    assert.equal(result.errorCode, 'DENY_PROVIDER_ERROR');
  });

  it('EnvAuditRoutingProvider: file sink without path fails closed', async () => {
    const provider = new EnvAuditRoutingProvider();

    const result = await provider.resolve({
      actionId: 'test.action',
      env: { TF_AUDIT_SINK: 'file' },
    });

    assert.equal(result.ok, false);
    assert.equal(result.errorCode, 'DENY_PROVIDER_ERROR');
    assert.ok(result.errorMessage?.includes('TF_AUDIT_FILE'));
  });
});
