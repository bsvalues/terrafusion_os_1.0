/**
 * Compliance Reporter
 *
 * Generates comprehensive compliance reports that can be used for:
 * - Internal audits
 * - External assessments
 * - Board/management reviews
 * - Continuous monitoring
 */

import { EventEmitter } from 'events';
import { Logger } from './logger';
import { Control, ControlStatus, SOC2ComplianceManager } from './soc2';
import { Evidence, EvidenceCollector, EvidenceStatus } from './evidence-collector';
import { Policy, PolicyManager, PolicyStatus } from './policy-manager';

// Report types
export enum ReportType {
  EXECUTIVE_SUMMARY = 'executive_summary',
  DETAILED_ASSESSMENT = 'detailed_assessment',
  GAP_ANALYSIS = 'gap_analysis',
  EVIDENCE_SUMMARY = 'evidence_summary',
  POLICY_COMPLIANCE = 'policy_compliance',
  CUSTOM = 'custom',
}

// Report status
export enum ReportStatus {
  DRAFT = 'draft',
  FINAL = 'final',
  ARCHIVED = 'archived',
}

// Report interface
export interface ComplianceReport {
  id: string;
  name: string;
  type: ReportType;
  status: ReportStatus;
  generatedAt: Date;
  generatedBy: string;
  periodStart: Date;
  periodEnd: Date;
  summary: string;
  content: any; // This will depend on the report type
  metadata?: Record<string, any>;
}

// Report configuration
export interface ReportConfig {
  type: ReportType;
  name: string;
  periodStart: Date;
  periodEnd: Date;
  includeEvidence?: boolean;
  includePolicies?: boolean;
  customSections?: string[];
  filters?: Record<string, any>;
  format?: 'json' | 'html' | 'pdf';
}

/**
 * Compliance Reporter
 */
export class ComplianceReporter extends EventEmitter {
  private reports: Map<string, ComplianceReport> = new Map();
  private logger: Logger;
  private soc2Manager?: SOC2ComplianceManager;
  private evidenceCollector?: EvidenceCollector;
  private policyManager?: PolicyManager;

  constructor(
    logger: Logger,
    soc2Manager?: SOC2ComplianceManager,
    evidenceCollector?: EvidenceCollector,
    policyManager?: PolicyManager
  ) {
    super();
    this.logger = logger;
    this.soc2Manager = soc2Manager;
    this.evidenceCollector = evidenceCollector;
    this.policyManager = policyManager;
  }

  /**
   * Generate a compliance report
   */
  public generateReport(config: ReportConfig, generatedBy: string): ComplianceReport {
    this.logger.info('Generating compliance report', {
      type: config.type,
      name: config.name,
    });

    // Determine which generator to use based on the report type
    let content: any;

    switch (config.type) {
      case ReportType.EXECUTIVE_SUMMARY:
        content = this.generateExecutiveSummary(config);
        break;
      case ReportType.DETAILED_ASSESSMENT:
        content = this.generateDetailedAssessment(config);
        break;
      case ReportType.GAP_ANALYSIS:
        content = this.generateGapAnalysis(config);
        break;
      case ReportType.EVIDENCE_SUMMARY:
        content = this.generateEvidenceSummary(config);
        break;
      case ReportType.POLICY_COMPLIANCE:
        content = this.generatePolicyCompliance(config);
        break;
      case ReportType.CUSTOM:
        content = this.generateCustomReport(config);
        break;
      default:
        throw new Error(`Unsupported report type: ${config.type}`);
    }

    // Create the report
    const id = `report-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const report: ComplianceReport = {
      id,
      name: config.name,
      type: config.type,
      status: ReportStatus.DRAFT,
      generatedAt: new Date(),
      generatedBy,
      periodStart: config.periodStart,
      periodEnd: config.periodEnd,
      summary: this.generateSummary(content, config),
      content,
      metadata: {
        format: config.format || 'json',
        filters: config.filters,
      },
    };

    // Store the report
    this.reports.set(id, report);

    this.logger.info('Compliance report generated', {
      reportId: id,
      type: config.type,
    });

    this.emit('report:generated', report);

    return report;
  }

  /**
   * Generate executive summary report
   */
  private generateExecutiveSummary(config: ReportConfig): any {
    if (!this.soc2Manager) {
      throw new Error('SOC2 Compliance Manager is required for executive summary reports');
    }

    const { compliant, nonCompliant } = this.soc2Manager.runGapAssessment();
    const controlCount = compliant.length + nonCompliant.length;
    const complianceRate = controlCount > 0 ? (compliant.length / controlCount) * 100 : 0;

    // Get relevant evidence
    let evidenceSummary;
    if (config.includeEvidence && this.evidenceCollector) {
      const evidence = this.evidenceCollector.getAllEvidence();
      evidenceSummary = {
        totalEvidence: evidence.length,
        approvedEvidence: evidence.filter(e => e.status === EvidenceStatus.APPROVED).length,
        pendingEvidence: evidence.filter(
          e => e.status === EvidenceStatus.PENDING || e.status === EvidenceStatus.COLLECTED
        ).length,
        rejectedEvidence: evidence.filter(e => e.status === EvidenceStatus.REJECTED).length,
        expiredEvidence: evidence.filter(e => e.status === EvidenceStatus.EXPIRED).length,
      };
    }

    // Get policy information
    let policySummary;
    if (config.includePolicies && this.policyManager) {
      const policies = this.policyManager.getAllPolicies();
      policySummary = {
        totalPolicies: policies.length,
        publishedPolicies: policies.filter(p => p.status === PolicyStatus.PUBLISHED).length,
        draftPolicies: policies.filter(
          p => p.status === PolicyStatus.DRAFT || p.status === PolicyStatus.REVIEW
        ).length,
        policiesNeedingReview: this.policyManager.getPoliciesNeedingReview().length,
      };
    }

    return {
      overallCompliance: {
        compliancePercentage: complianceRate.toFixed(1),
        compliantControls: compliant.length,
        nonCompliantControls: nonCompliant.length,
        totalControls: controlCount,
      },
      criticalFindings: this.identifyCriticalFindings(nonCompliant),
      complianceTrend: this.calculateComplianceTrend(),
      evidence: evidenceSummary,
      policies: policySummary,
      keyRecommendations: this.generateRecommendations(nonCompliant),
    };
  }

  /**
   * Generate detailed assessment report
   */
  private generateDetailedAssessment(config: ReportConfig): any {
    if (!this.soc2Manager) {
      throw new Error('SOC2 Compliance Manager is required for detailed assessment reports');
    }

    const controls = this.soc2Manager.getAllControls();
    const policies = this.policyManager?.getAllPolicies() || [];

    const controlDetails = controls.map(control => {
      const controlEvidence = this.evidenceCollector?.getEvidenceForControl(control.id) || [];
      const relatedPolicies = policies.filter(policy =>
        policy.relatedControls?.includes(control.id)
      );

      return {
        ...control,
        evidence: controlEvidence.map(e => ({
          id: e.id,
          name: e.name,
          status: e.status,
          collectDate: e.collectDate,
        })),
        policies: relatedPolicies.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          version: p.version,
        })),
      };
    });

    return {
      assessmentSummary: {
        totalControls: controls.length,
        implementedControls: controls.filter(
          c => c.status === ControlStatus.IMPLEMENTED || c.status === ControlStatus.VERIFIED
        ).length,
        partiallyImplementedControls: controls.filter(
          c => c.status === ControlStatus.PARTIALLY_IMPLEMENTED
        ).length,
        notImplementedControls: controls.filter(c => c.status === ControlStatus.NOT_IMPLEMENTED)
          .length,
        failedControls: controls.filter(c => c.status === ControlStatus.FAILED).length,
      },
      controlDetails,
      assessmentPeriod: {
        startDate: config.periodStart,
        endDate: config.periodEnd,
      },
    };
  }

  /**
   * Generate gap analysis report
   */
  private generateGapAnalysis(config: ReportConfig): any {
    if (!this.soc2Manager) {
      throw new Error('SOC2 Compliance Manager is required for gap analysis reports');
    }

    const { compliant, nonCompliant } = this.soc2Manager.runGapAssessment();

    return {
      compliantControls: compliant.map(control => ({
        id: control.id,
        name: control.name,
        criteria: control.criteria,
        status: control.status,
        lastVerified: control.lastVerified,
      })),
      nonCompliantControls: nonCompliant.map(control => ({
        id: control.id,
        name: control.name,
        criteria: control.criteria,
        status: control.status,
        remediation: this.generateRemediationPlan(control),
      })),
      gapSummary: {
        totalGaps: nonCompliant.length,
        criticalGaps: nonCompliant.filter(c => this.isControlCritical(c)).length,
        highPriorityGaps: nonCompliant.filter(c => this.getControlPriority(c) === 'high').length,
        mediumPriorityGaps: nonCompliant.filter(c => this.getControlPriority(c) === 'medium')
          .length,
        lowPriorityGaps: nonCompliant.filter(c => this.getControlPriority(c) === 'low').length,
      },
      recommendations: this.generateGapRecommendations(nonCompliant),
    };
  }

  /**
   * Generate evidence summary report
   */
  private generateEvidenceSummary(config: ReportConfig): any {
    if (!this.evidenceCollector) {
      throw new Error('Evidence Collector is required for evidence summary reports');
    }

    const evidence = this.evidenceCollector.getAllEvidence();

    // Filter evidence by date range
    const filteredEvidence = evidence.filter(
      e => e.collectDate >= config.periodStart && e.collectDate <= config.periodEnd
    );

    return {
      evidenceSummary: {
        totalEvidence: filteredEvidence.length,
        byStatus: {
          collected: filteredEvidence.filter(e => e.status === EvidenceStatus.COLLECTED).length,
          approved: filteredEvidence.filter(e => e.status === EvidenceStatus.APPROVED).length,
          pending: filteredEvidence.filter(e => e.status === EvidenceStatus.PENDING).length,
          rejected: filteredEvidence.filter(e => e.status === EvidenceStatus.REJECTED).length,
          expired: filteredEvidence.filter(e => e.status === EvidenceStatus.EXPIRED).length,
        },
        byType: this.groupEvidenceByType(filteredEvidence),
      },
      evidenceDetails: filteredEvidence.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        status: e.status,
        collectDate: e.collectDate,
        controlIds: e.controlIds,
        collector: e.collector,
        approver: e.approver,
      })),
      evidenceGaps: this.identifyEvidenceGaps(),
    };
  }

  /**
   * Generate policy compliance report
   */
  private generatePolicyCompliance(config: ReportConfig): any {
    if (!this.policyManager) {
      throw new Error('Policy Manager is required for policy compliance reports');
    }

    const policies = this.policyManager.getAllPolicies();

    // Filter policies by relevant criteria
    const activePolicies = policies.filter(
      p => p.status === PolicyStatus.PUBLISHED || p.status === PolicyStatus.APPROVED
    );

    const policyDetails = activePolicies.map(policy => {
      const acknowledgements = this.policyManager?.getPolicyAcknowledgements(policy.id) || [];

      // Filter acknowledgements by date range
      const periodAcknowledgements = acknowledgements.filter(
        ack => ack.acknowledgedAt >= config.periodStart && ack.acknowledgedAt <= config.periodEnd
      );

      return {
        id: policy.id,
        name: policy.name,
        type: policy.type,
        version: policy.version,
        effectiveDate: policy.effectiveDate,
        reviewDate: policy.reviewDate,
        acknowledgements: {
          total: periodAcknowledgements.length,
          details: config.filters?.includeAcknowledgementDetails
            ? periodAcknowledgements
            : undefined,
        },
      };
    });

    return {
      policySummary: {
        totalPolicies: activePolicies.length,
        byType: this.groupPoliciesByType(activePolicies),
        policiesNeedingReview: this.policyManager.getPoliciesNeedingReview().length,
      },
      policyDetails,
      policyAdherence: this.calculatePolicyAdherence(activePolicies),
    };
  }

  /**
   * Generate custom report
   */
  private generateCustomReport(config: ReportConfig): any {
    const sections: Record<string, any> = {};

    // Add requested sections
    if (config.customSections?.includes('compliance_summary') && this.soc2Manager) {
      const { compliant, nonCompliant } = this.soc2Manager.runGapAssessment();
      sections.complianceSummary = {
        totalControls: compliant.length + nonCompliant.length,
        compliantControls: compliant.length,
        complianceRate:
          ((compliant.length / (compliant.length + nonCompliant.length)) * 100).toFixed(1) + '%',
      };
    }

    if (config.customSections?.includes('critical_findings') && this.soc2Manager) {
      const { nonCompliant } = this.soc2Manager.runGapAssessment();
      sections.criticalFindings = this.identifyCriticalFindings(nonCompliant);
    }

    if (config.customSections?.includes('evidence_status') && this.evidenceCollector) {
      const evidence = this.evidenceCollector.getAllEvidence();
      sections.evidenceStatus = {
        totalEvidence: evidence.length,
        approved: evidence.filter(e => e.status === EvidenceStatus.APPROVED).length,
        pending: evidence.filter(
          e => e.status === EvidenceStatus.PENDING || e.status === EvidenceStatus.COLLECTED
        ).length,
        rejected: evidence.filter(e => e.status === EvidenceStatus.REJECTED).length,
      };
    }

    if (config.customSections?.includes('policy_status') && this.policyManager) {
      const policies = this.policyManager.getAllPolicies();
      sections.policyStatus = {
        totalPolicies: policies.length,
        published: policies.filter(p => p.status === PolicyStatus.PUBLISHED).length,
        draft: policies.filter(p => p.status === PolicyStatus.DRAFT).length,
        review: policies.filter(p => p.status === PolicyStatus.REVIEW).length,
        needingReview: this.policyManager.getPoliciesNeedingReview().length,
      };
    }

    return sections;
  }

  /**
   * Generate a summary for the report
   */
  private generateSummary(content: any, config: ReportConfig): string {
    // This would generate a textual summary of the report
    // For simplicity, we'll just return a basic summary

    switch (config.type) {
      case ReportType.EXECUTIVE_SUMMARY:
        return `Executive summary for compliance status from ${config.periodStart.toDateString()} to ${config.periodEnd.toDateString()}. Overall compliance rate: ${content.overallCompliance.compliancePercentage}%.`;

      case ReportType.DETAILED_ASSESSMENT:
        return `Detailed compliance assessment from ${config.periodStart.toDateString()} to ${config.periodEnd.toDateString()}. Covers ${content.assessmentSummary.totalControls} controls.`;

      case ReportType.GAP_ANALYSIS:
        return `Gap analysis identifying ${content.nonCompliantControls.length} non-compliant controls that require remediation.`;

      case ReportType.EVIDENCE_SUMMARY:
        return `Evidence summary for the period ${config.periodStart.toDateString()} to ${config.periodEnd.toDateString()}. ${content.evidenceSummary.totalEvidence} evidence items collected.`;

      case ReportType.POLICY_COMPLIANCE:
        return `Policy compliance report covering ${content.policySummary.totalPolicies} active policies. ${content.policySummary.policiesNeedingReview} policies need review.`;

      case ReportType.CUSTOM:
        return `Custom compliance report for the period ${config.periodStart.toDateString()} to ${config.periodEnd.toDateString()}.`;

      default:
        return `Compliance report for the period ${config.periodStart.toDateString()} to ${config.periodEnd.toDateString()}.`;
    }
  }

  /**
   * Identify critical findings from non-compliant controls
   */
  private identifyCriticalFindings(nonCompliantControls: Control[]): any[] {
    // Identify controls that are critical and non-compliant
    const criticalControls = nonCompliantControls.filter(control =>
      this.isControlCritical(control)
    );

    return criticalControls.map(control => ({
      id: control.id,
      name: control.name,
      status: control.status,
      remediation: this.generateRemediationPlan(control),
    }));
  }

  /**
   * Determine if a control is critical
   */
  private isControlCritical(control: Control): boolean {
    // In a real implementation, this would use specific criteria
    // For demonstration, we'll consider specific control IDs as critical
    const criticalIds = ['CC1.1', 'CC1.2', 'CC1.3', 'CC1.4', 'CC5.1', 'CC5.2'];
    return criticalIds.includes(control.id);
  }

  /**
   * Get control priority
   */
  private getControlPriority(control: Control): 'critical' | 'high' | 'medium' | 'low' {
    if (this.isControlCritical(control)) {
      return 'critical';
    }

    // In a real implementation, this would use specific criteria
    // For demonstration, we'll use a simple approach based on control ID
    if (control.id.startsWith('CC1')) return 'high';
    if (control.id.startsWith('CC5')) return 'high';
    if (control.id.startsWith('CC2')) return 'medium';
    if (control.id.startsWith('CC3')) return 'medium';
    if (control.id.startsWith('CC4')) return 'medium';

    return 'low';
  }

  /**
   * Generate remediation plan for a control
   */
  private generateRemediationPlan(control: Control): string {
    // In a real implementation, this would generate a specific remediation plan
    // For demonstration, we'll return a generic plan

    if (control.status === ControlStatus.NOT_IMPLEMENTED) {
      return `Implement the ${control.name} control by defining policies, procedures, and technical controls.`;
    }

    if (control.status === ControlStatus.PARTIALLY_IMPLEMENTED) {
      return `Complete the implementation of the ${control.name} control by addressing gaps in current implementation.`;
    }

    if (control.status === ControlStatus.FAILED) {
      return `Fix the ${control.name} control by addressing the issues identified during testing.`;
    }

    return `Review and update the ${control.name} control to ensure compliance.`;
  }

  /**
   * Calculate compliance trend
   */
  private calculateComplianceTrend(): any {
    // In a real implementation, this would compare historical compliance rates
    // For demonstration, we'll return a simple trend

    return {
      current: 75,
      previous: 68,
      trend: 'improving',
      periods: [
        { date: '2025-01-01', rate: 65 },
        { date: '2025-02-01', rate: 68 },
        { date: '2025-03-01', rate: 70 },
        { date: '2025-04-01', rate: 75 },
      ],
    };
  }

  /**
   * Generate recommendations based on non-compliant controls
   */
  private generateRecommendations(nonCompliantControls: Control[]): string[] {
    // In a real implementation, this would generate specific recommendations
    // For demonstration, we'll return generic recommendations

    const recommendations: string[] = [];

    if (nonCompliantControls.some(c => c.id.startsWith('CC1'))) {
      recommendations.push(
        'Strengthen access control measures by implementing multi-factor authentication and regular access reviews.'
      );
    }

    if (nonCompliantControls.some(c => c.id.startsWith('CC2'))) {
      recommendations.push(
        'Improve communication controls by formalizing and documenting internal communication protocols.'
      );
    }

    if (nonCompliantControls.some(c => c.id.startsWith('CC3'))) {
      recommendations.push(
        'Enhance risk management processes by implementing a formal risk assessment methodology.'
      );
    }

    if (nonCompliantControls.some(c => c.id.startsWith('CC4'))) {
      recommendations.push(
        'Strengthen monitoring activities by implementing automated monitoring tools and regular reviews.'
      );
    }

    if (nonCompliantControls.some(c => c.id.startsWith('CC5'))) {
      recommendations.push(
        'Improve logical and physical access controls by implementing least privilege principles and regular access reviews.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue maintaining and improving existing controls.');
    }

    return recommendations;
  }

  /**
   * Generate gap recommendations
   */
  private generateGapRecommendations(nonCompliantControls: Control[]): any[] {
    // Group controls by criteria
    const criteriaGroups = new Map<string, Control[]>();

    for (const control of nonCompliantControls) {
      const criteria = control.criteria;
      const group = criteriaGroups.get(criteria) || [];
      group.push(control);
      criteriaGroups.set(criteria, group);
    }

    // Generate recommendations for each criteria group
    const recommendations: any[] = [];

    for (const [criteria, controls] of criteriaGroups.entries()) {
      recommendations.push({
        criteria,
        gapCount: controls.length,
        priority: this.calculateCriteriaPriority(controls),
        summary: `Address ${controls.length} gaps in ${criteria} controls`,
        actions: this.generateActionsForCriteria(criteria, controls),
      });
    }

    return recommendations;
  }

  /**
   * Calculate priority for a criteria group
   */
  private calculateCriteriaPriority(controls: Control[]): 'critical' | 'high' | 'medium' | 'low' {
    // If any control is critical, the criteria is critical
    if (controls.some(c => this.isControlCritical(c))) {
      return 'critical';
    }

    // Otherwise, use the highest priority among controls
    const priorities = controls.map(c => this.getControlPriority(c));

    if (priorities.includes('high')) return 'high';
    if (priorities.includes('medium')) return 'medium';

    return 'low';
  }

  /**
   * Generate actions for a criteria group
   */
  private generateActionsForCriteria(criteria: string, controls: Control[]): string[] {
    // In a real implementation, this would generate specific actions
    // For demonstration, we'll return generic actions

    const actions: string[] = [];

    if (criteria === 'security') {
      actions.push('Implement multi-factor authentication for all access to critical systems');
      actions.push('Conduct quarterly access reviews for all systems');
      actions.push('Implement and test incident response procedures');
    } else if (criteria === 'availability') {
      actions.push('Implement and test backup and recovery procedures');
      actions.push('Conduct disaster recovery testing at least annually');
      actions.push('Implement redundancy for critical systems');
    } else if (criteria === 'processing_integrity') {
      actions.push('Implement input validation controls for all data entry points');
      actions.push('Implement change management procedures for all system changes');
      actions.push('Conduct regular data quality reviews');
    } else if (criteria === 'confidentiality') {
      actions.push('Implement data classification and handling procedures');
      actions.push('Implement encryption for sensitive data at rest and in transit');
      actions.push('Implement data loss prevention controls');
    } else if (criteria === 'privacy') {
      actions.push('Implement privacy impact assessments for all new systems');
      actions.push('Implement privacy training for all employees');
      actions.push('Implement data subject access request procedures');
    }

    return actions;
  }

  /**
   * Group evidence by type
   */
  private groupEvidenceByType(evidence: Evidence[]): Record<string, number> {
    const result: Record<string, number> = {};

    for (const item of evidence) {
      const type = item.type;
      result[type] = (result[type] || 0) + 1;
    }

    return result;
  }

  /**
   * Identify evidence gaps
   */
  private identifyEvidenceGaps(): any[] {
    if (!this.soc2Manager || !this.evidenceCollector) {
      return [];
    }

    const controls = this.soc2Manager.getAllControls();
    const gaps: any[] = [];

    for (const control of controls) {
      const evidence = this.evidenceCollector.getEvidenceForControl(control.id);

      // If the control needs evidence but doesn't have any, or doesn't have any approved evidence
      if (
        control.evidenceRequired &&
        (evidence.length === 0 || !evidence.some(e => e.status === EvidenceStatus.APPROVED))
      ) {
        gaps.push({
          controlId: control.id,
          controlName: control.name,
          evidenceCount: evidence.length,
          priority: this.getControlPriority(control),
        });
      }
    }

    return gaps;
  }

  /**
   * Group policies by type
   */
  private groupPoliciesByType(policies: Policy[]): Record<string, number> {
    const result: Record<string, number> = {};

    for (const policy of policies) {
      const type = policy.type;
      result[type] = (result[type] || 0) + 1;
    }

    return result;
  }

  /**
   * Calculate policy adherence
   */
  private calculatePolicyAdherence(activePolicies: Policy[]): any {
    if (!this.policyManager) {
      return {};
    }

    const result: Record<string, any> = {};

    for (const policy of activePolicies) {
      const acknowledgements = this.policyManager.getPolicyAcknowledgements(policy.id);

      // In a real implementation, this would compare acknowledgements against user count
      // For demonstration, we'll use a random number
      const userCount = 100;
      const adherenceRate = (acknowledgements.length / userCount) * 100;

      result[policy.id] = {
        name: policy.name,
        acknowledgements: acknowledgements.length,
        adherenceRate: adherenceRate.toFixed(1) + '%',
      };
    }

    return result;
  }

  /**
   * Finalize a report
   */
  public finalizeReport(id: string): ComplianceReport | null {
    const report = this.reports.get(id);

    if (!report) {
      this.logger.error('Report not found', { reportId: id });
      return null;
    }

    const finalizedReport: ComplianceReport = {
      ...report,
      status: ReportStatus.FINAL,
    };

    this.reports.set(id, finalizedReport);

    this.logger.info('Report finalized', { reportId: id });
    this.emit('report:finalized', finalizedReport);

    return finalizedReport;
  }

  /**
   * Archive a report
   */
  public archiveReport(id: string): ComplianceReport | null {
    const report = this.reports.get(id);

    if (!report) {
      this.logger.error('Report not found', { reportId: id });
      return null;
    }

    const archivedReport: ComplianceReport = {
      ...report,
      status: ReportStatus.ARCHIVED,
    };

    this.reports.set(id, archivedReport);

    this.logger.info('Report archived', { reportId: id });
    this.emit('report:archived', archivedReport);

    return archivedReport;
  }

  /**
   * Get a report by ID
   */
  public getReport(id: string): ComplianceReport | undefined {
    return this.reports.get(id);
  }

  /**
   * Get all reports
   */
  public getAllReports(): ComplianceReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Get reports by type
   */
  public getReportsByType(type: ReportType): ComplianceReport[] {
    return this.getAllReports().filter(report => report.type === type);
  }

  /**
   * Get reports by status
   */
  public getReportsByStatus(status: ReportStatus): ComplianceReport[] {
    return this.getAllReports().filter(report => report.status === status);
  }

  /**
   * Get reports for a date range
   */
  public getReportsForPeriod(start: Date, end: Date): ComplianceReport[] {
    return this.getAllReports().filter(
      report => report.generatedAt >= start && report.generatedAt <= end
    );
  }
}

/**
 * Create a new compliance reporter
 */
export function createComplianceReporter(
  logger: Logger,
  soc2Manager?: SOC2ComplianceManager,
  evidenceCollector?: EvidenceCollector,
  policyManager?: PolicyManager
): ComplianceReporter {
  return new ComplianceReporter(logger, soc2Manager, evidenceCollector, policyManager);
}
