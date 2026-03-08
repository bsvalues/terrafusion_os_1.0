/**
 * Harris PACS TypeScript Type Definitions
 *
 * Mirrors the backend DTOs defined in TerraFusion.Core/PACS/IPacsAdapter.cs.
 * Governed by pacscontract.v1 SpecLock.
 *
 * @see docs/spec-lock/locks/pacscontract/pacscontract.v1/SPEC_LOCK_v1.0.0.md
 */

// ═══════════════════════════════════════════════════════════════
// PROPERTY CORE (vw_TerraFusion_Property_Core)
// ═══════════════════════════════════════════════════════════════

/**
 * Core property data from vw_TerraFusion_Property_Core.
 * Columns defined in pacscontract.v1.
 */
export interface PacsPropertyCore {
  /** Property ID (prop_id). */
  propId: number;
  /** Geographic ID (geo_id). */
  geoId: string;
  /** Property type code (prop_type_cd). */
  propTypeCd: string | null;
  /** Situs address (situs_addr). */
  situsAddr: string | null;
  /** Situs city (situs_city). */
  situsCity: string | null;
  /** Situs zip (situs_zip). */
  situsZip: string | null;
  /** Legal description (legal_desc). */
  legalDesc: string | null;
  /** Assessed value (assessed_val). */
  assessedVal: number | null;
  /** Market value (market_val). */
  marketVal: number | null;
  /** Land value (land_val). */
  landVal: number | null;
  /** Improvement value (imprv_val). */
  imprvVal: number | null;
  /** Appraisal year (appr_year). */
  apprYear: number | null;
  /** Last modified timestamp. */
  lastModified: string | null;
}

// ═══════════════════════════════════════════════════════════════
// PROPERTY OWNERSHIP (vw_TerraFusion_Property_Ownership)
// ═══════════════════════════════════════════════════════════════

/**
 * Ownership data from vw_TerraFusion_Property_Ownership.
 * Columns defined in pacscontract.v1.
 */
export interface PacsPropertyOwnership {
  /** Property ID (prop_id). */
  propId: number;
  /** Owner name (owner_name). */
  ownerName: string;
  /** Mailing address line 1 (mail_addr_1). */
  mailAddr1: string | null;
  /** Mailing address line 2 (mail_addr_2). */
  mailAddr2: string | null;
  /** Mailing city (mail_city). */
  mailCity: string | null;
  /** Mailing state (mail_state). */
  mailState: string | null;
  /** Mailing zip (mail_zip). */
  mailZip: string | null;
  /** Ownership percentage (pct_ownership). */
  pctOwnership: number | null;
  /** Deed date (deed_date). */
  deedDate: string | null;
}

// ═══════════════════════════════════════════════════════════════
// ASSESSMENT HISTORY (vw_TerraFusion_Assessment_History)
// ═══════════════════════════════════════════════════════════════

/**
 * Assessment history from vw_TerraFusion_Assessment_History.
 * Columns defined in pacscontract.v1.
 */
export interface PacsAssessmentHistory {
  /** Property ID (prop_id). */
  propId: number;
  /** Tax year (prop_val_yr). */
  propValYr: number;
  /** Assessed value (assessed_val). */
  assessedVal: number | null;
  /** Market value (market_val). */
  marketVal: number | null;
  /** Land value (land_val). */
  landVal: number | null;
  /** Improvement value (imprv_val). */
  imprvVal: number | null;
  /** Appraised by (appraised_by). */
  appraisedBy: string | null;
  /** Appraisal date (appraisal_dt). */
  appraisalDt: string | null;
}

// ═══════════════════════════════════════════════════════════════
// HEALTH & CONTRACT STATUS
// ═══════════════════════════════════════════════════════════════

/** Health status returned by the PACS health check endpoint. */
export interface PacsHealthStatus {
  /** Current health status. */
  status: 'healthy' | 'unhealthy';
  /** Timestamp of the health check. */
  timestamp: string;
  /** PACS version string (may be "unknown"). */
  pacsVersion: string | null;
  /** Response time in milliseconds. */
  responseTime: number;
  /** Error message when unhealthy. */
  message?: string;
  /** Error detail when unhealthy. */
  error?: string;
}

/** System status from the PACS system status endpoint. */
export interface PacsSystemStatus {
  /** Whether the PACS system is online. */
  isOnline: boolean;
  /** PACS software version. */
  pacsVersion: string | null;
  /** Timestamp of last health check. */
  lastHealthCheck: string;
  /** Number of active database connections. */
  activeConnections: number;
  /** Response time in milliseconds. */
  responseTime: number;
  /** Individual service statuses. */
  serviceStatus: Record<string, boolean>;
}

// ═══════════════════════════════════════════════════════════════
// SEARCH & PAGINATION
// ═══════════════════════════════════════════════════════════════

/** Query parameters for property search. */
export interface PropertySearchQuery {
  /** Free-text search against address, owner, or parcel ID. */
  q?: string;
  /** Property type code filter. */
  propTypeCd?: string;
  /** Minimum assessed value filter. */
  minAssessedVal?: number;
  /** Maximum assessed value filter. */
  maxAssessedVal?: number;
  /** Page number (1-based). */
  page?: number;
  /** Page size (max 1000). */
  pageSize?: number;
}

/** Paged result wrapper matching backend PacsPagedResult<T>. */
export interface PacsPagedResult<T> {
  /** Items on this page. */
  items: T[];
  /** Current page number (1-based). */
  page: number;
  /** Page size. */
  pageSize: number;
  /** Total number of items across all pages. */
  totalCount: number;
  /** Total number of pages. */
  totalPages: number;
  /** Whether there are more pages. */
  hasMore: boolean;
}

// ═══════════════════════════════════════════════════════════════
// MAPPED DTO TYPES (controller response shapes)
// ═══════════════════════════════════════════════════════════════

/**
 * Property as returned by the HarrisPACSIntegration controller.
 * This is the mapped/flattened version of PacsPropertyCore.
 */
export interface PACSProperty {
  parcelId: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  landValue: number | null;
  improvementValue: number | null;
  totalValue: number | null;
  propertyType: string | null;
  acreage: number | null;
  yearBuilt: number | null;
  legalDescription: string | null;
  lastUpdated: string;
}

/**
 * Owner as returned by the HarrisPACSIntegration controller.
 * This is the mapped version of PacsPropertyOwnership.
 */
export interface PACSOwner {
  id: string;
  parcelId: string;
  name: string;
  mailingAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  ownershipPercentage: number;
}

/**
 * Assessment as returned by the HarrisPACSIntegration controller.
 * This is the mapped version of PacsAssessmentHistory.
 */
export interface PACSAssessment {
  id: string;
  parcelId: string;
  assessmentYear: number;
  landValue: number;
  improvementValue: number;
  totalValue: number;
  taxableValue: number;
  assessmentDate: string;
  exemptionAmount: number | null;
}

// ═══════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════

/** PACS error codes from pacscontract.v1. */
export const PacsErrorCodes = {
  CONNECTION_FAILED: 'PACS_CONNECTION_FAILED',
  VIEW_MISSING: 'PACS_VIEW_MISSING',
  INDEX_MISSING: 'PACS_INDEX_MISSING',
  PROCEDURE_MISSING: 'PACS_PROCEDURE_MISSING',
  PERMISSION_DENIED: 'PACS_PERMISSION_DENIED',
  TIMEOUT: 'PACS_TIMEOUT',
  HEALTH_CHECK_FAILED: 'PACS_HEALTH_CHECK_FAILED',
} as const;

export type PacsErrorCode = (typeof PacsErrorCodes)[keyof typeof PacsErrorCodes];

/** Structured error from a PACS API call. */
export interface PacsApiError {
  /** HTTP status code. */
  status: number;
  /** Error summary. */
  error: string;
  /** Detailed error information. */
  details: string | string[];
  /** PACS-specific error code when applicable. */
  pacsErrorCode?: PacsErrorCode;
  /** Timestamp of the error. */
  timestamp: string;
}
