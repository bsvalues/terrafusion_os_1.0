/**
 * Compliance Agent
 *
 * This agent is responsible for ensuring adherence to Washington State
 * property assessment regulations through automated compliance checks,
 * report generation, and monitoring. It leverages the WA Compliance Reporter
 * service to generate detailed compliance reports.
 */

import { IStorage } from '../../storage';
import { logger } from '../../utils/logger';
import { WAComplianceReporter } from '../compliance/wa-compliance-reporter';
import { ComplianceAgent } from './interfaces/compliance-agent.interface';
import { NotificationService, NotificationType } from '../notification-service';
import { AgentBase } from './agent-base';
import { PropertyValidationEngine } from '../data-quality/property-validation-engine';
import { RuleCategory, RuleLevel } from '@shared/schema';

/**
 * Implementation of the Compliance Agent
 */
export class ComplianceAgentImpl extends AgentBase implements ComplianceAgent {
  private complianceReporter: WAComplianceReporter;
  private validationEngine: PropertyValidationEngine;

  /**
   * Create a new instance of the Compliance Agent
   */
  constructor(
    private storage: IStorage,
    private notificationService: NotificationService
  ) {
    super('compliance', 'Compliance Agent');

    this.complianceReporter = new WAComplianceReporter(storage, notificationService);

    this.validationEngine = new PropertyValidationEngine(storage);

    this.registerCapabilities([
      'generateComplianceReportPackage',
      'checkPropertyCompliance',
      'evaluateComplianceHealth',
      'getComplianceRegulations',
      'scheduleComplianceChecks',
    ]);

    logger.info({
      component: this.componentName,
      message: 'Compliance Agent initialized',
    });
  }

  /**
   * Initialize the agent
   * Required by the Agent System for proper initialization
   */
  public async initialize(): Promise<void> {
    this.logAgentActivity('Initializing compliance agent');

    // Perform any specific initialization tasks
    // For now, just confirm initialization

    this.logAgentActivity('Compliance agent initialization complete');
  }

  /**
   * Generate a comprehensive compliance report package for a given tax year
   */
  async generateComplianceReportPackage(
    taxYear: number,
    options: any = {}
  ): Promise<{
    reportId: string;
    equalizationReport: any;
    revaluationReport: any;
    exemptionReport: any;
    appealReport: any;
    isFullyCompliant: boolean;
    complianceIssues: string[];
  }> {
    try {
      this.logAgentActivity('Generating comprehensive compliance report package', { taxYear });

      // Use the preparer information if provided in options
      const preparedBy = options.preparedBy || 'Compliance Agent';

      // Call the WA Compliance Reporter to generate the annual package
      const reportPackage = await this.complianceReporter.generateAnnualCompliancePackage(
        taxYear,
        preparedBy
      );

      // Log the completion of the report generation
      this.logAgentActivity('Completed compliance report package generation', {
        taxYear,
        isFullyCompliant: reportPackage.isFullyCompliant,
        issueCount: reportPackage.complianceIssues.length,
      });

      // Record this activity in the system
      await this.recordAgentActivity(
        'generated_compliance_package',
        'report',
        `ANNUAL-${taxYear}`,
        {
          taxYear,
          isFullyCompliant: reportPackage.isFullyCompliant,
          issueCount: reportPackage.complianceIssues.length,
        }
      );

      // Return the report package with a reportId
      return {
        reportId: `ANNUAL-${taxYear}`,
        ...reportPackage,
      };
    } catch (error) {
      this.logAgentError('Failed to generate compliance report package', error);
      throw error;
    }
  }

  /**
   * Check compliance for a specific property
   */
  async checkPropertyCompliance(
    propertyId: string,
    complianceType: string
  ): Promise<{
    isCompliant: boolean;
    issues: Array<{
      issueType: string;
      description: string;
      severity: string;
      recommendedAction?: string;
    }>;
  }> {
    try {
      this.logAgentActivity('Checking property compliance', { propertyId, complianceType });

      // Get the property details
      const property = await this.storage.getPropertyById(propertyId);

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      let validationResults;

      // Apply different validation rules based on compliance type
      switch (complianceType.toLowerCase()) {
        case 'valuation':
          validationResults = await this.validationEngine.validateProperty(property, {
            categories: [RuleCategory.VALUATION],
          });
          break;

        case 'classification':
          validationResults = await this.validationEngine.validateProperty(property, {
            categories: [RuleCategory.CLASSIFICATION],
          });
          break;

        case 'data_quality':
          validationResults = await this.validationEngine.validateProperty(property, {
            categories: [RuleCategory.DATA_QUALITY, RuleCategory.PROPERTY_DATA],
          });
          break;

        case 'geo_spatial':
          validationResults = await this.validationEngine.validateProperty(property, {
            categories: [RuleCategory.GEO_SPATIAL],
          });
          break;

        case 'all':
        default:
          validationResults = await this.validationEngine.validateProperty(property);
          break;
      }

      // Transform validation issues into compliance issues
      const issues = validationResults.issues.map(issue => ({
        issueType: issue.ruleId,
        description: issue.message,
        severity: this.mapRuleLevelToSeverity(issue.level),
        recommendedAction: issue.details?.recommendedAction,
      }));

      // Determine if the property is compliant (no critical or error issues)
      const isCompliant = !validationResults.issues.some(
        issue => issue.level === RuleLevel.CRITICAL || issue.level === RuleLevel.ERROR
      );

      // Record this activity in the system
      await this.recordAgentActivity('checked_property_compliance', 'property', propertyId, {
        complianceType,
        isCompliant,
        issueCount: issues.length,
      });

      // Log the completion of the compliance check
      this.logAgentActivity('Completed property compliance check', {
        propertyId,
        complianceType,
        isCompliant,
        issueCount: issues.length,
      });

      return {
        isCompliant,
        issues,
      };
    } catch (error) {
      this.logAgentError('Failed to check property compliance', error);
      throw error;
    }
  }

  /**
   * Evaluate the compliance health of the county's assessment data
   */
  async evaluateComplianceHealth(options: any = {}): Promise<{
    overallScore: number;
    categories: Record<
      string,
      {
        score: number;
        description: string;
        issues: string[];
        recommendations: string[];
      }
    >;
    trend: 'improving' | 'stable' | 'declining';
  }> {
    try {
      this.logAgentActivity('Evaluating compliance health');

      // Get current year for tax purposes
      const currentYear = new Date().getFullYear();
      const taxYear = options.taxYear || currentYear;

      // Generate compliance reports if needed
      const annualPackage = await this.generateComplianceReportPackage(taxYear);

      // Get historical compliance data if available
      let previousYearReports = null;
      try {
        previousYearReports = await this.storage.getComplianceReportsByYear(taxYear - 1);
      } catch (error) {
        this.logAgentWarning('No historical compliance data available', { taxYear: taxYear - 1 });
      }

      // Calculate category scores
      const categories: Record<
        string,
        {
          score: number;
          description: string;
          issues: string[];
          recommendations: string[];
        }
      > = {
        equalization: {
          score: this.calculateCategoryScore(annualPackage.equalizationReport),
          description:
            'Equalization ratio compliance measures how accurately properties are assessed relative to market value.',
          issues: this.extractCategoryIssues(annualPackage.complianceIssues, 'Equalization'),
          recommendations: this.generateRecommendations(
            'equalization',
            annualPackage.equalizationReport
          ),
        },
        revaluation: {
          score: this.calculateCategoryScore(annualPackage.revaluationReport),
          description:
            'Revaluation cycle compliance ensures all areas are reassessed within the required timeframe.',
          issues: this.extractCategoryIssues(annualPackage.complianceIssues, 'Revaluation'),
          recommendations: this.generateRecommendations(
            'revaluation',
            annualPackage.revaluationReport
          ),
        },
        exemption: {
          score: this.calculateCategoryScore(annualPackage.exemptionReport),
          description:
            'Exemption verification compliance ensures all exemptions are properly documented and verified.',
          issues: this.extractCategoryIssues(annualPackage.complianceIssues, 'Exemption'),
          recommendations: this.generateRecommendations('exemption', annualPackage.exemptionReport),
        },
        appeals: {
          score: this.calculateCategoryScore(annualPackage.appealReport),
          description:
            'Appeal process compliance ensures all appeals are handled within required timelines and procedures.',
          issues: this.extractCategoryIssues(annualPackage.complianceIssues, 'Appeal'),
          recommendations: this.generateRecommendations('appeals', annualPackage.appealReport),
        },
      };

      // Calculate overall compliance score (weighted average)
      const weights = {
        equalization: 0.3,
        revaluation: 0.25,
        exemption: 0.25,
        appeals: 0.2,
      };

      let overallScore = 0;
      for (const [category, data] of Object.entries(categories)) {
        overallScore += data.score * weights[category as keyof typeof weights];
      }

      // Determine trend by comparing with previous year if available
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (previousYearReports && previousYearReports.length > 0) {
        // This would need actual implementation logic to compare with previous year data
        // For now, setting to stable as a placeholder
        trend = 'stable';
      }

      // Record this activity in the system
      await this.recordAgentActivity(
        'evaluated_compliance_health',
        'compliance',
        `health-${taxYear}`,
        {
          taxYear,
          overallScore,
          trend,
        }
      );

      // Log the completion of the health evaluation
      this.logAgentActivity('Completed compliance health evaluation', {
        taxYear,
        overallScore,
        trend,
      });

      return {
        overallScore,
        categories,
        trend,
      };
    } catch (error) {
      this.logAgentError('Failed to evaluate compliance health', error);
      throw error;
    }
  }

  /**
   * Get compliance regulations for a specific property type or assessment activity
   */
  async getComplianceRegulations(propertyType: string): Promise<
    Array<{
      regulation: string;
      description: string;
      source: string;
      requirements: string[];
      applicabilityConditions?: string[];
    }>
  > {
    try {
      this.logAgentActivity('Retrieving compliance regulations', { propertyType });

      // Get regulations from the database or a predefined set
      // This is a simplified implementation
      const regulations = await this.getRegulationsForPropertyType(propertyType);

      // Record this activity in the system
      await this.recordAgentActivity(
        'retrieved_compliance_regulations',
        'regulations',
        propertyType,
        {
          propertyType,
          regulationCount: regulations.length,
        }
      );

      return regulations;
    } catch (error) {
      this.logAgentError('Failed to retrieve compliance regulations', error);
      throw error;
    }
  }

  /**
   * Schedule regular compliance checks and reports
   */
  async scheduleComplianceChecks(schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
    reportTypes: string[];
    recipients?: string[];
  }): Promise<{
    scheduled: boolean;
    nextRunDate: Date;
    scheduledTasks: string[];
  }> {
    try {
      this.logAgentActivity('Scheduling compliance checks', schedule);

      // Calculate next run date based on frequency
      const nextRunDate = this.calculateNextRunDate(schedule.frequency);

      // Create scheduled tasks based on report types
      const scheduledTasks = schedule.reportTypes.map(
        reportType => `${reportType}_compliance_check_${schedule.frequency}`
      );

      // In a real implementation, this would create actual scheduled tasks
      // For now, just log the schedule

      // Notify recipients if specified
      if (schedule.recipients && schedule.recipients.length > 0) {
        for (const recipient of schedule.recipients) {
          await this.notificationService.sendStaffNotification(
            recipient,
            NotificationType.SYSTEM_ALERT,
            'Compliance Checks Scheduled',
            `Compliance checks have been scheduled with ${schedule.frequency} frequency for the following reports: ${schedule.reportTypes.join(', ')}`,
            'compliance',
            'schedule',
            'medium'
          );
        }
      }

      // Record this activity in the system
      await this.recordAgentActivity(
        'scheduled_compliance_checks',
        'schedule',
        schedule.frequency,
        {
          frequency: schedule.frequency,
          reportTypes: schedule.reportTypes,
          nextRunDate,
          recipientCount: schedule.recipients?.length || 0,
        }
      );

      return {
        scheduled: true,
        nextRunDate,
        scheduledTasks,
      };
    } catch (error) {
      this.logAgentError('Failed to schedule compliance checks', error);
      throw error;
    }
  }

  // Helper methods

  /**
   * Map rule level to a human-readable severity
   */
  private mapRuleLevelToSeverity(level: RuleLevel): string {
    switch (level) {
      case RuleLevel.CRITICAL:
        return 'Critical';
      case RuleLevel.ERROR:
        return 'Error';
      case RuleLevel.WARNING:
        return 'Warning';
      case RuleLevel.INFO:
        return 'Info';
      default:
        return 'Unknown';
    }
  }

  /**
   * Calculate a category score based on report data
   */
  private calculateCategoryScore(report: any): number {
    // This is a simplified scoring algorithm
    // In a real implementation, this would be more sophisticated

    if (!report) {
      return 0;
    }

    if (report.isCompliant) {
      return 100;
    }

    // Different reports have different structures
    // This is a simplified approach

    if ('countyTotal' in report && report.countyTotal) {
      // Equalization report
      if (report.countyTotal.isCompliant) {
        return 90;
      }
      // Calculate based on how far the ratio is from the acceptable range
      const ratio = report.countyTotal.ratio;
      if (ratio >= 0.85 && ratio <= 1.15) {
        return 75; // Close to acceptable range
      }
      return 50; // Far from acceptable range
    }

    if ('lastRevaluationByArea' in report) {
      // Revaluation report
      const areas = Object.values(report.lastRevaluationByArea);
      const compliantAreas = areas.filter((area: any) => area.isCompliant).length;
      return (compliantAreas / areas.length) * 100;
    }

    if ('totalExempt' in report) {
      // Exemption report
      if (report.totalExempt.isCompliant) {
        return 90;
      }
      return report.totalExempt.verificationPercentage;
    }

    if ('timelinessMetrics' in report && 'hearingComplianceMetrics' in report) {
      // Appeal report
      const timelinessScore = report.timelinessMetrics.isCompliant
        ? 50
        : report.timelinessMetrics.percentResolvedWithin45Days / 2;

      const hearingScore = report.hearingComplianceMetrics.isCompliant ? 50 : 25;

      return timelinessScore + hearingScore;
    }

    return 50; // Default middle score for unknown report types
  }

  /**
   * Extract issues for a specific category from the full list of issues
   */
  private extractCategoryIssues(issues: string[], category: string): string[] {
    return issues.filter(issue => issue.toLowerCase().includes(category.toLowerCase()));
  }

  /**
   * Generate recommendations based on report data
   */
  private generateRecommendations(category: string, report: any): string[] {
    // This is a simplified implementation
    // In a real implementation, this would be more sophisticated

    if (!report) {
      return ['No report data available to generate recommendations.'];
    }

    const recommendations: string[] = [];

    switch (category) {
      case 'equalization':
        if (report.countyTotal && !report.countyTotal.isCompliant) {
          const ratio = report.countyTotal.ratio;
          if (ratio < 0.9) {
            recommendations.push(
              'Property values are generally assessed below market value. Consider a county-wide reassessment to bring values in line with current market conditions.'
            );
          } else if (ratio > 1.1) {
            recommendations.push(
              'Property values are generally assessed above market value. Review assessment methodologies and consider adjustments to bring values in line with current market conditions.'
            );
          }
        }
        break;

      case 'revaluation':
        if (!report.isCompliant) {
          recommendations.push(
            `Ensure all assessment areas are revalued within the required ${report.cycleYears}-year cycle.`
          );

          if (report.lastRevaluationByArea) {
            const overdueAreas = Object.values(report.lastRevaluationByArea)
              .filter((area: any) => !area.isCompliant)
              .map((area: any) => area.areaName);

            if (overdueAreas.length > 0) {
              recommendations.push(
                `Prioritize revaluation for the following overdue areas: ${overdueAreas.join(', ')}.`
              );
            }
          }
        }
        break;

      case 'exemption':
        if (report.totalExempt && !report.totalExempt.isCompliant) {
          recommendations.push(
            'Increase the percentage of exemptions verified to meet the required thresholds.'
          );

          if (report.exemptionTypes) {
            const lowVerificationTypes = Object.entries(report.exemptionTypes)
              .filter(([_, data]: [string, any]) => !data.isCompliant)
              .map(
                ([type, data]: [string, any]) =>
                  `${type} (${data.verificationPercentage}% verified, target: ${data.requiredPercentage}%)`
              );

            if (lowVerificationTypes.length > 0) {
              recommendations.push(
                `Focus verification efforts on the following exemption types: ${lowVerificationTypes.join(', ')}.`
              );
            }
          }
        }
        break;

      case 'appeals':
        if (report.timelinessMetrics && !report.timelinessMetrics.isCompliant) {
          recommendations.push(
            `Improve appeal resolution timelines. Current resolution within 45 days: ${report.timelinessMetrics.percentResolvedWithin45Days}%, target: 90%.`
          );
        }

        if (report.hearingComplianceMetrics && !report.hearingComplianceMetrics.isCompliant) {
          const hearingMetrics = report.hearingComplianceMetrics;
          const hearingIssues = [];

          const percentOnTimeNotices =
            hearingMetrics.totalHearings > 0
              ? (hearingMetrics.onTimeNotices / hearingMetrics.totalHearings) * 100
              : 100;

          const percentProperEvidence =
            hearingMetrics.totalHearings > 0
              ? (hearingMetrics.properEvidenceExchange / hearingMetrics.totalHearings) * 100
              : 100;

          const percentProperDocumentation =
            hearingMetrics.totalHearings > 0
              ? (hearingMetrics.properlyDocumented / hearingMetrics.totalHearings) * 100
              : 100;

          if (percentOnTimeNotices < 95) {
            recommendations.push(
              `Improve timeliness of hearing notices. Current: ${percentOnTimeNotices.toFixed(1)}%, target: 95%.`
            );
          }

          if (percentProperEvidence < 95) {
            recommendations.push(
              `Enhance evidence exchange procedures. Current proper exchanges: ${percentProperEvidence.toFixed(1)}%, target: 95%.`
            );
          }

          if (percentProperDocumentation < 95) {
            recommendations.push(
              `Improve hearing documentation practices. Current properly documented: ${percentProperDocumentation.toFixed(1)}%, target: 95%.`
            );
          }
        }
        break;

      default:
        recommendations.push(
          'Review compliance requirements and implement necessary changes to meet all standards.'
        );
        break;
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Current practices meet compliance requirements. Continue monitoring to maintain compliance.'
      );
    }

    return recommendations;
  }

  /**
   * Calculate the next run date based on frequency
   */
  private calculateNextRunDate(
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'
  ): Date {
    const now = new Date();
    const nextRun = new Date(now);

    switch (frequency) {
      case 'daily':
        nextRun.setDate(now.getDate() + 1);
        nextRun.setHours(2, 0, 0, 0); // 2:00 AM next day
        break;

      case 'weekly':
        nextRun.setDate(now.getDate() + (7 - now.getDay())); // Next Sunday
        nextRun.setHours(2, 0, 0, 0); // 2:00 AM
        break;

      case 'monthly':
        nextRun.setMonth(now.getMonth() + 1);
        nextRun.setDate(1); // First day of next month
        nextRun.setHours(2, 0, 0, 0); // 2:00 AM
        break;

      case 'quarterly':
        const nextQuarter = Math.floor(now.getMonth() / 3) * 3 + 3;
        nextRun.setMonth(nextQuarter);
        nextRun.setDate(1); // First day of next quarter
        nextRun.setHours(2, 0, 0, 0); // 2:00 AM
        break;

      case 'annually':
        nextRun.setFullYear(now.getFullYear() + 1);
        nextRun.setMonth(0);
        nextRun.setDate(1); // January 1st of next year
        nextRun.setHours(2, 0, 0, 0); // 2:00 AM
        break;
    }

    return nextRun;
  }

  /**
   * Get regulations for a specific property type
   */
  private async getRegulationsForPropertyType(propertyType: string): Promise<
    Array<{
      regulation: string;
      description: string;
      source: string;
      requirements: string[];
      applicabilityConditions?: string[];
    }>
  > {
    // In a real implementation, this would fetch from a database
    // This is a simplified implementation with predefined regulations

    // Common regulations for all property types
    const commonRegulations = [
      {
        regulation: 'RCW 84.40.020',
        description: 'Assessment date',
        source: 'Washington State Legislature',
        requirements: [
          'All real and personal property subject to taxation shall be listed and assessed every year with reference to its value on January 1.',
        ],
      },
      {
        regulation: 'RCW 84.40.030',
        description: 'Basis of valuation, assessment, appraisal',
        source: 'Washington State Legislature',
        requirements: [
          'All property shall be valued at 100% of its true and fair value in money.',
          'The appraisal shall be consistent with the comprehensive land use plan, development regulations, zoning, and other governmental policies.',
          'The true and fair value shall be determined by one or more of the following methods: comparative sales, cost, or income approaches.',
        ],
      },
    ];

    // Property type specific regulations
    let specificRegulations: Array<{
      regulation: string;
      description: string;
      source: string;
      requirements: string[];
      applicabilityConditions?: string[];
    }> = [];

    switch (propertyType.toLowerCase()) {
      case 'residential':
        specificRegulations = [
          {
            regulation: 'RCW 84.36.381',
            description: 'Residences - Property tax exemptions - Qualifications',
            source: 'Washington State Legislature',
            requirements: [
              'Senior citizens and disabled persons meeting income requirements may qualify for property tax exemptions.',
              'County assessors must verify qualifications and apply exemptions appropriately.',
            ],
            applicabilityConditions: [
              'Property must be primary residence',
              'Owner must be 61 years of age or older, or disabled',
              'Combined household income must be below statutory thresholds',
            ],
          },
        ];
        break;

      case 'commercial':
        specificRegulations = [
          {
            regulation: 'RCW 84.40.090',
            description: 'Commercial listing and valuation',
            source: 'Washington State Legislature',
            requirements: [
              'Commercial property to be valued considering income potential and current use.',
              'Income approach to valuation should be considered for income-producing properties.',
            ],
          },
        ];
        break;

      case 'agricultural':
        specificRegulations = [
          {
            regulation: 'RCW 84.34',
            description: 'Open Space, Agricultural, Timber Lands - Current Use Assessment',
            source: 'Washington State Legislature',
            requirements: [
              'Agricultural land meeting specific requirements can be assessed based on current use rather than highest and best use.',
              'County assessors must verify continued qualification for current use assessment.',
            ],
            applicabilityConditions: [
              'Land must be used for agricultural production',
              'Farm must meet minimum income requirements',
              'Application must be approved by county legislative authority',
            ],
          },
        ];
        break;

      case 'industrial':
        specificRegulations = [
          {
            regulation: 'WAC 458-12-342',
            description: 'Industrial property valuation',
            source: 'Washington Administrative Code',
            requirements: [
              'Industrial property to be valued considering physical depreciation and functional obsolescence.',
              'Machinery and equipment to be listed separately from real property when appropriate.',
            ],
          },
        ];
        break;

      default:
        // No specific regulations for this property type
        break;
    }

    return [...commonRegulations, ...specificRegulations];
  }

  /**
   * Record agent activity in the system
   */
  private async recordAgentActivity(
    activityType: string,
    entityType: string,
    entityId: string,
    details: any
  ): Promise<void> {
    try {
      await this.storage.createSystemActivity({
        activity_type: activityType,
        component: this.componentName,
        status: 'completed',
        details: details,
      });
    } catch (error) {
      logger.error({
        component: this.componentName,
        message: `Failed to record agent activity: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
}
