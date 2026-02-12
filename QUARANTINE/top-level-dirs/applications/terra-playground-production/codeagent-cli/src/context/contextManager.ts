import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from 'langchain/document';
import { ChunkMetadata } from './types';
import Parser from 'tree-sitter';
import * as JavaScript from 'tree-sitter-javascript';
import * as TypeScript from 'tree-sitter-typescript';

/**
 * Manages project context including code analysis, embedding and retrieval
 */
export class ContextManager {
  private projectPath: string = '';
  private embeddings: OpenAIEmbeddings;
  private vectorStore: MemoryVectorStore | null = null;
  private codeStructureMap: Map<string, any> = new Map();
  private jsParser: Parser;
  private tsParser: Parser;
  private ignorePatterns: string[] = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/coverage/**',
    '**/logs/**',
    '**/*.log',
    '**/*.min.js',
    '**/*.min.css',
  ];

  constructor(projectPath: string = '') {
    this.projectPath = projectPath;
    this.embeddings = new OpenAIEmbeddings();

    // Set up parsers for code analysis
    this.jsParser = new Parser();
    this.jsParser.setLanguage(JavaScript);

    this.tsParser = new Parser();
    this.tsParser.setLanguage(TypeScript.default);
  }

  /**
   * Set the project path and initialize context
   */
  async setProjectPath(projectPath: string): Promise<void> {
    this.projectPath = projectPath;

    // Reset context when changing projects
    this.vectorStore = null;
    this.codeStructureMap.clear();

    console.log(`Setting project context to: ${projectPath}`);

    // Check if path exists
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project path does not exist: ${projectPath}`);
    }

    // Determine if this is a Git repository
    const isGitRepo = fs.existsSync(path.join(projectPath, '.git'));

    // Add additional ignore patterns based on project type
    if (fs.existsSync(path.join(projectPath, '.gitignore'))) {
      const gitignore = fs.readFileSync(path.join(projectPath, '.gitignore'), 'utf8');
      const patterns = gitignore
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(pattern => `**/${pattern}`);

      this.ignorePatterns.push(...patterns);
    }
  }

  /**
   * Load project context by analyzing files and building embeddings
   */
  async loadProjectContext(options: { maxFiles?: number; verbose?: boolean } = {}): Promise<void> {
    if (!this.projectPath) {
      throw new Error('Project path not set. Call setProjectPath first.');
    }

    const { maxFiles = 100, verbose = false } = options;

    console.log(`Loading project context from: ${this.projectPath}`);
    console.log('This may take a few moments for larger projects...');

    // Get all relevant files
    const files = await this.getProjectFiles(maxFiles);

    if (verbose) {
      console.log(`Found ${files.length} files to analyze.`);
    }

    // Initialize vector store
    this.vectorStore = await MemoryVectorStore.fromTexts(
      ['Project initialized'],
      [{ source: 'initialization' }],
      this.embeddings
    );

    // Process files in batches to avoid memory issues
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      if (verbose) {
        console.log(`Processing batch ${i / batchSize + 1}/${Math.ceil(files.length / batchSize)}`);
      }

      await Promise.all(batch.map(file => this.processFile(file, verbose)));
    }

    console.log(`Context loaded. Processed ${files.length} files.`);
  }

  /**
   * Retrieve relevant context based on a query
   */
  async retrieveRelevantContext(query: string, maxTokens: number = 4000): Promise<string[]> {
    if (!this.vectorStore) {
      await this.loadProjectContext();
    }

    // Retrieve relevant documents based on the query
    const results = await this.vectorStore!.similaritySearch(query, 10);

    // Extract context from the results
    return results.map(doc => doc.pageContent);
  }

  /**
   * Get files from the project, respecting ignore patterns
   */
  private async getProjectFiles(maxFiles: number = 100): Promise<string[]> {
    const allFiles = await glob('**/*.*', {
      cwd: this.projectPath,
      absolute: true,
      ignore: this.ignorePatterns,
      nodir: true,
    });

    // Filter files to only include code files
    const codeExtensions = [
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.py',
      '.java',
      '.c',
      '.cpp',
      '.h',
      '.go',
      '.rb',
      '.php',
      '.cs',
    ];

    const codeFiles = allFiles
      .filter(file => codeExtensions.includes(path.extname(file)))
      .slice(0, maxFiles);

    return codeFiles;
  }

  /**
   * Process a single file for context building
   */
  private async processFile(filePath: string, verbose: boolean = false): Promise<void> {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.projectPath, filePath);

      if (verbose) {
        console.log(`Processing: ${relativePath}`);
      }

      // Analyze code structure
      await this.analyzeCodeStructure(filePath, fileContent);

      // Split content into chunks for embedding
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,
        chunkOverlap: 200,
      });

      const chunks = await textSplitter.splitText(fileContent);

      // Create documents with metadata
      const documents = chunks.map((chunk, i) => {
        const metadata: ChunkMetadata = {
          source: relativePath,
          fileName: path.basename(filePath),
          chunkIndex: i,
          language: path.extname(filePath).substring(1),
          timestamp: new Date().toISOString(),
        };

        return new Document({
          pageContent: chunk,
          metadata,
        });
      });

      // Add documents to the vector store
      if (this.vectorStore) {
        await this.vectorStore.addDocuments(documents);
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }

  /**
   * Analyze code structure using tree-sitter
   */
  private async analyzeCodeStructure(filePath: string, content: string): Promise<void> {
    const ext = path.extname(filePath);
    let parser: Parser;

    // Select appropriate parser based on file extension
    if (['.ts', '.tsx'].includes(ext)) {
      parser = this.tsParser;
    } else if (['.js', '.jsx'].includes(ext)) {
      parser = this.jsParser;
    } else {
      // Skip files we don't have parsers for
      return;
    }

    try {
      // Parse the file
      const tree = parser.parse(content);

      // Extract key structures (functions, classes, imports)
      const structure = this.extractCodeStructure(tree.rootNode, content);

      // Store in structure map
      this.codeStructureMap.set(filePath, structure);
    } catch (error) {
      console.error(`Error analyzing code structure for ${filePath}:`, error);
    }
  }

  /**
   * Extract code structure from the parse tree
   */
  private extractCodeStructure(rootNode: any, content: string): any {
    const structure = {
      imports: [] as any[],
      functions: [] as any[],
      classes: [] as any[],
      variables: [] as any[],
    };

    // Helper to extract text for a node
    const getNodeText = (node: any): string => {
      return content.substring(node.startIndex, node.endIndex);
    };

    // Walk the tree to find relevant nodes
    this.traverseTree(rootNode, node => {
      if (node.type === 'import_statement' || node.type === 'import_declaration') {
        structure.imports.push({
          type: 'import',
          text: getNodeText(node),
          position: { start: node.startPosition, end: node.endPosition },
        });
      } else if (
        node.type === 'function' ||
        node.type === 'function_declaration' ||
        node.type === 'method_definition'
      ) {
        // Find the function name
        let nameNode = node.childForFieldName('name');
        const name = nameNode ? getNodeText(nameNode) : 'anonymous';

        structure.functions.push({
          type: 'function',
          name,
          text: getNodeText(node),
          signature: this.extractFunctionSignature(node, content),
          position: { start: node.startPosition, end: node.endPosition },
        });
      } else if (node.type === 'class' || node.type === 'class_declaration') {
        // Find the class name
        let nameNode = node.childForFieldName('name');
        const name = nameNode ? getNodeText(nameNode) : 'anonymous';

        structure.classes.push({
          type: 'class',
          name,
          text: getNodeText(node),
          position: { start: node.startPosition, end: node.endPosition },
        });
      } else if (node.type === 'lexical_declaration' || node.type === 'variable_declaration') {
        structure.variables.push({
          type: 'variable',
          text: getNodeText(node),
          position: { start: node.startPosition, end: node.endPosition },
        });
      }
    });

    return structure;
  }

  /**
   * Extract just the function signature (without the body)
   */
  private extractFunctionSignature(functionNode: any, content: string): string {
    // Find the function body
    const bodyNode = functionNode.childForFieldName('body');
    if (!bodyNode) return content.substring(functionNode.startIndex, functionNode.endIndex);

    // Extract just the signature part before the body
    return content.substring(functionNode.startIndex, bodyNode.startIndex) + '{ ... }';
  }

  /**
   * Recursively traverse the syntax tree
   */
  private traverseTree(node: any, callback: (node: any) => void): void {
    callback(node);

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        this.traverseTree(child, callback);
      }
    }
  }

  /**
   * Get a summary of the codebase structure
   */
  getCodeStructureSummary(): any {
    const summary = {
      fileCount: this.codeStructureMap.size,
      classSummary: [] as any[],
      functionSummary: [] as any[],
      importSummary: new Map<string, number>(),
    };

    // Collect structure information
    for (const [filePath, structure] of this.codeStructureMap.entries()) {
      const relativePath = path.relative(this.projectPath, filePath);

      // Summarize classes
      for (const cls of structure.classes) {
        summary.classSummary.push({
          name: cls.name,
          file: relativePath,
        });
      }

      // Summarize functions
      for (const func of structure.functions) {
        summary.functionSummary.push({
          name: func.name,
          file: relativePath,
          signature: func.signature,
        });
      }

      // Count imports
      for (const imp of structure.imports) {
        const importText = imp.text;
        const count = summary.importSummary.get(importText) || 0;
        summary.importSummary.set(importText, count + 1);
      }
    }

    return summary;
  }

  /**
   * Find dependencies between files
   */
  findDependencies(): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();

    // Process each file
    for (const [filePath, structure] of this.codeStructureMap.entries()) {
      const relativePath = path.relative(this.projectPath, filePath);
      const deps: string[] = [];

      // Check imports to determine dependencies
      for (const imp of structure.imports) {
        const importText = imp.text;

        // Extract the path from the import
        const match = importText.match(/from\s+['"](.+)['"]/);
        if (match && match[1]) {
          const importPath = match[1];

          // Handle relative imports
          if (importPath.startsWith('.')) {
            const resolved = path.resolve(path.dirname(filePath), importPath);
            deps.push(path.relative(this.projectPath, resolved));
          } else {
            // External dependency
            deps.push(importPath);
          }
        }
      }

      dependencies.set(relativePath, deps);
    }

    return dependencies;
  }

  /**
   * Get project path
   */
  getProjectPath(): string {
    return this.projectPath;
  }
}
