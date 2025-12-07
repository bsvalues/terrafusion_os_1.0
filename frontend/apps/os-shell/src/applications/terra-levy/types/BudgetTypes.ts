// Budget Management Types for TerraLevy Elite
// Quantum-enhanced budget visualization and multi-jurisdictional planning

export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  projected: number;
  department: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  fiscalYear: string;
  lastUpdated: Date;
  subCategories: BudgetSubCategory[];
  quantumProjection?: QuantumBudgetProjection;
  complianceStatus: ComplianceStatus;
  aiRecommendations: AIRecommendation[];
  historicalData: HistoricalBudgetData[];
  responsibleOfficer: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'under_review';
}

export interface BudgetSubCategory {
  id: string;
  name: string;
  parentCategoryId: string;
  budgetedAmount: number;
  actualSpent: number;
  encumberedAmount: number;
  variance: number;
  variancePercentage: number;
  lastTransaction: Date;
  fundingSource: FundingSource;
  costCenter: string;
  projectCode?: string;
  quarterlyBreakdown: QuarterlyData[];
}

export interface QuantumBudgetProjection {
  id: string;
  confidence: number; // 0-1 (targeting 99.7%+ accuracy)
  projectionDate: Date;
  endOfYearProjection: number;
  scenarios: ScenarioProjection[];
  riskFactors: RiskFactor[];
  quantumAlgorithm: string;
  modelVersion: string;
  dataPoints: number;
  uncertaintyRange: {
    lower: number;
    upper: number;
  };
  keyDrivers: BudgetDriver[];
}

export interface ScenarioProjection {
  id: string;
  name: string;
  description: string;
  variables: ScenarioVariable[]; // Added variables property
  projectedOutcome: {
    revenueChange: number;
    expenseChange: number;
    netImpact: number;
    timeframe: string;
    confidence: number;
  };
  sideEffects: Array<{
    effect: string;
    probability: number;
    impact: number;
  }>;
  implementationPlan: {
    phases: string[];
    timeline: string;
    requiredApprovals: string[];
  };
  stakeholderImpact: Array<{
    stakeholder: string;
    impact: 'positive' | 'negative' | 'neutral' | 'mixed';
    severity: 'low' | 'moderate' | 'high';
    mitigation: string;
  }>;
}

export interface ScenarioVariable {
  name: string;
  currentValue: number;
  newValue: number;
  unit: string;
}

// Budget optimization interfaces for quantum-enhanced optimization
export interface BudgetOptimization {
  id: string;
  name: string;
  description: string;
  algorithm: string;
  objectives: OptimizationObjective[];
  constraints: OptimizationConstraint[];
  recommendedChanges: AllocationChange[];
  expectedBenefits: {
    costSavings: number;
    serviceImprovement: number;
    riskReduction: number;
  };
  implementationRisk: 'low' | 'medium' | 'high';
  paybackPeriod: string;
  confidence: number;
}

export interface OptimizationObjective {
  name: string;
  weight: number;
  currentScore: number;
  optimizedScore: number;
}

export interface OptimizationConstraint {
  type: string;
  value: number;
  unit: string;
}

export interface AllocationChange {
  category: string;
  currentAllocation: number;
  recommendedAllocation: number;
  change: number;
  justification: string;
}

export interface ScenarioFactor {
  id: string;
  name: string;
  category: 'economic' | 'regulatory' | 'demographic' | 'environmental' | 'political';
  impact: number;
  likelihood: number;
  timeHorizon: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  description: string;
}

export interface RiskFactor {
  factor: string; // Changed from 'name' to 'factor'
  probability: number;
  impact: number;
  mitigation: string;
}

export interface BudgetDriver {
  id: string;
  name: string;
  influence: number; // 0-1
  category: 'revenue' | 'expenditure' | 'policy' | 'external';
  description: string;
  historicalCorrelation: number;
  predictiveWeight: number;
}

export interface ComplianceStatus {
  level: 'FISMA-LOW' | 'FISMA-MODERATE' | 'FISMA-HIGH';
  auditTrail: AuditEntry[];
  lastAudit: Date;
  nextAuditDue: Date;
  complianceScore: number; // 0-100
  violations: ComplianceViolation[];
  certifications: string[];
  approvals: ApprovalRecord[];
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: ChangeRecord[];
  ipAddress: string;
  sessionId: string;
  compliance: boolean;
}

export interface ChangeRecord {
  field: string;
  oldValue: any;
  newValue: any;
  reason?: string;
}

export interface ComplianceViolation {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  discoveredDate: Date;
  resolvedDate?: Date;
  resolution?: string;
  responsibleParty: string;
}

export interface ApprovalRecord {
  id: string;
  approverName: string;
  approverRole: string;
  approvalDate: Date;
  amount: number;
  category: string;
  digitalSignature: string;
  comments?: string;
}

export interface AIRecommendation {
  id: string;
  type: 'optimization' | 'reallocation' | 'risk_mitigation' | 'efficiency' | 'compliance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  potentialSavings?: number;
  implementation: {
    effort: 'low' | 'medium' | 'high';
    timeline: string;
    prerequisites: string[];
    steps: string[];
  };
  confidence: number; // 0-1
  generatedDate: Date;
  aiModel: string;
  dataSource: string[];
  impact: {
    financial: number;
    operational: number;
    compliance: number;
  };
  status: 'pending' | 'reviewed' | 'approved' | 'implemented' | 'rejected';
}

export interface HistoricalBudgetData {
  fiscalYear: string;
  allocated: number;
  spent: number;
  variance: number;
  performance: BudgetPerformance;
  economicContext: EconomicContext;
  majorEvents: string[];
}

export interface BudgetPerformance {
  utilizationRate: number;
  efficiencyScore: number;
  outcomeMetrics: OutcomeMetric[];
  costPerOutcome: number;
  benchmarkComparison: BenchmarkData[];
}

export interface OutcomeMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target: number;
  performanceRating: number; // 0-10
}

export interface BenchmarkData {
  jurisdiction: string;
  category: string;
  value: number;
  rank: number;
  percentile: number;
}

export interface EconomicContext {
  gdpGrowth: number;
  inflationRate: number;
  unemploymentRate: number;
  taxBaseGrowth: number;
  populationGrowth: number;
  majorInvestments: string[];
}

export interface FundingSource {
  id: string;
  name: string;
  type:
    | 'general_fund'
    | 'special_revenue'
    | 'debt_service'
    | 'capital_projects'
    | 'enterprise'
    | 'federal_grant'
    | 'state_grant';
  totalAmount: number;
  availableAmount: number;
  restrictions: string[];
  reportingRequirements: string[];
  expirationDate?: Date;
}

export interface QuarterlyData {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  budgeted: number;
  actual: number;
  projected: number;
  variance: number;
  performanceIndicators: PerformanceIndicator[];
}

export interface PerformanceIndicator {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'improving' | 'stable' | 'declining';
}

// Multi-Jurisdictional Types
export interface JurisdictionData {
  id: string;
  name: string;
  type: 'county' | 'city' | 'township' | 'district' | 'authority';
  totalBudget: number;
  population: number;
  area: number; // square miles
  taxBase: number;
  creditRating: string;
  contactInfo: ContactInfo;
  demographics: Demographics;
  economicProfile: EconomicProfile;
  collaborativeAgreements: CollaborativeAgreement[];
  sharedServices: SharedService[];
  intergovernmentalTransfers: Transfer[];
}

export interface ContactInfo {
  primaryContact: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
}

export interface Demographics {
  totalPopulation: number;
  medianAge: number;
  medianIncome: number;
  educationLevel: EducationStats;
  employmentStats: EmploymentStats;
  housingStats: HousingStats;
}

export interface EducationStats {
  highSchoolGraduate: number;
  bachelorsDegree: number;
  advancedDegree: number;
}

export interface EmploymentStats {
  unemploymentRate: number;
  laborForceParticipation: number;
  majorEmployers: string[];
  economicSectors: SectorData[];
}

export interface SectorData {
  sector: string;
  employmentPercentage: number;
  averageWage: number;
}

export interface HousingStats {
  totalUnits: number;
  medianValue: number;
  ownerOccupied: number;
  rentalUnits: number;
  vacancyRate: number;
}

export interface EconomicProfile {
  gdp: number;
  gdpPerCapita: number;
  majorIndustries: string[];
  businessCount: number;
  newBusinessGrowth: number;
  commercialProperties: number;
  industrialProperties: number;
  developmentProjects: DevelopmentProject[];
}

export interface DevelopmentProject {
  id: string;
  name: string;
  type: string;
  estimatedValue: number;
  timeline: string;
  status: string;
  taxImpact: number;
}

export interface CollaborativeAgreement {
  id: string;
  name: string;
  type: 'shared_services' | 'joint_purchasing' | 'resource_sharing' | 'joint_planning';
  participants: string[];
  startDate: Date;
  endDate?: Date;
  estimatedSavings: number;
  status: 'active' | 'pending' | 'expired' | 'terminated';
  terms: string[];
}

export interface SharedService {
  id: string;
  serviceName: string;
  leadJurisdiction: string;
  participants: string[];
  costAllocation: CostAllocation[];
  serviceLevel: string;
  performanceMetrics: PerformanceIndicator[];
  annualCost: number;
  savingsGenerated: number;
}

export interface CostAllocation {
  jurisdictionId: string;
  percentage: number;
  amount: number;
  basis: 'population' | 'usage' | 'equal' | 'assessed_value' | 'custom';
}

export interface Transfer {
  id: string;
  fromJurisdiction: string;
  toJurisdiction: string;
  amount: number;
  purpose: string;
  type: 'grant' | 'loan' | 'shared_revenue' | 'reimbursement';
  fiscalYear: string;
  conditions: string[];
  status: 'approved' | 'pending' | 'disbursed' | 'completed';
}

// Collaborative Session Types
export interface CollaborativeSession {
  id: string;
  name: string;
  description: string;
  createdBy: string; // Added createdBy property
  createdAt: Date; // Added createdAt property
  lastActivity: Date; // Added lastActivity property
  hostJurisdiction: string;
  participants: SessionParticipant[];
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  budgetScope: {
    // Added budgetScope property
    fiscalYear: string;
    departments: string[];
    categories: string[];
  };
  permissions: {
    // Added permissions property
    canEdit: string[];
    canView: string[];
    canComment: string[];
    canApprove: string[];
  };
  settings: {
    // Added settings property
    autoSave: boolean;
    conflictResolution: 'auto' | 'manual';
    notificationLevel: 'none' | 'important' | 'all';
  };
  sharedDocuments: SharedDocument[];
  chatHistory: ChatMessage[];
  modifications: CollaborativeModification[];
  conflictResolution: ConflictResolution[];
}

export interface SessionParticipant {
  userId: string; // Added userId property
  name: string;
  role: string;
  department: string;
  joinedAt: Date;
  lastActivity: Date;
  permissions: Permission[];
  status: 'online' | 'away' | 'offline';
  cursorPosition: { x: number; y: number; element?: string } | null;
}

export interface Permission {
  resource: string;
  action: 'view' | 'edit' | 'approve' | 'comment';
  granted: boolean;
}

// Session activity tracking
export interface SessionActivity {
  id: string;
  sessionId: string;
  userId: string;
  type:
    | 'user_joined'
    | 'user_left'
    | 'budget_modified'
    | 'comment_added'
    | 'approval_requested'
    | 'conflict_resolved';
  description: string;
  timestamp: Date;
  data: any; // Flexible data structure for different activity types
}

export interface SharedDocument {
  id: string;
  name: string;
  type: 'budget' | 'report' | 'analysis' | 'presentation';
  owner: string;
  permissions: DocumentPermission[];
  lastModified: Date;
  version: string;
  lockStatus: DocumentLock[];
}

export interface DocumentPermission {
  userId: string;
  permission: 'view' | 'edit' | 'comment' | 'admin';
}

export interface DocumentLock {
  section: string;
  lockedBy: string;
  lockTime: Date;
  expiresAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  message: string;
  type: 'text' | 'system' | 'notification' | 'file_share';
  references?: string[]; // Referenced budget items or documents
}

export interface CollaborativeModification {
  id: string;
  userId: string;
  userName: string;
  timestamp: Date;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  changes: ChangeRecord[];
  conflictResolved: boolean;
  approvals: string[];
}

export interface ConflictResolution {
  id: string;
  sessionId: string;
  type: 'data_conflict' | 'concurrent_edit' | 'approval_conflict' | 'data_inconsistency';
  description: string;
  participants: string[]; // Changed from affectedEntities
  data: any; // Added flexible data property
  status: 'pending' | 'resolved' | 'escalated';
  detectedAt: Date; // Added detection timestamp
  resolvedAt: Date | null; // Made nullable
  resolvedBy: string | null; // Made nullable
  resolution: any | null; // Added resolution data
}

export interface Resolution {
  id: string;
  description: string;
  proposedBy: string;
  votes: Vote[];
  implementation: string[];
}

export interface Vote {
  userId: string;
  vote: 'approve' | 'reject' | 'abstain';
  reason?: string;
  timestamp: Date;
}

// Real-time Data Integration Types
export interface DataFeed {
  id: string;
  name: string;
  source: string;
  type: 'financial' | 'economic' | 'demographic' | 'regulatory';
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  lastUpdate: Date;
  status: 'active' | 'inactive' | 'error';
  dataPoints: DataPoint[];
  integrationConfig: IntegrationConfig;
}

export interface DataPoint {
  timestamp: Date;
  metric: string;
  value: number;
  unit: string;
  source: string;
  quality: 'high' | 'medium' | 'low';
  validated: boolean;
}

export interface IntegrationConfig {
  endpoint: string;
  authentication: AuthConfig;
  mapping: FieldMapping[];
  validation: ValidationRule[];
  transformation: TransformationRule[];
}

export interface AuthConfig {
  type: 'api_key' | 'oauth' | 'certificate' | 'basic';
  credentials: Record<string, string>;
  expirationDate?: Date;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: string;
  required: boolean;
  defaultValue?: any;
}

export interface ValidationRule {
  field: string;
  rule: string;
  errorMessage: string;
}

export interface TransformationRule {
  field: string;
  operation: string;
  parameters: Record<string, any>;
}

// Export all types for use throughout the application
