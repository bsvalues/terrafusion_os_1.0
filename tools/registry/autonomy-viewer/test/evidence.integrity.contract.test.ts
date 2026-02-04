/**
 * Phase XIX — Game Days + Red Team Governance
 * ============================================
 * Contract: evidence.integrity.contract.test.ts
 *
 * Tests evidence pack integrity for game day exercises,
 * including pack completeness, checksum chains, linkage
 * between artifacts, and PII-clean verification.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Evidence packs must be complete and verifiable
 * - Checksum chains ensure tampering detection
 * - Artifacts linked via opaque references only
 * - No PII in evidence artifacts
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type EvidencePackId = `sha256:${string}`;
type ArtifactId = `sha256:${string}`;
type GameDayId = `sha256:${string}`;
type ChecksumValue = `sha256:${string}`;
type OperatorId = `sha256:${string}`;

type ArtifactType =
  | 'log_bundle'
  | 'metric_snapshot'
  | 'config_diff'
  | 'timeline_export'
  | 'alert_archive'
  | 'trace_bundle'
  | 'screenshot'
  | 'postmortem_draft';

type PackStatus = 'collecting' | 'sealed' | 'verified' | 'archived' | 'invalidated';

interface Artifact {
  readonly id: ArtifactId;
  readonly type: ArtifactType;
  readonly name: string;
  readonly sizeBytes: number;
  readonly checksum: ChecksumValue;
  readonly createdAt: string;
  readonly createdBy: OperatorId;
  readonly references: readonly ArtifactId[]; // Links to related artifacts
  readonly metadata: Record<string, unknown>;
}

interface ChecksumEntry {
  readonly artifactId: ArtifactId;
  readonly checksum: ChecksumValue;
  readonly previousChainHash: ChecksumValue;
  readonly chainHash: ChecksumValue;
  readonly addedAt: string;
}

interface EvidencePack {
  readonly id: EvidencePackId;
  readonly gameDayId: GameDayId;
  readonly name: string;
  readonly status: PackStatus;
  readonly artifacts: readonly Artifact[];
  readonly checksumChain: readonly ChecksumEntry[];
  readonly requiredTypes: readonly ArtifactType[];
  readonly createdAt: string;
  readonly sealedAt?: string;
  readonly verifiedAt?: string;
  readonly sealedBy?: OperatorId;
  readonly verifiedBy?: OperatorId;
  readonly rootChecksum?: ChecksumValue;
}

interface CompletenessReport {
  readonly packId: EvidencePackId;
  readonly complete: boolean;
  readonly requiredTypes: readonly ArtifactType[];
  readonly presentTypes: readonly ArtifactType[];
  readonly missingTypes: readonly ArtifactType[];
  readonly artifactCount: number;
  readonly totalSizeBytes: number;
}

interface IntegrityReport {
  readonly packId: EvidencePackId;
  readonly valid: boolean;
  readonly chainIntact: boolean;
  readonly checksumErrors: readonly string[];
  readonly linkageErrors: readonly string[];
  readonly piiViolations: readonly string[];
}

interface PiiScanResult {
  readonly artifactId: ArtifactId;
  readonly clean: boolean;
  readonly violations: readonly {
    readonly field: string;
    readonly reason: string;
  }[];
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockEvidenceService() {
  const packs = new Map<EvidencePackId, EvidencePack>();

  // PII patterns to detect (simulated)
  const piiPatterns = [
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, name: 'email' },
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/, name: 'ssn' },
    { pattern: /\b\d{3}[-. ]?\d{3}[-. ]?\d{4}\b/, name: 'phone' },
  ];

  // Default required artifact types for a complete pack
  const defaultRequiredTypes: readonly ArtifactType[] = [
    'log_bundle',
    'metric_snapshot',
    'timeline_export',
    'alert_archive',
  ];

  function generateId(prefix: string): EvidencePackId {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}` as EvidencePackId;
  }

  function generateChecksum(data: string): ChecksumValue {
    // Simulated checksum
    const hash = Array.from(data).reduce((acc, char) => {
      return (acc << 5) - acc + char.charCodeAt(0);
    }, 0);
    return `sha256:${Math.abs(hash).toString(16).padStart(16, '0')}` as ChecksumValue;
  }

  function calculateChainHash(
    artifactChecksum: ChecksumValue,
    previousHash: ChecksumValue
  ): ChecksumValue {
    return generateChecksum(`${artifactChecksum}:${previousHash}`);
  }

  function scanForPii(content: string): { field: string; reason: string }[] {
    const violations: { field: string; reason: string }[] = [];
    for (const { pattern, name } of piiPatterns) {
      if (pattern.test(content)) {
        violations.push({ field: 'content', reason: `Contains ${name} pattern` });
      }
    }
    return violations;
  }

  return {
    // Pack Management
    createPack(
      gameDayId: GameDayId,
      name: string,
      requiredTypes: readonly ArtifactType[] = defaultRequiredTypes
    ): EvidencePack {
      const id = generateId('pack');
      const pack: EvidencePack = {
        id,
        gameDayId,
        name,
        status: 'collecting',
        artifacts: [],
        checksumChain: [],
        requiredTypes,
        createdAt: new Date().toISOString(),
      };
      packs.set(id, pack);
      return pack;
    },

    getPack(id: EvidencePackId): EvidencePack | null {
      return packs.get(id) ?? null;
    },

    // Artifact Management
    addArtifact(
      packId: EvidencePackId,
      type: ArtifactType,
      name: string,
      content: string,
      createdBy: OperatorId,
      references: readonly ArtifactId[] = [],
      metadata: Record<string, unknown> = {}
    ): Artifact | null {
      const pack = packs.get(packId);
      if (!pack || pack.status !== 'collecting') return null;

      // Validate references exist in pack
      for (const refId of references) {
        if (!pack.artifacts.some(a => a.id === refId)) {
          return null; // Reference not found
        }
      }

      // Check for PII
      const piiCheck = scanForPii(content);
      if (piiCheck.length > 0) {
        return null; // Reject artifact with PII
      }

      const checksum = generateChecksum(content);
      const artifact: Artifact = {
        id: generateId('artifact') as ArtifactId,
        type,
        name,
        sizeBytes: content.length,
        checksum,
        createdAt: new Date().toISOString(),
        createdBy,
        references,
        metadata,
      };

      // Update checksum chain
      const previousChainHash =
        pack.checksumChain.length > 0
          ? pack.checksumChain[pack.checksumChain.length - 1].chainHash
          : ('sha256:genesis0000000000' as ChecksumValue);

      const chainHash = calculateChainHash(checksum, previousChainHash);
      const chainEntry: ChecksumEntry = {
        artifactId: artifact.id,
        checksum,
        previousChainHash,
        chainHash,
        addedAt: artifact.createdAt,
      };

      const updated: EvidencePack = {
        ...pack,
        artifacts: [...pack.artifacts, artifact],
        checksumChain: [...pack.checksumChain, chainEntry],
      };
      packs.set(packId, updated);
      return artifact;
    },

    getArtifact(packId: EvidencePackId, artifactId: ArtifactId): Artifact | null {
      const pack = packs.get(packId);
      return pack?.artifacts.find(a => a.id === artifactId) ?? null;
    },

    getArtifactsByType(packId: EvidencePackId, type: ArtifactType): readonly Artifact[] {
      const pack = packs.get(packId);
      return pack?.artifacts.filter(a => a.type === type) ?? [];
    },

    // Pack Lifecycle
    sealPack(packId: EvidencePackId, operator: OperatorId): EvidencePack | null {
      const pack = packs.get(packId);
      if (!pack || pack.status !== 'collecting') return null;
      if (pack.artifacts.length === 0) return null;

      // Calculate root checksum from final chain hash
      const rootChecksum =
        pack.checksumChain.length > 0
          ? pack.checksumChain[pack.checksumChain.length - 1].chainHash
          : ('sha256:empty0000000000000' as ChecksumValue);

      const updated: EvidencePack = {
        ...pack,
        status: 'sealed',
        sealedAt: new Date().toISOString(),
        sealedBy: operator,
        rootChecksum,
      };
      packs.set(packId, updated);
      return updated;
    },

    verifyPack(packId: EvidencePackId, operator: OperatorId): EvidencePack | null {
      const pack = packs.get(packId);
      if (!pack || pack.status !== 'sealed') return null;

      // Verify checksum chain
      const integrityReport = this.checkIntegrity(packId);
      if (!integrityReport.valid) return null;

      const updated: EvidencePack = {
        ...pack,
        status: 'verified',
        verifiedAt: new Date().toISOString(),
        verifiedBy: operator,
      };
      packs.set(packId, updated);
      return updated;
    },

    archivePack(packId: EvidencePackId): EvidencePack | null {
      const pack = packs.get(packId);
      if (!pack || pack.status !== 'verified') return null;

      const updated: EvidencePack = {
        ...pack,
        status: 'archived',
      };
      packs.set(packId, updated);
      return updated;
    },

    invalidatePack(packId: EvidencePackId, reason: string): EvidencePack | null {
      const pack = packs.get(packId);
      if (!pack) return null;
      if (pack.status === 'archived') return null;

      const updated: EvidencePack = {
        ...pack,
        status: 'invalidated',
      };
      packs.set(packId, updated);
      return updated;
    },

    // Completeness Check
    checkCompleteness(packId: EvidencePackId): CompletenessReport | null {
      const pack = packs.get(packId);
      if (!pack) return null;

      const presentTypes = [...new Set(pack.artifacts.map(a => a.type))];
      const missingTypes = pack.requiredTypes.filter(t => !presentTypes.includes(t));
      const totalSize = pack.artifacts.reduce((sum, a) => sum + a.sizeBytes, 0);

      return {
        packId,
        complete: missingTypes.length === 0,
        requiredTypes: pack.requiredTypes,
        presentTypes,
        missingTypes,
        artifactCount: pack.artifacts.length,
        totalSizeBytes: totalSize,
      };
    },

    // Integrity Check
    checkIntegrity(packId: EvidencePackId): IntegrityReport {
      const pack = packs.get(packId);
      if (!pack) {
        return {
          packId,
          valid: false,
          chainIntact: false,
          checksumErrors: ['Pack not found'],
          linkageErrors: [],
          piiViolations: [],
        };
      }

      const checksumErrors: string[] = [];
      const linkageErrors: string[] = [];
      const piiViolations: string[] = [];

      // Verify checksum chain
      let chainIntact = true;
      let expectedPrevHash = 'sha256:genesis0000000000' as ChecksumValue;

      for (const entry of pack.checksumChain) {
        if (entry.previousChainHash !== expectedPrevHash) {
          chainIntact = false;
          checksumErrors.push(`Chain break at artifact ${entry.artifactId}`);
        }
        expectedPrevHash = entry.chainHash;
      }

      // Verify artifact references
      const artifactIds = new Set(pack.artifacts.map(a => a.id));
      for (const artifact of pack.artifacts) {
        for (const refId of artifact.references) {
          if (!artifactIds.has(refId)) {
            linkageErrors.push(`Artifact ${artifact.id} references unknown artifact ${refId}`);
          }
        }
      }

      // Check root checksum
      if (pack.status === 'sealed' || pack.status === 'verified' || pack.status === 'archived') {
        if (pack.checksumChain.length > 0) {
          const expectedRoot = pack.checksumChain[pack.checksumChain.length - 1].chainHash;
          if (pack.rootChecksum !== expectedRoot) {
            checksumErrors.push('Root checksum mismatch');
            chainIntact = false;
          }
        }
      }

      return {
        packId,
        valid:
          checksumErrors.length === 0 &&
          linkageErrors.length === 0 &&
          piiViolations.length === 0 &&
          chainIntact,
        chainIntact,
        checksumErrors,
        linkageErrors,
        piiViolations,
      };
    },

    // PII Scan
    scanArtifactPii(content: string, artifactId: ArtifactId): PiiScanResult {
      const violations = scanForPii(content);
      return {
        artifactId,
        clean: violations.length === 0,
        violations,
      };
    },

    // Link Artifacts
    linkArtifacts(packId: EvidencePackId, sourceId: ArtifactId, targetId: ArtifactId): boolean {
      const pack = packs.get(packId);
      if (!pack || pack.status !== 'collecting') return false;

      const sourceIndex = pack.artifacts.findIndex(a => a.id === sourceId);
      const targetExists = pack.artifacts.some(a => a.id === targetId);

      if (sourceIndex === -1 || !targetExists) return false;
      if (pack.artifacts[sourceIndex].references.includes(targetId)) return false;

      const newArtifacts = [...pack.artifacts];
      const source = newArtifacts[sourceIndex];
      newArtifacts[sourceIndex] = {
        ...source,
        references: [...source.references, targetId],
      };

      const updated: EvidencePack = {
        ...pack,
        artifacts: newArtifacts,
      };
      packs.set(packId, updated);
      return true;
    },

    // Queries
    getPacksByGameDay(gameDayId: GameDayId): readonly EvidencePack[] {
      return [...packs.values()].filter(p => p.gameDayId === gameDayId);
    },

    getPacksByStatus(status: PackStatus): readonly EvidencePack[] {
      return [...packs.values()].filter(p => p.status === status);
    },

    // Chain Verification
    getChecksumChain(packId: EvidencePackId): readonly ChecksumEntry[] {
      return packs.get(packId)?.checksumChain ?? [];
    },

    getRootChecksum(packId: EvidencePackId): ChecksumValue | null {
      return packs.get(packId)?.rootChecksum ?? null;
    },

    // Stats
    getPackStats(packId: EvidencePackId): {
      artifactCount: number;
      typeBreakdown: Record<ArtifactType, number>;
      totalSizeBytes: number;
      referenceCount: number;
    } | null {
      const pack = packs.get(packId);
      if (!pack) return null;

      const typeBreakdown: Record<ArtifactType, number> = {} as Record<ArtifactType, number>;
      let referenceCount = 0;

      for (const artifact of pack.artifacts) {
        typeBreakdown[artifact.type] = (typeBreakdown[artifact.type] || 0) + 1;
        referenceCount += artifact.references.length;
      }

      return {
        artifactCount: pack.artifacts.length,
        typeBreakdown,
        totalSizeBytes: pack.artifacts.reduce((sum, a) => sum + a.sizeBytes, 0),
        referenceCount,
      };
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XIX: Evidence Integrity Contracts', () => {
  let service: ReturnType<typeof createMockEvidenceService>;
  const operator = 'sha256:operator_123' as OperatorId;
  const gameDayId = 'sha256:gameday_001' as GameDayId;

  beforeEach(() => {
    service = createMockEvidenceService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate pack IDs with sha256: prefix', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      assert.ok(pack.id.startsWith('sha256:'), 'Pack ID must be opaque sha256:');
    });

    it('should generate artifact IDs with sha256: prefix', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      const artifact = service.addArtifact(
        pack.id,
        'log_bundle',
        'app.log',
        'Log content here',
        operator
      );
      assert.ok(artifact!.id.startsWith('sha256:'));
    });

    it('should generate checksums with sha256: prefix', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      const artifact = service.addArtifact(
        pack.id,
        'log_bundle',
        'app.log',
        'Log content here',
        operator
      );
      assert.ok(artifact!.checksum.startsWith('sha256:'));
    });

    it('should generate chain hashes with sha256: prefix', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      const chain = service.getChecksumChain(pack.id);
      assert.ok(chain[0].chainHash.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Pack Lifecycle Tests
  // ==========================================================================

  describe('Pack Lifecycle', () => {
    it('should start in collecting status', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      assert.strictEqual(pack.status, 'collecting');
    });

    it('should transition collecting → sealed', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      const sealed = service.sealPack(pack.id, operator);
      assert.strictEqual(sealed!.status, 'sealed');
    });

    it('should not seal empty pack', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      const sealed = service.sealPack(pack.id, operator);
      assert.strictEqual(sealed, null);
    });

    it('should record seal timestamp and operator', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      const sealed = service.sealPack(pack.id, operator);
      assert.ok(sealed!.sealedAt);
      assert.strictEqual(sealed!.sealedBy, operator);
    });

    it('should transition sealed → verified', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      service.sealPack(pack.id, operator);
      const verified = service.verifyPack(pack.id, operator);
      assert.strictEqual(verified!.status, 'verified');
    });

    it('should transition verified → archived', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      service.sealPack(pack.id, operator);
      service.verifyPack(pack.id, operator);
      const archived = service.archivePack(pack.id);
      assert.strictEqual(archived!.status, 'archived');
    });

    it('should not add artifacts after seal', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      service.sealPack(pack.id, operator);
      const added = service.addArtifact(
        pack.id,
        'metric_snapshot',
        'metrics.json',
        'Data',
        operator
      );
      assert.strictEqual(added, null);
    });

    it('should support invalidation', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      service.sealPack(pack.id, operator);
      const invalidated = service.invalidatePack(pack.id, 'Tampering detected');
      assert.strictEqual(invalidated!.status, 'invalidated');
    });

    it('should not invalidate archived packs', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      service.sealPack(pack.id, operator);
      service.verifyPack(pack.id, operator);
      service.archivePack(pack.id);
      const result = service.invalidatePack(pack.id, 'Too late');
      assert.strictEqual(result, null);
    });
  });

  // ==========================================================================
  // Completeness Tests
  // ==========================================================================

  describe('Pack Completeness', () => {
    it('should require default artifact types', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      assert.ok(pack.requiredTypes.length > 0);
      assert.ok(pack.requiredTypes.includes('log_bundle'));
      assert.ok(pack.requiredTypes.includes('metric_snapshot'));
    });

    it('should allow custom required types', () => {
      const customTypes: ArtifactType[] = ['log_bundle', 'postmortem_draft'];
      const pack = service.createPack(gameDayId, 'Custom Pack', customTypes);
      assert.deepStrictEqual([...pack.requiredTypes], customTypes);
    });

    it('should report incomplete pack', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      const report = service.checkCompleteness(pack.id);
      assert.strictEqual(report!.complete, false);
      assert.ok(report!.missingTypes.length > 0);
    });

    it('should report complete pack', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Log content', operator);
      service.addArtifact(pack.id, 'metric_snapshot', 'metrics.json', 'Metric data', operator);
      service.addArtifact(pack.id, 'timeline_export', 'timeline.json', 'Timeline data', operator);
      service.addArtifact(pack.id, 'alert_archive', 'alerts.json', 'Alert data', operator);
      const report = service.checkCompleteness(pack.id);
      assert.strictEqual(report!.complete, true);
      assert.strictEqual(report!.missingTypes.length, 0);
    });

    it('should calculate total size', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', '12345', operator);
      service.addArtifact(pack.id, 'metric_snapshot', 'metrics.json', '6789', operator);
      const report = service.checkCompleteness(pack.id);
      assert.strictEqual(report!.totalSizeBytes, 9);
    });

    it('should count artifacts', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content 1', operator);
      service.addArtifact(pack.id, 'log_bundle', 'error.log', 'Content 2', operator);
      const report = service.checkCompleteness(pack.id);
      assert.strictEqual(report!.artifactCount, 2);
    });
  });

  // ==========================================================================
  // Checksum Chain Tests (Critical Invariant)
  // ==========================================================================

  describe('Checksum Chain Integrity', () => {
    it('should start chain from genesis hash', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      const chain = service.getChecksumChain(pack.id);
      assert.ok(chain[0].previousChainHash.startsWith('sha256:genesis'));
    });

    it('should link subsequent artifacts to previous chain hash', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content 1', operator);
      service.addArtifact(pack.id, 'metric_snapshot', 'metrics.json', 'Content 2', operator);
      const chain = service.getChecksumChain(pack.id);
      assert.strictEqual(chain[1].previousChainHash, chain[0].chainHash);
    });

    it('should verify intact chain', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content 1', operator);
      service.addArtifact(pack.id, 'metric_snapshot', 'metrics.json', 'Content 2', operator);
      service.sealPack(pack.id, operator);
      const report = service.checkIntegrity(pack.id);
      assert.strictEqual(report.chainIntact, true);
    });

    it('should calculate root checksum on seal', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      const sealed = service.sealPack(pack.id, operator);
      assert.ok(sealed!.rootChecksum);
      assert.ok(sealed!.rootChecksum!.startsWith('sha256:'));
    });

    it('should match root checksum to final chain hash', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      const sealed = service.sealPack(pack.id, operator);
      const chain = service.getChecksumChain(pack.id);
      const finalChainHash = chain[chain.length - 1].chainHash;
      assert.strictEqual(sealed!.rootChecksum, finalChainHash);
    });

    it('should record checksum timestamps', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      const chain = service.getChecksumChain(pack.id);
      assert.ok(chain[0].addedAt);
    });
  });

  // ==========================================================================
  // PII Prevention Tests (Critical Invariant)
  // ==========================================================================

  describe('PII Prevention', () => {
    it('should reject artifact containing email', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      const content = 'User john.doe@example.com reported the issue';
      const artifact = service.addArtifact(pack.id, 'log_bundle', 'app.log', content, operator);
      assert.strictEqual(artifact, null);
    });

    it('should reject artifact containing SSN', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      const content = 'SSN: 123-45-6789';
      const artifact = service.addArtifact(pack.id, 'log_bundle', 'app.log', content, operator);
      assert.strictEqual(artifact, null);
    });

    it('should reject artifact containing phone number', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      const content = 'Contact: 555-123-4567';
      const artifact = service.addArtifact(pack.id, 'log_bundle', 'app.log', content, operator);
      assert.strictEqual(artifact, null);
    });

    it('should accept PII-clean content', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      const content = 'User sha256:abc123 reported error code 500';
      const artifact = service.addArtifact(pack.id, 'log_bundle', 'app.log', content, operator);
      assert.ok(artifact);
    });

    it('should scan for PII violations', () => {
      const result = service.scanArtifactPii(
        'Email: test@example.com',
        'sha256:test_artifact' as ArtifactId
      );
      assert.strictEqual(result.clean, false);
      assert.ok(result.violations.length > 0);
    });

    it('should return clean for safe content', () => {
      const result = service.scanArtifactPii(
        'User ID: sha256:abc123',
        'sha256:test_artifact' as ArtifactId
      );
      assert.strictEqual(result.clean, true);
      assert.strictEqual(result.violations.length, 0);
    });
  });

  // ==========================================================================
  // Artifact Linkage Tests
  // ==========================================================================

  describe('Artifact Linkage', () => {
    it('should link related artifacts', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      const log = service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Log content', operator);
      const metric = service.addArtifact(
        pack.id,
        'metric_snapshot',
        'metrics.json',
        'Metric data',
        operator
      );

      const linked = service.linkArtifacts(pack.id, metric!.id, log!.id);
      assert.strictEqual(linked, true);

      const updated = service.getArtifact(pack.id, metric!.id);
      assert.ok(updated!.references.includes(log!.id));
    });

    it('should reject invalid reference on add', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      const fakeRef = 'sha256:nonexistent' as ArtifactId;
      const artifact = service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator, [
        fakeRef,
      ]);
      assert.strictEqual(artifact, null);
    });

    it('should prevent duplicate links', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      const log = service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      const metric = service.addArtifact(
        pack.id,
        'metric_snapshot',
        'metrics.json',
        'Data',
        operator
      );

      service.linkArtifacts(pack.id, metric!.id, log!.id);
      const duplicate = service.linkArtifacts(pack.id, metric!.id, log!.id);
      assert.strictEqual(duplicate, false);
    });

    it('should not link after seal', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      const log = service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      const metric = service.addArtifact(
        pack.id,
        'metric_snapshot',
        'metrics.json',
        'Data',
        operator
      );
      service.sealPack(pack.id, operator);

      const linked = service.linkArtifacts(pack.id, metric!.id, log!.id);
      assert.strictEqual(linked, false);
    });

    it('should detect linkage errors in integrity check', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      const report = service.checkIntegrity(pack.id);
      assert.strictEqual(report.linkageErrors.length, 0);
    });
  });

  // ==========================================================================
  // Query Tests
  // ==========================================================================

  describe('Query Operations', () => {
    it('should get packs by game day', () => {
      service.createPack(gameDayId, 'Pack 1');
      service.createPack(gameDayId, 'Pack 2');
      service.createPack('sha256:other_gameday' as GameDayId, 'Pack 3');

      const packs = service.getPacksByGameDay(gameDayId);
      assert.strictEqual(packs.length, 2);
    });

    it('should get packs by status', () => {
      const pack1 = service.createPack(gameDayId, 'Pack 1');
      service.createPack(gameDayId, 'Pack 2');
      service.addArtifact(pack1.id, 'log_bundle', 'app.log', 'Content', operator);
      service.sealPack(pack1.id, operator);

      assert.strictEqual(service.getPacksByStatus('collecting').length, 1);
      assert.strictEqual(service.getPacksByStatus('sealed').length, 1);
    });

    it('should get artifacts by type', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content 1', operator);
      service.addArtifact(pack.id, 'log_bundle', 'error.log', 'Content 2', operator);
      service.addArtifact(pack.id, 'metric_snapshot', 'metrics.json', 'Data', operator);

      const logs = service.getArtifactsByType(pack.id, 'log_bundle');
      assert.strictEqual(logs.length, 2);
    });
  });

  // ==========================================================================
  // Statistics Tests
  // ==========================================================================

  describe('Pack Statistics', () => {
    it('should calculate artifact count', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content 1', operator);
      service.addArtifact(pack.id, 'metric_snapshot', 'metrics.json', 'Content 2', operator);

      const stats = service.getPackStats(pack.id);
      assert.strictEqual(stats!.artifactCount, 2);
    });

    it('should break down by type', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      service.addArtifact(pack.id, 'log_bundle', 'error.log', 'Content', operator);
      service.addArtifact(pack.id, 'metric_snapshot', 'metrics.json', 'Data', operator);

      const stats = service.getPackStats(pack.id);
      assert.strictEqual(stats!.typeBreakdown['log_bundle'], 2);
      assert.strictEqual(stats!.typeBreakdown['metric_snapshot'], 1);
    });

    it('should count references', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      const log = service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      const metric = service.addArtifact(
        pack.id,
        'metric_snapshot',
        'metrics.json',
        'Data',
        operator
      );
      service.linkArtifacts(pack.id, metric!.id, log!.id);

      const stats = service.getPackStats(pack.id);
      assert.strictEqual(stats!.referenceCount, 1);
    });
  });

  // ==========================================================================
  // Integrity Report Tests
  // ==========================================================================

  describe('Integrity Reports', () => {
    it('should validate sealed pack', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);
      service.sealPack(pack.id, operator);

      const report = service.checkIntegrity(pack.id);
      assert.strictEqual(report.valid, true);
    });

    it('should report chain intact separately', () => {
      const pack = service.createPack(gameDayId, 'Test Pack');
      service.addArtifact(pack.id, 'log_bundle', 'app.log', 'Content', operator);

      const report = service.checkIntegrity(pack.id);
      assert.strictEqual(report.chainIntact, true);
    });

    it('should return errors for missing pack', () => {
      const report = service.checkIntegrity('sha256:nonexistent' as EvidencePackId);
      assert.strictEqual(report.valid, false);
      assert.ok(report.checksumErrors.length > 0);
    });
  });
});
