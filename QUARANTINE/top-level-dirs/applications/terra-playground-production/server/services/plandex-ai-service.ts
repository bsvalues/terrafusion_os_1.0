/**
 * Plandex AI Service
 *
 * This service integrates with the Plandex AI API to provide specialized
 * code generation, completion, bug fixing, and explanation capabilities.
 */

import fetch from 'node-fetch';

export interface PlandexAIConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
}

export interface CodeGenerationRequest {
  prompt: string;
  language?: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
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

export class PlandexAIService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: PlandexAIConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.defaultModel = config.defaultModel;
    this.maxTokens = config.maxTokens || 1024;
    this.temperature = config.temperature || 0.2;
  }

  /**
   * Generate code based on a prompt
   */
  public async generateCode(request: CodeGenerationRequest): Promise<string> {
    const response = await this.makeRequest('/generate', {
      prompt: request.prompt,
      language: request.language || 'typescript',
      context: request.context,
      maxTokens: request.maxTokens || this.maxTokens,
      temperature: request.temperature || this.temperature,
      model: this.defaultModel,
    });

    return response.code;
  }

  /**
   * Complete code based on a prefix
   */
  public async completeCode(request: CodeCompletionRequest): Promise<string> {
    const response = await this.makeRequest('/complete', {
      codePrefix: request.codePrefix,
      language: request.language,
      maxTokens: request.maxTokens || this.maxTokens,
      temperature: request.temperature || this.temperature,
      model: this.defaultModel,
    });

    return response.completion;
  }

  /**
   * Fix bugs in code
   */
  public async fixBugs(request: BugFixRequest): Promise<string> {
    const response = await this.makeRequest('/fix', {
      buggyCode: request.buggyCode,
      errorMessage: request.errorMessage,
      language: request.language,
      model: this.defaultModel,
    });

    return response.fixedCode;
  }

  /**
   * Explain code
   */
  public async explainCode(request: CodeExplanationRequest): Promise<string> {
    const response = await this.makeRequest('/explain', {
      code: request.code,
      language: request.language,
      detailLevel: request.detailLevel || 'detailed',
      model: this.defaultModel,
    });

    return response.explanation;
  }

  /**
   * Make a request to the Plandex AI API
   */
  private async makeRequest(endpoint: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Plandex AI API error: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error making request to Plandex AI:', error);
      throw error;
    }
  }
}
