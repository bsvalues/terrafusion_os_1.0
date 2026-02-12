/**
 * Database Conversion Agent
 *
 * This agent specializes in database conversion operations, including:
 * - Schema analysis and discovery
 * - Data migration planning and execution
 * - Compatibility layer generation
 * - Schema optimization recommendations
 */

import { BaseAgent } from './base-agent';
import { IStorage } from '../storage';
import { MCPService } from '../services/mcp-service';
import { DatabaseConversionService } from '../services/database-conversion';
import {
  SchemaAnalysisResult,
  DatabaseType,
  ConnectionStatus,
  ConversionResult,
  CompatibilityLayerOptions,
} from '../services/database-conversion/types';
import { EventEmitter } from 'events';

interface DatabaseConversionAgentConfig {
  agentName: string;
  userId: string;
  maxConcurrentConversions?: number;
  defaultTargetDatabase?: DatabaseType;
  enableAIRecommendations?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

type DatabaseConversionTask = {
  id: string;
  projectId: string;
  sourceConnectionString: string;
  sourceType: DatabaseType;
  targetConnectionString: string;
  targetType: DatabaseType;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  schemaAnalysisId?: string;
  compatibilityLayerId?: string;
  result?: ConversionResult;
};

type MessageHandlerFunction = (message: any, sender: string) => Promise<any>;

export class DatabaseConversionAgent extends BaseAgent {
  private storage: IStorage;
  private mcpService: MCPService;
  private dbConversionService: DatabaseConversionService;
  private activeTasks: Map<string, DatabaseConversionTask>;
  private messageHandlers: Map<string, MessageHandlerFunction>;
  private eventEmitter: EventEmitter;
  private config: DatabaseConversionAgentConfig;

  constructor(storage: IStorage, mcpService: MCPService, config: DatabaseConversionAgentConfig) {
    super(storage, {
      agentId: 'database-conversion-agent',
      agentName: config.agentName || 'Database Conversion Agent',
      capabilities: [
        'databaseSchemaAnalysis',
        'databaseConversion',
        'databaseCompatibilityGeneration',
        'databaseOptimizationRecommendations',
      ],
      userId: config.userId,
    });

    this.storage = storage;
    this.mcpService = mcpService;
    this.dbConversionService = new DatabaseConversionService(storage, mcpService);
    this.config = {
      ...config,
      maxConcurrentConversions: config.maxConcurrentConversions || 3,
      logLevel: config.logLevel || 'info',
    };

    this.activeTasks = new Map();
    this.messageHandlers = new Map();
    this.eventEmitter = new EventEmitter();

    // Initialize the agent
    this.initialize();
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    // Register message handlers
    this.registerMessageHandler('analyzeSchema', this.handleAnalyzeSchema.bind(this));
    this.registerMessageHandler('testConnection', this.handleTestConnection.bind(this));
    this.registerMessageHandler('startConversion', this.handleStartConversion.bind(this));
    this.registerMessageHandler('getConversionStatus', this.handleGetConversionStatus.bind(this));
    this.registerMessageHandler(
      'generateCompatibilityLayer',
      this.handleGenerateCompatibilityLayer.bind(this)
    );

    // Log initialization
    this.log('info', 'Database Conversion Agent initialized');
  }

  /**
   * Register a message handler
   */
  private registerMessageHandler(messageType: string, handler: MessageHandlerFunction): void {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Handle incoming messages
   */
  public async processMessage(message: any, sender: string): Promise<any> {
    try {
      // Log incoming message
      this.log('debug', `Received message from ${sender}`, { messageType: message.type });

      // Validate message structure
      if (!message || !message.type) {
        throw new Error('Invalid message: missing type');
      }

      // Get appropriate handler
      const handler = this.messageHandlers.get(message.type);

      // If no handler found, return error
      if (!handler) {
        throw new Error(`Unknown message type: ${message.type}`);
      }

      // Execute handler and return result
      return await handler(message, sender);
    } catch (error) {
      // Log error
      this.log('error', `Error processing message: ${error.message}`, { error });

      // Return error response
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle analyze schema message
   */
  private async handleAnalyzeSchema(message: any, sender: string): Promise<any> {
    try {
      // Validate message parameters
      if (!message.connectionString) {
        throw new Error('Missing required parameter: connectionString');
      }

      if (!message.databaseType) {
        throw new Error('Missing required parameter: databaseType');
      }

      // Log the analyze schema request
      this.log('info', `Analyzing schema for ${message.databaseType} database`);

      // Call the service
      const result = await this.dbConversionService.analyzeSchema(
        message.connectionString,
        message.databaseType,
        {
          useAI: this.config.enableAIRecommendations,
          ...message.options,
        }
      );

      // Log success
      this.log('info', `Successfully analyzed schema with ${result.tables.length} tables`);

      // Return success response
      return {
        success: true,
        result,
      };
    } catch (error) {
      // Log error
      this.log('error', `Error analyzing schema: ${error.message}`, { error });

      // Return error response
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle test connection message
   */
  private async handleTestConnection(message: any, sender: string): Promise<any> {
    try {
      // Validate message parameters
      if (!message.connectionString) {
        throw new Error('Missing required parameter: connectionString');
      }

      if (!message.databaseType) {
        throw new Error('Missing required parameter: databaseType');
      }

      // Log the test connection request
      this.log('info', `Testing connection to ${message.databaseType} database`);

      // Call the service
      const result = await this.dbConversionService.testConnection(
        message.connectionString,
        message.databaseType
      );

      // Log result
      if (result.status === ConnectionStatus.Success) {
        this.log('info', `Successfully connected to ${message.databaseType} database`);
      } else {
        this.log('info', `Failed to connect to ${message.databaseType} database: ${result.error}`);
      }

      // Return result
      return {
        success: true,
        result,
      };
    } catch (error) {
      // Log error
      this.log('error', `Error testing connection: ${error.message}`, { error });

      // Return error response
      return {
        success: false,
        error: error.message,
        result: {
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Handle analyze schema results message
   */
  private async handleAnalyzeSchemaResults(message: any, sender: string): Promise<any> {
    try {
      // Validate message parameters
      if (!message.schemaAnalysisId) {
        throw new Error('Missing required parameter: schemaAnalysisId');
      }

      // Log the request
      this.log('info', `Retrieving schema analysis results for ${message.schemaAnalysisId}`);

      // Get the schema analysis results
      const analysis = await this.storage.getSchemaAnalysis(message.schemaAnalysisId);

      if (!analysis) {
        throw new Error(`Schema analysis not found: ${message.schemaAnalysisId}`);
      }

      // Log success
      this.log('info', `Retrieved schema analysis results`);

      // Return success response with specific parts of the analysis if requested
      if (message.includeOnly && Array.isArray(message.includeOnly)) {
        const result: any = {};

        for (const key of message.includeOnly) {
          if (analysis[key]) {
            result[key] = analysis[key];
          }
        }

        return {
          success: true,
          result,
        };
      }

      return {
        success: true,
        result: analysis,
      };
    } catch (error) {
      // Log error
      this.log('error', `Error retrieving schema analysis: ${error.message}`, { error });

      // Return error response
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle get schema recommendations message
   */
  private async handleGetSchemaRecommendations(message: any, sender: string): Promise<any> {
    try {
      // Validate message parameters
      if (!message.schemaAnalysisId) {
        throw new Error('Missing required parameter: schemaAnalysisId');
      }

      // Log the request
      this.log('info', `Retrieving schema recommendations for ${message.schemaAnalysisId}`);

      // Get the schema analysis results
      const analysis = await this.storage.getSchemaAnalysis(message.schemaAnalysisId);

      if (!analysis) {
        throw new Error(`Schema analysis not found: ${message.schemaAnalysisId}`);
      }

      // Extract recommendations
      const recommendations = {
        optimizationSuggestions: analysis.optimizationSuggestions,
        dataModelImprovements: analysis.dataModelImprovements,
        schemaIssues: analysis.schemaIssues,
        performanceIssues: analysis.performanceIssues,
      };

      // Log success
      this.log('info', `Retrieved schema recommendations`);

      return {
        success: true,
        result: recommendations,
      };
    } catch (error) {
      // Log error
      this.log('error', `Error retrieving schema recommendations: ${error.message}`, { error });

      // Return error response
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Start a database conversion process
   */
  private async startConversionProcess(
    projectId: string,
    sourceConnectionString: string,
    sourceType: DatabaseType,
    targetConnectionString: string,
    targetType: DatabaseType,
    options: any = {}
  ): Promise<DatabaseConversionTask> {
    try {
      // Check if we already have this task
      const existingTask = this.activeTasks.get(projectId);
      if (existingTask) {
        return existingTask;
      }

      // Create new task
      const taskId = `conversion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const task: DatabaseConversionTask = {
        id: taskId,
        projectId,
        sourceConnectionString,
        sourceType,
        targetConnectionString,
        targetType,
        status: 'pending',
        progress: 0,
        startedAt: new Date(),
      };

      // Store the task
      this.activeTasks.set(projectId, task);

      // Log the task creation
      this.log('info', `Created conversion task ${taskId} for project ${projectId}`);

      // Start the conversion in the background
      this.executeConversionTask(task, options).catch(error => {
        this.log('error', `Error in conversion task ${taskId}: ${error.message}`, { error });
      });

      return task;
    } catch (error) {
      // Log error
      this.log('error', `Error starting conversion process: ${error.message}`, { error });

      throw error;
    }
  }

  /**
   * Execute a conversion task
   */
  private async executeConversionTask(
    task: DatabaseConversionTask,
    options: any = {}
  ): Promise<void> {
    try {
      // Update task status
      task.status = 'running';
      task.progress = 0;

      // Log the task start
      this.log('info', `Started conversion task ${task.id} for project ${task.projectId}`);

      // Emit task started event
      this.emitEvent('conversionTaskStarted', {
        taskId: task.id,
        projectId: task.projectId,
        sourceType: task.sourceType,
        targetType: task.targetType,
      });

      // Step 1: Analyze source schema
      this.updateTaskProgress(task, 5, 'Analyzing source schema');
      const schemaAnalysis = await this.dbConversionService.analyzeSchema(
        task.sourceConnectionString,
        task.sourceType,
        {
          useAI: this.config.enableAIRecommendations,
          ...options.analysisOptions,
        }
      );

      // Store schema analysis ID
      task.schemaAnalysisId = schemaAnalysis.id;

      // Step 2: Estimate conversion stats
      this.updateTaskProgress(task, 10, 'Estimating conversion requirements');

      const estimatedStats = {
        totalTables: schemaAnalysis.tables.length,
        tablesConverted: 0,
        recordsProcessed: 0,
        estimatedTotalRecords: 0,
        errors: 0,
        warnings: 0,
      };

      // Estimate total records and time
      let estimatedTotalRecords = 0;
      for (const table of schemaAnalysis.tables) {
        estimatedTotalRecords += table.rowCount || 0;
      }

      estimatedStats.estimatedTotalRecords = estimatedTotalRecords;

      const estimatedTimeSeconds = this.dbConversionService.estimateConversionTime(
        schemaAnalysis.tables.length,
        estimatedTotalRecords,
        task.sourceType,
        task.targetType
      );

      // Step 3: Start the conversion
      this.updateTaskProgress(task, 15, 'Starting conversion process');

      // Call the service to start the conversion
      const conversionResult = await this.dbConversionService.startConversion(task.projectId);
      task.result = conversionResult;

      // Step 4: Monitor the conversion progress
      this.updateTaskProgress(task, 20, 'Converting schema and data');

      let isComplete = false;
      let lastProgress = 20;

      while (!isComplete) {
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get current status
        const status = await this.dbConversionService.getConversionStatus(task.projectId);
        task.result = status;

        // Calculate progress
        const tableProgress = (status.progress.tablesConverted / status.progress.totalTables) * 60;
        const newProgress = Math.min(20 + tableProgress, 80);

        // Only update if progress has changed significantly
        if (newProgress > lastProgress + 1) {
          this.updateTaskProgress(
            task,
            newProgress,
            `Converting table ${status.progress.tablesConverted} of ${status.progress.totalTables}`
          );
          lastProgress = newProgress;
        }

        // Check if complete
        isComplete = status.status === 'completed' || status.status === 'failed';

        if (status.status === 'failed') {
          throw new Error(status.error || 'Conversion failed');
        }
      }

      // Step 5: Generate compatibility layer if requested
      if (options.generateCompatibilityLayer) {
        this.updateTaskProgress(task, 85, 'Generating compatibility layer');

        const compatibilityOptions: CompatibilityLayerOptions = {
          ormType: options.ormType || 'drizzle',
          includeExamples: options.includeExamples !== false,
          generateMigrations: options.generateMigrations !== false,
        };

        const compatibilityResult = await this.dbConversionService.generateCompatibilityLayer(
          task.projectId,
          compatibilityOptions
        );

        task.compatibilityLayerId = compatibilityResult.id;
      }

      // Step 6: Complete the task
      this.updateTaskProgress(task, 100, 'Conversion completed');
      task.status = 'completed';
      task.completedAt = new Date();

      // Emit completion event
      this.emitEvent('conversionTaskCompleted', {
        taskId: task.id,
        projectId: task.projectId,
        sourceType: task.sourceType,
        targetType: task.targetType,
        result: task.result,
      });

      // Log completion
      this.log('info', `Completed conversion task ${task.id} for project ${task.projectId}`);
    } catch (error) {
      // Update task with error
      task.status = 'failed';
      task.error = error.message;
      task.completedAt = new Date();

      // Emit error event
      this.emitEvent('conversionTaskFailed', {
        taskId: task.id,
        projectId: task.projectId,
        error: error.message,
      });

      // Log error
      this.log('error', `Conversion task ${task.id} failed: ${error.message}`, { error });

      // Rethrow the error
      throw error;
    }
  }

  /**
   * Update task progress
   */
  private updateTaskProgress(
    task: DatabaseConversionTask,
    progress: number,
    statusMessage: string
  ): void {
    // Update task
    task.progress = progress;

    // Update result if it exists
    if (task.result) {
      task.result.statusMessage = statusMessage;
      task.result.progress = {
        ...task.result.progress,
        overallProgress: progress,
      };
    }

    // Emit progress event
    this.emitEvent('conversionTaskProgress', {
      taskId: task.id,
      projectId: task.projectId,
      progress,
      statusMessage,
    });

    // Log progress
    this.log('debug', `Conversion task ${task.id} progress: ${progress}% - ${statusMessage}`);
  }

  /**
   * Handle start conversion message
   */
  private async handleStartConversion(message: any, sender: string): Promise<any> {
    try {
      // Validate message parameters
      if (!message.projectId) {
        throw new Error('Missing required parameter: projectId');
      }

      if (!message.sourceConnectionString) {
        throw new Error('Missing required parameter: sourceConnectionString');
      }

      if (!message.sourceType) {
        throw new Error('Missing required parameter: sourceType');
      }

      if (!message.targetConnectionString) {
        throw new Error('Missing required parameter: targetConnectionString');
      }

      if (!message.targetType) {
        message.targetType = this.config.defaultTargetDatabase || DatabaseType.PostgreSQL;
      }

      // Check if we're within the concurrent limit
      const runningTasks = Array.from(this.activeTasks.values()).filter(
        t => t.status === 'running'
      ).length;

      if (runningTasks >= this.config.maxConcurrentConversions) {
        throw new Error(
          `Maximum concurrent conversions limit reached (${this.config.maxConcurrentConversions})`
        );
      }

      // Log the request
      this.log('info', `Starting conversion for project ${message.projectId}`);

      // Start the conversion
      const task = await this.startConversionProcess(
        message.projectId,
        message.sourceConnectionString,
        message.sourceType,
        message.targetConnectionString,
        message.targetType,
        message.options
      );

      // Return the initial status
      return {
        success: true,
        result: {
          taskId: task.id,
          projectId: task.projectId,
          status: task.status,
          progress: task.progress,
          startedAt: task.startedAt.toISOString(),
        },
      };
    } catch (error) {
      // Log error
      this.log('error', `Error starting conversion: ${error.message}`, { error });

      // Return error response
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle get conversion status message
   */
  private async handleGetConversionStatus(message: any, sender: string): Promise<any> {
    try {
      // Validate message parameters
      if (!message.projectId) {
        throw new Error('Missing required parameter: projectId');
      }

      // Log the request
      this.log('debug', `Getting conversion status for project ${message.projectId}`);

      // Check if we have this task in memory
      const task = this.activeTasks.get(message.projectId);

      if (task) {
        // Return task from memory
        return {
          success: true,
          result: {
            taskId: task.id,
            projectId: task.projectId,
            status: task.status,
            progress: task.progress,
            startedAt: task.startedAt.toISOString(),
            completedAt: task.completedAt?.toISOString(),
            error: task.error,
            conversionResult: task.result,
          },
        };
      }

      // Not in memory, check database
      const status = await this.dbConversionService.getConversionStatus(message.projectId);

      // Log the result
      this.log('debug', `Retrieved conversion status for project ${message.projectId}`);

      // Return the status
      return {
        success: true,
        result: status,
      };
    } catch (error) {
      // Log error
      this.log('error', `Error getting conversion status: ${error.message}`, { error });

      // Return error response
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle generate compatibility layer message
   */
  private async handleGenerateCompatibilityLayer(message: any, sender: string): Promise<any> {
    try {
      // Validate message parameters
      if (!message.projectId) {
        throw new Error('Missing required parameter: projectId');
      }

      // Log the request
      this.log('info', `Generating compatibility layer for project ${message.projectId}`);

      // Prepare options
      const options: CompatibilityLayerOptions = {
        ormType: message.ormType || 'drizzle',
        includeExamples: message.includeExamples !== false,
        generateMigrations: message.generateMigrations !== false,
        targetDirectory: message.targetDirectory,
      };

      // Call the service
      const result = await this.dbConversionService.generateCompatibilityLayer(
        message.projectId,
        options
      );

      // Log success
      this.log('info', `Generated compatibility layer for project ${message.projectId}`);

      // Return success response
      return {
        success: true,
        result,
      };
    } catch (error) {
      // Log error
      this.log('error', `Error generating compatibility layer: ${error.message}`, { error });

      // Return error response
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get database type information
   */
  public getDatabaseTypeInfo(databaseType: DatabaseType): any {
    return this.dbConversionService.getDatabaseTypeInfo(databaseType);
  }

  /**
   * Get supported database types
   */
  public getSupportedDatabaseTypes(): any[] {
    return this.dbConversionService.getSupportedDatabaseTypes();
  }

  /**
   * Emit an event
   */
  private emitEvent(event: string, data: any): void {
    this.eventEmitter.emit(event, data);
    // Also emit to MCP if available
    if (this.mcpService) {
      this.mcpService.emit(`databaseConversion.${event}`, data);
    }
  }

  /**
   * Subscribe to events
   */
  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Unsubscribe from events
   */
  public off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Log a message
   */
  private log(level: string, message: string, details?: any): void {
    // Only log if level is appropriate
    const logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    if (logLevels[level] >= logLevels[this.config.logLevel]) {
      }] ${message}`);

      // Also log to storage if available
      try {
        this.storage
          .createAgentLog({
            agentId: 'database-conversion-agent',
            level,
            message,
            details: details ? JSON.stringify(details) : undefined,
            timestamp: new Date(),
          })
          .catch(err => {
            console.error('Error logging to storage:', err);
          });
      } catch (error) {
        console.error('Error logging to storage:', error);
      }
    }
  }
}

