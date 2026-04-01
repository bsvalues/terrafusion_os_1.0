import { AIMessage } from '../extensions/ai-extension';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export type AIServiceProvider = 'openai' | 'anthropic' | 'auto';
export type AIMessageRole = 'system' | 'user' | 'assistant' | 'function';

export interface AIServiceOptions {
  model: string;
  temperature: number;
  maxTokens: number;
  stopSequences: string[];
  provider: AIServiceProvider;
}

/**
 * AIService provides a unified interface for different AI service providers
 */
export class AIService {
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;
  private cache: Map<string, string> = new Map();
  
  /**
   * Create a new AI service
   */
  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }
  
  /**
   * Generate a completion from the AI based on the conversation history
   * 
   * @param messages Conversation history
   * @param options AI service options
   * @returns The AI response
   */
  async complete(messages: AIMessage[], options: AIServiceOptions): Promise<string> {
    // Create a cache key based on the messages and options
    const cacheKey = this.createCacheKey(messages, options);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as string;
    }
    
    // Determine which provider to use
    const provider = this.determineProvider(options.provider);
    
    // Generate the completion based on the provider
    let response: string;
    
    switch (provider) {
      case 'openai':
        response = await this.completeWithOpenAI(messages, options);
        break;
      case 'anthropic':
        response = await this.completeWithAnthropic(messages, options);
        break;
      default:
        throw new Error(`Provider ${provider} not supported`);
    }
    
    // Cache the response
    this.cache.set(cacheKey, response);
    
    return response;
  }
  
  /**
   * Create an embedding for a text
   * 
   * @param text Text to embed
   * @param provider AI provider to use
   * @returns Vector embedding
   */
  async createEmbedding(text: string, provider: AIServiceProvider): Promise<number[]> {
    // Determine which provider to use
    const actualProvider = this.determineProvider(provider);
    
    switch (actualProvider) {
      case 'openai':
        return this.createEmbeddingWithOpenAI(text);
      case 'anthropic':
        // Anthropic doesn't provide embeddings yet, fallback to OpenAI
        return this.createEmbeddingWithOpenAI(text);
      default:
        throw new Error(`Provider ${provider} not supported for embeddings`);
    }
  }
  
  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Create a cache key based on the messages and options
   * 
   * @param messages Conversation history
   * @param options AI service options
   * @returns Cache key
   */
  private createCacheKey(messages: AIMessage[], options: AIServiceOptions): string {
    const messagesStr = JSON.stringify(messages);
    const optionsStr = JSON.stringify(options);
    return `${messagesStr}|${optionsStr}`;
  }
  
  /**
   * Determine which provider to use based on availability
   * 
   * @param requestedProvider Requested provider
   * @returns Actual provider to use
   */
  private determineProvider(requestedProvider: AIServiceProvider): 'openai' | 'anthropic' {
    if (requestedProvider === 'auto') {
      // Choose based on availability
      if (this.anthropicClient) {
        return 'anthropic';
      } else if (this.openaiClient) {
        return 'openai';
      } else {
        throw new Error('No AI provider is configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment.');
      }
    } else if (requestedProvider === 'openai') {
      if (!this.openaiClient) {
        throw new Error('OpenAI is not configured. Set OPENAI_API_KEY in your environment.');
      }
      return 'openai';
    } else if (requestedProvider === 'anthropic') {
      if (!this.anthropicClient) {
        throw new Error('Anthropic is not configured. Set ANTHROPIC_API_KEY in your environment.');
      }
      return 'anthropic';
    }
    
    throw new Error(`Provider ${requestedProvider} not supported`);
  }
  
  /**
   * Generate a completion with OpenAI
   * 
   * @param messages Conversation history
   * @param options AI service options
   * @returns The AI response
   */
  private async completeWithOpenAI(messages: AIMessage[], options: AIServiceOptions): Promise<string> {
    if (!this.openaiClient) {
      throw new Error('OpenAI is not configured. Set OPENAI_API_KEY in your environment.');
    }
    
    try {
      const response = await this.openaiClient.chat.completions.create({
        model: options.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          name: msg.name
        })),
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stop: options.stopSequences.length > 0 ? options.stopSequences : undefined
      });
      
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating completion with OpenAI:', error);
      throw error;
    }
  }
  
  /**
   * Generate a completion with Anthropic
   * 
   * @param messages Conversation history
   * @param options AI service options
   * @returns The AI response
   */
  private async completeWithAnthropic(messages: AIMessage[], options: AIServiceOptions): Promise<string> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic is not configured. Set ANTHROPIC_API_KEY in your environment.');
    }
    
    try {
      // Convert the messages to Anthropic format
      const systemMessage = messages.find(msg => msg.role === 'system')?.content || '';
      
      // Filter out system messages as they're handled separately in Anthropic
      const anthropicMessages = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        }));
      
      const response = await this.anthropicClient.messages.create({
        model: options.model.includes('claude') ? options.model : 'claude-3-opus-20240229',
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: systemMessage,
        messages: anthropicMessages as any
      });
      
      return response.content[0]?.text || '';
    } catch (error) {
      console.error('Error generating completion with Anthropic:', error);
      throw error;
    }
  }
  
  /**
   * Create an embedding with OpenAI
   * 
   * @param text Text to embed
   * @returns Vector embedding
   */
  private async createEmbeddingWithOpenAI(text: string): Promise<number[]> {
    if (!this.openaiClient) {
      throw new Error('OpenAI is not configured. Set OPENAI_API_KEY in your environment.');
    }
    
    try {
      const response = await this.openaiClient.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });
      
      return response.data[0]?.embedding || [];
    } catch (error) {
      console.error('Error creating embedding with OpenAI:', error);
      throw error;
    }
  }
}