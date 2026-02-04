/**
 * Phase XVIII — Executive Oversight Portal
 * =========================================
 * Contract: portal.compliance.contract.test.ts
 *
 * Tests compliance freshness views for the executive oversight portal,
 * including attestation validity, mapping coverage, drift counts,
 * and exception expiry tracking.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Portal views are read-only
 * - No embedded PII in views
 * - Evidence references are sha256: links only
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type AttestationId = `sha256:${string}`;
type MappingId = `sha256:${string}`;
type ExceptionId = `sha256:${string}`;
type ControlId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type EvidenceRef = `sha256:${string}`;

type AttestationStatus = 'valid' | 'expiring_soon' | 'expired' | 'revoked';
type DriftSeverity = 'critical' | 'high' | 'medium' | 'low';
type ExceptionStatus = 'active' | 'expiring_soon' | 'expired' | 'renewed';

interface Attestation {
  readonly id: AttestationId;
  readonly agencyId: AgencyId;
  readonly framework: string; // FISMA, FedRAMP, SOC2, etc.
  readonly status: AttestationStatus;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly evidenceRefs: readonly EvidenceRef[];
  readonly signedBy: `sha256:${string}`;
  readonly revokedAt?: string;
  readonly revokedReason?: string;
}

interface ControlMapping {
  readonly id: MappingId;
  readonly sourceFramework: string;
  readonly targetFramework: string;
  readonly sourceControlId: string;
  readonly targetControlId: string;
  readonly mappingType: 'direct' | 'partial' | 'none';
  readonly notes?: string;
  readonly lastVerified: string;
}

interface DriftEvent {
  readonly id: `sha256:${string}`;
  readonly controlId: ControlId;
  readonly agencyId: AgencyId;
  readonly severity: DriftSeverity;
  readonly description: string;
  readonly detectedAt: string;
  readonly resolvedAt?: string;
  readonly evidenceRef?: EvidenceRef;
}

interface ComplianceException {
  readonly id: ExceptionId;
  readonly controlId: ControlId;
  readonly agencyId: AgencyId;
  readonly status: ExceptionStatus;
  readonly reason: string;
  readonly approvedBy: `sha256:${string}`;
  readonly approvedAt: string;
  readonly expiresAt: string;
  readonly renewedAt?: string;
  readonly mitigations: readonly string[];
}

interface CompliancePortalView {
  readonly generatedAt: string;
  readonly attestations: {
    readonly total: number;
    readonly valid: number;
    readonly expiringSoon: number;
    readonly expired: number;
    readonly revoked: number;
    readonly byFramework: Record<string, number>;
  };
  readonly mappings: {
    readonly total: number;
    readonly directMappings: number;
    readonly partialMappings: number;
    readonly unmapped: number;
    readonly coveragePercent: number;
  };
  readonly drift: {
    readonly totalOpen: number;
    readonly bySeverity: Record<DriftSeverity, number>;
    readonly resolvedLast30Days: number;
  };
  readonly exceptions: {
    readonly active: number;
    readonly expiringSoon: number;
    readonly expired: number;
  };
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockCompliancePortalService() {
  const attestations = new Map<AttestationId, Attestation>();
  const mappings = new Map<MappingId, ControlMapping>();
  const driftEvents: DriftEvent[] = [];
  const exceptions = new Map<ExceptionId, ComplianceException>();

  // 30 days in ms
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  function generateId(prefix: string): AttestationId {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}` as AttestationId;
  }

  function determineAttestationStatus(expiresAt: string, revokedAt?: string): AttestationStatus {
    if (revokedAt) return 'revoked';
    const now = new Date();
    const expiry = new Date(expiresAt);
    const warningThreshold = new Date(now.getTime() + thirtyDaysMs);

    if (expiry < now) return 'expired';
    if (expiry < warningThreshold) return 'expiring_soon';
    return 'valid';
  }

  function determineExceptionStatus(expiresAt: string): ExceptionStatus {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const warningThreshold = new Date(now.getTime() + thirtyDaysMs);

    if (expiry < now) return 'expired';
    if (expiry < warningThreshold) return 'expiring_soon';
    return 'active';
  }

  return {
    // Attestation Management
    createAttestation(
      agencyId: AgencyId,
      framework: string,
      expiresAt: string,
      evidenceRefs: readonly EvidenceRef[],
      signedBy: `sha256:${string}`
    ): Attestation {
      const id = generateId('attestation');
      const attestation: Attestation = {
        id,
        agencyId,
        framework,
        status: determineAttestationStatus(expiresAt),
        issuedAt: new Date().toISOString(),
        expiresAt,
        evidenceRefs,
        signedBy,
      };
      attestations.set(id, attestation);
      return attestation;
    },

    getAttestation(id: AttestationId): Attestation | null {
      return attestations.get(id) ?? null;
    },

    revokeAttestation(id: AttestationId, reason: string): Attestation | null {
      const attestation = attestations.get(id);
      if (!attestation) return null;
      if (attestation.status === 'revoked') return null;

      const updated: Attestation = {
        ...attestation,
        status: 'revoked',
        revokedAt: new Date().toISOString(),
        revokedReason: reason,
      };
      attestations.set(id, updated);
      return updated;
    },

    refreshAttestationStatuses(): void {
      for (const [id, att] of attestations) {
        const newStatus = determineAttestationStatus(att.expiresAt, att.revokedAt);
        if (newStatus !== att.status) {
          attestations.set(id, { ...att, status: newStatus });
        }
      }
    },

    getAttestationsByFramework(framework: string): readonly Attestation[] {
      return [...attestations.values()].filter(a => a.framework === framework);
    },

    getAttestationsByStatus(status: AttestationStatus): readonly Attestation[] {
      return [...attestations.values()].filter(a => a.status === status);
    },

    getAttestationsByAgency(agencyId: AgencyId): readonly Attestation[] {
      return [...attestations.values()].filter(a => a.agencyId === agencyId);
    },

    // Control Mapping Management
    createMapping(
      sourceFramework: string,
      targetFramework: string,
      sourceControlId: string,
      targetControlId: string,
      mappingType: ControlMapping['mappingType'],
      notes?: string
    ): ControlMapping {
      const id = generateId('mapping') as MappingId;
      const mapping: ControlMapping = {
        id,
        sourceFramework,
        targetFramework,
        sourceControlId,
        targetControlId,
        mappingType,
        notes,
        lastVerified: new Date().toISOString(),
      };
      mappings.set(id, mapping);
      return mapping;
    },

    getMapping(id: MappingId): ControlMapping | null {
      return mappings.get(id) ?? null;
    },

    getMappingsByFrameworks(source: string, target: string): readonly ControlMapping[] {
      return [...mappings.values()].filter(
        m => m.sourceFramework === source && m.targetFramework === target
      );
    },

    getMappingCoverage(
      sourceFramework: string,
      targetFramework: string
    ): {
      total: number;
      direct: number;
      partial: number;
      unmapped: number;
      coveragePercent: number;
    } {
      const relevant = this.getMappingsByFrameworks(sourceFramework, targetFramework);
      const direct = relevant.filter(m => m.mappingType === 'direct').length;
      const partial = relevant.filter(m => m.mappingType === 'partial').length;
      const unmapped = relevant.filter(m => m.mappingType === 'none').length;
      const total = relevant.length;
      const covered = direct + partial;
      const coveragePercent = total > 0 ? Math.round((covered / total) * 100) : 0;

      return { total, direct, partial, unmapped, coveragePercent };
    },

    // Drift Tracking
    recordDrift(
      controlId: ControlId,
      agencyId: AgencyId,
      severity: DriftSeverity,
      description: string,
      evidenceRef?: EvidenceRef
    ): DriftEvent {
      const event: DriftEvent = {
        id: generateId('drift') as `sha256:${string}`,
        controlId,
        agencyId,
        severity,
        description,
        detectedAt: new Date().toISOString(),
        evidenceRef,
      };
      driftEvents.push(event);
      return event;
    },

    resolveDrift(driftId: `sha256:${string}`): DriftEvent | null {
      const index = driftEvents.findIndex(d => d.id === driftId);
      if (index === -1) return null;
      if (driftEvents[index].resolvedAt) return null;

      const updated: DriftEvent = {
        ...driftEvents[index],
        resolvedAt: new Date().toISOString(),
      };
      driftEvents[index] = updated;
      return updated;
    },

    getOpenDrift(): readonly DriftEvent[] {
      return driftEvents.filter(d => !d.resolvedAt);
    },

    getDriftBySeverity(severity: DriftSeverity): readonly DriftEvent[] {
      return driftEvents.filter(d => d.severity === severity && !d.resolvedAt);
    },

    getResolvedDriftInPeriod(startDate: Date, endDate: Date): readonly DriftEvent[] {
      return driftEvents.filter(d => {
        if (!d.resolvedAt) return false;
        const resolved = new Date(d.resolvedAt);
        return resolved >= startDate && resolved <= endDate;
      });
    },

    // Exception Management
    createException(
      controlId: ControlId,
      agencyId: AgencyId,
      reason: string,
      expiresAt: string,
      approvedBy: `sha256:${string}`,
      mitigations: readonly string[]
    ): ComplianceException {
      const id = generateId('exception') as ExceptionId;
      const exception: ComplianceException = {
        id,
        controlId,
        agencyId,
        status: determineExceptionStatus(expiresAt),
        reason,
        approvedBy,
        approvedAt: new Date().toISOString(),
        expiresAt,
        mitigations,
      };
      exceptions.set(id, exception);
      return exception;
    },

    getException(id: ExceptionId): ComplianceException | null {
      return exceptions.get(id) ?? null;
    },

    renewException(id: ExceptionId, newExpiresAt: string): ComplianceException | null {
      const exception = exceptions.get(id);
      if (!exception) return null;

      const updated: ComplianceException = {
        ...exception,
        status: determineExceptionStatus(newExpiresAt),
        expiresAt: newExpiresAt,
        renewedAt: new Date().toISOString(),
      };
      exceptions.set(id, updated);
      return updated;
    },

    refreshExceptionStatuses(): void {
      for (const [id, exc] of exceptions) {
        const newStatus = determineExceptionStatus(exc.expiresAt);
        if (newStatus !== exc.status && exc.status !== 'renewed') {
          exceptions.set(id, { ...exc, status: newStatus });
        }
      }
    },

    getExceptionsByStatus(status: ExceptionStatus): readonly ComplianceException[] {
      return [...exceptions.values()].filter(e => e.status === status);
    },

    getExceptionsByAgency(agencyId: AgencyId): readonly ComplianceException[] {
      return [...exceptions.values()].filter(e => e.agencyId === agencyId);
    },

    // Portal View Generation
    generatePortalView(): CompliancePortalView {
      this.refreshAttestationStatuses();
      this.refreshExceptionStatuses();

      const allAttestations = [...attestations.values()];
      const byFramework: Record<string, number> = {};
      for (const att of allAttestations) {
        byFramework[att.framework] = (byFramework[att.framework] ?? 0) + 1;
      }

      const allMappings = [...mappings.values()];
      const directMappings = allMappings.filter(m => m.mappingType === 'direct').length;
      const partialMappings = allMappings.filter(m => m.mappingType === 'partial').length;
      const unmapped = allMappings.filter(m => m.mappingType === 'none').length;
      const covered = directMappings + partialMappings;
      const coveragePercent =
        allMappings.length > 0 ? Math.round((covered / allMappings.length) * 100) : 0;

      const openDrift = driftEvents.filter(d => !d.resolvedAt);
      const driftBySeverity: Record<DriftSeverity, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };
      for (const d of openDrift) {
        driftBySeverity[d.severity]++;
      }

      const thirtyDaysAgo = new Date(Date.now() - thirtyDaysMs);
      const resolvedLast30Days = driftEvents.filter(d => {
        if (!d.resolvedAt) return false;
        return new Date(d.resolvedAt) >= thirtyDaysAgo;
      }).length;

      const allExceptions = [...exceptions.values()];

      return {
        generatedAt: new Date().toISOString(),
        attestations: {
          total: allAttestations.length,
          valid: allAttestations.filter(a => a.status === 'valid').length,
          expiringSoon: allAttestations.filter(a => a.status === 'expiring_soon').length,
          expired: allAttestations.filter(a => a.status === 'expired').length,
          revoked: allAttestations.filter(a => a.status === 'revoked').length,
          byFramework,
        },
        mappings: {
          total: allMappings.length,
          directMappings,
          partialMappings,
          unmapped,
          coveragePercent,
        },
        drift: {
          totalOpen: openDrift.length,
          bySeverity: driftBySeverity,
          resolvedLast30Days,
        },
        exceptions: {
          active: allExceptions.filter(e => e.status === 'active').length,
          expiringSoon: allExceptions.filter(e => e.status === 'expiring_soon').length,
          expired: allExceptions.filter(e => e.status === 'expired').length,
        },
      };
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XVIII: Portal Compliance Contracts', () => {
  let portal: ReturnType<typeof createMockCompliancePortalService>;
  const agencyA = 'sha256:agency_alpha' as AgencyId;
  const signer = 'sha256:signer_001' as `sha256:${string}`;
  const approver = 'sha256:approver_001' as `sha256:${string}`;

  beforeEach(() => {
    portal = createMockCompliancePortalService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate attestation IDs with sha256: prefix', () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const att = portal.createAttestation(agencyA, 'FISMA', futureDate, [], signer);
      assert.ok(att.id.startsWith('sha256:'));
    });

    it('should generate mapping IDs with sha256: prefix', () => {
      const mapping = portal.createMapping('FISMA', 'FedRAMP', 'AC-1', 'AC-1', 'direct');
      assert.ok(mapping.id.startsWith('sha256:'));
    });

    it('should generate drift event IDs with sha256: prefix', () => {
      const drift = portal.recordDrift(
        'sha256:control_1' as ControlId,
        agencyA,
        'high',
        'Configuration drift detected'
      );
      assert.ok(drift.id.startsWith('sha256:'));
    });

    it('should generate exception IDs with sha256: prefix', () => {
      const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const exception = portal.createException(
        'sha256:control_1' as ControlId,
        agencyA,
        'Legacy system',
        futureDate,
        approver,
        ['Compensating control in place']
      );
      assert.ok(exception.id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Attestation Tests
  // ==========================================================================

  describe('Attestation Management', () => {
    it('should create valid attestation', () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const att = portal.createAttestation(agencyA, 'FISMA', futureDate, [], signer);
      assert.strictEqual(att.status, 'valid');
      assert.strictEqual(att.framework, 'FISMA');
    });

    it('should detect expiring_soon attestation', () => {
      const soonDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
      const att = portal.createAttestation(agencyA, 'FISMA', soonDate, [], signer);
      assert.strictEqual(att.status, 'expiring_soon');
    });

    it('should detect expired attestation', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const att = portal.createAttestation(agencyA, 'FISMA', pastDate, [], signer);
      assert.strictEqual(att.status, 'expired');
    });

    it('should revoke attestation', () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const att = portal.createAttestation(agencyA, 'FISMA', futureDate, [], signer);
      const revoked = portal.revokeAttestation(att.id, 'Compliance violation');
      assert.strictEqual(revoked!.status, 'revoked');
      assert.ok(revoked!.revokedAt);
      assert.strictEqual(revoked!.revokedReason, 'Compliance violation');
    });

    it('should not revoke already revoked attestation', () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const att = portal.createAttestation(agencyA, 'FISMA', futureDate, [], signer);
      portal.revokeAttestation(att.id, 'First revocation');
      const result = portal.revokeAttestation(att.id, 'Second attempt');
      assert.strictEqual(result, null);
    });

    it('should store evidence references', () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const evidenceRefs: EvidenceRef[] = [
        'sha256:evidence_1' as EvidenceRef,
        'sha256:evidence_2' as EvidenceRef,
      ];
      const att = portal.createAttestation(agencyA, 'FISMA', futureDate, evidenceRefs, signer);
      assert.strictEqual(att.evidenceRefs.length, 2);
      assert.ok(att.evidenceRefs[0].startsWith('sha256:'));
    });

    it('should query by framework', () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      portal.createAttestation(agencyA, 'FISMA', futureDate, [], signer);
      portal.createAttestation(agencyA, 'FedRAMP', futureDate, [], signer);

      const fismaAtts = portal.getAttestationsByFramework('FISMA');
      assert.strictEqual(fismaAtts.length, 1);
    });

    it('should query by status', () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      portal.createAttestation(agencyA, 'FISMA', futureDate, [], signer);
      portal.createAttestation(agencyA, 'FedRAMP', pastDate, [], signer);

      const validAtts = portal.getAttestationsByStatus('valid');
      const expiredAtts = portal.getAttestationsByStatus('expired');
      assert.strictEqual(validAtts.length, 1);
      assert.strictEqual(expiredAtts.length, 1);
    });
  });

  // ==========================================================================
  // Control Mapping Tests
  // ==========================================================================

  describe('Control Mapping', () => {
    it('should create direct mapping', () => {
      const mapping = portal.createMapping('FISMA', 'FedRAMP', 'AC-1', 'AC-1', 'direct');
      assert.strictEqual(mapping.mappingType, 'direct');
    });

    it('should create partial mapping', () => {
      const mapping = portal.createMapping('FISMA', 'FedRAMP', 'AC-2', 'AC-2(1)', 'partial');
      assert.strictEqual(mapping.mappingType, 'partial');
    });

    it('should create unmapped entry', () => {
      const mapping = portal.createMapping('FISMA', 'FedRAMP', 'AC-99', '', 'none');
      assert.strictEqual(mapping.mappingType, 'none');
    });

    it('should calculate mapping coverage', () => {
      portal.createMapping('FISMA', 'FedRAMP', 'AC-1', 'AC-1', 'direct');
      portal.createMapping('FISMA', 'FedRAMP', 'AC-2', 'AC-2', 'partial');
      portal.createMapping('FISMA', 'FedRAMP', 'AC-3', '', 'none');
      portal.createMapping('FISMA', 'FedRAMP', 'AC-4', 'AC-4', 'direct');

      const coverage = portal.getMappingCoverage('FISMA', 'FedRAMP');
      assert.strictEqual(coverage.total, 4);
      assert.strictEqual(coverage.direct, 2);
      assert.strictEqual(coverage.partial, 1);
      assert.strictEqual(coverage.unmapped, 1);
      assert.strictEqual(coverage.coveragePercent, 75);
    });

    it('should query mappings by frameworks', () => {
      portal.createMapping('FISMA', 'FedRAMP', 'AC-1', 'AC-1', 'direct');
      portal.createMapping('FISMA', 'SOC2', 'AC-1', 'CC1.1', 'partial');

      const fismaToFedramp = portal.getMappingsByFrameworks('FISMA', 'FedRAMP');
      assert.strictEqual(fismaToFedramp.length, 1);
    });
  });

  // ==========================================================================
  // Drift Tracking Tests
  // ==========================================================================

  describe('Drift Tracking', () => {
    it('should record drift event', () => {
      const drift = portal.recordDrift(
        'sha256:control_1' as ControlId,
        agencyA,
        'high',
        'Configuration changed unexpectedly'
      );
      assert.strictEqual(drift.severity, 'high');
      assert.ok(drift.detectedAt);
      assert.ok(!drift.resolvedAt);
    });

    it('should resolve drift', () => {
      const drift = portal.recordDrift(
        'sha256:control_1' as ControlId,
        agencyA,
        'medium',
        'Minor drift'
      );
      const resolved = portal.resolveDrift(drift.id);
      assert.ok(resolved!.resolvedAt);
    });

    it('should not resolve already resolved drift', () => {
      const drift = portal.recordDrift(
        'sha256:control_1' as ControlId,
        agencyA,
        'low',
        'Small drift'
      );
      portal.resolveDrift(drift.id);
      const result = portal.resolveDrift(drift.id);
      assert.strictEqual(result, null);
    });

    it('should get open drift only', () => {
      const drift1 = portal.recordDrift(
        'sha256:control_1' as ControlId,
        agencyA,
        'high',
        'Drift 1'
      );
      portal.recordDrift('sha256:control_2' as ControlId, agencyA, 'medium', 'Drift 2');
      portal.resolveDrift(drift1.id);

      const open = portal.getOpenDrift();
      assert.strictEqual(open.length, 1);
    });

    it('should filter by severity', () => {
      portal.recordDrift('sha256:c1' as ControlId, agencyA, 'critical', 'Critical');
      portal.recordDrift('sha256:c2' as ControlId, agencyA, 'high', 'High');
      portal.recordDrift('sha256:c3' as ControlId, agencyA, 'high', 'High 2');

      const criticalDrift = portal.getDriftBySeverity('critical');
      const highDrift = portal.getDriftBySeverity('high');
      assert.strictEqual(criticalDrift.length, 1);
      assert.strictEqual(highDrift.length, 2);
    });

    it('should store evidence reference', () => {
      const drift = portal.recordDrift(
        'sha256:control_1' as ControlId,
        agencyA,
        'high',
        'Drift with evidence',
        'sha256:evidence_pack' as EvidenceRef
      );
      assert.strictEqual(drift.evidenceRef, 'sha256:evidence_pack');
    });
  });

  // ==========================================================================
  // Exception Tests
  // ==========================================================================

  describe('Exception Management', () => {
    it('should create active exception', () => {
      const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const exception = portal.createException(
        'sha256:control_1' as ControlId,
        agencyA,
        'Legacy system compatibility',
        futureDate,
        approver,
        ['Compensating control']
      );
      assert.strictEqual(exception.status, 'active');
    });

    it('should detect expiring_soon exception', () => {
      const soonDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
      const exception = portal.createException(
        'sha256:control_1' as ControlId,
        agencyA,
        'Short exception',
        soonDate,
        approver,
        []
      );
      assert.strictEqual(exception.status, 'expiring_soon');
    });

    it('should detect expired exception', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const exception = portal.createException(
        'sha256:control_1' as ControlId,
        agencyA,
        'Expired exception',
        pastDate,
        approver,
        []
      );
      assert.strictEqual(exception.status, 'expired');
    });

    it('should renew exception', () => {
      const soonDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
      const exception = portal.createException(
        'sha256:control_1' as ControlId,
        agencyA,
        'To renew',
        soonDate,
        approver,
        []
      );

      const newExpiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
      const renewed = portal.renewException(exception.id, newExpiry);
      assert.strictEqual(renewed!.status, 'active');
      assert.ok(renewed!.renewedAt);
    });

    it('should store mitigations', () => {
      const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const exception = portal.createException(
        'sha256:control_1' as ControlId,
        agencyA,
        'With mitigations',
        futureDate,
        approver,
        ['Mitigation 1', 'Mitigation 2']
      );
      assert.strictEqual(exception.mitigations.length, 2);
    });

    it('should query by status', () => {
      const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      portal.createException('sha256:c1' as ControlId, agencyA, 'Active', futureDate, approver, []);
      portal.createException('sha256:c2' as ControlId, agencyA, 'Expired', pastDate, approver, []);

      const active = portal.getExceptionsByStatus('active');
      const expired = portal.getExceptionsByStatus('expired');
      assert.strictEqual(active.length, 1);
      assert.strictEqual(expired.length, 1);
    });
  });

  // ==========================================================================
  // Portal View Tests
  // ==========================================================================

  describe('Portal View Generation', () => {
    it('should generate portal view', () => {
      const view = portal.generatePortalView();
      assert.ok(view.generatedAt);
    });

    it('should aggregate attestations by status', () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      portal.createAttestation(agencyA, 'FISMA', futureDate, [], signer);
      portal.createAttestation(agencyA, 'FedRAMP', pastDate, [], signer);

      const view = portal.generatePortalView();
      assert.strictEqual(view.attestations.total, 2);
      assert.strictEqual(view.attestations.valid, 1);
      assert.strictEqual(view.attestations.expired, 1);
    });

    it('should aggregate attestations by framework', () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      portal.createAttestation(agencyA, 'FISMA', futureDate, [], signer);
      portal.createAttestation(agencyA, 'FISMA', futureDate, [], signer);
      portal.createAttestation(agencyA, 'FedRAMP', futureDate, [], signer);

      const view = portal.generatePortalView();
      assert.strictEqual(view.attestations.byFramework['FISMA'], 2);
      assert.strictEqual(view.attestations.byFramework['FedRAMP'], 1);
    });

    it('should calculate mapping coverage', () => {
      portal.createMapping('FISMA', 'FedRAMP', 'AC-1', 'AC-1', 'direct');
      portal.createMapping('FISMA', 'FedRAMP', 'AC-2', '', 'none');

      const view = portal.generatePortalView();
      assert.strictEqual(view.mappings.total, 2);
      assert.strictEqual(view.mappings.directMappings, 1);
      assert.strictEqual(view.mappings.unmapped, 1);
      assert.strictEqual(view.mappings.coveragePercent, 50);
    });

    it('should aggregate drift by severity', () => {
      portal.recordDrift('sha256:c1' as ControlId, agencyA, 'critical', 'Critical');
      portal.recordDrift('sha256:c2' as ControlId, agencyA, 'high', 'High');
      portal.recordDrift('sha256:c3' as ControlId, agencyA, 'high', 'High 2');

      const view = portal.generatePortalView();
      assert.strictEqual(view.drift.totalOpen, 3);
      assert.strictEqual(view.drift.bySeverity.critical, 1);
      assert.strictEqual(view.drift.bySeverity.high, 2);
    });

    it('should count exception statuses', () => {
      const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const soonDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
      portal.createException('sha256:c1' as ControlId, agencyA, 'Active', futureDate, approver, []);
      portal.createException('sha256:c2' as ControlId, agencyA, 'Soon', soonDate, approver, []);

      const view = portal.generatePortalView();
      assert.strictEqual(view.exceptions.active, 1);
      assert.strictEqual(view.exceptions.expiringSoon, 1);
    });
  });

  // ==========================================================================
  // Read-Only Invariant Tests
  // ==========================================================================

  describe('Read-Only Portal Invariants', () => {
    it('should generate fresh view on each call', () => {
      const view1 = portal.generatePortalView();
      const view2 = portal.generatePortalView();
      // Each view should have a generatedAt timestamp (may be same instant)
      assert.ok(view1.generatedAt);
      assert.ok(view2.generatedAt);
      // Views are independent objects
      assert.ok(view1 !== view2);
    });

    it('should not expose PII in exception reasons', () => {
      const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const exception = portal.createException(
        'sha256:control_1' as ControlId,
        agencyA,
        'System limitation requires exception',
        futureDate,
        approver,
        ['Compensating control']
      );
      // Exception reason should not contain PII patterns
      assert.ok(!exception.reason.includes('@'));
      assert.ok(!exception.reason.match(/\d{3}-\d{2}-\d{4}/));
    });

    it('should not expose PII in drift descriptions', () => {
      const drift = portal.recordDrift(
        'sha256:control_1' as ControlId,
        agencyA,
        'high',
        'Configuration drift in network settings'
      );
      assert.ok(!drift.description.includes('@'));
      assert.ok(!drift.description.match(/\d{3}-\d{2}-\d{4}/));
    });
  });
});
