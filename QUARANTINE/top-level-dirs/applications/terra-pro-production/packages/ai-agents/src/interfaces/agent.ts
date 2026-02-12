/**
 * Base Agent interface
 * All AI agents in the system must implement this interface
 */
export interface Agent {
  /**
   * Unique identifier for the agent
   */
  id: string;

  /**
   * Name of the agent
   */
  name: string;

  /**
   * Description of the agent and its capabilities
   */
  description: string;

  /**
   * Array of task types this agent can handle
   */
  supportedTasks: string[];

  /**
   * Initialize the agent with configuration
   */
  initialize(config: AgentConfig): Promise<void>;

  /**
   * Execute a task with the agent
   */
  executeTask<T = any, R = any>(task: AgentTask<T>): Promise<AgentTaskResult<R>>;

  /**
   * Check if the agent can handle a specific task
   */
  canHandleTask(task: AgentTask<any>): boolean;
}

/**
 * Agent configuration interface
 */
export interface AgentConfig {
  /**
   * AI provider to use (e.g., 'openai', 'anthropic')
   */
  provider: string;

  /**
   * Model to use for the agent (e.g., 'gpt-4o', 'claude-3-7-sonnet-20250219')
   */
  model: string;

  /**
   * Context templates for various task types
   */
  contextTemplates?: Record<string, string>;

  /**
   * Additional settings for the agent
   */
  settings?: Record<string, any>;
}

/**
 * Agent task interface
 */
export interface AgentTask<T = any> {
  /**
   * Unique identifier for the task
   */
  id: string;

  /**
   * Type of task
   */
  type: string;

  /**
   * Priority of the task (lower number = higher priority)
   */
  priority: number;

  /**
   * Task-specific data
   */
  data: T;

  /**
   * Context information for the task
   */
  context?: Record<string, any>;

  /**
   * Maximum number of retries for this task
   */
  maxRetries?: number;

  /**
   * Number of times this task has been retried
   */
  retryCount?: number;

  /**
   * Task timeout in milliseconds
   */
  timeout?: number;

  /**
   * When the task was created
   */
  createdAt?: Date;

  /**
   * When the task is due to be executed
   */
  scheduledFor?: Date;
}

/**
 * Agent task result interface
 */
export interface AgentTaskResult<T = any> {
  /**
   * Unique identifier for the result
   */
  id: string;

  /**
   * ID of the task this result is for
   */
  taskId: string;

  /**
   * Whether the task was successful
   */
  success: boolean;

  /**
   * Result data
   */
  data?: T;

  /**
   * Error message if the task failed
   */
  error?: string;

  /**
   * Usage metrics (e.g., tokens used)
   */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    [key: string]: any;
  };

  /**
   * When the task was started
   */
  startedAt: Date;

  /**
   * When the task was completed
   */
  completedAt: Date;
}
