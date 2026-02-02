/**
 * Compliance Automation: Framework Mapping Contract Tests
 *
 * Phase X - Control-to-framework mapping with drift detection.
 *
 * CONTRACT SURFACE:
 * - Framework Registry: FISMA, NIST 800-53, CJIS, FedRAMP overlays
 * - Control Mapping: TerraFusion controls → framework requirements
 * - Drift Detection: Gap analysis and compliance drift
 * - Coverage Reporting: Framework coverage metrics
 *
 * INVARIANTS:
 * - All frameworks have canonical identifiers
 * - Mappings are versioned and auditable
 * - Drift detection is idempotent
 * - Coverage must be calculable
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type FrameworkId = 'fisma' | 'nist-800-53' | 'cjis' | 'fedramp-moderate' | 'fedramp-high';
type MappingStatus = 'mapped' | 'partial' | 'unmapped' | 'not-applicable';
type DriftSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type CoverageLevel = 'full' | 'partial' | 'minimal' | 'none';

/**
 * Framework definition
 */
interface Framework {
  readonly framework_id: FrameworkId;
  readonly name: string;
  readonly version: string;
  readonly total_requirements: number;
  readonly requirement_ids: readonly string[];
  readonly updated_at: string;
}

/**
 * Framework requirement
 */
interface FrameworkRequirement {
  readonly requirement_id: string;
  readonly framework_id: FrameworkId;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly priority: 'P1' | 'P2' | 'P3';
  readonly control_family: string;
}

/**
 * Control mapping
 */
interface ControlMapping {
  readonly mapping_id: string;
  readonly control_id: string;
  readonly requirement_id: string;
  readonly framework_id: FrameworkId;
  readonly status: MappingStatus;
  readonly evidence_refs: readonly string[];
  readonly notes?: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly version: number;
}

/**
 * Drift finding
 */
interface DriftFinding {
  readonly finding_id: string;
  readonly framework_id: FrameworkId;
  readonly requirement_id: string;
  readonly severity: DriftSeverity;
  readonly description: string;
  readonly current_state: string;
  readonly expected_state: string;
  readonly detected_at: string;
  readonly resolved_at?: string;
}

/**
 * Coverage report
 */
interface CoverageReport {
  readonly report_id: string;
  readonly framework_id: FrameworkId;
  readonly total_requirements: number;
  readonly mapped_requirements: number;
  readonly partial_requirements: number;
  readonly unmapped_requirements: number;
  readonly not_applicable: number;
  readonly coverage_percentage: number;
  readonly coverage_level: CoverageLevel;
  readonly generated_at: string;
}

/**
 * Gap analysis result
 */
interface GapAnalysis {
  readonly analysis_id: string;
  readonly framework_id: FrameworkId;
  readonly gaps: readonly GapItem[];
  readonly total_gaps: number;
  readonly critical_gaps: number;
  readonly analyzed_at: string;
}

/**
 * Gap item
 */
interface GapItem {
  readonly requirement_id: string;
  readonly requirement_title: string;
  readonly gap_type: 'missing_control' | 'partial_coverage' | 'missing_evidence';
  readonly severity: DriftSeverity;
  readonly remediation_suggestion?: string;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockFramework(overrides: Partial<Framework> = {}): Framework {
  return {
    framework_id: 'nist-800-53',
    name: 'NIST 800-53 Rev 5',
    version: '5.1.0',
    total_requirements: 1189,
    requirement_ids: [
      'AC-1',
      'AC-2',
      'AC-3',
      'AU-1',
      'AU-2',
      'IA-1',
      'IA-2',
      'IA-5',
      'SC-1',
      'SC-8',
    ],
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockRequirement(
  overrides: Partial<FrameworkRequirement> = {}
): FrameworkRequirement {
  return {
    requirement_id: 'AC-2',
    framework_id: 'nist-800-53',
    title: 'Account Management',
    description: 'Manage system accounts including establishing, activating, modifying...',
    category: 'Access Control',
    priority: 'P1',
    control_family: 'AC',
    ...overrides,
  };
}

function createMockControlMapping(overrides: Partial<ControlMapping> = {}): ControlMapping {
  const mappingId = `map-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    mapping_id: `sha256:${Buffer.from(mappingId).toString('hex').slice(0, 64)}`,
    control_id: 'tf-identity-001',
    requirement_id: 'IA-2',
    framework_id: 'nist-800-53',
    status: 'mapped',
    evidence_refs: [`sha256:${Buffer.from('evidence-1').toString('hex').slice(0, 64)}`],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    ...overrides,
  };
}

function createMockDriftFinding(overrides: Partial<DriftFinding> = {}): DriftFinding {
  const findingId = `drift-${Date.now()}`;
  return {
    finding_id: `sha256:${Buffer.from(findingId).toString('hex').slice(0, 64)}`,
    framework_id: 'nist-800-53',
    requirement_id: 'AC-2',
    severity: 'medium',
    description: 'Control mapping outdated',
    current_state: 'v2.0.0',
    expected_state: 'v2.1.0',
    detected_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockCoverageReport(overrides: Partial<CoverageReport> = {}): CoverageReport {
  const reportId = `cov-${Date.now()}`;
  return {
    report_id: `sha256:${Buffer.from(reportId).toString('hex').slice(0, 64)}`,
    framework_id: 'nist-800-53',
    total_requirements: 100,
    mapped_requirements: 75,
    partial_requirements: 15,
    unmapped_requirements: 5,
    not_applicable: 5,
    coverage_percentage: 90,
    coverage_level: 'full',
    generated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// MOCK FRAMEWORK MAPPING STORE
// ============================================================================

interface FrameworkMappingStore {
  // Framework Registry
  registerFramework(framework: Omit<Framework, 'updated_at'>): Promise<Framework>;
  getFramework(frameworkId: FrameworkId): Promise<Framework | null>;
  listFrameworks(): Promise<readonly Framework[]>;

  // Requirements
  addRequirement(requirement: FrameworkRequirement): Promise<FrameworkRequirement>;
  getRequirement(
    requirementId: string,
    frameworkId: FrameworkId
  ): Promise<FrameworkRequirement | null>;
  listRequirements(frameworkId: FrameworkId): Promise<readonly FrameworkRequirement[]>;

  // Control Mappings
  createMapping(
    controlId: string,
    requirementId: string,
    frameworkId: FrameworkId
  ): Promise<ControlMapping>;
  getMapping(mappingId: string): Promise<ControlMapping | null>;
  getMappingsForControl(controlId: string): Promise<readonly ControlMapping[]>;
  getMappingsForRequirement(
    requirementId: string,
    frameworkId: FrameworkId
  ): Promise<readonly ControlMapping[]>;
  updateMappingStatus(mappingId: string, status: MappingStatus): Promise<ControlMapping>;

  // Drift Detection
  detectDrift(frameworkId: FrameworkId): Promise<readonly DriftFinding[]>;
  resolveDrift(findingId: string): Promise<DriftFinding>;
  getOpenDriftFindings(frameworkId: FrameworkId): Promise<readonly DriftFinding[]>;

  // Coverage
  generateCoverageReport(frameworkId: FrameworkId): Promise<CoverageReport>;
  getCoverageHistory(frameworkId: FrameworkId): Promise<readonly CoverageReport[]>;

  // Gap Analysis
  analyzeGaps(frameworkId: FrameworkId): Promise<GapAnalysis>;
}

function createMockFrameworkMappingStore(): FrameworkMappingStore {
  const frameworks: Map<FrameworkId, Framework> = new Map();
  const requirements: Map<string, FrameworkRequirement> = new Map();
  const mappings: Map<string, ControlMapping> = new Map();
  const driftFindings: Map<string, DriftFinding> = new Map();
  const coverageReports: Map<FrameworkId, CoverageReport[]> = new Map();

  // Pre-populate with sample frameworks
  const fisma = createMockFramework({
    framework_id: 'fisma',
    name: 'FISMA 2014',
    version: '2014.1',
    total_requirements: 325,
  });
  const nist = createMockFramework({
    framework_id: 'nist-800-53',
    name: 'NIST 800-53 Rev 5',
    version: '5.1.0',
    total_requirements: 1189,
  });
  const cjis = createMockFramework({
    framework_id: 'cjis',
    name: 'CJIS Security Policy',
    version: '5.9.2',
    total_requirements: 89,
  });
  const fedrampMod = createMockFramework({
    framework_id: 'fedramp-moderate',
    name: 'FedRAMP Moderate',
    version: '4.0',
    total_requirements: 325,
  });

  frameworks.set('fisma', fisma);
  frameworks.set('nist-800-53', nist);
  frameworks.set('cjis', cjis);
  frameworks.set('fedramp-moderate', fedrampMod);

  return {
    async registerFramework(framework) {
      const full: Framework = {
        ...framework,
        updated_at: new Date().toISOString(),
      };
      frameworks.set(framework.framework_id, full);
      return full;
    },

    async getFramework(frameworkId) {
      return frameworks.get(frameworkId) ?? null;
    },

    async listFrameworks() {
      return Array.from(frameworks.values());
    },

    async addRequirement(requirement) {
      const key = `${requirement.framework_id}:${requirement.requirement_id}`;
      requirements.set(key, requirement);
      return requirement;
    },

    async getRequirement(requirementId, frameworkId) {
      const key = `${frameworkId}:${requirementId}`;
      return requirements.get(key) ?? null;
    },

    async listRequirements(frameworkId) {
      return Array.from(requirements.values()).filter(r => r.framework_id === frameworkId);
    },

    async createMapping(controlId, requirementId, frameworkId) {
      const mapping = createMockControlMapping({
        control_id: controlId,
        requirement_id: requirementId,
        framework_id: frameworkId,
      });
      mappings.set(mapping.mapping_id, mapping);
      return mapping;
    },

    async getMapping(mappingId) {
      return mappings.get(mappingId) ?? null;
    },

    async getMappingsForControl(controlId) {
      return Array.from(mappings.values()).filter(m => m.control_id === controlId);
    },

    async getMappingsForRequirement(requirementId, frameworkId) {
      return Array.from(mappings.values()).filter(
        m => m.requirement_id === requirementId && m.framework_id === frameworkId
      );
    },

    async updateMappingStatus(mappingId, status) {
      const mapping = mappings.get(mappingId);
      if (!mapping) throw new Error(`Mapping not found: ${mappingId}`);

      const updated: ControlMapping = {
        ...mapping,
        status,
        updated_at: new Date().toISOString(),
        version: mapping.version + 1,
      };
      mappings.set(mappingId, updated);
      return updated;
    },

    async detectDrift(frameworkId) {
      // Simulate drift detection
      const findings: DriftFinding[] = [
        createMockDriftFinding({
          framework_id: frameworkId,
          requirement_id: 'AC-2',
          severity: 'medium',
          description: 'Account management control has outdated evidence',
        }),
      ];
      findings.forEach(f => driftFindings.set(f.finding_id, f));
      return findings;
    },

    async resolveDrift(findingId) {
      const finding = driftFindings.get(findingId);
      if (!finding) throw new Error(`Finding not found: ${findingId}`);

      const resolved: DriftFinding = {
        ...finding,
        resolved_at: new Date().toISOString(),
      };
      driftFindings.set(findingId, resolved);
      return resolved;
    },

    async getOpenDriftFindings(frameworkId) {
      return Array.from(driftFindings.values()).filter(
        f => f.framework_id === frameworkId && !f.resolved_at
      );
    },

    async generateCoverageReport(frameworkId) {
      const framework = frameworks.get(frameworkId);
      if (!framework) throw new Error(`Framework not found: ${frameworkId}`);

      const frameworkMappings = Array.from(mappings.values()).filter(
        m => m.framework_id === frameworkId
      );
      const mapped = frameworkMappings.filter(m => m.status === 'mapped').length;
      const partial = frameworkMappings.filter(m => m.status === 'partial').length;
      const notApplicable = frameworkMappings.filter(m => m.status === 'not-applicable').length;

      // Simulated coverage
      const total = Math.max(10, mapped + partial + notApplicable + 5);
      const coverage = Math.round(((mapped + partial * 0.5) / total) * 100);

      let level: CoverageLevel = 'none';
      if (coverage >= 90) level = 'full';
      else if (coverage >= 70) level = 'partial';
      else if (coverage >= 30) level = 'minimal';

      const report = createMockCoverageReport({
        framework_id: frameworkId,
        total_requirements: total,
        mapped_requirements: mapped,
        partial_requirements: partial,
        unmapped_requirements: total - mapped - partial - notApplicable,
        not_applicable: notApplicable,
        coverage_percentage: coverage,
        coverage_level: level,
      });

      const existing = coverageReports.get(frameworkId) ?? [];
      coverageReports.set(frameworkId, [...existing, report]);

      return report;
    },

    async getCoverageHistory(frameworkId) {
      return coverageReports.get(frameworkId) ?? [];
    },

    async analyzeGaps(frameworkId) {
      const framework = frameworks.get(frameworkId);
      if (!framework) throw new Error(`Framework not found: ${frameworkId}`);

      const gaps: GapItem[] = [
        {
          requirement_id: 'AU-6',
          requirement_title: 'Audit Review, Analysis, and Reporting',
          gap_type: 'missing_control',
          severity: 'high',
          remediation_suggestion: 'Implement centralized audit log analysis',
        },
        {
          requirement_id: 'SC-28',
          requirement_title: 'Protection of Information at Rest',
          gap_type: 'missing_evidence',
          severity: 'medium',
          remediation_suggestion: 'Document encryption-at-rest implementation',
        },
      ];

      const analysisId = `gap-${Date.now()}`;
      const analysis: GapAnalysis = {
        analysis_id: `sha256:${Buffer.from(analysisId).toString('hex').slice(0, 64)}`,
        framework_id: frameworkId,
        gaps,
        total_gaps: gaps.length,
        critical_gaps: gaps.filter(g => g.severity === 'critical').length,
        analyzed_at: new Date().toISOString(),
      };

      return analysis;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Compliance Automation: Framework Mapping Contracts', () => {
  let store: FrameworkMappingStore;

  beforeEach(() => {
    store = createMockFrameworkMappingStore();
  });

  // ==========================================================================
  // CONTRACT: framework_registry
  // ==========================================================================
  describe('CONTRACT: framework_registry', () => {
    it('lists pre-registered frameworks', async () => {
      const frameworks = await store.listFrameworks();

      assert.ok(frameworks.length >= 4);
      const ids = frameworks.map(f => f.framework_id);
      assert.ok(ids.includes('fisma'));
      assert.ok(ids.includes('nist-800-53'));
      assert.ok(ids.includes('cjis'));
    });

    it('retrieves framework by ID', async () => {
      const nist = await store.getFramework('nist-800-53');

      assert.ok(nist);
      assert.strictEqual(nist.name, 'NIST 800-53 Rev 5');
      assert.ok(nist.total_requirements > 0);
    });

    it('registers new framework', async () => {
      const fedrampHigh = await store.registerFramework({
        framework_id: 'fedramp-high',
        name: 'FedRAMP High',
        version: '4.0',
        total_requirements: 421,
        requirement_ids: [],
      });

      assert.strictEqual(fedrampHigh.framework_id, 'fedramp-high');
      assert.ok(fedrampHigh.updated_at);
    });

    it('framework has canonical identifier', async () => {
      const frameworks = await store.listFrameworks();
      const validIds: FrameworkId[] = [
        'fisma',
        'nist-800-53',
        'cjis',
        'fedramp-moderate',
        'fedramp-high',
      ];

      frameworks.forEach(f => {
        assert.ok(validIds.includes(f.framework_id));
      });
    });
  });

  // ==========================================================================
  // CONTRACT: control_mapping
  // ==========================================================================
  describe('CONTRACT: control_mapping', () => {
    it('creates control-to-requirement mapping', async () => {
      const mapping = await store.createMapping('tf-authz-001', 'AC-3', 'nist-800-53');

      assert.ok(mapping.mapping_id.startsWith('sha256:'));
      assert.strictEqual(mapping.control_id, 'tf-authz-001');
      assert.strictEqual(mapping.requirement_id, 'AC-3');
    });

    it('mappings have version number', async () => {
      const mapping = await store.createMapping('tf-audit-001', 'AU-2', 'nist-800-53');

      assert.strictEqual(mapping.version, 1);
    });

    it('updates mapping status increments version', async () => {
      const mapping = await store.createMapping('tf-identity-002', 'IA-5', 'nist-800-53');
      const updated = await store.updateMappingStatus(mapping.mapping_id, 'partial');

      assert.strictEqual(updated.version, 2);
      assert.strictEqual(updated.status, 'partial');
    });

    it('retrieves mappings for control', async () => {
      await store.createMapping('tf-multi-001', 'AC-2', 'nist-800-53');
      await store.createMapping('tf-multi-001', 'AC-2a', 'fisma');

      const mappings = await store.getMappingsForControl('tf-multi-001');

      assert.strictEqual(mappings.length, 2);
    });

    it('mapping IDs are opaque', async () => {
      const mapping = await store.createMapping('tf-secure-001', 'SC-8', 'nist-800-53');

      assert.ok(mapping.mapping_id.startsWith('sha256:'));
      assert.ok(!mapping.mapping_id.includes('tf-secure'));
    });
  });

  // ==========================================================================
  // CONTRACT: drift_detection
  // ==========================================================================
  describe('CONTRACT: drift_detection', () => {
    it('detects drift in framework compliance', async () => {
      const drifts = await store.detectDrift('nist-800-53');

      assert.ok(drifts.length > 0);
      drifts.forEach(d => {
        assert.ok(d.finding_id.startsWith('sha256:'));
        assert.strictEqual(d.framework_id, 'nist-800-53');
      });
    });

    it('drift findings have severity', async () => {
      const drifts = await store.detectDrift('fisma');
      const validSeverities: DriftSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];

      drifts.forEach(d => {
        assert.ok(validSeverities.includes(d.severity));
      });
    });

    it('resolves drift findings', async () => {
      const drifts = await store.detectDrift('cjis');
      const resolved = await store.resolveDrift(drifts[0].finding_id);

      assert.ok(resolved.resolved_at);
    });

    it('lists open drift findings', async () => {
      await store.detectDrift('nist-800-53');
      const open = await store.getOpenDriftFindings('nist-800-53');

      assert.ok(open.length > 0);
      open.forEach(f => {
        assert.ok(!f.resolved_at);
      });
    });

    it('drift detection is idempotent (produces consistent structure)', async () => {
      const drift1 = await store.detectDrift('fedramp-moderate');
      const drift2 = await store.detectDrift('fedramp-moderate');

      // Both calls return same structure (idempotent behavior)
      assert.strictEqual(drift1.length > 0, drift2.length > 0);
    });
  });

  // ==========================================================================
  // CONTRACT: coverage_reporting
  // ==========================================================================
  describe('CONTRACT: coverage_reporting', () => {
    it('generates coverage report', async () => {
      const report = await store.generateCoverageReport('nist-800-53');

      assert.ok(report.report_id.startsWith('sha256:'));
      assert.strictEqual(report.framework_id, 'nist-800-53');
      assert.ok(report.total_requirements > 0);
    });

    it('coverage percentage is calculable', async () => {
      await store.createMapping('tf-cov-001', 'AC-1', 'fisma');
      await store.createMapping('tf-cov-002', 'AC-2', 'fisma');
      const report = await store.generateCoverageReport('fisma');

      assert.ok(typeof report.coverage_percentage === 'number');
      assert.ok(report.coverage_percentage >= 0 && report.coverage_percentage <= 100);
    });

    it('report has coverage level', async () => {
      const report = await store.generateCoverageReport('cjis');
      const validLevels: CoverageLevel[] = ['full', 'partial', 'minimal', 'none'];

      assert.ok(validLevels.includes(report.coverage_level));
    });

    it('maintains coverage history', async () => {
      await store.generateCoverageReport('nist-800-53');
      await store.generateCoverageReport('nist-800-53');
      const history = await store.getCoverageHistory('nist-800-53');

      assert.strictEqual(history.length, 2);
    });
  });

  // ==========================================================================
  // CONTRACT: gap_analysis
  // ==========================================================================
  describe('CONTRACT: gap_analysis', () => {
    it('analyzes compliance gaps', async () => {
      const analysis = await store.analyzeGaps('nist-800-53');

      assert.ok(analysis.analysis_id.startsWith('sha256:'));
      assert.ok(analysis.gaps.length > 0);
    });

    it('gap items have type and severity', async () => {
      const analysis = await store.analyzeGaps('fisma');
      const validTypes = ['missing_control', 'partial_coverage', 'missing_evidence'];
      const validSeverities: DriftSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];

      analysis.gaps.forEach(g => {
        assert.ok(validTypes.includes(g.gap_type));
        assert.ok(validSeverities.includes(g.severity));
      });
    });

    it('tracks critical gap count', async () => {
      const analysis = await store.analyzeGaps('cjis');

      assert.ok(typeof analysis.critical_gaps === 'number');
      assert.ok(analysis.critical_gaps <= analysis.total_gaps);
    });

    it('gaps have remediation suggestions', async () => {
      const analysis = await store.analyzeGaps('nist-800-53');
      const withRemediation = analysis.gaps.filter(g => g.remediation_suggestion);

      assert.ok(withRemediation.length > 0);
    });
  });
});
