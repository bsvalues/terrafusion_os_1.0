/**
 * BaseAgent.ts
 *
 * Core abstract class that all agents will extend.
 * Provides standardized interfaces and common functionality.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { AgentStatus, AgentCapability, AgentPriority, AgentType } from './types';
import { LogService } from './LogService';

export abstract class BaseAgent extends EventEmitter {
  protected id: string;
  protected name: string;
  protected type: AgentType;
  protected status: AgentStatus;
  protected capabilities: AgentCapability[];
  protected priority: AgentPriority;
  protected startTime: Date | null;
  protected logger: LogService;
  protected metadata: Record<string, any>;

  /**
   * BaseAgent constructor
   * @param name The human-readable name of the agent
   * @param type The type of agent (domain-specific, task-specific, etc.)
   * @param capabilities Array of agent capabilities
   * @param priority Agent priority level for orchestration
   */
  constructor(
    name: string,
    type: AgentType,
    capabilities: AgentCapability[] = [],
    priority: AgentPriority = AgentPriority.NORMAL
  ) {
    super();
    this.id = uuidv4();
    this.name = name;
    this.type = type;
    this.status = AgentStatus.INITIALIZING;
    this.capabilities = capabilities;
    this.priority = priority;
    this.startTime = null;
    this.logger = new LogService(name);
    this.metadata = {};
  }

  /**
   * Initialize the agent
   * Must be implemented by all agent subclasses
   */
  public abstract async initialize(): Promise<boolean>;

  /**
   * Execute a task with the agent
   * Must be implemented by all agent subclasses
   * @param task The task to execute
   * @param context The context for the task
   */
  public abstract async executeTask(task: any, context?: any): Promise<any>;

  /**
   * Shutdown the agent gracefully
   * @param force Whether to force shutdown without waiting for tasks
   */
  public async shutdown(force: boolean = false): Promise<boolean> {
    if (this.status === AgentStatus.RUNNING) {
      this.status = AgentStatus.SHUTTING_DOWN;
      this.logger.info(`Agent shutting down (force=${force})`);

      // Emit shutdown event for listeners
      this.emit('shutdown', { agentId: this.id, force });

      try {
        // Allow subclasses to implement custom shutdown logic
        await this.onShutdown(force);
        this.status = AgentStatus.STOPPED;
        return true;
      } catch (error) {
        this.logger.error(
          `Error during shutdown: ${error instanceof Error ? error.message : String(error)}`
        );
        if (force) {
          this.status = AgentStatus.STOPPED;
          return true;
        }
        return false;
      }
    }

    this.status = AgentStatus.STOPPED;
    return true;
  }

  /**
   * Hook for subclasses to implement custom shutdown logic
   * @param force Whether shutdown is forced
   */
  protected async onShutdown(force: boolean): Promise<void> {
    // Default implementation does nothing
    // Subclasses should override this method
  }

  /**
   * Start the agent
   */
  public async start(): Promise<boolean> {
    if (this.status === AgentStatus.INITIALIZING || this.status === AgentStatus.STOPPED) {
      try {
        this.status = AgentStatus.INITIALIZING;
        this.logger.info('Starting agent');

        const initialized = await this.initialize();
        if (!initialized) {
          this.logger.error('Failed to initialize agent');
          this.status = AgentStatus.ERROR;
          return false;
        }

        this.status = AgentStatus.RUNNING;
        this.startTime = new Date();
        this.logger.info('Agent started successfully');

        // Emit start event for listeners
        this.emit('start', { agentId: this.id, startTime: this.startTime });

        return true;
      } catch (error) {
        this.logger.error(
          `Error starting agent: ${error instanceof Error ? error.message : String(error)}`
        );
        this.status = AgentStatus.ERROR;
        return false;
      }
    }

    return false;
  }

  /**
   * Pause the agent (suspend processing but maintain state)
   */
  public async pause(): Promise<boolean> {
    if (this.status === AgentStatus.RUNNING) {
      this.status = AgentStatus.PAUSED;
      this.logger.info('Agent paused');

      // Emit pause event for listeners
      this.emit('pause', { agentId: this.id });

      return true;
    }

    return false;
  }

  /**
   * Resume the agent after pausing
   */
  public async resume(): Promise<boolean> {
    if (this.status === AgentStatus.PAUSED) {
      this.status = AgentStatus.RUNNING;
      this.logger.info('Agent resumed');

      // Emit resume event for listeners
      this.emit('resume', { agentId: this.id });

      return true;
    }

    return false;
  }

  /**
   * Check if agent has a specific capability
   * @param capability The capability to check for
   */
  public hasCapability(capability: AgentCapability): boolean {
    return this.capabilities.includes(capability);
  }

  /**
   * Get agent information
   */
  public getInfo(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      capabilities: this.capabilities,
      priority: this.priority,
      startTime: this.startTime,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      metadata: this.metadata,
    };
  }

  /**
   * Get agent status
   */
  public getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Set metadata value
   * @param key Metadata key
   * @param value Metadata value
   */
  public setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }

  /**
   * Get metadata value
   * @param key Metadata key
   */
  public getMetadata(key: string): any {
    return this.metadata[key];
  }

  /**
   * Clear all metadata
   */
  public clearMetadata(): void {
    this.metadata = {};
  }
}
