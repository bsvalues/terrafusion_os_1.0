/**
 * Agent Service
 *
 * Provides a centralized service for managing agents and their lifecycle.
 */

import { BaseAgent } from '../agents/base-agent';
import { AgentStatus } from '../models/agent-types';
import { IStorage } from './storage-interface';

/**
 * Agent service configuration
 */
export interface AgentServiceConfig {
  /**
   * Storage provider for agent data
   */
  storage: IStorage;

  /**
   * Time interval in milliseconds for agent health checks
   */
  healthCheckInterval?: number;

  /**
   * Whether to automatically recover agents in error state
   */
  autoRecovery?: boolean;
}

/**
 * Agent service interface
 */
export class AgentService {
  private agents: Map<string, BaseAgent> = new Map();
  private storage: IStorage;
  private healthCheckInterval: number;
  private autoRecovery: boolean;
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor(config: AgentServiceConfig) {
    this.storage = config.storage;
    this.healthCheckInterval = config.healthCheckInterval || 60000; // Default: 1 minute
    this.autoRecovery = config.autoRecovery || true;
  }

  /**
   * Initialize the agent service
   */
  public async initialize(): Promise<void> {
    await this.storage.initialize();

    // Start health check timer
    this.startHealthChecks();
  }

  /**
   * Register an agent with the service
   */
  public registerAgent(agent: BaseAgent): boolean {
    if (this.agents.has(agent.getId())) {
      return false;
    }

    this.agents.set(agent.getId(), agent);
    return true;
  }

  /**
   * Unregister an agent from the service
   */
  public unregisterAgent(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  /**
   * Get an agent by ID
   */
  public getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   */
  public getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent status
   */
  public getAgentStatus(agentId: string): AgentStatus | undefined {
    const agent = this.getAgent(agentId);
    return agent?.getStatus();
  }

  /**
   * Execute a capability on an agent
   */
  public async executeCapability(
    agentId: string,
    capabilityId: string,
    params: Record<string, any>
  ): Promise<any> {
    const agent = this.getAgent(agentId);

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    return agent.executeCapability(capabilityId, params);
  }

  /**
   * Start the health check timer
   */
  private startHealthChecks(): void {
    if (this.healthCheckTimer) {
      return;
    }

    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);
  }

  /**
   * Stop the health check timer
   */
  private stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Perform health checks on all agents
   */
  private performHealthChecks(): void {
    for (const [id, agent] of this.agents.entries()) {
      try {
        const status = agent.getStatus();

        // If agent is in error state and auto-recovery is enabled
        if (status === AgentStatus.ERROR && this.autoRecovery) {
          this.recoverAgent(id);
        }
      } catch (error) {
        console.error(`Error performing health check for agent ${id}:`, error);
      }
    }
  }

  /**
   * Attempt to recover an agent in error state
   */
  private async recoverAgent(agentId: string): Promise<boolean> {
    const agent = this.getAgent(agentId);

    if (!agent) {
      return false;
    }

    try {
      await agent.initialize();
      return true;
    } catch (error) {
      console.error(`Failed to recover agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Clean up resources when shutting down
   */
  public shutdown(): void {
    this.stopHealthChecks();
    this.agents.clear();
  }
}
