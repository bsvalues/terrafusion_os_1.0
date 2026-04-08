/**
 * AI Assistant Service
 * 
 * This service provides a unified interface for the AI Assistant feature,
 * supporting OpenAI, Anthropic, and Perplexity as AI providers.
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
import { z } from 'zod';

// Import existing services if available
import { LLMService } from './llm-service';
import { perplexityService, PerplexityService } from './perplexity-service';

// Define types for context 
export interface MessageContext {
  recentMessages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
  }>;
  currentPage?: {
    path: string;
    title: string;
    timestamp: number;
  };
  pageHistory?: Array<{
    path: string;
    title: string;
    timestamp: number;
  }>;
  recentQueries?: string[];
}

export interface AIAssistantResponse {
  message: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AIAssistantRequest {
  message: string;
  context?: MessageContext;
  provider: 'openai' | 'anthropic' | 'perplexity';
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
}

export class AIAssistantService {
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;
  private perplexityService: PerplexityService | null = null;
  private llmService: LLMService | null = null;

  constructor() {
    // Initialize OpenAI client if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Initialize Anthropic client if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    // Initialize Perplexity service if API key is available
    if (process.env.PERPLEXITY_API_KEY) {
      this.perplexityService = perplexityService;
    }

    // Try to use the existing LLM service if available
    try {
      this.llmService = new LLMService();
    } catch (error) {
      console.warn('LLM Service not available:', error);
    }
  }

  /**
   * Check if a specific AI provider is available
   */
  public isProviderAvailable(provider: 'openai' | 'anthropic' | 'perplexity'): boolean {
    switch (provider) {
      case 'openai':
        return !!this.openaiClient;
      case 'anthropic':
        return !!this.anthropicClient;
      case 'perplexity':
        return this.perplexityService?.isServiceAvailable() || false;
      default:
        return false;
    }
  }

  /**
   * Get available AI providers
   */
  public getAvailableProviders(): ('openai' | 'anthropic' | 'perplexity')[] {
    const providers: ('openai' | 'anthropic' | 'perplexity')[] = [];
    
    if (this.isProviderAvailable('openai')) {
      providers.push('openai');
    }
    
    if (this.isProviderAvailable('anthropic')) {
      providers.push('anthropic');
    }
    
    if (this.isProviderAvailable('perplexity')) {
      providers.push('perplexity');
    }
    
    return providers;
  }

  /**
   * Generate AI assistant response using the specified provider
   */
  public async generateResponse(request: AIAssistantRequest): Promise<AIAssistantResponse> {
    const { message, context, provider, options } = request;
    
    // Validate that the provider is available
    if (!this.isProviderAvailable(provider)) {
      throw new Error(`AI provider '${provider}' is not available. Check API key configuration.`);
    }
    
    // Generate system prompt from context
    const systemPrompt = this.generateSystemPrompt(context);
    
    // Format messages for the AI provider
    const messages = this.formatMessages(message, context, systemPrompt);
    
    // Call the appropriate provider
    switch (provider) {
      case 'openai':
        return this.callOpenAI(messages, options);
      case 'anthropic':
        return this.callAnthropic(messages, options);
      case 'perplexity':
        return this.callPerplexity(messages, options);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * Generate system prompt from context
   */
  private generateSystemPrompt(context?: MessageContext): string {
    let systemPrompt = `You are an AI assistant for a property assessment system. 
Your goal is to help users with their property assessment questions and tasks.

Today's date: ${new Date().toLocaleDateString()}
`;

    // Add current page context if available
    if (context?.currentPage) {
      systemPrompt += `\nUser is currently viewing: ${context.currentPage.title} (${context.currentPage.path})`;
    }

    // Add page history if available
    if (context?.pageHistory && context.pageHistory.length > 0) {
      systemPrompt += `\nRecent pages viewed:
${context.pageHistory.map(page => `- ${page.title} (${page.path})`).join('\n')}`;
    }

    // Add recent queries if available
    if (context?.recentQueries && context.recentQueries.length > 0) {
      systemPrompt += `\nRecent queries:
${context.recentQueries.map(query => `- ${query}`).join('\n')}`;
    }

    return systemPrompt;
  }

  /**
   * Format messages for the AI provider
   */
  private formatMessages(
    message: string, 
    context?: MessageContext,
    systemPrompt?: string
  ): any[] {
    const formattedMessages: any[] = [];
    
    // Add system message
    if (systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }
    
    // Add recent messages for context
    if (context?.recentMessages && context.recentMessages.length > 0) {
      for (const recentMsg of context.recentMessages) {
        if (recentMsg.role !== 'system') {
          formattedMessages.push({
            role: recentMsg.role,
            content: recentMsg.content,
          });
        }
      }
    }
    
    // Add the current message
    formattedMessages.push({
      role: 'user',
      content: message,
    });
    
    return formattedMessages;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(
    messages: any[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<AIAssistantResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client is not initialized');
    }

    try {
      const response = await this.openaiClient.chat.completions.create({
        // the newest OpenAI model is "gpt-4o" which was released May, 2024. do not change this unless explicitly requested by the user
        model: 'gpt-4o',
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
      });

      return {
        message: response.choices[0].message.content || 'No response generated',
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
        },
      };
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(
    messages: any[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<AIAssistantResponse> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client is not initialized');
    }

    try {
      // Find system message
      const systemMessage = messages.find(msg => msg.role === 'system');
      const systemPrompt = systemMessage ? systemMessage.content : '';
      
      // Filter out system message for Anthropic format
      const anthropicMessages = messages.filter(msg => msg.role !== 'system');

      const response = await this.anthropicClient.messages.create({
        // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: options?.maxTokens || 1024,
        temperature: options?.temperature || 0.7,
        system: systemPrompt,
        messages: anthropicMessages,
      });

      // Handle different types of content from Anthropic
      let responseContent = 'Response content format not supported';
      
      if (response.content && response.content.length > 0) {
        const firstContent = response.content[0];
        if (typeof firstContent === 'object' && firstContent !== null) {
          if ('text' in firstContent && typeof firstContent.text === 'string') {
            responseContent = firstContent.text;
          } else if ('type' in firstContent && firstContent.type === 'text' && 'text' in firstContent) {
            responseContent = String(firstContent.text);
          }
        }
      }
      
      return {
        message: responseContent,
        model: response.model,
        usage: {
          // Anthropic doesn't provide detailed token usage in the same way
          promptTokens: undefined,
          completionTokens: undefined,
          totalTokens: undefined,
        },
      };
    } catch (error) {
      console.error('Error calling Anthropic:', error);
      throw new Error(`Anthropic API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Call Perplexity API
   */
  private async callPerplexity(
    messages: any[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<AIAssistantResponse> {
    if (!this.perplexityService || !this.perplexityService.isServiceAvailable()) {
      throw new Error('Perplexity service is not initialized');
    }

    try {
      // Convert messages for Perplexity format
      const perplexityMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await this.perplexityService.query(perplexityMessages, {
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        // the newest Perplexity model is "llama-3.1-sonar-small-128k-online"
        model: "llama-3.1-sonar-small-128k-online"
      });

      return {
        message: response.choices[0].message.content,
        model: response.model,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        },
      };
    } catch (error) {
      console.error('Error calling Perplexity:', error);
      throw new Error(`Perplexity API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export the service
export const aiAssistantService = new AIAssistantService();