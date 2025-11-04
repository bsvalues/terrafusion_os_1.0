/**
 * Model Context Protocol (MCP) Service
 *
 * The MCP service provides a secure and controlled interface for AI agents to access
 * various data sources and external systems. It enforces permissions, validates requests,
 * and manages the execution context for all agent operations.
 */

import { IStorage } from '../storage';
import { InsertSystemActivity, MCPToolExecutionLog } from '../../shared/schema';

/**
 * Request to execute an MCP tool
 */
export interface MCPRequest {
  tool: string;
  parameters: any;
  agentId?: number;
  userId?: number;
}

/**
 * MCP execution context
 */
export interface MCPExecutionContext {
  agentId?: number;
  userId?: number;
  isAuthenticated: boolean;
  permissions: string[];
  requestId: string;
  startTime: Date;
}

/**
 * MCP tool interface
 */
export interface MCPTool {
  name: string;
  description: string;
  requiredPermissions: string[];
  execute: (parameters: any, context: MCPExecutionContext) => Promise<any>;
}

/**
 * MCP execution result
 */
export interface MCPResult {
  success: boolean;
  result?: any;
  error?: string;
  context: {
    tool: string;
    requestId: string;
    startTime: Date;
    endTime: Date;
    duration: number;
  };
}

/**
 * MCP Service class
 */
export class MCPService {
  private tools: Map<string, MCPTool> = new Map();
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
    // Initialize core tools asynchronously
    this.initializeCoreTools();
  }

  /**
   * Initialize core tools asynchronously
   */
  private async initializeCoreTools(): Promise<void> {
    try {
      await this.registerCoreTools();
    } catch (error: any) {
      console.error('Error initializing core MCP tools:', error.message);
    }
  }

  /**
   * Register an MCP tool
   */
  public async registerTool(tool: MCPTool): Promise<void> {
    this.tools.set(tool.name, tool);
  }

  /**
   * Unregister an MCP tool
   */
  public unregisterTool(toolName: string): boolean {
    return this.tools.delete(toolName);
  }

  /**
   * Get available tools based on permissions
   */
  public getAvailableTools(permissions: string[]): MCPTool[] {
    const available: MCPTool[] = [];

    for (const tool of this.tools.values()) {
      // Check if all required permissions are present
      const hasPermissions = tool.requiredPermissions.every(permission =>
        permissions.includes(permission)
      );

      if (hasPermissions) {
        available.push(tool);
      }
    }

    return available;
  }

  /**
   * Execute an MCP tool
   */
  public async executeTool(request: MCPRequest, context: MCPExecutionContext): Promise<MCPResult> {
    const startTime = new Date();
    const tool = this.tools.get(request.tool);

    // Create context if not provided
    if (!context) {
      context = {
        agentId: request.agentId,
        userId: request.userId,
        isAuthenticated: true, // Default to authenticated for now
        permissions: ['authenticated'], // Default minimum permissions
        requestId: `req-${Date.now()}`,
        startTime,
      };
    }

    // Prepare the result context
    const resultContext = {
      tool: request.tool,
      requestId: context.requestId,
      startTime,
      endTime: new Date(),
      duration: 0,
    };

    try {
      // Check if the tool exists
      if (!tool) {
        throw new Error(`Tool '${request.tool}' not found`);
      }

      // Check permissions
      const hasPermissions = tool.requiredPermissions.every(permission =>
        context.permissions.includes(permission)
      );

      if (!hasPermissions) {
        throw new Error(`Insufficient permissions to execute tool '${request.tool}'`);
      }

      // Log the execution start
      await this.logExecution(request, context, 'starting');

      // Execute the tool
      const result = await tool.execute(request.parameters, context);

      // Update result context
      resultContext.endTime = new Date();
      resultContext.duration = resultContext.endTime.getTime() - startTime.getTime();

      // Log successful execution
      await this.logExecution(request, context, 'success', result);

      return {
        success: true,
        result,
        context: resultContext,
      };
    } catch (error) {
      // Update result context
      resultContext.endTime = new Date();
      resultContext.duration = resultContext.endTime.getTime() - startTime.getTime();

      // Log error
      await this.logExecution(request, context, 'error', null, error.message);

      return {
        success: false,
        error: error.message,
        context: resultContext,
      };
    }
  }

  /**
   * Register core MCP tools
   */
  private async registerCoreTools(): Promise<void> {
    // Property tools
    this.registerTool({
      name: 'property.getAll',
      description: 'Get all properties, optionally filtered',
      requiredPermissions: ['authenticated', 'property.read'],
      execute: async (parameters, context) => {
        // Implement property retrieval logic
        const properties = await this.storage.getAllProperties(parameters);
        return properties;
      },
    });

    this.registerTool({
      name: 'property.getById',
      description: 'Get a property by its internal ID',
      requiredPermissions: ['authenticated', 'property.read'],
      execute: async (parameters, context) => {
        if (!parameters.id) {
          throw new Error('Property ID is required');
        }

        const property = await this.storage.getPropertyById(parameters.id);

        if (!property) {
          throw new Error(`Property with ID ${parameters.id} not found`);
        }

        return property;
      },
    });

    this.registerTool({
      name: 'property.getByPropertyId',
      description: 'Get a property by its property ID (external identifier)',
      requiredPermissions: ['authenticated', 'property.read'],
      execute: async (parameters, context) => {
        if (!parameters.propertyId) {
          throw new Error('Property ID is required');
        }

        const property = await this.storage.getPropertyByPropertyId(parameters.propertyId);

        if (!property) {
          throw new Error(`Property with property ID ${parameters.propertyId} not found`);
        }

        return property;
      },
    });

    this.registerTool({
      name: 'property.create',
      description: 'Create a new property',
      requiredPermissions: ['authenticated', 'property.write'],
      execute: async (parameters, context) => {
        // Validate required fields
        if (!parameters.propertyId) {
          throw new Error('Property ID is required');
        }

        // Check if property already exists
        const existing = await this.storage.getPropertyByPropertyId(parameters.propertyId);

        if (existing) {
          throw new Error(`Property with property ID ${parameters.propertyId} already exists`);
        }

        // Create the property
        const property = await this.storage.createProperty(parameters);
        return property;
      },
    });

    this.registerTool({
      name: 'property.update',
      description: 'Update an existing property',
      requiredPermissions: ['authenticated', 'property.write'],
      execute: async (parameters, context) => {
        // Validate required fields
        if (!parameters.propertyId) {
          throw new Error('Property ID is required');
        }

        // Check if property exists
        const existing = await this.storage.getPropertyByPropertyId(parameters.propertyId);

        if (!existing) {
          throw new Error(`Property with property ID ${parameters.propertyId} not found`);
        }

        // Update the property
        const property = await this.storage.updateProperty(
          parameters.propertyId,
          parameters.updates
        );
        return property;
      },
    });

    this.registerTool({
      name: 'property.exists',
      description: 'Check if a property exists by its property ID',
      requiredPermissions: ['authenticated', 'property.read'],
      execute: async (parameters, context) => {
        if (!parameters.propertyId) {
          throw new Error('Property ID is required');
        }

        const property = await this.storage.getPropertyByPropertyId(parameters.propertyId);
        return !!property;
      },
    });

    // Land record tools
    this.registerTool({
      name: 'landRecord.getByPropertyId',
      description: 'Get land records for a property',
      requiredPermissions: ['authenticated', 'property.read'],
      execute: async (parameters, context) => {
        if (!parameters.propertyId) {
          throw new Error('Property ID is required');
        }

        const landRecords = await this.storage.getLandRecordsByPropertyId(parameters.propertyId);
        return landRecords;
      },
    });

    this.registerTool({
      name: 'landRecord.create',
      description: 'Create a new land record',
      requiredPermissions: ['authenticated', 'landrecord.write'],
      execute: async (parameters, context) => {
        // Validate required fields
        if (!parameters.propertyId) {
          throw new Error('Property ID is required');
        }

        // Create the land record
        const landRecord = await this.storage.createLandRecord(parameters);
        return landRecord;
      },
    });

    // Improvement tools
    this.registerTool({
      name: 'improvement.getByPropertyId',
      description: 'Get improvements for a property',
      requiredPermissions: ['authenticated', 'property.read'],
      execute: async (parameters, context) => {
        if (!parameters.propertyId) {
          throw new Error('Property ID is required');
        }

        const improvements = await this.storage.getImprovementsByPropertyId(parameters.propertyId);
        return improvements;
      },
    });

    this.registerTool({
      name: 'improvement.create',
      description: 'Create a new improvement',
      requiredPermissions: ['authenticated', 'improvement.write'],
      execute: async (parameters, context) => {
        // Validate required fields
        if (!parameters.propertyId) {
          throw new Error('Property ID is required');
        }

        // Create the improvement
        const improvement = await this.storage.createImprovement(parameters);
        return improvement;
      },
    });

    // PACS module tools
    this.registerTool({
      name: 'pacsModule.getAll',
      description: 'Get all PACS modules',
      requiredPermissions: ['authenticated', 'pacs.read'],
      execute: async (parameters, context) => {
        const modules = await this.storage.getAllPacsModules();
        return modules;
      },
    });

    this.registerTool({
      name: 'pacsModule.getById',
      description: 'Get a PACS module by ID',
      requiredPermissions: ['authenticated', 'pacs.read'],
      execute: async (parameters, context) => {
        if (!parameters.id) {
          throw new Error('Module ID is required');
        }

        const module = await this.storage.getPacsModuleById(parameters.id);

        if (!module) {
          throw new Error(`PACS module with ID ${parameters.id} not found`);
        }

        return module;
      },
    });

    this.registerTool({
      name: 'pacsModule.upsert',
      description: 'Create or update a PACS module',
      requiredPermissions: ['authenticated', 'pacs.write'],
      execute: async (parameters, context) => {
        // Validate required fields
        if (!parameters.moduleName) {
          throw new Error('Module name is required');
        }

        // Check if module already exists
        const existingModules = await this.storage.getAllPacsModules();
        const existing = existingModules.find(m => m.moduleName === parameters.moduleName);

        // Create or update the module
        const wasUpdated = !!existing;
        const module = await this.storage.upsertPacsModule(parameters);

        return {
          ...module,
          wasUpdated,
        };
      },
    });

    // Import tools
    this.registerTool({
      name: 'import.create',
      description: 'Create a new import record',
      requiredPermissions: ['authenticated', 'import.write'],
      execute: async (parameters, context) => {
        // Validate required fields
        if (
          !parameters.importId ||
          !parameters.source ||
          !parameters.dataType ||
          !parameters.status
        ) {
          throw new Error('Import ID, source, data type, and status are required');
        }

        // Create the import record
        const importRecord = await this.storage.createImport({
          importId: parameters.importId,
          source: parameters.source,
          dataType: parameters.dataType,
          status: parameters.status,
          details: parameters.details || {},
          data: parameters.data || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return importRecord;
      },
    });

    this.registerTool({
      name: 'import.update',
      description: 'Update an import record',
      requiredPermissions: ['authenticated', 'import.write'],
      execute: async (parameters, context) => {
        // Validate required fields
        if (!parameters.importId) {
          throw new Error('Import ID is required');
        }

        // Update the import record
        const importRecord = await this.storage.updateImport(parameters.importId, {
          status: parameters.status,
          details: parameters.details,
          data: parameters.data,
          validationResults: parameters.validationResults,
          loadResults: parameters.loadResults,
          updatedAt: new Date(),
        });

        return importRecord;
      },
    });

    this.registerTool({
      name: 'import.getById',
      description: 'Get an import record by ID',
      requiredPermissions: ['authenticated', 'import.read'],
      execute: async (parameters, context) => {
        if (!parameters.importId) {
          throw new Error('Import ID is required');
        }

        const importRecord = await this.storage.getImportById(parameters.importId);

        if (!importRecord) {
          throw new Error(`Import record with ID ${parameters.importId} not found`);
        }

        return importRecord;
      },
    });

    // Export tools
    this.registerTool({
      name: 'export.create',
      description: 'Create a new export record',
      requiredPermissions: ['authenticated', 'export.write'],
      execute: async (parameters, context) => {
        // Validate required fields
        if (
          !parameters.exportId ||
          !parameters.destination ||
          !parameters.dataType ||
          !parameters.status
        ) {
          throw new Error('Export ID, destination, data type, and status are required');
        }

        // Create the export record
        const exportRecord = await this.storage.createExport({
          exportId: parameters.exportId,
          destination: parameters.destination,
          dataType: parameters.dataType,
          status: parameters.status,
          details: parameters.details || {},
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return exportRecord;
      },
    });

    this.registerTool({
      name: 'export.update',
      description: 'Update an export record',
      requiredPermissions: ['authenticated', 'export.write'],
      execute: async (parameters, context) => {
        // Validate required fields
        if (!parameters.exportId) {
          throw new Error('Export ID is required');
        }

        // Update the export record
        const exportRecord = await this.storage.updateExport(parameters.exportId, {
          status: parameters.status,
          details: parameters.details,
          updatedAt: new Date(),
        });

        return exportRecord;
      },
    });

    // Report tools
    this.registerTool({
      name: 'report.create',
      description: 'Create a new report definition',
      requiredPermissions: ['authenticated', 'report.write'],
      execute: async (parameters, context) => {
        // Validate required fields
        if (!parameters.id || !parameters.name || !parameters.type || !parameters.query) {
          throw new Error('Report ID, name, type, and query are required');
        }

        // Create the report
        const report = await this.storage.createReport(parameters);
        return report;
      },
    });

    this.registerTool({
      name: 'report.run',
      description: 'Run a report and get results',
      requiredPermissions: ['authenticated', 'report.read'],
      execute: async (parameters, context) => {
        if (!parameters.reportId) {
          throw new Error('Report ID is required');
        }

        // Get the report definition
        const report = await this.storage.getReportById(parameters.reportId);

        if (!report) {
          throw new Error(`Report with ID ${parameters.reportId} not found`);
        }

        // In a real implementation, this would execute the report query
        // For now, we'll return a placeholder result
        return {
          reportId: parameters.reportId,
          name: report.name,
          data: [],
          executedAt: new Date(),
        };
      },
    });

    this.registerTool({
      name: 'report.list',
      description: 'List all reports',
      requiredPermissions: ['authenticated', 'report.read'],
      execute: async (parameters, context) => {
        const reports = await this.storage.getAllReports();
        return reports;
      },
    });

    this.registerTool({
      name: 'report.getById',
      description: 'Get a report by ID',
      requiredPermissions: ['authenticated', 'report.read'],
      execute: async (parameters, context) => {
        if (!parameters.reportId) {
          throw new Error('Report ID is required');
        }

        const report = await this.storage.getReportById(parameters.reportId);

        if (!report) {
          throw new Error(`Report with ID ${parameters.reportId} not found`);
        }

        return report;
      },
    });

    // System tools
    this.registerTool({
      name: 'system.getActivities',
      description: 'Get system activities',
      requiredPermissions: ['authenticated', 'system.read'],
      execute: async (parameters, context) => {
        const activities = await this.storage.getSystemActivities(parameters);
        return activities;
      },
    });
  }

  /**
   * Log MCP tool execution
   */
  private async logExecution(
    request: MCPRequest,
    context: MCPExecutionContext,
    status: string,
    result?: any,
    error?: string
  ): Promise<void> {
    try {
      // Create an execution log entry
      const logEntry: MCPToolExecutionLog = {
        id: 0, // Will be set by storage
        toolName: request.tool,
        requestId: context.requestId,
        agentId: context.agentId || null,
        userId: context.userId || null,
        parameters: request.parameters,
        status,
        result: result || null,
        error: error || null,
        startTime: context.startTime,
        endTime: new Date(),
        createdAt: new Date(),
      };

      // Store the log entry
      await this.storage.createMCPToolExecutionLog(logEntry);

      // Also create a system activity
      const activityData: InsertSystemActivity = {
        activity_type: 'mcp_tool_execution',
        component: `mcp:${request.tool}`,
        status: status === 'error' ? 'error' : 'info',
        details: {
          toolName: request.tool,
          requestId: context.requestId,
          agentId: context.agentId,
          userId: context.userId,
          status,
          error,
        },
        created_at: new Date(),
      };

      await this.storage.createSystemActivity(activityData);
    } catch (logError) {
      // Just log to console if there's an error in logging
      console.error('Error logging MCP execution:', logError);
    }
  }
}
