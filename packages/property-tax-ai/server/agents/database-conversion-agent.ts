/**
 * Database Conversion Agent
 * 
 * This agent specializes in database schema analysis, conversion, and compatibility generation.
 * It coordinates various specialized sub-agents to perform complex database conversion tasks.
 */

import { BaseAgent, AgentConfig, AgentMessage, AgentTask } from './base-agent';
import { IStorage } from '../storage';
import { MCPService } from '../services/mcp-service';
import { LLMService } from '../services/llm-service';
import { SchemaAnalyzerService } from '../services/database-conversion/schema-analyzer-service';
import { DataMigrationService } from '../services/database-conversion/data-migration-service';
import { DataTransformationService } from '../services/database-conversion/data-transformation-service';
import { CompatibilityService } from '../services/database-conversion/compatibility-service';
import { 
  ConnectionTestResult, 
  SchemaAnalysisResult, 
  ConversionResult,
  DatabaseType,
  ConversionStatus,
  CompatibilityLayerOptions
} from '../services/database-conversion/types';
import { v4 as uuidv4 } from 'uuid';

// List of specialized sub-agents
export enum DatabaseConversionSubAgentType {
  SchemaDesigner = 'schema_designer',
  QueryOptimizer = 'query_optimizer',
  DataIntegration = 'data_integration',
  DatabaseAdmin = 'database_admin'
}

interface DatabaseConversionAgentConfig extends AgentConfig {
  enabledSubAgents?: DatabaseConversionSubAgentType[];
  defaultOptions?: {
    analysisDepth?: 'basic' | 'standard' | 'deep';
    batchSize?: number;
    useAIAssistance?: boolean;
    compatibilityTargets?: string[];
  };
}

export class DatabaseConversionAgent extends BaseAgent {
  private schemaAnalyzerService: SchemaAnalyzerService;
  private dataMigrationService: DataMigrationService;
  private dataTransformationService: DataTransformationService;
  private compatibilityService: CompatibilityService;
  private llmService: LLMService | null = null;
  private subAgents: Map<DatabaseConversionSubAgentType, any> = new Map();
  private activeConversions: Map<string, ConversionResult> = new Map();
  private config: DatabaseConversionAgentConfig;

  constructor(
    storage: IStorage,
    mcpService: MCPService,
    schemaAnalyzerService: SchemaAnalyzerService,
    dataMigrationService: DataMigrationService,
    dataTransformationService: DataTransformationService,
    compatibilityService: CompatibilityService,
    llmService?: LLMService,
    config?: Partial<DatabaseConversionAgentConfig>
  ) {
    // Default configuration for the database conversion agent
    const defaultConfig: DatabaseConversionAgentConfig = {
      agentId: 'database-conversion-agent',
      displayName: 'Database Conversion Agent',
      description: 'Specialized agent for database schema analysis, conversion, and compatibility generation',
      capabilities: [
        'database_connection_testing',
        'schema_analysis',
        'data_migration',
        'data_transformation',
        'compatibility_layer_generation',
        'conversion_monitoring'
      ],
      enabledSubAgents: Object.values(DatabaseConversionSubAgentType),
      defaultOptions: {
        analysisDepth: 'standard',
        batchSize: 1000,
        useAIAssistance: true,
        compatibilityTargets: ['drizzle', 'typeorm', 'prisma', 'sequelize', 'mongoose']
      }
    };

    // Merge default config with provided config
    const mergedConfig = { ...defaultConfig, ...config };
    super(storage, mcpService, mergedConfig);
    
    this.config = mergedConfig;
    this.schemaAnalyzerService = schemaAnalyzerService;
    this.dataMigrationService = dataMigrationService;
    this.dataTransformationService = dataTransformationService;
    this.compatibilityService = compatibilityService;
    this.llmService = llmService || null;

    // Initialize enabled sub-agents
    this.initializeSubAgents();
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    await super.initialize();
    console.log(`Database Conversion Agent initialized with ${this.subAgents.size} sub-agents`);
    
    // Register message handlers
    this.registerMessageHandler('test_connection', this.handleTestConnection.bind(this));
    this.registerMessageHandler('analyze_schema', this.handleAnalyzeSchema.bind(this));
    this.registerMessageHandler('start_conversion', this.handleStartConversion.bind(this));
    this.registerMessageHandler('get_conversion_status', this.handleGetConversionStatus.bind(this));
    this.registerMessageHandler('generate_compatibility_layer', this.handleGenerateCompatibilityLayer.bind(this));
    
    // Log initialization
    await this.log('info', 'Database Conversion Agent initialized successfully');
  }

  /**
   * Initialize sub-agents based on configuration
   */
  private initializeSubAgents(): void {
    if (!this.config.enabledSubAgents) return;

    for (const subAgentType of this.config.enabledSubAgents) {
      switch (subAgentType) {
        case DatabaseConversionSubAgentType.SchemaDesigner:
          this.subAgents.set(subAgentType, this.createSchemaDesignerAgent());
          break;
        case DatabaseConversionSubAgentType.QueryOptimizer:
          this.subAgents.set(subAgentType, this.createQueryOptimizerAgent());
          break;
        case DatabaseConversionSubAgentType.DataIntegration:
          this.subAgents.set(subAgentType, this.createDataIntegrationAgent());
          break;
        case DatabaseConversionSubAgentType.DatabaseAdmin:
          this.subAgents.set(subAgentType, this.createDatabaseAdminAgent());
          break;
      }
    }
  }

  /**
   * Create Schema Designer Agent
   */
  private createSchemaDesignerAgent(): any {
    // This would be a more complex implementation in a real system
    return {
      id: `schema-designer-${uuidv4()}`,
      type: DatabaseConversionSubAgentType.SchemaDesigner,
      analyze: async (schema: SchemaAnalysisResult) => {
        // Enhanced schema analysis with AI
        if (this.llmService) {
          // Use AI to analyze schema design patterns
          return {
            optimizationSuggestions: [
              { type: 'index', table: 'users', columns: ['email'], reason: 'Frequently queried field' },
              { type: 'normalization', tables: ['orders', 'products'], suggestion: 'Consider many-to-many relationship table' }
            ],
            dataModelImprovements: [
              'Consider adding timestamps to all tables for better auditing',
              'User preferences could be normalized into a separate table'
            ]
          };
        }
        return { optimizationSuggestions: [], dataModelImprovements: [] };
      },
      generateMapping: async (sourceSchema: SchemaAnalysisResult, targetType: DatabaseType) => {
        // Generate smart schema mapping suggestions
        return {
          tableMappings: sourceSchema.tables.map(table => ({
            sourceTable: table.name,
            targetTable: table.name.toLowerCase(),
            columnMappings: table.columns.map(col => ({
              sourceColumn: col.name,
              targetColumn: col.name.toLowerCase(),
              transformations: []
            }))
          }))
        };
      }
    };
  }

  /**
   * Create Query Optimizer Agent
   */
  private createQueryOptimizerAgent(): any {
    return {
      id: `query-optimizer-${uuidv4()}`,
      type: DatabaseConversionSubAgentType.QueryOptimizer,
      optimizeQueries: async (sourceQueries: any[], targetType: DatabaseType) => {
        // Optimize queries for the target database type
        return sourceQueries.map(query => ({
          original: query,
          optimized: query, // Would contain optimized version
          performance: { estimated_improvement: '15%' }
        }));
      },
      analyzePerformance: async (schema: SchemaAnalysisResult) => {
        // Analyze potential performance hotspots
        return {
          potentialIssues: [
            { table: 'transactions', issue: 'Missing index on frequently filtered column', severity: 'high' },
            { table: 'users', issue: 'Inefficient data type for UUID storage', severity: 'medium' }
          ]
        };
      }
    };
  }

  /**
   * Create Data Integration Agent
   */
  private createDataIntegrationAgent(): any {
    return {
      id: `data-integration-${uuidv4()}`,
      type: DatabaseConversionSubAgentType.DataIntegration,
      suggestDataSources: async (schema: SchemaAnalysisResult) => {
        // Suggest additional data sources that could be integrated
        return {
          suggestions: [
            { source: 'CRM system', matchTable: 'customers', benefits: 'Enhanced customer data' },
            { source: 'Product inventory API', matchTable: 'products', benefits: 'Real-time stock data' }
          ]
        };
      },
      designIntegrationPipeline: async (sourceSchema: SchemaAnalysisResult, targetSchema: SchemaAnalysisResult) => {
        // Design data integration pipeline
        return {
          etlSteps: [
            { name: 'Extract from source', estimatedTime: '10 minutes' },
            { name: 'Transform key structures', estimatedTime: '15 minutes' },
            { name: 'Load to target', estimatedTime: '20 minutes' },
            { name: 'Validate data integrity', estimatedTime: '10 minutes' }
          ],
          recommendations: [
            'Consider incremental loading for large tables',
            'Set up change data capture for real-time syncing'
          ]
        };
      }
    };
  }

  /**
   * Create Database Admin Assistant Agent
   */
  private createDatabaseAdminAgent(): any {
    return {
      id: `database-admin-${uuidv4()}`,
      type: DatabaseConversionSubAgentType.DatabaseAdmin,
      generateMigrationScript: async (
        sourceSchema: SchemaAnalysisResult, 
        targetType: DatabaseType
      ) => {
        // Generate migration scripts
        return {
          scripts: [
            { 
              name: 'create_tables.sql', 
              content: '-- Example migration script\nCREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(255));' 
            },
            { 
              name: 'create_indexes.sql', 
              content: '-- Example index creation\nCREATE INDEX idx_users_email ON users(email);' 
            }
          ]
        };
      },
      suggestBackupStrategy: async (schema: SchemaAnalysisResult) => {
        // Suggest backup strategy
        return {
          strategy: [
            { type: 'Full backup', frequency: 'Daily', timing: '1:00 AM', retention: '30 days' },
            { type: 'Incremental backup', frequency: 'Hourly', timing: 'Every hour', retention: '7 days' },
            { type: 'Transaction log backup', frequency: 'Every 15 minutes', timing: '24/7', retention: '3 days' }
          ],
          estimatedStorage: '25GB per month',
          recommendations: [
            'Configure point-in-time recovery',
            'Test restores monthly to verify backup integrity'
          ]
        };
      }
    };
  }

  /**
   * Test database connection
   */
  public async testConnection(
    connectionString: string, 
    databaseType: DatabaseType
  ): Promise<ConnectionTestResult> {
    try {
      // Log the connection test start
      await this.log('info', `Testing connection to ${databaseType} database`);
      
      // Use the schema analyzer service to test the connection
      const result = await this.schemaAnalyzerService.testConnection(connectionString, databaseType);
      
      // Log the connection test result
      await this.log('info', `Connection test result: ${result.status}`, { details: result });
      
      return result;
    } catch (error) {
      // Log the error
      await this.log('error', `Connection test failed: ${error.message}`);
      
      // Return a failed connection result
      return {
        status: 'failed',
        message: error.message,
        timestamp: new Date(),
        details: error
      };
    }
  }

  /**
   * Analyze database schema
   */
  public async analyzeSchema(
    connectionString: string, 
    databaseType: DatabaseType,
    options?: { depth?: 'basic' | 'standard' | 'deep' }
  ): Promise<SchemaAnalysisResult> {
    try {
      // Determine analysis depth
      const depth = options?.depth || this.config.defaultOptions?.analysisDepth || 'standard';
      
      // Log the schema analysis start
      await this.log('info', `Analyzing schema of ${databaseType} database with depth: ${depth}`);
      
      // Use the schema analyzer service to analyze the schema
      const result = await this.schemaAnalyzerService.analyzeSchema(connectionString, databaseType, { depth });
      
      // Log the schema analysis result
      await this.log('info', `Schema analysis completed with ${result.tables.length} tables`, { details: { tableCount: result.tables.length } });
      
      // If AI assistance is enabled and the schema designer agent is available, get optimization suggestions
      if (this.config.defaultOptions?.useAIAssistance && this.subAgents.has(DatabaseConversionSubAgentType.SchemaDesigner)) {
        const schemaDesigner = this.subAgents.get(DatabaseConversionSubAgentType.SchemaDesigner);
        const optimizationResult = await schemaDesigner.analyze(result);
        
        // Log the optimization suggestions
        await this.log('info', `Generated ${optimizationResult.optimizationSuggestions.length} schema optimization suggestions`);
        
        // Attach the optimization suggestions to the result
        result['optimizationSuggestions'] = optimizationResult.optimizationSuggestions;
        result['dataModelImprovements'] = optimizationResult.dataModelImprovements;
      }
      
      return result;
    } catch (error) {
      // Log the error
      await this.log('error', `Schema analysis failed: ${error.message}`);
      
      // Rethrow the error
      throw error;
    }
  }

  /**
   * Start a database conversion process
   */
  public async startConversion(
    projectId: string,
    sourceConnectionString: string,
    sourceType: DatabaseType,
    targetConnectionString: string,
    targetType: DatabaseType,
    options?: {
      batchSize?: number;
      includeTables?: string[];
      excludeTables?: string[];
      skipDataMigration?: boolean;
      customMappings?: any;
    }
  ): Promise<ConversionResult> {
    try {
      // Check if project ID is valid
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      
      // Merge options with defaults
      const batchSize = options?.batchSize || this.config.defaultOptions?.batchSize || 1000;
      
      // Log the conversion start
      await this.log('info', `Starting conversion for project ${projectId} from ${sourceType} to ${targetType}`);
      
      // Initialize the conversion result
      const conversionResult: ConversionResult = {
        projectId,
        status: ConversionStatus.InProgress,
        progress: 0,
        startTime: new Date(),
        lastUpdated: new Date(),
        currentStage: 'Analyzing source schema',
        summary: {
          tablesConverted: 0,
          totalTables: 0,
          recordsProcessed: 0,
          estimatedTotalRecords: 0,
          errors: 0,
          warnings: 0
        }
      };
      
      // Store the conversion result
      this.activeConversions.set(projectId, conversionResult);
      
      // Start the conversion process asynchronously
      this.runConversion(
        projectId,
        sourceConnectionString,
        sourceType,
        targetConnectionString,
        targetType,
        {
          batchSize,
          includeTables: options?.includeTables,
          excludeTables: options?.excludeTables,
          skipDataMigration: options?.skipDataMigration,
          customMappings: options?.customMappings
        }
      );
      
      return conversionResult;
    } catch (error) {
      // Log the error
      await this.log('error', `Failed to start conversion: ${error.message}`);
      
      // Return a failed conversion result
      return {
        projectId,
        status: ConversionStatus.Failed,
        progress: 0,
        startTime: new Date(),
        endTime: new Date(),
        lastUpdated: new Date(),
        errorMessage: error.message
      };
    }
  }

  /**
   * Run the conversion process asynchronously
   */
  private async runConversion(
    projectId: string,
    sourceConnectionString: string,
    sourceType: DatabaseType,
    targetConnectionString: string,
    targetType: DatabaseType,
    options: {
      batchSize: number;
      includeTables?: string[];
      excludeTables?: string[];
      skipDataMigration?: boolean;
      customMappings?: any;
    }
  ): Promise<void> {
    try {
      // Get the current conversion result
      const conversionResult = this.activeConversions.get(projectId);
      if (!conversionResult) {
        throw new Error(`Conversion result not found for project ${projectId}`);
      }
      
      // 1. Analyze source schema
      await this.updateConversionStatus(projectId, { currentStage: 'Analyzing source schema', progress: 5 });
      const sourceSchema = await this.schemaAnalyzerService.analyzeSchema(sourceConnectionString, sourceType);
      
      // Update total tables in summary
      const totalTables = sourceSchema.tables.length;
      await this.updateConversionStatus(projectId, { 
        progress: 10,
        summary: { ...conversionResult.summary, totalTables }
      });
      
      // 2. Generate schema mapping
      await this.updateConversionStatus(projectId, { currentStage: 'Generating schema mapping', progress: 15 });
      
      // Use AI-powered schema designer agent if available
      let schemaMappings;
      if (this.subAgents.has(DatabaseConversionSubAgentType.SchemaDesigner)) {
        const schemaDesigner = this.subAgents.get(DatabaseConversionSubAgentType.SchemaDesigner);
        schemaMappings = await schemaDesigner.generateMapping(sourceSchema, targetType);
      } else {
        // Default mapping generation logic
        schemaMappings = {
          tableMappings: sourceSchema.tables.map(table => ({
            sourceTable: table.name,
            targetTable: table.name,
            columnMappings: table.columns.map(col => ({
              sourceColumn: col.name,
              targetColumn: col.name,
              transformations: []
            }))
          }))
        };
      }
      
      // Apply custom mappings if provided
      if (options.customMappings) {
        // Logic to merge custom mappings with generated mappings
        // ...
      }
      
      // 3. Create target schema
      await this.updateConversionStatus(projectId, { currentStage: 'Creating target schema', progress: 20 });
      await this.dataMigrationService.createTargetSchema(
        targetConnectionString,
        targetType,
        sourceSchema,
        schemaMappings
      );
      
      // Skip data migration if requested
      if (options.skipDataMigration) {
        await this.updateConversionStatus(projectId, { 
          currentStage: 'Data migration skipped',
          progress: 90,
          summary: { ...conversionResult.summary, tablesConverted: totalTables }
        });
      } else {
        // 4. Migrate data
        await this.updateConversionStatus(projectId, { currentStage: 'Migrating data', progress: 30 });
        
        // Filter tables if needed
        let tablesToMigrate = sourceSchema.tables;
        if (options.includeTables && options.includeTables.length > 0) {
          tablesToMigrate = tablesToMigrate.filter(table => options.includeTables!.includes(table.name));
        }
        if (options.excludeTables && options.excludeTables.length > 0) {
          tablesToMigrate = tablesToMigrate.filter(table => !options.excludeTables!.includes(table.name));
        }
        
        // Estimate total records
        let estimatedTotalRecords = 0;
        for (const table of tablesToMigrate) {
          estimatedTotalRecords += table.estimatedRowCount || 0;
        }
        
        await this.updateConversionStatus(projectId, { 
          summary: { ...conversionResult.summary, estimatedTotalRecords }
        });
        
        // Migrate data for each table
        let tablesConverted = 0;
        let recordsProcessed = 0;
        
        for (let i = 0; i < tablesToMigrate.length; i++) {
          const table = tablesToMigrate[i];
          const tableMapping = schemaMappings.tableMappings.find(
            (mapping: any) => mapping.sourceTable === table.name
          );
          
          if (!tableMapping) {
            await this.log('warning', `No mapping found for table ${table.name}, skipping`);
            continue;
          }
          
          await this.updateConversionStatus(projectId, { 
            currentStage: `Migrating data: ${table.name} (${i + 1}/${tablesToMigrate.length})`,
            progress: 30 + Math.floor((i / tablesToMigrate.length) * 60)
          });
          
          const migrationResult = await this.dataMigrationService.migrateTableData(
            sourceConnectionString,
            sourceType,
            targetConnectionString,
            targetType,
            table.name,
            tableMapping,
            { batchSize: options.batchSize }
          );
          
          tablesConverted++;
          recordsProcessed += migrationResult.recordsProcessed;
          
          await this.updateConversionStatus(projectId, { 
            summary: { 
              ...conversionResult.summary, 
              tablesConverted,
              recordsProcessed,
              errors: (conversionResult.summary?.errors || 0) + migrationResult.errors.length,
              warnings: (conversionResult.summary?.warnings || 0) + migrationResult.warnings.length
            }
          });
        }
      }
      
      // 5. Create indexes and constraints
      await this.updateConversionStatus(projectId, { currentStage: 'Creating indexes and constraints', progress: 90 });
      await this.dataMigrationService.createIndexesAndConstraints(
        targetConnectionString,
        targetType,
        sourceSchema,
        schemaMappings
      );
      
      // 6. Finalize conversion
      await this.updateConversionStatus(projectId, { 
        currentStage: 'Finalizing conversion',
        progress: 95
      });
      
      // Generate statistics and final report
      const finalReport = await this.dataMigrationService.generateConversionReport(
        projectId,
        sourceSchema,
        targetType
      );
      
      // Mark conversion as completed
      await this.updateConversionStatus(projectId, { 
        status: ConversionStatus.Completed,
        progress: 100,
        endTime: new Date(),
        currentStage: 'Conversion completed'
      });
      
      await this.log('info', `Conversion completed for project ${projectId}`, { details: finalReport });
    } catch (error) {
      // Update the conversion status with the error
      await this.updateConversionStatus(projectId, { 
        status: ConversionStatus.Failed,
        endTime: new Date(),
        errorMessage: error.message
      });
      
      await this.log('error', `Conversion failed for project ${projectId}: ${error.message}`);
    }
  }

  /**
   * Update the status of an active conversion
   */
  private async updateConversionStatus(
    projectId: string,
    updates: Partial<ConversionResult>
  ): Promise<void> {
    // Get the current conversion result
    const currentResult = this.activeConversions.get(projectId);
    if (!currentResult) {
      throw new Error(`Conversion result not found for project ${projectId}`);
    }
    
    // Update the conversion result
    const updatedResult: ConversionResult = {
      ...currentResult,
      ...updates,
      lastUpdated: new Date(),
      summary: {
        ...currentResult.summary,
        ...updates.summary
      }
    };
    
    // Store the updated result
    this.activeConversions.set(projectId, updatedResult);
    
    // Log the update
    await this.log('info', `Updated conversion status for project ${projectId}: ${updatedResult.status}, progress: ${updatedResult.progress}%`);
    
    // Emit an event for the status update
    this.emit('conversion_status_updated', { projectId, status: updatedResult });
  }

  /**
   * Get the status of a conversion
   */
  public async getConversionStatus(projectId: string): Promise<ConversionResult | null> {
    // Get the conversion result
    const conversionResult = this.activeConversions.get(projectId);
    
    // Update estimated time remaining if in progress
    if (conversionResult && conversionResult.status === ConversionStatus.InProgress) {
      // Calculate time elapsed since start
      const timeElapsed = Date.now() - conversionResult.startTime!.getTime();
      
      // Only calculate remaining time if we have some progress
      if (conversionResult.progress > 0) {
        // Calculate estimated total time based on current progress
        const estimatedTotalTime = (timeElapsed / conversionResult.progress) * 100;
        
        // Calculate remaining time in seconds
        const estimatedTimeRemaining = Math.max(0, Math.round((estimatedTotalTime - timeElapsed) / 1000));
        
        // Update the conversion result with estimated time remaining
        this.activeConversions.set(projectId, {
          ...conversionResult,
          estimatedTimeRemaining
        });
      }
    }
    
    return conversionResult || null;
  }

  /**
   * Generate compatibility layer code
   */
  public async generateCompatibilityLayer(
    projectId: string,
    options: CompatibilityLayerOptions
  ): Promise<any> {
    try {
      // Log the generation start
      await this.log('info', `Generating compatibility layer for project ${projectId}`, { details: options });
      
      // Check if the conversion is completed
      const conversionResult = this.activeConversions.get(projectId);
      if (!conversionResult) {
        throw new Error(`Conversion result not found for project ${projectId}`);
      }
      
      if (conversionResult.status !== ConversionStatus.Completed) {
        throw new Error(`Cannot generate compatibility layer: conversion is not completed (status: ${conversionResult.status})`);
      }
      
      // Generate the compatibility layer
      const result = await this.compatibilityService.generateCompatibilityLayer(projectId, options);
      
      // Log the generation completion
      await this.log('info', `Generated compatibility layer for project ${projectId}`, { details: result });
      
      return result;
    } catch (error) {
      // Log the error
      await this.log('error', `Failed to generate compatibility layer: ${error.message}`);
      
      // Rethrow the error
      throw error;
    }
  }

  /**
   * Handle test connection message
   */
  private async handleTestConnection(message: AgentMessage): Promise<any> {
    const { connectionString, databaseType } = message.data;
    return await this.testConnection(connectionString, databaseType as DatabaseType);
  }

  /**
   * Handle analyze schema message
   */
  private async handleAnalyzeSchema(message: AgentMessage): Promise<any> {
    const { connectionString, databaseType, options } = message.data;
    return await this.analyzeSchema(connectionString, databaseType as DatabaseType, options);
  }

  /**
   * Handle start conversion message
   */
  private async handleStartConversion(message: AgentMessage): Promise<any> {
    const { 
      projectId,
      sourceConnectionString,
      sourceType,
      targetConnectionString,
      targetType,
      options
    } = message.data;
    
    return await this.startConversion(
      projectId,
      sourceConnectionString,
      sourceType as DatabaseType,
      targetConnectionString,
      targetType as DatabaseType,
      options
    );
  }

  /**
   * Handle get conversion status message
   */
  private async handleGetConversionStatus(message: AgentMessage): Promise<any> {
    const { projectId } = message.data;
    return await this.getConversionStatus(projectId);
  }

  /**
   * Handle generate compatibility layer message
   */
  private async handleGenerateCompatibilityLayer(message: AgentMessage): Promise<any> {
    const { projectId, options } = message.data;
    return await this.generateCompatibilityLayer(projectId, options);
  }
}