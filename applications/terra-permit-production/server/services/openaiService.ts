/**
 * OpenAI service wrapper for making API calls to OpenAI
 * This service handles the communication with OpenAI API, error handling,
 * and provides a clean interface for other services to use.
 */

import OpenAI from 'openai';
import { Message, OpenAIRequestParams, promptEngineering } from './promptEngineering';
import { log } from '../vite';
import { Permit } from '../../shared/schema';

export class OpenAIService {
  private client: OpenAI | null = null;
  
  /**
   * Initialize the OpenAI client
   * @returns True if initialization was successful, false otherwise
   */
  private initClient(): boolean {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        log('OpenAI API key is not configured', 'openaiService');
        return false;
      }
      
      this.client = new OpenAI({
        apiKey: apiKey
      });
      
      return true;
    } catch (error) {
      log(`Error initializing OpenAI client: ${(error as Error).message}`, 'openaiService');
      return false;
    }
  }
  
  /**
   * Make a chat completion request to OpenAI
   * @param params Request parameters
   * @returns The completion response text
   */
  /**
   * Make a chat completion request to OpenAI with retry logic
   * @param params Request parameters
   * @param maxRetries Maximum number of retries (default: 3)
   * @param initialDelay Initial delay in ms before retry (default: 1000)
   * @returns The completion response text
   */
  async createChatCompletion(
    params: OpenAIRequestParams,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<string> {
    let retries = 0;
    let delay = initialDelay;
    
    while (true) {
      try {
        // Initialize client if needed
        if (!this.client && !this.initClient()) {
          throw new Error('OpenAI API key is not configured or invalid');
        }
        
        // Log request (without full prompt for privacy/security)
        log(`Making OpenAI request with model ${params.model}${retries > 0 ? ` (retry ${retries}/${maxRetries})` : ''}`, 'openaiService');
        
        // Make the API call
        const response = await this.client!.chat.completions.create({
          model: params.model,
          messages: params.messages,
          temperature: params.temperature,
          max_tokens: params.max_tokens,
          top_p: params.top_p,
          frequency_penalty: params.frequency_penalty,
          presence_penalty: params.presence_penalty,
          response_format: params.response_format
        });
        
        // Extract and return the response content
        const content = response.choices[0]?.message?.content;
        
        if (!content) {
          throw new Error('OpenAI returned an empty response');
        }
        
        // Log success (but not the full response for privacy/security)
        log(`OpenAI request successful, received ${content.length} characters`, 'openaiService');
        
        return content;
      } catch (error: any) {
        // Check if we should retry
        const shouldRetry = this.shouldRetryRequest(error, retries, maxRetries);
        
        if (shouldRetry) {
          retries++;
          log(`Retrying OpenAI request in ${delay}ms (${retries}/${maxRetries})`, 'openaiService');
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Exponential backoff with jitter
          delay = Math.min(delay * 1.5 + Math.random() * 1000, 15000);
          continue;
        }
        
        // Handle OpenAI API errors
        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data;
          
          log(`OpenAI API error (${status}): ${JSON.stringify(errorData)}`, 'openaiService');
          
          // Handle specific error cases
          if (status === 401) {
            throw new Error('OpenAI API key is invalid');
          } else if (status === 429) {
            throw new Error('OpenAI rate limit exceeded. Please try again later or adjust your request frequency');
          } else if (status === 500) {
            throw new Error('OpenAI service error. Please try again later');
          }
          
          throw new Error(`OpenAI API error: ${errorData?.error?.message || 'Unknown error'}`);
        }
        
        // Handle network or other errors
        log(`Error in OpenAI request: ${error.message}`, 'openaiService');
        throw new Error(`Error communicating with OpenAI: ${error.message}`);
      }
    }
  }
  
  /**
   * Determine if we should retry an OpenAI request based on the error
   * @param error The error that occurred
   * @param currentRetries Current retry count
   * @param maxRetries Maximum retry count
   * @returns True if request should be retried, false otherwise
   */
  private shouldRetryRequest(error: any, currentRetries: number, maxRetries: number): boolean {
    // Don't retry if we've hit the max retries
    if (currentRetries >= maxRetries) {
      return false;
    }
    
    // Retry on network errors
    if (!error.response) {
      return true;
    }
    
    // Retry on rate limits and server errors
    const status = error.response.status;
    
    // Retry on rate limit (429) or server errors (500-599)
    return status === 429 || (status >= 500 && status < 600);
  }
  
  /**
   * Make a completion request with a predefined prompt type
   * @param promptType The type of prompt to use
   * @param userContent The user-specific content
   * @param additionalContext Optional additional context
   * @param options Additional options for the request
   * @returns The completion response text
   */
  async completeWithPrompt(
    promptType: keyof typeof promptEngineering['SYSTEM_PROMPTS'], 
    userContent: string,
    additionalContext?: string,
    options: Partial<Omit<OpenAIRequestParams, 'model' | 'messages'>> = {}
  ): Promise<string> {
    // Create the prompt
    const messages = promptEngineering.createPrompt(
      promptType, 
      userContent, 
      additionalContext
    );
    
    // Create request parameters
    const params = promptEngineering.createOpenAIRequestParams(
      messages,
      undefined, // Use default model
      options
    );
    
    // Make the request
    return this.createChatCompletion(params);
  }
  
  /**
   * Process a batch of permits with classification
   * @param permits The permits to classify
   * @returns The AI response with classification
   */
  async classifyPermits(permits: Permit[]): Promise<string> {
    const messages = promptEngineering.createPermitClassificationPrompt(permits);
    const params = promptEngineering.createOpenAIRequestParams(
      messages,
      undefined,
      { temperature: 0.3 } // Lower temperature for more consistent classification
    );
    
    return this.createChatCompletion(params);
  }
  
  /**
   * Generate an explanation for a permit decision
   * @param permit The permit to explain
   * @returns The explanation text
   */
  async explainPermitDecision(permit: Permit): Promise<string> {
    const messages = promptEngineering.createPermitExplanationPrompt(permit);
    const params = promptEngineering.createOpenAIRequestParams(
      messages,
      undefined,
      { temperature: 0.7 } // Moderate temperature for natural explanations
    );
    
    return this.createChatCompletion(params);
  }
  
  /**
   * Generate a summary for a batch of permits
   * @param permits The permits to summarize
   * @returns The summary text
   */
  async generateBatchSummary(permits: Permit[]): Promise<string> {
    const messages = promptEngineering.createBatchSummaryPrompt(permits);
    const params = promptEngineering.createOpenAIRequestParams(
      messages,
      undefined,
      { 
        temperature: 0.5,
        max_tokens: 2000 // Longer response for comprehensive summary
      }
    );
    
    return this.createChatCompletion(params);
  }
  
  /**
   * Answer a question about permits
   * @param question The question to answer
   * @param relevantPermits Optional permits to use as context
   * @returns The answer text
   */
  async answerQuestion(question: string, relevantPermits?: Permit[]): Promise<string> {
    const messages = promptEngineering.createQuestionAnsweringPrompt(question, relevantPermits);
    const params = promptEngineering.createOpenAIRequestParams(
      messages,
      undefined,
      { temperature: 0.6 }
    );
    
    return this.createChatCompletion(params);
  }
  
  /**
   * Review consistency of permit classifications
   * @param permits The permits to review
   * @returns The consistency review text
   */
  async reviewConsistency(permits: Permit[]): Promise<string> {
    const messages = promptEngineering.createConsistencyReviewPrompt(permits);
    const params = promptEngineering.createOpenAIRequestParams(
      messages,
      undefined,
      { 
        temperature: 0.4,
        max_tokens: 2000 // Longer response for detailed review
      }
    );
    
    return this.createChatCompletion(params);
  }
  
  /**
   * Analyze permit history data
   * @param permits The permits to analyze
   * @param histories The history records
   * @returns The history analysis text
   */
  async analyzeHistory(permits: Permit[], histories: Array<{ permitId: number; action: string; detail: any; createdAt: string }>): Promise<string> {
    const messages = promptEngineering.createHistoryAnalysisPrompt(permits, histories);
    const params = promptEngineering.createOpenAIRequestParams(
      messages,
      undefined,
      { 
        temperature: 0.6,
        max_tokens: 2000 // Longer response for detailed analysis
      }
    );
    
    return this.createChatCompletion(params);
  }
  
  /**
   * Generate embeddings for text using OpenAI's embedding API with retry logic
   * @param text The text to generate embeddings for
   * @param maxRetries Maximum number of retries (default: 3)
   * @param initialDelay Initial delay in ms before retry (default: 1000)
   * @returns Array of embedding values
   */
  async generateEmbeddings(
    text: string,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<number[]> {
    let retries = 0;
    let delay = initialDelay;
    
    while (true) {
      try {
        // Initialize client if needed
        if (!this.client && !this.initClient()) {
          throw new Error('OpenAI API key is not configured or invalid');
        }
        
        // Log request
        log(`Generating embeddings${retries > 0 ? ` (retry ${retries}/${maxRetries})` : ''}`, 'openaiService');
        
        // Make the API call
        const response = await this.client!.embeddings.create({
          model: 'text-embedding-ada-002', // Default embedding model
          input: text
        });
        
        const embedding = response.data[0]?.embedding;
        
        if (!embedding) {
          throw new Error('OpenAI returned empty embeddings');
        }
        
        log(`Successfully generated embeddings (${embedding.length} dimensions)`, 'openaiService');
        return embedding;
      } catch (error: any) {
        // Check if we should retry
        const shouldRetry = this.shouldRetryRequest(error, retries, maxRetries);
        
        if (shouldRetry) {
          retries++;
          log(`Retrying embeddings generation in ${delay}ms (${retries}/${maxRetries})`, 'openaiService');
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Exponential backoff with jitter
          delay = Math.min(delay * 1.5 + Math.random() * 1000, 15000);
          continue;
        }
        
        // Handle specific OpenAI API errors
        if (error.response) {
          const status = error.response.status;
          log(`OpenAI embeddings API error (${status}): ${JSON.stringify(error.response.data)}`, 'openaiService');
        } else {
          log(`Error generating embeddings: ${error.message}`, 'openaiService');
        }
        
        throw new Error(`Failed to generate embeddings: ${error.message}`);
      }
    }
  }
  
  /**
   * Check if the OpenAI API key is valid
   * @returns True if the key is valid, false otherwise
   */
  async checkApiKey(): Promise<boolean> {
    try {
      // Initialize client
      if (!this.initClient()) {
        return false;
      }
      
      // Make a simple API call to validate the key
      // Using models list as it's lightweight
      await this.client!.models.list();
      
      return true;
    } catch (error) {
      log(`API key validation failed: ${(error as Error).message}`, 'openaiService');
      return false;
    }
  }
}

export const openaiService = new OpenAIService();