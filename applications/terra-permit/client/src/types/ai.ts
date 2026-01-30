import { Permit } from './index';

/**
 * Interface for batch summary
 */
export interface BatchSummary {
  metrics: {
    totalCount: number;
    enteredCount: number;
    skippedCount: number;
    enteredPercentage: number;
    skippedPercentage: number;
  };
  insights: string[];
  categories: Record<string, number>;
  potentialIssues: string[];
  recommendations: string[];
}

/**
 * Interface for enhanced explanation
 */
export interface EnhancedExplanation {
  explanation: string;
  codeReferences: string[];
  similarPermits: Permit[];
}

/**
 * Interface for permit history analysis results
 */
export interface PermitHistoryAnalysis {
  patterns: string[];
  anomalies: string[];
  recommendations: string[];
  optimizationOpportunities: string[];
  riskFactors: string[];
  summary: string;
}

/**
 * Interface for consistency review
 */
export interface ConsistencyReview {
  potentialErrors: {
    permitId: number;
    issue: string;
    recommendation: string;
  }[];
  inconsistencies: {
    conflictingPermits: number[];
    description: string;
    resolution: string;
  }[];
  consistencyScore: number;
  recommendations: string[];
}

/**
 * Interface for neighborhood context
 */
export interface NeighborhoodContext {
  type: 'residential' | 'commercial' | 'industrial' | 'mixed';
  zoning: string;
  characteristics: string[];
  typicalPermitTypes: string[];
}

/**
 * Interface for historical decisions
 */
export interface HistoricalDecision {
  id: string;
  description: string;
  decision: boolean;
  reason: string;
  date: string;
}

/**
 * Interface for spreadsheet analysis
 */
export interface SpreadsheetAnalysis {
  isPermitData: boolean;
  columnMapping: Record<string, string>; // Maps found columns to standard fields
  dataQualityIssues: string[];
  confidence: number; // 0-1 confidence score
  message: string;
}