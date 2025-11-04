/**
 * Schema Analyzer Service
 *
 * This service analyzes database schemas and provides AI-powered insights
 * for optimization, data modeling improvements, and migration recommendations.
 */

import { IStorage } from '../../storage';
import { LLMService } from '../llm-service';
import {
  DatabaseType,
  SchemaAnalysisResult,
  TableSchema,
  ColumnSchema,
  IndexSchema,
  ForeignKeySchema,
  ConnectionTestResult,
  ConnectionStatus,
} from './types';
import { queryDatabaseSchema } from './db-adapters';

export class SchemaAnalyzerService {
  private storage: IStorage;
  private llmService?: LLMService;

  constructor(storage: IStorage, llmService?: LLMService) {
    this.storage = storage;
    this.llmService = llmService;
  }

  /**
   * Analyze a database schema
   */
  public async analyzeSchema(
    connectionString: string,
    databaseType: DatabaseType,
    options: any = {}
  ): Promise<SchemaAnalysisResult> {
    try {
      // Log the analysis start
      await this.log(
        'schema_analysis',
        'info',
        `Starting schema analysis for ${databaseType} database`
      );

      // Query database schema using the appropriate adapter
      const rawSchema = await queryDatabaseSchema(connectionString, databaseType, {
        includeViews: options.includeViews !== false,
        includeProcedures: options.includeProcedures,
        includeFunctions: options.includeFunctions,
        includeTriggers: options.includeTriggers,
        includeConstraints: options.includeConstraints !== false,
        tableFilter: options.includeTables,
      });

      // Create the base analysis result
      const result: SchemaAnalysisResult = {
        databaseType,
        tables: rawSchema.tables,
        views: rawSchema.views || [],
        procedures: rawSchema.procedures || [],
        functions: rawSchema.functions || [],
        triggers: rawSchema.triggers || [],
        estimatedSizeMb: rawSchema.estimatedSizeMb,
        dbInfo: rawSchema.databaseInfo,
        analysisTimestamp: new Date().toISOString(),
      };

      // Calculate high-level statistics for each table
      await this.calculateTableStatistics(result);

      // Identify potential schema issues
      await this.identifySchemaIssues(result);

      // Identify potential performance bottlenecks
      await this.identifyPerformanceIssues(result);

      // Generate AI-powered recommendations if requested and LLM service is available
      if (options.useAI && this.llmService) {
        await this.generateAIRecommendations(result);
      }

      // Log the completion of analysis
      await this.log(
        'schema_analysis',
        'info',
        `Completed schema analysis for ${databaseType} database with ${result.tables.length} tables`
      );

      return result;
    } catch (error) {
      // Log the error
      await this.log('schema_analysis', 'error', `Error analyzing schema: ${error.message}`, {
        error: error.stack,
      });

      throw error;
    }
  }

  /**
   * Calculate statistics for tables
   */
  private async calculateTableStatistics(result: SchemaAnalysisResult): Promise<void> {
    // For each table, calculate some basic statistics
    for (const table of result.tables) {
      // Count different column types
      const columnTypes: Record<string, number> = {};
      let nullableColumns = 0;
      let primaryKeyColumns = 0;
      let uniqueColumns = 0;
      let indexedColumns = 0;
      let autoIncrementColumns = 0;

      // Process each column
      for (const column of table.columns) {
        // Count by type
        const normalizedType = column.type.toLowerCase().replace(/\(.*\)/, '');
        columnTypes[normalizedType] = (columnTypes[normalizedType] || 0) + 1;

        // Count nullable
        if (column.nullable) {
          nullableColumns++;
        }

        // Count primary keys
        if (column.isPrimaryKey) {
          primaryKeyColumns++;
        }

        // Count unique
        if (column.isUnique) {
          uniqueColumns++;
        }

        // Count auto increment
        if (column.autoIncrement) {
          autoIncrementColumns++;
        }
      }

      // Count indexed columns
      if (table.indexes) {
        for (const index of table.indexes) {
          indexedColumns += index.columnNames.length;
        }
      }

      // Set the statistics
      table.statistics = {
        totalColumns: table.columns.length,
        columnTypeDistribution: columnTypes,
        nullableColumns,
        primaryKeyColumns,
        uniqueColumns,
        indexedColumns,
        autoIncrementColumns,
        hasForeignKeys: table.foreignKeys?.length > 0,
        foreignKeyCount: table.foreignKeys?.length || 0,
        indexCount: table.indexes?.length || 0,
      };
    }
  }

  /**
   * Identify potential schema issues
   */
  private async identifySchemaIssues(result: SchemaAnalysisResult): Promise<void> {
    // Initialize the schema issues property if it doesn't exist
    result.schemaIssues = {
      tablesWithoutPrimaryKey: [],
      columnsWithoutType: [],
      inconsistentNaming: [],
      redundantIndexes: [],
      missingIndexes: [],
      circularDependencies: [],
    };

    // Process each table
    for (const table of result.tables) {
      // Check for tables without primary key
      const hasPrimaryKey =
        table.columns.some(c => c.isPrimaryKey) ||
        (table.primaryKey && table.primaryKey.length > 0);

      if (!hasPrimaryKey) {
        result.schemaIssues.tablesWithoutPrimaryKey.push({
          tableName: table.name,
          issue: 'No primary key defined',
          recommendation:
            'Add a primary key to ensure data integrity and improve query performance',
        });
      }

      // Check for columns without type
      for (const column of table.columns) {
        if (!column.type || column.type.trim() === '') {
          result.schemaIssues.columnsWithoutType.push({
            tableName: table.name,
            columnName: column.name,
            issue: 'Column has no type defined',
            recommendation: 'Define a data type for this column',
          });
        }
      }

      // Check for inconsistent naming patterns
      this.checkInconsistentNaming(table, result.schemaIssues.inconsistentNaming);

      // Check for redundant indexes
      this.checkRedundantIndexes(table, result.schemaIssues.redundantIndexes);

      // Check for missing indexes on foreign keys
      this.checkMissingIndexes(table, result.schemaIssues.missingIndexes);
    }

    // Check for circular dependencies
    this.checkCircularDependencies(result.tables, result.schemaIssues.circularDependencies);
  }

  /**
   * Check for inconsistent naming patterns
   */
  private checkInconsistentNaming(
    table: TableSchema,
    inconsistentNaming: Array<{ tableName: string; issue: string; recommendation: string }>
  ): void {
    // Different naming conventions
    const namingStyles = {
      snakeCase: /^[a-z]+(_[a-z]+)*$/,
      camelCase: /^[a-z]+([A-Z][a-z]*)*$/,
      pascalCase: /^[A-Z][a-z]*([A-Z][a-z]*)*$/,
      kebabCase: /^[a-z]+(-[a-z]+)*$/,
    };

    // Check table name
    let tableStyle = '';
    for (const [style, pattern] of Object.entries(namingStyles)) {
      if (pattern.test(table.name)) {
        tableStyle = style;
        break;
      }
    }

    // Check column names
    const columnStyles: Record<string, number> = {};
    for (const column of table.columns) {
      for (const [style, pattern] of Object.entries(namingStyles)) {
        if (pattern.test(column.name)) {
          columnStyles[style] = (columnStyles[style] || 0) + 1;
          break;
        }
      }
    }

    // If there's more than one style, report it
    const styles = Object.keys(columnStyles);
    if (styles.length > 1) {
      inconsistentNaming.push({
        tableName: table.name,
        issue: `Inconsistent column naming conventions: ${styles.join(', ')}`,
        recommendation: 'Standardize naming conventions across all columns',
      });
    }

    // If table style doesn't match dominant column style
    if (tableStyle && styles.length > 0) {
      const dominantStyle = Object.entries(columnStyles).sort(([, a], [, b]) => b - a)[0][0];

      if (tableStyle !== dominantStyle) {
        inconsistentNaming.push({
          tableName: table.name,
          issue: `Table name uses ${tableStyle}, but columns predominantly use ${dominantStyle}`,
          recommendation: 'Use consistent naming style for tables and columns',
        });
      }
    }
  }

  /**
   * Check for redundant indexes
   */
  private checkRedundantIndexes(
    table: TableSchema,
    redundantIndexes: Array<{
      tableName: string;
      indexName: string;
      issue: string;
      recommendation: string;
    }>
  ): void {
    // If the table has no indexes, nothing to check
    if (!table.indexes || table.indexes.length <= 1) {
      return;
    }

    // Check each index against others
    for (let i = 0; i < table.indexes.length; i++) {
      const index = table.indexes[i];

      for (let j = i + 1; j < table.indexes.length; j++) {
        const otherIndex = table.indexes[j];

        // Skip if one index is unique and the other is not
        if (index.isUnique !== otherIndex.isUnique) {
          continue;
        }

        // Case 1: This index's columns are a prefix of the other index
        if (isPrefix(index.columnNames, otherIndex.columnNames)) {
          redundantIndexes.push({
            tableName: table.name,
            indexName: index.name,
            issue: `Index ${index.name} is redundant because its columns are a prefix of index ${otherIndex.name}`,
            recommendation: `Consider removing index ${index.name}`,
          });
        }
        // Case 2: Other index's columns are a prefix of this index
        else if (isPrefix(otherIndex.columnNames, index.columnNames)) {
          redundantIndexes.push({
            tableName: table.name,
            indexName: otherIndex.name,
            issue: `Index ${otherIndex.name} is redundant because its columns are a prefix of index ${index.name}`,
            recommendation: `Consider removing index ${otherIndex.name}`,
          });
        }
      }
    }

    // Helper function to check if array a is a prefix of array b
    function isPrefix(a: string[], b: string[]): boolean {
      if (a.length > b.length) {
        return false;
      }

      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return false;
        }
      }

      return true;
    }
  }

  /**
   * Check for missing indexes on foreign keys
   */
  private checkMissingIndexes(
    table: TableSchema,
    missingIndexes: Array<{
      tableName: string;
      columnNames: string[];
      issue: string;
      recommendation: string;
    }>
  ): void {
    // If the table has no foreign keys, nothing to check
    if (!table.foreignKeys || table.foreignKeys.length === 0) {
      return;
    }

    // Get all indexed columns
    const indexedColumns = new Set<string>();
    if (table.indexes) {
      for (const index of table.indexes) {
        for (const column of index.columnNames) {
          indexedColumns.add(column);
        }
      }
    }

    // Check each foreign key
    for (const fk of table.foreignKeys) {
      // Check if all FK columns are covered by an index
      const missingIndexColumns = fk.columnNames.filter(col => !indexedColumns.has(col));

      if (missingIndexColumns.length > 0) {
        missingIndexes.push({
          tableName: table.name,
          columnNames: missingIndexColumns,
          issue: `Foreign key columns ${missingIndexColumns.join(', ')} have no index`,
          recommendation: `Create an index on columns ${missingIndexColumns.join(', ')} to improve join performance`,
        });
      }
    }
  }

  /**
   * Check for circular dependencies between tables
   */
  private checkCircularDependencies(
    tables: TableSchema[],
    circularDependencies: Array<{ tablesInvolved: string[]; issue: string; recommendation: string }>
  ): void {
    // Build a graph of table dependencies
    const graph: Record<string, string[]> = {};

    // Initialize the graph with empty adjacency lists
    for (const table of tables) {
      graph[table.name] = [];
    }

    // Add edges based on foreign keys
    for (const table of tables) {
      if (table.foreignKeys) {
        for (const fk of table.foreignKeys) {
          graph[table.name].push(fk.referencedTableName);
        }
      }
    }

    // Check for cycles using DFS
    const visited: Record<string, boolean> = {};
    const recursionStack: Record<string, boolean> = {};

    const detectCycle = (node: string, path: string[]): string[] | null => {
      visited[node] = true;
      recursionStack[node] = true;
      path.push(node);

      for (const neighbor of graph[node] || []) {
        if (!visited[neighbor]) {
          const cyclePath = detectCycle(neighbor, [...path]);
          if (cyclePath) {
            return cyclePath;
          }
        } else if (recursionStack[neighbor]) {
          return [...path, neighbor];
        }
      }

      recursionStack[node] = false;
      return null;
    };

    // Check each unvisited node
    for (const table of tables) {
      if (!visited[table.name]) {
        const cyclePath = detectCycle(table.name, []);
        if (cyclePath) {
          // Find the start of the cycle
          const cycleStart = cyclePath.indexOf(cyclePath[cyclePath.length - 1]);
          const cycle = cyclePath.slice(cycleStart);

          circularDependencies.push({
            tablesInvolved: cycle,
            issue: `Circular dependency detected between tables: ${cycle.join(' -> ')}`,
            recommendation:
              'Consider breaking the circular dependency or ensuring proper deletion order',
          });

          // No need to check more cycles for this starting node
          break;
        }
      }
    }
  }

  /**
   * Identify potential performance issues
   */
  private async identifyPerformanceIssues(result: SchemaAnalysisResult): Promise<void> {
    // Initialize the performance issues property if it doesn't exist
    result.performanceIssues = {
      tablesWithoutIndexes: [],
      wideIndexes: [],
      largeTextColumnsWithoutIndexes: [],
      tablesWithoutPrimaryKey: [],
      inefficientDataTypes: [],
      highCardinalityTextColumns: [],
    };

    // Process each table
    for (const table of result.tables) {
      // Check for tables without indexes
      if (!table.indexes || table.indexes.length === 0) {
        result.performanceIssues.tablesWithoutIndexes.push({
          tableName: table.name,
          issue: 'Table has no indexes',
          recommendation: 'Add appropriate indexes based on query patterns',
        });
      }

      // Check for wide indexes (indexes with many columns)
      if (table.indexes) {
        for (const index of table.indexes) {
          if (index.columnNames.length > 3) {
            // Arbitrary threshold, could be configurable
            result.performanceIssues.wideIndexes.push({
              tableName: table.name,
              indexName: index.name,
              issue: `Wide index with ${index.columnNames.length} columns`,
              recommendation: 'Consider reducing the number of columns in the index',
            });
          }
        }
      }

      // Check for inefficient data types
      for (const column of table.columns) {
        // Check for large text columns without indexes
        if (isTextType(column.type) && isLargeTextType(column.type)) {
          const isIndexed = table.indexes?.some(idx => idx.columnNames.includes(column.name));

          if (!isIndexed) {
            result.performanceIssues.largeTextColumnsWithoutIndexes.push({
              tableName: table.name,
              columnName: column.name,
              issue: `Large text column without an index`,
              recommendation:
                'Consider adding a functional or partial index if this column is used in search conditions',
            });
          }
        }

        // Check for inefficient data types
        if (isInefficient(column.type, column.name)) {
          result.performanceIssues.inefficientDataTypes.push({
            tableName: table.name,
            columnName: column.name,
            issue: `Potentially inefficient data type: ${column.type}`,
            recommendation: getRecommendationType(column.type, column.name),
          });
        }

        // Check for high cardinality text columns (this is an approximation)
        if (
          isTextType(column.type) &&
          !isLargeTextType(column.type) &&
          (column.isUnique || isProbablyHighCardinality(column.name))
        ) {
          result.performanceIssues.highCardinalityTextColumns.push({
            tableName: table.name,
            columnName: column.name,
            issue: `High cardinality text column, potential for inefficient string comparisons`,
            recommendation:
              'Consider using hash indexes or materialized views for frequent queries on this column',
          });
        }
      }
    }

    // Helper functions
    function isTextType(type: string): boolean {
      const t = type.toLowerCase();
      return (
        t.includes('text') || t.includes('char') || t.includes('varchar') || t.includes('string')
      );
    }

    function isLargeTextType(type: string): boolean {
      const t = type.toLowerCase();
      return (
        t === 'text' ||
        t === 'longtext' ||
        t === 'mediumtext' ||
        t === 'clob' ||
        t.includes('varchar(max)') ||
        t.includes('nvarchar(max)')
      );
    }

    function isInefficient(type: string, columnName: string): boolean {
      const t = type.toLowerCase();

      // Inefficient numeric types
      if (
        (t === 'float' || t === 'real' || t === 'double') &&
        (columnName.toLowerCase().includes('price') ||
          columnName.toLowerCase().includes('amount') ||
          columnName.toLowerCase().includes('cost'))
      ) {
        return true;
      }

      // Inefficient character types
      if (t.includes('varchar') && !t.includes('(') && !t.includes('max')) {
        return true;
      }

      // Inefficient date types
      if (
        t === 'datetime' &&
        columnName.toLowerCase().includes('date') &&
        !columnName.toLowerCase().includes('time')
      ) {
        return true;
      }

      return false;
    }

    function getRecommendationType(type: string, columnName: string): string {
      const t = type.toLowerCase();

      // Recommendations for numeric types
      if (
        (t === 'float' || t === 'real' || t === 'double') &&
        (columnName.toLowerCase().includes('price') ||
          columnName.toLowerCase().includes('amount') ||
          columnName.toLowerCase().includes('cost'))
      ) {
        return 'For monetary values, consider using a fixed-point type like DECIMAL/NUMERIC to avoid rounding errors';
      }

      // Recommendations for character types
      if (t.includes('varchar') && !t.includes('(') && !t.includes('max')) {
        return 'Specify a maximum length for the VARCHAR column to optimize storage';
      }

      // Recommendations for date types
      if (
        t === 'datetime' &&
        columnName.toLowerCase().includes('date') &&
        !columnName.toLowerCase().includes('time')
      ) {
        return 'If only date precision is needed, consider using DATE type instead of DATETIME';
      }

      return 'Consider reviewing this data type for efficiency';
    }

    function isProbablyHighCardinality(columnName: string): boolean {
      const name = columnName.toLowerCase();
      return (
        name.includes('name') ||
        name.includes('title') ||
        name.includes('email') ||
        name.includes('address') ||
        name.includes('key') ||
        name.includes('token') ||
        name.includes('url') ||
        name.includes('path')
      );
    }
  }

  /**
   * Generate AI-powered recommendations for schema optimization
   */
  private async generateAIRecommendations(result: SchemaAnalysisResult): Promise<void> {
    if (!this.llmService) {
      return;
    }

    try {
      // Log that we're generating AI recommendations
      await this.log('schema_analysis', 'info', 'Generating AI-powered schema recommendations');

      // Prepare a simplified version of the schema for the AI
      const simplifiedSchema = {
        databaseType: result.databaseType,
        tables: result.tables.map(table => ({
          name: table.name,
          columns: table.columns.map(col => ({
            name: col.name,
            type: col.type,
            nullable: col.nullable,
            isPrimaryKey: col.isPrimaryKey,
            isUnique: col.isUnique,
          })),
          foreignKeys: table.foreignKeys,
          primaryKey: table.primaryKey,
        })),
        views: result.views.map(view => ({
          name: view.name,
          definition: view.definition,
        })),
      };

      // Create prompts for different AI analysis tasks
      const indexOptimizationPrompt = `
        Analyze this database schema and suggest optimizations for indexes:
        ${JSON.stringify(simplifiedSchema, null, 2)}
        
        Focus on:
        1. Suggesting new indexes that could improve performance
        2. Identifying indexes that could be removed
        3. Recommending covering indexes for common query patterns
        
        Format your response as JSON with the following structure:
        {
          "suggestedIndexes": [
            {
              "tableName": "table_name",
              "columns": ["column1", "column2"],
              "reason": "Reason for suggesting this index"
            }
          ],
          "indexesToRemove": [
            {
              "tableName": "table_name",
              "indexName": "index_name",
              "reason": "Reason for removing this index"
            }
          ],
          "coveringIndexes": [
            {
              "tableName": "table_name",
              "columns": ["column1", "column2", "column3"],
              "queryPattern": "Description of query pattern",
              "benefit": "Performance benefit description"
            }
          ]
        }
      `;

      const dataModelImprovementsPrompt = `
        Analyze this database schema and suggest improvements to the data model:
        ${JSON.stringify(simplifiedSchema, null, 2)}
        
        Focus on:
        1. Identifying potential normalization issues
        2. Suggesting new tables to better organize data
        3. Identifying redundant columns or tables
        4. Recommending better data types
        
        Format your response as JSON with the following structure:
        {
          "normalizationIssues": [
            {
              "tableName": "table_name",
              "issue": "Description of the normalization issue",
              "recommendation": "How to fix the issue"
            }
          ],
          "suggestedTables": [
            {
              "tableName": "new_table_name",
              "columns": [
                {"name": "column1", "type": "type1", "purpose": "description"}
              ],
              "reason": "Reason for suggesting this table"
            }
          ],
          "redundancies": [
            {
              "tableName": "table_name",
              "columnName": "column_name",
              "issue": "Why this is redundant",
              "recommendation": "What to do about it"
            }
          ],
          "dataTypeImprovements": [
            {
              "tableName": "table_name",
              "columnName": "column_name",
              "currentType": "current_type",
              "suggestedType": "suggested_type",
              "reason": "Reason for the suggestion"
            }
          ]
        }
      `;

      // Make parallel API calls to the LLM service
      const [indexOptimizationResponse, dataModelResponse] = await Promise.all([
        this.llmService.generateContent(indexOptimizationPrompt),
        this.llmService.generateContent(dataModelImprovementsPrompt),
      ]);

      // Parse the responses
      try {
        const indexOptimizations = JSON.parse(indexOptimizationResponse);
        result.aiSuggestedIndexes = indexOptimizations.suggestedIndexes || [];
        result.aiIndexesToRemove = indexOptimizations.indexesToRemove || [];
        result.aiCoveringIndexes = indexOptimizations.coveringIndexes || [];
      } catch (parseError) {
        console.error('Error parsing index optimization response:', parseError);
      }

      try {
        const dataModelImprovements = JSON.parse(dataModelResponse);
        result.aiNormalizationIssues = dataModelImprovements.normalizationIssues || [];
        result.aiSuggestedTables = dataModelImprovements.suggestedTables || [];
        result.aiRedundancies = dataModelImprovements.redundancies || [];
        result.aiDataTypeImprovements = dataModelImprovements.dataTypeImprovements || [];
      } catch (parseError) {
        console.error('Error parsing data model improvements response:', parseError);
      }

      // Add AI recommendations to individual tables
      for (const table of result.tables) {
        // Add suggested indexes for this table
        table.aiSuggestedIndexes =
          result.aiSuggestedIndexes?.filter(idx => idx.tableName === table.name) || [];

        // Add suggested data type improvements for this table
        table.aiSuggestedDataTypes =
          result.aiDataTypeImprovements?.filter(imp => imp.tableName === table.name) || [];

        // Add normalization suggestions for this table
        table.aiNormalizationSuggestions =
          result.aiNormalizationIssues?.filter(issue => issue.tableName === table.name) || [];

        // Add suggested columns (from suggested tables that might relate to this one)
        table.aiSuggestedColumns = [];

        // Add suggested relationships
        table.aiSuggestedRelationships = [];
      }

      // Log completion of AI recommendations
      await this.log(
        'schema_analysis',
        'info',
        'Completed generating AI-powered schema recommendations'
      );
    } catch (error) {
      // Log the error but don't halt the process
      await this.log(
        'schema_analysis',
        'warning',
        `Error generating AI recommendations: ${error.message}`,
        { error: error.stack }
      );
    }
  }

  /**
   * Test a database connection
   */
  public async testConnection(
    connectionString: string,
    databaseType: DatabaseType
  ): Promise<ConnectionTestResult> {
    try {
      // Log the connection test start
      await this.log('connection_test', 'info', `Testing connection to ${databaseType} database`);

      // Query database info using the appropriate adapter with testConnectionOnly flag
      const result = await queryDatabaseSchema(connectionString, databaseType, {
        testConnectionOnly: true,
      });

      // Log the connection test completion
      await this.log(
        'connection_test',
        'info',
        `Successfully connected to ${databaseType} database: ${result.databaseInfo.name}`
      );

      return {
        status: ConnectionStatus.Success,
        databaseName: result.databaseInfo.name,
        databaseVersion: result.databaseInfo.version,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Log the connection error
      await this.log('connection_test', 'error', `Connection test failed: ${error.message}`, {
        error: error.stack,
      });

      return {
        status: ConnectionStatus.Failed,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get information about a database type
   */
  public getDatabaseTypeInfo(databaseType: DatabaseType): any {
    const databaseTypeInfo = {
      [DatabaseType.PostgreSQL]: {
        name: 'PostgreSQL',
        description: 'An advanced open-source relational database management system',
        features: [
          'ACID compliance',
          'JSON support',
          'Full-text search',
          'Geospatial data support',
          'Advanced indexing options',
        ],
        connectionStringTemplate: 'postgresql://username:password@host:port/database',
        commonDrivers: ['pg', 'node-postgres', 'sequelize-pg', 'prisma-postgresql'],
        datatypes: {
          text: ['varchar', 'text', 'char'],
          numeric: [
            'integer',
            'smallint',
            'bigint',
            'decimal',
            'numeric',
            'real',
            'double precision',
          ],
          boolean: ['boolean'],
          datetime: ['date', 'time', 'timestamp', 'timestamptz', 'interval'],
          json: ['json', 'jsonb'],
          binary: ['bytea'],
          special: ['uuid', 'inet', 'cidr', 'macaddr', 'point', 'line', 'circle'],
        },
      },
      [DatabaseType.MySQL]: {
        name: 'MySQL',
        description: 'A popular open-source relational database management system',
        features: [
          'ACID compliance',
          'JSON support',
          'Full-text search',
          'Replication',
          'Partitioning',
        ],
        connectionStringTemplate: 'mysql://username:password@host:port/database',
        commonDrivers: ['mysql2', 'sequelize-mysql', 'prisma-mysql'],
        datatypes: {
          text: ['VARCHAR', 'TEXT', 'CHAR', 'ENUM'],
          numeric: ['INT', 'SMALLINT', 'BIGINT', 'DECIMAL', 'FLOAT', 'DOUBLE'],
          boolean: ['BOOLEAN', 'TINYINT(1)'],
          datetime: ['DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'YEAR'],
          json: ['JSON'],
          binary: ['BLOB', 'BINARY'],
          special: ['GEOMETRY', 'POINT', 'LINESTRING', 'POLYGON'],
        },
      },
      [DatabaseType.SQLite]: {
        name: 'SQLite',
        description: 'A lightweight, file-based relational database',
        features: [
          'Serverless',
          'Zero configuration',
          'Single file database',
          'Cross-platform',
          'Self-contained',
        ],
        connectionStringTemplate: 'file:path/to/database.sqlite',
        commonDrivers: ['sqlite3', 'sequelize-sqlite', 'prisma-sqlite'],
        datatypes: {
          text: ['TEXT'],
          numeric: ['INTEGER', 'REAL'],
          boolean: ['INTEGER'],
          datetime: ['TEXT', 'INTEGER'],
          json: ['TEXT'],
          binary: ['BLOB'],
          special: [],
        },
      },
      [DatabaseType.SQLServer]: {
        name: 'SQL Server',
        description: "Microsoft's enterprise relational database management system",
        features: [
          'ACID compliance',
          'JSON support',
          'Full-text search',
          'In-memory OLTP',
          'Columnstore indexes',
        ],
        connectionStringTemplate:
          'Server=host,port;Database=database;User Id=username;Password=password;',
        commonDrivers: ['mssql', 'tedious', 'sequelize-mssql', 'prisma-sqlserver'],
        datatypes: {
          text: ['VARCHAR', 'NVARCHAR', 'CHAR', 'NCHAR', 'TEXT', 'NTEXT'],
          numeric: ['INT', 'SMALLINT', 'BIGINT', 'DECIMAL', 'NUMERIC', 'FLOAT', 'REAL', 'MONEY'],
          boolean: ['BIT'],
          datetime: ['DATE', 'TIME', 'DATETIME', 'DATETIME2', 'DATETIMEOFFSET', 'SMALLDATETIME'],
          json: ['NVARCHAR(MAX)'],
          binary: ['BINARY', 'VARBINARY', 'IMAGE'],
          special: ['UNIQUEIDENTIFIER', 'XML', 'HIERARCHYID', 'GEOGRAPHY', 'GEOMETRY'],
        },
      },
      [DatabaseType.MongoDB]: {
        name: 'MongoDB',
        description: 'A document-oriented NoSQL database',
        features: [
          'Document-based',
          'Schemaless',
          'High availability',
          'Horizontal scaling',
          'Aggregation framework',
        ],
        connectionStringTemplate: 'mongodb://username:password@host:port/database',
        commonDrivers: ['mongodb', 'mongoose', 'prisma-mongodb'],
        datatypes: {
          text: ['String'],
          numeric: ['Number', 'Decimal128', 'Int32', 'Int64'],
          boolean: ['Boolean'],
          datetime: ['Date'],
          json: ['Object', 'Array'],
          binary: ['Buffer', 'Binary'],
          special: ['ObjectId', 'RegExp', 'Symbol'],
        },
      },
      [DatabaseType.Oracle]: {
        name: 'Oracle',
        description: "Oracle's enterprise relational database management system",
        features: [
          'ACID compliance',
          'High availability',
          'Partitioning',
          'Parallel processing',
          'Advanced security features',
        ],
        connectionStringTemplate: 'oracle://username:password@host:port/service',
        commonDrivers: ['oracledb', 'node-oracledb', 'sequelize-oracle'],
        datatypes: {
          text: ['VARCHAR2', 'CHAR', 'NVARCHAR2', 'NCHAR', 'CLOB', 'NCLOB'],
          numeric: ['NUMBER', 'FLOAT', 'BINARY_FLOAT', 'BINARY_DOUBLE'],
          boolean: ['NUMBER(1)'],
          datetime: ['DATE', 'TIMESTAMP', 'INTERVAL YEAR TO MONTH', 'INTERVAL DAY TO SECOND'],
          json: ['CLOB'],
          binary: ['BLOB', 'BFILE', 'RAW', 'LONG RAW'],
          special: ['XMLTYPE', 'ROWID', 'UROWID'],
        },
      },
      [DatabaseType.DynamoDB]: {
        name: 'DynamoDB',
        description: "Amazon's fully managed NoSQL database service",
        features: [
          'Fully managed',
          'Serverless',
          'Auto scaling',
          'Global tables',
          'Point-in-time recovery',
        ],
        connectionStringTemplate: 'AWS configuration required',
        commonDrivers: ['aws-sdk', 'dynamodb-doc', 'dynamoose'],
        datatypes: {
          text: ['String'],
          numeric: ['Number'],
          boolean: ['Boolean'],
          datetime: ['String'],
          json: ['Map', 'List'],
          binary: ['Binary'],
          special: ['Set'],
        },
      },
      [DatabaseType.Cassandra]: {
        name: 'Cassandra',
        description: 'A distributed NoSQL database designed for scalability and high availability',
        features: [
          'Distributed',
          'Linear scalability',
          'Fault-tolerant',
          'Tunable consistency',
          'CQL query language',
        ],
        connectionStringTemplate:
          'cassandra-contact-points=host1,host2;cassandra-port=port;cassandra-keyspace=keyspace',
        commonDrivers: ['cassandra-driver', 'datastax-driver'],
        datatypes: {
          text: ['text', 'varchar', 'ascii'],
          numeric: ['int', 'bigint', 'float', 'double', 'decimal', 'varint'],
          boolean: ['boolean'],
          datetime: ['timestamp', 'date', 'time'],
          json: ['map', 'list', 'set'],
          binary: ['blob'],
          special: ['uuid', 'timeuuid', 'inet', 'counter'],
        },
      },
    };

    return (
      databaseTypeInfo[databaseType] || {
        name: databaseType,
        description: 'Database type information not available',
        features: [],
        connectionStringTemplate: '',
        commonDrivers: [],
        datatypes: {},
      }
    );
  }

  /**
   * Get supported database types
   */
  public getSupportedDatabaseTypes(): any[] {
    return [
      {
        id: DatabaseType.PostgreSQL,
        name: 'PostgreSQL',
        description: 'An advanced open-source relational database management system',
        supportLevel: 'Full',
      },
      {
        id: DatabaseType.MySQL,
        name: 'MySQL',
        description: 'A popular open-source relational database management system',
        supportLevel: 'Full',
      },
      {
        id: DatabaseType.SQLite,
        name: 'SQLite',
        description: 'A lightweight, file-based relational database',
        supportLevel: 'Full',
      },
      {
        id: DatabaseType.SQLServer,
        name: 'SQL Server',
        description: "Microsoft's enterprise relational database management system",
        supportLevel: 'Full',
      },
      {
        id: DatabaseType.MongoDB,
        name: 'MongoDB',
        description: 'A document-oriented NoSQL database',
        supportLevel: 'Full',
      },
      {
        id: DatabaseType.Oracle,
        name: 'Oracle',
        description: "Oracle's enterprise relational database management system",
        supportLevel: 'Partial',
      },
      {
        id: DatabaseType.DynamoDB,
        name: 'DynamoDB',
        description: "Amazon's fully managed NoSQL database service",
        supportLevel: 'Partial',
      },
      {
        id: DatabaseType.Cassandra,
        name: 'Cassandra',
        description: 'A distributed NoSQL database designed for scalability and high availability',
        supportLevel: 'Partial',
      },
      {
        id: DatabaseType.Redis,
        name: 'Redis',
        description: 'An in-memory data structure store',
        supportLevel: 'Basic',
      },
      {
        id: DatabaseType.ElasticSearch,
        name: 'Elasticsearch',
        description: 'A distributed search and analytics engine',
        supportLevel: 'Basic',
      },
      {
        id: DatabaseType.Neo4j,
        name: 'Neo4j',
        description: 'A graph database management system',
        supportLevel: 'Basic',
      },
      {
        id: DatabaseType.Firestore,
        name: 'Firestore',
        description: "Google's flexible, scalable database for mobile, web, and server development",
        supportLevel: 'Basic',
      },
      {
        id: DatabaseType.CosmosDB,
        name: 'Cosmos DB',
        description: "Microsoft's globally distributed, multi-model database service",
        supportLevel: 'Basic',
      },
    ];
  }

  /**
   * Log a message
   */
  private async log(stage: string, level: string, message: string, details?: any): Promise<void> {
    try {
      await this.storage.createDatabaseConversionLog({
        projectId: 'system',
        level,
        stage,
        message,
        details,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error logging to database conversion logs:', error);
      // Continue execution even if logging fails
    }
  }
}
