/**
 * Forge Enrichment Service (BIV-150)
 * ===================================================================
 * Client-side API service for enriching property data from external
 * sources (MLS, permit records, satellite imagery, etc.) and
 * tracking enrichment pipeline status.
 */

// ============================================================================
// Types
// ============================================================================

/** Result of a property data enrichment operation */
export interface EnrichmentResult {
  /** Parcel identifier */
  parcelId: string;
  /** Whether enrichment was successful */
  success: boolean;
  /** Number of data fields enriched */
  fieldsEnriched: number;
  /** List of enriched field names */
  enrichedFields: string[];
  /** External sources that provided data */
  sourcesUsed: EnrichmentSource[];
  /** ISO timestamp of enrichment completion */
  enrichedAt: string;
  /** Any warnings generated during enrichment */
  warnings: string[];
}

/** An external data source used in enrichment */
export interface EnrichmentSource {
  /** Source identifier */
  sourceId: string;
  /** Source display name (e.g. 'Benton County MLS', 'WA DOL Permits') */
  sourceName: string;
  /** Whether data was successfully retrieved from this source */
  available: boolean;
  /** Number of fields contributed by this source */
  fieldsContributed: number;
  /** ISO timestamp of last successful pull from this source */
  lastUpdated: string;
}

/** Status of the enrichment pipeline for a parcel */
export interface EnrichmentStatus {
  /** Parcel identifier */
  parcelId: string;
  /** Current pipeline state */
  status: 'idle' | 'queued' | 'in_progress' | 'completed' | 'failed';
  /** Progress percentage (0-100) */
  progress: number;
  /** Current pipeline stage description */
  currentStage: string;
  /** ISO timestamp when enrichment was requested */
  requestedAt: string;
  /** ISO timestamp when enrichment completed (null if still running) */
  completedAt: string | null;
  /** Error message if status is 'failed' */
  errorMessage: string | null;
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/enrichment';

/**
 * Trigger property data enrichment from external sources.
 * @param parcelId - The parcel to enrich
 * @returns Enrichment result with details of data obtained
 */
export async function enrichProperty(parcelId: string): Promise<EnrichmentResult> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(parcelId)}/enrich`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to enrich property ${parcelId}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch the current enrichment pipeline status for a parcel.
 * @param parcelId - The parcel to check
 * @returns Current enrichment pipeline status
 */
export async function fetchEnrichmentStatus(parcelId: string): Promise<EnrichmentStatus> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(parcelId)}/status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch enrichment status for parcel ${parcelId}: ${response.statusText}`);
  }
  return response.json();
}
