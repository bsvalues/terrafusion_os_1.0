/**
 * Base Agent
 *
 * This abstract class serves as the foundation for all agents in the system.
 * It provides common functionality and interface for communication with the MCP.
 */

import { IStorage } from '../storage';
import { MCPService } from '../services/mcp-service';

/**
 * Abstract base class for all agents
 */
export abstract class BaseAgent {
  protected id: string;
  protected name: string;
  protected storage: IStorage;
  protected mcpService: MCPService;
  protected capabilities: Map<string, Function> = new Map();

  constructor(id: string, name: string, storage: IStorage, mcpService: MCPService) {
    this.id = id;
    this.name = name;
    this.storage = storage;
    this.mcpService = mcpService;
  }

  /**
   * Get the agent's ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Get the agent's name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Register a capability with the MCP service
   */
  protected registerCapability(name: string, handler: Function): void {
    this.capabilities.set(name, handler);
    this.mcpService.registerAgentCapability(this.id, name, handler.bind(this));
  }

  /**
   * Get all registered capabilities
   */
  public getCapabilities(): string[] {
    return Array.from(this.capabilities.keys());
  }

  /**
   * Check if the agent has a specific capability
   */
  public hasCapability(name: string): boolean {
    return this.capabilities.has(name);
  }

  /**
   * Execute a capability
   */
  public async executeCapability(name: string, ...args: any[]): Promise<any> {
    if (!this.hasCapability(name)) {
      throw new Error(`Agent ${this.name} does not have capability: ${name}`);
    }

    const handler = this.capabilities.get(name);
    return handler.apply(this, args);
  }
}
