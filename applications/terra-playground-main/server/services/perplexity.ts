/**
 * Perplexity API Integration Service
 *
 * This service provides integration with Perplexity's API for natural language processing
 * and adds it as a third AI provider alongside OpenAI and Anthropic Claude in our
 * multi-model architecture.
 */

import { z } from 'zod';
import fetch from 'node-fetch';

// Validation schema for API key and response
const perplexityApiKeySchema = z
  .string()
  .min(40)
  .max(100)
  .regex(/^pplx-/);

/**
 * Validate the Perplexity API key
 * @returns True if the API key is valid and present, false otherwise
 */
export function isPerplexityApiKeyValid(): boolean {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return false;
  }

  try {
    perplexityApiKeySchema.parse(apiKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get the Perplexity API key with validation
 * @throws Error if the API key is not valid
 * @returns The validated API key
 */
export function getPerplexityApiKey(): string {
  if (!isPerplexityApiKeyValid()) {
    throw new Error(
      'Perplexity API key is missing or invalid. Please add a valid PERPLEXITY_API_KEY to your environment variables.'
    );
  }

  return process.env.PERPLEXITY_API_KEY!;
}

// Message schema for Perplexity API
const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

export type Message = z.infer<typeof messageSchema>;

// Define Perplexity API response interface
export interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role?: string;
      content?: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Main class for Perplexity API integration
 */
export class PerplexityService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private isInitialized: boolean;

  constructor() {
    try {
      this.apiKey = getPerplexityApiKey();
      this.isInitialized = true;
    } catch (error) {
      console.warn(
        'Failed to initialize Perplexity service:',
        error instanceof Error ? error.message : String(error)
      );
      this.apiKey = '';
      this.isInitialized = false;
    }

    this.baseUrl = 'https://api.perplexity.ai/chat/completions';
    // the newest Perplexity model is "llama-3.1-sonar-small-128k-online"
    this.defaultModel = 'llama-3.1-sonar-small-128k-online';
  }

  /**
   * Check if the service is properly initialized with a valid API key
   * @returns True if initialized, false otherwise
   */
  public isServiceAvailable(): boolean {
    return this.isInitialized && isPerplexityApiKeyValid();
  }

  /**
   * Send a query to Perplexity API
   */
  async query(
    messages: Message[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<PerplexityResponse> {
    // Check if the service is available
    if (!this.isServiceAvailable()) {
      throw new Error('Perplexity API service is not available: Missing or invalid API key');
    }

    // Refresh API key in case it was updated
    try {
      this.apiKey = getPerplexityApiKey();
    } catch (error) {
      console.error(
        'Failed to get Perplexity API key:',
        error instanceof Error ? error.message : String(error)
      );
      throw new Error('Perplexity API key validation failed');
    }

    // Add system prompt if provided and not already included
    const hasSystemMsg = messages.some(msg => msg.role === 'system');
    const finalMessages = [...messages];

    if (options.systemPrompt && !hasSystemMsg) {
      finalMessages.unshift({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    // Validate that user and assistant roles alternate properly ending with user
    let isValidSequence = true;
    let expectedRole = 'user';

    for (let i = hasSystemMsg ? 1 : 0; i < finalMessages.length; i++) {
      if (finalMessages[i].role !== expectedRole) {
        isValidSequence = false;
        break;
      }
      expectedRole = expectedRole === 'user' ? 'assistant' : 'user';
    }

    // If sequence doesn't end with user or has invalid alternation, fix it
    if (!isValidSequence || finalMessages[finalMessages.length - 1].role !== 'user') {
      console.warn('Invalid message sequence, restructuring to ensure proper format');
      // Filter to just user messages if sequence is invalid
      const userMessages = finalMessages.filter(msg => msg.role === 'user');
      finalMessages.length = 0;

      // Add back system message if it existed
      if (hasSystemMsg) {
        finalMessages.push(messages[0]);
      } else if (options.systemPrompt) {
        finalMessages.push({
          role: 'system',
          content: options.systemPrompt,
        });
      }

      // Add remaining user messages
      finalMessages.push(...userMessages);
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          messages: finalMessages,
          max_tokens: options.maxTokens || 1024,
          temperature: options.temperature !== undefined ? options.temperature : 0.2,
          top_p: 0.9,
          frequency_penalty: 1,
          presence_penalty: 0,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Provide more specific error messages based on status code
        if (response.status === 401) {
          throw new Error('Authentication error: Invalid Perplexity API key');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded with Perplexity API. Please try again later.');
        } else if (response.status >= 500) {
          throw new Error('Perplexity service is currently unavailable. Please try again later.');
        }
        throw new Error(`Perplexity API error: ${response.status} ${errorText}`);
      }

      const responseData = (await response.json()) as PerplexityResponse;

      // Validate that the response contains necessary data
      if (
        !responseData ||
        !responseData.choices ||
        !responseData.choices.length ||
        !responseData.choices[0].message ||
        !responseData.choices[0].message.content
      ) {
        throw new Error('Received invalid or empty response from Perplexity API');
      }

      return responseData;
    } catch (error) {
      console.error('Error calling Perplexity API:', error);
      if (error instanceof Error) {
        // Rethrow with the original error message for specific errors
        throw error;
      } else {
        // Generic error fallback
        throw new Error('Unknown error occurred while calling Perplexity API');
      }
    }
  }

  /**
   * Create a simple text completion with Perplexity
   */
  async textCompletion(
    prompt: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<string> {
    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      throw new Error('Invalid prompt: Must provide a non-empty string');
    }

    try {
      const messages: Message[] = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      const response = await this.query(messages, options);

      // Extra validation to ensure we have content
      if (
        !response.choices ||
        !response.choices[0] ||
        !response.choices[0].message ||
        !response.choices[0].message.content
      ) {
        throw new Error('Received invalid or empty completion from Perplexity API');
      }

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error in Perplexity text completion:', error);
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('API key validation error: Please check your Perplexity API key');
        } else if (error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded with Perplexity API. Please try again later.');
        }
        throw error;
      }
      throw new Error('Failed to generate text completion');
    }
  }

  /**
   * Analyze property data using Perplexity
   * @param propertyData The property data to analyze
   * @param analysisType The type of analysis to perform
   * @returns Promise with the analysis text or error message
   */
  async analyzePropertyData(propertyData: any, analysisType: string): Promise<string> {
    // Check if service is available
    if (!this.isServiceAvailable()) {
      return 'Property analysis unavailable: Perplexity API key is missing or invalid. Please check your API key configuration.';
    }

    // Validate inputs
    if (!propertyData) {
      return 'Error: No property data provided for analysis';
    }

    // If propertyData is not an object or is an empty object, return error
    if (
      typeof propertyData !== 'object' ||
      Array.isArray(propertyData) ||
      Object.keys(propertyData).length === 0
    ) {
      return 'Error: Invalid property data format. Expected a non-empty object.';
    }

    try {
      let prompt = '';

      // Convert analysis type to lowercase and validate
      const analysisTypeLC = analysisType?.toLowerCase() || 'general';

      switch (analysisTypeLC) {
        case 'value':
          prompt = `Analyze this Benton County, Washington property's value factors. Explain how the assessed value is derived based on land, improvements, and location considerations:\n\n${JSON.stringify(propertyData, null, 2)}`;
          break;
        case 'improvements':
          prompt = `Provide a detailed analysis of the improvements on this Benton County, Washington property. Discuss condition, quality, and potential impact on overall property value:\n\n${JSON.stringify(propertyData, null, 2)}`;
          break;
        case 'land':
          prompt = `Analyze the land characteristics of this Benton County, Washington property. Discuss zoning, dimensions, topography and how these factors impact overall value:\n\n${JSON.stringify(propertyData, null, 2)}`;
          break;
        case 'comparables':
          prompt = `Based on this Benton County, Washington property data, describe what comparable properties in the area might be valued at and why. Consider location, size, improvements and market trends:\n\n${JSON.stringify(propertyData, null, 2)}`;
          break;
        default:
          prompt = `Provide a comprehensive analysis of this Benton County, Washington property, including value assessment, improvements, land characteristics, and market position:\n\n${JSON.stringify(propertyData, null, 2)}`;
      }

      return await this.textCompletion(prompt, {
        systemPrompt:
          'You are a property assessment expert for Benton County, Washington. Provide accurate, detailed analysis based on the property data.',
        temperature: 0.1,
      });
    } catch (error) {
      console.error('Error in analyzePropertyData:', error);

      // Provide specific error information
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return 'API key validation error: Please check your Perplexity API key configuration.';
        } else if (error.message.includes('rate limit')) {
          return 'Rate limit exceeded with Perplexity API. Please try again later.';
        }
        return `Analysis error: ${error.message}`;
      }

      return 'Failed to analyze property data due to an unknown error';
    }
  }

  /**
   * Get property valuation insights using Perplexity
   * @param propertyId The ID of the property to analyze
   * @param propertyData The property data to analyze
   * @returns Promise with the insights text or error message
   */
  async getPropertyValuationInsights(propertyId: string, propertyData: any): Promise<string> {
    // Check if service is available
    if (!this.isServiceAvailable()) {
      return 'Property valuation insights unavailable: Perplexity API key is missing or invalid. Please check your API key configuration.';
    }

    // Validate inputs
    if (!propertyId) {
      return 'Error: No property ID provided for valuation insights';
    }

    if (!propertyData) {
      return 'Error: No property data provided for valuation insights';
    }

    // If propertyData is not an object or is an empty object, return error
    if (
      typeof propertyData !== 'object' ||
      Array.isArray(propertyData) ||
      Object.keys(propertyData).length === 0
    ) {
      return 'Error: Invalid property data format. Expected a non-empty object.';
    }

    try {
      const prompt = `
      Provide detailed property valuation insights for property ID ${propertyId} in Benton County, Washington.
      
      Include:
      1. Key factors that drive this property's current assessed value
      2. Potential value change factors to monitor in the next assessment period
      3. How this property compares to similar properties in the area
      4. Specific improvements that could increase property value
      5. Any potential appeals considerations based on the current assessment
      
      Property data:
      ${JSON.stringify(propertyData, null, 2)}
      `;

      return await this.textCompletion(prompt, {
        systemPrompt:
          'You are a property valuation expert for Benton County, Washington. Provide detailed, accurate, and actionable insights based on the property data provided.',
        temperature: 0.1,
        maxTokens: 1500,
      });
    } catch (error) {
      console.error('Error in getPropertyValuationInsights:', error);

      // Provide specific error information
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return 'API key validation error: Please check your Perplexity API key configuration.';
        } else if (error.message.includes('rate limit')) {
          return 'Rate limit exceeded with Perplexity API. Please try again later.';
        }
        return `Valuation insights error: ${error.message}`;
      }

      return 'Failed to generate property valuation insights due to an unknown error';
    }
  }

  /**
   * Handle property search requests via API endpoint
   */
  handlePropertySearch(req: any, res: any): void {
    // This functionality will be implemented in routes.ts
    throw new Error('Method not implemented directly in service');
  }
}

export const perplexityService = new PerplexityService();
