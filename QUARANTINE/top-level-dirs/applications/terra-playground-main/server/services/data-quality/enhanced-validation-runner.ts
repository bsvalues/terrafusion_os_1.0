/**
 * Enhanced Validation Runner Service
 *
 * Provides a high-performance, parallel validation infrastructure for
 * property data with incremental validation support.
 */

import { IStorage } from '../../storage';
import { PropertyValidationEngine } from './property-validation-engine';
import { Property, ValidationIssue } from '../../../shared/schema';
import { logger } from '../../utils/logger';

export interface ValidationResult {
  total: number;
  valid: number;
  invalid: number;
  issues: ValidationIssue[];
  processingTime: number;
  validationDate: Date;
}

export class EnhancedValidationRunner {
  constructor(
    private storage: IStorage,
    private validationEngine: PropertyValidationEngine
  ) {}

  /**
   * Run validation on a batch of properties with parallel processing
   *
   * @param properties Array of properties to validate
   * @param batchSize Size of batches for parallel processing
   * @param skipValidated Skip properties that have already been validated
   * @param validateFields Specific fields to validate (validates all if empty)
   */
  public async validateProperties(
    properties: Property[],
    options: {
      batchSize?: number;
      skipValidated?: boolean;
      validateFields?: string[];
      logProgress?: boolean;
    } = {}
  ): Promise<ValidationResult> {
    const {
      batchSize = 100,
      skipValidated = true,
      validateFields = [],
      logProgress = true,
    } = options;

    const result: ValidationResult = {
      total: properties.length,
      valid: 0,
      invalid: 0,
      issues: [],
      processingTime: 0,
      validationDate: new Date(),
    };

    const startTime = Date.now();

    if (logProgress) {
      logger.info(`Starting validation of ${properties.length} properties`, {
        component: 'EnhancedValidationRunner',
        properties: properties.length,
        batchSize,
        skipValidated,
      });
    }

    // Create batches for parallel processing
    const batches: Property[][] = [];
    for (let i = 0; i < properties.length; i += batchSize) {
      batches.push(properties.slice(i, i + batchSize));
    }

    if (logProgress) {
      logger.info(`Created ${batches.length} batches for parallel validation`, {
        component: 'EnhancedValidationRunner',
        batches: batches.length,
      });
    }

    // Process batches in parallel
    const batchResults = await Promise.all(
      batches.map(async (batch, batchIndex) => {
        // Process each property in the batch
        return Promise.all(
          batch.map(async property => {
            try {
              // Skip already validated properties if flag is set
              if (
                skipValidated &&
                property.extraFields?.validationStatus === 'validated' &&
                property.extraFields?.lastValidated
              ) {
                // Check if validation is recent (within last 30 days)
                const lastValidated = new Date(property.extraFields.lastValidated);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                if (lastValidated > thirtyDaysAgo) {
                  result.valid++;
                  return null;
                }
              }

              // Run validation rules
              const issues = await this.validationEngine.validateProperty(
                property,
                validateFields.length > 0 ? { fields: validateFields } : undefined
              );

              // Update result counters
              if (issues.length === 0) {
                result.valid++;

                // Update property validation status
                await this.storage.updateProperty(property.id, {
                  extraFields: {
                    ...property.extraFields,
                    validationStatus: 'validated',
                    lastValidated: new Date().toISOString(),
                  },
                });
              } else {
                result.invalid++;
                result.issues.push(...issues);

                // Update property validation status
                await this.storage.updateProperty(property.id, {
                  extraFields: {
                    ...property.extraFields,
                    validationStatus: 'invalid',
                    lastValidated: new Date().toISOString(),
                    validationIssueCount: issues.length,
                  },
                });
              }

              return {
                propertyId: property.propertyId,
                isValid: issues.length === 0,
                issueCount: issues.length,
              };
            } catch (error) {
              logger.error(`Error validating property ${property.propertyId}`, {
                component: 'EnhancedValidationRunner',
                propertyId: property.propertyId,
                error: error instanceof Error ? error.message : String(error),
              });

              result.invalid++;
              return {
                propertyId: property.propertyId,
                isValid: false,
                error: error instanceof Error ? error.message : String(error),
              };
            }
          })
        );
      })
    );

    result.processingTime = Date.now() - startTime;

    if (logProgress) {
      logger.info(`Validation completed in ${result.processingTime}ms`, {
        component: 'EnhancedValidationRunner',
        valid: result.valid,
        invalid: result.invalid,
        issues: result.issues.length,
        processingTime: result.processingTime,
      });
    }

    return result;
  }

  /**
   * Validate all properties in the system
   */
  public async validateAllProperties(
    options: {
      batchSize?: number;
      skipValidated?: boolean;
      statusCallback?: (progress: number, total: number) => void;
    } = {}
  ): Promise<ValidationResult> {
    const { batchSize = 100, skipValidated = true, statusCallback } = options;

    logger.info('Starting validation of all properties', {
      component: 'EnhancedValidationRunner',
      batchSize,
      skipValidated,
    });

    // Get all properties from storage
    const allProperties = await this.storage.getAllProperties();

    let processedCount = 0;
    const totalCount = allProperties.length;

    // Create result structure
    const result: ValidationResult = {
      total: totalCount,
      valid: 0,
      invalid: 0,
      issues: [],
      processingTime: 0,
      validationDate: new Date(),
    };

    const startTime = Date.now();

    // Create batches for processing
    const batches: Property[][] = [];
    for (let i = 0; i < allProperties.length; i += batchSize) {
      batches.push(allProperties.slice(i, i + batchSize));
    }

    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batchResult = await this.validateProperties(batches[i], {
        batchSize,
        skipValidated,
        logProgress: false,
      });

      // Update result counters
      result.valid += batchResult.valid;
      result.invalid += batchResult.invalid;
      result.issues.push(...batchResult.issues);

      // Update progress
      processedCount += batches[i].length;
      if (statusCallback) {
        statusCallback(processedCount, totalCount);
      }

      logger.info(`Validated batch ${i + 1}/${batches.length}`, {
        component: 'EnhancedValidationRunner',
        batch: i + 1,
        totalBatches: batches.length,
        validInBatch: batchResult.valid,
        invalidInBatch: batchResult.invalid,
        progress: `${Math.round((processedCount / totalCount) * 100)}%`,
      });
    }

    result.processingTime = Date.now() - startTime;

    logger.info(`Full validation completed in ${result.processingTime}ms`, {
      component: 'EnhancedValidationRunner',
      valid: result.valid,
      invalid: result.invalid,
      issues: result.issues.length,
      processingTime: result.processingTime,
    });

    return result;
  }
}
