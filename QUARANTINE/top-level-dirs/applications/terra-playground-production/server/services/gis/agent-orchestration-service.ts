/**
 * GIS Agent Orchestration Service
 *
 * This service is responsible for coordinating GIS agents and their tasks.
 * It handles agent registration, task assignment, and communication between agents.
 */

import { IStorage } from '../../storage';
import {
  GISAgentTask,
  InsertGISAgentTask,
  AgentMessage,
  InsertAgentMessage,
  SpatialEvent,
  InsertSpatialEvent,
} from '@shared/gis-schema';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  ErrorTrackingService,
  ErrorCategory,
  ErrorSeverity,
  ErrorSource,
} from '../error-tracking-service';

// Agent types for GIS operations
export enum GISAgentType {
  DATA_NORMALIZATION = 'DATA_NORMALIZATION',
  TOPOLOGY_REPAIR = 'TOPOLOGY_REPAIR',
  SCHEMA_CONVERSION = 'SCHEMA_CONVERSION',
  FEATURE_DETECTION = 'FEATURE_DETECTION',
  SPATIAL_RELATIONSHIP = 'SPATIAL_RELATIONSHIP',
  VALUATION_ANALYSIS = 'VALUATION_ANALYSIS',
}

// Task types for GIS operations
export enum GISTaskType {
  DATA_CLEANING = 'DATA_CLEANING',
  SCHEMA_VALIDATION = 'SCHEMA_VALIDATION',
  FORMAT_CONVERSION = 'FORMAT_CONVERSION',
  SPATIAL_ANALYSIS = 'SPATIAL_ANALYSIS',
  TOPOLOGY_VERIFICATION = 'TOPOLOGY_VERIFICATION',
  FEATURE_EXTRACTION = 'FEATURE_EXTRACTION',
  VALUATION_CALCULATION = 'VALUATION_CALCULATION',
}

// Task status enum
export enum TaskStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// Interface for GIS agents
export interface IGISAgent {
  id: string;
  type: GISAgentType;
  name: string;
  description: string;
  capabilities: string[];
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  initialize(): Promise<void>;
  processTask(task: GISAgentTask): Promise<Record<string, unknown>>;
  shutdown(): Promise<void>;
}

interface TaskAssignmentResult {
  success: boolean;
  agentId?: string;
  error?: string;
}

interface TaskExecutionResult {
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

// Agent orchestration service class
export class GISAgentOrchestrationService {
  private static instance: GISAgentOrchestrationService;
  private storage: IStorage;
  private errorTrackingService: ErrorTrackingService;
  private agents: Map<string, IGISAgent> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  private activeTasks: Map<number, GISAgentTask> = new Map();
  private isInitialized: boolean = false;

  private constructor(storage: IStorage) {
    this.storage = storage;
    this.errorTrackingService = new ErrorTrackingService(storage);
  }

  /**
   * Get the singleton instance of the GIS Agent Orchestration Service
   * @param storage The storage implementation
   * @returns The GIS Agent Orchestration Service instance
   */
  public static getInstance(storage: IStorage): GISAgentOrchestrationService {
    if (!GISAgentOrchestrationService.instance) {
      GISAgentOrchestrationService.instance = new GISAgentOrchestrationService(storage);
    }
    return GISAgentOrchestrationService.instance;
  }

  /**
   * Initialize the GIS Agent Orchestration Service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Register event listeners
      this.registerEventListeners();

      // Initialize active tasks from the database
      await this.loadActiveTasks();

      this.isInitialized = true;
      console.log('GIS Agent Orchestration Service initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to initialize GIS Agent Orchestration Service:', errorMessage);
      this.errorTrackingService.trackError(error, {
        category: ErrorCategory.GIS,
        severity: ErrorSeverity.HIGH,
        source: ErrorSource.GIS_SYSTEM,
        details: { component: 'GISAgentOrchestrationService', method: 'initialize' },
      });
      throw error;
    }
  }

  /**
   * Register an agent with the orchestration service
   * @param agent The GIS agent to register
   */
  public registerAgent(agent: IGISAgent): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent with ID ${agent.id} is already registered`);
    }

    this.agents.set(agent.id, agent);
    console.log(`Agent ${agent.id} (${agent.name}) registered successfully`);

    // Initialize the agent
    agent.initialize().catch(error => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Failed to initialize agent ${agent.id}: ${errorMessage}`);
      this.errorTrackingService.trackAgentError(error, agent.id, {
        component: 'GISAgentOrchestrationService',
        method: 'registerAgent',
        agentType: agent.type,
        agentName: agent.name,
      });
      this.agents.delete(agent.id);
    });

    // Emit agent registered event
    this.eventEmitter.emit('agent:registered', agent);
  }

  /**
   * Unregister an agent from the orchestration service
   * @param agentId The ID of the agent to unregister
   */
  public async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} is not registered`);
    }

    try {
      // Shutdown the agent
      await agent.shutdown();

      // Remove from the registered agents
      this.agents.delete(agentId);
      console.log(`Agent ${agentId} (${agent.name}) unregistered successfully`);

      // Emit agent unregistered event
      this.eventEmitter.emit('agent:unregistered', agentId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Failed to unregister agent ${agentId}: ${errorMessage}`);
      this.errorTrackingService.trackAgentError(error, agentId, {
        component: 'GISAgentOrchestrationService',
        method: 'unregisterAgent',
        agentName: agent.name,
        agentType: agent.type,
      });
      throw error;
    }
  }

  /**
   * Get all registered agents
   * @returns A list of all registered agents
   */
  public getAgents(): IGISAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get an agent by ID
   * @param agentId The ID of the agent to get
   * @returns The agent with the specified ID, or undefined if not found
   */
  public getAgent(agentId: string): IGISAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Find available agents of a specific type
   * @param agentType The type of agent to find
   * @returns A list of available agents of the specified type
   */
  public findAvailableAgents(agentType: GISAgentType): IGISAgent[] {
    return Array.from(this.agents.values()).filter(
      agent => agent.type === agentType && agent.status === 'AVAILABLE'
    );
  }

  /**
   * Create and assign a new task to an appropriate agent
   * @param task The task to create and assign
   * @returns The created task
   */
  public async createTask(
    taskData: Omit<InsertGISAgentTask, 'id' | 'status' | 'startTime' | 'endTime'>
  ): Promise<GISAgentTask> {
    try {
      // Create the task object - let the database auto-generate the ID
      const newTask: InsertGISAgentTask = {
        ...taskData,
        status: TaskStatus.PENDING,
        startTime: new Date(),
      };

      // Store the task in the database
      const task = await this.storage.createGISAgentTask(newTask);

      // Emit task created event
      this.eventEmitter.emit('task:created', task);

      // Assign the task to an agent
      await this.assignTask(task);

      return task;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to create task:', errorMessage);
      this.errorTrackingService.trackGisError(error, {
        component: 'GISAgentOrchestrationService',
        method: 'createTask',
        taskData,
      });
      throw error;
    }
  }

  /**
   * Assign a task to an appropriate agent
   * @param task The task to assign
   * @returns The result of the assignment
   */
  private async assignTask(task: GISAgentTask): Promise<TaskAssignmentResult> {
    try {
      // Find available agents that can handle this task type
      const availableAgents = this.findAvailableAgents(task.agentType as GISAgentType);

      if (availableAgents.length === 0) {
        const error = `No available agents found for task type ${task.taskType}`;
        console.error(error);
        return { success: false, error };
      }

      // Select the first available agent
      const selectedAgent = availableAgents[0];

      // Update task status
      task.status = TaskStatus.RUNNING;
      await this.storage.updateGISAgentTask(task.id, {
        status: TaskStatus.RUNNING,
        agentId: selectedAgent.id
      });

      // Update agent status
      selectedAgent.status = 'BUSY';

      // Execute the task
      const executionResult = await this.executeTask(task, selectedAgent);

      if (!executionResult.success) {
        task.status = TaskStatus.FAILED;
        await this.storage.updateGISAgentTask(task.id, {
          status: TaskStatus.FAILED,
          error: executionResult.error || null
        });
        return { success: false, error: executionResult.error };
      }

      // Update task status
      task.status = TaskStatus.COMPLETED;
      task.result = executionResult.result;
      task.endTime = new Date();
      await this.storage.updateGISAgentTask(task.id, {
        status: TaskStatus.COMPLETED,
        result: executionResult.result,
        endTime: new Date()
      });

      // Update agent status
      selectedAgent.status = 'AVAILABLE';

      return { success: true, agentId: selectedAgent.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to assign task:', errorMessage);
      this.errorTrackingService.trackGisError(error, {
        component: 'GISAgentOrchestrationService',
        method: 'assignTask',
        taskId: task.id,
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Execute a task using the assigned agent
   * @param task The task to execute
   * @param agent The agent to execute the task
   * @returns The result of the task execution
   */
  private async executeTask(task: GISAgentTask, agent: IGISAgent): Promise<TaskExecutionResult> {
    try {
      const result = await agent.processTask(task);
      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Task execution failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Register event listeners for the orchestration service
   */
  private registerEventListeners(): void {
    this.eventEmitter.on('agent:registered', (agent: IGISAgent) => {
      console.log(`Agent registered: ${agent.name} (${agent.id})`);
    });

    this.eventEmitter.on('agent:unregistered', (agentId: string) => {
      console.log(`Agent unregistered: ${agentId}`);
    });

    this.eventEmitter.on('task:created', (task: GISAgentTask) => {
      console.log(`Task created: ${task.id} (${task.taskType})`);
    });

    this.eventEmitter.on('task:completed', (task: GISAgentTask) => {
      console.log(`Task completed: ${task.id} (${task.taskType})`);
    });

    this.eventEmitter.on('task:failed', (task: GISAgentTask) => {
      console.log(`Task failed: ${task.id} (${task.taskType})`);
    });
  }

  /**
   * Load active tasks from the database
   */
  private async loadActiveTasks(): Promise<void> {
    try {
      const tasks = await this.storage.getGISAgentTasks(undefined, TaskStatus.RUNNING);
      tasks.forEach((task: GISAgentTask) => {
        this.activeTasks.set(task.id, task);
      });
      console.log(`Loaded ${tasks.length} active tasks`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to load active tasks:', errorMessage);
      this.errorTrackingService.trackGisError(error, {
        component: 'GISAgentOrchestrationService',
        method: 'loadActiveTasks',
      });
      throw error;
    }
  }
}

// Export the singleton instance getter
export const getGISAgentOrchestrationService = (
  storage: IStorage
): GISAgentOrchestrationService => {
  return GISAgentOrchestrationService.getInstance(storage);
};

