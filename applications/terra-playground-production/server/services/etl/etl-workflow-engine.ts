/**
 * ETL Workflow Engine
 *
 * Provides a high-level orchestration layer for ETL pipelines:
 * - Workflow scheduling and dependency management
 * - Pipeline versioning and configuration management
 * - Error handling and retry policies
 * - Workflow monitoring and reporting
 * - Distributed execution support
 */

import { IStorage } from '../../storage';
import { ETLPipeline, PipelineConfig, PipelineResult } from './etl-pipeline';
import { DataLineageTracker } from '../data-quality';
import { logger } from '../../utils/logger';

// Workflow status
export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Workflow configuration
export interface WorkflowConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  pipelines: PipelineConfig[];
  schedule?: {
    type: 'interval' | 'cron';
    value: string; // interval in ms or cron expression
  };
  dependencies?: {
    workflowIds: string[];
    waitForCompletion: boolean;
  };
  notifications?: {
    onStart?: boolean;
    onComplete?: boolean;
    onError?: boolean;
    channels?: string[]; // email, slack, etc.
  };
  options?: {
    timeout?: number; // ms
    continueOnError?: boolean;
    maxRetries?: number;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
  };
}

// Workflow execution record
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: string;
  status: WorkflowStatus;
  pipelineResults: PipelineResult[];
  startTime: Date;
  endTime?: Date;
  executionTime?: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * ETL Workflow Engine implementation
 */
export class ETLWorkflowEngine {
  private workflows: Map<string, WorkflowConfig> = new Map();
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private executionHistory: WorkflowExecution[] = [];
  private scheduledWorkflows: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Create a new ETL Workflow Engine
   * @param storage Storage service
   * @param lineageTracker Data lineage tracker
   */
  constructor(
    private storage: IStorage,
    private lineageTracker?: DataLineageTracker
  ) {}

  /**
   * Register a workflow
   * @param config Workflow configuration
   */
  registerWorkflow(config: WorkflowConfig): void {
    this.workflows.set(config.id, config);

    logger.info(`Registered workflow: ${config.name} (${config.id})`, {
      component: 'ETLWorkflowEngine',
      pipelineCount: config.pipelines.length,
      version: config.version,
    });

    // Schedule workflow if it has a schedule
    if (config.schedule) {
      this.scheduleWorkflow(config);
    }
  }

  /**
   * Unregister a workflow
   * @param workflowId Workflow ID
   */
  unregisterWorkflow(workflowId: string): void {
    this.workflows.delete(workflowId);

    // Cancel any scheduled executions
    if (this.scheduledWorkflows.has(workflowId)) {
      clearTimeout(this.scheduledWorkflows.get(workflowId));
      this.scheduledWorkflows.delete(workflowId);
    }

    logger.info(`Unregistered workflow: ${workflowId}`, {
      component: 'ETLWorkflowEngine',
    });
  }

  /**
   * Schedule a workflow
   * @param config Workflow configuration
   */
  private scheduleWorkflow(config: WorkflowConfig): void {
    if (!config.schedule) return;

    // Cancel any existing scheduled executions
    if (this.scheduledWorkflows.has(config.id)) {
      clearTimeout(this.scheduledWorkflows.get(config.id));
      this.scheduledWorkflows.delete(config.id);
    }

    if (config.schedule.type === 'interval') {
      const interval = parseInt(config.schedule.value);

      const timeoutId = setTimeout(async () => {
        try {
          await this.executeWorkflow(config.id);

          // Reschedule the workflow
          this.scheduleWorkflow(config);
        } catch (error) {
          logger.error(`Error executing scheduled workflow: ${config.id}`, {
            component: 'ETLWorkflowEngine',
            workflowId: config.id,
            error,
          });

          // Reschedule anyway
          this.scheduleWorkflow(config);
        }
      }, interval);

      this.scheduledWorkflows.set(config.id, timeoutId);

      logger.info(`Scheduled workflow: ${config.name} (${config.id}) to run every ${interval}ms`, {
        component: 'ETLWorkflowEngine',
        interval,
      });
    } else if (config.schedule.type === 'cron') {
      // In a real implementation, we would use a cron library
      // For now, we'll log that cron is not implemented
      logger.warn(`Cron scheduling is not implemented yet.`, {
        component: 'ETLWorkflowEngine',
        workflowId: config.id,
      });
    }
  }

  /**
   * Execute a workflow
   * @param workflowId Workflow ID
   * @param metadata Additional metadata
   * @returns Workflow execution
   */
  async executeWorkflow(
    workflowId: string,
    metadata: Record<string, any> = {}
  ): Promise<WorkflowExecution> {
    const config = this.workflows.get(workflowId);

    if (!config) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Check for dependencies
    if (config.dependencies && config.dependencies.workflowIds.length > 0) {
      const missingDeps = await this.checkDependencies(config);

      if (missingDeps.length > 0) {
        throw new Error(`Workflow dependencies not met: ${missingDeps.join(', ')}`);
      }
    }

    // Create execution record
    const executionId = `${workflowId}-${Date.now()}`;
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      workflowVersion: config.version,
      status: WorkflowStatus.PENDING,
      pipelineResults: [],
      startTime: new Date(),
      metadata: {
        ...metadata,
        workflowName: config.name,
        workflowDescription: config.description,
      },
    };

    // Add to active executions
    this.activeExecutions.set(executionId, execution);

    // Send start notification if configured
    if (config.notifications?.onStart) {
      this.sendNotification(
        workflowId,
        executionId,
        'started',
        `Workflow ${config.name} (${workflowId}) started execution at ${execution.startTime.toISOString()}`
      );
    }

    // Update status
    execution.status = WorkflowStatus.RUNNING;

    logger.info(`Starting workflow execution: ${config.name} (${workflowId})`, {
      component: 'ETLWorkflowEngine',
      executionId,
      pipelineCount: config.pipelines.length,
    });

    try {
      // Execute each pipeline in sequence
      for (const pipelineConfig of config.pipelines) {
        logger.info(`Starting pipeline: ${pipelineConfig.name} (${pipelineConfig.id})`, {
          component: 'ETLWorkflowEngine',
          executionId,
          pipelineId: pipelineConfig.id,
        });

        // Create and execute the pipeline
        const pipeline = new ETLPipeline(pipelineConfig, this.storage, this.lineageTracker);
        const result = await pipeline.execute(
          {},
          {
            workflowId,
            executionId,
            ...metadata,
          }
        );

        // Add to pipeline results
        execution.pipelineResults.push(result);

        logger.info(`Completed pipeline: ${pipelineConfig.name} (${pipelineConfig.id})`, {
          component: 'ETLWorkflowEngine',
          executionId,
          pipelineId: pipelineConfig.id,
          success: result.success,
          executionTime: result.executionTime,
        });

        // If pipeline failed and we shouldn't continue on error, break
        if (!result.success && !config.options?.continueOnError) {
          logger.error(`Workflow stopping due to pipeline failure: ${pipelineConfig.id}`, {
            component: 'ETLWorkflowEngine',
            executionId,
            pipelineId: pipelineConfig.id,
          });

          execution.status = WorkflowStatus.FAILED;
          execution.error = `Pipeline ${pipelineConfig.id} failed: ${result.errors.join(', ')}`;
          break;
        }
      }

      // Complete workflow if not failed
      if (execution.status !== WorkflowStatus.FAILED) {
        execution.status = WorkflowStatus.COMPLETED;
      }
    } catch (error) {
      // Handle errors
      logger.error(`Workflow execution error: ${workflowId}`, {
        component: 'ETLWorkflowEngine',
        executionId,
        error,
      });

      execution.status = WorkflowStatus.FAILED;
      execution.error = (error as Error).message;

      // Send error notification if configured
      if (config.notifications?.onError) {
        this.sendNotification(
          workflowId,
          executionId,
          'error',
          `Workflow ${config.name} (${workflowId}) encountered an error: ${execution.error}`
        );
      }
    } finally {
      // Complete the execution
      execution.endTime = new Date();
      execution.executionTime = execution.endTime.getTime() - execution.startTime.getTime();

      // Remove from active executions
      this.activeExecutions.delete(executionId);

      // Add to execution history
      this.executionHistory.push(execution);

      // Send completion notification if configured
      if (config.notifications?.onComplete) {
        this.sendNotification(
          workflowId,
          executionId,
          execution.status === WorkflowStatus.COMPLETED ? 'completed' : 'failed',
          `Workflow ${config.name} (${workflowId}) completed with status ${execution.status} in ${execution.executionTime}ms`
        );
      }

      logger.info(`Completed workflow execution: ${config.name} (${workflowId})`, {
        component: 'ETLWorkflowEngine',
        executionId,
        status: execution.status,
        executionTime: execution.executionTime,
      });
    }

    return execution;
  }

  /**
   * Check workflow dependencies
   * @param config Workflow configuration
   * @returns List of missing dependencies
   */
  private async checkDependencies(config: WorkflowConfig): Promise<string[]> {
    if (!config.dependencies || config.dependencies.workflowIds.length === 0) {
      return [];
    }

    const missingDeps: string[] = [];

    for (const depId of config.dependencies.workflowIds) {
      // Check if the dependency workflow exists
      if (!this.workflows.has(depId)) {
        missingDeps.push(depId);
        continue;
      }

      // If we need to wait for completion, check if any executions completed
      if (config.dependencies.waitForCompletion) {
        const executions = this.getWorkflowExecutions(depId);

        if (
          executions.length === 0 ||
          !executions.some(exec => exec.status === WorkflowStatus.COMPLETED)
        ) {
          missingDeps.push(depId);
        }
      }
    }

    return missingDeps;
  }

  /**
   * Get workflow executions
   * @param workflowId Workflow ID
   * @param limit Maximum number of executions to return
   * @returns Array of workflow executions
   */
  getWorkflowExecutions(workflowId: string, limit: number = 100): WorkflowExecution[] {
    return this.executionHistory
      .filter(exec => exec.workflowId === workflowId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * Get execution by ID
   * @param executionId Execution ID
   * @returns Workflow execution
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    // Check active executions first
    const activeExecution = this.activeExecutions.get(executionId);

    if (activeExecution) {
      return activeExecution;
    }

    // Check execution history
    return this.executionHistory.find(exec => exec.id === executionId);
  }

  /**
   * Get all workflow configurations
   * @returns Array of workflow configurations
   */
  getWorkflows(): WorkflowConfig[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get workflow by ID
   * @param workflowId Workflow ID
   * @returns Workflow configuration
   */
  getWorkflow(workflowId: string): WorkflowConfig | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Send notification
   * @param workflowId Workflow ID
   * @param executionId Execution ID
   * @param type Notification type
   * @param message Notification message
   */
  private sendNotification(
    workflowId: string,
    executionId: string,
    type: 'started' | 'completed' | 'error',
    message: string
  ): void {
    // In a real implementation, this would send notifications to configured channels
    logger.info(`Workflow notification (${type}): ${message}`, {
      component: 'ETLWorkflowEngine',
      workflowId,
      executionId,
      notificationType: type,
    });
  }
}
