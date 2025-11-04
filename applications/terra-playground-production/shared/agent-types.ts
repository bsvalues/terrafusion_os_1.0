/**
 * Agent System Type Definitions
 *
 * This file contains TypeScript interfaces for the agent system.
 * These types are shared between frontend and backend code to ensure
 * consistent data structures.
 */

/**
 * Agent object as returned by the backend
 */
export interface Agent {
  id: string | number;
  name: string;
  isActive: boolean;
  lastActivity: string | null;
  performanceScore: number;
  type?: string;
  status?: string;
  description?: string;
}

/**
 * Agent system status response
 */
export interface AgentSystemStatus {
  isInitialized: boolean;
  agentCount: number;
  agents: Record<string, Agent> | Agent[];
  lastUpdated?: string;
}

/**
 * Agent capability definition
 */
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  agentId: string | number;
  parameters: AgentCapabilityParameter[];
}

/**
 * Agent capability parameter
 */
export interface AgentCapabilityParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: any;
}

/**
 * Agent capability execution request
 */
export interface ExecuteCapabilityRequest {
  agentId: string | number;
  capabilityId: string;
  parameters: Record<string, any>;
}

/**
 * Agent capability execution response
 */
export interface ExecuteCapabilityResponse {
  success: boolean;
  result?: any;
  error?: string;
  executionId?: string;
  timestamp: string;
}

/**
 * Market trend analysis
 */
export interface MarketTrend {
  metric: string; // The name of the metric (median_price, days_on_market, etc.)
  timeframe: string; // The timeframe for the trend (1_month, 3_months, 1_year, etc.)
  value: number; // The current value of the metric
  trend: 'increasing' | 'decreasing' | 'stable'; // The direction of the trend
  confidence: number; // Confidence level between 0 and 1
}

/**
 * Economic indicator
 */
export interface EconomicIndicator {
  name: string; // Name of the indicator (interest_rate, unemployment_rate, etc.)
  value: number; // Current value of the indicator
  impact: 'positive' | 'negative' | 'neutral'; // Impact on property values
  significance: number; // Significance/weight between 0 and 1
}

/**
 * Regulatory framework
 */
export interface RegulatoryFramework {
  region: string;
  zoningRegulations: ZoningRegulation[];
  buildingCodes: BuildingCode[];
  environmentalRegulations: EnvironmentalRegulation[];
  taxPolicies: TaxPolicy[];
  lastUpdated: Date;
}

export interface ZoningRegulation {
  code: string;
  name: string;
  description: string;
  maxDensity: string;
  heightLimit: string;
  setbacks: {
    front: string;
    side: string;
    rear: string;
  };
}

export interface BuildingCode {
  code: string;
  name: string;
  adoption: string;
  scope: string;
}

export interface EnvironmentalRegulation {
  code: string;
  name: string;
  description: string;
  requirements: string;
}

export interface TaxPolicy {
  name: string;
  description: string;
  implementation: string;
  exceptions?: string;
  amount?: string;
  application?: string;
  eligibility?: string;
}

/**
 * Regulatory change
 */
export interface RegulatoryChange {
  date: string;
  category: string;
  description: string;
  impact: string;
  marketEffect: string;
}

/**
 * Environmental risk
 */
export interface EnvironmentalRisk {
  type: string;
  level: 'Low' | 'Medium' | 'High';
  description: string;
  mitigationOptions?: string[];
  insuranceConsiderations?: string;
}

/**
 * Environmental hazard
 */
export interface EnvironmentalHazard {
  type: string;
  probability: 'Low' | 'Medium' | 'High';
  description: string;
}

/**
 * Future value prediction
 */
export interface FutureValuePrediction {
  propertyId: string;
  address: string;
  currentValue: number;
  predictedValues: {
    timeframe: string;
    value: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
    confidenceLevel: number;
  }[];
  influencingFactors: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
  }[];
  methodology: string;
  generatedDate: Date;
}

/**
 * Risk assessment result
 */
export interface RiskAssessmentResult {
  propertyId: string;
  address: string;
  overallRiskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  riskFactors: {
    category: string;
    score: number;
    level: string;
    description: string;
    mitigationSuggestions?: string[];
  }[];
  economicFactors: {
    name: string;
    impact: string;
    trend: string;
    description: string;
  }[];
  regulatoryFactors: {
    name: string;
    impact: string;
    probability: string;
    description: string;
  }[];
  environmentalFactors: {
    name: string;
    impact: string;
    probability: string;
    description: string;
  }[];
  generatedDate: Date;
}
