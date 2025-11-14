/**
 * TypeScript Type Definitions for TerraFusion Marketplace Frontend
 *
 * Quantum consciousness data structures and flow state interfaces
 */

/**
 * Quantum Agent Data Structure
 *
 * Represents a single AI agent in the 1,008-agent swarm
 */
export interface QuantumAgent {
  id: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  coherence: number;      // 0.0-1.0 (quantum coherence level)
  entanglement: number;   // 0.0-1.0 (inter-agent entanglement strength)
  activity: number;       // 0.0-1.0 (processing activity level)
}

/**
 * Flow State Metrics
 *
 * Tracks user engagement and flow state indicators
 */
export interface FlowStateMetrics {
  engagementScore: number;        // 0-100 (engagement level)
  sessionDuration: number;        // minutes
  interactionCount: number;       // total interactions
  keyboardShortcutUsage: number;  // keyboard shortcut count
  zenModeActive: boolean;         // Zen Mode state
  timeDistortionFactor: number;   // 1x to 3x (perceived time compression)
}

/**
 * Quantum Consciousness Parameters
 *
 * Real-time tunable quantum parameters
 */
export interface ConsciousnessParameters {
  coherenceLevel: number;       // 0.0-1.0 (target: 0.995)
  entanglementStrength: number; // 0.0-1.0 (target: 0.987)
  consciousnessLevel: number;   // 1.0-10.0 (current: 8.5)
  optimizationFactor: number;   // 100-999 (current: 949)
}

/**
 * Predicted Impact Analysis
 *
 * ML-based prediction of parameter changes
 */
export interface PredictedImpact {
  accuracyChange: number;         // ±% change in valuation accuracy
  performanceImpact: number;      // ±ms change in P95 latency
  coordinationEfficiency: number; // ±% agent coordination improvement
  throughputGain: number;         // ±% transaction throughput increase
  confidenceLevel: number;        // 0.0-1.0 (prediction confidence)
  recommendedAction: 'apply' | 'review' | 'reject';
}

/**
 * Parameter Adjustment Result
 *
 * Response from parameter adjustment API
 */
export interface AdjustmentResult {
  success: boolean;
  newValue: number;
  swarmRecalibrationTime: number; // milliseconds
  affectedAgentCount: number;
  message: string;
}

/**
 * Levy Measure Data Structure
 *
 * Property tax levy calculation input
 */
export interface LevyMeasure {
  districtId: string;
  districtName: string;
  assessedValue: number;
  budgetAmount: number;
  measureType: 'REGULAR' | 'EXCESS' | 'BOND';
}

/**
 * Levy Calculation Result
 *
 * AI-optimized levy rate calculation output
 */
export interface LevyCalculationResult {
  baseRate: number;              // Per $1,000 assessed value
  aiOptimalRate: number;         // Quantum-optimized recommendation
  confidenceScore: number;       // 0.90-0.995 (AI confidence)
  statutoryLimit: number;        // RCW maximum rate
  isCompliant: boolean;          // Statutory compliance status
  projectedRevenue: number;      // Estimated revenue
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  warnings: string[];            // Compliance warnings
}

/**
 * Revenue Projection
 *
 * Multi-year revenue forecasting result
 */
export interface RevenueProjection {
  year: number;
  projectedRevenue: number;
  collectionRate: number;       // 0.0-1.0
  confidenceLevel: number;      // 0.0-1.0
  growthRate: number;           // Annual growth rate
  aiAdjustmentFactor: number;   // Quantum optimization adjustment
  riskFactors: RiskAssessment;
}

/**
 * Risk Assessment
 *
 * Multi-dimensional risk analysis
 */
export interface RiskAssessment {
  economicVolatility: number;    // 0-100 score
  collectionVariance: number;    // 0-100 score
  legislativeRisk: number;       // 0-100 score
  assessmentAccuracy: number;    // 0-100 score
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Budget Scenario
 *
 * Multi-fund budget planning scenario
 */
export interface BudgetScenario {
  scenarioId: string;
  name: string;
  fiscalYear: number;
  funds: FundAllocation[];
  levyRates: LevyRate[];
  projectedRevenue: number;
  projectedExpenses: number;
  balanceDifference: number;
  complianceStatus: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
}

/**
 * Fund Allocation
 *
 * County fund allocation details
 */
export interface FundAllocation {
  fundCode: string;
  fundName: string;
  allocatedAmount: number;
  percentOfTotal: number;
  statutoryMinimum?: number;
  statutoryMaximum?: number;
}

/**
 * Levy Rate
 *
 * District-specific levy rate information
 */
export interface LevyRate {
  districtId: string;
  districtName: string;
  rate: number;              // Per $1,000 assessed value
  historicalRates?: number[]; // Past 5 years
}

/**
 * Keyboard Shortcut Configuration
 *
 * Defines keyboard shortcut mappings
 */
export interface KeyboardShortcut {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  action: string;
  description: string;
  category: 'parameters' | 'actions' | 'navigation';
}

/**
 * Zen Mode Configuration
 *
 * Flow state optimization settings
 */
export interface ZenModeConfig {
  minimizedHeaderHeight: number; // pixels
  hideSidebar: boolean;
  hideSecondaryPanels: boolean;
  enableUltraMode: boolean;
  autoActivateThreshold: number; // engagement score threshold
}

/**
 * Audio Feedback Configuration
 *
 * Sound effect settings
 */
export interface AudioFeedbackConfig {
  enabled: boolean;
  volume: number;           // 0.0-1.0
  parameterAdjustSound: boolean;
  thresholdWarningSound: boolean;
  criticalAlertSound: boolean;
}

/**
 * Haptic Feedback Configuration
 *
 * Vibration settings
 */
export interface HapticFeedbackConfig {
  enabled: boolean;
  parameterAdjustDuration: number;  // milliseconds
  parameterAdjustIntensity: number; // 0.0-1.0
  warningDuration: number;          // milliseconds
  warningIntensity: number;         // 0.0-1.0
}
