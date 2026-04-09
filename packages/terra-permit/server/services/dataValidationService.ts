/**
 * Data Validation Service
 * This service provides advanced data validation, sanitization, and quality control
 * for imported permit data, ensuring data integrity and consistency.
 */

import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { storage } from "../storage";
import { InsertPermit, Permit } from "../../shared/schema";
import { errorHandlingService, ErrorCategory, ErrorSeverity } from "./errorHandlingService";

// Helper function to validate OpenAI API key
async function validateApiKey(): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured.");
  }
  return true;
}

/**
 * Interface for validation rule
 */
interface ValidationRule {
  id: string;
  name: string;
  description: string;
  field: string | null; // null means it applies to the entire record
  severity: 'error' | 'warning' | 'info';
  validate: (permit: Partial<InsertPermit> | Permit, allPermits?: Array<Partial<InsertPermit> | Permit>) => ValidationResult;
}

/**
 * Interface for validation result
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'info';
  suggestedFix?: Partial<InsertPermit>;
}

/**
 * Interface for batch validation result
 */
export interface BatchValidationResult {
  permitId: number;
  uploadId: number;
  validationResults: Array<{
    ruleId: string;
    ruleName: string;
    field: string | null;
    result: ValidationResult;
  }>;
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
}

/**
 * Interface for validation summary
 */
export interface ValidationSummary {
  totalPermits: number;
  validPermits: number;
  invalidPermits: number;
  errorsByRule: Record<string, number>;
  warningsByRule: Record<string, number>;
  topIssues: Array<{
    ruleId: string;
    ruleName: string;
    count: number;
    severity: 'error' | 'warning' | 'info';
  }>;
  suggestedActions: string[];
}

/**
 * Interface for AI-enhanced data analysis
 */
export interface DataQualityAnalysis {
  overview: {
    dataQualityScore: number; // 0-100
    completeness: number; // 0-100
    consistency: number; // 0-100
    accuracy: number; // 0-100
  };
  issues: Array<{
    type: 'missing_data' | 'inconsistent_format' | 'outlier' | 'potential_error';
    description: string;
    affectedRecords: number;
    suggestedAction: string;
  }>;
  patterns: Array<{
    field: string;
    pattern: string;
    coverage: number; // percentage of records following this pattern
  }>;
  recommendations: string[];
}

/**
 * DataValidationService provides advanced data validation and quality control
 */
export class DataValidationService {
  private validationRules: ValidationRule[] = [];
  private aiModel: ChatOpenAI = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.2,
    verbose: true
  });
  
  constructor() {
    // Initialize with built-in validation rules
    this.initializeValidationRules();
  }
  
  /**
   * Initialize built-in validation rules
   */
  private initializeValidationRules(): void {
    // Required fields validation
    this.validationRules.push({
      id: 'required-parcel-number',
      name: 'Required Parcel Number',
      description: 'Parcel number is required and must not be empty',
      field: 'parcelNumber',
      severity: 'error',
      validate: (permit) => {
        const valid = Boolean(permit.parcelNumber && permit.parcelNumber.trim());
        return {
          valid,
          message: valid ? undefined : 'Parcel number is required',
          severity: 'error'
        };
      }
    });
    
    // Format validation for parcel number
    this.validationRules.push({
      id: 'parcel-number-format',
      name: 'Parcel Number Format',
      description: 'Parcel number should follow the pattern XXX-XXX-XXX or similar',
      field: 'parcelNumber',
      severity: 'warning',
      validate: (permit) => {
        if (!permit.parcelNumber) {
          return { valid: true, severity: 'warning' }; // Skip if missing, covered by required rule
        }
        
        // Check for common parcel number formats
        const valid = /^[\w\d]+-[\w\d]+-[\w\d]+$/.test(permit.parcelNumber) ||
                    /^[\w\d]+\.[\w\d]+\.[\w\d]+$/.test(permit.parcelNumber);
        
        return {
          valid,
          message: valid ? undefined : 'Parcel number format is non-standard',
          severity: 'warning',
          suggestedFix: !valid && permit.parcelNumber ? {
            parcelNumber: permit.parcelNumber
              .replace(/\s+/g, '-')
              .replace(/[^\w\d-\.]/g, '')
          } : undefined
        };
      }
    });
    
    // Neighborhood code validation
    this.validationRules.push({
      id: 'neighborhood-code-format',
      name: 'Neighborhood Code Format',
      description: 'Neighborhood code should be in the format XNN where X is a letter and N are numbers',
      field: 'neighborhoodCode',
      severity: 'warning',
      validate: (permit) => {
        if (!permit.neighborhoodCode) {
          return { valid: false, message: 'Neighborhood code is missing', severity: 'warning' };
        }
        
        const valid = /^[A-Z]\d{2}$/.test(permit.neighborhoodCode);
        
        return {
          valid,
          message: valid ? undefined : 'Neighborhood code should be in format XNN (e.g., R01)',
          severity: 'warning',
          suggestedFix: !valid && permit.neighborhoodCode ? {
            neighborhoodCode: permit.neighborhoodCode
              .replace(/\s+/g, '')
              .replace(/[^A-Za-z0-9]/g, '')
              .toUpperCase()
              .substring(0, 3)
          } : undefined
        };
      }
    });
    
    // Permit description validation
    this.validationRules.push({
      id: 'description-length',
      name: 'Description Length',
      description: 'Permit description should be detailed enough (at least 10 characters)',
      field: 'permitDescription',
      severity: 'warning',
      validate: (permit) => {
        if (!permit.permitDescription) {
          return { valid: false, message: 'Permit description is missing', severity: 'warning' };
        }
        
        const valid = permit.permitDescription.length >= 10;
        
        return {
          valid,
          message: valid ? undefined : 'Permit description is too short',
          severity: 'warning'
        };
      }
    });
    
    // Value format validation
    this.validationRules.push({
      id: 'value-format',
      name: 'Value Format',
      description: 'Value should be a valid number or currency amount',
      field: 'value',
      severity: 'warning',
      validate: (permit) => {
        if (!permit.value) {
          return { valid: true, severity: 'warning' }; // Optional field
        }
        
        // Clean the value string and check if it's a valid number
        const cleanValue = permit.value.replace(/[$,\s]/g, '');
        const valid = !isNaN(parseFloat(cleanValue));
        
        return {
          valid,
          message: valid ? undefined : 'Value is not a valid number',
          severity: 'warning',
          suggestedFix: !valid ? {
            value: '0'
          } : undefined
        };
      }
    });
    
    // Date format validation
    this.validationRules.push({
      id: 'date-format',
      name: 'Date Format',
      description: 'Issue date should be a valid date',
      field: 'issueDate',
      severity: 'warning',
      validate: (permit) => {
        if (!permit.issueDate) {
          return { valid: true, severity: 'warning' }; // Optional field
        }
        
        const date = new Date(permit.issueDate);
        const valid = !isNaN(date.getTime());
        
        return {
          valid,
          message: valid ? undefined : 'Issue date is not a valid date',
          severity: 'warning',
          suggestedFix: !valid ? {
            issueDate: new Date().toISOString().split('T')[0]
          } : undefined
        };
      }
    });
    
    // Future date validation
    this.validationRules.push({
      id: 'future-date',
      name: 'Future Date Check',
      description: 'Issue date should not be in the future',
      field: 'issueDate',
      severity: 'error',
      validate: (permit) => {
        if (!permit.issueDate) {
          return { valid: true, severity: 'error' }; // Optional field
        }
        
        const date = new Date(permit.issueDate);
        if (isNaN(date.getTime())) {
          return { valid: true, severity: 'error' }; // Invalid date, covered by date-format rule
        }
        
        const valid = date <= new Date();
        
        return {
          valid,
          message: valid ? undefined : 'Issue date cannot be in the future',
          severity: 'error',
          suggestedFix: !valid ? {
            issueDate: new Date().toISOString().split('T')[0]
          } : undefined
        };
      }
    });
    
    // Duplicate parcel number validation (batch rule)
    this.validationRules.push({
      id: 'duplicate-parcel',
      name: 'Duplicate Parcel Number',
      description: 'Parcel number should not be duplicated within the same batch',
      field: 'parcelNumber',
      severity: 'warning',
      validate: (permit, allPermits = []) => {
        if (!permit.parcelNumber || allPermits.length <= 1) {
          return { valid: true, severity: 'warning' };
        }
        
        const duplicates = allPermits.filter(
          p => p !== permit && p.parcelNumber === permit.parcelNumber
        );
        
        const valid = duplicates.length === 0;
        
        return {
          valid,
          message: valid ? undefined : `Duplicate parcel number found (${duplicates.length} occurrences)`,
          severity: 'warning'
        };
      }
    });
    
    // Consistency validation for neighborhoods (batch rule)
    this.validationRules.push({
      id: 'consistent-neighborhood',
      name: 'Consistent Neighborhood',
      description: 'Permits with the same parcel number should have the same neighborhood code',
      field: 'neighborhoodCode',
      severity: 'warning',
      validate: (permit, allPermits = []) => {
        if (!permit.parcelNumber || !permit.neighborhoodCode || allPermits.length <= 1) {
          return { valid: true, severity: 'warning' };
        }
        
        // Find other permits with the same parcel number
        const relatedPermits = allPermits.filter(
          p => p !== permit && p.parcelNumber === permit.parcelNumber
        );
        
        if (relatedPermits.length === 0) {
          return { valid: true, severity: 'warning' };
        }
        
        // Check if any have different neighborhood codes
        const conflicts = relatedPermits.filter(
          p => p.neighborhoodCode && p.neighborhoodCode !== permit.neighborhoodCode
        );
        
        const valid = conflicts.length === 0;
        
        return {
          valid,
          message: valid ? undefined : 'Inconsistent neighborhood code for same parcel number',
          severity: 'warning'
        };
      }
    });
  }
  
  /**
   * Register a custom validation rule
   * @param rule The validation rule to register
   * @returns The ID of the registered rule
   */
  registerValidationRule(rule: Omit<ValidationRule, 'id'>): string {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newRule = { ...rule, id };
    
    this.validationRules.push(newRule);
    
    return id;
  }
  
  /**
   * Remove a validation rule by ID
   * @param ruleId The ID of the rule to remove
   * @returns True if the rule was found and removed, false otherwise
   */
  removeValidationRule(ruleId: string): boolean {
    const initialLength = this.validationRules.length;
    this.validationRules = this.validationRules.filter(rule => rule.id !== ruleId);
    
    return this.validationRules.length < initialLength;
  }
  
  /**
   * Get all registered validation rules
   * @returns Array of validation rules
   */
  getValidationRules(): ValidationRule[] {
    return [...this.validationRules];
  }
  
  /**
   * Validate a single permit against all rules
   * @param permit The permit to validate
   * @param allPermits Optional array of all permits for batch validation rules
   * @returns Validation results for the permit
   */
  validatePermit(
    permit: Partial<InsertPermit> | Permit,
    allPermits?: Array<Partial<InsertPermit> | Permit>
  ): Array<{ ruleId: string; ruleName: string; field: string | null; result: ValidationResult }> {
    return this.validationRules.map(rule => {
      try {
        const result = rule.validate(permit, allPermits);
        
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          field: rule.field,
          result
        };
      } catch (error) {
        // Log the error
        errorHandlingService.logError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorCategory.VALIDATION,
          ErrorSeverity.MEDIUM,
          { ruleId: rule.id, permitId: 'id' in permit ? permit.id : undefined }
        );
        
        // Return a validation error
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          field: rule.field,
          result: {
            valid: false,
            message: `Rule execution failed: ${error instanceof Error ? error.message : String(error)}`,
            severity: 'error'
          }
        };
      }
    });
  }
  
  /**
   * Validate a batch of permits
   * @param permits Array of permits to validate
   * @returns Validation results for each permit
   */
  validatePermitBatch(permits: Array<Permit | Partial<InsertPermit>>): BatchValidationResult[] {
    return permits.map(permit => {
      const validationResults = this.validatePermit(permit, permits);
      
      const isValid = validationResults.every(vr => vr.result.valid);
      const hasErrors = validationResults.some(vr => !vr.result.valid && vr.result.severity === 'error');
      const hasWarnings = validationResults.some(vr => !vr.result.valid && vr.result.severity === 'warning');
      
      return {
        permitId: 'id' in permit ? permit.id : -1,
        uploadId: 'uploadId' in permit ? permit.uploadId : -1,
        validationResults,
        isValid,
        hasErrors,
        hasWarnings
      };
    });
  }
  
  /**
   * Generate a validation summary for a batch of validation results
   * @param validationResults Array of batch validation results
   * @returns Summary of validation issues
   */
  generateValidationSummary(validationResults: BatchValidationResult[]): ValidationSummary {
    const totalPermits = validationResults.length;
    const validPermits = validationResults.filter(vr => vr.isValid).length;
    const invalidPermits = totalPermits - validPermits;
    
    // Count errors and warnings by rule
    const errorsByRule: Record<string, number> = {};
    const warningsByRule: Record<string, number> = {};
    
    validationResults.forEach(permitResult => {
      permitResult.validationResults.forEach(validation => {
        if (!validation.result.valid) {
          if (validation.result.severity === 'error') {
            errorsByRule[validation.ruleId] = (errorsByRule[validation.ruleId] || 0) + 1;
          } else if (validation.result.severity === 'warning') {
            warningsByRule[validation.ruleId] = (warningsByRule[validation.ruleId] || 0) + 1;
          }
        }
      });
    });
    
    // Identify top issues
    const topIssues: ValidationSummary['topIssues'] = [];
    
    // Add error issues
    Object.entries(errorsByRule)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([ruleId, count]) => {
        const rule = this.validationRules.find(r => r.id === ruleId);
        
        if (rule) {
          topIssues.push({
            ruleId,
            ruleName: rule.name,
            count,
            severity: 'error'
          });
        }
      });
    
    // Add warning issues
    Object.entries(warningsByRule)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([ruleId, count]) => {
        const rule = this.validationRules.find(r => r.id === ruleId);
        
        if (rule && !topIssues.some(i => i.ruleId === ruleId)) {
          topIssues.push({
            ruleId,
            ruleName: rule.name,
            count,
            severity: 'warning'
          });
        }
      });
    
    // Generate suggested actions
    const suggestedActions: string[] = [];
    
    if (invalidPermits > 0) {
      if (invalidPermits / totalPermits > 0.5) {
        suggestedActions.push("Review data format: More than 50% of permits have validation issues");
      }
      
      // Add specific suggestions based on top issues
      topIssues.forEach(issue => {
        const rule = this.validationRules.find(r => r.id === issue.ruleId);
        
        if (rule) {
          const fieldText = rule.field ? `in field '${rule.field}'` : '';
          const severityText = issue.severity === 'error' ? 'critical issues' : 'potential issues';
          
          suggestedActions.push(
            `Fix ${issue.count} ${severityText} ${fieldText} related to ${rule.name.toLowerCase()}`
          );
        }
      });
    }
    
    if (suggestedActions.length === 0 && invalidPermits > 0) {
      suggestedActions.push("Review validation results to address issues");
    } else if (suggestedActions.length === 0) {
      suggestedActions.push("No validation issues detected");
    }
    
    return {
      totalPermits,
      validPermits,
      invalidPermits,
      errorsByRule,
      warningsByRule,
      topIssues,
      suggestedActions
    };
  }
  
  /**
   * Apply suggested fixes to permits
   * @param permits Permits to fix
   * @param onlyAutoFix If true, only apply fixes for rules marked as auto-fixable
   * @returns Fixed permits and a report of changes made
   */
  applyAutomaticFixes(
    permits: Array<Permit | Partial<InsertPermit>>,
    onlyAutoFix: boolean = true
  ): { fixedPermits: Array<Permit | Partial<InsertPermit>>; report: Array<{ permitId: number; fixedFields: string[] }> } {
    const fixedPermits = [...permits];
    const report: Array<{ permitId: number; fixedFields: string[] }> = [];
    
    permits.forEach((permit, index) => {
      const validationResults = this.validatePermit(permit, permits);
      const fixedFields: string[] = [];
      
      // Apply fixes for each failed validation that has a suggestedFix
      validationResults.forEach(validation => {
        if (!validation.result.valid && validation.result.suggestedFix) {
          const rule = this.validationRules.find(r => r.id === validation.ruleId);
          
          // Only apply the fix if the rule is marked as auto-fixable or we're fixing everything
          if (rule && (!onlyAutoFix || rule.severity !== 'error')) {
            // Apply the suggested fix
            Object.entries(validation.result.suggestedFix).forEach(([field, value]) => {
              // @ts-ignore - We're dynamically updating fields
              fixedPermits[index][field] = value;
              
              // Add to fixed fields if not already present
              if (!fixedFields.includes(field)) {
                fixedFields.push(field);
              }
            });
          }
        }
      });
      
      // Add to report if any fields were fixed
      if (fixedFields.length > 0) {
        report.push({
          permitId: 'id' in permit ? permit.id : -1,
          fixedFields
        });
      }
    });
    
    return { fixedPermits, report };
  }
  
  /**
   * Perform AI-enhanced data quality analysis
   * @param permits Array of permits to analyze
   * @returns Detailed data quality analysis
   */
  async analyzeDataQuality(permits: Permit[]): Promise<DataQualityAnalysis> {
    try {
      await validateApiKey();
      
      if (permits.length === 0) {
        throw new Error("No permits provided for analysis");
      }
      
      // Calculate completeness score
      const completenessScores: Record<string, number> = {};
      const fields = ['parcelNumber', 'neighborhoodCode', 'permitDescription', 'value', 'issueDate'];
      
      // Calculate completeness for each field
      fields.forEach(field => {
        const presentCount = permits.filter(p => Boolean((p as any)[field])).length;
        completenessScores[field] = (presentCount / permits.length) * 100;
      });
      
      // Overall completeness
      const completeness = Object.values(completenessScores).reduce((sum, score) => sum + score, 0) / fields.length;
      
      // Calculate consistency score
      const consistencyScores: Record<string, number> = {};
      
      // Parcel number format consistency
      const parcelFormats: Record<string, number> = {};
      permits.forEach(permit => {
        if (permit.parcelNumber) {
          const format = permit.parcelNumber.replace(/[A-Za-z0-9]/g, 'X');
          parcelFormats[format] = (parcelFormats[format] || 0) + 1;
        }
      });
      
      const dominantParcelFormat = Object.entries(parcelFormats)
        .sort((a, b) => b[1] - a[1])[0];
      
      consistencyScores.parcelNumber = dominantParcelFormat 
        ? (dominantParcelFormat[1] / permits.length) * 100
        : 0;
      
      // Neighborhood code consistency
      const neighborhoodFormats: Record<string, number> = {};
      permits.forEach(permit => {
        if (permit.neighborhoodCode) {
          const format = permit.neighborhoodCode.replace(/[A-Za-z0-9]/g, 'X');
          neighborhoodFormats[format] = (neighborhoodFormats[format] || 0) + 1;
        }
      });
      
      const dominantNeighborhoodFormat = Object.entries(neighborhoodFormats)
        .sort((a, b) => b[1] - a[1])[0];
      
      consistencyScores.neighborhoodCode = dominantNeighborhoodFormat 
        ? (dominantNeighborhoodFormat[1] / permits.length) * 100
        : 0;
      
      // Date format consistency
      const dateFormats: Record<string, number> = {};
      permits.forEach(permit => {
        if (permit.issueDate) {
          try {
            const date = new Date(permit.issueDate);
            if (!isNaN(date.getTime())) {
              dateFormats.valid = (dateFormats.valid || 0) + 1;
            } else {
              dateFormats.invalid = (dateFormats.invalid || 0) + 1;
            }
          } catch {
            dateFormats.invalid = (dateFormats.invalid || 0) + 1;
          }
        }
      });
      
      consistencyScores.issueDate = dateFormats.valid 
        ? (dateFormats.valid / (dateFormats.valid + (dateFormats.invalid || 0))) * 100
        : 0;
      
      // Overall consistency
      const consistency = Object.values(consistencyScores).reduce((sum, score) => sum + score, 0) / 
                        Object.keys(consistencyScores).length;
      
      // Accuracy is harder to determine without ground truth, use validation results as a proxy
      const validationResults = this.validatePermitBatch(permits);
      const validCount = validationResults.filter(vr => vr.isValid).length;
      const accuracy = (validCount / permits.length) * 100;
      
      // Calculate overall score with weighted components
      const dataQualityScore = (completeness * 0.4) + (consistency * 0.4) + (accuracy * 0.2);
      
      // Identify common data issues
      const issues: DataQualityAnalysis['issues'] = [];
      
      // Missing data issues
      fields.forEach(field => {
        const missingCount = permits.length - permits.filter(p => Boolean((p as any)[field])).length;
        
        if (missingCount > 0 && missingCount / permits.length > 0.1) {
          issues.push({
            type: 'missing_data',
            description: `Field '${field}' is missing in ${missingCount} records (${((missingCount / permits.length) * 100).toFixed(1)}%)`,
            affectedRecords: missingCount,
            suggestedAction: `Ensure ${field} is collected consistently`
          });
        }
      });
      
      // Format inconsistency issues
      if (Object.keys(parcelFormats).length > 1) {
        issues.push({
          type: 'inconsistent_format',
          description: `Parcel numbers use ${Object.keys(parcelFormats).length} different formats`,
          affectedRecords: permits.length - (dominantParcelFormat ? dominantParcelFormat[1] : 0),
          suggestedAction: `Standardize parcel number format to ${dominantParcelFormat ? dominantParcelFormat[0] : 'XXX-XXX-XXX'}`
        });
      }
      
      if (Object.keys(neighborhoodFormats).length > 1) {
        issues.push({
          type: 'inconsistent_format',
          description: `Neighborhood codes use ${Object.keys(neighborhoodFormats).length} different formats`,
          affectedRecords: permits.length - (dominantNeighborhoodFormat ? dominantNeighborhoodFormat[1] : 0),
          suggestedAction: `Standardize neighborhood code format to ${dominantNeighborhoodFormat ? dominantNeighborhoodFormat[0] : 'XNN'}`
        });
      }
      
      // Identify potential outliers in value field
      const numericValues = permits
        .map(p => parseFloat(p.value?.replace(/[$,\s]/g, '') || '0'))
        .filter(v => !isNaN(v));
      
      if (numericValues.length > 0) {
        const mean = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
        const stdDev = Math.sqrt(
          numericValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / numericValues.length
        );
        
        const outliers = permits.filter(p => {
          const value = parseFloat(p.value?.replace(/[$,\s]/g, '') || '0');
          return !isNaN(value) && Math.abs(value - mean) > 2.5 * stdDev;
        });
        
        if (outliers.length > 0) {
          issues.push({
            type: 'outlier',
            description: `${outliers.length} permits have unusual value amounts (statistical outliers)`,
            affectedRecords: outliers.length,
            suggestedAction: 'Review permits with unusually high or low values'
          });
        }
      }
      
      // Identify patterns
      const patterns: DataQualityAnalysis['patterns'] = [];
      
      // Neighborhood code patterns
      const neighborhoodCodes = new Set(
        permits
          .map(p => p.neighborhoodCode)
          .filter(Boolean)
      );
      
      if (neighborhoodCodes.size > 0 && neighborhoodCodes.size < permits.length * 0.5) {
        patterns.push({
          field: 'neighborhoodCode',
          pattern: `Limited to ${neighborhoodCodes.size} unique codes`,
          coverage: (permits.filter(p => p.neighborhoodCode).length / permits.length) * 100
        });
      }
      
      // Description patterns
      const commonPhrases: Record<string, number> = {};
      permits.forEach(permit => {
        if (permit.permitDescription) {
          // Extract potential phrases (3+ word sequences)
          const words = permit.permitDescription.toLowerCase().split(/\s+/);
          
          if (words.length >= 3) {
            for (let i = 0; i <= words.length - 3; i++) {
              const phrase = words.slice(i, i + 3).join(' ');
              if (phrase.length >= 15) {
                commonPhrases[phrase] = (commonPhrases[phrase] || 0) + 1;
              }
            }
          }
        }
      });
      
      // Find phrases that appear in multiple permits
      const repeatedPhrases = Object.entries(commonPhrases)
        .filter(([_, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      repeatedPhrases.forEach(([phrase, count]) => {
        patterns.push({
          field: 'permitDescription',
          pattern: `"${phrase}..."`,
          coverage: (count / permits.length) * 100
        });
      });
      
      // Generate recommendations based on issues and patterns
      const recommendations: string[] = [
        `Improve data completeness, particularly for ${
          Object.entries(completenessScores)
            .filter(([_, score]) => score < 90)
            .map(([field]) => field)
            .join(', ') || 'all fields'
        }`,
        "Standardize data formats for consistent processing",
        "Implement automated validation during data entry"
      ];
      
      // Add issue-specific recommendations
      issues.forEach(issue => {
        if (!recommendations.includes(issue.suggestedAction)) {
          recommendations.push(issue.suggestedAction);
        }
      });
      
      return {
        overview: {
          dataQualityScore,
          completeness,
          consistency,
          accuracy
        },
        issues,
        patterns,
        recommendations
      };
    } catch (error) {
      // Log the error
      errorHandlingService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.PROCESSING,
        ErrorSeverity.HIGH,
        { action: 'analyzeDataQuality', permitCount: permits.length }
      );
      
      throw error;
    }
  }
  
  /**
   * Create a Zod schema for validating permits
   * @returns A Zod schema for permit validation
   */
  createZodSchema(): z.ZodType<Partial<InsertPermit>> {
    return z.object({
      uploadId: z.number().int().positive(),
      parcelNumber: z.string().min(1, "Parcel number is required"),
      neighborhoodCode: z.string().regex(/^[A-Z]\d{2}$/, "Neighborhood code must be in format XNN (e.g., R01)"),
      permitDescription: z.string().min(10, "Permit description must be at least 10 characters"),
      value: z.string().optional(),
      issueDate: z.string().optional()
        .refine(val => !val || !isNaN(new Date(val).getTime()), "Issue date must be a valid date")
        .refine(val => !val || new Date(val) <= new Date(), "Issue date cannot be in the future"),
      enterPermit: z.boolean().optional(),
      reason: z.string().optional()
    }).partial();
  }
}

export const dataValidationService = new DataValidationService();