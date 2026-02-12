/**
 * Schema Conversion Agent
 *
 * An AI agent that specializes in converting data between different GIS formats and schemas.
 * This agent can transform data from one format to another, handle coordinate system
 * transformations, and ensure data integrity during conversion.
 */

import { BaseAgent, AgentConfig } from '../agent-framework/base-agent';
import { MCPService } from '../mcp-service/mcp-service';
import { IStorage } from '../../storage';
import { GISDataService } from '../gis/gis-data-service';
import { LLMService } from '../llm-service/llm-service';
import { v4 as uuidv4 } from 'uuid';

// Schema Conversion Request interface
export interface SchemaConversionRequest {
  sourceSchema: any;
  targetSchema: any;
  sourceFormat: 'geojson' | 'shapefile' | 'kml' | 'csv' | 'gdb' | string;
  targetFormat: 'geojson' | 'shapefile' | 'kml' | 'csv' | 'gdb' | string;
  data: any;
  options?: {
    coordinateSystem?: string;
    targetCoordinateSystem?: string;
    preserveAttributes?: boolean;
    validateOutput?: boolean;
    useAI?: boolean;
  };
}

// Attribute Mapping interface
export interface AttributeMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  preserveOriginal?: boolean;
}

// Conversion Result interface
export interface ConversionResult {
  success: boolean;
  convertedData: any;
  metadata: {
    sourceFormat: string;
    targetFormat: string;
    recordCount: number;
    attributeCount: number;
    conversionTimestamp: string;
    warnings?: string[];
    errors?: string[];
  };
  validationResult?: any;
}

/**
 * Main Schema Conversion Agent class
 */
export class SchemaConversionAgent extends BaseAgent {
  private gisDataService: GISDataService;
  private llmService: LLMService | null = null;

  constructor(
    storage: IStorage,
    mcpService: MCPService,
    gisDataService: GISDataService,
    llmService?: LLMService
  ) {
    // Create base agent config
    const config: AgentConfig = {
      id: `schema-convert-${uuidv4().substring(0, 8)}`,
      name: 'Schema Conversion Agent',
      type: 'schema_conversion',
      description: 'Specializes in converting data between different GIS formats and schemas',
      capabilities: [
        'schema_conversion',
        'format_transformation',
        'coordinate_system_transformation',
        'attribute_mapping',
        'data_validation',
      ],
    };

    // Initialize the base agent with the config
    super(storage, mcpService, config);

    // Store service references
    this.gisDataService = gisDataService;

    if (llmService) {
      this.llmService = llmService;
    }
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    // Call parent initialize method
    await super.initialize();

    // Register message handlers
    this.registerMessageHandler(
      'schema_conversion_request',
      this.handleSchemaConversionRequest.bind(this)
    );
    this.registerMessageHandler(
      'attribute_mapping_request',
      this.handleAttributeMappingRequest.bind(this)
    );

    // Log initialization success
    await this.logActivity('initialization', 'Schema Conversion Agent initialized successfully');
  }

  /**
   * Handle schema conversion requests
   */
  private async handleSchemaConversionRequest(message: any): Promise<any> {
    try {
      const request = message.data as SchemaConversionRequest;

      if (!request || !request.sourceSchema || !request.targetSchema || !request.data) {
        return {
          success: false,
          error: 'Invalid schema conversion request. Missing required parameters.',
        };
      }

      // Log the operation
      await this.logActivity(
        'schema_conversion',
        `Converting from ${request.sourceFormat} to ${request.targetFormat}`
      );

      // Generate attribute mappings
      const attributeMappings = await this.generateAttributeMappings(
        request.sourceSchema,
        request.targetSchema,
        request.options
      );

      // Convert the data
      const conversionResult = await this.convertData(
        request.data,
        request.sourceFormat,
        request.targetFormat,
        attributeMappings,
        request.options
      );

      return {
        success: true,
        attributeMappings,
        conversionResult,
        metadata: {
          timestamp: new Date().toISOString(),
          sourceFormat: request.sourceFormat,
          targetFormat: request.targetFormat,
        },
      };
    } catch (err) {
      const error = err as Error;
      console.error('Error handling schema conversion request:', error);
      await this.logActivity('error', `Schema conversion error: ${error.message}`, {
        error: error.message,
      });

      return {
        success: false,
        error: `Failed to perform schema conversion: ${error.message}`,
      };
    }
  }

  /**
   * Generate attribute mappings between source and target schemas
   */
  private async generateAttributeMappings(
    sourceSchema: any,
    targetSchema: any,
    options?: any
  ): Promise<AttributeMapping[]> {
    const mappings: AttributeMapping[] = [];

    // Extract field names from schemas
    const sourceFields = this.extractFieldNames(sourceSchema);
    const targetFields = this.extractFieldNames(targetSchema);

    // Options
    const useAI = options?.useAI ?? true;
    const preserveAttributes = options?.preserveAttributes ?? true;

    // Direct field matches (exact matches)
    for (const sourceField of sourceFields) {
      // Check for exact match
      if (targetFields.includes(sourceField)) {
        mappings.push({
          sourceField,
          targetField: sourceField,
          preserveOriginal: preserveAttributes,
        });
      }
    }

    // If AI is enabled and there are unmapped fields, use LLM to suggest mappings
    if (useAI && this.llmService && mappings.length < sourceFields.length) {
      const mappedSourceFields = mappings.map(m => m.sourceField);
      const unmappedSourceFields = sourceFields.filter(
        field => !mappedSourceFields.includes(field)
      );
      const unmappedTargetFields = targetFields.filter(
        field => !mappings.some(m => m.targetField === field)
      );

      if (unmappedSourceFields.length > 0 && unmappedTargetFields.length > 0) {
        const aiMappings = await this.generateAIMappings(
          unmappedSourceFields,
          unmappedTargetFields,
          sourceSchema,
          targetSchema
        );

        mappings.push(...aiMappings);
      }
    }

    return mappings;
  }

  /**
   * Use AI to generate field mappings for schema conversion
   */
  private async generateAIMappings(
    sourceFields: string[],
    targetFields: string[],
    sourceSchema: any,
    targetSchema: any
  ): Promise<AttributeMapping[]> {
    if (!this.llmService) return [];

    const prompt = `
      I need to map fields from a source GIS schema to a target GIS schema for data conversion.
      
      Source Fields: ${JSON.stringify(sourceFields)}
      Target Fields: ${JSON.stringify(targetFields)}
      
      Source Schema Details: ${JSON.stringify(sourceSchema)}
      Target Schema Details: ${JSON.stringify(targetSchema)}
      
      For each source field, find the most appropriate target field, and suggest any needed transformations.
      Return your answer as a JSON array with objects containing:
      - sourceField: the original field name
      - targetField: the matched field name
      - transformation: (optional) a string describing any transformation needed (e.g., "parseInt(value)" or "value.toUpperCase()")
      - preserveOriginal: boolean indicating if the original value should be preserved
      
      Only include mappings where there is a reasonable semantic match.
    `;

    try {
      const response = await this.llmService.getCompletion(prompt);
      const aiMappings = JSON.parse(response);

      // Convert AI response to our mapping format
      return aiMappings.map((mapping: any) => ({
        sourceField: mapping.sourceField,
        targetField: mapping.targetField,
        transformation: mapping.transformation,
        preserveOriginal: mapping.preserveOriginal,
      }));
    } catch (error) {
      console.error('Error generating AI mappings for schema conversion:', error);
      return [];
    }
  }

  /**
   * Convert data from one format to another
   */
  private async convertData(
    data: any,
    sourceFormat: string,
    targetFormat: string,
    attributeMappings: AttributeMapping[],
    options?: any
  ): Promise<ConversionResult> {
    // Options
    const sourceCoordinateSystem = options?.coordinateSystem || 'EPSG:4326';
    const targetCoordinateSystem = options?.targetCoordinateSystem || sourceCoordinateSystem;
    const validateOutput = options?.validateOutput ?? true;

    // Warnings and errors
    const warnings: string[] = [];
    const errors: string[] = [];

    // Track start time for performance metrics
    const startTime = new Date();

    // Pre-conversion validation
    this.validateInputData(data, sourceFormat, warnings, errors);

    // Convert data based on source and target formats
    let convertedData: any = null;
    let recordCount = 0;
    let attributeCount = 0;

    try {
      // Different conversion paths based on formats
      if (sourceFormat === 'geojson' && targetFormat === 'geojson') {
        // GeoJSON to GeoJSON (schema conversion)
        convertedData = this.convertGeoJSONtoGeoJSON(data, attributeMappings);
        recordCount = this.countRecords(convertedData);
        attributeCount = attributeMappings.length;
      } else if (sourceFormat === 'csv' && targetFormat === 'geojson') {
        // CSV to GeoJSON
        convertedData = this.convertCSVtoGeoJSON(data, attributeMappings, options);
        recordCount = this.countRecords(convertedData);
        attributeCount = attributeMappings.length;
      } else if (sourceFormat === 'shapefile' && targetFormat === 'geojson') {
        // Shapefile to GeoJSON
        convertedData = this.convertShapefileToGeoJSON(data, attributeMappings, options);
        recordCount = this.countRecords(convertedData);
        attributeCount = attributeMappings.length;
      } else if (sourceFormat === 'kml' && targetFormat === 'geojson') {
        // KML to GeoJSON
        convertedData = this.convertKMLtoGeoJSON(data, attributeMappings, options);
        recordCount = this.countRecords(convertedData);
        attributeCount = attributeMappings.length;
      } else if (sourceFormat === 'geojson' && targetFormat === 'csv') {
        // GeoJSON to CSV
        convertedData = this.convertGeoJSONtoCSV(data, attributeMappings, options);
        recordCount = this.countCSVRows(convertedData);
        attributeCount = attributeMappings.length;
      } else {
        // Unsupported conversion
        throw new Error(`Conversion from ${sourceFormat} to ${targetFormat} is not supported yet.`);
      }

      // Coordinate system transformation if needed
      if (sourceCoordinateSystem !== targetCoordinateSystem) {
        convertedData = this.transformCoordinateSystem(
          convertedData,
          sourceCoordinateSystem,
          targetCoordinateSystem,
          targetFormat
        );
      }

      // Post-conversion validation
      let validationResult = null;
      if (validateOutput) {
        validationResult = this.validateConvertedData(
          convertedData,
          targetFormat,
          warnings,
          errors
        );
      }

      // Track end time
      const endTime = new Date();
      const conversionTime = endTime.getTime() - startTime.getTime();

      // Prepare metadata
      const metadata: any = {
        sourceFormat,
        targetFormat,
        recordCount,
        attributeCount,
        conversionTimestamp: new Date().toISOString(),
        warnings,
        errors,
      };

      // Add extra metadata
      metadata.processingTimeMs = conversionTime;

      return {
        success: errors.length === 0,
        convertedData,
        metadata,
        validationResult,
      };
    } catch (err) {
      const error = err as Error;
      errors.push(error.message);

      return {
        success: false,
        convertedData: null,
        metadata: {
          sourceFormat,
          targetFormat,
          recordCount: 0,
          attributeCount: 0,
          conversionTimestamp: new Date().toISOString(),
          warnings,
          errors,
        },
      };
    }
  }

  /**
   * Convert GeoJSON to GeoJSON (schema conversion)
   */
  private convertGeoJSONtoGeoJSON(data: any, attributeMappings: AttributeMapping[]): any {
    // Validate GeoJSON
    if (!data || !data.type) {
      throw new Error('Invalid GeoJSON input data');
    }

    // Clone the data to avoid modifying the original
    const result = JSON.parse(JSON.stringify(data));

    // Process based on GeoJSON type
    if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
      // Process features in a FeatureCollection
      result.features = data.features.map((feature: any) =>
        this.convertGeoJSONFeature(feature, attributeMappings)
      );
    } else if (data.type === 'Feature') {
      // Process a single Feature
      return this.convertGeoJSONFeature(data, attributeMappings);
    }

    return result;
  }

  /**
   * Convert a single GeoJSON feature by applying attribute mappings
   */
  private convertGeoJSONFeature(feature: any, attributeMappings: AttributeMapping[]): any {
    // Clone the feature to avoid modifying the original
    const result = JSON.parse(JSON.stringify(feature));

    // Create new properties object
    const newProperties: any = {};

    // Apply attribute mappings
    for (const mapping of attributeMappings) {
      if (feature.properties && feature.properties[mapping.sourceField] !== undefined) {
        let value = feature.properties[mapping.sourceField];

        // Apply transformation if specified
        if (mapping.transformation) {
          try {
            // This is a simplified version - in a real implementation,
            // you would use a more secure way to evaluate transformations
            value = eval(`(value) => { return ${mapping.transformation}; }`)(value);
          } catch (error) {
            console.error(`Error applying transformation ${mapping.transformation}:`, error);
          }
        }

        // Set the value in the new properties
        newProperties[mapping.targetField] = value;

        // Preserve original if requested
        if (mapping.preserveOriginal && mapping.sourceField !== mapping.targetField) {
          newProperties[mapping.sourceField] = feature.properties[mapping.sourceField];
        }
      }
    }

    // Update properties
    result.properties = newProperties;

    return result;
  }

  /**
   * Convert CSV to GeoJSON
   */
  private convertCSVtoGeoJSON(
    csv: string,
    attributeMappings: AttributeMapping[],
    options?: any
  ): any {
    // This is a placeholder implementation
    // In a real implementation, you would parse the CSV and create GeoJSON features

    const features: any[] = [];
    // CSV parsing and conversion would happen here

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  /**
   * Convert Shapefile to GeoJSON
   */
  private convertShapefileToGeoJSON(
    data: any,
    attributeMappings: AttributeMapping[],
    options?: any
  ): any {
    // This is a placeholder implementation
    // In a real implementation, you would parse the Shapefile and create GeoJSON features

    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  /**
   * Convert KML to GeoJSON
   */
  private convertKMLtoGeoJSON(
    kml: string,
    attributeMappings: AttributeMapping[],
    options?: any
  ): any {
    // This is a placeholder implementation
    // In a real implementation, you would parse the KML and create GeoJSON features

    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  /**
   * Convert GeoJSON to CSV
   */
  private convertGeoJSONtoCSV(
    data: any,
    attributeMappings: AttributeMapping[],
    options?: any
  ): string {
    // This is a placeholder implementation
    // In a real implementation, you would extract properties from GeoJSON features
    // and create CSV rows

    return '';
  }

  /**
   * Transform coordinate system
   */
  private transformCoordinateSystem(
    data: any,
    sourceSystem: string,
    targetSystem: string,
    format: string
  ): any {
    // This is a placeholder implementation
    // In a real implementation, you would use a library like proj4js to transform coordinates

    return data;
  }

  /**
   * Validate input data
   */
  private validateInputData(data: any, format: string, warnings: string[], errors: string[]): void {
    // Validate based on format
    switch (format) {
      case 'geojson':
        this.validateGeoJSON(data, warnings, errors);
        break;
      case 'csv':
        this.validateCSV(data, warnings, errors);
        break;
      // Add other format validations as needed
      default:
        warnings.push(`No validation available for format: ${format}`);
    }
  }

  /**
   * Validate GeoJSON
   */
  private validateGeoJSON(data: any, warnings: string[], errors: string[]): void {
    if (!data) {
      errors.push('No data provided');
      return;
    }

    // Check type
    if (!data.type) {
      errors.push('Missing "type" property in GeoJSON');
      return;
    }

    // Validate FeatureCollection
    if (data.type === 'FeatureCollection') {
      if (!Array.isArray(data.features)) {
        errors.push('FeatureCollection missing "features" array');
        return;
      }

      // Check features
      if (data.features.length === 0) {
        warnings.push('FeatureCollection contains no features');
      }

      // Validate each feature
      for (let i = 0; i < data.features.length; i++) {
        const feature = data.features[i];
        if (!feature.type || feature.type !== 'Feature') {
          errors.push(`Item at index ${i} in "features" array is not a valid Feature`);
        }

        if (!feature.geometry) {
          warnings.push(`Feature at index ${i} is missing geometry`);
        }

        if (!feature.properties) {
          warnings.push(`Feature at index ${i} is missing properties`);
        }
      }
    }
    // Validate single Feature
    else if (data.type === 'Feature') {
      if (!data.geometry) {
        warnings.push('Feature is missing geometry');
      }

      if (!data.properties) {
        warnings.push('Feature is missing properties');
      }
    } else {
      errors.push(`Unsupported GeoJSON type: ${data.type}`);
    }
  }

  /**
   * Validate CSV
   */
  private validateCSV(csv: string, warnings: string[], errors: string[]): void {
    if (!csv) {
      errors.push('No CSV data provided');
      return;
    }

    // Split into lines
    const lines = csv
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      errors.push('CSV contains no data');
      return;
    }

    // Check header
    const header = lines[0].split(',');
    if (header.length === 0) {
      errors.push('CSV header is empty');
      return;
    }

    // Check for latitude/longitude columns
    const hasLat = header.some(
      col => col.toLowerCase().includes('lat') || col.toLowerCase() === 'y'
    );

    const hasLon = header.some(
      col =>
        col.toLowerCase().includes('lon') ||
        col.toLowerCase().includes('lng') ||
        col.toLowerCase() === 'x'
    );

    if (!hasLat || !hasLon) {
      warnings.push('CSV may not contain latitude/longitude columns');
    }

    // Check rows
    if (lines.length === 1) {
      warnings.push('CSV contains only a header row, no data rows');
      return;
    }

    // Check if all rows have the same number of columns
    const headerColumnCount = header.length;
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',');
      if (columns.length !== headerColumnCount) {
        warnings.push(
          `Row ${i + 1} has ${columns.length} columns, but header has ${headerColumnCount} columns`
        );
      }
    }
  }

  /**
   * Validate converted data
   */
  private validateConvertedData(
    data: any,
    format: string,
    warnings: string[],
    errors: string[]
  ): any {
    // Validate based on format
    switch (format) {
      case 'geojson':
        this.validateGeoJSON(data, warnings, errors);
        break;
      case 'csv':
        this.validateCSV(data, warnings, errors);
        break;
      // Add other format validations as needed
      default:
        warnings.push(`No validation available for format: ${format}`);
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Count records in converted data
   */
  private countRecords(data: any): number {
    if (!data) return 0;

    // Count based on format
    if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
      return data.features.length;
    } else if (data.type === 'Feature') {
      return 1;
    }

    return 0;
  }

  /**
   * Count rows in CSV
   */
  private countCSVRows(csv: string): number {
    if (!csv) return 0;

    // Split into lines and count non-empty lines
    const lines = csv
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Subtract header row
    return Math.max(0, lines.length - 1);
  }

  /**
   * Extract field names from a schema
   */
  private extractFieldNames(schema: any): string[] {
    if (!schema) return [];

    // Handle different schema formats
    if (schema.properties) {
      // JSON Schema format
      return Object.keys(schema.properties);
    } else if (schema.fields) {
      // Array of field definitions
      return schema.fields.map((field: any) =>
        typeof field === 'string' ? field : field.name || field.field
      );
    } else if (typeof schema === 'object' && !Array.isArray(schema)) {
      // Simple object with field names as keys
      return Object.keys(schema);
    }

    return [];
  }

  /**
   * Handle attribute mapping requests
   */
  private async handleAttributeMappingRequest(message: any): Promise<any> {
    try {
      const { sourceSchema, targetSchema, options } = message.data;

      if (!sourceSchema || !targetSchema) {
        return {
          success: false,
          error: 'Invalid attribute mapping request. Missing required parameters.',
        };
      }

      // Log the operation
      await this.logActivity('attribute_mapping', 'Processing attribute mapping request');

      // Generate attribute mappings
      const mappings = await this.generateAttributeMappings(sourceSchema, targetSchema, options);

      return {
        success: true,
        mappings,
        metadata: {
          timestamp: new Date().toISOString(),
          sourceSchemaFields: this.extractFieldNames(sourceSchema).length,
          targetSchemaFields: this.extractFieldNames(targetSchema).length,
        },
      };
    } catch (err) {
      const error = err as Error;
      console.error('Error handling attribute mapping request:', error);
      await this.logActivity('error', `Attribute mapping error: ${error.message}`, {
        error: error.message,
      });

      return {
        success: false,
        error: `Failed to generate attribute mappings: ${error.message}`,
      };
    }
  }
}
