/**
 * LearningService.ts
 *
 * Service for integrating machine learning capabilities into agents
 */

import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
import { LogService, LogLevel } from '../core';

/**
 * Learning parameters for model invocation
 */
export interface LearningParams {
  input: string;
  context?: string[];
  modelType?: 'anthropic' | 'perplexity';
  options?: Record<string, any>;
}

/**
 * AI Provider Configuration
 */
export interface AIProviderConfig {
  provider: 'anthropic' | 'perplexity';
  apiKey?: string;
  model?: string;
  options?: Record<string, any>;
}

/**
 * Learning service for agent intelligence enhancement
 */
export class LearningService {
  private static instance: LearningService;
  private logger: LogService;
  private anthropicClient?: Anthropic;
  private perplexityApiKey?: string;
  private defaultModel: {
    anthropic: string;
    perplexity: string;
  };

  /**
   * Private constructor (singleton)
   */
  private constructor() {
    this.logger = new LogService('LearningService', LogLevel.INFO);

    // Initialize with default models
    this.defaultModel = {
      // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      anthropic: 'claude-3-7-sonnet-20250219',
      perplexity: 'llama-3.1-sonar-small-128k-online',
    };

    // Try to initialize AI clients from environment variables
    this.initializeAIClients();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): LearningService {
    if (!LearningService.instance) {
      LearningService.instance = new LearningService();
    }
    return LearningService.instance;
  }

  /**
   * Initialize AI clients from environment variables
   */
  private initializeAIClients(): void {
    try {
      // Initialize Anthropic client if API key is available
      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropicClient = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
        this.logger.info('Anthropic client initialized successfully');
      } else {
        this.logger.warn('ANTHROPIC_API_KEY not found in environment variables');
      }

      // Store Perplexity API key if available
      if (process.env.PERPLEXITY_API_KEY) {
        this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
        this.logger.info('Perplexity API credentials configured successfully');
      } else {
        this.logger.warn('PERPLEXITY_API_KEY not found in environment variables');
      }
    } catch (error) {
      this.logger.error(
        `Error initializing AI clients: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Configure AI providers
   * @param config Provider configuration
   */
  public configureProvider(config: AIProviderConfig): boolean {
    try {
      if (config.provider === 'anthropic') {
        if (!config.apiKey && !process.env.ANTHROPIC_API_KEY) {
          throw new Error('Anthropic API key is required');
        }

        this.anthropicClient = new Anthropic({
          apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
        });

        if (config.model) {
          this.defaultModel.anthropic = config.model;
        }

        this.logger.info('Anthropic provider configured successfully');
        return true;
      } else if (config.provider === 'perplexity') {
        if (!config.apiKey && !process.env.PERPLEXITY_API_KEY) {
          throw new Error('Perplexity API key is required');
        }

        this.perplexityApiKey = config.apiKey || process.env.PERPLEXITY_API_KEY;

        if (config.model) {
          this.defaultModel.perplexity = config.model;
        }

        this.logger.info('Perplexity provider configured successfully');
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(
        `Error configuring provider: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  /**
   * Process learning request with Anthropic
   * @param params Learning parameters
   */
  private async processWithAnthropic(params: LearningParams): Promise<string> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    try {
      const messages = [];

      // Add context if provided
      if (params.context && params.context.length > 0) {
        messages.push({
          role: 'system',
          content: params.context.join('\n\n'),
        });
      }

      // Add user input
      messages.push({
        role: 'user',
        content: params.input,
      });

      // Call Anthropic API
      const response = await this.anthropicClient.messages.create({
        model: params.options?.model || this.defaultModel.anthropic,
        max_tokens: params.options?.maxTokens || 1024,
        messages: messages,
        temperature: params.options?.temperature || 0.7,
      });

      return response.content[0].text;
    } catch (error) {
      const errorMessage = `Anthropic API error: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Process learning request with Perplexity
   * @param params Learning parameters
   */
  private async processWithPerplexity(params: LearningParams): Promise<string> {
    if (!this.perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    try {
      const messages = [];

      // Add context if provided
      if (params.context && params.context.length > 0) {
        messages.push({
          role: 'system',
          content: params.context.join('\n\n'),
        });
      }

      // Add user input
      messages.push({
        role: 'user',
        content: params.input,
      });

      // Call Perplexity API
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: params.options?.model || this.defaultModel.perplexity,
          messages: messages,
          max_tokens: params.options?.maxTokens || 1024,
          temperature: params.options?.temperature || 0.7,
          top_p: params.options?.topP || 0.9,
          stream: false,
          frequency_penalty: params.options?.frequencyPenalty || 1,
          presence_penalty: params.options?.presencePenalty || 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      const errorMessage = `Perplexity API error: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Process a learning request
   * @param params Learning parameters
   */
  public async learn(params: LearningParams): Promise<string> {
    const modelType = params.modelType || 'anthropic';

    try {
      if (modelType === 'anthropic') {
        if (!this.anthropicClient) {
          throw new Error('Anthropic client not initialized');
        }
        return await this.processWithAnthropic(params);
      } else if (modelType === 'perplexity') {
        if (!this.perplexityApiKey) {
          throw new Error('Perplexity API key not configured');
        }
        return await this.processWithPerplexity(params);
      } else {
        throw new Error(`Unsupported model type: ${modelType}`);
      }
    } catch (error) {
      this.logger.error(
        `Learning processing error: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
