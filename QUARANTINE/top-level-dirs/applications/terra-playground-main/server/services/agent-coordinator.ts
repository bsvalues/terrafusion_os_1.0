/**
 * Agent Coordinator Service
 *
 * This service coordinates communication between AI extensions and the agent system.
 * It serves as a central hub for dispatching tasks, queries, and responses between
 * various components of the system.
 */

import { EventEmitter } from 'events';
import {
  AgentProtocol,
  AgentMessage,
  AgentMessageType,
  MessagePriority,
} from '../extensions/agent-protocol';
import { ExtensionRegistry } from '../extensions/extension-registry';
import { logger } from '../utils/logger';
import { IStorage } from '../storage';

/**
 * Task status enumeration
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Task priority enumeration
 */
export enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Task definition
 */
export interface Task {
  id: string;
  type: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  completedAt?: Date;
  result?: any;
  error?: string;
  parentTaskId?: string;
  metadata?: Record<string, any>;
}

/**
 * Agent information
 */
export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'inactive';
}

/**
 * Agent Coordinator Service
 *
 * Manages communication and coordination between different AI agents and extensions
 */
export class AgentCoordinator {
  private static instance: AgentCoordinator;
  private eventEmitter: EventEmitter;
  private agentProtocol: AgentProtocol;
  private storage: IStorage;
  private extensionRegistry: ExtensionRegistry;
  private agents: Map<string, AgentInfo> = new Map();
  private tasks: Map<string, Task> = new Map();
  private taskCounter: number = 0;

  /**
   * Create a new agent coordinator
   *
   * @param storage Storage service
   */
  private constructor(storage: IStorage) {
    this.storage = storage;
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(100); // Allow many listeners
    this.agentProtocol = AgentProtocol.getInstance();
    this.extensionRegistry = ExtensionRegistry.getInstance();

    // Set up protocol subscriptions
    this.setupSubscriptions();
  }

  /**
   * Get the singleton instance of the agent coordinator
   *
   * @param storage Storage service
   * @returns The agent coordinator instance
   */
  public static getInstance(storage: IStorage): AgentCoordinator {
    if (!AgentCoordinator.instance) {
      AgentCoordinator.instance = new AgentCoordinator(storage);
    }
    return AgentCoordinator.instance;
  }

  /**
   * Set up protocol subscriptions
   */
  private setupSubscriptions(): void {
    // Subscribe to coordination messages
    this.agentProtocol.subscribe('agent-coordinator', 'coordination', message => {
      this.handleCoordinationMessage(message);
    });

    // Subscribe to capability advertisements
    this.agentProtocol.subscribe('agent-coordinator', 'capability', message => {
      this.handleCapabilityMessage(message);
    });

    // Log all messages for debugging (if enabled)
    if (process.env.DEBUG === 'true') {
      this.agentProtocol.subscribe('agent-coordinator', '*', message => {
        logger.debug(`[AgentCoordinator] Message intercepted: ${JSON.stringify(message)}`);
      });
    }
  }

  /**
   * Handle coordination messages
   *
   * @param message Coordination message
   */
  private handleCoordinationMessage(message: AgentMessage): void {
    if (!message.payload || !message.payload.action) {
      logger.warn(`Received coordination message without action: ${JSON.stringify(message)}`);
      return;
    }

    const { action } = message.payload;

    switch (action) {
      case 'register-agent':
        this.registerAgent(message);
        break;
      case 'unregister-agent':
        this.unregisterAgent(message);
        break;
      case 'create-task':
        this.createTask(message);
        break;
      case 'update-task':
        this.updateTask(message);
        break;
      case 'assign-task':
        this.assignTask(message);
        break;
      case 'complete-task':
        this.completeTask(message);
        break;
      case 'fail-task':
        this.failTask(message);
        break;
      case 'cancel-task':
        this.cancelTask(message);
        break;
      default:
        logger.warn(`Unknown coordination action: ${action}`);
    }
  }

  /**
   * Handle capability messages
   *
   * @param message Capability message
   */
  private handleCapabilityMessage(message: AgentMessage): void {
    if (!message.payload || !message.payload.capabilities) {
      logger.warn(`Received capability message without capabilities: ${JSON.stringify(message)}`);
      return;
    }

    const { capabilities } = message.payload;
    const agent = this.agents.get(message.senderId);

    if (agent) {
      // Update existing agent capabilities
      agent.capabilities = capabilities;
      logger.info(`Updated capabilities for agent ${message.senderId}: ${capabilities.join(', ')}`);
    } else {
      // Create a new agent entry with these capabilities
      this.agents.set(message.senderId, {
        id: message.senderId,
        name: message.payload.name || message.senderId,
        description: message.payload.description || '',
        capabilities,
        status: 'active',
      });

      logger.info(
        `Registered new agent ${message.senderId} with capabilities: ${capabilities.join(', ')}`
      );
    }
  }

  /**
   * Register an agent
   *
   * @param message Registration message
   */
  private registerAgent(message: AgentMessage): void {
    const { name, description, capabilities } = message.payload;

    this.agents.set(message.senderId, {
      id: message.senderId,
      name: name || message.senderId,
      description: description || '',
      capabilities: capabilities || [],
      status: 'active',
    });

    logger.info(`Agent ${message.senderId} registered`);

    // Respond with confirmation
    this.agentProtocol.sendMessage({
      type: AgentMessageType.RESPONSE,
      senderId: 'agent-coordinator',
      recipientId: message.senderId,
      topic: 'coordination',
      priority: MessagePriority.NORMAL,
      correlationId: message.id,
      payload: {
        success: true,
        message: 'Agent registered successfully',
      },
    });
  }

  /**
   * Unregister an agent
   *
   * @param message Unregistration message
   */
  private unregisterAgent(message: AgentMessage): void {
    const agentId = message.senderId;

    if (this.agents.has(agentId)) {
      this.agents.delete(agentId);
      logger.info(`Agent ${agentId} unregistered`);

      // Respond with confirmation
      this.agentProtocol.sendMessage({
        type: AgentMessageType.RESPONSE,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          success: true,
          message: 'Agent unregistered successfully',
        },
      });

      // Reassign any pending tasks
      for (const [taskId, task] of this.tasks.entries()) {
        if (task.assignedTo === agentId && task.status === TaskStatus.IN_PROGRESS) {
          task.status = TaskStatus.PENDING;
          task.assignedTo = undefined;
          task.updatedAt = new Date();

          // Log the reassignment
          logger.info(
            `Task ${taskId} returned to pending status after agent ${agentId} unregistered`
          );

          // Attempt to reassign the task
          setTimeout(() => this.assignTaskToAgent(task), 1000);
        }
      }
    } else {
      // Agent not found
      this.agentProtocol.sendMessage({
        type: AgentMessageType.ERROR,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          error: 'Agent not found',
          message: `Agent ${agentId} is not registered`,
        },
      });
    }
  }

  /**
   * Create a new task
   *
   * @param message Task creation message
   */
  private createTask(message: AgentMessage): void {
    const { type, description, priority, metadata, parentTaskId } = message.payload;

    // Validate required fields
    if (!type || !description) {
      this.agentProtocol.sendMessage({
        type: AgentMessageType.ERROR,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          error: 'Invalid task',
          message: 'Task type and description are required',
        },
      });
      return;
    }

    // Generate a unique task ID
    const taskId = `task-${Date.now()}-${++this.taskCounter}`;

    // Create the task
    const task: Task = {
      id: taskId,
      type,
      description,
      priority: priority || TaskPriority.NORMAL,
      status: TaskStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentTaskId,
      metadata,
    };

    // Store the task
    this.tasks.set(taskId, task);

    // Log task creation
    logger.info(`Task ${taskId} created: ${description}`);

    // Respond with the task ID
    this.agentProtocol.sendMessage({
      type: AgentMessageType.RESPONSE,
      senderId: 'agent-coordinator',
      recipientId: message.senderId,
      topic: 'coordination',
      priority: MessagePriority.NORMAL,
      correlationId: message.id,
      payload: {
        success: true,
        taskId,
        task,
      },
    });

    // Try to assign the task
    this.assignTaskToAgent(task);
  }

  /**
   * Update a task
   *
   * @param message Task update message
   */
  private updateTask(message: AgentMessage): void {
    const { taskId, updates } = message.payload;

    if (!taskId || !updates) {
      this.agentProtocol.sendMessage({
        type: AgentMessageType.ERROR,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          error: 'Invalid update',
          message: 'Task ID and updates are required',
        },
      });
      return;
    }

    const task = this.tasks.get(taskId);

    if (!task) {
      this.agentProtocol.sendMessage({
        type: AgentMessageType.ERROR,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          error: 'Task not found',
          message: `Task ${taskId} does not exist`,
        },
      });
      return;
    }

    // Check if the sender is authorized to update this task
    if (task.assignedTo && task.assignedTo !== message.senderId) {
      this.agentProtocol.sendMessage({
        type: AgentMessageType.ERROR,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          error: 'Unauthorized',
          message: `Only the assigned agent can update this task`,
        },
      });
      return;
    }

    // Apply updates (only allowed fields)
    if (updates.description) task.description = updates.description;
    if (updates.priority) task.priority = updates.priority;
    if (updates.metadata) task.metadata = { ...task.metadata, ...updates.metadata };

    // Update timestamp
    task.updatedAt = new Date();

    // Log the update
    logger.info(`Task ${taskId} updated by ${message.senderId}`);

    // Respond with success
    this.agentProtocol.sendMessage({
      type: AgentMessageType.RESPONSE,
      senderId: 'agent-coordinator',
      recipientId: message.senderId,
      topic: 'coordination',
      priority: MessagePriority.NORMAL,
      correlationId: message.id,
      payload: {
        success: true,
        taskId,
        task,
      },
    });
  }

  /**
   * Assign a task to an agent
   *
   * @param message Task assignment message
   */
  private assignTask(message: AgentMessage): void {
    const { taskId, agentId } = message.payload;

    if (!taskId || !agentId) {
      this.agentProtocol.sendMessage({
        type: AgentMessageType.ERROR,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          error: 'Invalid assignment',
          message: 'Task ID and agent ID are required',
        },
      });
      return;
    }

    const task = this.tasks.get(taskId);

    if (!task) {
      this.agentProtocol.sendMessage({
        type: AgentMessageType.ERROR,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          error: 'Task not found',
          message: `Task ${taskId} does not exist`,
        },
      });
      return;
    }

    // Check if the agent exists
    if (!this.agents.has(agentId)) {
      this.agentProtocol.sendMessage({
        type: AgentMessageType.ERROR,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          error: 'Agent not found',
          message: `Agent ${agentId} is not registered`,
        },
      });
      return;
    }

    // Assign the task
    task.assignedTo = agentId;
    task.status = TaskStatus.IN_PROGRESS;
    task.updatedAt = new Date();

    // Log the assignment
    logger.info(`Task ${taskId} assigned to agent ${agentId}`);

    // Respond with success
    this.agentProtocol.sendMessage({
      type: AgentMessageType.RESPONSE,
      senderId: 'agent-coordinator',
      recipientId: message.senderId,
      topic: 'coordination',
      priority: MessagePriority.NORMAL,
      correlationId: message.id,
      payload: {
        success: true,
        taskId,
        agentId,
        task,
      },
    });

    // Notify the agent about the assignment
    this.agentProtocol.sendMessage({
      type: AgentMessageType.NOTIFICATION,
      senderId: 'agent-coordinator',
      recipientId: agentId,
      topic: 'task-assignment',
      priority: MessagePriority.HIGH,
      payload: {
        action: 'task-assigned',
        taskId,
        task,
      },
    });
  }

  /**
   * Complete a task
   *
   * @param message Task completion message
   */
  private completeTask(message: AgentMessage): void {
    const { taskId, result } = message.payload;

    if (!taskId) {
      this.agentProtocol.sendMessage({
        type: AgentMessageType.ERROR,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          error: 'Invalid completion',
          message: 'Task ID is required',
        },
      });
      return;
    }

    const task = this.tasks.get(taskId);

    if (!task) {
      this.agentProtocol.sendMessage({
        type: AgentMessageType.ERROR,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          error: 'Task not found',
          message: `Task ${taskId} does not exist`,
        },
      });
      return;
    }

    // Check if the sender is authorized to complete this task
    if (task.assignedTo && task.assignedTo !== message.senderId) {
      this.agentProtocol.sendMessage({
        type: AgentMessageType.ERROR,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          error: 'Unauthorized',
          message: `Only the assigned agent can complete this task`,
        },
      });
      return;
    }

    // Complete the task
    task.status = TaskStatus.COMPLETED;
    task.result = result;
    task.completedAt = new Date();
    task.updatedAt = new Date();

    // Log the completion
    logger.info(`Task ${taskId} completed by ${message.senderId}`);

    // Respond with success
    this.agentProtocol.sendMessage({
      type: AgentMessageType.RESPONSE,
      senderId: 'agent-coordinator',
      recipientId: message.senderId,
      topic: 'coordination',
      priority: MessagePriority.NORMAL,
      correlationId: message.id,
      payload: {
        success: true,
        taskId,
        task,
      },
    });

    // Notify about task completion
    this.notifyTaskCompletion(task);
  }

  /**
   * Fail a task
   *
   * @param message Task failure message
   */
  private failTask(message: AgentMessage): void {
    const { taskId, error } = message.payload;

    if (!taskId) {
      this.agentProtocol.sendMessage({
        type: AgentMessageType.ERROR,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          error: 'Invalid failure',
          message: 'Task ID is required',
        },
      });
      return;
    }

    const task = this.tasks.get(taskId);

    if (!task) {
      this.agentProtocol.sendMessage({
        type: AgentMessageType.ERROR,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          error: 'Task not found',
          message: `Task ${taskId} does not exist`,
        },
      });
      return;
    }

    // Check if the sender is authorized to fail this task
    if (task.assignedTo && task.assignedTo !== message.senderId) {
      this.agentProtocol.sendMessage({
        type: AgentMessageType.ERROR,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          error: 'Unauthorized',
          message: `Only the assigned agent can fail this task`,
        },
      });
      return;
    }

    // Fail the task
    task.status = TaskStatus.FAILED;
    task.error = error || 'Task failed';
    task.updatedAt = new Date();

    // Log the failure
    logger.info(`Task ${taskId} failed: ${task.error}`);

    // Respond with acknowledgment
    this.agentProtocol.sendMessage({
      type: AgentMessageType.RESPONSE,
      senderId: 'agent-coordinator',
      recipientId: message.senderId,
      topic: 'coordination',
      priority: MessagePriority.NORMAL,
      correlationId: message.id,
      payload: {
        success: true,
        taskId,
        task,
      },
    });

    // Notify about task failure
    this.notifyTaskFailure(task);
  }

  /**
   * Cancel a task
   *
   * @param message Task cancellation message
   */
  private cancelTask(message: AgentMessage): void {
    const { taskId, reason } = message.payload;

    if (!taskId) {
      this.agentProtocol.sendMessage({
        type: AgentMessageType.ERROR,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          error: 'Invalid cancellation',
          message: 'Task ID is required',
        },
      });
      return;
    }

    const task = this.tasks.get(taskId);

    if (!task) {
      this.agentProtocol.sendMessage({
        type: AgentMessageType.ERROR,
        senderId: 'agent-coordinator',
        recipientId: message.senderId,
        topic: 'coordination',
        priority: MessagePriority.NORMAL,
        correlationId: message.id,
        payload: {
          error: 'Task not found',
          message: `Task ${taskId} does not exist`,
        },
      });
      return;
    }

    // Cancel the task
    task.status = TaskStatus.CANCELLED;
    task.error = reason || 'Task cancelled';
    task.updatedAt = new Date();

    // Log the cancellation
    logger.info(`Task ${taskId} cancelled: ${task.error}`);

    // Respond with acknowledgment
    this.agentProtocol.sendMessage({
      type: AgentMessageType.RESPONSE,
      senderId: 'agent-coordinator',
      recipientId: message.senderId,
      topic: 'coordination',
      priority: MessagePriority.NORMAL,
      correlationId: message.id,
      payload: {
        success: true,
        taskId,
        task,
      },
    });

    // If the task was assigned, notify the agent
    if (task.assignedTo) {
      this.agentProtocol.sendMessage({
        type: AgentMessageType.NOTIFICATION,
        senderId: 'agent-coordinator',
        recipientId: task.assignedTo,
        topic: 'task-cancellation',
        priority: MessagePriority.HIGH,
        payload: {
          action: 'task-cancelled',
          taskId,
          reason: task.error,
        },
      });
    }
  }

  /**
   * Find the best agent for a task
   *
   * @param task Task to assign
   * @returns The best agent ID or undefined if no suitable agent is found
   */
  private findBestAgentForTask(task: Task): string | undefined {
    // This is a simple implementation. In a real system, you would use
    // a more sophisticated algorithm that considers agent capabilities,
    // current workload, previous performance, etc.

    const eligibleAgents: { agentId: string; score: number }[] = [];

    for (const [agentId, agent] of this.agents.entries()) {
      // Skip inactive agents
      if (agent.status !== 'active') continue;

      // Calculate a score for this agent
      let score = 0;

      // Higher score for agents with capabilities matching the task type
      if (agent.capabilities.includes(task.type)) {
        score += 10;
      }

      // Add to eligible agents if score is above threshold
      if (score > 0) {
        eligibleAgents.push({ agentId, score });
      }
    }

    // Sort by score in descending order
    eligibleAgents.sort((a, b) => b.score - a.score);

    // Return the best agent or undefined if none found
    return eligibleAgents.length > 0 ? eligibleAgents[0].agentId : undefined;
  }

  /**
   * Assign a task to the best available agent
   *
   * @param task Task to assign
   */
  private assignTaskToAgent(task: Task): void {
    // Skip if the task is not pending
    if (task.status !== TaskStatus.PENDING) return;

    // Find the best agent
    const agentId = this.findBestAgentForTask(task);

    if (agentId) {
      // Update the task
      task.assignedTo = agentId;
      task.status = TaskStatus.IN_PROGRESS;
      task.updatedAt = new Date();

      // Log the assignment
      logger.info(`Task ${task.id} automatically assigned to agent ${agentId}`);

      // Notify the agent
      this.agentProtocol.sendMessage({
        type: AgentMessageType.NOTIFICATION,
        senderId: 'agent-coordinator',
        recipientId: agentId,
        topic: 'task-assignment',
        priority: MessagePriority.HIGH,
        payload: {
          action: 'task-assigned',
          taskId: task.id,
          task,
        },
      });
    } else {
      // No suitable agent found
      logger.info(`No suitable agent found for task ${task.id}`);

      // We could implement a retry mechanism here
    }
  }

  /**
   * Notify about task completion
   *
   * @param task Completed task
   */
  private notifyTaskCompletion(task: Task): void {
    // If this task has a parent, update its progress
    if (task.parentTaskId) {
      const parentTask = this.tasks.get(task.parentTaskId);
      if (parentTask) {
        // In a real system, you would track subtasks more explicitly
        // and update the parent task's progress accordingly
        logger.info(`Subtask ${task.id} of parent task ${parentTask.id} completed`);
      }
    }

    // Broadcast notification about task completion
    this.agentProtocol.sendMessage({
      type: AgentMessageType.NOTIFICATION,
      senderId: 'agent-coordinator',
      recipientId: 'broadcast',
      topic: 'task-completion',
      priority: MessagePriority.NORMAL,
      payload: {
        action: 'task-completed',
        taskId: task.id,
        result: task.result,
      },
    });

    // Record the completion in the system activity log
    this.storage.createSystemActivity({
      activity_type: 'task_completed',
      component: 'agent-coordinator',
      details: {
        taskId: task.id,
        taskType: task.type,
        agentId: task.assignedTo,
      },
    });
  }

  /**
   * Notify about task failure
   *
   * @param task Failed task
   */
  private notifyTaskFailure(task: Task): void {
    // If this task has a parent, update its progress
    if (task.parentTaskId) {
      const parentTask = this.tasks.get(task.parentTaskId);
      if (parentTask) {
        logger.info(`Subtask ${task.id} of parent task ${parentTask.id} failed: ${task.error}`);
      }
    }

    // Broadcast notification about task failure
    this.agentProtocol.sendMessage({
      type: AgentMessageType.NOTIFICATION,
      senderId: 'agent-coordinator',
      recipientId: 'broadcast',
      topic: 'task-failure',
      priority: MessagePriority.HIGH,
      payload: {
        action: 'task-failed',
        taskId: task.id,
        error: task.error,
      },
    });

    // Record the failure in the system activity log
    this.storage.createSystemActivity({
      activity_type: 'task_failed',
      component: 'agent-coordinator',
      details: {
        taskId: task.id,
        taskType: task.type,
        agentId: task.assignedTo,
        error: task.error,
      },
    });
  }

  /**
   * Get all tasks
   *
   * @returns Array of all tasks
   */
  public getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get a task by ID
   *
   * @param taskId Task ID
   * @returns The task or undefined if not found
   */
  public getTaskById(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get tasks with a specific status
   *
   * @param status Task status
   * @returns Array of tasks with the specified status
   */
  public getTasksByStatus(status: TaskStatus): Task[] {
    // Use spread operator to convert values to array to avoid downlevelIteration issues
    return [...this.tasks.values()].filter(task => task.status === status);
  }

  /**
   * Get tasks assigned to a specific agent
   *
   * @param agentId Agent ID
   * @returns Array of tasks assigned to the agent
   */
  public getTasksByAgent(agentId: string): Task[] {
    // Use spread operator to convert values to array to avoid downlevelIteration issues
    return [...this.tasks.values()].filter(task => task.assignedTo === agentId);
  }

  /**
   * Get all registered agents
   *
   * @returns Array of all agents
   */
  public getAllAgents(): AgentInfo[] {
    // Use spread operator to convert values to array to avoid downlevelIteration issues
    return [...this.agents.values()];
  }

  /**
   * Get an agent by ID
   *
   * @param agentId Agent ID
   * @returns The agent or undefined if not found
   */
  public getAgentById(agentId: string): AgentInfo | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Create a task directly (not via message)
   *
   * @param type Task type
   * @param description Task description
   * @param priority Task priority
   * @param metadata Additional task metadata
   * @param parentTaskId Optional parent task ID
   * @returns The created task
   */
  public createTaskDirectly(
    type: string,
    description: string,
    priority: TaskPriority = TaskPriority.NORMAL,
    metadata?: Record<string, any>,
    parentTaskId?: string
  ): Task {
    // Generate a unique task ID
    const taskId = `task-${Date.now()}-${++this.taskCounter}`;

    // Create the task
    const task: Task = {
      id: taskId,
      type,
      description,
      priority,
      status: TaskStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentTaskId,
      metadata,
    };

    // Store the task
    this.tasks.set(taskId, task);

    // Log task creation
    logger.info(`Task ${taskId} created directly: ${description}`);

    // Try to assign the task
    this.assignTaskToAgent(task);

    return task;
  }
}
