/**
 * Base Agent abstract class
 *
 * Provides the foundation for all agent types in the Terrafusion platform.
 */

import { IStorage } from '../services/storage-interface';
import { AgentConfig, AgentCapability, AgentStatus } from '../models/agent-types';
import { LLMService } from '../services/llm-service';

export abstract class BaseAgent {
  protected id: string;
  protected name: string;
  protected description: string;
  protected config: AgentConfig;
  protected capabilities: Map<string, AgentCapability>;
  protected status: AgentStatus;
  protected storage: IStorage;
  protected llmService: LLMService;

  constructor(
    id: string,
    name: string,
    description: string,
    config: AgentConfig,
    storage: IStorage,
    llmService: LLMService
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.config = config;
    this.capabilities = new Map();
    this.status = AgentStatus.INITIALIZING;
    this.storage = storage;
    this.llmService = llmService;
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    this.registerCapabilities();
    this.status = AgentStatus.READY;
  }

  /**
   * Get agent identifier
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Get agent name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get agent description
   */
  public getDescription(): string {
    return this.description;
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
    return this.config;
  }

  /**
   * Set agent status
   */
  protected setStatus(status: AgentStatus): void {
    this.status = status;
  }

  /**
   * Register a capability for this agent
   */
  protected registerCapability(capability: AgentCapability): void {
    this.capabilities.set(capability.id, capability);
  }

  /**
   * Get all registered capabilities
   */
  public getCapabilities(): AgentCapability[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Check if agent has a specific capability
   */
  public hasCapability(capabilityId: string): boolean {
    return this.capabilities.has(capabilityId);
  }

  /**
   * Execute a specific capability
   */
  public async executeCapability(capabilityId: string, params: Record<string, any>): Promise<any> {
    if (!this.hasCapability(capabilityId)) {
      throw new Error(`Agent ${this.name} does not have capability: ${capabilityId}`);
    }

    const capability = this.capabilities.get(capabilityId);
    if (!capability || !capability.handler) {
      throw new Error(`Capability ${capabilityId} exists but has no handler`);
    }

    try {
      this.status = AgentStatus.WORKING;
      const result = await capability.handler(params);
      this.status = AgentStatus.READY;
      return result;
    } catch (error) {
      this.status = AgentStatus.ERROR;
      throw error;
    }
  }

  /**
   * Register agent capabilities
   * Must be implemented by each agent subclass
   */
  protected abstract registerCapabilities(): void;
}
