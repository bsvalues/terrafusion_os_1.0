// TrueAutomation/PACS Quantum AI Type Definitions
// MIT PhD-Level Analytics Platform Types

export interface AdvancedAIMetrics {
  // Swarm Intelligence Metrics
  totalAgents: number
  activeAgents: number
  swarmCoherence: number
  collectiveIntelligenceScore: number
  emergentCapabilities: number

  // Performance Metrics
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageProcessingTime: number
  averageConfidence: number
  overallAccuracy: number

  // Quantum Metrics
  quantumAdvantage: number
  quantumSystemStatus: string

  // Ethical AI Metrics
  ethicalComplianceScore: number

  // Learning Metrics
  learningRate: number
  adaptationSpeed: number

  // Detailed Breakdowns
  requestTypeBreakdown: Record<string, number>
  modelPerformance: Record<string, number>
  agentUtilization: Record<string, number>

  // Timestamps
  lastUpdated: string
}

export interface SwarmAgent {
  agentId: string
  tier: AgentTier
  description: string
  capabilityLevel: number
  isActive: boolean
  creationTime: string
  lastActivity: string
  specializationAreas: string[]
  position?: { x: number; y: number; z: number }
  connections?: string[]
}

export enum AgentTier {
  AICouncil = 'AICouncil',
  QuantumCommanders = 'QuantumCommanders',
  DomainGenerals = 'DomainGenerals',
  ProcessCoordinators = 'ProcessCoordinators',
  ExpertSpecialists = 'ExpertSpecialists',
  AdaptiveExecutors = 'AdaptiveExecutors',
  MicroOptimizers = 'MicroOptimizers',
}

export interface EmergentPattern {
  patternId: string
  description: string
  type: PatternType
  significanceScore: number
  isBeneficial: boolean
  sourceBehaviors: string[]
  firstDetected: string
  occurrences: number
}

export enum PatternType {
  Coordination = 'Coordination',
  Optimization = 'Optimization',
  Learning = 'Learning',
  Emergence = 'Emergence',
  Trend = 'Trend',
}

export interface QuantumOptimizationResult {
  requestId: string
  optimizationType: string
  success: boolean
  improvementPercentage: number
  optimizedConfiguration: Record<string, unknown>
  processingTime: number
  quantumAdvantage: number
}

export interface PredictiveInsight {
  insightId: string
  title: string
  description: string
  type: InsightType
  confidence: number
  severity: InsightSeverity
  affectedSystems: string[]
  predictions: Record<string, unknown>
  recommendedActions: string[]
  validUntil: string
}

export enum InsightType {
  Performance = 'Performance',
  Risk = 'Risk',
  Opportunity = 'Opportunity',
  Optimization = 'Optimization',
  Security = 'Security',
}

export enum InsightSeverity {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export interface AnalyticsDashboardData {
  healthMetrics: Record<string, unknown>
  trends: Record<string, number[]>
  alerts: AlertData[]
  performance: Record<string, unknown>
  recentInsights: PredictiveInsight[]
  kpis: Record<string, number>
  lastUpdated: string
}

export interface AlertData {
  alertId: string
  message: string
  severity: string
  timestamp: string
  source: string
}

export interface RevenueForecast {
  jurisdiction: string
  forecastPeriod: number
  scenario: ForecastScenario
  generatedAt: string
  forecast: ForecastData
  confidenceIntervals: ConfidenceInterval[]
  riskMetrics: RiskMetrics
  insights: string[]
  modelPerformance: ModelPerformance
}

export enum ForecastScenario {
  Base = 'Base',
  Optimistic = 'Optimistic',
  Pessimistic = 'Pessimistic',
  Conservative = 'Conservative',
}

export interface ForecastData {
  overallConfidence: number
  predictions: number[]
  dates?: string[]
}

export interface ConfidenceInterval {
  date: string
  lower: number
  predicted: number
  upper: number
}

export interface RiskMetrics {
  volatilityScore: number
  riskLevel: string
  uncertaintyFactors: string[]
}

export interface ModelPerformance {
  timeSeriesAccuracy: number
  regressionAccuracy: number
  swarmOptimizationScore: number
  ensembleConfidence: number
}

export interface PropertyValuation {
  propertyId: string
  assessedValue: number
  marketValue: number
  confidence: number
  valuation Date: string
  factors: ValuationFactor[]
  comparables: ComparableProperty[]
}

export interface ValuationFactor {
  factor: string
  impact: number
  weight: number
  description: string
}

export interface ComparableProperty {
  propertyId: string
  similarity: number
  salePrice: number
  saleDate: string
  adjustments: number
}

// Statistical Analysis Types
export interface StatisticalAnalysis {
  mean: number
  median: number
  mode: number
  standardDeviation: number
  variance: number
  skewness: number
  kurtosis: number
  confidenceInterval95: [number, number]
  outliers: number[]
}

export interface CorrelationMatrix {
  variables: string[]
  matrix: number[][]
  significance: number[][]
}

export interface RegressionAnalysis {
  coefficients: Record<string, number>
  rSquared: number
  adjustedRSquared: number
  fStatistic: number
  pValues: Record<string, number>
  residuals: number[]
  predictions: number[]
}

// Physics-Based Simulation Types
export interface ParticleSystem {
  particles: Particle[]
  forces: Force[]
  constraints: Constraint[]
  timeStep: number
}

export interface Particle {
  id: string
  position: Vector3
  velocity: Vector3
  acceleration: Vector3
  mass: number
  charge?: number
  color: string
}

export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface Force {
  type: 'gravity' | 'electromagnetic' | 'spring' | 'damping'
  strength: number
  range?: number
}

export interface Constraint {
  type: 'distance' | 'angle' | 'boundary'
  particles: string[]
  value: number
}

// Quantum Computing Visualization Types
export interface QuantumState {
  qubits: Qubit[]
  entanglements: [number, number][]
  measurements: QuantumMeasurement[]
}

export interface Qubit {
  index: number
  alpha: Complex
  beta: Complex
  blochCoordinates: Vector3
}

export interface Complex {
  real: number
  imaginary: number
}

export interface QuantumMeasurement {
  qubit: number
  result: 0 | 1
  probability: number
  timestamp: string
}

// Network Topology Types
export interface NetworkGraph {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  metrics: NetworkMetrics
}

export interface NetworkNode {
  id: string
  label: string
  type: string
  tier?: AgentTier
  metrics: Record<string, number>
  position?: Vector3
}

export interface NetworkEdge {
  source: string
  target: string
  weight: number
  type: string
  bidirectional: boolean
}

export interface NetworkMetrics {
  density: number
  clustering: number
  averagePathLength: number
  diameter: number
  modularity: number
}
