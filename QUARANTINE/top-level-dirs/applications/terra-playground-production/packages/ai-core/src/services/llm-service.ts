/**
 * LLM Service
 *
 * Provides a unified interface for interacting with various LLM providers.
 */

import {
  LLMProviderType,
  CompletionRequest,
  ChatCompletionRequest,
  EmbeddingRequest,
  LLMResponse,
  LLMRequestOptions,
} from '../models/llm-types';

/**
 * LLM provider configuration
 */
export interface LLMProviderConfig {
  /**
   * Provider type
   */
  type: LLMProviderType;

  /**
   * API key or authentication token
   */
  apiKey: string;

  /**
   * API endpoint URL (for custom or Azure OpenAI)
   */
  apiUrl?: string;

  /**
   * Organization ID (for OpenAI)
   */
  organizationId?: string;

  /**
   * Default model to use
   */
  defaultModel?: string;

  /**
   * Default request options
   */
  defaultOptions?: Partial<LLMRequestOptions>;
}

/**
 * LLM Service interface
 */
export interface LLMService {
  /**
   * Initialize the LLM service
   */
  initialize(): Promise<void>;

  /**
   * Generate a text completion
   */
  complete(request: CompletionRequest): Promise<LLMResponse>;

  /**
   * Generate a chat completion
   */
  chat(request: ChatCompletionRequest): Promise<LLMResponse>;

  /**
   * Generate text embeddings
   */
  embed(request: EmbeddingRequest): Promise<number[][]>;

  /**
   * Check if the service is ready
   */
  isReady(): boolean;

  /**
   * Get available models
   */
  getAvailableModels(): Promise<string[]>;
}

/**
 * Base LLM Service implementation
 */
export abstract class BaseLLMService implements LLMService {
  protected config: LLMProviderConfig;
  protected isInitialized: boolean = false;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  /**
   * Initialize the service
   */
  public async initialize(): Promise<void> {
    // Base initialization
    this.isInitialized = true;
  }

  /**
   * Check if service is ready
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Generate a text completion
   */
  public abstract complete(request: CompletionRequest): Promise<LLMResponse>;

  /**
   * Generate a chat completion
   */
  public abstract chat(request: ChatCompletionRequest): Promise<LLMResponse>;

  /**
   * Generate text embeddings
   */
  public abstract embed(request: EmbeddingRequest): Promise<number[][]>;

  /**
   * Get available models
   */
  public abstract getAvailableModels(): Promise<string[]>;

  /**
   * Merge default options with request options
   */
  protected mergeOptions(options?: Partial<LLMRequestOptions>): LLMRequestOptions {
    return {
      model: this.config.defaultModel || '',
      ...this.config.defaultOptions,
      ...options,
    };
  }
}

/**
 * LLM service factory
 */
export class LLMServiceFactory {
  /**
   * Create an LLM service based on provider type
   */
  public static createService(config: LLMProviderConfig): LLMService {
    switch (config.type) {
      case LLMProviderType.OPENAI:
        // Import OpenAI service dynamically
        const { OpenAIService } = require('./providers/openai-provider');
        return new OpenAIService(config);
      case LLMProviderType.ANTHROPIC:
        // Import Anthropic service dynamically
        const { AnthropicService } = require('./providers/anthropic-provider');
        return new AnthropicService(config);
      case LLMProviderType.AZURE_OPENAI:
        throw new Error('Azure OpenAI provider not implemented yet');
      case LLMProviderType.COHERE:
        throw new Error('Cohere provider not implemented yet');
      case LLMProviderType.HUGGINGFACE:
        throw new Error('HuggingFace provider not implemented yet');
      case LLMProviderType.CUSTOM:
        throw new Error('Custom provider not implemented yet');
      default:
        throw new Error(`Unsupported LLM provider type: ${config.type}`);
    }
  }
}
