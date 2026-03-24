/**
 * TerraFusion OS — Canonical Domain Contract
 *
 * Single source of truth for all property assessment domain types.
 * Derived from backend entities (PropertyAssessment, Property, County,
 * TaxLevy, ValuationRecord, LevyCertification, TreasuryEntities).
 *
 * Rules:
 *   - ID fields are readonly
 *   - Monetary values are number (dollars, not cents)
 *   - Dates are ISO 8601 strings
 *   - Optional fields use `?` not `| undefined`
 */

// ---------------------------------------------------------------------------
// Core Property
// ---------------------------------------------------------------------------

export interface Property {
  readonly parcelId: string;
  readonly countyCode: string;
  harrisPacsId?: string;

  // Location
  address: string;
  city: string;
  state: string;
  zip: string;
  legalDescription: string;
  neighborhood?: string;
  zoning?: string;

  // Owner
  ownerName: string;
  ownerMailingAddress?: string;

  // Classification
  propertyType: PropertyType;
  propertyUseCode?: string;
  landUseDescription?: string;

  // Physical
  landAcreage: number;
  yearBuilt: number;
  buildingSquareFeet: number;
  bedrooms?: number;
  bathrooms?: number;

  // Valuation (current year)
  landValue: number;
  improvementValue: number;
  totalAssessedValue: number;
  marketValue: number;
  taxableValue: number;
  exemptionAmount: number;
  exemptionTypes?: string[];

  // AI Enhancement
  aiEstimatedValue?: number;
  aiConfidenceScore?: number; // 0.0–1.0

  // Status
  assessmentStatus: AssessmentStatus;
  assessmentYear: number;
  assessmentDate: string;
  lastUpdated: string;

  // Geographic
  latitude?: number;
  longitude?: number;

  // Sale History
  lastSaleDate?: string;
  lastSalePrice?: number;

  // Flags
  hasActivePermits: boolean;
  hasAppeals: boolean;

  // Tax District
  taxDistrictCode?: string;
  taxDistrictName?: string;
  specialDistricts?: string[];

  // Data Quality
  dataQualityScore?: number; // 0.0–1.0
  dataSource: DataSource;
}

export type PropertyType =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'agricultural'
  | 'vacant-land'
  | 'multi-family'
  | 'mixed-use'
  | 'exempt'
  | 'other';

export type AssessmentStatus =
  | 'active'
  | 'under-review'
  | 'appealed'
  | 'exempt'
  | 'pending'
  | 'sealed';

export type DataSource =
  | 'harris-pacs'
  | 'harris-pacs-live'
  | 'manual-entry'
  | 'ai-enhancement'
  | 'batch-import'
  | 'snapshot'
  | 'fixture';

// ---------------------------------------------------------------------------
// Assessment History
// ---------------------------------------------------------------------------

export interface Assessment {
  readonly assessmentId: string;
  readonly parcelId: string;
  assessmentYear: number;
  assessmentDate: string;

  landValue: number;
  improvementValue: number;
  totalAssessedValue: number;
  marketValue: number;
  taxableValue: number;
  exemptionAmount: number;

  assessmentMethod?: string;
  assessorNotes?: string;
  isActive: boolean;

  // AI
  aiEstimatedValue?: number;
  aiConfidenceScore?: number;

  // Compliance
  iaaoCompliant?: boolean;
  dataQualityScore?: number;
}

// ---------------------------------------------------------------------------
// Valuation Record (immutable, sealed)
// ---------------------------------------------------------------------------

export interface ValuationRecord {
  readonly valuationId: string;
  readonly parcelId: string;
  taxYear: number;
  propertyType: PropertyType;

  // Cost Approach
  costApproachValue?: number;
  buildingType?: string;
  squareFeet?: number;
  rcn?: number;             // Replacement Cost New
  depreciationPercent?: number;
  rcnld?: number;           // RCN Less Depreciation
  costLandValue?: number;
  siteImprovementValue?: number;

  // Income Approach
  incomeApproachValue?: number;
  grossIncome?: number;
  vacancyRate?: number;
  operatingExpenses?: number;
  netOperatingIncome?: number;
  capRate?: number;

  // Sales Comparison
  salesComparisonValue?: number;
  comparableCount?: number;
  medianAdjustedPrice?: number;

  // Reconciliation
  finalReconciledValue?: number;
  spread?: number;
  overallConfidence?: number;

  status: 'draft' | 'reviewed' | 'sealed';
  createdBy?: string;
  reviewedBy?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Tax & Levy
// ---------------------------------------------------------------------------

export interface TaxDistrict {
  readonly districtCode: string;
  districtName: string;
  countyCode: string;
  levyRate: number;          // mills or rate per $1,000
  levyAmount: number;
  taxYear: number;
  purpose?: string;
  effectiveDate: string;
  expirationDate?: string;
  isActive: boolean;
}

export interface LevyCertification {
  readonly certificationId: string;
  districtCode: string;
  districtName: string;
  taxYear: number;

  priorYearLevy: number;
  requestedLevy: number;
  certifiedLevy: number;
  assessedValue: number;
  newConstructionValue: number;

  levyRate: number;
  statutoryLimit: number;
  constitutionalLimit: number;  // 1% limit
  aggregateLimit: number;       // $5.90 limit

  withinConstitutionalLimit: boolean;
  withinAggregateLimit: boolean;
  wasReduced: boolean;
  reductionAmount: number;

  status: string;
}

export interface TaxStatement {
  readonly statementId: string;
  readonly parcelId: string;
  taxYear: number;
  totalDue: number;
  paid: number;
  balance: number;
  dueDate?: string;
  payments: TaxPayment[];
}

export interface TaxPayment {
  readonly paymentId: string;
  receiptId: string;
  parcelId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
}

export interface DelinquencyRecord {
  readonly parcelId: string;
  amountOverdue: number;
  oldestDelinquentYear: number;
  isDelinquent: boolean;
}

// ---------------------------------------------------------------------------
// Appeals
// ---------------------------------------------------------------------------

export interface Appeal {
  readonly appealId: string;
  readonly parcelId: string;
  appealYear: number;
  filingDate: string;
  hearingDate?: string;
  status: AppealStatus;
  petitionerName: string;
  currentAssessedValue: number;
  petitionedValue: number;
  determinedValue?: number;
  reason?: string;
  resolution?: string;
  resolvedDate?: string;
}

export type AppealStatus =
  | 'filed'
  | 'scheduled'
  | 'heard'
  | 'decided'
  | 'withdrawn'
  | 'dismissed';

export interface HearingEvent {
  readonly hearingId: string;
  appealId: string;
  parcelId: string;
  scheduledDate: string;
  location?: string;
  hearingType: 'informal' | 'formal' | 'board-of-equalization';
  status: 'scheduled' | 'completed' | 'continued' | 'cancelled';
  outcome?: string;
}

// ---------------------------------------------------------------------------
// GIS / Atlas
// ---------------------------------------------------------------------------

export interface GISLayer {
  readonly layerId: string;
  layerName: string;
  layerType: GISLayerType;
  description?: string;
  source: string;
  visible: boolean;
  opacity: number; // 0.0–1.0
  zIndex: number;
  style?: Record<string, unknown>;
}

export type GISLayerType =
  | 'parcels'
  | 'zoning'
  | 'flood-zones'
  | 'soil-types'
  | 'aerial-imagery'
  | 'roads'
  | 'boundaries'
  | 'topography'
  | 'utilities';

export interface GISFeature {
  readonly featureId: string;
  layerId: string;
  parcelId?: string;
  geometry: GISGeometry;
  properties: Record<string, unknown>;
}

export interface GISGeometry {
  type: 'Point' | 'Polygon' | 'MultiPolygon' | 'LineString';
  coordinates: number[] | number[][] | number[][][] | number[][][][];
}

// ---------------------------------------------------------------------------
// Documents / Dossier
// ---------------------------------------------------------------------------

export interface ParcelDocument {
  readonly documentId: string;
  readonly parcelId: string;
  documentType: DocumentType;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  source: string;
  description?: string;
  tags?: string[];
}

export type DocumentType =
  | 'deed'
  | 'appraisal'
  | 'photo'
  | 'permit'
  | 'appeal-filing'
  | 'plat-map'
  | 'survey'
  | 'inspection-report'
  | 'correspondence'
  | 'tax-notice'
  | 'other';

// ---------------------------------------------------------------------------
// Clerk / Recording
// ---------------------------------------------------------------------------

export interface RecordingEntry {
  readonly recordingId: string;
  readonly parcelId: string;
  recordingType: RecordingType;
  documentNumber: string;
  recordingDate: string;
  grantor?: string;
  grantee?: string;
  consideration?: number;
  legalDescription?: string;
}

export type RecordingType =
  | 'warranty-deed'
  | 'quit-claim-deed'
  | 'lien'
  | 'release-of-lien'
  | 'easement'
  | 'mortgage'
  | 'release-of-mortgage'
  | 'plat'
  | 'boundary-line-adjustment'
  | 'other';

// ---------------------------------------------------------------------------
// Audit Trail
// ---------------------------------------------------------------------------

export interface AuditEntry {
  readonly auditId: string;
  readonly parcelId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  userId: string;
  userName: string;
  timestamp: string;
  source: string;
}

// ---------------------------------------------------------------------------
// Operations / Pilot / Trace
// ---------------------------------------------------------------------------

export interface OperationTrace {
  readonly traceId: string;
  readonly correlationId: string;
  operationName: string;
  module: string;
  parcelId?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  result?: string;
  error?: string;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'down';
  dataMode: 'live' | 'mock';
  services: ServiceStatus[];
  lastChecked: string;
}

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latencyMs?: number;
  lastChecked: string;
  details?: string;
}

// ---------------------------------------------------------------------------
// Aggregates (for dashboards)
// ---------------------------------------------------------------------------

export interface CountyAggregateStats {
  totalParcels: number;
  totalAssessedValue: number;
  averageAssessedValue: number;
  medianAssessedValue: number;
  assessedThisYear: number;
  pendingAssessments: number;
  activeAppeals: number;
  totalLevyRevenue: number;
  assessmentCompletionPercent: number;
  parcelsByType: Record<PropertyType, number>;
  parcelsByCity: Record<string, number>;
}

export interface AggregateProperty {
  readonly parcelId: string;
  address: string;
  city: string;
  totalAssessedValue: number;
  propertyType: PropertyType;
  landUseDescription?: string;
  taxDistrictCode?: string;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface PropertySearchResult {
  readonly parcelId: string;
  address: string;
  city: string;
  ownerName: string;
  totalAssessedValue: number;
  propertyType: PropertyType;
  assessmentYear: number;
}

export interface SearchQuery {
  text: string;
  filters?: {
    propertyType?: PropertyType;
    city?: string;
    minValue?: number;
    maxValue?: number;
    assessmentYear?: number;
  };
  page?: number;
  pageSize?: number;
}

export interface SearchResults<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  query: string;
}

// ---------------------------------------------------------------------------
// Calendar / Scheduling
// ---------------------------------------------------------------------------

export interface CalendarEvent {
  readonly eventId: string;
  title: string;
  eventType: 'hearing' | 'deadline' | 'review-period' | 'board-meeting';
  startDate: string;
  endDate?: string;
  description?: string;
  parcelId?: string;
  isAllDay: boolean;
}
