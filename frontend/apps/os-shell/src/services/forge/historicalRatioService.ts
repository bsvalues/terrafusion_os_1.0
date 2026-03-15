/**
 * Forge Historical Ratio Service (TFR-092)
 * ===================================================================
 * Client-side API service for multi-year historical ratio statistics
 * and appeals-by-value-tier analysis. Provides longitudinal views of
 * COD, PRD, PRB, and appeal patterns to track assessment quality
 * trends over time.
 *
 * Endpoints target the TerraFusion Kernel historical-ratio API.
 */

// ============================================================================
// Types
// ============================================================================

/** Year range specification for historical queries */
export interface YearRange {
  /** First year in the range (inclusive) */
  startYear: number;
  /** Last year in the range (inclusive) */
  endYear: number;
}

/** A single year's ratio statistics in a historical series */
export interface HistoricalRatioEntry {
  /** Assessment year */
  year: number;
  /** Neighborhood identifier */
  neighborhoodId: string;
  /** Neighborhood display name */
  neighborhoodName: string;
  /** Median assessment ratio */
  medianRatio: number;
  /** Mean assessment ratio */
  meanRatio: number;
  /** Weighted mean ratio (sum of assessed / sum of sale prices) */
  weightedMeanRatio: number;
  /** Coefficient of Dispersion */
  cod: number;
  /** Price-Related Differential */
  prd: number;
  /** Price-Related Bias */
  prb: number;
  /** Coefficient of Variation */
  cov: number;
  /** Number of qualified sales used */
  sampleSize: number;
  /** Whether the year met IAAO compliance thresholds */
  iaaoCompliant: boolean;
  /** Year-over-year change in median ratio (null for first year) */
  medianRatioChange: number | null;
  /** Year-over-year change in COD (null for first year) */
  codChange: number | null;
}

/** Appeals analysis for a single value tier in a single year */
export interface AppealTierEntry {
  /** Assessment year */
  year: number;
  /** Value quartile (1 = lowest, 4 = highest) */
  quartile: 1 | 2 | 3 | 4;
  /** Tier display label (e.g. "Q1 ($0-$150K)") */
  tierLabel: string;
  /** Total appeals filed */
  appealCount: number;
  /** Total parcels in the tier */
  parcelCount: number;
  /** Appeal rate as a decimal */
  appealRate: number;
  /** Appeals resulting in value reduction */
  reductionCount: number;
  /** Success rate of appeals (reductionCount / appealCount) */
  successRate: number;
  /** Average dollar reduction for successful appeals */
  avgReductionAmount: number;
  /** Median ratio for appealed parcels */
  appealedMedianRatio: number;
}

/** Aggregated appeals-by-tier result for a neighborhood over a year range */
export interface AppealsByTier {
  /** Neighborhood identifier */
  neighborhoodId: string;
  /** Neighborhood display name */
  neighborhoodName: string;
  /** Year range covered */
  yearRange: YearRange;
  /** Appeal data by year and tier */
  entries: AppealTierEntry[];
  /** Summary: total appeals across all years and tiers */
  totalAppeals: number;
  /** Summary: overall appeal rate across all years */
  overallAppealRate: number;
  /** Summary: overall success rate across all years */
  overallSuccessRate: number;
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/historical-ratios';

/**
 * Fetch multi-year ratio statistics for a neighborhood.
 * Returns COD, PRD, PRB, and other IAAO metrics per year to
 * reveal assessment quality trends over time.
 * @param neighborhood - Neighborhood identifier to analyze
 * @param yearRange - Start and end years (inclusive)
 * @returns Array of historical ratio entries ordered by year ascending
 */
export async function fetchHistoricalRatios(
  neighborhood: string,
  yearRange: YearRange
): Promise<HistoricalRatioEntry[]> {
  const params = new URLSearchParams({
    neighborhood,
    startYear: String(yearRange.startYear),
    endYear: String(yearRange.endYear),
  });
  const response = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch historical ratios for ${neighborhood}: ${response.statusText}`
    );
  }
  return response.json();
}

/**
 * Fetch appeals analysis by value tier over a year range.
 * Reveals whether appeal patterns concentrate in specific value
 * quartiles and how those patterns change over time, indicating
 * systematic equity issues.
 * @param neighborhood - Neighborhood identifier to analyze
 * @param yearRange - Start and end years (inclusive)
 * @returns Appeals-by-tier analysis with per-year and per-quartile breakdowns
 */
export async function fetchAppealsByValueTier(
  neighborhood: string,
  yearRange: YearRange
): Promise<AppealsByTier> {
  const params = new URLSearchParams({
    neighborhood,
    startYear: String(yearRange.startYear),
    endYear: String(yearRange.endYear),
  });
  const response = await fetch(`${BASE_URL}/appeals-by-tier?${params.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch appeals by value tier for ${neighborhood}: ${response.statusText}`
    );
  }
  return response.json();
}
