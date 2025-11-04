/**
 * AgentRegistry.ts
 *
 * Central registry for all agents in the system
 * Handles agent registration, discovery, and lifecycle management
 */

import { EventEmitter } from 'events';
import { BaseAgent } from './BaseAgent';
import {
  AgentRegistryEntry,
  AgentStatus,
  AgentCapability,
  AgentType,
  AgentEventType,
} from './types';
import { LogService } from './LogService';

/**
 * AgentRegistry class
 * Singleton registry for all agents in the system
 */
export class AgentRegistry extends EventEmitter {
  private static instance: AgentRegistry;
  private agents: Map<string, BaseAgent>;
  private registry: Map<string, AgentRegistryEntry>;
  private logger: LogService;

  /**
   * Private constructor (use getInstance)
   */
  private constructor() {
    super();
    this.agents = new Map<string, BaseAgent>();
    this.registry = new Map<string, AgentRegistryEntry>();
    this.logger = new LogService('AgentRegistry');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Register an agent with the registry
   * @param agent Agent to register
   */
  public registerAgent(agent: BaseAgent): boolean {
    try {
      const info = agent.getInfo();
      const id = info.id;

      if (this.agents.has(id)) {
        this.logger.warn(`Agent with ID ${id} already registered`);
        return false;
      }

      // Store agent instance
      this.agents.set(id, agent);

      // Create registry entry
      const entry: AgentRegistryEntry = {
        id,
        name: info.name,
        type: info.type,
        status: info.status,
        capabilities: info.capabilities,
        priority: info.priority,
        lastActive: new Date(),
        metadata: info.metadata,
      };

      this.registry.set(id, entry);

      // Setup event listeners for the agent
      this.setupAgentListeners(agent);

      this.logger.info(`Registered agent: ${info.name} (${id})`);
      this.emit(AgentEventType.CAPABILITY_ADDED, { agentId: id, capabilities: info.capabilities });

      return true;
    } catch (error) {
      this.logger.error(
        `Error registering agent: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  /**
   * Unregister an agent from the registry
   * @param agentId ID of agent to unregister
   */
  public unregisterAgent(agentId: string): boolean {
    try {
      if (!this.agents.has(agentId)) {
        this.logger.warn(`Agent with ID ${agentId} not found`);
        return false;
      }

      const agent = this.agents.get(agentId);
      const info = agent!.getInfo();

      // Remove event listeners
      // (This depends on the agent implementation - may need to be expanded)

      // Remove agent from maps
      this.agents.delete(agentId);
      this.registry.delete(agentId);

      this.logger.info(`Unregistered agent: ${info.name} (${agentId})`);
      this.emit(AgentEventType.CAPABILITY_REMOVED, { agentId, capabilities: info.capabilities });

      return true;
    } catch (error) {
      this.logger.error(
        `Error unregistering agent: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  /**
   * Setup event listeners for an agent
   * @param agent Agent to listen to
   */
  private setupAgentListeners(agent: BaseAgent): void {
    const info = agent.getInfo();
    const id = info.id;

    // Listen for agent status changes and other events

    // Start event
    agent.on('start', data => {
      this.updateAgentStatus(id, AgentStatus.RUNNING);
      this.updateLastActive(id);
      this.emit(AgentEventType.STARTED, { agentId: id, ...data });
    });

    // Pause event
    agent.on('pause', data => {
      this.updateAgentStatus(id, AgentStatus.PAUSED);
      this.updateLastActive(id);
      this.emit(AgentEventType.PAUSED, { agentId: id, ...data });
    });

    // Resume event
    agent.on('resume', data => {
      this.updateAgentStatus(id, AgentStatus.RUNNING);
      this.updateLastActive(id);
      this.emit(AgentEventType.RESUMED, { agentId: id, ...data });
    });

    // Shutdown event
    agent.on('shutdown', data => {
      this.updateAgentStatus(id, AgentStatus.STOPPED);
      this.updateLastActive(id);
      this.emit(AgentEventType.SHUTDOWN, { agentId: id, ...data });
    });
  }

  /**
   * Update an agent's status in the registry
   * @param agentId Agent ID
   * @param status New status
   */
  public updateAgentStatus(agentId: string, status: AgentStatus): void {
    const entry = this.registry.get(agentId);
    if (entry) {
      entry.status = status;
      entry.lastActive = new Date();
      this.emit(AgentEventType.STATE_CHANGED, { agentId, status });
    }
  }

  /**
   * Update an agent's last active time
   * @param agentId Agent ID
   */
  private updateLastActive(agentId: string): void {
    const entry = this.registry.get(agentId);
    if (entry) {
      entry.lastActive = new Date();
    }
  }

  /**
   * Get all registered agents
   * @returns List of agent registry entries
   */
  public getAllAgents(): AgentRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  /**
   * Get agent by ID
   * @param agentId Agent ID
   * @returns Agent registry entry or null if not found
   */
  public getAgentById(agentId: string): AgentRegistryEntry | null {
    return this.registry.get(agentId) || null;
  }

  /**
   * Get agent instance by ID
   * @param agentId Agent ID
   * @returns Agent instance or null if not found
   */
  public getAgentInstanceById(agentId: string): BaseAgent | null {
    return this.agents.get(agentId) || null;
  }

  /**
   * Find agents by capability
   * @param capability Capability to search for
   * @returns List of agent registry entries with the capability
   */
  public findAgentsByCapability(capability: AgentCapability): AgentRegistryEntry[] {
    return Array.from(this.registry.values()).filter(entry =>
      entry.capabilities.includes(capability)
    );
  }

  /**
   * Find agents by type
   * @param type Agent type to search for
   * @returns List of agent registry entries of the specified type
   */
  public findAgentsByType(type: AgentType): AgentRegistryEntry[] {
    return Array.from(this.registry.values()).filter(entry => entry.type === type);
  }

  /**
   * Find agents by status
   * @param status Status to search for
   * @returns List of agent registry entries with the specified status
   */
  public findAgentsByStatus(status: AgentStatus): AgentRegistryEntry[] {
    return Array.from(this.registry.values()).filter(entry => entry.status === status);
  }

  /**
   * Start all registered agents
   * @returns Map of agent IDs to start success (boolean)
   */
  public async startAllAgents(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const [id, agent] of this.agents.entries()) {
      results.set(id, await agent.start());
    }

    return results;
  }

  /**
   * Stop all registered agents
   * @param force Whether to force shutdown
   * @returns Map of agent IDs to stop success (boolean)
   */
  public async stopAllAgents(force: boolean = false): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const [id, agent] of this.agents.entries()) {
      results.set(id, await agent.shutdown(force));
    }

    return results;
  }
}
