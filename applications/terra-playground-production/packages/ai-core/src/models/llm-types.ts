/**
 * LLM Service Type Definitions
 */

/**
 * LLM provider types
 */
export enum LLMProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  AZURE_OPENAI = 'azure_openai',
  COHERE = 'cohere',
  HUGGINGFACE = 'huggingface',
  CUSTOM = 'custom',
}

/**
 * Base LLM request options
 */
export interface LLMRequestOptions {
  /**
   * Model identifier
   */
  model: string;

  /**
   * Temperature setting (0-1)
   */
  temperature?: number;

  /**
   * Maximum tokens to generate
   */
  maxTokens?: number;

  /**
   * Top-p sampling (nucleus sampling)
   */
  topP?: number;

  /**
   * Whether to stream the response
   */
  stream?: boolean;

  /**
   * Stop sequences
   */
  stop?: string[];

  /**
   * Response format
   */
  responseFormat?: 'text' | 'json';

  /**
   * Presence penalty
   */
  presencePenalty?: number;

  /**
   * Frequency penalty
   */
  frequencyPenalty?: number;

  /**
   * Additional provider-specific options
   */
  [key: string]: any;
}

/**
 * Text completion request
 */
export interface CompletionRequest {
  /**
   * The prompt to complete
   */
  prompt: string;

  /**
   * Request options
   */
  options?: LLMRequestOptions;
}

/**
 * Chat completion message
 */
export interface ChatMessage {
  /**
   * Role of the message author
   */
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';

  /**
   * Content of the message
   */
  content: string;

  /**
   * Name of the author (optional)
   */
  name?: string;

  /**
   * Function call info (for function calling)
   */
  functionCall?: {
    name: string;
    arguments: string;
  };

  /**
   * Tool call info (for tool calling)
   */
  toolCall?: {
    id: string;
    name: string;
    arguments: string;
  };
}

/**
 * Chat completion request
 */
export interface ChatCompletionRequest {
  /**
   * The messages for the conversation
   */
  messages: ChatMessage[];

  /**
   * Request options
   */
  options?: LLMRequestOptions;
}

/**
 * Embedding request
 */
export interface EmbeddingRequest {
  /**
   * The text to embed
   */
  text: string | string[];

  /**
   * Request options
   */
  options?: LLMRequestOptions;
}

/**
 * LLM response
 */
export interface LLMResponse {
  /**
   * The generated text
   */
  text: string;

  /**
   * Usage information
   */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  /**
   * Raw provider response
   */
  rawResponse?: any;
}
