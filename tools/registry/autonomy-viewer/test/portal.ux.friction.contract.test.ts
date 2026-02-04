/**
 * Phase XXI — Optimization & Sustainability
 * ==========================================
 * Contract: portal.ux.friction.contract.test.ts
 *
 * Tests portal UX friction reduction: workflow step counts, time-to-action,
 * "why blocked" explanations, and evidence drilldown.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Workflow steps are bounded
 * - "Why blocked" explanations are deterministic
 * - Evidence refs are linked, not embedded
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type WorkflowId = `sha256:${string}`;
type StepId = `sha256:${string}`;
type ActionId = `sha256:${string}`;
type EvidenceRef = `sha256:${string}`;
type AgencyId = `sha256:${string}`;

type WorkflowType =
  | 'onboarding'
  | 'exception_request'
  | 'drill_report'
  | 'compliance_check'
  | 'rollout_enrollment';
type StepType = 'form' | 'upload' | 'review' | 'approval' | 'confirmation';
type BlockReason =
  | 'missing_field'
  | 'validation_failed'
  | 'pending_approval'
  | 'insufficient_attestation'
  | 'readiness_threshold';

interface Workflow {
  readonly id: WorkflowId;
  readonly type: WorkflowType;
  readonly name: string;
  readonly steps: readonly WorkflowStep[];
  readonly maxSteps: number;
  readonly estimatedMinutes: number;
  readonly automatedSteps: number;
}

interface WorkflowStep {
  readonly id: StepId;
  readonly order: number;
  readonly name: string;
  readonly type: StepType;
  readonly required: boolean;
  readonly automatable: boolean;
  readonly estimatedSeconds: number;
}

interface WorkflowExecution {
  readonly id: `sha256:${string}`;
  readonly workflowId: WorkflowId;
  readonly agencyId: AgencyId;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly currentStep: number;
  readonly stepCompletions: readonly StepCompletion[];
  readonly blocked: boolean;
  readonly blockReason?: BlockReason;
  readonly blockDetails?: BlockDetails;
}

interface StepCompletion {
  readonly stepId: StepId;
  readonly completedAt: string;
  readonly durationSeconds: number;
  readonly automated: boolean;
}

interface BlockDetails {
  readonly reason: BlockReason;
  readonly explanation: string;
  readonly evidenceRefs: readonly EvidenceRef[];
  readonly resolution: string;
  readonly nextSteps: readonly string[];
}

interface QuickAction {
  readonly id: ActionId;
  readonly name: string;
  readonly description: string;
  readonly workflowType: WorkflowType;
  readonly prefillFields: readonly string[];
  readonly estimatedSeconds: number;
  readonly oneClick: boolean;
}

interface UxMetrics {
  readonly generatedAt: string;
  readonly avgStepsPerWorkflow: number;
  readonly avgTimeToComplete: number;
  readonly blockRate: number;
  readonly topBlockReasons: readonly { reason: BlockReason; count: number }[];
  readonly automationRate: number;
  readonly oneClickActionUsage: number;
  readonly workflowAbandonmentRate: number;
}

interface DrilldownPath {
  readonly from: string;
  readonly to: string;
  readonly evidenceRef: EvidenceRef;
  readonly clickPath: readonly string[];
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockPortalUxService() {
  const workflows = new Map<WorkflowId, Workflow>();
  const executions = new Map<`sha256:${string}`, WorkflowExecution>();
  const quickActions = new Map<ActionId, QuickAction>();
  const drilldownPaths: DrilldownPath[] = [];

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  // Initialize default workflows with step bounds
  const defaultWorkflows: Array<Omit<Workflow, 'id'>> = [
    {
      type: 'onboarding',
      name: 'Service Onboarding',
      steps: [
        {
          id: generateId('step') as StepId,
          order: 1,
          name: 'Identify Service',
          type: 'form',
          required: true,
          automatable: false,
          estimatedSeconds: 60,
        },
        {
          id: generateId('step') as StepId,
          order: 2,
          name: 'Upload Evidence',
          type: 'upload',
          required: true,
          automatable: false,
          estimatedSeconds: 120,
        },
        {
          id: generateId('step') as StepId,
          order: 3,
          name: 'Verify Controls',
          type: 'review',
          required: true,
          automatable: true,
          estimatedSeconds: 30,
        },
        {
          id: generateId('step') as StepId,
          order: 4,
          name: 'Confirm Enrollment',
          type: 'confirmation',
          required: true,
          automatable: false,
          estimatedSeconds: 15,
        },
      ],
      maxSteps: 5,
      estimatedMinutes: 4,
      automatedSteps: 1,
    },
    {
      type: 'exception_request',
      name: 'Exception Request',
      steps: [
        {
          id: generateId('step') as StepId,
          order: 1,
          name: 'Describe Exception',
          type: 'form',
          required: true,
          automatable: false,
          estimatedSeconds: 90,
        },
        {
          id: generateId('step') as StepId,
          order: 2,
          name: 'Attach Evidence',
          type: 'upload',
          required: false,
          automatable: false,
          estimatedSeconds: 60,
        },
        {
          id: generateId('step') as StepId,
          order: 3,
          name: 'Supervisor Approval',
          type: 'approval',
          required: true,
          automatable: false,
          estimatedSeconds: 0,
        },
      ],
      maxSteps: 4,
      estimatedMinutes: 3,
      automatedSteps: 0,
    },
    {
      type: 'drill_report',
      name: 'Drill Report Submission',
      steps: [
        {
          id: generateId('step') as StepId,
          order: 1,
          name: 'Select Drill Type',
          type: 'form',
          required: true,
          automatable: false,
          estimatedSeconds: 15,
        },
        {
          id: generateId('step') as StepId,
          order: 2,
          name: 'Record Outcomes',
          type: 'form',
          required: true,
          automatable: false,
          estimatedSeconds: 120,
        },
        {
          id: generateId('step') as StepId,
          order: 3,
          name: 'Upload Artifacts',
          type: 'upload',
          required: false,
          automatable: false,
          estimatedSeconds: 60,
        },
      ],
      maxSteps: 4,
      estimatedMinutes: 3,
      automatedSteps: 0,
    },
    {
      type: 'compliance_check',
      name: 'Compliance Status Check',
      steps: [
        {
          id: generateId('step') as StepId,
          order: 1,
          name: 'Select Controls',
          type: 'form',
          required: true,
          automatable: false,
          estimatedSeconds: 30,
        },
        {
          id: generateId('step') as StepId,
          order: 2,
          name: 'Run Assessment',
          type: 'review',
          required: true,
          automatable: true,
          estimatedSeconds: 5,
        },
      ],
      maxSteps: 3,
      estimatedMinutes: 1,
      automatedSteps: 1,
    },
    {
      type: 'rollout_enrollment',
      name: 'Rollout Enrollment',
      steps: [
        {
          id: generateId('step') as StepId,
          order: 1,
          name: 'Check Eligibility',
          type: 'review',
          required: true,
          automatable: true,
          estimatedSeconds: 10,
        },
        {
          id: generateId('step') as StepId,
          order: 2,
          name: 'Confirm Enrollment',
          type: 'confirmation',
          required: true,
          automatable: false,
          estimatedSeconds: 15,
        },
      ],
      maxSteps: 3,
      estimatedMinutes: 1,
      automatedSteps: 1,
    },
  ];

  for (const wf of defaultWorkflows) {
    const id = generateId('workflow') as WorkflowId;
    workflows.set(id, { ...wf, id });
  }

  // Initialize quick actions
  const defaultActions: Array<Omit<QuickAction, 'id'>> = [
    {
      name: 'Quick Compliance Check',
      description: 'Run compliance check with pre-selected controls',
      workflowType: 'compliance_check',
      prefillFields: ['agency_id', 'control_set'],
      estimatedSeconds: 10,
      oneClick: true,
    },
    {
      name: 'Report Completed Drill',
      description: 'Submit drill report with minimal input',
      workflowType: 'drill_report',
      prefillFields: ['agency_id', 'drill_type', 'date'],
      estimatedSeconds: 60,
      oneClick: false,
    },
    {
      name: 'Request Standard Exception',
      description: 'Pre-filled exception request form',
      workflowType: 'exception_request',
      prefillFields: ['agency_id', 'exception_type'],
      estimatedSeconds: 120,
      oneClick: false,
    },
  ];

  for (const action of defaultActions) {
    const id = generateId('action') as ActionId;
    quickActions.set(id, { ...action, id });
  }

  return {
    // Workflow Management
    getWorkflow(id: WorkflowId): Workflow | null {
      return workflows.get(id) ?? null;
    },

    getWorkflowByType(type: WorkflowType): Workflow | null {
      return [...workflows.values()].find(w => w.type === type) ?? null;
    },

    getAllWorkflows(): readonly Workflow[] {
      return [...workflows.values()];
    },

    getWorkflowStepCount(type: WorkflowType): number {
      const wf = this.getWorkflowByType(type);
      return wf ? wf.steps.length : 0;
    },

    isStepCountBounded(type: WorkflowType): boolean {
      const wf = this.getWorkflowByType(type);
      if (!wf) return false;
      return wf.steps.length <= wf.maxSteps;
    },

    // Execution
    startExecution(workflowType: WorkflowType, agencyId: AgencyId): WorkflowExecution | null {
      const workflow = this.getWorkflowByType(workflowType);
      if (!workflow) return null;

      const id = generateId('execution') as `sha256:${string}`;
      const execution: WorkflowExecution = {
        id,
        workflowId: workflow.id,
        agencyId,
        startedAt: new Date().toISOString(),
        currentStep: 1,
        stepCompletions: [],
        blocked: false,
      };

      executions.set(id, execution);
      return execution;
    },

    getExecution(id: `sha256:${string}`): WorkflowExecution | null {
      return executions.get(id) ?? null;
    },

    completeStep(
      executionId: `sha256:${string}`,
      stepId: StepId,
      durationSeconds: number,
      automated: boolean = false
    ): WorkflowExecution | null {
      const execution = executions.get(executionId);
      if (!execution) return null;

      const completion: StepCompletion = {
        stepId,
        completedAt: new Date().toISOString(),
        durationSeconds,
        automated,
      };

      const updated: WorkflowExecution = {
        ...execution,
        currentStep: execution.currentStep + 1,
        stepCompletions: [...execution.stepCompletions, completion],
      };
      executions.set(executionId, updated);
      return updated;
    },

    completeExecution(executionId: `sha256:${string}`): WorkflowExecution | null {
      const execution = executions.get(executionId);
      if (!execution) return null;

      const updated: WorkflowExecution = {
        ...execution,
        completedAt: new Date().toISOString(),
      };
      executions.set(executionId, updated);
      return updated;
    },

    // Block Management
    blockExecution(
      executionId: `sha256:${string}`,
      reason: BlockReason,
      explanation: string,
      resolution: string,
      nextSteps: readonly string[],
      evidenceRefs: readonly EvidenceRef[]
    ): WorkflowExecution | null {
      const execution = executions.get(executionId);
      if (!execution) return null;

      const blockDetails: BlockDetails = {
        reason,
        explanation,
        evidenceRefs,
        resolution,
        nextSteps,
      };

      const updated: WorkflowExecution = {
        ...execution,
        blocked: true,
        blockReason: reason,
        blockDetails,
      };
      executions.set(executionId, updated);
      return updated;
    },

    unblockExecution(executionId: `sha256:${string}`): WorkflowExecution | null {
      const execution = executions.get(executionId);
      if (!execution) return null;

      const updated: WorkflowExecution = {
        ...execution,
        blocked: false,
        blockReason: undefined,
        blockDetails: undefined,
      };
      executions.set(executionId, updated);
      return updated;
    },

    // "Why Blocked" Explanation
    getWhyBlocked(executionId: `sha256:${string}`): BlockDetails | null {
      const execution = executions.get(executionId);
      if (!execution || !execution.blocked) return null;
      return execution.blockDetails ?? null;
    },

    generateBlockExplanation(reason: BlockReason, context: Record<string, string>): BlockDetails {
      const explanations: Record<
        BlockReason,
        { explanation: string; resolution: string; nextSteps: string[] }
      > = {
        missing_field: {
          explanation: `Required field "${context.fieldName ?? 'unknown'}" is missing`,
          resolution: 'Complete all required fields before proceeding',
          nextSteps: [
            'Review form for missing fields',
            'Fill in highlighted fields',
            'Submit again',
          ],
        },
        validation_failed: {
          explanation: `Validation failed: ${context.validationError ?? 'Unknown error'}`,
          resolution: 'Correct the invalid input and retry',
          nextSteps: ['Review error message', 'Correct the field value', 'Validate input format'],
        },
        pending_approval: {
          explanation: 'This step requires supervisor approval',
          resolution: 'Wait for supervisor to approve or contact them directly',
          nextSteps: [
            'Check approval status',
            'Contact supervisor if urgent',
            'Review approval requirements',
          ],
        },
        insufficient_attestation: {
          explanation: `Attestation coverage is ${context.coverage ?? 'unknown'}%, required ${context.required ?? '80'}%`,
          resolution: 'Complete required attestations before proceeding',
          nextSteps: ['View missing attestations', 'Complete attestation forms', 'Upload evidence'],
        },
        readiness_threshold: {
          explanation: `Service readiness is ${context.current ?? 'unknown'}%, threshold is ${context.threshold ?? '80'}%`,
          resolution: 'Improve service readiness score before enrollment',
          nextSteps: [
            'Review readiness gaps',
            'Complete missing requirements',
            'Re-run readiness check',
          ],
        },
      };

      const template = explanations[reason];
      return {
        reason,
        explanation: template.explanation,
        evidenceRefs: context.evidenceRef ? [context.evidenceRef as EvidenceRef] : [],
        resolution: template.resolution,
        nextSteps: template.nextSteps,
      };
    },

    // Quick Actions
    getQuickAction(id: ActionId): QuickAction | null {
      return quickActions.get(id) ?? null;
    },

    getAllQuickActions(): readonly QuickAction[] {
      return [...quickActions.values()];
    },

    getOneClickActions(): readonly QuickAction[] {
      return [...quickActions.values()].filter(a => a.oneClick);
    },

    executeQuickAction(actionId: ActionId, agencyId: AgencyId): WorkflowExecution | null {
      const action = quickActions.get(actionId);
      if (!action) return null;

      return this.startExecution(action.workflowType, agencyId);
    },

    // Drilldown Paths
    registerDrilldownPath(
      from: string,
      to: string,
      evidenceRef: EvidenceRef,
      clickPath: readonly string[]
    ): void {
      drilldownPaths.push({ from, to, evidenceRef, clickPath });
    },

    getDrilldownPath(from: string, to: string): DrilldownPath | null {
      return drilldownPaths.find(p => p.from === from && p.to === to) ?? null;
    },

    getShortestDrilldownPath(from: string, to: string): readonly string[] | null {
      const path = this.getDrilldownPath(from, to);
      return path?.clickPath ?? null;
    },

    // UX Metrics
    calculateUxMetrics(): UxMetrics {
      const allWorkflows = [...workflows.values()];
      const allExecutions = [...executions.values()];
      const completedExecutions = allExecutions.filter(e => e.completedAt);
      const blockedExecutions = allExecutions.filter(e => e.blocked);

      const avgStepsPerWorkflow =
        allWorkflows.length > 0
          ? allWorkflows.reduce((sum, w) => sum + w.steps.length, 0) / allWorkflows.length
          : 0;

      const avgTimeToComplete =
        completedExecutions.length > 0
          ? completedExecutions.reduce((sum, e) => {
              const start = new Date(e.startedAt).getTime();
              const end = new Date(e.completedAt!).getTime();
              return sum + (end - start) / 1000;
            }, 0) / completedExecutions.length
          : 0;

      const blockRate =
        allExecutions.length > 0 ? (blockedExecutions.length / allExecutions.length) * 100 : 0;

      const blockReasonCounts = new Map<BlockReason, number>();
      for (const exec of blockedExecutions) {
        if (exec.blockReason) {
          blockReasonCounts.set(
            exec.blockReason,
            (blockReasonCounts.get(exec.blockReason) ?? 0) + 1
          );
        }
      }

      const topBlockReasons = [...blockReasonCounts.entries()]
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);

      const automatedStepCount = allExecutions.reduce(
        (sum, e) => sum + e.stepCompletions.filter(s => s.automated).length,
        0
      );
      const totalStepCount = allExecutions.reduce((sum, e) => sum + e.stepCompletions.length, 0);
      const automationRate = totalStepCount > 0 ? (automatedStepCount / totalStepCount) * 100 : 0;

      const oneClickActions = [...quickActions.values()].filter(a => a.oneClick);
      const oneClickUsage = oneClickActions.length;

      const abandonedExecutions = allExecutions.filter(e => !e.completedAt && !e.blocked);
      const abandonmentRate =
        allExecutions.length > 0 ? (abandonedExecutions.length / allExecutions.length) * 100 : 0;

      return {
        generatedAt: new Date().toISOString(),
        avgStepsPerWorkflow: Math.round(avgStepsPerWorkflow * 100) / 100,
        avgTimeToComplete: Math.round(avgTimeToComplete),
        blockRate: Math.round(blockRate * 100) / 100,
        topBlockReasons,
        automationRate: Math.round(automationRate * 100) / 100,
        oneClickActionUsage: oneClickUsage,
        workflowAbandonmentRate: Math.round(abandonmentRate * 100) / 100,
      };
    },

    // Step Reduction Analysis
    analyzeStepReduction(workflowType: WorkflowType): {
      currentSteps: number;
      automatableSteps: number;
      potentialReduction: number;
      recommendations: readonly string[];
    } {
      const workflow = this.getWorkflowByType(workflowType);
      if (!workflow) {
        return {
          currentSteps: 0,
          automatableSteps: 0,
          potentialReduction: 0,
          recommendations: [],
        };
      }

      const automatableSteps = workflow.steps.filter(s => s.automatable).length;
      const potentialReduction = workflow.steps.length - automatableSteps;

      const recommendations: string[] = [];
      if (automatableSteps > 0) {
        recommendations.push(`Automate ${automatableSteps} step(s) to reduce manual effort`);
      }
      if (workflow.steps.some(s => !s.required)) {
        recommendations.push('Make optional steps skippable by default');
      }
      if (workflow.estimatedMinutes > 3) {
        recommendations.push('Consider splitting into smaller workflows');
      }

      return {
        currentSteps: workflow.steps.length,
        automatableSteps,
        potentialReduction,
        recommendations,
      };
    },

    // Time-to-Action Analysis
    calculateTimeToAction(executionId: `sha256:${string}`): number {
      const execution = executions.get(executionId);
      if (!execution) return 0;

      const totalSeconds = execution.stepCompletions.reduce((sum, s) => sum + s.durationSeconds, 0);
      return totalSeconds;
    },

    getActiveExecutions(): readonly WorkflowExecution[] {
      return [...executions.values()].filter(e => !e.completedAt);
    },

    getCompletedExecutions(): readonly WorkflowExecution[] {
      return [...executions.values()].filter(e => e.completedAt);
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXI: Portal UX Friction Contracts', () => {
  let uxService: ReturnType<typeof createMockPortalUxService>;
  const agencyA = 'sha256:agency_alpha' as AgencyId;

  beforeEach(() => {
    uxService = createMockPortalUxService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate workflow IDs with sha256: prefix', () => {
      const workflows = uxService.getAllWorkflows();
      assert.ok(workflows[0].id.startsWith('sha256:'));
    });

    it('should generate step IDs with sha256: prefix', () => {
      const workflows = uxService.getAllWorkflows();
      assert.ok(workflows[0].steps[0].id.startsWith('sha256:'));
    });

    it('should generate execution IDs with sha256: prefix', () => {
      const execution = uxService.startExecution('onboarding', agencyA);
      assert.ok(execution?.id.startsWith('sha256:'));
    });

    it('should generate action IDs with sha256: prefix', () => {
      const actions = uxService.getAllQuickActions();
      assert.ok(actions[0].id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Step Bound Tests
  // ==========================================================================

  describe('Step Bounds', () => {
    it('should have bounded steps for onboarding', () => {
      assert.ok(uxService.isStepCountBounded('onboarding'));
    });

    it('should have bounded steps for exception_request', () => {
      assert.ok(uxService.isStepCountBounded('exception_request'));
    });

    it('should have bounded steps for drill_report', () => {
      assert.ok(uxService.isStepCountBounded('drill_report'));
    });

    it('should have bounded steps for compliance_check', () => {
      assert.ok(uxService.isStepCountBounded('compliance_check'));
    });

    it('should have bounded steps for rollout_enrollment', () => {
      assert.ok(uxService.isStepCountBounded('rollout_enrollment'));
    });

    it('should have max 5 steps for any workflow', () => {
      const workflows = uxService.getAllWorkflows();
      for (const wf of workflows) {
        assert.ok(wf.steps.length <= 5, `${wf.type} has ${wf.steps.length} steps`);
      }
    });
  });

  // ==========================================================================
  // Workflow Execution Tests
  // ==========================================================================

  describe('Workflow Execution', () => {
    it('should start execution', () => {
      const execution = uxService.startExecution('onboarding', agencyA);
      assert.ok(execution);
      assert.strictEqual(execution.currentStep, 1);
    });

    it('should complete steps', () => {
      const execution = uxService.startExecution('onboarding', agencyA);
      if (execution) {
        const workflow = uxService.getWorkflowByType('onboarding');
        if (workflow) {
          const updated = uxService.completeStep(execution.id, workflow.steps[0].id, 45);
          assert.strictEqual(updated?.currentStep, 2);
          assert.strictEqual(updated?.stepCompletions.length, 1);
        }
      }
    });

    it('should track step duration', () => {
      const execution = uxService.startExecution('onboarding', agencyA);
      if (execution) {
        const workflow = uxService.getWorkflowByType('onboarding');
        if (workflow) {
          const updated = uxService.completeStep(execution.id, workflow.steps[0].id, 45);
          assert.strictEqual(updated?.stepCompletions[0].durationSeconds, 45);
        }
      }
    });

    it('should track automated steps', () => {
      const execution = uxService.startExecution('onboarding', agencyA);
      if (execution) {
        const workflow = uxService.getWorkflowByType('onboarding');
        if (workflow) {
          const updated = uxService.completeStep(execution.id, workflow.steps[0].id, 5, true);
          assert.strictEqual(updated?.stepCompletions[0].automated, true);
        }
      }
    });

    it('should complete execution', () => {
      const execution = uxService.startExecution('onboarding', agencyA);
      if (execution) {
        const completed = uxService.completeExecution(execution.id);
        assert.ok(completed?.completedAt);
      }
    });

    it('should get active executions', () => {
      uxService.startExecution('onboarding', agencyA);
      const active = uxService.getActiveExecutions();
      assert.strictEqual(active.length, 1);
    });

    it('should get completed executions', () => {
      const execution = uxService.startExecution('onboarding', agencyA);
      if (execution) {
        uxService.completeExecution(execution.id);
      }
      const completed = uxService.getCompletedExecutions();
      assert.strictEqual(completed.length, 1);
    });
  });

  // ==========================================================================
  // Block Management Tests
  // ==========================================================================

  describe('Block Management', () => {
    it('should block execution', () => {
      const execution = uxService.startExecution('onboarding', agencyA);
      if (execution) {
        const blocked = uxService.blockExecution(
          execution.id,
          'missing_field',
          'Service name is required',
          'Fill in the service name field',
          ['Open form', 'Enter service name'],
          ['sha256:evidence_001' as EvidenceRef]
        );
        assert.strictEqual(blocked?.blocked, true);
      }
    });

    it('should provide block details', () => {
      const execution = uxService.startExecution('onboarding', agencyA);
      if (execution) {
        uxService.blockExecution(
          execution.id,
          'missing_field',
          'Service name is required',
          'Fill in the service name field',
          ['Open form', 'Enter service name'],
          ['sha256:evidence_001' as EvidenceRef]
        );

        const details = uxService.getWhyBlocked(execution.id);
        assert.ok(details);
        assert.strictEqual(details.reason, 'missing_field');
      }
    });

    it('should include evidence refs in block details', () => {
      const execution = uxService.startExecution('onboarding', agencyA);
      if (execution) {
        uxService.blockExecution(
          execution.id,
          'missing_field',
          'Service name is required',
          'Fill in the service name field',
          ['Open form'],
          ['sha256:evidence_001' as EvidenceRef]
        );

        const details = uxService.getWhyBlocked(execution.id);
        assert.ok(details?.evidenceRefs[0].startsWith('sha256:'));
      }
    });

    it('should unblock execution', () => {
      const execution = uxService.startExecution('onboarding', agencyA);
      if (execution) {
        uxService.blockExecution(execution.id, 'missing_field', 'Error', 'Resolution', [], []);
        const unblocked = uxService.unblockExecution(execution.id);
        assert.strictEqual(unblocked?.blocked, false);
      }
    });

    it('should return null for non-blocked execution', () => {
      const execution = uxService.startExecution('onboarding', agencyA);
      if (execution) {
        const details = uxService.getWhyBlocked(execution.id);
        assert.strictEqual(details, null);
      }
    });
  });

  // ==========================================================================
  // "Why Blocked" Explanation Tests
  // ==========================================================================

  describe('Why Blocked Explanations', () => {
    it('should generate deterministic explanation for missing_field', () => {
      const details = uxService.generateBlockExplanation('missing_field', {
        fieldName: 'service_name',
      });
      assert.ok(details.explanation.includes('service_name'));
      assert.ok(details.resolution);
      assert.ok(details.nextSteps.length > 0);
    });

    it('should generate deterministic explanation for validation_failed', () => {
      const details = uxService.generateBlockExplanation('validation_failed', {
        validationError: 'Invalid format',
      });
      assert.ok(details.explanation.includes('Invalid format'));
    });

    it('should generate deterministic explanation for pending_approval', () => {
      const details = uxService.generateBlockExplanation('pending_approval', {});
      assert.ok(details.explanation.includes('supervisor'));
    });

    it('should generate deterministic explanation for insufficient_attestation', () => {
      const details = uxService.generateBlockExplanation('insufficient_attestation', {
        coverage: '60',
        required: '80',
      });
      assert.ok(details.explanation.includes('60%'));
      assert.ok(details.explanation.includes('80%'));
    });

    it('should generate deterministic explanation for readiness_threshold', () => {
      const details = uxService.generateBlockExplanation('readiness_threshold', {
        current: '70',
        threshold: '80',
      });
      assert.ok(details.explanation.includes('70%'));
    });

    it('should include evidence ref when provided', () => {
      const details = uxService.generateBlockExplanation('missing_field', {
        fieldName: 'test',
        evidenceRef: 'sha256:evidence_123',
      });
      assert.ok(details.evidenceRefs.length > 0);
    });
  });

  // ==========================================================================
  // Quick Actions Tests
  // ==========================================================================

  describe('Quick Actions', () => {
    it('should have quick actions', () => {
      const actions = uxService.getAllQuickActions();
      assert.ok(actions.length >= 3);
    });

    it('should have one-click actions', () => {
      const oneClick = uxService.getOneClickActions();
      assert.ok(oneClick.length >= 1);
    });

    it('should execute quick action', () => {
      const actions = uxService.getAllQuickActions();
      const execution = uxService.executeQuickAction(actions[0].id, agencyA);
      assert.ok(execution);
    });

    it('should have prefill fields', () => {
      const actions = uxService.getAllQuickActions();
      assert.ok(actions[0].prefillFields.length > 0);
    });

    it('should have estimated time', () => {
      const actions = uxService.getAllQuickActions();
      assert.ok(actions.every(a => a.estimatedSeconds > 0));
    });
  });

  // ==========================================================================
  // Drilldown Path Tests
  // ==========================================================================

  describe('Drilldown Paths', () => {
    it('should register drilldown path', () => {
      uxService.registerDrilldownPath(
        'compliance_summary',
        'control_detail',
        'sha256:evidence_001' as EvidenceRef,
        ['Click control row', 'View details']
      );

      const path = uxService.getDrilldownPath('compliance_summary', 'control_detail');
      assert.ok(path);
    });

    it('should include evidence ref in drilldown', () => {
      uxService.registerDrilldownPath('summary', 'detail', 'sha256:evidence_002' as EvidenceRef, [
        'Click',
      ]);

      const path = uxService.getDrilldownPath('summary', 'detail');
      assert.ok(path?.evidenceRef.startsWith('sha256:'));
    });

    it('should get shortest click path', () => {
      uxService.registerDrilldownPath(
        'dashboard',
        'control',
        'sha256:evidence_003' as EvidenceRef,
        ['Click agency', 'Click service', 'Click control']
      );

      const clickPath = uxService.getShortestDrilldownPath('dashboard', 'control');
      assert.strictEqual(clickPath?.length, 3);
    });
  });

  // ==========================================================================
  // UX Metrics Tests
  // ==========================================================================

  describe('UX Metrics', () => {
    it('should calculate average steps per workflow', () => {
      const metrics = uxService.calculateUxMetrics();
      assert.ok(metrics.avgStepsPerWorkflow > 0);
      assert.ok(metrics.avgStepsPerWorkflow <= 5);
    });

    it('should calculate average time to complete', () => {
      const execution = uxService.startExecution('compliance_check', agencyA);
      if (execution) {
        const workflow = uxService.getWorkflowByType('compliance_check');
        if (workflow) {
          uxService.completeStep(execution.id, workflow.steps[0].id, 30);
          uxService.completeStep(execution.id, workflow.steps[1].id, 5);
          uxService.completeExecution(execution.id);
        }
      }

      const metrics = uxService.calculateUxMetrics();
      assert.ok(metrics.avgTimeToComplete >= 0);
    });

    it('should calculate block rate', () => {
      const execution = uxService.startExecution('onboarding', agencyA);
      if (execution) {
        uxService.blockExecution(execution.id, 'missing_field', 'Error', 'Fix', [], []);
      }

      const metrics = uxService.calculateUxMetrics();
      assert.strictEqual(metrics.blockRate, 100);
    });

    it('should track top block reasons', () => {
      const e1 = uxService.startExecution('onboarding', agencyA);
      const e2 = uxService.startExecution('exception_request', agencyA);

      if (e1) uxService.blockExecution(e1.id, 'missing_field', 'Error', 'Fix', [], []);
      if (e2) uxService.blockExecution(e2.id, 'missing_field', 'Error', 'Fix', [], []);

      const metrics = uxService.calculateUxMetrics();
      assert.ok(metrics.topBlockReasons.length > 0);
      assert.strictEqual(metrics.topBlockReasons[0].reason, 'missing_field');
    });

    it('should track one-click action usage', () => {
      const metrics = uxService.calculateUxMetrics();
      assert.ok(metrics.oneClickActionUsage >= 1);
    });
  });

  // ==========================================================================
  // Step Reduction Analysis Tests
  // ==========================================================================

  describe('Step Reduction Analysis', () => {
    it('should analyze step reduction potential', () => {
      const analysis = uxService.analyzeStepReduction('onboarding');
      assert.ok(analysis.currentSteps > 0);
      assert.ok(analysis.automatableSteps >= 0);
    });

    it('should provide recommendations', () => {
      const analysis = uxService.analyzeStepReduction('onboarding');
      assert.ok(analysis.recommendations.length > 0);
    });

    it('should identify automatable steps', () => {
      const analysis = uxService.analyzeStepReduction('compliance_check');
      assert.ok(analysis.automatableSteps >= 1);
    });
  });

  // ==========================================================================
  // Time-to-Action Tests
  // ==========================================================================

  describe('Time-to-Action', () => {
    it('should calculate time to action', () => {
      const execution = uxService.startExecution('compliance_check', agencyA);
      if (execution) {
        const workflow = uxService.getWorkflowByType('compliance_check');
        if (workflow) {
          uxService.completeStep(execution.id, workflow.steps[0].id, 30);
          uxService.completeStep(execution.id, workflow.steps[1].id, 10);
        }

        const time = uxService.calculateTimeToAction(execution.id);
        assert.strictEqual(time, 40);
      }
    });

    it('should return zero for new execution', () => {
      const execution = uxService.startExecution('onboarding', agencyA);
      if (execution) {
        const time = uxService.calculateTimeToAction(execution.id);
        assert.strictEqual(time, 0);
      }
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of workflows', () => {
      const w1 = uxService.getAllWorkflows();
      const w2 = uxService.getAllWorkflows();
      assert.ok(w1 !== w2);
    });

    it('should return copies of quick actions', () => {
      const a1 = uxService.getAllQuickActions();
      const a2 = uxService.getAllQuickActions();
      assert.ok(a1 !== a2);
    });

    it('should generate fresh metrics each call', () => {
      const m1 = uxService.calculateUxMetrics();
      const m2 = uxService.calculateUxMetrics();
      assert.ok(m1 !== m2);
    });
  });
});
