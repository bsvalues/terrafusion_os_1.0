/**
 * Phase IIId – Attestation Provider + NIST Extensions Contract Tests
 * ===================================================================
 *
 * Tests for:
 * - AttestationProvider interface (sign/verify)
 * - NoopAttestationProvider behavior
 * - Normalized identity claims helpers
 * - NIST audit field extensions schema
 * - SBOM/Provenance attestation reference schema
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  NoopAttestationProvider,
  createNormalizedClaims,
  createSecurityContext,
  hashSessionIdentifier,
  hashSubjectIdentifier,
} from '../src/security/providers/providers.js';
import type {
  Attestation,
  AttestationAlgorithm,
  AttestationProvider,
  AttestationSignContext,
  AttestationVerifyContext,
  NistAuditExtensions,
  NistEventCategory,
  NistEventOutcome,
  NormalizedIdentityClaims,
  SupplyChainAttestationRef,
  SupplyChainBundle,
} from '../src/security/providers/types.js';

// ============================================================================
// NoopAttestationProvider Contract
// ============================================================================

describe('Phase IIId – NoopAttestationProvider Contract', () => {
  it('provider has name property', () => {
    const provider = new NoopAttestationProvider();
    assert.equal(provider.name, 'noop');
  });

  it('sign returns type=none attestation', async () => {
    const provider = new NoopAttestationProvider();
    const context: AttestationSignContext = {
      data: '{"test":"data"}',
    };

    const result = await provider.sign(context);

    assert.equal(result.ok, true);
    assert.ok(result.attestation);
    assert.equal(result.attestation.type, 'none');
    assert.equal(result.attestation.attestedBy, 'noop');
    assert.ok(result.attestation.attestedAt);
  });

  it('verify accepts type=none attestation', async () => {
    const provider = new NoopAttestationProvider();
    const attestation: Attestation = {
      type: 'none',
      attestedBy: 'noop',
    };
    const context: AttestationVerifyContext = {
      data: '{"test":"data"}',
      attestation,
    };

    const result = await provider.verify(context);

    assert.equal(result.ok, true);
    assert.equal(result.valid, true);
  });

  it('verify rejects type=external attestation', async () => {
    const provider = new NoopAttestationProvider();
    const attestation: Attestation = {
      type: 'external',
      keyId: 'test-key',
      algorithm: 'ECDSA-P256',
      signature: 'dGVzdC1zaWduYXR1cmU=',
    };
    const context: AttestationVerifyContext = {
      data: '{"test":"data"}',
      attestation,
    };

    const result = await provider.verify(context);

    assert.equal(result.ok, false);
    assert.equal(result.valid, false);
    assert.equal(result.errorCode, 'ATTESTATION_PROVIDER_MISMATCH');
  });

  it('sign is deterministic in type (always none)', async () => {
    const provider = new NoopAttestationProvider();

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        provider.sign({ data: '{"test":"data"}' })
      )
    );

    for (const result of results) {
      assert.equal(result.ok, true);
      assert.equal(result.attestation?.type, 'none');
    }
  });
});

// ============================================================================
// Attestation Interface Shape
// ============================================================================

describe('Phase IIId – Attestation Interface Shape', () => {
  it('Attestation type discriminator is required', () => {
    const noneAttestation: Attestation = { type: 'none' };
    const externalAttestation: Attestation = {
      type: 'external',
      keyId: 'key-001',
      algorithm: 'ECDSA-P256',
      signature: 'base64sig',
      attestedAt: '2026-02-02T08:00:00.000Z',
    };

    assert.equal(noneAttestation.type, 'none');
    assert.equal(externalAttestation.type, 'external');
  });

  it('all supported algorithms are valid', () => {
    const algorithms: AttestationAlgorithm[] = [
      'ECDSA-P256',
      'ECDSA-P384',
      'RSA-PSS-2048',
      'RSA-PSS-4096',
      'ED25519',
    ];

    for (const alg of algorithms) {
      const attestation: Attestation = {
        type: 'external',
        algorithm: alg,
      };
      assert.equal(attestation.algorithm, alg);
    }
  });
});

// ============================================================================
// Normalized Identity Claims
// ============================================================================

describe('Phase IIId – Normalized Identity Claims', () => {
  it('hashSubjectIdentifier produces sha256 prefixed hash', () => {
    const hash = hashSubjectIdentifier('user@example.com');

    assert.ok(hash.startsWith('sha256:'));
    assert.match(hash, /^sha256:[a-f0-9]{64}$/);
  });

  it('hashSubjectIdentifier is deterministic', () => {
    const hash1 = hashSubjectIdentifier('test-subject');
    const hash2 = hashSubjectIdentifier('test-subject');

    assert.equal(hash1, hash2);
  });

  it('different subjects produce different hashes', () => {
    const hash1 = hashSubjectIdentifier('user-a');
    const hash2 = hashSubjectIdentifier('user-b');

    assert.notEqual(hash1, hash2);
  });

  it('hashSessionIdentifier produces sha256 prefixed hash', () => {
    const hash = hashSessionIdentifier('session-12345');

    assert.ok(hash.startsWith('sha256:'));
    assert.match(hash, /^sha256:[a-f0-9]{64}$/);
  });

  it('createNormalizedClaims produces PII-safe claims', () => {
    const claims = createNormalizedClaims({
      subjectId: 'user@example.com',
      roles: ['admin', 'operator'],
      assuranceLevel: 'AAL2',
      authnContext: 'mfa',
      authnTime: '2026-02-02T08:00:00.000Z',
      sessionId: 'raw-session-id',
      issuer: 'https://idp.example.com',
      expiresAt: '2026-02-02T16:00:00.000Z',
    });

    // Subject and session are hashed, not raw
    assert.ok(claims.subjectHash.startsWith('sha256:'));
    assert.ok(claims.sessionHash?.startsWith('sha256:'));
    assert.notEqual(claims.subjectHash, 'user@example.com');
    assert.notEqual(claims.sessionHash, 'raw-session-id');

    // Other fields preserved
    assert.deepEqual(claims.roles, ['admin', 'operator']);
    assert.equal(claims.assuranceLevel, 'AAL2');
    assert.equal(claims.authnContext, 'mfa');
    assert.equal(claims.issuer, 'https://idp.example.com');
  });

  it('claims without session omit sessionHash', () => {
    const claims = createNormalizedClaims({
      subjectId: 'service-account',
      roles: ['service'],
    });

    assert.ok(claims.subjectHash);
    assert.equal(claims.sessionHash, undefined);
  });

  it('all assurance levels are valid', () => {
    const levels: NormalizedIdentityClaims['assuranceLevel'][] = [
      'AAL1',
      'AAL2',
      'AAL3',
    ];

    for (const level of levels) {
      const claims = createNormalizedClaims({
        subjectId: 'test',
        roles: [],
        assuranceLevel: level,
      });
      assert.equal(claims.assuranceLevel, level);
    }
  });

  it('all authn contexts are valid', () => {
    const contexts: NormalizedIdentityClaims['authnContext'][] = [
      'password',
      'mfa',
      'certificate',
      'hardware-token',
      'biometric',
      'federated',
      'service-account',
    ];

    for (const ctx of contexts) {
      const claims = createNormalizedClaims({
        subjectId: 'test',
        roles: [],
        authnContext: ctx,
      });
      assert.equal(claims.authnContext, ctx);
    }
  });
});

// ============================================================================
// NIST Audit Extensions Schema
// ============================================================================

describe('Phase IIId – NIST Audit Extensions Schema', () => {
  it('all event categories are valid', () => {
    const categories: NistEventCategory[] = [
      'authentication',
      'authorization',
      'account-management',
      'data-access',
      'system-events',
      'privilege-use',
      'policy-change',
    ];

    for (const cat of categories) {
      const ext: NistAuditExtensions = { eventCategory: cat };
      assert.equal(ext.eventCategory, cat);
    }
  });

  it('all event outcomes are valid', () => {
    const outcomes: NistEventOutcome[] = ['success', 'failure', 'unknown'];

    for (const outcome of outcomes) {
      const ext: NistAuditExtensions = { eventOutcome: outcome };
      assert.equal(ext.eventOutcome, outcome);
    }
  });

  it('extensions are optional and additive', () => {
    const minimal: NistAuditExtensions = {};
    const full: NistAuditExtensions = {
      eventCategory: 'authorization',
      eventOutcome: 'success',
      privilegeUsed: 'autonomy.bootstrap.write',
      sessionBindingHash: 'sha256:abc123',
      resourceId: 'artifact-001',
      resourceType: 'sealed-casefile',
      component: 'cli-guard',
      environment: 'prod',
    };

    assert.equal(Object.keys(minimal).length, 0);
    assert.equal(Object.keys(full).length, 8);
  });
});

// ============================================================================
// SBOM/Provenance Attestation Schema
// ============================================================================

describe('Phase IIId – SupplyChainAttestationRef Schema', () => {
  it('sbom reference has required fields', () => {
    const ref: SupplyChainAttestationRef = {
      type: 'sbom',
      format: 'spdx',
      artifactDigest: 'sha256:abc123def456',
      artifactUri: 'https://artifacts.example.com/sbom.json',
      generatorTool: 'syft',
      generatorVersion: '0.85.0',
      generatedAt: '2026-02-02T08:00:00.000Z',
    };

    assert.equal(ref.type, 'sbom');
    assert.equal(ref.format, 'spdx');
    assert.ok(ref.artifactDigest);
  });

  it('provenance reference has required fields', () => {
    const ref: SupplyChainAttestationRef = {
      type: 'provenance',
      provenanceType: 'slsa',
      artifactDigest: 'sha256:abc123def456',
      artifactUri: 'https://artifacts.example.com/provenance.json',
      generatorTool: 'slsa-verifier',
      generatorVersion: '2.4.0',
    };

    assert.equal(ref.type, 'provenance');
    assert.equal(ref.provenanceType, 'slsa');
  });

  it('all sbom formats are valid', () => {
    const formats: SupplyChainAttestationRef['format'][] = ['spdx', 'cyclonedx'];

    for (const fmt of formats) {
      const ref: SupplyChainAttestationRef = {
        type: 'sbom',
        format: fmt,
        artifactDigest: 'sha256:test',
      };
      assert.equal(ref.format, fmt);
    }
  });

  it('all provenance types are valid', () => {
    const types: SupplyChainAttestationRef['provenanceType'][] = [
      'slsa',
      'sigstore',
      'in-toto',
    ];

    for (const pt of types) {
      const ref: SupplyChainAttestationRef = {
        type: 'provenance',
        provenanceType: pt,
        artifactDigest: 'sha256:test',
      };
      assert.equal(ref.provenanceType, pt);
    }
  });
});

describe('Phase IIId – SupplyChainBundle Schema', () => {
  it('bundle has correct schema identifier', () => {
    const bundle: SupplyChainBundle = {
      schema: 'terrafusion.security.supply-chain.v1',
    };

    assert.equal(bundle.schema, 'terrafusion.security.supply-chain.v1');
  });

  it('bundle can contain sbom and provenance', () => {
    const bundle: SupplyChainBundle = {
      schema: 'terrafusion.security.supply-chain.v1',
      sbom: {
        type: 'sbom',
        format: 'cyclonedx',
        artifactDigest: 'sha256:sbom-hash',
      },
      provenance: {
        type: 'provenance',
        provenanceType: 'sigstore',
        artifactDigest: 'sha256:prov-hash',
      },
    };

    assert.ok(bundle.sbom);
    assert.ok(bundle.provenance);
    assert.equal(bundle.sbom.format, 'cyclonedx');
    assert.equal(bundle.provenance.provenanceType, 'sigstore');
  });

  it('bundle can have additional attestations', () => {
    const bundle: SupplyChainBundle = {
      schema: 'terrafusion.security.supply-chain.v1',
      additionalAttestations: [
        {
          type: 'build-attestation',
          artifactDigest: 'sha256:build-hash',
          generatorTool: 'github-actions',
        },
      ],
    };

    assert.equal(bundle.additionalAttestations?.length, 1);
    assert.equal(bundle.additionalAttestations?.[0].type, 'build-attestation');
  });
});

// ============================================================================
// Security Context with Attestation
// ============================================================================

describe('Phase IIId – SecurityContext with AttestationProvider', () => {
  it('default context includes noop attestation provider', () => {
    const ctx = createSecurityContext();

    assert.equal(ctx.attestationProvider.name, 'noop');
  });

  it('custom attestation provider can be injected', async () => {
    // Mock provider that always returns external attestations
    const mockProvider: AttestationProvider = {
      name: 'mock-kms',
      async sign() {
        return {
          ok: true,
          attestation: {
            type: 'external',
            keyId: 'mock-key',
            algorithm: 'ECDSA-P256',
            signature: 'bW9jay1zaWc=',
            attestedBy: 'mock-kms',
          },
        };
      },
      async verify(ctx) {
        return {
          ok: true,
          valid: ctx.attestation.type === 'external',
        };
      },
    };

    const ctx = createSecurityContext({ attestationProvider: mockProvider });

    assert.equal(ctx.attestationProvider.name, 'mock-kms');

    const signResult = await ctx.attestationProvider.sign({ data: 'test' });
    assert.equal(signResult.attestation?.type, 'external');
  });
});

// ============================================================================
// Fail-Closed Invariants
// ============================================================================

describe('Phase IIId – Attestation Fail-Closed Invariants', () => {
  it('noop provider sign never throws', async () => {
    const provider = new NoopAttestationProvider();

    // Even with unusual input, should not throw
    const result = await provider.sign({ data: '' });
    assert.equal(result.ok, true);
  });

  it('noop provider verify never throws', async () => {
    const provider = new NoopAttestationProvider();

    // Even with unusual attestation, should not throw
    const result = await provider.verify({
      data: '',
      attestation: { type: 'external' },
    });

    // Returns error result, not exception
    assert.equal(result.ok, false);
    assert.ok(result.errorCode);
  });
});
