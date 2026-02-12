/**
 * Validation Engine Extensions
 *
 * This module extends the PropertyValidationEngine with Washington-specific validation capabilities
 * and custom validators for advanced validation scenarios.
 */

import { PropertyValidationEngine } from './property-validation-engine';
import { createWashingtonValidationRules, assessmentRatioValidator } from './wa-validation-rules';
import {
  ValidationIssue,
  IssueStatus,
  EntityType,
  RuleLevel,
  ValidationContext,
} from '../../../shared/schema';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

// Define a type for custom validators
type CustomValidator = (entity: any) => boolean;

// Interface for validation engine extensions
interface ValidationEngineExtensions {
  customValidators?: Record<string, CustomValidator>;
}

/**
 * Extension class for the property validation engine
 * Adds Washington-specific validation capabilities
 */
export class WashingtonValidationEngine extends PropertyValidationEngine {
  /**
   * Initialize the validation engine with Washington rules
   */
  public async initializeWashingtonRules(userId?: number): Promise<void> {
    try {
      logger.info('Initializing Washington validation rules', {
        component: 'WashingtonValidationEngine',
      });

      // Create Washington validation rules
      const washingtonRules = createWashingtonValidationRules(userId);

      // Add each rule to the database
      for (const rule of washingtonRules) {
        const existingRule = await this.getValidationRuleByRuleId(rule.ruleId);

        if (!existingRule) {
          logger.info(`Creating rule: ${rule.name}`, {
            component: 'WashingtonValidationEngine',
            ruleId: rule.ruleId,
          });

          await this.createValidationRule(rule);
        } else {
          logger.info(`Rule already exists: ${rule.name}`, {
            component: 'WashingtonValidationEngine',
            ruleId: rule.ruleId,
          });
        }
      }

      // Register custom validators
      this.registerCustomValidator('assessmentRatioValidator', assessmentRatioValidator);

      logger.info('Washington validation rules initialized successfully', {
        component: 'WashingtonValidationEngine',
        ruleCount: washingtonRules.length,
      });
    } catch (error) {
      logger.error('Error initializing Washington validation rules', {
        component: 'WashingtonValidationEngine',
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Register a custom validator function
   */
  public registerCustomValidator(name: string, validatorFn: (entity: any) => boolean): void {
    this.customValidators = this.customValidators || {};
    this.customValidators[name] = validatorFn;

    logger.info(`Registered custom validator: ${name}`, {
      component: 'WashingtonValidationEngine',
    });
  }

  /**
   * Run a custom validator
   */
  protected runCustomValidator(
    validatorName: string,
    entity: any,
    rule: any
  ): ValidationIssue | null {
    // Check if validator exists
    if (!this.customValidators || !this.customValidators[validatorName]) {
      logger.warn(`Custom validator not found: ${validatorName}`, {
        component: 'WashingtonValidationEngine',
      });

      return {
        issueId: uuidv4(),
        ruleId: rule.ruleId,
        entityType: rule.entityType,
        entityId: String(entity.id),
        propertyId: entity.propertyId,
        level: RuleLevel.ERROR,
        message: `Internal error: Custom validator "${validatorName}" not found`,
        details: { validatorName },
        status: IssueStatus.OPEN,
        createdAt: new Date(),
      };
    }

    // Run the validator
    const isValid = this.customValidators[validatorName](entity);

    if (isValid) {
      return null;
    }

    // Create issue for failed validation
    return {
      issueId: uuidv4(),
      ruleId: rule.ruleId,
      entityType: rule.entityType,
      entityId: String(entity.id),
      propertyId: entity.propertyId,
      level: rule.level,
      message: rule.implementation.message || `Failed ${validatorName} validation`,
      details: { validatorName },
      status: IssueStatus.OPEN,
      createdAt: new Date(),
    };
  }

  /**
   * Override the evaluateRule method to handle custom validators
   */
  protected async evaluateRule(entity: any, rule: any): Promise<ValidationIssue | null> {
    try {
      // Parse the implementation JSON
      const implementation =
        typeof rule.implementation === 'string'
          ? JSON.parse(rule.implementation)
          : rule.implementation;

      // Check for custom validator
      if (implementation.conditions.customValidator) {
        return this.runCustomValidator(implementation.conditions.customValidator, entity, rule);
      }

      // Otherwise, use the parent implementation
      return super.evaluateRule(entity, rule);
    } catch (error) {
      logger.error(`Error evaluating rule ${rule.ruleId}`, {
        component: 'WashingtonValidationEngine',
        ruleId: rule.ruleId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Create an issue for the rule evaluation error
      return {
        issueId: uuidv4(),
        ruleId: rule.ruleId,
        entityType: rule.entityType,
        entityId: String(entity.id),
        propertyId: entity.propertyId,
        level: RuleLevel.ERROR,
        message: `Internal error evaluating rule: ${error instanceof Error ? error.message : String(error)}`,
        details: { error: error instanceof Error ? error.message : String(error) },
        status: IssueStatus.OPEN,
        createdAt: new Date(),
      };
    }
  }
}
