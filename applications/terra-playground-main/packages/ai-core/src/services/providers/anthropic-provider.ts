/**
 * Anthropic Service Provider
 *
 * Implementation of the LLM service for Anthropic.
 */

import { BaseLLMService, LLMProviderConfig } from '../llm-service';
import {
  CompletionRequest,
  ChatCompletionRequest,
  EmbeddingRequest,
  LLMResponse,
  ChatMessage,
} from '../../models/llm-types';

/**
 * Anthropic specific configuration
 */
export interface AnthropicConfig extends LLMProviderConfig {
  /**
   * API version (optional)
   */
  apiVersion?: string;
}

/**
 * Anthropic service implementation
 */
export class AnthropicService extends BaseLLMService {
  private apiVersion?: string;

  constructor(config: AnthropicConfig) {
    super(config);
    this.apiVersion = config.apiVersion || '2023-06-01';
  }

  /**
   * Initialize the Anthropic service
   */
  public async initialize(): Promise<void> {
    await super.initialize();

    // Validate configuration
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    // Test API connection
    try {
      // Simple test to verify API key
      await this.makeAnthropicRequest('/messages', {
        model: this.config.defaultModel || 'claude-3-sonnet-20240229',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hello' }],
      });

      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Generate a text completion (maps to messages API in Anthropic)
   */
  public async complete(request: CompletionRequest): Promise<LLMResponse> {
    if (!this.isInitialized) {
      throw new Error('Anthropic service not initialized');
    }

    // Convert completion request to chat format
    const chatRequest: ChatCompletionRequest = {
      messages: [{ role: 'user', content: request.prompt }],
      options: request.options,
    };

    // Use chat completion since Anthropic only offers message-based API
    return this.chat(chatRequest);
  }

  /**
   * Generate a chat completion
   */
  public async chat(request: ChatCompletionRequest): Promise<LLMResponse> {
    if (!this.isInitialized) {
      throw new Error('Anthropic service not initialized');
    }

    const options = this.mergeOptions(request.options);

    try {
      // Format messages for Anthropic
      const messages = this.formatChatMessages(request.messages);

      // Make API request
      const response = await this.makeAnthropicRequest('/messages', {
        model: options.model,
        messages,
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature,
        top_p: options.topP,
        stop_sequences: options.stop,
      });

      // Parse response
      if (!response.content || response.content.length === 0) {
        throw new Error('Anthropic returned empty content');
      }

      return {
        text: response.content[0].text,
        usage: {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        },
        rawResponse: response,
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Generate text embeddings
   * Note: Anthropic doesn't currently offer embeddings, so this is a stub
   */
  public async embed(request: EmbeddingRequest): Promise<number[][]> {
    throw new Error('Anthropic does not support embeddings');
  }

  /**
   * Get available models
   */
  public async getAvailableModels(): Promise<string[]> {
    // Anthropic doesn't have a models endpoint, so return hardcoded list
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2',
    ];
  }

  /**
   * Helper: Format chat messages for Anthropic's API format
   */
  private formatChatMessages(messages: ChatMessage[]): any[] {
    return messages.map(msg => {
      // Map role names to Anthropic format
      let role = msg.role;
      if (role === 'assistant') {
        role = 'assistant';
      } else if (role === 'system') {
        // System messages are handled differently in Anthropic
        // We'll keep it as 'system' and handle it separately
        role = 'system';
      } else {
        role = 'user';
      }

      return {
        role,
        content: msg.content,
      };
    });
  }

  /**
   * Helper: Make a request to the Anthropic API
   */
  private async makeAnthropicRequest(
    endpoint: string,
    data: any,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<any> {
    const url = this.config.apiUrl || 'https://api.anthropic.com';
    const fullUrl = `${url}${endpoint}`;

    const headers: Record<string, string> = {
      'x-api-key': this.config.apiKey,
      'anthropic-version': this.apiVersion || '2023-06-01',
      'Content-Type': 'application/json',
    };

    try {
      // Use global fetch for compatibility
      const response = await fetch(fullUrl, {
        method,
        headers,
        body: method === 'POST' ? JSON.stringify(data) : undefined,
      });

      // Check for successful response
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API Error (${response.status}): ${errorText}`);
      }

      // Parse response
      return await response.json();
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Helper: Format error message
   */
  private formatError(error: any): Error {
    // Already a formatted error
    if (error instanceof Error) {
      return error;
    }

    // Try to extract error message from Anthropic response
    if (error.response?.data?.error) {
      return new Error(`Anthropic API Error: ${error.response.data.error.message}`);
    }

    // Default error
    return new Error(`Anthropic API Error: ${error.message || 'Unknown error'}`);
  }
}
