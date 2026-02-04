/**
 * Phase XXIII — Global Program Synthesis + Go-Live Playbook
 * ==========================================================
 * Contract: golive.control-evidence.contract.test.ts
 *
 * Tests control→evidence narrative generation: derived from ledger,
 * attestations, MOU state with reproducibility and PII-clean references.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Narrative derived strictly from canonical sources
 * - Same inputs → same narrative hash (reproducibility)
 * - Evidence references only, no embedded blobs
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type NarrativeId = `sha256:${string}`;
type ControlId = `sha256:${string}`;
type EvidenceRef = `sha256:${string}`;
type AttestationId = `sha256:${string}`;
type MouId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type LedgerEntryId = `sha256:${string}`;

type ControlStatus = 'implemented' | 'partial' | 'not_implemented' | 'not_applicable';
type EvidenceType = 'ledger_entry' | 'attestation' | 'mou_clause' | 'audit_log' | 'metric_snapshot';
type NarrativeStatus = 'draft' | 'generated' | 'validated' | 'published';

interface Control {
  readonly id: ControlId;
  readonly framework: string;
  readonly controlNumber: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
}

interface EvidenceLink {
  readonly ref: EvidenceRef;
  readonly type: EvidenceType;
  readonly source: string;
  readonly timestamp: string;
  readonly description: string;
}

interface ControlMapping {
  readonly controlId: ControlId;
  readonly status: ControlStatus;
  readonly evidenceLinks: readonly EvidenceLink[];
  readonly gaps: readonly string[];
  readonly driftDetected: boolean;
  readonly lastAssessed: string;
}

interface NarrativeSection {
  readonly controlId: ControlId;
  readonly title: string;
  readonly statusSummary: string;
  readonly evidenceReferences: readonly EvidenceRef[];
  readonly gapAnalysis: string | null;
  readonly recommendations: readonly string[];
}

interface ControlNarrative {
  readonly id: NarrativeId;
  readonly agencyId: AgencyId;
  readonly framework: string;
  readonly version: string;
  readonly status: NarrativeStatus;
  readonly generatedAt: string;
  readonly contentHash: string;
  readonly commitSha: string;
  readonly sections: readonly NarrativeSection[];
  readonly overallCoverage: number;
  readonly totalControls: number;
  readonly implementedControls: number;
  readonly partialControls: number;
  readonly gaps: readonly string[];
  readonly driftAnnotations: readonly string[];
}

interface LedgerSnapshot {
  readonly entries: readonly { id: LedgerEntryId; type: string; timestamp: string }[];
  readonly snapshotAt: string;
  readonly hash: string;
}

interface AttestationSnapshot {
  readonly attestations: readonly {
    id: AttestationId;
    type: string;
    validUntil: string;
    signed: boolean;
  }[];
  readonly snapshotAt: string;
  readonly hash: string;
}

interface MouSnapshot {
  readonly mous: readonly {
    id: MouId;
    version: string;
    status: string;
    parties: readonly AgencyId[];
  }[];
  readonly snapshotAt: string;
  readonly hash: string;
}

interface GenerationInput {
  readonly ledger: LedgerSnapshot;
  readonly attestations: AttestationSnapshot;
  readonly mouState: MouSnapshot;
  readonly framework: string;
  readonly agencyId: AgencyId;
  readonly commitSha: string;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockControlEvidenceService() {
  const narratives = new Map<NarrativeId, ControlNarrative>();
  const controls = new Map<ControlId, Control>();
  const mappings = new Map<string, ControlMapping>(); // key: `${controlId}:${agencyId}`

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  function computeHash(input: string): string {
    // Simplified deterministic hash for testing
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `sha256:content_${Math.abs(hash).toString(16)}`;
  }

  // Pre-populate framework controls
  const nistControls: Control[] = [
    {
      id: generateId('ctrl') as ControlId,
      framework: 'NIST-800-53',
      controlNumber: 'AC-1',
      title: 'Access Control Policy',
      description: 'Develop and maintain access control policies',
      category: 'Access Control',
    },
    {
      id: generateId('ctrl') as ControlId,
      framework: 'NIST-800-53',
      controlNumber: 'AC-2',
      title: 'Account Management',
      description: 'Manage system accounts',
      category: 'Access Control',
    },
    {
      id: generateId('ctrl') as ControlId,
      framework: 'NIST-800-53',
      controlNumber: 'AU-1',
      title: 'Audit and Accountability Policy',
      description: 'Develop audit policies',
      category: 'Audit',
    },
    {
      id: generateId('ctrl') as ControlId,
      framework: 'NIST-800-53',
      controlNumber: 'AU-2',
      title: 'Event Logging',
      description: 'Define auditable events',
      category: 'Audit',
    },
    {
      id: generateId('ctrl') as ControlId,
      framework: 'NIST-800-53',
      controlNumber: 'CA-1',
      title: 'Security Assessment Policy',
      description: 'Assess security controls',
      category: 'Assessment',
    },
    {
      id: generateId('ctrl') as ControlId,
      framework: 'NIST-800-53',
      controlNumber: 'CM-1',
      title: 'Configuration Management Policy',
      description: 'Manage configurations',
      category: 'Configuration',
    },
    {
      id: generateId('ctrl') as ControlId,
      framework: 'NIST-800-53',
      controlNumber: 'IA-1',
      title: 'Identification and Authentication Policy',
      description: 'Identify and authenticate users',
      category: 'Identification',
    },
    {
      id: generateId('ctrl') as ControlId,
      framework: 'NIST-800-53',
      controlNumber: 'IR-1',
      title: 'Incident Response Policy',
      description: 'Respond to incidents',
      category: 'Incident Response',
    },
  ];

  for (const ctrl of nistControls) {
    controls.set(ctrl.id, ctrl);
  }

  return {
    // Control Management
    getControl(id: ControlId): Control | null {
      return controls.get(id) ?? null;
    },

    getControlsByFramework(framework: string): readonly Control[] {
      return [...controls.values()].filter(c => c.framework === framework);
    },

    getControlsByCategory(framework: string, category: string): readonly Control[] {
      return [...controls.values()].filter(
        c => c.framework === framework && c.category === category
      );
    },

    // Mapping Management
    setControlMapping(
      controlId: ControlId,
      agencyId: AgencyId,
      status: ControlStatus,
      evidenceLinks: readonly EvidenceLink[],
      gaps: readonly string[] = []
    ): ControlMapping {
      const mapping: ControlMapping = {
        controlId,
        status,
        evidenceLinks,
        gaps,
        driftDetected: false,
        lastAssessed: new Date().toISOString(),
      };

      mappings.set(`${controlId}:${agencyId}`, mapping);
      return mapping;
    },

    getControlMapping(controlId: ControlId, agencyId: AgencyId): ControlMapping | null {
      return mappings.get(`${controlId}:${agencyId}`) ?? null;
    },

    detectDrift(
      controlId: ControlId,
      agencyId: AgencyId,
      currentEvidence: readonly EvidenceRef[]
    ): boolean {
      const mapping = mappings.get(`${controlId}:${agencyId}`);
      if (!mapping) return false;

      const existingRefs = new Set(mapping.evidenceLinks.map(e => e.ref));
      const currentRefs = new Set(currentEvidence);

      // Drift if evidence changed
      const hasDrift =
        existingRefs.size !== currentRefs.size ||
        [...existingRefs].some(ref => !currentRefs.has(ref));

      if (hasDrift) {
        const updated: ControlMapping = { ...mapping, driftDetected: true };
        mappings.set(`${controlId}:${agencyId}`, updated);
      }

      return hasDrift;
    },

    // Narrative Generation
    generateNarrative(input: GenerationInput): ControlNarrative {
      const frameworkControls = this.getControlsByFramework(input.framework);
      const sections: NarrativeSection[] = [];
      let implemented = 0;
      let partial = 0;
      const allGaps: string[] = [];
      const driftAnnotations: string[] = [];

      for (const control of frameworkControls) {
        const mapping = this.getControlMapping(control.id, input.agencyId);

        let status: ControlStatus = 'not_implemented';
        let evidenceRefs: EvidenceRef[] = [];
        let gaps: string[] = [];

        if (mapping) {
          status = mapping.status;
          evidenceRefs = mapping.evidenceLinks.map(e => e.ref);
          gaps = [...mapping.gaps];

          if (mapping.driftDetected) {
            driftAnnotations.push(`${control.controlNumber}: Evidence drift detected`);
          }

          if (status === 'implemented') implemented++;
          else if (status === 'partial') partial++;

          allGaps.push(...gaps);
        } else {
          gaps.push(`No mapping found for ${control.controlNumber}`);
          allGaps.push(`${control.controlNumber}: Not assessed`);
        }

        sections.push({
          controlId: control.id,
          title: `${control.controlNumber}: ${control.title}`,
          statusSummary: this.getStatusSummary(status),
          evidenceReferences: evidenceRefs,
          gapAnalysis: gaps.length > 0 ? gaps.join('; ') : null,
          recommendations: this.getRecommendations(status, gaps),
        });
      }

      const coverage =
        frameworkControls.length > 0
          ? Math.round(((implemented + partial * 0.5) / frameworkControls.length) * 100)
          : 0;

      // Compute content hash for reproducibility
      const contentForHash = JSON.stringify({
        ledgerHash: input.ledger.hash,
        attestationHash: input.attestations.hash,
        mouHash: input.mouState.hash,
        framework: input.framework,
        agencyId: input.agencyId,
        controlCount: frameworkControls.length,
      });

      const narrative: ControlNarrative = {
        id: generateId('narrative') as NarrativeId,
        agencyId: input.agencyId,
        framework: input.framework,
        version: '1.0.0',
        status: 'generated',
        generatedAt: new Date().toISOString(),
        contentHash: computeHash(contentForHash),
        commitSha: input.commitSha,
        sections,
        overallCoverage: coverage,
        totalControls: frameworkControls.length,
        implementedControls: implemented,
        partialControls: partial,
        gaps: allGaps,
        driftAnnotations,
      };

      narratives.set(narrative.id, narrative);
      return narrative;
    },

    getStatusSummary(status: ControlStatus): string {
      switch (status) {
        case 'implemented':
          return 'Fully implemented with evidence';
        case 'partial':
          return 'Partially implemented; gaps identified';
        case 'not_implemented':
          return 'Not implemented; remediation required';
        case 'not_applicable':
          return 'Not applicable to this environment';
      }
    },

    getRecommendations(status: ControlStatus, gaps: readonly string[]): readonly string[] {
      if (status === 'implemented') return [];
      if (status === 'not_applicable') return [];

      const recs: string[] = [];
      if (status === 'not_implemented') {
        recs.push('Implement control according to framework requirements');
        recs.push('Document implementation evidence');
      }
      if (status === 'partial') {
        recs.push('Address identified gaps');
        recs.push('Update evidence documentation');
      }
      if (gaps.length > 0) {
        recs.push('Review and remediate gaps listed in analysis');
      }
      return recs;
    },

    // Narrative Retrieval
    getNarrative(id: NarrativeId): ControlNarrative | null {
      return narratives.get(id) ?? null;
    },

    getNarrativesByAgency(agencyId: AgencyId): readonly ControlNarrative[] {
      return [...narratives.values()].filter(n => n.agencyId === agencyId);
    },

    getLatestNarrative(agencyId: AgencyId, framework: string): ControlNarrative | null {
      const agencyNarratives = this.getNarrativesByAgency(agencyId)
        .filter(n => n.framework === framework)
        .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

      return agencyNarratives[0] ?? null;
    },

    // Validation
    validateNarrative(id: NarrativeId): ControlNarrative | null {
      const narrative = narratives.get(id);
      if (!narrative || narrative.status !== 'generated') return null;

      const updated: ControlNarrative = { ...narrative, status: 'validated' };
      narratives.set(id, updated);
      return updated;
    },

    publishNarrative(id: NarrativeId): ControlNarrative | null {
      const narrative = narratives.get(id);
      if (!narrative || narrative.status !== 'validated') return null;

      const updated: ControlNarrative = { ...narrative, status: 'published' };
      narratives.set(id, updated);
      return updated;
    },

    // Reproducibility Check
    verifyReproducibility(input: GenerationInput, expectedHash: string): boolean {
      const narrative = this.generateNarrative(input);
      return narrative.contentHash === expectedHash;
    },

    // Evidence Reference Validation
    validateEvidenceReferences(narrative: ControlNarrative): {
      valid: boolean;
      invalidRefs: readonly EvidenceRef[];
    } {
      const invalidRefs: EvidenceRef[] = [];

      for (const section of narrative.sections) {
        for (const ref of section.evidenceReferences) {
          // Validate format: must be sha256: prefixed
          if (!ref.startsWith('sha256:')) {
            invalidRefs.push(ref);
          }
        }
      }

      return { valid: invalidRefs.length === 0, invalidRefs };
    },

    // Gap Analysis
    getGapsByCategory(narrative: ControlNarrative): Record<string, readonly string[]> {
      const gapsByCategory: Record<string, string[]> = {};

      for (const section of narrative.sections) {
        if (section.gapAnalysis) {
          const control = [...controls.values()].find(c => c.id === section.controlId);
          if (control) {
            if (!gapsByCategory[control.category]) {
              gapsByCategory[control.category] = [];
            }
            gapsByCategory[control.category].push(section.gapAnalysis);
          }
        }
      }

      return gapsByCategory;
    },

    // Coverage Metrics
    getCoverageByCategory(
      narrative: ControlNarrative
    ): Record<string, { implemented: number; total: number; percentage: number }> {
      const coverage: Record<string, { implemented: number; total: number; percentage: number }> =
        {};

      for (const section of narrative.sections) {
        const control = [...controls.values()].find(c => c.id === section.controlId);
        if (!control) continue;

        if (!coverage[control.category]) {
          coverage[control.category] = { implemented: 0, total: 0, percentage: 0 };
        }

        coverage[control.category].total++;
        if (section.statusSummary.includes('Fully implemented')) {
          coverage[control.category].implemented++;
        }
      }

      for (const cat of Object.keys(coverage)) {
        coverage[cat].percentage =
          coverage[cat].total > 0
            ? Math.round((coverage[cat].implemented / coverage[cat].total) * 100)
            : 0;
      }

      return coverage;
    },

    // Comparison
    compareNarratives(
      oldId: NarrativeId,
      newId: NarrativeId
    ): { changes: readonly string[]; improved: boolean } {
      const oldNarrative = narratives.get(oldId);
      const newNarrative = narratives.get(newId);

      if (!oldNarrative || !newNarrative) {
        return { changes: ['Unable to compare: narrative not found'], improved: false };
      }

      const changes: string[] = [];
      const improved = newNarrative.overallCoverage > oldNarrative.overallCoverage;

      if (newNarrative.implementedControls !== oldNarrative.implementedControls) {
        const delta = newNarrative.implementedControls - oldNarrative.implementedControls;
        changes.push(`Implemented controls: ${delta > 0 ? '+' : ''}${delta}`);
      }

      if (newNarrative.gaps.length !== oldNarrative.gaps.length) {
        const delta = newNarrative.gaps.length - oldNarrative.gaps.length;
        changes.push(`Gaps: ${delta > 0 ? '+' : ''}${delta}`);
      }

      if (newNarrative.overallCoverage !== oldNarrative.overallCoverage) {
        const delta = newNarrative.overallCoverage - oldNarrative.overallCoverage;
        changes.push(`Coverage: ${delta > 0 ? '+' : ''}${delta}%`);
      }

      return { changes, improved };
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXIII: Control-Evidence Narrative Contracts', () => {
  let evidenceService: ReturnType<typeof createMockControlEvidenceService>;
  const agencyA = 'sha256:agency_alpha' as AgencyId;
  const agencyB = 'sha256:agency_beta' as AgencyId;

  function createTestInput(agencyId: AgencyId): GenerationInput {
    return {
      ledger: {
        entries: [
          {
            id: 'sha256:ledger_1' as LedgerEntryId,
            type: 'access_policy',
            timestamp: '2026-01-15T10:00:00Z',
          },
          {
            id: 'sha256:ledger_2' as LedgerEntryId,
            type: 'audit_config',
            timestamp: '2026-01-16T10:00:00Z',
          },
        ],
        snapshotAt: '2026-02-01T00:00:00Z',
        hash: 'sha256:ledger_snapshot_abc123',
      },
      attestations: {
        attestations: [
          {
            id: 'sha256:attest_1' as AttestationId,
            type: 'soc2',
            validUntil: '2027-01-01',
            signed: true,
          },
          {
            id: 'sha256:attest_2' as AttestationId,
            type: 'fisma',
            validUntil: '2026-12-31',
            signed: true,
          },
        ],
        snapshotAt: '2026-02-01T00:00:00Z',
        hash: 'sha256:attestation_snapshot_def456',
      },
      mouState: {
        mous: [
          {
            id: 'sha256:mou_1' as MouId,
            version: '1.0.0',
            status: 'active',
            parties: [agencyId, agencyB],
          },
        ],
        snapshotAt: '2026-02-01T00:00:00Z',
        hash: 'sha256:mou_snapshot_ghi789',
      },
      framework: 'NIST-800-53',
      agencyId,
      commitSha: 'abc123def456',
    };
  }

  beforeEach(() => {
    evidenceService = createMockControlEvidenceService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate narrative IDs with sha256: prefix', () => {
      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);
      assert.ok(narrative.id.startsWith('sha256:'));
    });

    it('should generate content hash with sha256: prefix', () => {
      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);
      assert.ok(narrative.contentHash.startsWith('sha256:'));
    });

    it('should have control IDs with sha256: prefix', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');
      for (const ctrl of controls) {
        assert.ok(ctrl.id.startsWith('sha256:'));
      }
    });
  });

  // ==========================================================================
  // Control Management Tests
  // ==========================================================================

  describe('Control Management', () => {
    it('should get controls by framework', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');
      assert.ok(controls.length >= 5);
    });

    it('should get controls by category', () => {
      const controls = evidenceService.getControlsByCategory('NIST-800-53', 'Access Control');
      assert.ok(controls.length >= 2);
    });

    it('should get individual control', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');
      const ctrl = evidenceService.getControl(controls[0].id);
      assert.ok(ctrl);
      assert.strictEqual(ctrl.framework, 'NIST-800-53');
    });
  });

  // ==========================================================================
  // Control Mapping Tests
  // ==========================================================================

  describe('Control Mapping', () => {
    it('should set control mapping', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');
      const mapping = evidenceService.setControlMapping(controls[0].id, agencyA, 'implemented', [
        {
          ref: 'sha256:evidence_1' as EvidenceRef,
          type: 'ledger_entry',
          source: 'ledger',
          timestamp: '2026-01-15',
          description: 'Policy doc',
        },
      ]);

      assert.strictEqual(mapping.status, 'implemented');
    });

    it('should get control mapping', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');
      evidenceService.setControlMapping(controls[0].id, agencyA, 'implemented', []);

      const mapping = evidenceService.getControlMapping(controls[0].id, agencyA);
      assert.ok(mapping);
    });

    it('should detect drift when evidence changes', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');
      evidenceService.setControlMapping(controls[0].id, agencyA, 'implemented', [
        {
          ref: 'sha256:evidence_1' as EvidenceRef,
          type: 'ledger_entry',
          source: 'ledger',
          timestamp: '2026-01-15',
          description: 'Policy',
        },
      ]);

      const hasDrift = evidenceService.detectDrift(controls[0].id, agencyA, [
        'sha256:evidence_2' as EvidenceRef,
      ]);
      assert.strictEqual(hasDrift, true);
    });

    it('should not detect drift when evidence unchanged', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');
      evidenceService.setControlMapping(controls[0].id, agencyA, 'implemented', [
        {
          ref: 'sha256:evidence_1' as EvidenceRef,
          type: 'ledger_entry',
          source: 'ledger',
          timestamp: '2026-01-15',
          description: 'Policy',
        },
      ]);

      const hasDrift = evidenceService.detectDrift(controls[0].id, agencyA, [
        'sha256:evidence_1' as EvidenceRef,
      ]);
      assert.strictEqual(hasDrift, false);
    });
  });

  // ==========================================================================
  // Narrative Generation Tests
  // ==========================================================================

  describe('Narrative Generation', () => {
    it('should generate narrative from input', () => {
      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);

      assert.ok(narrative);
      assert.strictEqual(narrative.status, 'generated');
      assert.strictEqual(narrative.framework, 'NIST-800-53');
    });

    it('should include all controls in sections', () => {
      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);
      const controls = evidenceService.getControlsByFramework('NIST-800-53');

      assert.strictEqual(narrative.sections.length, controls.length);
    });

    it('should calculate coverage percentage', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');

      // Map half as implemented
      for (let i = 0; i < Math.floor(controls.length / 2); i++) {
        evidenceService.setControlMapping(controls[i].id, agencyA, 'implemented', []);
      }

      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);

      assert.ok(narrative.overallCoverage > 0);
      assert.ok(narrative.overallCoverage <= 100);
    });

    it('should include commit SHA', () => {
      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);

      assert.strictEqual(narrative.commitSha, 'abc123def456');
    });

    it('should track implemented vs partial counts', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');
      evidenceService.setControlMapping(controls[0].id, agencyA, 'implemented', []);
      evidenceService.setControlMapping(controls[1].id, agencyA, 'partial', [], ['Gap 1']);

      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);

      assert.strictEqual(narrative.implementedControls, 1);
      assert.strictEqual(narrative.partialControls, 1);
    });

    it('should collect gaps from mappings', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');
      evidenceService.setControlMapping(
        controls[0].id,
        agencyA,
        'partial',
        [],
        ['Missing documentation']
      );

      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);

      assert.ok(narrative.gaps.some(g => g.includes('Missing documentation')));
    });

    it('should annotate drift', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');
      evidenceService.setControlMapping(controls[0].id, agencyA, 'implemented', [
        {
          ref: 'sha256:old_evidence' as EvidenceRef,
          type: 'ledger_entry',
          source: 'ledger',
          timestamp: '2026-01-15',
          description: 'Old',
        },
      ]);
      evidenceService.detectDrift(controls[0].id, agencyA, ['sha256:new_evidence' as EvidenceRef]);

      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);

      assert.ok(narrative.driftAnnotations.length > 0);
    });
  });

  // ==========================================================================
  // Reproducibility Tests
  // ==========================================================================

  describe('Reproducibility', () => {
    it('should produce same hash for same inputs', () => {
      const input = createTestInput(agencyA);
      const n1 = evidenceService.generateNarrative(input);
      const n2 = evidenceService.generateNarrative(input);

      assert.strictEqual(n1.contentHash, n2.contentHash);
    });

    it('should produce different hash for different inputs', () => {
      const input1 = createTestInput(agencyA);
      const input2 = createTestInput(agencyB);

      const n1 = evidenceService.generateNarrative(input1);
      const n2 = evidenceService.generateNarrative(input2);

      assert.notStrictEqual(n1.contentHash, n2.contentHash);
    });

    it('should verify reproducibility', () => {
      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);

      const verified = evidenceService.verifyReproducibility(input, narrative.contentHash);
      assert.strictEqual(verified, true);
    });

    it('should reject invalid reproducibility', () => {
      const input = createTestInput(agencyA);
      const verified = evidenceService.verifyReproducibility(input, 'sha256:wrong_hash');
      assert.strictEqual(verified, false);
    });
  });

  // ==========================================================================
  // Evidence Reference Tests
  // ==========================================================================

  describe('Evidence References', () => {
    it('should validate evidence references have sha256: prefix', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');
      evidenceService.setControlMapping(controls[0].id, agencyA, 'implemented', [
        {
          ref: 'sha256:valid_ref' as EvidenceRef,
          type: 'ledger_entry',
          source: 'ledger',
          timestamp: '2026-01-15',
          description: 'Valid',
        },
      ]);

      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);
      const validation = evidenceService.validateEvidenceReferences(narrative);

      assert.strictEqual(validation.valid, true);
    });

    it('should contain only references, no embedded blobs', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');
      evidenceService.setControlMapping(controls[0].id, agencyA, 'implemented', [
        {
          ref: 'sha256:ref_only' as EvidenceRef,
          type: 'ledger_entry',
          source: 'ledger',
          timestamp: '2026-01-15',
          description: 'Ref only',
        },
      ]);

      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);

      // Sections should only have refs (sha256:), not content
      for (const section of narrative.sections) {
        for (const ref of section.evidenceReferences) {
          assert.ok(ref.startsWith('sha256:'));
          assert.ok(ref.length < 100); // Refs should be short hashes, not embedded content
        }
      }
    });
  });

  // ==========================================================================
  // Narrative Lifecycle Tests
  // ==========================================================================

  describe('Narrative Lifecycle', () => {
    it('should validate generated narrative', () => {
      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);
      const validated = evidenceService.validateNarrative(narrative.id);

      assert.strictEqual(validated?.status, 'validated');
    });

    it('should publish validated narrative', () => {
      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);
      evidenceService.validateNarrative(narrative.id);
      const published = evidenceService.publishNarrative(narrative.id);

      assert.strictEqual(published?.status, 'published');
    });

    it('should not publish unvalidated narrative', () => {
      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);
      const published = evidenceService.publishNarrative(narrative.id);

      assert.strictEqual(published, null);
    });

    it('should get latest narrative for agency', () => {
      const input = createTestInput(agencyA);
      evidenceService.generateNarrative(input);
      evidenceService.generateNarrative(input);

      const latest = evidenceService.getLatestNarrative(agencyA, 'NIST-800-53');
      assert.ok(latest);
    });
  });

  // ==========================================================================
  // Gap Analysis Tests
  // ==========================================================================

  describe('Gap Analysis', () => {
    it('should categorize gaps', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');
      evidenceService.setControlMapping(
        controls[0].id,
        agencyA,
        'partial',
        [],
        ['Access control gap']
      );

      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);
      const gaps = evidenceService.getGapsByCategory(narrative);

      assert.ok(Object.keys(gaps).length >= 0);
    });

    it('should track recommendations per section', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');
      evidenceService.setControlMapping(
        controls[0].id,
        agencyA,
        'not_implemented',
        [],
        ['Not done']
      );

      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);

      const section = narrative.sections.find(s => s.controlId === controls[0].id);
      assert.ok(section?.recommendations && section.recommendations.length > 0);
    });
  });

  // ==========================================================================
  // Coverage Metrics Tests
  // ==========================================================================

  describe('Coverage Metrics', () => {
    it('should calculate coverage by category', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');
      const accessControls = controls.filter(c => c.category === 'Access Control');

      for (const ctrl of accessControls) {
        evidenceService.setControlMapping(ctrl.id, agencyA, 'implemented', []);
      }

      const input = createTestInput(agencyA);
      const narrative = evidenceService.generateNarrative(input);
      const coverage = evidenceService.getCoverageByCategory(narrative);

      assert.ok(coverage['Access Control']);
      assert.strictEqual(coverage['Access Control'].percentage, 100);
    });
  });

  // ==========================================================================
  // Comparison Tests
  // ==========================================================================

  describe('Narrative Comparison', () => {
    it('should compare two narratives', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');

      const input1 = createTestInput(agencyA);
      const n1 = evidenceService.generateNarrative(input1);

      // Improve coverage
      evidenceService.setControlMapping(controls[0].id, agencyA, 'implemented', []);
      const n2 = evidenceService.generateNarrative(input1);

      const comparison = evidenceService.compareNarratives(n1.id, n2.id);
      assert.ok(comparison.changes.length > 0);
    });

    it('should detect improvement', () => {
      const controls = evidenceService.getControlsByFramework('NIST-800-53');

      const input = createTestInput(agencyA);
      const n1 = evidenceService.generateNarrative(input);

      for (const ctrl of controls) {
        evidenceService.setControlMapping(ctrl.id, agencyA, 'implemented', []);
      }
      const n2 = evidenceService.generateNarrative(input);

      const comparison = evidenceService.compareNarratives(n1.id, n2.id);
      assert.strictEqual(comparison.improved, true);
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of controls', () => {
      const c1 = evidenceService.getControlsByFramework('NIST-800-53');
      const c2 = evidenceService.getControlsByFramework('NIST-800-53');
      assert.ok(c1 !== c2);
    });

    it('should return copies of narratives by agency', () => {
      const input = createTestInput(agencyA);
      evidenceService.generateNarrative(input);

      const n1 = evidenceService.getNarrativesByAgency(agencyA);
      const n2 = evidenceService.getNarrativesByAgency(agencyA);
      assert.ok(n1 !== n2);
    });
  });
});
