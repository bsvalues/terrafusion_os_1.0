/**
 * Schema Analyzer Service
 * 
 * This service is responsible for analyzing database schemas and providing
 * insights into the structure of databases. It's used by the Database Conversion
 * Agent to understand the source and target databases.
 */

import { 
  ConnectionTestResult, 
  SchemaAnalysisResult, 
  DatabaseType, 
  TableSchema,
  ColumnSchema,
  ConnectionStatus
} from './types';
import { IStorage } from '../../storage';
import { LLMService } from '../llm-service';
import { queryDatabaseSchema } from './db-adapters';

export interface SchemaAnalyzerOptions {
  depth?: 'basic' | 'standard' | 'deep';
  includeTables?: string[];
  excludeTables?: string[];
  includeViews?: boolean;
  includeProcedures?: boolean;
  includeFunctions?: boolean;
  includeTriggers?: boolean;
  includeConstraints?: boolean;
  useAI?: boolean;
}

export class SchemaAnalyzerService {
  private storage: IStorage;
  private llmService?: LLMService;

  constructor(storage: IStorage, llmService?: LLMService) {
    this.storage = storage;
    this.llmService = llmService;
  }

  /**
   * Test connection to a database
   */
  public async testConnection(
    connectionString: string,
    databaseType: DatabaseType
  ): Promise<ConnectionTestResult> {
    try {
      // Use the appropriate database adapter to test the connection
      const result = await queryDatabaseSchema(connectionString, databaseType, {
        testConnectionOnly: true
      });

      return {
        status: ConnectionStatus.Success,
        message: 'Connection successful',
        timestamp: new Date(),
        databaseInfo: result.databaseInfo
      };
    } catch (error) {
      return {
        status: ConnectionStatus.Failed,
        message: error.message,
        timestamp: new Date(),
        details: error
      };
    }
  }

  /**
   * Analyze a database schema
   */
  public async analyzeSchema(
    connectionString: string,
    databaseType: DatabaseType,
    options: SchemaAnalyzerOptions = {}
  ): Promise<SchemaAnalysisResult> {
    // Determine analysis depth
    const depth = options.depth || 'standard';
    
    // Query the database schema using the appropriate adapter
    const schemaData = await queryDatabaseSchema(connectionString, databaseType, {
      includeViews: options.includeViews !== false,
      includeProcedures: depth === 'deep' && options.includeProcedures !== false,
      includeFunctions: depth === 'deep' && options.includeFunctions !== false,
      includeTriggers: depth === 'deep' && options.includeTriggers !== false,
      includeConstraints: options.includeConstraints !== false,
      tableFilter: options.includeTables || []
    });
    
    // Filter tables if needed
    let tables = schemaData.tables;
    if (options.includeTables && options.includeTables.length > 0) {
      tables = tables.filter(table => options.includeTables!.includes(table.name));
    }
    if (options.excludeTables && options.excludeTables.length > 0) {
      tables = tables.filter(table => !options.excludeTables!.includes(table.name));
    }
    
    // Prepare statistics
    const statistics = {
      totalTables: tables.length,
      totalViews: schemaData.views.length,
      totalProcedures: schemaData.procedures.length,
      totalFunctions: schemaData.functions.length,
      totalTriggers: schemaData.triggers.length,
      totalConstraints: schemaData.constraints.length,
      estimatedSizeMb: schemaData.estimatedSizeMb
    };
    
    // Use AI to enhance schema analysis if requested and available
    if (options.useAI && this.llmService && depth === 'deep') {
      await this.enhanceSchemaWithAI(tables, databaseType);
    }
    
    // Return the schema analysis result
    return {
      databaseType,
      timestamp: new Date(),
      tables,
      views: schemaData.views,
      procedures: schemaData.procedures,
      functions: schemaData.functions,
      triggers: schemaData.triggers,
      constraints: schemaData.constraints,
      statistics
    };
  }

  /**
   * Enhance schema analysis with AI
   */
  private async enhanceSchemaWithAI(tables: TableSchema[], databaseType: DatabaseType): Promise<void> {
    if (!this.llmService) return;
    
    // We could process tables in parallel for better performance
    for (const table of tables) {
      // Skip tables with few columns
      if (table.columns.length <= 2) continue;
      
      try {
        // Generate a prompt for the LLM to analyze the table schema
        const prompt = this.generateTableAnalysisPrompt(table, databaseType);
        
        // Get analysis from LLM
        const analysis = await this.llmService.generateContent(prompt, {
          temperature: 0.2, // Lower temperature for more focused, deterministic responses
          model: 'gpt-4o' // Use the latest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        });
        
        // Parse the analysis and enhance the table schema
        this.applySchemaEnhancements(table, analysis);
      } catch (error) {
        console.error(`Error enhancing schema with AI for table ${table.name}:`, error);
        // Continue with other tables even if one fails
      }
    }
  }

  /**
   * Generate a prompt for table schema analysis
   */
  private generateTableAnalysisPrompt(table: TableSchema, databaseType: DatabaseType): string {
    // Format the table schema as JSON for the prompt
    const tableJson = JSON.stringify({
      name: table.name,
      columns: table.columns.map(col => ({
        name: col.name,
        type: col.type,
        nullable: col.nullable,
        isPrimaryKey: col.isPrimaryKey,
        isForeignKey: col.isForeignKey,
        isUnique: col.isUnique
      }))
    }, null, 2);
    
    return `
You are a database schema expert. Analyze this ${databaseType} table schema and provide insights:

${tableJson}

Please provide the following in JSON format:
1. Potential indexes that would improve performance
2. Suggested data types that might be more appropriate
3. Normalization suggestions if you detect any potential issues
4. Any missing columns that are typically included in this type of table
5. Potential foreign key relationships that might be missing

Format your response as valid JSON with these keys: "indexes", "dataTypes", "normalization", "missingColumns", "relationships"
`;
  }

  /**
   * Apply schema enhancements from AI analysis
   */
  private applySchemaEnhancements(table: TableSchema, analysis: string): void {
    try {
      // Try to parse the response as JSON
      const enhancements = JSON.parse(analysis);
      
      // Apply enhancements to the table schema
      if (enhancements.indexes && Array.isArray(enhancements.indexes)) {
        table['aiSuggestedIndexes'] = enhancements.indexes;
      }
      
      if (enhancements.dataTypes && typeof enhancements.dataTypes === 'object') {
        table['aiSuggestedDataTypes'] = enhancements.dataTypes;
      }
      
      if (enhancements.normalization && Array.isArray(enhancements.normalization)) {
        table['aiNormalizationSuggestions'] = enhancements.normalization;
      }
      
      if (enhancements.missingColumns && Array.isArray(enhancements.missingColumns)) {
        table['aiSuggestedColumns'] = enhancements.missingColumns;
      }
      
      if (enhancements.relationships && Array.isArray(enhancements.relationships)) {
        table['aiSuggestedRelationships'] = enhancements.relationships;
      }
    } catch (error) {
      console.error(`Error parsing AI analysis for table ${table.name}:`, error);
    }
  }

  /**
   * Compare two database schemas and identify differences
   */
  public async compareSchemas(
    sourceSchema: SchemaAnalysisResult,
    targetSchema: SchemaAnalysisResult
  ): Promise<any> {
    // Analyze table differences
    const tableDifferences = this.compareTableStructures(sourceSchema.tables, targetSchema.tables);
    
    // Analyze view differences if included in both schemas
    const viewDifferences = this.compareViews(sourceSchema.views, targetSchema.views);
    
    // Analyze other schema objects if in deep mode
    const procedureDifferences = this.compareSchemaObjects(
      sourceSchema.procedures, 
      targetSchema.procedures, 
      'name'
    );
    
    const functionDifferences = this.compareSchemaObjects(
      sourceSchema.functions, 
      targetSchema.functions, 
      'name'
    );
    
    const triggerDifferences = this.compareSchemaObjects(
      sourceSchema.triggers, 
      targetSchema.triggers, 
      'name'
    );
    
    return {
      tables: tableDifferences,
      views: viewDifferences,
      procedures: procedureDifferences,
      functions: functionDifferences,
      triggers: triggerDifferences,
      summary: {
        tablesOnlyInSource: tableDifferences.onlyInSource.length,
        tablesOnlyInTarget: tableDifferences.onlyInTarget.length,
        tablesWithDifferences: tableDifferences.different.length,
        viewsOnlyInSource: viewDifferences.onlyInSource.length,
        viewsOnlyInTarget: viewDifferences.onlyInTarget.length,
        viewsWithDifferences: viewDifferences.different.length,
        proceduresOnlyInSource: procedureDifferences.onlyInSource.length,
        proceduresOnlyInTarget: procedureDifferences.onlyInTarget.length,
        functionsOnlyInSource: functionDifferences.onlyInSource.length,
        functionsOnlyInTarget: functionDifferences.onlyInTarget.length,
        triggersOnlyInSource: triggerDifferences.onlyInSource.length,
        triggersOnlyInTarget: triggerDifferences.onlyInTarget.length
      }
    };
  }

  /**
   * Compare table structures between schemas
   */
  private compareTableStructures(sourceTables: TableSchema[], targetTables: TableSchema[]): any {
    // Create maps for faster lookups
    const sourceTablesMap = new Map(sourceTables.map(table => [table.name, table]));
    const targetTablesMap = new Map(targetTables.map(table => [table.name, table]));
    
    // Find tables only in source
    const onlyInSource = sourceTables.filter(table => !targetTablesMap.has(table.name));
    
    // Find tables only in target
    const onlyInTarget = targetTables.filter(table => !sourceTablesMap.has(table.name));
    
    // Find tables in both, but with differences
    const different = [];
    for (const sourceTable of sourceTables) {
      const targetTable = targetTablesMap.get(sourceTable.name);
      if (targetTable) {
        // Compare table structure
        const differences = this.compareTableColumns(sourceTable, targetTable);
        if (Object.keys(differences).length > 0) {
          different.push({
            tableName: sourceTable.name,
            differences
          });
        }
      }
    }
    
    return {
      onlyInSource,
      onlyInTarget,
      different
    };
  }

  /**
   * Compare columns of two tables
   */
  private compareTableColumns(sourceTable: TableSchema, targetTable: TableSchema): any {
    // Create maps for faster lookups
    const sourceColumnsMap = new Map(sourceTable.columns.map(col => [col.name, col]));
    const targetColumnsMap = new Map(targetTable.columns.map(col => [col.name, col]));
    
    // Find columns only in source
    const columnsOnlyInSource = sourceTable.columns
      .filter(col => !targetColumnsMap.has(col.name))
      .map(col => col.name);
    
    // Find columns only in target
    const columnsOnlyInTarget = targetTable.columns
      .filter(col => !sourceColumnsMap.has(col.name))
      .map(col => col.name);
    
    // Find columns in both, but with differences
    const columnDifferences = [];
    for (const sourceColumn of sourceTable.columns) {
      const targetColumn = targetColumnsMap.get(sourceColumn.name);
      if (targetColumn) {
        const differences = this.compareColumnProperties(sourceColumn, targetColumn);
        if (Object.keys(differences).length > 0) {
          columnDifferences.push({
            columnName: sourceColumn.name,
            differences
          });
        }
      }
    }
    
    // Construct the result
    const result: any = {};
    if (columnsOnlyInSource.length > 0) {
      result.columnsOnlyInSource = columnsOnlyInSource;
    }
    if (columnsOnlyInTarget.length > 0) {
      result.columnsOnlyInTarget = columnsOnlyInTarget;
    }
    if (columnDifferences.length > 0) {
      result.columnDifferences = columnDifferences;
    }
    
    // Compare primary key differences
    if (!this.areArraysEqual(sourceTable.primaryKey || [], targetTable.primaryKey || [])) {
      result.primaryKeyDifference = {
        source: sourceTable.primaryKey,
        target: targetTable.primaryKey
      };
    }
    
    // Compare foreign key differences
    const foreignKeyDifferences = this.compareForeignKeys(
      sourceTable.foreignKeys || [],
      targetTable.foreignKeys || []
    );
    if (Object.keys(foreignKeyDifferences).length > 0) {
      result.foreignKeyDifferences = foreignKeyDifferences;
    }
    
    // Compare index differences
    const indexDifferences = this.compareIndexes(
      sourceTable.indexes || [],
      targetTable.indexes || []
    );
    if (Object.keys(indexDifferences).length > 0) {
      result.indexDifferences = indexDifferences;
    }
    
    return result;
  }

  /**
   * Compare properties of two columns
   */
  private compareColumnProperties(sourceColumn: ColumnSchema, targetColumn: ColumnSchema): any {
    const differences: any = {};
    
    // Compare type
    if (sourceColumn.type !== targetColumn.type) {
      differences.type = {
        source: sourceColumn.type,
        target: targetColumn.type
      };
    }
    
    // Compare nullability
    if (sourceColumn.nullable !== targetColumn.nullable) {
      differences.nullable = {
        source: sourceColumn.nullable,
        target: targetColumn.nullable
      };
    }
    
    // Compare default value
    if (sourceColumn.defaultValue !== targetColumn.defaultValue) {
      differences.defaultValue = {
        source: sourceColumn.defaultValue,
        target: targetColumn.defaultValue
      };
    }
    
    // Compare auto increment
    if (sourceColumn.autoIncrement !== targetColumn.autoIncrement) {
      differences.autoIncrement = {
        source: sourceColumn.autoIncrement,
        target: targetColumn.autoIncrement
      };
    }
    
    // Compare primary key
    if (sourceColumn.isPrimaryKey !== targetColumn.isPrimaryKey) {
      differences.isPrimaryKey = {
        source: sourceColumn.isPrimaryKey,
        target: targetColumn.isPrimaryKey
      };
    }
    
    // Compare foreign key
    if (sourceColumn.isForeignKey !== targetColumn.isForeignKey) {
      differences.isForeignKey = {
        source: sourceColumn.isForeignKey,
        target: targetColumn.isForeignKey
      };
    }
    
    // Compare unique constraint
    if (sourceColumn.isUnique !== targetColumn.isUnique) {
      differences.isUnique = {
        source: sourceColumn.isUnique,
        target: targetColumn.isUnique
      };
    }
    
    return differences;
  }

  /**
   * Compare foreign keys between tables
   */
  private compareForeignKeys(sourceForeignKeys: any[], targetForeignKeys: any[]): any {
    // Create maps for faster lookups
    const sourceForeignKeysMap = new Map(sourceForeignKeys.map(fk => [fk.name, fk]));
    const targetForeignKeysMap = new Map(targetForeignKeys.map(fk => [fk.name, fk]));
    
    // Find foreign keys only in source
    const onlyInSource = sourceForeignKeys.filter(fk => !targetForeignKeysMap.has(fk.name));
    
    // Find foreign keys only in target
    const onlyInTarget = targetForeignKeys.filter(fk => !sourceForeignKeysMap.has(fk.name));
    
    // Find foreign keys in both, but with differences
    const different = [];
    for (const sourceFk of sourceForeignKeys) {
      const targetFk = targetForeignKeysMap.get(sourceFk.name);
      if (targetFk) {
        // Compare foreign key properties
        const differences = this.compareForeignKeyProperties(sourceFk, targetFk);
        if (Object.keys(differences).length > 0) {
          different.push({
            foreignKeyName: sourceFk.name,
            differences
          });
        }
      }
    }
    
    // Construct the result
    const result: any = {};
    if (onlyInSource.length > 0) {
      result.onlyInSource = onlyInSource;
    }
    if (onlyInTarget.length > 0) {
      result.onlyInTarget = onlyInTarget;
    }
    if (different.length > 0) {
      result.different = different;
    }
    
    return result;
  }

  /**
   * Compare properties of two foreign keys
   */
  private compareForeignKeyProperties(sourceFk: any, targetFk: any): any {
    const differences: any = {};
    
    // Compare column names
    if (!this.areArraysEqual(sourceFk.columnNames, targetFk.columnNames)) {
      differences.columnNames = {
        source: sourceFk.columnNames,
        target: targetFk.columnNames
      };
    }
    
    // Compare referenced table name
    if (sourceFk.referencedTableName !== targetFk.referencedTableName) {
      differences.referencedTableName = {
        source: sourceFk.referencedTableName,
        target: targetFk.referencedTableName
      };
    }
    
    // Compare referenced column names
    if (!this.areArraysEqual(sourceFk.referencedColumnNames, targetFk.referencedColumnNames)) {
      differences.referencedColumnNames = {
        source: sourceFk.referencedColumnNames,
        target: targetFk.referencedColumnNames
      };
    }
    
    // Compare update rule
    if (sourceFk.updateRule !== targetFk.updateRule) {
      differences.updateRule = {
        source: sourceFk.updateRule,
        target: targetFk.updateRule
      };
    }
    
    // Compare delete rule
    if (sourceFk.deleteRule !== targetFk.deleteRule) {
      differences.deleteRule = {
        source: sourceFk.deleteRule,
        target: targetFk.deleteRule
      };
    }
    
    return differences;
  }

  /**
   * Compare indexes between tables
   */
  private compareIndexes(sourceIndexes: any[], targetIndexes: any[]): any {
    // Create maps for faster lookups
    const sourceIndexesMap = new Map(sourceIndexes.map(idx => [idx.name, idx]));
    const targetIndexesMap = new Map(targetIndexes.map(idx => [idx.name, idx]));
    
    // Find indexes only in source
    const onlyInSource = sourceIndexes.filter(idx => !targetIndexesMap.has(idx.name));
    
    // Find indexes only in target
    const onlyInTarget = targetIndexes.filter(idx => !sourceIndexesMap.has(idx.name));
    
    // Find indexes in both, but with differences
    const different = [];
    for (const sourceIdx of sourceIndexes) {
      const targetIdx = targetIndexesMap.get(sourceIdx.name);
      if (targetIdx) {
        // Compare index properties
        const differences = this.compareIndexProperties(sourceIdx, targetIdx);
        if (Object.keys(differences).length > 0) {
          different.push({
            indexName: sourceIdx.name,
            differences
          });
        }
      }
    }
    
    // Construct the result
    const result: any = {};
    if (onlyInSource.length > 0) {
      result.onlyInSource = onlyInSource;
    }
    if (onlyInTarget.length > 0) {
      result.onlyInTarget = onlyInTarget;
    }
    if (different.length > 0) {
      result.different = different;
    }
    
    return result;
  }

  /**
   * Compare properties of two indexes
   */
  private compareIndexProperties(sourceIdx: any, targetIdx: any): any {
    const differences: any = {};
    
    // Compare column names
    if (!this.areArraysEqual(sourceIdx.columnNames, targetIdx.columnNames)) {
      differences.columnNames = {
        source: sourceIdx.columnNames,
        target: targetIdx.columnNames
      };
    }
    
    // Compare uniqueness
    if (sourceIdx.isUnique !== targetIdx.isUnique) {
      differences.isUnique = {
        source: sourceIdx.isUnique,
        target: targetIdx.isUnique
      };
    }
    
    // Compare primary key flag
    if (sourceIdx.isPrimaryKey !== targetIdx.isPrimaryKey) {
      differences.isPrimaryKey = {
        source: sourceIdx.isPrimaryKey,
        target: targetIdx.isPrimaryKey
      };
    }
    
    // Compare type
    if (sourceIdx.type !== targetIdx.type) {
      differences.type = {
        source: sourceIdx.type,
        target: targetIdx.type
      };
    }
    
    // Compare method
    if (sourceIdx.method !== targetIdx.method) {
      differences.method = {
        source: sourceIdx.method,
        target: targetIdx.method
      };
    }
    
    return differences;
  }

  /**
   * Compare views between schemas
   */
  private compareViews(sourceViews: any[], targetViews: any[]): any {
    // Create maps for faster lookups
    const sourceViewsMap = new Map(sourceViews.map(view => [view.name, view]));
    const targetViewsMap = new Map(targetViews.map(view => [view.name, view]));
    
    // Find views only in source
    const onlyInSource = sourceViews.filter(view => !targetViewsMap.has(view.name));
    
    // Find views only in target
    const onlyInTarget = targetViews.filter(view => !sourceViewsMap.has(view.name));
    
    // Find views in both, but with differences
    const different = [];
    for (const sourceView of sourceViews) {
      const targetView = targetViewsMap.get(sourceView.name);
      if (targetView) {
        // Compare view definition and columns
        const differences = this.compareViewDefinitions(sourceView, targetView);
        if (Object.keys(differences).length > 0) {
          different.push({
            viewName: sourceView.name,
            differences
          });
        }
      }
    }
    
    return {
      onlyInSource,
      onlyInTarget,
      different
    };
  }

  /**
   * Compare definitions of two views
   */
  private compareViewDefinitions(sourceView: any, targetView: any): any {
    const differences: any = {};
    
    // Compare schema
    if (sourceView.schema !== targetView.schema) {
      differences.schema = {
        source: sourceView.schema,
        target: targetView.schema
      };
    }
    
    // Compare definition
    if (sourceView.definition !== targetView.definition) {
      differences.definition = {
        source: sourceView.definition,
        target: targetView.definition
      };
    }
    
    // Compare column differences
    if (!this.areColumnArraysEqual(sourceView.columns, targetView.columns)) {
      differences.columns = this.compareColumns(sourceView.columns, targetView.columns);
    }
    
    // Compare materialized flag
    if (sourceView.isMaterialized !== targetView.isMaterialized) {
      differences.isMaterialized = {
        source: sourceView.isMaterialized,
        target: targetView.isMaterialized
      };
    }
    
    return differences;
  }

  /**
   * Compare generic schema objects (procedures, functions, triggers, etc.)
   */
  private compareSchemaObjects(sourceObjects: any[], targetObjects: any[], keyProperty: string): any {
    if (!sourceObjects || !targetObjects) {
      return {
        onlyInSource: [],
        onlyInTarget: [],
        different: []
      };
    }
    
    // Create maps for faster lookups
    const sourceObjectsMap = new Map(sourceObjects.map(obj => [obj[keyProperty], obj]));
    const targetObjectsMap = new Map(targetObjects.map(obj => [obj[keyProperty], obj]));
    
    // Find objects only in source
    const onlyInSource = sourceObjects.filter(obj => !targetObjectsMap.has(obj[keyProperty]));
    
    // Find objects only in target
    const onlyInTarget = targetObjects.filter(obj => !sourceObjectsMap.has(obj[keyProperty]));
    
    // For simplicity, we'll just check if definitions are different
    // A more detailed comparison could be implemented for specific object types
    const different = [];
    for (const sourceObj of sourceObjects) {
      const targetObj = targetObjectsMap.get(sourceObj[keyProperty]);
      if (targetObj && sourceObj.definition !== targetObj.definition) {
        different.push({
          name: sourceObj[keyProperty],
          sourceDefinition: sourceObj.definition,
          targetDefinition: targetObj.definition
        });
      }
    }
    
    return {
      onlyInSource,
      onlyInTarget,
      different
    };
  }

  /**
   * Compare two arrays of columns
   */
  private compareColumns(sourceColumns: ColumnSchema[], targetColumns: ColumnSchema[]): any {
    // Create maps for faster lookups
    const sourceColumnsMap = new Map(sourceColumns.map(col => [col.name, col]));
    const targetColumnsMap = new Map(targetColumns.map(col => [col.name, col]));
    
    // Find columns only in source
    const onlyInSource = sourceColumns
      .filter(col => !targetColumnsMap.has(col.name))
      .map(col => col.name);
    
    // Find columns only in target
    const onlyInTarget = targetColumns
      .filter(col => !sourceColumnsMap.has(col.name))
      .map(col => col.name);
    
    // Find columns in both, but with differences
    const different = [];
    for (const sourceCol of sourceColumns) {
      const targetCol = targetColumnsMap.get(sourceCol.name);
      if (targetCol) {
        const differences = this.compareColumnProperties(sourceCol, targetCol);
        if (Object.keys(differences).length > 0) {
          different.push({
            columnName: sourceCol.name,
            differences
          });
        }
      }
    }
    
    return {
      onlyInSource,
      onlyInTarget,
      different
    };
  }

  /**
   * Check if two arrays are equal
   */
  private areArraysEqual(arr1: any[], arr2: any[]): boolean {
    if (!arr1 && !arr2) return true;
    if (!arr1 || !arr2) return false;
    if (arr1.length !== arr2.length) return false;
    
    // Sort the arrays for comparison
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    
    // Compare elements
    for (let i = 0; i < sorted1.length; i++) {
      if (sorted1[i] !== sorted2[i]) return false;
    }
    
    return true;
  }

  /**
   * Check if two arrays of columns are equal
   */
  private areColumnArraysEqual(cols1: ColumnSchema[], cols2: ColumnSchema[]): boolean {
    if (cols1.length !== cols2.length) return false;
    
    // Create maps for faster lookups
    const cols1Map = new Map(cols1.map(col => [col.name, col]));
    const cols2Map = new Map(cols2.map(col => [col.name, col]));
    
    // Check if columns match
    for (const col1 of cols1) {
      const col2 = cols2Map.get(col1.name);
      if (!col2) return false;
      
      // Compare basic properties
      if (
        col1.type !== col2.type ||
        col1.nullable !== col2.nullable ||
        col1.isPrimaryKey !== col2.isPrimaryKey ||
        col1.isUnique !== col2.isUnique
      ) {
        return false;
      }
    }
    
    return true;
  }
}

/**
 * Temporary implementation of the queryDatabaseSchema function until we create adapters for each database type
 */
async function queryDatabaseSchema(
  connectionString: string,
  databaseType: DatabaseType,
  options: any = {}
): Promise<any> {
  // This is a mock implementation
  // In a real application, this would connect to the actual database and query its schema
  
  // For testing purposes, return a mock schema
  if (options.testConnectionOnly) {
    return {
      databaseInfo: {
        name: 'test_database',
        version: '14.5',
        type: databaseType
      }
    };
  }
  
  // Mock tables
  const tables = [
    {
      name: 'users',
      schema: 'public',
      description: 'User accounts',
      columns: [
        {
          name: 'id',
          type: 'integer',
          nullable: false,
          isPrimaryKey: true,
          position: 1,
          autoIncrement: true
        },
        {
          name: 'email',
          type: 'varchar',
          nullable: false,
          isUnique: true,
          position: 2,
          length: 255
        },
        {
          name: 'password_hash',
          type: 'varchar',
          nullable: false,
          position: 3,
          length: 60
        },
        {
          name: 'created_at',
          type: 'timestamp',
          nullable: false,
          defaultValue: 'CURRENT_TIMESTAMP',
          position: 4
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          nullable: true,
          position: 5
        }
      ],
      primaryKey: ['id'],
      indexes: [
        {
          name: 'users_email_idx',
          columnNames: ['email'],
          isUnique: true,
          isPrimaryKey: false
        }
      ],
      estimatedRowCount: 1000,
      estimatedSizeMb: 0.5
    },
    {
      name: 'posts',
      schema: 'public',
      description: 'Blog posts',
      columns: [
        {
          name: 'id',
          type: 'integer',
          nullable: false,
          isPrimaryKey: true,
          position: 1,
          autoIncrement: true
        },
        {
          name: 'user_id',
          type: 'integer',
          nullable: false,
          isForeignKey: true,
          position: 2
        },
        {
          name: 'title',
          type: 'varchar',
          nullable: false,
          position: 3,
          length: 200
        },
        {
          name: 'content',
          type: 'text',
          nullable: false,
          position: 4
        },
        {
          name: 'published',
          type: 'boolean',
          nullable: false,
          defaultValue: false,
          position: 5
        },
        {
          name: 'created_at',
          type: 'timestamp',
          nullable: false,
          defaultValue: 'CURRENT_TIMESTAMP',
          position: 6
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          nullable: true,
          position: 7
        }
      ],
      primaryKey: ['id'],
      foreignKeys: [
        {
          name: 'posts_user_id_fkey',
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          updateRule: 'CASCADE',
          deleteRule: 'CASCADE'
        }
      ],
      indexes: [
        {
          name: 'posts_user_id_idx',
          columnNames: ['user_id'],
          isUnique: false,
          isPrimaryKey: false
        }
      ],
      estimatedRowCount: 5000,
      estimatedSizeMb: 2.5
    },
    {
      name: 'comments',
      schema: 'public',
      description: 'Post comments',
      columns: [
        {
          name: 'id',
          type: 'integer',
          nullable: false,
          isPrimaryKey: true,
          position: 1,
          autoIncrement: true
        },
        {
          name: 'post_id',
          type: 'integer',
          nullable: false,
          isForeignKey: true,
          position: 2
        },
        {
          name: 'user_id',
          type: 'integer',
          nullable: false,
          isForeignKey: true,
          position: 3
        },
        {
          name: 'content',
          type: 'text',
          nullable: false,
          position: 4
        },
        {
          name: 'created_at',
          type: 'timestamp',
          nullable: false,
          defaultValue: 'CURRENT_TIMESTAMP',
          position: 5
        }
      ],
      primaryKey: ['id'],
      foreignKeys: [
        {
          name: 'comments_post_id_fkey',
          columnNames: ['post_id'],
          referencedTableName: 'posts',
          referencedColumnNames: ['id'],
          updateRule: 'CASCADE',
          deleteRule: 'CASCADE'
        },
        {
          name: 'comments_user_id_fkey',
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          updateRule: 'CASCADE',
          deleteRule: 'CASCADE'
        }
      ],
      indexes: [
        {
          name: 'comments_post_id_idx',
          columnNames: ['post_id'],
          isUnique: false,
          isPrimaryKey: false
        },
        {
          name: 'comments_user_id_idx',
          columnNames: ['user_id'],
          isUnique: false,
          isPrimaryKey: false
        }
      ],
      estimatedRowCount: 25000,
      estimatedSizeMb: 10
    }
  ];
  
  // Mock views
  const views = [
    {
      name: 'active_users',
      schema: 'public',
      description: 'Users with at least one post',
      definition: `
        SELECT u.*
        FROM users u
        JOIN posts p ON u.id = p.user_id
        GROUP BY u.id
      `,
      columns: [
        {
          name: 'id',
          type: 'integer',
          nullable: false,
          position: 1
        },
        {
          name: 'email',
          type: 'varchar',
          nullable: false,
          position: 2
        },
        {
          name: 'created_at',
          type: 'timestamp',
          nullable: false,
          position: 3
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          nullable: true,
          position: 4
        }
      ],
      isMaterialized: false
    },
    {
      name: 'post_stats',
      schema: 'public',
      description: 'Post statistics with comment counts',
      definition: `
        SELECT p.id, p.title, p.user_id, u.email as author_email, 
               p.created_at, COUNT(c.id) as comment_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN comments c ON p.id = c.post_id
        GROUP BY p.id, u.email
      `,
      columns: [
        {
          name: 'id',
          type: 'integer',
          nullable: false,
          position: 1
        },
        {
          name: 'title',
          type: 'varchar',
          nullable: false,
          position: 2
        },
        {
          name: 'user_id',
          type: 'integer',
          nullable: false,
          position: 3
        },
        {
          name: 'author_email',
          type: 'varchar',
          nullable: false,
          position: 4
        },
        {
          name: 'created_at',
          type: 'timestamp',
          nullable: false,
          position: 5
        },
        {
          name: 'comment_count',
          type: 'bigint',
          nullable: false,
          position: 6
        }
      ],
      isMaterialized: false
    }
  ];
  
  // Mock procedures (only for certain database types)
  let procedures = [];
  let functions = [];
  let triggers = [];
  if (databaseType === DatabaseType.PostgreSQL || databaseType === DatabaseType.SQLServer) {
    procedures = [
      {
        name: 'create_user',
        schema: 'public',
        parameters: [
          {
            name: 'p_email',
            type: 'varchar',
            position: 1
          },
          {
            name: 'p_password_hash',
            type: 'varchar',
            position: 2
          }
        ],
        returnType: 'integer',
        definition: `
          INSERT INTO users (email, password_hash, created_at)
          VALUES (p_email, p_password_hash, CURRENT_TIMESTAMP)
          RETURNING id;
        `,
        language: 'sql'
      }
    ];
    
    functions = [
      {
        name: 'get_user_post_count',
        schema: 'public',
        parameters: [
          {
            name: 'p_user_id',
            type: 'integer',
            position: 1
          }
        ],
        returnType: 'integer',
        definition: `
          SELECT COUNT(*)
          FROM posts
          WHERE user_id = p_user_id;
        `,
        language: 'sql',
        deterministic: true
      }
    ];
    
    triggers = [
      {
        name: 'update_post_timestamp',
        schema: 'public',
        tableName: 'posts',
        event: 'UPDATE',
        timing: 'BEFORE',
        definition: `
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        `,
        enabled: true
      }
    ];
  }
  
  // Mock constraints
  const constraints = [
    {
      name: 'users_email_unique',
      schema: 'public',
      type: 'UNIQUE',
      tableName: 'users',
      columnNames: ['email']
    },
    {
      name: 'posts_title_not_empty',
      schema: 'public',
      type: 'CHECK',
      tableName: 'posts',
      columnNames: ['title'],
      checkExpression: "title <> ''"
    }
  ];
  
  // Return mock schema data
  return {
    tables,
    views,
    procedures,
    functions,
    triggers,
    constraints,
    estimatedSizeMb: 13 // sum of table sizes
  };
}