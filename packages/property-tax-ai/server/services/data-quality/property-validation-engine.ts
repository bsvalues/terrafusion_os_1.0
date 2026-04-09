/**
 * Property Validation Engine
 * 
 * This service is responsible for validating property data according to configured rules
 * and Washington State property assessment standards. It supports:
 * 
 * 1. Validation rule management (CRUD operations)
 * 2. Validation of property data against rules
 * 3. Statistical profiling of property data
 * 4. Tracking and management of validation issues
 * 5. Integration with Washington State DOR requirements
 */

import { v4 as uuidv4 } from 'uuid';
import { IStorage } from '../../storage';
import { ValidationRule, ValidationIssue, Property, LandRecord, Improvement } from '../../../shared/schema';
import { logger } from '../../utils/logger';

// Rule categories
export enum RuleCategory {
  CLASSIFICATION = 'classification',
  VALUATION = 'valuation',
  PROPERTY_DATA = 'property_data',
  COMPLIANCE = 'compliance',
  DATA_QUALITY = 'data_quality',
  GEO_SPATIAL = 'geo_spatial',
  STATISTICAL = 'statistical'
}

// Rule severity levels
export enum RuleLevel {
  CRITICAL = 'critical',  // Blocking issue, must be resolved
  ERROR = 'error',        // Significant issue that should be addressed
  WARNING = 'warning',    // Potential issue that should be reviewed
  INFO = 'info'           // Informational finding
}

// Rule entity types
export enum EntityType {
  PROPERTY = 'property',
  LAND_RECORD = 'land_record',
  IMPROVEMENT = 'improvement',
  APPEAL = 'appeal',
  USER = 'user',
  COMPARABLE_SALE = 'comparable_sale',
  WORKFLOW = 'workflow'
}

// Issue status types
export enum IssueStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  WAIVED = 'waived'
}

// Validation context containing data used during validation
export interface ValidationContext {
  userId?: number;
  county?: string;
  validationDate: Date;
  additionalData?: Record<string, any>;
}

// Interface for rule evaluation functions
export interface RuleEvaluator {
  evaluate(entity: any, context?: ValidationContext): ValidationIssue | null;
}

/**
 * Property Validation Engine
 */
export class PropertyValidationEngine {
  private storage: IStorage;
  private ruleEvaluators: Map<string, RuleEvaluator>;
  private DEFAULT_CONTEXT: ValidationContext = {
    validationDate: new Date(),
    county: 'BENTON'
  };

  constructor(storage: IStorage) {
    this.storage = storage;
    this.ruleEvaluators = new Map();
    this.initializeRuleEvaluators();

    logger.info('PropertyValidationEngine initialized');
  }

  /**
   * Initialize the standard rule evaluators
   */
  private initializeRuleEvaluators() {
    // Property rules
    this.registerRuleEvaluator('property_required_fields', new RequiredFieldsEvaluator(
      EntityType.PROPERTY, 
      ['propertyId', 'address', 'parcelNumber', 'propertyType', 'acres'],
      'Property is missing required fields'
    ));

    this.registerRuleEvaluator('property_valid_type', new PropertyTypeEvaluator(
      ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Mixed Use', 'Recreational']
    ));

    this.registerRuleEvaluator('property_value_range', new ValueRangeEvaluator(0, 100000000));
    
    // Land record rules
    this.registerRuleEvaluator('land_required_fields', new RequiredFieldsEvaluator(
      EntityType.LAND_RECORD,
      ['propertyId', 'landUseCode', 'zoning'],
      'Land record is missing required fields'
    ));
    
    this.registerRuleEvaluator('land_valid_zoning', new ZoningCodeEvaluator());
    
    // Improvement rules
    this.registerRuleEvaluator('improvement_required_fields', new RequiredFieldsEvaluator(
      EntityType.IMPROVEMENT,
      ['propertyId', 'improvementType'],
      'Improvement record is missing required fields'
    ));
    
    this.registerRuleEvaluator('improvement_year_built', new YearBuiltEvaluator(1800, new Date().getFullYear()));

    // Statistical rules
    this.registerRuleEvaluator('statistical_price_per_sqft', new PricePerSqFtOutlierEvaluator());
    
    // WA State specific rules
    this.registerRuleEvaluator('wa_compliance_valid_use_code', new WAPropertyUseCodeEvaluator());
    this.registerRuleEvaluator('wa_compliance_valuation_date', new WAValuationDateEvaluator());
  }

  /**
   * Register a rule evaluator
   */
  public registerRuleEvaluator(ruleId: string, evaluator: RuleEvaluator): void {
    this.ruleEvaluators.set(ruleId, evaluator);
    logger.debug(`Registered rule evaluator for ${ruleId}`);
  }

  /**
   * Get a rule evaluator
   */
  public getRuleEvaluator(ruleId: string): RuleEvaluator | undefined {
    return this.ruleEvaluators.get(ruleId);
  }

  /**
   * Create a new validation rule
   */
  public async createValidationRule(rule: Omit<ValidationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ValidationRule> {
    try {
      // Ensure rule has a unique ID if not provided
      if (!rule.ruleId) {
        rule.ruleId = `rule_${uuidv4()}`;
      }
      
      const newRule = await this.storage.createValidationRule({
        ...rule,
        isActive: rule.isActive !== undefined ? rule.isActive : true
      });
      
      logger.info(`Created validation rule: ${rule.name} (${rule.ruleId})`);
      return newRule;
    } catch (error) {
      logger.error(`Error creating validation rule: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get all validation rules
   */
  public async getAllValidationRules(options?: { 
    category?: RuleCategory, 
    level?: RuleLevel,
    entityType?: EntityType,
    activeOnly?: boolean 
  }): Promise<ValidationRule[]> {
    try {
      let rules = await this.storage.getAllValidationRules();
      
      // Apply filters if provided
      if (options) {
        if (options.category) {
          rules = rules.filter(rule => rule.category === options.category);
        }
        
        if (options.level) {
          rules = rules.filter(rule => rule.level === options.level);
        }
        
        if (options.entityType) {
          rules = rules.filter(rule => rule.entityType === options.entityType);
        }
        
        if (options.activeOnly) {
          rules = rules.filter(rule => rule.isActive);
        }
      }
      
      return rules;
    } catch (error) {
      logger.error(`Error getting validation rules: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get validation rule by ID
   */
  public async getValidationRuleById(ruleId: string): Promise<ValidationRule | null> {
    try {
      return await this.storage.getValidationRuleById(ruleId);
    } catch (error) {
      logger.error(`Error getting validation rule ${ruleId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Update a validation rule
   */
  public async updateValidationRule(ruleId: string, updates: Partial<ValidationRule>): Promise<ValidationRule | null> {
    try {
      const updatedRule = await this.storage.updateValidationRule(ruleId, updates);
      logger.info(`Updated validation rule: ${ruleId}`);
      return updatedRule;
    } catch (error) {
      logger.error(`Error updating validation rule ${ruleId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Delete a validation rule
   */
  public async deleteValidationRule(ruleId: string): Promise<boolean> {
    try {
      const result = await this.storage.deleteValidationRule(ruleId);
      logger.info(`Deleted validation rule: ${ruleId}`);
      return result;
    } catch (error) {
      logger.error(`Error deleting validation rule ${ruleId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Create a validation issue
   */
  public async createValidationIssue(issue: Omit<ValidationIssue, 'id' | 'createdAt'>): Promise<ValidationIssue> {
    try {
      // Ensure issue has a unique ID if not provided
      if (!issue.issueId) {
        issue.issueId = `issue_${uuidv4()}`;
      }
      
      // Set default status if not provided
      if (!issue.status) {
        issue.status = IssueStatus.OPEN;
      }
      
      const newIssue = await this.storage.createValidationIssue({
        ...issue
      });
      
      logger.info(`Created validation issue: ${issue.issueId} for entity ${issue.entityType}/${issue.entityId}`);
      return newIssue;
    } catch (error) {
      logger.error(`Error creating validation issue: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get all validation issues
   */
  public async getValidationIssues(options?: {
    propertyId?: string,
    entityType?: EntityType,
    entityId?: string,
    ruleId?: string,
    level?: RuleLevel,
    status?: IssueStatus
  }): Promise<ValidationIssue[]> {
    try {
      return await this.storage.getValidationIssues(options);
    } catch (error) {
      logger.error(`Error getting validation issues: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get validation issue by ID
   */
  public async getValidationIssueById(issueId: string): Promise<ValidationIssue | null> {
    try {
      return await this.storage.getValidationIssueById(issueId);
    } catch (error) {
      logger.error(`Error getting validation issue ${issueId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Update a validation issue
   */
  public async updateValidationIssue(issueId: string, updates: Partial<ValidationIssue>): Promise<ValidationIssue | null> {
    try {
      const updatedIssue = await this.storage.updateValidationIssue(issueId, updates);
      logger.info(`Updated validation issue: ${issueId}`);
      return updatedIssue;
    } catch (error) {
      logger.error(`Error updating validation issue ${issueId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Resolve a validation issue
   */
  public async resolveValidationIssue(issueId: string, resolution: string, userId?: number): Promise<ValidationIssue | null> {
    try {
      const updatedIssue = await this.storage.updateValidationIssue(issueId, {
        status: IssueStatus.RESOLVED,
        resolution,
        resolvedBy: userId,
        resolvedAt: new Date()
      });
      
      logger.info(`Resolved validation issue: ${issueId}`);
      return updatedIssue;
    } catch (error) {
      logger.error(`Error resolving validation issue ${issueId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Acknowledge a validation issue
   */
  public async acknowledgeValidationIssue(issueId: string, notes?: string): Promise<ValidationIssue | null> {
    try {
      const issue = await this.storage.getValidationIssueById(issueId);
      if (!issue) {
        throw new Error(`Validation issue not found: ${issueId}`);
      }
      
      const updatedIssue = await this.storage.updateValidationIssue(issueId, {
        status: IssueStatus.ACKNOWLEDGED,
        details: {
          ...issue.details,
          acknowledgementNotes: notes || 'Issue acknowledged',
          acknowledgedAt: new Date().toISOString()
        }
      });
      
      logger.info(`Acknowledged validation issue: ${issueId}`);
      return updatedIssue;
    } catch (error) {
      logger.error(`Error acknowledging validation issue ${issueId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Waive a validation issue
   */
  public async waiveValidationIssue(issueId: string, reason: string, userId?: number): Promise<ValidationIssue | null> {
    try {
      const updatedIssue = await this.storage.updateValidationIssue(issueId, {
        status: IssueStatus.WAIVED,
        resolution: `Waived: ${reason}`,
        resolvedBy: userId,
        resolvedAt: new Date()
      });
      
      logger.info(`Waived validation issue: ${issueId}`);
      return updatedIssue;
    } catch (error) {
      logger.error(`Error waiving validation issue ${issueId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Validate a property (including its land records and improvements)
   */
  public async validateProperty(
    property: Property, 
    context?: Partial<ValidationContext>
  ): Promise<ValidationIssue[]> {
    try {
      const issues: ValidationIssue[] = [];
      const validationContext: ValidationContext = {
        ...this.DEFAULT_CONTEXT,
        ...context,
        validationDate: context?.validationDate || new Date()
      };
      
      logger.info(`Validating property: ${property.propertyId}`);
      
      // Get property-specific rules
      const rules = await this.storage.getValidationRulesByEntityType(EntityType.PROPERTY);
      const activeRules = rules.filter(rule => rule.isActive);
      
      // Execute all property rules
      for (const rule of activeRules) {
        const evaluator = this.getRuleEvaluator(rule.ruleId);
        
        if (evaluator) {
          const issue = evaluator.evaluate(property, validationContext);
          
          if (issue) {
            // Set additional properties for the issue
            const issueWithDetails: ValidationIssue = {
              ...issue,
              issueId: `issue_${uuidv4()}`,
              ruleId: rule.ruleId,
              entityType: EntityType.PROPERTY,
              entityId: property.propertyId,
              propertyId: property.propertyId,
              level: rule.level as RuleLevel,
              status: IssueStatus.OPEN
            };
            
            // Store the issue
            const savedIssue = await this.createValidationIssue(issueWithDetails);
            issues.push(savedIssue);
          }
        } else {
          // For dynamic rules implemented via JSON definition
          if (rule.implementation) {
            try {
              const dynamicIssue = this.evaluateDynamicRule(rule, property, validationContext);
              
              if (dynamicIssue) {
                const savedIssue = await this.createValidationIssue({
                  ...dynamicIssue,
                  issueId: `issue_${uuidv4()}`,
                  ruleId: rule.ruleId,
                  entityType: EntityType.PROPERTY,
                  entityId: property.propertyId,
                  propertyId: property.propertyId,
                  level: rule.level as RuleLevel,
                  status: IssueStatus.OPEN
                });
                
                issues.push(savedIssue);
              }
            } catch (evalError) {
              logger.error(`Error evaluating dynamic rule ${rule.ruleId}: ${evalError instanceof Error ? evalError.message : String(evalError)}`);
            }
          }
        }
      }
      
      // Get related land records
      const landRecords = await this.storage.getLandRecordsByPropertyId(property.propertyId);
      
      // Validate land records
      if (landRecords && landRecords.length > 0) {
        for (const landRecord of landRecords) {
          const landIssues = await this.validateLandRecord(landRecord, validationContext);
          issues.push(...landIssues);
        }
      }
      
      // Get improvements
      const improvements = await this.storage.getImprovementsByPropertyId(property.propertyId);
      
      // Validate improvements
      if (improvements && improvements.length > 0) {
        for (const improvement of improvements) {
          const improvementIssues = await this.validateImprovement(improvement, validationContext);
          issues.push(...improvementIssues);
        }
      }
      
      // Run cross-entity validations (constraints between property, land, and improvements)
      const crossEntityIssues = await this.runCrossEntityValidations(
        property, 
        landRecords || [], 
        improvements || [], 
        validationContext
      );
      
      issues.push(...crossEntityIssues);
      
      logger.info(`Validation complete for property ${property.propertyId}: ${issues.length} issues found`);
      return issues;
    } catch (error) {
      logger.error(`Error validating property ${property.propertyId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Validate a land record
   */
  private async validateLandRecord(
    landRecord: LandRecord, 
    context: ValidationContext
  ): Promise<ValidationIssue[]> {
    try {
      const issues: ValidationIssue[] = [];
      
      // Get land record specific rules
      const rules = await this.storage.getValidationRulesByEntityType(EntityType.LAND_RECORD);
      const activeRules = rules.filter(rule => rule.isActive);
      
      // Execute all land record rules
      for (const rule of activeRules) {
        const evaluator = this.getRuleEvaluator(rule.ruleId);
        
        if (evaluator) {
          const issue = evaluator.evaluate(landRecord, context);
          
          if (issue) {
            // Store the issue
            const savedIssue = await this.createValidationIssue({
              ...issue,
              issueId: `issue_${uuidv4()}`,
              ruleId: rule.ruleId,
              entityType: EntityType.LAND_RECORD,
              entityId: landRecord.id.toString(),
              propertyId: landRecord.propertyId,
              level: rule.level as RuleLevel,
              status: IssueStatus.OPEN
            });
            
            issues.push(savedIssue);
          }
        } else if (rule.implementation) {
          try {
            const dynamicIssue = this.evaluateDynamicRule(rule, landRecord, context);
            
            if (dynamicIssue) {
              const savedIssue = await this.createValidationIssue({
                ...dynamicIssue,
                issueId: `issue_${uuidv4()}`,
                ruleId: rule.ruleId,
                entityType: EntityType.LAND_RECORD,
                entityId: landRecord.id.toString(),
                propertyId: landRecord.propertyId,
                level: rule.level as RuleLevel,
                status: IssueStatus.OPEN
              });
              
              issues.push(savedIssue);
            }
          } catch (evalError) {
            logger.error(`Error evaluating dynamic rule ${rule.ruleId}: ${evalError instanceof Error ? evalError.message : String(evalError)}`);
          }
        }
      }
      
      return issues;
    } catch (error) {
      logger.error(`Error validating land record: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Validate an improvement
   */
  private async validateImprovement(
    improvement: Improvement, 
    context: ValidationContext
  ): Promise<ValidationIssue[]> {
    try {
      const issues: ValidationIssue[] = [];
      
      // Get improvement specific rules
      const rules = await this.storage.getValidationRulesByEntityType(EntityType.IMPROVEMENT);
      const activeRules = rules.filter(rule => rule.isActive);
      
      // Execute all improvement rules
      for (const rule of activeRules) {
        const evaluator = this.getRuleEvaluator(rule.ruleId);
        
        if (evaluator) {
          const issue = evaluator.evaluate(improvement, context);
          
          if (issue) {
            // Store the issue
            const savedIssue = await this.createValidationIssue({
              ...issue,
              issueId: `issue_${uuidv4()}`,
              ruleId: rule.ruleId,
              entityType: EntityType.IMPROVEMENT,
              entityId: improvement.id.toString(),
              propertyId: improvement.propertyId,
              level: rule.level as RuleLevel,
              status: IssueStatus.OPEN
            });
            
            issues.push(savedIssue);
          }
        } else if (rule.implementation) {
          try {
            const dynamicIssue = this.evaluateDynamicRule(rule, improvement, context);
            
            if (dynamicIssue) {
              const savedIssue = await this.createValidationIssue({
                ...dynamicIssue,
                issueId: `issue_${uuidv4()}`,
                ruleId: rule.ruleId,
                entityType: EntityType.IMPROVEMENT,
                entityId: improvement.id.toString(),
                propertyId: improvement.propertyId,
                level: rule.level as RuleLevel,
                status: IssueStatus.OPEN
              });
              
              issues.push(savedIssue);
            }
          } catch (evalError) {
            logger.error(`Error evaluating dynamic rule ${rule.ruleId}: ${evalError instanceof Error ? evalError.message : String(evalError)}`);
          }
        }
      }
      
      return issues;
    } catch (error) {
      logger.error(`Error validating improvement: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Run cross-entity validations between property, land records, and improvements
   */
  private async runCrossEntityValidations(
    property: Property,
    landRecords: LandRecord[],
    improvements: Improvement[],
    context: ValidationContext
  ): Promise<ValidationIssue[]> {
    try {
      const issues: ValidationIssue[] = [];
      
      // Check that residential properties have at least one improvement
      if (property.propertyType === 'Residential' && improvements.length === 0) {
        const issue = await this.createValidationIssue({
          issueId: `issue_${uuidv4()}`,
          ruleId: 'cross_residential_requires_improvement',
          entityType: EntityType.PROPERTY,
          entityId: property.propertyId,
          propertyId: property.propertyId,
          level: RuleLevel.WARNING,
          message: 'Residential property has no improvements (structures)',
          details: {},
          status: IssueStatus.OPEN
        });
        
        issues.push(issue);
      }
      
      // Check that property has at least one land record
      if (landRecords.length === 0) {
        const issue = await this.createValidationIssue({
          issueId: `issue_${uuidv4()}`,
          ruleId: 'cross_property_requires_land',
          entityType: EntityType.PROPERTY,
          entityId: property.propertyId,
          propertyId: property.propertyId,
          level: RuleLevel.ERROR,
          message: 'Property has no land records',
          details: {},
          status: IssueStatus.OPEN
        });
        
        issues.push(issue);
      }
      
      // Check property type matches land use
      const landUseTypes = landRecords.map(lr => lr.landUseCode);
      
      if (property.propertyType === 'Residential' && 
          !landUseTypes.some(lut => lut.includes('Residential') || lut.includes('RES'))) {
        const issue = await this.createValidationIssue({
          issueId: `issue_${uuidv4()}`,
          ruleId: 'cross_property_type_land_use_match',
          entityType: EntityType.PROPERTY,
          entityId: property.propertyId,
          propertyId: property.propertyId,
          level: RuleLevel.WARNING,
          message: 'Residential property type does not match land use codes',
          details: { landUseTypes },
          status: IssueStatus.OPEN
        });
        
        issues.push(issue);
      }
      
      return issues;
    } catch (error) {
      logger.error(`Error running cross-entity validations: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Run a batch validation on multiple properties
   */
  public async batchValidateProperties(
    propertyIds: string[], 
    context?: Partial<ValidationContext>
  ): Promise<Record<string, ValidationIssue[]>> {
    try {
      const results: Record<string, ValidationIssue[]> = {};
      
      // Process properties in chunks to avoid overloading the system
      const chunkSize = 10;
      const propertyChunks = this.chunkArray(propertyIds, chunkSize);
      
      for (const chunk of propertyChunks) {
        const properties = await Promise.all(
          chunk.map(id => this.storage.getPropertyById(id))
        );
        
        // Process each property
        await Promise.all(properties
          .filter(p => p !== null) // Filter out null properties
          .map(async (property) => {
            if (property) {
              const issues = await this.validateProperty(property, context);
              results[property.propertyId] = issues;
            }
          })
        );
      }
      
      return results;
    } catch (error) {
      logger.error(`Error in batch validation: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get a summary of validation issues by severity
   */
  public async getValidationSummary(options?: {
    propertyId?: string,
    createdAfter?: Date,
    createdBefore?: Date
  }): Promise<{ 
    total: number, 
    critical: number, 
    errors: number, 
    warnings: number, 
    info: number,
    byEntityType: Record<string, number>
  }> {
    try {
      const issues = await this.storage.getValidationIssues({
        propertyId: options?.propertyId,
        status: options?.propertyId ? undefined : IssueStatus.OPEN // Only filter by open status for system-wide summaries
      });
      
      // Filter by date if provided
      let filteredIssues = issues;
      if (options?.createdAfter || options?.createdBefore) {
        filteredIssues = issues.filter(issue => {
          const createdAt = new Date(issue.createdAt);
          
          if (options.createdAfter && createdAt < options.createdAfter) {
            return false;
          }
          
          if (options.createdBefore && createdAt > options.createdBefore) {
            return false;
          }
          
          return true;
        });
      }
      
      // Count by severity
      const summary = {
        total: filteredIssues.length,
        critical: filteredIssues.filter(i => i.level === RuleLevel.CRITICAL).length,
        errors: filteredIssues.filter(i => i.level === RuleLevel.ERROR).length,
        warnings: filteredIssues.filter(i => i.level === RuleLevel.WARNING).length,
        info: filteredIssues.filter(i => i.level === RuleLevel.INFO).length,
        byEntityType: {} as Record<string, number>
      };
      
      // Count by entity type
      filteredIssues.forEach(issue => {
        if (!summary.byEntityType[issue.entityType]) {
          summary.byEntityType[issue.entityType] = 0;
        }
        summary.byEntityType[issue.entityType]++;
      });
      
      return summary;
    } catch (error) {
      logger.error(`Error getting validation summary: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Evaluate a dynamic rule defined by JSON
   */
  private evaluateDynamicRule(
    rule: ValidationRule, 
    entity: any, 
    context: ValidationContext
  ): Partial<ValidationIssue> | null {
    try {
      if (!rule.implementation) {
        return null;
      }
      
      // Parse the rule implementation
      let ruleImpl;
      try {
        ruleImpl = JSON.parse(rule.implementation);
      } catch (parseError) {
        // Try to evaluate as a JavaScript function
        const ruleFunction = new Function('entity', 'context', rule.implementation);
        const result = ruleFunction(entity, context);
        
        if (result === true) {
          return null; // No issue if rule returns true
        } else if (result === false) {
          return {
            message: rule.name,
            details: {}
          };
        } else if (typeof result === 'object') {
          return {
            message: result.message || rule.name,
            details: result.details || {}
          };
        }
        
        return null;
      }
      
      // Implementation is a JSON object with conditions
      if (ruleImpl.conditions) {
        const conditionsMet = this.evaluateConditions(ruleImpl.conditions, entity, context);
        
        if (!conditionsMet) {
          return {
            message: ruleImpl.message || rule.name,
            details: { failedRule: rule.name }
          };
        }
      }
      
      return null;
    } catch (error) {
      logger.error(`Error evaluating dynamic rule ${rule.ruleId}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateConditions(
    conditions: any, 
    entity: any, 
    context: ValidationContext
  ): boolean {
    // Simple field existence check
    if (conditions.requiredFields) {
      for (const field of conditions.requiredFields) {
        if (entity[field] === undefined || entity[field] === null || entity[field] === '') {
          return false;
        }
      }
    }
    
    // Field value check
    if (conditions.fieldValues) {
      for (const check of conditions.fieldValues) {
        const value = entity[check.field];
        
        switch (check.operator) {
          case 'eq':
            if (value !== check.value) return false;
            break;
          case 'neq':
            if (value === check.value) return false;
            break;
          case 'gt':
            if (!(value > check.value)) return false;
            break;
          case 'gte':
            if (!(value >= check.value)) return false;
            break;
          case 'lt':
            if (!(value < check.value)) return false;
            break;
          case 'lte':
            if (!(value <= check.value)) return false;
            break;
          case 'in':
            if (!Array.isArray(check.value) || !check.value.includes(value)) return false;
            break;
          case 'nin':
            if (!Array.isArray(check.value) || check.value.includes(value)) return false;
            break;
          case 'contains':
            if (typeof value !== 'string' || !value.includes(check.value)) return false;
            break;
          case 'startsWith':
            if (typeof value !== 'string' || !value.startsWith(check.value)) return false;
            break;
          case 'endsWith':
            if (typeof value !== 'string' || !value.endsWith(check.value)) return false;
            break;
          case 'regex':
            if (typeof value !== 'string' || !new RegExp(check.value).test(value)) return false;
            break;
        }
      }
    }
    
    // Regex pattern check
    if (conditions.patterns) {
      for (const pattern of conditions.patterns) {
        const value = entity[pattern.field];
        if (typeof value !== 'string' || !new RegExp(pattern.regex).test(value)) {
          return false;
        }
      }
    }
    
    // Logical operators
    if (conditions.and) {
      for (const subcondition of conditions.and) {
        if (!this.evaluateConditions(subcondition, entity, context)) {
          return false;
        }
      }
    }
    
    if (conditions.or) {
      if (conditions.or.length === 0) return true;
      
      let orResult = false;
      for (const subcondition of conditions.or) {
        if (this.evaluateConditions(subcondition, entity, context)) {
          orResult = true;
          break;
        }
      }
      
      if (!orResult) return false;
    }
    
    if (conditions.not) {
      return !this.evaluateConditions(conditions.not, entity, context);
    }
    
    return true;
  }

  /**
   * Helper function to create Washington specific validation rules
   */
  public async createWashingtonValidationRules(createdBy?: number): Promise<ValidationRule[]> {
    const rules: Omit<ValidationRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        ruleId: 'wa_dor_valid_use_code',
        name: 'Washington DOR Valid Use Code',
        description: 'Property use code must be a valid Washington DOR code',
        category: RuleCategory.COMPLIANCE,
        level: RuleLevel.ERROR,
        entityType: EntityType.PROPERTY,
        implementation: JSON.stringify({
          conditions: {
            requiredFields: ['extraFields'],
            patterns: [
              {
                field: 'extraFields.useCode',
                regex: '^\\d{3}$' // 3-digit code format
              }
            ]
          },
          message: 'Property use code must be a valid 3-digit Washington DOR code'
        }),
        reference: 'Washington DOR Property Tax Division',
        isActive: true,
        createdBy
      },
      {
        ruleId: 'wa_rcw_84_40_land_value',
        name: 'RCW 84.40 Land Value Required',
        description: 'Land records must have assessed values in accordance with RCW 84.40',
        category: RuleCategory.COMPLIANCE,
        level: RuleLevel.ERROR,
        entityType: EntityType.LAND_RECORD,
        implementation: JSON.stringify({
          conditions: {
            requiredFields: ['extraFields'],
            fieldValues: [
              {
                field: 'extraFields.assessedValue',
                operator: 'gt',
                value: 0
              }
            ]
          },
          message: 'Land record must have a positive assessed value per RCW 84.40'
        }),
        reference: 'RCW 84.40.030',
        isActive: true,
        createdBy
      },
      {
        ruleId: 'wa_rcw_84_40_020_annual_listing',
        name: 'RCW 84.40.020 Annual Listing',
        description: 'Property must have been assessed or updated within the last assessment cycle',
        category: RuleCategory.COMPLIANCE,
        level: RuleLevel.WARNING,
        entityType: EntityType.PROPERTY,
        implementation: JSON.stringify({
          conditions: {
            fieldValues: [
              {
                field: 'lastUpdated',
                operator: 'gt',
                value: new Date(new Date().getFullYear() - 1, 0, 1).toISOString()
              }
            ]
          },
          message: 'Property has not been assessed within the current assessment cycle (RCW 84.40.020)'
        }),
        reference: 'RCW 84.40.020',
        isActive: true,
        createdBy
      },
      {
        ruleId: 'wa_data_quality_parcel_format',
        name: 'Washington Parcel Number Format',
        description: 'Parcel number must match the Washington standard format',
        category: RuleCategory.DATA_QUALITY,
        level: RuleLevel.ERROR,
        entityType: EntityType.PROPERTY,
        implementation: JSON.stringify({
          conditions: {
            patterns: [
              {
                field: 'parcelNumber',
                regex: '^\\d{2}\\-\\d{2}\\-\\d{5}\\-\\d{3}\\-\\d{4}$'
              }
            ]
          },
          message: 'Parcel number does not match the required Washington format (XX-XX-XXXXX-XXX-XXXX)'
        }),
        isActive: true,
        createdBy
      }
    ];
    
    const createdRules: ValidationRule[] = [];
    
    for (const rule of rules) {
      const createdRule = await this.createValidationRule(rule);
      createdRules.push(createdRule);
    }
    
    return createdRules;
  }

  /**
   * Helper function to chunk arrays for batch processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Rule Evaluator implementations

/**
 * Required Fields Rule Evaluator
 */
class RequiredFieldsEvaluator implements RuleEvaluator {
  private requiredFields: string[];
  private entityType: EntityType;
  private message: string;
  
  constructor(entityType: EntityType, requiredFields: string[], message?: string) {
    this.entityType = entityType;
    this.requiredFields = requiredFields;
    this.message = message || `Missing required fields for ${entityType}`;
  }
  
  evaluate(entity: any, context?: ValidationContext): ValidationIssue | null {
    const missingFields: string[] = [];
    
    for (const field of this.requiredFields) {
      if (entity[field] === undefined || entity[field] === null || entity[field] === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return {
        issueId: '',
        ruleId: '',
        entityType: this.entityType,
        entityId: String(entity.id || ''),
        propertyId: entity.propertyId || '',
        level: RuleLevel.ERROR,
        message: this.message,
        details: { missingFields },
        status: IssueStatus.OPEN,
        createdAt: new Date()
      };
    }
    
    return null;
  }
}

/**
 * Property Type Rule Evaluator
 */
class PropertyTypeEvaluator implements RuleEvaluator {
  private validTypes: string[];
  
  constructor(validTypes: string[]) {
    this.validTypes = validTypes;
  }
  
  evaluate(entity: any, context?: ValidationContext): ValidationIssue | null {
    if (!entity.propertyType || !this.validTypes.includes(entity.propertyType)) {
      return {
        issueId: '',
        ruleId: '',
        entityType: EntityType.PROPERTY,
        entityId: String(entity.id || ''),
        propertyId: entity.propertyId || '',
        level: RuleLevel.ERROR,
        message: `Invalid property type: ${entity.propertyType}`,
        details: { 
          value: entity.propertyType, 
          validTypes: this.validTypes 
        },
        status: IssueStatus.OPEN,
        createdAt: new Date()
      };
    }
    
    return null;
  }
}

/**
 * Value Range Rule Evaluator
 */
class ValueRangeEvaluator implements RuleEvaluator {
  private minValue: number;
  private maxValue: number;
  
  constructor(minValue: number, maxValue: number) {
    this.minValue = minValue;
    this.maxValue = maxValue;
  }
  
  evaluate(entity: any, context?: ValidationContext): ValidationIssue | null {
    if (entity.value === null || entity.value === undefined) {
      return null; // No validation if value is not set
    }
    
    const value = parseFloat(String(entity.value));
    
    if (isNaN(value)) {
      return {
        issueId: '',
        ruleId: '',
        entityType: EntityType.PROPERTY,
        entityId: String(entity.id || ''),
        propertyId: entity.propertyId || '',
        level: RuleLevel.ERROR,
        message: `Property value is not a valid number: ${entity.value}`,
        details: { value: entity.value },
        status: IssueStatus.OPEN,
        createdAt: new Date()
      };
    }
    
    if (value < this.minValue || value > this.maxValue) {
      return {
        issueId: '',
        ruleId: '',
        entityType: EntityType.PROPERTY,
        entityId: String(entity.id || ''),
        propertyId: entity.propertyId || '',
        level: RuleLevel.WARNING,
        message: `Property value ${value} is outside the expected range (${this.minValue} - ${this.maxValue})`,
        details: { 
          value,
          minValue: this.minValue,
          maxValue: this.maxValue
        },
        status: IssueStatus.OPEN,
        createdAt: new Date()
      };
    }
    
    return null;
  }
}

/**
 * Zoning Code Rule Evaluator
 */
class ZoningCodeEvaluator implements RuleEvaluator {
  evaluate(entity: any, context?: ValidationContext): ValidationIssue | null {
    if (!entity.zoning) {
      return null; // Should be caught by required fields evaluator
    }
    
    // Check for common zoning code format (usually alphanumeric with hyphens)
    const zoningRegex = /^[A-Za-z0-9\-]+$/;
    
    if (!zoningRegex.test(entity.zoning)) {
      return {
        issueId: '',
        ruleId: '',
        entityType: EntityType.LAND_RECORD,
        entityId: String(entity.id || ''),
        propertyId: entity.propertyId || '',
        level: RuleLevel.WARNING,
        message: `Zoning code format may be invalid: ${entity.zoning}`,
        details: { zoning: entity.zoning },
        status: IssueStatus.OPEN,
        createdAt: new Date()
      };
    }
    
    return null;
  }
}

/**
 * Year Built Rule Evaluator
 */
class YearBuiltEvaluator implements RuleEvaluator {
  private minYear: number;
  private maxYear: number;
  
  constructor(minYear: number, maxYear: number) {
    this.minYear = minYear;
    this.maxYear = maxYear;
  }
  
  evaluate(entity: any, context?: ValidationContext): ValidationIssue | null {
    if (entity.yearBuilt === null || entity.yearBuilt === undefined) {
      return null; // No validation if year built is not set
    }
    
    const yearBuilt = parseInt(String(entity.yearBuilt));
    
    if (isNaN(yearBuilt)) {
      return {
        issueId: '',
        ruleId: '',
        entityType: EntityType.IMPROVEMENT,
        entityId: String(entity.id || ''),
        propertyId: entity.propertyId || '',
        level: RuleLevel.ERROR,
        message: `Year built is not a valid number: ${entity.yearBuilt}`,
        details: { yearBuilt: entity.yearBuilt },
        status: IssueStatus.OPEN,
        createdAt: new Date()
      };
    }
    
    if (yearBuilt < this.minYear || yearBuilt > this.maxYear) {
      return {
        issueId: '',
        ruleId: '',
        entityType: EntityType.IMPROVEMENT,
        entityId: String(entity.id || ''),
        propertyId: entity.propertyId || '',
        level: RuleLevel.WARNING,
        message: `Year built ${yearBuilt} is outside the expected range (${this.minYear} - ${this.maxYear})`,
        details: { 
          yearBuilt,
          minYear: this.minYear,
          maxYear: this.maxYear
        },
        status: IssueStatus.OPEN,
        createdAt: new Date()
      };
    }
    
    return null;
  }
}

/**
 * Price Per Square Foot Outlier Rule Evaluator
 */
class PricePerSqFtOutlierEvaluator implements RuleEvaluator {
  private readonly STANDARD_DEVIATIONS = 2; // Number of standard deviations for outlier detection
  
  evaluate(entity: any, context?: ValidationContext): ValidationIssue | null {
    // This would require additional database operations to calculate statistical values
    // In a real implementation, this would fetch comparable properties and perform calculations
    // We're providing a simplified demonstration version
    
    const primaryImprovement = entity.primaryImprovement;
    
    if (!entity.value || !primaryImprovement || !primaryImprovement.squareFeet) {
      return null; // Can't calculate price per sqft
    }
    
    const pricePerSqFt = parseFloat(String(entity.value)) / parseFloat(String(primaryImprovement.squareFeet));
    
    // Mock values (in a real implementation, these would be calculated from actual data)
    const avgPricePerSqFt = 250; // Example average for the area
    const stdDevPricePerSqFt = 50; // Example standard deviation
    
    // Check if price per sqft is an outlier
    const deviationsAway = Math.abs(pricePerSqFt - avgPricePerSqFt) / stdDevPricePerSqFt;
    
    if (deviationsAway > this.STANDARD_DEVIATIONS) {
      return {
        issueId: '',
        ruleId: '',
        entityType: EntityType.PROPERTY,
        entityId: String(entity.id || ''),
        propertyId: entity.propertyId || '',
        level: RuleLevel.WARNING,
        message: `Price per square foot (${pricePerSqFt.toFixed(2)}) is an outlier (${deviationsAway.toFixed(2)} standard deviations from mean)`,
        details: { 
          pricePerSqFt,
          avgPricePerSqFt,
          stdDevPricePerSqFt,
          deviationsAway
        },
        status: IssueStatus.OPEN,
        createdAt: new Date()
      };
    }
    
    return null;
  }
}

/**
 * Washington Property Use Code Rule Evaluator
 */
class WAPropertyUseCodeEvaluator implements RuleEvaluator {
  evaluate(entity: any, context?: ValidationContext): ValidationIssue | null {
    if (!entity.extraFields || !entity.extraFields.useCode) {
      return {
        issueId: '',
        ruleId: '',
        entityType: EntityType.PROPERTY,
        entityId: String(entity.id || ''),
        propertyId: entity.propertyId || '',
        level: RuleLevel.ERROR,
        message: 'Missing required Washington Property Use Code',
        details: {},
        status: IssueStatus.OPEN,
        createdAt: new Date()
      };
    }
    
    const useCode = String(entity.extraFields.useCode);
    const useCodeRegex = /^\d{3}$/; // Washington use codes are 3 digits
    
    if (!useCodeRegex.test(useCode)) {
      return {
        issueId: '',
        ruleId: '',
        entityType: EntityType.PROPERTY,
        entityId: String(entity.id || ''),
        propertyId: entity.propertyId || '',
        level: RuleLevel.ERROR,
        message: `Invalid Washington Property Use Code format: ${useCode}`,
        details: { useCode },
        status: IssueStatus.OPEN,
        createdAt: new Date()
      };
    }
    
    return null;
  }
}

/**
 * Washington Valuation Date Rule Evaluator
 */
class WAValuationDateEvaluator implements RuleEvaluator {
  evaluate(entity: any, context?: ValidationContext): ValidationIssue | null {
    if (!entity.lastUpdated) {
      return null; // Should be caught by required fields evaluator
    }
    
    const lastUpdated = new Date(entity.lastUpdated);
    const currentYear = new Date().getFullYear();
    const valuationCutoff = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    
    // Washington requires property to be valued as of January 1 of the assessment year
    if (lastUpdated.getTime() > valuationCutoff.getTime()) {
      return {
        issueId: '',
        ruleId: '',
        entityType: EntityType.PROPERTY,
        entityId: String(entity.id || ''),
        propertyId: entity.propertyId || '',
        level: RuleLevel.WARNING,
        message: `Property value updated after January 1 of the assessment year`,
        details: { 
          lastUpdated: lastUpdated.toISOString(),
          valuationCutoff: valuationCutoff.toISOString()
        },
        status: IssueStatus.OPEN,
        createdAt: new Date()
      };
    }
    
    // Also check if the property value is too old
    const previousYearCutoff = new Date(`${currentYear - 1}-01-01T00:00:00.000Z`);
    if (lastUpdated.getTime() < previousYearCutoff.getTime()) {
      return {
        issueId: '',
        ruleId: '',
        entityType: EntityType.PROPERTY,
        entityId: String(entity.id || ''),
        propertyId: entity.propertyId || '',
        level: RuleLevel.WARNING,
        message: `Property has not been revalued in the current assessment cycle`,
        details: { 
          lastUpdated: lastUpdated.toISOString(),
          previousYearCutoff: previousYearCutoff.toISOString()
        },
        status: IssueStatus.OPEN,
        createdAt: new Date()
      };
    }
    
    return null;
  }
}