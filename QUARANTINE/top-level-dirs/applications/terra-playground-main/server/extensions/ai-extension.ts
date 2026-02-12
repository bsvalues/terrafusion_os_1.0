import { BaseExtension } from './base-extension';
import { IStorage } from '../storage';
import {
  AIService,
  AIServiceProvider,
  AIServiceOptions,
  AIMessageRole,
} from '../services/ai-service';

/**
 * Represents a message in an AI conversation
 */
export interface AIMessage {
  role: AIMessageRole;
  content: string;
  name?: string;
}

/**
 * Configuration for an AI extension
 */
export interface AIExtensionConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  systemPrompt?: string;
  defaultProvider?: AIServiceProvider;
  cacheResponses?: boolean;
  streamResponses?: boolean;
}

/**
 * Base class for AI-enabled extensions
 * Extends the standard extension system with AI capabilities
 */
export abstract class AIExtension extends BaseExtension {
  protected aiService: AIService;
  protected config: AIExtensionConfig;
  protected conversationHistory: Map<string, AIMessage[]> = new Map();

  /**
   * Create a new AI extension
   *
   * @param id Unique identifier for the extension
   * @param storage Storage service
   * @param aiService AI service for completions and embeddings
   * @param config Configuration for the AI capabilities
   */
  constructor(id: string, storage: IStorage, aiService: AIService, config: AIExtensionConfig = {}) {
    super(id, storage);
    this.aiService = aiService;

    // Apply default configuration
    this.config = {
      model: config.model || 'gpt-3.5-turbo',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 1000,
      stopSequences: config.stopSequences || [],
      systemPrompt: config.systemPrompt || 'You are a helpful assistant.',
      defaultProvider: config.defaultProvider || 'openai',
      cacheResponses: config.cacheResponses ?? true,
      streamResponses: config.streamResponses ?? false,
    };

    // Register common AI commands
    this.registerCommand('clearConversation', {
      title: 'Clear Conversation History',
      execute: (conversationId: string) => this.clearConversation(conversationId),
    });
  }

  /**
   * Initialize a conversation with a system prompt
   *
   * @param conversationId Unique identifier for the conversation
   * @param systemPrompt Optional override for the default system prompt
   */
  protected initConversation(conversationId: string, systemPrompt?: string): void {
    const prompt = systemPrompt || this.config.systemPrompt;
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, [
        {
          role: 'system',
          content: prompt as string,
        },
      ]);
    }
  }

  /**
   * Add a user message to the conversation
   *
   * @param conversationId Unique identifier for the conversation
   * @param content User message content
   */
  protected async addUserMessage(conversationId: string, content: string): Promise<void> {
    this.initConversation(conversationId);

    const history = this.conversationHistory.get(conversationId);
    if (history) {
      history.push({
        role: 'user',
        content,
      });
    }
  }

  /**
   * Generate a completion from the AI based on the conversation history
   *
   * @param conversationId Unique identifier for the conversation
   * @param options Optional override for the AI service options
   * @returns The AI response
   */
  protected async generateCompletion(
    conversationId: string,
    options?: Partial<AIServiceOptions>
  ): Promise<string> {
    this.initConversation(conversationId);

    const history = this.conversationHistory.get(conversationId);
    if (!history) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const serviceOptions: AIServiceOptions = {
      model: options?.model || (this.config.model as string),
      temperature: options?.temperature ?? (this.config.temperature as number),
      maxTokens: options?.maxTokens || (this.config.maxTokens as number),
      stopSequences: options?.stopSequences || (this.config.stopSequences as string[]),
      provider: options?.provider || (this.config.defaultProvider as AIServiceProvider),
    };

    try {
      // Call the AI service with the conversation history
      const response = await this.aiService.complete(history, serviceOptions);

      // Add the AI response to the conversation history
      history.push({
        role: 'assistant',
        content: response,
      });

      return response;
    } catch (error) {
      console.error(`Error generating completion: ${error}`);
      throw error;
    }
  }

  /**
   * Get the full conversation history
   *
   * @param conversationId Unique identifier for the conversation
   * @returns Array of conversation messages
   */
  protected getConversation(conversationId: string): AIMessage[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Clear the conversation history
   *
   * @param conversationId Unique identifier for the conversation
   */
  protected clearConversation(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
    this.initConversation(conversationId);
  }

  /**
   * Generate an embedding for a text input
   *
   * @param text Text to generate embeddings for
   * @param provider Optional AI provider to use
   * @returns Vector embedding of the text
   */
  protected async generateEmbedding(text: string, provider?: AIServiceProvider): Promise<number[]> {
    try {
      return await this.aiService.createEmbedding(
        text,
        provider || (this.config.defaultProvider as AIServiceProvider)
      );
    } catch (error) {
      console.error(`Error generating embedding: ${error}`);
      throw error;
    }
  }

  /**
   * Analyze sentiment of a text input
   *
   * @param text Text to analyze
   * @returns Sentiment analysis result
   */
  protected async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
  }> {
    const prompt = `Analyze the sentiment of the following text and respond with only "positive", "negative", or "neutral", followed by a score from -1.0 to 1.0:\n\n"${text}"\n\nSentiment:`;

    try {
      const response = await this.aiService.complete([{ role: 'user', content: prompt }], {
        model: this.config.model as string,
        temperature: 0.1, // Low temperature for more deterministic results
        maxTokens: 20,
        provider: this.config.defaultProvider as AIServiceProvider,
      });

      // Parse the response to extract sentiment and score
      const match = response.match(/(positive|negative|neutral)[,\s]+(-?\d+(\.\d+)?)/i);

      if (match) {
        const sentiment = match[1].toLowerCase() as 'positive' | 'negative' | 'neutral';
        const score = parseFloat(match[2]);
        return { sentiment, score };
      }

      // Fallback if pattern matching fails
      if (response.toLowerCase().includes('positive')) {
        return { sentiment: 'positive', score: 0.7 };
      } else if (response.toLowerCase().includes('negative')) {
        return { sentiment: 'negative', score: -0.7 };
      } else {
        return { sentiment: 'neutral', score: 0 };
      }
    } catch (error) {
      console.error(`Error analyzing sentiment: ${error}`);
      throw error;
    }
  }

  /**
   * Extract key entities from text
   *
   * @param text Text to analyze
   * @returns Array of extracted entities
   */
  protected async extractEntities(text: string): Promise<
    {
      type: string;
      value: string;
      relevance: number;
    }[]
  > {
    const prompt = `Extract the key entities from the following text as JSON. Format the response as an array of objects with "type", "value", and "relevance" fields:\n\n"${text}"`;

    try {
      const response = await this.aiService.complete([{ role: 'user', content: prompt }], {
        model: this.config.model as string,
        temperature: 0.2,
        maxTokens: 500,
        provider: this.config.defaultProvider as AIServiceProvider,
      });

      // Extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error(`Error parsing entity extraction response: ${parseError}`);
          return [];
        }
      }

      return [];
    } catch (error) {
      console.error(`Error extracting entities: ${error}`);
      throw error;
    }
  }

  /**
   * Summarize a text
   *
   * @param text Text to summarize
   * @param maxLength Maximum length of the summary
   * @returns Summarized text
   */
  protected async summarize(text: string, maxLength: number = 200): Promise<string> {
    const prompt = `Summarize the following text in ${maxLength} characters or less:\n\n"${text}"`;

    try {
      return await this.aiService.complete([{ role: 'user', content: prompt }], {
        model: this.config.model as string,
        temperature: 0.5,
        maxTokens: Math.ceil(maxLength / 4) + 50, // Allow some buffer for the model
        provider: this.config.defaultProvider as AIServiceProvider,
      });
    } catch (error) {
      console.error(`Error summarizing text: ${error}`);
      throw error;
    }
  }
}
