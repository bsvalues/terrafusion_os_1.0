/**
 * ETL Pipeline Service
 *
 * Provides a comprehensive framework for building extract, transform, load (ETL) pipelines:
 * - Modular pipeline stages with clear interfaces
 * - Support for parallel and sequential processing
 * - Robust error handling and recovery
 * - Pipeline monitoring and metrics
 * - Integration with data lineage tracking
 */

import { IStorage } from '../../storage';
import { DataLineageTracker, ChangeSourceType, ChangeOperationType } from '../data-quality';
import { logger } from '../../utils/logger';

// Pipeline stage types
export enum PipelineStageType {
  EXTRACT = 'extract',
  TRANSFORM = 'transform',
  LOAD = 'load',
  VALIDATE = 'validate',
  ENRICH = 'enrich',
  FILTER = 'filter',
  AGGREGATE = 'aggregate',
  MAP = 'map',
}

// Pipeline stage configuration
export interface PipelineStageConfig {
  id: string;
  type: PipelineStageType;
  description: string;
  enabled: boolean;
  options?: Record<string, any>;
  dependsOn?: string[];
  retryConfig?: {
    maxRetries: number;
    initialDelay: number;
    backoffFactor: number;
  };
}

// Data context for pipeline processing
export interface DataContext {
  inputData: any;
  outputData: any;
  metadata: Record<string, any>;
  stats: Record<string, any>;
  errors: Error[];
  warnings: string[];
  startTime: Date;
  endTime?: Date;
}

// Stage execution function signature
export type StageExecutor = (context: DataContext) => Promise<DataContext>;

// Pipeline stage implementation
export interface PipelineStage {
  config: PipelineStageConfig;
  execute: StageExecutor;
}

// Pipeline configuration
export interface PipelineConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  stages: PipelineStageConfig[];
  options?: {
    continueOnStageError?: boolean;
    maxParallelStages?: number;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    timeoutSeconds?: number;
    trackLineage?: boolean;
  };
}

// Pipeline execution result
export interface PipelineResult {
  pipelineId: string;
  success: boolean;
  executionTime: number; // milliseconds
  stageResults: {
    stageId: string;
    success: boolean;
    executionTime: number;
    errors: string[];
    warnings: string[];
    recordsProcessed?: number;
  }[];
  errors: string[];
  warnings: string[];
  metadata: Record<string, any>;
  startTime: Date;
  endTime: Date;
}

/**
 * ETL Pipeline Service implementation
 */
export class ETLPipeline {
  private stages: Map<string, PipelineStage> = new Map();
  private stageExecutors: Map<
    PipelineStageType,
    (config: PipelineStageConfig, storage: IStorage) => StageExecutor
  > = new Map();

  /**
   * Create a new ETL Pipeline
   * @param config Pipeline configuration
   * @param storage Storage service
   * @param lineageTracker Data lineage tracker
   */
  constructor(
    private config: PipelineConfig,
    private storage: IStorage,
    private lineageTracker?: DataLineageTracker
  ) {
    // Initialize the pipeline
    this.initialize();
  }

  /**
   * Initialize the pipeline
   */
  private initialize(): void {
    // Register default stage executors
    this.registerDefaultStageExecutors();

    // Create stage instances
    this.createStages();

    logger.info(`Initialized pipeline '${this.config.name}' (${this.config.id})`, {
      component: 'ETLPipeline',
      version: this.config.version,
      stageCount: this.config.stages.length,
    });
  }

  /**
   * Register default stage executors
   */
  private registerDefaultStageExecutors(): void {
    // Extract stage executor factory
    this.stageExecutors.set(PipelineStageType.EXTRACT, (config, storage) => {
      return async (context: DataContext): Promise<DataContext> => {
        logger.debug(`Executing extract stage: ${config.id}`, {
          component: 'ETLPipeline',
          stageId: config.id,
        });

        // Implementation would depend on the source type
        // This is a placeholder that would be overridden with actual implementation
        const extractedData = {}; // Placeholder

        context.outputData = extractedData;
        context.stats.recordsExtracted = 0;

        return context;
      };
    });

    // Transform stage executor factory
    this.stageExecutors.set(PipelineStageType.TRANSFORM, (config, storage) => {
      return async (context: DataContext): Promise<DataContext> => {
        logger.debug(`Executing transform stage: ${config.id}`, {
          component: 'ETLPipeline',
          stageId: config.id,
        });

        // Implementation would apply transformations to inputData
        // This is a placeholder that would be overridden with actual implementation
        const transformedData = context.inputData; // Placeholder

        context.outputData = transformedData;
        context.stats.recordsTransformed = 0;

        return context;
      };
    });

    // Load stage executor factory
    this.stageExecutors.set(PipelineStageType.LOAD, (config, storage) => {
      return async (context: DataContext): Promise<DataContext> => {
        logger.debug(`Executing load stage: ${config.id}`, {
          component: 'ETLPipeline',
          stageId: config.id,
        });

        // Implementation would load data into the target
        // This is a placeholder that would be overridden with actual implementation

        context.stats.recordsLoaded = 0;

        return context;
      };
    });

    // Validate stage executor factory
    this.stageExecutors.set(PipelineStageType.VALIDATE, (config, storage) => {
      return async (context: DataContext): Promise<DataContext> => {
        logger.debug(`Executing validate stage: ${config.id}`, {
          component: 'ETLPipeline',
          stageId: config.id,
        });

        // Implementation would validate the data
        // This is a placeholder that would be overridden with actual implementation

        context.stats.recordsValidated = 0;
        context.stats.recordsRejected = 0;

        return context;
      };
    });

    // Filter stage executor factory
    this.stageExecutors.set(PipelineStageType.FILTER, (config, storage) => {
      return async (context: DataContext): Promise<DataContext> => {
        logger.debug(`Executing filter stage: ${config.id}`, {
          component: 'ETLPipeline',
          stageId: config.id,
        });

        // Implementation would filter the data based on criteria
        // This is a placeholder that would be overridden with actual implementation

        context.stats.recordsFiltered = 0;

        return context;
      };
    });

    // Enrich stage executor factory
    this.stageExecutors.set(PipelineStageType.ENRICH, (config, storage) => {
      return async (context: DataContext): Promise<DataContext> => {
        logger.debug(`Executing enrich stage: ${config.id}`, {
          component: 'ETLPipeline',
          stageId: config.id,
        });

        // Implementation would enrich the data with additional information
        // This is a placeholder that would be overridden with actual implementation

        context.stats.recordsEnriched = 0;

        return context;
      };
    });

    // Aggregate stage executor factory
    this.stageExecutors.set(PipelineStageType.AGGREGATE, (config, storage) => {
      return async (context: DataContext): Promise<DataContext> => {
        logger.debug(`Executing aggregate stage: ${config.id}`, {
          component: 'ETLPipeline',
          stageId: config.id,
        });

        // Implementation would aggregate the data
        // This is a placeholder that would be overridden with actual implementation

        context.stats.recordsAggregated = 0;

        return context;
      };
    });

    // Map stage executor factory
    this.stageExecutors.set(PipelineStageType.MAP, (config, storage) => {
      return async (context: DataContext): Promise<DataContext> => {
        logger.debug(`Executing map stage: ${config.id}`, {
          component: 'ETLPipeline',
          stageId: config.id,
        });

        // Implementation would map fields from one schema to another
        // This is a placeholder that would be overridden with actual implementation

        context.stats.recordsMapped = 0;

        return context;
      };
    });
  }

  /**
   * Create pipeline stages
   */
  private createStages(): void {
    for (const stageConfig of this.config.stages) {
      if (!stageConfig.enabled) {
        logger.debug(`Skipping disabled stage: ${stageConfig.id}`, {
          component: 'ETLPipeline',
          stageId: stageConfig.id,
        });
        continue;
      }

      const executorFactory = this.stageExecutors.get(stageConfig.type);

      if (!executorFactory) {
        logger.warn(`No executor factory found for stage type: ${stageConfig.type}`, {
          component: 'ETLPipeline',
          stageId: stageConfig.id,
        });
        continue;
      }

      const executor = executorFactory(stageConfig, this.storage);

      // Create stage with retry wrapper
      const stage: PipelineStage = {
        config: stageConfig,
        execute: this.createRetryWrapper(executor, stageConfig),
      };

      this.stages.set(stageConfig.id, stage);

      logger.debug(`Created stage: ${stageConfig.id} (${stageConfig.type})`, {
        component: 'ETLPipeline',
        stageId: stageConfig.id,
        stageType: stageConfig.type,
      });
    }
  }

  /**
   * Create retry wrapper for stage executor
   * @param executor Stage executor
   * @param config Stage configuration
   * @returns Wrapped executor with retry
   */
  private createRetryWrapper(executor: StageExecutor, config: PipelineStageConfig): StageExecutor {
    return async (context: DataContext): Promise<DataContext> => {
      const retryConfig = config.retryConfig || {
        maxRetries: 3,
        initialDelay: 1000,
        backoffFactor: 2,
      };

      let lastError: Error | undefined;

      for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
        try {
          // If not the first attempt, log retry
          if (attempt > 0) {
            logger.info(
              `Retrying stage ${config.id} (attempt ${attempt}/${retryConfig.maxRetries})`,
              {
                component: 'ETLPipeline',
                stageId: config.id,
                attempt,
                maxRetries: retryConfig.maxRetries,
              }
            );
          }

          return await executor(context);
        } catch (error) {
          lastError = error as Error;

          logger.warn(`Stage ${config.id} failed execution`, {
            component: 'ETLPipeline',
            stageId: config.id,
            attempt,
            error: lastError.message,
          });

          // If this is not the last attempt, wait before retrying
          if (attempt < retryConfig.maxRetries) {
            const delay = retryConfig.initialDelay * Math.pow(retryConfig.backoffFactor, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // If we get here, all retries failed
      logger.error(`Stage ${config.id} failed after ${retryConfig.maxRetries} retries`, {
        component: 'ETLPipeline',
        stageId: config.id,
        error: lastError?.message,
      });

      // Add error to context
      if (lastError) {
        context.errors.push(lastError);
      }

      // Return context with error
      return context;
    };
  }

  /**
   * Register a custom stage executor
   * @param type Stage type
   * @param executorFactory Stage executor factory
   */
  registerStageExecutor(
    type: PipelineStageType | string,
    executorFactory: (config: PipelineStageConfig, storage: IStorage) => StageExecutor
  ): void {
    this.stageExecutors.set(type as PipelineStageType, executorFactory);

    logger.info(`Registered custom stage executor for type: ${type}`, {
      component: 'ETLPipeline',
    });
  }

  /**
   * Execute the pipeline
   * @param inputData Input data
   * @param metadata Additional metadata
   * @returns Pipeline result
   */
  async execute(inputData: any = {}, metadata: Record<string, any> = {}): Promise<PipelineResult> {
    const startTime = new Date();
    logger.info(`Starting pipeline execution: ${this.config.name} (${this.config.id})`, {
      component: 'ETLPipeline',
      pipelineId: this.config.id,
    });

    // Create initial data context
    const context: DataContext = {
      inputData,
      outputData: {},
      metadata: {
        ...metadata,
        pipelineId: this.config.id,
        pipelineName: this.config.name,
        pipelineVersion: this.config.version,
      },
      stats: {},
      errors: [],
      warnings: [],
      startTime,
    };

    // Track stage results
    const stageResults: PipelineResult['stageResults'] = [];

    // Determine execution order based on dependencies
    const executionOrder = this.determineExecutionOrder();

    // Execute stages
    let success = true;

    for (const stage of executionOrder) {
      const stageInstance = this.stages.get(stage.id);

      if (!stageInstance) {
        logger.warn(`Stage not found: ${stage.id}`, {
          component: 'ETLPipeline',
          stageId: stage.id,
        });
        continue;
      }

      const stageStartTime = Date.now();
      logger.info(`Executing pipeline stage: ${stage.id} (${stage.type})`, {
        component: 'ETLPipeline',
        stageId: stage.id,
        stageType: stage.type,
      });

      try {
        // Execute the stage
        const updatedContext = await stageInstance.execute(context);

        // Update context for next stage
        context.inputData = updatedContext.outputData;
        context.outputData = {};
        context.errors = updatedContext.errors;
        context.warnings = updatedContext.warnings;
        context.stats = {
          ...context.stats,
          ...updatedContext.stats,
        };

        const stageEndTime = Date.now();
        const stageExecutionTime = stageEndTime - stageStartTime;

        // Record stage result
        stageResults.push({
          stageId: stage.id,
          success: updatedContext.errors.length === 0,
          executionTime: stageExecutionTime,
          errors: updatedContext.errors.map(e => e.message),
          warnings: updatedContext.warnings,
          recordsProcessed: updatedContext.stats.recordsProcessed || 0,
        });

        // Check if we should continue on error
        if (updatedContext.errors.length > 0) {
          logger.warn(`Stage ${stage.id} completed with errors`, {
            component: 'ETLPipeline',
            stageId: stage.id,
            errorCount: updatedContext.errors.length,
          });

          success = false;

          if (!this.config.options?.continueOnStageError) {
            logger.error(`Pipeline execution stopping due to stage errors`, {
              component: 'ETLPipeline',
              pipelineId: this.config.id,
              stageId: stage.id,
            });
            break;
          }
        }

        logger.info(`Completed pipeline stage: ${stage.id}`, {
          component: 'ETLPipeline',
          stageId: stage.id,
          executionTime: stageExecutionTime,
        });
      } catch (error) {
        const stageEndTime = Date.now();
        const stageExecutionTime = stageEndTime - stageStartTime;

        logger.error(`Stage ${stage.id} execution error`, {
          component: 'ETLPipeline',
          stageId: stage.id,
          error,
        });

        // Record stage result
        stageResults.push({
          stageId: stage.id,
          success: false,
          executionTime: stageExecutionTime,
          errors: [(error as Error).message],
          warnings: [],
          recordsProcessed: 0,
        });

        success = false;

        // Add error to context
        context.errors.push(error as Error);

        // Check if we should continue on error
        if (!this.config.options?.continueOnStageError) {
          logger.error(`Pipeline execution stopping due to stage error`, {
            component: 'ETLPipeline',
            pipelineId: this.config.id,
            stageId: stage.id,
          });
          break;
        }
      }
    }

    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();

    // Track data lineage if configured
    if (this.config.options?.trackLineage && this.lineageTracker && success) {
      try {
        await this.lineageTracker.trackChanges(
          'etl_pipeline',
          this.config.id,
          { status: 'pending' },
          {
            status: success ? 'completed' : 'failed',
            resultsMetadata: context.metadata,
            stats: context.stats,
          },
          ChangeSourceType.ETL,
          this.config.id,
          ChangeOperationType.TRANSFORM,
          {
            pipelineName: this.config.name,
            executionTime,
            success,
          }
        );
      } catch (error) {
        logger.error(`Error tracking pipeline lineage`, {
          component: 'ETLPipeline',
          pipelineId: this.config.id,
          error,
        });
      }
    }

    logger.info(`Completed pipeline execution: ${this.config.name} (${this.config.id})`, {
      component: 'ETLPipeline',
      pipelineId: this.config.id,
      success,
      executionTime,
      errorCount: context.errors.length,
      warningCount: context.warnings.length,
    });

    // Create pipeline result
    const result: PipelineResult = {
      pipelineId: this.config.id,
      success,
      executionTime,
      stageResults,
      errors: context.errors.map(e => e.message),
      warnings: context.warnings,
      metadata: context.metadata,
      startTime,
      endTime,
    };

    return result;
  }

  /**
   * Determine stage execution order based on dependencies
   * @returns Ordered list of stages
   */
  private determineExecutionOrder(): PipelineStageConfig[] {
    const stagesById = new Map<string, PipelineStageConfig>();
    const visited = new Set<string>();
    const ordered: PipelineStageConfig[] = [];

    // Create map of stages by ID
    for (const stage of this.config.stages) {
      if (stage.enabled) {
        stagesById.set(stage.id, stage);
      }
    }

    // Visit stages recursively
    const visit = (stageId: string, path: string[] = []): void => {
      // Check for circular dependencies
      if (path.includes(stageId)) {
        const circle = [...path, stageId].join(' -> ');
        throw new Error(`Circular dependency detected: ${circle}`);
      }

      // Skip if already visited
      if (visited.has(stageId)) return;

      const stage = stagesById.get(stageId);

      // Skip if stage not found
      if (!stage) return;

      // Visit dependencies first
      if (stage.dependsOn && stage.dependsOn.length > 0) {
        for (const depId of stage.dependsOn) {
          visit(depId, [...path, stageId]);
        }
      }

      // Mark as visited
      visited.add(stageId);

      // Add to ordered list
      ordered.push(stage);
    };

    // Visit all stages
    for (const stageId of stagesById.keys()) {
      if (!visited.has(stageId)) {
        visit(stageId);
      }
    }

    return ordered;
  }
}
