/**
 * TerraFusion OS — Dossier Details Contract Interfaces
 * =================================================================
 *
 * TypeScript interfaces mirroring the backend ParcelDossierDetailsDto
 * and nested records from CX-23/CX-24.
 *
 * Key contract rules:
 * - All section fields are nullable (T | null).
 *   When ?include= is specified, non-requested sections serialize as null.
 *   Default (no include param) = all sections populated.
 * - PII-redacted: note headers contain metadata only (no content/preview).
 * - County-isolated: cross-county requests return 404 (anti-enumeration).
 *
 * @see backend/src/TerraFusion.API/DTOs/ParcelDossierDetailsDto.cs
 */

// ============================================================================
// Top-Level Response
// ============================================================================

/**
 * Mirrors ParcelDossierDetailsDto.
 * CX-24: All section fields nullable for selective includes.
 */
export interface DossierDetailsResponse {
  parcelId: string;
  countyId: string;
  generatedAt: string; // ISO 8601
  piiRedacted: boolean;

  /** CX-24: Echoes inbound X-Correlation-ID or server-generated "dossier-" prefix. */
  correlationId?: string;

  /** CX-24: Stable resource links for evidence navigation. */
  links?: DossierResourceLinks;

  // ---------- Nullable Sections ----------
  property: DossierPropertyDetails | null;
  valuation: DossierValuationSignals | null;
  levies: DossierLevyDetails | null;
  notes: DossierNoteHeaders | null;
}

// ============================================================================
// Section: Property
// ============================================================================

/** Mirrors PropertyDetails record. CAMA-ready placeholders included. */
export interface DossierPropertyDetails {
  propertyId: string;
  parcelNumber: string;
  address: string;
  propertyType: string | null;
  yearBuilt: number | null;
  assessedValue: number;
  landValue: number;
  improvementValue: number;
  marketValue: number;
  taxYear: number;
  assessmentDate: string; // ISO 8601

  // CAMA-ready placeholders — null until Property entity gains these columns
  classCode: string | null;
  useCode: string | null;
  neighborhood: string | null;
}

// ============================================================================
// Section: Valuation
// ============================================================================

/** Mirrors ValuationSignals record. */
export interface DossierValuationSignals {
  totalValue: number;
  categoryCount: number;
  categories: DossierValuationCategory[];
}

/** Mirrors ValuationCategory record. */
export interface DossierValuationCategory {
  name: string;
  amount: number;
  percentage: number;
}

// ============================================================================
// Section: Levies
// ============================================================================

/** Mirrors LevyDetails record. */
export interface DossierLevyDetails {
  levyCountTotal: number;
  levyCountReturned: number;
  recent: DossierLevyEntry[];
}

/** Mirrors LevyEntry record. */
export interface DossierLevyEntry {
  taxLevyId: string;
  taxingDistrict: string;
  taxRate: number;
  levyAmount: number;
  /** This parcel's annual obligation = taxRate × (assessedValue / 1000). */
  parcelLevyAmount: number;
  taxYear: number;
  purpose: string;
  effectiveDate: string; // ISO 8601
}

// ============================================================================
// Section: Notes (headers only — PII-redacted)
// ============================================================================

/** Mirrors NoteHeaders record. */
export interface DossierNoteHeaders {
  noteCountTotal: number;
  noteCountReturned: number;
  items: DossierNoteHeaderItem[];
}

/**
 * Mirrors NoteHeaderItem record.
 * PII-redacted: authorKind replaces createdBy; no content/preview fields.
 */
export interface DossierNoteHeaderItem {
  noteId: string;
  noteType: string;
  createdAt: string; // ISO 8601
  authorKind: string; // e.g. "staff", "system", "taxpayer"
}

// ============================================================================
// Resource Links
// ============================================================================

/**
 * Mirrors DossierResourceLinks record.
 * All paths are relative API routes — no host/scheme, safe for any deployment.
 */
export interface DossierResourceLinks {
  self: string;
  summary: string | null;
  details: string | null;
  notes: string;
  casefile: string;
}

// ============================================================================
// Request Options
// ============================================================================

/**
 * Options for the getDetails() service call.
 * Maps to query parameters on GET /api/dossier/parcels/{parcelId}/details
 */
export interface DossierDetailsOptions {
  /** Comma-separated section names: property, valuation, levies, notes */
  include?: string;
  /** Max levy entries to return (default: server-side default) */
  levyLimit?: number;
  /** Max note headers to return (default: server-side default) */
  noteLimit?: number;
}
