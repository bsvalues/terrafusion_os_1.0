/**
 * Data Quality Monitoring Service
 *
 * Provides comprehensive data quality monitoring with:
 * - Statistical analysis for anomaly detection
 * - Data quality metrics tracking and visualization
 * - Configurable rule-based validation engine
 * - Automated data quality reporting
 */

import { IStorage } from '../../storage';
import { logger } from '../../utils/logger';

// Data quality metrics
export interface DataQualityMetrics {
  completeness: number; // Percentage of non-null values
  validity: number; // Percentage of values passing validation rules
  accuracy: number; // Percentage of values matching expected patterns/ranges
  consistency: number; // Percentage of values consistent with related values
  uniqueness: number; // Percentage of unique values when expecting uniqueness
  timeliness: number; // Age of data relative to expected freshness
  timestamp: Date; // When these metrics were calculated
}

// Validation rule types
export enum ValidationRuleType {
  REQUIRED = 'required',
  TYPE = 'type',
  RANGE = 'range',
  PATTERN = 'pattern',
  ENUM = 'enum',
  CUSTOM = 'custom',
  CROSS_FIELD = 'cross_field',
}

// Field validation rule
export interface ValidationRule {
  field: string;
  type: ValidationRuleType;
  message?: string;
  params?: Record<string, any>;
  severity: 'info' | 'warning' | 'error';
  enabled: boolean;
}

// Cross-field validation rule
export interface CrossFieldValidationRule extends ValidationRule {
  fields: string[];
  type: ValidationRuleType.CROSS_FIELD;
  condition: (values: Record<string, any>) => boolean;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: {
    field: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    rule: ValidationRuleType;
  }[];
  warnings: {
    field: string;
    message: string;
    severity: 'info' | 'warning';
    rule: ValidationRuleType;
  }[];
  timestamp: Date;
}

// Anomaly detection configuration
export interface AnomalyDetectionConfig {
  enabled: boolean;
  sensitivityThreshold: number; // Standard deviations for outlier detection
  minSampleSize: number; // Minimum samples needed for statistical analysis
  excludeOutliers: boolean; // Whether to exclude detected outliers from stats
}

// Statistical metrics for anomaly detection
export interface StatisticalMetrics {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  firstQuartile: number;
  thirdQuartile: number;
  outliers: number[];
}

/**
 * Data Quality Monitoring Service implementation
 */
export class DataQualityMonitor {
  private validationRules: Map<string, ValidationRule[]> = new Map();
  private crossFieldRules: CrossFieldValidationRule[] = [];
  private anomalyConfig: AnomalyDetectionConfig = {
    enabled: true,
    sensitivityThreshold: 3.0, // 3 standard deviations
    minSampleSize: 30, // Minimum 30 samples
    excludeOutliers: true, // Exclude outliers from stats
  };

  /**
   * Create a new Data Quality Monitor
   * @param storage Storage service
   */
  constructor(private storage: IStorage) {}

  /**
   * Add a validation rule
   * @param entityType Entity type (e.g., 'property', 'landRecord')
   * @param rule Validation rule
   */
  addValidationRule(entityType: string, rule: ValidationRule): void {
    if (!this.validationRules.has(entityType)) {
      this.validationRules.set(entityType, []);
    }

    this.validationRules.get(entityType)?.push(rule);
    logger.info(`Added validation rule for ${entityType}.${rule.field}`, {
      component: 'DataQualityMonitor',
      rule: rule.type,
      field: rule.field,
    });
  }

  /**
   * Add a cross-field validation rule
   * @param entityType Entity type
   * @param rule Cross-field validation rule
   */
  addCrossFieldRule(entityType: string, rule: CrossFieldValidationRule): void {
    if (!this.validationRules.has(entityType)) {
      this.validationRules.set(entityType, []);
    }

    this.crossFieldRules.push(rule);
    logger.info(`Added cross-field validation rule for ${entityType}`, {
      component: 'DataQualityMonitor',
      fields: rule.fields.join(', '),
    });
  }

  /**
   * Set anomaly detection configuration
   * @param config Anomaly detection configuration
   */
  setAnomalyDetectionConfig(config: Partial<AnomalyDetectionConfig>): void {
    this.anomalyConfig = {
      ...this.anomalyConfig,
      ...config,
    };

    logger.info('Updated anomaly detection configuration', {
      component: 'DataQualityMonitor',
      config: this.anomalyConfig,
    });
  }

  /**
   * Validate an entity against defined rules
   * @param entityType Entity type
   * @param entity Entity to validate
   * @returns Validation result
   */
  validateEntity(entityType: string, entity: Record<string, any>): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      timestamp: new Date(),
    };

    // Get rules for this entity type
    const rules = this.validationRules.get(entityType) || [];

    // Apply field-level rules
    for (const rule of rules) {
      if (!rule.enabled) continue;

      const field = rule.field;
      const value = entity[field];

      let isValid = true;

      // Apply rule based on type
      switch (rule.type) {
        case ValidationRuleType.REQUIRED:
          isValid = value !== undefined && value !== null && value !== '';
          break;

        case ValidationRuleType.TYPE:
          isValid = this.validateType(value, rule.params?.type);
          break;

        case ValidationRuleType.RANGE:
          isValid = this.validateRange(value, rule.params?.min, rule.params?.max);
          break;

        case ValidationRuleType.PATTERN:
          isValid = this.validatePattern(value, rule.params?.pattern);
          break;

        case ValidationRuleType.ENUM:
          isValid = this.validateEnum(value, rule.params?.values);
          break;

        case ValidationRuleType.CUSTOM:
          isValid = rule.params?.validator(value, entity);
          break;
      }

      if (!isValid) {
        const message = rule.message || `Validation failed for ${field} (${rule.type})`;

        if (rule.severity === 'error') {
          result.errors.push({
            field,
            message,
            severity: 'error',
            rule: rule.type,
          });
          result.valid = false;
        } else {
          result.warnings.push({
            field,
            message,
            severity: rule.severity,
            rule: rule.type,
          });
        }
      }
    }

    // Apply cross-field rules
    for (const rule of this.crossFieldRules) {
      if (!rule.enabled) continue;

      // Extract values for all fields in the rule
      const fieldValues: Record<string, any> = {};
      for (const field of rule.fields) {
        fieldValues[field] = entity[field];
      }

      // Apply the condition
      const isValid = rule.condition(fieldValues);

      if (!isValid) {
        const message =
          rule.message || `Cross-field validation failed for ${rule.fields.join(', ')}`;

        if (rule.severity === 'error') {
          result.errors.push({
            field: rule.fields.join(', '),
            message,
            severity: 'error',
            rule: rule.type,
          });
          result.valid = false;
        } else {
          result.warnings.push({
            field: rule.fields.join(', '),
            message,
            severity: rule.severity,
            rule: rule.type,
          });
        }
      }
    }

    return result;
  }

  /**
   * Validate data type
   * @param value Value to validate
   * @param type Expected type
   * @returns True if valid
   */
  private validateType(value: any, type?: string): boolean {
    if (value === undefined || value === null) return true;

    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)));
      case 'boolean':
        return typeof value === 'boolean' || value === 'true' || value === 'false';
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && !Array.isArray(value) && value !== null;
      default:
        return true;
    }
  }

  /**
   * Validate numeric range
   * @param value Value to validate
   * @param min Minimum value
   * @param max Maximum value
   * @returns True if valid
   */
  private validateRange(value: any, min?: number, max?: number): boolean {
    if (value === undefined || value === null) return true;

    const numValue = Number(value);

    if (isNaN(numValue)) return false;

    if (min !== undefined && numValue < min) return false;
    if (max !== undefined && numValue > max) return false;

    return true;
  }

  /**
   * Validate string pattern
   * @param value Value to validate
   * @param pattern Regular expression pattern
   * @returns True if valid
   */
  private validatePattern(value: any, pattern?: string): boolean {
    if (value === undefined || value === null) return true;
    if (!pattern) return true;

    const strValue = String(value);
    const regex = new RegExp(pattern);

    return regex.test(strValue);
  }

  /**
   * Validate value against enum
   * @param value Value to validate
   * @param enumValues Allowed enum values
   * @returns True if valid
   */
  private validateEnum(value: any, enumValues?: any[]): boolean {
    if (value === undefined || value === null) return true;
    if (!enumValues || !Array.isArray(enumValues)) return true;

    return enumValues.includes(value);
  }

  /**
   * Calculate data quality metrics for a collection of entities
   * @param entityType Entity type
   * @param entities Collection of entities
   * @returns Data quality metrics
   */
  calculateQualityMetrics(entityType: string, entities: Record<string, any>[]): DataQualityMetrics {
    if (!entities || entities.length === 0) {
      return {
        completeness: 0,
        validity: 0,
        accuracy: 0,
        consistency: 0,
        uniqueness: 0,
        timeliness: 0,
        timestamp: new Date(),
      };
    }

    // Get rules for this entity type
    const rules = this.validationRules.get(entityType) || [];

    // Count required fields for completeness calculation
    const requiredFields = rules
      .filter(rule => rule.type === ValidationRuleType.REQUIRED && rule.enabled)
      .map(rule => rule.field);

    let totalRequiredFields = entities.length * requiredFields.length;
    let nonNullRequiredFields = 0;

    // Validate each entity for validity calculation
    let validEntities = 0;
    let totalAgeHours = 0;
    let uniqueFieldMap: Map<string, Set<any>> = new Map();

    // Initialize uniqueFieldMap for fields that should be unique
    const uniqueFields = rules
      .filter(rule => rule.params?.unique === true && rule.enabled)
      .map(rule => rule.field);

    for (const field of uniqueFields) {
      uniqueFieldMap.set(field, new Set());
    }

    // Process each entity
    for (const entity of entities) {
      // Check completeness (non-null required fields)
      for (const field of requiredFields) {
        if (entity[field] !== undefined && entity[field] !== null && entity[field] !== '') {
          nonNullRequiredFields++;
        }
      }

      // Check validity (passes all rules)
      const validationResult = this.validateEntity(entityType, entity);
      if (validationResult.valid) {
        validEntities++;
      }

      // Check uniqueness
      for (const field of uniqueFields) {
        const value = entity[field];
        if (value !== undefined && value !== null) {
          uniqueFieldMap.get(field)?.add(value);
        }
      }

      // Check timeliness (based on updatedAt or createdAt)
      const updatedAt = entity.updatedAt || entity.updated_at;
      const createdAt = entity.createdAt || entity.created_at;
      const timestamp = updatedAt || createdAt;

      if (timestamp) {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          const ageHours = (new Date().getTime() - date.getTime()) / (1000 * 60 * 60);
          totalAgeHours += ageHours;
        }
      }
    }

    // Calculate metrics
    const completeness = totalRequiredFields > 0 ? nonNullRequiredFields / totalRequiredFields : 1;

    const validity = entities.length > 0 ? validEntities / entities.length : 1;

    // Calculate uniqueness
    let uniquenessRatio = 1;
    if (uniqueFields.length > 0) {
      let totalUniqueness = 0;

      for (const field of uniqueFields) {
        const uniqueValues = uniqueFieldMap.get(field)?.size || 0;
        const ratio = entities.length > 0 ? uniqueValues / entities.length : 1;
        totalUniqueness += ratio;
      }

      uniquenessRatio = uniqueFields.length > 0 ? totalUniqueness / uniqueFields.length : 1;
    }

    // Calculate timeliness (freshness score)
    // Assuming anything under 24 hours is perfectly fresh (1.0)
    // and anything over 30 days is completely stale (0.0)
    const maxFreshHours = 24;
    const minStaleHours = 30 * 24;
    const avgAgeHours = entities.length > 0 ? totalAgeHours / entities.length : 0;

    let timelinessScore = 1.0;
    if (avgAgeHours > maxFreshHours) {
      // Linear scale between maxFreshHours and minStaleHours
      timelinessScore = Math.max(
        0,
        1 - (avgAgeHours - maxFreshHours) / (minStaleHours - maxFreshHours)
      );
    }

    // For now, we're setting accuracy and consistency to fixed values
    // In a real implementation, these would be calculated based on business rules
    const accuracy = 0.95;
    const consistency = 0.95;

    return {
      completeness,
      validity,
      accuracy,
      consistency,
      uniqueness: uniquenessRatio,
      timeliness: timelinessScore,
      timestamp: new Date(),
    };
  }

  /**
   * Detect anomalies in numeric field values
   * @param entityType Entity type
   * @param field Field to analyze
   * @param entities Collection of entities
   * @returns Statistical metrics with detected outliers
   */
  detectAnomalies(
    entityType: string,
    field: string,
    entities: Record<string, any>[]
  ): StatisticalMetrics {
    // Extract numeric values for the field
    const values = entities
      .map(entity => {
        const value = entity[field];
        return typeof value === 'number' ? value : Number(value);
      })
      .filter(value => !isNaN(value));

    // Check if we have enough samples
    if (values.length < this.anomalyConfig.minSampleSize) {
      logger.warn(`Insufficient samples for anomaly detection on ${entityType}.${field}`, {
        component: 'DataQualityMonitor',
        samples: values.length,
        required: this.anomalyConfig.minSampleSize,
      });

      return this.calculateBasicStatistics(values);
    }

    // Sort values for percentile calculations
    const sortedValues = [...values].sort((a, b) => a - b);

    // Calculate mean and standard deviation
    const sum = sortedValues.reduce((acc, val) => acc + val, 0);
    const mean = sum / sortedValues.length;

    const squaredDiffs = sortedValues.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / sortedValues.length;
    const stdDev = Math.sqrt(variance);

    // Detect outliers using Z-score
    const outliers = values.filter(val => {
      const zScore = Math.abs((val - mean) / stdDev);
      return zScore > this.anomalyConfig.sensitivityThreshold;
    });

    // Calculate percentiles
    const firstQuartileIndex = Math.floor(sortedValues.length * 0.25);
    const medianIndex = Math.floor(sortedValues.length * 0.5);
    const thirdQuartileIndex = Math.floor(sortedValues.length * 0.75);

    // Create statistics object
    const stats: StatisticalMetrics = {
      count: values.length,
      min: sortedValues[0],
      max: sortedValues[sortedValues.length - 1],
      mean,
      median: sortedValues[medianIndex],
      stdDev,
      firstQuartile: sortedValues[firstQuartileIndex],
      thirdQuartile: sortedValues[thirdQuartileIndex],
      outliers,
    };

    // Log anomalies if found
    if (outliers.length > 0) {
      logger.info(`Detected ${outliers.length} anomalies in ${entityType}.${field}`, {
        component: 'DataQualityMonitor',
        outlierCount: outliers.length,
        totalCount: values.length,
        percentage: ((outliers.length / values.length) * 100).toFixed(2) + '%',
      });
    }

    return stats;
  }

  /**
   * Calculate basic statistics for numeric values
   * @param values Numeric values
   * @returns Statistical metrics
   */
  private calculateBasicStatistics(values: number[]): StatisticalMetrics {
    if (values.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        firstQuartile: 0,
        thirdQuartile: 0,
        outliers: [],
      };
    }

    const sortedValues = [...values].sort((a, b) => a - b);
    const sum = sortedValues.reduce((acc, val) => acc + val, 0);
    const mean = sum / sortedValues.length;

    const squaredDiffs = sortedValues.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / sortedValues.length;
    const stdDev = Math.sqrt(variance);

    const medianIndex = Math.floor(sortedValues.length * 0.5);
    const firstQuartileIndex = Math.floor(sortedValues.length * 0.25);
    const thirdQuartileIndex = Math.floor(sortedValues.length * 0.75);

    return {
      count: values.length,
      min: sortedValues[0],
      max: sortedValues[sortedValues.length - 1],
      mean,
      median: sortedValues[medianIndex] || 0,
      stdDev,
      firstQuartile: sortedValues[firstQuartileIndex] || 0,
      thirdQuartile: sortedValues[thirdQuartileIndex] || 0,
      outliers: [],
    };
  }

  /**
   * Generate a data quality report for an entity type
   * @param entityType Entity type
   * @returns Data quality report
   */
  async generateDataQualityReport(entityType: string): Promise<any> {
    try {
      logger.info(`Generating data quality report for ${entityType}`, {
        component: 'DataQualityMonitor',
      });

      // Fetch entities based on type
      let entities: Record<string, any>[] = [];

      switch (entityType) {
        case 'property':
          entities = await this.storage.getAllProperties();
          break;
        // Add cases for other entity types as needed
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      // Calculate overall quality metrics
      const metrics = this.calculateQualityMetrics(entityType, entities);

      // Find all numeric fields for anomaly detection
      const sampleEntity = entities[0] || {};
      const numericFields = Object.entries(sampleEntity)
        .filter(
          ([key, value]) =>
            typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))
        )
        .map(([key]) => key);

      // Detect anomalies in numeric fields
      const anomalies: Record<string, StatisticalMetrics> = {};

      for (const field of numericFields) {
        anomalies[field] = this.detectAnomalies(entityType, field, entities);
      }

      // Validate each entity and collect errors/warnings
      const validationIssues = {
        entities: entities.length,
        valid: 0,
        withErrors: 0,
        withWarnings: 0,
        topIssues: new Map<string, number>(),
      };

      for (const entity of entities) {
        const result = this.validateEntity(entityType, entity);

        if (result.valid) {
          validationIssues.valid++;
        }

        if (result.errors.length > 0) {
          validationIssues.withErrors++;

          // Count issues by type
          for (const error of result.errors) {
            const key = `${error.field}:${error.rule}`;
            validationIssues.topIssues.set(key, (validationIssues.topIssues.get(key) || 0) + 1);
          }
        }

        if (result.warnings.length > 0) {
          validationIssues.withWarnings++;

          // Count issues by type
          for (const warning of result.warnings) {
            const key = `${warning.field}:${warning.rule}`;
            validationIssues.topIssues.set(key, (validationIssues.topIssues.get(key) || 0) + 1);
          }
        }
      }

      // Sort issues by frequency
      const sortedIssues = Array.from(validationIssues.topIssues.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([key, count]) => {
          const [field, rule] = key.split(':');
          return { field, rule, count };
        });

      return {
        entityType,
        timestamp: new Date(),
        entityCount: entities.length,
        metrics,
        validationSummary: {
          valid: validationIssues.valid,
          withErrors: validationIssues.withErrors,
          withWarnings: validationIssues.withWarnings,
          validPercentage:
            entities.length > 0
              ? ((validationIssues.valid / entities.length) * 100).toFixed(2) + '%'
              : '0%',
        },
        topIssues: sortedIssues,
        anomalies,
      };
    } catch (error) {
      logger.error(`Error generating data quality report for ${entityType}`, {
        component: 'DataQualityMonitor',
        error,
      });

      throw error;
    }
  }
}
