/**
 * Washington State Compliance Reporter
 *
 * This service generates reports that demonstrate compliance with Washington State property tax laws:
 * - RCW 84.40: Property listing and valuation
 * - RCW 84.48: Equalization of assessments
 * - WAC 458-07: Valuation and revaluation
 *
 * The service provides standardized reports required for state audits, county commissioners,
 * and internal compliance verification. All reports include timestamps, data sources,
 * methodology notes, and statistical validity measures as required by state guidelines.
 */

import { IStorage } from '../../storage';
import { PropertyValidationEngine } from '../data-quality/property-validation-engine';
import { NotificationService, NotificationType } from '../notification-service';
import { MarketAnalysisAgent } from '../agents/interfaces/market-analysis-agent.interface';
import { logger } from '../../utils/logger';
import { formatDate, fiscalYear, addYears, isDateInRange } from '../../utils/date-utils';
import { Property, Appeal, AppealStatus, ValidationRule } from '@shared/schema';

/**
 * Report for property assessment to market value ratios (RCW 84.48)
 */
export interface EqualizationReport {
  id: string;
  reportDate: Date;
  countyName: string; // Always "Benton County"
  taxYear: number;
  propertyTypes: {
    [key: string]: {
      count: number;
      totalAssessedValue: number;
      totalMarketValue: number;
      ratio: number; // Assessed to market value ratio
      validSampleCount: number;
      cov: number; // Coefficient of variation
      isCompliant: boolean; // Within state-required range (0.90-1.10)
    };
  };
  countyTotal: {
    count: number;
    totalAssessedValue: number;
    totalMarketValue: number;
    ratio: number;
    validSampleCount: number;
    isCompliant: boolean;
  };
  methodology: string;
  preparedBy: string;
  notes: string | null;
}

/**
 * Report tracking revaluation cycle compliance (WAC 458-07-015)
 */
export interface RevaluationCycleReport {
  id: string;
  reportDate: Date;
  countyName: string; // Always "Benton County"
  cycleYears: number; // Typically 4 or 6 years based on county type
  currentCycleStartYear: number;
  currentCycleEndYear: number;
  propertiesByYear: {
    [year: number]: {
      count: number;
      percentage: number;
    };
  };
  lastRevaluationByArea: {
    [areaId: string]: {
      areaName: string;
      lastRevaluationDate: Date;
      propertyCount: number;
      nextScheduledRevaluation: Date;
      isCompliant: boolean;
    };
  };
  isCompliant: boolean;
  methodology: string;
  preparedBy: string;
  notes: string | null;
}

/**
 * Report on exemption verification compliance
 */
export interface ExemptionVerificationReport {
  id: string;
  reportDate: Date;
  countyName: string; // Always "Benton County"
  taxYear: number;
  exemptionTypes: {
    [key: string]: {
      count: number;
      totalExemptValue: number;
      verifiedCount: number;
      verificationPercentage: number;
      isCompliant: boolean; // Based on verification requirements
    };
  };
  totalExempt: {
    count: number;
    totalExemptValue: number;
    verifiedCount: number;
    verificationPercentage: number;
    isCompliant: boolean;
  };
  methodology: string;
  preparedBy: string;
  notes: string | null;
}

/**
 * Report on appeals process compliance with state timelines
 */
export interface AppealComplianceReport {
  id: string;
  reportDate: Date;
  countyName: string; // Always "Benton County"
  taxYear: number;
  totalAppeals: number;
  appealsByStatus: {
    [key in AppealStatus]: number;
  };
  timelinessMetrics: {
    averageResolutionDays: number;
    percentResolvedWithin45Days: number;
    percentWithHearingScheduledOnTime: number;
    isCompliant: boolean;
  };
  hearingComplianceMetrics: {
    totalHearings: number;
    onTimeNotices: number;
    properEvidenceExchange: number;
    properlyDocumented: number;
    isCompliant: boolean;
  };
  methodology: string;
  preparedBy: string;
  notes: string | null;
}

/**
 * Class responsible for generating Washington State compliance reports
 */
export class WAComplianceReporter {
  constructor(
    private storage: IStorage,
    private validationEngine: PropertyValidationEngine,
    private notificationService: NotificationService,
    private marketAnalysisAgent: MarketAnalysisAgent
  ) {}

  /**
   * Generate equalization ratio report required by RCW 84.48
   * Shows assessment to market value ratio across property types
   */
  async generateEqualizationReport(
    taxYear: number = new Date().getFullYear(),
    sampleSize: number = 500,
    preparedBy: string = 'System'
  ): Promise<EqualizationReport> {
    try {
      logger.info(`Generating equalization report for tax year ${taxYear}`);

      // Get a representative sample of properties for ratio study
      const properties = await this.getPropertySampleForRatioStudy(taxYear, sampleSize);

      // Track totals for each property type
      const propertyTypeStats: {
        [key: string]: {
          count: number;
          totalAssessedValue: number;
          totalMarketValue: number;
          samples: Array<{ assessedValue: number; marketValue: number; ratio: number }>;
        };
      } = {};

      // Process each property
      for (const property of properties) {
        // Get assessed value from property record
        const assessedValue = property.value ? parseFloat(property.value) : 0;

        // Get estimated market value - in a real system, this would come from sales data
        // or market analysis. Here we'll use the marketAnalysisAgent to estimate it.
        const marketAnalysis = await this.marketAnalysisAgent.analyzeProperty(property.propertyId);
        const marketValue = marketAnalysis.estimatedMarketValue || assessedValue;

        // Calculate ratio (assessed / market)
        const ratio = assessedValue > 0 && marketValue > 0 ? assessedValue / marketValue : 1.0;

        // Initialize property type stats if needed
        if (!propertyTypeStats[property.propertyType]) {
          propertyTypeStats[property.propertyType] = {
            count: 0,
            totalAssessedValue: 0,
            totalMarketValue: 0,
            samples: [],
          };
        }

        // Update property type stats
        propertyTypeStats[property.propertyType].count++;
        propertyTypeStats[property.propertyType].totalAssessedValue += assessedValue;
        propertyTypeStats[property.propertyType].totalMarketValue += marketValue;
        propertyTypeStats[property.propertyType].samples.push({
          assessedValue,
          marketValue,
          ratio,
        });
      }

      // Track county-wide totals
      let totalCount = 0;
      let totalAssessedValue = 0;
      let totalMarketValue = 0;
      let totalValidSamples = 0;

      // Calculate statistics for each property type
      const propertyTypeResults: {
        [key: string]: {
          count: number;
          totalAssessedValue: number;
          totalMarketValue: number;
          ratio: number;
          validSampleCount: number;
          cov: number;
          isCompliant: boolean;
        };
      } = {};

      for (const [propertyType, stats] of Object.entries(propertyTypeStats)) {
        // Only include valid samples (non-zero values)
        const validSamples = stats.samples.filter(
          s => s.assessedValue > 0 && s.marketValue > 0 && s.ratio > 0
        );

        // Calculate mean ratio
        const meanRatio =
          validSamples.length > 0
            ? validSamples.reduce((sum, s) => sum + s.ratio, 0) / validSamples.length
            : 1.0;

        // Calculate coefficient of variation (standard deviation / mean)
        let cov = 0;
        if (validSamples.length > 1) {
          const variance =
            validSamples.reduce((sum, s) => sum + Math.pow(s.ratio - meanRatio, 2), 0) /
            validSamples.length;
          const stdDev = Math.sqrt(variance);
          cov = stdDev / meanRatio;
        }

        // Check compliance (ratio between 0.90 and 1.10, COV < 0.15)
        const isRatioCompliant = meanRatio >= 0.9 && meanRatio <= 1.1;
        const isCovCompliant = cov < 0.15;
        const isCompliant = isRatioCompliant && isCovCompliant;

        // Store results
        propertyTypeResults[propertyType] = {
          count: stats.count,
          totalAssessedValue: stats.totalAssessedValue,
          totalMarketValue: stats.totalMarketValue,
          ratio: parseFloat(meanRatio.toFixed(4)),
          validSampleCount: validSamples.length,
          cov: parseFloat(cov.toFixed(4)),
          isCompliant,
        };

        // Update county totals
        totalCount += stats.count;
        totalAssessedValue += stats.totalAssessedValue;
        totalMarketValue += stats.totalMarketValue;
        totalValidSamples += validSamples.length;
      }

      // Calculate county-wide ratio
      const countyRatio = totalMarketValue > 0 ? totalAssessedValue / totalMarketValue : 1.0;
      const isCountyCompliant = countyRatio >= 0.9 && countyRatio <= 1.1;

      // Create the final report
      const report: EqualizationReport = {
        id: `EQ-${taxYear}-${Date.now()}`,
        reportDate: new Date(),
        countyName: 'Benton County',
        taxYear,
        propertyTypes: propertyTypeResults,
        countyTotal: {
          count: totalCount,
          totalAssessedValue,
          totalMarketValue,
          ratio: parseFloat(countyRatio.toFixed(4)),
          validSampleCount: totalValidSamples,
          isCompliant: isCountyCompliant,
        },
        methodology: 'Random stratified sampling with ratio analysis per WAC 458-53',
        preparedBy,
        notes: null,
      };

      // Store the report in the database
      await this.storage.createEqualizationReport(report);

      // Log and return
      logger.info(`Equalization report generated for tax year ${taxYear}: ID ${report.id}`);

      // If there are compliance issues, send notification
      if (!isCountyCompliant) {
        await this.notificationService.broadcastSystemNotification(
          NotificationType.EQUALIZATION_COMPLIANCE_ISSUE,
          `The county-wide assessment ratio of ${countyRatio.toFixed(2)} is outside the required range (0.90-1.10)`,
          'report',
          report.id,
          'high'
        );
      }

      return report;
    } catch (error) {
      logger.error(
        `Error generating equalization report: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Generate revaluation cycle compliance report
   * Ensures all properties are revalued at least once every 4 years
   * per WAC 458-07-015
   */
  async generateRevaluationCycleReport(
    preparedBy: string = 'System'
  ): Promise<RevaluationCycleReport> {
    try {
      logger.info('Generating revaluation cycle compliance report');

      // Get current date and cycle information
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const cycleYears = 4; // Benton County is on a 4-year cycle
      const cycleStartYear = Math.floor(currentYear / cycleYears) * cycleYears;
      const cycleEndYear = cycleStartYear + cycleYears - 1;

      // Get all properties with their last revaluation date
      const properties = await this.storage.getAllProperties();

      // Track revaluations by year
      const revaluationsByYear: { [year: number]: number } = {};
      for (let year = cycleStartYear; year <= cycleEndYear; year++) {
        revaluationsByYear[year] = 0;
      }

      // Track revaluations by area
      const areaStats: {
        [areaId: string]: {
          areaName: string;
          properties: Property[];
          lastRevaluationDate: Date | null;
          nextScheduledRevaluation: Date | null;
        };
      } = {};

      // Process each property
      for (const property of properties) {
        // Get last revaluation date (from lastUpdated field or extra fields)
        const lastUpdated = property.lastUpdated;
        const lastRevaluationYear = lastUpdated.getFullYear();

        // Count by year if within current cycle
        if (lastRevaluationYear >= cycleStartYear && lastRevaluationYear <= cycleEndYear) {
          revaluationsByYear[lastRevaluationYear] =
            (revaluationsByYear[lastRevaluationYear] || 0) + 1;
        }

        // Get property area (may be stored in extraFields)
        const areaId = this.getPropertyArea(property);
        const areaName = this.getAreaName(areaId);

        // Initialize area stats if needed
        if (!areaStats[areaId]) {
          areaStats[areaId] = {
            areaName,
            properties: [],
            lastRevaluationDate: null,
            nextScheduledRevaluation: null,
          };
        }

        // Add property to area
        areaStats[areaId].properties.push(property);

        // Update last revaluation date for area if needed
        if (
          !areaStats[areaId].lastRevaluationDate ||
          lastUpdated > areaStats[areaId].lastRevaluationDate
        ) {
          areaStats[areaId].lastRevaluationDate = lastUpdated;
        }
      }

      // Calculate statistics
      const totalPropertyCount = properties.length;
      const propertiesByYear: { [year: number]: { count: number; percentage: number } } = {};

      for (const [year, count] of Object.entries(revaluationsByYear)) {
        const numYear = parseInt(year);
        propertiesByYear[numYear] = {
          count,
          percentage: totalPropertyCount > 0 ? (count / totalPropertyCount) * 100 : 0,
        };
      }

      // Create area compliance results
      const lastRevaluationByArea: {
        [areaId: string]: {
          areaName: string;
          lastRevaluationDate: Date;
          propertyCount: number;
          nextScheduledRevaluation: Date;
          isCompliant: boolean;
        };
      } = {};

      let allAreasCompliant = true;

      for (const [areaId, stats] of Object.entries(areaStats)) {
        // Calculate next scheduled revaluation (based on county's cycle plan)
        const lastRevalDate = stats.lastRevaluationDate || new Date(cycleStartYear, 0, 1);
        const revalYear = lastRevalDate.getFullYear();
        const yearsUntilNextRevaluation =
          (Math.floor(revalYear / cycleYears) + 1) * cycleYears - revalYear;

        const nextScheduledRevaluation = new Date(
          revalYear + yearsUntilNextRevaluation,
          lastRevalDate.getMonth(),
          lastRevalDate.getDate()
        );

        // Check if compliant (last revaluation within cycle length)
        const yearsSinceRevaluation =
          (currentDate.getTime() - lastRevalDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        const isCompliant = yearsSinceRevaluation <= cycleYears;

        if (!isCompliant) {
          allAreasCompliant = false;
        }

        // Store area results
        lastRevaluationByArea[areaId] = {
          areaName: stats.areaName,
          lastRevaluationDate: lastRevalDate,
          propertyCount: stats.properties.length,
          nextScheduledRevaluation,
          isCompliant,
        };
      }

      // Create the final report
      const report: RevaluationCycleReport = {
        id: `REVAL-${currentYear}-${Date.now()}`,
        reportDate: currentDate,
        countyName: 'Benton County',
        cycleYears,
        currentCycleStartYear: cycleStartYear,
        currentCycleEndYear: cycleEndYear,
        propertiesByYear,
        lastRevaluationByArea,
        isCompliant: allAreasCompliant,
        methodology: 'Analysis of property revaluation dates by assessment area',
        preparedBy,
        notes: null,
      };

      // Store the report in the database
      await this.storage.createRevaluationCycleReport(report);

      // Log and return
      logger.info(`Revaluation cycle report generated: ID ${report.id}`);

      // If there are compliance issues, send notification
      if (!allAreasCompliant) {
        const nonCompliantAreas = Object.values(lastRevaluationByArea)
          .filter(area => !area.isCompliant)
          .map(area => area.areaName)
          .join(', ');

        await this.notificationService.broadcastSystemNotification(
          NotificationType.REVALUATION_COMPLIANCE_ISSUE,
          `The following areas are outside the required ${cycleYears}-year revaluation cycle: ${nonCompliantAreas}`,
          'report',
          report.id,
          'high'
        );
      }

      return report;
    } catch (error) {
      logger.error(
        `Error generating revaluation cycle report: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Generate exemption verification report
   * Ensures all exemptions (senior, disabled, nonprofit, etc.)
   * are properly documented and verified
   */
  async generateExemptionVerificationReport(
    taxYear: number = new Date().getFullYear(),
    preparedBy: string = 'System'
  ): Promise<ExemptionVerificationReport> {
    try {
      logger.info(`Generating exemption verification report for tax year ${taxYear}`);

      // Get all exemptions
      const exemptions = await this.storage.getAllExemptions(taxYear);

      // Track exemptions by type
      const exemptionTypeStats: {
        [key: string]: {
          count: number;
          totalExemptValue: number;
          verifiedCount: number;
        };
      } = {};

      // Process each exemption
      for (const exemption of exemptions) {
        const exemptionType = exemption.exemptionType;
        const exemptValue = exemption.exemptValue || 0;
        const isVerified = exemption.verificationDate !== null;

        // Initialize exemption type stats if needed
        if (!exemptionTypeStats[exemptionType]) {
          exemptionTypeStats[exemptionType] = {
            count: 0,
            totalExemptValue: 0,
            verifiedCount: 0,
          };
        }

        // Update exemption type stats
        exemptionTypeStats[exemptionType].count++;
        exemptionTypeStats[exemptionType].totalExemptValue += exemptValue;

        if (isVerified) {
          exemptionTypeStats[exemptionType].verifiedCount++;
        }
      }

      // Calculate total stats
      let totalCount = 0;
      let totalExemptValue = 0;
      let totalVerifiedCount = 0;

      // Calculate statistics for each exemption type
      const exemptionTypeResults: {
        [key: string]: {
          count: number;
          totalExemptValue: number;
          verifiedCount: number;
          verificationPercentage: number;
          isCompliant: boolean;
        };
      } = {};

      // Define required verification percentages by exemption type
      const requiredVerificationPercentages: { [key: string]: number } = {
        SENIOR: 95, // Senior citizens require 95% verification
        DISABLED: 95, // Disabled persons require 95% verification
        NONPROFIT: 100, // Nonprofits require 100% verification
        RELIGIOUS: 100, // Religious organizations require 100% verification
        GOVERNMENT: 100, // Government properties require 100% verification
        AGRICULTURE: 90, // Agricultural exemptions require 90% verification
        OPEN_SPACE: 90, // Open space exemptions require 90% verification
        DEFAULT: 90, // Default for any other type is 90%
      };

      for (const [exemptionType, stats] of Object.entries(exemptionTypeStats)) {
        // Calculate verification percentage
        const verificationPercentage =
          stats.count > 0 ? (stats.verifiedCount / stats.count) * 100 : 100;

        // Determine required verification percentage
        const requiredPercentage =
          requiredVerificationPercentages[exemptionType] || requiredVerificationPercentages.DEFAULT;

        // Check compliance
        const isCompliant = verificationPercentage >= requiredPercentage;

        // Store results
        exemptionTypeResults[exemptionType] = {
          count: stats.count,
          totalExemptValue: stats.totalExemptValue,
          verifiedCount: stats.verifiedCount,
          verificationPercentage: parseFloat(verificationPercentage.toFixed(1)),
          isCompliant,
        };

        // Update totals
        totalCount += stats.count;
        totalExemptValue += stats.totalExemptValue;
        totalVerifiedCount += stats.verifiedCount;
      }

      // Calculate overall verification percentage
      const totalVerificationPercentage =
        totalCount > 0 ? (totalVerifiedCount / totalCount) * 100 : 100;

      // Check overall compliance (all types compliant and overall at least 95%)
      const allTypesCompliant = Object.values(exemptionTypeResults).every(
        result => result.isCompliant
      );
      const isOverallCompliant = totalVerificationPercentage >= 95 && allTypesCompliant;

      // Create the final report
      const report: ExemptionVerificationReport = {
        id: `EXEMPT-${taxYear}-${Date.now()}`,
        reportDate: new Date(),
        countyName: 'Benton County',
        taxYear,
        exemptionTypes: exemptionTypeResults,
        totalExempt: {
          count: totalCount,
          totalExemptValue,
          verifiedCount: totalVerifiedCount,
          verificationPercentage: parseFloat(totalVerificationPercentage.toFixed(1)),
          isCompliant: isOverallCompliant,
        },
        methodology: 'Analysis of exemption records and verification timestamps',
        preparedBy,
        notes: null,
      };

      // Store the report in the database
      await this.storage.createExemptionVerificationReport(report);

      // Log and return
      logger.info(
        `Exemption verification report generated for tax year ${taxYear}: ID ${report.id}`
      );

      // If there are compliance issues, send notification
      if (!isOverallCompliant) {
        const nonCompliantTypes = Object.entries(exemptionTypeResults)
          .filter(([_, result]) => !result.isCompliant)
          .map(([type, result]) => `${type} (${result.verificationPercentage}%)`)
          .join(', ');

        await this.notificationService.broadcastSystemNotification(
          NotificationType.EXEMPTION_COMPLIANCE_ISSUE,
          `The following exemption types are below required verification thresholds: ${nonCompliantTypes}`,
          'report',
          report.id,
          'high'
        );
      }

      return report;
    } catch (error) {
      logger.error(
        `Error generating exemption verification report: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Generate appeals compliance report
   * Ensures appeals process follows state timelines and requirements
   */
  async generateAppealComplianceReport(
    taxYear: number = new Date().getFullYear(),
    preparedBy: string = 'System'
  ): Promise<AppealComplianceReport> {
    try {
      logger.info(`Generating appeal compliance report for tax year ${taxYear}`);

      // Get all appeals for the tax year
      const appeals = await this.storage.getAppealsByTaxYear(taxYear);

      // Count appeals by status
      const appealsByStatus: { [key in AppealStatus]: number } = {
        submitted: 0,
        under_review: 0,
        scheduled: 0,
        heard: 0,
        decided: 0,
        withdrawn: 0,
      };

      // Track appeal timeline metrics
      let totalResolutionDays = 0;
      let resolvedAppeals = 0;
      let resolvedWithin45Days = 0;
      let appealsWithHearings = 0;
      let hearingsScheduledOnTime = 0;

      // Track hearing compliance metrics
      let totalHearings = 0;
      let onTimeNotices = 0;
      let properEvidenceExchange = 0;
      let properlyDocumented = 0;

      // Process each appeal
      for (const appeal of appeals) {
        // Update status count
        appealsByStatus[appeal.status]++;

        // Calculate resolution time for decided or withdrawn appeals
        if (appeal.status === 'decided' || appeal.status === 'withdrawn') {
          const receiveDate = appeal.dateReceived;
          const endDate = appeal.decisionDate || appeal.lastUpdated;

          const resolutionDays = Math.ceil(
            (endDate.getTime() - receiveDate.getTime()) / (24 * 60 * 60 * 1000)
          );

          totalResolutionDays += resolutionDays;
          resolvedAppeals++;

          if (resolutionDays <= 45) {
            resolvedWithin45Days++;
          }
        }

        // Check hearing scheduling timeliness
        if (
          appeal.status === 'scheduled' ||
          appeal.status === 'heard' ||
          appeal.status === 'decided'
        ) {
          appealsWithHearings++;

          if (appeal.hearingDate) {
            const noticeDate = appeal.lastUpdated; // Assuming lastUpdated is when status changed to scheduled
            const hearingDate = appeal.hearingDate;

            // Check if at least 15 days notice was given
            const noticeDays = Math.ceil(
              (hearingDate.getTime() - noticeDate.getTime()) / (24 * 60 * 60 * 1000)
            );

            if (noticeDays >= 15) {
              hearingsScheduledOnTime++;
            }
          }
        }

        // Check hearing compliance for heard or decided appeals
        if (appeal.status === 'heard' || appeal.status === 'decided') {
          totalHearings++;

          // Check if notice was on time (at least 15 days)
          if (appeal.hearingDate) {
            const noticeDate = appeal.noticeDate || appeal.lastUpdated;
            const hearingDate = appeal.hearingDate;

            const noticeDays = Math.ceil(
              (hearingDate.getTime() - noticeDate.getTime()) / (24 * 60 * 60 * 1000)
            );

            if (noticeDays >= 15) {
              onTimeNotices++;
            }
          }

          // Check if evidence was properly exchanged
          // This would typically be tracked in a separate field or related table
          // Here we're using a placeholder logic based on evidence records
          const evidenceRecords = await this.storage.getAppealEvidenceByAppealId(appeal.id);
          const hasProperEvidence = evidenceRecords.length > 0;

          if (hasProperEvidence) {
            properEvidenceExchange++;
          }

          // Check if hearing was properly documented
          // This would typically be tracked in a notes or documentation field
          // Here we're using a placeholder logic based on comment records
          const commentRecords = await this.storage.getAppealCommentsByAppealId(appeal.id);
          const hasProperDocumentation = commentRecords.some(
            c => c.comment.includes('hearing') || c.comment.includes('minutes')
          );

          if (hasProperDocumentation) {
            properlyDocumented++;
          }
        }
      }

      // Calculate statistics
      const totalAppeals = appeals.length;
      const averageResolutionDays = resolvedAppeals > 0 ? totalResolutionDays / resolvedAppeals : 0;
      const percentResolvedWithin45Days =
        resolvedAppeals > 0 ? (resolvedWithin45Days / resolvedAppeals) * 100 : 100;
      const percentWithHearingScheduledOnTime =
        appealsWithHearings > 0 ? (hearingsScheduledOnTime / appealsWithHearings) * 100 : 100;

      // Check timeline compliance (90% within requirements)
      const isTimelineCompliant =
        percentResolvedWithin45Days >= 90 && percentWithHearingScheduledOnTime >= 90;

      // Calculate hearing compliance metrics
      const percentOnTimeNotices = totalHearings > 0 ? (onTimeNotices / totalHearings) * 100 : 100;
      const percentProperEvidence =
        totalHearings > 0 ? (properEvidenceExchange / totalHearings) * 100 : 100;
      const percentProperDocumentation =
        totalHearings > 0 ? (properlyDocumented / totalHearings) * 100 : 100;

      // Check hearing compliance (all metrics above 95%)
      const isHearingCompliant =
        percentOnTimeNotices >= 95 &&
        percentProperEvidence >= 95 &&
        percentProperDocumentation >= 95;

      // Create the final report
      const report: AppealComplianceReport = {
        id: `APPEAL-${taxYear}-${Date.now()}`,
        reportDate: new Date(),
        countyName: 'Benton County',
        taxYear,
        totalAppeals,
        appealsByStatus,
        timelinessMetrics: {
          averageResolutionDays: parseFloat(averageResolutionDays.toFixed(1)),
          percentResolvedWithin45Days: parseFloat(percentResolvedWithin45Days.toFixed(1)),
          percentWithHearingScheduledOnTime: parseFloat(
            percentWithHearingScheduledOnTime.toFixed(1)
          ),
          isCompliant: isTimelineCompliant,
        },
        hearingComplianceMetrics: {
          totalHearings,
          onTimeNotices,
          properEvidenceExchange,
          properlyDocumented,
          isCompliant: isHearingCompliant,
        },
        methodology: 'Analysis of appeal records, hearing documentation, and statutory timelines',
        preparedBy,
        notes: null,
      };

      // Store the report in the database
      await this.storage.createAppealComplianceReport(report);

      // Log and return
      logger.info(`Appeal compliance report generated for tax year ${taxYear}: ID ${report.id}`);

      // If there are compliance issues, send notification
      if (!isTimelineCompliant || !isHearingCompliant) {
        const issues = [];

        if (!isTimelineCompliant) {
          issues.push(
            `Appeal resolution timelines (${percentResolvedWithin45Days.toFixed(1)}% within 45 days, required: 90%)`
          );
        }

        if (!isHearingCompliant) {
          if (percentOnTimeNotices < 95) {
            issues.push(
              `Hearing notices (${percentOnTimeNotices.toFixed(1)}% on time, required: 95%)`
            );
          }
          if (percentProperEvidence < 95) {
            issues.push(
              `Evidence exchange (${percentProperEvidence.toFixed(1)}% proper, required: 95%)`
            );
          }
          if (percentProperDocumentation < 95) {
            issues.push(
              `Hearing documentation (${percentProperDocumentation.toFixed(1)}% proper, required: 95%)`
            );
          }
        }

        await this.notificationService.broadcastSystemNotification(
          NotificationType.APPEAL_COMPLIANCE_ISSUE,
          `The following appeal process metrics are below required thresholds: ${issues.join(', ')}`,
          'report',
          report.id,
          'high'
        );
      }

      return report;
    } catch (error) {
      logger.error(
        `Error generating appeal compliance report: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Generate comprehensive annual compliance report package
   * that includes all required state compliance reports
   */
  async generateAnnualCompliancePackage(
    taxYear: number = new Date().getFullYear(),
    preparedBy: string = 'System'
  ): Promise<{
    equalizationReport: EqualizationReport;
    revaluationReport: RevaluationCycleReport;
    exemptionReport: ExemptionVerificationReport;
    appealReport: AppealComplianceReport;
    isFullyCompliant: boolean;
    complianceIssues: string[];
  }> {
    try {
      logger.info(`Generating annual compliance package for tax year ${taxYear}`);

      // Generate all required reports
      const equalizationReport = await this.generateEqualizationReport(taxYear, 500, preparedBy);
      const revaluationReport = await this.generateRevaluationCycleReport(preparedBy);
      const exemptionReport = await this.generateExemptionVerificationReport(taxYear, preparedBy);
      const appealReport = await this.generateAppealComplianceReport(taxYear, preparedBy);

      // Check overall compliance
      const isFullyCompliant =
        equalizationReport.countyTotal.isCompliant &&
        revaluationReport.isCompliant &&
        exemptionReport.totalExempt.isCompliant &&
        appealReport.timelinessMetrics.isCompliant &&
        appealReport.hearingComplianceMetrics.isCompliant;

      // Collect compliance issues
      const complianceIssues: string[] = [];

      if (!equalizationReport.countyTotal.isCompliant) {
        complianceIssues.push(
          `Equalization ratio (${equalizationReport.countyTotal.ratio}) outside required range (0.90-1.10)`
        );
      }

      if (!revaluationReport.isCompliant) {
        const nonCompliantAreas = Object.values(revaluationReport.lastRevaluationByArea)
          .filter(area => !area.isCompliant)
          .map(area => area.areaName)
          .join(', ');

        complianceIssues.push(
          `Revaluation cycle: areas outside ${revaluationReport.cycleYears}-year cycle (${nonCompliantAreas})`
        );
      }

      if (!exemptionReport.totalExempt.isCompliant) {
        const nonCompliantTypes = Object.entries(exemptionReport.exemptionTypes)
          .filter(([_, result]) => !result.isCompliant)
          .map(([type, result]) => `${type} (${result.verificationPercentage}%)`)
          .join(', ');

        complianceIssues.push(`Exemption verification below thresholds: ${nonCompliantTypes}`);
      }

      if (!appealReport.timelinessMetrics.isCompliant) {
        complianceIssues.push(
          `Appeal timeline issues: ${appealReport.timelinessMetrics.percentResolvedWithin45Days}% resolved within 45 days (required: 90%)`
        );
      }

      if (!appealReport.hearingComplianceMetrics.isCompliant) {
        const hearingIssues = [];
        const hearingMetrics = appealReport.hearingComplianceMetrics;
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
          hearingIssues.push(`notices (${percentOnTimeNotices.toFixed(1)}%)`);
        }
        if (percentProperEvidence < 95) {
          hearingIssues.push(`evidence (${percentProperEvidence.toFixed(1)}%)`);
        }
        if (percentProperDocumentation < 95) {
          hearingIssues.push(`documentation (${percentProperDocumentation.toFixed(1)}%)`);
        }

        complianceIssues.push(`Hearing compliance issues: ${hearingIssues.join(', ')}`);
      }

      // Log results
      logger.info(`Annual compliance package generated for tax year ${taxYear}`);
      logger.info(`Overall compliance status: ${isFullyCompliant ? 'Compliant' : 'Non-compliant'}`);

      if (complianceIssues.length > 0) {
        logger.warn(`Compliance issues found: ${complianceIssues.join('; ')}`);

        // Send notification for compliance issues
        await this.notificationService.broadcastSystemNotification(
          NotificationType.ANNUAL_COMPLIANCE_ISSUES,
          `The ${taxYear} annual compliance package contains the following issues: ${complianceIssues.join('; ')}`,
          'report',
          `ANNUAL-${taxYear}`,
          'high'
        );
      }

      return {
        equalizationReport,
        revaluationReport,
        exemptionReport,
        appealReport,
        isFullyCompliant,
        complianceIssues,
      };
    } catch (error) {
      logger.error(
        `Error generating annual compliance package: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  // Helper methods

  /**
   * Get a sample of properties for ratio study
   */
  private async getPropertySampleForRatioStudy(
    taxYear: number,
    sampleSize: number
  ): Promise<Property[]> {
    try {
      // Get all properties
      const allProperties = await this.storage.getAllProperties();

      // Filter properties as needed (e.g., by status)
      const eligibleProperties = allProperties.filter(
        p => p.status === 'active' || p.status === 'assessed'
      );

      // If we don't have enough properties, return all eligible ones
      if (eligibleProperties.length <= sampleSize) {
        return eligibleProperties;
      }

      // Get distinct property types
      const propertyTypes = new Set<string>();
      eligibleProperties.forEach(p => propertyTypes.add(p.propertyType));

      // Calculate samples per property type (stratified sampling)
      const samplesPerType = Math.floor(sampleSize / propertyTypes.size);
      let remainingSamples = sampleSize - samplesPerType * propertyTypes.size;

      // Select properties by type
      const selectedProperties: Property[] = [];

      for (const propertyType of propertyTypes) {
        const propertiesOfType = eligibleProperties.filter(p => p.propertyType === propertyType);

        // Calculate how many to select of this type
        let samplesToSelect = samplesPerType;
        if (remainingSamples > 0) {
          samplesToSelect++;
          remainingSamples--;
        }

        // If we don't have enough of this type, take all of them
        if (propertiesOfType.length <= samplesToSelect) {
          selectedProperties.push(...propertiesOfType);
          continue;
        }

        // Randomly select properties of this type
        const selectedIndices = new Set<number>();
        while (selectedIndices.size < samplesToSelect) {
          const randomIndex = Math.floor(Math.random() * propertiesOfType.length);
          selectedIndices.add(randomIndex);
        }

        // Add selected properties
        for (const index of selectedIndices) {
          selectedProperties.push(propertiesOfType[index]);
        }
      }

      return selectedProperties;
    } catch (error) {
      logger.error(
        `Error getting property sample: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Get property area from property data
   */
  private getPropertyArea(property: Property): string {
    // The area might be stored in different ways depending on the county's system
    // It could be in extraFields, or derived from the parcel number, etc.

    // This is a placeholder implementation
    const extraFields = property.extraFields as any;

    if (extraFields && extraFields.assessmentArea) {
      return extraFields.assessmentArea;
    }

    if (property.parcelNumber) {
      // Extract area from parcel number (e.g., first 2 digits)
      const areaFromParcel = property.parcelNumber.substring(0, 2);
      return areaFromParcel;
    }

    // Default to a "UNKNOWN" area if we can't determine it
    return 'UNKNOWN';
  }

  /**
   * Get human-readable area name from area ID
   */
  private getAreaName(areaId: string): string {
    // This would typically come from a lookup table or mapping
    // Here we're just using a simple mapping for demonstration
    const areaNames: { [key: string]: string } = {
      '01': 'North Richland',
      '02': 'South Richland',
      '03': 'West Richland',
      '04': 'Kennewick North',
      '05': 'Kennewick South',
      '06': 'Prosser',
      '07': 'Benton City',
      '08': 'Rural North',
      '09': 'Rural South',
      '10': 'Industrial Area',
      UNKNOWN: 'Unknown Area',
    };

    return areaNames[areaId] || `Area ${areaId}`;
  }
}
