/**
 * Forge VEI (Valuation Equity Index) Service (TFR-009)
 * ===================================================================
 * Client-side API service for assessment equity measurement. VEI
 * quantifies how uniformly properties are assessed across value
 * tiers, neighborhoods, and property types within a study period.
 *
 * Endpoints target the TerraFusion Kernel ratio-study API.
 */

// ============================================================================
// Types
// ============================================================================

/** A configured study period for ratio analysis */
export interface StudyPeriod {
  /** Unique study period identifier */
  id: string;
  /** Display label (e.g. "2025 Annual Ratio Study") */
  label: string;
  /** Tax year covered by the study */
  taxYear: number;
  /** Sales window start date (ISO) */
  salesStart: string;
  /** Sales window end date (ISO) */
  salesEnd: string;
  /** Number of qualified sales in the study */
  qualifiedSalesCount: number;
  /** Whether the study has been finalized */
  finalized: boolean;
  /** ISO timestamp of last computation */
  lastComputedAt: string;
}

/** Assessment ratio tier grouping with median ratio per quartile */
export interface RatioTier {
  /** Value quartile label (e.g. "Q1 ($0-$150K)") */
  tierLabel: string;
  /** Quartile ordinal (1-4, lowest to highest value) */
  quartile: 1 | 2 | 3 | 4;
  /** Lower bound of the value range in dollars */
  valueLow: number;
  /** Upper bound of the value range in dollars */
  valueHigh: number;
  /** Median assessment ratio within this tier */
  medianRatio: number;
  /** Mean assessment ratio within this tier */
  meanRatio: number;
  /** COD within this tier */
  cod: number;
  /** Number of parcels in this tier */
  parcelCount: number;
  /** Number of qualified sales in this tier */
  salesCount: number;
}

/** Appeals analysis grouped by value tier */
export interface AppealTier {
  /** Value quartile ordinal (1-4) */
  quartile: 1 | 2 | 3 | 4;
  /** Tier display label */
  tierLabel: string;
  /** Total appeals filed in this tier */
  appealCount: number;
  /** Total parcels in this tier */
  parcelCount: number;
  /** Appeal rate as a decimal (appealCount / parcelCount) */
  appealRate: number;
  /** Number of appeals resulting in value reduction */
  reductionCount: number;
  /** Average dollar reduction for successful appeals */
  avgReductionAmount: number;
  /** Median assessment ratio for appealed parcels */
  appealedMedianRatio: number;
  /** Median assessment ratio for non-appealed parcels */
  nonAppealedMedianRatio: number;
}

/** Sample size breakdown by neighborhood and property type */
export interface SampleSize {
  /** Neighborhood identifier */
  neighborhoodId: string;
  /** Neighborhood display name */
  neighborhoodName: string;
  /** Property type code (e.g. "SFR", "MFR", "COMM") */
  propertyType: string;
  /** Property type display label */
  propertyTypeLabel: string;
  /** Number of qualified sales */
  salesCount: number;
  /** Total parcels in this grouping */
  parcelCount: number;
  /** Whether sample meets IAAO minimum (typically 5+ sales) */
  meetsMinimum: boolean;
  /** Median ratio for this grouping */
  medianRatio: number;
  /** COD for this grouping */
  cod: number;
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/vei';

/**
 * Fetch all configured study periods for the county.
 * @returns Array of study periods ordered by tax year descending
 */
export async function fetchStudyPeriods(): Promise<StudyPeriod[]> {
  const response = await fetch(`${BASE_URL}/study-periods`);
  if (!response.ok) {
    throw new Error(`Failed to fetch study periods: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch assessment ratio tier groupings with median ratios per quartile.
 * Tiers divide the parcel population into value quartiles and compute
 * equity metrics within each to reveal regressivity or progressivity.
 * @param studyPeriodId - The study period to analyze
 * @returns Array of ratio tiers (typically 4 quartiles)
 */
export async function fetchRatioTiers(studyPeriodId: string): Promise<RatioTier[]> {
  const response = await fetch(
    `${BASE_URL}/study-periods/${encodeURIComponent(studyPeriodId)}/ratio-tiers`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch ratio tiers for study period ${studyPeriodId}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch appeals analysis grouped by value tier for equity evaluation.
 * Higher appeal rates in specific tiers may indicate systematic
 * over- or under-assessment in those value ranges.
 * @param studyPeriodId - The study period to analyze
 * @returns Array of appeal tiers (typically 4 quartiles)
 */
export async function fetchAppealsByTier(studyPeriodId: string): Promise<AppealTier[]> {
  const response = await fetch(
    `${BASE_URL}/study-periods/${encodeURIComponent(studyPeriodId)}/appeals-by-tier`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch appeals by tier for study period ${studyPeriodId}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch sample size breakdown by neighborhood and property type.
 * Identifies areas where insufficient sales data may compromise
 * the statistical reliability of ratio study conclusions.
 * @param studyPeriodId - The study period to analyze
 * @returns Array of sample size entries per neighborhood/property type combination
 */
export async function fetchSampleSizes(studyPeriodId: string): Promise<SampleSize[]> {
  const response = await fetch(
    `${BASE_URL}/study-periods/${encodeURIComponent(studyPeriodId)}/sample-sizes`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch sample sizes for study period ${studyPeriodId}: ${response.statusText}`);
  }
  return response.json();
}
