/**
 * Plandex AI Client Service
 * 
 * This service provides client-side access to the Plandex AI capabilities,
 * including code generation, completion, bug fixing, and explanation.
 */

import { apiRequest } from '@/lib/queryClient';

export interface CodeGenerationRequest {
  prompt: string;
  language?: string;
  context?: string;
}

export interface CodeCompletionRequest {
  codePrefix: string;
  language: string;
  maxTokens?: number;
  temperature?: number;
}

export interface BugFixRequest {
  buggyCode: string;
  errorMessage: string;
  language: string;
}

export interface CodeExplanationRequest {
  code: string;
  language: string;
  detailLevel?: 'basic' | 'detailed' | 'comprehensive';
}

/**
 * Client service for interacting with the Plandex AI API
 */
export class PlandexAIClientService {
  /**
   * Check if Plandex AI is available
   */
  public static async checkAvailability(): Promise<boolean> {
    try {
      const response = await apiRequest('GET', '/api/plandex-ai/status');
      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('Error checking Plandex AI availability:', error);
      return false;
    }
  }

  /**
   * Generate code based on a prompt
   */
  public static async generateCode(request: CodeGenerationRequest): Promise<string> {
    try {
      const response = await apiRequest('POST', '/api/plandex-ai/generate', request);
      const data = await response.json();
      return data.code;
    } catch (error) {
      console.error('Error generating code with Plandex AI:', error);
      throw new Error('Failed to generate code: ' + (error as Error).message);
    }
  }

  /**
   * Complete code based on a prefix
   */
  public static async completeCode(request: CodeCompletionRequest): Promise<string> {
    try {
      const response = await apiRequest('POST', '/api/plandex-ai/complete', request);
      const data = await response.json();
      return data.completion;
    } catch (error) {
      console.error('Error completing code with Plandex AI:', error);
      throw new Error('Failed to complete code: ' + (error as Error).message);
    }
  }

  /**
   * Fix bugs in code
   */
  public static async fixBugs(request: BugFixRequest): Promise<string> {
    try {
      const response = await apiRequest('POST', '/api/plandex-ai/fix', request);
      const data = await response.json();
      return data.fixedCode;
    } catch (error) {
      console.error('Error fixing bugs with Plandex AI:', error);
      throw new Error('Failed to fix bugs: ' + (error as Error).message);
    }
  }

  /**
   * Explain code
   */
  public static async explainCode(request: CodeExplanationRequest): Promise<string> {
    try {
      const response = await apiRequest('POST', '/api/plandex-ai/explain', request);
      const data = await response.json();
      return data.explanation;
    } catch (error) {
      console.error('Error explaining code with Plandex AI:', error);
      throw new Error('Failed to explain code: ' + (error as Error).message);
    }
  }
}