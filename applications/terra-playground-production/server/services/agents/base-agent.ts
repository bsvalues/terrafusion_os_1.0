/**
 * Base Agent Class
 *
 * This class serves as the foundation for all AI agents in the MCP system.
 * It provides core functionality for agent operations, interaction with the MCP,
 * and standardized interfaces for agent capabilities.
 */

import { IStorage } from '../../storage';
import { MCPService, MCPRequest, MCPExecutionContext } from '../mcp';
import { AiAgent, InsertSystemActivity } from '../../../shared/schema';
import { AgentReplayBufferService, AgentExperience, LearningUpdate } from '../agent-replay-buffer';

// Agent capability interface
export interface AgentCapability {
  name: string;
  description: string;
  parameters?: any;
  handler: (parameters: any, agent: BaseAgent) => Promise<any>;
}

// Agent configuration interface
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  permissions: string[];
}

/**
 * Base Agent class that all specialized agents will extend
 */
export abstract class BaseAgent {
  protected id: any; // Can be string or number based on implementation
  protected agentId: any; // Alias for id to maintain compatibility with subclasses
  protected name: string;
  protected description: string;
  protected capabilities: Map<string, AgentCapability>;
  protected permissions: string[];
  protected storage: IStorage;
  protected mcpService: MCPService;
  protected replayBuffer: AgentReplayBufferService | null = null;
  protected config: AgentConfig = {} as AgentConfig;
  protected isActive: boolean = false;
  protected lastActivity: Date | null = null;
  protected performanceScore: number = 100;

  constructor(
    storage: IStorage,
    mcpService: MCPService,
    config: AgentConfig,
    replayBuffer?: AgentReplayBufferService
  ) {
    this.storage = storage;
    this.mcpService = mcpService;
    this.config = config;

    // Generate a fallback ID in case config.id is invalid
    const fallbackId = `base_agent_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Validate that config.id is a non-empty string
    if (!config.id || typeof config.id !== 'string' || config.id.trim() === '') {
      console.warn(
        `WARNING: Agent created with invalid ID (${config.id}), using fallback: ${fallbackId}`
      );
      this.id = fallbackId;
      this.agentId = fallbackId;
    } else {
      this.id = config.id;
      this.agentId = config.id; // Set agentId as an alias for id
    }

    // Log confirmation of ID assignment
    this.name = config.name;
    this.description = config.description;
    this.permissions = config.permissions || [];
    this.replayBuffer = replayBuffer || null;

    // Initialize capabilities map
    this.capabilities = new Map<string, AgentCapability>();

    // Register capabilities
    if (config.capabilities && Array.isArray(config.capabilities)) {
      for (const capability of config.capabilities) {
        this.registerCapability(capability);
      }
    }
  }

  /**
   * Register MCP tools for this agent
   *
   * Allows agents to register tools with the MCP system
   */
  protected async registerMCPTools(tools: any[]): Promise<void> {
    try {
      for (const tool of tools) {
        await this.mcpService.registerTool({
          name: tool.name,
          description: tool.description,
          requiredPermissions: ['authenticated'],
          execute: tool.handler,
        });
      }
      await this.logActivity('tools_registered', `Registered ${tools.length} tools with MCP`);
    } catch (error: any) {
      console.error(`Error registering tools for agent '${this.name}':`, error);
      await this.logActivity(
        'tools_registration_error',
        `Error registering tools: ${error.message}`
      );
    }
  }

  /**
   * Initialize agent (to be implemented by derived classes)
   */
  public abstract initialize(): Promise<void>;

  /**
   * Base initialization that can be called by child classes
   */
  protected async baseInitialize(): Promise<void> {
    await this.logActivity('base_initialization', 'Base agent initialization completed');
  }

  /**
   * Start the agent (set to active state)
   */
  public async start(): Promise<void> {
    this.isActive = true;
    await this.updateStatus('active', 100);
    await this.logActivity('agent_started', 'Agent started successfully');
  }

  /**
   * Stop the agent (set to inactive state)
   */
  public async stop(): Promise<void> {
    this.isActive = false;
    await this.updateStatus('inactive', this.performanceScore);
    await this.logActivity('agent_stopped', 'Agent stopped');
  }

  /**
   * Execute a capability
   */
  public async executeCapability(name: string, parameters: any): Promise<any> {
    if (!this.isActive) {
      throw new Error(`Agent '${this.name}' is not active`);
    }

    const capability = this.capabilities.get(name);
    if (!capability) {
      throw new Error(`Capability '${name}' not found in agent '${this.name}'`);
    }

    try {
      this.lastActivity = new Date();

      // Log capability execution
      await this.logActivity('capability_execution', `Executing capability '${name}'`, {
        capability: name,
        parameters,
      });

      // Execute the capability
      const result = await capability.handler(parameters, this);

      // Update performance metrics (simplified model)
      this.performanceScore = Math.min(100, this.performanceScore + 1);
      await this.updateStatus('active', this.performanceScore);

      // Log successful execution
      await this.logActivity('capability_success', `Successfully executed capability '${name}'`, {
        capability: name,
        result: result,
      });

      return {
        success: true,
        result,
        agent: this.name,
        capability: name,
      };
    } catch (error) {
      // Decrease performance score on error
      this.performanceScore = Math.max(0, this.performanceScore - 5);
      await this.updateStatus('error', this.performanceScore);

      // Get the error message safely, handling any type of error
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Log error
      await this.logActivity(
        'capability_error',
        `Error executing capability '${name}': ${errorMessage}`,
        {
          capability: name,
          error: errorMessage,
        }
      );

      return {
        success: false,
        error: errorMessage,
        agent: this.name,
        capability: name,
      };
    }
  }

  /**
   * Execute an MCP tool through the MCP service
   */
  public async executeMCPTool(tool: string, parameters: any): Promise<any> {
    const request: MCPRequest = {
      tool,
      parameters,
      agentId: this.agentId,
    };

    const context: MCPExecutionContext = {
      agentId: this.agentId,
      isAuthenticated: true,
      permissions: this.permissions,
      requestId: `agent-${this.agentId}-${Date.now()}`,
      startTime: new Date(),
    };

    return this.mcpService.executeTool(request, context);
  }

  /**
   * Register a new capability
   */
  protected registerCapability(capability: AgentCapability): void {
    this.capabilities.set(capability.name, capability);
  }

  /**
   * Add a development-related capability to this agent
   * This public method allows the development assistant to add capabilities
   */
  public addDevelopmentCapability(capability: AgentCapability): void {
    this.registerCapability(capability);
  }

  /**
   * Update agent status in the database
   */
  protected async updateStatus(status: string, performance: number): Promise<void> {
    try {
      this.performanceScore = performance;
      // Check if the method exists before calling it
      if (typeof this.storage.updateAiAgentStatus === 'function') {
        await this.storage.updateAiAgentStatus(this.agentId, status, performance);
      } else {
        // Fallback: just log to console if the method doesn't exist
      }
    } catch (error) {
      console.error(`Error updating agent status for '${this.name}':`, error);
    }
  }

  /**
   * Log agent activity
   */
  protected async logActivity(
    activityType: string,
    message: string,
    details: any = {}
  ): Promise<void> {
    try {
      // Skip database logging for string agent IDs to avoid type conversion errors
      if (typeof this.agentId === 'string') {
        return;
      }

      // Updated to match actual database schema structure - agent_id is an integer
      const activityData: InsertSystemActivity = {
        agent_id: typeof this.agentId === 'number' ? this.agentId : null,
        activity: message || activityType, // Ensure activity is not null
        entity_type: 'agent',
        entity_id: String(this.agentId),
      };

      // Check if the method exists before calling it
      if (typeof this.storage.createSystemActivity === 'function') {
        await this.storage.createSystemActivity(activityData);
      } else {
        // Fallback: log to console
      }
    } catch (error) {
      console.error(`Error logging activity for agent '${this.name}':`, error);
    }
  }

  /**
   * Get available tools from MCP
   */
  protected async getAvailableMCPTools(): Promise<any[]> {
    // Safely check if the method exists
    if (typeof this.mcpService.getAvailableTools === 'function') {
      return this.mcpService.getAvailableTools(this.permissions);
    } else {
      // Fallback: return empty array if method doesn't exist
      return [];
    }
  }

  /**
   * Get agent status
   */
  public getStatus(): {
    id: number;
    name: string;
    isActive: boolean;
    lastActivity: Date | null;
    performanceScore: number;
  } {
    return {
      id: this.agentId,
      name: this.name,
      isActive: this.isActive,
      lastActivity: this.lastActivity,
      performanceScore: this.performanceScore,
    };
  }

  /**
   * Store an experience in the replay buffer
   * @param action The action performed
   * @param state The current state
   * @param nextState The resulting state
   * @param reward The reward received
   * @param metadata Additional metadata
   * @returns The ID of the stored experience or null if buffer is not available
   */
  protected async storeExperience(
    action: string,
    state: any,
    nextState: any,
    reward: number,
    metadata: {
      entityType?: string;
      entityId?: string;
      context?: any;
      priority?: number;
    } = {}
  ): Promise<string | null> {
    if (!this.replayBuffer) {
      await this.logActivity(
        'replay_buffer_unavailable',
        'Replay buffer is not available for storing experience'
      );
      return null;
    }

    try {
      const experience: AgentExperience = {
        experienceId: `exp-${this.agentId}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        agentId: this.agentId,
        agentName: this.name,
        timestamp: new Date(),
        action,
        state,
        nextState,
        reward,
        metadata,
      };

      const experienceId = await this.replayBuffer.addExperience(experience);

      await this.logActivity('experience_stored', `Stored experience in replay buffer: ${action}`, {
        experienceId,
        action,
        reward,
        entityType: metadata.entityType,
        entityId: metadata.entityId,
      });

      return experienceId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.logActivity(
        'experience_storage_error',
        `Failed to store experience: ${errorMessage}`,
        {
          action,
          error: errorMessage,
        }
      );
      return null;
    }
  }

  /**
   * Retrieve experiences from the replay buffer
   * @param count Number of experiences to retrieve
   * @param highPriorityOnly If true, only retrieves high priority experiences
   * @returns Array of experiences or empty array if buffer is not available
   */
  protected async getExperiences(
    count: number = 10,
    highPriorityOnly: boolean = false
  ): Promise<AgentExperience[]> {
    if (!this.replayBuffer) {
      await this.logActivity(
        'replay_buffer_unavailable',
        'Replay buffer is not available for retrieving experiences'
      );
      return [];
    }

    try {
      const experiences = this.replayBuffer.sampleExperiences(count, highPriorityOnly);

      await this.logActivity(
        'experiences_retrieved',
        `Retrieved ${experiences.length} experiences from replay buffer`,
        {
          count: experiences.length,
          highPriorityOnly,
        }
      );

      return experiences;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.logActivity(
        'experience_retrieval_error',
        `Failed to retrieve experiences: ${errorMessage}`,
        {
          error: errorMessage,
        }
      );
      return [];
    }
  }

  /**
   * Get the replay buffer stats
   * @returns Stats object or null if buffer is not available
   */
  protected getReplayBufferStats(): {
    totalExperiences?: number;
    highPriorityExperiences?: number;
    lastTrainingTime?: Date | null;
    size?: number;
    maxSize?: number;
    highPriorityCount?: number;
    agentDistribution?: Record<string, number>;
    actionDistribution?: Record<string, number>;
    updateCount?: number;
  } | null {
    if (!this.replayBuffer) {
      return null;
    }

    const stats = this.replayBuffer.getBufferStats();

    // Map fields explicitly instead of using spread operator
    return {
      totalExperiences: stats.size,
      highPriorityExperiences: stats.highPriorityCount,
      lastTrainingTime: null, // Default to null since it doesn't exist in stats
      size: stats.size,
      maxSize: stats.maxSize,
      highPriorityCount: stats.highPriorityCount,
      agentDistribution: stats.agentDistribution,
      actionDistribution: stats.actionDistribution,
      updateCount: stats.updateCount,
    };
  }

  /**
   * Get recent learning updates from the replay buffer
   * @param count Number of updates to retrieve
   * @returns Array of learning updates or empty array if buffer is not available
   */
  protected getRecentLearningUpdates(count: number = 5): LearningUpdate[] {
    if (!this.replayBuffer) {
      return [];
    }

    return this.replayBuffer.getRecentUpdates(count);
  }

  /**
   * Set the replay buffer service
   * @param replayBuffer The replay buffer service to use
   */
  public setReplayBuffer(replayBuffer: AgentReplayBufferService): void {
    this.replayBuffer = replayBuffer;
    this.logActivity('replay_buffer_set', 'Replay buffer service has been set for agent');
  }
}
