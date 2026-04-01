/**
 * Agent Replay Buffer Service
 * 
 * This service implements a shared replay buffer for the agent system, enabling
 * collaborative learning and experience sharing between agents. It serves as a
 * central mechanism for collecting, storing, and prioritizing agent experiences
 * for continuous improvement of the entire system.
 */

import { IStorage } from '../storage';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

/**
 * Agent Experience Record Structure
 */
export interface AgentExperience {
  experienceId: string;
  agentId: string;
  agentName: string;
  timestamp: Date;
  action: string;
  state: any;
  nextState: any;
  reward: number;
  metadata: {
    entityType?: string;
    entityId?: string;
    context?: any;
    priority?: number;
  };
}

/**
 * Prioritized Experience
 */
interface PrioritizedExperience {
  experience: AgentExperience;
  priority: number;
}

/**
 * Learning Update
 */
export interface LearningUpdate {
  updateId: string;
  timestamp: Date;
  sourceExperiences: string[];
  updateType: 'policy' | 'model' | 'rule';
  payload: any;
}

/**
 * Agent Replay Buffer Configuration
 */
export interface ReplayBufferConfig {
  maxSize: number;
  priorityScoreThreshold: number;
  samplingBatchSize: number;
  trainingInterval: number; // in milliseconds
}

/**
 * Agent Replay Buffer Service
 */
export class AgentReplayBufferService {
  private storage: IStorage;
  private buffer: Map<string, PrioritizedExperience> = new Map();
  private config: ReplayBufferConfig;
  private learningUpdates: LearningUpdate[] = [];
  private isTrainingScheduled: boolean = false;
  private lastTrainingTime: Date | null = null;
  private readonly componentName = 'Agent Replay Buffer';

  constructor(
    storage: IStorage,
    config: ReplayBufferConfig = {
      maxSize: 10000,
      priorityScoreThreshold: 0.7,
      samplingBatchSize: 64,
      trainingInterval: 60000 // Default to 1 minute
    }
  ) {
    this.storage = storage;
    this.config = config;

    // Log initialization
    logger.info({
      component: this.componentName,
      message: 'Agent Replay Buffer initialized',
      config
    });
  }

  /**
   * Add a new experience to the buffer
   */
  public async addExperience(experience: AgentExperience): Promise<string> {
    try {
      // Generate an ID if not provided
      if (!experience.experienceId) {
        experience.experienceId = uuidv4();
      }

      // Set timestamp if not provided
      if (!experience.timestamp) {
        experience.timestamp = new Date();
      }

      // Calculate priority score based on reward and metadata
      const priorityScore = this.calculatePriorityScore(experience);

      // Store the experience in the buffer
      this.buffer.set(experience.experienceId, {
        experience,
        priority: priorityScore
      });

      // If buffer exceeds max size, remove lowest priority experiences
      if (this.buffer.size > this.config.maxSize) {
        this.pruneBuffer();
      }

      // Log successful addition
      logger.debug({
        component: this.componentName,
        message: 'Added experience to buffer',
        experienceId: experience.experienceId,
        agentId: experience.agentId,
        priority: priorityScore
      });

      // If high priority experience, maybe schedule training
      if (priorityScore >= this.config.priorityScoreThreshold) {
        this.maybeScheduleTraining();
      }

      // Record the experience in system activity log
      await this.storage.createSystemActivity({
        activity_type: 'experience_recorded',
        component: this.componentName,
        status: 'info',
        details: {
          experienceId: experience.experienceId,
          agentId: experience.agentId,
          agentName: experience.agentName,
          action: experience.action,
          reward: experience.reward,
          priority: priorityScore
        },
        created_at: new Date()
      });

      return experience.experienceId;
    } catch (error) {
      logger.error({
        component: this.componentName,
        message: 'Error adding experience to buffer',
        error
      });
      throw error;
    }
  }

  /**
   * Calculate the priority score for an experience
   */
  private calculatePriorityScore(experience: AgentExperience): number {
    // Base priority on absolute reward value (both positive and negative rewards are valuable)
    let priorityScore = Math.abs(experience.reward);

    // Adjust priority based on metadata priority if provided
    if (experience.metadata && experience.metadata.priority !== undefined) {
      priorityScore = Math.max(priorityScore, experience.metadata.priority);
    }

    // Ensure priority is in the range [0, 1]
    return Math.min(Math.max(priorityScore, 0), 1);
  }

  /**
   * Prune the buffer by removing lowest priority experiences
   */
  private pruneBuffer(): void {
    // Convert buffer to array for sorting
    const experiences = Array.from(this.buffer.entries());

    // Sort by priority (lowest first)
    experiences.sort((a, b) => a[1].priority - b[1].priority);

    // Remove oldest, lowest priority experiences to reach target size
    const excessCount = this.buffer.size - this.config.maxSize;
    const toRemove = experiences.slice(0, excessCount).map(([id]) => id);

    // Remove from buffer
    toRemove.forEach(id => this.buffer.delete(id));

    logger.debug({
      component: this.componentName,
      message: 'Pruned replay buffer',
      removedCount: toRemove.length,
      newSize: this.buffer.size
    });
  }

  /**
   * Sample experiences from the buffer for training
   */
  public sampleExperiences(batchSize: number = this.config.samplingBatchSize, onlyHighPriority: boolean = false): AgentExperience[] {
    try {
      if (this.buffer.size === 0) {
        return [];
      }

      // Get all experiences
      let allExperiences = Array.from(this.buffer.values());

      // Filter by priority if required
      if (onlyHighPriority) {
        allExperiences = allExperiences.filter(
          item => item.priority >= this.config.priorityScoreThreshold
        );
      }

      // If not enough experiences, return all available
      if (allExperiences.length <= batchSize) {
        return allExperiences.map(item => item.experience);
      }

      // Use weighted random sampling based on priority
      const sampledExperiences: AgentExperience[] = [];
      const totalPriority = allExperiences.reduce((sum, item) => sum + item.priority, 0);

      for (let i = 0; i < batchSize; i++) {
        // Generate random value in range [0, totalPriority)
        const randomValue = Math.random() * totalPriority;
        
        // Find the experience that corresponds to this point in the accumulated priority
        let accumulatedPriority = 0;
        let selectedIndex = -1;
        
        for (let j = 0; j < allExperiences.length; j++) {
          accumulatedPriority += allExperiences[j].priority;
          if (accumulatedPriority >= randomValue) {
            selectedIndex = j;
            break;
          }
        }
        
        // Add the selected experience to the result
        if (selectedIndex >= 0) {
          sampledExperiences.push(allExperiences[selectedIndex].experience);
          
          // Remove the selected experience to avoid duplicates
          const removed = allExperiences.splice(selectedIndex, 1)[0];
          // Adjust totalPriority accordingly
          totalPriority -= removed.priority;
        }
      }

      logger.debug({
        component: this.componentName,
        message: 'Sampled experiences from buffer',
        sampleSize: sampledExperiences.length,
        totalAvailable: this.buffer.size
      });

      return sampledExperiences;
    } catch (error) {
      logger.error({
        component: this.componentName,
        message: 'Error sampling experiences from buffer',
        error
      });
      return [];
    }
  }

  /**
   * Maybe schedule training if not already scheduled
   */
  private maybeScheduleTraining(): void {
    // Skip if training is already scheduled
    if (this.isTrainingScheduled) {
      return;
    }

    // Check if enough time has passed since last training
    const now = new Date();
    if (this.lastTrainingTime && (now.getTime() - this.lastTrainingTime.getTime() < this.config.trainingInterval)) {
      return;
    }

    // Schedule training
    this.isTrainingScheduled = true;
    setTimeout(() => this.runTrainingCycle(), this.config.trainingInterval);

    logger.debug({
      component: this.componentName,
      message: 'Scheduled training cycle',
      interval: this.config.trainingInterval
    });
  }

  /**
   * Run a training cycle
   */
  private async runTrainingCycle(): Promise<void> {
    try {
      this.isTrainingScheduled = false;
      this.lastTrainingTime = new Date();

      // Sample high-priority experiences
      const experiences = this.sampleExperiences(this.config.samplingBatchSize, true);

      if (experiences.length === 0) {
        logger.debug({
          component: this.componentName,
          message: 'No experiences to train on, skipping training cycle'
        });
        return;
      }

      logger.info({
        component: this.componentName,
        message: 'Running training cycle',
        experienceCount: experiences.length
      });

      // Record the start of training
      await this.storage.createSystemActivity({
        activity_type: 'training_cycle_started',
        component: this.componentName,
        status: 'info',
        details: {
          experienceCount: experiences.length,
          timestamp: new Date().toISOString()
        },
        created_at: new Date()
      });

      // Generate learning update
      const update = await this.generateLearningUpdate(experiences);

      // Record the update
      this.learningUpdates.push(update);

      // Record the completion of training
      await this.storage.createSystemActivity({
        activity_type: 'training_cycle_completed',
        component: this.componentName,
        status: 'info',
        details: {
          updateId: update.updateId,
          experienceCount: experiences.length,
          updateType: update.updateType
        },
        created_at: new Date()
      });

      logger.info({
        component: this.componentName,
        message: 'Training cycle completed',
        updateId: update.updateId,
        updateType: update.updateType
      });
    } catch (error) {
      logger.error({
        component: this.componentName,
        message: 'Error running training cycle',
        error
      });

      // Record the failure
      await this.storage.createSystemActivity({
        activity_type: 'training_cycle_failed',
        component: this.componentName,
        status: 'error',
        details: {
          error: error.message,
          stack: error.stack
        },
        created_at: new Date()
      });
    }
  }

  /**
   * Generate a learning update from experiences
   */
  private async generateLearningUpdate(experiences: AgentExperience[]): Promise<LearningUpdate> {
    // In a real implementation, this would use ML techniques to generate updates
    // For now, we'll implement a simplified version that just aggregates experiences

    // Extract the actions and compute statistics
    const actionCounts: Record<string, number> = {};
    const rewards: Record<string, number[]> = {};
    const sourceExperiences: string[] = [];

    // Process each experience
    for (const exp of experiences) {
      sourceExperiences.push(exp.experienceId);
      
      // Count actions
      actionCounts[exp.action] = (actionCounts[exp.action] || 0) + 1;
      
      // Collect rewards by action
      if (!rewards[exp.action]) {
        rewards[exp.action] = [];
      }
      rewards[exp.action].push(exp.reward);
    }

    // Calculate average rewards per action
    const avgRewards: Record<string, number> = {};
    for (const [action, actionRewards] of Object.entries(rewards)) {
      avgRewards[action] = actionRewards.reduce((sum, val) => sum + val, 0) / actionRewards.length;
    }

    // Determine the most effective actions (highest average reward)
    const effectiveActions = Object.entries(avgRewards)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([action, reward]) => ({ action, avgReward: reward }));

    // Create the learning update
    const update: LearningUpdate = {
      updateId: uuidv4(),
      timestamp: new Date(),
      sourceExperiences,
      updateType: 'policy',
      payload: {
        actionCounts,
        avgRewards,
        effectiveActions,
        sampleSize: experiences.length
      }
    };

    return update;
  }

  /**
   * Get the most recent learning updates
   */
  public getRecentUpdates(count: number = 10): LearningUpdate[] {
    // Sort by timestamp (descending) and return the most recent updates
    return [...this.learningUpdates]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count);
  }

  /**
   * Get buffer statistics
   */
  public getBufferStats(): {
    size: number;
    maxSize: number;
    highPriorityCount: number;
    agentDistribution: Record<string, number>;
    actionDistribution: Record<string, number>;
    updateCount: number;
  } {
    // Count experiences by agent
    const agentDistribution: Record<string, number> = {};
    const actionDistribution: Record<string, number> = {};
    let highPriorityCount = 0;

    for (const { experience, priority } of this.buffer.values()) {
      // Count by agent
      agentDistribution[experience.agentId] = (agentDistribution[experience.agentId] || 0) + 1;
      
      // Count by action
      actionDistribution[experience.action] = (actionDistribution[experience.action] || 0) + 1;
      
      // Count high priority experiences
      if (priority >= this.config.priorityScoreThreshold) {
        highPriorityCount++;
      }
    }

    return {
      size: this.buffer.size,
      maxSize: this.config.maxSize,
      highPriorityCount,
      agentDistribution,
      actionDistribution,
      updateCount: this.learningUpdates.length
    };
  }

  /**
   * Clear the buffer
   */
  public clear(): void {
    this.buffer.clear();
    logger.info({
      component: this.componentName,
      message: 'Replay buffer cleared'
    });
  }
}