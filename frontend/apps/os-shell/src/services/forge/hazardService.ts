/**
 * Forge Hazard Service (BIV-147)
 * ===================================================================
 * Client-side API service for natural hazard risk assessment and
 * FEMA flood zone data retrieval. Used in property valuation to
 * account for environmental risk factors affecting value.
 */

// ============================================================================
// Types
// ============================================================================

/** Natural hazard risk assessment for a parcel */
export interface HazardRisk {
  /** Parcel identifier */
  parcelId: string;
  /** Overall composite risk score (0-100, higher = more risk) */
  overallRiskScore: number;
  /** Overall risk level classification */
  overallRiskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  /** Individual hazard risk components */
  hazards: HazardComponent[];
  /** ISO timestamp of when the assessment was computed */
  assessedAt: string;
  /** Data sources used */
  dataSources: string[];
}

/** Individual hazard risk component */
export interface HazardComponent {
  /** Hazard type */
  type: 'flood' | 'earthquake' | 'wildfire' | 'landslide' | 'volcanic' | 'wind';
  /** Risk score for this hazard (0-100) */
  score: number;
  /** Risk level for this hazard */
  level: 'low' | 'moderate' | 'high' | 'very_high';
  /** Brief description of the risk factor */
  description: string;
}

/** FEMA flood zone data for a parcel */
export interface FloodZone {
  /** Parcel identifier */
  parcelId: string;
  /** FEMA flood zone designation (e.g. 'AE', 'X', 'VE', 'A') */
  zoneDesignation: string;
  /** Human-readable zone description */
  zoneDescription: string;
  /** Whether the parcel is in a Special Flood Hazard Area (SFHA) */
  isSpecialFloodHazardArea: boolean;
  /** Base flood elevation in feet (if applicable) */
  baseFloodElevation: number | null;
  /** FEMA FIRM panel number */
  firmPanelNumber: string;
  /** Effective date of the FIRM panel (ISO) */
  firmEffectiveDate: string;
  /** Whether flood insurance is required for federally-backed mortgages */
  floodInsuranceRequired: boolean;
  /** Community number in the NFIP */
  communityNumber: string;
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/hazard';

/**
 * Fetch natural hazard risk assessment for a parcel.
 * @param parcelId - The parcel to assess
 * @returns Hazard risk assessment with individual hazard scores
 */
export async function fetchHazardRisk(parcelId: string): Promise<HazardRisk> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(parcelId)}/risk`);
  if (!response.ok) {
    throw new Error(`Failed to fetch hazard risk for parcel ${parcelId}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch FEMA flood zone data for a parcel.
 * @param parcelId - The parcel to look up
 * @returns FEMA flood zone designation and details
 */
export async function fetchFloodZone(parcelId: string): Promise<FloodZone> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(parcelId)}/flood`);
  if (!response.ok) {
    throw new Error(`Failed to fetch flood zone for parcel ${parcelId}: ${response.statusText}`);
  }
  return response.json();
}
