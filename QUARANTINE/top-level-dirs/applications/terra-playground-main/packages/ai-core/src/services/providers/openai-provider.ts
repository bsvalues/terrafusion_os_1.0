/**
 * OpenAI Service Provider
 *
 * Implementation of the LLM service for OpenAI.
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
 * OpenAI specific configuration
 */
export interface OpenAIConfig extends LLMProviderConfig {
  /**
   * Organization ID (optional)
   */
  organizationId?: string;

  /**
   * API version (optional)
   */
  apiVersion?: string;
}

/**
 * OpenAI service implementation
 */
export class OpenAIService extends BaseLLMService {
  private organizationId?: string;
  private apiVersion?: string;

  constructor(config: OpenAIConfig) {
    super(config);
    this.organizationId = config.organizationId;
    this.apiVersion = config.apiVersion || '2023-05-15';
  }

  /**
   * Initialize the OpenAI service
   */
  public async initialize(): Promise<void> {
    await super.initialize();

    // Validate configuration
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    // Test API connection
    try {
      await this.getAvailableModels();
      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Generate a text completion
   */
  public async complete(request: CompletionRequest): Promise<LLMResponse> {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    const options = this.mergeOptions(request.options);

    try {
      // Convert to chat completion for newer models (GPT-3.5 and up)
      // as OpenAI is deprecating the completions endpoint
      if (options.model.includes('gpt')) {
        const chatRequest: ChatCompletionRequest = {
          messages: [{ role: 'user', content: request.prompt }],
          options,
        };

        return this.chat(chatRequest);
      }

      // Use completions API for older models
      const response = await this.makeOpenAIRequest('/completions', {
        model: options.model,
        prompt: request.prompt,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        top_p: options.topP,
        stop: options.stop,
        presence_penalty: options.presencePenalty,
        frequency_penalty: options.frequencyPenalty,
      });

      // Parse response
      if (!response.choices || response.choices.length === 0) {
        throw new Error('OpenAI returned empty choices');
      }

      return {
        text: response.choices[0].text || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        rawResponse: response,
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Generate a chat completion
   */
  public async chat(request: ChatCompletionRequest): Promise<LLMResponse> {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    const options = this.mergeOptions(request.options);

    try {
      // Format messages for OpenAI
      const messages = this.formatChatMessages(request.messages);

      // Make API request
      const response = await this.makeOpenAIRequest('/chat/completions', {
        model: options.model,
        messages,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        top_p: options.topP,
        stop: options.stop,
        presence_penalty: options.presencePenalty,
        frequency_penalty: options.frequencyPenalty,
        response_format: options.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      });

      // Parse response
      if (!response.choices || response.choices.length === 0) {
        throw new Error('OpenAI returned empty choices');
      }

      return {
        text: response.choices[0].message?.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        rawResponse: response,
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Generate text embeddings
   */
  public async embed(request: EmbeddingRequest): Promise<number[][]> {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    const options = this.mergeOptions(request.options);
    const input = Array.isArray(request.text) ? request.text : [request.text];

    try {
      // Make API request
      const response = await this.makeOpenAIRequest('/embeddings', {
        model: options.model || 'text-embedding-ada-002',
        input,
      });

      // Parse response
      if (!response.data || response.data.length === 0) {
        throw new Error('OpenAI returned empty embedding data');
      }

      // Return embeddings
      return response.data.map((item: any) => item.embedding || []);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get available models
   */
  public async getAvailableModels(): Promise<string[]> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    try {
      const response = await this.makeOpenAIRequest('/models', {}, 'GET');

      // Parse response
      if (!response.data) {
        return [];
      }

      // Extract model IDs
      return response.data.map((model: any) => model.id);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Helper: Format chat messages for OpenAI's API format
   */
  private formatChatMessages(messages: ChatMessage[]): any[] {
    return messages.map(msg => {
      const formatted: any = {
        role: msg.role,
        content: msg.content,
      };

      // Add name if provided
      if (msg.name) {
        formatted.name = msg.name;
      }

      // Add function call if provided
      if (msg.functionCall) {
        formatted.function_call = {
          name: msg.functionCall.name,
          arguments: msg.functionCall.arguments,
        };
      }

      // Add tool call if provided
      if (msg.toolCall) {
        formatted.tool_calls = [
          {
            id: msg.toolCall.id,
            type: 'function',
            function: {
              name: msg.toolCall.name,
              arguments: msg.toolCall.arguments,
            },
          },
        ];
      }

      return formatted;
    });
  }

  /**
   * Helper: Make a request to the OpenAI API
   */
  private async makeOpenAIRequest(
    endpoint: string,
    data: any,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<any> {
    const url = this.config.apiUrl || 'https://api.openai.com/v1';
    const fullUrl = `${url}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };

    // Add organization header if provided
    if (this.organizationId) {
      headers['OpenAI-Organization'] = this.organizationId;
    }

    // Add API version if provided
    if (this.apiVersion) {
      headers['OpenAI-Version'] = this.apiVersion;
    }

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
        throw new Error(`OpenAI API Error (${response.status}): ${errorText}`);
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

    // Try to extract error message from OpenAI response
    if (error.response?.data?.error) {
      return new Error(`OpenAI API Error: ${error.response.data.error.message}`);
    }

    // Default error
    return new Error(`OpenAI API Error: ${error.message || 'Unknown error'}`);
  }
}
