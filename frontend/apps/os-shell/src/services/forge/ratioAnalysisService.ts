/**
 * Forge Ratio Analysis Service (TFR-010)
 * ===================================================================
 * The statistical heart of assessment ratio studies. Computes on-demand
 * ratio analysis returning IAAO-standard statistics: COD, PRD, PRB,
 * tier medians, and tier slope. Includes model receipt emission for
 * audit trail compliance.
 *
 * IAAO compliance thresholds (residential single-family):
 *   - COD:  < 15.0
 *   - PRD:  0.98 - 1.03
 *   - |PRB|: < 0.05
 *
 * Endpoints target the TerraFusion Kernel ratio-study API.
 */

// ============================================================================
// Types
// ============================================================================

/** Outlier detection method for ratio study computation */
export type OutlierMethod = 'iqr' | 'trim' | 'none';

/** Parameters for an on-demand ratio study computation */
export interface RatioStudyParams {
  /** Tax year for the study */
  taxYear: number;
  /** Sales window in months (e.g. 12, 24, 36) */
  salesWindowMonths: number;
  /** Neighborhood filter (omit for county-wide) */
  neighborhood?: string;
  /** Outlier detection method */
  outlierMethod: OutlierMethod;
  /** Property type filter (e.g. "SFR", "MFR", "COMM"; omit for all) */
  propertyType?: string;
}

/** Tier median ratios by value quartile */
export interface TierMedians {
  /** Median ratio for lowest value quartile */
  q1: number;
  /** Median ratio for second quartile */
  q2: number;
  /** Median ratio for third quartile */
  q3: number;
  /** Median ratio for highest value quartile */
  q4: number;
}

/** Complete result of a ratio study computation */
export interface RatioStudyResult {
  /** Median assessment ratio (assessed value / sale price) */
  medianRatio: number;
  /** Arithmetic mean assessment ratio */
  meanRatio: number;
  /** Weighted mean ratio (sum of assessed / sum of sale prices) */
  weightedMeanRatio: number;
  /** Coefficient of Dispersion — measures uniformity of assessments */
  cod: number;
  /** Price-Related Differential — detects vertical inequity (assessed/sale weighted vs. unweighted) */
  prd: number;
  /** Price-Related Bias — regression-based measure of vertical inequity */
  prb: number;
  /** Coefficient of Variation — standard deviation of ratios / mean ratio */
  cov: number;
  /** Number of sales included in the study after outlier removal */
  sampleSize: number;
  /** Number of observations removed by the outlier method */
  outlierCount: number;
  /** Median ratios by value quartile */
  tierMedians: TierMedians;
  /** Slope of the regression of ratio on ln(sale price) — measures regressivity */
  tierSlope: number;
  /** Whether all IAAO compliance thresholds are met */
  iaaoCompliant: boolean;
  /** Specific compliance notes (e.g. "COD 12.3 within 15.0 threshold") */
  complianceNotes: string[];
  /** ISO timestamp of the computation */
  computedAt: string;
  /** Parameters that produced this result */
  params: RatioStudyParams;
}

/** Audit receipt for a model computation run */
export interface ModelReceipt {
  /** Unique receipt identifier */
  receiptId: string;
  /** Model type (e.g. "ratio_study") */
  modelType: string;
  /** Input parameters hash for reproducibility */
  paramsHash: string;
  /** ISO timestamp of the computation */
  computedAt: string;
  /** User ID who initiated the computation */
  initiatedBy: string;
  /** Summary statistics snapshot for the audit trail */
  resultSummary: {
    medianRatio: number;
    cod: number;
    prd: number;
    prb: number;
    sampleSize: number;
    iaaoCompliant: boolean;
  };
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/ratio-analysis';

/**
 * Compute an on-demand ratio study with the specified parameters.
 * Returns full IAAO-standard statistics including COD, PRD, PRB,
 * tier medians, and tier slope with compliance evaluation.
 *
 * IAAO residential thresholds applied:
 *   - COD < 15.0 (uniformity)
 *   - PRD between 0.98 and 1.03 (vertical equity)
 *   - |PRB| < 0.05 (price-related bias)
 *
 * @param params - Study parameters including tax year, sales window, and filters
 * @returns Complete ratio study result with compliance assessment
 */
export async function computeRatioStudy(params: RatioStudyParams): Promise<RatioStudyResult> {
  const response = await fetch(`${BASE_URL}/compute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error(`Failed to compute ratio study: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Emit an audit trail receipt for a completed model run.
 * Per FISMA-HIGH requirements, every statistical model computation
 * must produce a traceable receipt capturing inputs and outputs.
 * @param result - The ratio study result to record
 * @returns The generated model receipt with unique identifier
 */
export async function emitModelReceipt(result: RatioStudyResult): Promise<ModelReceipt> {
  const response = await fetch(`${BASE_URL}/receipts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelType: 'ratio_study',
      params: result.params,
      resultSummary: {
        medianRatio: result.medianRatio,
        cod: result.cod,
        prd: result.prd,
        prb: result.prb,
        sampleSize: result.sampleSize,
        iaaoCompliant: result.iaaoCompliant,
      },
      computedAt: result.computedAt,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to emit model receipt: ${response.statusText}`);
  }
  return response.json();
}
