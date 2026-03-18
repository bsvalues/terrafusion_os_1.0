/**
 * TFR-094: Parcel 360 Type Definitions
 *
 * Comprehensive parcel type with all 12 schema sections.
 */

// ---------------------------------------------------------------------------
// Re-exported cross-cutting types
// ---------------------------------------------------------------------------

export type { FieldDiff as TraceFieldDiff } from '../services/terraTrace';

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
  | 'workflow';

export type SourceModule = 'forge' | 'dais' | 'atlas' | 'dossier' | 'os' | 'pilot';

export interface TraceEvent {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: string;
  countyId: string;
}

// ---------------------------------------------------------------------------
// Section types
// ---------------------------------------------------------------------------

export interface ParcelIdentity {
  parcelNumber: string;
  altParcelNumber?: string;
  county: string;
  countyId: string;
  jurisdiction: string;
  taxCodeArea: string;
  mapPage?: string;
  censusBlock?: string;
  censusTract?: string;
}

export interface ParcelOwnership {
  ownerName: string;
  coOwnerName?: string;
  ownershipType: string;
  mailingAddress: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  acquisitionDate?: string;
  acquisitionType?: string;
}

export interface ParcelLand {
  situs: string;
  legalDescription: string;
  landArea: number;
  landAreaUnit: 'sqft' | 'acres';
  zoning: string;
  landUse: string;
  topography?: string;
  utilities?: string[];
  floodZone?: string;
  soilType?: string;
  frontage?: number;
  depth?: number;
  shape?: string;
}

export interface ParcelImprovement {
  improvementId: string;
  buildingType: string;
  yearBuilt: number;
  effectiveYear?: number;
  buildingSqFt: number;
  stories: number;
  bedrooms?: number;
  bathrooms?: number;
  garage?: string;
  garageSqFt?: number;
  basementSqFt?: number;
  basementFinished?: number;
  condition: string;
  quality: string;
  roofType?: string;
  exteriorWall?: string;
  heatingType?: string;
  coolingType?: string;
  fireplace?: boolean;
  pool?: boolean;
}

export interface ParcelSale {
  saleId: string;
  saleDate: string;
  salePrice: number;
  buyer: string;
  seller: string;
  instrumentNumber?: string;
  deedType?: string;
  qualified: boolean;
  qualificationCode?: string;
  verificationSource?: string;
  verificationDate?: string;
}

export interface ParcelValuation {
  assessmentYear: number;
  landValue: number;
  improvementValue: number;
  totalValue: number;
  method: 'cost' | 'sales_comparison' | 'income' | 'hybrid';
  effectiveDate: string;
  appraiser?: string;
  modelVersion?: string;
  confidenceScore?: number;
}

export interface ParcelExemption {
  exemptionId: string;
  exemptionType: string;
  effectiveDate: string;
  expirationDate?: string;
  amount: number;
  status: 'active' | 'expired' | 'pending';
  applicantName?: string;
}

export interface ParcelPermit {
  permitId: string;
  permitNumber: string;
  permitType: string;
  issuedDate: string;
  completionDate?: string;
  estimatedCost: number;
  description: string;
  status: 'issued' | 'in_progress' | 'final' | 'expired';
  contractor?: string;
}

export interface ParcelWorkflow {
  currentStatus: string;
  assignedTo?: string;
  lastAction: string;
  lastActionDate: string;
  nextAction?: string;
  nextActionDueDate?: string;
  reviewCycle: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface ParcelNote {
  noteId: string;
  author: string;
  timestamp: string;
  category: 'general' | 'inspection' | 'valuation' | 'legal' | 'taxpayer';
  text: string;
  isConfidential: boolean;
}

export interface ParcelAudit {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  lastInspectionDate?: string;
  lastInspectedBy?: string;
  dataQualityScore: number;
  dataQualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface ParcelAppeal {
  appealId: string;
  filedDate: string;
  filingType: 'informal' | 'formal' | 'board' | 'court';
  status: 'pending' | 'scheduled' | 'heard' | 'decided' | 'withdrawn';
  petitionerName: string;
  currentValue: number;
  requestedValue: number;
  determinedValue?: number;
  hearingDate?: string;
  decisionDate?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Composite type — all 12 sections
// ---------------------------------------------------------------------------

export interface Parcel360 {
  identity: ParcelIdentity;
  ownership: ParcelOwnership;
  land: ParcelLand;
  improvements: ParcelImprovement[];
  sales: ParcelSale[];
  valuation: ParcelValuation;
  exemptions: ParcelExemption[];
  permits: ParcelPermit[];
  workflow: ParcelWorkflow;
  notes: ParcelNote[];
  audit: ParcelAudit;
  appeals: ParcelAppeal[];
}
