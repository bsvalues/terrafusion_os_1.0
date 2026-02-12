/**
 * FTP Synchronization Service
 *
 * Manages FTP synchronization operations:
 * - Scheduled synchronization with configurable frequency
 * - Data transformation during import/export
 * - Integration with ETL workflow engine
 * - Persistence of synchronization history
 * - Error handling and notification
 */

import * as path from 'path';
import * as fs from 'fs';
import { FTPConnector, FTPConfig, SyncResult, FileInfo } from './ftp-connector';
import { IStorage } from '../../storage';
import { DataLineageTracker, ChangeSourceType, ChangeOperationType } from '../data-quality';
import { ETLWorkflowEngine, WorkflowConfig, WorkflowStatus } from '../etl';
import { logger } from '../../utils/logger';

// Synchronization configuration
export interface SyncConfig {
  id: string;
  name: string;
  description: string;
  ftpConfig: FTPConfig;
  remotePath: string;
  localPath: string;
  schedule: {
    frequency: 'manual' | 'hourly' | 'daily' | 'weekly';
    specificTime?: string; // HH:MM format for daily/weekly
    dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  };
  options: {
    recursive: boolean;
    deleteLocal: boolean;
    filePattern?: string; // Regular expression for filtering files
    importAfterSync?: boolean; // Whether to import data after sync
    transformData?: boolean; // Whether to transform data during import
  };
}

// Synchronization job status
export enum SyncJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Synchronization job
export interface SyncJob {
  id: string;
  configId: string;
  status: SyncJobStatus;
  startTime: Date;
  endTime?: Date;
  result?: SyncResult;
  error?: string;
  importJobId?: string; // ID of related import job (if any)
}

/**
 * FTP Synchronization Service implementation
 */
export class FTPSyncService {
  private configs: Map<string, SyncConfig> = new Map();
  private jobs: SyncJob[] = [];
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private activeJobs: Map<string, SyncJob> = new Map();

  /**
   * Create a new FTP Synchronization Service
   * @param storage Storage service
   * @param lineageTracker Data lineage tracker
   * @param workflowEngine ETL workflow engine
   */
  constructor(
    private storage: IStorage,
    private lineageTracker?: DataLineageTracker,
    private workflowEngine?: ETLWorkflowEngine
  ) {}

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    // Load configurations (in a real implementation, this would load from database)
    await this.loadConfigurations();

    // Schedule jobs based on configurations
    this.scheduleJobs();

    logger.info('FTP Synchronization Service initialized', {
      component: 'FTPSyncService',
      configCount: this.configs.size,
    });
  }

  /**
   * Load synchronization configurations
   */
  private async loadConfigurations(): Promise<void> {
    // In a real implementation, this would load from database
    // For now, we'll just initialize with empty map
    this.configs = new Map();
  }

  /**
   * Add a synchronization configuration
   * @param config Synchronization configuration
   */
  addSyncConfig(config: SyncConfig): void {
    this.configs.set(config.id, config);

    // Schedule job if needed
    if (config.schedule.frequency !== 'manual') {
      this.scheduleJob(config);
    }

    logger.info(`Added FTP sync configuration: ${config.name} (${config.id})`, {
      component: 'FTPSyncService',
      remotePath: config.remotePath,
      frequency: config.schedule.frequency,
    });
  }

  /**
   * Update a synchronization configuration
   * @param config Synchronization configuration
   */
  updateSyncConfig(config: SyncConfig): void {
    // Cancel existing schedule if any
    if (this.scheduledJobs.has(config.id)) {
      clearTimeout(this.scheduledJobs.get(config.id));
      this.scheduledJobs.delete(config.id);
    }

    // Update configuration
    this.configs.set(config.id, config);

    // Schedule job if needed
    if (config.schedule.frequency !== 'manual') {
      this.scheduleJob(config);
    }

    logger.info(`Updated FTP sync configuration: ${config.name} (${config.id})`, {
      component: 'FTPSyncService',
      remotePath: config.remotePath,
      frequency: config.schedule.frequency,
    });
  }

  /**
   * Remove a synchronization configuration
   * @param configId Configuration ID
   */
  removeSyncConfig(configId: string): void {
    // Cancel existing schedule if any
    if (this.scheduledJobs.has(configId)) {
      clearTimeout(this.scheduledJobs.get(configId));
      this.scheduledJobs.delete(configId);
    }

    // Remove configuration
    this.configs.delete(configId);

    logger.info(`Removed FTP sync configuration: ${configId}`, {
      component: 'FTPSyncService',
    });
  }

  /**
   * Get a synchronization configuration
   * @param configId Configuration ID
   */
  getSyncConfig(configId: string): SyncConfig | undefined {
    return this.configs.get(configId);
  }

  /**
   * Get all synchronization configurations
   */
  getAllSyncConfigs(): SyncConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Schedule synchronization jobs
   */
  private scheduleJobs(): void {
    for (const config of this.configs.values()) {
      if (config.schedule.frequency !== 'manual') {
        this.scheduleJob(config);
      }
    }
  }

  /**
   * Schedule a synchronization job
   * @param config Synchronization configuration
   */
  private scheduleJob(config: SyncConfig): void {
    // Cancel existing schedule if any
    if (this.scheduledJobs.has(config.id)) {
      clearTimeout(this.scheduledJobs.get(config.id));
      this.scheduledJobs.delete(config.id);
    }

    // Calculate next execution time
    const nextExecution = this.calculateNextExecutionTime(config);
    const delay = nextExecution.getTime() - Date.now();

    // Schedule job
    const timeoutId = setTimeout(() => {
      this.runSync(config.id)
        .catch(error => {
          logger.error(`Scheduled FTP sync job failed: ${config.id}`, {
            component: 'FTPSyncService',
            error,
          });
        })
        .finally(() => {
          // Reschedule after completion
          this.scheduleJob(config);
        });
    }, delay);

    this.scheduledJobs.set(config.id, timeoutId);

    logger.info(`Scheduled FTP sync job: ${config.name} (${config.id})`, {
      component: 'FTPSyncService',
      nextExecution: nextExecution.toISOString(),
      delay: Math.round(delay / 1000) + 's',
    });
  }

  /**
   * Calculate next execution time for a scheduled job
   * @param config Synchronization configuration
   * @returns Next execution time
   */
  private calculateNextExecutionTime(config: SyncConfig): Date {
    const now = new Date();
    let nextExecution = new Date(now);

    switch (config.schedule.frequency) {
      case 'hourly':
        // Next hour
        nextExecution.setHours(now.getHours() + 1, 0, 0, 0);
        break;

      case 'daily':
        // Tomorrow at specified time or midnight
        nextExecution.setDate(now.getDate() + 1);

        if (config.schedule.specificTime) {
          const [hours, minutes] = config.schedule.specificTime.split(':').map(Number);
          nextExecution.setHours(hours, minutes, 0, 0);
        } else {
          nextExecution.setHours(0, 0, 0, 0);
        }
        break;

      case 'weekly':
        // Next week on specified day or Sunday
        const targetDay = config.schedule.dayOfWeek !== undefined ? config.schedule.dayOfWeek : 0;
        const daysToAdd = (targetDay + 7 - now.getDay()) % 7 || 7; // If today, schedule for next week

        nextExecution.setDate(now.getDate() + daysToAdd);

        if (config.schedule.specificTime) {
          const [hours, minutes] = config.schedule.specificTime.split(':').map(Number);
          nextExecution.setHours(hours, minutes, 0, 0);
        } else {
          nextExecution.setHours(0, 0, 0, 0);
        }
        break;

      default:
        // Default to 1 hour from now
        nextExecution.setHours(now.getHours() + 1);
    }

    // If the calculated time is in the past, use current time + 1 minute
    if (nextExecution.getTime() <= now.getTime()) {
      nextExecution = new Date(now.getTime() + 60000);
    }

    return nextExecution;
  }

  /**
   * Run a synchronization job
   * @param configId Configuration ID
   * @returns Synchronization job
   */
  async runSync(configId: string): Promise<SyncJob> {
    const config = this.configs.get(configId);

    if (!config) {
      throw new Error(`Sync configuration not found: ${configId}`);
    }

    // Create job
    const jobId = `${configId}-${Date.now()}`;
    const job: SyncJob = {
      id: jobId,
      configId,
      status: SyncJobStatus.PENDING,
      startTime: new Date(),
    };

    // Add to active jobs
    this.activeJobs.set(jobId, job);

    logger.info(`Starting FTP sync job: ${config.name} (${jobId})`, {
      component: 'FTPSyncService',
      remotePath: config.remotePath,
      localPath: config.localPath,
    });

    try {
      // Update status
      job.status = SyncJobStatus.RUNNING;

      // Create FTP connector
      const connector = new FTPConnector(config.ftpConfig);

      // Connect to FTP server
      await connector.connect();

      try {
        // Create file filter if needed
        const fileFilter = config.options.filePattern
          ? (fileInfo: FileInfo) => {
              if (fileInfo.isDirectory) return true;
              const regex = new RegExp(config.options.filePattern!);
              return regex.test(fileInfo.name);
            }
          : undefined;

        // Synchronize directory
        const result = await connector.syncDirectory(config.remotePath, config.localPath, {
          recursive: config.options.recursive,
          deleteLocal: config.options.deleteLocal,
          filter: fileFilter,
        });

        // Update job with result
        job.result = result;
        job.status = SyncJobStatus.COMPLETED;
        job.endTime = new Date();

        // Track data lineage
        if (this.lineageTracker) {
          await this.lineageTracker.trackChanges(
            'ftp_sync',
            configId,
            { status: 'pending' },
            {
              status: 'completed',
              syncResult: {
                added: result.added.length,
                updated: result.updated.length,
                deleted: result.deleted.length,
                unchanged: result.unchanged.length,
                failed: result.failed.length,
              },
            },
            ChangeSourceType.INTEGRATION,
            jobId,
            ChangeOperationType.TRANSFORM
          );
        }

        // Import data if configured
        if (
          config.options.importAfterSync &&
          (result.added.length > 0 || result.updated.length > 0)
        ) {
          await this.importSyncedData(config, job, result);
        }

        logger.info(`Completed FTP sync job: ${config.name} (${jobId})`, {
          component: 'FTPSyncService',
          added: result.added.length,
          updated: result.updated.length,
          deleted: result.deleted.length,
          unchanged: result.unchanged.length,
          failed: result.failed.length,
          duration: job.endTime.getTime() - job.startTime.getTime(),
        });
      } finally {
        // Disconnect from FTP server
        connector.disconnect();
      }
    } catch (error) {
      // Handle errors
      job.status = SyncJobStatus.FAILED;
      job.error = (error as Error).message;
      job.endTime = new Date();

      logger.error(`FTP sync job failed: ${config.name} (${jobId})`, {
        component: 'FTPSyncService',
        error,
      });
    } finally {
      // Remove from active jobs
      this.activeJobs.delete(jobId);

      // Add to job history
      this.jobs.push(job);

      // Keep only the last 100 jobs
      if (this.jobs.length > 100) {
        this.jobs = this.jobs.slice(-100);
      }
    }

    return job;
  }

  /**
   * Import synced data using ETL workflow
   * @param config Synchronization configuration
   * @param syncJob Synchronization job
   * @param syncResult Synchronization result
   */
  private async importSyncedData(
    config: SyncConfig,
    syncJob: SyncJob,
    syncResult: SyncResult
  ): Promise<void> {
    if (!this.workflowEngine) {
      logger.warn(`Cannot import synced data: ETL workflow engine not available`, {
        component: 'FTPSyncService',
        syncJobId: syncJob.id,
      });
      return;
    }

    try {
      // Create a workflow configuration for importing the data
      const importWorkflowId = `import-${config.id}`;
      const workflowConfig: WorkflowConfig = {
        id: importWorkflowId,
        name: `Import ${config.name}`,
        description: `Import data from FTP sync: ${config.description}`,
        version: '1.0.0',
        pipelines: [
          {
            id: `extract-${config.id}`,
            name: 'Extract FTP Data',
            description: 'Extract data from synced FTP files',
            version: '1.0.0',
            stages: [
              {
                id: 'read-files',
                type: 'extract',
                description: 'Read synced files',
                enabled: true,
                options: {
                  path: config.localPath,
                  transformData: config.options.transformData,
                },
              },
              {
                id: 'validate-data',
                type: 'validate',
                description: 'Validate extracted data',
                enabled: true,
                dependsOn: ['read-files'],
              },
              {
                id: 'transform-data',
                type: 'transform',
                description: 'Transform data for import',
                enabled: config.options.transformData || false,
                dependsOn: ['validate-data'],
              },
              {
                id: 'load-data',
                type: 'load',
                description: 'Load data into storage',
                enabled: true,
                dependsOn: config.options.transformData ? ['transform-data'] : ['validate-data'],
              },
            ],
            options: {
              continueOnStageError: false,
              trackLineage: true,
            },
          },
        ],
        options: {
          continueOnError: false,
        },
      };

      // Register workflow
      this.workflowEngine.registerWorkflow(workflowConfig);

      // Execute workflow
      const execution = await this.workflowEngine.executeWorkflow(importWorkflowId, {
        syncJobId: syncJob.id,
        syncResult: {
          added: syncResult.added,
          updated: syncResult.updated,
        },
      });

      // Update sync job with import job ID
      syncJob.importJobId = execution.id;

      // Unregister workflow
      this.workflowEngine.unregisterWorkflow(importWorkflowId);

      if (execution.status === WorkflowStatus.COMPLETED) {
        logger.info(`Imported synced data successfully: ${config.name}`, {
          component: 'FTPSyncService',
          syncJobId: syncJob.id,
          importJobId: execution.id,
        });
      } else {
        logger.error(`Failed to import synced data: ${config.name}`, {
          component: 'FTPSyncService',
          syncJobId: syncJob.id,
          importJobId: execution.id,
          status: execution.status,
          error: execution.error,
        });
      }
    } catch (error) {
      logger.error(`Error importing synced data: ${config.name}`, {
        component: 'FTPSyncService',
        syncJobId: syncJob.id,
        error,
      });
    }
  }

  /**
   * Get all jobs
   * @param limit Maximum number of jobs to return
   * @returns Array of synchronization jobs
   */
  getJobs(limit: number = 100): SyncJob[] {
    return this.jobs.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()).slice(0, limit);
  }

  /**
   * Get jobs for a specific configuration
   * @param configId Configuration ID
   * @param limit Maximum number of jobs to return
   * @returns Array of synchronization jobs
   */
  getJobsByConfig(configId: string, limit: number = 10): SyncJob[] {
    return this.jobs
      .filter(job => job.configId === configId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * Get a job by ID
   * @param jobId Job ID
   * @returns Synchronization job
   */
  getJob(jobId: string): SyncJob | undefined {
    // Check active jobs first
    const activeJob = this.activeJobs.get(jobId);
    if (activeJob) {
      return activeJob;
    }

    // Check job history
    return this.jobs.find(job => job.id === jobId);
  }

  /**
   * Cancel an active job
   * @param jobId Job ID
   * @returns True if job was cancelled
   */
  cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);

    if (!job) {
      return false;
    }

    // Update job status
    job.status = SyncJobStatus.CANCELLED;
    job.endTime = new Date();

    // Remove from active jobs
    this.activeJobs.delete(jobId);

    // Add to job history
    this.jobs.push(job);

    logger.info(`Cancelled FTP sync job: ${jobId}`, {
      component: 'FTPSyncService',
    });

    return true;
  }

  /**
   * Shutdown the service
   */
  shutdown(): void {
    // Cancel all scheduled jobs
    for (const [configId, timeoutId] of this.scheduledJobs.entries()) {
      clearTimeout(timeoutId);
      logger.info(`Cancelled scheduled FTP sync job: ${configId}`, {
        component: 'FTPSyncService',
      });
    }

    // Clear scheduled jobs
    this.scheduledJobs.clear();

    // Cancel all active jobs
    for (const [jobId, job] of this.activeJobs.entries()) {
      job.status = SyncJobStatus.CANCELLED;
      job.endTime = new Date();
      this.jobs.push(job);

      logger.info(`Cancelled active FTP sync job: ${jobId}`, {
        component: 'FTPSyncService',
      });
    }

    // Clear active jobs
    this.activeJobs.clear();

    logger.info('FTP Synchronization Service shutdown', {
      component: 'FTPSyncService',
    });
  }
}
