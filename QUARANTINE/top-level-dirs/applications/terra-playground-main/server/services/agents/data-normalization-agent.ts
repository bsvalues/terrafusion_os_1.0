/**
 * Data Normalization Agent
 *
 * An AI agent that specializes in harmonizing data schemas and formats.
 * This agent can detect and repair inconsistencies in GIS data schemas,
 * standardize attribute names, and ensure data consistency.
 */

import { BaseAgent, AgentConfig } from '../agent-framework/base-agent';
import { MCPService } from '../mcp-service/mcp-service';
import { IStorage } from '../../storage';
import { GISDataService } from '../gis/gis-data-service';
import { LLMService } from '../llm-service/llm-service';
import { v4 as uuidv4 } from 'uuid';

// Schema normalization request interface
export interface SchemaNormalizationRequest {
  sourceSchema: any;
  targetSchema: any;
  data: any;
  options?: {
    caseSensitive?: boolean;
    strictMatching?: boolean;
    useAI?: boolean;
    similarity?: number; // Similarity threshold for fuzzy matching
  };
}

// Field mapping result interface
export interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  suggested: boolean;
}

/**
 * Main Data Normalization Agent class
 */
export class DataNormalizationAgent extends BaseAgent {
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
      id: `data-norm-${uuidv4().substring(0, 8)}`,
      name: 'Data Normalization Agent',
      type: 'data_normalization',
      description: 'Specializes in harmonizing data schemas and formats',
      capabilities: [
        'schema_normalization',
        'field_mapping',
        'data_validation',
        'format_standardization',
        'anomaly_detection',
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
      'schema_normalization_request',
      this.handleSchemaNormalizationRequest.bind(this)
    );
    this.registerMessageHandler('field_mapping_request', this.handleFieldMappingRequest.bind(this));
    this.registerMessageHandler(
      'data_validation_request',
      this.handleDataValidationRequest.bind(this)
    );

    // Log initialization success
    await this.logActivity('initialization', 'Data Normalization Agent initialized successfully');
  }

  /**
   * Handle schema normalization requests
   */
  private async handleSchemaNormalizationRequest(message: any): Promise<any> {
    try {
      const request = message.data as SchemaNormalizationRequest;

      if (!request || !request.sourceSchema || !request.targetSchema || !request.data) {
        return {
          success: false,
          error: 'Invalid schema normalization request. Missing required parameters.',
        };
      }

      // Log the operation
      await this.logActivity('schema_normalization', 'Processing schema normalization request');

      // Generate field mappings
      const mappings = await this.generateFieldMappings(
        request.sourceSchema,
        request.targetSchema,
        request.options
      );

      // Apply mappings to the data
      const transformedData = this.applyFieldMappings(request.data, mappings);

      // Validate the transformed data against the target schema
      const validationResult = await this.validateAgainstSchema(
        transformedData,
        request.targetSchema
      );

      return {
        success: true,
        mappings,
        transformedData,
        validation: validationResult,
        metadata: {
          timestamp: new Date().toISOString(),
          sourceSchemaSummary: this.summarizeSchema(request.sourceSchema),
          targetSchemaSummary: this.summarizeSchema(request.targetSchema),
        },
      };
    } catch (error) {
      console.error('Error handling schema normalization request:', error);
      await this.logActivity('error', `Schema normalization error: ${(error as Error).message}`, {
        error: (error as Error).message,
      });

      return {
        success: false,
        error: `Failed to perform schema normalization: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Generate field mappings between source and target schemas
   */
  private async generateFieldMappings(
    sourceSchema: any,
    targetSchema: any,
    options?: any
  ): Promise<FieldMapping[]> {
    const mappings: FieldMapping[] = [];
    const sourceFields = this.extractFieldNames(sourceSchema);
    const targetFields = this.extractFieldNames(targetSchema);

    const caseSensitive = options?.caseSensitive ?? false;
    const strictMatching = options?.strictMatching ?? false;
    const useAI = options?.useAI ?? true;
    const similarityThreshold = options?.similarity ?? 0.75;

    // First pass: direct matches
    for (const sourceField of sourceFields) {
      // Try exact match
      const exactMatch = targetFields.find(targetField =>
        caseSensitive
          ? targetField === sourceField
          : targetField.toLowerCase() === sourceField.toLowerCase()
      );

      if (exactMatch) {
        mappings.push({
          sourceField,
          targetField: exactMatch,
          confidence: 1.0,
          suggested: false,
        });
        continue;
      }

      // If strict matching is required, skip fuzzy matching
      if (strictMatching) continue;

      // Try fuzzy matching based on string similarity
      const fuzzyMatches = targetFields
        .map(targetField => ({
          targetField,
          similarity: this.calculateStringSimilarity(sourceField, targetField),
        }))
        .filter(match => match.similarity >= similarityThreshold)
        .sort((a, b) => b.similarity - a.similarity);

      if (fuzzyMatches.length > 0) {
        mappings.push({
          sourceField,
          targetField: fuzzyMatches[0].targetField,
          confidence: fuzzyMatches[0].similarity,
          suggested: true,
        });
      }
    }

    // If AI is enabled and there are unmapped fields, use LLM to suggest mappings
    if (useAI && this.llmService && mappings.length < sourceFields.length) {
      const unmappedSourceFields = sourceFields.filter(
        field => !mappings.some(mapping => mapping.sourceField === field)
      );

      if (unmappedSourceFields.length > 0) {
        const aiMappings = await this.generateAIMappings(
          unmappedSourceFields,
          targetFields,
          sourceSchema,
          targetSchema
        );

        mappings.push(...aiMappings);
      }
    }

    return mappings;
  }

  /**
   * Use AI to generate field mappings
   */
  private async generateAIMappings(
    sourceFields: string[],
    targetFields: string[],
    sourceSchema: any,
    targetSchema: any
  ): Promise<FieldMapping[]> {
    if (!this.llmService) return [];

    const prompt = `
      I need to map fields from a source schema to a target schema in GIS data.
      
      Source Fields: ${JSON.stringify(sourceFields)}
      Target Fields: ${JSON.stringify(targetFields)}
      
      Source Schema Details: ${JSON.stringify(sourceSchema)}
      Target Schema Details: ${JSON.stringify(targetSchema)}
      
      For each source field, find the most appropriate target field.
      Return your answer as a JSON array with objects containing:
      - sourceField: the original field name
      - targetField: the matched field name
      - confidence: a number between 0 and 1 indicating your confidence
      - reasoning: brief explanation for the mapping
      
      Only include mappings where you have at least 60% confidence.
    `;

    try {
      const response = await this.llmService.getCompletion(prompt);
      const aiMappings = JSON.parse(response);

      // Convert AI response to our mapping format
      return aiMappings.map((mapping: any) => ({
        sourceField: mapping.sourceField,
        targetField: mapping.targetField,
        confidence: mapping.confidence,
        suggested: true,
        reasoning: mapping.reasoning,
      }));
    } catch (error) {
      console.error('Error generating AI mappings:', error);
      return [];
    }
  }

  /**
   * Calculate string similarity between two strings (Levenshtein distance based)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    // Normalize strings for comparison
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    // Convert to similarity (1 - normalized distance)
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;

    // Create distance matrix
    const d: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;

    // Fill the matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        d[i][j] = Math.min(
          d[i - 1][j] + 1, // deletion
          d[i][j - 1] + 1, // insertion
          d[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return d[m][n];
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
   * Apply field mappings to transform data
   */
  private applyFieldMappings(data: any, mappings: FieldMapping[]): any {
    if (Array.isArray(data)) {
      // Handle array of features or records
      return data.map(item => this.transformSingleItem(item, mappings));
    } else {
      // Handle single item
      return this.transformSingleItem(data, mappings);
    }
  }

  /**
   * Transform a single data item using field mappings
   */
  private transformSingleItem(item: any, mappings: FieldMapping[]): any {
    // Create a new object for the transformed data
    const transformed: any = {};

    // For GeoJSON features, preserve geometry
    if (item.type === 'Feature' && item.geometry) {
      transformed.type = 'Feature';
      transformed.geometry = JSON.parse(JSON.stringify(item.geometry));

      // Transform properties
      transformed.properties = {};
      if (item.properties) {
        for (const mapping of mappings) {
          if (item.properties[mapping.sourceField] !== undefined) {
            transformed.properties[mapping.targetField] = item.properties[mapping.sourceField];
          }
        }
      }

      return transformed;
    }

    // Handle regular objects
    for (const mapping of mappings) {
      if (item[mapping.sourceField] !== undefined) {
        transformed[mapping.targetField] = item[mapping.sourceField];
      }
    }

    return transformed;
  }

  /**
   * Validate data against a schema
   */
  private async validateAgainstSchema(data: any, schema: any): Promise<any> {
    // This is a placeholder for schema validation
    // In a real implementation, you would use a proper JSON Schema validator

    const requiredFields = this.getRequiredFields(schema);
    const issues: any[] = [];

    // Check if data is an array
    const items = Array.isArray(data) ? data : [data];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemProperties = item.type === 'Feature' ? item.properties : item;

      // Check required fields
      for (const field of requiredFields) {
        if (itemProperties[field] === undefined) {
          issues.push({
            index: i,
            field,
            message: `Required field '${field}' is missing`,
            severity: 'error',
          });
        }
      }

      // Additional validation could be added here
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get required fields from a schema
   */
  private getRequiredFields(schema: any): string[] {
    if (!schema) return [];

    // Handle different schema formats
    if (schema.required && Array.isArray(schema.required)) {
      // JSON Schema format
      return schema.required;
    } else if (schema.fields && Array.isArray(schema.fields)) {
      // Array of field definitions
      return schema.fields
        .filter((field: any) => {
          if (typeof field === 'string') return false;
          return field.required === true;
        })
        .map((field: any) => field.name || field.field);
    }

    return [];
  }

  /**
   * Summarize a schema for logging
   */
  private summarizeSchema(schema: any): any {
    const fields = this.extractFieldNames(schema);
    const required = this.getRequiredFields(schema);

    return {
      fieldCount: fields.length,
      fields,
      requiredFields: required,
    };
  }

  /**
   * Handle field mapping requests
   */
  private async handleFieldMappingRequest(message: any): Promise<any> {
    try {
      const { sourceSchema, targetSchema, options } = message.data;

      if (!sourceSchema || !targetSchema) {
        return {
          success: false,
          error: 'Invalid field mapping request. Missing required parameters.',
        };
      }

      // Log the operation
      await this.logActivity('field_mapping', 'Processing field mapping request');

      // Generate field mappings
      const mappings = await this.generateFieldMappings(sourceSchema, targetSchema, options);

      return {
        success: true,
        mappings,
        metadata: {
          timestamp: new Date().toISOString(),
          sourceSchemaSummary: this.summarizeSchema(sourceSchema),
          targetSchemaSummary: this.summarizeSchema(targetSchema),
        },
      };
    } catch (error) {
      console.error('Error handling field mapping request:', error);
      await this.logActivity('error', `Field mapping error: ${(error as Error).message}`, {
        error: (error as Error).message,
      });

      return {
        success: false,
        error: `Failed to generate field mappings: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Handle data validation requests
   */
  private async handleDataValidationRequest(message: any): Promise<any> {
    try {
      const { data, schema } = message.data;

      if (!data || !schema) {
        return {
          success: false,
          error: 'Invalid data validation request. Missing required parameters.',
        };
      }

      // Log the operation
      await this.logActivity('data_validation', 'Processing data validation request');

      // Validate data against schema
      const validationResult = await this.validateAgainstSchema(data, schema);

      return {
        success: true,
        validation: validationResult,
        metadata: {
          timestamp: new Date().toISOString(),
          schemaSummary: this.summarizeSchema(schema),
          recordCount: Array.isArray(data) ? data.length : 1,
        },
      };
    } catch (error) {
      console.error('Error handling data validation request:', error);
      await this.logActivity('error', `Data validation error: ${(error as Error).message}`, {
        error: (error as Error).message,
      });

      return {
        success: false,
        error: `Failed to validate data: ${(error as Error).message}`,
      };
    }
  }
}
