/**
 * 🏛️ TerraFusion OS - AI-Native Kernel Supporting Types
 * 
 * Complete type definitions for the AI-Native Government OS Kernel
 * 
 * @author TerraFusion AI Development Team  
 * @version 2.0.0 - AI-Native Kernel Types
 * @date October 18, 2025
 */

// ================================================================================================
// CORE SUPPORTING TYPES
// ================================================================================================

export type SecurityClassification = 'PUBLIC' | 'RESTRICTED' | 'CONFIDENTIAL' | 'SECRET';

export interface TaskMetadata {
  createdBy: string;
  department: string;
  estimatedDuration: number;
  complexity: TaskComplexity;
  relatedTasks: string[];
  tags: string[];
}

export type TaskComplexity = 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'EXPERT_LEVEL';

export interface UserIdentity {
  userId: string;
  name: string;
  email: string;
  role: GovernmentRole;
  permissions: string[];
  countyId: string;
  department: string;
  securityClearance: SecurityClassification;
}

export type GovernmentRole = 
  | 'COUNTY_ADMINISTRATOR'
  | 'ASSESSOR' 
  | 'CLERK'
  | 'TREASURER'
  | 'PLANNER'
  | 'IT_ADMINISTRATOR'
  | 'AUDITOR'
  | 'CITIZEN_SERVICES'
  | 'EMERGENCY_COORDINATOR';

export interface DataSynchronization {
  syncId: string;
  sourceCounty: string;
  targetCounties: string[];
  dataTypes: string[];
  syncMode: SyncMode;
  scheduledTime?: Date;
  priority: TaskPriority;
}

export type SyncMode = 'REAL_TIME' | 'BATCH' | 'SCHEDULED' | 'ON_DEMAND';

export interface SyncResult {
  syncId: string;
  status: SyncStatus;
  recordsSynced: number;
  errors: SyncError[];
  completedAt: Date;
  duration: number;
}

export type SyncStatus = 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'IN_PROGRESS';

export interface SyncError {
  recordId: string;
  errorMessage: string;
  errorCode: string;
  retryable: boolean;
}

// ================================================================================================
// AI SUPERPOWER ENGINE TYPES
// ================================================================================================

export interface ReportRequest {
  reportType: ReportType;
  countyId: string;
  timeRange: TimeRange;
  filters: ReportFilter[];
  outputFormat: OutputFormat;
  recipientUsers: string[];
  scheduledDelivery?: Date;
}

export type ReportType = 
  | 'PROPERTY_ASSESSMENT_SUMMARY'
  | 'TAX_COLLECTION_ANALYSIS'
  | 'PERMIT_PROCESSING_METRICS'
  | 'CITIZEN_SERVICE_STATISTICS'
  | 'COMPLIANCE_STATUS'
  | 'FINANCIAL_PERFORMANCE'
  | 'OPERATIONAL_EFFICIENCY';

export type OutputFormat = 'PDF' | 'EXCEL' | 'CSV' | 'JSON' | 'DASHBOARD';

export interface ReportFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export type FilterOperator = 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'RANGE';

export interface Report {
  reportId: string;
  reportType: ReportType;
  generatedAt: Date;
  generatedBy: string; // AI agent ID
  content: ReportContent;
  metadata: ReportMetadata;
  deliveryStatus: DeliveryStatus;
}

export interface ReportContent {
  summary: string;
  keyMetrics: KeyMetric[];
  charts: ChartData[];
  recommendations: string[];
  rawData?: any[];
}

export interface KeyMetric {
  name: string;
  value: number;
  unit: string;
  trend: TrendDirection;
  comparisonPeriod?: string;
}

export type TrendDirection = 'UP' | 'DOWN' | 'STABLE' | 'VOLATILE';

export interface ChartData {
  chartType: ChartType;
  title: string;
  data: any[];
  labels: string[];
}

export type ChartType = 'BAR' | 'LINE' | 'PIE' | 'SCATTER' | 'HEATMAP';

export interface ReportMetadata {
  dataSourcesUsed: string[];
  confidence: number;
  refreshRate: string;
  lastUpdated: Date;
}

export type DeliveryStatus = 'PENDING' | 'DELIVERED' | 'FAILED' | 'SCHEDULED';

export interface WorkflowDefinition {
  workflowId: string;
  name: string;
  description: string;
  triggerCondition: TriggerCondition;
  steps: WorkflowStep[];
  approvalRequired: boolean;
  timeoutMinutes: number;
}

export interface TriggerCondition {
  type: TriggerType;
  conditions: ConditionRule[];
}

export type TriggerType = 'SCHEDULE' | 'EVENT' | 'DATA_CHANGE' | 'MANUAL' | 'API_CALL';

export interface ConditionRule {
  field: string;
  operator: FilterOperator;
  value: any;
  logicalOperator?: LogicalOperator;
}

export type LogicalOperator = 'AND' | 'OR' | 'NOT';

export interface WorkflowStep {
  stepId: string;
  name: string;
  type: StepType;
  configuration: any;
  nextSteps: string[];
  errorHandling: ErrorHandling;
}

export type StepType = 
  | 'AI_PROCESSING'
  | 'HUMAN_APPROVAL'
  | 'DATA_TRANSFORMATION'
  | 'NOTIFICATION'
  | 'API_CALL'
  | 'CONDITIONAL_BRANCH';

export interface ErrorHandling {
  retryCount: number;
  retryDelaySeconds: number;
  escalationRules: EscalationRule[];
}

export interface EscalationRule {
  condition: string;
  action: EscalationAction;
  recipient: string;
}

export type EscalationAction = 'EMAIL' | 'SMS' | 'DASHBOARD_ALERT' | 'TICKET_CREATION';

export interface WorkflowResult {
  workflowId: string;
  executionId: string;
  status: WorkflowStatus;
  startedAt: Date;
  completedAt?: Date;
  stepResults: StepResult[];
  outputData: any;
}

export type WorkflowStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED' | 'CANCELLED';

export interface StepResult {
  stepId: string;
  status: StepStatus;
  output: any;
  executionTime: number;
  errors?: string[];
}

export type StepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

// ================================================================================================
// PREDICTIVE SERVICES TYPES
// ================================================================================================

export interface CountyData {
  countyId: string;
  demographics: DemographicData;
  economic: EconomicData;
  infrastructure: InfrastructureData;
  historical: HistoricalData;
  realTime: RealTimeData;
}

export interface DemographicData {
  population: number;
  ageDistribution: AgeGroup[];
  incomeDistribution: IncomeGroup[];
  employmentRate: number;
  educationLevels: EducationLevel[];
}

export interface AgeGroup {
  ageRange: string;
  count: number;
  percentage: number;
}

export interface IncomeGroup {
  incomeRange: string;
  households: number;
  medianIncome: number;
}

export interface EducationLevel {
  level: string;
  count: number;
  percentage: number;
}

export interface EconomicData {
  grossCountyProduct: number;
  unemploymentRate: number;
  businessCount: number;
  taxRevenue: TaxRevenue;
  majorIndustries: Industry[];
}

export interface TaxRevenue {
  propertyTax: number;
  salesTax: number;
  businessTax: number;
  otherTax: number;
}

export interface Industry {
  name: string;
  employees: number;
  economicImpact: number;
}

export interface InfrastructureData {
  roadMiles: number;
  bridgeCount: number;
  publicBuildings: number;
  utilityCapacity: UtilityCapacity;
  emergencyServices: EmergencyServices;
}

export interface UtilityCapacity {
  waterCapacity: number;
  sewerCapacity: number;
  electricCapacity: number;
  broadbandCoverage: number;
}

export interface EmergencyServices {
  fireStations: number;
  policeStations: number;
  hospitals: number;
  responseTimes: ResponseTime[];
}

export interface ResponseTime {
  serviceType: string;
  averageMinutes: number;
  targetMinutes: number;
}

export interface HistoricalData {
  serviceRequests: ServiceRequestHistory[];
  permitApplications: PermitHistory[];
  taxCollections: TaxCollectionHistory[];
  citizenSatisfaction: SatisfactionHistory[];
}

export interface ServiceRequestHistory {
  year: number;
  month: number;
  requestType: string;
  count: number;
  averageResolutionDays: number;
}

export interface PermitHistory {
  year: number;
  month: number;
  permitType: string;
  applicationsReceived: number;
  applicationsApproved: number;
  averageProcessingDays: number;
}

export interface TaxCollectionHistory {
  year: number;
  month: number;
  taxType: string;
  amountCollected: number;
  collectionRate: number;
}

export interface SatisfactionHistory {
  year: number;
  quarter: number;
  serviceType: string;
  satisfactionScore: number;
  responseCount: number;
}

export interface RealTimeData {
  currentServiceRequests: number;
  systemLoad: SystemLoad;
  activeUsers: number;
  emergencyAlerts: EmergencyAlert[];
}

export interface SystemLoad {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkUsage: number;
}

export interface EmergencyAlert {
  alertId: string;
  type: EmergencyType;
  severity: AlertSeverity;
  description: string;
  affectedAreas: string[];
  issuedAt: Date;
}

export type EmergencyType = 'WEATHER' | 'TRAFFIC' | 'SECURITY' | 'INFRASTRUCTURE' | 'HEALTH';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CitizenNeedPrediction {
  predictionId: string;
  serviceType: string;
  predictedDemand: number;
  confidence: number;
  timeframe: string;
  recommendations: PredictionRecommendation[];
  dataSourcesUsed: string[];
}

export interface PredictionRecommendation {
  recommendation: string;
  priority: TaskPriority;
  estimatedImpact: ImpactAssessment;
  requiredResources: ResourceRequirement[];
}

export interface ImpactAssessment {
  citizenSatisfaction: number;
  operationalEfficiency: number;
  costSavings: number;
  riskReduction: number;
}

export interface ResourceRequirement {
  resourceType: ResourceType;
  quantity: number;
  estimatedCost: number;
  timeframe: string;
}

export type ResourceType = 'STAFF' | 'BUDGET' | 'EQUIPMENT' | 'SPACE' | 'TECHNOLOGY';

export interface ResourceData {
  countyId: string;
  availableResources: AvailableResource[];
  allocatedResources: AllocatedResource[];
  resourceConstraints: ResourceConstraint[];
  utilizationMetrics: UtilizationMetric[];
}

export interface AvailableResource {
  resourceId: string;
  type: ResourceType;
  quantity: number;
  capacity: number;
  cost: number;
  location?: string;
}

export interface AllocatedResource {
  allocationId: string;
  resourceId: string;
  allocatedTo: string;
  quantity: number;
  startDate: Date;
  endDate?: Date;
  purpose: string;
}

export interface ResourceConstraint {
  constraintType: ConstraintType;
  description: string;
  impact: ImpactLevel;
  mitigationStrategies: string[];
}

export type ConstraintType = 'BUDGET' | 'CAPACITY' | 'REGULATORY' | 'TECHNICAL' | 'PERSONNEL';
export type ImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface UtilizationMetric {
  resourceType: ResourceType;
  currentUtilization: number;
  optimalUtilization: number;
  utilizationTrend: TrendDirection;
  recommendations: string[];
}

export interface OptimizationResult {
  optimizationId: string;
  currentState: ResourceAllocationState;
  optimizedState: ResourceAllocationState;
  improvementMetrics: ImprovementMetric[];
  implementationPlan: ImplementationStep[];
  estimatedSavings: CostSavings;
}

export interface ResourceAllocationState {
  totalCost: number;
  efficiency: number;
  resourceUtilization: ResourceUtilization[];
  performanceMetrics: PerformanceMetric[];
}

export interface ResourceUtilization {
  resourceType: ResourceType;
  utilizationPercentage: number;
  wastePercentage: number;
  bottlenecks: string[];
}

export interface PerformanceMetric {
  metricName: string;
  currentValue: number;
  targetValue: number;
  unitOfMeasure: string;
}

export interface ImprovementMetric {
  area: string;
  currentPerformance: number;
  projectedPerformance: number;
  improvementPercentage: number;
}

export interface ImplementationStep {
  stepNumber: number;
  description: string;
  requiredActions: string[];
  timeline: string;
  dependencies: string[];
  riskLevel: RiskLevel;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CostSavings {
  totalSavings: number;
  savingsByCategory: CategorySavings[];
  paybackPeriod: string;
  roi: number;
}

export interface CategorySavings {
  category: string;
  savings: number;
  percentage: number;
}

// ================================================================================================
// COMPLIANCE AND DATA ANALYSIS TYPES
// ================================================================================================

export interface ComplianceCheckRequest {
  checkId: string;
  countyId: string;
  complianceFrameworks: ComplianceFramework[];
  scopeAreas: string[];
  riskLevel: RiskLevel;
  scheduledDate?: Date;
}

export type ComplianceFramework = 'FISMA' | 'SOC2' | 'FEDRAMP' | 'NIST' | 'LOCAL_REGULATIONS';

export interface ComplianceIssue {
  issueId: string;
  frameworkViolated: ComplianceFramework;
  severity: IssueSeverity;
  description: string;
  affectedSystems: string[];
  remediationSteps: RemediationStep[];
  dueDate: Date;
  owner: string;
}

export type IssueSeverity = 'INFORMATIONAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RemediationStep {
  stepNumber: number;
  description: string;
  estimatedEffort: string;
  requiredSkills: string[];
  dependencies: string[];
}

export interface DataAnalysisRequest {
  analysisId: string;
  analysisType: AnalysisType;
  datasets: string[];
  timeRange: TimeRange;
  parameters: AnalysisParameter[];
  outputRequirements: OutputRequirement[];
}

export type AnalysisType = 
  | 'TREND_ANALYSIS'
  | 'CORRELATION_ANALYSIS'
  | 'PREDICTIVE_MODELING'
  | 'ANOMALY_DETECTION'
  | 'PERFORMANCE_ANALYSIS'
  | 'CITIZEN_BEHAVIOR_ANALYSIS';

export interface AnalysisParameter {
  parameterName: string;
  value: any;
  description: string;
}

export interface OutputRequirement {
  outputType: AnalysisOutputType;
  format: OutputFormat;
  deliveryMethod: DeliveryMethod;
}

export type AnalysisOutputType = 'SUMMARY' | 'DETAILED_REPORT' | 'VISUALIZATION' | 'RAW_DATA' | 'API_ENDPOINT';
export type DeliveryMethod = 'EMAIL' | 'DASHBOARD' | 'API' | 'FILE_SYSTEM' | 'DIRECT_INTEGRATION';

export interface DataInsights {
  analysisId: string;
  insights: Insight[];
  visualizations: Visualization[];
  recommendations: ActionableRecommendation[];
  confidence: number;
  limitationsAndCaveats: string[];
}

export interface Insight {
  type: InsightType;
  description: string;
  significance: SignificanceLevel;
  supportingEvidence: Evidence[];
  statisticalMetrics: StatisticalMetric[];
}

export type InsightType = 'TREND' | 'PATTERN' | 'ANOMALY' | 'CORRELATION' | 'PREDICTION';
export type SignificanceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Evidence {
  dataSource: string;
  evidenceType: string;
  value: any;
  context: string;
}

export interface StatisticalMetric {
  metricName: string;
  value: number;
  confidenceInterval?: number[];
  pValue?: number;
}

export interface Visualization {
  visualizationId: string;
  type: VisualizationType;
  title: string;
  data: any;
  configuration: VisualizationConfig;
}

export type VisualizationType = 'CHART' | 'MAP' | 'GRAPH' | 'HEATMAP' | 'DASHBOARD' | 'INTERACTIVE_PLOT';

export interface VisualizationConfig {
  width: number;
  height: number;
  colorScheme: string;
  interactive: boolean;
  exportFormats: string[];
}

export interface ActionableRecommendation {
  recommendationId: string;
  priority: TaskPriority;
  description: string;
  expectedOutcome: string;
  requiredActions: RequiredAction[];
  estimatedImpact: ImpactAssessment;
  implementation: ImplementationGuide;
}

export interface RequiredAction {
  actionId: string;
  description: string;
  owner: string;
  estimatedDuration: string;
  prerequisites: string[];
}

export interface ImplementationGuide {
  phases: ImplementationPhase[];
  totalTimeline: string;
  budget: BudgetEstimate;
  riskAssessment: RiskAssessment;
}

export interface ImplementationPhase {
  phaseNumber: number;
  name: string;
  description: string;
  duration: string;
  deliverables: string[];
  successCriteria: string[];
}

export interface BudgetEstimate {
  totalCost: number;
  costBreakdown: CostBreakdown[];
  contingency: number;
  fundingSources: FundingSource[];
}

export interface CostBreakdown {
  category: string;
  amount: number;
  justification: string;
}

export interface FundingSource {
  source: string;
  amount: number;
  availability: string;
  restrictions: string[];
}

export interface RiskAssessment {
  overallRisk: RiskLevel;
  riskFactors: RiskFactor[];
  mitigationStrategies: MitigationStrategy[];
}

export interface RiskFactor {
  factor: string;
  probability: number;
  impact: ImpactLevel;
  description: string;
}

export interface MitigationStrategy {
  riskFactor: string;
  strategy: string;
  effectiveness: number;
  cost: number;
}

// ================================================================================================
// CROSS-JURISDICTIONAL AND CORRELATION TYPES
// ================================================================================================

export interface CorrelationRequest {
  requestId: string;
  sourceCounties: string[];
  correlationTypes: CorrelationType[];
  timeRange: TimeRange;
  dataCategories: string[];
  confidenceThreshold: number;
}

export type CorrelationType = 'ECONOMIC' | 'DEMOGRAPHIC' | 'SERVICE_UTILIZATION' | 'POLICY_IMPACT' | 'RESOURCE_SHARING';

export interface CorrelationResult {
  requestId: string;
  correlations: CorrelationFinding[];
  crossCountyPatterns: CrossCountyPattern[];
  recommendations: CrossJurisdictionalRecommendation[];
  dataQuality: DataQualityAssessment;
}

export interface CorrelationFinding {
  correlationId: string;
  type: CorrelationType;
  counties: string[];
  strength: number; // -1 to 1
  significance: number; // 0 to 1
  description: string;
  variables: CorrelationVariable[];
}

export interface CorrelationVariable {
  variableName: string;
  county: string;
  value: number;
  normalizedValue: number;
  dataSource: string;
}

export interface CrossCountyPattern {
  patternId: string;
  name: string;
  description: string;
  counties: string[];
  confidence: number;
  implications: string[];
}

export interface CrossJurisdictionalRecommendation {
  recommendationId: string;
  type: RecommendationType;
  involvedCounties: string[];
  description: string;
  benefits: string[];
  implementationStrategy: string;
  estimatedSavings: number;
}

export type RecommendationType = 'RESOURCE_SHARING' | 'POLICY_COORDINATION' | 'SERVICE_COLLABORATION' | 'DATA_SHARING' | 'JOINT_PROCUREMENT';

export interface DataQualityAssessment {
  overallQuality: number; // 0 to 1
  qualityByCounty: CountyDataQuality[];
  missingDataPoints: MissingDataPoint[];
  recommendations: string[];
}

export interface CountyDataQuality {
  countyId: string;
  completeness: number;
  accuracy: number;
  timeliness: number;
  consistency: number;
}

export interface MissingDataPoint {
  county: string;
  dataCategory: string;
  missingFields: string[];
  impact: ImpactLevel;
}

// ================================================================================================
// LEGACY SYSTEM INTEGRATION TYPES
// ================================================================================================

export interface LegacyDataInput {
  sourceSystem: string;
  dataFormat: LegacyDataFormat;
  data: any;
  metadata: LegacyMetadata;
  transformationRules?: TransformationRule[];
}

export type LegacyDataFormat = 'COBOL_FIXED' | 'MAINFRAME_DB2' | 'EXCEL_LEGACY' | 'CSV_LEGACY' | 'XML_LEGACY' | 'PROPRIETARY';

export interface LegacyMetadata {
  systemVersion: string;
  recordFormat: string;
  encoding: string;
  dateFormats: string[];
  dataValidationRules: ValidationRule[];
}

export interface TransformationRule {
  sourceField: string;
  targetField: string;
  transformationType: TransformationType;
  parameters: any;
  validationRules: ValidationRule[];
}

export type TransformationType = 'DIRECT_MAPPING' | 'DATA_TYPE_CONVERSION' | 'FORMAT_TRANSFORMATION' | 'CALCULATED_FIELD' | 'LOOKUP_TABLE';

export interface ValidationRule {
  ruleType: ValidationRuleType;
  parameters: any;
  errorMessage: string;
}

export type ValidationRuleType = 'REQUIRED' | 'FORMAT' | 'RANGE' | 'CUSTOM_LOGIC' | 'REFERENCE_CHECK';

export interface ModernDataOutput {
  transformationId: string;
  modernFormat: ModernDataFormat;
  data: any;
  transformationSummary: TransformationSummary;
  qualityMetrics: DataQualityMetrics;
}

export type ModernDataFormat = 'JSON' | 'AVRO' | 'PARQUET' | 'POSTGRESQL' | 'REST_API';

export interface TransformationSummary {
  totalRecords: number;
  successfulTransformations: number;
  failedTransformations: number;
  warnings: TransformationWarning[];
  processingTime: number;
}

export interface TransformationWarning {
  recordId: string;
  warningType: string;
  description: string;
  suggestion: string;
}

export interface DataQualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  validity: number;
  uniqueness: number;
}

export interface MigrationPlan {
  planId: string;
  sourceSystems: LegacySystem[];
  targetArchitecture: TargetArchitecture;
  migrationStrategy: MigrationStrategy;
  timeline: MigrationTimeline;
  riskMitigation: RiskMitigation;
}

export interface LegacySystem {
  systemId: string;
  name: string;
  type: LegacySystemType;
  version: string;
  dataVolume: number;
  criticality: SystemCriticality;
  dependencies: string[];
}

export type LegacySystemType = 'MAINFRAME' | 'CLIENT_SERVER' | 'DESKTOP_APPLICATION' | 'FILE_BASED' | 'CUSTOM_DATABASE';
export type SystemCriticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'MISSION_CRITICAL';

export interface TargetArchitecture {
  architectureType: ArchitectureType;
  components: ArchitectureComponent[];
  dataFlow: DataFlowDiagram;
  securityModel: SecurityModel;
}

export type ArchitectureType = 'MICROSERVICES' | 'CLOUD_NATIVE' | 'HYBRID_CLOUD' | 'API_FIRST';

export interface ArchitectureComponent {
  componentId: string;
  name: string;
  type: ComponentType;
  responsibilities: string[];
  interfaces: ComponentInterface[];
}

export type ComponentType = 'API_GATEWAY' | 'MICROSERVICE' | 'DATABASE' | 'CACHE' | 'MESSAGE_QUEUE' | 'SECURITY_SERVICE';

export interface ComponentInterface {
  interfaceType: InterfaceType;
  protocol: string;
  dataFormat: string;
  authentication: string;
}

export type InterfaceType = 'REST_API' | 'GRAPHQL' | 'GRPC' | 'MESSAGE_QUEUE' | 'DATABASE_CONNECTION';

export interface DataFlowDiagram {
  flows: DataFlow[];
  storagePoints: DataStoragePoint[];
  processingSteps: DataProcessingStep[];
}

export interface DataFlow {
  flowId: string;
  source: string;
  destination: string;
  dataType: string;
  frequency: FlowFrequency;
  volume: number;
}

export type FlowFrequency = 'REAL_TIME' | 'BATCH_HOURLY' | 'BATCH_DAILY' | 'ON_DEMAND';

export interface DataStoragePoint {
  storageId: string;
  type: StorageType;
  capacity: string;
  backupStrategy: string;
  retentionPolicy: string;
}

export type StorageType = 'POSTGRESQL' | 'REDIS' | 'ELASTICSEARCH' | 'OBJECT_STORAGE' | 'DATA_WAREHOUSE';

export interface DataProcessingStep {
  stepId: string;
  type: ProcessingType;
  inputSources: string[];
  outputDestinations: string[];
  processingLogic: string;
}

export type ProcessingType = 'VALIDATION' | 'TRANSFORMATION' | 'ENRICHMENT' | 'AGGREGATION' | 'ANALYSIS';

export interface SecurityModel {
  authenticationMethods: AuthenticationMethod[];
  authorizationStrategy: AuthorizationStrategy;
  dataEncryption: EncryptionStrategy;
  auditingRequirements: AuditingRequirement[];
}

export interface AuthenticationMethod {
  method: AuthMethodType;
  provider: string;
  configuration: any;
}

export type AuthMethodType = 'SSO' | 'OAUTH2' | 'SAML' | 'LDAP' | 'MULTI_FACTOR';

export interface AuthorizationStrategy {
  model: AuthorizationModel;
  roles: Role[];
  permissions: Permission[];
  policies: AuthorizationPolicy[];
}

export type AuthorizationModel = 'RBAC' | 'ABAC' | 'HYBRID';

export interface Role {
  roleId: string;
  name: string;
  description: string;
  permissions: string[];
  inheritsFrom: string[];
}

export interface Permission {
  permissionId: string;
  name: string;
  resource: string;
  action: string;
  conditions: PermissionCondition[];
}

export interface PermissionCondition {
  attribute: string;
  operator: string;
  value: any;
}

export interface AuthorizationPolicy {
  policyId: string;
  name: string;
  rules: PolicyRule[];
  effect: PolicyEffect;
}

export interface PolicyRule {
  condition: string;
  action: string;
  resource: string;
}

export type PolicyEffect = 'ALLOW' | 'DENY' | 'CONDITIONAL';

export interface EncryptionStrategy {
  atRest: EncryptionConfig;
  inTransit: EncryptionConfig;
  inUse: EncryptionConfig;
  keyManagement: KeyManagementStrategy;
}

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  mode: string;
  quantumResistant: boolean;
}

export interface KeyManagementStrategy {
  keyStorage: KeyStorageType;
  rotationPolicy: KeyRotationPolicy;
  escrowPolicy: KeyEscrowPolicy;
}

export type KeyStorageType = 'HSM' | 'CLOUD_KMS' | 'VAULT' | 'DISTRIBUTED';

export interface KeyRotationPolicy {
  frequency: string;
  triggerConditions: string[];
  automationLevel: AutomationLevel;
}

export type AutomationLevel = 'FULLY_AUTOMATED' | 'SEMI_AUTOMATED' | 'MANUAL';

export interface KeyEscrowPolicy {
  required: boolean;
  escrowAgents: string[];
  recoveryProcedure: string;
}

export interface AuditingRequirement {
  auditType: AuditType;
  scope: string[];
  retention: string;
  reportingFrequency: string;
}

export type AuditType = 'ACCESS_LOGS' | 'DATA_CHANGES' | 'SYSTEM_EVENTS' | 'SECURITY_EVENTS' | 'COMPLIANCE_EVENTS';

export interface MigrationStrategy {
  approach: MigrationApproach;
  phases: MigrationPhase[];
  rollbackPlan: RollbackPlan;
  testingStrategy: TestingStrategy;
}

export type MigrationApproach = 'BIG_BANG' | 'PHASED' | 'PARALLEL_RUN' | 'HYBRID';

export interface MigrationPhase {
  phaseId: string;
  name: string;
  description: string;
  prerequisites: string[];
  deliverables: string[];
  successCriteria: string[];
  duration: string;
}

export interface RollbackPlan {
  triggerConditions: string[];
  rollbackSteps: RollbackStep[];
  dataRecoveryStrategy: string;
  timeToRollback: string;
}

export interface RollbackStep {
  stepId: string;
  description: string;
  executionOrder: number;
  automationLevel: AutomationLevel;
}

export interface TestingStrategy {
  testTypes: TestType[];
  testEnvironments: TestEnvironment[];
  acceptanceCriteria: AcceptanceCriteria[];
}

export type TestType = 'UNIT' | 'INTEGRATION' | 'SYSTEM' | 'USER_ACCEPTANCE' | 'PERFORMANCE' | 'SECURITY';

export interface TestEnvironment {
  environmentId: string;
  name: string;
  purpose: string;
  dataStrategy: TestDataStrategy;
}

export type TestDataStrategy = 'PRODUCTION_COPY' | 'SYNTHETIC' | 'MASKED_PRODUCTION' | 'MINIMAL_DATASET';

export interface AcceptanceCriteria {
  criteriaId: string;
  description: string;
  measurableOutcome: string;
  passingThreshold: any;
}

export interface MigrationTimeline {
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  dependencies: Dependency[];
}

export interface Milestone {
  milestoneId: string;
  name: string;
  date: Date;
  deliverables: string[];
  criticality: MilestoneCriticality;
}

export type MilestoneCriticality = 'NICE_TO_HAVE' | 'IMPORTANT' | 'CRITICAL' | 'BLOCKING';

export interface Dependency {
  dependencyId: string;
  type: DependencyType;
  source: string;
  target: string;
  description: string;
}

export type DependencyType = 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';

export interface RiskMitigation {
  identifiedRisks: IdentifiedRisk[];
  mitigationStrategies: MitigationStrategy[];
  contingencyPlans: ContingencyPlan[];
}

export interface IdentifiedRisk {
  riskId: string;
  description: string;
  category: RiskCategory;
  probability: number;
  impact: number;
  riskScore: number;
}

export type RiskCategory = 'TECHNICAL' | 'RESOURCE' | 'SCHEDULE' | 'BUDGET' | 'ORGANIZATIONAL' | 'EXTERNAL';

export interface ContingencyPlan {
  planId: string;
  triggerConditions: string[];
  actions: ContingencyAction[];
  resourceRequirements: string[];
}

export interface ContingencyAction {
  actionId: string;
  description: string;
  owner: string;
  timeline: string;
}

export interface MigrationResult {
  migrationId: string;
  status: MigrationStatus;
  completedPhases: string[];
  currentPhase: string;
  metrics: MigrationMetrics;
  issues: MigrationIssue[];
}

export type MigrationStatus = 'IN_PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PAUSED';

export interface MigrationMetrics {
  dataMigrated: DataMigrationMetric[];
  performance: PerformanceMetric[];
  quality: DataQualityMetrics;
  userAdoption: UserAdoptionMetric[];
}

export interface DataMigrationMetric {
  dataType: string;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  processingTime: number;
}

export interface UserAdoptionMetric {
  userGroup: string;
  totalUsers: number;
  activeUsers: number;
  adoptionRate: number;
  satisfactionScore: number;
}

export interface MigrationIssue {
  issueId: string;
  severity: IssueSeverity;
  category: IssueCategory;
  description: string;
  impact: string;
  resolution: string;
  status: IssueStatus;
}

export type IssueCategory = 'DATA_QUALITY' | 'PERFORMANCE' | 'FUNCTIONALITY' | 'USABILITY' | 'INTEGRATION';
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

// ================================================================================================
// ADDITIONAL CORE TYPES AND INTERFACES
// ================================================================================================

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export type TaskPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BACKGROUND';

export interface AuditEntry {
  id: string;
  taskId: string;
  action: string;
  timestamp: Date;
  details: any;
}

export interface ValidationResult {
  isValid: boolean;
  validationDetails: string;
  humanAuthorityConfirmed: boolean;
}

export interface AuditReport {
  reportId: string;
  timeRange: TimeRange;
  totalActions: number;
  humanDecisions: number;
  aiRecommendations: number;
  complianceScore: number;
  findings: AuditFinding[];
}

export interface AuditFinding {
  findingId: string;
  type: FindingType;
  severity: IssueSeverity;
  description: string;
  recommendation: string;
}

export type FindingType = 'COMPLIANCE_VIOLATION' | 'SECURITY_ISSUE' | 'PERFORMANCE_ISSUE' | 'PROCESS_IMPROVEMENT';

export interface SecurityVulnerability {
  vulnerabilityId: string;
  type: VulnerabilityType;
  severity: IssueSeverity;
  description: string;
  affectedSystems: string[];
  remediation: string;
}

export type VulnerabilityType = 'INJECTION' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'ENCRYPTION' | 'CONFIGURATION';