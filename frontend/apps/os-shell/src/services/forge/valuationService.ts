/**
 * Forge Valuation Service (BIV-139)
 * ===================================================================
 * Client-side API service for property valuation data retrieval,
 * historical valuation lookups, and value override submissions
 * with full audit trail support.
 *
 * Endpoints target the TerraFusion Kernel valuation API.
 */

// ============================================================================
// Types
// ============================================================================

/** Result of a property valuation computation */
export interface ValuationResult {
  /** Unique parcel identifier */
  parcelId: string;
  /** Assessed land value in dollars */
  landValue: number;
  /** Assessed improvement (structure) value in dollars */
  improvementValue: number;
  /** Total assessed value (land + improvement) */
  totalAssessedValue: number;
  /** Market value estimate */
  marketValue: number;
  /** Assessment year (e.g. 2025) */
  assessmentYear: number;
  /** Valuation approach used: cost, sales comparison, or income */
  approachUsed: 'cost' | 'sales_comparison' | 'income' | 'blended';
  /** Confidence level of the valuation */
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  /** ISO timestamp of when the valuation was computed */
  valuationDate: string;
  /** Assessment ratio (assessed / market) */
  assessmentRatio: number;
}

/** Single entry in the valuation history timeline */
export interface ValuationHistory {
  /** Unique parcel identifier */
  parcelId: string;
  /** Assessment year */
  year: number;
  /** Total assessed value for that year */
  totalAssessedValue: number;
  /** Market value for that year */
  marketValue: number;
  /** Land value for that year */
  landValue: number;
  /** Improvement value for that year */
  improvementValue: number;
  /** Source of the valuation (e.g. 'annual_revaluation', 'physical_inspection') */
  source: string;
  /** Whether an override was applied for that year */
  overrideApplied: boolean;
}

/** Payload for submitting a value override with audit trail */
export interface ValuationOverride {
  /** Parcel being overridden */
  parcelId: string;
  /** New total assessed value */
  overrideValue: number;
  /** Reason code for the override (e.g. 'board_of_equalization', 'senior_exemption') */
  reasonCode: string;
  /** Free-text justification for audit trail */
  justification: string;
  /** Effective date of the override (ISO date string) */
  effectiveDate: string;
  /** Appraiser user ID authorizing the override */
  authorizedBy: string;
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/valuation';

/**
 * Fetch the current valuation for a parcel.
 * @param parcelId - The unique parcel identifier
 * @returns The computed valuation result
 */
export async function fetchValuation(parcelId: string): Promise<ValuationResult> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(parcelId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch valuation for parcel ${parcelId}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch historical valuations for a parcel across assessment years.
 * @param parcelId - The unique parcel identifier
 * @returns Array of historical valuation records ordered by year descending
 */
export async function fetchValuationHistory(parcelId: string): Promise<ValuationHistory[]> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(parcelId)}/history`);
  if (!response.ok) {
    throw new Error(`Failed to fetch valuation history for parcel ${parcelId}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Submit a value override for a parcel. Creates a full audit trail entry
 * per FISMA-HIGH compliance requirements.
 * @param parcelId - The parcel to override
 * @param override - Override details including justification and authorization
 * @returns The updated valuation result reflecting the override
 */
export async function submitOverride(
  parcelId: string,
  override: ValuationOverride
): Promise<ValuationResult> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(parcelId)}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(override),
  });
  if (!response.ok) {
    throw new Error(`Failed to submit override for parcel ${parcelId}: ${response.statusText}`);
  }
  return response.json();
}
