/**
 * Forge Assessment Intelligence Service (BIV-110)
 * ===================================================================
 * Client-side API service for intelligent assessment analytics:
 * outlier detection, appeal risk prediction, and market trend
 * analysis in assessment context.
 *
 * Endpoints target the TerraFusion Kernel assessment-intelligence API.
 */

// ============================================================================
// Types
// ============================================================================

/** Statistical method used for outlier detection */
export type OutlierDetectionMethod = 'iqr' | 'z-score' | 'modified-z-score';

/** Parameters for outlier detection queries */
export interface OutlierDetectionParams {
  /** Neighborhood to analyze (omit for county-wide) */
  neighborhood?: string;
  /** Property type filter (e.g. "SFR", "MFR", "COMM") */
  propertyType?: string;
  /** Detection method to apply */
  method: OutlierDetectionMethod;
  /** Sensitivity threshold (e.g. 1.5 for IQR, 2.0 for Z-score) */
  threshold: number;
  /** Tax year for the analysis */
  taxYear: number;
}

/** A parcel flagged as a statistical outlier */
export interface OutlierParcel {
  /** Unique parcel identifier */
  parcelId: string;
  /** Situs (street) address */
  situsAddress: string;
  /** Assessment ratio (assessed / sale price) */
  ratio: number;
  /** Assessed value */
  assessedValue: number;
  /** Sale price */
  salePrice: number;
  /** Statistical score (Z-score or IQR distance) */
  score: number;
  /** Direction of deviation */
  direction: 'over-assessed' | 'under-assessed';
  /** Neighborhood identifier */
  neighborhood: string;
  /** Property type code */
  propertyType: string;
}

/** Result of outlier detection analysis */
export interface OutlierResult {
  /** Detection method used */
  method: OutlierDetectionMethod;
  /** Threshold applied */
  threshold: number;
  /** Total parcels analyzed */
  totalAnalyzed: number;
  /** Number of outliers detected */
  outlierCount: number;
  /** Outlier rate as a decimal */
  outlierRate: number;
  /** List of flagged parcels */
  outliers: OutlierParcel[];
  /** Median ratio of non-outlier population */
  populationMedianRatio: number;
  /** COD of non-outlier population */
  populationCod: number;
  /** ISO timestamp of the analysis */
  analyzedAt: string;
}

/** Appeal risk assessment for a single parcel */
export interface AppealRisk {
  /** Unique parcel identifier */
  parcelId: string;
  /** Situs address */
  situsAddress: string;
  /** Predicted probability of appeal (0.0 to 1.0) */
  appealProbability: number;
  /** Risk classification */
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  /** Assessment ratio for the parcel */
  currentRatio: number;
  /** Deviation from neighborhood median ratio */
  ratioDeviation: number;
  /** Neighborhood median ratio */
  neighborhoodMedianRatio: number;
  /** Contributing risk factors */
  riskFactors: string[];
  /** Estimated value at risk (potential reduction in assessed value) */
  estimatedValueAtRisk: number;
  /** Current assessed value */
  assessedValue: number;
  /** Whether the parcel was appealed in the prior year */
  priorYearAppealed: boolean;
}

/** Market trend analysis for assessment context */
export interface TrendAnalysis {
  /** Area or neighborhood identifier */
  areaId: string;
  /** Area display name */
  areaName: string;
  /** Overall market direction */
  marketDirection: 'appreciating' | 'stable' | 'declining';
  /** Annual appreciation/depreciation rate as a decimal */
  annualChangeRate: number;
  /** Median sale price in the area */
  medianSalePrice: number;
  /** Median assessed value in the area */
  medianAssessedValue: number;
  /** Current median assessment ratio */
  medianRatio: number;
  /** Ratio trend direction (improving toward 1.0 or diverging) */
  ratioTrend: 'converging' | 'stable' | 'diverging';
  /** Number of qualified sales in the analysis period */
  salesCount: number;
  /** Assessment implications for the area */
  assessmentImplications: string[];
  /** Analysis period start (ISO) */
  periodStart: string;
  /** Analysis period end (ISO) */
  periodEnd: string;
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/assessment-intelligence';

/**
 * Detect assessment outliers using statistical methods.
 * Identifies parcels whose assessment ratios deviate significantly
 * from the population, indicating potential over- or under-assessment.
 * @param params - Detection parameters including method and threshold
 * @returns Outlier detection result with flagged parcels
 */
export async function fetchOutlierDetection(params: OutlierDetectionParams): Promise<OutlierResult> {
  const response = await fetch(`${BASE_URL}/outliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error(`Failed to detect outliers: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Predict appeal risk for a specific parcel based on ratio deviation,
 * historical appeal patterns, and neighborhood assessment equity.
 * @param parcelId - The unique parcel identifier to evaluate
 * @returns Appeal risk assessment with probability and contributing factors
 */
export async function fetchAppealRisk(parcelId: string): Promise<AppealRisk> {
  const response = await fetch(
    `${BASE_URL}/appeal-risk/${encodeURIComponent(parcelId)}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch appeal risk for parcel ${parcelId}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch market trend analysis for an area in assessment context.
 * Provides market direction, ratio trends, and assessment implications
 * to inform valuation decisions.
 * @param area - The area or neighborhood identifier to analyze
 * @returns Market trend analysis with assessment implications
 */
export async function fetchMarketTrendAnalysis(area: string): Promise<TrendAnalysis> {
  const response = await fetch(
    `${BASE_URL}/market-trends/${encodeURIComponent(area)}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch market trend analysis for area ${area}: ${response.statusText}`);
  }
  return response.json();
}
