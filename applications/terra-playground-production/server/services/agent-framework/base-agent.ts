/**
 * Base Agent Framework
 *
 * Provides the foundation for all AI agents in the system.
 * Defines common capabilities, communication patterns, and lifecycle management.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { IStorage } from '../../storage';
import { MCPService } from '../mcp-service/mcp-service';

// Type for agent capability
export interface AgentCapability {
  name: string;
  description: string;
  handler: (params: any) => Promise<any>;
}

// Agent permission type
export interface AgentPermission {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'execute';
  conditions?: any;
}

// Agent configuration interface
export interface AgentConfig {
  id?: string;
  name: string;
  type: string;
  description: string;
  capabilities: string[] | AgentCapability[];
  permissions?: AgentPermission[];
  version?: string;
  author?: string;
  icon?: string;
}

// Agent Status type
export type AgentStatus = 'initializing' | 'ready' | 'busy' | 'error' | 'offline';

/**
 * Base Agent class
 * All specialized agents should extend this class
 */
export abstract class BaseAgent {
  protected id: string;
  protected config: AgentConfig;
  protected status: AgentStatus;
  protected storage: IStorage;
  protected mcpService: MCPService;
  protected eventEmitter: EventEmitter;
  protected messageHandlers: Map<string, (message: any) => Promise<any>>;
  protected capabilityHandlers: Map<string, (params: any) => Promise<any>>;

  constructor(storage: IStorage, mcpService: MCPService, config?: AgentConfig) {
    this.id = uuidv4();
    this.storage = storage;
    this.mcpService = mcpService;
    this.eventEmitter = new EventEmitter();
    this.messageHandlers = new Map();
    this.capabilityHandlers = new Map();
    this.status = 'initializing';

    if (config) {
      this.config = {
        ...config,
        id: config.id || this.id,
      };
    } else {
      this.config = {
        id: this.id,
        name: 'Base Agent',
        type: 'base',
        description: 'Base agent implementation',
        capabilities: [],
        permissions: [],
      };
    }
  }

  /**
   * Initialize the agent
   */
  public async initialize(config?: AgentConfig): Promise<void> {
    if (config) {
      this.config = {
        ...config,
        id: config.id || this.id,
      };
    }

    // Register the agent with the system
    await this.registerWithSystem();

    // Register capabilities
    this.registerCapabilities();

    // Set status to ready
    this.status = 'ready';

    // Log initialization
    await this.logActivity('initialization', `Agent ${this.config.name} initialized`);
  }

  /**
   * Register the agent with the system
   */
  private async registerWithSystem(): Promise<void> {
    try {
      // Registration logic would go here
      // For now, we'll just log it
      registered with the system`);
    } catch (error) {
      console.error('Error registering agent:', error);
      this.status = 'error';
      throw new Error(`Failed to register agent: ${error.message}`);
    }
  }

  /**
   * Register capabilities with the system
   */
  private registerCapabilities(): void {
    if (Array.isArray(this.config.capabilities)) {
      this.config.capabilities.forEach(capability => {
        if (typeof capability === 'string') {
          // String-based capability registration
          `);
        } else {
          // Object-based capability with handler
          this.capabilityHandlers.set(capability.name, capability.handler);
          }
      });
    }
  }

  /**
   * Log agent activity
   */
  protected async logActivity(
    activityType: string,
    description: string,
    details?: any
  ): Promise<void> {
    try {
      await this.storage.createSystemActivity({
        agentId: parseInt(this.id),
        activity: description,
        entityType: 'agent',
        entityId: this.id,
        component: this.config.name,
        details: details || {},
      });
    } catch (error) {
      console.error('Error logging agent activity:', error);
    }
  }

  /**
   * Register a message handler
   */
  public registerMessageHandler(
    messageType: string,
    handler: (message: any) => Promise<any>
  ): void {
    this.messageHandlers.set(messageType, handler);
    }

  /**
   * Handle an incoming message
   */
  public async handleMessage(message: any): Promise<any> {
    const messageType = message.type || 'unknown';

    // Update status
    this.status = 'busy';

    try {
      // Check if we have a handler for this message type
      if (this.messageHandlers.has(messageType)) {
        const handler = this.messageHandlers.get(messageType)!;
        const result = await handler(message);

        // Reset status
        this.status = 'ready';

        return result;
      } else {
        console.warn(`No handler registered for message type: ${messageType}`);
        this.status = 'ready';
        return { error: `Unsupported message type: ${messageType}` };
      }
    } catch (error) {
      console.error(`Error handling message of type ${messageType}:`, error);
      this.status = 'error';

      // Log the error
      await this.logActivity('error', `Error handling message: ${error.message}`, { messageType });

      // Reset status after error
      setTimeout(() => {
        this.status = 'ready';
      }, 5000);

      return { error: `Error processing message: ${error.message}` };
    }
  }

  /**
   * Execute a capability
   */
  public async executeCapability(capabilityName: string, params: any): Promise<any> {
    // Update status
    this.status = 'busy';

    try {
      // Check if we have this capability
      if (this.capabilityHandlers.has(capabilityName)) {
        const handler = this.capabilityHandlers.get(capabilityName)!;
        const result = await handler(params);

        // Reset status
        this.status = 'ready';

        return result;
      } else {
        console.warn(`No handler registered for capability: ${capabilityName}`);
        this.status = 'ready';
        return { error: `Unsupported capability: ${capabilityName}` };
      }
    } catch (error) {
      console.error(`Error executing capability ${capabilityName}:`, error);
      this.status = 'error';

      // Log the error
      await this.logActivity('error', `Error executing capability: ${error.message}`, {
        capabilityName,
      });

      // Reset status after error
      setTimeout(() => {
        this.status = 'ready';
      }, 5000);

      return { error: `Error executing capability: ${error.message}` };
    }
  }

  /**
   * Get agent ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Get agent name
   */
  public getName(): string {
    return this.config.name;
  }

  /**
   * Get agent type
   */
  public getType(): string {
    return this.config.type;
  }

  /**
   * Get agent status
   */
  public getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Get agent configuration
   */
  public getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Get agent capabilities
   */
  public getCapabilities(): string[] {
    if (Array.isArray(this.config.capabilities)) {
      return this.config.capabilities.map(cap => (typeof cap === 'string' ? cap : cap.name));
    }
    return [];
  }

  /**
   * Execute an MCP tool
   */
  protected async executeMCPTool(toolName: string, params: any): Promise<any> {
    try {
      return await this.mcpService.executeTool(toolName, params);
    } catch (error) {
      console.error(`Error executing MCP tool ${toolName}:`, error);
      throw new Error(`Failed to execute tool ${toolName}: ${error.message}`);
    }
  }
}

