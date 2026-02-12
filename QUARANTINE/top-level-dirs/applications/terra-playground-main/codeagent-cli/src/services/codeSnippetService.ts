import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';

/**
 * Code snippet model
 */
export interface CodeSnippet {
  id: string;
  name: string;
  description: string;
  language: string;
  tags: string[];
  code: string;
  context?: string[];
  created: string;
  updated: string;
  usageCount: number;
  favorite: boolean;
}

/**
 * Snippet creation input
 */
export interface CreateSnippetInput {
  name: string;
  description: string;
  language: string;
  tags: string[];
  code: string;
  context?: string[];
  favorite?: boolean;
}

/**
 * Snippet update input
 */
export interface UpdateSnippetInput {
  name?: string;
  description?: string;
  language?: string;
  tags?: string[];
  code?: string;
  context?: string[];
  favorite?: boolean;
}

/**
 * Search options
 */
export interface SearchOptions {
  query?: string;
  language?: string;
  tags?: string[];
  favorite?: boolean;
  context?: string[];
  limit?: number;
}

/**
 * Service for managing code snippets
 */
export class CodeSnippetService extends EventEmitter {
  private snippetsDir: string;
  private snippetsFile: string;
  private snippets: Map<string, CodeSnippet> = new Map();
  private initialized = false;

  /**
   * Constructor
   * @param baseDir Optional base directory for snippets
   */
  constructor(baseDir?: string) {
    super();

    // Set up directories
    const codeagentDir = baseDir || path.join(os.homedir(), '.codeagent');
    this.snippetsDir = path.join(codeagentDir, 'snippets');
    this.snippetsFile = path.join(this.snippetsDir, 'snippets.json');
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Create snippets directory if it doesn't exist
      await fs.mkdir(this.snippetsDir, { recursive: true });

      // Try to load snippets from file
      try {
        const data = await fs.readFile(this.snippetsFile, 'utf-8');
        const snippetsArray = JSON.parse(data) as CodeSnippet[];

        // Populate map
        this.snippets.clear();
        snippetsArray.forEach(snippet => {
          this.snippets.set(snippet.id, snippet);
        });

        this.emit('loaded', { count: this.snippets.size });
      } catch (error) {
        // File doesn't exist or is invalid, create a new one
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          await this.saveSnippets();
          this.emit('created', { file: this.snippetsFile });
        } else {
          throw error;
        }
      }

      this.initialized = true;
    } catch (error) {
      this.emit('error', {
        message: `Failed to initialize snippet service: ${(error as Error).message}`,
      });
      throw error;
    }
  }

  /**
   * Get all snippets
   */
  async getAllSnippets(): Promise<CodeSnippet[]> {
    await this.ensureInitialized();
    return Array.from(this.snippets.values());
  }

  /**
   * Get a snippet by ID
   */
  async getSnippet(id: string): Promise<CodeSnippet | null> {
    await this.ensureInitialized();
    return this.snippets.get(id) || null;
  }

  /**
   * Create a new snippet
   */
  async createSnippet(input: CreateSnippetInput): Promise<CodeSnippet> {
    await this.ensureInitialized();

    const now = new Date().toISOString();
    const snippet: CodeSnippet = {
      id: this.generateId(),
      name: input.name,
      description: input.description,
      language: input.language,
      tags: input.tags || [],
      code: input.code,
      context: input.context || [],
      created: now,
      updated: now,
      usageCount: 0,
      favorite: input.favorite || false,
    };

    this.snippets.set(snippet.id, snippet);
    await this.saveSnippets();

    this.emit('created', { snippet });
    return snippet;
  }

  /**
   * Update a snippet
   */
  async updateSnippet(id: string, input: UpdateSnippetInput): Promise<CodeSnippet | null> {
    await this.ensureInitialized();

    const snippet = this.snippets.get(id);
    if (!snippet) {
      return null;
    }

    const updatedSnippet: CodeSnippet = {
      ...snippet,
      name: input.name !== undefined ? input.name : snippet.name,
      description: input.description !== undefined ? input.description : snippet.description,
      language: input.language !== undefined ? input.language : snippet.language,
      tags: input.tags !== undefined ? input.tags : snippet.tags,
      code: input.code !== undefined ? input.code : snippet.code,
      context: input.context !== undefined ? input.context : snippet.context,
      favorite: input.favorite !== undefined ? input.favorite : snippet.favorite,
      updated: new Date().toISOString(),
    };

    this.snippets.set(id, updatedSnippet);
    await this.saveSnippets();

    this.emit('updated', { snippet: updatedSnippet });
    return updatedSnippet;
  }

  /**
   * Delete a snippet
   */
  async deleteSnippet(id: string): Promise<boolean> {
    await this.ensureInitialized();

    const hasSnippet = this.snippets.has(id);
    if (!hasSnippet) {
      return false;
    }

    this.snippets.delete(id);
    await this.saveSnippets();

    this.emit('deleted', { id });
    return true;
  }

  /**
   * Increment usage count for a snippet
   */
  async incrementUsageCount(id: string): Promise<CodeSnippet | null> {
    await this.ensureInitialized();

    const snippet = this.snippets.get(id);
    if (!snippet) {
      return null;
    }

    const updatedSnippet: CodeSnippet = {
      ...snippet,
      usageCount: snippet.usageCount + 1,
      updated: new Date().toISOString(),
    };

    this.snippets.set(id, updatedSnippet);
    await this.saveSnippets();

    this.emit('usage', { snippet: updatedSnippet });
    return updatedSnippet;
  }

  /**
   * Search for snippets
   */
  async searchSnippets(options: SearchOptions = {}): Promise<CodeSnippet[]> {
    await this.ensureInitialized();

    let results = Array.from(this.snippets.values());

    // Filter by query (name, description, code)
    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(
        snippet =>
          snippet.name.toLowerCase().includes(query) ||
          snippet.description.toLowerCase().includes(query) ||
          snippet.code.toLowerCase().includes(query)
      );
    }

    // Filter by language
    if (options.language) {
      results = results.filter(
        snippet => snippet.language.toLowerCase() === options.language!.toLowerCase()
      );
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      results = results.filter(snippet => options.tags!.some(tag => snippet.tags.includes(tag)));
    }

    // Filter by favorite
    if (options.favorite !== undefined) {
      results = results.filter(snippet => snippet.favorite === options.favorite);
    }

    // Filter by context
    if (options.context && options.context.length > 0) {
      results = results.filter(snippet => {
        if (!snippet.context || snippet.context.length === 0) {
          return false;
        }

        return options.context!.some(ctx =>
          snippet.context!.some(snippetCtx => snippetCtx.toLowerCase().includes(ctx.toLowerCase()))
        );
      });
    }

    // Sort by usage count (most used first)
    results.sort((a, b) => b.usageCount - a.usageCount);

    // Apply limit
    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get snippet suggestions based on context
   */
  async getSuggestions(context: string[], limit: number = 5): Promise<CodeSnippet[]> {
    return this.searchSnippets({
      context,
      limit,
    });
  }

  /**
   * Get all available languages
   */
  async getLanguages(): Promise<string[]> {
    await this.ensureInitialized();

    const languages = new Set<string>();
    this.snippets.forEach(snippet => {
      languages.add(snippet.language);
    });

    return Array.from(languages).sort();
  }

  /**
   * Get all available tags
   */
  async getTags(): Promise<string[]> {
    await this.ensureInitialized();

    const tags = new Set<string>();
    this.snippets.forEach(snippet => {
      snippet.tags.forEach(tag => tags.add(tag));
    });

    return Array.from(tags).sort();
  }

  /**
   * Import snippets from JSON
   */
  async importSnippets(jsonData: string): Promise<number> {
    await this.ensureInitialized();

    try {
      const snippetsToImport = JSON.parse(jsonData) as CodeSnippet[];
      let importCount = 0;

      for (const snippet of snippetsToImport) {
        // Generate a new ID to avoid collisions
        const newId = this.generateId();

        // Set creation and update times
        const now = new Date().toISOString();

        const newSnippet: CodeSnippet = {
          ...snippet,
          id: newId,
          created: now,
          updated: now,
          usageCount: 0,
        };

        this.snippets.set(newId, newSnippet);
        importCount++;
      }

      await this.saveSnippets();

      this.emit('imported', { count: importCount });
      return importCount;
    } catch (error) {
      this.emit('error', { message: `Failed to import snippets: ${(error as Error).message}` });
      throw error;
    }
  }

  /**
   * Export snippets to JSON
   */
  async exportSnippets(): Promise<string> {
    await this.ensureInitialized();

    const snippetsArray = Array.from(this.snippets.values());
    return JSON.stringify(snippetsArray, null, 2);
  }

  /**
   * Save snippets to file
   */
  private async saveSnippets(): Promise<void> {
    const snippetsArray = Array.from(this.snippets.values());
    await fs.writeFile(this.snippetsFile, JSON.stringify(snippetsArray, null, 2), 'utf-8');
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  }

  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}
