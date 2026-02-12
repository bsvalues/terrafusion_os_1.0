import { storage } from '../storage';
import {
  WorkflowOptimizationRequest,
  WorkflowOptimizationResult,
  InsertWorkflowOptimizationRequest,
  InsertWorkflowOptimizationResult,
  WorkflowOptimizationType,
  WorkflowOptimizationStatus,
  WorkflowOptimizationPriority,
} from '@shared/schema';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = 'gpt-4o';

/**
 * Service for handling workflow optimization requests and analyses
 */
export class WorkflowOptimizerService {
  private openai: OpenAI;

  constructor() {
    // Initialize OpenAI client with API key from environment variables
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Create a new workflow optimization request
   * @param request The request data
   * @returns The created request
   */
  async createOptimizationRequest(
    request: InsertWorkflowOptimizationRequest
  ): Promise<WorkflowOptimizationRequest> {
    // Create the request in storage
    const createdRequest = await storage.createWorkflowOptimizationRequest(request);

    // If the request is not set to pending, kick off the optimization process
    if (createdRequest.status === WorkflowOptimizationStatus.IN_PROGRESS) {
      // Process the request asynchronously (don't await)
      this.processOptimizationRequest(createdRequest.id);
    }

    return createdRequest;
  }

  /**
   * Process a workflow optimization request
   * @param requestId The ID of the request to process
   */
  async processOptimizationRequest(requestId: number): Promise<void> {
    try {
      // Get the request from storage
      const request = await storage.getWorkflowOptimizationRequestById(requestId);
      if (!request) {
        console.error(`Request with ID ${requestId} not found`);
        return;
      }

      // Update the status to "in progress"
      await storage.updateWorkflowOptimizationRequest(requestId, {
        status: WorkflowOptimizationStatus.IN_PROGRESS,
      });

      // Perform the analysis based on the optimization type
      const analysis = await this.analyzeCodebase(request);

      // Create the result
      await storage.createWorkflowOptimizationResult({
        requestId: request.requestId,
        summary: analysis.summary,
        recommendationsJson: analysis.recommendations,
        improvementScore: analysis.improvementScore,
        runTime: analysis.runTime,
        modelUsed: OPENAI_MODEL,
      });
    } catch (error) {
      console.error(`Error processing optimization request ${requestId}:`, error);

      // Update the status to "failed"
      await storage.updateWorkflowOptimizationRequest(requestId, {
        status: WorkflowOptimizationStatus.FAILED,
      });
    }
  }

  /**
   * Get a workflow optimization request by ID
   * @param id The ID of the request
   * @returns The request or undefined if not found
   */
  async getOptimizationRequest(id: number): Promise<WorkflowOptimizationRequest | undefined> {
    return storage.getWorkflowOptimizationRequestById(id);
  }

  /**
   * Get workflow optimization requests with optional filters
   * @param filters Optional filters to apply
   * @returns Array of matching requests
   */
  async getOptimizationRequests(filters?: {
    status?: string;
    optimizationType?: string;
    userId?: number;
    repositoryId?: number;
  }): Promise<WorkflowOptimizationRequest[]> {
    return storage.getWorkflowOptimizationRequests(filters);
  }

  /**
   * Get a workflow optimization result by request ID
   * @param requestId The UUID of the request
   * @returns Array of results for the request
   */
  async getOptimizationResults(requestId: string): Promise<WorkflowOptimizationResult[]> {
    return storage.getWorkflowOptimizationResults(requestId);
  }

  /**
   * Get all workflow optimization results
   * @returns Array of all results
   */
  async getAllOptimizationResults(): Promise<WorkflowOptimizationResult[]> {
    return storage.getWorkflowOptimizationResults();
  }

  /**
   * Update a workflow optimization request
   * @param id The ID of the request to update
   * @param updates The updates to apply
   * @returns The updated request or undefined if not found
   */
  async updateOptimizationRequest(
    id: number,
    updates: Partial<InsertWorkflowOptimizationRequest>
  ): Promise<WorkflowOptimizationRequest | undefined> {
    return storage.updateWorkflowOptimizationRequest(id, updates);
  }

  /**
   * Delete a workflow optimization request
   * @param id The ID of the request to delete
   * @returns True if deleted, false if not found
   */
  async deleteOptimizationRequest(id: number): Promise<boolean> {
    return storage.deleteWorkflowOptimizationRequest(id);
  }

  /**
   * Analyze a codebase using OpenAI
   * @param request The optimization request
   * @returns Analysis results including summary, recommendations, and improvement score
   */
  private async analyzeCodebase(request: WorkflowOptimizationRequest): Promise<{
    summary: string;
    recommendations: any;
    improvementScore: number;
    runTime: number;
  }> {
    const startTime = Date.now();

    try {
      let codeContent = '';

      // If request has a codebase path, read files from that path
      if (request.codebase && fs.existsSync(request.codebase)) {
        codeContent = await this.readCodebaseFiles(request.codebase);
      }

      // If no content or path provided, get a sample code for demonstration
      if (!codeContent) {
        codeContent = '// No code provided for analysis. This is a demonstration.';
      }

      // Determine the prompt based on optimization type
      const prompt = this.buildPromptForOptimizationType(request.optimizationType, codeContent);

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert software engineer specializing in code analysis and optimization.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      // Parse the response
      const content = response.choices[0].message.content;
      const analysis = JSON.parse(content);

      // Calculate runtime
      const runTime = Date.now() - startTime;

      return {
        summary: analysis.summary || 'Analysis completed successfully',
        recommendations: analysis.recommendations || [],
        improvementScore: analysis.improvement_score || 0,
        runTime: runTime,
      };
    } catch (error) {
      console.error('Error analyzing codebase:', error);

      // Return a basic result in case of error
      return {
        summary: 'Analysis failed due to an error',
        recommendations: [
          {
            title: 'Error occurred',
            description: 'The analysis could not be completed due to an error.',
            priority: 'high',
          },
        ],
        improvementScore: 0,
        runTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Build prompt specific to optimization type
   * @param optimizationType The type of optimization to perform
   * @param code The code to analyze
   * @returns A prompt tailored to the optimization type
   */
  private buildPromptForOptimizationType(optimizationType: string, code: string): string {
    const requestJson = {
      code: code,
      response_format: 'json',
      output_structure: {
        summary: 'A concise summary of the analysis findings',
        recommendations: [
          {
            title: 'Title of the recommendation',
            description: 'Detailed description of the recommendation',
            code_samples: 'Example code to implement the recommendation',
            priority: 'low|medium|high',
            estimated_effort: 'low|medium|high',
          },
        ],
        improvement_score: 'A score from 0-100 representing the potential improvement',
      },
    };

    switch (optimizationType) {
      case WorkflowOptimizationType.CODE_QUALITY:
        return `Analyze the following code for quality issues such as code smells, complexity, maintainability, and adherence to best practices. Provide recommendations to improve the code quality.
        
${JSON.stringify(requestJson, null, 2)}`;

      case WorkflowOptimizationType.PERFORMANCE:
        return `Analyze the following code for performance issues, identifying bottlenecks, inefficient algorithms, unnecessary operations, and memory usage. Provide recommendations to improve performance.
        
${JSON.stringify(requestJson, null, 2)}`;

      case WorkflowOptimizationType.ARCHITECTURE:
        return `Analyze the following code for architectural issues such as separation of concerns, modularity, dependency management, and appropriate design patterns. Provide recommendations to improve the architecture.
        
${JSON.stringify(requestJson, null, 2)}`;

      case WorkflowOptimizationType.SECURITY:
        return `Analyze the following code for security vulnerabilities such as injection flaws, broken authentication, sensitive data exposure, and insecure dependencies. Provide recommendations to improve security.
        
${JSON.stringify(requestJson, null, 2)}`;

      case WorkflowOptimizationType.BEST_PRACTICES:
        return `Analyze the following code for adherence to industry best practices and coding standards. Identify areas that deviate from recommended practices. Provide recommendations to align with best practices.
        
${JSON.stringify(requestJson, null, 2)}`;

      case WorkflowOptimizationType.DEVELOPER_PRODUCTIVITY:
        return `Analyze the following development workflow and code for opportunities to improve developer productivity. Consider build processes, test automation, code organization, and developer experience. Provide recommendations to enhance productivity.
        
${JSON.stringify(requestJson, null, 2)}`;

      case WorkflowOptimizationType.DOCUMENTATION:
        return `Analyze the following code for documentation quality and completeness. Identify undocumented or poorly documented components, functions, and APIs. Provide recommendations to improve documentation.
        
${JSON.stringify(requestJson, null, 2)}`;

      case WorkflowOptimizationType.TESTING:
        return `Analyze the following code for test coverage, quality, and effectiveness. Identify untested code, poor test design, and opportunities for better testing. Provide recommendations to improve testing.
        
${JSON.stringify(requestJson, null, 2)}`;

      default:
        return `Analyze the following code and provide general recommendations for improvement.
        
${JSON.stringify(requestJson, null, 2)}`;
    }
  }

  /**
   * Read code files from a directory
   * @param codebasePath The path to the codebase
   * @returns The contents of relevant files
   */
  private async readCodebaseFiles(codebasePath: string): Promise<string> {
    try {
      const fileContents: string[] = [];

      const readDir = async (dirPath: string) => {
        const files = await fs.promises.readdir(dirPath, { withFileTypes: true });

        for (const file of files) {
          const filePath = path.join(dirPath, file.name);

          if (file.isDirectory()) {
            // Skip node_modules, .git, and other common directories to ignore
            if (!['.git', 'node_modules', 'dist', 'build', '.cache'].includes(file.name)) {
              await readDir(filePath);
            }
          } else {
            // Only read certain file types
            const ext = path.extname(file.name).toLowerCase();
            if (
              [
                '.js',
                '.jsx',
                '.ts',
                '.tsx',
                '.py',
                '.java',
                '.go',
                '.rb',
                '.php',
                '.cs',
                '.c',
                '.cpp',
              ].includes(ext)
            ) {
              try {
                const content = await fs.promises.readFile(filePath, 'utf8');
                fileContents.push(`--- File: ${filePath} ---\n${content}\n\n`);
              } catch (err) {
                console.error(`Error reading file ${filePath}:`, err);
              }
            }
          }
        }
      };

      await readDir(codebasePath);

      // If the total content is too large, truncate it
      let combinedContent = fileContents.join('');
      if (combinedContent.length > 100000) {
        combinedContent =
          combinedContent.substring(0, 100000) + '\n\n... [Content truncated due to size] ...';
      }

      return combinedContent;
    } catch (error) {
      console.error('Error reading codebase files:', error);
      return '';
    }
  }
}

// Export singleton instance
export const workflowOptimizerService = new WorkflowOptimizerService();
