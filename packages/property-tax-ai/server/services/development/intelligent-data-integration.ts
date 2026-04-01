/**
 * Intelligent Data Integration Service
 * 
 * Provides smart data integration capabilities for assessment models:
 * - Auto-mapping of data sources to model variables
 * - Data validation and anomaly detection
 * - Smart data transformations
 * - Semantic relationship detection
 */

import { AIAssistantService } from '../ai-assistant-service';
import { ModelVariable, DataSourceType } from '@shared/schema';
import { IStorage } from '../../storage';

// Type definitions for data integration
export type DataSourceMapping = {
  sourceField: string;
  targetVariable: string;
  confidence: number;
  transformation?: string;
};

export type DataSourceConfig = {
  type: DataSourceType;
  name: string;
  fields: {
    name: string;
    description?: string;
    type: string;
    sample?: any;
  }[];
  sampleData?: Record<string, any>[];
};

export type DataAnomalyResult = {
  field: string;
  anomalyType: 'outlier' | 'missing' | 'format' | 'inconsistent';
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestedAction?: string;
  affectedRows?: number[];
};

export type TransformationSuggestion = {
  sourceField: string;
  targetVariable: string;
  transformationType: 'format' | 'calculation' | 'normalization' | 'aggregation';
  description: string;
  code: string;
};

export class IntelligentDataIntegration {
  private aiAssistantService: AIAssistantService;
  private storage: IStorage;
  
  constructor(aiAssistantService: AIAssistantService, storage: IStorage) {
    this.aiAssistantService = aiAssistantService;
    this.storage = storage;
  }
  
  /**
   * Auto-map data source fields to model variables
   */
  async autoMapFields(
    dataSource: DataSourceConfig,
    modelId: string
  ): Promise<DataSourceMapping[]> {
    // Get model variables
    const variables = await this.storage.getModelVariablesByModel(modelId);
    
    if (!variables || variables.length === 0) {
      throw new Error('No variables found for the specified model');
    }
    
    const variablesInfo = variables.map(v => ({
      name: v.name,
      description: v.description || '',
      type: v.type
    }));
    
    // Prepare prompt for AI service
    const promptTemplate = `
You are an expert data integration system tasked with mapping data source fields to assessment model variables.

DATA SOURCE:
Name: ${dataSource.name}
Type: ${dataSource.type}

DATA SOURCE FIELDS:
${dataSource.fields.map(field => 
  `- ${field.name} (${field.type}): ${field.description || 'No description'}`
).join('\n')}

MODEL VARIABLES:
${variablesInfo.map(variable => 
  `- ${variable.name} (${variable.type}): ${variable.description}`
).join('\n')}

${dataSource.sampleData ? `
SAMPLE DATA:
${JSON.stringify(dataSource.sampleData.slice(0, 3), null, 2)}
` : ''}

Please analyze the data source fields and map them to the most appropriate model variables.
For each mapping, provide:
1. The source field name
2. The target variable name
3. A confidence score (0.0 to 1.0)
4. A transformation expression if needed

Return the results as a JSON array in the following format:
[
  {
    "sourceField": "field_name",
    "targetVariable": "variable_name",
    "confidence": 0.95,
    "transformation": "optional JavaScript transformation code"
  }
]

Only include mappings with confidence > 0.5. Sort by confidence (highest first).
`;

    // Try each available provider
    const providers = this.aiAssistantService.getAvailableProviders();
    
    if (providers.length === 0) {
      throw new Error('No AI providers available for field mapping');
    }
    
    for (const provider of providers) {
      try {
        const response = await this.aiAssistantService.generateResponse({
          message: promptTemplate,
          provider,
          options: {
            temperature: 0.2,
            maxTokens: 2000
          }
        });
        
        try {
          // Extract JSON response
          const jsonMatch = response.message.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) || 
                         response.message.match(/(\[[\s\S]*\])/);
                         
          if (jsonMatch && jsonMatch[1]) {
            return JSON.parse(jsonMatch[1]);
          } else {
            console.warn('Could not extract JSON from response:', response.message);
            
            // Fallback: return mappings for exact name matches
            return this.fallbackFieldMapping(dataSource.fields, variables);
          }
        } catch (parseError) {
          console.error('Error parsing mapping response:', parseError);
          return this.fallbackFieldMapping(dataSource.fields, variables);
        }
      } catch (error) {
        console.error(`Error mapping fields with provider ${provider}:`, error);
        // Continue to the next provider
      }
    }
    
    // If all providers failed, use fallback mapping
    return this.fallbackFieldMapping(dataSource.fields, variables);
  }
  
  /**
   * Fallback field mapping using exact name matches and name similarity
   */
  private fallbackFieldMapping(
    fields: DataSourceConfig['fields'], 
    variables: ModelVariable[]
  ): DataSourceMapping[] {
    const mappings: DataSourceMapping[] = [];
    
    // First pass: exact name matches
    fields.forEach(field => {
      const exactMatch = variables.find(v => 
        v.name.toLowerCase() === field.name.toLowerCase() || 
        v.name.toLowerCase().replace(/[_\s]/g, '') === field.name.toLowerCase().replace(/[_\s]/g, '')
      );
      
      if (exactMatch) {
        mappings.push({
          sourceField: field.name,
          targetVariable: exactMatch.name,
          confidence: 0.9 // High confidence for exact matches
        });
      }
    });
    
    // Second pass: partial name matches for remaining fields
    const mappedVariables = new Set(mappings.map(m => m.targetVariable));
    
    fields.forEach(field => {
      if (!mappings.some(m => m.sourceField === field.name)) {
        // Find best partial match
        const bestMatch = variables
          .filter(v => !mappedVariables.has(v.name))
          .map(v => ({
            variable: v,
            similarity: this.calculateStringSimilarity(field.name, v.name)
          }))
          .sort((a, b) => b.similarity - a.similarity)[0];
        
        if (bestMatch && bestMatch.similarity > 0.6) {
          mappings.push({
            sourceField: field.name,
            targetVariable: bestMatch.variable.name,
            confidence: bestMatch.similarity
          });
          mappedVariables.add(bestMatch.variable.name);
        }
      }
    });
    
    return mappings;
  }
  
  /**
   * Calculate string similarity (0-1) using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/[_\s]/g, '');
    const s2 = str2.toLowerCase().replace(/[_\s]/g, '');
    
    // Calculate Levenshtein distance
    const len1 = s1.length;
    const len2 = s2.length;
    const max = Math.max(len1, len2);
    
    if (max === 0) return 1;
    
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
    
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    // Convert distance to similarity score (0-1)
    return 1 - (matrix[len1][len2] / max);
  }
  
  /**
   * Detect anomalies in data
   */
  async detectAnomalies(
    data: Record<string, any>[],
    variableMapping: DataSourceMapping[]
  ): Promise<DataAnomalyResult[]> {
    if (!data || data.length === 0) {
      return [];
    }
    
    const anomalies: DataAnomalyResult[] = [];
    const fields = Object.keys(data[0]);
    
    // Statistically detect outliers and missing values
    fields.forEach(field => {
      // Get values for this field
      const values = data.map(row => row[field]);
      const mappedVariable = variableMapping.find(m => m.sourceField === field)?.targetVariable;
      
      // Check for missing values
      const missingCount = values.filter(v => v === null || v === undefined || v === '').length;
      if (missingCount > 0) {
        anomalies.push({
          field,
          anomalyType: 'missing',
          description: `Field '${field}'${mappedVariable ? ` (mapped to '${mappedVariable}')` : ''} has ${missingCount} missing values (${Math.round(missingCount / values.length * 100)}%)`,
          severity: missingCount / values.length > 0.5 ? 'high' : (missingCount / values.length > 0.2 ? 'medium' : 'low'),
          affectedRows: data.map((row, index) => row[field] === null || row[field] === undefined || row[field] === '' ? index : -1).filter(idx => idx !== -1)
        });
      }
      
      // Check for outliers in numeric fields
      if (values.every(v => v !== null && v !== undefined && !isNaN(Number(v)))) {
        const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
        const average = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
        const stdDev = Math.sqrt(numericValues.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / numericValues.length);
        
        const outliers = data.map((row, index) => {
          const value = Number(row[field]);
          return !isNaN(value) && Math.abs(value - average) > 3 * stdDev ? index : -1;
        }).filter(idx => idx !== -1);
        
        if (outliers.length > 0) {
          anomalies.push({
            field,
            anomalyType: 'outlier',
            description: `Field '${field}'${mappedVariable ? ` (mapped to '${mappedVariable}')` : ''} has ${outliers.length} outlier values (more than 3 standard deviations from mean)`,
            severity: outliers.length / values.length > 0.1 ? 'high' : 'medium',
            affectedRows: outliers
          });
        }
      }
      
      // Check for inconsistent formats in string fields
      if (values.some(v => typeof v === 'string')) {
        const patterns = new Set();
        const inconsistentRows: number[] = [];
        
        values.forEach((value, index) => {
          if (typeof value === 'string') {
            // Determine pattern: numeric, date, text
            let pattern = 'text';
            
            if (/^\d+$/.test(value)) {
              pattern = 'numeric';
            } else if (/^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/.test(value)) {
              pattern = 'date';
            } else if (/^\$?\d+(\.\d+)?$/.test(value)) {
              pattern = 'currency';
            }
            
            patterns.add(pattern);
            
            // If we have more than one pattern, mark as inconsistent
            if (patterns.size > 1) {
              inconsistentRows.push(index);
            }
          }
        });
        
        if (patterns.size > 1) {
          anomalies.push({
            field,
            anomalyType: 'inconsistent',
            description: `Field '${field}'${mappedVariable ? ` (mapped to '${mappedVariable}')` : ''} has inconsistent formats (${Array.from(patterns).join(', ')})`,
            severity: 'medium',
            affectedRows: inconsistentRows
          });
        }
      }
    });
    
    return anomalies;
  }
  
  /**
   * Suggest data transformations
   */
  async suggestTransformations(
    sourceMappings: DataSourceMapping[],
    sampleData: Record<string, any>[],
    modelId: string
  ): Promise<TransformationSuggestion[]> {
    // Get model variables
    const variables = await this.storage.getModelVariablesByModel(modelId);
    
    if (!variables || variables.length === 0) {
      throw new Error('No variables found for the specified model');
    }
    
    // Prepare prompt for AI service
    const promptTemplate = `
You are a data transformation expert helping to integrate data into an assessment model.

SAMPLE DATA:
${JSON.stringify(sampleData.slice(0, 2), null, 2)}

CURRENT FIELD MAPPINGS:
${sourceMappings.map(mapping => 
  `- Source: ${mapping.sourceField} → Target: ${mapping.targetVariable} (Confidence: ${mapping.confidence})`
).join('\n')}

MODEL VARIABLES:
${variables.map(variable => 
  `- ${variable.name} (${variable.type}): ${variable.description || 'No description'}`
).join('\n')}

Please suggest transformations for these mappings to ensure the data is properly formatted and optimized for the assessment model.
For each transformation, provide:
1. Source field name
2. Target variable name
3. Transformation type (format, calculation, normalization, aggregation)
4. Description of the transformation
5. JavaScript code to implement the transformation

Return the results as a JSON array in the following format:
[
  {
    "sourceField": "field_name",
    "targetVariable": "variable_name",
    "transformationType": "format|calculation|normalization|aggregation",
    "description": "Description of the transformation",
    "code": "JavaScript code for the transformation"
  }
]

Only suggest transformations where necessary (format conversions, calculations, etc.). Focus on practical code that handles edge cases.
`;

    // Try each available provider
    const providers = this.aiAssistantService.getAvailableProviders();
    
    if (providers.length === 0) {
      throw new Error('No AI providers available for transformation suggestions');
    }
    
    for (const provider of providers) {
      try {
        const response = await this.aiAssistantService.generateResponse({
          message: promptTemplate,
          provider,
          options: {
            temperature: 0.3,
            maxTokens: 2500
          }
        });
        
        try {
          // Extract JSON response
          const jsonMatch = response.message.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) || 
                         response.message.match(/(\[[\s\S]*\])/);
                         
          if (jsonMatch && jsonMatch[1]) {
            return JSON.parse(jsonMatch[1]);
          } else {
            console.warn('Could not extract JSON from response:', response.message);
            return [];
          }
        } catch (parseError) {
          console.error('Error parsing transformation suggestions:', parseError);
          return [];
        }
      } catch (error) {
        console.error(`Error suggesting transformations with provider ${provider}:`, error);
        // Continue to the next provider
      }
    }
    
    return [];
  }
}

// Singleton instance
let intelligentDataIntegration: IntelligentDataIntegration;

/**
 * Initialize the Intelligent Data Integration service
 */
export function initializeIntelligentDataIntegration(
  aiAssistantService: AIAssistantService,
  storage: IStorage
): IntelligentDataIntegration {
  intelligentDataIntegration = new IntelligentDataIntegration(aiAssistantService, storage);
  return intelligentDataIntegration;
}

/**
 * Get the Intelligent Data Integration service instance
 */
export function getIntelligentDataIntegration(): IntelligentDataIntegration {
  if (!intelligentDataIntegration) {
    throw new Error('Intelligent Data Integration service not initialized');
  }
  return intelligentDataIntegration;
}

export default intelligentDataIntegration;