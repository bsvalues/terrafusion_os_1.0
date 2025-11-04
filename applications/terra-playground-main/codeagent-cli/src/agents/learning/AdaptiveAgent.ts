/**
 * AdaptiveAgent.ts
 *
 * Extension of BaseAgent with learning capabilities
 */

import {
  BaseAgent,
  AgentType,
  AgentCapability,
  AgentPriority,
  AgentTask,
  LogService,
  StateManager,
  LogLevel,
} from '../core';

import { LearningService, LearningParams } from './LearningService';

/**
 * Learning record
 */
export interface LearningRecord {
  id: string;
  taskType: string;
  input: string;
  output: string;
  feedback?: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Learning statistics
 */
export interface LearningStats {
  totalTasksHandled: number;
  successfulTasks: number;
  failedTasks: number;
  feedbackReceived: number;
  positiveRatio: number;
  mostCommonTaskTypes: { taskType: string; count: number }[];
}

/**
 * Adaptive agent enhances the base agent with learning capabilities
 */
export abstract class AdaptiveAgent extends BaseAgent {
  protected learningService: LearningService;
  protected stateManager: StateManager;
  protected learningHistory: LearningRecord[];
  protected learningEnabled: boolean = true;
  protected activeLearningEnabled: boolean = false;
  protected feedbackThreshold: number = 0.7;

  /**
   * Constructor
   * @param name Agent name
   * @param type Agent type
   * @param capabilities Agent capabilities
   * @param priority Agent priority
   */
  constructor(
    name: string,
    type: AgentType,
    capabilities: AgentCapability[],
    priority: AgentPriority
  ) {
    super(name, type, capabilities, priority);
    this.learningService = LearningService.getInstance();
    this.stateManager = StateManager.getInstance();
    this.learningHistory = [];
    this.logger = new LogService(`AdaptiveAgent(${name})`, LogLevel.DEBUG);
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<boolean> {
    this.logger.info('Initializing Adaptive Agent');

    try {
      // Load previous state if available
      const savedState = await this.stateManager.loadAgentState(this.id);
      if (savedState) {
        this.logger.debug('Restored previous state');

        // Restore learning history if available
        if (savedState.learningHistory) {
          this.learningHistory = savedState.learningHistory;
          this.logger.debug(`Restored ${this.learningHistory.length} learning records`);
        }

        // Restore learning settings if available
        if (savedState.learningSettings) {
          this.learningEnabled = savedState.learningSettings.enabled ?? true;
          this.activeLearningEnabled = savedState.learningSettings.activeLearning ?? false;
          this.feedbackThreshold = savedState.learningSettings.feedbackThreshold ?? 0.7;
        }
      }

      return await this.onInitialize();
    } catch (error) {
      this.logger.error(
        `Initialization error: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  /**
   * Specialized initialization logic to be implemented by concrete agents
   */
  protected abstract onInitialize(): Promise<boolean>;

  /**
   * Execute a task with learning enhancement
   * @param task Task to execute
   * @param context Task context
   */
  public async executeTask(task: AgentTask, context?: any): Promise<any> {
    this.logger.info(`Executing task with learning: ${task.type}`);

    const taskStart = Date.now();
    let result: any = null;
    let error: any = null;
    let learningApplied = false;

    try {
      // Check if we should apply learning for this task
      if (this.learningEnabled && this.shouldApplyLearning(task)) {
        // Get task-specific context
        const learningContext = this.getLearningContext(task);

        // Apply learning to enhance task execution
        result = await this.executeWithLearning(task, learningContext, context);
        learningApplied = true;
      } else {
        // Execute task without learning
        result = await this.executeTaskWithoutLearning(task, context);
      }

      // Record successful learning
      if (learningApplied) {
        this.recordLearning({
          id: `learning-${Date.now()}`,
          taskType: task.type,
          input: JSON.stringify(task.payload),
          output: JSON.stringify(result),
          timestamp: new Date(),
          metadata: {
            duration: Date.now() - taskStart,
            taskId: task.id,
          },
        });
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Task execution error: ${error instanceof Error ? error.message : String(error)}`
      );

      // Record failed learning
      if (learningApplied) {
        this.recordLearning({
          id: `learning-${Date.now()}`,
          taskType: task.type,
          input: JSON.stringify(task.payload),
          output: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
          feedback: 'negative',
          timestamp: new Date(),
          metadata: {
            duration: Date.now() - taskStart,
            taskId: task.id,
            error: true,
          },
        });
      }

      throw error;
    }
  }

  /**
   * Execute task without learning enhancement
   * @param task Task to execute
   * @param context Task context
   */
  protected abstract executeTaskWithoutLearning(task: AgentTask, context?: any): Promise<any>;

  /**
   * Determine if learning should be applied to this task
   * @param task Task to check
   */
  protected shouldApplyLearning(task: AgentTask): boolean {
    // Implement logic to determine when to apply learning
    // For example, based on task type, complexity, or history

    // Example: Always apply learning for certain task types
    const alwaysLearnTaskTypes = this.getAlwaysLearnTaskTypes();
    if (alwaysLearnTaskTypes.includes(task.type)) {
      return true;
    }

    // Example: Apply learning for tasks with high priority
    if (task.priority === 'high') {
      return true;
    }

    // Example: Apply learning for complex tasks
    const taskComplexity = this.getTaskComplexity(task);
    if (taskComplexity > 0.7) {
      return true;
    }

    // Default to agent-wide setting
    return this.learningEnabled;
  }

  /**
   * Get task types that should always use learning
   */
  protected abstract getAlwaysLearnTaskTypes(): string[];

  /**
   * Get the complexity of a task (0.0 to 1.0)
   * @param task Task to analyze
   */
  protected abstract getTaskComplexity(task: AgentTask): number;

  /**
   * Get learning context for a task
   * @param task Task to get context for
   */
  protected getLearningContext(task: AgentTask): string[] {
    // Default implementation - should be overridden by concrete agents
    const context = [
      `You are assisting the ${this.name} agent in executing a ${task.type} task.`,
      `The agent has capabilities: ${this.capabilities.join(', ')}.`,
      `Your goal is to help improve the agent's performance on this task.`,
      `The agent has executed ${this.getLearningStats().totalTasksHandled} tasks before with a ${Math.round(this.getLearningStats().positiveRatio * 100)}% success rate.`,
    ];

    // Add task-specific context
    context.push(`The specific task is: ${task.type}`);
    context.push(`The task payload contains: ${Object.keys(task.payload).join(', ')}`);

    // Add previous examples of this task type
    const previousExamples = this.getPreviousExamples(task.type, 3);
    if (previousExamples.length > 0) {
      context.push('Here are some previous examples of similar tasks:');
      previousExamples.forEach((example /* , index */) => {
        context.push(`Example ${index + 1}:`);
        context.push(`Input: ${example.input}`);
        context.push(`Output: ${example.output}`);
        context.push(`Feedback: ${example.feedback || 'none'}`);
      });
    }

    return context;
  }

  /**
   * Execute a task with learning enhancement
   * @param task Task to execute
   * @param learningContext Context for learning
   * @param taskContext Context for task execution
   */
  protected async executeWithLearning(
    task: AgentTask,
    learningContext: string[],
    taskContext?: any
  ): Promise<any> {
    try {
      // Prepare task input for learning
      const taskInput = this.prepareTaskInputForLearning(task);

      // Set up learning parameters
      const learningParams: LearningParams = {
        input: taskInput,
        context: learningContext,
        // Choose model type based on task complexity or other factors
        modelType: this.selectModelForTask(task),
        options: {
          // Customize options based on task
          temperature: this.getTemperatureForTask(task),
          maxTokens: 2048,
        },
      };

      // Get learning guidance
      const learningOutput = await this.learningService.learn(learningParams);

      // Use learning output to enhance task execution
      return await this.applyLearningToTask(task, learningOutput, taskContext);
    } catch (error) {
      this.logger.error(
        `Learning execution error: ${error instanceof Error ? error.message : String(error)}`
      );

      // Fall back to standard execution if learning fails
      this.logger.info('Falling back to standard execution');
      return await this.executeTaskWithoutLearning(task, taskContext);
    }
  }

  /**
   * Prepare task input for learning
   * @param task Task to prepare
   */
  protected prepareTaskInputForLearning(task: AgentTask): string {
    // Default implementation - should be overridden by concrete agents
    return `
Task Type: ${task.type}
Task ID: ${task.id}
Task Priority: ${task.priority || 'normal'}
Payload: ${JSON.stringify(task.payload, null, 2)}

Please analyze this task and provide guidance on how to execute it optimally.
Include any relevant insights, patterns, or considerations that would improve the execution quality.
`;
  }

  /**
   * Select the appropriate model for a task
   * @param task Task to select model for
   */
  protected selectModelForTask(task: AgentTask): 'anthropic' | 'perplexity' {
    // Default implementation - should be overridden by concrete agents
    // For example, use Anthropic for complex reasoning, Perplexity for up-to-date info

    // Check if task needs up-to-date information
    if (this.taskNeedsUpToDateInfo(task)) {
      return 'perplexity';
    }

    // Default to Anthropic for most tasks
    return 'anthropic';
  }

  /**
   * Check if task needs up-to-date information
   * @param task Task to check
   */
  protected abstract taskNeedsUpToDateInfo(task: AgentTask): boolean;

  /**
   * Get appropriate temperature value for a task
   * @param task Task to get temperature for
   */
  protected getTemperatureForTask(task: AgentTask): number {
    // Default implementation - should be overridden by concrete agents
    // Lower temperature for precise tasks, higher for creative ones

    // Example: Base temperature on task type
    const creativeTaskTypes = this.getCreativeTaskTypes();
    if (creativeTaskTypes.includes(task.type)) {
      return 0.8; // Higher temperature for creative tasks
    }

    // Example: Lower temperature for high priority tasks
    if (task.priority === 'high') {
      return 0.3; // More precise for important tasks
    }

    // Default temperature
    return 0.5;
  }

  /**
   * Get task types that require creativity
   */
  protected abstract getCreativeTaskTypes(): string[];

  /**
   * Apply learning output to task execution
   * @param task Task to execute
   * @param learningOutput Output from learning service
   * @param context Task context
   */
  protected abstract applyLearningToTask(
    task: AgentTask,
    learningOutput: string,
    context?: any
  ): Promise<any>;

  /**
   * Record a learning experience
   * @param record Learning record
   */
  protected recordLearning(record: LearningRecord): void {
    this.learningHistory.push(record);

    // Limit history size to prevent memory issues
    const maxHistorySize = 1000;
    if (this.learningHistory.length > maxHistorySize) {
      // Remove oldest records, keeping a balanced sample
      this.learningHistory = this.learningHistory.slice(-maxHistorySize);
    }

    // Save state
    this.stateManager.saveAgentState(this.id, {
      learningHistory: this.learningHistory,
      learningSettings: {
        enabled: this.learningEnabled,
        activeLearning: this.activeLearningEnabled,
        feedbackThreshold: this.feedbackThreshold,
      },
    });
  }

  /**
   * Get previous examples of a task type
   * @param taskType Task type to get examples for
   * @param count Maximum number of examples to return
   */
  protected getPreviousExamples(taskType: string, count: number): LearningRecord[] {
    return this.learningHistory
      .filter(record => record.taskType === taskType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count);
  }

  /**
   * Get learning statistics
   */
  public getLearningStats(): LearningStats {
    const totalTasks = this.learningHistory.length;
    const successfulTasks = this.learningHistory.filter(
      record => record.feedback === 'positive'
    ).length;
    const failedTasks = this.learningHistory.filter(
      record => record.feedback === 'negative'
    ).length;
    const feedbackReceived = this.learningHistory.filter(record => record.feedback).length;

    // Group by task type
    const taskTypeCounts = this.learningHistory.reduce(
      (acc, record) => {
        acc[record.taskType] = (acc[record.taskType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Convert to array and sort
    const mostCommonTaskTypes = Object.entries(taskTypeCounts)
      .map(([taskType, count]) => ({ taskType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalTasksHandled: totalTasks,
      successfulTasks,
      failedTasks,
      feedbackReceived,
      positiveRatio: totalTasks > 0 ? successfulTasks / totalTasks : 0,
      mostCommonTaskTypes,
    };
  }

  /**
   * Enable or disable learning
   * @param enabled Whether learning should be enabled
   */
  public setLearningEnabled(enabled: boolean): void {
    this.learningEnabled = enabled;

    // Save state
    this.stateManager.saveAgentState(this.id, {
      learningSettings: {
        enabled,
        activeLearning: this.activeLearningEnabled,
        feedbackThreshold: this.feedbackThreshold,
      },
    });

    this.logger.info(`Learning ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable or disable active learning
   * @param enabled Whether active learning should be enabled
   */
  public setActiveLearningEnabled(enabled: boolean): void {
    this.activeLearningEnabled = enabled;

    // Save state
    this.stateManager.saveAgentState(this.id, {
      learningSettings: {
        enabled: this.learningEnabled,
        activeLearning: enabled,
        feedbackThreshold: this.feedbackThreshold,
      },
    });

    this.logger.info(`Active learning ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set feedback threshold
   * @param threshold Feedback threshold (0.0 to 1.0)
   */
  public setFeedbackThreshold(threshold: number): void {
    this.feedbackThreshold = Math.max(0, Math.min(1, threshold));

    // Save state
    this.stateManager.saveAgentState(this.id, {
      learningSettings: {
        enabled: this.learningEnabled,
        activeLearning: this.activeLearningEnabled,
        feedbackThreshold: this.feedbackThreshold,
      },
    });

    this.logger.info(`Feedback threshold set to ${this.feedbackThreshold}`);
  }

  /**
   * Provide feedback on a learning record
   * @param recordId Learning record ID
   * @param feedback Feedback value
   */
  public provideFeedback(recordId: string, feedback: 'positive' | 'negative' | 'neutral'): boolean {
    const recordIndex = this.learningHistory.findIndex(record => record.id === recordId);

    if (recordIndex === -1) {
      this.logger.warn(`Learning record not found: ${recordId}`);
      return false;
    }

    // Update feedback
    this.learningHistory[recordIndex].feedback = feedback;

    // Save state
    this.stateManager.saveAgentState(this.id, {
      learningHistory: this.learningHistory,
    });

    this.logger.info(`Feedback provided for learning record ${recordId}: ${feedback}`);
    return true;
  }

  /**
   * Custom shutdown logic
   * @param force Whether shutdown is forced
   */
  protected async onShutdown(force: boolean): Promise<void> {
    // Save state before shutting down
    await this.stateManager.saveAgentState(this.id, {
      learningHistory: this.learningHistory,
      learningSettings: {
        enabled: this.learningEnabled,
        activeLearning: this.activeLearningEnabled,
        feedbackThreshold: this.feedbackThreshold,
      },
    });
  }
}
