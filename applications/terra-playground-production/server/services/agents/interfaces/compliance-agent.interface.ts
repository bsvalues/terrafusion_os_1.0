/**
 * Compliance Agent Interface
 *
 * This interface defines the methods that should be implemented by
 * any ComplianceAgent to ensure consistent functionality across
 * different implementations. The agent is responsible for ensuring
 * adherence to Washington State regulations through automated
 * compliance report generation and evaluation.
 */

/**
 * Interface for ComplianceAgent
 */
export interface ComplianceAgent {
  /**
   * Generate a comprehensive compliance report package for a given tax year
   *
   * @param taxYear The tax year to generate reports for
   * @param options Additional options for report generation
   * @returns The generated compliance report package
   */
  generateComplianceReportPackage(
    taxYear: number,
    options?: any
  ): Promise<{
    reportId: string;
    equalizationReport: any;
    revaluationReport: any;
    exemptionReport: any;
    appealReport: any;
    isFullyCompliant: boolean;
    complianceIssues: string[];
  }>;

  /**
   * Check compliance for a specific property
   *
   * @param propertyId The ID of the property to check
   * @param complianceType The type of compliance to check
   * @returns The compliance check results
   */
  checkPropertyCompliance(
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
  }>;

  /**
   * Evaluate the compliance health of the county's assessment data
   *
   * @param options Options for the evaluation
   * @returns Compliance health evaluation results
   */
  evaluateComplianceHealth(options?: any): Promise<{
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
  }>;

  /**
   * Get compliance regulations for a specific property type or assessment activity
   *
   * @param propertyType The property type or assessment activity
   * @returns Applicable compliance regulations
   */
  getComplianceRegulations(propertyType: string): Promise<
    Array<{
      regulation: string;
      description: string;
      source: string;
      requirements: string[];
      applicabilityConditions?: string[];
    }>
  >;

  /**
   * Schedule regular compliance checks and reports
   *
   * @param schedule The schedule configuration
   * @returns Confirmation of scheduled tasks
   */
  scheduleComplianceChecks(schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
    reportTypes: string[];
    recipients?: string[];
  }): Promise<{
    scheduled: boolean;
    nextRunDate: Date;
    scheduledTasks: string[];
  }>;
}
