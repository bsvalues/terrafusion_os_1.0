/**
 * Phase XVIII — Executive Oversight Portal
 * =========================================
 * Contract: portal.federation.contract.test.ts
 *
 * Tests federation posture views for the executive oversight portal,
 * including per-agency trust posture, certification tier, quarantine
 * history, and key/cert rotation status.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Portal views are read-only
 * - Federation data references evidence via sha256: links
 * - No embedded PII in agency data
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type AgencyId = `sha256:${string}`;
type CertificateId = `sha256:${string}`;
type KeyId = `sha256:${string}`;
type QuarantineId = `sha256:${string}`;
type EvidenceRef = `sha256:${string}`;

type CertificationTier = 'platinum' | 'gold' | 'silver' | 'bronze' | 'pending';
type TrustLevel = 'full' | 'limited' | 'probation' | 'suspended';
type QuarantineStatus = 'active' | 'lifted' | 'expired';
type RotationStatus = 'current' | 'expiring_soon' | 'expired' | 'revoked';

interface AgencyRecord {
  readonly id: AgencyId;
  readonly displayCode: string;
  readonly certificationTier: CertificationTier;
  readonly trustLevel: TrustLevel;
  readonly onboardedAt: string;
  readonly lastAuditAt: string;
  readonly evidenceRef: EvidenceRef;
}

interface CertificateRecord {
  readonly id: CertificateId;
  readonly agencyId: AgencyId;
  readonly purpose: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly status: RotationStatus;
  readonly evidenceRef: EvidenceRef;
}

interface KeyRecord {
  readonly id: KeyId;
  readonly agencyId: AgencyId;
  readonly keyType: 'signing' | 'encryption' | 'authentication';
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly status: RotationStatus;
  readonly lastRotatedAt?: string;
}

interface QuarantineRecord {
  readonly id: QuarantineId;
  readonly agencyId: AgencyId;
  readonly reason: string;
  readonly startedAt: string;
  readonly liftedAt?: string;
  readonly status: QuarantineStatus;
  readonly evidenceRef: EvidenceRef;
}

interface AgencyTrustPosture {
  readonly agencyId: AgencyId;
  readonly displayCode: string;
  readonly certificationTier: CertificationTier;
  readonly trustLevel: TrustLevel;
  readonly certificateHealth: { current: number; expiringSoon: number; expired: number };
  readonly keyHealth: { current: number; expiringSoon: number; expired: number };
  readonly activeQuarantines: number;
  readonly lastAuditAge: number; // days since last audit
}

interface FederationSummary {
  readonly generatedAt: string;
  readonly totalAgencies: number;
  readonly byTier: Record<CertificationTier, number>;
  readonly byTrust: Record<TrustLevel, number>;
  readonly certificateAlerts: number;
  readonly keyRotationAlerts: number;
  readonly activeQuarantines: number;
  readonly overallFederationHealth: number;
}

interface FederationPortalView {
  readonly generatedAt: string;
  readonly summary: FederationSummary;
  readonly agencies: readonly AgencyTrustPosture[];
  readonly pendingRotations: readonly (CertificateRecord | KeyRecord)[];
  readonly activeQuarantines: readonly QuarantineRecord[];
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockFederationPortalService() {
  const agencies = new Map<AgencyId, AgencyRecord>();
  const certificates = new Map<CertificateId, CertificateRecord>();
  const keys = new Map<KeyId, KeyRecord>();
  const quarantines = new Map<QuarantineId, QuarantineRecord>();

  function generateId(prefix: string): AgencyId {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}` as AgencyId;
  }

  function daysSince(dateStr: string): number {
    const date = new Date(dateStr);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  function computeRotationStatus(expiresAt: string): RotationStatus {
    const expires = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring_soon';
    return 'current';
  }

  return {
    // Agency Management
    registerAgency(
      displayCode: string,
      certificationTier: CertificationTier,
      onboardedAt: string,
      lastAuditAt: string,
      evidenceRef: EvidenceRef
    ): AgencyRecord {
      const id = generateId('agency');
      const record: AgencyRecord = {
        id,
        displayCode,
        certificationTier,
        trustLevel:
          certificationTier === 'platinum' || certificationTier === 'gold' ? 'full' : 'limited',
        onboardedAt,
        lastAuditAt,
        evidenceRef,
      };
      agencies.set(id, record);
      return record;
    },

    updateAgencyTrust(agencyId: AgencyId, trustLevel: TrustLevel): AgencyRecord | null {
      const agency = agencies.get(agencyId);
      if (!agency) return null;

      const updated: AgencyRecord = { ...agency, trustLevel };
      agencies.set(agencyId, updated);
      return updated;
    },

    getAgency(agencyId: AgencyId): AgencyRecord | undefined {
      return agencies.get(agencyId);
    },

    getAgencies(): readonly AgencyRecord[] {
      return [...agencies.values()];
    },

    // Certificate Management
    registerCertificate(
      agencyId: AgencyId,
      purpose: string,
      issuedAt: string,
      expiresAt: string,
      evidenceRef: EvidenceRef
    ): CertificateRecord {
      const id = generateId('cert') as CertificateId;
      const status = computeRotationStatus(expiresAt);
      const record: CertificateRecord = {
        id,
        agencyId,
        purpose,
        issuedAt,
        expiresAt,
        status,
        evidenceRef,
      };
      certificates.set(id, record);
      return record;
    },

    getCertificates(agencyId?: AgencyId): readonly CertificateRecord[] {
      const all = [...certificates.values()];
      return agencyId ? all.filter(c => c.agencyId === agencyId) : all;
    },

    // Key Management
    registerKey(
      agencyId: AgencyId,
      keyType: 'signing' | 'encryption' | 'authentication',
      createdAt: string,
      expiresAt: string
    ): KeyRecord {
      const id = generateId('key') as KeyId;
      const status = computeRotationStatus(expiresAt);
      const record: KeyRecord = {
        id,
        agencyId,
        keyType,
        createdAt,
        expiresAt,
        status,
        lastRotatedAt: undefined,
      };
      keys.set(id, record);
      return record;
    },

    rotateKey(keyId: KeyId, newExpiresAt: string): KeyRecord | null {
      const key = keys.get(keyId);
      if (!key) return null;

      const updated: KeyRecord = {
        ...key,
        expiresAt: newExpiresAt,
        status: computeRotationStatus(newExpiresAt),
        lastRotatedAt: new Date().toISOString(),
      };
      keys.set(keyId, updated);
      return updated;
    },

    getKeys(agencyId?: AgencyId): readonly KeyRecord[] {
      const all = [...keys.values()];
      return agencyId ? all.filter(k => k.agencyId === agencyId) : all;
    },

    // Quarantine Management
    quarantineAgency(
      agencyId: AgencyId,
      reason: string,
      startedAt: string,
      evidenceRef: EvidenceRef
    ): QuarantineRecord {
      const id = generateId('quarantine') as QuarantineId;
      const record: QuarantineRecord = {
        id,
        agencyId,
        reason,
        startedAt,
        liftedAt: undefined,
        status: 'active',
        evidenceRef,
      };
      quarantines.set(id, record);

      // Update agency trust level
      this.updateAgencyTrust(agencyId, 'suspended');

      return record;
    },

    liftQuarantine(quarantineId: QuarantineId): QuarantineRecord | null {
      const quarantine = quarantines.get(quarantineId);
      if (!quarantine) return null;

      const updated: QuarantineRecord = {
        ...quarantine,
        liftedAt: new Date().toISOString(),
        status: 'lifted',
      };
      quarantines.set(quarantineId, updated);

      // Restore agency trust to probation
      this.updateAgencyTrust(quarantine.agencyId, 'probation');

      return updated;
    },

    getQuarantines(status?: QuarantineStatus): readonly QuarantineRecord[] {
      const all = [...quarantines.values()];
      return status ? all.filter(q => q.status === status) : all;
    },

    // Trust Posture Calculation
    calculateAgencyTrustPosture(agencyId: AgencyId): AgencyTrustPosture | null {
      const agency = agencies.get(agencyId);
      if (!agency) return null;

      const agencyCerts = this.getCertificates(agencyId);
      const agencyKeys = this.getKeys(agencyId);
      const agencyQuarantines = this.getQuarantines('active').filter(q => q.agencyId === agencyId);

      const certHealth = {
        current: agencyCerts.filter(c => c.status === 'current').length,
        expiringSoon: agencyCerts.filter(c => c.status === 'expiring_soon').length,
        expired: agencyCerts.filter(c => c.status === 'expired').length,
      };

      const keyHealth = {
        current: agencyKeys.filter(k => k.status === 'current').length,
        expiringSoon: agencyKeys.filter(k => k.status === 'expiring_soon').length,
        expired: agencyKeys.filter(k => k.status === 'expired').length,
      };

      return {
        agencyId,
        displayCode: agency.displayCode,
        certificationTier: agency.certificationTier,
        trustLevel: agency.trustLevel,
        certificateHealth: certHealth,
        keyHealth: keyHealth,
        activeQuarantines: agencyQuarantines.length,
        lastAuditAge: daysSince(agency.lastAuditAt),
      };
    },

    // Federation Summary
    getFederationSummary(): FederationSummary {
      const allAgencies = this.getAgencies();
      const allCerts = this.getCertificates();
      const allKeys = this.getKeys();
      const allQuarantines = this.getQuarantines('active');

      const byTier: Record<CertificationTier, number> = {
        platinum: 0,
        gold: 0,
        silver: 0,
        bronze: 0,
        pending: 0,
      };

      const byTrust: Record<TrustLevel, number> = {
        full: 0,
        limited: 0,
        probation: 0,
        suspended: 0,
      };

      for (const agency of allAgencies) {
        byTier[agency.certificationTier]++;
        byTrust[agency.trustLevel]++;
      }

      const certAlerts = allCerts.filter(
        c => c.status === 'expiring_soon' || c.status === 'expired'
      ).length;
      const keyAlerts = allKeys.filter(
        k => k.status === 'expiring_soon' || k.status === 'expired'
      ).length;

      // Calculate health score
      const tierScore =
        ((byTier.platinum * 4 + byTier.gold * 3 + byTier.silver * 2 + byTier.bronze * 1) /
          (allAgencies.length * 4 || 1)) *
        40;
      const trustScore =
        ((byTrust.full * 3 + byTrust.limited * 2 + byTrust.probation * 1) /
          (allAgencies.length * 3 || 1)) *
        30;
      const alertPenalty = Math.min((certAlerts + keyAlerts) * 5, 20);
      const quarantinePenalty = Math.min(allQuarantines.length * 10, 30);

      return {
        generatedAt: new Date().toISOString(),
        totalAgencies: allAgencies.length,
        byTier,
        byTrust,
        certificateAlerts: certAlerts,
        keyRotationAlerts: keyAlerts,
        activeQuarantines: allQuarantines.length,
        overallFederationHealth: Math.max(
          0,
          Math.round(tierScore + trustScore - alertPenalty - quarantinePenalty)
        ),
      };
    },

    // Full Portal View
    generateFederationView(): FederationPortalView {
      const allAgencies = this.getAgencies();
      const agencyPostures: AgencyTrustPosture[] = [];

      for (const agency of allAgencies) {
        const posture = this.calculateAgencyTrustPosture(agency.id);
        if (posture) agencyPostures.push(posture);
      }

      const allCerts = this.getCertificates();
      const allKeys = this.getKeys();
      const pendingRotations: (CertificateRecord | KeyRecord)[] = [
        ...allCerts.filter(c => c.status === 'expiring_soon' || c.status === 'expired'),
        ...allKeys.filter(k => k.status === 'expiring_soon' || k.status === 'expired'),
      ];

      return {
        generatedAt: new Date().toISOString(),
        summary: this.getFederationSummary(),
        agencies: agencyPostures,
        pendingRotations,
        activeQuarantines: [...this.getQuarantines('active')],
      };
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XVIII: Portal Federation Contracts', () => {
  let portal: ReturnType<typeof createMockFederationPortalService>;

  beforeEach(() => {
    portal = createMockFederationPortalService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate agency IDs with sha256: prefix', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:evidence_1' as EvidenceRef
      );
      assert.ok(agency.id.startsWith('sha256:'));
    });

    it('should generate certificate IDs with sha256: prefix', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const cert = portal.registerCertificate(
        agency.id,
        'API Access',
        '2025-01-01T00:00:00Z',
        '2027-01-01T00:00:00Z',
        'sha256:cert_evidence_1' as EvidenceRef
      );
      assert.ok(cert.id.startsWith('sha256:'));
    });

    it('should generate key IDs with sha256: prefix', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const key = portal.registerKey(
        agency.id,
        'signing',
        '2025-01-01T00:00:00Z',
        '2027-01-01T00:00:00Z'
      );
      assert.ok(key.id.startsWith('sha256:'));
    });

    it('should generate quarantine IDs with sha256: prefix', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const quarantine = portal.quarantineAgency(
        agency.id,
        'Security violation',
        '2026-01-15T00:00:00Z',
        'sha256:quarantine_evidence_1' as EvidenceRef
      );
      assert.ok(quarantine.id.startsWith('sha256:'));
    });

    it('should require sha256: evidence references', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:evidence_abc' as EvidenceRef
      );
      assert.ok(agency.evidenceRef.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Agency Management Tests
  // ==========================================================================

  describe('Agency Management', () => {
    it('should register new agency', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      assert.strictEqual(agency.displayCode, 'AGY-001');
      assert.strictEqual(agency.certificationTier, 'gold');
    });

    it('should set initial trust level based on tier', () => {
      const platinum = portal.registerAgency(
        'AGY-P',
        'platinum',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const gold = portal.registerAgency(
        'AGY-G',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e2' as EvidenceRef
      );
      const silver = portal.registerAgency(
        'AGY-S',
        'silver',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e3' as EvidenceRef
      );

      assert.strictEqual(platinum.trustLevel, 'full');
      assert.strictEqual(gold.trustLevel, 'full');
      assert.strictEqual(silver.trustLevel, 'limited');
    });

    it('should update agency trust level', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'silver',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const updated = portal.updateAgencyTrust(agency.id, 'probation');

      assert.strictEqual(updated?.trustLevel, 'probation');
    });

    it('should list all agencies', () => {
      portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.registerAgency(
        'AGY-002',
        'silver',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e2' as EvidenceRef
      );

      const agencies = portal.getAgencies();
      assert.strictEqual(agencies.length, 2);
    });
  });

  // ==========================================================================
  // Certificate Management Tests
  // ==========================================================================

  describe('Certificate Management', () => {
    it('should register certificate', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const cert = portal.registerCertificate(
        agency.id,
        'API Access',
        '2025-01-01T00:00:00Z',
        '2027-01-01T00:00:00Z',
        'sha256:cert_e1' as EvidenceRef
      );

      assert.strictEqual(cert.purpose, 'API Access');
      assert.strictEqual(cert.agencyId, agency.id);
    });

    it('should compute current status for valid certs', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const cert = portal.registerCertificate(
        agency.id,
        'API Access',
        '2025-01-01T00:00:00Z',
        '2027-01-01T00:00:00Z', // Far in future
        'sha256:cert_e1' as EvidenceRef
      );

      assert.strictEqual(cert.status, 'current');
    });

    it('should mark expired certs', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const cert = portal.registerCertificate(
        agency.id,
        'API Access',
        '2024-01-01T00:00:00Z',
        '2025-01-01T00:00:00Z', // In the past
        'sha256:cert_e1' as EvidenceRef
      );

      assert.strictEqual(cert.status, 'expired');
    });

    it('should filter certificates by agency', () => {
      const agency1 = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const agency2 = portal.registerAgency(
        'AGY-002',
        'silver',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e2' as EvidenceRef
      );

      portal.registerCertificate(
        agency1.id,
        'Cert A',
        '2025-01-01T00:00:00Z',
        '2027-01-01T00:00:00Z',
        'sha256:c1' as EvidenceRef
      );
      portal.registerCertificate(
        agency1.id,
        'Cert B',
        '2025-01-01T00:00:00Z',
        '2027-01-01T00:00:00Z',
        'sha256:c2' as EvidenceRef
      );
      portal.registerCertificate(
        agency2.id,
        'Cert C',
        '2025-01-01T00:00:00Z',
        '2027-01-01T00:00:00Z',
        'sha256:c3' as EvidenceRef
      );

      const agency1Certs = portal.getCertificates(agency1.id);
      assert.strictEqual(agency1Certs.length, 2);
    });
  });

  // ==========================================================================
  // Key Management Tests
  // ==========================================================================

  describe('Key Management', () => {
    it('should register key', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const key = portal.registerKey(
        agency.id,
        'signing',
        '2025-01-01T00:00:00Z',
        '2027-01-01T00:00:00Z'
      );

      assert.strictEqual(key.keyType, 'signing');
    });

    it('should rotate key', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const key = portal.registerKey(
        agency.id,
        'encryption',
        '2025-01-01T00:00:00Z',
        '2027-01-01T00:00:00Z'
      );

      const rotated = portal.rotateKey(key.id, '2028-01-01T00:00:00Z');
      assert.ok(rotated?.lastRotatedAt);
      assert.strictEqual(rotated?.expiresAt, '2028-01-01T00:00:00Z');
    });

    it('should track expired keys', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const key = portal.registerKey(
        agency.id,
        'authentication',
        '2024-01-01T00:00:00Z',
        '2025-01-01T00:00:00Z' // Expired
      );

      assert.strictEqual(key.status, 'expired');
    });

    it('should filter keys by agency', () => {
      const agency1 = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const agency2 = portal.registerAgency(
        'AGY-002',
        'silver',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e2' as EvidenceRef
      );

      portal.registerKey(agency1.id, 'signing', '2025-01-01T00:00:00Z', '2027-01-01T00:00:00Z');
      portal.registerKey(agency2.id, 'encryption', '2025-01-01T00:00:00Z', '2027-01-01T00:00:00Z');
      portal.registerKey(
        agency2.id,
        'authentication',
        '2025-01-01T00:00:00Z',
        '2027-01-01T00:00:00Z'
      );

      const agency2Keys = portal.getKeys(agency2.id);
      assert.strictEqual(agency2Keys.length, 2);
    });
  });

  // ==========================================================================
  // Quarantine Tests
  // ==========================================================================

  describe('Quarantine Management', () => {
    it('should quarantine agency', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const quarantine = portal.quarantineAgency(
        agency.id,
        'Security incident',
        '2026-01-15T00:00:00Z',
        'sha256:q1' as EvidenceRef
      );

      assert.strictEqual(quarantine.status, 'active');
      assert.strictEqual(quarantine.reason, 'Security incident');
    });

    it('should suspend agency trust on quarantine', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.quarantineAgency(
        agency.id,
        'Breach',
        '2026-01-15T00:00:00Z',
        'sha256:q1' as EvidenceRef
      );

      const updated = portal.getAgency(agency.id);
      assert.strictEqual(updated?.trustLevel, 'suspended');
    });

    it('should lift quarantine', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const quarantine = portal.quarantineAgency(
        agency.id,
        'Breach',
        '2026-01-15T00:00:00Z',
        'sha256:q1' as EvidenceRef
      );

      const lifted = portal.liftQuarantine(quarantine.id);
      assert.strictEqual(lifted?.status, 'lifted');
      assert.ok(lifted?.liftedAt);
    });

    it('should set probation trust on lift', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const quarantine = portal.quarantineAgency(
        agency.id,
        'Breach',
        '2026-01-15T00:00:00Z',
        'sha256:q1' as EvidenceRef
      );
      portal.liftQuarantine(quarantine.id);

      const updated = portal.getAgency(agency.id);
      assert.strictEqual(updated?.trustLevel, 'probation');
    });

    it('should filter quarantines by status', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const q1 = portal.quarantineAgency(
        agency.id,
        'Incident 1',
        '2026-01-15T00:00:00Z',
        'sha256:q1' as EvidenceRef
      );
      portal.quarantineAgency(
        agency.id,
        'Incident 2',
        '2026-01-16T00:00:00Z',
        'sha256:q2' as EvidenceRef
      );
      portal.liftQuarantine(q1.id);

      const active = portal.getQuarantines('active');
      const lifted = portal.getQuarantines('lifted');

      assert.strictEqual(active.length, 1);
      assert.strictEqual(lifted.length, 1);
    });
  });

  // ==========================================================================
  // Trust Posture Tests
  // ==========================================================================

  describe('Trust Posture Calculation', () => {
    it('should calculate agency trust posture', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.registerCertificate(
        agency.id,
        'API',
        '2025-01-01T00:00:00Z',
        '2027-01-01T00:00:00Z',
        'sha256:c1' as EvidenceRef
      );
      portal.registerKey(agency.id, 'signing', '2025-01-01T00:00:00Z', '2027-01-01T00:00:00Z');

      const posture = portal.calculateAgencyTrustPosture(agency.id);
      assert.ok(posture);
      assert.strictEqual(posture.displayCode, 'AGY-001');
    });

    it('should track certificate health', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.registerCertificate(
        agency.id,
        'Valid',
        '2025-01-01T00:00:00Z',
        '2027-01-01T00:00:00Z',
        'sha256:c1' as EvidenceRef
      );
      portal.registerCertificate(
        agency.id,
        'Expired',
        '2024-01-01T00:00:00Z',
        '2025-01-01T00:00:00Z',
        'sha256:c2' as EvidenceRef
      );

      const posture = portal.calculateAgencyTrustPosture(agency.id);
      assert.strictEqual(posture?.certificateHealth.current, 1);
      assert.strictEqual(posture?.certificateHealth.expired, 1);
    });

    it('should track key health', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.registerKey(agency.id, 'signing', '2025-01-01T00:00:00Z', '2027-01-01T00:00:00Z');
      portal.registerKey(agency.id, 'encryption', '2024-01-01T00:00:00Z', '2025-01-01T00:00:00Z'); // Expired

      const posture = portal.calculateAgencyTrustPosture(agency.id);
      assert.strictEqual(posture?.keyHealth.current, 1);
      assert.strictEqual(posture?.keyHealth.expired, 1);
    });

    it('should count active quarantines', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.quarantineAgency(
        agency.id,
        'Incident',
        '2026-01-15T00:00:00Z',
        'sha256:q1' as EvidenceRef
      );

      const posture = portal.calculateAgencyTrustPosture(agency.id);
      assert.strictEqual(posture?.activeQuarantines, 1);
    });
  });

  // ==========================================================================
  // Federation Summary Tests
  // ==========================================================================

  describe('Federation Summary', () => {
    it('should count agencies by tier', () => {
      portal.registerAgency(
        'AGY-P',
        'platinum',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.registerAgency(
        'AGY-G1',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e2' as EvidenceRef
      );
      portal.registerAgency(
        'AGY-G2',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e3' as EvidenceRef
      );
      portal.registerAgency(
        'AGY-S',
        'silver',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e4' as EvidenceRef
      );

      const summary = portal.getFederationSummary();
      assert.strictEqual(summary.byTier.platinum, 1);
      assert.strictEqual(summary.byTier.gold, 2);
      assert.strictEqual(summary.byTier.silver, 1);
    });

    it('should count agencies by trust level', () => {
      portal.registerAgency(
        'AGY-P',
        'platinum',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.registerAgency(
        'AGY-S',
        'silver',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e2' as EvidenceRef
      );

      const summary = portal.getFederationSummary();
      assert.strictEqual(summary.byTrust.full, 1); // platinum = full
      assert.strictEqual(summary.byTrust.limited, 1); // silver = limited
    });

    it('should count certificate alerts', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.registerCertificate(
        agency.id,
        'Valid',
        '2025-01-01T00:00:00Z',
        '2027-01-01T00:00:00Z',
        'sha256:c1' as EvidenceRef
      );
      portal.registerCertificate(
        agency.id,
        'Expired',
        '2024-01-01T00:00:00Z',
        '2025-01-01T00:00:00Z',
        'sha256:c2' as EvidenceRef
      );

      const summary = portal.getFederationSummary();
      assert.strictEqual(summary.certificateAlerts, 1);
    });

    it('should count key rotation alerts', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.registerKey(agency.id, 'signing', '2025-01-01T00:00:00Z', '2027-01-01T00:00:00Z');
      portal.registerKey(agency.id, 'encryption', '2024-01-01T00:00:00Z', '2025-01-01T00:00:00Z'); // Expired

      const summary = portal.getFederationSummary();
      assert.strictEqual(summary.keyRotationAlerts, 1);
    });

    it('should count active quarantines', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.quarantineAgency(
        agency.id,
        'Incident',
        '2026-01-15T00:00:00Z',
        'sha256:q1' as EvidenceRef
      );

      const summary = portal.getFederationSummary();
      assert.strictEqual(summary.activeQuarantines, 1);
    });

    it('should calculate overall federation health', () => {
      portal.registerAgency(
        'AGY-P',
        'platinum',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );

      const summary = portal.getFederationSummary();
      assert.ok(summary.overallFederationHealth >= 0);
      assert.ok(summary.overallFederationHealth <= 100);
    });
  });

  // ==========================================================================
  // Portal View Tests
  // ==========================================================================

  describe('Federation Portal View', () => {
    it('should generate complete portal view', () => {
      portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );

      const view = portal.generateFederationView();
      assert.ok(view.generatedAt);
      assert.ok(view.summary);
      assert.ok(view.agencies);
      assert.ok(view.pendingRotations);
      assert.ok(view.activeQuarantines);
    });

    it('should include all agency postures', () => {
      portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.registerAgency(
        'AGY-002',
        'silver',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e2' as EvidenceRef
      );

      const view = portal.generateFederationView();
      assert.strictEqual(view.agencies.length, 2);
    });

    it('should include pending rotations', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.registerCertificate(
        agency.id,
        'Expired',
        '2024-01-01T00:00:00Z',
        '2025-01-01T00:00:00Z',
        'sha256:c1' as EvidenceRef
      );
      portal.registerKey(agency.id, 'signing', '2024-01-01T00:00:00Z', '2025-01-01T00:00:00Z');

      const view = portal.generateFederationView();
      assert.strictEqual(view.pendingRotations.length, 2);
    });

    it('should include active quarantines', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.quarantineAgency(
        agency.id,
        'Incident',
        '2026-01-15T00:00:00Z',
        'sha256:q1' as EvidenceRef
      );

      const view = portal.generateFederationView();
      assert.strictEqual(view.activeQuarantines.length, 1);
    });
  });

  // ==========================================================================
  // Read-Only Invariant Tests
  // ==========================================================================

  describe('Read-Only Portal Invariants', () => {
    it('should return copies of agency arrays', () => {
      portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      const agencies1 = portal.getAgencies();
      const agencies2 = portal.getAgencies();
      assert.notStrictEqual(agencies1, agencies2);
    });

    it('should return copies of certificate arrays', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.registerCertificate(
        agency.id,
        'API',
        '2025-01-01T00:00:00Z',
        '2027-01-01T00:00:00Z',
        'sha256:c1' as EvidenceRef
      );
      const certs1 = portal.getCertificates();
      const certs2 = portal.getCertificates();
      assert.notStrictEqual(certs1, certs2);
    });

    it('should return copies of quarantine arrays', () => {
      const agency = portal.registerAgency(
        'AGY-001',
        'gold',
        '2025-01-01T00:00:00Z',
        '2025-12-01T00:00:00Z',
        'sha256:e1' as EvidenceRef
      );
      portal.quarantineAgency(
        agency.id,
        'Incident',
        '2026-01-15T00:00:00Z',
        'sha256:q1' as EvidenceRef
      );
      const q1 = portal.getQuarantines();
      const q2 = portal.getQuarantines();
      assert.notStrictEqual(q1, q2);
    });
  });
});
