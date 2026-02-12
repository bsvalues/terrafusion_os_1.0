import { Agent, AgentConfig, AgentTask, AgentTaskResult } from "../interfaces/agent";

/**
 * Abstract base agent class that implements common functionality
 * for all AI agents in the system
 */
export abstract class BaseAgent implements Agent {
  id: string;
  name: string;
  description: string;
  supportedTasks: string[];
  protected config: AgentConfig;
  protected taskHandlers: Map<string, (task: AgentTask<any>) => Promise<any>> = new Map();

  /**
   * Constructor
   * @param id Agent ID
   * @param name Agent name
   * @param description Agent description
   * @param supportedTasks Array of task types this agent supports
   */
  constructor(id: string, name: string, description: string, supportedTasks: string[] = []) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.supportedTasks = supportedTasks;
  }

  /**
   * Initialize the agent with configuration
   * @param config Agent configuration
   */
  async initialize(config: AgentConfig): Promise<void> {
    this.config = config;

    // Validate configuration
    this.validateConfig();

    // Perform any agent-specific initialization
    await this.onInitialize();

    console.log(
      `Agent ${this.name} (${this.id}) initialized with provider ${config.provider} and model ${config.model}`
    );
  }

  /**
   * Check if the agent can handle a specific task
   * @param task The task to check
   */
  canHandleTask(task: AgentTask<any>): boolean {
    return this.supportedTasks.includes(task.type);
  }

  /**
   * Execute a task with the agent
   * @param task The task to execute
   */
  async executeTask<T = any, R = any>(task: AgentTask<T>): Promise<AgentTaskResult<R>> {
    // Make sure the agent can handle this task
    if (!this.canHandleTask(task)) {
      return this.createErrorResult(
        task.id,
        `Agent ${this.name} cannot handle task type ${task.type}`
      );
    }

    // Create start time and result ID
    const startedAt = new Date();
    const resultId = `result-${task.id}`;

    try {
      // Pre-process the task
      await this.beforeTaskExecution(task);

      // Execute the task
      console.log(`Agent ${this.name} executing task ${task.id} of type ${task.type}`);
      const result = await this.processTask(task);

      // Post-process the result
      await this.afterTaskExecution(task, result);

      // Create success result
      return {
        id: resultId,
        taskId: task.id,
        success: true,
        data: result,
        startedAt,
        completedAt: new Date(),
      };
    } catch (error) {
      console.error(`Error executing task ${task.id}:`, error);

      // Check if we should retry
      if (task.maxRetries && task.retryCount && task.retryCount < task.maxRetries) {
        console.log(`Retrying task ${task.id} (${task.retryCount + 1}/${task.maxRetries})`);

        // Increment retry count
        const retryTask = {
          ...task,
          retryCount: (task.retryCount || 0) + 1,
        };

        // Retry the task
        return this.executeTask(retryTask);
      }

      // Create error result
      return this.createErrorResult(task.id, error.message || "Unknown error", startedAt);
    }
  }

  /**
   * Create an error result
   * @param taskId The ID of the task
   * @param errorMessage The error message
   * @param startedAt When the task was started (defaults to now)
   */
  protected createErrorResult(
    taskId: string,
    errorMessage: string,
    startedAt: Date = new Date()
  ): AgentTaskResult<any> {
    return {
      id: `result-${taskId}`,
      taskId,
      success: false,
      error: errorMessage,
      startedAt,
      completedAt: new Date(),
    };
  }

  /**
   * Validate the agent configuration
   * @throws Error if configuration is invalid
   */
  protected validateConfig(): void {
    if (!this.config) {
      throw new Error(`Agent ${this.name} has not been initialized`);
    }

    if (!this.config.provider) {
      throw new Error(`Agent ${this.name} is missing provider in configuration`);
    }

    if (!this.config.model) {
      throw new Error(`Agent ${this.name} is missing model in configuration`);
    }
  }

  /**
   * Agent-specific initialization logic
   * Override in subclasses to provide agent-specific initialization
   */
  protected async onInitialize(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Pre-processing before task execution
   * Override in subclasses to provide agent-specific pre-processing
   * @param task The task being executed
   */
  protected async beforeTaskExecution<T>(task: AgentTask<T>): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Process a task
   * Must be implemented by subclasses to provide agent-specific task processing
   * @param task The task to process
   */
  protected abstract processTask<T, R>(task: AgentTask<T>): Promise<R>;

  /**
   * Post-processing after task execution
   * Override in subclasses to provide agent-specific post-processing
   * @param task The task that was executed
   * @param result The result of the task
   */
  protected async afterTaskExecution<T, R>(task: AgentTask<T>, result: R): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Register a handler for a specific task type
   * @param taskType The type of task to handle
   * @param handler The handler function
   */
  protected registerTaskHandler(
    taskType: string,
    handler: (task: AgentTask<any>) => Promise<any>
  ): void {
    // Add to supported tasks
    if (!this.supportedTasks.includes(taskType)) {
      this.supportedTasks.push(taskType);
    }

    // Register the handler
    this.taskHandlers.set(taskType, handler);
  }

  /**
   * Get a handler for a specific task type
   * @param taskType The type of task to get a handler for
   * @returns The handler function or undefined if not found
   */
  protected getTaskHandler(taskType: string): ((task: AgentTask<any>) => Promise<any>) | undefined {
    return this.taskHandlers.get(taskType);
  }
}
