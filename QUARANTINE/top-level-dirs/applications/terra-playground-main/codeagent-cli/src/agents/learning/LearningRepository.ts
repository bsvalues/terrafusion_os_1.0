/**
 * LearningRepository.ts
 *
 * Central repository for sharing learning across agents
 */

import { StateManager, LogService, LogLevel } from '../core';
import { LearningRecord } from './AdaptiveAgent';

/**
 * Learning summary
 */
export interface LearningSummary {
  totalRecords: number;
  byAgentType: Record<string, number>;
  byTaskType: Record<string, number>;
  byFeedback: {
    positive: number;
    negative: number;
    neutral: number;
    unrated: number;
  };
  recentActivity: {
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };
}

/**
 * Learning query
 */
export interface LearningQuery {
  agentId?: string;
  agentType?: string;
  taskType?: string;
  feedback?: 'positive' | 'negative' | 'neutral' | null;
  timeRange?: {
    start?: Date;
    end?: Date;
  };
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'taskType' | 'feedback';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Central repository for sharing and analyzing learning across agents
 */
export class LearningRepository {
  private static instance: LearningRepository;
  private stateManager: StateManager;
  private logger: LogService;
  private learningRecords: Map<string, LearningRecord[]> = new Map();
  private globalInsights: Record<string, any> = {};

  /**
   * Private constructor (singleton)
   */
  private constructor() {
    this.stateManager = StateManager.getInstance();
    this.logger = new LogService('LearningRepository', LogLevel.INFO);
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): LearningRepository {
    if (!LearningRepository.instance) {
      LearningRepository.instance = new LearningRepository();
    }
    return LearningRepository.instance;
  }

  /**
   * Initialize the repository
   */
  private async initialize(): Promise<void> {
    try {
      // Load saved learning records
      const savedState = await this.stateManager.loadAgentState('learning-repository');
      if (savedState && savedState.records) {
        for (const [agentId, records] of Object.entries(savedState.records)) {
          this.learningRecords.set(agentId, records as LearningRecord[]);
        }
      }

      // Load global insights
      if (savedState && savedState.globalInsights) {
        this.globalInsights = savedState.globalInsights;
      }

      this.logger.info(`Initialized with ${this.getTotalRecordCount()} learning records`);
    } catch (error) {
      this.logger.error(
        `Initialization error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Store a learning record
   * @param agentId Agent ID
   * @param record Learning record
   */
  public storeRecord(agentId: string, record: LearningRecord): void {
    // Get or create agent records array
    if (!this.learningRecords.has(agentId)) {
      this.learningRecords.set(agentId, []);
    }

    // Add record
    this.learningRecords.get(agentId)?.push(record);

    // Save state
    this.saveState();

    // Analyze for insights (async)
    this.analyzeForInsights(agentId, record).catch(err => {
      this.logger.error(
        `Error analyzing for insights: ${err instanceof Error ? err.message : String(err)}`
      );
    });
  }

  /**
   * Store multiple learning records
   * @param agentId Agent ID
   * @param records Learning records
   */
  public storeRecords(agentId: string, records: LearningRecord[]): void {
    // Get or create agent records array
    if (!this.learningRecords.has(agentId)) {
      this.learningRecords.set(agentId, []);
    }

    // Add records
    this.learningRecords.get(agentId)?.push(...records);

    // Save state
    this.saveState();

    // Analyze for insights (async)
    this.analyzeForInsightsBatch(agentId, records).catch(err => {
      this.logger.error(
        `Error analyzing for insights batch: ${err instanceof Error ? err.message : String(err)}`
      );
    });
  }

  /**
   * Get learning records for an agent
   * @param agentId Agent ID
   * @param query Query parameters
   */
  public getRecords(agentId: string, query?: LearningQuery): LearningRecord[] {
    const records = this.learningRecords.get(agentId) || [];

    // Apply query filters
    return this.filterRecords(records, query);
  }

  /**
   * Query learning records across all agents
   * @param query Query parameters
   */
  public queryRecords(query?: LearningQuery): LearningRecord[] {
    // Collect all records
    const allRecords: LearningRecord[] = [];
    for (const [agentId, records] of this.learningRecords.entries()) {
      // Filter by agentId if specified
      if (!query?.agentId || query.agentId === agentId) {
        allRecords.push(...records);
      }
    }

    // Apply other query filters
    return this.filterRecords(allRecords, query);
  }

  /**
   * Filter records based on query parameters
   * @param records Records to filter
   * @param query Query parameters
   */
  private filterRecords(records: LearningRecord[], query?: LearningQuery): LearningRecord[] {
    if (!query) {
      return records;
    }

    let filtered = [...records];

    // Filter by task type
    if (query.taskType) {
      filtered = filtered.filter(record => record.taskType === query.taskType);
    }

    // Filter by feedback
    if (query.feedback !== undefined) {
      if (query.feedback === null) {
        // Filter for records with no feedback
        filtered = filtered.filter(record => record.feedback === undefined);
      } else {
        // Filter for records with specific feedback
        filtered = filtered.filter(record => record.feedback === query.feedback);
      }
    }

    // Filter by time range
    if (query.timeRange) {
      if (query.timeRange.start) {
        filtered = filtered.filter(record => record.timestamp >= query.timeRange!.start!);
      }
      if (query.timeRange.end) {
        filtered = filtered.filter(record => record.timestamp <= query.timeRange!.end!);
      }
    }

    // Sort
    const sortBy = query.sortBy || 'timestamp';
    const sortDirection = query.sortDirection || 'desc';

    filtered.sort((a, b) => {
      let comparison: number;

      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'taskType':
          comparison = a.taskType.localeCompare(b.taskType);
          break;
        case 'feedback':
          // Handle undefined feedback
          const feedbackA = a.feedback || '';
          const feedbackB = b.feedback || '';
          comparison = feedbackA.localeCompare(feedbackB);
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Apply limit and offset
    if (query.offset !== undefined || query.limit !== undefined) {
      const offset = query.offset || 0;
      const limit = query.limit || filtered.length;
      filtered = filtered.slice(offset, offset + limit);
    }

    return filtered;
  }

  /**
   * Get a summary of learning records
   */
  public getSummary(): LearningSummary {
    // Initialize summary
    const summary: LearningSummary = {
      totalRecords: 0,
      byAgentType: {},
      byTaskType: {},
      byFeedback: {
        positive: 0,
        negative: 0,
        neutral: 0,
        unrated: 0,
      },
      recentActivity: {
        lastDay: 0,
        lastWeek: 0,
        lastMonth: 0,
      },
    };

    // Calculate time thresholds
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Process all records
    for (const records of this.learningRecords.values()) {
      summary.totalRecords += records.length;

      for (const record of records) {
        // By agent type
        const agentType = record.metadata?.agentType || 'unknown';
        summary.byAgentType[agentType] = (summary.byAgentType[agentType] || 0) + 1;

        // By task type
        summary.byTaskType[record.taskType] = (summary.byTaskType[record.taskType] || 0) + 1;

        // By feedback
        if (record.feedback === 'positive') {
          summary.byFeedback.positive++;
        } else if (record.feedback === 'negative') {
          summary.byFeedback.negative++;
        } else if (record.feedback === 'neutral') {
          summary.byFeedback.neutral++;
        } else {
          summary.byFeedback.unrated++;
        }

        // By recency
        if (record.timestamp >= oneDayAgo) {
          summary.recentActivity.lastDay++;
        }
        if (record.timestamp >= oneWeekAgo) {
          summary.recentActivity.lastWeek++;
        }
        if (record.timestamp >= oneMonthAgo) {
          summary.recentActivity.lastMonth++;
        }
      }
    }

    return summary;
  }

  /**
   * Get global insights
   */
  public getGlobalInsights(): Record<string, any> {
    return { ...this.globalInsights };
  }

  /**
   * Get task-specific insights
   * @param taskType Task type
   */
  public getTaskInsights(taskType: string): Record<string, any> {
    return this.globalInsights.taskTypes?.[taskType] || {};
  }

  /**
   * Get similar historical records
   * @param record Record to find similar records for
   * @param limit Maximum number of records to return
   */
  public getSimilarRecords(record: LearningRecord, limit: number = 5): LearningRecord[] {
    // Query for records of the same task type
    const sameTaskRecords = this.queryRecords({
      taskType: record.taskType,
      limit: 100, // Get a larger set to find the most similar
      sortBy: 'timestamp',
      sortDirection: 'desc',
    });

    // Calculate similarity scores
    const scoredRecords = sameTaskRecords
      .filter(r => r.id !== record.id) // Exclude the record itself
      .map(r => ({
        record: r,
        score: this.calculateSimilarity(record, r),
      }))
      .sort((a, b) => b.score - a.score) // Sort by similarity descending
      .slice(0, limit) // Take top N
      .map(sr => sr.record);

    return scoredRecords;
  }

  /**
   * Calculate similarity between two learning records
   * @param record1 First record
   * @param record2 Second record
   */
  private calculateSimilarity(record1: LearningRecord, record2: LearningRecord): number {
    // This would be a more sophisticated algorithm
    // For now, it's a simple implementation

    let score = 0;

    // Same task type is a strong indicator
    if (record1.taskType === record2.taskType) {
      score += 0.5;
    }

    // Same feedback is a moderate indicator
    if (record1.feedback && record2.feedback && record1.feedback === record2.feedback) {
      score += 0.2;
    }

    // Input similarity
    try {
      // Simple text similarity (in a real implementation, this would be more sophisticated)
      const input1 = record1.input.toLowerCase();
      const input2 = record2.input.toLowerCase();

      // Calculate word overlap
      const words1 = new Set(input1.split(/\s+/));
      const words2 = new Set(input2.split(/\s+/));

      const intersection = new Set([...words1].filter(x => words2.has(x)));
      const union = new Set([...words1, ...words2]);

      const jaccard = intersection.size / union.size;
      score += jaccard * 0.3; // Input similarity contributes up to 0.3
    } catch (error) {
      // If input is not comparable, just ignore this factor
    }

    return score;
  }

  /**
   * Get total record count
   */
  private getTotalRecordCount(): number {
    let total = 0;
    for (const records of this.learningRecords.values()) {
      total += records.length;
    }
    return total;
  }

  /**
   * Save repository state
   */
  private async saveState(): Promise<void> {
    try {
      // Convert Map to Object for storage
      const recordsObj: Record<string, LearningRecord[]> = {};
      for (const [agentId, records] of this.learningRecords.entries()) {
        recordsObj[agentId] = records;
      }

      await this.stateManager.saveAgentState('learning-repository', {
        records: recordsObj,
        globalInsights: this.globalInsights,
      });
    } catch (error) {
      this.logger.error(
        `Error saving state: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Analyze a learning record for insights
   * @param agentId Agent ID
   * @param record Learning record
   */
  private async analyzeForInsights(agentId: string, record: LearningRecord): Promise<void> {
    // This would be a more sophisticated analysis
    // For now, it's a simple implementation

    // Initialize insights structures if needed
    if (!this.globalInsights.taskTypes) {
      this.globalInsights.taskTypes = {};
    }

    if (!this.globalInsights.taskTypes[record.taskType]) {
      this.globalInsights.taskTypes[record.taskType] = {
        count: 0,
        successRate: 0,
        averageDuration: 0,
        commonPatterns: [],
      };
    }

    const taskInsights = this.globalInsights.taskTypes[record.taskType];

    // Update simple metrics
    taskInsights.count++;

    // Update success rate
    if (record.feedback) {
      const successCount =
        (taskInsights.successCount || 0) + (record.feedback === 'positive' ? 1 : 0);
      taskInsights.successCount = successCount;
      taskInsights.successRate = successCount / taskInsights.count;
    }

    // Update average duration if available
    if (record.metadata?.duration) {
      const totalDuration = (taskInsights.totalDuration || 0) + record.metadata.duration;
      taskInsights.totalDuration = totalDuration;
      taskInsights.averageDuration = totalDuration / taskInsights.count;
    }

    // Look for common patterns in input
    try {
      this.updateCommonPatterns(taskInsights, record);
    } catch (error) {
      this.logger.error(
        `Error updating common patterns: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Save insights
    await this.saveState();
  }

  /**
   * Analyze a batch of learning records for insights
   * @param agentId Agent ID
   * @param records Learning records
   */
  private async analyzeForInsightsBatch(agentId: string, records: LearningRecord[]): Promise<void> {
    // Process each record individually
    for (const record of records) {
      await this.analyzeForInsights(agentId, record);
    }

    // Additional batch-level analysis could be added here
  }

  /**
   * Update common patterns in task insights
   * @param taskInsights Task insights
   * @param record Learning record
   */
  private updateCommonPatterns(taskInsights: any, record: LearningRecord): void {
    // This would involve more sophisticated text analysis
    // For now, it's a simple keyword extraction

    // Initialize common patterns array if needed
    if (!taskInsights.commonPatterns) {
      taskInsights.commonPatterns = [];
    }

    // Extract potential patterns from input
    const input = record.input.toLowerCase();

    // Simple keyword extraction (in a real implementation, this would be more sophisticated)
    const keywords = input
      .split(/\s+/)
      .filter(word => word.length > 4) // Only consider longer words
      .map(word => word.replace(/[^\w]/g, '')); // Remove non-word characters

    // Count existing patterns or add new ones
    for (const keyword of keywords) {
      const existingPattern = taskInsights.commonPatterns.find((p: any) => p.pattern === keyword);

      if (existingPattern) {
        existingPattern.count++;
        existingPattern.frequency = existingPattern.count / taskInsights.count;
      } else {
        taskInsights.commonPatterns.push({
          pattern: keyword,
          count: 1,
          frequency: 1 / taskInsights.count,
        });
      }
    }

    // Sort by frequency and keep only top patterns
    taskInsights.commonPatterns.sort((a: any, b: any) => b.frequency - a.frequency);

    // Keep only top 20 patterns
    if (taskInsights.commonPatterns.length > 20) {
      taskInsights.commonPatterns = taskInsights.commonPatterns.slice(0, 20);
    }
  }

  /**
   * Clear all learning records
   */
  public clear(): void {
    this.learningRecords.clear();
    this.globalInsights = {};
    this.saveState();
    this.logger.info('Learning repository cleared');
  }

  /**
   * Provide feedback on a learning record
   * @param recordId Learning record ID
   * @param feedback Feedback value
   */
  public provideFeedback(recordId: string, feedback: 'positive' | 'negative' | 'neutral'): boolean {
    let found = false;

    // Search for the record in all agent collections
    for (const records of this.learningRecords.values()) {
      const recordIndex = records.findIndex(record => record.id === recordId);

      if (recordIndex !== -1) {
        // Update feedback
        records[recordIndex].feedback = feedback;
        found = true;
        break;
      }
    }

    if (found) {
      // Save state
      this.saveState();
      this.logger.info(`Feedback provided for learning record ${recordId}: ${feedback}`);
    } else {
      this.logger.warn(`Learning record not found: ${recordId}`);
    }

    return found;
  }
}
