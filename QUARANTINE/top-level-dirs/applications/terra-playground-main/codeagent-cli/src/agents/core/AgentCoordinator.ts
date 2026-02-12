/**
 * AgentCoordinator.ts
 *
 * Coordinates agent activities, task routing, and load balancing
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { AgentRegistry } from './AgentRegistry';
import { LogService } from './LogService';
import {
  AgentCapability,
  AgentPriority,
  AgentStatus,
  AgentTask,
  AgentTaskResult,
  AgentContext,
  AgentEventType,
} from './types';

/**
 * Task queue entry with metadata
 */
interface TaskQueueEntry {
  task: AgentTask;
  assignedAgentId?: string;
  attempts: number;
  lastAttempt?: Date;
  metadata: Record<string, any>;
}

/**
 * Agent selection strategy
 */
enum AgentSelectionStrategy {
  PRIORITY = 'priority',
  ROUND_ROBIN = 'round_robin',
  LOAD_BALANCED = 'load_balanced',
  CAPABILITY_MATCH = 'capability_match',
}

/**
 * Agent Coordinator configuration
 */
interface AgentCoordinatorConfig {
  maxQueueSize: number;
  maxRetries: number;
  defaultTimeout: number;
  defaultSelectionStrategy: AgentSelectionStrategy;
  taskPollInterval: number;
}

/**
 * Agent Coordinator class
 * Handles orchestration of agents and task routing
 */
export class AgentCoordinator extends EventEmitter {
  private static instance: AgentCoordinator;
  private registry: AgentRegistry;
  private taskQueue: Map<string, TaskQueueEntry>;
  private inProgressTasks: Map<string, TaskQueueEntry>;
  private completedTasks: Map<string, AgentTaskResult>;
  private logger: LogService;
  private config: AgentCoordinatorConfig;
  private taskPoller: NodeJS.Timer | null = null;
  private agentLoads: Map<string, number>;
  private lastSelectedAgent: string | null = null;

  /**
   * Private constructor (use getInstance)
   */
  private constructor(config?: Partial<AgentCoordinatorConfig>) {
    super();
    this.registry = AgentRegistry.getInstance();
    this.taskQueue = new Map<string, TaskQueueEntry>();
    this.inProgressTasks = new Map<string, TaskQueueEntry>();
    this.completedTasks = new Map<string, AgentTaskResult>();
    this.logger = new LogService('AgentCoordinator');
    this.agentLoads = new Map<string, number>();

    // Default configuration
    this.config = {
      maxQueueSize: 1000,
      maxRetries: 3,
      defaultTimeout: 60000, // 1 minute
      defaultSelectionStrategy: AgentSelectionStrategy.CAPABILITY_MATCH,
      taskPollInterval: 500, // 500ms
      ...config,
    };

    // Listen for agent registry events
    this.setupRegistryListeners();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<AgentCoordinatorConfig>): AgentCoordinator {
    if (!AgentCoordinator.instance) {
      AgentCoordinator.instance = new AgentCoordinator(config);
    }
    return AgentCoordinator.instance;
  }

  /**
   * Setup registry event listeners
   */
  private setupRegistryListeners(): void {
    // Agent started
    this.registry.on(AgentEventType.STARTED, data => {
      this.logger.debug(`Agent started: ${data.agentId}`);
      // Check if there are any pending tasks for this agent
      this.processPendingTasks();
    });

    // Agent stopped
    this.registry.on(AgentEventType.SHUTDOWN, data => {
      this.logger.debug(`Agent stopped: ${data.agentId}`);
      // Handle any tasks assigned to this agent
      this.handleAgentShutdown(data.agentId);
    });
  }

  /**
   * Start the coordinator
   */
  public start(): void {
    this.logger.info('Starting Agent Coordinator');

    // Start task polling
    if (!this.taskPoller) {
      this.taskPoller = setInterval(() => {
        this.processPendingTasks();
      }, this.config.taskPollInterval);
    }

    this.logger.info('Agent Coordinator started');
  }

  /**
   * Stop the coordinator
   */
  public stop(): void {
    this.logger.info('Stopping Agent Coordinator');

    // Stop task polling
    if (this.taskPoller) {
      clearInterval(this.taskPoller);
      this.taskPoller = null;
    }

    this.logger.info('Agent Coordinator stopped');
  }

  /**
   * Submit a task to the coordinator
   * @param task Task to submit
   * @param context Optional context for the task
   */
  public async submitTask(
    task: Omit<AgentTask, 'id' | 'createdAt'>,
    context?: AgentContext
  ): Promise<string> {
    // Check if queue is full
    if (this.taskQueue.size >= this.config.maxQueueSize) {
      throw new Error('Task queue is full');
    }

    // Create a complete task with ID and timestamp
    const completeTask: AgentTask = {
      id: uuidv4(),
      ...task,
      createdAt: new Date(),
    };

    // Create queue entry
    const queueEntry: TaskQueueEntry = {
      task: completeTask,
      attempts: 0,
      metadata: {
        context,
        submittedAt: new Date(),
      },
    };

    // Add to queue
    this.taskQueue.set(completeTask.id, queueEntry);

    this.logger.info(`Task submitted: ${completeTask.id} (${completeTask.type})`);
    this.emit(AgentEventType.TASK_RECEIVED, { taskId: completeTask.id, task: completeTask });

    // Process task immediately if possible
    setTimeout(() => this.processPendingTasks(), 0);

    return completeTask.id;
  }

  /**
   * Process pending tasks in the queue
   */
  private processPendingTasks(): void {
    if (this.taskQueue.size === 0) {
      return;
    }

    // Sort tasks by priority (higher first)
    const sortedTasks = Array.from(this.taskQueue.entries()).sort(
      (a, b) => b[1].task.priority - a[1].task.priority
    );

    for (const [taskId, queueEntry] of sortedTasks) {
      this.processTask(taskId, queueEntry);
    }
  }

  /**
   * Process a specific task
   * @param taskId Task ID
   * @param queueEntry Task queue entry
   */
  private async processTask(taskId: string, queueEntry: TaskQueueEntry): Promise<void> {
    const task = queueEntry.task;

    // Check if already assigned
    if (queueEntry.assignedAgentId) {
      return;
    }

    // Select an agent for the task
    const agentId = this.selectAgentForTask(task);

    if (!agentId) {
      // No suitable agent found
      this.logger.debug(`No suitable agent found for task: ${taskId}`);
      return;
    }

    // Get agent instance
    const agent = this.registry.getAgentInstanceById(agentId);

    if (!agent) {
      this.logger.error(`Agent not found: ${agentId}`);
      return;
    }

    // Check agent status
    if (agent.getStatus() !== AgentStatus.RUNNING) {
      this.logger.debug(`Agent not running: ${agentId}`);
      return;
    }

    // Assign agent
    queueEntry.assignedAgentId = agentId;
    queueEntry.attempts++;
    queueEntry.lastAttempt = new Date();

    // Move to in-progress
    this.taskQueue.delete(taskId);
    this.inProgressTasks.set(taskId, queueEntry);

    // Update agent load
    this.updateAgentLoad(agentId, 1);

    // Execute task
    this.logger.info(`Executing task ${taskId} on agent ${agentId}`);
    this.emit(AgentEventType.TASK_STARTED, { taskId, agentId });

    try {
      const startTime = Date.now();
      const context = queueEntry.metadata.context;

      // Execute the task on the agent
      const result = await agent.executeTask(task, context);

      const processingTime = Date.now() - startTime;

      // Create task result
      const taskResult: AgentTaskResult = {
        taskId,
        success: true,
        data: result,
        processingTime,
        completedAt: new Date(),
        metadata: {
          agentId,
          attempts: queueEntry.attempts,
        },
      };

      // Store result
      this.completedTasks.set(taskId, taskResult);

      // Remove from in-progress
      this.inProgressTasks.delete(taskId);

      // Update agent load
      this.updateAgentLoad(agentId, -1);

      // Emit completion event
      this.logger.info(`Task ${taskId} completed successfully`);
      this.emit(AgentEventType.TASK_COMPLETED, { taskId, result: taskResult });
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Create task result with error
      const taskResult: AgentTaskResult = {
        taskId,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        processingTime,
        completedAt: new Date(),
        metadata: {
          agentId,
          attempts: queueEntry.attempts,
        },
      };

      // Handle retry if needed
      if (queueEntry.attempts < this.config.maxRetries) {
        // Put back in queue
        queueEntry.assignedAgentId = undefined;
        this.taskQueue.set(taskId, queueEntry);
        this.logger.warn(`Task ${taskId} failed, retrying (attempt ${queueEntry.attempts})`);
      } else {
        // Store result
        this.completedTasks.set(taskId, taskResult);
        this.logger.error(`Task ${taskId} failed after ${queueEntry.attempts} attempts`);
        this.emit(AgentEventType.TASK_FAILED, { taskId, error, result: taskResult });
      }

      // Remove from in-progress
      this.inProgressTasks.delete(taskId);

      // Update agent load
      this.updateAgentLoad(agentId, -1);
    }
  }

  /**
   * Select an agent for a task based on strategy
   * @param task Task to assign
   * @returns Agent ID or null if no suitable agent found
   */
  private selectAgentForTask(task: AgentTask): string | null {
    let agentId: string | null = null;

    // Default to capability matching if task type matches a capability
    const strategy = this.config.defaultSelectionStrategy;

    switch (strategy) {
      case AgentSelectionStrategy.CAPABILITY_MATCH:
        // Find agents with matching capability
        agentId = this.selectAgentByCapability(task);
        break;

      case AgentSelectionStrategy.PRIORITY:
        // Select highest priority agent
        agentId = this.selectAgentByPriority();
        break;

      case AgentSelectionStrategy.ROUND_ROBIN:
        // Select next agent in rotation
        agentId = this.selectAgentByRoundRobin();
        break;

      case AgentSelectionStrategy.LOAD_BALANCED:
        // Select agent with lowest load
        agentId = this.selectAgentByLoad();
        break;

      default:
        // Default to capability match
        agentId = this.selectAgentByCapability(task);
    }

    return agentId;
  }

  /**
   * Select agent by capability
   * @param task Task to match
   * @returns Agent ID or null
   */
  private selectAgentByCapability(task: AgentTask): string | null {
    // Try to match task type to a capability
    const capability = task.type as AgentCapability;

    // Find agents with this capability
    const agents = this.registry
      .findAgentsByCapability(capability)
      .filter(agent => agent.status === AgentStatus.RUNNING);

    if (agents.length === 0) {
      return null;
    }

    // If multiple agents, prefer the one with the lowest load
    return this.selectLowestLoadAgent(agents.map(agent => agent.id));
  }

  /**
   * Select agent by priority
   * @returns Agent ID or null
   */
  private selectAgentByPriority(): string | null {
    // Get all running agents
    const agents = this.registry.findAgentsByStatus(AgentStatus.RUNNING);

    if (agents.length === 0) {
      return null;
    }

    // Sort by priority (highest first)
    const sorted = agents.sort((a, b) => b.priority - a.priority);

    return sorted[0].id;
  }

  /**
   * Select agent by round robin
   * @returns Agent ID or null
   */
  private selectAgentByRoundRobin(): string | null {
    // Get all running agents
    const agents = this.registry.findAgentsByStatus(AgentStatus.RUNNING);

    if (agents.length === 0) {
      return null;
    }

    // Find index of last selected agent
    let nextIndex = 0;
    if (this.lastSelectedAgent) {
      const lastIndex = agents.findIndex(agent => agent.id === this.lastSelectedAgent);
      if (lastIndex !== -1) {
        nextIndex = (lastIndex + 1) % agents.length;
      }
    }

    // Update last selected
    this.lastSelectedAgent = agents[nextIndex].id;

    return this.lastSelectedAgent;
  }

  /**
   * Select agent by load
   * @returns Agent ID or null
   */
  private selectAgentByLoad(): string | null {
    // Get all running agents
    const agents = this.registry.findAgentsByStatus(AgentStatus.RUNNING);

    if (agents.length === 0) {
      return null;
    }

    return this.selectLowestLoadAgent(agents.map(agent => agent.id));
  }

  /**
   * Select agent with lowest load from a list
   * @param agentIds List of agent IDs
   * @returns Agent ID with lowest load
   */
  private selectLowestLoadAgent(agentIds: string[]): string {
    // Default to first if no load info
    if (agentIds.length === 0) {
      return '';
    }

    // Find agent with lowest load
    let lowestLoad = Number.MAX_VALUE;
    let lowestLoadAgentId = agentIds[0];

    for (const agentId of agentIds) {
      const load = this.agentLoads.get(agentId) || 0;
      if (load < lowestLoad) {
        lowestLoad = load;
        lowestLoadAgentId = agentId;
      }
    }

    return lowestLoadAgentId;
  }

  /**
   * Update an agent's load
   * @param agentId Agent ID
   * @param delta Change in load (positive or negative)
   */
  private updateAgentLoad(agentId: string, delta: number): void {
    const currentLoad = this.agentLoads.get(agentId) || 0;
    const newLoad = Math.max(0, currentLoad + delta);
    this.agentLoads.set(agentId, newLoad);
  }

  /**
   * Handle an agent shutting down
   * @param agentId Agent ID
   */
  private handleAgentShutdown(agentId: string): void {
    // Find in-progress tasks for this agent
    for (const [taskId, queueEntry] of this.inProgressTasks.entries()) {
      if (queueEntry.assignedAgentId === agentId) {
        // Move back to queue for reassignment
        queueEntry.assignedAgentId = undefined;
        this.taskQueue.set(taskId, queueEntry);
        this.inProgressTasks.delete(taskId);

        this.logger.info(`Task ${taskId} reassigned due to agent shutdown`);
      }
    }

    // Reset load
    this.agentLoads.delete(agentId);

    // Reset lastSelectedAgent if needed
    if (this.lastSelectedAgent === agentId) {
      this.lastSelectedAgent = null;
    }
  }

  /**
   * Get task result
   * @param taskId Task ID
   * @returns Task result or null if not found
   */
  public getTaskResult(taskId: string): AgentTaskResult | null {
    return this.completedTasks.get(taskId) || null;
  }

  /**
   * Get task status
   * @param taskId Task ID
   * @returns Status string: 'queued', 'in_progress', 'completed', or 'not_found'
   */
  public getTaskStatus(taskId: string): 'queued' | 'in_progress' | 'completed' | 'not_found' {
    if (this.taskQueue.has(taskId)) {
      return 'queued';
    }

    if (this.inProgressTasks.has(taskId)) {
      return 'in_progress';
    }

    if (this.completedTasks.has(taskId)) {
      return 'completed';
    }

    return 'not_found';
  }

  /**
   * Get queue statistics
   */
  public getQueueStats(): Record<string, number> {
    return {
      queuedTasks: this.taskQueue.size,
      inProgressTasks: this.inProgressTasks.size,
      completedTasks: this.completedTasks.size,
      totalAgents: this.registry.getAllAgents().length,
      activeAgents: this.registry.findAgentsByStatus(AgentStatus.RUNNING).length,
    };
  }

  /**
   * Clear completed tasks history
   */
  public clearCompletedTasks(): void {
    this.completedTasks.clear();
  }
}
