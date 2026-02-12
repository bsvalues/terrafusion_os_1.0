// TerraFusion Codex: 3-6-9 Framework - Extended Implementation
// Elite Systems Architecture by MIT PhD Agent
// Comprehensive multi-domain implementation for government OS excellence

/**
 * Core Constants
 */
const FOUNDATION_MAX = 12;
const AMPLIFICATION_THRESHOLD = 666;
const AMPLIFICATION_SCALE = AMPLIFICATION_THRESHOLD / FOUNDATION_MAX; // 55.5

/**
 * Base Types
 */
export type AlertLevel = 'green' | 'yellow' | 'red' | 'critical';
export type Trend = 'improving' | 'stable' | 'declining';
export type Environment = 'development' | 'staging' | 'production';

/**
 * Foundation: Core metric scaling (0-12)
 */
export function scaleMetric(value: number, min: number = 0, max: number = 12): number {
  if (value < min) return 0;
  if (value > max) return FOUNDATION_MAX;
  const normalized = (value - min) / (max - min);
  return Math.min(normalized * FOUNDATION_MAX, FOUNDATION_MAX);
}

/**
 * Foundation: Inverse scaling (lower is better)
 */
export function scaleMetricInverse(value: number, min: number, max: number): number {
  if (value <= min) return FOUNDATION_MAX;
  if (value >= max) return 0;
  const normalized = (max - value) / (max - min);
  return Math.min(normalized * FOUNDATION_MAX, FOUNDATION_MAX);
}

/**
 * Amplification: Combine metrics, cap at 666, scale to 12
 */
export function amplifyMetrics(metrics: number[]): number {
  const sum = metrics.reduce((a, b) => a + b, 0);
  const capped = Math.min(sum, AMPLIFICATION_THRESHOLD);
  return capped / AMPLIFICATION_SCALE;
}

/**
 * Amplification: Weighted combination
 */
export function amplifyMetricsWeighted(metrics: number[], weights: number[]): number {
  if (metrics.length !== weights.length) {
    throw new Error('Metrics and weights arrays must have same length');
  }

  const weightedSum = metrics.reduce((acc, metric, i) => acc + (metric * weights[i]), 0);
  const capped = Math.min(weightedSum, AMPLIFICATION_THRESHOLD);
  return capped / AMPLIFICATION_SCALE;
}

/**
 * Ultimate Power: Normalize sum to aim for 12
 */
export function ultimatePower(metrics: number[]): number {
  const total = metrics.reduce((a, b) => a + b, 0);
  const average = total / metrics.length;
  return Math.min((average / FOUNDATION_MAX) * FOUNDATION_MAX, FOUNDATION_MAX);
}

/**
 * ========================================
 * DOMAIN 1: SYSTEM PERFORMANCE & HEALTH
 * ========================================
 */
export interface SystemPerformanceMetrics {
  apiLatency: number;           // ms
  memoryUsage: number;          // percentage
  cpuLoad: number;              // percentage
  dbQueryTime: number;          // ms
  errorRate: number;            // percentage
  uptime: number;               // percentage
}

export function scaleSystemPerformance(metrics: SystemPerformanceMetrics): SystemPerformanceMetrics {
  return {
    apiLatency: scaleMetricInverse(metrics.apiLatency, 100, 1000),
    memoryUsage: scaleMetricInverse(metrics.memoryUsage, 50, 95),
    cpuLoad: scaleMetricInverse(metrics.cpuLoad, 30, 90),
    dbQueryTime: scaleMetricInverse(metrics.dbQueryTime, 50, 500),
    errorRate: scaleMetricInverse(metrics.errorRate, 0, 5),
    uptime: scaleMetric(metrics.uptime, 95, 100)
  };
}

export function amplifySystemHealth(metrics: SystemPerformanceMetrics): number {
  const scaled = scaleSystemPerformance(metrics);
  return amplifyMetrics(Object.values(scaled));
}

/**
 * ========================================
 * DOMAIN 2: AI AGENT SWARM (1,008 AGENTS)
 * ========================================
 */
export interface AISwarmMetrics {
  agentHealth: number;          // percentage
  taskCompletionRate: number;   // percentage
  coordinationEfficiency: number; // percentage
  responseTime: number;         // ms
  resourceUtilization: number;  // percentage
  learningRate: number;         // percentage improvement
  quantumCoherence: number;     // percentage
  decisionQuality: number;      // percentage
}

export interface AgentHierarchyMetrics {
  coordinators: AISwarmMetrics;
  fieldGenerals: AISwarmMetrics;
  microAgents: AISwarmMetrics;
}

export function scaleAISwarm(metrics: AISwarmMetrics): AISwarmMetrics {
  return {
    agentHealth: scaleMetric(metrics.agentHealth, 90, 100),
    taskCompletionRate: scaleMetric(metrics.taskCompletionRate, 90, 100),
    coordinationEfficiency: scaleMetric(metrics.coordinationEfficiency, 80, 100),
    responseTime: scaleMetricInverse(metrics.responseTime, 200, 1000),
    resourceUtilization: scaleMetric(metrics.resourceUtilization, 60, 80), // Optimal range
    learningRate: scaleMetric(metrics.learningRate, 0, 10),
    quantumCoherence: scaleMetric(metrics.quantumCoherence, 90, 100),
    decisionQuality: scaleMetric(metrics.decisionQuality, 95, 100)
  };
}

export function amplifyAgentHierarchy(hierarchy: AgentHierarchyMetrics): number {
  const coordinatorPower = ultimatePower(Object.values(scaleAISwarm(hierarchy.coordinators))) * 3;
  const fieldGeneralPower = ultimatePower(Object.values(scaleAISwarm(hierarchy.fieldGenerals))) * 2;
  const microAgentPower = ultimatePower(Object.values(scaleAISwarm(hierarchy.microAgents))) * 1;

  const totalPower = coordinatorPower + fieldGeneralPower + microAgentPower;
  const capped = Math.min(totalPower, AMPLIFICATION_THRESHOLD);
  return capped / AMPLIFICATION_SCALE;
}

/**
 * ========================================
 * DOMAIN 3: CODE QUALITY & ENGINEERING
 * ========================================
 */
export interface CodeQualityMetrics {
  testCoverage: number;         // percentage
  testPassRate: number;         // percentage
  codeComplexity: number;       // cyclomatic complexity
  technicalDebt: number;        // hours
  securityVulns: number;        // count
  docCoverage: number;          // percentage
  buildSuccessRate: number;     // percentage
  lintErrors: number;           // count
}

export function scaleCodeQuality(metrics: CodeQualityMetrics): CodeQualityMetrics {
  return {
    testCoverage: scaleMetric(metrics.testCoverage, 80, 100),
    testPassRate: scaleMetric(metrics.testPassRate, 90, 100),
    codeComplexity: scaleMetricInverse(metrics.codeComplexity, 5, 15),
    technicalDebt: scaleMetricInverse(metrics.technicalDebt, 0, 100),
    securityVulns: scaleMetricInverse(metrics.securityVulns, 0, 5),
    docCoverage: scaleMetric(metrics.docCoverage, 70, 100),
    buildSuccessRate: scaleMetric(metrics.buildSuccessRate, 95, 100),
    lintErrors: scaleMetricInverse(metrics.lintErrors, 0, 50)
  };
}

export function amplifyEngineeringExcellence(metrics: CodeQualityMetrics): number {
  const scaled = scaleCodeQuality(metrics);

  // Critical metrics weighted higher
  const criticalMetrics = [
    scaled.testCoverage * 2,
    scaled.securityVulns * 2,
    scaled.buildSuccessRate * 1.5
  ];

  const standardMetrics = [
    scaled.testPassRate,
    scaled.codeComplexity,
    scaled.technicalDebt,
    scaled.docCoverage,
    scaled.lintErrors
  ];

  const total = [...criticalMetrics, ...standardMetrics].reduce((a, b) => a + b, 0);
  const capped = Math.min(total, AMPLIFICATION_THRESHOLD);
  return capped / AMPLIFICATION_SCALE;
}

/**
 * ========================================
 * DOMAIN 4: GOVERNMENT COMPLIANCE (FISMA)
 * ========================================
 */
export interface ComplianceMetrics {
  auditCompleteness: number;    // percentage
  securityControls: number;     // count active
  dataEncryption: number;       // percentage
  accessControl: number;        // percentage compliant
  incidentResponse: number;     // minutes
  patchingCadence: number;      // hours
  nistControls: number;         // count met
  dataIsolation: number;        // percentage
  accessibility: number;        // percentage WCAG 2.1 AA
}

export function scaleCompliance(metrics: ComplianceMetrics): ComplianceMetrics {
  return {
    auditCompleteness: scaleMetric(metrics.auditCompleteness, 95, 100),
    securityControls: scaleMetric(metrics.securityControls, 90, 100),
    dataEncryption: scaleMetric(metrics.dataEncryption, 95, 100),
    accessControl: scaleMetric(metrics.accessControl, 95, 100),
    incidentResponse: scaleMetricInverse(metrics.incidentResponse, 5, 30),
    patchingCadence: scaleMetricInverse(metrics.patchingCadence, 12, 72),
    nistControls: scaleMetric(metrics.nistControls, 90, 100),
    dataIsolation: scaleMetric(metrics.dataIsolation, 98, 100),
    accessibility: scaleMetric(metrics.accessibility, 95, 100)
  };
}

export function amplifyFISMACompliance(metrics: ComplianceMetrics): number {
  const scaled = scaleCompliance(metrics);
  const allMetrics = Object.values(scaled);
  const sum = allMetrics.reduce((a, b) => a + b, 0);
  const capped = Math.min(sum, AMPLIFICATION_THRESHOLD);

  // For government, apply stricter threshold
  const baseScore = capped / AMPLIFICATION_SCALE;
  return baseScore >= 10 ? baseScore : baseScore * 0.8;
}

/**
 * ========================================
 * DOMAIN 5: DATABASE & DATA MANAGEMENT
 * ========================================
 */
export interface DatabaseMetrics {
  queryPerformance: number;     // ms average
  connectionHealth: number;     // percentage
  dataIntegrity: number;        // percentage
  replicationLag: number;       // ms
  indexEfficiency: number;      // percentage
  backupSuccess: number;        // percentage
  storageUtilization: number;   // percentage
  throughput: number;           // transactions/sec
}

export function scaleDatabase(metrics: DatabaseMetrics): DatabaseMetrics {
  return {
    queryPerformance: scaleMetricInverse(metrics.queryPerformance, 50, 500),
    connectionHealth: scaleMetric(metrics.connectionHealth, 90, 100),
    dataIntegrity: scaleMetric(metrics.dataIntegrity, 99, 100),
    replicationLag: scaleMetricInverse(metrics.replicationLag, 100, 1000),
    indexEfficiency: scaleMetric(metrics.indexEfficiency, 80, 100),
    backupSuccess: scaleMetric(metrics.backupSuccess, 99, 100),
    storageUtilization: scaleMetricInverse(metrics.storageUtilization, 40, 90),
    throughput: scaleMetric(metrics.throughput, 100, 1000)
  };
}

/**
 * ========================================
 * DOMAIN 6: USER EXPERIENCE & FRONTEND
 * ========================================
 */
export interface UXMetrics {
  lcp: number;                  // Largest Contentful Paint (ms)
  fid: number;                  // First Input Delay (ms)
  cls: number;                  // Cumulative Layout Shift
  tti: number;                  // Time to Interactive (ms)
  bundleSize: number;           // KB
  a11yScore: number;            // percentage
  satisfaction: number;         // percentage
  errorFreeSessions: number;    // percentage
}

export function scaleUX(metrics: UXMetrics): UXMetrics {
  return {
    lcp: scaleMetricInverse(metrics.lcp, 2500, 4000),
    fid: scaleMetricInverse(metrics.fid, 100, 300),
    cls: scaleMetricInverse(metrics.cls, 0.1, 0.25),
    tti: scaleMetricInverse(metrics.tti, 3800, 7000),
    bundleSize: scaleMetricInverse(metrics.bundleSize, 500, 2000),
    a11yScore: scaleMetric(metrics.a11yScore, 95, 100),
    satisfaction: scaleMetric(metrics.satisfaction, 80, 100),
    errorFreeSessions: scaleMetric(metrics.errorFreeSessions, 95, 100)
  };
}

export function amplifyCoreWebVitals(metrics: UXMetrics): number {
  const scaled = scaleUX(metrics);

  // Core Web Vitals weighted heavily
  const coreVitals = [
    scaled.lcp * 2,
    scaled.fid * 2,
    scaled.cls * 2
  ];

  const supportingMetrics = [
    scaled.tti,
    scaled.bundleSize,
    scaled.a11yScore,
    scaled.satisfaction,
    scaled.errorFreeSessions
  ];

  const total = [...coreVitals, ...supportingMetrics].reduce((a, b) => a + b, 0);
  const capped = Math.min(total, AMPLIFICATION_THRESHOLD);
  return capped / AMPLIFICATION_SCALE;
}

/**
 * ========================================
 * DOMAIN 7: PROPERTY ASSESSMENT
 * ========================================
 */
export interface PropertyAssessmentMetrics {
  valuationAccuracy: number;    // percentage
  completionRate: number;       // percentage
  harrisSyncSuccess: number;    // percentage
  taxAccuracy: number;          // percentage
  appealResolution: number;     // days
  aiPredictionAccuracy: number; // percentage
  dataQuality: number;          // percentage
  stateCompliance: number;      // percentage
}

export function scalePropertyAssessment(metrics: PropertyAssessmentMetrics): PropertyAssessmentMetrics {
  return {
    valuationAccuracy: scaleMetric(metrics.valuationAccuracy, 90, 100),
    completionRate: scaleMetric(metrics.completionRate, 95, 100),
    harrisSyncSuccess: scaleMetric(metrics.harrisSyncSuccess, 98, 100),
    taxAccuracy: scaleMetric(metrics.taxAccuracy, 99, 100),
    appealResolution: scaleMetricInverse(metrics.appealResolution, 10, 60),
    aiPredictionAccuracy: scaleMetric(metrics.aiPredictionAccuracy, 90, 100),
    dataQuality: scaleMetric(metrics.dataQuality, 95, 100),
    stateCompliance: scaleMetric(metrics.stateCompliance, 98, 100)
  };
}

export function amplifyCountyOperations(metrics: PropertyAssessmentMetrics): number {
  const scaled = scalePropertyAssessment(metrics);

  // Accuracy metrics are critical for government
  const criticalMetrics = [
    scaled.valuationAccuracy * 2.5,
    scaled.taxAccuracy * 2.5,
    scaled.stateCompliance * 2
  ];

  const operationalMetrics = [
    scaled.completionRate,
    scaled.harrisSyncSuccess,
    scaled.appealResolution,
    scaled.aiPredictionAccuracy,
    scaled.dataQuality
  ];

  const total = [...criticalMetrics, ...operationalMetrics].reduce((a, b) => a + b, 0);
  const capped = Math.min(total, AMPLIFICATION_THRESHOLD);
  return capped / AMPLIFICATION_SCALE;
}

/**
 * ========================================
 * DOMAIN 8: INTEGRATION HEALTH
 * ========================================
 */
export interface IntegrationMetrics {
  connectionUptime: number;     // percentage
  syncSuccessRate: number;      // percentage
  dataConsistency: number;      // percentage
  errorRate: number;            // percentage
  latency: number;              // ms
  dataFreshness: number;        // seconds
  transformAccuracy: number;    // percentage
  rollbackSuccess: number;      // percentage
}

export function scaleIntegration(metrics: IntegrationMetrics): IntegrationMetrics {
  return {
    connectionUptime: scaleMetric(metrics.connectionUptime, 99, 100),
    syncSuccessRate: scaleMetric(metrics.syncSuccessRate, 98, 100),
    dataConsistency: scaleMetric(metrics.dataConsistency, 99, 100),
    errorRate: scaleMetricInverse(metrics.errorRate, 0, 2),
    latency: scaleMetricInverse(metrics.latency, 100, 500),
    dataFreshness: scaleMetricInverse(metrics.dataFreshness, 10, 300),
    transformAccuracy: scaleMetric(metrics.transformAccuracy, 99, 100),
    rollbackSuccess: scaleMetric(metrics.rollbackSuccess, 98, 100)
  };
}

/**
 * ========================================
 * DOMAIN 9: RESOURCE EFFICIENCY
 * ========================================
 */
export interface ResourceMetrics {
  cpuEfficiency: number;        // percentage
  memoryEfficiency: number;     // percentage
  networkEfficiency: number;    // percentage
  storageEfficiency: number;    // percentage
  costPerTransaction: number;   // dollars
  energyEfficiency: number;     // percentage
  utilizationRate: number;      // percentage
  wasteRatio: number;           // percentage
}

export function scaleResources(metrics: ResourceMetrics): ResourceMetrics {
  return {
    cpuEfficiency: scaleMetric(metrics.cpuEfficiency, 70, 90),
    memoryEfficiency: scaleMetric(metrics.memoryEfficiency, 70, 90),
    networkEfficiency: scaleMetric(metrics.networkEfficiency, 80, 95),
    storageEfficiency: scaleMetric(metrics.storageEfficiency, 70, 90),
    costPerTransaction: scaleMetricInverse(metrics.costPerTransaction, 0.01, 0.10),
    energyEfficiency: scaleMetric(metrics.energyEfficiency, 80, 95),
    utilizationRate: scaleMetric(metrics.utilizationRate, 70, 80), // Optimal range
    wasteRatio: scaleMetricInverse(metrics.wasteRatio, 0, 20)
  };
}

/**
 * ========================================
 * DOMAIN 10: DEVOPS & CI/CD
 * ========================================
 */
export interface DevOpsMetrics {
  deploymentFrequency: number;  // per day
  deploymentSuccess: number;    // percentage
  mttr: number;                 // hours (Mean Time To Recovery)
  leadTime: number;             // hours
  changeFailureRate: number;    // percentage
  pipelineTime: number;         // minutes
  environmentParity: number;    // percentage
  automatedTestCoverage: number; // percentage
}

export function scaleDevOps(metrics: DevOpsMetrics): DevOpsMetrics {
  return {
    deploymentFrequency: scaleMetric(metrics.deploymentFrequency, 1, 10),
    deploymentSuccess: scaleMetric(metrics.deploymentSuccess, 95, 100),
    mttr: scaleMetricInverse(metrics.mttr, 0.5, 4),
    leadTime: scaleMetricInverse(metrics.leadTime, 4, 48),
    changeFailureRate: scaleMetricInverse(metrics.changeFailureRate, 0, 15),
    pipelineTime: scaleMetricInverse(metrics.pipelineTime, 5, 30),
    environmentParity: scaleMetric(metrics.environmentParity, 95, 100),
    automatedTestCoverage: scaleMetric(metrics.automatedTestCoverage, 80, 100)
  };
}

/**
 * ========================================
 * DOMAIN 11: SECURITY & THREAT DETECTION
 * ========================================
 */
export interface SecurityMetrics {
  intrusionDetection: number;   // percentage active
  vulnerabilityScan: number;    // critical count
  encryptionCoverage: number;   // percentage
  authSuccess: number;          // percentage
  authFailures: number;         // count per hour
  securityResponse: number;     // minutes
  complianceViolations: number; // count
  dataLossPrevention: number;   // percentage
}

export function scaleSecurity(metrics: SecurityMetrics): SecurityMetrics {
  return {
    intrusionDetection: scaleMetric(metrics.intrusionDetection, 95, 100),
    vulnerabilityScan: scaleMetricInverse(metrics.vulnerabilityScan, 0, 3),
    encryptionCoverage: scaleMetric(metrics.encryptionCoverage, 98, 100),
    authSuccess: scaleMetric(metrics.authSuccess, 99, 100),
    authFailures: scaleMetricInverse(metrics.authFailures, 0, 10),
    securityResponse: scaleMetricInverse(metrics.securityResponse, 2, 30),
    complianceViolations: scaleMetricInverse(metrics.complianceViolations, 0, 3),
    dataLossPrevention: scaleMetric(metrics.dataLossPrevention, 99, 100)
  };
}

/**
 * ========================================
 * DOMAIN 12: CITIZEN EXPERIENCE
 * ========================================
 */
export interface CitizenExperienceMetrics {
  serviceAvailability: number;  // percentage
  resolutionTime: number;       // hours
  satisfaction: number;         // percentage
  selfServiceAdoption: number;  // percentage
  accessibility: number;        // percentage
  multilingualSupport: number;  // percentage
  mobileExperience: number;     // score 0-100
  issueResolution: number;      // percentage
}

export function scaleCitizenExperience(metrics: CitizenExperienceMetrics): CitizenExperienceMetrics {
  return {
    serviceAvailability: scaleMetric(metrics.serviceAvailability, 99, 100),
    resolutionTime: scaleMetricInverse(metrics.resolutionTime, 2, 48),
    satisfaction: scaleMetric(metrics.satisfaction, 80, 100),
    selfServiceAdoption: scaleMetric(metrics.selfServiceAdoption, 50, 90),
    accessibility: scaleMetric(metrics.accessibility, 95, 100),
    multilingualSupport: scaleMetric(metrics.multilingualSupport, 80, 100),
    mobileExperience: scaleMetric(metrics.mobileExperience, 85, 100),
    issueResolution: scaleMetric(metrics.issueResolution, 90, 100)
  };
}

/**
 * ========================================
 * SYSTEM-WIDE CODEX
 * ========================================
 */
export interface SystemWideCodex {
  systemPerformance: SystemPerformanceMetrics;
  aiSwarm: AgentHierarchyMetrics;
  codeQuality: CodeQualityMetrics;
  compliance: ComplianceMetrics;
  database: DatabaseMetrics;
  ux: UXMetrics;
  propertyAssessment: PropertyAssessmentMetrics;
  integration: IntegrationMetrics;
  resources: ResourceMetrics;
  devops: DevOpsMetrics;
  security: SecurityMetrics;
  citizenExperience: CitizenExperienceMetrics;
}

export function calculateSystemWideUltimatePower(codex: SystemWideCodex): number {
  const domainScores = [
    amplifySystemHealth(codex.systemPerformance),
    amplifyAgentHierarchy(codex.aiSwarm),
    amplifyEngineeringExcellence(codex.codeQuality),
    amplifyFISMACompliance(codex.compliance),
    amplifyMetrics(Object.values(scaleDatabase(codex.database))),
    amplifyCoreWebVitals(codex.ux),
    amplifyCountyOperations(codex.propertyAssessment),
    amplifyMetrics(Object.values(scaleIntegration(codex.integration))),
    amplifyMetrics(Object.values(scaleResources(codex.resources))),
    amplifyMetrics(Object.values(scaleDevOps(codex.devops))),
    amplifyMetrics(Object.values(scaleSecurity(codex.security))),
    amplifyMetrics(Object.values(scaleCitizenExperience(codex.citizenExperience)))
  ];

  return ultimatePower(domainScores);
}

/**
 * ========================================
 * ALERT & THRESHOLD SYSTEM
 * ========================================
 */
export interface AlertThreshold {
  score: number;
  level: AlertLevel;
  action: string;
}

export function determineAlertLevel(score: number): AlertThreshold {
  if (score >= 10) {
    return { score, level: 'green', action: 'Monitor' };
  } else if (score >= 8) {
    return { score, level: 'yellow', action: 'Review and optimize' };
  } else if (score >= 6) {
    return { score, level: 'red', action: 'Immediate attention required' };
  } else {
    return { score, level: 'critical', action: 'Emergency response - all hands on deck' };
  }
}

/**
 * ========================================
 * TIME-SERIES & TREND ANALYSIS
 * ========================================
 */
export interface TimeSeriesCodex {
  timestamp: Date;
  ultimatePower: number;
  domainScores: Map<string, number>;
  alertLevel: AlertLevel;
}

export function calculateTrend(history: TimeSeriesCodex[]): Trend {
  if (history.length < 2) return 'stable';

  const recentCount = Math.min(5, history.length);
  const olderCount = Math.min(5, history.length - recentCount);

  if (olderCount === 0) return 'stable';

  const recent = history.slice(-recentCount);
  const avgRecent = recent.reduce((a, b) => a + b.ultimatePower, 0) / recent.length;

  const older = history.slice(-(recentCount + olderCount), -recentCount);
  const avgOlder = older.reduce((a, b) => a + b.ultimatePower, 0) / older.length;

  if (avgRecent > avgOlder * 1.05) return 'improving';
  if (avgRecent < avgOlder * 0.95) return 'declining';
  return 'stable';
}

/**
 * ========================================
 * COMPARATIVE ANALYSIS
 * ========================================
 */
export interface ComparativeCodex {
  environment: Environment;
  county: string;
  ultimatePower: number;
}

export interface ComparisonResult {
  best: ComparativeCodex;
  worst: ComparativeCodex;
  average: number;
}

export function compareEnvironments(codices: ComparativeCodex[]): ComparisonResult {
  if (codices.length === 0) {
    throw new Error('Cannot compare empty codex array');
  }

  const sorted = [...codices].sort((a, b) => b.ultimatePower - a.ultimatePower);
  const average = codices.reduce((a, c) => a + c.ultimatePower, 0) / codices.length;

  return {
    best: sorted[0],
    worst: sorted[sorted.length - 1],
    average
  };
}

/**
 * ========================================
 * BALANCED SCORECARD
 * ========================================
 */
export interface WeightedCodex {
  domain: string;
  weight: number;  // 0.5 to 2.0
  score: number;
}

export interface BalancedScorecard {
  ultimatePower: number;
  isBalanced: boolean;
  weakestDomain: WeightedCodex;
}

export function calculateWeightedUltimatePower(domains: WeightedCodex[]): number {
  const weightedSum = domains.reduce((acc, d) => acc + (d.score * d.weight), 0);
  const totalWeight = domains.reduce((acc, d) => acc + d.weight, 0);
  const average = weightedSum / totalWeight;
  return Math.min(average, FOUNDATION_MAX);
}

export function balancedScorecard(domains: WeightedCodex[]): BalancedScorecard {
  const ultimatePower = calculateWeightedUltimatePower(domains);

  const weakest = domains.reduce((min, d) =>
    d.score < min.score ? d : min
  );

  const isBalanced = domains.every(d => d.score >= 6);

  return {
    ultimatePower,
    isBalanced,
    weakestDomain: weakest
  };
}

/**
 * ========================================
 * EXPORT ALL
 * ========================================
 */
export default {
  // Core functions
  scaleMetric,
  scaleMetricInverse,
  amplifyMetrics,
  amplifyMetricsWeighted,
  ultimatePower,

  // Domain-specific amplifiers
  amplifySystemHealth,
  amplifyAgentHierarchy,
  amplifyEngineeringExcellence,
  amplifyFISMACompliance,
  amplifyCoreWebVitals,
  amplifyCountyOperations,

  // System-wide
  calculateSystemWideUltimatePower,

  // Analysis
  determineAlertLevel,
  calculateTrend,
  compareEnvironments,
  balancedScorecard,
  calculateWeightedUltimatePower,

  // Constants
  FOUNDATION_MAX,
  AMPLIFICATION_THRESHOLD,
  AMPLIFICATION_SCALE
};
