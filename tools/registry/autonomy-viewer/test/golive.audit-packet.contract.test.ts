/**
 * Phase XXIII — Global Program Synthesis + Go-Live Playbook
 * ==========================================================
 * Contract: golive.audit-packet.contract.test.ts
 *
 * Tests per-agency audit packet generation: derived from MOU obligations,
 * framework mappings (FISMA/NIST/CJIS/FedRAMP), PII-clean with evidence refs.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Packets satisfy MOU obligation coverage
 * - Framework mappings are complete
 * - Evidence is referenced, not embedded
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type PacketId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type MouId = `sha256:${string}`;
type ObligationId = `sha256:${string}`;
type ControlId = `sha256:${string}`;
type EvidenceRef = `sha256:${string}`;
type SectionId = `sha256:${string}`;

type Framework = 'FISMA' | 'NIST-800-53' | 'CJIS' | 'FedRAMP' | 'SOC2' | 'HIPAA';
type PacketStatus = 'draft' | 'assembled' | 'reviewed' | 'signed' | 'delivered';
type ComplianceStatus = 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';

interface MouObligation {
  readonly id: ObligationId;
  readonly mouId: MouId;
  readonly description: string;
  readonly category: string;
  readonly dueDate: string;
  readonly status: 'pending' | 'fulfilled' | 'overdue';
  readonly evidenceRefs: readonly EvidenceRef[];
}

interface FrameworkControl {
  readonly id: ControlId;
  readonly framework: Framework;
  readonly controlNumber: string;
  readonly title: string;
  readonly description: string;
  readonly family: string;
}

interface ControlAssessment {
  readonly controlId: ControlId;
  readonly status: ComplianceStatus;
  readonly evidenceRefs: readonly EvidenceRef[];
  readonly findings: readonly string[];
  readonly recommendations: readonly string[];
  readonly assessedAt: string;
  readonly assessedBy: string;
}

interface PacketSection {
  readonly id: SectionId;
  readonly title: string;
  readonly framework: Framework;
  readonly controls: readonly ControlAssessment[];
  readonly overallStatus: ComplianceStatus;
  readonly summary: string;
}

interface ObligationCoverage {
  readonly obligationId: ObligationId;
  readonly covered: boolean;
  readonly evidenceRefs: readonly EvidenceRef[];
  readonly coveragePercentage: number;
}

interface AuditPacket {
  readonly id: PacketId;
  readonly agencyId: AgencyId;
  readonly name: string;
  readonly version: string;
  readonly status: PacketStatus;
  readonly frameworks: readonly Framework[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly generatedBy: string;
  readonly sections: readonly PacketSection[];
  readonly obligations: readonly ObligationCoverage[];
  readonly totalControls: number;
  readonly compliantControls: number;
  readonly partialControls: number;
  readonly overallCompliance: number;
  readonly mouCoverage: number;
  readonly signedAt: string | null;
  readonly signedBy: string | null;
  readonly deliveredAt: string | null;
  readonly piiClean: boolean;
}

interface AuditFinding {
  readonly id: `sha256:${string}`;
  readonly packetId: PacketId;
  readonly controlId: ControlId;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
  readonly description: string;
  readonly recommendation: string;
  readonly status: 'open' | 'in_remediation' | 'resolved' | 'risk_accepted';
  readonly raisedAt: string;
  readonly resolvedAt: string | null;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockAuditPacketService() {
  const packets = new Map<PacketId, AuditPacket>();
  const obligations = new Map<ObligationId, MouObligation>();
  const frameworkControls = new Map<string, FrameworkControl[]>(); // key: framework
  const findings = new Map<string, AuditFinding[]>(); // key: packetId

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  // Pre-populate framework controls
  const nistControls: FrameworkControl[] = [
    {
      id: generateId('ctrl') as ControlId,
      framework: 'NIST-800-53',
      controlNumber: 'AC-1',
      title: 'Access Control Policy',
      description: 'Policy and procedures',
      family: 'Access Control',
    },
    {
      id: generateId('ctrl') as ControlId,
      framework: 'NIST-800-53',
      controlNumber: 'AC-2',
      title: 'Account Management',
      description: 'Manage accounts',
      family: 'Access Control',
    },
    {
      id: generateId('ctrl') as ControlId,
      framework: 'NIST-800-53',
      controlNumber: 'AU-1',
      title: 'Audit Policy',
      description: 'Audit policy',
      family: 'Audit',
    },
    {
      id: generateId('ctrl') as ControlId,
      framework: 'NIST-800-53',
      controlNumber: 'AU-2',
      title: 'Event Logging',
      description: 'Log events',
      family: 'Audit',
    },
    {
      id: generateId('ctrl') as ControlId,
      framework: 'NIST-800-53',
      controlNumber: 'SC-1',
      title: 'System and Comms Protection Policy',
      description: 'SC policy',
      family: 'System and Communications',
    },
  ];
  frameworkControls.set('NIST-800-53', nistControls);

  const fismaControls: FrameworkControl[] = [
    {
      id: generateId('ctrl') as ControlId,
      framework: 'FISMA',
      controlNumber: 'F-AC-1',
      title: 'Federal Access Control',
      description: 'Federal AC',
      family: 'Access Control',
    },
    {
      id: generateId('ctrl') as ControlId,
      framework: 'FISMA',
      controlNumber: 'F-AU-1',
      title: 'Federal Audit',
      description: 'Federal Audit',
      family: 'Audit',
    },
    {
      id: generateId('ctrl') as ControlId,
      framework: 'FISMA',
      controlNumber: 'F-IR-1',
      title: 'Federal Incident Response',
      description: 'Federal IR',
      family: 'Incident Response',
    },
  ];
  frameworkControls.set('FISMA', fismaControls);

  const cjisControls: FrameworkControl[] = [
    {
      id: generateId('ctrl') as ControlId,
      framework: 'CJIS',
      controlNumber: 'CJIS-5.1',
      title: 'Criminal Justice Information Security',
      description: 'CJI security',
      family: 'Security',
    },
    {
      id: generateId('ctrl') as ControlId,
      framework: 'CJIS',
      controlNumber: 'CJIS-5.4',
      title: 'Auditing and Accountability',
      description: 'Audit',
      family: 'Audit',
    },
  ];
  frameworkControls.set('CJIS', cjisControls);

  const fedrampControls: FrameworkControl[] = [
    {
      id: generateId('ctrl') as ControlId,
      framework: 'FedRAMP',
      controlNumber: 'FR-AC-1',
      title: 'FedRAMP Access Control',
      description: 'Cloud AC',
      family: 'Access Control',
    },
    {
      id: generateId('ctrl') as ControlId,
      framework: 'FedRAMP',
      controlNumber: 'FR-CM-1',
      title: 'FedRAMP Config Management',
      description: 'Cloud CM',
      family: 'Configuration',
    },
  ];
  frameworkControls.set('FedRAMP', fedrampControls);

  return {
    // Obligation Management
    addObligation(
      mouId: MouId,
      description: string,
      category: string,
      dueDate: string
    ): MouObligation {
      const obligation: MouObligation = {
        id: generateId('obligation') as ObligationId,
        mouId,
        description,
        category,
        dueDate,
        status: 'pending',
        evidenceRefs: [],
      };
      obligations.set(obligation.id, obligation);
      return obligation;
    },

    fulfillObligation(
      id: ObligationId,
      evidenceRefs: readonly EvidenceRef[]
    ): MouObligation | null {
      const obligation = obligations.get(id);
      if (!obligation) return null;

      const updated: MouObligation = {
        ...obligation,
        status: 'fulfilled',
        evidenceRefs,
      };
      obligations.set(id, updated);
      return updated;
    },

    getObligationsByMou(mouId: MouId): readonly MouObligation[] {
      return [...obligations.values()].filter(o => o.mouId === mouId);
    },

    // Framework Controls
    getFrameworkControls(framework: Framework): readonly FrameworkControl[] {
      return [...(frameworkControls.get(framework) ?? [])];
    },

    getControlsByFamily(framework: Framework, family: string): readonly FrameworkControl[] {
      const controls = frameworkControls.get(framework) ?? [];
      return controls.filter(c => c.family === family);
    },

    // Packet Creation
    createPacket(
      agencyId: AgencyId,
      name: string,
      frameworks: readonly Framework[],
      generatedBy: string
    ): AuditPacket {
      const packet: AuditPacket = {
        id: generateId('packet') as PacketId,
        agencyId,
        name,
        version: '1.0.0',
        status: 'draft',
        frameworks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        generatedBy,
        sections: [],
        obligations: [],
        totalControls: 0,
        compliantControls: 0,
        partialControls: 0,
        overallCompliance: 0,
        mouCoverage: 0,
        signedAt: null,
        signedBy: null,
        deliveredAt: null,
        piiClean: true,
      };
      packets.set(packet.id, packet);
      findings.set(packet.id, []);
      return packet;
    },

    // Section Management
    addSection(
      packetId: PacketId,
      title: string,
      framework: Framework,
      assessments: readonly ControlAssessment[]
    ): PacketSection | null {
      const packet = packets.get(packetId);
      if (!packet) return null;

      // Calculate overall status
      const compliant = assessments.filter(a => a.status === 'compliant').length;
      const total = assessments.length;
      let overallStatus: ComplianceStatus = 'non_compliant';
      if (compliant === total) overallStatus = 'compliant';
      else if (compliant > 0) overallStatus = 'partial';

      const section: PacketSection = {
        id: generateId('section') as SectionId,
        title,
        framework,
        controls: assessments,
        overallStatus,
        summary: `${compliant}/${total} controls compliant`,
      };

      const updated = this.recalculatePacket({
        ...packet,
        sections: [...packet.sections, section],
      });
      packets.set(packetId, updated);

      return section;
    },

    // Obligation Coverage
    addObligationCoverage(
      packetId: PacketId,
      obligationId: ObligationId,
      evidenceRefs: readonly EvidenceRef[]
    ): ObligationCoverage | null {
      const packet = packets.get(packetId);
      const obligation = obligations.get(obligationId);
      if (!packet || !obligation) return null;

      const coverage: ObligationCoverage = {
        obligationId,
        covered: evidenceRefs.length > 0,
        evidenceRefs,
        coveragePercentage: evidenceRefs.length > 0 ? 100 : 0,
      };

      const updated = this.recalculatePacket({
        ...packet,
        obligations: [...packet.obligations, coverage],
      });
      packets.set(packetId, updated);

      return coverage;
    },

    // Packet Recalculation
    recalculatePacket(packet: AuditPacket): AuditPacket {
      let totalControls = 0;
      let compliantControls = 0;
      let partialControls = 0;

      for (const section of packet.sections) {
        totalControls += section.controls.length;
        compliantControls += section.controls.filter(c => c.status === 'compliant').length;
        partialControls += section.controls.filter(c => c.status === 'partial').length;
      }

      const overallCompliance =
        totalControls > 0
          ? Math.round(((compliantControls + partialControls * 0.5) / totalControls) * 100)
          : 0;

      const totalObligations = packet.obligations.length;
      const coveredObligations = packet.obligations.filter(o => o.covered).length;
      const mouCoverage =
        totalObligations > 0 ? Math.round((coveredObligations / totalObligations) * 100) : 0;

      return {
        ...packet,
        totalControls,
        compliantControls,
        partialControls,
        overallCompliance,
        mouCoverage,
        updatedAt: new Date().toISOString(),
      };
    },

    // Finding Management
    addFinding(
      packetId: PacketId,
      controlId: ControlId,
      severity: 'critical' | 'high' | 'medium' | 'low',
      description: string,
      recommendation: string
    ): AuditFinding | null {
      const packet = packets.get(packetId);
      if (!packet) return null;

      const finding: AuditFinding = {
        id: generateId('finding'),
        packetId,
        controlId,
        severity,
        description,
        recommendation,
        status: 'open',
        raisedAt: new Date().toISOString(),
        resolvedAt: null,
      };

      const packetFindings = findings.get(packetId) ?? [];
      findings.set(packetId, [...packetFindings, finding]);

      return finding;
    },

    resolveFinding(packetId: PacketId, findingId: `sha256:${string}`): AuditFinding | null {
      const packetFindings = findings.get(packetId);
      if (!packetFindings) return null;

      const index = packetFindings.findIndex(f => f.id === findingId);
      if (index === -1) return null;

      const resolved: AuditFinding = {
        ...packetFindings[index],
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
      };

      packetFindings[index] = resolved;
      findings.set(packetId, packetFindings);

      return resolved;
    },

    getFindings(packetId: PacketId): readonly AuditFinding[] {
      return [...(findings.get(packetId) ?? [])];
    },

    getOpenFindings(packetId: PacketId): readonly AuditFinding[] {
      return (findings.get(packetId) ?? []).filter(
        f => f.status === 'open' || f.status === 'in_remediation'
      );
    },

    // Packet Lifecycle
    assemblePacket(packetId: PacketId): AuditPacket | null {
      const packet = packets.get(packetId);
      if (!packet || packet.status !== 'draft') return null;

      if (packet.sections.length === 0) return null; // Must have sections

      const updated: AuditPacket = {
        ...packet,
        status: 'assembled',
        updatedAt: new Date().toISOString(),
      };
      packets.set(packetId, updated);
      return updated;
    },

    reviewPacket(packetId: PacketId): AuditPacket | null {
      const packet = packets.get(packetId);
      if (!packet || packet.status !== 'assembled') return null;

      const updated: AuditPacket = {
        ...packet,
        status: 'reviewed',
        updatedAt: new Date().toISOString(),
      };
      packets.set(packetId, updated);
      return updated;
    },

    signPacket(packetId: PacketId, signedBy: string): AuditPacket | null {
      const packet = packets.get(packetId);
      if (!packet || packet.status !== 'reviewed') return null;

      // Cannot sign with open critical findings
      const openFindings = this.getOpenFindings(packetId);
      if (openFindings.some(f => f.severity === 'critical')) return null;

      const updated: AuditPacket = {
        ...packet,
        status: 'signed',
        signedAt: new Date().toISOString(),
        signedBy,
        updatedAt: new Date().toISOString(),
      };
      packets.set(packetId, updated);
      return updated;
    },

    deliverPacket(packetId: PacketId): AuditPacket | null {
      const packet = packets.get(packetId);
      if (!packet || packet.status !== 'signed') return null;

      const updated: AuditPacket = {
        ...packet,
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      packets.set(packetId, updated);
      return updated;
    },

    // Retrieval
    getPacket(id: PacketId): AuditPacket | null {
      return packets.get(id) ?? null;
    },

    getPacketsByAgency(agencyId: AgencyId): readonly AuditPacket[] {
      return [...packets.values()].filter(p => p.agencyId === agencyId);
    },

    getSections(packetId: PacketId): readonly PacketSection[] {
      const packet = packets.get(packetId);
      return packet ? [...packet.sections] : [];
    },

    getObligationCoverages(packetId: PacketId): readonly ObligationCoverage[] {
      const packet = packets.get(packetId);
      return packet ? [...packet.obligations] : [];
    },

    // PII Validation
    validatePiiClean(packet: AuditPacket): { valid: boolean; violations: readonly string[] } {
      const violations: string[] = [];

      // Check all evidence refs are sha256: only
      for (const section of packet.sections) {
        for (const control of section.controls) {
          for (const ref of control.evidenceRefs) {
            if (!ref.startsWith('sha256:')) {
              violations.push(`Invalid evidence ref format: ${ref}`);
            }
            if (ref.length > 100) {
              violations.push(
                `Evidence ref too long (possible embedded data): ${ref.substring(0, 50)}...`
              );
            }
          }
        }
      }

      for (const coverage of packet.obligations) {
        for (const ref of coverage.evidenceRefs) {
          if (!ref.startsWith('sha256:')) {
            violations.push(`Invalid obligation evidence ref: ${ref}`);
          }
        }
      }

      return { valid: violations.length === 0, violations };
    },

    // Framework Mapping Validation
    validateFrameworkCoverage(
      packetId: PacketId
    ): Record<Framework, { total: number; covered: number; percentage: number }> {
      const packet = packets.get(packetId);
      if (!packet)
        return {} as Record<Framework, { total: number; covered: number; percentage: number }>;

      const coverage: Record<Framework, { total: number; covered: number; percentage: number }> =
        {} as Record<Framework, { total: number; covered: number; percentage: number }>;

      for (const framework of packet.frameworks) {
        const controls = this.getFrameworkControls(framework);
        const controlIds = new Set(controls.map(c => c.id));

        let covered = 0;
        for (const section of packet.sections) {
          if (section.framework === framework) {
            covered += section.controls.filter(
              c => controlIds.has(c.controlId) && c.status !== 'non_compliant'
            ).length;
          }
        }

        coverage[framework] = {
          total: controls.length,
          covered,
          percentage: controls.length > 0 ? Math.round((covered / controls.length) * 100) : 0,
        };
      }

      return coverage;
    },

    // Cross-Framework Mapping
    mapControlAcrossFrameworks(
      controlId: ControlId
    ): readonly { framework: Framework; controlNumber: string }[] {
      const mappings: { framework: Framework; controlNumber: string }[] = [];

      for (const [framework, controls] of frameworkControls.entries()) {
        const match = controls.find(c => c.id === controlId);
        if (match) {
          mappings.push({ framework: framework as Framework, controlNumber: match.controlNumber });
        }
      }

      // Simulated cross-mappings
      return mappings;
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXIII: Audit Packet Contracts', () => {
  let auditService: ReturnType<typeof createMockAuditPacketService>;
  const agencyA = 'sha256:agency_alpha' as AgencyId;
  const mouA = 'sha256:mou_alpha_beta' as MouId;

  beforeEach(() => {
    auditService = createMockAuditPacketService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate packet IDs with sha256: prefix', () => {
      const packet = auditService.createPacket(agencyA, 'Audit Q1', ['NIST-800-53'], 'auditor');
      assert.ok(packet.id.startsWith('sha256:'));
    });

    it('should generate obligation IDs with sha256: prefix', () => {
      const obligation = auditService.addObligation(
        mouA,
        'Provide audit logs',
        'Audit',
        '2026-03-01'
      );
      assert.ok(obligation.id.startsWith('sha256:'));
    });

    it('should generate section IDs with sha256: prefix', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      const section = auditService.addSection(packet.id, 'Access Control', 'NIST-800-53', []);
      assert.ok(section?.id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Packet Lifecycle Tests
  // ==========================================================================

  describe('Packet Lifecycle', () => {
    it('should create packet in draft status', () => {
      const packet = auditService.createPacket(
        agencyA,
        'Audit Q1',
        ['NIST-800-53', 'FISMA'],
        'auditor'
      );
      assert.strictEqual(packet.status, 'draft');
    });

    it('should assemble packet with sections', () => {
      const packet = auditService.createPacket(agencyA, 'Audit Q1', ['NIST-800-53'], 'auditor');
      auditService.addSection(packet.id, 'Access Control', 'NIST-800-53', []);

      const assembled = auditService.assemblePacket(packet.id);
      assert.strictEqual(assembled?.status, 'assembled');
    });

    it('should not assemble packet without sections', () => {
      const packet = auditService.createPacket(agencyA, 'Audit Q1', ['NIST-800-53'], 'auditor');
      const assembled = auditService.assemblePacket(packet.id);
      assert.strictEqual(assembled, null);
    });

    it('should review assembled packet', () => {
      const packet = auditService.createPacket(agencyA, 'Audit Q1', ['NIST-800-53'], 'auditor');
      auditService.addSection(packet.id, 'Access Control', 'NIST-800-53', []);
      auditService.assemblePacket(packet.id);

      const reviewed = auditService.reviewPacket(packet.id);
      assert.strictEqual(reviewed?.status, 'reviewed');
    });

    it('should sign reviewed packet', () => {
      const packet = auditService.createPacket(agencyA, 'Audit Q1', ['NIST-800-53'], 'auditor');
      auditService.addSection(packet.id, 'Access Control', 'NIST-800-53', []);
      auditService.assemblePacket(packet.id);
      auditService.reviewPacket(packet.id);

      const signed = auditService.signPacket(packet.id, 'CISO');
      assert.strictEqual(signed?.status, 'signed');
      assert.strictEqual(signed?.signedBy, 'CISO');
    });

    it('should deliver signed packet', () => {
      const packet = auditService.createPacket(agencyA, 'Audit Q1', ['NIST-800-53'], 'auditor');
      auditService.addSection(packet.id, 'Access Control', 'NIST-800-53', []);
      auditService.assemblePacket(packet.id);
      auditService.reviewPacket(packet.id);
      auditService.signPacket(packet.id, 'CISO');

      const delivered = auditService.deliverPacket(packet.id);
      assert.strictEqual(delivered?.status, 'delivered');
      assert.ok(delivered?.deliveredAt);
    });
  });

  // ==========================================================================
  // Framework Control Tests
  // ==========================================================================

  describe('Framework Controls', () => {
    it('should get NIST-800-53 controls', () => {
      const controls = auditService.getFrameworkControls('NIST-800-53');
      assert.ok(controls.length >= 3);
    });

    it('should get FISMA controls', () => {
      const controls = auditService.getFrameworkControls('FISMA');
      assert.ok(controls.length >= 2);
    });

    it('should get controls by family', () => {
      const controls = auditService.getControlsByFamily('NIST-800-53', 'Access Control');
      assert.ok(controls.length >= 2);
    });
  });

  // ==========================================================================
  // Section / Assessment Tests
  // ==========================================================================

  describe('Control Assessments', () => {
    it('should add section with assessments', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      const controls = auditService.getFrameworkControls('NIST-800-53');

      const assessments: ControlAssessment[] = controls.slice(0, 2).map(c => ({
        controlId: c.id,
        status: 'compliant' as ComplianceStatus,
        evidenceRefs: ['sha256:evidence_1' as EvidenceRef],
        findings: [],
        recommendations: [],
        assessedAt: new Date().toISOString(),
        assessedBy: 'auditor',
      }));

      const section = auditService.addSection(
        packet.id,
        'Access Control',
        'NIST-800-53',
        assessments
      );
      assert.ok(section);
      assert.strictEqual(section.controls.length, 2);
    });

    it('should calculate section overall status', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      const controls = auditService.getFrameworkControls('NIST-800-53');

      const assessments: ControlAssessment[] = [
        {
          controlId: controls[0].id,
          status: 'compliant',
          evidenceRefs: [],
          findings: [],
          recommendations: [],
          assessedAt: '',
          assessedBy: '',
        },
        {
          controlId: controls[1].id,
          status: 'non_compliant',
          evidenceRefs: [],
          findings: [],
          recommendations: [],
          assessedAt: '',
          assessedBy: '',
        },
      ];

      const section = auditService.addSection(packet.id, 'Mixed', 'NIST-800-53', assessments);
      assert.strictEqual(section?.overallStatus, 'partial');
    });

    it('should calculate overall compliance', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      const controls = auditService.getFrameworkControls('NIST-800-53');

      const assessments: ControlAssessment[] = controls.map(c => ({
        controlId: c.id,
        status: 'compliant' as ComplianceStatus,
        evidenceRefs: [],
        findings: [],
        recommendations: [],
        assessedAt: '',
        assessedBy: '',
      }));

      auditService.addSection(packet.id, 'All Access', 'NIST-800-53', assessments);
      const updated = auditService.getPacket(packet.id);

      assert.strictEqual(updated?.overallCompliance, 100);
    });
  });

  // ==========================================================================
  // MOU Obligation Coverage Tests
  // ==========================================================================

  describe('MOU Obligation Coverage', () => {
    it('should add obligation coverage', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      const obligation = auditService.addObligation(
        mouA,
        'Provide quarterly reports',
        'Reporting',
        '2026-04-01'
      );

      const coverage = auditService.addObligationCoverage(packet.id, obligation.id, [
        'sha256:report_q1' as EvidenceRef,
      ]);

      assert.ok(coverage);
      assert.strictEqual(coverage.covered, true);
    });

    it('should calculate MOU coverage percentage', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      const ob1 = auditService.addObligation(mouA, 'Obligation 1', 'Cat', '2026-04-01');
      const ob2 = auditService.addObligation(mouA, 'Obligation 2', 'Cat', '2026-04-01');

      auditService.addObligationCoverage(packet.id, ob1.id, ['sha256:ev1' as EvidenceRef]);
      auditService.addObligationCoverage(packet.id, ob2.id, []);

      const updated = auditService.getPacket(packet.id);
      assert.strictEqual(updated?.mouCoverage, 50);
    });

    it('should fulfill obligations with evidence', () => {
      const obligation = auditService.addObligation(mouA, 'Submit logs', 'Audit', '2026-03-01');
      const fulfilled = auditService.fulfillObligation(obligation.id, [
        'sha256:logs_jan' as EvidenceRef,
      ]);

      assert.strictEqual(fulfilled?.status, 'fulfilled');
    });
  });

  // ==========================================================================
  // Finding Management Tests
  // ==========================================================================

  describe('Audit Findings', () => {
    it('should add finding', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      const controls = auditService.getFrameworkControls('NIST-800-53');

      const finding = auditService.addFinding(
        packet.id,
        controls[0].id,
        'high',
        'Access logs not retained for 90 days',
        'Increase log retention period'
      );

      assert.ok(finding);
      assert.strictEqual(finding.severity, 'high');
    });

    it('should resolve finding', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      const controls = auditService.getFrameworkControls('NIST-800-53');
      const finding = auditService.addFinding(packet.id, controls[0].id, 'medium', 'Issue', 'Fix');

      const resolved = auditService.resolveFinding(packet.id, finding!.id);
      assert.strictEqual(resolved?.status, 'resolved');
    });

    it('should not sign packet with critical open findings', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      const controls = auditService.getFrameworkControls('NIST-800-53');

      auditService.addSection(packet.id, 'AC', 'NIST-800-53', []);
      auditService.assemblePacket(packet.id);
      auditService.reviewPacket(packet.id);

      auditService.addFinding(packet.id, controls[0].id, 'critical', 'Critical issue', 'Must fix');

      const signed = auditService.signPacket(packet.id, 'CISO');
      assert.strictEqual(signed, null);
    });

    it('should sign after resolving critical findings', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      const controls = auditService.getFrameworkControls('NIST-800-53');

      auditService.addSection(packet.id, 'AC', 'NIST-800-53', []);
      auditService.assemblePacket(packet.id);
      auditService.reviewPacket(packet.id);

      const finding = auditService.addFinding(
        packet.id,
        controls[0].id,
        'critical',
        'Critical',
        'Fix'
      );
      auditService.resolveFinding(packet.id, finding!.id);

      const signed = auditService.signPacket(packet.id, 'CISO');
      assert.strictEqual(signed?.status, 'signed');
    });
  });

  // ==========================================================================
  // PII Clean Tests
  // ==========================================================================

  describe('PII Clean Validation', () => {
    it('should validate PII clean packet', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      const controls = auditService.getFrameworkControls('NIST-800-53');

      auditService.addSection(packet.id, 'AC', 'NIST-800-53', [
        {
          controlId: controls[0].id,
          status: 'compliant',
          evidenceRefs: ['sha256:evidence_abc' as EvidenceRef],
          findings: [],
          recommendations: [],
          assessedAt: '',
          assessedBy: '',
        },
      ]);

      const current = auditService.getPacket(packet.id);
      const validation = auditService.validatePiiClean(current!);

      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.violations.length, 0);
    });

    it('should flag non-sha256 evidence refs', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      const controls = auditService.getFrameworkControls('NIST-800-53');

      // Manually construct a packet with invalid refs for testing
      const invalidPacket: AuditPacket = {
        ...auditService.getPacket(packet.id)!,
        sections: [
          {
            id: 'sha256:sec1' as SectionId,
            title: 'Test',
            framework: 'NIST-800-53',
            controls: [
              {
                controlId: controls[0].id,
                status: 'compliant',
                evidenceRefs: ['invalid_ref_no_prefix' as EvidenceRef],
                findings: [],
                recommendations: [],
                assessedAt: '',
                assessedBy: '',
              },
            ],
            overallStatus: 'compliant',
            summary: 'Test',
          },
        ],
      };

      const validation = auditService.validatePiiClean(invalidPacket);
      assert.strictEqual(validation.valid, false);
    });

    it('should flag overly long refs (embedded data)', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      const controls = auditService.getFrameworkControls('NIST-800-53');

      const longRef = `sha256:${'a'.repeat(150)}` as EvidenceRef;
      const invalidPacket: AuditPacket = {
        ...auditService.getPacket(packet.id)!,
        sections: [
          {
            id: 'sha256:sec1' as SectionId,
            title: 'Test',
            framework: 'NIST-800-53',
            controls: [
              {
                controlId: controls[0].id,
                status: 'compliant',
                evidenceRefs: [longRef],
                findings: [],
                recommendations: [],
                assessedAt: '',
                assessedBy: '',
              },
            ],
            overallStatus: 'compliant',
            summary: 'Test',
          },
        ],
      };

      const validation = auditService.validatePiiClean(invalidPacket);
      assert.strictEqual(validation.valid, false);
    });

    it('should mark packets as PII clean by default', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      assert.strictEqual(packet.piiClean, true);
    });
  });

  // ==========================================================================
  // Framework Coverage Tests
  // ==========================================================================

  describe('Framework Coverage Validation', () => {
    it('should validate framework coverage', () => {
      const packet = auditService.createPacket(
        agencyA,
        'Audit',
        ['NIST-800-53', 'FISMA'],
        'auditor'
      );
      const coverage = auditService.validateFrameworkCoverage(packet.id);

      assert.ok('NIST-800-53' in coverage);
      assert.ok('FISMA' in coverage);
    });

    it('should track covered controls per framework', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      const controls = auditService.getFrameworkControls('NIST-800-53');

      auditService.addSection(
        packet.id,
        'AC',
        'NIST-800-53',
        controls.slice(0, 2).map(c => ({
          controlId: c.id,
          status: 'compliant' as ComplianceStatus,
          evidenceRefs: [],
          findings: [],
          recommendations: [],
          assessedAt: '',
          assessedBy: '',
        }))
      );

      const coverage = auditService.validateFrameworkCoverage(packet.id);
      assert.ok(coverage['NIST-800-53'].covered >= 2);
    });
  });

  // ==========================================================================
  // Query Tests
  // ==========================================================================

  describe('Packet Queries', () => {
    it('should get packets by agency', () => {
      auditService.createPacket(agencyA, 'Audit Q1', ['NIST-800-53'], 'auditor');
      auditService.createPacket(agencyA, 'Audit Q2', ['FISMA'], 'auditor');

      const packets = auditService.getPacketsByAgency(agencyA);
      assert.strictEqual(packets.length, 2);
    });

    it('should get sections', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      auditService.addSection(packet.id, 'AC', 'NIST-800-53', []);
      auditService.addSection(packet.id, 'AU', 'NIST-800-53', []);

      const sections = auditService.getSections(packet.id);
      assert.strictEqual(sections.length, 2);
    });

    it('should get obligation coverages', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      const ob = auditService.addObligation(mouA, 'Ob1', 'Cat', '2026-04-01');
      auditService.addObligationCoverage(packet.id, ob.id, []);

      const coverages = auditService.getObligationCoverages(packet.id);
      assert.strictEqual(coverages.length, 1);
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of sections', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      auditService.addSection(packet.id, 'AC', 'NIST-800-53', []);

      const s1 = auditService.getSections(packet.id);
      const s2 = auditService.getSections(packet.id);
      assert.ok(s1 !== s2);
    });

    it('should return copies of findings', () => {
      const packet = auditService.createPacket(agencyA, 'Audit', ['NIST-800-53'], 'auditor');
      const controls = auditService.getFrameworkControls('NIST-800-53');
      auditService.addFinding(packet.id, controls[0].id, 'low', 'Issue', 'Fix');

      const f1 = auditService.getFindings(packet.id);
      const f2 = auditService.getFindings(packet.id);
      assert.ok(f1 !== f2);
    });

    it('should return copies of framework controls', () => {
      const c1 = auditService.getFrameworkControls('NIST-800-53');
      const c2 = auditService.getFrameworkControls('NIST-800-53');
      assert.ok(c1 !== c2);
    });
  });
});
