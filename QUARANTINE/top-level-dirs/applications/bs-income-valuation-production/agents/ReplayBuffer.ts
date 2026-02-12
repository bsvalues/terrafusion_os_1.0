/**
 * Replay Buffer Implementation
 * 
 * This module implements a replay buffer for agent experiences.
 * It provides storage, retrieval and management of agent experiences
 * to facilitate continuous learning.
 */

import { AgentExperience, EventType } from '../shared/agentProtocol';

/**
 * Priority bucket for categorizing experiences
 */
enum PriorityBucket {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Configuration for the replay buffer
 */
interface ReplayBufferConfig {
  maxSize: number;                 // Maximum number of experiences to store
  priorityThresholds: {
    high: number;                  // Threshold for high priority (0-1)
    medium: number;                // Threshold for medium priority (0-1)
  };
  expiryTimeMs: number;            // Time in ms before experiences expire
  excludeEventTypes?: EventType[]; // Event types to exclude from buffer
}

/**
 * Default configuration for the replay buffer
 */
const DEFAULT_CONFIG: ReplayBufferConfig = {
  maxSize: 1000,
  priorityThresholds: {
    high: 0.8,
    medium: 0.5
  },
  expiryTimeMs: 30 * 24 * 60 * 60 * 1000, // 30 days
  excludeEventTypes: [
    EventType.HEARTBEAT,
    EventType.STATUS_UPDATE
  ]
};

/**
 * Replay Buffer for storing and managing agent experiences
 */
export class ReplayBuffer {
  private buffer: Map<string, AgentExperience> = new Map();
  private indexByAgent: Map<string, Set<string>> = new Map();
  private indexByPriority: {
    [PriorityBucket.HIGH]: Set<string>;
    [PriorityBucket.MEDIUM]: Set<string>;
    [PriorityBucket.LOW]: Set<string>;
  };
  private indexByTimestamp: Map<string, number> = new Map();
  private config: ReplayBufferConfig;
  
  /**
   * Create a new ReplayBuffer
   * @param config Configuration for the buffer
   */
  constructor(config: Partial<ReplayBufferConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      priorityThresholds: {
        ...DEFAULT_CONFIG.priorityThresholds,
        ...config.priorityThresholds
      }
    };
    
    // Initialize priority index
    this.indexByPriority = {
      [PriorityBucket.HIGH]: new Set<string>(),
      [PriorityBucket.MEDIUM]: new Set<string>(),
      [PriorityBucket.LOW]: new Set<string>()
    };
  }
  
  /**
   * Add an experience to the buffer
   * @param experience The experience to add
   * @returns True if added successfully
   */
  public addExperience(experience: AgentExperience): boolean {
    // Check if we should exclude this experience
    if (this.shouldExcludeExperience(experience)) {
      return false;
    }
    
    // Ensure we have capacity (enforce maxSize)
    if (this.buffer.size >= this.config.maxSize) {
      this.evictOldestExperience();
    }
    
    // Add to main buffer
    this.buffer.set(experience.experienceId, experience);
    
    // Update agent index
    if (!this.indexByAgent.has(experience.agentId)) {
      this.indexByAgent.set(experience.agentId, new Set<string>());
    }
    this.indexByAgent.get(experience.agentId)!.add(experience.experienceId);
    
    // Update priority index
    const priority = this.getPriority(experience);
    this.indexByPriority[priority].add(experience.experienceId);
    
    // Update timestamp index
    const timestamp = new Date(experience.timestamp).getTime();
    this.indexByTimestamp.set(experience.experienceId, timestamp);
    
    return true;
  }
  
  /**
   * Get experiences for a specific agent
   * @param agentId The agent ID
   * @param limit Maximum number of experiences to return
   * @returns Array of experiences
   */
  public getExperiencesByAgent(agentId: string, limit: number = 100): AgentExperience[] {
    const experiences: AgentExperience[] = [];
    
    // Get experience IDs for this agent
    const experienceIds = this.indexByAgent.get(agentId) || new Set<string>();
    
    // Convert to array and limit
    for (const id of Array.from(experienceIds).slice(0, limit)) {
      const experience = this.buffer.get(id);
      if (experience) {
        experiences.push(experience);
      }
    }
    
    return experiences;
  }
  
  /**
   * Get experiences by priority
   * @param priority The priority bucket
   * @param limit Maximum number of experiences to return
   * @returns Array of experiences
   */
  public getExperiencesByPriority(priority: PriorityBucket, limit: number = 100): AgentExperience[] {
    const experiences: AgentExperience[] = [];
    
    // Get experience IDs for this priority
    const experienceIds = this.indexByPriority[priority];
    
    // Convert to array and limit
    for (const id of Array.from(experienceIds).slice(0, limit)) {
      const experience = this.buffer.get(id);
      if (experience) {
        experiences.push(experience);
      }
    }
    
    return experiences;
  }
  
  /**
   * Get all experiences
   * @param limit Maximum number of experiences to return
   * @returns Array of experiences
   */
  public getAllExperiences(limit: number = 100): AgentExperience[] {
    // Convert to array and limit
    return Array.from(this.buffer.values()).slice(0, limit);
  }
  
  /**
   * Get recent experiences
   * @param limit Maximum number of experiences to return
   * @returns Array of experiences
   */
  public getRecentExperiences(limit: number = 100): AgentExperience[] {
    // Get all experiences and sort by timestamp (newest first)
    return Array.from(this.buffer.values())
      .sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
  }
  
  /**
   * Get a balanced sample of experiences
   * @param limit Maximum number of experiences to return
   * @returns Array of experiences
   */
  public getBalancedSample(limit: number = 100): AgentExperience[] {
    const experiences: AgentExperience[] = [];
    
    // Calculate how many experiences to take from each priority
    const highCount = Math.ceil(limit * 0.5);  // 50% high priority
    const mediumCount = Math.ceil(limit * 0.3); // 30% medium priority
    const lowCount = Math.floor(limit * 0.2);   // 20% low priority
    
    // Get experiences from each priority
    const highExperiences = this.getExperiencesByPriority(PriorityBucket.HIGH, highCount);
    const mediumExperiences = this.getExperiencesByPriority(PriorityBucket.MEDIUM, mediumCount);
    const lowExperiences = this.getExperiencesByPriority(PriorityBucket.LOW, lowCount);
    
    // Combine and shuffle
    experiences.push(...highExperiences, ...mediumExperiences, ...lowExperiences);
    this.shuffle(experiences);
    
    return experiences.slice(0, limit);
  }
  
  /**
   * Clean up expired experiences
   * @returns Number of experiences removed
   */
  public cleanupExpiredExperiences(): number {
    let removed = 0;
    const now = Date.now();
    const expiryThreshold = now - this.config.expiryTimeMs;
    
    // Check all experiences against expiry time
    // Convert to array to avoid iterator issues
    Array.from(this.indexByTimestamp.entries()).forEach(([id, timestamp]) => {
      if (timestamp < expiryThreshold) {
        // Experience has expired, remove it
        this.removeExperience(id);
        removed++;
      }
    });
    
    return removed;
  }
  
  /**
   * Get the size of the buffer
   * @returns Number of experiences in the buffer
   */
  public getSize(): number {
    return this.buffer.size;
  }
  
  /**
   * Get statistics about the buffer
   * @returns Statistics object
   */
  public getStats(): any {
    return {
      totalExperiences: this.buffer.size,
      byPriority: {
        high: this.indexByPriority[PriorityBucket.HIGH].size,
        medium: this.indexByPriority[PriorityBucket.MEDIUM].size,
        low: this.indexByPriority[PriorityBucket.LOW].size
      },
      byAgent: Object.fromEntries(
        Array.from(this.indexByAgent.entries()).map(([agentId, experiences]) => 
          [agentId, experiences.size]
        )
      ),
      config: this.config
    };
  }
  
  /**
   * Determine if an experience should be excluded
   * @param experience The experience to check
   * @returns True if it should be excluded
   */
  private shouldExcludeExperience(experience: AgentExperience): boolean {
    // Check if event type is in excludeEventTypes
    if (this.config.excludeEventTypes?.includes(experience.metadata.messageType)) {
      return true;
    }
    
    // Additional exclusion logic could be added here
    
    return false;
  }
  
  /**
   * Get the priority bucket for an experience
   * @param experience The experience to categorize
   * @returns The priority bucket
   */
  private getPriority(experience: AgentExperience): PriorityBucket {
    // Determine priority based on metadata
    if (experience.metadata.successRate !== undefined) {
      // Success rate based priority
      const successRate = experience.metadata.successRate;
      if (successRate <= 0.2) {
        // Low success rate = high priority
        return PriorityBucket.HIGH;
      } else if (successRate <= 0.5) {
        // Medium success rate = medium priority
        return PriorityBucket.MEDIUM;
      }
    }
    
    // Event type based priority
    if (experience.metadata.messageType === EventType.ERROR) {
      return PriorityBucket.HIGH;
    } else if (experience.metadata.messageType === EventType.ASSISTANCE_REQUESTED || 
               experience.metadata.messageType === EventType.ASSISTANCE_PROVIDED) {
      return PriorityBucket.MEDIUM;
    }
    
    // Default to low priority
    return PriorityBucket.LOW;
  }
  
  /**
   * Remove the oldest experience from the buffer
   */
  private evictOldestExperience(): void {
    // Find the oldest experience by timestamp
    let oldestId: string | null = null;
    let oldestTimestamp = Date.now();
    
    // Convert to array to avoid iterator issues
    Array.from(this.indexByTimestamp.entries()).forEach(([id, timestamp]) => {
      if (timestamp < oldestTimestamp) {
        oldestId = id;
        oldestTimestamp = timestamp;
      }
    });
    
    // Remove the oldest experience
    if (oldestId) {
      this.removeExperience(oldestId);
    }
  }
  
  /**
   * Remove an experience from the buffer and all indexes
   * @param experienceId The ID of the experience to remove
   */
  private removeExperience(experienceId: string): void {
    const experience = this.buffer.get(experienceId);
    if (!experience) return;
    
    // Remove from main buffer
    this.buffer.delete(experienceId);
    
    // Remove from agent index
    const agentIndex = this.indexByAgent.get(experience.agentId);
    if (agentIndex) {
      agentIndex.delete(experienceId);
      if (agentIndex.size === 0) {
        this.indexByAgent.delete(experience.agentId);
      }
    }
    
    // Remove from priority index
    const priority = this.getPriority(experience);
    this.indexByPriority[priority].delete(experienceId);
    
    // Remove from timestamp index
    this.indexByTimestamp.delete(experienceId);
  }
  
  /**
   * Shuffle an array in place
   * @param array The array to shuffle
   */
  private shuffle<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}