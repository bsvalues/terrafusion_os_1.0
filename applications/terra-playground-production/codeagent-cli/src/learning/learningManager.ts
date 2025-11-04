import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { ContextManager } from '../context/contextManager.js';
import { ToolRegistry } from '../tools/toolRegistry.js';

/**
 * Interface for learning data
 */
interface LearningEntry {
  id?: number;
  timestamp: string;
  context: string;
  query: string;
  solution: string;
  toolsUsed: string;
  feedback: number;
  tags: string;
}

/**
 * Interface for feedback data
 */
interface FeedbackEntry {
  learningEntryId: number;
  feedback: number;
  notes?: string;
  timestamp: string;
}

/**
 * Interface for pattern data
 */
interface Pattern {
  id?: number;
  name: string;
  description: string;
  patternType: string;
  patternData: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Manages learning capabilities of the agent
 * Stores past queries, solutions, and feedback to improve future performance
 */
export class LearningManager {
  private dbPath: string;
  private db: Database | null = null;
  private contextManager: ContextManager;
  private toolRegistry: ToolRegistry;

  constructor(dbPath: string, contextManager: ContextManager, toolRegistry: ToolRegistry) {
    this.dbPath = dbPath;
    this.contextManager = contextManager;
    this.toolRegistry = toolRegistry;
  }

  /**
   * Initialize the learning database
   */
  async initialize(): Promise<void> {
    // Ensure directory exists
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Open the database
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database,
    });

    // Create tables if they don't exist
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS learning_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        context TEXT NOT NULL,
        query TEXT NOT NULL,
        solution TEXT NOT NULL,
        tools_used TEXT,
        feedback INTEGER DEFAULT 0,
        tags TEXT
      );
      
      CREATE TABLE IF NOT EXISTS feedback_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        learning_entry_id INTEGER NOT NULL,
        feedback INTEGER NOT NULL,
        notes TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (learning_entry_id) REFERENCES learning_entries (id)
      );
      
      CREATE TABLE IF NOT EXISTS patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        pattern_type TEXT NOT NULL,
        pattern_data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_learning_entries_tags ON learning_entries (tags);
      CREATE INDEX IF NOT EXISTS idx_learning_entries_query ON learning_entries (query);
    `);
  }

  /**
   * Store a new learning entry
   * @param entry The learning entry to store
   * @returns The ID of the newly created entry
   */
  async storeLearningEntry(entry: Omit<LearningEntry, 'id'>): Promise<number> {
    if (!this.db) await this.initialize();

    const result = await this.db!.run(
      `INSERT INTO learning_entries 
       (timestamp, context, query, solution, tools_used, feedback, tags) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      entry.timestamp,
      entry.context,
      entry.query,
      entry.solution,
      entry.toolsUsed,
      entry.feedback,
      entry.tags
    );

    return result.lastID!;
  }

  /**
   * Store feedback for a learning entry
   * @param feedback The feedback entry to store
   */
  async storeFeedback(feedback: FeedbackEntry): Promise<void> {
    if (!this.db) await this.initialize();

    await this.db!.run(
      `INSERT INTO feedback_entries 
       (learning_entry_id, feedback, notes, timestamp) 
       VALUES (?, ?, ?, ?)`,
      feedback.learningEntryId,
      feedback.feedback,
      feedback.notes || null,
      feedback.timestamp
    );

    // Update the overall feedback score in the learning entry
    await this.db!.run(
      `UPDATE learning_entries 
       SET feedback = (
         SELECT AVG(feedback) 
         FROM feedback_entries 
         WHERE learning_entry_id = ?
       )
       WHERE id = ?`,
      feedback.learningEntryId,
      feedback.learningEntryId
    );
  }

  /**
   * Search for similar past learning entries
   * @param query The query to search for
   * @param limit The maximum number of results to return
   * @returns Array of matching learning entries
   */
  async findSimilarLearning(query: string, limit: number = 5): Promise<LearningEntry[]> {
    if (!this.db) await this.initialize();

    // For a simple implementation, we'll use a basic text search
    // In a more advanced version, this would use embedding similarity
    const results = await this.db!.all<LearningEntry[]>(
      `SELECT * FROM learning_entries 
       WHERE query LIKE ?
       ORDER BY feedback DESC, timestamp DESC
       LIMIT ?`,
      `%${query}%`,
      limit
    );

    return results;
  }

  /**
   * Get top rated solutions for a specific tag
   * @param tag The tag to search for
   * @param limit The maximum number of results to return
   * @returns Array of matching learning entries
   */
  async getTopRatedSolutionsForTag(tag: string, limit: number = 5): Promise<LearningEntry[]> {
    if (!this.db) await this.initialize();

    const results = await this.db!.all<LearningEntry[]>(
      `SELECT * FROM learning_entries 
       WHERE tags LIKE ?
       ORDER BY feedback DESC
       LIMIT ?`,
      `%${tag}%`,
      limit
    );

    return results;
  }

  /**
   * Store a new pattern
   * @param pattern The pattern to store
   * @returns The ID of the newly created pattern
   */
  async storePattern(pattern: Omit<Pattern, 'id'>): Promise<number> {
    if (!this.db) await this.initialize();

    const result = await this.db!.run(
      `INSERT INTO patterns 
       (name, description, pattern_type, pattern_data, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      pattern.name,
      pattern.description,
      pattern.patternType,
      pattern.patternData,
      pattern.createdAt,
      pattern.updatedAt
    );

    return result.lastID!;
  }

  /**
   * Get patterns by type
   * @param patternType The pattern type to search for
   * @returns Array of matching patterns
   */
  async getPatternsByType(patternType: string): Promise<Pattern[]> {
    if (!this.db) await this.initialize();

    const results = await this.db!.all<Pattern[]>(
      `SELECT * FROM patterns 
       WHERE pattern_type = ?
       ORDER BY updated_at DESC`,
      patternType
    );

    return results;
  }

  /**
   * Extract patterns from successful solutions
   * This is a simplified version. A more advanced implementation would
   * use clustering or other ML techniques to identify patterns.
   */
  async extractPatterns(): Promise<void> {
    if (!this.db) await this.initialize();

    // Get all highly rated entries (feedback > 4)
    const entries = await this.db!.all<LearningEntry[]>(
      `SELECT * FROM learning_entries 
       WHERE feedback > 4
       ORDER BY feedback DESC`
    );

    // This is where you'd implement pattern extraction algorithms
    // For now, we'll just log that we found entries
    console.log(`Found ${entries.length} high-quality entries for pattern extraction`);

    // In a real implementation, you'd save identified patterns back to the database
    // and use them to improve future responses
  }

  /**
   * Learn from a code fix
   * @param query The original query
   * @param solution The implemented solution
   * @param toolsUsed Array of tools used in the solution
   * @param context The context (e.g., file path or code section)
   * @param tags Array of tags for categorizing the learning
   * @returns The ID of the created learning entry
   */
  async learnFromCodeFix(
    query: string,
    solution: string,
    toolsUsed: string[],
    context: string,
    tags: string[] = []
  ): Promise<number> {
    const entry: Omit<LearningEntry, 'id'> = {
      timestamp: new Date().toISOString(),
      context,
      query,
      solution,
      toolsUsed: JSON.stringify(toolsUsed),
      feedback: 0, // No feedback yet
      tags: tags.join(','),
    };

    return this.storeLearningEntry(entry);
  }

  /**
   * Record user feedback
   * @param learningEntryId The ID of the learning entry
   * @param rating The feedback rating (1-5)
   * @param notes Optional notes about the feedback
   */
  async recordFeedback(learningEntryId: number, rating: number, notes?: string): Promise<void> {
    const feedback: FeedbackEntry = {
      learningEntryId,
      feedback: rating,
      notes,
      timestamp: new Date().toISOString(),
    };

    await this.storeFeedback(feedback);
  }

  /**
   * Get relevant learning for a query
   * @param query The query to search for
   * @returns Array of relevant learning entries
   */
  async getRelevantLearning(query: string): Promise<LearningEntry[]> {
    // Get similar learning entries
    const similarLearning = await this.findSimilarLearning(query);

    // Extract potential tags from the query
    const queryWords = query.toLowerCase().split(/\s+/);
    const commonTags = [
      'javascript',
      'typescript',
      'python',
      'java',
      'go',
      'rust',
      'c++',
      'css',
      'html',
    ];
    const detectedTags = queryWords.filter(word => commonTags.includes(word));

    // Get learning entries for detected tags
    let taggedLearning: LearningEntry[] = [];

    for (const tag of detectedTags) {
      const taggedEntries = await this.getTopRatedSolutionsForTag(tag, 3);
      taggedLearning = [...taggedLearning, ...taggedEntries];
    }

    // Combine and deduplicate results
    const allEntries = [...similarLearning, ...taggedLearning];
    const uniqueEntries = Array.from(new Map(allEntries.map(entry => [entry.id, entry])).values());

    // Sort by relevance (feedback score)
    return uniqueEntries.sort((a, b) => b.feedback - a.feedback);
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}
