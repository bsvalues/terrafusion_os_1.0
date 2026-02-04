/**
 * Phase XIX — Game Days + Red Team Governance
 * ============================================
 * Contract: gameday.scenarios.contract.test.ts
 *
 * Tests scenario definitions, required hooks, execution phases,
 * and success/failure criteria for game day exercises.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Scenarios define explicit success/failure criteria
 * - Hooks must complete before scenario advances
 * - All scenario executions are audited
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type ScenarioId = `sha256:${string}`;
type ExecutionId = `sha256:${string}`;
type HookId = `sha256:${string}`;
type ParticipantId = `sha256:${string}`;

type ScenarioCategory =
  | 'key_compromise'
  | 'issuer_drift'
  | 'export_control_breach'
  | 'cert_expiry_cascade'
  | 'dr_failover'
  | 'data_exfiltration'
  | 'denial_of_service'
  | 'privilege_escalation';

type ScenarioPhase =
  | 'setup'
  | 'inject'
  | 'detect'
  | 'respond'
  | 'recover'
  | 'validate'
  | 'complete';
type HookType = 'pre_phase' | 'post_phase' | 'on_failure' | 'on_success' | 'cleanup';
type ExecutionStatus = 'pending' | 'running' | 'passed' | 'failed' | 'aborted';

interface SuccessCriteria {
  readonly id: string;
  readonly description: string;
  readonly metric: string;
  readonly threshold: number;
  readonly operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq';
  readonly required: boolean;
}

interface ScenarioHook {
  readonly id: HookId;
  readonly type: HookType;
  readonly phase?: ScenarioPhase;
  readonly name: string;
  readonly timeoutMs: number;
  readonly required: boolean;
  readonly handler: () => Promise<boolean>;
}

interface ScenarioDefinition {
  readonly id: ScenarioId;
  readonly name: string;
  readonly description: string;
  readonly category: ScenarioCategory;
  readonly phases: readonly ScenarioPhase[];
  readonly successCriteria: readonly SuccessCriteria[];
  readonly hooks: readonly ScenarioHook[];
  readonly blastRadiusLimit: string;
  readonly requiresApproval: boolean;
  readonly estimatedDurationMinutes: number;
  readonly createdAt: string;
}

interface PhaseExecution {
  readonly phase: ScenarioPhase;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly status: ExecutionStatus;
  readonly hookResults: readonly HookResult[];
  readonly metrics: Record<string, number>;
}

interface HookResult {
  readonly hookId: HookId;
  readonly executed: boolean;
  readonly success: boolean;
  readonly durationMs: number;
  readonly error?: string;
}

interface CriteriaEvaluation {
  readonly criteriaId: string;
  readonly passed: boolean;
  readonly actualValue: number;
  readonly threshold: number;
}

interface ScenarioExecution {
  readonly id: ExecutionId;
  readonly scenarioId: ScenarioId;
  readonly gameDayId: string;
  readonly status: ExecutionStatus;
  readonly currentPhase: ScenarioPhase | null;
  readonly phaseExecutions: readonly PhaseExecution[];
  readonly criteriaEvaluations: readonly CriteriaEvaluation[];
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly abortedBy?: ParticipantId;
  readonly abortReason?: string;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockScenarioService() {
  const scenarios = new Map<ScenarioId, ScenarioDefinition>();
  const executions = new Map<ExecutionId, ScenarioExecution>();

  function generateId(prefix: string): ScenarioId {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}` as ScenarioId;
  }

  const standardPhases: readonly ScenarioPhase[] = [
    'setup',
    'inject',
    'detect',
    'respond',
    'recover',
    'validate',
    'complete',
  ];

  return {
    // Scenario Definition
    createScenario(
      name: string,
      category: ScenarioCategory,
      description: string,
      successCriteria: readonly SuccessCriteria[],
      options: {
        phases?: readonly ScenarioPhase[];
        blastRadiusLimit?: string;
        requiresApproval?: boolean;
        estimatedDurationMinutes?: number;
      } = {}
    ): ScenarioDefinition {
      const id = generateId('scenario');
      const scenario: ScenarioDefinition = {
        id,
        name,
        description,
        category,
        phases: options.phases ?? standardPhases,
        successCriteria,
        hooks: [],
        blastRadiusLimit: options.blastRadiusLimit ?? 'single_service',
        requiresApproval: options.requiresApproval ?? true,
        estimatedDurationMinutes: options.estimatedDurationMinutes ?? 60,
        createdAt: new Date().toISOString(),
      };
      scenarios.set(id, scenario);
      return scenario;
    },

    addHook(scenarioId: ScenarioId, hook: Omit<ScenarioHook, 'id'>): ScenarioDefinition | null {
      const scenario = scenarios.get(scenarioId);
      if (!scenario) return null;

      const hookWithId: ScenarioHook = {
        ...hook,
        id: generateId('hook') as HookId,
      };

      const updated: ScenarioDefinition = {
        ...scenario,
        hooks: [...scenario.hooks, hookWithId],
      };
      scenarios.set(scenarioId, updated);
      return updated;
    },

    getScenario(id: ScenarioId): ScenarioDefinition | null {
      return scenarios.get(id) ?? null;
    },

    getScenariosByCategory(category: ScenarioCategory): readonly ScenarioDefinition[] {
      return [...scenarios.values()].filter(s => s.category === category);
    },

    // Scenario Execution
    startExecution(scenarioId: ScenarioId, gameDayId: string): ScenarioExecution | null {
      const scenario = scenarios.get(scenarioId);
      if (!scenario) return null;

      const id = generateId('execution') as ExecutionId;
      const execution: ScenarioExecution = {
        id,
        scenarioId,
        gameDayId,
        status: 'running',
        currentPhase: scenario.phases[0],
        phaseExecutions: [],
        criteriaEvaluations: [],
        startedAt: new Date().toISOString(),
      };
      executions.set(id, execution);
      return execution;
    },

    async executePhase(
      executionId: ExecutionId,
      phase: ScenarioPhase,
      metrics: Record<string, number> = {}
    ): Promise<PhaseExecution | null> {
      const execution = executions.get(executionId);
      if (!execution || execution.status !== 'running') return null;

      const scenario = scenarios.get(execution.scenarioId);
      if (!scenario) return null;

      // Execute pre-phase hooks
      const preHooks = scenario.hooks.filter(h => h.type === 'pre_phase' && h.phase === phase);
      const hookResults: HookResult[] = [];

      for (const hook of preHooks) {
        const startTime = Date.now();
        try {
          const success = await hook.handler();
          hookResults.push({
            hookId: hook.id,
            executed: true,
            success,
            durationMs: Date.now() - startTime,
          });
          if (!success && hook.required) {
            // Required hook failed - abort phase
            const phaseExec: PhaseExecution = {
              phase,
              startedAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
              status: 'failed',
              hookResults,
              metrics,
            };
            return phaseExec;
          }
        } catch (error) {
          hookResults.push({
            hookId: hook.id,
            executed: true,
            success: false,
            durationMs: Date.now() - startTime,
            error: String(error),
          });
          if (hook.required) {
            const phaseExec: PhaseExecution = {
              phase,
              startedAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
              status: 'failed',
              hookResults,
              metrics,
            };
            return phaseExec;
          }
        }
      }

      // Execute post-phase hooks
      const postHooks = scenario.hooks.filter(h => h.type === 'post_phase' && h.phase === phase);
      for (const hook of postHooks) {
        const startTime = Date.now();
        try {
          const success = await hook.handler();
          hookResults.push({
            hookId: hook.id,
            executed: true,
            success,
            durationMs: Date.now() - startTime,
          });
        } catch (error) {
          hookResults.push({
            hookId: hook.id,
            executed: true,
            success: false,
            durationMs: Date.now() - startTime,
            error: String(error),
          });
        }
      }

      const phaseExec: PhaseExecution = {
        phase,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: 'passed',
        hookResults,
        metrics,
      };

      // Update execution state
      const phaseIndex = scenario.phases.indexOf(phase);
      const nextPhase =
        phaseIndex < scenario.phases.length - 1 ? scenario.phases[phaseIndex + 1] : null;

      const updated: ScenarioExecution = {
        ...execution,
        currentPhase: nextPhase,
        phaseExecutions: [...execution.phaseExecutions, phaseExec],
      };
      executions.set(executionId, updated);

      return phaseExec;
    },

    advancePhase(executionId: ExecutionId): ScenarioPhase | null {
      const execution = executions.get(executionId);
      if (!execution || execution.status !== 'running') return null;

      const scenario = scenarios.get(execution.scenarioId);
      if (!scenario || !execution.currentPhase) return null;

      const currentIndex = scenario.phases.indexOf(execution.currentPhase);
      if (currentIndex >= scenario.phases.length - 1) return null;

      const nextPhase = scenario.phases[currentIndex + 1];
      const updated: ScenarioExecution = {
        ...execution,
        currentPhase: nextPhase,
      };
      executions.set(executionId, updated);
      return nextPhase;
    },

    evaluateCriteria(executionId: ExecutionId): readonly CriteriaEvaluation[] {
      const execution = executions.get(executionId);
      if (!execution) return [];

      const scenario = scenarios.get(execution.scenarioId);
      if (!scenario) return [];

      // Collect all metrics from phase executions
      const allMetrics: Record<string, number> = {};
      for (const phase of execution.phaseExecutions) {
        Object.assign(allMetrics, phase.metrics);
      }

      const evaluations: CriteriaEvaluation[] = [];
      for (const criteria of scenario.successCriteria) {
        const actualValue = allMetrics[criteria.metric] ?? 0;
        let passed = false;

        switch (criteria.operator) {
          case 'lt':
            passed = actualValue < criteria.threshold;
            break;
          case 'lte':
            passed = actualValue <= criteria.threshold;
            break;
          case 'gt':
            passed = actualValue > criteria.threshold;
            break;
          case 'gte':
            passed = actualValue >= criteria.threshold;
            break;
          case 'eq':
            passed = actualValue === criteria.threshold;
            break;
        }

        evaluations.push({
          criteriaId: criteria.id,
          passed,
          actualValue,
          threshold: criteria.threshold,
        });
      }

      const updated: ScenarioExecution = {
        ...execution,
        criteriaEvaluations: evaluations,
      };
      executions.set(executionId, updated);

      return evaluations;
    },

    completeExecution(executionId: ExecutionId): ScenarioExecution | null {
      const execution = executions.get(executionId);
      if (!execution || execution.status !== 'running') return null;

      const evaluations = this.evaluateCriteria(executionId);
      const scenario = scenarios.get(execution.scenarioId);
      if (!scenario) return null;

      // Check if all required criteria passed
      const requiredCriteria = scenario.successCriteria.filter(c => c.required);
      const allRequiredPassed = requiredCriteria.every(
        rc => evaluations.find(e => e.criteriaId === rc.id)?.passed ?? false
      );

      const updated: ScenarioExecution = {
        ...execution,
        status: allRequiredPassed ? 'passed' : 'failed',
        currentPhase: null,
        completedAt: new Date().toISOString(),
        criteriaEvaluations: evaluations,
      };
      executions.set(executionId, updated);
      return updated;
    },

    abortExecution(
      executionId: ExecutionId,
      abortedBy: ParticipantId,
      reason: string
    ): ScenarioExecution | null {
      const execution = executions.get(executionId);
      if (!execution || execution.status !== 'running') return null;

      const updated: ScenarioExecution = {
        ...execution,
        status: 'aborted',
        currentPhase: null,
        completedAt: new Date().toISOString(),
        abortedBy,
        abortReason: reason,
      };
      executions.set(executionId, updated);
      return updated;
    },

    getExecution(id: ExecutionId): ScenarioExecution | null {
      return executions.get(id) ?? null;
    },

    getExecutionsByGameDay(gameDayId: string): readonly ScenarioExecution[] {
      return [...executions.values()].filter(e => e.gameDayId === gameDayId);
    },

    // Validation
    validateScenarioDefinition(id: ScenarioId): { valid: boolean; errors: string[] } {
      const scenario = scenarios.get(id);
      if (!scenario) return { valid: false, errors: ['Scenario not found'] };

      const errors: string[] = [];

      if (scenario.phases.length === 0) {
        errors.push('Scenario must have at least one phase');
      }

      if (scenario.successCriteria.length === 0) {
        errors.push('Scenario must have at least one success criteria');
      }

      const requiredCriteria = scenario.successCriteria.filter(c => c.required);
      if (requiredCriteria.length === 0) {
        errors.push('Scenario must have at least one required success criteria');
      }

      if (!scenario.blastRadiusLimit) {
        errors.push('Blast radius limit must be specified');
      }

      return { valid: errors.length === 0, errors };
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XIX: Game Day Scenarios Contracts', () => {
  let service: ReturnType<typeof createMockScenarioService>;
  const participantId = 'sha256:participant_abc123' as ParticipantId;

  beforeEach(() => {
    service = createMockScenarioService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate scenario IDs with sha256: prefix', () => {
      const scenario = service.createScenario(
        'Key Rotation Test',
        'key_compromise',
        'Tests key rotation under compromise',
        [
          {
            id: 'mttr',
            description: 'MTTR',
            metric: 'mttr_seconds',
            threshold: 900,
            operator: 'lte',
            required: true,
          },
        ]
      );
      assert.ok(scenario.id.startsWith('sha256:'), 'Scenario ID must be opaque sha256:');
    });

    it('should generate execution IDs with sha256: prefix', () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'DR test', [
        {
          id: 'mttr',
          description: 'MTTR',
          metric: 'mttr_seconds',
          threshold: 900,
          operator: 'lte',
          required: true,
        },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-1');
      assert.ok(execution);
      assert.ok(execution!.id.startsWith('sha256:'), 'Execution ID must be opaque sha256:');
    });

    it('should generate hook IDs with sha256: prefix', () => {
      const scenario = service.createScenario('Test', 'cert_expiry_cascade', 'Cert expiry test', [
        {
          id: 'recovery',
          description: 'Recovery',
          metric: 'recovery_rate',
          threshold: 0.99,
          operator: 'gte',
          required: true,
        },
      ]);
      service.addHook(scenario.id, {
        type: 'pre_phase',
        phase: 'setup',
        name: 'Prepare environment',
        timeoutMs: 5000,
        required: true,
        handler: async () => true,
      });
      const updated = service.getScenario(scenario.id);
      assert.ok(updated!.hooks[0].id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Scenario Definition Tests
  // ==========================================================================

  describe('Scenario Definition', () => {
    it('should create scenario with all required fields', () => {
      const scenario = service.createScenario(
        'DR Failover Exercise',
        'dr_failover',
        'Tests region failover procedures',
        [
          {
            id: 'rto',
            description: 'RTO',
            metric: 'rto_seconds',
            threshold: 3600,
            operator: 'lte',
            required: true,
          },
          {
            id: 'rpo',
            description: 'RPO',
            metric: 'rpo_seconds',
            threshold: 300,
            operator: 'lte',
            required: true,
          },
        ],
        { estimatedDurationMinutes: 120 }
      );
      assert.strictEqual(scenario.name, 'DR Failover Exercise');
      assert.strictEqual(scenario.category, 'dr_failover');
      assert.strictEqual(scenario.successCriteria.length, 2);
      assert.strictEqual(scenario.estimatedDurationMinutes, 120);
    });

    it('should include standard phases by default', () => {
      const scenario = service.createScenario('Test', 'key_compromise', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      assert.deepStrictEqual(scenario.phases, [
        'setup',
        'inject',
        'detect',
        'respond',
        'recover',
        'validate',
        'complete',
      ]);
    });

    it('should allow custom phases', () => {
      const scenario = service.createScenario(
        'Simple Test',
        'denial_of_service',
        'Simple test',
        [
          {
            id: 'c1',
            description: 'C1',
            metric: 'm',
            threshold: 1,
            operator: 'eq',
            required: true,
          },
        ],
        { phases: ['setup', 'inject', 'complete'] }
      );
      assert.deepStrictEqual(scenario.phases, ['setup', 'inject', 'complete']);
    });

    it('should require approval by default', () => {
      const scenario = service.createScenario('Test', 'privilege_escalation', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      assert.strictEqual(scenario.requiresApproval, true);
    });

    it('should set blast radius limit', () => {
      const scenario = service.createScenario(
        'Test',
        'data_exfiltration',
        'Test',
        [
          {
            id: 'c1',
            description: 'C1',
            metric: 'm',
            threshold: 1,
            operator: 'eq',
            required: true,
          },
        ],
        { blastRadiusLimit: 'single_region' }
      );
      assert.strictEqual(scenario.blastRadiusLimit, 'single_region');
    });

    it('should record creation timestamp', () => {
      const before = new Date().toISOString();
      const scenario = service.createScenario('Test', 'issuer_drift', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      const after = new Date().toISOString();
      assert.ok(scenario.createdAt >= before && scenario.createdAt <= after);
    });
  });

  // ==========================================================================
  // Scenario Category Tests
  // ==========================================================================

  describe('Scenario Categories', () => {
    it('should support key_compromise category', () => {
      const scenario = service.createScenario('Key Compromise', 'key_compromise', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      assert.strictEqual(scenario.category, 'key_compromise');
    });

    it('should support issuer_drift category', () => {
      const scenario = service.createScenario('Issuer Drift', 'issuer_drift', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      assert.strictEqual(scenario.category, 'issuer_drift');
    });

    it('should support export_control_breach category', () => {
      const scenario = service.createScenario('Export Control', 'export_control_breach', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      assert.strictEqual(scenario.category, 'export_control_breach');
    });

    it('should support cert_expiry_cascade category', () => {
      const scenario = service.createScenario('Cert Expiry', 'cert_expiry_cascade', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      assert.strictEqual(scenario.category, 'cert_expiry_cascade');
    });

    it('should query scenarios by category', () => {
      service.createScenario('S1', 'key_compromise', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      service.createScenario('S2', 'key_compromise', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      service.createScenario('S3', 'dr_failover', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      const keyCompromise = service.getScenariosByCategory('key_compromise');
      assert.strictEqual(keyCompromise.length, 2);
    });
  });

  // ==========================================================================
  // Hook Tests
  // ==========================================================================

  describe('Scenario Hooks', () => {
    it('should add pre_phase hook', () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      const updated = service.addHook(scenario.id, {
        type: 'pre_phase',
        phase: 'inject',
        name: 'Verify injection target',
        timeoutMs: 10000,
        required: true,
        handler: async () => true,
      });
      assert.ok(updated);
      assert.strictEqual(updated!.hooks.length, 1);
      assert.strictEqual(updated!.hooks[0].type, 'pre_phase');
    });

    it('should add post_phase hook', () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      service.addHook(scenario.id, {
        type: 'post_phase',
        phase: 'recover',
        name: 'Verify recovery state',
        timeoutMs: 5000,
        required: false,
        handler: async () => true,
      });
      const updated = service.getScenario(scenario.id);
      assert.strictEqual(updated!.hooks[0].type, 'post_phase');
    });

    it('should add cleanup hook', () => {
      const scenario = service.createScenario('Test', 'key_compromise', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      service.addHook(scenario.id, {
        type: 'cleanup',
        name: 'Restore original keys',
        timeoutMs: 30000,
        required: true,
        handler: async () => true,
      });
      const updated = service.getScenario(scenario.id);
      assert.strictEqual(updated!.hooks[0].type, 'cleanup');
    });

    it('should add multiple hooks', () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      service.addHook(scenario.id, {
        type: 'pre_phase',
        phase: 'setup',
        name: 'Hook 1',
        timeoutMs: 5000,
        required: true,
        handler: async () => true,
      });
      service.addHook(scenario.id, {
        type: 'post_phase',
        phase: 'setup',
        name: 'Hook 2',
        timeoutMs: 5000,
        required: false,
        handler: async () => true,
      });
      const updated = service.getScenario(scenario.id);
      assert.strictEqual(updated!.hooks.length, 2);
    });
  });

  // ==========================================================================
  // Execution Tests
  // ==========================================================================

  describe('Scenario Execution', () => {
    it('should start execution for valid scenario', () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-123');
      assert.ok(execution);
      assert.strictEqual(execution!.status, 'running');
      assert.strictEqual(execution!.gameDayId, 'gameday-123');
    });

    it('should set current phase to first phase', () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-123');
      assert.strictEqual(execution!.currentPhase, 'setup');
    });

    it('should record execution start time', () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      const before = new Date().toISOString();
      const execution = service.startExecution(scenario.id, 'gameday-123');
      const after = new Date().toISOString();
      assert.ok(execution!.startedAt >= before && execution!.startedAt <= after);
    });

    it('should not start execution for invalid scenario', () => {
      const execution = service.startExecution('sha256:nonexistent' as ScenarioId, 'gameday-123');
      assert.strictEqual(execution, null);
    });
  });

  // ==========================================================================
  // Phase Execution Tests
  // ==========================================================================

  describe('Phase Execution', () => {
    it('should execute phase and record metrics', async () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        {
          id: 'mttr',
          description: 'MTTR',
          metric: 'mttr_seconds',
          threshold: 900,
          operator: 'lte',
          required: true,
        },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-123');
      const phaseExec = await service.executePhase(execution!.id, 'setup', { prep_time: 30 });
      assert.ok(phaseExec);
      assert.strictEqual(phaseExec!.phase, 'setup');
      assert.strictEqual(phaseExec!.metrics.prep_time, 30);
    });

    it('should execute hooks during phase', async () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      service.addHook(scenario.id, {
        type: 'pre_phase',
        phase: 'setup',
        name: 'Pre-setup check',
        timeoutMs: 5000,
        required: true,
        handler: async () => true,
      });
      const execution = service.startExecution(scenario.id, 'gameday-123');
      const phaseExec = await service.executePhase(execution!.id, 'setup');
      assert.ok(phaseExec!.hookResults.length > 0);
      assert.strictEqual(phaseExec!.hookResults[0].success, true);
    });

    it('should fail phase if required hook fails', async () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      service.addHook(scenario.id, {
        type: 'pre_phase',
        phase: 'setup',
        name: 'Failing hook',
        timeoutMs: 5000,
        required: true,
        handler: async () => false,
      });
      const execution = service.startExecution(scenario.id, 'gameday-123');
      const phaseExec = await service.executePhase(execution!.id, 'setup');
      assert.strictEqual(phaseExec!.status, 'failed');
    });

    it('should continue if optional hook fails', async () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      service.addHook(scenario.id, {
        type: 'pre_phase',
        phase: 'setup',
        name: 'Optional hook',
        timeoutMs: 5000,
        required: false,
        handler: async () => false,
      });
      const execution = service.startExecution(scenario.id, 'gameday-123');
      const phaseExec = await service.executePhase(execution!.id, 'setup');
      assert.strictEqual(phaseExec!.status, 'passed');
    });

    it('should advance to next phase after execution', async () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-123');
      await service.executePhase(execution!.id, 'setup');
      const updated = service.getExecution(execution!.id);
      assert.strictEqual(updated!.currentPhase, 'inject');
    });
  });

  // ==========================================================================
  // Success Criteria Tests
  // ==========================================================================

  describe('Success Criteria Evaluation', () => {
    it('should evaluate lte operator correctly', async () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        {
          id: 'mttr',
          description: 'MTTR',
          metric: 'mttr_seconds',
          threshold: 900,
          operator: 'lte',
          required: true,
        },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-123');
      await service.executePhase(execution!.id, 'setup', { mttr_seconds: 600 });
      const evaluations = service.evaluateCriteria(execution!.id);
      assert.strictEqual(evaluations[0].passed, true);
    });

    it('should evaluate gte operator correctly', async () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        {
          id: 'recovery',
          description: 'Recovery',
          metric: 'recovery_rate',
          threshold: 0.99,
          operator: 'gte',
          required: true,
        },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-123');
      await service.executePhase(execution!.id, 'setup', { recovery_rate: 0.995 });
      const evaluations = service.evaluateCriteria(execution!.id);
      assert.strictEqual(evaluations[0].passed, true);
    });

    it('should evaluate lt operator correctly', async () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        {
          id: 'errors',
          description: 'Errors',
          metric: 'error_count',
          threshold: 5,
          operator: 'lt',
          required: true,
        },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-123');
      await service.executePhase(execution!.id, 'setup', { error_count: 3 });
      const evaluations = service.evaluateCriteria(execution!.id);
      assert.strictEqual(evaluations[0].passed, true);
    });

    it('should fail criteria when threshold not met', async () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        {
          id: 'mttr',
          description: 'MTTR',
          metric: 'mttr_seconds',
          threshold: 900,
          operator: 'lte',
          required: true,
        },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-123');
      await service.executePhase(execution!.id, 'setup', { mttr_seconds: 1200 });
      const evaluations = service.evaluateCriteria(execution!.id);
      assert.strictEqual(evaluations[0].passed, false);
    });

    it('should record actual value and threshold', async () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        {
          id: 'mttr',
          description: 'MTTR',
          metric: 'mttr_seconds',
          threshold: 900,
          operator: 'lte',
          required: true,
        },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-123');
      await service.executePhase(execution!.id, 'setup', { mttr_seconds: 750 });
      const evaluations = service.evaluateCriteria(execution!.id);
      assert.strictEqual(evaluations[0].actualValue, 750);
      assert.strictEqual(evaluations[0].threshold, 900);
    });
  });

  // ==========================================================================
  // Execution Completion Tests
  // ==========================================================================

  describe('Execution Completion', () => {
    it('should complete execution with passed status when all criteria met', async () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        {
          id: 'mttr',
          description: 'MTTR',
          metric: 'mttr_seconds',
          threshold: 900,
          operator: 'lte',
          required: true,
        },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-123');
      await service.executePhase(execution!.id, 'setup', { mttr_seconds: 600 });
      const completed = service.completeExecution(execution!.id);
      assert.ok(completed);
      assert.strictEqual(completed!.status, 'passed');
    });

    it('should complete execution with failed status when criteria not met', async () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        {
          id: 'mttr',
          description: 'MTTR',
          metric: 'mttr_seconds',
          threshold: 900,
          operator: 'lte',
          required: true,
        },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-123');
      await service.executePhase(execution!.id, 'setup', { mttr_seconds: 1200 });
      const completed = service.completeExecution(execution!.id);
      assert.strictEqual(completed!.status, 'failed');
    });

    it('should record completion timestamp', async () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        {
          id: 'mttr',
          description: 'MTTR',
          metric: 'mttr_seconds',
          threshold: 900,
          operator: 'lte',
          required: true,
        },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-123');
      await service.executePhase(execution!.id, 'setup', { mttr_seconds: 600 });
      const completed = service.completeExecution(execution!.id);
      assert.ok(completed!.completedAt);
    });

    it('should set currentPhase to null on completion', async () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        {
          id: 'mttr',
          description: 'MTTR',
          metric: 'mttr_seconds',
          threshold: 900,
          operator: 'lte',
          required: true,
        },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-123');
      await service.executePhase(execution!.id, 'setup', { mttr_seconds: 600 });
      const completed = service.completeExecution(execution!.id);
      assert.strictEqual(completed!.currentPhase, null);
    });
  });

  // ==========================================================================
  // Abort Tests
  // ==========================================================================

  describe('Execution Abort', () => {
    it('should abort running execution', () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-123');
      const aborted = service.abortExecution(execution!.id, participantId, 'Emergency stop');
      assert.ok(aborted);
      assert.strictEqual(aborted!.status, 'aborted');
    });

    it('should record abort reason and actor', () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-123');
      const aborted = service.abortExecution(execution!.id, participantId, 'Safety concern');
      assert.strictEqual(aborted!.abortedBy, participantId);
      assert.strictEqual(aborted!.abortReason, 'Safety concern');
    });

    it('should not abort already completed execution', async () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        {
          id: 'mttr',
          description: 'MTTR',
          metric: 'mttr_seconds',
          threshold: 900,
          operator: 'lte',
          required: true,
        },
      ]);
      const execution = service.startExecution(scenario.id, 'gameday-123');
      await service.executePhase(execution!.id, 'setup', { mttr_seconds: 600 });
      service.completeExecution(execution!.id);
      const aborted = service.abortExecution(execution!.id, participantId, 'Too late');
      assert.strictEqual(aborted, null);
    });
  });

  // ==========================================================================
  // Validation Tests
  // ==========================================================================

  describe('Scenario Validation', () => {
    it('should validate scenario with all requirements', () => {
      const scenario = service.createScenario('Valid Scenario', 'dr_failover', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      const validation = service.validateScenarioDefinition(scenario.id);
      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.errors.length, 0);
    });

    it('should reject scenario without success criteria', () => {
      // Create manually without criteria - edge case test
      const scenario = service.createScenario(
        'No Criteria',
        'dr_failover',
        'Test',
        [] // Empty criteria
      );
      const validation = service.validateScenarioDefinition(scenario.id);
      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.some(e => e.includes('success criteria')));
    });

    it('should reject scenario without required criteria', () => {
      const scenario = service.createScenario('No Required', 'dr_failover', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: false },
      ]);
      const validation = service.validateScenarioDefinition(scenario.id);
      assert.strictEqual(validation.valid, false);
    });
  });

  // ==========================================================================
  // Query Tests
  // ==========================================================================

  describe('Execution Queries', () => {
    it('should get executions by game day', () => {
      const scenario = service.createScenario('Test', 'dr_failover', 'Test', [
        { id: 'c1', description: 'C1', metric: 'm', threshold: 1, operator: 'eq', required: true },
      ]);
      service.startExecution(scenario.id, 'gameday-1');
      service.startExecution(scenario.id, 'gameday-1');
      service.startExecution(scenario.id, 'gameday-2');

      const gd1Executions = service.getExecutionsByGameDay('gameday-1');
      const gd2Executions = service.getExecutionsByGameDay('gameday-2');
      assert.strictEqual(gd1Executions.length, 2);
      assert.strictEqual(gd2Executions.length, 1);
    });
  });
});
