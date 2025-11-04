/**
 * Agent Base Class
 *
 * This abstract class provides the foundational functionality
 * for all AI agents in the system. It handles common tasks like
 * logging, activity tracking, and capability management.
 */

import { logger } from '../../utils/logger';
import { IStorage } from '../../storage';

/**
 * Base class for all AI agents in the system
 */
export abstract class AgentBase {
  protected readonly agentId: string;
  protected readonly componentName: string;
  protected capabilities: string[] = [];
  protected storage?: IStorage;

  /**
   * Create a new agent instance
   *
   * @param agentId The unique identifier for this agent
   * @param componentName The human-readable name of this agent
   */
  constructor(agentId: string, componentName: string) {
    this.agentId = agentId;
    this.componentName = componentName;

    logger.info({
      component: this.componentName,
      message: `Initializing agent: ${this.agentId}`,
    });
  }

  /**
   * Get the agent's unique identifier
   */
  getAgentId(): string {
    return this.agentId;
  }

  /**
   * Get the agent's component name
   */
  getComponentName(): string {
    return this.componentName;
  }

  /**
   * Get the agent's capabilities
   */
  getCapabilities(): string[] {
    return [...this.capabilities];
  }

  /**
   * Check if the agent has a specific capability
   */
  hasCapability(capability: string): boolean {
    return this.capabilities.includes(capability);
  }

  /**
   * Register capabilities that this agent supports
   */
  protected registerCapabilities(capabilities: string[]): void {
    this.capabilities = [...capabilities];

    logger.info({
      component: this.componentName,
      message: `Agent ${this.agentId} registered capabilities: ${capabilities.join(', ')}`,
    });
  }

  /**
   * Log agent activity
   */
  protected logAgentActivity(message: string, data: any = {}): void {
    logger.info({
      component: this.componentName,
      message,
      agentId: this.agentId,
      ...data,
    });
  }

  /**
   * Log agent warnings
   */
  protected logAgentWarning(message: string, data: any = {}): void {
    logger.warn({
      component: this.componentName,
      message,
      agentId: this.agentId,
      ...data,
    });
  }

  /**
   * Log agent errors
   */
  protected logAgentError(message: string, error: unknown, data: any = {}): void {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error({
      component: this.componentName,
      message: `${message}: ${errorMessage}`,
      agentId: this.agentId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      ...data,
    });
  }

  /**
   * Record an agent activity in the storage system
   *
   * @param activityType Type of activity being performed
   * @param entityType Type of entity this activity relates to
   * @param entityId ID of the entity
   * @param details Additional details about the activity
   * @param status Optional status for the activity
   */
  protected async recordAgentActivity(
    activityType: string,
    entityType: string,
    entityId: string,
    details: any = {},
    status: string = 'completed'
  ): Promise<void> {
    if (!this.storage) {
      this.logAgentWarning('Cannot record agent activity: storage not available');
      return;
    }

    try {
      await this.storage.createSystemActivity({
        component: this.componentName,
        activity_type: activityType,
        details,
        status,
      });

      this.logAgentActivity(`Recorded activity: ${activityType}`, {
        entityType,
        entityId,
        status,
      });
    } catch (error) {
      this.logAgentError('Failed to record agent activity', error, {
        activityType,
        entityType,
        entityId,
      });
    }
  }
}
