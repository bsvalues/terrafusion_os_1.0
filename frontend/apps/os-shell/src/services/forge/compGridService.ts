/**
 * Forge Comp Grid Service (TFR-026)
 * ===================================================================
 * Client-side API service for neighborhood comp grids showing parcels
 * with latest qualified sales and assessment ratio computation.
 * Used for ratio study analysis and equalization.
 */

// ============================================================================
// Types
// ============================================================================

/** Single entry in a neighborhood comp grid */
export interface CompGridEntry {
  /** Parcel identifier */
  parcelId: string;
  /** Street address */
  address: string;
  /** Property type code */
  propertyType: string;
  /** Gross living area in sqft */
  grossLivingArea: number;
  /** Lot size in sqft */
  lotSizeSqft: number;
  /** Year built */
  yearBuilt: number;
  /** Building condition */
  condition: string;
  /** Quality grade */
  qualityGrade: string;
  /** Most recent qualified sale price */
  salePrice: number;
  /** Sale date (ISO) */
  saleDate: string;
  /** Sale qualification code */
  saleQualification: string;
  /** Current assessed value */
  assessedValue: number;
  /** Land assessed value */
  landValue: number;
  /** Improvement assessed value */
  improvementValue: number;
  /** Price per sqft of GLA */
  pricePerSqft: number;
}

/** Assessment ratio for a parcel (assessed value / sale price) */
export interface AssessmentRatio {
  /** Parcel identifier */
  parcelId: string;
  /** Street address */
  address: string;
  /** Sale price used */
  salePrice: number;
  /** Sale date (ISO) */
  saleDate: string;
  /** Assessed value at time of sale */
  assessedValue: number;
  /** Assessment ratio (assessed / sale) */
  ratio: number;
  /** Whether the ratio is within acceptable range (typically 0.90-1.10) */
  withinRange: boolean;
  /** Neighborhood or area the parcel belongs to */
  neighborhood: string;
}

/** Summary statistics for a neighborhood ratio study */
export interface RatioStudySummary {
  /** Neighborhood identifier */
  neighborhood: string;
  /** Number of qualified sales in the study */
  sampleSize: number;
  /** Median assessment ratio */
  medianRatio: number;
  /** Mean assessment ratio */
  meanRatio: number;
  /** Weighted mean ratio */
  weightedMeanRatio: number;
  /** Coefficient of dispersion (COD) - measure of uniformity */
  cod: number;
  /** Price-related differential (PRD) - measure of regressivity */
  prd: number;
  /** Coefficient of variation (COV) */
  cov: number;
  /** Minimum ratio in the sample */
  minRatio: number;
  /** Maximum ratio in the sample */
  maxRatio: number;
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/comp-grid';

/**
 * Fetch the comp grid for a neighborhood showing parcels with latest
 * qualified sales and property characteristics.
 * @param neighborhood - Neighborhood or area identifier
 * @returns Array of comp grid entries for the neighborhood
 */
export async function fetchCompGrid(neighborhood: string): Promise<CompGridEntry[]> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(neighborhood)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch comp grid for ${neighborhood}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Compute assessment ratios for all parcels with qualified sales in a
 * neighborhood. Returns individual ratios and summary statistics.
 * @param neighborhood - Neighborhood or area identifier
 * @returns Object with individual ratios and summary statistics
 */
export async function computeAssessmentRatios(
  neighborhood: string
): Promise<{ ratios: AssessmentRatio[]; summary: RatioStudySummary }> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(neighborhood)}/ratios`);
  if (!response.ok) {
    throw new Error(`Failed to compute assessment ratios for ${neighborhood}: ${response.statusText}`);
  }
  return response.json();
}
