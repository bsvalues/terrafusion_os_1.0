/**
 * Phase 4N46 – Audit Packet Contract Tests
 * ========================================
 *
 * TDD-first tests for audit packet generation:
 *   - Required artifacts included
 *   - Hashes computed correctly
 *   - Package is signed and verifiable
 *   - Manifest is complete
 *
 * @module audit-packet.test
 * @version 4N46.1
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    AUDIT_PACKET_SCHEMA,
    AUDIT_PACKET_VERSION,
    type AuditPacketManifest,
    type AuditPacketOptions,
    computePacketHash,
    createAuditPacketManifest,
    REQUIRED_AUDIT_ARTIFACTS,
    validateAuditPacketManifest,
} from '../src/audit-packet.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Data
// ─────────────────────────────────────────────────────────────────────────────

function createTestOptions(): AuditPacketOptions {
  return {
    repoIdentity: 'github.com/terrafusion/os',
    generatedBy: 'audit-system',
    ledgerHead: {
      sha256: 'sha256:ledger123',
      sequenceNumber: 42,
      timestamp: '2025-01-15T00:00:00Z',
    },
    rollupHead: {
      sha256: 'sha256:rollup456',
      month: '2025-01',
      timestamp: '2025-01-01T00:00:00Z',
    },
    casefiles: [
      {
        casefileId: 'CASE-001',
        sha256: 'sha256:case001',
        timestamp: '2025-01-10T00:00:00Z',
        audience: 'internal',
      },
    ],
    verificationReports: [
      {
        reportId: 'VR-001',
        sha256: 'sha256:vr001',
        timestamp: '2025-01-14T00:00:00Z',
        outcome: 'PASS',
      },
    ],
    keyEpochSummary: {
      currentEpoch: 3,
      validFrom: '2024-06-01T00:00:00Z',
      rotationHistory: [
        { epoch: 1, rotatedAt: '2023-01-01T00:00:00Z' },
        { epoch: 2, rotatedAt: '2024-01-01T00:00:00Z' },
        { epoch: 3, rotatedAt: '2024-06-01T00:00:00Z' },
      ],
    },
    revocationSummary: {
      revokedEpochs: [],
      lastRevocationCheck: '2025-01-15T00:00:00Z',
    },
    telemetryExcerptHashes: ['sha256:tel001', 'sha256:tel002'],
    profileUsed: 'county.policy.json',
    runbooksIncluded: ['AIRGAP_VERIFY.md', 'DR_RECONSTITUTE.md'],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Audit Packet Schema
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Audit Packet Schema', () => {
  it('schema matches expected identifier', () => {
    assert.strictEqual(AUDIT_PACKET_SCHEMA, 'terrafusion.autonomy.audit-packet.v1');
  });

  it('version is 4N46.1', () => {
    assert.strictEqual(AUDIT_PACKET_VERSION, '4N46.1');
  });

  it('required artifacts list is defined', () => {
    assert.ok(Array.isArray(REQUIRED_AUDIT_ARTIFACTS));
    assert.ok(REQUIRED_AUDIT_ARTIFACTS.includes('ledger-head'));
    assert.ok(REQUIRED_AUDIT_ARTIFACTS.includes('rollup-head'));
    assert.ok(REQUIRED_AUDIT_ARTIFACTS.includes('key-epoch-summary'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Manifest Creation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Manifest Creation', () => {
  it('createAuditPacketManifest produces valid manifest', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    assert.strictEqual(manifest.$schema, AUDIT_PACKET_SCHEMA);
    assert.strictEqual(manifest.version, AUDIT_PACKET_VERSION);
    assert.ok(manifest.packetId);
    assert.ok(manifest.generatedAt);
  });

  it('manifest includes ledger head', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    assert.strictEqual(manifest.ledgerHead.sha256, 'sha256:ledger123');
    assert.strictEqual(manifest.ledgerHead.sequenceNumber, 42);
  });

  it('manifest includes rollup head', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    assert.strictEqual(manifest.rollupHead.sha256, 'sha256:rollup456');
    assert.strictEqual(manifest.rollupHead.month, '2025-01');
  });

  it('manifest includes casefiles with hashes', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    assert.strictEqual(manifest.casefiles.length, 1);
    assert.strictEqual(manifest.casefiles[0].sha256, 'sha256:case001');
  });

  it('manifest includes verification reports', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    assert.strictEqual(manifest.verificationReports.length, 1);
    assert.strictEqual(manifest.verificationReports[0].outcome, 'PASS');
  });

  it('manifest includes key epoch summary', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    assert.strictEqual(manifest.keyEpochSummary.currentEpoch, 3);
    assert.strictEqual(manifest.keyEpochSummary.rotationHistory.length, 3);
  });

  it('manifest includes revocation summary', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    assert.ok(manifest.revocationSummary);
    assert.strictEqual(manifest.revocationSummary.revokedEpochs.length, 0);
  });

  it('manifest includes telemetry excerpt hashes', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    assert.strictEqual(manifest.telemetryExcerptHashes.length, 2);
  });

  it('manifest includes policy profile reference', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    assert.strictEqual(manifest.profileUsed, 'county.policy.json');
  });

  it('manifest includes runbooks list', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    assert.strictEqual(manifest.runbooksIncluded.length, 2);
    assert.ok(manifest.runbooksIncluded.includes('AIRGAP_VERIFY.md'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Manifest Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Manifest Validation', () => {
  it('validateAuditPacketManifest accepts valid manifest', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);
    const result = validateAuditPacketManifest(manifest);

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('validation fails when ledger head missing', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    // Remove ledger head
    const invalidManifest = {
      ...manifest,
      ledgerHead: undefined,
    } as unknown as AuditPacketManifest;
    const result = validateAuditPacketManifest(invalidManifest);

    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('ledger')));
  });

  it('validation fails when key epoch summary missing', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    const invalidManifest = {
      ...manifest,
      keyEpochSummary: undefined,
    } as unknown as AuditPacketManifest;
    const result = validateAuditPacketManifest(invalidManifest);

    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('key') || e.includes('epoch')));
  });

  it('validation warns when no verification reports', () => {
    const options = createTestOptions();
    options.verificationReports = [];
    const manifest = createAuditPacketManifest(options);
    const result = validateAuditPacketManifest(manifest);

    // Should still be valid but with warnings
    assert.ok(result.warnings?.some(w => w.includes('verification')));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Packet Hash
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Packet Hash', () => {
  it('computePacketHash produces sha256 hash', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);
    const hash = computePacketHash(manifest);

    assert.ok(hash.startsWith('sha256:'));
    assert.strictEqual(hash.length, 'sha256:'.length + 64);
  });

  it('hash is deterministic', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    const hash1 = computePacketHash(manifest);
    const hash2 = computePacketHash(manifest);

    assert.strictEqual(hash1, hash2);
  });

  it('hash changes with manifest changes', () => {
    const options1 = createTestOptions();
    const manifest1 = createAuditPacketManifest(options1);
    manifest1.generatedAt = '2025-01-15T00:00:00Z';

    const options2 = createTestOptions();
    const manifest2 = createAuditPacketManifest(options2);
    manifest2.generatedAt = '2025-01-16T00:00:00Z';

    const hash1 = computePacketHash(manifest1);
    const hash2 = computePacketHash(manifest2);

    assert.notStrictEqual(hash1, hash2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Artifact Completeness
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Artifact Completeness', () => {
  it('manifest lists all included artifact types', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    assert.ok(manifest.artifactTypes.includes('ledger-head'));
    assert.ok(manifest.artifactTypes.includes('rollup-head'));
    assert.ok(manifest.artifactTypes.includes('casefile'));
    assert.ok(manifest.artifactTypes.includes('verification-report'));
    assert.ok(manifest.artifactTypes.includes('key-epoch-summary'));
    assert.ok(manifest.artifactTypes.includes('runbook'));
  });

  it('manifest counts artifacts correctly', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    assert.strictEqual(manifest.artifactCounts.casefiles, 1);
    assert.strictEqual(manifest.artifactCounts.verificationReports, 1);
    assert.strictEqual(manifest.artifactCounts.runbooks, 2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Controls Mapping
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Controls Mapping', () => {
  it('manifest includes FISMA compliance reference', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    assert.ok(manifest.complianceReferences);
    assert.ok(manifest.complianceReferences.some(r => r.framework === 'FISMA'));
  });

  it('manifest includes audit period', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    assert.ok(manifest.auditPeriod);
    assert.ok(manifest.auditPeriod.start);
    assert.ok(manifest.auditPeriod.end);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N46 – Signing Readiness
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N46 – Signing Readiness', () => {
  it('manifest includes signature placeholder', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    assert.ok('signature' in manifest || 'signatureSlot' in manifest);
  });

  it('manifest is JSON-serializable', () => {
    const options = createTestOptions();
    const manifest = createAuditPacketManifest(options);

    const json = JSON.stringify(manifest);
    const parsed = JSON.parse(json);

    assert.strictEqual(parsed.$schema, AUDIT_PACKET_SCHEMA);
  });
});
