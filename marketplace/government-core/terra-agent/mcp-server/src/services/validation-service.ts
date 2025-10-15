/**
 * Validation Service for TerraAgent MCP Server
 * Handles input validation for all MCP tools
 */

import { MCPTool, ValidationResult } from '../types/mcp-types.js';

export class ValidationService {
  constructor() {}

  /**
   * Validate tool input against schema
   */
  public validateToolInput(tool: MCPTool, input: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic validation - check if input is provided
      if (input === null || input === undefined) {
        errors.push('Input is required');
        return { valid: false, errors, warnings };
      }

      // Validate against JSON schema if available
      if (tool.inputSchema) {
        const schemaErrors = this.validateAgainstSchema(input, tool.inputSchema);
        errors.push(...schemaErrors);
      }

      // Tool-specific validation
      const toolErrors = this.validateToolSpecific(tool.name, input);
      errors.push(...toolErrors);

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate input against JSON schema
   */
  private validateAgainstSchema(input: any, schema: any): string[] {
    const errors: string[] = [];

    // Basic type checking
    if (schema.type) {
      const inputType = Array.isArray(input) ? 'array' : typeof input;
      if (inputType !== schema.type) {
        errors.push(`Expected type ${schema.type}, got ${inputType}`);
      }
    }

    // Required properties
    if (schema.required && Array.isArray(schema.required)) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in input)) {
          errors.push(`Required property '${requiredProp}' is missing`);
        }
      }
    }

    // Property validation
    if (schema.properties && typeof input === 'object') {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propName in input) {
          const propErrors = this.validateAgainstSchema(input[propName], propSchema);
          errors.push(...propErrors.map(err => `Property '${propName}': ${err}`));
        }
      }
    }

    return errors;
  }

  /**
   * Tool-specific validation logic
   */
  private validateToolSpecific(toolName: string, input: any): string[] {
    const errors: string[] = [];

    switch (toolName) {
      case 'property-search':
        errors.push(...this.validatePropertySearch(input));
        break;
      case 'property-analysis':
        errors.push(...this.validatePropertyAnalysis(input));
        break;
      case 'assessment':
        errors.push(...this.validateAssessment(input));
        break;
      case 'market-analysis':
        errors.push(...this.validateMarketAnalysis(input));
        break;
      case 'comparative-analysis':
        errors.push(...this.validateComparativeAnalysis(input));
        break;
      case 'property-valuation':
        errors.push(...this.validatePropertyValuation(input));
        break;
      case 'neighborhood-analysis':
        errors.push(...this.validateNeighborhoodAnalysis(input));
        break;
      case 'tax-calculation':
        errors.push(...this.validateTaxCalculation(input));
        break;
      case 'property-history':
        errors.push(...this.validatePropertyHistory(input));
        break;
      case 'document-analysis':
        errors.push(...this.validateDocumentAnalysis(input));
        break;
    }

    return errors;
  }

  private validatePropertySearch(input: any): string[] {
    const errors: string[] = [];

    // Validate that at least one search criterion is provided
    const hasCriteria = input.address || input.parcelId || input.location || input.filters;
    if (!hasCriteria) {
      errors.push('At least one search criterion must be provided (address, parcelId, location, or filters)');
    }

    // Validate location bounds
    if (input.location?.boundingBox) {
      const { northEast, southWest } = input.location.boundingBox;
      if (northEast.latitude <= southWest.latitude) {
        errors.push('Invalid bounding box: northEast latitude must be greater than southWest latitude');
      }
      if (northEast.longitude <= southWest.longitude) {
        errors.push('Invalid bounding box: northEast longitude must be greater than southWest longitude');
      }
    }

    // Validate radius search
    if (input.location?.radius) {
      if (input.location.radius.radiusMiles <= 0) {
        errors.push('Radius must be greater than 0');
      }
      if (input.location.radius.radiusMiles > 50) {
        errors.push('Radius cannot exceed 50 miles');
      }
    }

    return errors;
  }

  private validatePropertyAnalysis(input: any): string[] {
    const errors: string[] = [];

    if (!input.propertyId && !input.address && !input.parcelId) {
      errors.push('Property identifier is required (propertyId, address, or parcelId)');
    }

    if (input.analysisTypes && Array.isArray(input.analysisTypes)) {
      const validTypes = ['valuation', 'market', 'comparables', 'risk', 'neighborhood'];
      for (const type of input.analysisTypes) {
        if (!validTypes.includes(type)) {
          errors.push(`Invalid analysis type: ${type}`);
        }
      }
    }

    return errors;
  }

  private validateAssessment(input: any): string[] {
    const errors: string[] = [];

    if (!input.propertyId && !input.parcelId) {
      errors.push('Property identifier is required (propertyId or parcelId)');
    }

    if (input.assessmentYear) {
      const currentYear = new Date().getFullYear();
      if (input.assessmentYear < 1900 || input.assessmentYear > currentYear) {
        errors.push(`Assessment year must be between 1900 and ${currentYear}`);
      }
    }

    return errors;
  }

  private validateMarketAnalysis(input: any): string[] {
    const errors: string[] = [];

    if (!input.location && !input.zipCode && !input.municipality) {
      errors.push('Location identifier is required (location, zipCode, or municipality)');
    }

    if (input.timeframe) {
      const validTimeframes = ['1month', '3months', '6months', '1year', '2years', '5years'];
      if (!validTimeframes.includes(input.timeframe)) {
        errors.push(`Invalid timeframe: ${input.timeframe}`);
      }
    }

    return errors;
  }

  private validateComparativeAnalysis(input: any): string[] {
    const errors: string[] = [];

    if (!input.subjectProperty) {
      errors.push('Subject property is required');
    }

    if (input.maxComparables) {
      if (input.maxComparables < 1 || input.maxComparables > 20) {
        errors.push('maxComparables must be between 1 and 20');
      }
    }

    if (input.maxDistance) {
      if (input.maxDistance <= 0 || input.maxDistance > 10) {
        errors.push('maxDistance must be between 0 and 10 miles');
      }
    }

    return errors;
  }

  private validatePropertyValuation(input: any): string[] {
    const errors: string[] = [];

    if (!input.propertyId && !input.address) {
      errors.push('Property identifier is required (propertyId or address)');
    }

    if (input.valuationMethods && Array.isArray(input.valuationMethods)) {
      const validMethods = ['sales_comparison', 'cost_approach', 'income_approach', 'automated_valuation'];
      for (const method of input.valuationMethods) {
        if (!validMethods.includes(method)) {
          errors.push(`Invalid valuation method: ${method}`);
        }
      }
    }

    return errors;
  }

  private validateNeighborhoodAnalysis(input: any): string[] {
    const errors: string[] = [];

    if (!input.location && !input.address && !input.zipCode) {
      errors.push('Location identifier is required (location, address, or zipCode)');
    }

    if (input.radius) {
      if (input.radius <= 0 || input.radius > 5) {
        errors.push('Radius must be between 0 and 5 miles for neighborhood analysis');
      }
    }

    return errors;
  }

  private validateTaxCalculation(input: any): string[] {
    const errors: string[] = [];

    if (!input.propertyId && !input.assessedValue) {
      errors.push('Either propertyId or assessedValue is required');
    }

    if (input.assessedValue && input.assessedValue <= 0) {
      errors.push('Assessed value must be greater than 0');
    }

    if (input.taxYear) {
      const currentYear = new Date().getFullYear();
      if (input.taxYear < 1900 || input.taxYear > currentYear + 1) {
        errors.push(`Tax year must be between 1900 and ${currentYear + 1}`);
      }
    }

    return errors;
  }

  private validatePropertyHistory(input: any): string[] {
    const errors: string[] = [];

    if (!input.propertyId && !input.parcelId && !input.address) {
      errors.push('Property identifier is required (propertyId, parcelId, or address)');
    }

    if (input.startDate && input.endDate) {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      if (start >= end) {
        errors.push('Start date must be before end date');
      }
    }

    return errors;
  }

  private validateDocumentAnalysis(input: any): string[] {
    const errors: string[] = [];

    if (!input.documentId && !input.documentUrl && !input.content) {
      errors.push('Document identifier is required (documentId, documentUrl, or content)');
    }

    if (input.analysisTypes && Array.isArray(input.analysisTypes)) {
      const validTypes = ['extract_data', 'summarize', 'classify', 'extract_entities', 'sentiment'];
      for (const type of input.analysisTypes) {
        if (!validTypes.includes(type)) {
          errors.push(`Invalid analysis type: ${type}`);
        }
      }
    }

    return errors;
  }
}
