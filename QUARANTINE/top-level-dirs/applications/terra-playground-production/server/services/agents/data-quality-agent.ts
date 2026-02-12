/**
 * Data Quality Agent Implementation
 *
 * This agent is responsible for validating property data integrity, detecting anomalies,
 * and ensuring data quality standards are met for all property assessment data.
 *
 * It leverages the PropertyValidationEngine to apply validation rules and implements
 * sophisticated data anomaly detection algorithms.
 */

import { v4 as uuidv4 } from 'uuid';
import { IStorage } from '../../storage';
import { IDataQualityAgent } from './interfaces/data-quality-agent.interface';
import {
  PropertyValidationEngine,
  RuleCategory,
  RuleLevel,
  IssueStatus,
  EntityType,
} from '../../services/data-quality/property-validation-engine';
import { NotificationService } from '../notification-service';
import { AgentBase } from './agent-base';
import { logger } from '../../utils/logger';

// Define notification types enum
enum NotificationType {
  DATA_QUALITY_ISSUE = 'data_quality_issue',
  DATA_QUALITY_BATCH_ISSUES = 'data_quality_batch_issues',
}

/**
 * Data Quality Agent Implementation
 */
export class DataQualityAgent extends AgentBase implements IDataQualityAgent {
  private validationEngine: PropertyValidationEngine;
  private notificationService: NotificationService;
  private readonly componentName = 'Data Quality Agent';

  /**
   * Constructor for DataQualityAgent
   */
  constructor(
    private storage: IStorage,
    validationEngine: PropertyValidationEngine,
    notificationService: NotificationService
  ) {
    super('data_quality', 'Data Quality Agent');

    this.validationEngine = validationEngine;
    this.notificationService = notificationService;

    // Register agent capabilities
    this.registerCapabilities([
      'validateProperty',
      'detectDataAnomalies',
      'generateDataQualityReport',
      'runBatchValidation',
      'autoFixIssues',
    ]);

    logger.info({
      component: this.componentName,
      message: 'Data Quality Agent initialized',
    });
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    this.logAgentActivity('Initializing data quality agent');

    // Any specific initialization tasks would go here

    this.logAgentActivity('Data quality agent initialization complete');
  }

  /**
   * Validate a property against all applicable data quality rules
   */
  async validateProperty(
    propertyId: string,
    options: any = {}
  ): Promise<{
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
  }> {
    try {
      this.logAgentActivity('Validating property data', { propertyId });

      // Get the property
      const property = await this.storage.getProperty(propertyId);

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      // Determine which categories to validate based on options
      const categories = options.categories || [
        RuleCategory.DATA_QUALITY,
        RuleCategory.PROPERTY_DATA,
      ];

      // Create validation context
      const validationContext = {
        ...this.validationEngine.getDefaultContext(),
        userId: options.userId,
        ...options.context,
      };

      // Run validation
      const validationResults = await this.validationEngine.validateProperty(property, {
        categories: categories,
      });

      // Count issues by severity
      let criticalIssues = 0;
      let errorIssues = 0;
      let warningIssues = 0;
      let infoIssues = 0;

      for (const issue of validationResults.issues) {
        switch (issue.level) {
          case RuleLevel.CRITICAL:
            criticalIssues++;
            break;
          case RuleLevel.ERROR:
            errorIssues++;
            break;
          case RuleLevel.WARNING:
            warningIssues++;
            break;
          case RuleLevel.INFO:
            infoIssues++;
            break;
        }
      }

      const totalIssues = criticalIssues + errorIssues + warningIssues + infoIssues;
      const isValid = criticalIssues === 0 && errorIssues === 0;

      // Format issues for return
      const formattedIssues = validationResults.issues.map(issue => ({
        issueId: issue.issueId,
        ruleId: issue.ruleId,
        level: issue.level,
        message: issue.message,
        details: issue.details,
      }));

      // Record this activity in the system
      await this.recordAgentActivity('validated_property', 'property', propertyId, {
        totalIssues,
        criticalIssues,
        errorIssues,
        warningIssues,
        infoIssues,
        isValid,
      });

      // Send notification if there are critical issues
      if (criticalIssues > 0 && options.notify !== false) {
        await this.notificationService.createSystemNotification(
          NotificationType.DATA_QUALITY_ISSUE,
          `Critical data quality issues detected for property ${propertyId}`,
          'property',
          propertyId,
          'critical'
        );
      }

      // Log completion
      this.logAgentActivity('Property validation complete', {
        propertyId,
        isValid,
        totalIssues,
      });

      return {
        isValid,
        criticalIssues,
        errorIssues,
        warningIssues,
        infoIssues,
        totalIssues,
        issues: formattedIssues,
      };
    } catch (error) {
      this.logAgentError('Error validating property', error);
      throw error;
    }
  }

  /**
   * Detect anomalies in property data using statistical methods
   */
  async detectDataAnomalies(options: any): Promise<{
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
  }> {
    try {
      this.logAgentActivity('Detecting data anomalies', options);

      // Get properties based on filter options
      const filters = this.buildPropertyFilters(options);
      const properties = await this.storage.getPropertiesByFilters(filters);

      if (!properties || properties.length === 0) {
        return {
          anomalies: [],
          statisticalSummary: {
            totalPropertiesAnalyzed: 0,
            anomalyRate: 0,
            mostCommonAnomaly: 'N/A',
            mostAffectedField: 'N/A',
          },
        };
      }

      // Keep track of detected anomalies
      const anomalies: Array<{
        anomalyId: string;
        propertyId: string;
        field: string;
        expectedValue: any;
        actualValue: any;
        description: string;
        confidenceScore: number;
        severity: string;
      }> = [];

      // Statistical tracking
      const anomalyTypes: Record<string, number> = {};
      const affectedFields: Record<string, number> = {};

      // Simple statistical detection for continuous fields
      const numericFields = ['value', 'landValue', 'improvementValue', 'acres', 'squareFeet'];

      for (const field of numericFields) {
        // Extract values
        const values = properties
          .map(p => p[field])
          .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
          .map(v => Number(v));

        if (values.length < 5) continue; // Need enough data for statistics

        // Calculate statistics
        const mean = this.calculateMean(values);
        const stdDev = this.calculateStandardDeviation(values, mean);

        // Z-score threshold for anomaly detection (adjustable)
        const threshold = options.zScoreThreshold || 3.0;

        // Detect outliers
        for (const property of properties) {
          const value = Number(property[field]);

          if (isNaN(value) || value === null || value === undefined) continue;

          const zScore = Math.abs((value - mean) / stdDev);

          if (zScore > threshold) {
            // This is an anomaly
            const anomalyType = `outlier_${field}`;
            const anomalyId = `anomaly_${uuidv4()}`;
            const severity = zScore > 5 ? 'critical' : zScore > 4 ? 'high' : 'medium';
            const confidenceScore = Math.min(0.5 + zScore / 10, 0.95); // Scale confidence

            anomalies.push({
              anomalyId,
              propertyId: property.propertyId,
              field,
              expectedValue: `Between ${Math.round((mean - stdDev) * 100) / 100} and ${Math.round((mean + stdDev) * 100) / 100}`,
              actualValue: value,
              description: `Value for ${field} is ${zScore.toFixed(2)} standard deviations from the mean`,
              confidenceScore,
              severity,
            });

            // Track statistics
            anomalyTypes[anomalyType] = (anomalyTypes[anomalyType] || 0) + 1;
            affectedFields[field] = (affectedFields[field] || 0) + 1;
          }
        }
      }

      // Detect categorical anomalies (e.g., mismatched property types)
      // This would require more complex logic in a real implementation

      // Find most common anomaly and field
      let mostCommonAnomaly = 'N/A';
      let mostCommonAnomalyCount = 0;

      for (const [anomaly, count] of Object.entries(anomalyTypes)) {
        if (count > mostCommonAnomalyCount) {
          mostCommonAnomaly = anomaly;
          mostCommonAnomalyCount = count;
        }
      }

      let mostAffectedField = 'N/A';
      let mostAffectedFieldCount = 0;

      for (const [field, count] of Object.entries(affectedFields)) {
        if (count > mostAffectedFieldCount) {
          mostAffectedField = field;
          mostAffectedFieldCount = count;
        }
      }

      // Calculate summary statistics
      const totalPropertiesAnalyzed = properties.length;
      const anomalyRate =
        totalPropertiesAnalyzed > 0 ? anomalies.length / totalPropertiesAnalyzed : 0;

      // Create statistical summary
      const statisticalSummary = {
        totalPropertiesAnalyzed,
        anomalyRate,
        mostCommonAnomaly,
        mostAffectedField,
      };

      // Record this activity
      await this.recordAgentActivity(
        'detected_data_anomalies',
        'properties',
        options.area || 'all',
        {
          anomalyCount: anomalies.length,
          propertiesAnalyzed: totalPropertiesAnalyzed,
          anomalyRate,
        }
      );

      // Log completion
      this.logAgentActivity('Anomaly detection complete', {
        totalPropertiesAnalyzed,
        anomaliesFound: anomalies.length,
      });

      return {
        anomalies,
        statisticalSummary,
      };
    } catch (error) {
      this.logAgentError('Error detecting data anomalies', error);
      throw error;
    }
  }

  /**
   * Generate a data quality report for a specified dataset
   */
  async generateDataQualityReport(
    datasetType: string,
    options: any = {}
  ): Promise<{
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
  }> {
    try {
      this.logAgentActivity('Generating data quality report', { datasetType, ...options });

      const reportId = `dq_report_${uuidv4()}`;
      const generatedAt = new Date();

      // Get the data to analyze based on dataset type
      let records: any[] = [];
      let validationResults: any[] = [];

      switch (datasetType) {
        case 'properties':
          // Get properties based on filters
          const filters = this.buildPropertyFilters(options);
          records = await this.storage.getPropertiesByFilters(filters);

          // Validate each property
          for (const property of records) {
            const result = await this.validationEngine.validateProperty(property, {
              categories: [RuleCategory.DATA_QUALITY, RuleCategory.PROPERTY_DATA],
            });
            validationResults.push(result);
          }
          break;

        case 'land_records':
          // Would implement similar pattern for land records
          // This is simplified for demonstration
          records = await this.storage.getLandRecords(options.limit || 100);
          break;

        case 'improvements':
          // Would implement similar pattern for improvements
          // This is simplified for demonstration
          records = await this.storage.getImprovements(options.limit || 100);
          break;

        default:
          throw new Error(`Unsupported dataset type: ${datasetType}`);
      }

      // Calculate issue statistics
      let criticalIssues = 0;
      let errorIssues = 0;
      let warningIssues = 0;
      let infoIssues = 0;

      // Track issue counts by rule ID
      const issueCountsByRule: Record<string, { count: number; description: string }> = {};

      // Process validation results
      for (const result of validationResults) {
        for (const issue of result.issues) {
          switch (issue.level) {
            case RuleLevel.CRITICAL:
              criticalIssues++;
              break;
            case RuleLevel.ERROR:
              errorIssues++;
              break;
            case RuleLevel.WARNING:
              warningIssues++;
              break;
            case RuleLevel.INFO:
              infoIssues++;
              break;
          }

          // Track issue by rule ID
          if (!issueCountsByRule[issue.ruleId]) {
            issueCountsByRule[issue.ruleId] = {
              count: 0,
              description: issue.message,
            };
          }

          issueCountsByRule[issue.ruleId].count++;
        }
      }

      // Get top issues
      const topIssues = Object.entries(issueCountsByRule)
        .map(([ruleId, { count, description }]) => ({
          ruleId,
          count,
          description,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate quality scores
      // These would be more sophisticated in a real implementation
      const totalIssues = criticalIssues + errorIssues + warningIssues + infoIssues;
      const issueWeight = records.length > 0 ? totalIssues / (records.length * 3) : 1;

      // Calculate weighted scores
      const completenessScore = Math.round(
        100 * (1 - (criticalIssues * 0.5 + errorIssues * 0.3) / (records.length || 1))
      );
      const accuracyScore = Math.round(100 * (1 - issueWeight * 0.7));
      const consistencyScore = Math.round(
        100 * (1 - (warningIssues * 0.4 + infoIssues * 0.1) / (records.length || 1))
      );

      // Overall quality score is weighted average of component scores
      const qualityScore = Math.round(
        completenessScore * 0.4 + accuracyScore * 0.4 + consistencyScore * 0.2
      );

      // Generate recommended actions based on issues
      const recommendedActions = this.generateRecommendedActions(
        topIssues,
        {
          criticalIssues,
          errorIssues,
          warningIssues,
          infoIssues,
        },
        datasetType
      );

      // Record this activity
      await this.recordAgentActivity('generated_data_quality_report', datasetType, reportId, {
        recordsAnalyzed: records.length,
        qualityScore,
        totalIssues,
      });

      // Log completion
      this.logAgentActivity('Data quality report generated', {
        datasetType,
        reportId,
        recordsAnalyzed: records.length,
        qualityScore,
      });

      return {
        reportId,
        datasetType,
        generatedAt,
        recordsAnalyzed: records.length,
        qualityScore,
        completenessScore,
        accuracyScore,
        consistencyScore,
        issuesByLevel: {
          critical: criticalIssues,
          error: errorIssues,
          warning: warningIssues,
          info: infoIssues,
        },
        topIssues,
        recommendedActions,
      };
    } catch (error) {
      this.logAgentError('Error generating data quality report', error);
      throw error;
    }
  }

  /**
   * Run a batch validation job on multiple properties
   */
  async runBatchValidation(
    propertyIds: string[],
    options: any = {}
  ): Promise<{
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
  }> {
    try {
      this.logAgentActivity('Running batch validation', {
        propertyCount: propertyIds.length,
        ...options,
      });

      const batchId = `batch_${uuidv4()}`;

      let validatedProperties = 0;
      let failedProperties = 0;
      let totalIssues = 0;
      let criticalIssues = 0;
      let errorIssues = 0;
      let warningIssues = 0;
      let infoIssues = 0;

      const propertiesWithIssues: Array<{
        propertyId: string;
        issueCount: number;
        highestSeverity: string;
      }> = [];

      // Process properties in chunks to avoid overwhelming the system
      const chunkSize = options.chunkSize || 20;

      for (let i = 0; i < propertyIds.length; i += chunkSize) {
        const chunk = propertyIds.slice(i, i + chunkSize);

        // Process properties in parallel within the chunk
        const results = await Promise.allSettled(
          chunk.map(propertyId =>
            this.validateProperty(propertyId, {
              ...options,
              notify: false, // Don't send notifications for each property
            })
          )
        );

        // Process results
        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          const propertyId = chunk[j];

          if (result.status === 'fulfilled') {
            validatedProperties++;

            const validationResult = result.value;
            totalIssues += validationResult.totalIssues;
            criticalIssues += validationResult.criticalIssues;
            errorIssues += validationResult.errorIssues;
            warningIssues += validationResult.warningIssues;
            infoIssues += validationResult.infoIssues;

            if (validationResult.totalIssues > 0) {
              let highestSeverity = 'info';

              if (validationResult.criticalIssues > 0) {
                highestSeverity = 'critical';
              } else if (validationResult.errorIssues > 0) {
                highestSeverity = 'error';
              } else if (validationResult.warningIssues > 0) {
                highestSeverity = 'warning';
              }

              propertiesWithIssues.push({
                propertyId,
                issueCount: validationResult.totalIssues,
                highestSeverity,
              });
            }
          } else {
            failedProperties++;
            this.logAgentWarning(`Failed to validate property: ${propertyId}`, {
              reason: result.reason,
            });
          }
        }

        // Progress update every 100 properties
        if ((i + chunkSize) % 100 === 0 || i + chunkSize >= propertyIds.length) {
          this.logAgentActivity('Batch validation progress', {
            batchId,
            processed: Math.min(i + chunkSize, propertyIds.length),
            total: propertyIds.length,
            issuesFound: totalIssues,
          });
        }
      }

      // Sort properties with issues by severity and count
      propertiesWithIssues.sort((a, b) => {
        const severityOrder = {
          critical: 0,
          error: 1,
          warning: 2,
          info: 3,
        };

        const severityDiff = severityOrder[a.highestSeverity] - severityOrder[b.highestSeverity];
        if (severityDiff !== 0) return severityDiff;

        return b.issueCount - a.issueCount;
      });

      // Limit the number of properties returned to avoid excessive payloads
      const maxReturnedProperties = options.maxReturnedProperties || 100;
      const limitedPropertiesWithIssues = propertiesWithIssues.slice(0, maxReturnedProperties);

      // Send notification if there are critical issues
      if (criticalIssues > 0 && options.notify !== false) {
        await this.notificationService.createSystemNotification(
          NotificationType.DATA_QUALITY_BATCH_ISSUES,
          `Batch validation found ${criticalIssues} critical issues across ${propertiesWithIssues.length} properties`,
          'batch_validation',
          batchId,
          'critical'
        );
      }

      // Record this activity
      await this.recordAgentActivity('ran_batch_validation', 'properties', batchId, {
        totalProperties: propertyIds.length,
        validatedProperties,
        failedProperties,
        totalIssues,
        propertiesWithIssuesCount: propertiesWithIssues.length,
      });

      // Log completion
      this.logAgentActivity('Batch validation complete', {
        batchId,
        totalProperties: propertyIds.length,
        validatedProperties,
        failedProperties,
        totalIssues,
      });

      return {
        batchId,
        totalProperties: propertyIds.length,
        validatedProperties,
        failedProperties,
        totalIssues,
        issuesByLevel: {
          critical: criticalIssues,
          error: errorIssues,
          warning: warningIssues,
          info: infoIssues,
        },
        propertiesWithIssues: limitedPropertiesWithIssues,
      };
    } catch (error) {
      this.logAgentError('Error running batch validation', error);
      throw error;
    }
  }

  /**
   * Fix common data quality issues automatically
   */
  async autoFixIssues(
    propertyId: string,
    options: {
      issueTypes: string[];
      dryRun?: boolean;
      verificationLevel?: 'none' | 'basic' | 'thorough';
    }
  ): Promise<{
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
  }> {
    try {
      this.logAgentActivity('Auto-fixing issues', {
        propertyId,
        issueTypes: options.issueTypes,
        dryRun: options.dryRun,
      });

      // Get the property
      const property = await this.storage.getProperty(propertyId);

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      // Validate the property to find issues
      const validationResult = await this.validationEngine.validateProperty(property);

      // Filter issues that we can fix based on issueTypes
      const fixableIssues = validationResult.issues.filter(
        issue => options.issueTypes.includes(issue.ruleId) || options.issueTypes.includes('all')
      );

      const fixResults: Array<{
        issueId: string;
        ruleId: string;
        field: string;
        oldValue: any;
        newValue: any;
        fixStatus: 'fixed' | 'failed' | 'skipped';
      }> = [];

      // Track property updates
      const propertyUpdates: Record<string, any> = {};

      // Process each fixable issue
      for (const issue of fixableIssues) {
        // Determine if we can fix this issue
        const fixStrategy = this.getFixStrategy(issue.ruleId, issue);

        if (!fixStrategy) {
          fixResults.push({
            issueId: issue.issueId,
            ruleId: issue.ruleId,
            field: issue.details?.field || 'unknown',
            oldValue: issue.details?.value,
            newValue: null,
            fixStatus: 'skipped',
          });
          continue;
        }

        try {
          // Apply the fix strategy to get the new value
          const field = fixStrategy.field;
          const oldValue = property[field];
          const newValue = fixStrategy.fixFunction(property, issue);

          // Update the property updates object
          propertyUpdates[field] = newValue;

          fixResults.push({
            issueId: issue.issueId,
            ruleId: issue.ruleId,
            field,
            oldValue,
            newValue,
            fixStatus: options.dryRun ? 'skipped' : 'fixed',
          });
        } catch (error) {
          this.logAgentWarning(`Failed to fix issue: ${issue.issueId}`, {
            ruleId: issue.ruleId,
            error: error instanceof Error ? error.message : String(error),
          });

          fixResults.push({
            issueId: issue.issueId,
            ruleId: issue.ruleId,
            field: issue.details?.field || 'unknown',
            oldValue: issue.details?.value,
            newValue: null,
            fixStatus: 'failed',
          });
        }
      }

      // If this is not a dry run, update the property
      if (!options.dryRun && Object.keys(propertyUpdates).length > 0) {
        await this.storage.updateProperty(propertyId, propertyUpdates);

        // Record this activity
        await this.recordAgentActivity('auto_fixed_issues', 'property', propertyId, {
          fixedIssueCount: fixResults.filter(r => r.fixStatus === 'fixed').length,
          dryRun: false,
        });
      } else if (options.dryRun) {
        // Record dry run activity
        await this.recordAgentActivity('auto_fix_dry_run', 'property', propertyId, {
          fixableIssueCount: fixResults.length,
          dryRun: true,
        });
      }

      // Verify the fixes if not a dry run and verification is requested
      let verificationResults;

      if (
        !options.dryRun &&
        options.verificationLevel !== 'none' &&
        fixResults.some(r => r.fixStatus === 'fixed')
      ) {
        // Re-validate the property to see if issues were fixed
        const updatedProperty = await this.storage.getProperty(propertyId);
        const postFixValidation = await this.validationEngine.validateProperty(updatedProperty);

        // Check if fixed issues are still present
        const stillPresentIssues = postFixValidation.issues.filter(issue =>
          fixableIssues.some(fixedIssue => fixedIssue.ruleId === issue.ruleId)
        );

        const verified = stillPresentIssues.length === 0;

        verificationResults = {
          verified,
          message: verified
            ? 'All issues were successfully fixed and verified'
            : `${stillPresentIssues.length} issues could not be fully fixed`,
        };

        // Add verification result to log
        this.logAgentActivity('Fix verification complete', {
          propertyId,
          verified,
          remainingIssueCount: stillPresentIssues.length,
        });
      }

      // Calculate remaining issues
      const remainingIssues =
        validationResult.issues.length - fixResults.filter(r => r.fixStatus === 'fixed').length;

      // Log completion
      this.logAgentActivity('Auto-fix operation complete', {
        propertyId,
        fixedIssueCount: fixResults.filter(r => r.fixStatus === 'fixed').length,
        failedFixCount: fixResults.filter(r => r.fixStatus === 'failed').length,
        skippedFixCount: fixResults.filter(r => r.fixStatus === 'skipped').length,
        dryRun: options.dryRun,
      });

      return {
        propertyId,
        fixedIssues: fixResults,
        remainingIssues,
        verificationResults,
      };
    } catch (error) {
      this.logAgentError('Error auto-fixing issues', error);
      throw error;
    }
  }

  // Helper methods

  /**
   * Build property filters object from options
   */
  private buildPropertyFilters(options: any): Record<string, any> {
    const filters: Record<string, any> = {};

    if (options.propertyType) {
      filters.propertyType = options.propertyType;
    }

    if (options.area) {
      filters.area = options.area;
    }

    if (options.minValue !== undefined) {
      filters.minValue = options.minValue;
    }

    if (options.maxValue !== undefined) {
      filters.maxValue = options.maxValue;
    }

    if (options.limit) {
      filters.limit = options.limit;
    }

    return filters;
  }

  /**
   * Calculate mean of an array of numbers
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * Calculate standard deviation of an array of numbers
   */
  private calculateStandardDeviation(values: number[], mean?: number): number {
    if (values.length <= 1) return 0;

    const avg = mean !== undefined ? mean : this.calculateMean(values);
    const squaredDifferences = values.map(value => Math.pow(value - avg, 2));
    const variance =
      squaredDifferences.reduce((sum, value) => sum + value, 0) / (values.length - 1);

    return Math.sqrt(variance);
  }

  /**
   * Generate recommended actions based on identified issues
   */
  private generateRecommendedActions(
    topIssues: Array<{ ruleId: string; count: number; description: string }>,
    issuesByLevel: { critical: number; error: number; warning: number; info: number },
    datasetType: string
  ): string[] {
    const actions: string[] = [];

    // Recommendations based on critical issues
    if (issuesByLevel.critical > 0) {
      actions.push('Immediately address critical data quality issues that may impact assessments');
    }

    // Recommendations for top issues
    for (let i = 0; i < Math.min(3, topIssues.length); i++) {
      const issue = topIssues[i];

      switch (issue.ruleId) {
        case 'property_required_fields':
          actions.push(`Add missing required fields to ${issue.count} properties`);
          break;
        case 'property_valid_type':
          actions.push(`Correct invalid property types in ${issue.count} records`);
          break;
        case 'land_required_fields':
          actions.push(`Complete missing land record information for ${issue.count} records`);
          break;
        case 'improvement_year_built':
          actions.push(`Update invalid year built values for ${issue.count} improvements`);
          break;
        case 'cross_property_type_land_use_match':
          actions.push(`Align property types with land use codes for ${issue.count} properties`);
          break;
        default:
          actions.push(`Address ${issue.description} (${issue.count} occurrences)`);
      }
    }

    // General recommendations
    if (datasetType === 'properties' && issuesByLevel.error + issuesByLevel.critical > 10) {
      actions.push('Run data cleansing operations on the property dataset');
    }

    if (issuesByLevel.warning > 50) {
      actions.push('Review data entry procedures to prevent common warning-level issues');
    }

    if (
      issuesByLevel.critical + issuesByLevel.error + issuesByLevel.warning + issuesByLevel.info >
      100
    ) {
      actions.push('Consider implementing additional validation rules during data entry');
    }

    return actions;
  }

  /**
   * Get fix strategy for a specific rule ID
   */
  private getFixStrategy(
    ruleId: string,
    issue: any
  ): { field: string; fixFunction: (property: any, issue: any) => any } | null {
    switch (ruleId) {
      case 'property_required_fields':
        // Only fix if we know what field is missing
        if (!issue.details?.field) return null;

        return {
          field: issue.details.field,
          fixFunction: (property, issue) => {
            const field = issue.details.field;

            // Apply default values based on field
            switch (field) {
              case 'propertyType':
                return 'Unknown';
              case 'status':
                return 'active';
              case 'acres':
                // Try to calculate from land records if available
                return 0;
              default:
                return 'Missing - Needs Review';
            }
          },
        };

      case 'property_valid_type':
        return {
          field: 'propertyType',
          fixFunction: (property, issue) => {
            // Fix invalid property type to a valid one
            const validTypes = [
              'Residential',
              'Commercial',
              'Agricultural',
              'Industrial',
              'Mixed Use',
              'Recreational',
            ];

            // Try to map similar types
            const currentType = property.propertyType || '';

            // Simple fuzzy matching
            for (const validType of validTypes) {
              if (currentType.toLowerCase().includes(validType.toLowerCase())) {
                return validType;
              }
            }

            // Default to "Unknown" if no match
            return 'Residential';
          },
        };

      case 'property_value_range':
        return {
          field: 'value',
          fixFunction: (property, issue) => {
            // If value is negative, make it positive
            if (property.value < 0) {
              return Math.abs(property.value);
            }

            // If value is zero, use the sum of land and improvement values
            if (property.value === 0 && property.landValue && property.improvementValue) {
              return property.landValue + property.improvementValue;
            }

            // Otherwise, we can't fix automatically
            return property.value;
          },
        };

      // Add more fix strategies for other rule types

      default:
        return null;
    }
  }
}
