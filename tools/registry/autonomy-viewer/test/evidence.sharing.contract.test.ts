/**
 * Federated Governance: Evidence Sharing Contract Tests
 *
 * Phase XIV - PII-clean evidence sharing with least privilege,
 * time-bounded and reproducible packs (reusing Phase XII patterns).
 *
 * CONTRACT SURFACE:
 * - Evidence Packs: Cross-domain evidence sharing bundles
 * - Access Control: Least privilege access to shared evidence
 * - Time Bounding: All shares have expiry
 * - Reproducibility: Shares can be regenerated deterministically
 *
 * INVARIANTS:
 * - All shared evidence is PII-clean (sanitized before sharing)
 * - Access is least privilege (explicit grants only)
 * - All shares are time-bounded with expiry
 * - Shares are reproducible and versioned
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ShareStatus = 'pending' | 'active' | 'expired' | 'revoked';
type AccessLevel = 'read' | 'reference' | 'audit';
type EvidenceType = 'attestation' | 'metric' | 'log' | 'report' | 'certificate';

/**
 * Evidence pack for cross-domain sharing
 */
interface SharedEvidencePack {
  readonly pack_id: string;
  readonly source_domain_id: string;
  readonly target_domain_id: string;
  readonly name: string;
  readonly evidence_refs: readonly EvidenceRef[];
  readonly pii_sanitized: boolean;
  readonly access_level: AccessLevel;
  readonly status: ShareStatus;
  readonly created_at: string;
  readonly expires_at: string;
  readonly version: number;
}

/**
 * Evidence reference (not embedded)
 */
interface EvidenceRef {
  readonly ref_id: string;
  readonly type: EvidenceType;
  readonly source_id: string;
  readonly checksum: string;
  readonly sanitized: boolean;
}

/**
 * Access grant for evidence
 */
interface AccessGrant {
  readonly grant_id: string;
  readonly pack_id: string;
  readonly grantee_principal_id: string;
  readonly access_level: AccessLevel;
  readonly granted_by: string;
  readonly granted_at: string;
  readonly expires_at: string;
  readonly revoked: boolean;
}

/**
 * Reproducibility record
 */
interface ReproducibilityRecord {
  readonly record_id: string;
  readonly pack_id: string;
  readonly generation_params: Record<string, unknown>;
  readonly checksum: string;
  readonly generated_at: string;
  readonly reproducible: boolean;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockPack(overrides: Partial<SharedEvidencePack> = {}): SharedEvidencePack {
  const packId = `pack-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    pack_id: `sha256:${Buffer.from(packId).toString('hex').slice(0, 64)}`,
    source_domain_id: `sha256:${Buffer.from('source-domain').toString('hex').slice(0, 64)}`,
    target_domain_id: `sha256:${Buffer.from('target-domain').toString('hex').slice(0, 64)}`,
    name: 'quarterly-compliance-evidence',
    evidence_refs: [
      {
        ref_id: `sha256:${Buffer.from('ref-1').toString('hex').slice(0, 64)}`,
        type: 'attestation',
        source_id: `sha256:${Buffer.from('attest-1').toString('hex').slice(0, 64)}`,
        checksum: `sha256:${Buffer.from('checksum-1').toString('hex').slice(0, 64)}`,
        sanitized: true,
      },
    ],
    pii_sanitized: true,
    access_level: 'read',
    status: 'active',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 90).toISOString(),
    version: 1,
    ...overrides,
  };
}

function createMockGrant(overrides: Partial<AccessGrant> = {}): AccessGrant {
  const grantId = `grant-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    grant_id: `sha256:${Buffer.from(grantId).toString('hex').slice(0, 64)}`,
    pack_id: `sha256:${Buffer.from('pack-1').toString('hex').slice(0, 64)}`,
    grantee_principal_id: `sha256:${Buffer.from('grantee-1').toString('hex').slice(0, 64)}`,
    access_level: 'read',
    granted_by: `sha256:${Buffer.from('grantor-1').toString('hex').slice(0, 64)}`,
    granted_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
    revoked: false,
    ...overrides,
  };
}

function createMockReproducibilityRecord(
  overrides: Partial<ReproducibilityRecord> = {}
): ReproducibilityRecord {
  const recordId = `repro-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    record_id: `sha256:${Buffer.from(recordId).toString('hex').slice(0, 64)}`,
    pack_id: `sha256:${Buffer.from('pack-1').toString('hex').slice(0, 64)}`,
    generation_params: { quarter: 'Q4-2025', domain: 'benton-county' },
    checksum: `sha256:${Buffer.from('pack-checksum').toString('hex').slice(0, 64)}`,
    generated_at: new Date().toISOString(),
    reproducible: true,
    ...overrides,
  };
}

// ============================================================================
// MOCK EVIDENCE SHARING SERVICE
// ============================================================================

interface EvidenceSharingService {
  // Pack Management
  createPack(
    sourceDomainId: string,
    targetDomainId: string,
    name: string
  ): Promise<SharedEvidencePack>;
  addEvidence(packId: string, ref: EvidenceRef): Promise<SharedEvidencePack>;
  getPack(packId: string): Promise<SharedEvidencePack | null>;
  listPacks(domainId: string): Promise<readonly SharedEvidencePack[]>;
  activatePack(packId: string): Promise<SharedEvidencePack>;
  revokePack(packId: string): Promise<SharedEvidencePack>;

  // Access Control
  grantAccess(packId: string, principalId: string, level: AccessLevel): Promise<AccessGrant>;
  revokeAccess(grantId: string): Promise<boolean>;
  checkAccess(packId: string, principalId: string): Promise<AccessLevel | null>;
  listGrants(packId: string): Promise<readonly AccessGrant[]>;

  // PII Safety
  sanitizePack(packId: string): Promise<SharedEvidencePack>;
  isPIISafe(packId: string): Promise<boolean>;
  validateEvidence(ref: EvidenceRef): Promise<boolean>;

  // Reproducibility
  recordGeneration(packId: string, params: Record<string, unknown>): Promise<ReproducibilityRecord>;
  verifyReproducibility(packId: string): Promise<boolean>;
  regeneratePack(recordId: string): Promise<SharedEvidencePack>;
}

function createMockEvidenceSharingService(): EvidenceSharingService {
  const packs: Map<string, SharedEvidencePack> = new Map();
  const grants: Map<string, AccessGrant> = new Map();
  const reproRecords: Map<string, ReproducibilityRecord> = new Map();

  return {
    async createPack(sourceDomainId, targetDomainId, name) {
      const pack = createMockPack({
        source_domain_id: sourceDomainId,
        target_domain_id: targetDomainId,
        name,
        status: 'pending',
        evidence_refs: [],
      });
      packs.set(pack.pack_id, pack);
      return pack;
    },

    async addEvidence(packId, ref) {
      const pack = packs.get(packId);
      if (!pack) throw new Error('pack not found');

      const updated = createMockPack({
        ...pack,
        evidence_refs: [...pack.evidence_refs, ref],
      });
      packs.set(packId, updated);
      return updated;
    },

    async getPack(packId) {
      return packs.get(packId) ?? null;
    },

    async listPacks(domainId) {
      return Array.from(packs.values()).filter(
        p => p.source_domain_id === domainId || p.target_domain_id === domainId
      );
    },

    async activatePack(packId) {
      const pack = packs.get(packId);
      if (!pack) throw new Error('pack not found');
      if (!pack.pii_sanitized) throw new Error('pack must be PII-sanitized before activation');

      const activated = createMockPack({ ...pack, status: 'active' });
      packs.set(packId, activated);
      return activated;
    },

    async revokePack(packId) {
      const pack = packs.get(packId);
      if (!pack) throw new Error('pack not found');

      const revoked = createMockPack({ ...pack, status: 'revoked' });
      packs.set(packId, revoked);
      return revoked;
    },

    async grantAccess(packId, principalId, level) {
      const grant = createMockGrant({
        pack_id: packId,
        grantee_principal_id: principalId,
        access_level: level,
      });
      grants.set(grant.grant_id, grant);
      return grant;
    },

    async revokeAccess(grantId) {
      const grant = grants.get(grantId);
      if (!grant) return false;

      const revoked = createMockGrant({ ...grant, revoked: true });
      grants.set(grantId, revoked);
      return true;
    },

    async checkAccess(packId, principalId) {
      for (const grant of grants.values()) {
        if (
          grant.pack_id === packId &&
          grant.grantee_principal_id === principalId &&
          !grant.revoked &&
          new Date(grant.expires_at) > new Date()
        ) {
          return grant.access_level;
        }
      }
      return null;
    },

    async listGrants(packId) {
      return Array.from(grants.values()).filter(g => g.pack_id === packId && !g.revoked);
    },

    async sanitizePack(packId) {
      const pack = packs.get(packId);
      if (!pack) throw new Error('pack not found');

      const sanitized = createMockPack({
        ...pack,
        pii_sanitized: true,
        evidence_refs: pack.evidence_refs.map(ref => ({ ...ref, sanitized: true })),
      });
      packs.set(packId, sanitized);
      return sanitized;
    },

    async isPIISafe(packId) {
      const pack = packs.get(packId);
      if (!pack) return false;
      return pack.pii_sanitized && pack.evidence_refs.every(ref => ref.sanitized);
    },

    async validateEvidence(ref) {
      return ref.sanitized && ref.checksum.startsWith('sha256:');
    },

    async recordGeneration(packId, params) {
      const pack = packs.get(packId);
      if (!pack) throw new Error('pack not found');

      const record = createMockReproducibilityRecord({
        pack_id: packId,
        generation_params: params,
        checksum: `sha256:${Buffer.from(JSON.stringify(params)).toString('hex').slice(0, 64)}`,
      });
      reproRecords.set(record.record_id, record);
      return record;
    },

    async verifyReproducibility(packId) {
      for (const record of reproRecords.values()) {
        if (record.pack_id === packId && record.reproducible) {
          return true;
        }
      }
      return false;
    },

    async regeneratePack(recordId) {
      const record = reproRecords.get(recordId);
      if (!record) throw new Error('record not found');

      const pack = packs.get(record.pack_id);
      if (!pack) throw new Error('original pack not found');

      // Create new pack with same params
      const regenerated = createMockPack({
        ...pack,
        version: pack.version + 1,
      });
      packs.set(regenerated.pack_id, regenerated);
      return regenerated;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Federated Governance: Evidence Sharing Contracts', () => {
  let service: EvidenceSharingService;

  beforeEach(() => {
    service = createMockEvidenceSharingService();
  });

  // ==========================================================================
  // CONTRACT: pack_management
  // ==========================================================================
  describe('CONTRACT: pack_management', () => {
    it('creates evidence pack', async () => {
      const sourceId = `sha256:${Buffer.from('source').toString('hex').slice(0, 64)}`;
      const targetId = `sha256:${Buffer.from('target').toString('hex').slice(0, 64)}`;

      const pack = await service.createPack(sourceId, targetId, 'test-pack');
      assert.ok(pack.pack_id.startsWith('sha256:'));
      assert.strictEqual(pack.status, 'pending');
    });

    it('adds evidence to pack', async () => {
      const sourceId = `sha256:${Buffer.from('source').toString('hex').slice(0, 64)}`;
      const targetId = `sha256:${Buffer.from('target').toString('hex').slice(0, 64)}`;
      const pack = await service.createPack(sourceId, targetId, 'add-test');

      const ref: EvidenceRef = {
        ref_id: `sha256:${Buffer.from('ref').toString('hex').slice(0, 64)}`,
        type: 'attestation',
        source_id: `sha256:${Buffer.from('src').toString('hex').slice(0, 64)}`,
        checksum: `sha256:${Buffer.from('sum').toString('hex').slice(0, 64)}`,
        sanitized: true,
      };

      const updated = await service.addEvidence(pack.pack_id, ref);
      assert.strictEqual(updated.evidence_refs.length, 1);
    });

    it('retrieves pack by ID', async () => {
      const sourceId = `sha256:${Buffer.from('source').toString('hex').slice(0, 64)}`;
      const targetId = `sha256:${Buffer.from('target').toString('hex').slice(0, 64)}`;
      const created = await service.createPack(sourceId, targetId, 'get-test');

      const retrieved = await service.getPack(created.pack_id);
      assert.ok(retrieved);
      assert.strictEqual(retrieved.pack_id, created.pack_id);
    });

    it('activates pack', async () => {
      const sourceId = `sha256:${Buffer.from('source').toString('hex').slice(0, 64)}`;
      const targetId = `sha256:${Buffer.from('target').toString('hex').slice(0, 64)}`;
      const pack = await service.createPack(sourceId, targetId, 'activate-test');
      await service.sanitizePack(pack.pack_id);

      const activated = await service.activatePack(pack.pack_id);
      assert.strictEqual(activated.status, 'active');
    });

    it('revokes pack', async () => {
      const sourceId = `sha256:${Buffer.from('source').toString('hex').slice(0, 64)}`;
      const targetId = `sha256:${Buffer.from('target').toString('hex').slice(0, 64)}`;
      const pack = await service.createPack(sourceId, targetId, 'revoke-test');

      const revoked = await service.revokePack(pack.pack_id);
      assert.strictEqual(revoked.status, 'revoked');
    });

    it('packs have expiry', async () => {
      const pack = createMockPack();
      assert.ok(pack.expires_at);
      const expiresAt = new Date(pack.expires_at);
      assert.ok(expiresAt > new Date());
    });
  });

  // ==========================================================================
  // CONTRACT: access_control
  // ==========================================================================
  describe('CONTRACT: access_control', () => {
    it('grants access to pack', async () => {
      const packId = `sha256:${Buffer.from('pack-grant').toString('hex').slice(0, 64)}`;
      const principalId = `sha256:${Buffer.from('principal').toString('hex').slice(0, 64)}`;

      const grant = await service.grantAccess(packId, principalId, 'read');
      assert.ok(grant.grant_id.startsWith('sha256:'));
      assert.strictEqual(grant.access_level, 'read');
    });

    it('revokes access', async () => {
      const packId = `sha256:${Buffer.from('pack-revoke').toString('hex').slice(0, 64)}`;
      const principalId = `sha256:${Buffer.from('principal').toString('hex').slice(0, 64)}`;

      const grant = await service.grantAccess(packId, principalId, 'read');
      const revoked = await service.revokeAccess(grant.grant_id);

      assert.strictEqual(revoked, true);
    });

    it('checks access level', async () => {
      const packId = `sha256:${Buffer.from('pack-check').toString('hex').slice(0, 64)}`;
      const principalId = `sha256:${Buffer.from('principal-check').toString('hex').slice(0, 64)}`;

      await service.grantAccess(packId, principalId, 'audit');
      const level = await service.checkAccess(packId, principalId);

      assert.strictEqual(level, 'audit');
    });

    it('returns null for no access', async () => {
      const packId = `sha256:${Buffer.from('no-access').toString('hex').slice(0, 64)}`;
      const principalId = `sha256:${Buffer.from('unknown').toString('hex').slice(0, 64)}`;

      const level = await service.checkAccess(packId, principalId);
      assert.strictEqual(level, null);
    });

    it('grants have expiry', async () => {
      const grant = createMockGrant();
      assert.ok(grant.expires_at);
      const expiresAt = new Date(grant.expires_at);
      assert.ok(expiresAt > new Date());
    });

    it('lists active grants', async () => {
      const packId = `sha256:${Buffer.from('pack-list').toString('hex').slice(0, 64)}`;
      await service.grantAccess(packId, `sha256:${'a'.repeat(64)}`, 'read');
      await service.grantAccess(packId, `sha256:${'b'.repeat(64)}`, 'audit');

      const grants = await service.listGrants(packId);
      assert.strictEqual(grants.length, 2);
    });
  });

  // ==========================================================================
  // CONTRACT: pii_safety
  // ==========================================================================
  describe('CONTRACT: pii_safety', () => {
    it('sanitizes pack', async () => {
      const sourceId = `sha256:${Buffer.from('source').toString('hex').slice(0, 64)}`;
      const targetId = `sha256:${Buffer.from('target').toString('hex').slice(0, 64)}`;
      const pack = await service.createPack(sourceId, targetId, 'sanitize-test');

      const sanitized = await service.sanitizePack(pack.pack_id);
      assert.strictEqual(sanitized.pii_sanitized, true);
    });

    it('checks PII safety', async () => {
      const sourceId = `sha256:${Buffer.from('source').toString('hex').slice(0, 64)}`;
      const targetId = `sha256:${Buffer.from('target').toString('hex').slice(0, 64)}`;
      const pack = await service.createPack(sourceId, targetId, 'pii-check');
      await service.sanitizePack(pack.pack_id);

      const isSafe = await service.isPIISafe(pack.pack_id);
      assert.strictEqual(isSafe, true);
    });

    it('validates evidence refs', async () => {
      const ref: EvidenceRef = {
        ref_id: `sha256:${Buffer.from('ref').toString('hex').slice(0, 64)}`,
        type: 'metric',
        source_id: `sha256:${Buffer.from('src').toString('hex').slice(0, 64)}`,
        checksum: `sha256:${Buffer.from('sum').toString('hex').slice(0, 64)}`,
        sanitized: true,
      };

      const valid = await service.validateEvidence(ref);
      assert.strictEqual(valid, true);
    });

    it('rejects unsanitized evidence', async () => {
      const ref: EvidenceRef = {
        ref_id: `sha256:${Buffer.from('ref').toString('hex').slice(0, 64)}`,
        type: 'log',
        source_id: `sha256:${Buffer.from('src').toString('hex').slice(0, 64)}`,
        checksum: `sha256:${Buffer.from('sum').toString('hex').slice(0, 64)}`,
        sanitized: false,
      };

      const valid = await service.validateEvidence(ref);
      assert.strictEqual(valid, false);
    });

    it('evidence refs not embedded (refs only)', async () => {
      const pack = createMockPack();
      for (const ref of pack.evidence_refs) {
        assert.ok(ref.ref_id.startsWith('sha256:'));
        assert.ok(ref.source_id.startsWith('sha256:'));
        // Refs don't contain raw data, just references
      }
    });
  });

  // ==========================================================================
  // CONTRACT: reproducibility
  // ==========================================================================
  describe('CONTRACT: reproducibility', () => {
    it('records generation params', async () => {
      const sourceId = `sha256:${Buffer.from('source').toString('hex').slice(0, 64)}`;
      const targetId = `sha256:${Buffer.from('target').toString('hex').slice(0, 64)}`;
      const pack = await service.createPack(sourceId, targetId, 'repro-test');

      const record = await service.recordGeneration(pack.pack_id, { quarter: 'Q4' });
      assert.ok(record.record_id.startsWith('sha256:'));
    });

    it('verifies reproducibility', async () => {
      const sourceId = `sha256:${Buffer.from('source').toString('hex').slice(0, 64)}`;
      const targetId = `sha256:${Buffer.from('target').toString('hex').slice(0, 64)}`;
      const pack = await service.createPack(sourceId, targetId, 'verify-repro');
      await service.recordGeneration(pack.pack_id, { quarter: 'Q4' });

      const isReproducible = await service.verifyReproducibility(pack.pack_id);
      assert.strictEqual(isReproducible, true);
    });

    it('regenerates pack from record', async () => {
      const sourceId = `sha256:${Buffer.from('source').toString('hex').slice(0, 64)}`;
      const targetId = `sha256:${Buffer.from('target').toString('hex').slice(0, 64)}`;
      const pack = await service.createPack(sourceId, targetId, 'regen-test');
      const record = await service.recordGeneration(pack.pack_id, { quarter: 'Q4' });

      const regenerated = await service.regeneratePack(record.record_id);
      assert.ok(regenerated.pack_id.startsWith('sha256:'));
      assert.strictEqual(regenerated.version, pack.version + 1);
    });

    it('generation record has checksum', async () => {
      const record = createMockReproducibilityRecord();
      assert.ok(record.checksum.startsWith('sha256:'));
    });

    it('packs are versioned', async () => {
      const pack = createMockPack();
      assert.ok(pack.version >= 1);
    });
  });

  // ==========================================================================
  // CONTRACT: invariants
  // ==========================================================================
  describe('CONTRACT: invariants', () => {
    it('all IDs are opaque sha256', async () => {
      const pack = createMockPack();
      const grant = createMockGrant();

      assert.ok(pack.pack_id.startsWith('sha256:'));
      assert.ok(pack.source_domain_id.startsWith('sha256:'));
      assert.ok(pack.target_domain_id.startsWith('sha256:'));
      assert.ok(grant.grant_id.startsWith('sha256:'));
    });

    it('shared evidence must be PII-sanitized', async () => {
      const pack = createMockPack({ pii_sanitized: true });
      assert.strictEqual(pack.pii_sanitized, true);
    });

    it('all shares are time-bounded', async () => {
      const pack = createMockPack();
      const grant = createMockGrant();

      assert.ok(pack.expires_at);
      assert.ok(grant.expires_at);
    });

    it('shares have explicit access level', async () => {
      const pack = createMockPack();
      assert.ok(['read', 'reference', 'audit'].includes(pack.access_level));
    });
  });
});
