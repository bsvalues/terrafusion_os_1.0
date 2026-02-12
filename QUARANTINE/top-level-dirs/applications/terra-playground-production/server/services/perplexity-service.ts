/**
 * Perplexity Service
 *
 * This service provides a wrapper around the Perplexity API, handling authentication,
 * rate limiting, and request formatting.
 */

export enum PerplexityErrorType {
  API_ERROR = 'api_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  INVALID_REQUEST_ERROR = 'invalid_request_error',
  SERVER_ERROR = 'server_error',
  UNKNOWN_ERROR = 'unknown_error',
}

// Define types for Perplexity API requests and responses
export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
}

export interface PerplexityOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export class PerplexityService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';
  private defaultModel = 'llama-3.1-sonar-small-128k-online';

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || null;
  }

  /**
   * Check if the service is available (i.e., API key is set)
   */
  public isServiceAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get information about the service
   */
  public getServiceInfo(): { available: boolean; model: string } {
    return {
      available: this.isServiceAvailable(),
      model: this.defaultModel,
    };
  }

  /**
   * Send a query to the Perplexity API
   */
  public async query(
    messages: PerplexityMessage[],
    options?: PerplexityOptions
  ): Promise<PerplexityResponse> {
    if (!this.apiKey) {
      throw new Error('Perplexity API key is not set');
    }

    try {
      // Prepare request data
      const data = {
        model: options?.model || this.defaultModel,
        messages,
        max_tokens: options?.maxTokens,
        temperature: options?.temperature !== undefined ? options.temperature : 0.2,
        top_p: 0.9,
        search_domain_filter: ['perplexity.ai'],
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        top_k: 0,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1,
      };

      // Make request to Perplexity API
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API error (${response.status}): ${errorText}`);
      }

      return (await response.json()) as PerplexityResponse;
    } catch (error) {
      console.error('Error querying Perplexity:', error);
      throw error;
    }
  }
}

// Create and export an instance of the PerplexityService
export const perplexityService = new PerplexityService();
