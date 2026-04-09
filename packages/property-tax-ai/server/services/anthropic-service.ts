/**
 * Anthropic Service (Claude API)
 * 
 * This service provides an interface for interacting with Anthropic's Claude API.
 * It handles API key management, request formatting, and response parsing.
 * Includes robust error handling for rate limits and other common API issues.
 */

import { Anthropic } from '@anthropic-ai/sdk';

/**
 * Validate the Anthropic API key
 * @returns True if the API key is valid and present, false otherwise
 */
export function isAnthropicApiKeyValid(): boolean {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  // Basic validation check
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return false;
  }
  
  // Claude API keys have a specific format
  // They typically start with "sk-ant-" and are followed by a long string
  if (!apiKey.startsWith('sk-ant-') || apiKey.length < 40) {
    return false;
  }
  
  return true;
}

/**
 * Get an instance of the Anthropic client with proper error handling
 * @throws Error if the API key is not valid
 * @returns Anthropic client instance
 */
export function getAnthropicClient(): Anthropic {
  if (!isAnthropicApiKeyValid()) {
    throw new Error('Anthropic API key is missing or invalid. Please add a valid ANTHROPIC_API_KEY to your environment variables.');
  }
  
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Initialize Anthropic client with error handling
let anthropic: Anthropic;
try {
  anthropic = getAnthropicClient();
} catch (err) {
  const error = err as Error;
  console.warn('Failed to initialize Anthropic client:', error.message);
  // Create a placeholder client that will throw appropriate errors when used
  anthropic = new Proxy({} as Anthropic, {
    get: (_, prop) => {
      return () => {
        throw new Error('Anthropic API is not properly configured. Please check your ANTHROPIC_API_KEY.');
      };
    }
  });
}

/**
 * Anthropic API Error Types
 */
export enum AnthropicErrorType {
  RATE_LIMIT = 'rate_limit',
  QUOTA_EXCEEDED = 'quota_exceeded',
  INVALID_API_KEY = 'invalid_api_key',
  SERVER_ERROR = 'server_error',
  CONTEXT_LENGTH_EXCEEDED = 'context_length',
  OTHER = 'other'
}

/**
 * Anthropic Error Response
 */
export interface AnthropicError {
  type: AnthropicErrorType;
  message: string;
  retryAfter?: number;
}

/**
 * Anthropic Service Interface
 */
export interface IAnthropicService {
  generateText(prompt: string, systemPrompt?: string, maxTokens?: number): Promise<string>;
  isRateLimitError(error: any): boolean;
  getErrorDetails(error: any): AnthropicError;
}

/**
 * Anthropic Service Implementation
 */
export class AnthropicService implements IAnthropicService {
  // Track API call attempts for backoff strategy
  private apiCallAttempts = 0;
  private lastErrorTimestamp = 0;
  
  /**
   * Classify the Anthropic error type from the error object
   */
  isRateLimitError(error: any): boolean {
    if (!error) return false;
    
    // Check for rate limit status codes
    if (error.status === 429) return true;
    if (error.status_code === 429) return true;
    
    // Check error types
    if (error.error?.type === 'rate_limit_error') return true;
    if (error.error?.type === 'quota_exceeded') return true;
    
    // Check error message content as fallback
    const errorMessage = error.message || error.error?.message || '';
    return errorMessage.includes('rate limit') || 
           errorMessage.includes('quota') ||
           errorMessage.includes('capacity');
  }
  
  /**
   * Get detailed error information from Anthropic error
   */
  getErrorDetails(error: any): AnthropicError {
    if (!error) {
      return {
        type: AnthropicErrorType.OTHER,
        message: 'Unknown error'
      };
    }
    
    // Extract retry-after header if available
    let retryAfter: number | undefined = undefined;
    if (error.headers && error.headers['retry-after']) {
      retryAfter = parseInt(error.headers['retry-after'], 10);
    }
    
    // Check for rate limit errors
    if (error.status === 429 || error.status_code === 429) {
      if (error.error?.type === 'quota_exceeded') {
        return {
          type: AnthropicErrorType.QUOTA_EXCEEDED,
          message: 'API quota exceeded. Please check your Anthropic account billing settings.',
          retryAfter
        };
      }
      return {
        type: AnthropicErrorType.RATE_LIMIT,
        message: 'Too many API requests. Please try again after a short delay.',
        retryAfter
      };
    }
    
    // Check for invalid API key
    if (error.status === 401 || error.status_code === 401) {
      return {
        type: AnthropicErrorType.INVALID_API_KEY,
        message: 'Invalid API key. Please check your Anthropic API key configuration.'
      };
    }
    
    // Check for server errors
    if ((error.status && error.status >= 500) || 
        (error.status_code && error.status_code >= 500)) {
      return {
        type: AnthropicErrorType.SERVER_ERROR,
        message: 'Anthropic server error. Please try again later.'
      };
    }
    
    // Check for context length errors
    if (error.error?.type === 'context_length_exceeded' || 
        (error.message && error.message.includes('maximum context length'))) {
      return {
        type: AnthropicErrorType.CONTEXT_LENGTH_EXCEEDED,
        message: 'Input is too long for the model to process.'
      };
    }
    
    // Default error
    return {
      type: AnthropicErrorType.OTHER,
      message: error.error?.message || error.message || 'Unknown Anthropic API error'
    };
  }
  
  /**
   * Generate text response from a prompt using Claude
   * 
   * @param prompt The user prompt
   * @param systemPrompt Optional system prompt to set context
   * @param maxTokens Maximum number of tokens in the response
   * @returns Generated text
   */
  async generateText(
    prompt: string, 
    systemPrompt: string = "You are Claude, a helpful AI assistant.", 
    maxTokens: number = 1000
  ): Promise<string> {
    try {
      // Reset attempt counter if it's been more than 10 seconds since the last error
      const now = Date.now();
      if (now - this.lastErrorTimestamp > 10000) {
        this.apiCallAttempts = 0;
      }
      
      const response = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: prompt
        }]
      });
      
      // Extract text from the response content
      // Claude returns an array of content blocks which could be text or other media
      const textContent = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');
      
      if (!textContent) {
        throw new Error("Anthropic returned empty response");
      }
      
      // Reset attempt counter on success
      this.apiCallAttempts = 0;
      return textContent;
    } catch (error: any) {
      // Track error for backoff strategy
      this.lastErrorTimestamp = Date.now();
      this.apiCallAttempts++;
      
      // Get detailed error information
      const errorDetails = this.getErrorDetails(error);
      console.error(`Error in Anthropic text generation: ${errorDetails.type} - ${errorDetails.message}`, error);
      
      throw new Error(`Anthropic text generation failed: ${errorDetails.message}`);
    }
  }
}

// Export singleton instance
export const anthropicService = new AnthropicService();