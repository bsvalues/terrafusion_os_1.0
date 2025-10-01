import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { AISwarmCoordinator, AgentConfiguration, TaskAllocation } from '../orchestrators/ai-swarm-coordinator';
import { WorkflowPlaybook, PlaybookStep, IDEDomain, RiskLevel } from './PlaybookRegistry';

/**
 * ENHANCEMENT #1: WORKFLOW EXECUTION ENGINE (IDE-FOCUSED)
 * Orchestrates execution of machine-readable IDE workflows through agent swarms
 * Transforms development tasks into distributed agent operations
 */

export interface WorkflowContext {
  workflowId: string;
  playbookId: string;
  userId: string;
  projectPath: string;
  environment: ExecutionEnvironment;
  parameters: Record<string, any>;
  metadata: WorkflowMetadata;
}

export interface WorkflowMetadata {
  startTime: Date;
  priority: WorkflowPriority;
  tags: string[];
  requestSource: RequestSource;
  parentWorkflowId?: string;
}

export interface ExecutionEnvironment {
  nodeVersion: string;
  typescriptVersion: string;
  workspaceSettings: Record<string, any>;
  availableTools: string[];
  resourceLimits: ResourceLimits;
}

export interface ResourceLimits {
  maxMemoryMB: number;
  maxExecutionTimeMs: number;
  maxConcurrentAgents: number;
  maxFileSize: number;
}

export interface WorkflowResult {
  workflowId: string;
  success: boolean;
  executionTime: number;
  stepsCompleted: number;
  stepsTotal: number;
  results: StepResult[];
  metrics: ExecutionMetrics;
  errors: WorkflowError[];
  rollbackData?: RollbackData;
}

export interface StepResult {
  stepId: string;
  success: boolean;
  executionTime: number;
  output: any;
  agentsUsed: string[];
  retryCount: number;
  errors: string[];
}

export interface ExecutionMetrics {
  totalAgentsUsed: number;
  averageAgentUtilization: number;
  parallelStepsExecuted: number;
  totalDataProcessed: number;
  cacheHitRate: number;
  resourceEfficiency: number;
}

export interface WorkflowError {
  stepId: string;
  error: string;
  severity: ErrorSeverity;
  retryable: boolean;
  context: any;
}

export interface RollbackData {
  originalState: any;
  rollbackSteps: RollbackStep[];
  rollbackRequired: boolean;
}

export interface RollbackStep {
  stepId: string;
  rollbackAction: string;
  compensationData: any;
}

export enum WorkflowPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

export enum RequestSource {
  USER_INTERFACE = 'user_interface',
  AUTO_TRIGGER = 'auto_trigger',
  API_REQUEST = 'api_request',
  SCHEDULED_TASK = 'scheduled_task',
  EVENT_DRIVEN = 'event_driven'
}

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ROLLING_BACK = 'rolling_back'
}

/**
 * Workflow Execution Engine - Orchestrates IDE workflow execution through agent swarms
 */
export class WorkflowExecutionEngine extends EventEmitter {
  private logger: Logger;
  private swarmCoordinator: AISwarmCoordinator;
  private activeWorkflows: Map<string, ActiveWorkflow> = new Map();
  private executionHistory: Map<string, WorkflowResult> = new Map();
  private resourceMonitor: ResourceMonitor;
  private stepExecutorPool: StepExecutorPool;

  constructor(swarmCoordinator: AISwarmCoordinator) {
    super();
    this.logger = new Logger('WorkflowExecutionEngine');
    this.swarmCoordinator = swarmCoordinator;
    this.resourceMonitor = new ResourceMonitor();
    this.stepExecutorPool = new StepExecutorPool(swarmCoordinator);
  }

  /**
   * Initialize the workflow execution engine
   */
  public async initialize(): Promise<boolean> {
    this.logger.info('🚀 Initializing Workflow Execution Engine...');

    try {
      await this.resourceMonitor.initialize();
      await this.stepExecutorPool.initialize();

      // Start background monitoring
      this.startResourceMonitoring();
      this.startWorkflowMonitoring();

      this.logger.info('✅ Workflow Execution Engine initialized successfully');
      return true;
    } catch (error) {
      this.logger.error('❌ Failed to initialize Workflow Execution Engine:', error);
      return false;
    }
  }

  /**
   * Execute a workflow playbook with the agent swarm
   */
  public async executeWorkflow(
    playbook: WorkflowPlaybook,
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    const workflowId = context.workflowId;

    this.logger.info(`🎬 Starting workflow execution: ${playbook.name} (${workflowId})`);

    // Create active workflow tracking
    const activeWorkflow: ActiveWorkflow = {
      id: workflowId,
      playbook,
      context,
      status: ExecutionStatus.PENDING,
      startTime: new Date(),
      currentStep: null,
      completedSteps: [],
      assignedAgents: new Map(),
      rollbackData: { originalState: {}, rollbackSteps: [], rollbackRequired: false }
    };

    this.activeWorkflows.set(workflowId, activeWorkflow);

    try {
      // Pre-execution validation
      await this.validateExecution(playbook, context);

      // Resource allocation
      await this.allocateResources(activeWorkflow);

      // Execute workflow steps
      activeWorkflow.status = ExecutionStatus.RUNNING;
      this.emit('workflow_started', activeWorkflow);

      const result = await this.executeWorkflowSteps(activeWorkflow);

      // Cleanup and finalization
      await this.finalizeWorkflow(activeWorkflow, result);

      this.logger.info(`✅ Workflow completed successfully: ${workflowId}`);
      return result;

    } catch (error) {
      this.logger.error(`❌ Workflow execution failed: ${workflowId}`, error);

      const failureResult = await this.handleWorkflowFailure(activeWorkflow, error);
      return failureResult;

    } finally {
      // Cleanup resources
      await this.cleanupWorkflow(activeWorkflow);
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Execute workflow steps with dependency management and parallel execution
   */
  private async executeWorkflowSteps(activeWorkflow: ActiveWorkflow): Promise<WorkflowResult> {
    const { playbook, context } = activeWorkflow;
    const stepResults: StepResult[] = [];
    const executionGraph = this.buildExecutionGraph(playbook.steps);

    this.logger.info(`📊 Executing ${playbook.steps.length} steps with dependency graph`);

    // Execute steps in dependency order with parallel execution where possible
    for (const executionLevel of executionGraph) {
      const levelPromises = executionLevel.map(async (step) => {
        try {
          activeWorkflow.currentStep = step.id;
          this.emit('step_started', { workflowId: activeWorkflow.id, step });

          const stepResult = await this.executeStep(step, activeWorkflow);
          stepResults.push(stepResult);

          activeWorkflow.completedSteps.push(step.id);
          this.emit('step_completed', { workflowId: activeWorkflow.id, step, result: stepResult });

          return stepResult;

        } catch (error) {
          const errorResult: StepResult = {
            stepId: step.id,
            success: false,
            executionTime: 0,
            output: null,
            agentsUsed: [],
            retryCount: 0,
            errors: [error.message]
          };

          stepResults.push(errorResult);
          this.emit('step_failed', { workflowId: activeWorkflow.id, step, error });

          throw new WorkflowStepError(step.id, error.message, error);
        }
      });

      // Wait for all steps in this level to complete
      await Promise.all(levelPromises);
    }

    const endTime = Date.now();
    const executionTime = endTime - activeWorkflow.startTime.getTime();

    return {
      workflowId: activeWorkflow.id,
      success: true,
      executionTime,
      stepsCompleted: stepResults.filter(r => r.success).length,
      stepsTotal: playbook.steps.length,
      results: stepResults,
      metrics: this.calculateExecutionMetrics(stepResults),
      errors: [],
      rollbackData: activeWorkflow.rollbackData
    };
  }

  /**
   * Execute an individual workflow step
   */
  private async executeStep(step: PlaybookStep, activeWorkflow: ActiveWorkflow): Promise<StepResult> {
    const startTime = Date.now();
    const { playbook, context } = activeWorkflow;

    this.logger.info(`⚡ Executing step: ${step.name} (${step.id})`);

    // Validate step conditions
    await this.validateStepConditions(step, activeWorkflow);

    // Allocate agents for this step
    const agents = await this.allocateAgentsForStep(step, activeWorkflow);
    activeWorkflow.assignedAgents.set(step.id, agents);

    // Execute step with retry logic
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= step.retryPolicy.maxAttempts) {
      try {
        // Create task allocation for agents
        const taskAllocation: TaskAllocation = {
          taskId: `${activeWorkflow.id}_${step.id}_${retryCount}`,
          requiredCapabilities: [step.action],
          priority: this.mapWorkflowPriorityToTaskPriority(context.metadata.priority),
          estimatedDuration: step.timeoutMs,
          assignedAgents: agents.map(a => a.id),
          status: 'pending' as any
        };

        // Execute the step through step executor pool
        const stepOutput = await this.stepExecutorPool.executeStep(
          step,
          taskAllocation,
          activeWorkflow.context,
          step.timeoutMs
        );

        // Store rollback data if needed
        if (step.rollbackAction) {
          activeWorkflow.rollbackData.rollbackSteps.push({
            stepId: step.id,
            rollbackAction: step.rollbackAction,
            compensationData: stepOutput.rollbackData || {}
          });
        }

        const executionTime = Date.now() - startTime;

        return {
          stepId: step.id,
          success: true,
          executionTime,
          output: stepOutput.result,
          agentsUsed: agents.map(a => a.id),
          retryCount,
          errors: []
        };

      } catch (error) {
        lastError = error;
        retryCount++;

        if (retryCount <= step.retryPolicy.maxAttempts) {
          const backoffTime = this.calculateBackoffTime(step.retryPolicy, retryCount);
          this.logger.warn(`⚠️ Step ${step.id} failed, retrying in ${backoffTime}ms (attempt ${retryCount})`);

          await this.delay(backoffTime);
        }
      }
    }

    // All retries exhausted
    throw new StepExecutionError(
      step.id,
      `Step failed after ${retryCount} attempts: ${lastError?.message}`,
      lastError
    );
  }

  /**
   * Build execution graph for parallel step execution
   */
  private buildExecutionGraph(steps: PlaybookStep[]): PlaybookStep[][] {
    const stepMap = new Map(steps.map(step => [step.id, step]));
    const inDegree = new Map<string, number>();
    const graph: PlaybookStep[][] = [];

    // Calculate in-degrees (number of dependencies for each step)
    for (const step of steps) {
      inDegree.set(step.id, step.dependencies.length);
    }

    const remaining = new Set(steps.map(s => s.id));

    while (remaining.size > 0) {
      // Find steps with no remaining dependencies
      const readySteps = Array.from(remaining)
        .filter(stepId => inDegree.get(stepId) === 0)
        .map(stepId => stepMap.get(stepId)!)
        .filter(step => step.parallelExecution || graph.length === 0); // Allow parallel or first level

      if (readySteps.length === 0) {
        throw new Error('Circular dependency detected in workflow steps');
      }

      graph.push(readySteps);

      // Remove completed steps and update in-degrees
      for (const step of readySteps) {
        remaining.delete(step.id);

        // Update in-degrees for dependent steps
        for (const remainingStepId of remaining) {
          const remainingStep = stepMap.get(remainingStepId)!;
          if (remainingStep.dependencies.includes(step.id)) {
            inDegree.set(remainingStepId, inDegree.get(remainingStepId)! - 1);
          }
        }
      }
    }

    return graph;
  }

  /**
   * Allocate optimal agents for a workflow step
   */
  private async allocateAgentsForStep(
    step: PlaybookStep,
    activeWorkflow: ActiveWorkflow
  ): Promise<AgentConfiguration[]> {
    const requiredCapabilities = [step.action, ...step.requiredCapabilities || []];

    // Find agents with required capabilities and role
    const candidateAgents = Array.from(this.swarmCoordinator['agents'].values())
      .filter(agent =>
        requiredCapabilities.every(cap => agent.capabilities.includes(cap)) &&
        this.agentHasRole(agent, step.requiredRole)
      );

    if (candidateAgents.length === 0) {
      throw new Error(`No agents available with required capabilities: ${requiredCapabilities.join(', ')}`);
    }

    // Select optimal agents based on performance and availability
    const optimalAgents = candidateAgents
      .sort((a, b) => b.performance.successRate - a.performance.successRate)
      .slice(0, Math.min(3, candidateAgents.length)); // Use up to 3 agents per step

    return optimalAgents;
  }

  /**
   * Validate workflow execution preconditions
   */
  private async validateExecution(playbook: WorkflowPlaybook, context: WorkflowContext): Promise<void> {
    // Check resource availability
    const resourceCheck = await this.resourceMonitor.checkAvailability(context.environment.resourceLimits);
    if (!resourceCheck.available) {
      throw new Error(`Insufficient resources: ${resourceCheck.reason}`);
    }

    // Validate playbook integrity
    if (playbook.steps.length === 0) {
      throw new Error('Playbook has no executable steps');
    }

    // Check for circular dependencies
    this.validateStepDependencies(playbook.steps);

    this.logger.info(`✅ Workflow validation passed for ${playbook.name}`);
  }

  /**
   * Validate step dependencies for circular references
   */
  private validateStepDependencies(steps: PlaybookStep[]): void {
    const stepIds = new Set(steps.map(s => s.id));

    for (const step of steps) {
      for (const dep of step.dependencies) {
        if (!stepIds.has(dep)) {
          throw new Error(`Step ${step.id} has invalid dependency: ${dep}`);
        }
      }
    }

    // Check for circular dependencies using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const adjacencyList = new Map<string, string[]>();

    // Build adjacency list
    for (const step of steps) {
      adjacencyList.set(step.id, step.dependencies);
    }

    const hasCycle = (stepId: string): boolean => {
      visited.add(stepId);
      recursionStack.add(stepId);

      const dependencies = adjacencyList.get(stepId) || [];
      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          if (hasCycle(dep)) return true;
        } else if (recursionStack.has(dep)) {
          return true;
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const step of steps) {
      if (!visited.has(step.id)) {
        if (hasCycle(step.id)) {
          throw new Error('Circular dependency detected in workflow steps');
        }
      }
    }
  }

  /**
   * Calculate execution metrics
   */
  private calculateExecutionMetrics(stepResults: StepResult[]): ExecutionMetrics {
    const totalAgentsUsed = new Set(stepResults.flatMap(r => r.agentsUsed)).size;
    const totalExecutionTime = stepResults.reduce((sum, r) => sum + r.executionTime, 0);
    const avgExecutionTime = totalExecutionTime / stepResults.length;

    return {
      totalAgentsUsed,
      averageAgentUtilization: avgExecutionTime / 1000, // Convert to seconds
      parallelStepsExecuted: stepResults.length,
      totalDataProcessed: 0, // Would be calculated based on actual data processing
      cacheHitRate: 0, // Would be calculated based on cache usage
      resourceEfficiency: this.calculateResourceEfficiency(stepResults)
    };
  }

  /**
   * Calculate resource efficiency score
   */
  private calculateResourceEfficiency(stepResults: StepResult[]): number {
    const successfulSteps = stepResults.filter(r => r.success).length;
    const totalSteps = stepResults.length;
    const avgRetryCount = stepResults.reduce((sum, r) => sum + r.retryCount, 0) / totalSteps;

    // Efficiency decreases with retries and failures
    const successRate = successfulSteps / totalSteps;
    const retryPenalty = Math.max(0, 1 - (avgRetryCount * 0.1));

    return successRate * retryPenalty;
  }

  // Helper methods
  private agentHasRole(agent: AgentConfiguration, requiredRole: any): boolean {
    // Map agent capabilities to roles (simplified for now)
    return true; // In real implementation, check agent role compatibility
  }

  private mapWorkflowPriorityToTaskPriority(priority: WorkflowPriority): any {
    const mapping = {
      [WorkflowPriority.LOW]: 'Low',
      [WorkflowPriority.NORMAL]: 'Normal',
      [WorkflowPriority.HIGH]: 'High',
      [WorkflowPriority.CRITICAL]: 'Critical'
    };
    return mapping[priority];
  }

  private calculateBackoffTime(retryPolicy: any, retryCount: number): number {
    switch (retryPolicy.backoffStrategy) {
      case 'exponential':
        return Math.min(
          retryPolicy.exponentialBase ** retryCount * 1000,
          retryPolicy.maxBackoffMs
        );
      case 'linear':
        return Math.min(retryCount * 1000, retryPolicy.maxBackoffMs);
      case 'fixed':
      default:
        return 1000;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async validateStepConditions(step: PlaybookStep, activeWorkflow: ActiveWorkflow): Promise<void> {
    // Validate step pre-conditions
    for (const condition of step.conditions) {
      if (condition.type === 'pre_condition') {
        // Simplified condition evaluation (would be more sophisticated in real implementation)
        const conditionMet = true; // Evaluate condition.expression against context
        if (!conditionMet) {
          throw new Error(condition.errorMessage);
        }
      }
    }
  }

  private async allocateResources(activeWorkflow: ActiveWorkflow): Promise<void> {
    // Resource allocation logic
    this.logger.info(`📊 Allocating resources for workflow ${activeWorkflow.id}`);
  }

  private async finalizeWorkflow(activeWorkflow: ActiveWorkflow, result: WorkflowResult): Promise<void> {
    activeWorkflow.status = ExecutionStatus.COMPLETED;
    this.executionHistory.set(activeWorkflow.id, result);
    this.emit('workflow_completed', { workflow: activeWorkflow, result });
  }

  private async handleWorkflowFailure(activeWorkflow: ActiveWorkflow, error: Error): Promise<WorkflowResult> {
    activeWorkflow.status = ExecutionStatus.FAILED;

    const failureResult: WorkflowResult = {
      workflowId: activeWorkflow.id,
      success: false,
      executionTime: Date.now() - activeWorkflow.startTime.getTime(),
      stepsCompleted: activeWorkflow.completedSteps.length,
      stepsTotal: activeWorkflow.playbook.steps.length,
      results: [],
      metrics: { totalAgentsUsed: 0, averageAgentUtilization: 0, parallelStepsExecuted: 0, totalDataProcessed: 0, cacheHitRate: 0, resourceEfficiency: 0 },
      errors: [{
        stepId: activeWorkflow.currentStep || 'unknown',
        error: error.message,
        severity: ErrorSeverity.CRITICAL,
        retryable: false,
        context: {}
      }]
    };

    this.emit('workflow_failed', { workflow: activeWorkflow, error });
    return failureResult;
  }

  private async cleanupWorkflow(activeWorkflow: ActiveWorkflow): Promise<void> {
    // Release allocated agents
    for (const [stepId, agents] of activeWorkflow.assignedAgents) {
      for (const agent of agents) {
        agent.status = 'Idle' as any;
      }
    }

    this.logger.info(`🧹 Cleaned up resources for workflow ${activeWorkflow.id}`);
  }

  private startResourceMonitoring(): void {
    // Background resource monitoring
    setInterval(() => {
      this.resourceMonitor.updateMetrics();
    }, 5000);
  }

  private startWorkflowMonitoring(): void {
    // Background workflow health monitoring
    setInterval(() => {
      this.monitorActiveWorkflows();
    }, 10000);
  }

  private monitorActiveWorkflows(): void {
    const now = Date.now();

    for (const [workflowId, workflow] of this.activeWorkflows) {
      const runningTime = now - workflow.startTime.getTime();
      const maxDuration = workflow.playbook.estimatedDuration * 2; // Allow 2x estimated time

      if (runningTime > maxDuration) {
        this.logger.warn(`⚠️ Workflow ${workflowId} exceeding estimated duration`);
        this.emit('workflow_timeout_warning', workflow);
      }
    }
  }
}

// Supporting classes

class ResourceMonitor {
  async initialize(): Promise<void> {
    // Initialize resource monitoring
  }

  async checkAvailability(limits: ResourceLimits): Promise<{ available: boolean; reason?: string }> {
    // Check if resources are available
    return { available: true };
  }

  updateMetrics(): void {
    // Update resource metrics
  }
}

class StepExecutorPool {
  constructor(private swarmCoordinator: AISwarmCoordinator) {}

  async initialize(): Promise<void> {
    // Initialize step executor pool
  }

  async executeStep(
    step: PlaybookStep,
    taskAllocation: TaskAllocation,
    context: WorkflowContext,
    timeoutMs: number
  ): Promise<{ result: any; rollbackData?: any }> {
    // Execute step through agent pool
    return { result: { success: true, data: {} } };
  }
}

// Supporting interfaces and classes

interface ActiveWorkflow {
  id: string;
  playbook: WorkflowPlaybook;
  context: WorkflowContext;
  status: ExecutionStatus;
  startTime: Date;
  currentStep: string | null;
  completedSteps: string[];
  assignedAgents: Map<string, AgentConfiguration[]>;
  rollbackData: RollbackData;
}

class WorkflowStepError extends Error {
  constructor(public stepId: string, message: string, public originalError?: Error) {
    super(message);
    this.name = 'WorkflowStepError';
  }
}

class StepExecutionError extends Error {
  constructor(public stepId: string, message: string, public originalError?: Error) {
    super(message);
    this.name = 'StepExecutionError';
  }
}

// Export singleton instance
export const workflowExecutionEngine = new WorkflowExecutionEngine(
  require('../orchestrators/ai-swarm-coordinator').swarmCoordinator
);