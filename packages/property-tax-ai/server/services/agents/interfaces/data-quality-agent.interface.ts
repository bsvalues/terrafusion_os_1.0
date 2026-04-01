/**
 * Data Quality Agent Interface
 * 
 * This interface defines the capabilities of the Data Quality Agent, which is responsible
 * for validating property data integrity, detecting anomalies, and ensuring data quality.
 * 
 * The agent works with the PropertyValidationEngine to apply validation rules and
 * identify potential issues with property data.
 */

export interface IDataQualityAgent {
  /**
   * Initialize the agent
   */
  initialize(): Promise<void>;
  
  /**
   * Validate a property against all applicable data quality rules
   * @param propertyId The ID of the property to validate
   * @param options Optional validation options
   * @returns Validation results including issues and statistics
   */
  validateProperty(propertyId: string, options?: any): Promise<{
    isValid: boolean;
    criticalIssues: number;
    errorIssues: number;
    warningIssues: number;
    infoIssues: number;
    totalIssues: number;
    issues: Array<{
      issueId: string;
      ruleId: string;
      level: string;
      message: string;
      details?: any;
    }>;
  }>;
  
  /**
   * Detect anomalies in property data using statistical methods
   * @param options Detection options including area, property type, or other filters
   * @returns Detected anomalies with descriptions and confidence scores
   */
  detectDataAnomalies(options: any): Promise<{
    anomalies: Array<{
      anomalyId: string;
      propertyId: string;
      field: string;
      expectedValue: any;
      actualValue: any;
      description: string;
      confidenceScore: number;
      severity: string;
    }>;
    statisticalSummary: {
      totalPropertiesAnalyzed: number;
      anomalyRate: number;
      mostCommonAnomaly: string;
      mostAffectedField: string;
    };
  }>;
  
  /**
   * Generate a data quality report for a specified dataset
   * @param datasetType Type of dataset (e.g., 'properties', 'land_records', 'improvements')
   * @param options Report options including filters and output format
   * @returns Data quality report with statistics and issue summary
   */
  generateDataQualityReport(datasetType: string, options?: any): Promise<{
    reportId: string;
    datasetType: string;
    generatedAt: Date;
    recordsAnalyzed: number;
    qualityScore: number;
    completenessScore: number;
    accuracyScore: number;
    consistencyScore: number;
    issuesByLevel: {
      critical: number;
      error: number;
      warning: number;
      info: number;
    };
    topIssues: Array<{
      ruleId: string;
      count: number;
      description: string;
    }>;
    recommendedActions: string[];
  }>;
  
  /**
   * Run a batch validation job on multiple properties
   * @param propertyIds Array of property IDs to validate
   * @param options Batch validation options
   * @returns Batch validation results
   */
  runBatchValidation(propertyIds: string[], options?: any): Promise<{
    batchId: string;
    totalProperties: number;
    validatedProperties: number;
    failedProperties: number;
    totalIssues: number;
    issuesByLevel: {
      critical: number;
      error: number;
      warning: number;
      info: number;
    };
    propertiesWithIssues: Array<{
      propertyId: string;
      issueCount: number;
      highestSeverity: string;
    }>;
  }>;
  
  /**
   * Fix common data quality issues automatically
   * @param propertyId The ID of the property to fix
   * @param options Fix options including rules to apply and verification method
   * @returns Results of the fix operation
   */
  autoFixIssues(propertyId: string, options: {
    issueTypes: string[];
    dryRun?: boolean;
    verificationLevel?: 'none' | 'basic' | 'thorough';
  }): Promise<{
    propertyId: string;
    fixedIssues: Array<{
      issueId: string;
      ruleId: string;
      field: string;
      oldValue: any;
      newValue: any;
      fixStatus: 'fixed' | 'failed' | 'skipped';
    }>;
    remainingIssues: number;
    verificationResults?: {
      verified: boolean;
      message: string;
    };
  }>;
}