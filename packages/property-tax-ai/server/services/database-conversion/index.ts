/**
 * Database Conversion Service
 * 
 * This is the main entry point for the database conversion system, providing
 * a unified interface to its various component services.
 */

import { IStorage } from '../../storage';
import { MCPService } from '../mcp';
import { SchemaAnalyzerService } from './schema-analyzer-service';
import { DataMigrationService } from './data-migration-service';
import { DataTransformationService } from './data-transformation-service';
import { CompatibilityService } from './compatibility-service';
import {
  DatabaseType,
  SchemaAnalysisResult,
  ConnectionTestResult,
  ConversionResult,
  CompatibilityLayerOptions
} from './types';

export class DatabaseConversionService {
  private storage: IStorage;
  private mcpService: MCPService;
  private schemaAnalyzer: SchemaAnalyzerService;
  private dataMigration: DataMigrationService;
  private dataTransformation: DataTransformationService;
  private compatibilityLayer: CompatibilityService;

  constructor(storage: IStorage, mcpService: MCPService) {
    this.storage = storage;
    this.mcpService = mcpService;
    
    // Initialize component services
    this.schemaAnalyzer = new SchemaAnalyzerService(storage, mcpService);
    this.dataMigration = new DataMigrationService(storage, mcpService);
    this.dataTransformation = new DataTransformationService(storage, mcpService);
    this.compatibilityLayer = new CompatibilityService(storage, mcpService);
    
    console.log('Database Conversion Service initialized');
  }

  /**
   * Analyze a database schema
   * @param connectionString Connection string to the database
   * @param databaseType Type of database
   * @returns Schema analysis result
   */
  public async analyzeSchema(connectionString: string, databaseType: string): Promise<SchemaAnalysisResult> {
    try {
      return await this.schemaAnalyzer.analyzeSchema(connectionString, databaseType);
    } catch (error) {
      console.error('Error in DatabaseConversionService.analyzeSchema:', error);
      throw error;
    }
  }

  /**
   * Test a database connection
   * @param connectionString Connection string to the database
   * @param databaseType Type of database
   * @returns Connection test result
   */
  public async testConnection(connectionString: string, databaseType: string): Promise<ConnectionTestResult> {
    try {
      return await this.schemaAnalyzer.testConnection(connectionString, databaseType);
    } catch (error) {
      console.error('Error in DatabaseConversionService.testConnection:', error);
      throw error;
    }
  }

  /**
   * Start a database conversion process
   * @param projectId ID of the conversion project
   * @returns Conversion result (initial state)
   */
  public async startConversion(projectId: string): Promise<ConversionResult> {
    try {
      return await this.dataMigration.startConversion(projectId);
    } catch (error) {
      console.error('Error in DatabaseConversionService.startConversion:', error);
      throw error;
    }
  }

  /**
   * Get the status of a conversion process
   * @param projectId ID of the conversion project
   * @returns Current status of the conversion
   */
  public async getConversionStatus(projectId: string): Promise<ConversionResult> {
    try {
      return await this.dataMigration.getConversionStatus(projectId);
    } catch (error) {
      console.error('Error in DatabaseConversionService.getConversionStatus:', error);
      throw error;
    }
  }

  /**
   * Estimate the time needed for a conversion
   * @param tableCount Number of tables to convert
   * @param recordCount Estimated total record count
   * @param sourceType Source database type
   * @param targetType Target database type
   * @returns Estimated time in seconds
   */
  public estimateConversionTime(
    tableCount: number, 
    recordCount: number, 
    sourceType: DatabaseType, 
    targetType: DatabaseType
  ): number {
    try {
      return this.dataMigration.estimateConversionTime(tableCount, recordCount, sourceType, targetType);
    } catch (error) {
      console.error('Error in DatabaseConversionService.estimateConversionTime:', error);
      throw error;
    }
  }

  /**
   * Transform a data value from one type to another
   * @param value The value to transform
   * @param sourceType Source field type
   * @param targetType Target field type
   * @param options Optional transformation options
   */
  public transformValue(value: any, sourceType: any, targetType: any, options?: any): any {
    try {
      return this.dataTransformation.transformValue(value, sourceType, targetType, options);
    } catch (error) {
      console.error('Error in DatabaseConversionService.transformValue:', error);
      throw error;
    }
  }

  /**
   * Apply a transformation expression to a value
   * @param value The value to transform
   * @param expression The transformation expression
   */
  public applyTransformationExpression(value: any, expression: string): any {
    try {
      return this.dataTransformation.applyTransformationExpression(value, expression);
    } catch (error) {
      console.error('Error in DatabaseConversionService.applyTransformationExpression:', error);
      throw error;
    }
  }

  /**
   * Attempt field inference based on data
   * @param values Sample values from a field
   * @returns Inferred field type and properties
   */
  public inferFieldAttributes(values: any[]): any {
    try {
      return this.dataTransformation.inferFieldAttributes(values);
    } catch (error) {
      console.error('Error in DatabaseConversionService.inferFieldAttributes:', error);
      throw error;
    }
  }

  /**
   * Generate a compatibility layer for a conversion project
   * @param projectId Conversion project ID
   * @param options Options for the compatibility layer
   * @returns ID of the created compatibility layer
   */
  public async generateCompatibilityLayer(
    projectId: string,
    options?: CompatibilityLayerOptions
  ): Promise<any> {
    try {
      return await this.compatibilityLayer.generateCompatibilityLayer(projectId, options);
    } catch (error) {
      console.error('Error in DatabaseConversionService.generateCompatibilityLayer:', error);
      throw error;
    }
  }

  /**
   * Get database type information
   * @param databaseType Type of database
   * @returns Database type information
   */
  public getDatabaseTypeInfo(databaseType: DatabaseType): any {
    try {
      return this.schemaAnalyzer.getDatabaseTypeInfo(databaseType);
    } catch (error) {
      console.error('Error in DatabaseConversionService.getDatabaseTypeInfo:', error);
      throw error;
    }
  }

  /**
   * Get supported database types
   * @returns Array of supported database types
   */
  public getSupportedDatabaseTypes(): any[] {
    try {
      return this.schemaAnalyzer.getSupportedDatabaseTypes();
    } catch (error) {
      console.error('Error in DatabaseConversionService.getSupportedDatabaseTypes:', error);
      throw error;
    }
  }
}

// Export types
export * from './types';