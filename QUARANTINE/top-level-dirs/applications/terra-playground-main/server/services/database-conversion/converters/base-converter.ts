/**
 * Base Database Converter
 *
 * This abstract class defines the interface for all database converters.
 * Each specific database converter extends this class.
 */

import { LLMService } from '../../llm-service';
import {
  SchemaAnalysisResult,
  DatabaseConnectionConfig,
  MigrationPlan,
  MigrationOptions,
  MigrationResult,
  ValidationResult,
} from '../types';

/**
 * Abstract base class for database converters
 */
export abstract class BaseConverter {
  protected llmService: LLMService;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
  }

  /**
   * Generate a migration plan based on schema analysis
   */
  abstract generateMigrationPlan(
    schemaAnalysis: SchemaAnalysisResult,
    targetConfig: DatabaseConnectionConfig,
    customInstructions?: string
  ): Promise<MigrationPlan>;

  /**
   * Generate a migration script based on the migration plan
   */
  abstract generateMigrationScript(
    migrationPlan: MigrationPlan,
    targetConfig: DatabaseConnectionConfig
  ): Promise<string>;

  /**
   * Execute the migration
   */
  abstract executeMigration(
    sourceConfig: DatabaseConnectionConfig,
    targetConfig: DatabaseConnectionConfig,
    migrationPlan: MigrationPlan,
    options?: MigrationOptions
  ): Promise<MigrationResult>;

  /**
   * Validate the migration
   */
  abstract validateMigration(
    sourceConfig: DatabaseConnectionConfig,
    targetConfig: DatabaseConnectionConfig,
    migrationPlan: MigrationPlan,
    migrationResult: MigrationResult
  ): Promise<ValidationResult>;

  /**
   * Get data type mapping from source to target
   */
  abstract getDataTypeMapping(): Record<string, string>;

  /**
   * Create DDL for creating tables
   */
  abstract generateTablesDDL(
    schemaAnalysis: SchemaAnalysisResult,
    migrationPlan: MigrationPlan
  ): Promise<string>;

  /**
   * Create DDL for creating indexes
   */
  abstract generateIndexesDDL(
    schemaAnalysis: SchemaAnalysisResult,
    migrationPlan: MigrationPlan
  ): Promise<string>;

  /**
   * Create DDL for creating foreign keys
   */
  abstract generateForeignKeysDDL(
    schemaAnalysis: SchemaAnalysisResult,
    migrationPlan: MigrationPlan
  ): Promise<string>;

  /**
   * Create DML for migrating data
   */
  abstract generateDataMigrationDML(
    schemaAnalysis: SchemaAnalysisResult,
    migrationPlan: MigrationPlan
  ): Promise<string>;

  /**
   * Convert stored procedures
   */
  abstract convertStoredProcedures(
    schemaAnalysis: SchemaAnalysisResult,
    migrationPlan: MigrationPlan
  ): Promise<string>;

  /**
   * Convert triggers
   */
  abstract convertTriggers(
    schemaAnalysis: SchemaAnalysisResult,
    migrationPlan: MigrationPlan
  ): Promise<string>;

  /**
   * Generate data type mapping using AI (common for all converters)
   */
  protected async generateAIDataTypeMapping(
    sourceType: string,
    targetType: string
  ): Promise<Record<string, string>> {
    const prompt = `
      I need to convert data types from ${sourceType} to ${targetType}. 
      
      Please provide a comprehensive mapping of data types from ${sourceType} to ${targetType}. 
      Include all common data types and their closest equivalents in the target database.
      
      Format the response as a valid JSON object where the keys are ${sourceType} data types
      and the values are the corresponding ${targetType} data types.
      
      For example:
      {
        "varchar": "character varying",
        "int": "integer",
        ...
      }
    `;

    const response = await this.llmService.generateText(prompt);

    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing AI data type mapping:', error);
      // Return a default mapping
      return this.getDefaultDataTypeMapping(sourceType, targetType);
    }
  }

  /**
   * Get default data type mapping based on common types
   */
  protected getDefaultDataTypeMapping(
    sourceType: string,
    targetType: string
  ): Record<string, string> {
    // Default mapping for common data types
    return {
      varchar: 'character varying',
      char: 'character',
      text: 'text',
      int: 'integer',
      integer: 'integer',
      smallint: 'smallint',
      bigint: 'bigint',
      decimal: 'numeric',
      numeric: 'numeric',
      float: 'double precision',
      double: 'double precision',
      boolean: 'boolean',
      date: 'date',
      time: 'time',
      timestamp: 'timestamp',
      datetime: 'timestamp',
      blob: 'bytea',
      binary: 'bytea',
      json: 'jsonb',
      xml: 'xml',
    };
  }

  /**
   * Generate a human-readable explanation of the migration plan
   */
  async explainMigrationPlan(migrationPlan: MigrationPlan): Promise<string> {
    const tableCount = migrationPlan.tableMappings.length;
    const viewCount = migrationPlan.viewMappings?.length || 0;
    const procedureCount = migrationPlan.procedureMappings?.length || 0;
    const triggerCount = migrationPlan.triggerMappings?.length || 0;

    const skippedTables = migrationPlan.tableMappings.filter(t => t.skip).length;
    const skippedViews = migrationPlan.viewMappings?.filter(v => v.skip).length || 0;
    const skippedProcedures = migrationPlan.procedureMappings?.filter(p => p.skip).length || 0;
    const skippedTriggers = migrationPlan.triggerMappings?.filter(t => t.skip).length || 0;

    const prompt = `
      I have a database migration plan with the following elements:
      - Tables: ${tableCount} (${skippedTables} skipped)
      - Views: ${viewCount} (${skippedViews} skipped)
      - Procedures: ${procedureCount} (${skippedProcedures} skipped)
      - Triggers: ${triggerCount} (${skippedTriggers} skipped)
      
      Some example table mappings:
      ${migrationPlan.tableMappings
        .slice(0, 3)
        .map(
          mapping => `
        Source: ${mapping.sourceTable} -> Target: ${mapping.targetTable}
        Columns: ${mapping.columnMappings
          .slice(0, 3)
          .map(
            col =>
              `${col.sourceColumn} -> ${col.targetColumn}${col.transformation ? ` (with transformation)` : ''}`
          )
          .join(', ')}${mapping.columnMappings.length > 3 ? '...' : ''}
      `
        )
        .join('\n')}
      
      Please provide a human-readable explanation of this migration plan in a clear, concise manner.
      Explain what the migration will do and highlight any important transformations or potential issues.
      The explanation should be suitable for a non-technical stakeholder.
    `;

    return this.llmService.generateText(prompt);
  }
}
