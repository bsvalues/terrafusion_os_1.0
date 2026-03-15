/**
 * Forge Comparison Service (BIV-144)
 * ===================================================================
 * Client-side API service for comparable property retrieval,
 * neighborhood comp grids, and comp selection for the sales
 * comparison approach to value.
 */

// ============================================================================
// Types
// ============================================================================

/** Criteria for filtering comparable property searches */
export interface CompSearchCriteria {
  /** Maximum distance from subject in miles */
  maxDistance?: number;
  /** Minimum sale date (ISO date string) */
  minSaleDate?: string;
  /** Maximum sale date (ISO date string) */
  maxSaleDate?: string;
  /** Property type filter (e.g. 'SFR', 'MFR', 'COMMERCIAL') */
  propertyType?: string;
  /** GLA range filter */
  glaRange?: { min: number; max: number };
  /** Year built range filter */
  yearBuiltRange?: { min: number; max: number };
  /** Lot size range in sqft */
  lotSizeRange?: { min: number; max: number };
  /** Only include qualified (arm's length) sales */
  qualifiedOnly?: boolean;
  /** Maximum number of comps to return */
  limit?: number;
}

/** A comparable property with sale and attribute data */
export interface Comparable {
  /** Parcel identifier of the comparable */
  parcelId: string;
  /** Street address */
  address: string;
  /** Sale date (ISO) */
  saleDate: string;
  /** Sale price */
  salePrice: number;
  /** Gross living area in sqft */
  grossLivingArea: number;
  /** Lot size in sqft */
  lotSizeSqft: number;
  /** Year built */
  yearBuilt: number;
  /** Number of bedrooms */
  bedrooms: number;
  /** Number of bathrooms */
  bathrooms: number;
  /** Building condition rating */
  condition: string;
  /** Quality grade code */
  qualityGrade: string;
  /** Property type code */
  propertyType: string;
  /** Sale qualification status */
  saleQualification: string;
  /** Distance from subject in miles */
  distanceFromSubject: number;
  /** Similarity score (0-100) relative to the subject */
  similarityScore: number;
  /** Price per square foot of GLA */
  pricePerSqft: number;
}

/** Neighborhood comp grid showing parcels and recent qualified sales */
export interface CompGrid {
  /** Neighborhood or area identifier */
  neighborhood: string;
  /** Display name for the neighborhood */
  neighborhoodName: string;
  /** Grid entries (one per parcel with a qualifying sale) */
  entries: CompGridEntry[];
  /** Summary statistics for the grid */
  summary: {
    totalParcels: number;
    parcelsWithSales: number;
    medianSalePrice: number;
    medianPricePerSqft: number;
    medianRatio: number;
  };
}

/** Single entry in a comp grid */
export interface CompGridEntry {
  /** Parcel identifier */
  parcelId: string;
  /** Street address */
  address: string;
  /** Most recent qualified sale price */
  salePrice: number;
  /** Sale date (ISO) */
  saleDate: string;
  /** Current assessed value */
  assessedValue: number;
  /** Assessment ratio (assessed / sale) */
  ratio: number;
  /** Gross living area */
  grossLivingArea: number;
  /** Price per sqft of GLA */
  pricePerSqft: number;
}

/** Payload for selecting comps for a subject property */
export interface CompSelection {
  /** Subject parcel identifier */
  subjectParcelId: string;
  /** Selected comparable parcel IDs */
  selectedCompIds: string[];
  /** Appraiser who made the selection */
  selectedBy: string;
  /** ISO timestamp of selection */
  selectionDate: string;
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/comparison';

/**
 * Fetch comparable properties for a subject parcel.
 * @param parcelId - The subject parcel identifier
 * @param criteria - Search criteria for filtering comps
 * @returns Array of comparable properties ranked by similarity
 */
export async function fetchComparables(
  parcelId: string,
  criteria?: CompSearchCriteria
): Promise<Comparable[]> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(parcelId)}/comps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(criteria ?? {}),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch comparables for parcel ${parcelId}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch the comp grid for a neighborhood showing all parcels with recent sales.
 * @param neighborhood - Neighborhood or area identifier
 * @returns Comp grid with entries and summary statistics
 */
export async function fetchCompGrid(neighborhood: string): Promise<CompGrid> {
  const response = await fetch(
    `${BASE_URL}/grid/${encodeURIComponent(neighborhood)}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch comp grid for ${neighborhood}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Submit comp selections for a subject property. Records the appraiser's
 * chosen comps for the sales comparison approach.
 * @param parcelId - The subject parcel
 * @param compIds - Array of selected comparable parcel IDs
 * @returns The recorded comp selection with timestamp
 */
export async function submitCompSelection(
  parcelId: string,
  compIds: string[]
): Promise<CompSelection> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(parcelId)}/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedCompIds: compIds }),
  });
  if (!response.ok) {
    throw new Error(`Failed to submit comp selection for parcel ${parcelId}: ${response.statusText}`);
  }
  return response.json();
}
