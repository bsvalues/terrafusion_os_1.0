/**
 * Resilient LLM Service
 *
 * This service provides resilience and fallback capabilities when
 * interacting with LLM providers. It will try multiple providers
 * in priority order, with retry logic for handling transient errors.
 */

import { LLMService, LLMProviderConfig, LLMServiceFactory } from './llm-service';
import {
  LLMProviderType,
  CompletionRequest,
  ChatCompletionRequest,
  EmbeddingRequest,
  LLMResponse,
} from '../models/llm-types';

/**
 * Configuration for the resilient LLM service
 */
export interface ResilientLLMServiceConfig {
  /**
   * List of provider configurations in priority order
   */
  providers: LLMProviderConfig[];

  /**
   * Maximum number of retries per provider
   */
  maxRetries?: number;

  /**
   * Delay between retries in milliseconds
   */
  retryDelay?: number;

  /**
   * Whether to log provider switching and retries
   */
  logAttempts?: boolean;
}

/**
 * Resilient LLM service implementation
 */
export class ResilientLLMService implements LLMService {
  private providers: LLMService[] = [];
  private maxRetries: number;
  private retryDelay: number;
  private logAttempts: boolean;
  private isInitialized: boolean = false;

  constructor(config: ResilientLLMServiceConfig) {
    if (!config.providers || config.providers.length === 0) {
      throw new Error('At least one provider configuration is required');
    }

    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.logAttempts = config.logAttempts !== undefined ? config.logAttempts : true;

    // Create services for each provider
    for (const providerConfig of config.providers) {
      try {
        const service = LLMServiceFactory.createService(providerConfig);
        this.providers.push(service);
      } catch (error) {
        console.warn(`Failed to create LLM service for provider ${providerConfig.type}: ${error}`);
      }
    }

    if (this.providers.length === 0) {
      throw new Error('No valid LLM providers found');
    }
  }

  /**
   * Initialize all providers
   */
  public async initialize(): Promise<void> {
    if (this.providers.length === 0) {
      throw new Error('No LLM providers available');
    }

    // Try to initialize all providers
    const initPromises = this.providers.map(async (provider /* , index */) => {
      try {
        await provider.initialize();
        return { success: true, index };
      } catch (error) {
        return { success: false, index, error };
      }
    });

    const results = await Promise.all(initPromises);

    // Filter out providers that failed to initialize
    const failedProviders = results.filter(r => !r.success);
    if (failedProviders.length > 0) {
      for (const { index, error } of failedProviders) {
        console.warn(`Failed to initialize LLM provider at index ${index}: ${error}`);
        this.providers[index] = null as any; // Mark as unavailable
      }
    }

    // Remove null providers
    this.providers = this.providers.filter(p => p !== null);

    if (this.providers.length === 0) {
      throw new Error('All LLM providers failed to initialize');
    }

    this.isInitialized = true;
  }

  /**
   * Check if the service is ready
   */
  public isReady(): boolean {
    return this.isInitialized && this.providers.some(p => p.isReady());
  }

  /**
   * Generate a text completion with fallback
   */
  public async complete(request: CompletionRequest): Promise<LLMResponse> {
    return this.executeWithFallback(provider => provider.complete(request), 'complete');
  }

  /**
   * Generate a chat completion with fallback
   */
  public async chat(request: ChatCompletionRequest): Promise<LLMResponse> {
    return this.executeWithFallback(provider => provider.chat(request), 'chat');
  }

  /**
   * Generate text embeddings with fallback
   */
  public async embed(request: EmbeddingRequest): Promise<number[][]> {
    return this.executeWithFallback(provider => provider.embed(request), 'embed');
  }

  /**
   * Get available models from primary provider
   */
  public async getAvailableModels(): Promise<string[]> {
    // Get models from all providers that are ready
    const readyProviders = this.providers.filter(p => p.isReady());
    if (readyProviders.length === 0) {
      throw new Error('No LLM providers are ready');
    }

    // Get models from all providers
    const modelPromises = readyProviders.map(async provider => {
      try {
        return await provider.getAvailableModels();
      } catch (error) {
        return [];
      }
    });

    const allModels = await Promise.all(modelPromises);

    // Flatten and deduplicate models
    return [...new Set(allModels.flat())];
  }

  /**
   * Execute a function with retries and provider fallback
   */
  private async executeWithFallback<T>(
    fn: (provider: LLMService) => Promise<T>,
    operationName: string
  ): Promise<T> {
    if (!this.isReady()) {
      throw new Error('Resilient LLM service not ready');
    }

    // Get ready providers
    const readyProviders = this.providers.filter(p => p.isReady());
    if (readyProviders.length === 0) {
      throw new Error('No LLM providers are ready');
    }

    let lastError: Error | null = null;

    // Try each provider with retries
    for (const provider of readyProviders) {
      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          // Log attempt if enabled
          if (this.logAttempts) {
            console.info(
              `Attempting ${operationName} with provider ${provider.constructor.name}, attempt ${attempt + 1}/${this.maxRetries + 1}`
            );
          }

          // Execute operation
          const result = await fn(provider);

          // Log success if enabled
          if (this.logAttempts) {
            console.info(
              `${operationName} completed successfully with provider ${provider.constructor.name}`
            );
          }

          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Log failure if enabled
          if (this.logAttempts) {
            console.warn(
              `${operationName} failed with provider ${provider.constructor.name}, attempt ${attempt + 1}/${this.maxRetries + 1}: ${lastError.message}`
            );
          }

          // Check if this is a retriable error or if we've exhausted retries
          const isRetriable = this.isRetriableError(lastError);

          if (!isRetriable || attempt >= this.maxRetries) {
            // Non-retriable error or max retries reached, try next provider
            break;
          }

          // Wait before retry
          await this.delay(this.retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    // All providers failed
    throw new Error(
      `All LLM providers failed for operation ${operationName}: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Check if an error is retriable
   */
  private isRetriableError(error: Error): boolean {
    // Determine if the error is retriable
    const errorMessage = error.message.toLowerCase();

    // Rate limit errors
    if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('rate_limit') ||
      errorMessage.includes('too many requests') ||
      errorMessage.includes('429')
    ) {
      return true;
    }

    // Temporary server errors
    if (
      errorMessage.includes('server error') ||
      errorMessage.includes('5xx') ||
      errorMessage.includes('500') ||
      errorMessage.includes('502') ||
      errorMessage.includes('503') ||
      errorMessage.includes('504') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection')
    ) {
      return true;
    }

    // Consider quota errors non-retriable for the same provider
    if (
      errorMessage.includes('quota') ||
      errorMessage.includes('billing') ||
      errorMessage.includes('payment') ||
      errorMessage.includes('subscription')
    ) {
      return false;
    }

    // Default to non-retriable for safety
    return false;
  }

  /**
   * Helper method to create a delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a resilient LLM service from environment variables
   */
  public static fromEnvironment(): ResilientLLMService {
    // Get provider priority from environment variable
    const priorityStr = process.env.AI_PROVIDER_PRIORITY || 'openai,anthropic';
    const priorities = priorityStr.split(',').map(p => p.trim());

    // Create provider configurations
    const providers: LLMProviderConfig[] = [];

    for (const priority of priorities) {
      const providerType = priority.toLowerCase();

      if (providerType === 'openai') {
        // OpenAI configuration
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
          providers.push({
            type: LLMProviderType.OPENAI,
            apiKey,
            organizationId: process.env.OPENAI_ORGANIZATION_ID,
            defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4',
            defaultOptions: {
              temperature: Number(process.env.OPENAI_TEMPERATURE || '0.7'),
              maxTokens: Number(process.env.OPENAI_MAX_TOKENS || '1000'),
            },
          });
        }
      } else if (providerType === 'anthropic') {
        // Anthropic configuration
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
          providers.push({
            type: LLMProviderType.ANTHROPIC,
            apiKey,
            defaultModel: process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-sonnet-20240229',
            defaultOptions: {
              temperature: Number(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
              maxTokens: Number(process.env.ANTHROPIC_MAX_TOKENS || '1000'),
            },
          });
        }
      } else if (providerType === 'azure_openai') {
        // Azure OpenAI configuration
        const apiKey = process.env.AZURE_OPENAI_API_KEY;
        if (apiKey) {
          providers.push({
            type: LLMProviderType.AZURE_OPENAI,
            apiKey,
            apiUrl: process.env.AZURE_OPENAI_ENDPOINT,
            defaultModel: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
            defaultOptions: {
              temperature: Number(process.env.AZURE_OPENAI_TEMPERATURE || '0.7'),
              maxTokens: Number(process.env.AZURE_OPENAI_MAX_TOKENS || '1000'),
            },
          });
        }
      }
      // Add other providers as needed
    }

    if (providers.length === 0) {
      throw new Error('No LLM provider configurations found in environment variables');
    }

    return new ResilientLLMService({
      providers,
      maxRetries: Number(process.env.LLM_MAX_RETRIES || '3'),
      retryDelay: Number(process.env.LLM_RETRY_DELAY || '1000'),
      logAttempts: process.env.LLM_LOG_ATTEMPTS !== 'false',
    });
  }
}
