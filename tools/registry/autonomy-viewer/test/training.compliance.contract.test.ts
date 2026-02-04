/**
 * Phase XX — Live Adoption Rollout
 * =================================
 * Contract: training.compliance.contract.test.ts
 *
 * Tests operator training and drill compliance tracking,
 * including module completion, certification, and cadence enforcement.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - No individual operator PII exposed — aggregate only
 * - Training completion is auditable
 * - Drill participation meets cadence targets
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type OperatorId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type ModuleId = `sha256:${string}`;
type DrillId = `sha256:${string}`;
type CertificationId = `sha256:${string}`;

type ModuleType =
  | 'runbook'
  | 'cab_process'
  | 'portal_navigation'
  | 'incident_response'
  | 'dr_procedure';
type DrillType = 'tabletop' | 'functional' | 'full_scale' | 'game_day';
type ComplianceStatus = 'compliant' | 'at_risk' | 'non_compliant';

interface TrainingModule {
  readonly id: ModuleId;
  readonly name: string;
  readonly type: ModuleType;
  readonly requiredForRoles: readonly string[];
  readonly estimatedMinutes: number;
  readonly version: string;
  readonly createdAt: string;
}

interface ModuleCompletion {
  readonly operatorId: OperatorId;
  readonly moduleId: ModuleId;
  readonly completedAt: string;
  readonly score: number;
  readonly passed: boolean;
  readonly version: string;
}

interface OperatorCertification {
  readonly id: CertificationId;
  readonly operatorId: OperatorId;
  readonly agencyId: AgencyId;
  readonly role: string;
  readonly certifiedAt: string;
  readonly expiresAt: string;
  readonly modulesCompleted: readonly ModuleId[];
  readonly drillsCompleted: number;
}

interface DrillEvent {
  readonly id: DrillId;
  readonly type: DrillType;
  readonly agencyId: AgencyId;
  readonly scheduledAt: string;
  readonly executedAt?: string;
  readonly participantCount: number;
  readonly passRate: number;
  readonly notes: string;
}

interface DrillCadence {
  readonly drillType: DrillType;
  readonly requiredPerQuarter: number;
  readonly minimumParticipation: number;
}

interface AgencyComplianceStatus {
  readonly agencyId: AgencyId;
  readonly trainingCompletion: number;
  readonly drillParticipation: number;
  readonly certifiedOperators: number;
  readonly totalOperators: number;
  readonly overallStatus: ComplianceStatus;
  readonly lastAssessed: string;
}

interface TrainingComplianceSummary {
  readonly generatedAt: string;
  readonly totalOperators: number;
  readonly certifiedOperators: number;
  readonly avgTrainingCompletion: number;
  readonly avgDrillParticipation: number;
  readonly byAgency: readonly AgencyComplianceStatus[];
  readonly overdueModules: number;
  readonly upcomingDrills: number;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockTrainingComplianceService() {
  const modules = new Map<ModuleId, TrainingModule>();
  const completions: ModuleCompletion[] = [];
  const certifications = new Map<CertificationId, OperatorCertification>();
  const drills = new Map<DrillId, DrillEvent>();
  const operatorAgencies = new Map<OperatorId, AgencyId>();
  const agencyOperatorCounts = new Map<AgencyId, number>();

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  const defaultCadences: DrillCadence[] = [
    { drillType: 'tabletop', requiredPerQuarter: 2, minimumParticipation: 80 },
    { drillType: 'functional', requiredPerQuarter: 1, minimumParticipation: 70 },
    { drillType: 'full_scale', requiredPerQuarter: 1, minimumParticipation: 60 },
    { drillType: 'game_day', requiredPerQuarter: 1, minimumParticipation: 50 },
  ];

  return {
    // Module Management
    createModule(
      name: string,
      type: ModuleType,
      requiredForRoles: readonly string[],
      estimatedMinutes: number
    ): TrainingModule {
      const id = generateId('module') as ModuleId;
      const module: TrainingModule = {
        id,
        name,
        type,
        requiredForRoles,
        estimatedMinutes,
        version: '1.0.0',
        createdAt: new Date().toISOString(),
      };
      modules.set(id, module);
      return module;
    },

    getModule(id: ModuleId): TrainingModule | null {
      return modules.get(id) ?? null;
    },

    getModulesByType(type: ModuleType): readonly TrainingModule[] {
      return [...modules.values()].filter(m => m.type === type);
    },

    getModulesForRole(role: string): readonly TrainingModule[] {
      return [...modules.values()].filter(m => m.requiredForRoles.includes(role));
    },

    // Operator Registration (PII-free)
    registerOperator(operatorId: OperatorId, agencyId: AgencyId): void {
      operatorAgencies.set(operatorId, agencyId);
      const count = agencyOperatorCounts.get(agencyId) ?? 0;
      agencyOperatorCounts.set(agencyId, count + 1);
    },

    getOperatorAgency(operatorId: OperatorId): AgencyId | null {
      return operatorAgencies.get(operatorId) ?? null;
    },

    // Completion Tracking
    recordCompletion(
      operatorId: OperatorId,
      moduleId: ModuleId,
      score: number
    ): ModuleCompletion | null {
      const module = modules.get(moduleId);
      if (!module) return null;

      const completion: ModuleCompletion = {
        operatorId,
        moduleId,
        completedAt: new Date().toISOString(),
        score,
        passed: score >= 80,
        version: module.version,
      };
      completions.push(completion);
      return completion;
    },

    getCompletionsForOperator(operatorId: OperatorId): readonly ModuleCompletion[] {
      return completions.filter(c => c.operatorId === operatorId);
    },

    getCompletionsForModule(moduleId: ModuleId): readonly ModuleCompletion[] {
      return completions.filter(c => c.moduleId === moduleId);
    },

    getOperatorModuleCompletion(
      operatorId: OperatorId,
      moduleId: ModuleId
    ): ModuleCompletion | null {
      return completions.find(c => c.operatorId === operatorId && c.moduleId === moduleId) ?? null;
    },

    calculateOperatorCompletion(
      operatorId: OperatorId,
      requiredModules: readonly ModuleId[]
    ): number {
      const completed = completions.filter(
        c => c.operatorId === operatorId && c.passed && requiredModules.includes(c.moduleId)
      );
      return requiredModules.length > 0
        ? Math.round((completed.length / requiredModules.length) * 100)
        : 100;
    },

    // Certification Management
    issueCertification(
      operatorId: OperatorId,
      role: string,
      modulesCompleted: readonly ModuleId[],
      drillsCompleted: number
    ): OperatorCertification | null {
      const agencyId = operatorAgencies.get(operatorId);
      if (!agencyId) return null;

      // Verify all modules passed
      for (const moduleId of modulesCompleted) {
        const completion = this.getOperatorModuleCompletion(operatorId, moduleId);
        if (!completion?.passed) return null;
      }

      const id = generateId('cert') as CertificationId;
      const certification: OperatorCertification = {
        id,
        operatorId,
        agencyId,
        role,
        certifiedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        modulesCompleted,
        drillsCompleted,
      };
      certifications.set(id, certification);
      return certification;
    },

    getCertification(id: CertificationId): OperatorCertification | null {
      return certifications.get(id) ?? null;
    },

    getOperatorCertifications(operatorId: OperatorId): readonly OperatorCertification[] {
      return [...certifications.values()].filter(c => c.operatorId === operatorId);
    },

    getAgencyCertifications(agencyId: AgencyId): readonly OperatorCertification[] {
      return [...certifications.values()].filter(c => c.agencyId === agencyId);
    },

    isCertificationValid(certId: CertificationId): boolean {
      const cert = certifications.get(certId);
      if (!cert) return false;
      return new Date(cert.expiresAt) > new Date();
    },

    // Drill Management
    scheduleDrill(type: DrillType, agencyId: AgencyId, scheduledAt: string): DrillEvent {
      const id = generateId('drill') as DrillId;
      const drill: DrillEvent = {
        id,
        type,
        agencyId,
        scheduledAt,
        participantCount: 0,
        passRate: 0,
        notes: '',
      };
      drills.set(id, drill);
      return drill;
    },

    executeDrill(
      drillId: DrillId,
      participantCount: number,
      passRate: number,
      notes: string
    ): DrillEvent | null {
      const drill = drills.get(drillId);
      if (!drill) return null;

      const updated: DrillEvent = {
        ...drill,
        executedAt: new Date().toISOString(),
        participantCount,
        passRate,
        notes,
      };
      drills.set(drillId, updated);
      return updated;
    },

    getDrill(id: DrillId): DrillEvent | null {
      return drills.get(id) ?? null;
    },

    getDrillsByAgency(agencyId: AgencyId): readonly DrillEvent[] {
      return [...drills.values()].filter(d => d.agencyId === agencyId);
    },

    getExecutedDrills(): readonly DrillEvent[] {
      return [...drills.values()].filter(d => d.executedAt);
    },

    getUpcomingDrills(): readonly DrillEvent[] {
      const now = new Date();
      return [...drills.values()].filter(d => !d.executedAt && new Date(d.scheduledAt) > now);
    },

    // Cadence Compliance
    getCadenceRequirements(): readonly DrillCadence[] {
      return [...defaultCadences];
    },

    checkDrillCadenceCompliance(
      agencyId: AgencyId,
      quarter: string
    ): {
      compliant: boolean;
      drillsMissing: Record<DrillType, number>;
    } {
      const agencyDrills = this.getDrillsByAgency(agencyId).filter(d => d.executedAt);

      const drillsMissing: Record<DrillType, number> = {
        tabletop: 0,
        functional: 0,
        full_scale: 0,
        game_day: 0,
      };

      let compliant = true;
      for (const cadence of defaultCadences) {
        const count = agencyDrills.filter(d => d.type === cadence.drillType).length;
        const missing = Math.max(0, cadence.requiredPerQuarter - count);
        drillsMissing[cadence.drillType] = missing;
        if (missing > 0) compliant = false;
      }

      return { compliant, drillsMissing };
    },

    // Agency Compliance Status
    calculateAgencyCompliance(agencyId: AgencyId): AgencyComplianceStatus {
      const agencyCerts = this.getAgencyCertifications(agencyId);
      const validCerts = agencyCerts.filter(c => new Date(c.expiresAt) > new Date());
      const totalOperators = agencyOperatorCounts.get(agencyId) ?? 0;

      // Calculate training completion (aggregate)
      const operatorsWithCompletion = new Set<OperatorId>();
      let totalCompletion = 0;
      for (const cert of validCerts) {
        if (!operatorsWithCompletion.has(cert.operatorId)) {
          operatorsWithCompletion.add(cert.operatorId);
          totalCompletion += 100; // Certified = 100%
        }
      }
      const avgTrainingCompletion =
        totalOperators > 0 ? Math.round(totalCompletion / totalOperators) : 0;

      // Calculate drill participation (aggregate)
      const agencyDrills = this.getDrillsByAgency(agencyId).filter(d => d.executedAt);
      const avgDrillParticipation =
        agencyDrills.length > 0
          ? Math.round(
              agencyDrills.reduce((sum, d) => sum + d.participantCount, 0) / agencyDrills.length
            )
          : 0;

      // Determine overall status
      let status: ComplianceStatus = 'compliant';
      if (avgTrainingCompletion < 70 || avgDrillParticipation < 60) {
        status = 'non_compliant';
      } else if (avgTrainingCompletion < 85 || avgDrillParticipation < 75) {
        status = 'at_risk';
      }

      return {
        agencyId,
        trainingCompletion: avgTrainingCompletion,
        drillParticipation: avgDrillParticipation,
        certifiedOperators: validCerts.length,
        totalOperators,
        overallStatus: status,
        lastAssessed: new Date().toISOString(),
      };
    },

    // Summary Generation
    generateComplianceSummary(): TrainingComplianceSummary {
      const allAgencies = [...agencyOperatorCounts.keys()];
      const byAgency = allAgencies.map(agencyId => this.calculateAgencyCompliance(agencyId));

      const totalOperators = [...agencyOperatorCounts.values()].reduce((a, b) => a + b, 0);
      const certifiedOperators = [...certifications.values()].filter(
        c => new Date(c.expiresAt) > new Date()
      ).length;

      const avgTrainingCompletion =
        byAgency.length > 0
          ? Math.round(byAgency.reduce((sum, a) => sum + a.trainingCompletion, 0) / byAgency.length)
          : 0;

      const avgDrillParticipation =
        byAgency.length > 0
          ? Math.round(byAgency.reduce((sum, a) => sum + a.drillParticipation, 0) / byAgency.length)
          : 0;

      return {
        generatedAt: new Date().toISOString(),
        totalOperators,
        certifiedOperators,
        avgTrainingCompletion,
        avgDrillParticipation,
        byAgency,
        overdueModules: 0, // Simplified for mock
        upcomingDrills: this.getUpcomingDrills().length,
      };
    },

    // Aggregate Queries (PII-free)
    getAgencyTrainingStats(agencyId: AgencyId): {
      modulesCompleted: number;
      avgScore: number;
      passRate: number;
    } {
      // Get all operators in agency
      const agencyOperators: OperatorId[] = [];
      for (const [opId, aId] of operatorAgencies) {
        if (aId === agencyId) agencyOperators.push(opId);
      }

      const agencyCompletions = completions.filter(c => agencyOperators.includes(c.operatorId));
      const passed = agencyCompletions.filter(c => c.passed);

      return {
        modulesCompleted: agencyCompletions.length,
        avgScore:
          agencyCompletions.length > 0
            ? Math.round(
                agencyCompletions.reduce((sum, c) => sum + c.score, 0) / agencyCompletions.length
              )
            : 0,
        passRate:
          agencyCompletions.length > 0
            ? Math.round((passed.length / agencyCompletions.length) * 100)
            : 0,
      };
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XX: Training Compliance Contracts', () => {
  let training: ReturnType<typeof createMockTrainingComplianceService>;
  const agencyA = 'sha256:agency_alpha' as AgencyId;
  const operator1 = 'sha256:op_001' as OperatorId;
  const operator2 = 'sha256:op_002' as OperatorId;

  beforeEach(() => {
    training = createMockTrainingComplianceService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate module IDs with sha256: prefix', () => {
      const module = training.createModule('Runbook Basics', 'runbook', ['operator'], 30);
      assert.ok(module.id.startsWith('sha256:'));
    });

    it('should generate certification IDs with sha256: prefix', () => {
      const module = training.createModule('Test', 'runbook', ['operator'], 30);
      training.registerOperator(operator1, agencyA);
      training.recordCompletion(operator1, module.id, 90);
      const cert = training.issueCertification(operator1, 'operator', [module.id], 1);
      assert.ok(cert?.id.startsWith('sha256:'));
    });

    it('should generate drill IDs with sha256: prefix', () => {
      const drill = training.scheduleDrill('tabletop', agencyA, new Date().toISOString());
      assert.ok(drill.id.startsWith('sha256:'));
    });

    it('should use opaque operator IDs', () => {
      training.registerOperator(operator1, agencyA);
      const agency = training.getOperatorAgency(operator1);
      assert.ok(operator1.startsWith('sha256:'));
      assert.ok(agency?.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Module Management Tests
  // ==========================================================================

  describe('Module Management', () => {
    it('should create training module', () => {
      const module = training.createModule('Runbook Basics', 'runbook', ['operator'], 30);
      assert.strictEqual(module.type, 'runbook');
      assert.strictEqual(module.estimatedMinutes, 30);
    });

    it('should get modules by type', () => {
      training.createModule('Runbook 1', 'runbook', ['operator'], 30);
      training.createModule('Runbook 2', 'runbook', ['operator'], 45);
      training.createModule('CAB Process', 'cab_process', ['admin'], 60);

      const runbooks = training.getModulesByType('runbook');
      assert.strictEqual(runbooks.length, 2);
    });

    it('should get modules for role', () => {
      training.createModule('Operator Module', 'runbook', ['operator'], 30);
      training.createModule('Admin Module', 'cab_process', ['admin'], 60);
      training.createModule('Shared Module', 'incident_response', ['operator', 'admin'], 45);

      const operatorModules = training.getModulesForRole('operator');
      assert.strictEqual(operatorModules.length, 2);
    });
  });

  // ==========================================================================
  // Completion Tracking Tests
  // ==========================================================================

  describe('Completion Tracking', () => {
    it('should record module completion', () => {
      const module = training.createModule('Test Module', 'runbook', ['operator'], 30);
      training.registerOperator(operator1, agencyA);
      const completion = training.recordCompletion(operator1, module.id, 85);
      assert.ok(completion);
      assert.strictEqual(completion.passed, true);
    });

    it('should fail completion below passing score', () => {
      const module = training.createModule('Test Module', 'runbook', ['operator'], 30);
      training.registerOperator(operator1, agencyA);
      const completion = training.recordCompletion(operator1, module.id, 70);
      assert.strictEqual(completion?.passed, false);
    });

    it('should get completions for operator', () => {
      const m1 = training.createModule('Module 1', 'runbook', ['operator'], 30);
      const m2 = training.createModule('Module 2', 'cab_process', ['operator'], 45);
      training.registerOperator(operator1, agencyA);
      training.recordCompletion(operator1, m1.id, 90);
      training.recordCompletion(operator1, m2.id, 85);

      const completions = training.getCompletionsForOperator(operator1);
      assert.strictEqual(completions.length, 2);
    });

    it('should calculate operator completion percentage', () => {
      const m1 = training.createModule('Module 1', 'runbook', ['operator'], 30);
      const m2 = training.createModule('Module 2', 'cab_process', ['operator'], 45);
      training.registerOperator(operator1, agencyA);
      training.recordCompletion(operator1, m1.id, 90); // Pass
      // m2 not completed

      const completion = training.calculateOperatorCompletion(operator1, [m1.id, m2.id]);
      assert.strictEqual(completion, 50);
    });

    it('should return 100% when all required modules complete', () => {
      const m1 = training.createModule('Module 1', 'runbook', ['operator'], 30);
      training.registerOperator(operator1, agencyA);
      training.recordCompletion(operator1, m1.id, 90);

      const completion = training.calculateOperatorCompletion(operator1, [m1.id]);
      assert.strictEqual(completion, 100);
    });
  });

  // ==========================================================================
  // Certification Tests
  // ==========================================================================

  describe('Certification Management', () => {
    it('should issue certification for qualified operator', () => {
      const module = training.createModule('Required Module', 'runbook', ['operator'], 30);
      training.registerOperator(operator1, agencyA);
      training.recordCompletion(operator1, module.id, 90);

      const cert = training.issueCertification(operator1, 'operator', [module.id], 2);
      assert.ok(cert);
      assert.strictEqual(cert.role, 'operator');
    });

    it('should not issue certification without passing modules', () => {
      const module = training.createModule('Required Module', 'runbook', ['operator'], 30);
      training.registerOperator(operator1, agencyA);
      training.recordCompletion(operator1, module.id, 70); // Fail

      const cert = training.issueCertification(operator1, 'operator', [module.id], 2);
      assert.strictEqual(cert, null);
    });

    it('should track certification validity', () => {
      const module = training.createModule('Required Module', 'runbook', ['operator'], 30);
      training.registerOperator(operator1, agencyA);
      training.recordCompletion(operator1, module.id, 90);
      const cert = training.issueCertification(operator1, 'operator', [module.id], 2);

      const valid = training.isCertificationValid(cert!.id);
      assert.strictEqual(valid, true);
    });

    it('should get certifications by agency', () => {
      const module = training.createModule('Required Module', 'runbook', ['operator'], 30);
      training.registerOperator(operator1, agencyA);
      training.registerOperator(operator2, agencyA);
      training.recordCompletion(operator1, module.id, 90);
      training.recordCompletion(operator2, module.id, 85);
      training.issueCertification(operator1, 'operator', [module.id], 1);
      training.issueCertification(operator2, 'operator', [module.id], 1);

      const certs = training.getAgencyCertifications(agencyA);
      assert.strictEqual(certs.length, 2);
    });
  });

  // ==========================================================================
  // Drill Management Tests
  // ==========================================================================

  describe('Drill Management', () => {
    it('should schedule drill', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const drill = training.scheduleDrill('tabletop', agencyA, futureDate);
      assert.strictEqual(drill.type, 'tabletop');
      assert.ok(!drill.executedAt);
    });

    it('should execute drill', () => {
      const drill = training.scheduleDrill('tabletop', agencyA, new Date().toISOString());
      const executed = training.executeDrill(drill.id, 15, 93, 'Successful exercise');
      assert.ok(executed?.executedAt);
      assert.strictEqual(executed?.participantCount, 15);
      assert.strictEqual(executed?.passRate, 93);
    });

    it('should get drills by agency', () => {
      training.scheduleDrill('tabletop', agencyA, new Date().toISOString());
      training.scheduleDrill('functional', agencyA, new Date().toISOString());

      const drills = training.getDrillsByAgency(agencyA);
      assert.strictEqual(drills.length, 2);
    });

    it('should get upcoming drills', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      training.scheduleDrill('tabletop', agencyA, futureDate);
      const pastDrill = training.scheduleDrill('functional', agencyA, new Date().toISOString());
      training.executeDrill(pastDrill.id, 10, 90, 'Done');

      const upcoming = training.getUpcomingDrills();
      assert.strictEqual(upcoming.length, 1);
    });

    it('should get executed drills', () => {
      const drill = training.scheduleDrill('tabletop', agencyA, new Date().toISOString());
      training.executeDrill(drill.id, 10, 90, 'Complete');
      training.scheduleDrill('functional', agencyA, new Date().toISOString()); // Not executed

      const executed = training.getExecutedDrills();
      assert.strictEqual(executed.length, 1);
    });
  });

  // ==========================================================================
  // Cadence Compliance Tests
  // ==========================================================================

  describe('Cadence Compliance', () => {
    it('should have default cadence requirements', () => {
      const cadences = training.getCadenceRequirements();
      assert.ok(cadences.length > 0);
      assert.ok(cadences.find(c => c.drillType === 'tabletop'));
    });

    it('should check drill cadence compliance', () => {
      // Execute required drills
      for (let i = 0; i < 2; i++) {
        const d = training.scheduleDrill('tabletop', agencyA, new Date().toISOString());
        training.executeDrill(d.id, 10, 90, 'Done');
      }
      const d1 = training.scheduleDrill('functional', agencyA, new Date().toISOString());
      training.executeDrill(d1.id, 10, 90, 'Done');
      const d2 = training.scheduleDrill('full_scale', agencyA, new Date().toISOString());
      training.executeDrill(d2.id, 10, 90, 'Done');
      const d3 = training.scheduleDrill('game_day', agencyA, new Date().toISOString());
      training.executeDrill(d3.id, 10, 90, 'Done');

      const compliance = training.checkDrillCadenceCompliance(agencyA, 'Q1');
      assert.strictEqual(compliance.compliant, true);
    });

    it('should detect missing drills', () => {
      // Only one tabletop (need 2)
      const d = training.scheduleDrill('tabletop', agencyA, new Date().toISOString());
      training.executeDrill(d.id, 10, 90, 'Done');

      const compliance = training.checkDrillCadenceCompliance(agencyA, 'Q1');
      assert.strictEqual(compliance.compliant, false);
      assert.strictEqual(compliance.drillsMissing.tabletop, 1);
    });
  });

  // ==========================================================================
  // Agency Compliance Tests
  // ==========================================================================

  describe('Agency Compliance Status', () => {
    it('should calculate agency compliance', () => {
      training.registerOperator(operator1, agencyA);
      const status = training.calculateAgencyCompliance(agencyA);
      assert.ok(status.agencyId.startsWith('sha256:'));
      assert.ok(status.lastAssessed);
    });

    it('should determine compliant status', () => {
      training.registerOperator(operator1, agencyA);
      const module = training.createModule('Test', 'runbook', ['operator'], 30);
      training.recordCompletion(operator1, module.id, 90);
      training.issueCertification(operator1, 'operator', [module.id], 2);

      // Add drills with good participation
      const d1 = training.scheduleDrill('tabletop', agencyA, new Date().toISOString());
      training.executeDrill(d1.id, 80, 95, 'Done');

      const status = training.calculateAgencyCompliance(agencyA);
      assert.strictEqual(status.certifiedOperators, 1);
    });

    it('should count certified operators', () => {
      training.registerOperator(operator1, agencyA);
      training.registerOperator(operator2, agencyA);
      const module = training.createModule('Test', 'runbook', ['operator'], 30);
      training.recordCompletion(operator1, module.id, 90);
      training.recordCompletion(operator2, module.id, 85);
      training.issueCertification(operator1, 'operator', [module.id], 1);
      training.issueCertification(operator2, 'operator', [module.id], 1);

      const status = training.calculateAgencyCompliance(agencyA);
      assert.strictEqual(status.certifiedOperators, 2);
      assert.strictEqual(status.totalOperators, 2);
    });
  });

  // ==========================================================================
  // Summary Generation Tests
  // ==========================================================================

  describe('Summary Generation', () => {
    it('should generate compliance summary', () => {
      const summary = training.generateComplianceSummary();
      assert.ok(summary.generatedAt);
    });

    it('should aggregate across agencies', () => {
      training.registerOperator(operator1, agencyA);
      training.registerOperator(operator2, 'sha256:agency_beta' as AgencyId);

      const summary = training.generateComplianceSummary();
      assert.strictEqual(summary.totalOperators, 2);
      assert.strictEqual(summary.byAgency.length, 2);
    });

    it('should count upcoming drills', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      training.scheduleDrill('tabletop', agencyA, futureDate);
      training.scheduleDrill('functional', agencyA, futureDate);

      const summary = training.generateComplianceSummary();
      assert.strictEqual(summary.upcomingDrills, 2);
    });
  });

  // ==========================================================================
  // PII-Free Aggregate Tests
  // ==========================================================================

  describe('PII-Free Aggregates', () => {
    it('should provide aggregate training stats', () => {
      training.registerOperator(operator1, agencyA);
      training.registerOperator(operator2, agencyA);
      const module = training.createModule('Test', 'runbook', ['operator'], 30);
      training.recordCompletion(operator1, module.id, 90);
      training.recordCompletion(operator2, module.id, 80);

      const stats = training.getAgencyTrainingStats(agencyA);
      assert.strictEqual(stats.modulesCompleted, 2);
      assert.strictEqual(stats.avgScore, 85);
      assert.strictEqual(stats.passRate, 100);
    });

    it('should not expose individual operator data in summary', () => {
      training.registerOperator(operator1, agencyA);
      const summary = training.generateComplianceSummary();

      // Summary should only contain aggregates
      assert.ok(!JSON.stringify(summary).includes(operator1));
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of cadence requirements', () => {
      const c1 = training.getCadenceRequirements();
      const c2 = training.getCadenceRequirements();
      assert.ok(c1 !== c2);
    });

    it('should generate fresh summary each call', () => {
      const s1 = training.generateComplianceSummary();
      const s2 = training.generateComplianceSummary();
      assert.ok(s1 !== s2);
    });
  });
});
