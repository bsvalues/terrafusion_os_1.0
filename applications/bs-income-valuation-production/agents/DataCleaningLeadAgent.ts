/**
 * Data Cleaning Lead Agent
 * 
 * This module implements the Data Cleaning Lead Agent, which is responsible
 * for coordinating and leading the Data Cleaning domain agents.
 * It ensures data quality standards and best practices in data processing.
 */

import { ComponentLeadAgent, ComponentDomain } from './ComponentLeadAgent';
import { AgentMessage, EventType } from '../shared/agentProtocol';

/**
 * Configuration options specific to the Data Cleaning Lead Agent
 */
interface DataCleaningLeadConfig {
  outlierDetectionSensitivity: number;
  autoCorrectThreshold: number;
  dataConsistencyCheckLevel: 'low' | 'medium' | 'high';
  enableFieldValidation: boolean;
  enableDuplicateDetection: boolean;
}

/**
 * Default configuration for Data Cleaning Lead Agent
 */
const DEFAULT_DATA_CLEANING_CONFIG: DataCleaningLeadConfig = {
  outlierDetectionSensitivity: 0.8,
  autoCorrectThreshold: 0.9,
  dataConsistencyCheckLevel: 'medium',
  enableFieldValidation: true,
  enableDuplicateDetection: true
};

/**
 * Data format for validation
 */
interface DataRecord {
  [key: string]: any;
}

/**
 * Data field validation rule
 */
interface FieldValidationRule {
  fieldName: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  allowedValues?: any[];
  nestedRules?: FieldValidationRule[];
}

/**
 * Data Cleaning Lead Agent - Leads the Data Cleaning domain
 */
export class DataCleaningLeadAgent extends ComponentLeadAgent {
  private dataCleaningConfig: DataCleaningLeadConfig;
  private fieldValidationRules: Record<string, FieldValidationRule[]> = {};
  
  /**
   * Create a new Data Cleaning Lead Agent
   * @param agentId Unique identifier for this agent
   * @param config Configuration options
   * @param dataCleaningConfig Data cleaning-specific configuration
   */
  constructor(
    agentId: string, 
    config: any = {}, 
    dataCleaningConfig: Partial<DataCleaningLeadConfig> = {}
  ) {
    super(agentId, ComponentDomain.DATA_CLEANING, config);
    
    // Initialize data cleaning-specific configuration
    this.dataCleaningConfig = {
      ...DEFAULT_DATA_CLEANING_CONFIG,
      ...dataCleaningConfig
    };
    
    // Initialize field validation rules
    this.initializeFieldValidationRules();
    
    this.logMessage('Data Cleaning Lead Agent initialized with config: ' + 
      JSON.stringify(this.dataCleaningConfig));
  }
  
  /**
   * Set up agent capabilities
   */
  protected setupCapabilities(): void {
    this.capabilities = [
      'data_cleaning_lead',
      'outlier_detection',
      'data_validation',
      'format_standardization',
      'duplicate_detection',
      'data_consistency_checking',
      'missing_value_handling'
    ];
  }
  
  /**
   * Initialize domain-specific best practices
   */
  protected initializeBestPractices(): void {
    this.bestPractices = [
      {
        id: 'data-001',
        name: 'Missing Value Handling',
        description: 'All required fields should have non-null, non-empty values',
        checkFunction: (data: any) => {
          // Check if the data is an array of records
          const records = Array.isArray(data) ? data : [data];
          
          // Check for required fields based on data type
          for (const record of records) {
            const dataType = record.dataType || 'generic';
            const rules = this.fieldValidationRules[dataType] || [];
            
            for (const rule of rules) {
              if (rule.required) {
                const value = record[rule.fieldName];
                if (value === undefined || value === null || value === '') {
                  return false;
                }
              }
            }
          }
          
          return true;
        },
        fixFunction: undefined, // No automatic fix available
        severity: 'high'
      },
      {
        id: 'data-002',
        name: 'Numeric Outlier Detection',
        description: 'Numeric values should be within expected ranges',
        checkFunction: (data: any) => {
          // Check if the data is an array of records
          const records = Array.isArray(data) ? data : [data];
          
          // Check for numeric outliers
          for (const record of records) {
            const dataType = record.dataType || 'generic';
            const rules = this.fieldValidationRules[dataType] || [];
            
            for (const rule of rules) {
              if (rule.type === 'number' && record[rule.fieldName] !== undefined) {
                const value = record[rule.fieldName];
                
                if (rule.minValue !== undefined && value < rule.minValue) {
                  return false;
                }
                
                if (rule.maxValue !== undefined && value > rule.maxValue) {
                  return false;
                }
              }
            }
          }
          
          return true;
        },
        fixFunction: (data: any) => {
          // Create deep copy to avoid modifying original
          const fixedData = JSON.parse(JSON.stringify(data));
          
          // Check if the data is an array of records
          const isArray = Array.isArray(fixedData);
          const records = isArray ? fixedData : [fixedData];
          
          // Fix numeric outliers
          for (const record of records) {
            const dataType = record.dataType || 'generic';
            const rules = this.fieldValidationRules[dataType] || [];
            
            for (const rule of rules) {
              if (rule.type === 'number' && record[rule.fieldName] !== undefined) {
                const value = record[rule.fieldName];
                
                if (rule.minValue !== undefined && value < rule.minValue) {
                  record[rule.fieldName] = rule.minValue;
                }
                
                if (rule.maxValue !== undefined && value > rule.maxValue) {
                  record[rule.fieldName] = rule.maxValue;
                }
              }
            }
          }
          
          return isArray ? fixedData : fixedData[0];
        },
        severity: 'medium'
      },
      {
        id: 'data-003',
        name: 'Consistent Data Types',
        description: 'Fields should have consistent data types across records',
        checkFunction: (data: any) => {
          // Only applicable to arrays of records
          if (!Array.isArray(data) || data.length <= 1) {
            return true;
          }
          
          // Check data type consistency
          for (const fieldName of Object.keys(data[0])) {
            const firstType = typeof data[0][fieldName];
            
            for (let i = 1; i < data.length; i++) {
              if (data[i][fieldName] !== undefined && 
                  typeof data[i][fieldName] !== firstType) {
                return false;
              }
            }
          }
          
          return true;
        },
        fixFunction: undefined, // No automatic fix available
        severity: 'high'
      },
      {
        id: 'data-004',
        name: 'String Format Validation',
        description: 'String fields should match their required patterns',
        checkFunction: (data: any) => {
          // Check if the data is an array of records
          const records = Array.isArray(data) ? data : [data];
          
          // Check string patterns
          for (const record of records) {
            const dataType = record.dataType || 'generic';
            const rules = this.fieldValidationRules[dataType] || [];
            
            for (const rule of rules) {
              if (rule.type === 'string' && record[rule.fieldName] !== undefined) {
                const value = record[rule.fieldName];
                
                if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
                  return false;
                }
                
                if (rule.minLength !== undefined && value.length < rule.minLength) {
                  return false;
                }
                
                if (rule.maxLength !== undefined && value.length > rule.maxLength) {
                  return false;
                }
                
                if (rule.allowedValues && !rule.allowedValues.includes(value)) {
                  return false;
                }
              }
            }
          }
          
          return true;
        },
        fixFunction: undefined, // No automatic fix available
        severity: 'medium'
      },
      {
        id: 'data-005',
        name: 'Duplicate Record Detection',
        description: 'Data sets should not contain duplicate records',
        checkFunction: (data: any) => {
          // Only applicable to arrays of records
          if (!Array.isArray(data) || data.length <= 1) {
            return true;
          }
          
          // Check for duplicates using a simple hash approach
          const seenHashes = new Set<string>();
          
          for (const record of data) {
            // Create a string hash of the record
            const hash = JSON.stringify(record);
            
            if (seenHashes.has(hash)) {
              return false; // Duplicate found
            }
            
            seenHashes.add(hash);
          }
          
          return true;
        },
        fixFunction: (data: any) => {
          // Only applicable to arrays of records
          if (!Array.isArray(data) || data.length <= 1) {
            return data;
          }
          
          // Remove duplicates using a hash approach
          const uniqueRecords: any[] = [];
          const seenHashes = new Set<string>();
          
          for (const record of data) {
            const hash = JSON.stringify(record);
            
            if (!seenHashes.has(hash)) {
              uniqueRecords.push(record);
              seenHashes.add(hash);
            }
          }
          
          return uniqueRecords;
        },
        severity: 'medium'
      }
    ];
  }
  
  /**
   * Initialize field validation rules for different data types
   */
  private initializeFieldValidationRules(): void {
    // Property data validation rules
    this.fieldValidationRules['property'] = [
      {
        fieldName: 'propertyId',
        required: true,
        type: 'string',
        minLength: 3,
        pattern: '^[A-Za-z0-9-]+$'
      },
      {
        fieldName: 'address',
        required: true,
        type: 'string',
        minLength: 5
      },
      {
        fieldName: 'squareFeet',
        required: true,
        type: 'number',
        minValue: 100,
        maxValue: 1000000
      },
      {
        fieldName: 'yearBuilt',
        required: true,
        type: 'number',
        minValue: 1800,
        maxValue: new Date().getFullYear()
      },
      {
        fieldName: 'propertyType',
        required: true,
        type: 'string',
        allowedValues: ['residential', 'commercial', 'industrial', 'agricultural', 'mixed']
      }
    ];
    
    // Income data validation rules
    this.fieldValidationRules['income'] = [
      {
        fieldName: 'propertyId',
        required: true,
        type: 'string',
        minLength: 3,
        pattern: '^[A-Za-z0-9-]+$'
      },
      {
        fieldName: 'grossIncome',
        required: true,
        type: 'number',
        minValue: 0
      },
      {
        fieldName: 'operatingExpenses',
        required: true,
        type: 'number',
        minValue: 0
      },
      {
        fieldName: 'netIncome',
        required: true,
        type: 'number'
      },
      {
        fieldName: 'reportingPeriod',
        required: true,
        type: 'string',
        pattern: '^\\d{4}-\\d{2}$' // YYYY-MM format
      }
    ];
    
    // Market data validation rules
    this.fieldValidationRules['market'] = [
      {
        fieldName: 'region',
        required: true,
        type: 'string'
      },
      {
        fieldName: 'metric',
        required: true,
        type: 'string'
      },
      {
        fieldName: 'value',
        required: true,
        type: 'number'
      },
      {
        fieldName: 'date',
        required: true,
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$' // YYYY-MM-DD format
      }
    ];
    
    // Generic data validation (fallback)
    this.fieldValidationRules['generic'] = [
      {
        fieldName: 'id',
        required: true,
        type: 'string'
      },
      {
        fieldName: 'timestamp',
        required: true,
        type: 'string'
      }
    ];
  }
  
  /**
   * Provide domain-specific assistance to requesting agents
   * @param requestMessage The assistance request message
   */
  protected provideDomainAssistance(requestMessage: AgentMessage): void {
    const { payload, correlationId, sourceAgentId } = requestMessage;
    
    let assistance = '';
    let confidence = 0;
    
    // Determine the type of assistance needed
    if (payload.problemDescription.toLowerCase().includes('missing value')) {
      assistance = this.provideMissingValueGuidance(payload.context);
      confidence = 0.9;
    } else if (payload.problemDescription.toLowerCase().includes('outlier')) {
      assistance = this.provideOutlierDetectionGuidance(payload.context);
      confidence = 0.85;
    } else if (payload.problemDescription.toLowerCase().includes('format') || 
               payload.problemDescription.toLowerCase().includes('standard')) {
      assistance = this.provideFormatStandardizationGuidance(payload.context);
      confidence = 0.9;
    } else if (payload.problemDescription.toLowerCase().includes('duplicate')) {
      assistance = this.provideDuplicateDetectionGuidance(payload.context);
      confidence = 0.95;
    } else {
      assistance = this.provideGeneralDataCleaningGuidance(payload.problemDescription);
      confidence = 0.7;
    }
    
    // Send assistance response
    const assistanceMessage: AgentMessage = {
      messageId: crypto.randomUUID(),
      correlationId: correlationId,
      sourceAgentId: this.agentId,
      targetAgentId: sourceAgentId,
      timestamp: new Date().toISOString(),
      eventType: EventType.ASSISTANCE_RESPONSE,
      payload: {
        assistance,
        confidence,
        domain: ComponentDomain.DATA_CLEANING,
        references: this.getRelevantReferences(payload.problemDescription)
      }
    };
    
    this.sendMessage(assistanceMessage);
    this.logMessage(`Provided data cleaning assistance to ${sourceAgentId}`);
  }
  
  /**
   * Provide guidance on missing value handling
   * @param context Context information
   * @returns Missing value handling guidance
   */
  private provideMissingValueGuidance(context: any): string {
    return `
      Missing Value Handling Guidance:
      
      1. Identification strategies:
         - Null checks: Look for null, undefined, NaN, or empty string values
         - Pattern detection: Look for placeholder values like -999, 9999, or N/A
         - Consistency checks: Compare fields that should have related values
      
      2. Handling approaches by field type:
         - Categorical fields: Use mode or most frequent category
         - Numeric fields with nearby values: Linear interpolation
         - Numeric fields without nearby values: Mean/median with appropriate binning
         - Date fields: Linear interpolation or previous/next value
         - Text fields: Leave empty or use "(Not provided)" indicator
      
      3. Documentation requirements:
         - Record count of missing values by field
         - Method used for each field
         - Impact assessment on analysis results
         - Flag imputed values in the output
      
      4. Best practices:
         - Never use 0 as replacement for missing numeric values
         - Consider creating a "missing flag" feature for important fields
         - Use domain knowledge to establish plausible ranges
         - For time series, use time-aware imputation methods
         - When in doubt, exclude the record rather than imputing incorrectly
    `;
  }
  
  /**
   * Provide guidance on outlier detection
   * @param context Context information
   * @returns Outlier detection guidance
   */
  private provideOutlierDetectionGuidance(context: any): string {
    return `
      Outlier Detection and Handling Guidance:
      
      1. Statistical detection methods:
         - Z-score: Flag values where |z| > 3
         - IQR method: Flag values outside Q1-1.5*IQR to Q3+1.5*IQR
         - DBSCAN clustering for multi-dimensional outliers
         - Isolation Forest for complex datasets
         - LOF (Local Outlier Factor) for density-based detection
      
      2. Domain-specific detection rules:
         - Property area: Values outside 100-100,000 sq ft for residential
         - Income ratios: NOI/GPI outside 0.35-0.75 range
         - Cap rates: Values outside 0.03-0.12 range
         - Price per square foot: Variance > 50% from neighborhood average
      
      3. Handling approaches:
         - Truncation: Cap values at acceptable thresholds
         - Removal: Exclude outlier records (document reason)
         - Transformation: Apply log or root transforms to compress range
         - Binning: Group values into bins to reduce outlier impact
         - Separate analysis: Analyze outliers separately to understand causes
      
      4. Documentation requirements:
         - Detection method used
         - Threshold values
         - Count and percentage of outliers
         - Handling method applied
         - Justification for approach
    `;
  }
  
  /**
   * Provide guidance on format standardization
   * @param context Context information
   * @returns Format standardization guidance
   */
  private provideFormatStandardizationGuidance(context: any): string {
    return `
      Data Format Standardization Guidance:
      
      1. Text field standardization:
         - Case normalization: lowercase for matching, title case for display
         - Whitespace normalization: trim leading/trailing, normalize internal
         - Special character handling: remove or encode based on field purpose
         - Abbreviation expansion: standardize common abbreviations
      
      2. Numeric field standardization:
         - Consistent decimal precision: Round to appropriate level
         - Unit conversion: Convert all values to standard units
         - Scaling: Apply consistent scaling (e.g., thousands, millions)
         - Format strings: Apply consistent format patterns
      
      3. Date/time standardization:
         - ISO 8601 format for storage: YYYY-MM-DD or YYYY-MM-DDThh:mm:ss
         - Consistent timezone handling: Store in UTC, display in local
         - Period representation: Use consistent start/end dating
         - Duration representation: Use consistent units (days, months, years)
      
      4. Categorical field standardization:
         - Create controlled vocabulary lists
         - Map variations to standard terms
         - Handle hierarchical categories consistently
         - Document mapping decisions for transparency
      
      5. Common property data standards:
         - Addresses: Follow USPS standardization
         - Property types: Use NAICS or custom hierarchy consistently
         - Area measurements: Always specify units (sq ft vs acres)
         - Location data: Use consistent coordinate system (e.g., WGS84)
    `;
  }
  
  /**
   * Provide guidance on duplicate detection
   * @param context Context information
   * @returns Duplicate detection guidance
   */
  private provideDuplicateDetectionGuidance(context: any): string {
    return `
      Duplicate Detection and Resolution Guidance:
      
      1. Detection strategies:
         - Exact matching: Compare full records for exact duplication
         - Fuzzy matching: Allow for minor variations using string similarity
         - Field-based matching: Compare specific key fields only
         - Phonetic matching: For name fields use Soundex or Metaphone
         - Address standardization and matching
      
      2. Similarity metrics to consider:
         - Levenshtein distance for text fields
         - Jaro-Winkler for names
         - Cosine similarity for text blocks
         - Jaccard index for field sets
         - Geospatial distance for locations
      
      3. Resolution approaches:
         - Most recent: Keep the record with the latest timestamp
         - Most complete: Keep the record with fewer missing values
         - Source priority: Prioritize more reliable data sources
         - Merge: Combine information from duplicate records
         - Flag: Keep all but mark as duplicates
      
      4. Property-specific strategies:
         - Address normalization before comparison
         - Parcel ID as primary deduplication key
         - Owner name + address for ownership records
         - Compare both current and historical information
         - Consider temporal overlaps for time-dependent data
    `;
  }
  
  /**
   * Provide general data cleaning guidance
   * @param problemDescription Description of the problem
   * @returns General data cleaning guidance
   */
  private provideGeneralDataCleaningGuidance(problemDescription: string): string {
    return `
      General Data Cleaning Guidance:
      
      1. Data cleaning workflow:
         - Initial assessment: Understand data structure and quality issues
         - Schema validation: Verify data conforms to expected structure
         - Missing data handling: Identify and address missing values
         - Outlier detection: Identify and handle anomalous values
         - Format standardization: Normalize formats across fields
         - Duplicate detection: Identify and resolve duplicate records
         - Consistency validation: Check for logical consistency
         - Documentation: Record all transformations applied
      
      2. Quality metrics to monitor:
         - Completeness: Percentage of non-missing values
         - Accuracy: Correctness when compared to known references
         - Consistency: Logical alignment between related fields
         - Timeliness: Age of data relative to analysis needs
         - Uniqueness: Freedom from duplication
         - Validity: Conformance to business rules and constraints
      
      3. Best practices:
         - Create reproducible cleaning pipelines
         - Preserve original data and document transformations
         - Apply domain knowledge in cleaning decisions
         - Validate outputs against known reliable samples
         - Balance automation with manual review for complex cases
         - Implement continuous data quality monitoring
    `;
  }
  
  /**
   * Get relevant references for a problem description
   * @param problemDescription Description of the problem
   * @returns Array of references
   */
  private getRelevantReferences(problemDescription: string): any[] {
    // In a real implementation, this would query a knowledge base
    const references = [
      {
        title: "Benton County Data Quality Standards",
        section: "5.3 - Data Cleaning Procedures",
        relevance: 0.9
      },
      {
        title: "Property Data Management Guidelines",
        section: "Field Validation Rules",
        relevance: 0.85
      },
      {
        title: "Data Science for Real Estate Valuation",
        section: "Chapter 3: Data Preprocessing",
        relevance: 0.8
      }
    ];
    
    return references;
  }
}