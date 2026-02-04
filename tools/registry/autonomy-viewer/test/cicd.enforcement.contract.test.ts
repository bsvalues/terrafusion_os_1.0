/**
 * Phase XX — Live Adoption Rollout
 * =================================
 * Contract: cicd.enforcement.contract.test.ts
 *
 * Tests CI/CD enforcement with readiness threshold gating,
 * exception workflow enforcement, and promotion blocking.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Enforcement decisions are auditable
 * - Exception workflows are governed and expiring
 * - Threshold violations block promotion
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type ServiceId = `sha256:${string}`;
type PipelineId = `sha256:${string}`;
type ExceptionId = `sha256:${string}`;
type GateId = `sha256:${string}`;
type DecisionId = `sha256:${string}`;

type GateType =
  | 'readiness'
  | 'attestation'
  | 'drill_compliance'
  | 'exception_check'
  | 'security_scan';
type GateResult = 'pass' | 'fail' | 'skip' | 'exception_granted';
type PromotionStage = 'dev' | 'staging' | 'production';

interface GateThreshold {
  readonly gateType: GateType;
  readonly minScore: number;
  readonly blockOnFail: boolean;
  readonly allowException: boolean;
}

interface GateExecution {
  readonly gateId: GateId;
  readonly gateType: GateType;
  readonly pipelineId: PipelineId;
  readonly serviceId: ServiceId;
  readonly executedAt: string;
  readonly result: GateResult;
  readonly score?: number;
  readonly threshold?: number;
  readonly exceptionId?: ExceptionId;
  readonly reason?: string;
}

interface PromotionException {
  readonly id: ExceptionId;
  readonly serviceId: ServiceId;
  readonly gateType: GateType;
  readonly approvedBy: `sha256:${string}`;
  readonly approvedAt: string;
  readonly expiresAt: string;
  readonly reason: string;
  readonly mitigations: readonly string[];
  readonly usageCount: number;
  readonly maxUsages: number;
}

interface Pipeline {
  readonly id: PipelineId;
  readonly serviceId: ServiceId;
  readonly targetStage: PromotionStage;
  readonly createdAt: string;
  readonly status: 'pending' | 'running' | 'passed' | 'failed' | 'blocked';
  readonly gateExecutions: readonly GateExecution[];
  readonly promotedAt?: string;
  readonly blockedAt?: string;
  readonly blockedReason?: string;
}

interface EnforcementPolicy {
  readonly stage: PromotionStage;
  readonly gates: readonly GateThreshold[];
  readonly requireAllPass: boolean;
  readonly allowExceptions: boolean;
  readonly maxExceptionsPerService: number;
}

interface EnforcementSummary {
  readonly generatedAt: string;
  readonly totalPipelines: number;
  readonly passedPipelines: number;
  readonly failedPipelines: number;
  readonly blockedPipelines: number;
  readonly exceptionsGranted: number;
  readonly gatePassRates: Record<GateType, number>;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockCICDEnforcementService() {
  const pipelines = new Map<PipelineId, Pipeline>();
  const exceptions = new Map<ExceptionId, PromotionException>();
  const policies = new Map<PromotionStage, EnforcementPolicy>();
  const gateLog: GateExecution[] = [];

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  // Initialize default policies
  const defaultPolicies: Record<PromotionStage, EnforcementPolicy> = {
    dev: {
      stage: 'dev',
      gates: [
        { gateType: 'readiness', minScore: 50, blockOnFail: false, allowException: true },
        { gateType: 'security_scan', minScore: 70, blockOnFail: true, allowException: true },
      ],
      requireAllPass: false,
      allowExceptions: true,
      maxExceptionsPerService: 5,
    },
    staging: {
      stage: 'staging',
      gates: [
        { gateType: 'readiness', minScore: 70, blockOnFail: true, allowException: true },
        { gateType: 'attestation', minScore: 100, blockOnFail: true, allowException: true },
        { gateType: 'security_scan', minScore: 80, blockOnFail: true, allowException: true },
      ],
      requireAllPass: true,
      allowExceptions: true,
      maxExceptionsPerService: 3,
    },
    production: {
      stage: 'production',
      gates: [
        { gateType: 'readiness', minScore: 80, blockOnFail: true, allowException: true },
        { gateType: 'attestation', minScore: 100, blockOnFail: true, allowException: false },
        { gateType: 'drill_compliance', minScore: 85, blockOnFail: true, allowException: true },
        { gateType: 'exception_check', minScore: 100, blockOnFail: true, allowException: false },
        { gateType: 'security_scan', minScore: 90, blockOnFail: true, allowException: false },
      ],
      requireAllPass: true,
      allowExceptions: true,
      maxExceptionsPerService: 1,
    },
  };

  for (const [stage, policy] of Object.entries(defaultPolicies)) {
    policies.set(stage as PromotionStage, policy);
  }

  return {
    // Pipeline Management
    createPipeline(serviceId: ServiceId, targetStage: PromotionStage): Pipeline {
      const id = generateId('pipeline') as PipelineId;
      const pipeline: Pipeline = {
        id,
        serviceId,
        targetStage,
        createdAt: new Date().toISOString(),
        status: 'pending',
        gateExecutions: [],
      };
      pipelines.set(id, pipeline);
      return pipeline;
    },

    getPipeline(id: PipelineId): Pipeline | null {
      return pipelines.get(id) ?? null;
    },

    getPipelinesByService(serviceId: ServiceId): readonly Pipeline[] {
      return [...pipelines.values()].filter(p => p.serviceId === serviceId);
    },

    // Gate Execution
    executeGate(pipelineId: PipelineId, gateType: GateType, score: number): GateExecution | null {
      const pipeline = pipelines.get(pipelineId);
      if (!pipeline) return null;

      const policy = policies.get(pipeline.targetStage);
      if (!policy) return null;

      const gateThreshold = policy.gates.find(g => g.gateType === gateType);
      if (!gateThreshold) return null;

      const threshold = gateThreshold.minScore;
      const passed = score >= threshold;

      // Check for valid exception
      let exceptionId: ExceptionId | undefined;
      let result: GateResult = passed ? 'pass' : 'fail';

      if (!passed && gateThreshold.allowException) {
        const exception = this.findValidException(pipeline.serviceId, gateType);
        if (exception) {
          exceptionId = exception.id;
          result = 'exception_granted';
          this.useException(exception.id);
        }
      }

      const execution: GateExecution = {
        gateId: generateId('gate') as GateId,
        gateType,
        pipelineId,
        serviceId: pipeline.serviceId,
        executedAt: new Date().toISOString(),
        result,
        score,
        threshold,
        exceptionId,
        reason:
          !passed && result === 'fail' ? `Score ${score} < threshold ${threshold}` : undefined,
      };

      gateLog.push(execution);

      // Update pipeline
      const updated: Pipeline = {
        ...pipeline,
        status: 'running',
        gateExecutions: [...pipeline.gateExecutions, execution],
      };
      pipelines.set(pipelineId, updated);

      return execution;
    },

    // Finalize Pipeline
    finalizePipeline(pipelineId: PipelineId): Pipeline | null {
      const pipeline = pipelines.get(pipelineId);
      if (!pipeline) return null;

      const policy = policies.get(pipeline.targetStage);
      if (!policy) return null;

      // Check if all required gates passed
      const requiredGates = policy.gates.filter(g => g.blockOnFail);
      const executedGates = pipeline.gateExecutions;

      let blocked = false;
      let blockedReason: string | undefined;

      for (const required of requiredGates) {
        const execution = executedGates.find(e => e.gateType === required.gateType);
        if (!execution) {
          blocked = true;
          blockedReason = `Missing required gate: ${required.gateType}`;
          break;
        }
        if (execution.result === 'fail') {
          blocked = true;
          blockedReason = `Gate failed: ${required.gateType}`;
          break;
        }
      }

      const newStatus = blocked ? 'blocked' : 'passed';
      const updated: Pipeline = {
        ...pipeline,
        status: newStatus,
        blockedAt: blocked ? new Date().toISOString() : undefined,
        blockedReason,
        promotedAt: !blocked ? new Date().toISOString() : undefined,
      };
      pipelines.set(pipelineId, updated);
      return updated;
    },

    // Exception Management
    createException(
      serviceId: ServiceId,
      gateType: GateType,
      approvedBy: `sha256:${string}`,
      reason: string,
      expiresAt: string,
      mitigations: readonly string[],
      maxUsages: number = 1
    ): PromotionException | null {
      const policy = policies.get('production');
      if (!policy) return null;

      // Check exception limit
      const serviceExceptions = [...exceptions.values()].filter(
        e => e.serviceId === serviceId && new Date(e.expiresAt) > new Date()
      );
      if (serviceExceptions.length >= policy.maxExceptionsPerService) return null;

      const id = generateId('exception') as ExceptionId;
      const exception: PromotionException = {
        id,
        serviceId,
        gateType,
        approvedBy,
        approvedAt: new Date().toISOString(),
        expiresAt,
        reason,
        mitigations,
        usageCount: 0,
        maxUsages,
      };
      exceptions.set(id, exception);
      return exception;
    },

    getException(id: ExceptionId): PromotionException | null {
      return exceptions.get(id) ?? null;
    },

    findValidException(serviceId: ServiceId, gateType: GateType): PromotionException | null {
      const now = new Date();
      for (const exception of exceptions.values()) {
        if (
          exception.serviceId === serviceId &&
          exception.gateType === gateType &&
          new Date(exception.expiresAt) > now &&
          exception.usageCount < exception.maxUsages
        ) {
          return exception;
        }
      }
      return null;
    },

    useException(id: ExceptionId): PromotionException | null {
      const exception = exceptions.get(id);
      if (!exception) return null;
      if (exception.usageCount >= exception.maxUsages) return null;

      const updated: PromotionException = {
        ...exception,
        usageCount: exception.usageCount + 1,
      };
      exceptions.set(id, updated);
      return updated;
    },

    revokeException(id: ExceptionId): boolean {
      return exceptions.delete(id);
    },

    getExceptionsByService(serviceId: ServiceId): readonly PromotionException[] {
      return [...exceptions.values()].filter(e => e.serviceId === serviceId);
    },

    getActiveExceptions(): readonly PromotionException[] {
      const now = new Date();
      return [...exceptions.values()].filter(
        e => new Date(e.expiresAt) > now && e.usageCount < e.maxUsages
      );
    },

    getExpiredExceptions(): readonly PromotionException[] {
      const now = new Date();
      return [...exceptions.values()].filter(e => new Date(e.expiresAt) <= now);
    },

    // Policy Management
    getPolicy(stage: PromotionStage): EnforcementPolicy | null {
      const policy = policies.get(stage);
      return policy ? { ...policy, gates: [...policy.gates] } : null;
    },

    updateThreshold(
      stage: PromotionStage,
      gateType: GateType,
      newMinScore: number
    ): EnforcementPolicy | null {
      const policy = policies.get(stage);
      if (!policy) return null;

      const updatedGates = policy.gates.map(g =>
        g.gateType === gateType ? { ...g, minScore: newMinScore } : g
      );

      const updated: EnforcementPolicy = {
        ...policy,
        gates: updatedGates,
      };
      policies.set(stage, updated);
      return updated;
    },

    // Summary & Reporting
    generateEnforcementSummary(): EnforcementSummary {
      const allPipelines = [...pipelines.values()];

      const gatePassRates: Record<GateType, number> = {
        readiness: 0,
        attestation: 0,
        drill_compliance: 0,
        exception_check: 0,
        security_scan: 0,
      };

      const gateCounts: Record<GateType, { pass: number; total: number }> = {
        readiness: { pass: 0, total: 0 },
        attestation: { pass: 0, total: 0 },
        drill_compliance: { pass: 0, total: 0 },
        exception_check: { pass: 0, total: 0 },
        security_scan: { pass: 0, total: 0 },
      };

      for (const execution of gateLog) {
        gateCounts[execution.gateType].total++;
        if (execution.result === 'pass' || execution.result === 'exception_granted') {
          gateCounts[execution.gateType].pass++;
        }
      }

      for (const [gateType, counts] of Object.entries(gateCounts)) {
        gatePassRates[gateType as GateType] =
          counts.total > 0 ? Math.round((counts.pass / counts.total) * 100) : 0;
      }

      return {
        generatedAt: new Date().toISOString(),
        totalPipelines: allPipelines.length,
        passedPipelines: allPipelines.filter(p => p.status === 'passed').length,
        failedPipelines: allPipelines.filter(p => p.status === 'failed').length,
        blockedPipelines: allPipelines.filter(p => p.status === 'blocked').length,
        exceptionsGranted: gateLog.filter(e => e.result === 'exception_granted').length,
        gatePassRates,
      };
    },

    getGateExecutionLog(): readonly GateExecution[] {
      return [...gateLog];
    },

    getGateExecutionsByType(gateType: GateType): readonly GateExecution[] {
      return gateLog.filter(e => e.gateType === gateType);
    },

    // Threshold Queries
    getThreshold(stage: PromotionStage, gateType: GateType): number | null {
      const policy = policies.get(stage);
      if (!policy) return null;
      const gate = policy.gates.find(g => g.gateType === gateType);
      return gate?.minScore ?? null;
    },

    isExceptionAllowed(stage: PromotionStage, gateType: GateType): boolean {
      const policy = policies.get(stage);
      if (!policy || !policy.allowExceptions) return false;
      const gate = policy.gates.find(g => g.gateType === gateType);
      return gate?.allowException ?? false;
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XX: CI/CD Enforcement Contracts', () => {
  let enforcement: ReturnType<typeof createMockCICDEnforcementService>;
  const serviceA = 'sha256:service_alpha' as ServiceId;
  const approver = 'sha256:approver_001' as `sha256:${string}`;

  beforeEach(() => {
    enforcement = createMockCICDEnforcementService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate pipeline IDs with sha256: prefix', () => {
      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      assert.ok(pipeline.id.startsWith('sha256:'));
    });

    it('should generate gate IDs with sha256: prefix', () => {
      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      const execution = enforcement.executeGate(pipeline.id, 'readiness', 80);
      assert.ok(execution?.gateId.startsWith('sha256:'));
    });

    it('should generate exception IDs with sha256: prefix', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const exception = enforcement.createException(
        serviceA,
        'readiness',
        approver,
        'Emergency fix',
        futureDate,
        ['Mitigation']
      );
      assert.ok(exception?.id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Pipeline Lifecycle Tests
  // ==========================================================================

  describe('Pipeline Lifecycle', () => {
    it('should create pipeline in pending state', () => {
      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      assert.strictEqual(pipeline.status, 'pending');
    });

    it('should transition to running on first gate', () => {
      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      enforcement.executeGate(pipeline.id, 'readiness', 80);
      const updated = enforcement.getPipeline(pipeline.id);
      assert.strictEqual(updated?.status, 'running');
    });

    it('should record gate executions', () => {
      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      enforcement.executeGate(pipeline.id, 'readiness', 80);
      enforcement.executeGate(pipeline.id, 'attestation', 100);
      const updated = enforcement.getPipeline(pipeline.id);
      assert.strictEqual(updated?.gateExecutions.length, 2);
    });

    it('should finalize to passed when all gates pass', () => {
      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      enforcement.executeGate(pipeline.id, 'readiness', 80);
      enforcement.executeGate(pipeline.id, 'attestation', 100);
      enforcement.executeGate(pipeline.id, 'security_scan', 90);
      const finalized = enforcement.finalizePipeline(pipeline.id);
      assert.strictEqual(finalized?.status, 'passed');
      assert.ok(finalized?.promotedAt);
    });

    it('should finalize to blocked when gate fails', () => {
      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      enforcement.executeGate(pipeline.id, 'readiness', 50); // Below 70 threshold
      const finalized = enforcement.finalizePipeline(pipeline.id);
      assert.strictEqual(finalized?.status, 'blocked');
      assert.ok(finalized?.blockedReason?.includes('Gate failed'));
    });

    it('should block on missing required gate', () => {
      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      enforcement.executeGate(pipeline.id, 'readiness', 80);
      // Missing attestation and security_scan
      const finalized = enforcement.finalizePipeline(pipeline.id);
      assert.strictEqual(finalized?.status, 'blocked');
      assert.ok(finalized?.blockedReason?.includes('Missing'));
    });
  });

  // ==========================================================================
  // Gate Execution Tests
  // ==========================================================================

  describe('Gate Execution', () => {
    it('should pass gate when score meets threshold', () => {
      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      const execution = enforcement.executeGate(pipeline.id, 'readiness', 75);
      assert.strictEqual(execution?.result, 'pass');
    });

    it('should fail gate when score below threshold', () => {
      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      const execution = enforcement.executeGate(pipeline.id, 'readiness', 60);
      assert.strictEqual(execution?.result, 'fail');
    });

    it('should record threshold in execution', () => {
      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      const execution = enforcement.executeGate(pipeline.id, 'readiness', 80);
      assert.strictEqual(execution?.threshold, 70); // Staging readiness threshold
    });

    it('should record score in execution', () => {
      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      const execution = enforcement.executeGate(pipeline.id, 'readiness', 85);
      assert.strictEqual(execution?.score, 85);
    });

    it('should apply stricter thresholds for production', () => {
      const stagingThreshold = enforcement.getThreshold('staging', 'readiness');
      const prodThreshold = enforcement.getThreshold('production', 'readiness');
      assert.ok(prodThreshold! > stagingThreshold!);
    });
  });

  // ==========================================================================
  // Exception Workflow Tests
  // ==========================================================================

  describe('Exception Workflow', () => {
    it('should create exception', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const exception = enforcement.createException(
        serviceA,
        'readiness',
        approver,
        'Emergency deployment',
        futureDate,
        ['24/7 monitoring']
      );
      assert.ok(exception);
      assert.strictEqual(exception.usageCount, 0);
    });

    it('should grant exception on failing gate', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      enforcement.createException(serviceA, 'readiness', approver, 'Emergency', futureDate, [
        'Monitoring',
      ]);

      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      const execution = enforcement.executeGate(pipeline.id, 'readiness', 50);
      assert.strictEqual(execution?.result, 'exception_granted');
    });

    it('should increment usage count when used', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const exception = enforcement.createException(
        serviceA,
        'readiness',
        approver,
        'Emergency',
        futureDate,
        ['Monitoring'],
        2
      );

      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      enforcement.executeGate(pipeline.id, 'readiness', 50);

      const updated = enforcement.getException(exception!.id);
      assert.strictEqual(updated?.usageCount, 1);
    });

    it('should not use exception beyond max usages', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      enforcement.createException(
        serviceA,
        'readiness',
        approver,
        'Emergency',
        futureDate,
        ['Monitoring'],
        1 // Only 1 usage
      );

      // First use
      const p1 = enforcement.createPipeline(serviceA, 'staging');
      enforcement.executeGate(p1.id, 'readiness', 50);

      // Second attempt should fail
      const p2 = enforcement.createPipeline(serviceA, 'staging');
      const execution = enforcement.executeGate(p2.id, 'readiness', 50);
      assert.strictEqual(execution?.result, 'fail');
    });

    it('should not use expired exception', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      enforcement.createException(serviceA, 'readiness', approver, 'Expired', pastDate, ['None']);

      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      const execution = enforcement.executeGate(pipeline.id, 'readiness', 50);
      assert.strictEqual(execution?.result, 'fail');
    });

    it('should revoke exception', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const exception = enforcement.createException(
        serviceA,
        'readiness',
        approver,
        'To revoke',
        futureDate,
        ['None']
      );

      const revoked = enforcement.revokeException(exception!.id);
      assert.strictEqual(revoked, true);
      assert.strictEqual(enforcement.getException(exception!.id), null);
    });

    it('should track active exceptions', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      enforcement.createException(serviceA, 'readiness', approver, 'Active', futureDate, []);

      const active = enforcement.getActiveExceptions();
      assert.strictEqual(active.length, 1);
    });

    it('should track expired exceptions', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      enforcement.createException(serviceA, 'readiness', approver, 'Expired', pastDate, []);

      const expired = enforcement.getExpiredExceptions();
      assert.strictEqual(expired.length, 1);
    });
  });

  // ==========================================================================
  // Policy Tests
  // ==========================================================================

  describe('Policy Management', () => {
    it('should have default policies for all stages', () => {
      assert.ok(enforcement.getPolicy('dev'));
      assert.ok(enforcement.getPolicy('staging'));
      assert.ok(enforcement.getPolicy('production'));
    });

    it('should have stricter production policy', () => {
      const staging = enforcement.getPolicy('staging');
      const prod = enforcement.getPolicy('production');
      assert.ok(prod!.gates.length > staging!.gates.length);
    });

    it('should disallow exceptions for some production gates', () => {
      const allowed = enforcement.isExceptionAllowed('production', 'security_scan');
      assert.strictEqual(allowed, false);
    });

    it('should allow exceptions for staging gates', () => {
      const allowed = enforcement.isExceptionAllowed('staging', 'readiness');
      assert.strictEqual(allowed, true);
    });

    it('should update threshold', () => {
      enforcement.updateThreshold('staging', 'readiness', 75);
      const threshold = enforcement.getThreshold('staging', 'readiness');
      assert.strictEqual(threshold, 75);
    });
  });

  // ==========================================================================
  // Summary & Reporting Tests
  // ==========================================================================

  describe('Summary & Reporting', () => {
    it('should generate enforcement summary', () => {
      const summary = enforcement.generateEnforcementSummary();
      assert.ok(summary.generatedAt);
    });

    it('should count pipelines by status', () => {
      const p1 = enforcement.createPipeline(serviceA, 'staging');
      enforcement.executeGate(p1.id, 'readiness', 80);
      enforcement.executeGate(p1.id, 'attestation', 100);
      enforcement.executeGate(p1.id, 'security_scan', 90);
      enforcement.finalizePipeline(p1.id);

      const p2 = enforcement.createPipeline(serviceA, 'staging');
      enforcement.executeGate(p2.id, 'readiness', 50);
      enforcement.finalizePipeline(p2.id);

      const summary = enforcement.generateEnforcementSummary();
      assert.strictEqual(summary.passedPipelines, 1);
      assert.strictEqual(summary.blockedPipelines, 1);
    });

    it('should calculate gate pass rates', () => {
      const p1 = enforcement.createPipeline(serviceA, 'staging');
      enforcement.executeGate(p1.id, 'readiness', 80);

      const p2 = enforcement.createPipeline(serviceA, 'staging');
      enforcement.executeGate(p2.id, 'readiness', 50);

      const summary = enforcement.generateEnforcementSummary();
      assert.strictEqual(summary.gatePassRates.readiness, 50);
    });

    it('should count exceptions granted', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      enforcement.createException(serviceA, 'readiness', approver, 'Emergency', futureDate, []);

      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      enforcement.executeGate(pipeline.id, 'readiness', 50);

      const summary = enforcement.generateEnforcementSummary();
      assert.strictEqual(summary.exceptionsGranted, 1);
    });

    it('should provide gate execution log', () => {
      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      enforcement.executeGate(pipeline.id, 'readiness', 80);

      const log = enforcement.getGateExecutionLog();
      assert.strictEqual(log.length, 1);
    });

    it('should filter gate executions by type', () => {
      const pipeline = enforcement.createPipeline(serviceA, 'staging');
      enforcement.executeGate(pipeline.id, 'readiness', 80);
      enforcement.executeGate(pipeline.id, 'attestation', 100);

      const readinessExecutions = enforcement.getGateExecutionsByType('readiness');
      assert.strictEqual(readinessExecutions.length, 1);
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copy of policy', () => {
      const p1 = enforcement.getPolicy('staging');
      const p2 = enforcement.getPolicy('staging');
      assert.ok(p1 !== p2);
    });

    it('should return copy of gate log', () => {
      const log1 = enforcement.getGateExecutionLog();
      const log2 = enforcement.getGateExecutionLog();
      assert.ok(log1 !== log2);
    });

    it('should generate fresh summary each call', () => {
      const s1 = enforcement.generateEnforcementSummary();
      const s2 = enforcement.generateEnforcementSummary();
      assert.ok(s1 !== s2);
    });
  });
});
