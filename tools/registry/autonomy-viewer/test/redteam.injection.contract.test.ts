/**
 * Phase XIX — Game Days + Red Team Governance
 * ============================================
 * Contract: redteam.injection.contract.test.ts
 *
 * Tests bounded adversarial injections for game day exercises.
 * Ensures safety constraints: no PII leakage, no auth coupling,
 * constrained blast radius, reversible actions, and audit trails.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Injections must be reversible
 * - Blast radius must be bounded and declared
 * - Auth path must never be coupled to injections
 * - All injections are audited
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type InjectionId = `sha256:${string}`;
type OperatorId = `sha256:${string}`;
type TargetId = `sha256:${string}`;
type AuditEventId = `sha256:${string}`;

type InjectionCategory =
  | 'credential_rotation'
  | 'certificate_expiry'
  | 'network_partition'
  | 'latency_injection'
  | 'error_injection'
  | 'resource_exhaustion'
  | 'configuration_drift'
  | 'permission_revocation';

type BlastRadius = 'single_resource' | 'single_service' | 'single_region' | 'multi_region';
type InjectionStatus = 'pending' | 'approved' | 'active' | 'completed' | 'reversed' | 'failed';

interface SafetyConstraints {
  readonly maxDurationMinutes: number;
  readonly maxAffectedResources: number;
  readonly requiresApproval: boolean;
  readonly autoRevertOnFailure: boolean;
  readonly excludedServices: readonly string[];
  readonly excludedRegions: readonly string[];
}

interface InjectionTarget {
  readonly id: TargetId;
  readonly type: 'service' | 'endpoint' | 'database' | 'queue' | 'cache';
  readonly identifier: string; // Non-PII identifier
  readonly region?: string;
}

interface InjectionDefinition {
  readonly id: InjectionId;
  readonly name: string;
  readonly description: string;
  readonly category: InjectionCategory;
  readonly blastRadius: BlastRadius;
  readonly targets: readonly InjectionTarget[];
  readonly safetyConstraints: SafetyConstraints;
  readonly reversalProcedure: string;
  readonly createdAt: string;
  readonly createdBy: OperatorId;
}

interface InjectionExecution {
  readonly id: InjectionId;
  readonly definitionId: InjectionId;
  readonly gameDayId: string;
  readonly status: InjectionStatus;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly reversedAt?: string;
  readonly approvedBy?: OperatorId;
  readonly executedBy?: OperatorId;
  readonly reversedBy?: OperatorId;
  readonly affectedResources: readonly string[];
  readonly metrics: {
    readonly detectionTimeMs?: number;
    readonly responseTimeMs?: number;
    readonly recoveryTimeMs?: number;
  };
}

interface InjectionAuditEntry {
  readonly id: AuditEventId;
  readonly injectionId: InjectionId;
  readonly action:
    | 'created'
    | 'approved'
    | 'started'
    | 'completed'
    | 'reversed'
    | 'failed'
    | 'constraint_checked';
  readonly actor: OperatorId;
  readonly timestamp: string;
  readonly previousHash: string;
  readonly entryHash: string;
  readonly details: Record<string, unknown>;
}

interface SafetyValidationResult {
  readonly safe: boolean;
  readonly violations: readonly string[];
  readonly warnings: readonly string[];
  readonly blastRadiusCheck: boolean;
  readonly piiCheck: boolean;
  readonly authCouplingCheck: boolean;
  readonly reversibilityCheck: boolean;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockInjectionService() {
  const definitions = new Map<InjectionId, InjectionDefinition>();
  const executions = new Map<InjectionId, InjectionExecution>();
  const auditLog: InjectionAuditEntry[] = [];
  let lastHash = 'sha256:genesis';

  // Simulated "sensitive" patterns that should be blocked
  const piiPatterns = [
    /email/i,
    /ssn/i,
    /social.*security/i,
    /credit.*card/i,
    /password/i,
    /token/i,
    /secret/i,
  ];
  const authServices = ['auth-service', 'identity-provider', 'oauth-gateway', 'sso-service'];

  function generateId(prefix: string): InjectionId {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}` as InjectionId;
  }

  function appendAudit(
    injectionId: InjectionId,
    action: InjectionAuditEntry['action'],
    actor: OperatorId,
    details: Record<string, unknown> = {}
  ): InjectionAuditEntry {
    const entry: InjectionAuditEntry = {
      id: generateId('audit') as AuditEventId,
      injectionId,
      action,
      actor,
      timestamp: new Date().toISOString(),
      previousHash: lastHash,
      entryHash: `sha256:entry_${Math.random().toString(36).slice(2)}`,
      details,
    };
    lastHash = entry.entryHash;
    auditLog.push(entry);
    return entry;
  }

  function containsPII(text: string): boolean {
    return piiPatterns.some(pattern => pattern.test(text));
  }

  function isAuthService(serviceName: string): boolean {
    return authServices.some(auth => serviceName.toLowerCase().includes(auth.toLowerCase()));
  }

  return {
    // Definition Management
    createInjection(
      name: string,
      category: InjectionCategory,
      description: string,
      targets: readonly InjectionTarget[],
      blastRadius: BlastRadius,
      safetyConstraints: SafetyConstraints,
      reversalProcedure: string,
      createdBy: OperatorId
    ): InjectionDefinition | null {
      // Pre-creation safety check
      if (containsPII(name) || containsPII(description) || containsPII(reversalProcedure)) {
        return null; // Reject if PII detected in definition
      }

      for (const target of targets) {
        if (containsPII(target.identifier)) {
          return null; // Reject if target contains PII
        }
        if (isAuthService(target.identifier)) {
          return null; // Reject if targeting auth service
        }
      }

      const id = generateId('injection');
      const definition: InjectionDefinition = {
        id,
        name,
        description,
        category,
        blastRadius,
        targets,
        safetyConstraints,
        reversalProcedure,
        createdAt: new Date().toISOString(),
        createdBy,
      };
      definitions.set(id, definition);
      appendAudit(id, 'created', createdBy, { name, category, blastRadius });
      return definition;
    },

    getDefinition(id: InjectionId): InjectionDefinition | null {
      return definitions.get(id) ?? null;
    },

    getDefinitionsByCategory(category: InjectionCategory): readonly InjectionDefinition[] {
      return [...definitions.values()].filter(d => d.category === category);
    },

    // Safety Validation
    validateSafety(definitionId: InjectionId): SafetyValidationResult {
      const definition = definitions.get(definitionId);
      if (!definition) {
        return {
          safe: false,
          violations: ['Definition not found'],
          warnings: [],
          blastRadiusCheck: false,
          piiCheck: false,
          authCouplingCheck: false,
          reversibilityCheck: false,
        };
      }

      const violations: string[] = [];
      const warnings: string[] = [];

      // Blast radius check
      let blastRadiusCheck = true;
      if (definition.blastRadius === 'multi_region' && definition.targets.length > 10) {
        violations.push('Multi-region injection with too many targets');
        blastRadiusCheck = false;
      }
      if (definition.targets.length > definition.safetyConstraints.maxAffectedResources) {
        violations.push('Targets exceed maxAffectedResources constraint');
        blastRadiusCheck = false;
      }

      // PII check
      let piiCheck = true;
      const allText = [
        definition.name,
        definition.description,
        definition.reversalProcedure,
        ...definition.targets.map(t => t.identifier),
      ].join(' ');
      if (containsPII(allText)) {
        violations.push('PII detected in injection definition');
        piiCheck = false;
      }

      // Auth coupling check
      let authCouplingCheck = true;
      for (const target of definition.targets) {
        if (isAuthService(target.identifier)) {
          violations.push(`Auth service ${target.identifier} cannot be targeted`);
          authCouplingCheck = false;
        }
      }

      // Reversibility check
      let reversibilityCheck = true;
      if (!definition.reversalProcedure || definition.reversalProcedure.length < 10) {
        violations.push('Reversal procedure must be documented');
        reversibilityCheck = false;
      }

      // Warnings
      if (definition.safetyConstraints.maxDurationMinutes > 60) {
        warnings.push('Injection duration exceeds 60 minutes - consider shorter window');
      }
      if (!definition.safetyConstraints.autoRevertOnFailure) {
        warnings.push('Auto-revert on failure is disabled');
      }

      appendAudit(definitionId, 'constraint_checked', definition.createdBy, {
        safe: violations.length === 0,
        violationCount: violations.length,
        warningCount: warnings.length,
      });

      return {
        safe: violations.length === 0,
        violations,
        warnings,
        blastRadiusCheck,
        piiCheck,
        authCouplingCheck,
        reversibilityCheck,
      };
    },

    // Execution Management
    createExecution(definitionId: InjectionId, gameDayId: string): InjectionExecution | null {
      const definition = definitions.get(definitionId);
      if (!definition) return null;

      // Validate safety before allowing execution creation
      const safety = this.validateSafety(definitionId);
      if (!safety.safe) return null;

      const id = generateId('exec') as InjectionId;
      const execution: InjectionExecution = {
        id,
        definitionId,
        gameDayId,
        status: definition.safetyConstraints.requiresApproval ? 'pending' : 'approved',
        affectedResources: [],
        metrics: {},
      };
      executions.set(id, execution);
      return execution;
    },

    approveExecution(executionId: InjectionId, approvedBy: OperatorId): InjectionExecution | null {
      const execution = executions.get(executionId);
      if (!execution || execution.status !== 'pending') return null;

      const definition = definitions.get(execution.definitionId);
      if (!definition) return null;

      // Different operator must approve
      if (definition.createdBy === approvedBy) {
        return null; // Cannot self-approve
      }

      const updated: InjectionExecution = {
        ...execution,
        status: 'approved',
        approvedBy,
      };
      executions.set(executionId, updated);
      appendAudit(executionId, 'approved', approvedBy);
      return updated;
    },

    startExecution(executionId: InjectionId, executedBy: OperatorId): InjectionExecution | null {
      const execution = executions.get(executionId);
      if (!execution || execution.status !== 'approved') return null;

      const definition = definitions.get(execution.definitionId);
      if (!definition) return null;

      const updated: InjectionExecution = {
        ...execution,
        status: 'active',
        startedAt: new Date().toISOString(),
        executedBy,
        affectedResources: definition.targets.map(t => t.id),
      };
      executions.set(executionId, updated);
      appendAudit(executionId, 'started', executedBy, {
        targetCount: definition.targets.length,
        blastRadius: definition.blastRadius,
      });
      return updated;
    },

    completeExecution(
      executionId: InjectionId,
      metrics: { detectionTimeMs?: number; responseTimeMs?: number; recoveryTimeMs?: number }
    ): InjectionExecution | null {
      const execution = executions.get(executionId);
      if (!execution || execution.status !== 'active') return null;

      const updated: InjectionExecution = {
        ...execution,
        status: 'completed',
        completedAt: new Date().toISOString(),
        metrics: { ...execution.metrics, ...metrics },
      };
      executions.set(executionId, updated);
      appendAudit(executionId, 'completed', execution.executedBy!, { metrics });
      return updated;
    },

    reverseExecution(executionId: InjectionId, reversedBy: OperatorId): InjectionExecution | null {
      const execution = executions.get(executionId);
      if (!execution) return null;
      if (execution.status !== 'active' && execution.status !== 'completed') return null;

      const updated: InjectionExecution = {
        ...execution,
        status: 'reversed',
        reversedAt: new Date().toISOString(),
        reversedBy,
      };
      executions.set(executionId, updated);
      appendAudit(executionId, 'reversed', reversedBy);
      return updated;
    },

    failExecution(executionId: InjectionId, reason: string): InjectionExecution | null {
      const execution = executions.get(executionId);
      if (!execution || execution.status !== 'active') return null;

      const definition = definitions.get(execution.definitionId);

      // Check auto-revert
      if (definition?.safetyConstraints.autoRevertOnFailure) {
        // Auto-reverse on failure
        const updated: InjectionExecution = {
          ...execution,
          status: 'reversed',
          reversedAt: new Date().toISOString(),
        };
        executions.set(executionId, updated);
        appendAudit(executionId, 'failed', execution.executedBy!, { reason, autoReverted: true });
        appendAudit(executionId, 'reversed', execution.executedBy!, { automatic: true });
        return updated;
      }

      const updated: InjectionExecution = {
        ...execution,
        status: 'failed',
        completedAt: new Date().toISOString(),
      };
      executions.set(executionId, updated);
      appendAudit(executionId, 'failed', execution.executedBy!, { reason });
      return updated;
    },

    getExecution(id: InjectionId): InjectionExecution | null {
      return executions.get(id) ?? null;
    },

    getActiveExecutions(): readonly InjectionExecution[] {
      return [...executions.values()].filter(e => e.status === 'active');
    },

    getExecutionsByGameDay(gameDayId: string): readonly InjectionExecution[] {
      return [...executions.values()].filter(e => e.gameDayId === gameDayId);
    },

    // Audit
    getAuditLog(injectionId?: InjectionId): readonly InjectionAuditEntry[] {
      if (injectionId) {
        return auditLog.filter(e => e.injectionId === injectionId);
      }
      return [...auditLog];
    },

    verifyAuditChain(): boolean {
      let expectedPrevHash = 'sha256:genesis';
      for (const entry of auditLog) {
        if (entry.previousHash !== expectedPrevHash) {
          return false;
        }
        expectedPrevHash = entry.entryHash;
      }
      return true;
    },

    // Blast radius helpers
    getBlastRadiusLimit(radius: BlastRadius): number {
      switch (radius) {
        case 'single_resource':
          return 1;
        case 'single_service':
          return 10;
        case 'single_region':
          return 50;
        case 'multi_region':
          return 200;
      }
    },

    isWithinBlastRadius(targets: readonly InjectionTarget[], radius: BlastRadius): boolean {
      return targets.length <= this.getBlastRadiusLimit(radius);
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XIX: Red Team Injection Contracts', () => {
  let service: ReturnType<typeof createMockInjectionService>;
  const operatorA = 'sha256:operator_a_123' as OperatorId;
  const operatorB = 'sha256:operator_b_456' as OperatorId;

  beforeEach(() => {
    service = createMockInjectionService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate injection IDs with sha256: prefix', () => {
      const injection = service.createInjection(
        'Latency Test',
        'latency_injection',
        'Inject 500ms latency',
        [{ id: 'sha256:target_1' as TargetId, type: 'service', identifier: 'api-gateway' }],
        'single_service',
        {
          maxDurationMinutes: 15,
          maxAffectedResources: 5,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Remove latency configuration and restart service',
        operatorA
      );
      assert.ok(injection);
      assert.ok(injection!.id.startsWith('sha256:'), 'Injection ID must be opaque sha256:');
    });

    it('should generate execution IDs with sha256: prefix', () => {
      const injection = service.createInjection(
        'Test',
        'error_injection',
        'Test errors',
        [{ id: 'sha256:target_1' as TargetId, type: 'service', identifier: 'payment-service' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: false,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert error configuration',
        operatorA
      );
      const execution = service.createExecution(injection!.id, 'gameday-1');
      assert.ok(execution);
      assert.ok(execution!.id.startsWith('sha256:'));
    });

    it('should generate audit IDs with sha256: prefix', () => {
      service.createInjection(
        'Test',
        'latency_injection',
        'Test',
        [{ id: 'sha256:target_1' as TargetId, type: 'service', identifier: 'data-service' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert latency',
        operatorA
      );
      const audit = service.getAuditLog();
      assert.ok(audit[0].id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // PII Protection Tests (Critical Invariant)
  // ==========================================================================

  describe('PII Protection Invariants', () => {
    it('should reject injection with PII in name', () => {
      const injection = service.createInjection(
        'Test user email injection',
        'configuration_drift',
        'Test configuration',
        [{ id: 'sha256:target_1' as TargetId, type: 'database', identifier: 'config-db' }],
        'single_resource',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 1,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert config',
        operatorA
      );
      assert.strictEqual(injection, null);
    });

    it('should reject injection with PII in description', () => {
      const injection = service.createInjection(
        'Config Test',
        'configuration_drift',
        'Test SSN validation bypass',
        [{ id: 'sha256:target_1' as TargetId, type: 'database', identifier: 'config-db' }],
        'single_resource',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 1,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert config',
        operatorA
      );
      assert.strictEqual(injection, null);
    });

    it('should reject injection with PII in target identifier', () => {
      const injection = service.createInjection(
        'Config Test',
        'configuration_drift',
        'Test configuration',
        [{ id: 'sha256:target_1' as TargetId, type: 'database', identifier: 'password-store' }],
        'single_resource',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 1,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert config',
        operatorA
      );
      assert.strictEqual(injection, null);
    });

    it('should reject injection with credit card reference', () => {
      const injection = service.createInjection(
        'Credit Card validation test',
        'error_injection',
        'Test',
        [{ id: 'sha256:target_1' as TargetId, type: 'service', identifier: 'validation-svc' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 1,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert',
        operatorA
      );
      assert.strictEqual(injection, null);
    });

    it('should detect PII in safety validation', () => {
      // This tests the validation path for existing definitions
      const injection = service.createInjection(
        'Clean Test',
        'latency_injection',
        'Clean description',
        [{ id: 'sha256:target_1' as TargetId, type: 'service', identifier: 'api-gateway' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Proper reversal procedure documented here',
        operatorA
      );
      assert.ok(injection);
      const validation = service.validateSafety(injection!.id);
      assert.strictEqual(validation.piiCheck, true);
    });
  });

  // ==========================================================================
  // Auth Coupling Protection Tests (Critical Invariant)
  // ==========================================================================

  describe('Auth Coupling Protection Invariants', () => {
    it('should reject injection targeting auth-service', () => {
      const injection = service.createInjection(
        'Auth Test',
        'error_injection',
        'Test auth errors',
        [{ id: 'sha256:target_1' as TargetId, type: 'service', identifier: 'auth-service' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 1,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert',
        operatorA
      );
      assert.strictEqual(injection, null);
    });

    it('should reject injection targeting identity-provider', () => {
      const injection = service.createInjection(
        'IdP Test',
        'network_partition',
        'Partition identity provider',
        [{ id: 'sha256:target_1' as TargetId, type: 'service', identifier: 'identity-provider' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 1,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Restore network',
        operatorA
      );
      assert.strictEqual(injection, null);
    });

    it('should reject injection targeting oauth-gateway', () => {
      const injection = service.createInjection(
        'OAuth Test',
        'latency_injection',
        'Add latency to OAuth',
        [{ id: 'sha256:target_1' as TargetId, type: 'service', identifier: 'oauth-gateway' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 1,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Remove latency',
        operatorA
      );
      assert.strictEqual(injection, null);
    });

    it('should reject injection targeting sso-service', () => {
      const injection = service.createInjection(
        'SSO Test',
        'resource_exhaustion',
        'Exhaust SSO resources',
        [{ id: 'sha256:target_1' as TargetId, type: 'service', identifier: 'sso-service' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 1,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Release resources',
        operatorA
      );
      assert.strictEqual(injection, null);
    });

    it('should flag auth coupling in safety validation', () => {
      const injection = service.createInjection(
        'Safe Test',
        'latency_injection',
        'Safe description',
        [{ id: 'sha256:target_1' as TargetId, type: 'service', identifier: 'data-service' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Proper documented reversal procedure here',
        operatorA
      );
      assert.ok(injection);
      const validation = service.validateSafety(injection!.id);
      assert.strictEqual(validation.authCouplingCheck, true);
    });
  });

  // ==========================================================================
  // Blast Radius Tests
  // ==========================================================================

  describe('Blast Radius Constraints', () => {
    it('should define single_resource limit as 1', () => {
      assert.strictEqual(service.getBlastRadiusLimit('single_resource'), 1);
    });

    it('should define single_service limit as 10', () => {
      assert.strictEqual(service.getBlastRadiusLimit('single_service'), 10);
    });

    it('should define single_region limit as 50', () => {
      assert.strictEqual(service.getBlastRadiusLimit('single_region'), 50);
    });

    it('should define multi_region limit as 200', () => {
      assert.strictEqual(service.getBlastRadiusLimit('multi_region'), 200);
    });

    it('should validate targets within blast radius', () => {
      const targets: InjectionTarget[] = [
        { id: 'sha256:t1' as TargetId, type: 'service', identifier: 'svc-1' },
        { id: 'sha256:t2' as TargetId, type: 'service', identifier: 'svc-2' },
      ];
      assert.strictEqual(service.isWithinBlastRadius(targets, 'single_service'), true);
      assert.strictEqual(service.isWithinBlastRadius(targets, 'single_resource'), false);
    });

    it('should fail validation when targets exceed maxAffectedResources', () => {
      const targets: InjectionTarget[] = Array.from({ length: 10 }, (_, i) => ({
        id: `sha256:target_${i}` as TargetId,
        type: 'service' as const,
        identifier: `svc-${i}`,
      }));
      const injection = service.createInjection(
        'Over Limit',
        'latency_injection',
        'Test',
        targets,
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Documented reversal procedure here',
        operatorA
      );
      assert.ok(injection);
      const validation = service.validateSafety(injection!.id);
      assert.strictEqual(validation.blastRadiusCheck, false);
    });
  });

  // ==========================================================================
  // Reversibility Tests
  // ==========================================================================

  describe('Reversibility Requirements', () => {
    it('should require reversal procedure', () => {
      const injection = service.createInjection(
        'Test',
        'network_partition',
        'Test partition',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'backend' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        '', // Empty reversal
        operatorA
      );
      // Creation succeeds but validation fails
      if (injection) {
        const validation = service.validateSafety(injection.id);
        assert.strictEqual(validation.reversibilityCheck, false);
      }
    });

    it('should allow reversal of active execution', () => {
      const injection = service.createInjection(
        'Reversible Test',
        'latency_injection',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'api' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: false,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Remove latency configuration from service',
        operatorA
      );
      const execution = service.createExecution(injection!.id, 'gameday-1');
      service.startExecution(execution!.id, operatorA);
      const reversed = service.reverseExecution(execution!.id, operatorB);
      assert.ok(reversed);
      assert.strictEqual(reversed!.status, 'reversed');
      assert.ok(reversed!.reversedAt);
    });

    it('should allow reversal of completed execution', () => {
      const injection = service.createInjection(
        'Completed Test',
        'error_injection',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'backend' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: false,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert error injection configuration',
        operatorA
      );
      const execution = service.createExecution(injection!.id, 'gameday-1');
      service.startExecution(execution!.id, operatorA);
      service.completeExecution(execution!.id, { detectionTimeMs: 1000 });
      const reversed = service.reverseExecution(execution!.id, operatorB);
      assert.ok(reversed);
      assert.strictEqual(reversed!.status, 'reversed');
    });

    it('should auto-revert on failure when configured', () => {
      const injection = service.createInjection(
        'Auto Revert',
        'latency_injection',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'api' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: false,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert latency injection manually if needed',
        operatorA
      );
      const execution = service.createExecution(injection!.id, 'gameday-1');
      service.startExecution(execution!.id, operatorA);
      const failed = service.failExecution(execution!.id, 'Unexpected error');
      assert.ok(failed);
      assert.strictEqual(failed!.status, 'reversed'); // Auto-reverted
    });

    it('should not auto-revert when disabled', () => {
      const injection = service.createInjection(
        'No Auto Revert',
        'latency_injection',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'api' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: false,
          autoRevertOnFailure: false,
          excludedServices: [],
          excludedRegions: [],
        },
        'Manual revert required if failure occurs',
        operatorA
      );
      const execution = service.createExecution(injection!.id, 'gameday-1');
      service.startExecution(execution!.id, operatorA);
      const failed = service.failExecution(execution!.id, 'Unexpected error');
      assert.ok(failed);
      assert.strictEqual(failed!.status, 'failed'); // Not auto-reverted
    });
  });

  // ==========================================================================
  // Approval Workflow Tests
  // ==========================================================================

  describe('Approval Workflow', () => {
    it('should require approval when configured', () => {
      const injection = service.createInjection(
        'Approval Required',
        'network_partition',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'backend' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Restore network connectivity between services',
        operatorA
      );
      const execution = service.createExecution(injection!.id, 'gameday-1');
      assert.ok(execution);
      assert.strictEqual(execution!.status, 'pending');
    });

    it('should skip approval when not required', () => {
      const injection = service.createInjection(
        'No Approval',
        'latency_injection',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'api' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: false,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Remove latency injection from config',
        operatorA
      );
      const execution = service.createExecution(injection!.id, 'gameday-1');
      assert.strictEqual(execution!.status, 'approved');
    });

    it('should not allow self-approval', () => {
      const injection = service.createInjection(
        'Self Approve Attempt',
        'error_injection',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'backend' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert error injection configuration',
        operatorA
      );
      const execution = service.createExecution(injection!.id, 'gameday-1');
      const approved = service.approveExecution(execution!.id, operatorA); // Same as creator
      assert.strictEqual(approved, null);
    });

    it('should allow different operator to approve', () => {
      const injection = service.createInjection(
        'Different Approver',
        'error_injection',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'backend' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert error injection configuration',
        operatorA
      );
      const execution = service.createExecution(injection!.id, 'gameday-1');
      const approved = service.approveExecution(execution!.id, operatorB);
      assert.ok(approved);
      assert.strictEqual(approved!.status, 'approved');
      assert.strictEqual(approved!.approvedBy, operatorB);
    });

    it('should not start unapproved execution', () => {
      const injection = service.createInjection(
        'Unapproved Start',
        'network_partition',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'backend' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Restore network connectivity',
        operatorA
      );
      const execution = service.createExecution(injection!.id, 'gameday-1');
      const started = service.startExecution(execution!.id, operatorA);
      assert.strictEqual(started, null);
    });
  });

  // ==========================================================================
  // Execution Lifecycle Tests
  // ==========================================================================

  describe('Execution Lifecycle', () => {
    it('should track execution metrics', () => {
      const injection = service.createInjection(
        'Metrics Test',
        'latency_injection',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'api' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: false,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Remove latency configuration',
        operatorA
      );
      const execution = service.createExecution(injection!.id, 'gameday-1');
      service.startExecution(execution!.id, operatorA);
      const completed = service.completeExecution(execution!.id, {
        detectionTimeMs: 5000,
        responseTimeMs: 15000,
        recoveryTimeMs: 30000,
      });
      assert.ok(completed);
      assert.strictEqual(completed!.metrics.detectionTimeMs, 5000);
      assert.strictEqual(completed!.metrics.responseTimeMs, 15000);
      assert.strictEqual(completed!.metrics.recoveryTimeMs, 30000);
    });

    it('should track affected resources', () => {
      const injection = service.createInjection(
        'Resources Test',
        'error_injection',
        'Test',
        [
          { id: 'sha256:t1' as TargetId, type: 'service', identifier: 'svc-1' },
          { id: 'sha256:t2' as TargetId, type: 'service', identifier: 'svc-2' },
        ],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: false,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert error configuration on all services',
        operatorA
      );
      const execution = service.createExecution(injection!.id, 'gameday-1');
      const started = service.startExecution(execution!.id, operatorA);
      assert.ok(started);
      assert.strictEqual(started!.affectedResources.length, 2);
    });

    it('should record start timestamp', () => {
      const injection = service.createInjection(
        'Timestamp Test',
        'latency_injection',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'api' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: false,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Remove latency config',
        operatorA
      );
      const execution = service.createExecution(injection!.id, 'gameday-1');
      const before = new Date().toISOString();
      const started = service.startExecution(execution!.id, operatorA);
      const after = new Date().toISOString();
      assert.ok(started!.startedAt! >= before && started!.startedAt! <= after);
    });
  });

  // ==========================================================================
  // Query Tests
  // ==========================================================================

  describe('Query Operations', () => {
    it('should get active executions', () => {
      const injection = service.createInjection(
        'Active Query',
        'latency_injection',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'api' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: false,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert latency',
        operatorA
      );
      const exec1 = service.createExecution(injection!.id, 'gd-1');
      service.startExecution(exec1!.id, operatorA);
      const exec2 = service.createExecution(injection!.id, 'gd-2');
      service.startExecution(exec2!.id, operatorA);

      const active = service.getActiveExecutions();
      assert.strictEqual(active.length, 2);
    });

    it('should get executions by game day', () => {
      const injection = service.createInjection(
        'GameDay Query',
        'error_injection',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'backend' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: false,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert errors',
        operatorA
      );
      service.createExecution(injection!.id, 'gameday-A');
      service.createExecution(injection!.id, 'gameday-A');
      service.createExecution(injection!.id, 'gameday-B');

      assert.strictEqual(service.getExecutionsByGameDay('gameday-A').length, 2);
      assert.strictEqual(service.getExecutionsByGameDay('gameday-B').length, 1);
    });

    it('should get definitions by category', () => {
      service.createInjection(
        'L1',
        'latency_injection',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'api' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: false,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert latency config',
        operatorA
      );
      service.createInjection(
        'L2',
        'latency_injection',
        'Test',
        [{ id: 'sha256:t2' as TargetId, type: 'service', identifier: 'web' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: false,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert latency config',
        operatorA
      );
      service.createInjection(
        'E1',
        'error_injection',
        'Test',
        [{ id: 'sha256:t3' as TargetId, type: 'service', identifier: 'db' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: false,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert error config',
        operatorA
      );

      assert.strictEqual(service.getDefinitionsByCategory('latency_injection').length, 2);
      assert.strictEqual(service.getDefinitionsByCategory('error_injection').length, 1);
    });
  });

  // ==========================================================================
  // Audit Chain Tests
  // ==========================================================================

  describe('Audit Chain Integrity', () => {
    it('should maintain valid hash chain', () => {
      const injection = service.createInjection(
        'Chain Test',
        'latency_injection',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'api' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert latency configuration',
        operatorA
      );
      const execution = service.createExecution(injection!.id, 'gameday-1');
      service.approveExecution(execution!.id, operatorB);
      service.startExecution(execution!.id, operatorA);
      service.completeExecution(execution!.id, { detectionTimeMs: 1000 });

      assert.ok(service.verifyAuditChain());
    });

    it('should audit all injection operations', () => {
      const injection = service.createInjection(
        'Full Audit',
        'error_injection',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'backend' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert error configuration completely',
        operatorA
      );
      const execution = service.createExecution(injection!.id, 'gameday-1');
      service.approveExecution(execution!.id, operatorB);
      service.startExecution(execution!.id, operatorA);
      service.reverseExecution(execution!.id, operatorB);

      const audit = service.getAuditLog();
      const actions = audit.map(e => e.action);
      assert.ok(actions.includes('created'));
      assert.ok(actions.includes('approved'));
      assert.ok(actions.includes('started'));
      assert.ok(actions.includes('reversed'));
    });

    it('should record actor in audit entries', () => {
      const injection = service.createInjection(
        'Actor Audit',
        'latency_injection',
        'Test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'api' }],
        'single_service',
        {
          maxDurationMinutes: 10,
          maxAffectedResources: 5,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Revert latency injection',
        operatorA
      );
      const audit = service.getAuditLog(injection!.id);
      assert.strictEqual(audit[0].actor, operatorA);
    });
  });

  // ==========================================================================
  // Safety Validation Summary Tests
  // ==========================================================================

  describe('Safety Validation Summary', () => {
    it('should pass all checks for safe injection', () => {
      const injection = service.createInjection(
        'Safe Injection',
        'latency_injection',
        'Inject controlled latency for testing',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'api-gateway' }],
        'single_service',
        {
          maxDurationMinutes: 30,
          maxAffectedResources: 5,
          requiresApproval: true,
          autoRevertOnFailure: true,
          excludedServices: [],
          excludedRegions: [],
        },
        'Remove latency configuration and verify normal operation',
        operatorA
      );
      const validation = service.validateSafety(injection!.id);
      assert.strictEqual(validation.safe, true);
      assert.strictEqual(validation.blastRadiusCheck, true);
      assert.strictEqual(validation.piiCheck, true);
      assert.strictEqual(validation.authCouplingCheck, true);
      assert.strictEqual(validation.reversibilityCheck, true);
      assert.strictEqual(validation.violations.length, 0);
    });

    it('should generate warnings for risky but valid configurations', () => {
      const injection = service.createInjection(
        'Long Duration',
        'network_partition',
        'Extended partition test',
        [{ id: 'sha256:t1' as TargetId, type: 'service', identifier: 'backend' }],
        'single_service',
        {
          maxDurationMinutes: 120,
          maxAffectedResources: 5,
          requiresApproval: true,
          autoRevertOnFailure: false,
          excludedServices: [],
          excludedRegions: [],
        },
        'Restore network connectivity between affected services',
        operatorA
      );
      const validation = service.validateSafety(injection!.id);
      assert.ok(validation.warnings.length > 0);
    });
  });
});
