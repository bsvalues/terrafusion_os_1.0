/**
 * Core research data types for TerraFusion Autonomous Research Engine
 */

// Base research data structure
export interface ResearchData {
  id: string;
  timestamp: Date;
  source: string;
  type: 'experimental' | 'observational' | 'computational' | 'theoretical';
  values: number[];
  metadata: Record<string, any>;
  quality: DataQuality;
  context: ResearchContext;
}

// Data quality assessment
export interface DataQuality {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  consistency: number; // 0-1
  timeliness: number; // 0-1
  validity: number; // 0-1
  reliability: number; // 0-1
  overall: number; // 0-1
}

// Research context information
export interface ResearchContext {
  domain: string;
  methodology: string;
  hypothesis?: string;
  variables: Variable[];
  constraints: string[];
  objectives: string[];
}

// Variable definition
export interface Variable {
  name: string;
  type: 'independent' | 'dependent' | 'control' | 'confounding';
  dataType: 'numerical' | 'categorical' | 'ordinal' | 'binary';
  unit?: string;
  range?: [number, number];
  description: string;
}

// Analysis result structure
export interface AnalysisResult {
  id: string;
  timestamp: Date;
  type: string;
  data: ResearchData | ResearchData[];
  results: Record<string, any>;
  confidence: number;
  insights: string[];
  recommendations: string[];
  visualizations?: VisualizationConfig[];
  errors?: string[];
  warnings?: string[];
}

// Statistical analysis results
export interface StatisticalAnalysis {
  id: string;
  timestamp: Date;
  descriptive: DescriptiveStatistics;
  correlations: CorrelationAnalysis;
  distributions: DistributionAnalysis;
  outliers: OutlierDetection[];
  significanceTests: SignificanceTest[];
  confidenceIntervals: ConfidenceInterval[];
  recommendations: string[];
}

// Descriptive statistics
export interface DescriptiveStatistics {
  count: number;
  mean: number;
  median: number;
  mode: number;
  standardDeviation: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  range: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
  percentiles?: Record<number, number>;
}

// Correlation analysis
export interface CorrelationAnalysis {
  pearson: number;
  spearman: number;
  kendall: number;
  significance?: number;
  interpretation: string;
}

// Distribution analysis
export interface DistributionAnalysis {
  type: 'normal' | 'uniform' | 'exponential' | 'binomial' | 'poisson' | 'other';
  parameters: Record<string, number>;
  goodnessOfFit: GoodnessOfFitTest;
  characteristics: string[];
}

// Goodness of fit test
export interface GoodnessOfFitTest {
  testStatistic: number;
  pValue: number;
  criticalValue: number;
  result: 'accept' | 'reject';
  test: 'kolmogorov-smirnov' | 'chi-square' | 'anderson-darling';
}

// Outlier detection
export interface OutlierDetection {
  index: number;
  value: number;
  method: 'iqr' | 'z-score' | 'modified-z-score' | 'isolation-forest';
  severity: 'mild' | 'moderate' | 'extreme';
  confidence: number;
}

// Significance test
export interface SignificanceTest {
  test: string;
  hypothesis: {
    null: string;
    alternative: string;
  };
  testStatistic: number;
  pValue: number;
  criticalValue: number;
  significance: number;
  result: 'significant' | 'not-significant';
  interpretation: string;
}

// Confidence interval
export interface ConfidenceInterval {
  parameter: string;
  level: number;
  lowerBound: number;
  upperBound: number;
  estimate: number;
  marginOfError: number;
}

// Pattern recognition results
export interface PatternRecognition {
  id: string;
  timestamp: Date;
  patterns: {
    temporal: TemporalPattern;
    spatial: SpatialPattern;
    behavioral: BehavioralPattern;
    anomalies: Anomaly[];
  };
  predictions: Prediction[];
  trends: Trend[];
  confidence: number;
  insights: string[];
}

// Temporal pattern
export interface TemporalPattern {
  seasonality: SeasonalityAnalysis;
  trends: TrendAnalysis[];
  cyclicity: CyclicityAnalysis;
  changePoints: ChangePoint[];
}

// Seasonality analysis
export interface SeasonalityAnalysis {
  detected: boolean;
  period: number;
  strength: number;
  components: SeasonalComponent[];
}

// Seasonal component
export interface SeasonalComponent {
  period: number;
  amplitude: number;
  phase: number;
  significance: number;
}

// Trend analysis
export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  strength: number;
  linearity: number;
  significance: number;
  equation?: string;
  r_squared?: number;
}

// Cyclicity analysis
export interface CyclicityAnalysis {
  detected: boolean;
  cycles: Cycle[];
  dominantFrequency?: number;
}

// Cycle
export interface Cycle {
  frequency: number;
  amplitude: number;
  phase: number;
  confidence: number;
}

// Change point
export interface ChangePoint {
  index: number;
  timestamp: Date;
  type: 'mean' | 'variance' | 'trend' | 'distribution';
  confidence: number;
  magnitude: number;
}

// Spatial pattern
export interface SpatialPattern {
  clustering: ClusteringResult;
  hotspots: Hotspot[];
  gradients: Gradient[];
  boundaries: Boundary[];
}

// Clustering result
export interface ClusteringResult {
  algorithm: string;
  numberOfClusters: number;
  clusters: Cluster[];
  silhouetteScore?: number;
  inertia?: number;
}

// Cluster
export interface Cluster {
  id: number;
  center: number[];
  size: number;
  density: number;
  characteristics: string[];
}

// Hotspot
export interface Hotspot {
  location: number[];
  intensity: number;
  radius: number;
  significance: number;
}

// Gradient
export interface Gradient {
  direction: number[];
  magnitude: number;
  uniformity: number;
}

// Boundary
export interface Boundary {
  points: number[][];
  type: 'hard' | 'soft' | 'fuzzy';
  confidence: number;
}

// Behavioral pattern
export interface BehavioralPattern {
  sequences: SequencePattern[];
  rules: AssociationRule[];
  transitions: TransitionMatrix;
  anomalies: BehavioralAnomaly[];
}

// Sequence pattern
export interface SequencePattern {
  sequence: string[];
  frequency: number;
  support: number;
  confidence: number;
  length: number;
}

// Association rule
export interface AssociationRule {
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
  conviction: number;
}

// Transition matrix
export interface TransitionMatrix {
  states: string[];
  matrix: number[][];
  stationaryDistribution: number[];
}

// Behavioral anomaly
export interface BehavioralAnomaly {
  pattern: string;
  expected: string;
  observed: string;
  deviation: number;
  context: string;
}

// General anomaly
export interface Anomaly {
  id: string;
  type: 'point' | 'contextual' | 'collective';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: number | number[];
  confidence: number;
  explanation: string;
}

// Prediction
export interface Prediction {
  target: string;
  horizon: number;
  method: string;
  value: number | number[];
  confidence: number;
  interval: [number, number];
  accuracy?: PredictionAccuracy;
}

// Prediction accuracy
export interface PredictionAccuracy {
  mae: number; // Mean Absolute Error
  mse: number; // Mean Squared Error
  rmse: number; // Root Mean Squared Error
  mape: number; // Mean Absolute Percentage Error
  r2: number; // R-squared
}

// Trend
export interface Trend {
  variable: string;
  direction: 'upward' | 'downward' | 'stable' | 'cyclical';
  strength: number;
  duration: number;
  significance: number;
  forecast: number[];
}

// Visualization configuration
export interface VisualizationConfig {
  type: 'line' | 'bar' | 'scatter' | 'histogram' | 'heatmap' | 'boxplot' | 'violin';
  title: string;
  data: any;
  options: any;
  interactive: boolean;
  exportFormats: string[];
}

// Hypothesis types
export interface Hypothesis {
  id: string;
  statement: string;
  type: 'null' | 'alternative' | 'directional' | 'non-directional';
  variables: Variable[];
  predictions: string[];
  testable: boolean;
  priority: number;
  confidence: number;
  evidence: Evidence[];
  status: 'proposed' | 'testing' | 'validated' | 'rejected' | 'modified';
}

// Evidence
export interface Evidence {
  id: string;
  type: 'empirical' | 'theoretical' | 'experimental' | 'observational';
  source: string;
  description: string;
  strength: number;
  reliability: number;
  relevance: number;
  timestamp: Date;
}

// Research validation criteria
export interface ValidationCriteria {
  methodological: MethodologicalCriteria;
  statistical: StatisticalCriteria;
  ethical: EthicalCriteria;
  reproducibility: ReproducibilityCriteria;
}

// Methodological criteria
export interface MethodologicalCriteria {
  sampleSize: {
    minimum: number;
    achieved: number;
    adequate: boolean;
  };
  randomization: boolean;
  controlGroups: boolean;
  blinding: 'none' | 'single' | 'double' | 'triple';
  bias: BiasAssessment[];
}

// Bias assessment
export interface BiasAssessment {
  type: string;
  severity: 'low' | 'moderate' | 'high';
  mitigation: string[];
  impact: string;
}

// Statistical criteria
export interface StatisticalCriteria {
  powerAnalysis: PowerAnalysis;
  effectSize: EffectSize;
  multipleComparisons: MultipleComparisonCorrection;
  assumptions: AssumptionTest[];
}

// Power analysis
export interface PowerAnalysis {
  power: number;
  effectSize: number;
  significance: number;
  sampleSize: number;
  adequate: boolean;
}

// Effect size
export interface EffectSize {
  measure: string;
  value: number;
  interpretation: 'negligible' | 'small' | 'medium' | 'large';
  confidence: [number, number];
}

// Multiple comparison correction
export interface MultipleComparisonCorrection {
  method: 'bonferroni' | 'holm' | 'benjamini-hochberg' | 'false-discovery-rate';
  applied: boolean;
  adjustedAlpha: number;
}

// Assumption test
export interface AssumptionTest {
  assumption: string;
  test: string;
  result: 'met' | 'violated' | 'uncertain';
  pValue: number;
  action: string;
}

// Ethical criteria
export interface EthicalCriteria {
  approval: {
    required: boolean;
    obtained: boolean;
    institution: string;
    number?: string;
  };
  consent: {
    required: boolean;
    obtained: boolean;
    type: 'informed' | 'implied' | 'waived';
  };
  privacy: PrivacyAssessment;
  riskBenefit: RiskBenefitAnalysis;
}

// Privacy assessment
export interface PrivacyAssessment {
  dataTypes: string[];
  anonymization: boolean;
  encryption: boolean;
  retention: string;
  sharing: string[];
  compliance: string[];
}

// Risk-benefit analysis
export interface RiskBenefitAnalysis {
  risks: Risk[];
  benefits: Benefit[];
  ratio: number;
  acceptable: boolean;
  mitigation: string[];
}

// Risk
export interface Risk {
  type: string;
  probability: number;
  severity: number;
  impact: string;
  mitigation: string[];
}

// Benefit
export interface Benefit {
  type: string;
  magnitude: number;
  recipients: string[];
  timeframe: string;
}

// Reproducibility criteria
export interface ReproducibilityCriteria {
  documentation: DocumentationAssessment;
  dataAvailability: DataAvailabilityAssessment;
  codeAvailability: CodeAvailabilityAssessment;
  replication: ReplicationAssessment;
}

// Documentation assessment
export interface DocumentationAssessment {
  methods: boolean;
  procedures: boolean;
  materials: boolean;
  analysis: boolean;
  complete: boolean;
  accessible: boolean;
}

// Data availability assessment
export interface DataAvailabilityAssessment {
  rawData: boolean;
  processedData: boolean;
  metadata: boolean;
  repository: string;
  persistent: boolean;
  accessible: boolean;
}

// Code availability assessment
export interface CodeAvailabilityAssessment {
  analysisCode: boolean;
  processingCode: boolean;
  documentation: boolean;
  dependencies: boolean;
  version: string;
  repository: string;
}

// Replication assessment
export interface ReplicationAssessment {
  attempted: boolean;
  successful: boolean;
  differences: string[];
  explanations: string[];
  confidence: number;
}

// Research orchestration types
export interface ResearchProject {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  hypotheses: Hypothesis[];
  methodology: ResearchMethodology;
  timeline: ProjectTimeline;
  resources: Resource[];
  team: TeamMember[];
  status: ProjectStatus;
  progress: number;
  results?: AnalysisResult[];
}

// Research methodology
export interface ResearchMethodology {
  approach: 'quantitative' | 'qualitative' | 'mixed-methods';
  design: string;
  sampling: SamplingStrategy;
  dataCollection: DataCollectionMethod[];
  analysis: AnalysisMethod[];
  validation: ValidationMethod[];
}

// Sampling strategy
export interface SamplingStrategy {
  method: string;
  size: number;
  criteria: string[];
  rationale: string;
}

// Data collection method
export interface DataCollectionMethod {
  method: string;
  description: string;
  instruments: string[];
  duration: string;
  frequency: string;
}

// Analysis method
export interface AnalysisMethod {
  method: string;
  purpose: string;
  software: string[];
  parameters: Record<string, any>;
}

// Validation method
export interface ValidationMethod {
  method: string;
  criteria: string[];
  threshold: number;
  action: string;
}

// Project timeline
export interface ProjectTimeline {
  start: Date;
  end: Date;
  phases: ProjectPhase[];
  milestones: Milestone[];
  dependencies: Dependency[];
}

// Project phase
export interface ProjectPhase {
  name: string;
  description: string;
  start: Date;
  end: Date;
  deliverables: string[];
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed';
}

// Milestone
export interface Milestone {
  name: string;
  description: string;
  date: Date;
  criteria: string[];
  achieved: boolean;
}

// Dependency
export interface Dependency {
  predecessor: string;
  successor: string;
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  lag: number;
}

// Resource
export interface Resource {
  type: 'human' | 'equipment' | 'software' | 'facility' | 'funding';
  name: string;
  description: string;
  availability: string;
  cost: number;
  allocated: boolean;
}

// Team member
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  expertise: string[];
  availability: number;
  responsibilities: string[];
}

// Project status
export interface ProjectStatus {
  phase: string;
  health: 'green' | 'yellow' | 'red';
  issues: Issue[];
  risks: Risk[];
  nextActions: Action[];
  lastUpdate: Date;
}

// Issue
export interface Issue {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  resolution: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
}

// Action
export interface Action {
  id: string;
  description: string;
  assignee: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
}

// Knowledge management types
export interface KnowledgeBase {
  id: string;
  domain: string;
  concepts: Concept[];
  relationships: Relationship[];
  theories: Theory[];
  publications: Publication[];
  experiments: Experiment[];
  lastUpdate: Date;
  version: string;
}

// Concept
export interface Concept {
  id: string;
  name: string;
  definition: string;
  category: string;
  properties: Property[];
  examples: string[];
  related: string[];
  confidence: number;
}

// Property
export interface Property {
  name: string;
  value: any;
  type: string;
  source: string;
  confidence: number;
}

// Relationship
export interface Relationship {
  id: string;
  type: string;
  source: string;
  target: string;
  strength: number;
  direction: 'unidirectional' | 'bidirectional';
  evidence: Evidence[];
}

// Theory
export interface Theory {
  id: string;
  name: string;
  description: string;
  propositions: string[];
  assumptions: string[];
  scope: string;
  evidence: Evidence[];
  predictions: string[];
  status: 'proposed' | 'accepted' | 'contested' | 'deprecated';
}

// Publication
export interface Publication {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  abstract: string;
  keywords: string[];
  methodology: string;
  findings: string[];
  relevance: number;
}

// Experiment
export interface Experiment {
  id: string;
  title: string;
  hypothesis: string;
  methodology: string;
  variables: Variable[];
  results: AnalysisResult[];
  conclusions: string[];
  limitations: string[];
  replication: boolean;
}

// Synthesis types
export interface SynthesisResult {
  id: string;
  timestamp: Date;
  type: 'meta-analysis' | 'systematic-review' | 'narrative-synthesis' | 'framework-synthesis';
  studies: StudyData[];
  findings: Finding[];
  conclusions: Conclusion[];
  recommendations: Recommendation[];
  limitations: string[];
  confidence: number;
  quality: SynthesisQuality;
}

// Study data
export interface StudyData {
  id: string;
  title: string;
  authors: string[];
  year: number;
  methodology: string;
  sampleSize: number;
  effectSize: number;
  quality: StudyQuality;
  included: boolean;
  exclusionReason?: string;
}

// Study quality
export interface StudyQuality {
  overall: number;
  methodological: number;
  statistical: number;
  reporting: number;
  bias: number;
  assessment: QualityAssessment[];
}

// Quality assessment
export interface QualityAssessment {
  criterion: string;
  rating: number;
  justification: string;
  weight: number;
}

// Finding
export interface Finding {
  id: string;
  statement: string;
  evidence: Evidence[];
  strength: number;
  consistency: number;
  directness: number;
  precision: number;
  grade: 'high' | 'moderate' | 'low' | 'very-low';
}

// Conclusion
export interface Conclusion {
  id: string;
  statement: string;
  certainty: number;
  implications: string[];
  supporting: Finding[];
  conflicting: Finding[];
}

// Recommendation
export interface Recommendation {
  id: string;
  statement: string;
  strength: 'strong' | 'conditional' | 'weak';
  quality: 'high' | 'moderate' | 'low' | 'very-low';
  rationale: string;
  context: string[];
  implementation: string[];
}

// Synthesis quality
export interface SynthesisQuality {
  overall: number;
  comprehensiveness: number;
  objectivity: number;
  rigor: number;
  transparency: number;
  applicability: number;
}
