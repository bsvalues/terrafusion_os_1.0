/**
 * LLM Service
 *
 * Provides a unified interface for interacting with large language models
 * from different providers (OpenAI, Anthropic, Perplexity).
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { IStorage } from '../../storage';

// LLM Provider Enum
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  PERPLEXITY = 'perplexity',
}

// LLM Configuration interface
export interface LLMConfig {
  provider: LLMProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// Generic Message interface
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLM Service for interfacing with large language models
 */
export class LLMService {
  private storage: IStorage;
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;
  private defaultConfig: LLMConfig;

  constructor(storage: IStorage, defaultConfig?: Partial<LLMConfig>) {
    this.storage = storage;

    this.defaultConfig = {
      provider: LLMProvider.OPENAI,
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 1000,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      ...defaultConfig,
    };

    // Initialize clients
    this.initializeClients();
  }

  /**
   * Initialize the LLM clients
   */
  private initializeClients(): void {
    // Initialize OpenAI client if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    // Initialize Anthropic client if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  /**
   * Get completion from an LLM
   */
  async getCompletion(prompt: string, config?: Partial<LLMConfig>): Promise<string> {
    const mergedConfig: LLMConfig = {
      ...this.defaultConfig,
      ...config,
    };

    switch (mergedConfig.provider) {
      case LLMProvider.OPENAI:
        return this.getOpenAICompletion(prompt, mergedConfig);
      case LLMProvider.ANTHROPIC:
        return this.getAnthropicCompletion(prompt, mergedConfig);
      case LLMProvider.PERPLEXITY:
        return this.getPerplexityCompletion(prompt, mergedConfig);
      default:
        throw new Error(`Unsupported LLM provider: ${mergedConfig.provider}`);
    }
  }

  /**
   * Get chat completion from an LLM
   */
  async getChatCompletion(messages: Message[], config?: Partial<LLMConfig>): Promise<string> {
    const mergedConfig: LLMConfig = {
      ...this.defaultConfig,
      ...config,
    };

    switch (mergedConfig.provider) {
      case LLMProvider.OPENAI:
        return this.getOpenAIChatCompletion(messages, mergedConfig);
      case LLMProvider.ANTHROPIC:
        return this.getAnthropicChatCompletion(messages, mergedConfig);
      case LLMProvider.PERPLEXITY:
        return this.getPerplexityChatCompletion(messages, mergedConfig);
      default:
        throw new Error(`Unsupported LLM provider: ${mergedConfig.provider}`);
    }
  }

  /**
   * Get completion from OpenAI
   */
  private async getOpenAICompletion(prompt: string, config: LLMConfig): Promise<string> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized. Check if OPENAI_API_KEY is set.');
    }

    try {
      // Use chat completion API for all models - the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      const response = await this.openaiClient.chat.completions.create({
        model: config.model || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error getting OpenAI completion:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Get chat completion from OpenAI
   */
  private async getOpenAIChatCompletion(messages: Message[], config: LLMConfig): Promise<string> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized. Check if OPENAI_API_KEY is set.');
    }

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      const response = await this.openaiClient.chat.completions.create({
        model: config.model || 'gpt-4o',
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error getting OpenAI chat completion:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Get completion from Anthropic
   */
  private async getAnthropicCompletion(prompt: string, config: LLMConfig): Promise<string> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized. Check if ANTHROPIC_API_KEY is set.');
    }

    try {
      // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      const response = await this.anthropicClient.messages.create({
        model: config.model || 'claude-3-7-sonnet-20250219',
        max_tokens: config.maxTokens,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Error getting Anthropic completion:', error);
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  /**
   * Get chat completion from Anthropic
   */
  private async getAnthropicChatCompletion(
    messages: Message[],
    config: LLMConfig
  ): Promise<string> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized. Check if ANTHROPIC_API_KEY is set.');
    }

    try {
      // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      const response = await this.anthropicClient.messages.create({
        model: config.model || 'claude-3-7-sonnet-20250219',
        max_tokens: config.maxTokens,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: config.temperature,
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Error getting Anthropic chat completion:', error);
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  /**
   * Get completion from Perplexity
   */
  private async getPerplexityCompletion(prompt: string, config: LLMConfig): Promise<string> {
    return this.getPerplexityChatCompletion([{ role: 'user', content: prompt }], config);
  }

  /**
   * Get chat completion from Perplexity
   */
  private async getPerplexityChatCompletion(
    messages: Message[],
    config: LLMConfig
  ): Promise<string> {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key not set. Check if PERPLEXITY_API_KEY is set.');
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          top_p: config.topP,
          frequency_penalty: config.frequencyPenalty || 1,
          presence_penalty: config.presencePenalty || 0,
          stream: false,
          search_domain_filter: [],
          return_images: false,
          return_related_questions: false,
          search_recency_filter: 'month',
          top_k: 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error getting Perplexity completion:', error);
      throw new Error(`Perplexity API error: ${error.message}`);
    }
  }

  /**
   * Analyze code for improvements
   */
  async analyzeCode(code: string, prompt: string): Promise<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content:
          'You are a senior software engineer specializing in code analysis and improvements. Analyze the provided code based on the prompt and provide specific, actionable feedback.',
      },
      {
        role: 'user',
        content: `Code to analyze:\n\`\`\`\n${code}\n\`\`\`\n\nPrompt: ${prompt}`,
      },
    ];

    return this.getChatCompletion(messages, {
      temperature: 0.2, // Lower temperature for more precise/technical responses
    });
  }

  /**
   * Enhance GIS data with contextual information
   */
  async enhanceGISData(gisData: any, propertyInfo: any): Promise<any> {
    const prompt = `
    Analyze this GIS data and property information to identify key insights:
    
    GIS Data: ${JSON.stringify(gisData)}
    
    Property Info: ${JSON.stringify(propertyInfo)}
    
    Generate a comprehensive analysis in JSON format with these sections:
    1. Key spatial features identified
    2. Property value influencing factors
    3. Potential data quality issues
    4. Recommended visualization approaches
    `;

    const response = await this.getCompletion(prompt, {
      temperature: 0.3,
      provider: LLMProvider.OPENAI,
      model: 'gpt-4o',
    });

    try {
      // Parse the response as JSON
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing LLM response as JSON:', error);
      // Return a structured version of the text response
      return {
        error: 'Could not parse response as JSON',
        textResponse: response,
      };
    }
  }

  /**
   * Generate a style configuration for GIS data visualization
   */
  async generateMapStyling(
    dataAttributes: string[],
    dataType: 'categorical' | 'numerical',
    purpose: string
  ): Promise<any> {
    const prompt = `
    Generate an optimal styling configuration for a GIS map with the following specifications:
    
    Data Attributes: ${dataAttributes.join(', ')}
    Data Type: ${dataType}
    Visualization Purpose: ${purpose}
    
    Provide your response as a JSON style configuration that includes:
    1. Color scheme (specific colors in hex format)
    2. Line width/point size parameters
    3. Label styling
    4. Legend configuration
    5. Classification method (for numerical data)
    
    Format your response as valid JSON.
    `;

    const response = await this.getCompletion(prompt, {
      temperature: 0.4,
      provider: LLMProvider.OPENAI,
      model: 'gpt-4o',
    });

    try {
      // Parse the response as JSON
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing LLM response as JSON:', error);
      // Attempt basic formatting as a fallback
      return {
        error: 'Could not parse response as JSON',
        textResponse: response,
      };
    }
  }

  /**
   * Get available LLM providers
   */
  getAvailableProviders(): LLMProvider[] {
    const providers: LLMProvider[] = [];

    if (this.openaiClient) {
      providers.push(LLMProvider.OPENAI);
    }

    if (this.anthropicClient) {
      providers.push(LLMProvider.ANTHROPIC);
    }

    if (process.env.PERPLEXITY_API_KEY) {
      providers.push(LLMProvider.PERPLEXITY);
    }

    return providers;
  }
}
