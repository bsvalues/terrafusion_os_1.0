/**
 * OpenAI Service
 *
 * This service provides a centralized interface for interacting with OpenAI API.
 * It handles API key management, request formatting, and response parsing.
 * Includes robust error handling for rate limits and other common API issues.
 */

import OpenAI from 'openai';

/**
 * Validate the OpenAI API key
 * @returns True if the API key is valid and present, false otherwise
 */
export function isOpenAIApiKeyValid(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;

  // Basic validation check
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return false;
  }

  // OpenAI API keys typically have a specific format and length
  // They start with "sk-" and are followed by a long string
  if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
    return false;
  }

  return true;
}

/**
 * Get an instance of the OpenAI client with proper error handling
 * @throws Error if the API key is not valid
 * @returns OpenAI client instance
 */
export function getOpenAIClient(): OpenAI {
  if (!isOpenAIApiKeyValid()) {
    throw new Error(
      'OpenAI API key is missing or invalid. Please add a valid OPENAI_API_KEY to your environment variables.'
    );
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Initialize OpenAI client with error handling
let openai: OpenAI;
try {
  openai = getOpenAIClient();
} catch (err) {
  const error = err as Error;
  console.warn('Failed to initialize OpenAI client:', error.message);
  // Create a placeholder client that will throw appropriate errors when used
  openai = new Proxy({} as OpenAI, {
    get: (_, prop) => {
      return () => {
        throw new Error('OpenAI API is not properly configured. Please check your OPENAI_API_KEY.');
      };
    },
  });
}

/**
 * OpenAI API Error Types
 */
export enum OpenAIErrorType {
  RATE_LIMIT = 'rate_limit',
  QUOTA_EXCEEDED = 'quota_exceeded',
  INVALID_API_KEY = 'invalid_api_key',
  SERVER_ERROR = 'server_error',
  CONTEXT_LENGTH_EXCEEDED = 'context_length',
  OTHER = 'other',
}

/**
 * OpenAI Error Response
 */
export interface OpenAIError {
  type: OpenAIErrorType;
  message: string;
  retryAfter?: number;
}

/**
 * Interface for image generation results
 */
export interface GeneratedImageResult {
  url: string;
  b64_json?: string;
}

/**
 * OpenAI Service Interface
 */
export interface IOpenAIService {
  generateText(prompt: string, systemPrompt?: string, maxTokens?: number): Promise<string>;
  generateCompletion(messages: any[], maxTokens?: number, temperature?: number): Promise<string>;
  generateJson<T>(prompt: string, systemPrompt: string, maxTokens?: number): Promise<T>;
  analyzeImage(base64Image: string, prompt?: string): Promise<string>;
  generateImage(
    prompt: string,
    responseFormat?: 'url' | 'b64_json',
    size?: string
  ): Promise<GeneratedImageResult>;
  isRateLimitError(error: any): boolean;
  getErrorDetails(error: any): OpenAIError;
}

/**
 * OpenAI Service Implementation
 */
export class OpenAIService implements IOpenAIService {
  // Track API call attempts for backoff strategy
  private apiCallAttempts = 0;
  private lastErrorTimestamp = 0;

  /**
   * Classify the OpenAI error type from the error object
   */
  isRateLimitError(error: any): boolean {
    if (!error) return false;

    // Check for rate limit headers or error codes
    if (error.status === 429) return true;
    if (error.code === 'rate_limit_exceeded') return true;
    if (error.code === 'insufficient_quota') return true;
    if (error.type === 'rate_limit_exceeded') return true;
    if (error.type === 'insufficient_quota') return true;

    // Check error message content as fallback
    const errorMessage = error.message || '';
    return (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('capacity')
    );
  }

  /**
   * Get detailed error information from OpenAI error
   */
  getErrorDetails(error: any): OpenAIError {
    if (!error) {
      return {
        type: OpenAIErrorType.OTHER,
        message: 'Unknown error',
      };
    }

    // Extract retry-after header if available
    let retryAfter: number | undefined = undefined;
    if (error.headers && error.headers['retry-after']) {
      retryAfter = parseInt(error.headers['retry-after'], 10);
    }

    // Check for rate limit errors
    if (error.status === 429) {
      if (error.code === 'insufficient_quota' || error.type === 'insufficient_quota') {
        return {
          type: OpenAIErrorType.QUOTA_EXCEEDED,
          message: 'API quota exceeded. Please check your OpenAI account billing settings.',
          retryAfter,
        };
      }
      return {
        type: OpenAIErrorType.RATE_LIMIT,
        message: 'Too many API requests. Please try again after a short delay.',
        retryAfter,
      };
    }

    // Check for invalid API key
    if (error.status === 401) {
      return {
        type: OpenAIErrorType.INVALID_API_KEY,
        message: 'Invalid API key. Please check your OpenAI API key configuration.',
      };
    }

    // Check for server errors
    if (error.status >= 500) {
      return {
        type: OpenAIErrorType.SERVER_ERROR,
        message: 'OpenAI server error. Please try again later.',
      };
    }

    // Check for context length errors
    if (
      error.code === 'context_length_exceeded' ||
      (error.message && error.message.includes('maximum context length'))
    ) {
      return {
        type: OpenAIErrorType.CONTEXT_LENGTH_EXCEEDED,
        message: 'Input is too long for the model to process.',
      };
    }

    // Default error
    return {
      type: OpenAIErrorType.OTHER,
      message: error.message || 'Unknown OpenAI API error',
    };
  }

  /**
   * Generate text response from a prompt
   *
   * @param prompt The user prompt
   * @param systemPrompt Optional system prompt to set context
   * @param maxTokens Maximum number of tokens in the response
   * @returns Generated text
   */
  async generateText(
    prompt: string,
    systemPrompt: string = 'You are a helpful assistant.',
    maxTokens: number = 1000
  ): Promise<string> {
    try {
      // Reset attempt counter if it's been more than 10 seconds since the last error
      const now = Date.now();
      if (now - this.lastErrorTimestamp > 10000) {
        this.apiCallAttempts = 0;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.5,
      });

      const generatedText = response.choices[0].message.content;

      if (!generatedText) {
        throw new Error('OpenAI returned empty response');
      }

      // Reset attempt counter on success
      this.apiCallAttempts = 0;
      return generatedText;
    } catch (error: any) {
      // Track error for backoff strategy
      this.lastErrorTimestamp = Date.now();
      this.apiCallAttempts++;

      // Get detailed error information
      const errorDetails = this.getErrorDetails(error);
      console.error(
        `Error in OpenAI text generation: ${errorDetails.type} - ${errorDetails.message}`,
        error
      );

      throw new Error(`OpenAI text generation failed: ${errorDetails.message}`);
    }
  }

  /**
   * Generate completion from a series of messages
   *
   * @param messages Array of messages in OpenAI format
   * @param maxTokens Maximum number of tokens in the response
   * @param temperature Temperature setting for randomness (0-1)
   * @returns Generated text
   */
  async generateCompletion(
    messages: any[],
    maxTokens: number = 1000,
    temperature: number = 0.5
  ): Promise<string> {
    try {
      // Reset attempt counter if it's been more than 10 seconds since the last error
      const now = Date.now();
      if (now - this.lastErrorTimestamp > 10000) {
        this.apiCallAttempts = 0;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages,
        max_tokens: maxTokens,
        temperature,
      });

      const generatedText = response.choices[0].message.content;

      if (!generatedText) {
        throw new Error('OpenAI returned empty response');
      }

      // Reset attempt counter on success
      this.apiCallAttempts = 0;
      return generatedText;
    } catch (error: any) {
      // Track error for backoff strategy
      this.lastErrorTimestamp = Date.now();
      this.apiCallAttempts++;

      // Get detailed error information
      const errorDetails = this.getErrorDetails(error);
      console.error(
        `Error in OpenAI completion generation: ${errorDetails.type} - ${errorDetails.message}`,
        error
      );

      throw new Error(`OpenAI completion generation failed: ${errorDetails.message}`);
    }
  }

  /**
   * Generate structured JSON from a prompt
   *
   * @param prompt The user prompt
   * @param systemPrompt System prompt to set context
   * @param maxTokens Maximum number of tokens in the response
   * @returns JSON object of type T
   */
  async generateJson<T>(
    prompt: string,
    systemPrompt: string,
    maxTokens: number = 1000
  ): Promise<T> {
    try {
      // Reset attempt counter if it's been more than 10 seconds since the last error
      const now = Date.now();
      if (now - this.lastErrorTimestamp > 10000) {
        this.apiCallAttempts = 0;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const jsonText = response.choices[0].message.content;

      if (!jsonText) {
        throw new Error('OpenAI returned empty JSON response');
      }

      // Reset attempt counter on success
      this.apiCallAttempts = 0;
      return JSON.parse(jsonText) as T;
    } catch (error: any) {
      // Track error for backoff strategy
      this.lastErrorTimestamp = Date.now();
      this.apiCallAttempts++;

      // Get detailed error information
      const errorDetails = this.getErrorDetails(error);
      console.error(
        `Error in OpenAI JSON generation: ${errorDetails.type} - ${errorDetails.message}`,
        error
      );

      throw new Error(`OpenAI JSON generation failed: ${errorDetails.message}`);
    }
  }

  /**
   * Analyze an image using OpenAI's vision capabilities
   *
   * @param base64Image Base64-encoded image data
   * @param prompt Optional text prompt to guide the analysis
   * @returns Text analysis of the image
   */
  async analyzeImage(
    base64Image: string,
    prompt: string = 'Analyze this image in detail and describe its key elements, context, and any notable aspects.'
  ): Promise<string> {
    try {
      // Reset attempt counter if it's been more than 10 seconds since the last error
      const now = Date.now();
      if (now - this.lastErrorTimestamp > 10000) {
        this.apiCallAttempts = 0;
      }

      const visionResponse = await openai.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      const analysis = visionResponse.choices[0].message.content;

      if (!analysis) {
        throw new Error('OpenAI returned empty image analysis');
      }

      // Reset attempt counter on success
      this.apiCallAttempts = 0;
      return analysis;
    } catch (error: any) {
      // Track error for backoff strategy
      this.lastErrorTimestamp = Date.now();
      this.apiCallAttempts++;

      // Get detailed error information
      const errorDetails = this.getErrorDetails(error);
      console.error(
        `Error in OpenAI image analysis: ${errorDetails.type} - ${errorDetails.message}`,
        error
      );

      throw new Error(`OpenAI image analysis failed: ${errorDetails.message}`);
    }
  }

  /**
   * Generate an image using DALL-E
   *
   * @param prompt Text prompt describing the desired image
   * @param responseFormat Whether to return a URL or base64 data
   * @param size Image size (defaults to 1024x1024)
   * @returns Generated image data
   */
  async generateImage(
    prompt: string,
    responseFormat: 'url' | 'b64_json' = 'url',
    size: string = '1024x1024'
  ): Promise<GeneratedImageResult> {
    try {
      // Reset attempt counter if it's been more than 10 seconds since the last error
      const now = Date.now();
      if (now - this.lastErrorTimestamp > 10000) {
        this.apiCallAttempts = 0;
      }

      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: size as any, // Type casting needed due to limitations in the OpenAI SDK type definitions
        quality: 'standard',
        response_format: responseFormat,
      });

      // Check for valid response
      if (!response.data || response.data.length === 0) {
        throw new Error('OpenAI returned empty image generation response');
      }

      const imageData = response.data[0];
      if (!imageData) {
        throw new Error('OpenAI returned invalid image data format');
      }

      const result: GeneratedImageResult = {
        url: imageData.url || '',
      };

      // Add base64 data if requested
      if (responseFormat === 'b64_json' && imageData.b64_json) {
        result.b64_json = imageData.b64_json;
      }

      // Reset attempt counter on success
      this.apiCallAttempts = 0;
      return result;
    } catch (error: any) {
      // Track error for backoff strategy
      this.lastErrorTimestamp = Date.now();
      this.apiCallAttempts++;

      // Get detailed error information
      const errorDetails = this.getErrorDetails(error);
      console.error(
        `Error in OpenAI image generation: ${errorDetails.type} - ${errorDetails.message}`,
        error
      );

      throw new Error(`OpenAI image generation failed: ${errorDetails.message}`);
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();
