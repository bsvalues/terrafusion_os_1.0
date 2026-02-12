/**
 * Code Snippet Service
 *
 * This service manages code snippets for the Smart Code Snippets Library.
 * It provides functionality for creating, retrieving, updating, and deleting code snippets,
 * as well as searching and filtering snippets based on various criteria.
 */

import { IStorage } from '../../storage';
import { eq, and, like, ilike, or, inArray } from 'drizzle-orm';
import { CodeSnippet, InsertCodeSnippet, CodeSnippetType } from '@shared/schema';
import { PlandexAIService } from '../plandex-ai-service';
import { getPlandexAIService } from '../plandex-ai-factory';

export class CodeSnippetService {
  private storage: IStorage;
  private plandexAI: PlandexAIService | null = null;

  constructor(storage: IStorage) {
    this.storage = storage;

    // Try to initialize PlandexAI for AI-generated snippets
    try {
      this.plandexAI = getPlandexAIService();
    } catch (error) {
      console.warn('PlandexAI service not available for code snippet generation:', error);
    }
  }

  /**
   * Get all code snippets with optional filtering
   */
  async getAllSnippets(
    options: {
      language?: string;
      snippetType?: CodeSnippetType;
      tags?: string[];
      isPublic?: boolean;
      createdBy?: number;
      aiGenerated?: boolean;
      searchQuery?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<CodeSnippet[]> {
    try {
      return await this.storage.getCodeSnippets(options);
    } catch (error) {
      console.error('Error getting code snippets:', error);
      throw new Error('Failed to get code snippets');
    }
  }

  /**
   * Get a specific code snippet by ID
   */
  async getSnippetById(id: number): Promise<CodeSnippet | undefined> {
    try {
      return await this.storage.getCodeSnippetById(id);
    } catch (error) {
      console.error(`Error getting code snippet with ID ${id}:`, error);
      throw new Error(`Failed to get code snippet with ID ${id}`);
    }
  }

  /**
   * Create a new code snippet
   */
  async createSnippet(snippet: InsertCodeSnippet): Promise<CodeSnippet> {
    try {
      return await this.storage.createCodeSnippet(snippet);
    } catch (error) {
      console.error('Error creating code snippet:', error);
      throw new Error('Failed to create code snippet');
    }
  }

  /**
   * Update an existing code snippet
   */
  async updateSnippet(
    id: number,
    snippet: Partial<InsertCodeSnippet>
  ): Promise<CodeSnippet | undefined> {
    try {
      return await this.storage.updateCodeSnippet(id, snippet);
    } catch (error) {
      console.error(`Error updating code snippet with ID ${id}:`, error);
      throw new Error(`Failed to update code snippet with ID ${id}`);
    }
  }

  /**
   * Delete a code snippet
   */
  async deleteSnippet(id: number): Promise<boolean> {
    try {
      return await this.storage.deleteCodeSnippet(id);
    } catch (error) {
      console.error(`Error deleting code snippet with ID ${id}:`, error);
      throw new Error(`Failed to delete code snippet with ID ${id}`);
    }
  }

  /**
   * Increment the usage count of a snippet
   */
  async incrementUsageCount(id: number): Promise<void> {
    try {
      const snippet = await this.storage.getCodeSnippetById(id);
      if (snippet) {
        await this.storage.updateCodeSnippet(id, {
          usageCount: (snippet.usageCount || 0) + 1,
        });
      }
    } catch (error) {
      console.error(`Error incrementing usage count for snippet ${id}:`, error);
    }
  }

  /**
   * Generate a code snippet using AI
   */
  async generateSnippet(options: {
    description: string;
    language: string;
    snippetType: CodeSnippetType;
    createdBy: number;
    context?: string;
  }): Promise<CodeSnippet | null> {
    if (!this.plandexAI) {
      throw new Error('PlandexAI service not available for code snippet generation');
    }

    try {
      // Generate code using PlandexAI
      const result = await this.plandexAI.generateCode({
        prompt: options.description,
        language: options.language,
        codeType: options.snippetType,
        context: options.context || '',
      });

      if (!result.code) {
        throw new Error('Failed to generate code snippet');
      }

      // Extract a name from the description (first 40 chars or less)
      const name =
        options.description.length > 40
          ? `${options.description.substring(0, 37)}...`
          : options.description;

      // Create and store the snippet
      const snippet: InsertCodeSnippet = {
        name,
        description: options.description,
        language: options.language,
        snippetType: options.snippetType,
        code: result.code,
        tags: this.extractTagsFromDescription(options.description),
        createdBy: options.createdBy,
        isPublic: false,
        aiGenerated: true,
        aiModel: 'PlandexAI',
      };

      return await this.createSnippet(snippet);
    } catch (error) {
      console.error('Error generating code snippet:', error);
      return null;
    }
  }

  /**
   * Extract potential tags from the description
   */
  private extractTagsFromDescription(description: string): string[] {
    // Simple algorithm to extract potential tags
    // Extract words that might be meaningful as tags (e.g., language names, frameworks, etc.)
    const potentialTags = [
      'react',
      'vue',
      'angular',
      'svelte',
      'node',
      'express',
      'javascript',
      'typescript',
      'python',
      'java',
      'c#',
      'php',
      'html',
      'css',
      'scss',
      'api',
      'rest',
      'graphql',
      'database',
      'sql',
      'mongodb',
      'postgres',
      'authentication',
      'component',
      'function',
      'utility',
      'helper',
    ];

    const lowerDesc = description.toLowerCase();
    return potentialTags.filter(tag => lowerDesc.includes(tag));
  }

  /**
   * Find similar snippets based on description and tags
   */
  async findSimilarSnippets(
    description: string,
    language?: string,
    limit: number = 5
  ): Promise<CodeSnippet[]> {
    const tags = this.extractTagsFromDescription(description);
    const options: any = {
      limit,
      searchQuery: description,
    };

    if (language) {
      options.language = language;
    }

    if (tags.length > 0) {
      options.tags = tags;
    }

    return this.getAllSnippets(options);
  }
}
