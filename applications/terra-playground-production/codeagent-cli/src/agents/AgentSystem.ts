/**
 * AgentSystem.ts
 *
 * Main entry point for the multi-agent architecture
 */

import {
  AgentRegistry,
  AgentCoordinator,
  LogService,
  LogLevel,
  StateManager,
  BaseAgent,
  AgentType,
  AgentTask,
  EventBus,
  AgentEvent,
} from './core';

import { DatabaseIntelligenceAgent, GisSpecialistAgent, DevelopmentPipelineAgent } from './domain';

import {
  DebuggingAgent,
  LocalDeploymentAgent,
  VersionControlAgent,
  WebDeploymentAgent,
} from './task';

/**
 * Agent system configuration
 */
export interface AgentSystemConfig {
  logLevel?: LogLevel;
  statePersistence?: boolean;
  autoInitialize?: boolean;
  agents?: {
    database?: boolean;
    gis?: boolean;
    development?: boolean;
    debugging?: boolean;
    localDeployment?: boolean;
    versionControl?: boolean;
    webDeployment?: boolean;
  };
}

/**
 * Main class for managing the multi-agent system
 */
export class AgentSystem {
  private registry: AgentRegistry;
  private coordinator: AgentCoordinator;
  private eventBus: EventBus;
  private stateManager: StateManager;
  private logger: LogService;
  private initialized: boolean = false;

  /**
   * Constructor
   * @param config System configuration
   */
  constructor(private config: AgentSystemConfig = {}) {
    // Set defaults
    this.config = {
      logLevel: LogLevel.INFO,
      statePersistence: true,
      autoInitialize: true,
      agents: {
        database: true,
        gis: true,
        development: true,
        debugging: true,
        localDeployment: true,
        versionControl: true,
        webDeployment: true,
      },
      ...config,
    };

    // Initialize core components
    this.registry = AgentRegistry.getInstance();
    this.coordinator = AgentCoordinator.getInstance();
    this.eventBus = EventBus.getInstance();
    this.stateManager = StateManager.getInstance();
    this.logger = new LogService('AgentSystem', this.config.logLevel || LogLevel.INFO);

    // Initialize if autoInitialize is enabled
    if (this.config.autoInitialize) {
      this.initialize().catch(err => {
        this.logger.error(
          `Auto-initialization failed: ${err instanceof Error ? err.message : String(err)}`
        );
      });
    }
  }

  /**
   * Initialize the agent system
   */
  public async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    this.logger.info('Initializing Agent System');

    try {
      // Create agents based on configuration
      await this.createAgents();

      // Initialize the coordinator
      await this.coordinator.initialize();

      // Set up event listeners
      this.setupEventListeners();

      this.initialized = true;
      this.logger.info('Agent System initialized successfully');

      return true;
    } catch (error) {
      this.logger.error(
        `Initialization failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  /**
   * Create agents based on configuration
   */
  private async createAgents(): Promise<void> {
    const agents = this.config.agents || {};

    // Domain-specific agents
    if (agents.database) {
      const dbAgent = new DatabaseIntelligenceAgent();
      await dbAgent.initialize();
      this.registry.registerAgent(dbAgent);
    }

    if (agents.gis) {
      const gisAgent = new GisSpecialistAgent();
      await gisAgent.initialize();
      this.registry.registerAgent(gisAgent);
    }

    if (agents.development) {
      const devAgent = new DevelopmentPipelineAgent();
      await devAgent.initialize();
      this.registry.registerAgent(devAgent);
    }

    // Task-specific agents
    if (agents.debugging) {
      const debugAgent = new DebuggingAgent();
      await debugAgent.initialize();
      this.registry.registerAgent(debugAgent);
    }

    if (agents.localDeployment) {
      const localDeployAgent = new LocalDeploymentAgent();
      await localDeployAgent.initialize();
      this.registry.registerAgent(localDeployAgent);
    }

    if (agents.versionControl) {
      const vcAgent = new VersionControlAgent();
      await vcAgent.initialize();
      this.registry.registerAgent(vcAgent);
    }

    if (agents.webDeployment) {
      const webDeployAgent = new WebDeploymentAgent();
      await webDeployAgent.initialize();
      this.registry.registerAgent(webDeployAgent);
    }

    this.logger.info(`Created ${this.registry.getAgentCount()} agents`);
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Listen for agent status changes
    this.eventBus.subscribe('agent:status', (event: AgentEvent) => {
      this.logger.debug(`Agent ${event.agentId} status changed to ${event.data.status}`);
    });

    // Listen for task completion
    this.eventBus.subscribe('task:complete', (event: AgentEvent) => {
      this.logger.debug(`Task ${event.data.taskId} completed by agent ${event.agentId}`);
    });

    // Listen for errors
    this.eventBus.subscribe('agent:error', (event: AgentEvent) => {
      this.logger.error(`Agent ${event.agentId} error: ${event.data.message}`);
    });
  }

  /**
   * Submit a task to the agent system
   * @param task Task to submit
   * @param agentId Specific agent ID to execute the task, or null for auto-assignment
   */
  public async submitTask(task: AgentTask, agentId?: string): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.logger.info(`Submitting task: ${task.type}`);

    // If agent ID is specified, execute directly
    if (agentId) {
      const agent = this.registry.getAgentById(agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      return await agent.executeTask(task);
    }

    // Otherwise, use the coordinator to assign the task
    return await this.coordinator.executeTask(task);
  }

  /**
   * Get an agent by ID
   * @param agentId Agent ID
   */
  public getAgent(agentId: string): BaseAgent | null {
    return this.registry.getAgentById(agentId);
  }

  /**
   * Get agents by type
   * @param type Agent type
   */
  public getAgentsByType(type: AgentType): BaseAgent[] {
    return this.registry.getAgentsByType(type);
  }

  /**
   * Get all agents
   */
  public getAllAgents(): BaseAgent[] {
    return this.registry.getAllAgents();
  }

  /**
   * Find agents by capability
   * @param capability Agent capability
   */
  public findAgentsByCapability(capability: string): BaseAgent[] {
    return this.registry.findAgentsByCapability(capability);
  }

  /**
   * Shut down the agent system
   * @param force Force shutdown
   */
  public async shutdown(force: boolean = false): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.logger.info(`Shutting down Agent System (force: ${force})`);

    try {
      // Shut down all agents through the registry
      await this.registry.shutdownAllAgents(force);

      // Shut down coordinator
      await this.coordinator.shutdown(force);

      this.initialized = false;
      this.logger.info('Agent System shut down successfully');
    } catch (error) {
      this.logger.error(
        `Shutdown failed: ${error instanceof Error ? error.message : String(error)}`
      );
      if (force) {
        this.initialized = false;
      }
    }
  }
}
