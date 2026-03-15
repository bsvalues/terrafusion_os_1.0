/**
 * TFR-028: Write-Lane Enforcement
 *
 * Constitutional ownership matrix.  Every data domain is owned by
 * exactly one module.  Cross-lane writes are architectural violations
 * caught at runtime before they reach the API.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WriteDomain =
  | 'parcel_identity'
  | 'parcel_ownership'
  | 'land_valuation'
  | 'improvement_valuation'
  | 'cost_model'
  | 'sales_analysis'
  | 'income_analysis'
  | 'market_model'
  | 'assessment_roll'
  | 'appeal'
  | 'exemption'
  | 'tax_levy'
  | 'gis_geometry'
  | 'gis_overlay'
  | 'permit'
  | 'sketch'
  | 'photo'
  | 'document'
  | 'note'
  | 'workflow'
  | 'user_preference'
  | 'system_config'
  | 'audit_event'
  | 'export_job'
  | 'watchlist'
  | 'notification';

export type OwnerModule =
  | 'forge'   // Valuation engine
  | 'dais'    // Board / appeal hearings
  | 'atlas'   // GIS / spatial
  | 'dossier' // Parcel record management
  | 'os'      // OS-level infrastructure
  | 'pilot';  // Navigation / workflow

// ---------------------------------------------------------------------------
// Ownership matrix — single source of truth
// ---------------------------------------------------------------------------

export const WRITE_LANE_MATRIX: Record<WriteDomain, OwnerModule> = {
  // Dossier — parcel record keeper
  parcel_identity: 'dossier',
  parcel_ownership: 'dossier',
  photo: 'dossier',
  document: 'dossier',
  note: 'dossier',
  sketch: 'dossier',
  permit: 'dossier',

  // Forge — valuation engine
  land_valuation: 'forge',
  improvement_valuation: 'forge',
  cost_model: 'forge',
  sales_analysis: 'forge',
  income_analysis: 'forge',
  market_model: 'forge',

  // Dais — board & appeals
  appeal: 'dais',
  exemption: 'dais',

  // Atlas — GIS
  gis_geometry: 'atlas',
  gis_overlay: 'atlas',

  // Pilot — workflow & navigation
  workflow: 'pilot',
  assessment_roll: 'pilot',
  tax_levy: 'pilot',

  // OS — infrastructure
  user_preference: 'os',
  system_config: 'os',
  audit_event: 'os',
  export_job: 'os',
  watchlist: 'os',
  notification: 'os',
};

// ---------------------------------------------------------------------------
// Enforcement API
// ---------------------------------------------------------------------------

/**
 * Returns true when `module` is the constitutional owner of `domain`.
 */
export function checkWriteLane(module: OwnerModule, domain: WriteDomain): boolean {
  return WRITE_LANE_MATRIX[domain] === module;
}

/**
 * Throws if `module` is NOT the constitutional owner of `domain`.
 * Call this at the boundary of every write path.
 */
export function assertWriteLane(module: OwnerModule, domain: WriteDomain): void {
  if (!checkWriteLane(module, domain)) {
    const owner = WRITE_LANE_MATRIX[domain];
    throw new Error(
      `[WriteLane Violation] Module "${module}" attempted to write to domain "${domain}" ` +
      `which is owned by "${owner}". Cross-lane writes are constitutionally prohibited.`,
    );
  }
}
