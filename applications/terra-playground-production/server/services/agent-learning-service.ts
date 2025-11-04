/**
 * Agent Learning Service
 *
 * This service implements the continuous learning system for AI agents.
 * It handles:
 * - Collection and storage of learning events
 * - Processing user feedback
 * - Managing the knowledge base
 * - Tracking performance metrics
 * - Interfacing with various LLM providers for learning
 */

import { db } from '../db';
import {
  agentLearningEvents,
  AgentLearningEvent,
  insertAgentLearningEventSchema,
  agentUserFeedback,
  AgentUserFeedback,
  insertAgentUserFeedbackSchema,
  agentKnowledgeBase,
  AgentKnowledgeBase,
  insertAgentKnowledgeBaseSchema,
  agentPerformanceMetrics,
  AgentPerformanceMetric,
  insertAgentPerformanceMetricSchema,
  agentLearningModels,
  AgentLearningModel,
  insertAgentLearningModelSchema,
  LearningEventType,
  FeedbackSentiment,
  LearningModelProvider,
  AgentPerformanceMetricType,
} from '../../shared/schema';
import { LLMService } from './llm-service';
import { PerplexityService, perplexityService } from './perplexity-service';
import { eq, and, desc, sql } from 'drizzle-orm';

// Learning system configuration
export interface AgentLearningConfig {
  enabled: boolean;
  priorityThreshold: number; // Minimum priority (1-5) to process learning events
  feedbackProcessingInterval: number; // Milliseconds
  modelUpdateInterval: number; // Milliseconds
  knowledgeVerificationRequired: boolean; // Whether knowledge needs verification before use
  providers: {
    openai: boolean;
    anthropic: boolean;
    perplexity: boolean;
  };
}

export class AgentLearningService {
  private config: AgentLearningConfig;
  private llmService: LLMService;
  private perplexityService: PerplexityService;
  private isProcessingFeedback: boolean = false;
  private feedbackProcessingTimer: NodeJS.Timeout | null = null;
  private modelUpdateTimer: NodeJS.Timeout | null = null;

  constructor(llmService: LLMService, config?: Partial<AgentLearningConfig>) {
    this.llmService = llmService;
    this.perplexityService = perplexityService;

    // Set default configuration
    this.config = {
      enabled: true,
      priorityThreshold: 3,
      feedbackProcessingInterval: 5 * 60 * 1000, // 5 minutes
      modelUpdateInterval: 24 * 60 * 60 * 1000, // 24 hours
      knowledgeVerificationRequired: true,
      providers: {
        openai: !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        perplexity: !!process.env.PERPLEXITY_API_KEY,
      },
      ...config,
    };

    // Validate that at least one provider is available
    if (
      !this.config.providers.openai &&
      !this.config.providers.anthropic &&
      !this.config.providers.perplexity
    ) {
      console.warn(
        'No LLM providers available for agent learning. Learning system will be disabled.'
      );
      this.config.enabled = false;
    }

    // Start the feedback processing timer if enabled
    if (this.config.enabled) {
      this.startFeedbackProcessing();
      this.startModelUpdateCycle();
    }
  }

  /**
   * Start the feedback processing cycle
   */
  private startFeedbackProcessing(): void {
    if (this.feedbackProcessingTimer) {
      clearInterval(this.feedbackProcessingTimer);
    }

    this.feedbackProcessingTimer = setInterval(
      async () => this.processPendingFeedback(),
      this.config.feedbackProcessingInterval
    );
  }

  /**
   * Start the model update cycle
   */
  private startModelUpdateCycle(): void {
    if (this.modelUpdateTimer) {
      clearInterval(this.modelUpdateTimer);
    }

    this.modelUpdateTimer = setInterval(
      async () => this.updateLearningModels(),
      this.config.modelUpdateInterval
    );
  }

  /**
   * Record a learning event
   */
  public async recordLearningEvent(
    agentId: string,
    eventType: LearningEventType,
    eventData: any,
    sourceContext?: any,
    priority: number = 3
  ): Promise<AgentLearningEvent> {
    try {
      if (!this.config.enabled) {
        return null;
      }

      const [event] = await db
        .insert(agentLearningEvents)
        .values({
          agentId,
          eventType,
          eventData,
          sourceContext,
          priority,
          processed: false,
        })
        .returning();

      console.log(`Recorded learning event for agent ${agentId} with priority ${priority}`);

      // If priority is high, process immediately
      if (priority >= 4) {
        this.processLearningEvent(event.id).catch(err => {
          console.error(`Error processing high-priority learning event ${event.id}:`, err);
        });
      }

      return event;
    } catch (error) {
      console.error(`Error recording learning event for agent ${agentId}:`, error);
      throw new Error(`Failed to record learning event: ${error.message}`);
    }
  }

  /**
   * Record user feedback
   */
  public async recordUserFeedback(
    agentId: string,
    feedbackData: {
      userId?: number;
      conversationId?: string;
      taskId?: string;
      feedbackText?: string;
      sentiment?: FeedbackSentiment;
      rating?: number;
      categories?: string[];
    }
  ): Promise<AgentUserFeedback> {
    try {
      if (!this.config.enabled) {
        return null;
      }

      // Insert feedback record
      const [feedback] = await db
        .insert(agentUserFeedback)
        .values({
          agentId,
          userId: feedbackData.userId,
          conversationId: feedbackData.conversationId,
          taskId: feedbackData.taskId,
          feedbackText: feedbackData.feedbackText,
          sentiment: feedbackData.sentiment,
          rating: feedbackData.rating,
          categories: feedbackData.categories,
          processed: false,
        })
        .returning();

      // Also create a learning event from this feedback
      await this.recordLearningEvent(
        agentId,
        LearningEventType.USER_FEEDBACK,
        { feedbackId: feedback.id, ...feedbackData },
        { source: 'user_feedback', feedbackId: feedback.id },
        // High priority for negative feedback, medium for positive
        feedbackData.sentiment === FeedbackSentiment.NEGATIVE ? 4 : 3
      );

      return feedback;
    } catch (error) {
      console.error(`Error recording user feedback for agent ${agentId}:`, error);
      throw new Error(`Failed to record user feedback: ${error.message}`);
    }
  }

  /**
   * Add knowledge to the agent knowledge base
   */
  public async addKnowledge(
    agentId: string,
    knowledgeType: string,
    title: string,
    content: string,
    sourceEvents: number[] = [],
    confidence: number = 0.8,
    verified: boolean = false
  ): Promise<AgentKnowledgeBase> {
    try {
      if (!this.config.enabled) {
        return null;
      }

      // Check if similar knowledge already exists
      const existingKnowledge = await db
        .select()
        .from(agentKnowledgeBase)
        .where(
          and(
            eq(agentKnowledgeBase.agentId, agentId),
            eq(agentKnowledgeBase.knowledgeType, knowledgeType),
            eq(agentKnowledgeBase.title, title)
          )
        );

      if (existingKnowledge.length > 0) {
        // Update existing knowledge instead of creating new
        const [updated] = await db
          .update(agentKnowledgeBase)
          .set({
            content,
            sourceEvents: [...new Set([...existingKnowledge[0].sourceEvents, ...sourceEvents])],
            confidence: Math.max(existingKnowledge[0].confidence, confidence),
            verified: existingKnowledge[0].verified || verified,
            updatedAt: new Date(),
          })
          .where(eq(agentKnowledgeBase.id, existingKnowledge[0].id))
          .returning();

        return updated;
      }

      // Create new knowledge entry
      const [knowledge] = await db
        .insert(agentKnowledgeBase)
        .values({
          agentId,
          knowledgeType,
          title,
          content,
          sourceEvents,
          confidence,
          verified,
        })
        .returning();

      return knowledge;
    } catch (error) {
      console.error(`Error adding knowledge for agent ${agentId}:`, error);
      throw new Error(`Failed to add knowledge: ${error.message}`);
    }
  }

  /**
   * Record an agent performance metric
   */
  public async recordPerformanceMetric(
    agentId: string,
    metricType: AgentPerformanceMetricType,
    value: number,
    timeframe: string = 'daily',
    metadata?: any
  ): Promise<AgentPerformanceMetric> {
    try {
      if (!this.config.enabled) {
        throw new Error('Learning system is disabled');
      }

      const [metric] = await db
        .insert(agentPerformanceMetrics)
        .values({
          agentId,
          metricType,
          value: value.toString(), // Convert number to string for numeric database column
          timeframe,
          metadata,
        })
        .returning();

      return metric;
    } catch (error) {
      console.error(`Error recording performance metric for agent ${agentId}:`, error);
      throw new Error(`Failed to record performance metric: ${error.message}`);
    }
  }

  /**
   * Get agent knowledge based on type and optional search criteria
   */
  public async getAgentKnowledge(
    agentId: string,
    knowledgeType?: string,
    searchTerm?: string,
    verifiedOnly: boolean = false
  ): Promise<AgentKnowledgeBase[]> {
    try {
      let query = db
        .select()
        .from(agentKnowledgeBase)
        .where(eq(agentKnowledgeBase.agentId, agentId));

      if (knowledgeType) {
        query = query.where(eq(agentKnowledgeBase.knowledgeType, knowledgeType));
      }

      if (verifiedOnly) {
        query = query.where(eq(agentKnowledgeBase.verified, true));
      }

      if (searchTerm) {
        query = query.where(
          sql`${agentKnowledgeBase.title} ILIKE ${`%${searchTerm}%`} OR ${agentKnowledgeBase.content} ILIKE ${`%${searchTerm}%`}`
        );
      }

      // Order by confidence (descending) and then by last updated
      const knowledge = await query.orderBy(
        desc(agentKnowledgeBase.confidence),
        desc(agentKnowledgeBase.updatedAt)
      );
      return knowledge;
    } catch (error) {
      console.error(`Error retrieving knowledge for agent ${agentId}:`, error);
      throw new Error(`Failed to retrieve agent knowledge: ${error.message}`);
    }
  }

  /**
   * Get agent performance metrics
   */
  public async getAgentMetrics(
    agentId: string,
    metricType?: string,
    timeframe?: string
  ): Promise<AgentPerformanceMetric[]> {
    try {
      let query = db
        .select()
        .from(agentPerformanceMetrics)
        .where(eq(agentPerformanceMetrics.agentId, agentId));

      if (metricType) {
        query = query.where(eq(agentPerformanceMetrics.metricType, metricType));
      }

      if (timeframe) {
        query = query.where(eq(agentPerformanceMetrics.timeframe, timeframe));
      }

      // Order by creation date (descending)
      const metrics = await query.orderBy(desc(agentPerformanceMetrics.createdAt));
      return metrics;
    } catch (error) {
      console.error(`Error retrieving metrics for agent ${agentId}:`, error);
      throw new Error(
        `Failed to retrieve agent metrics: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Process pending feedback
   */
  private async processPendingFeedback(): Promise<void> {
    if (this.isProcessingFeedback || !this.config.enabled) {
      return;
    }

    try {
      this.isProcessingFeedback = true;

      // Get all unprocessed feedback
      const feedbackEntries = await db
        .select()
        .from(agentUserFeedback)
        .where(eq(agentUserFeedback.processed, false))
        .limit(50);

      for (const feedback of feedbackEntries) {
        try {
          // Process each feedback entry
          await this.processFeedbackEntry(feedback);

          // Mark as processed
          await db
            .update(agentUserFeedback)
            .set({ processed: true })
            .where(eq(agentUserFeedback.id, feedback.id));
        } catch (error) {
          console.error(`Error processing feedback ${feedback.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error processing pending feedback:', error);
    } finally {
      this.isProcessingFeedback = false;
    }
  }

  /**
   * Process individual feedback entry
   */
  private async processFeedbackEntry(feedback: AgentUserFeedback): Promise<void> {
    try {
      // Skip entries without text content
      if (!feedback.feedbackText) {
        return;
      }

      // Use LLM to analyze feedback and extract insights
      const systemPrompt = `
        You are a feedback analysis expert. Analyze the following user feedback about an AI agent
        to extract key insights that could help improve the agent's performance.
        
        The feedback sentiment is: ${feedback.sentiment || 'unknown'}
        The rating is: ${feedback.rating !== null ? feedback.rating + '/5' : 'not provided'}
        
        Provide your analysis in JSON format with the following structure:
        {
          "keyInsights": [list of key insights extracted from the feedback],
          "suggestedImprovements": [specific improvements that could address this feedback],
          "priority": number from 1-5 representing how critical this feedback is (5 being highest),
          "knowledgeType": "pattern" or "rule" or "fact" or "procedure" or "concept",
          "proposedKnowledgeTitle": a short title for a knowledge item based on this feedback,
          "proposedKnowledgeContent": a specific knowledge item that could be added to the agent's knowledge base
        }
      `;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: feedback.feedbackText },
      ];

      // Try using OpenAI or Anthropic or Perplexity, in that order
      let analysisResult;
      if (this.config.providers.openai) {
        try {
          analysisResult = await this.llmService.prompt(messages, {
            provider: 'openai',
            responseFormat: { type: 'json_object' },
          });
        } catch (error) {
          console.error('Error using OpenAI for feedback analysis, trying Anthropic:', error);
        }
      }

      if (!analysisResult && this.config.providers.anthropic) {
        try {
          analysisResult = await this.llmService.prompt(messages, {
            provider: 'anthropic',
          });
        } catch (error) {
          console.error('Error using Anthropic for feedback analysis, trying Perplexity:', error);
        }
      }

      if (!analysisResult && this.config.providers.perplexity) {
        try {
          const perplexityResponse = await this.perplexityService.query(messages, {
            temperature: 0.2,
          });

          analysisResult = {
            text: perplexityResponse.choices[0].message.content,
          };
        } catch (error) {
          console.error('Error using Perplexity for feedback analysis:', error);
          return; // Give up if all providers fail
        }
      }

      // Parse the LLM response
      let analysis;
      try {
        analysis =
          typeof analysisResult.text === 'string'
            ? JSON.parse(analysisResult.text)
            : analysisResult.text;
      } catch (error) {
        console.error('Failed to parse LLM response as JSON:', error);
        return;
      }

      // Add knowledge if insights were generated
      if (analysis.proposedKnowledgeTitle && analysis.proposedKnowledgeContent) {
        await this.addKnowledge(
          feedback.agentId,
          analysis.knowledgeType || 'pattern',
          analysis.proposedKnowledgeTitle,
          analysis.proposedKnowledgeContent,
          [], // No source events
          0.7, // Medium confidence since it's from a single feedback
          false // Not verified by default
        );
      }

      // Record performance metrics based on the feedback
      if (feedback.rating !== null) {
        await this.recordPerformanceMetric(
          feedback.agentId,
          AgentPerformanceMetricType.USER_SATISFACTION,
          feedback.rating / 5, // Normalize to 0-1 scale
          'single', // Single instance
          {
            feedbackId: feedback.id,
            sentiment: feedback.sentiment,
            analysis: analysis.keyInsights,
          }
        );
      }
    } catch (error) {
      console.error(`Error processing feedback entry ${feedback.id}:`, error);
      throw error;
    }
  }

  /**
   * Process a learning event
   */
  private async processLearningEvent(eventId: number): Promise<void> {
    try {
      // Get the event
      const [event] = await db
        .select()
        .from(agentLearningEvents)
        .where(eq(agentLearningEvents.id, eventId));

      if (!event || event.processed) {
        return;
      }

      let processingNotes = '';

      switch (event.eventType) {
        case LearningEventType.USER_FEEDBACK:
          // This is already handled by the feedback processing system
          processingNotes = 'Processed via feedback processing system';
          break;

        case LearningEventType.TASK_COMPLETION:
          processingNotes = await this.processTaskCompletionEvent(event);
          break;

        case LearningEventType.ERROR_RECOVERY:
          processingNotes = await this.processErrorRecoveryEvent(event);
          break;

        case LearningEventType.MODEL_IMPROVEMENT:
          processingNotes = await this.processModelImprovementEvent(event);
          break;

        case LearningEventType.COLLABORATIVE_LEARNING:
          processingNotes = await this.processCollaborativeLearningEvent(event);
          break;

        case LearningEventType.KNOWLEDGE_TRANSFER:
          processingNotes = await this.processKnowledgeTransferEvent(event);
          break;

        default:
          processingNotes = `Unknown event type: ${event.eventType}`;
      }

      // Mark the event as processed
      await db
        .update(agentLearningEvents)
        .set({
          processed: true,
          processingNotes,
          processedAt: new Date(),
        })
        .where(eq(agentLearningEvents.id, eventId));
    } catch (error) {
      console.error(`Error processing learning event ${eventId}:`, error);

      // Update with error info but don't mark as processed
      await db
        .update(agentLearningEvents)
        .set({
          processingNotes: `Error processing: ${error.message}`,
        })
        .where(eq(agentLearningEvents.id, eventId));
    }
  }

  /**
   * Process task completion event
   */
  private async processTaskCompletionEvent(event: AgentLearningEvent): Promise<string> {
    // Extract data from the event
    const { taskId, taskType, result, performance } = event.eventData;

    // Record performance metrics if available
    if (performance) {
      if (performance.timeMs) {
        await this.recordPerformanceMetric(
          event.agentId,
          AgentPerformanceMetricType.RESPONSE_TIME,
          performance.timeMs / 1000, // Convert to seconds
          'single',
          { taskId, taskType }
        );
      }

      if (performance.success !== undefined) {
        await this.recordPerformanceMetric(
          event.agentId,
          AgentPerformanceMetricType.TASK_COMPLETION_RATE,
          performance.success ? 1 : 0,
          'single',
          { taskId, taskType }
        );
      }

      if (performance.accuracy !== undefined) {
        await this.recordPerformanceMetric(
          event.agentId,
          AgentPerformanceMetricType.ACCURACY,
          performance.accuracy,
          'single',
          { taskId, taskType }
        );
      }
    }

    // For successful task completions, try to extract knowledge
    if (result && result.success) {
      const systemPrompt = `
        You are an AI learning expert. Analyze the following successful task completion
        to extract reusable knowledge that could help the agent perform better in the future.
        
        Task Type: ${taskType}
        Task Result: ${JSON.stringify(result)}
        
        Extract knowledge in JSON format with the following structure:
        {
          "knowledgeType": "pattern" or "rule" or "fact" or "procedure" or "concept",
          "title": "A concise title for this knowledge",
          "content": "Detailed knowledge content that can be applied to future tasks",
          "confidence": number between 0 and 1 indicating confidence in this knowledge
        }
      `;

      try {
        const response = await this.llmService.prompt(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(event.eventData) },
          ],
          {
            provider: 'openai',
            responseFormat: { type: 'json_object' },
          }
        );

        const knowledge = JSON.parse(response.text);

        await this.addKnowledge(
          event.agentId,
          knowledge.knowledgeType,
          knowledge.title,
          knowledge.content,
          [event.id],
          knowledge.confidence,
          false // Not verified yet
        );

        return `Extracted knowledge: ${knowledge.title}`;
      } catch (error) {
        console.error('Error extracting knowledge from task completion:', error);
        return `Failed to extract knowledge: ${error.message}`;
      }
    }

    return 'Processed task completion, no knowledge extracted';
  }

  /**
   * Process error recovery event
   */
  private async processErrorRecoveryEvent(event: AgentLearningEvent): Promise<string> {
    // Extract data from the event
    const { errorType, errorDetails, recoveryStrategy, successful } = event.eventData;

    // Record error rate metric
    await this.recordPerformanceMetric(
      event.agentId,
      AgentPerformanceMetricType.ERROR_RATE,
      1, // Count of errors
      'single',
      { errorType, errorDetails, recoverySuccess: successful }
    );

    // For successful recoveries, extract knowledge
    if (successful) {
      const systemPrompt = `
        You are an AI learning expert. Analyze the following error recovery scenario
        to extract reusable knowledge that could help the agent handle similar errors in the future.
        
        Error Type: ${errorType}
        Error Details: ${JSON.stringify(errorDetails)}
        Recovery Strategy: ${JSON.stringify(recoveryStrategy)}
        
        Extract knowledge in JSON format with the following structure:
        {
          "knowledgeType": "pattern" or "rule" or "fact" or "procedure" or "concept",
          "title": "A concise title for this error handling knowledge",
          "content": "Detailed knowledge about how to handle this type of error",
          "confidence": number between 0 and 1 indicating confidence in this knowledge
        }
      `;

      try {
        const response = await this.llmService.prompt(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(event.eventData) },
          ],
          {
            provider: 'openai',
            responseFormat: { type: 'json_object' },
          }
        );

        const knowledge = JSON.parse(response.text);

        await this.addKnowledge(
          event.agentId,
          knowledge.knowledgeType,
          knowledge.title,
          knowledge.content,
          [event.id],
          knowledge.confidence,
          false // Not verified yet
        );

        return `Extracted error handling knowledge: ${knowledge.title}`;
      } catch (error) {
        console.error('Error extracting knowledge from error recovery:', error);
        return `Failed to extract knowledge: ${error.message}`;
      }
    }

    return 'Processed error recovery event, no knowledge extracted';
  }

  /**
   * Process model improvement event
   * This is for when a model is updated or improved
   */
  private async processModelImprovementEvent(event: AgentLearningEvent): Promise<string> {
    // Extract data from the event
    const { modelName, oldVersion, newVersion, improvements } = event.eventData;

    // Register the new model
    try {
      await db.insert(agentLearningModels).values({
        agentId: event.agentId,
        modelName,
        version: newVersion,
        provider: event.eventData.provider || LearningModelProvider.INTERNAL,
        configuration: event.eventData.configuration || {},
        performanceMetrics: event.eventData.performanceMetrics || {},
        active: true,
      });

      // If there was a previous model, mark it as inactive
      if (oldVersion) {
        await db
          .update(agentLearningModels)
          .set({ active: false })
          .where(
            and(
              eq(agentLearningModels.agentId, event.agentId),
              eq(agentLearningModels.modelName, modelName),
              eq(agentLearningModels.version, oldVersion)
            )
          );
      }

      return `Registered new model ${modelName} version ${newVersion}`;
    } catch (error) {
      console.error('Error registering new model version:', error);
      return `Failed to register new model: ${error.message}`;
    }
  }

  /**
   * Process collaborative learning event
   * This is for when agents share knowledge with each other
   */
  private async processCollaborativeLearningEvent(event: AgentLearningEvent): Promise<string> {
    // Extract data from the event
    const { sourceAgentId, knowledge } = event.eventData;

    if (!sourceAgentId || !knowledge) {
      return 'Invalid collaborative learning event data';
    }

    // Add the shared knowledge to this agent's knowledge base
    try {
      await this.addKnowledge(
        event.agentId,
        knowledge.knowledgeType,
        knowledge.title,
        knowledge.content,
        knowledge.sourceEvents || [event.id],
        knowledge.confidence * 0.9, // Slightly lower confidence for transferred knowledge
        false // Not verified yet
      );

      return `Added shared knowledge from agent ${sourceAgentId}: ${knowledge.title}`;
    } catch (error) {
      console.error('Error adding shared knowledge:', error);
      return `Failed to add shared knowledge: ${error.message}`;
    }
  }

  /**
   * Process knowledge transfer event
   * Similar to collaborative learning but initiated by an external system
   */
  private async processKnowledgeTransferEvent(event: AgentLearningEvent): Promise<string> {
    // Extract data from the event
    const { knowledge, source } = event.eventData;

    if (!knowledge) {
      return 'Invalid knowledge transfer event data';
    }

    // Add the transferred knowledge to this agent's knowledge base
    try {
      await this.addKnowledge(
        event.agentId,
        knowledge.knowledgeType,
        knowledge.title,
        knowledge.content,
        knowledge.sourceEvents || [event.id],
        knowledge.confidence,
        source === 'expert' // Verified if from expert source
      );

      return `Added transferred knowledge from ${source}: ${knowledge.title}`;
    } catch (error) {
      console.error('Error adding transferred knowledge:', error);
      return `Failed to add transferred knowledge: ${error.message}`;
    }
  }

  /**
   * Update learning models based on accumulated data
   */
  private async updateLearningModels(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Get all agents with sufficient learning data
      const agents = await this.getAgentsWithSufficientLearningData();

      for (const agentId of agents) {
        try {
          await this.updateAgentModel(agentId);
        } catch (error) {
          console.error(`Error updating model for agent ${agentId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error during model update cycle:', error);
    }
  }

  /**
   * Get list of agents with sufficient learning data for model updates
   */
  private async getAgentsWithSufficientLearningData(): Promise<string[]> {
    // Get agents with at least 10 learning events
    const result = await db
      .select({
        agentId: agentLearningEvents.agentId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(agentLearningEvents)
      .groupBy(agentLearningEvents.agentId)
      .having(sql`count(*) >= 10`);

    return result.map(r => r.agentId);
  }

  /**
   * Update the learning model for a specific agent
   */
  private async updateAgentModel(agentId: string): Promise<void> {
    try {
      // Get the agent's previous model if any
      const previousModels = await db
        .select()
        .from(agentLearningModels)
        .where(and(eq(agentLearningModels.agentId, agentId), eq(agentLearningModels.active, true)));

      const previousModel = previousModels.length > 0 ? previousModels[0] : null;

      const modelName = previousModel?.modelName || 'base_agent_model';
      const previousVersion = previousModel?.version || '0.1.0';

      // Generate new version number
      const versionParts = previousVersion.split('.');
      const newVersion = `${versionParts[0]}.${versionParts[1]}.${parseInt(versionParts[2]) + 1}`;

      // Get recent learning events to analyze
      const recentEvents = await db
        .select()
        .from(agentLearningEvents)
        .where(
          and(eq(agentLearningEvents.agentId, agentId), eq(agentLearningEvents.processed, true))
        )
        .orderBy(desc(agentLearningEvents.createdAt))
        .limit(50);

      // Get recent performance metrics
      const recentMetrics = await db
        .select()
        .from(agentPerformanceMetrics)
        .where(eq(agentPerformanceMetrics.agentId, agentId))
        .orderBy(desc(agentPerformanceMetrics.createdAt))
        .limit(100);

      // Get knowledge base entries
      const knowledgeEntries = await db
        .select()
        .from(agentKnowledgeBase)
        .where(eq(agentKnowledgeBase.agentId, agentId))
        .orderBy(desc(agentKnowledgeBase.updatedAt))
        .limit(100);

      // Calculate performance metrics
      const performanceMetrics = this.calculateAggregatePerformanceMetrics(recentMetrics);

      // Create new model entry
      const [newModel] = await db
        .insert(agentLearningModels)
        .values({
          agentId,
          modelName,
          version: newVersion,
          provider: LearningModelProvider.INTERNAL,
          configuration: {
            baseModel: previousModel?.configuration?.baseModel || 'default',
            knowledgeBaseSize: knowledgeEntries.length,
            lastUpdated: new Date().toISOString(),
          },
          performanceMetrics,
          active: true,
        })
        .returning();

      // Mark previous model as inactive
      if (previousModel) {
        await db
          .update(agentLearningModels)
          .set({ active: false })
          .where(eq(agentLearningModels.id, previousModel.id));
      }

      // Log model improvement event
      await this.recordLearningEvent(
        agentId,
        LearningEventType.MODEL_IMPROVEMENT,
        {
          modelName,
          oldVersion: previousVersion,
          newVersion,
          improvements: this.summarizeImprovements(knowledgeEntries, recentEvents),
          performanceMetrics,
        },
        {
          knowledgeBaseSize: knowledgeEntries.length,
          eventsProcessed: recentEvents.length,
        },
        3 // Medium priority
      );
    } catch (error) {
      console.error(`Error updating model for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate aggregate performance metrics from individual metrics
   */
  private calculateAggregatePerformanceMetrics(metrics: AgentPerformanceMetric[]): any {
    const result: any = {
      responseTime: { avg: 0, min: 0, max: 0 },
      accuracy: { avg: 0, samples: 0 },
      userSatisfaction: { avg: 0, samples: 0 },
      taskCompletionRate: { avg: 0, samples: 0 },
      errorRate: { avg: 0, samples: 0 },
      overall: 0,
    };

    // Group metrics by type
    const byType: Record<string, number[]> = {};

    for (const metric of metrics) {
      if (!byType[metric.metricType]) {
        byType[metric.metricType] = [];
      }
      byType[metric.metricType].push(Number(metric.value));
    }

    // Calculate averages for each type
    if (byType[AgentPerformanceMetricType.RESPONSE_TIME]?.length) {
      const values = byType[AgentPerformanceMetricType.RESPONSE_TIME];
      result.responseTime.avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      result.responseTime.min = Math.min(...values);
      result.responseTime.max = Math.max(...values);
      result.responseTime.samples = values.length;
    }

    if (byType[AgentPerformanceMetricType.ACCURACY]?.length) {
      const values = byType[AgentPerformanceMetricType.ACCURACY];
      result.accuracy.avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      result.accuracy.samples = values.length;
    }

    if (byType[AgentPerformanceMetricType.USER_SATISFACTION]?.length) {
      const values = byType[AgentPerformanceMetricType.USER_SATISFACTION];
      result.userSatisfaction.avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      result.userSatisfaction.samples = values.length;
    }

    if (byType[AgentPerformanceMetricType.TASK_COMPLETION_RATE]?.length) {
      const values = byType[AgentPerformanceMetricType.TASK_COMPLETION_RATE];
      result.taskCompletionRate.avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      result.taskCompletionRate.samples = values.length;
    }

    if (byType[AgentPerformanceMetricType.ERROR_RATE]?.length) {
      const values = byType[AgentPerformanceMetricType.ERROR_RATE];
      result.errorRate.avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      result.errorRate.samples = values.length;
    }

    // Calculate overall score (weighted average of available metrics)
    let overallScore = 0;
    let weightSum = 0;

    if (result.accuracy.samples > 0) {
      overallScore += result.accuracy.avg * 0.3;
      weightSum += 0.3;
    }

    if (result.userSatisfaction.samples > 0) {
      overallScore += result.userSatisfaction.avg * 0.3;
      weightSum += 0.3;
    }

    if (result.taskCompletionRate.samples > 0) {
      overallScore += result.taskCompletionRate.avg * 0.2;
      weightSum += 0.2;
    }

    if (result.errorRate.samples > 0) {
      // Invert error rate (lower is better)
      overallScore += (1 - result.errorRate.avg) * 0.2;
      weightSum += 0.2;
    }

    result.overall = weightSum > 0 ? overallScore / weightSum : 0;

    return result;
  }

  /**
   * Summarize improvements based on knowledge and events
   */
  private summarizeImprovements(
    knowledgeEntries: AgentKnowledgeBase[],
    events: AgentLearningEvent[]
  ): string[] {
    const improvements: string[] = [];

    // Add recent knowledge items
    const recentKnowledge = knowledgeEntries.slice(0, 5).map(k => `New knowledge: ${k.title}`);

    improvements.push(...recentKnowledge);

    // Add improvements based on error recovery
    const errorRecoveries = events
      .filter(e => e.eventType === LearningEventType.ERROR_RECOVERY && e.eventData.successful)
      .slice(0, 3)
      .map(e => `Improved error handling: ${e.eventData.errorType}`);

    improvements.push(...errorRecoveries);

    return improvements;
  }
}

// Export a singleton instance
export const agentLearningService = new AgentLearningService(new LLMService());
