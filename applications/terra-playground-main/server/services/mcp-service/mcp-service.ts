/**
 * Master Control Program (MCP) Service
 *
 * Provides centralized control and coordination of system capabilities.
 * Acts as the command and control center for the TaxI_AI platform.
 */

import { IStorage } from '../../storage';
import { EventEmitter } from 'events';

// Tool Registration interface
export interface ToolRegistration {
  toolName: string;
  description: string;
  handler: (params: any) => Promise<any>;
  permissions?: string[];
  requiresAuthentication?: boolean;
}

// MCP Configuration interface
export interface MCPConfiguration {
  enableLogging?: boolean;
  maxConcurrentTools?: number;
  toolExecutionTimeout?: number; // in milliseconds
}

/**
 * Master Control Program Service
 */
export class MCPService {
  private storage: IStorage;
  private tools: Map<string, ToolRegistration>;
  private eventEmitter: EventEmitter;
  private config: MCPConfiguration;

  constructor(storage: IStorage, config?: MCPConfiguration) {
    this.storage = storage;
    this.tools = new Map();
    this.eventEmitter = new EventEmitter();
    this.config = {
      enableLogging: true,
      maxConcurrentTools: 10,
      toolExecutionTimeout: 30000,
      ...config,
    };
  }

  /**
   * Initialize the MCP Service
   */
  async initialize(): Promise<void> {
    // Register core tools
    this.registerCoreTool('system.getStatus', this.getSystemStatus.bind(this));
    this.registerCoreTool('system.registerAgent', this.registerAgent.bind(this));
    this.registerCoreTool('system.getToolRegistry', this.getToolRegistry.bind(this));
  }

  /**
   * Register a tool with the MCP
   */
  registerTool(registration: ToolRegistration): void {
    this.tools.set(registration.toolName, registration);
    // Emit registration event
    this.eventEmitter.emit('tool.registered', registration.toolName);
  }

  /**
   * Register a core system tool
   */
  private registerCoreTool(toolName: string, handler: (params: any) => Promise<any>): void {
    this.registerTool({
      toolName,
      description: `Core system tool: ${toolName}`,
      handler,
      requiresAuthentication: false,
    });
  }

  /**
   * Execute a tool
   */
  async executeTool(toolName: string, params: any = {}): Promise<any> {
    // Check if the tool exists
    if (!this.tools.has(toolName)) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    const tool = this.tools.get(toolName)!;

    // Log the tool execution if enabled
    if (this.config.enableLogging) {
      // Create a system activity
      try {
        await this.storage.createSystemActivity({
          activity: `Tool execution: ${toolName}`,
          entityType: 'mcp_tool',
          entityId: toolName,
          component: 'MCP',
          details: { params },
        });
      } catch (error) {
        console.error('Error logging tool execution:', error);
      }
    }

    try {
      // Execute the tool with timeout
      const result = await Promise.race([
        tool.handler(params),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Tool execution timeout: ${toolName}`)),
            this.config.toolExecutionTimeout
          )
        ),
      ]);

      // Log successful execution
      if (this.config.enableLogging) {
      }

      return result;
    } catch (error) {
      // Log error
      console.error(`Error executing tool ${toolName}:`, error);

      // Create error activity
      if (this.config.enableLogging) {
        try {
          await this.storage.createSystemActivity({
            activity: `Tool execution error: ${toolName}`,
            entityType: 'mcp_tool',
            entityId: toolName,
            component: 'MCP',
            status: 'error',
            details: { params, error: error.message },
          });
        } catch (logError) {
          console.error('Error logging tool execution error:', logError);
        }
      }

      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }

  /**
   * Get the list of registered tools
   */
  private async getToolRegistry(): Promise<any> {
    const registry: Record<string, { description: string; requiresAuthentication: boolean }> = {};

    this.tools.forEach((tool, toolName) => {
      registry[toolName] = {
        description: tool.description,
        requiresAuthentication: !!tool.requiresAuthentication,
      };
    });

    return { registry };
  }

  /**
   * Get the system status
   */
  private async getSystemStatus(): Promise<any> {
    return {
      status: 'online',
      time: new Date().toISOString(),
      registeredTools: this.tools.size,
      version: '1.0.0',
    };
  }

  /**
   * Register an agent with the system
   */
  private async registerAgent(params: any): Promise<any> {
    const { agentId, agentName, agentType, capabilities } = params;

    if (!agentId || !agentName || !agentType) {
      throw new Error('Missing required agent registration parameters');
    }

    // Log agent registration
    try {
      await this.storage.createSystemActivity({
        activity: `Agent registered: ${agentName}`,
        entityType: 'agent',
        entityId: agentId,
        component: 'MCP',
        details: { agentType, capabilities },
      });
    } catch (error) {
      console.error('Error logging agent registration:', error);
    }

    return { success: true, agentId };
  }

  /**
   * Subscribe to an MCP event
   */
  subscribe(event: string, callback: (...args: any[]) => void): () => void {
    this.eventEmitter.on(event, callback);

    // Return unsubscribe function
    return () => {
      this.eventEmitter.off(event, callback);
    };
  }

  /**
   * Publish an MCP event
   */
  publish(event: string, ...args: any[]): void {
    this.eventEmitter.emit(event, ...args);
  }

  /**
   * Get the MCP configuration
   */
  getConfig(): MCPConfiguration {
    return { ...this.config };
  }
}
