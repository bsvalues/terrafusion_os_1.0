/**
 * Forge Integrated Data Service (BIV-151)
 * ===================================================================
 * Client-side API service for retrieving combined property data
 * aggregated from all sources: PACS, MLS, permits, assessments,
 * hazard data, and enrichment pipelines.
 */

// ============================================================================
// Types
// ============================================================================

/** Combined property data from all sources */
export interface IntegratedPropertyData {
  /** Parcel identifier */
  parcelId: string;
  /** Property address */
  address: string;
  /** Legal description */
  legalDescription: string;

  /** Ownership data */
  ownership: {
    ownerName: string;
    mailingAddress: string;
    ownershipType: string;
    deedDate: string;
    deedReference: string;
  };

  /** Land characteristics */
  land: {
    totalAcres: number;
    totalSqft: number;
    zoning: string;
    landUseCode: string;
    landUseDescription: string;
    topography: string;
    utilities: string[];
  };

  /** Improvement (structure) data */
  improvements: {
    primaryStructure: {
      buildingType: string;
      yearBuilt: number;
      effectiveYear: number;
      grossLivingArea: number;
      totalArea: number;
      stories: number;
      bedrooms: number;
      bathrooms: number;
      condition: string;
      qualityGrade: string;
      foundation: string;
      roofType: string;
      exteriorWall: string;
      heating: string;
      cooling: string;
    };
    additionalStructures: Array<{
      type: string;
      area: number;
      yearBuilt: number;
      condition: string;
    }>;
  };

  /** Current assessment data */
  assessment: {
    assessmentYear: number;
    landValue: number;
    improvementValue: number;
    totalAssessedValue: number;
    marketValue: number;
    taxableValue: number;
    exemptions: string[];
  };

  /** Recent sale history */
  salesHistory: Array<{
    saleDate: string;
    salePrice: number;
    saleQualification: string;
    grantee: string;
    grantor: string;
    instrument: string;
  }>;

  /** Permit history */
  permits: Array<{
    permitNumber: string;
    permitType: string;
    issueDate: string;
    description: string;
    estimatedCost: number;
    status: string;
  }>;

  /** Data freshness metadata */
  metadata: {
    lastUpdated: string;
    sourceSystems: string[];
    dataCompleteness: number;
    enrichmentStatus: string;
  };
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/integrated';

/**
 * Fetch fully integrated property data from all sources for a parcel.
 * @param parcelId - The parcel to retrieve
 * @returns Combined property data from PACS, MLS, permits, and enrichment
 */
export async function fetchIntegratedData(parcelId: string): Promise<IntegratedPropertyData> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(parcelId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch integrated data for parcel ${parcelId}: ${response.statusText}`);
  }
  return response.json();
}
