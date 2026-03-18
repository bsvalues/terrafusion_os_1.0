/**
 * Forge Insights Service (BIV-145)
 * ===================================================================
 * Client-side API service for AI-generated property analysis and
 * key value driver identification. These insights augment the
 * appraiser's judgment with data-driven observations.
 */

// ============================================================================
// Types
// ============================================================================

/** AI-generated property insight */
export interface PropertyInsight {
  /** Parcel identifier */
  parcelId: string;
  /** Insight category */
  category: 'valuation' | 'market' | 'physical' | 'location' | 'risk' | 'opportunity';
  /** Short summary of the insight */
  title: string;
  /** Detailed narrative explanation */
  description: string;
  /** Impact level on property value */
  impact: 'positive' | 'neutral' | 'negative';
  /** Confidence score (0-1) */
  confidence: number;
  /** Data sources that contributed to this insight */
  dataSources: string[];
  /** ISO timestamp when the insight was generated */
  generatedAt: string;
}

/** Key value driver for a property */
export interface ValueDriver {
  /** Parcel identifier */
  parcelId: string;
  /** Driver name (e.g. 'Location Premium', 'Deferred Maintenance') */
  name: string;
  /** Driver category */
  category: 'location' | 'physical' | 'economic' | 'legal' | 'environmental';
  /** Estimated dollar impact on value (positive or negative) */
  dollarImpact: number;
  /** Percentage impact on value */
  percentImpact: number;
  /** Direction of the driver's effect */
  direction: 'positive' | 'negative';
  /** Narrative explanation */
  description: string;
  /** Ranking among all drivers for this parcel (1 = most impactful) */
  rank: number;
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/insights';

/**
 * Fetch AI-generated property insights for a parcel.
 * @param parcelId - The parcel to analyze
 * @returns Array of property insights sorted by impact
 */
export async function fetchPropertyInsights(parcelId: string): Promise<PropertyInsight[]> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(parcelId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch insights for parcel ${parcelId}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch key value drivers for a parcel, identifying factors that
 * most significantly influence the property's value.
 * @param parcelId - The parcel to analyze
 * @returns Array of value drivers ranked by impact
 */
export async function fetchValueDrivers(parcelId: string): Promise<ValueDriver[]> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(parcelId)}/drivers`);
  if (!response.ok) {
    throw new Error(`Failed to fetch value drivers for parcel ${parcelId}: ${response.statusText}`);
  }
  return response.json();
}
