/**
 * ISO 27001 Compliance Module
 *
 * Implements the ISO 27001 Information Security Management System (ISMS) framework
 * which includes:
 * - Risk assessment and treatment
 * - Security policy
 * - Organization of information security
 * - Asset management
 * - Human resources security
 * - Physical and environmental security
 * - Communications and operations management
 * - Access control
 * - Information systems acquisition, development and maintenance
 * - Information security incident management
 * - Business continuity management
 * - Compliance
 */

import { EventEmitter } from 'events';
import { Logger } from './logger';

// ISO 27001 Control Category
export enum ISO27001Category {
  INFORMATION_SECURITY_POLICIES = 'A.5',
  ORGANIZATION_OF_INFORMATION_SECURITY = 'A.6',
  HUMAN_RESOURCE_SECURITY = 'A.7',
  ASSET_MANAGEMENT = 'A.8',
  ACCESS_CONTROL = 'A.9',
  CRYPTOGRAPHY = 'A.10',
  PHYSICAL_ENVIRONMENTAL_SECURITY = 'A.11',
  OPERATIONS_SECURITY = 'A.12',
  COMMUNICATIONS_SECURITY = 'A.13',
  SYSTEM_ACQUISITION_DEVELOPMENT_MAINTENANCE = 'A.14',
  SUPPLIER_RELATIONSHIPS = 'A.15',
  INFORMATION_SECURITY_INCIDENT_MANAGEMENT = 'A.16',
  INFORMATION_SECURITY_ASPECTS_OF_BCM = 'A.17',
  COMPLIANCE = 'A.18',
}

// ISO 27001 Control Status
export enum ISO27001ControlStatus {
  NOT_APPLICABLE = 'not_applicable',
  NOT_IMPLEMENTED = 'not_implemented',
  PARTIALLY_IMPLEMENTED = 'partially_implemented',
  IMPLEMENTED = 'implemented',
  VERIFIED = 'verified',
  FAILED = 'failed',
}

// ISO 27001 Control
export interface ISO27001Control {
  id: string;
  name: string;
  description: string;
  category: ISO27001Category;
  status: ISO27001ControlStatus;
  applicabilityStatement?: string;
  implementationEvidence?: string[];
  risksAddressed?: string[];
  lastVerified?: Date;
  owner?: string;
  notes?: string;
}

// Risk level
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Risk treatment option
export enum RiskTreatmentOption {
  MITIGATE = 'mitigate',
  TRANSFER = 'transfer',
  AVOID = 'avoid',
  ACCEPT = 'accept',
}

// Risk
export interface Risk {
  id: string;
  name: string;
  description: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  level: RiskLevel;
  assets: string[];
  threats: string[];
  vulnerabilities: string[];
  treatmentOption: RiskTreatmentOption;
  controls: string[]; // Control IDs
  treatmentPlan?: string;
  owner?: string;
  reviewDate?: Date;
}

// Statement of Applicability item
export interface SOAItem {
  controlId: string;
  applicable: boolean;
  justification: string;
  implementationStatus: ISO27001ControlStatus;
  implementationDetails?: string;
}

/**
 * ISO 27001 Compliance Manager
 */
export class ISO27001ComplianceManager extends EventEmitter {
  private controls: Map<string, ISO27001Control> = new Map();
  private risks: Map<string, Risk> = new Map();
  private soa: Map<string, SOAItem> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  /**
   * Initialize ISO 27001 compliance framework
   */
  public initialize(): void {
    this.logger.info('Initializing ISO 27001 compliance framework');

    // Load default controls based on ISO 27001 Annex A
    this.loadDefaultControls();

    this.emit('initialized');
  }

  /**
   * Load default controls based on ISO 27001 Annex A
   */
  private loadDefaultControls(): void {
    this.logger.info('Loading default ISO 27001 controls');

    // Example controls for demonstration - this would be much more extensive in a real implementation

    // A.5 Information Security Policies
    this.addControl({
      id: 'A.5.1.1',
      name: 'Policies for information security',
      description:
        'A set of policies for information security shall be defined, approved by management, published and communicated to employees and relevant external parties.',
      category: ISO27001Category.INFORMATION_SECURITY_POLICIES,
      status: ISO27001ControlStatus.NOT_IMPLEMENTED,
    });

    this.addControl({
      id: 'A.5.1.2',
      name: 'Review of the policies for information security',
      description:
        'The policies for information security shall be reviewed at planned intervals or if significant changes occur to ensure their continuing suitability, adequacy and effectiveness.',
      category: ISO27001Category.INFORMATION_SECURITY_POLICIES,
      status: ISO27001ControlStatus.NOT_IMPLEMENTED,
    });

    // A.6 Organization of Information Security
    this.addControl({
      id: 'A.6.1.1',
      name: 'Information security roles and responsibilities',
      description: 'All information security responsibilities shall be defined and allocated.',
      category: ISO27001Category.ORGANIZATION_OF_INFORMATION_SECURITY,
      status: ISO27001ControlStatus.NOT_IMPLEMENTED,
    });

    // A.9 Access Control
    this.addControl({
      id: 'A.9.2.1',
      name: 'User registration and de-registration',
      description:
        'A formal user registration and de-registration process shall be implemented to enable assignment of access rights.',
      category: ISO27001Category.ACCESS_CONTROL,
      status: ISO27001ControlStatus.NOT_IMPLEMENTED,
    });

    this.addControl({
      id: 'A.9.2.3',
      name: 'Management of privileged access rights',
      description:
        'The allocation and use of privileged access rights shall be restricted and controlled.',
      category: ISO27001Category.ACCESS_CONTROL,
      status: ISO27001ControlStatus.NOT_IMPLEMENTED,
    });

    // A.12 Operations Security
    this.addControl({
      id: 'A.12.3.1',
      name: 'Information backup',
      description:
        'Backup copies of information, software and system images shall be taken and tested regularly in accordance with an agreed backup policy.',
      category: ISO27001Category.OPERATIONS_SECURITY,
      status: ISO27001ControlStatus.NOT_IMPLEMENTED,
    });

    // A.16 Information Security Incident Management
    this.addControl({
      id: 'A.16.1.1',
      name: 'Responsibilities and procedures',
      description:
        'Management responsibilities and procedures shall be established to ensure a quick, effective and orderly response to information security incidents.',
      category: ISO27001Category.INFORMATION_SECURITY_INCIDENT_MANAGEMENT,
      status: ISO27001ControlStatus.NOT_IMPLEMENTED,
    });
  }

  /**
   * Add a new control
   */
  public addControl(control: ISO27001Control): void {
    this.controls.set(control.id, control);
    this.logger.info('Control added', { controlId: control.id });
    this.emit('control:added', control);
  }

  /**
   * Update a control
   */
  public updateControl(id: string, updates: Partial<ISO27001Control>): ISO27001Control | null {
    const control = this.controls.get(id);

    if (!control) {
      this.logger.error('Control not found', { controlId: id });
      return null;
    }

    const updatedControl = { ...control, ...updates };
    this.controls.set(id, updatedControl);

    this.logger.info('Control updated', { controlId: id });
    this.emit('control:updated', updatedControl);

    return updatedControl;
  }

  /**
   * Get a control by ID
   */
  public getControl(id: string): ISO27001Control | undefined {
    return this.controls.get(id);
  }

  /**
   * Get all controls
   */
  public getAllControls(): ISO27001Control[] {
    return Array.from(this.controls.values());
  }

  /**
   * Get controls by category
   */
  public getControlsByCategory(category: ISO27001Category): ISO27001Control[] {
    return this.getAllControls().filter(control => control.category === category);
  }

  /**
   * Get controls by status
   */
  public getControlsByStatus(status: ISO27001ControlStatus): ISO27001Control[] {
    return this.getAllControls().filter(control => control.status === status);
  }

  /**
   * Add a new risk
   */
  public addRisk(risk: Omit<Risk, 'id' | 'level'>): Risk {
    const id = `risk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Calculate risk level based on likelihood and impact
    const riskScore = risk.likelihood * risk.impact;
    let level: RiskLevel;

    if (riskScore >= 15) {
      level = RiskLevel.CRITICAL;
    } else if (riskScore >= 10) {
      level = RiskLevel.HIGH;
    } else if (riskScore >= 5) {
      level = RiskLevel.MEDIUM;
    } else {
      level = RiskLevel.LOW;
    }

    const newRisk: Risk = {
      ...risk,
      id,
      level,
    };

    this.risks.set(id, newRisk);

    this.logger.info('Risk added', {
      riskId: id,
      name: newRisk.name,
      level: newRisk.level,
    });

    this.emit('risk:added', newRisk);

    return newRisk;
  }

  /**
   * Update a risk
   */
  public updateRisk(id: string, updates: Partial<Omit<Risk, 'id' | 'level'>>): Risk | null {
    const risk = this.risks.get(id);

    if (!risk) {
      this.logger.error('Risk not found', { riskId: id });
      return null;
    }

    // Recalculate risk level if likelihood or impact changed
    let level = risk.level;

    if (updates.likelihood !== undefined || updates.impact !== undefined) {
      const likelihood = updates.likelihood ?? risk.likelihood;
      const impact = updates.impact ?? risk.impact;
      const riskScore = likelihood * impact;

      if (riskScore >= 15) {
        level = RiskLevel.CRITICAL;
      } else if (riskScore >= 10) {
        level = RiskLevel.HIGH;
      } else if (riskScore >= 5) {
        level = RiskLevel.MEDIUM;
      } else {
        level = RiskLevel.LOW;
      }
    }

    const updatedRisk: Risk = {
      ...risk,
      ...updates,
      id: risk.id,
      level,
    };

    this.risks.set(id, updatedRisk);

    this.logger.info('Risk updated', {
      riskId: id,
      name: updatedRisk.name,
      level: updatedRisk.level,
    });

    this.emit('risk:updated', updatedRisk);

    return updatedRisk;
  }

  /**
   * Get a risk by ID
   */
  public getRisk(id: string): Risk | undefined {
    return this.risks.get(id);
  }

  /**
   * Get all risks
   */
  public getAllRisks(): Risk[] {
    return Array.from(this.risks.values());
  }

  /**
   * Get risks by level
   */
  public getRisksByLevel(level: RiskLevel): Risk[] {
    return this.getAllRisks().filter(risk => risk.level === level);
  }

  /**
   * Get risks by treatment option
   */
  public getRisksByTreatmentOption(option: RiskTreatmentOption): Risk[] {
    return this.getAllRisks().filter(risk => risk.treatmentOption === option);
  }

  /**
   * Add or update a Statement of Applicability (SOA) item
   */
  public updateSOA(item: SOAItem): void {
    this.soa.set(item.controlId, item);

    this.logger.info('SOA item updated', {
      controlId: item.controlId,
      applicable: item.applicable,
      status: item.implementationStatus,
    });

    this.emit('soa:updated', item);
  }

  /**
   * Get a SOA item by control ID
   */
  public getSOAItem(controlId: string): SOAItem | undefined {
    return this.soa.get(controlId);
  }

  /**
   * Get all SOA items
   */
  public getAllSOAItems(): SOAItem[] {
    return Array.from(this.soa.values());
  }

  /**
   * Generate a Statement of Applicability
   */
  public generateSOA(): any {
    const controls = this.getAllControls();
    const soaItems = this.getAllSOAItems();

    // For controls without a SOA item, create a default one
    for (const control of controls) {
      if (!this.soa.has(control.id)) {
        this.updateSOA({
          controlId: control.id,
          applicable: true, // Default to applicable
          justification: 'Default applicability',
          implementationStatus: control.status,
        });
      }
    }

    // Group by category
    const categorizedSOA: Record<string, any[]> = {};

    for (const control of controls) {
      const soaItem = this.getSOAItem(control.id);

      if (!soaItem) continue;

      const category = control.category;

      if (!categorizedSOA[category]) {
        categorizedSOA[category] = [];
      }

      categorizedSOA[category].push({
        id: control.id,
        name: control.name,
        description: control.description,
        applicable: soaItem.applicable,
        justification: soaItem.justification,
        status: soaItem.implementationStatus,
        details: soaItem.implementationDetails,
      });
    }

    const result = {
      generateDate: new Date(),
      categories: Object.entries(categorizedSOA).map(([category, items]) => ({
        category,
        controls: items,
      })),
      summary: {
        totalControls: controls.length,
        applicableControls: soaItems.filter(item => item.applicable).length,
        notApplicableControls: soaItems.filter(item => !item.applicable).length,
        implementedControls: soaItems.filter(
          item => item.applicable && item.implementationStatus === ISO27001ControlStatus.IMPLEMENTED
        ).length,
        partiallyImplementedControls: soaItems.filter(
          item =>
            item.applicable &&
            item.implementationStatus === ISO27001ControlStatus.PARTIALLY_IMPLEMENTED
        ).length,
        notImplementedControls: soaItems.filter(
          item =>
            item.applicable && item.implementationStatus === ISO27001ControlStatus.NOT_IMPLEMENTED
        ).length,
      },
    };

    this.logger.info('Statement of Applicability generated', {
      totalControls: result.summary.totalControls,
      applicableControls: result.summary.applicableControls,
    });

    this.emit('soa:generated', result);

    return result;
  }

  /**
   * Run a gap assessment to identify non-compliant controls
   */
  public runGapAssessment(): { compliant: ISO27001Control[]; nonCompliant: ISO27001Control[] } {
    const controls = this.getAllControls();
    const soaItems = this.getAllSOAItems();

    // Filter to only applicable controls
    const applicableControls = controls.filter(control => {
      const soaItem = this.getSOAItem(control.id);
      return soaItem?.applicable !== false; // Default to applicable if no SOA item
    });

    const compliant = applicableControls.filter(
      control =>
        control.status === ISO27001ControlStatus.IMPLEMENTED ||
        control.status === ISO27001ControlStatus.VERIFIED
    );

    const nonCompliant = applicableControls.filter(
      control =>
        control.status === ISO27001ControlStatus.NOT_IMPLEMENTED ||
        control.status === ISO27001ControlStatus.PARTIALLY_IMPLEMENTED ||
        control.status === ISO27001ControlStatus.FAILED
    );

    this.logger.info('Gap assessment completed', {
      compliantCount: compliant.length,
      nonCompliantCount: nonCompliant.length,
    });

    this.emit('gap-assessment:completed', { compliant, nonCompliant });

    return { compliant, nonCompliant };
  }

  /**
   * Generate a risk treatment plan
   */
  public generateRiskTreatmentPlan(): any {
    const risks = this.getAllRisks();

    // Group by treatment option
    const treatmentGroups: Record<string, Risk[]> = {};

    for (const risk of risks) {
      const option = risk.treatmentOption;

      if (!treatmentGroups[option]) {
        treatmentGroups[option] = [];
      }

      treatmentGroups[option].push(risk);
    }

    // Sort risks within each group by level
    const sortByLevel = (a: Risk, b: Risk) => {
      const levelOrder = {
        [RiskLevel.CRITICAL]: 0,
        [RiskLevel.HIGH]: 1,
        [RiskLevel.MEDIUM]: 2,
        [RiskLevel.LOW]: 3,
      };

      return levelOrder[a.level] - levelOrder[b.level];
    };

    for (const option in treatmentGroups) {
      treatmentGroups[option].sort(sortByLevel);
    }

    const result = {
      generatedAt: new Date(),
      summary: {
        totalRisks: risks.length,
        byLevel: {
          critical: risks.filter(r => r.level === RiskLevel.CRITICAL).length,
          high: risks.filter(r => r.level === RiskLevel.HIGH).length,
          medium: risks.filter(r => r.level === RiskLevel.MEDIUM).length,
          low: risks.filter(r => r.level === RiskLevel.LOW).length,
        },
        byTreatment: {
          mitigate: (treatmentGroups[RiskTreatmentOption.MITIGATE] || []).length,
          transfer: (treatmentGroups[RiskTreatmentOption.TRANSFER] || []).length,
          avoid: (treatmentGroups[RiskTreatmentOption.AVOID] || []).length,
          accept: (treatmentGroups[RiskTreatmentOption.ACCEPT] || []).length,
        },
      },
      treatmentPlans: Object.entries(treatmentGroups).map(([option, risks]) => ({
        option,
        risks: risks.map(risk => ({
          id: risk.id,
          name: risk.name,
          level: risk.level,
          treatmentPlan: risk.treatmentPlan || `Develop treatment plan for ${risk.name}`,
          controls: risk.controls.map(controlId => {
            const control = this.getControl(controlId);
            return control
              ? {
                  id: control.id,
                  name: control.name,
                  status: control.status,
                }
              : { id: controlId, name: 'Unknown control', status: 'unknown' };
          }),
        })),
      })),
    };

    this.logger.info('Risk treatment plan generated', {
      totalRisks: result.summary.totalRisks,
    });

    this.emit('risk-treatment:generated', result);

    return result;
  }

  /**
   * Generate a compliance report
   */
  public generateComplianceReport(): any {
    const { compliant, nonCompliant } = this.runGapAssessment();
    const soaItems = this.getAllSOAItems();
    const risks = this.getAllRisks();

    const report = {
      timestamp: new Date(),
      summary: {
        totalControls: compliant.length + nonCompliant.length,
        compliantControls: compliant.length,
        nonCompliantControls: nonCompliant.length,
        compliancePercentage: (compliant.length / (compliant.length + nonCompliant.length)) * 100,
        applicableControls: soaItems.filter(item => item.applicable).length,
        totalRisks: risks.length,
        highCriticalRisks: risks.filter(
          r => r.level === RiskLevel.CRITICAL || r.level === RiskLevel.HIGH
        ).length,
      },
      categorySummary: this.generateCategorySummary(),
      criticalGaps: this.identifyCriticalGaps(nonCompliant),
      riskSummary: {
        byLevel: {
          critical: risks.filter(r => r.level === RiskLevel.CRITICAL).length,
          high: risks.filter(r => r.level === RiskLevel.HIGH).length,
          medium: risks.filter(r => r.level === RiskLevel.MEDIUM).length,
          low: risks.filter(r => r.level === RiskLevel.LOW).length,
        },
        byTreatment: {
          mitigate: risks.filter(r => r.treatmentOption === RiskTreatmentOption.MITIGATE).length,
          transfer: risks.filter(r => r.treatmentOption === RiskTreatmentOption.TRANSFER).length,
          avoid: risks.filter(r => r.treatmentOption === RiskTreatmentOption.AVOID).length,
          accept: risks.filter(r => r.treatmentOption === RiskTreatmentOption.ACCEPT).length,
        },
      },
    };

    this.logger.info('Compliance report generated', {
      compliancePercentage: report.summary.compliancePercentage,
    });

    this.emit('report:generated', report);

    return report;
  }

  /**
   * Generate category summary
   */
  private generateCategorySummary(): any[] {
    const categories = Object.values(ISO27001Category);
    const result: any[] = [];

    for (const category of categories) {
      const controls = this.getControlsByCategory(category);

      if (controls.length === 0) continue;

      const compliant = controls.filter(
        control =>
          control.status === ISO27001ControlStatus.IMPLEMENTED ||
          control.status === ISO27001ControlStatus.VERIFIED
      );

      result.push({
        category,
        totalControls: controls.length,
        compliantControls: compliant.length,
        compliancePercentage: (compliant.length / controls.length) * 100,
      });
    }

    return result;
  }

  /**
   * Identify critical gaps
   */
  private identifyCriticalGaps(nonCompliantControls: ISO27001Control[]): any[] {
    // In a real implementation, this would use specific criteria to identify critical controls
    // For demonstration, we'll consider specific categories as critical
    const criticalCategories = [
      ISO27001Category.ACCESS_CONTROL,
      ISO27001Category.INFORMATION_SECURITY_INCIDENT_MANAGEMENT,
      ISO27001Category.CRYPTOGRAPHY,
    ];

    const criticalControls = nonCompliantControls.filter(control =>
      criticalCategories.includes(control.category)
    );

    return criticalControls.map(control => ({
      id: control.id,
      name: control.name,
      category: control.category,
      status: control.status,
    }));
  }
}

/**
 * Create an ISO 27001 Compliance Manager
 */
export function createISO27001ComplianceManager(logger: Logger): ISO27001ComplianceManager {
  return new ISO27001ComplianceManager(logger);
}
