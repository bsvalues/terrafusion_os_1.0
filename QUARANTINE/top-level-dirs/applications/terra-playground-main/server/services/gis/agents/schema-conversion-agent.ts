/**
 * Schema Conversion Agent
 *
 * This agent is responsible for converting GIS data schemas between different formats.
 * It can analyze GIS data structures and create mappings between different schema formats.
 */

import { v4 as uuidv4 } from 'uuid';
import { IStorage } from '../../../storage';
import { BaseGISAgent } from './base-gis-agent';
import { GISTaskType } from '../agent-orchestration-service';
import { AgentConfig, AgentCapability } from '../../agents/base-agent';
import {
  ErrorTrackingService,
  ErrorSeverity,
  ErrorCategory,
  ErrorSource,
} from '../../error-tracking-service';

interface SchemaValidationData {
  schema: Record<string, unknown>;
  format: string;
}

interface FormatConversionData {
  sourceFormat: string;
  targetFormat: string;
  schema: Record<string, unknown>;
  options?: Record<string, unknown>;
}

interface ValidationResult {
  isValid: boolean;
  format: string;
  issues: Array<{
    type: string;
    message: string;
    fields: string[];
  }>;
  warnings: Array<{
    type: string;
    message: string;
    fields: string[];
  }>;
  summary: {
    fieldCount: number;
    geometryType: string;
    spatialReference: string;
    analyzedAt: string;
  };
  [key: string]: unknown;
}

export class SchemaConversionAgent extends BaseGISAgent {
  private errorTrackingService: ErrorTrackingService;
  private isInitialized: boolean;

  // Supported source formats
  private supportedSourceFormats = [
    'ESRI Shapefile',
    'GeoJSON',
    'KML',
    'GML',
    'PostGIS',
    'MapInfo TAB',
    'Spatialite',
    'CSV with coordinates',
    'OGC GeoPackage',
  ];

  // Supported target formats
  private supportedTargetFormats = [
    'GeoJSON',
    'PostGIS',
    'OGC GeoPackage',
    'Spatialite',
    'ESRI Geodatabase',
    'OGC WFS',
  ];

  constructor(storage: IStorage) {
    const capabilities: AgentCapability[] = [
      {
        name: 'schema-analysis',
        description: 'Analyze GIS data schemas',
        handler: async (params: any) => {
          // Implementation will be added later
          return { success: true };
        }
      },
      {
        name: 'format-detection',
        description: 'Detect GIS data formats',
        handler: async (params: any) => {
          // Implementation will be added later
          return { success: true };
        }
      },
      {
        name: 'field-mapping',
        description: 'Map fields between different schemas',
        handler: async (params: any) => {
          // Implementation will be added later
          return { success: true };
        }
      },
      {
        name: 'schema-validation',
        description: 'Validate GIS data schemas',
        handler: async (params: any) => {
          // Implementation will be added later
          return { success: true };
        }
      },
      {
        name: 'schema-transformation',
        description: 'Transform schemas between formats',
        handler: async (params: any) => {
          // Implementation will be added later
          return { success: true };
        }
      }
    ];

    const config: AgentConfig = {
      id: uuidv4(),
      name: 'Schema Conversion Agent',
      description: 'Converts GIS data schemas between different formats',
      capabilities,
      permissions: ['read:gis', 'write:gis']
    };

    super(storage, config);
    this.errorTrackingService = new ErrorTrackingService(storage);
    this.isInitialized = false;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.createAgentMessage({
        messageId: uuidv4(),
        senderAgentId: this.agentId,
        messageType: 'INFO',
        subject: 'Agent Initialization',
        content: `Agent ${this.name} (${this.agentId}) initialized successfully`,
        status: 'completed'
      });

      await this.updateStatus('active', 100);
      this.isInitialized = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Failed to initialize ${this.name} (${this.agentId}):`, errorMessage);
      await this.updateStatus('error', 0);

      this.errorTrackingService.trackGisError(error, {
        component: 'SchemaConversionAgent',
        method: 'initialize',
        agentId: this.agentId,
        severity: ErrorSeverity.HIGH,
      });

      throw error;
    }
  }

  public async processTask(task: { id: string; taskType: GISTaskType; data: unknown }): Promise<Record<string, unknown>> {
    try {
      await this.logMessage('INFO', `Processing task ${task.id}: ${task.taskType}`);

      if (!task.data) {
        throw new Error('Task data is required');
      }

      let result: Record<string, unknown>;

      switch (task.taskType) {
        case GISTaskType.SCHEMA_VALIDATION:
          result = await this.validateSchema(task.data as SchemaValidationData);
          break;
        case GISTaskType.FORMAT_CONVERSION:
          result = await this.convertFormat(task.data as FormatConversionData);
          break;
        default:
          throw new Error(`Unsupported task type: ${task.taskType}`);
      }

      await this.logMessage('INFO', `Task ${task.id} completed successfully`);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await this.logMessage('ERROR', `Task ${task.id} failed: ${errorMessage}`);

      this.errorTrackingService.trackGisError(error, {
        component: 'SchemaConversionAgent',
        method: 'processTask',
        agentId: this.agentId,
        taskId: task.id,
        taskType: task.taskType,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.VALIDATION,
      });

      throw error;
    }
  }

  private async validateSchema(data: SchemaValidationData): Promise<ValidationResult> {
    const { schema, format } = data;

    if (!schema) {
      throw new Error('Schema is required for validation');
    }

    if (!format) {
      throw new Error('Format is required for validation');
    }

    if (!this.isSupportedFormat(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }

    await this.logMessage('INFO', `Validating schema in ${format} format`);

    const validationResults: ValidationResult = {
      isValid: true,
      format,
      issues: [],
      warnings: [],
      summary: {
        fieldCount: 0,
        geometryType: 'unknown',
        spatialReference: 'unknown',
        analyzedAt: new Date().toISOString(),
      },
    };

    try {
      const requiredFields = this.getRequiredFieldsForFormat(format);
      const missingFields = requiredFields.filter(field => !schema[field]);

      if (missingFields.length > 0) {
        validationResults.isValid = false;
        validationResults.issues.push({
          type: 'MISSING_REQUIRED_FIELDS',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          fields: missingFields,
        });
      }

      const unsupportedTypes = this.findUnsupportedTypes(schema, format);
      if (unsupportedTypes.length > 0) {
        validationResults.isValid = false;
        validationResults.issues.push({
          type: 'UNSUPPORTED_DATA_TYPES',
          message: `Unsupported data types: ${unsupportedTypes.map(ut => `${ut.field}: ${ut.type}`).join(', ')}`,
          fields: unsupportedTypes.map(ut => ut.field),
        });
      }

      const dataLossRisks = this.identifyDataLossRisks(schema, format);
      if (dataLossRisks.length > 0) {
        validationResults.warnings.push({
          type: 'DATA_LOSS_RISK',
          message: `Potential data loss issues: ${dataLossRisks.map(r => `${r.field}: ${r.reason}`).join(', ')}`,
          fields: dataLossRisks.map(r => r.field),
        });
      }

      validationResults.summary = {
        fieldCount: Object.keys(schema).length,
        geometryType: schema.geometryType as string || 'unknown',
        spatialReference: schema.spatialReference as string || 'unknown',
        analyzedAt: new Date().toISOString(),
      };

      await this.logMessage(
        'INFO',
        `Schema validation ${validationResults.isValid ? 'passed' : 'failed'} with ${validationResults.issues.length} issues and ${validationResults.warnings.length} warnings`
      );

      return validationResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await this.logMessage('ERROR', `Schema validation error: ${errorMessage}`);

      this.errorTrackingService.trackGisError(error, {
        component: 'SchemaConversionAgent',
        method: 'validateSchema',
        agentId: this.agentId,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.VALIDATION,
      });

      throw error;
    }
  }

  private async convertFormat(data: FormatConversionData): Promise<Record<string, unknown>> {
    const { sourceFormat, targetFormat, schema, options = {} } = data;

    if (!this.isSupportedFormat(sourceFormat)) {
      throw new Error(`Unsupported source format: ${sourceFormat}`);
    }

    if (!this.isSupportedFormat(targetFormat)) {
      throw new Error(`Unsupported target format: ${targetFormat}`);
    }

    await this.logMessage('INFO', `Converting schema from ${sourceFormat} to ${targetFormat}`);

    try {
      const validationResult = await this.validateSchema({ schema, format: sourceFormat });
      if (!validationResult.isValid) {
        throw new Error(`Source schema validation failed: ${validationResult.issues.map(i => i.message).join(', ')}`);
      }

      const convertedSchema = await this.performSchemaConversion(schema, sourceFormat, targetFormat, options);

      return {
        success: true,
        sourceFormat,
        targetFormat,
        convertedSchema,
        metadata: {
          conversionTime: new Date().toISOString(),
          warnings: validationResult.warnings,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await this.logMessage('ERROR', `Format conversion error: ${errorMessage}`);

      this.errorTrackingService.trackGisError(error, {
        component: 'SchemaConversionAgent',
        method: 'convertFormat',
        agentId: this.agentId,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.CONVERSION,
      });

      throw error;
    }
  }

  private async performSchemaConversion(
    schema: Record<string, unknown>,
    sourceFormat: string,
    targetFormat: string,
    options: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // This is a placeholder for the actual conversion logic
    // In a real implementation, this would handle the specific conversion rules
    // for each format pair
    return {
      ...schema,
      _converted: true,
      _sourceFormat: sourceFormat,
      _targetFormat: targetFormat,
      _conversionTime: new Date().toISOString(),
    };
  }

  private isSupportedFormat(format: string): boolean {
    return (
      this.supportedSourceFormats.includes(format) || this.supportedTargetFormats.includes(format)
    );
  }

  private getRequiredFieldsForFormat(format: string): string[] {
    const formatRequirements: Record<string, string[]> = {
      'GeoJSON': ['type', 'features'],
      'PostGIS': ['geometry', 'properties'],
      'ESRI Shapefile': ['geometry', 'attributes'],
      'KML': ['coordinates', 'name'],
      'GML': ['coordinates', 'name'],
      'MapInfo TAB': ['geometry', 'attributes'],
      'Spatialite': ['geometry', 'attributes'],
      'CSV with coordinates': ['x', 'y'],
      'OGC GeoPackage': ['geometry', 'attributes'],
      'ESRI Geodatabase': ['geometry', 'attributes'],
      'OGC WFS': ['geometry', 'properties'],
    };

    return formatRequirements[format] || [];
  }

  private findUnsupportedTypes(schema: Record<string, unknown>, format: string): Array<{ field: string; type: string }> {
    const unsupportedTypes: Array<{ field: string; type: string }> = [];
    const supportedTypes: Record<string, string[]> = {
      'GeoJSON': ['string', 'number', 'boolean', 'object', 'array'],
      'PostGIS': ['string', 'number', 'boolean', 'geometry'],
      'ESRI Shapefile': ['string', 'number', 'boolean', 'date'],
      'KML': ['string', 'number', 'boolean', 'coordinates'],
      'GML': ['string', 'number', 'boolean', 'coordinates'],
      'MapInfo TAB': ['string', 'number', 'boolean', 'date'],
      'Spatialite': ['string', 'number', 'boolean', 'date'],
      'CSV with coordinates': ['string', 'number', 'boolean'],
      'OGC GeoPackage': ['string', 'number', 'boolean', 'date'],
      'ESRI Geodatabase': ['string', 'number', 'boolean', 'date'],
      'OGC WFS': ['string', 'number', 'boolean', 'object'],
    };

    const allowedTypes = supportedTypes[format] || [];
    
    for (const [field, value] of Object.entries(schema)) {
      const type = typeof value;
      if (!allowedTypes.includes(type)) {
        unsupportedTypes.push({ field, type });
      }
    }

    return unsupportedTypes;
  }

  private identifyDataLossRisks(schema: Record<string, unknown>, format: string): Array<{ field: string; reason: string }> {
    const risks: Array<{ field: string; reason: string }> = [];
    const formatLimitations: Record<string, Record<string, string>> = {
      'GeoJSON': {
        'precision': 'Limited to 6 decimal places',
        'date': 'Dates stored as strings',
      },
      'PostGIS': {
        'precision': 'Limited to 15 decimal places',
        'date': 'Dates stored as timestamps',
      },
      'ESRI Shapefile': {
        'fieldLength': 'Limited to 10 characters',
        'date': 'Limited date range',
      },
    };

    const limitations = formatLimitations[format] || {};
    
    for (const [field, value] of Object.entries(schema)) {
      if (typeof value === 'number' && limitations.precision) {
        risks.push({ field, reason: limitations.precision });
      }
      if (value instanceof Date && limitations.date) {
        risks.push({ field, reason: limitations.date });
      }
      if (typeof value === 'string' && limitations.fieldLength) {
        risks.push({ field, reason: limitations.fieldLength });
      }
    }

    return risks;
  }

  private async logMessage(type: string, content: string): Promise<void> {
    try {
      await this.createAgentMessage({
        messageId: uuidv4(),
        senderAgentId: this.agentId,
        messageType: type,
        subject: 'Agent Message',
        content,
        status: 'completed'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Failed to log message: ${errorMessage}`);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      await this.logMessage('INFO', `Agent ${this.name} (${this.agentId}) shutting down`);
      await this.updateStatus('inactive', 0);
      this.isInitialized = false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Failed to shutdown agent: ${errorMessage}`);
      throw error;
    }
  }
}

/**
 * Create a new Schema Conversion Agent
 * @param storage The storage implementation
 * @returns A new Schema Conversion Agent
 */
export function createSchemaConversionAgent(storage: IStorage): SchemaConversionAgent {
  return new SchemaConversionAgent(storage);
}

