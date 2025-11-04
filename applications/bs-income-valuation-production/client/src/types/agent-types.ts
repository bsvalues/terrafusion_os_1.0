// Types for AI agent responses

export interface IncomeAnalysis {
  analysis: {
    findings: string[];
    distribution: Array<{
      source: string;
      percentage: number;
    }>;
    recommendations: string[];
  };
}

export interface AnomalyDetection {
  anomalies: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    recommendation?: string;
  }>;
  insights: string[];
}

export interface DataQualityAnalysis {
  qualityScore: number;
  totalRecords: number;
  issues: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    affectedRecords?: number;
    recommendation?: string;
  }>;
  potentialDuplicates: Array<{
    group: number;
    records: Array<{
      id: number;
      source: string;
      amount: string;
      similarity: number;
    }>;
  }>;
}

export interface ValuationSummary {
  summary: string;
}

export interface ValuationInsight {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  importance: 'high' | 'medium' | 'low';
}

export interface ReportRecommendation {
  title: string;
  description: string;
  actionItems: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface ValuationReport {
  generatedAt: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  summary: string;
  metrics: {
    totalMonthlyIncome: number;
    totalAnnualIncome: number;
    weightedMultiplier: number;
    latestValuationAmount: number;
    incomeSourceCount: number;
    incomeStreamCount: number;
    annualGrowthRate: number;
  };
  periodData: Record<string, any[]>;
  insights: ValuationInsight[];
  recommendations: ReportRecommendation[];
  chartData: {
    valuationHistory: Array<{
      date: Date;
      amount: string;
    }>;
    incomeBreakdown: Array<{
      source: string;
      amount: number;
    }>;
  } | null;
}