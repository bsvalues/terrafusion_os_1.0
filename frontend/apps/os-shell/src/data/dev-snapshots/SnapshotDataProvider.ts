/**
 * TerraFusion OS — Snapshot DataProvider
 *
 * Reads from promoted Benton County snapshot exports.
 * These are real PACS-sourced records extracted from terrafusion-dev.db,
 * not hand-authored fantasy mocks.
 *
 * Data files:
 *   benton-snapshot-mini.json    — 200 parcels with CAMA characteristics
 *   benton-golden-parcels.json   — 20 parcels with full data coverage
 *   benton-comparable-sales.json — comparable sales for snapshot parcels
 *   benton-aggregates.json       — county-wide aggregate stats by type
 *   benton-levies.json           — active tax levy records
 */

import type { DataProvider, DataMode } from '../../services/dataProvider';
import type {
  Property,
  PropertyType,
  Assessment,
  ValuationRecord,
  TaxDistrict,
  LevyCertification,
  TaxStatement,
  Appeal,
  HearingEvent,
  GISLayer,
  ParcelDocument,
  RecordingEntry,
  AuditEntry,
  OperationTrace,
  SystemHealthStatus,
  CountyAggregateStats,
  AggregateProperty,
  PropertySearchResult,
  SearchQuery,
  SearchResults,
  CalendarEvent,
} from '../../types/domain';

// Import snapshot JSON
import snapshotParcels from './benton-snapshot-mini.json';
import goldenParcels from './benton-golden-parcels.json';
import comparableSales from './benton-comparable-sales.json';
import aggregateStats from './benton-aggregates.json';
import levyData from './benton-levies.json';

// ---------------------------------------------------------------------------
// Raw snapshot types (match SQLite export shape)
// ---------------------------------------------------------------------------

interface RawSnapshotParcel {
  parcelId: string;
  address: string;
  propertyType: string;
  assessedValue: number;
  landValue: number;
  improvementValue: number;
  marketValue: number;
  taxYear: number;
  yearBuilt: number | null;
  squareFeet: number | null;
  stories: number | null;
  basementSqft: number | null;
  garageSqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  fireplaces: number | null;
  qualityGrade: string | null;
  conditionGrade: string | null;
  buildingType: string | null;
  exteriorWall: string | null;
  roofType: string | null;
  foundation: string | null;
  hvacType: string | null;
  region: string | null;
  landAreaSqft: number | null;
  ownerName?: string | null;
}

interface RawSale {
  parcelId: string;
  saleDate: string;
  salePrice: number;
  propertyType: string;
  address: string | null;
  grossLivingArea: number | null;
  lotSizeSqft: number | null;
  yearBuilt: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  condition: string | null;
  qualityGrade: string | null;
  saleQualification: string;
}

interface RawAggregate {
  propertyType: string;
  count: number;
  totalAssessed: number;
  avgAssessed: number;
  totalLand: number;
  totalImprovement: number;
}

interface RawLevy {
  Id: string;
  CountyId: string;
  TaxingDistrict: string | null;
  TaxRate: string;
  LevyAmount: string;
  TaxYear: number;
  Purpose: string | null;
  EffectiveDate: string;
  ExpirationDate: string | null;
  IsActive: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map PACS property type code to domain PropertyType */
function mapPropertyType(raw: string): PropertyType {
  switch (raw) {
    case 'R':
    case 'Residential':
      return 'residential';
    case 'C':
    case 'Commercial':
      return 'commercial';
    case 'I':
    case 'Industrial':
      return 'industrial';
    case 'A':
    case 'Agricultural':
      return 'agricultural';
    case 'MH':
      return 'residential'; // manufactured homes → residential
    case 'P':
      return 'other'; // personal property
    case 'V':
      return 'vacant-land';
    case 'M':
      return 'multi-family';
    case 'X':
      return 'exempt';
    default:
      return 'other';
  }
}

/** Parse city from Benton-style address "123 MAIN ST KENNEWICK, WA 99336" */
function parseCity(address: string): string {
  const cities = ['KENNEWICK', 'RICHLAND', 'WEST RICHLAND', 'PROSSER', 'BENTON CITY'];
  const upper = address.toUpperCase();
  for (const city of cities) {
    if (upper.includes(city)) {
      return city.split(' ').map(w => w[0] + w.slice(1).toLowerCase()).join(' ');
    }
  }
  return 'Benton County';
}

/** Parse zip from address */
function parseZip(address: string): string {
  const match = address.match(/\b(99\d{3})\b/);
  return match ? match[1] : '99336';
}

/** Deterministic hash for reproducible derived values */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ---------------------------------------------------------------------------
// Convert raw snapshot to domain Property
// ---------------------------------------------------------------------------

function toProperty(raw: RawSnapshotParcel): Property {
  const city = parseCity(raw.address);
  const h = hash(raw.parcelId);
  const acres = raw.landAreaSqft ? raw.landAreaSqft / 43560 : 0;

  return {
    parcelId: raw.parcelId,
    countyCode: 'BENTON',
    address: raw.address,
    city,
    state: 'WA',
    zip: parseZip(raw.address),
    legalDescription: `Parcel ${raw.parcelId}`,
    ownerName: raw.ownerName ?? `Owner ${h % 10000}`,
    propertyType: mapPropertyType(raw.propertyType),
    landAcreage: Math.round(acres * 100) / 100,
    yearBuilt: raw.yearBuilt ?? 0,
    buildingSquareFeet: raw.squareFeet ?? 0,
    bedrooms: raw.bedrooms ?? undefined,
    bathrooms: raw.bathrooms ?? undefined,
    landValue: raw.landValue,
    improvementValue: raw.improvementValue,
    totalAssessedValue: raw.assessedValue,
    marketValue: raw.marketValue,
    taxableValue: raw.assessedValue,
    exemptionAmount: 0,
    assessmentStatus: 'active',
    assessmentYear: raw.taxYear || 2025,
    assessmentDate: '2025-01-15',
    lastUpdated: '2025-06-01',
    latitude: 46.2 + (h % 100) / 1000,
    longitude: -119.2 - (hash(raw.parcelId + 'lng') % 100) / 1000,
    hasActivePermits: h % 7 === 0,
    hasAppeals: h % 11 === 0,
    taxDistrictCode: raw.region ?? undefined,
    dataSource: 'snapshot',
    aiEstimatedValue: Math.round(raw.assessedValue * (0.95 + (h % 10) / 100)),
    aiConfidenceScore: 0.82 + (h % 15) / 100,
    dataQualityScore: 0.88 + (h % 10) / 100,
  };
}

// ---------------------------------------------------------------------------
// Build indexes on init
// ---------------------------------------------------------------------------

const allRawParcels = [
  ...(goldenParcels as RawSnapshotParcel[]),
  ...(snapshotParcels as RawSnapshotParcel[]),
];

// Deduplicate by parcelId (golden parcels take priority)
const rawByParcel = new Map<string, RawSnapshotParcel>();
for (const raw of allRawParcels) {
  if (!rawByParcel.has(raw.parcelId)) {
    rawByParcel.set(raw.parcelId, raw);
  }
}

const properties: Property[] = Array.from(rawByParcel.values()).map(toProperty);
const propertyIndex = new Map<string, Property>();
for (const p of properties) propertyIndex.set(p.parcelId, p);

const salesByParcel = new Map<string, RawSale[]>();
for (const sale of comparableSales as RawSale[]) {
  const arr = salesByParcel.get(sale.parcelId) ?? [];
  arr.push(sale);
  salesByParcel.set(sale.parcelId, arr);
}

// ---------------------------------------------------------------------------
// SnapshotDataProvider
// ---------------------------------------------------------------------------

export class SnapshotDataProvider implements DataProvider {
  readonly mode: DataMode = 'snapshot';

  // -- Search ----------------------------------------------------------------

  async search(query: SearchQuery): Promise<SearchResults<PropertySearchResult>> {
    const text = (query.text || '').toLowerCase();
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    let filtered = properties;

    if (text) {
      filtered = filtered.filter(
        (p) =>
          p.parcelId.toLowerCase().includes(text) ||
          p.address.toLowerCase().includes(text) ||
          p.ownerName.toLowerCase().includes(text) ||
          p.city.toLowerCase().includes(text),
      );
    }

    if (query.filters?.propertyType) {
      filtered = filtered.filter((p) => p.propertyType === query.filters!.propertyType);
    }
    if (query.filters?.city) {
      filtered = filtered.filter(
        (p) => p.city.toLowerCase() === query.filters!.city!.toLowerCase(),
      );
    }
    if (query.filters?.minValue != null) {
      filtered = filtered.filter((p) => p.totalAssessedValue >= query.filters!.minValue!);
    }
    if (query.filters?.maxValue != null) {
      filtered = filtered.filter((p) => p.totalAssessedValue <= query.filters!.maxValue!);
    }

    const start = (page - 1) * pageSize;
    const items: PropertySearchResult[] = filtered
      .slice(start, start + pageSize)
      .map((p) => ({
        parcelId: p.parcelId,
        address: p.address,
        city: p.city,
        ownerName: p.ownerName,
        totalAssessedValue: p.totalAssessedValue,
        propertyType: p.propertyType,
        assessmentYear: p.assessmentYear,
      }));

    return {
      items,
      totalCount: filtered.length,
      page,
      pageSize,
      query: text,
    };
  }

  async getParcel(parcelId: string): Promise<Property | null> {
    return propertyIndex.get(parcelId) ?? null;
  }

  // -- Assessment ------------------------------------------------------------

  async getAssessments(parcelId: string): Promise<Assessment[]> {
    const prop = propertyIndex.get(parcelId);
    if (!prop) return [];

    // Generate 3 years of assessment history from the snapshot values
    const baseYear = prop.assessmentYear || 2025;
    return [2, 1, 0].map((offset) => {
      const year = baseYear - offset;
      const factor = 1 - offset * 0.04; // ~4% annual growth
      return {
        assessmentId: `ASM-${parcelId}-${year}`,
        parcelId,
        assessmentYear: year,
        assessmentDate: `${year}-01-15`,
        landValue: Math.round(prop.landValue * factor),
        improvementValue: Math.round(prop.improvementValue * factor),
        totalAssessedValue: Math.round(prop.totalAssessedValue * factor),
        marketValue: Math.round(prop.marketValue * factor),
        taxableValue: Math.round(prop.totalAssessedValue * factor),
        exemptionAmount: 0,
        isActive: offset === 0,
        aiEstimatedValue: prop.aiEstimatedValue
          ? Math.round(prop.aiEstimatedValue * factor)
          : undefined,
        aiConfidenceScore: prop.aiConfidenceScore,
      };
    });
  }

  async getValuationRecord(
    parcelId: string,
    taxYear: number,
  ): Promise<ValuationRecord | null> {
    const prop = propertyIndex.get(parcelId);
    if (!prop) return null;
    const sales = salesByParcel.get(parcelId) ?? [];

    return {
      valuationId: `VAL-${parcelId}-${taxYear}`,
      parcelId,
      taxYear,
      propertyType: prop.propertyType,
      costApproachValue: prop.totalAssessedValue,
      squareFeet: prop.buildingSquareFeet || undefined,
      salesComparisonValue: sales.length > 0
        ? Math.round(sales.reduce((s, c) => s + c.salePrice, 0) / sales.length)
        : undefined,
      comparableCount: sales.length || undefined,
      finalReconciledValue: prop.totalAssessedValue,
      overallConfidence: prop.aiConfidenceScore,
      status: 'sealed',
      createdAt: `${taxYear}-04-01T00:00:00Z`,
    };
  }

  // -- Tax & Levy ------------------------------------------------------------

  async getLevyDistricts(): Promise<TaxDistrict[]> {
    return (levyData as RawLevy[]).map((l) => ({
      districtCode: l.Id,
      districtName: l.TaxingDistrict ?? `District ${l.Id.slice(0, 8)}`,
      countyCode: 'BENTON',
      levyRate: parseFloat(l.TaxRate) || 0,
      levyAmount: parseFloat(l.LevyAmount) || 0,
      taxYear: l.TaxYear,
      purpose: l.Purpose ?? undefined,
      effectiveDate: l.EffectiveDate,
      expirationDate: l.ExpirationDate ?? undefined,
      isActive: l.IsActive === 1,
    }));
  }

  async getLevyCertifications(taxYear: number): Promise<LevyCertification[]> {
    // Derive from levy data
    return (levyData as RawLevy[])
      .filter((l) => l.TaxYear === taxYear && l.IsActive === 1)
      .map((l) => ({
        certificationId: `CERT-${l.Id}`,
        districtCode: l.Id,
        districtName: l.TaxingDistrict ?? `District ${l.Id.slice(0, 8)}`,
        taxYear,
        priorYearLevy: parseFloat(l.LevyAmount) * 0.97,
        requestedLevy: parseFloat(l.LevyAmount) * 1.01,
        certifiedLevy: parseFloat(l.LevyAmount),
        assessedValue: 20000000000, // county-wide
        newConstructionValue: 500000000,
        levyRate: parseFloat(l.TaxRate),
        statutoryLimit: parseFloat(l.TaxRate) * 1.05,
        constitutionalLimit: 10.0,
        aggregateLimit: 5.9,
        withinConstitutionalLimit: true,
        withinAggregateLimit: true,
        wasReduced: false,
        reductionAmount: 0,
        status: 'certified',
      }));
  }

  async getTaxStatements(parcelId: string): Promise<TaxStatement[]> {
    const prop = propertyIndex.get(parcelId);
    if (!prop) return [];

    const rate = 0.012; // ~1.2% effective rate
    const tax = Math.round(prop.totalAssessedValue * rate);

    return [
      {
        statementId: `TAX-${parcelId}-2025`,
        parcelId,
        taxYear: 2025,
        totalDue: tax,
        paid: Math.round(tax / 2),
        balance: Math.round(tax / 2),
        dueDate: '2026-04-30',
        payments: [
          {
            paymentId: `PAY-${parcelId}-2025-1`,
            receiptId: `REC-${hash(parcelId)}`,
            parcelId,
            amount: Math.round(tax / 2),
            paymentMethod: 'check',
            paymentDate: '2025-10-28',
          },
        ],
      },
    ];
  }

  // -- Appeals ---------------------------------------------------------------

  async getAppeals(parcelId: string): Promise<Appeal[]> {
    const prop = propertyIndex.get(parcelId);
    if (!prop || !prop.hasAppeals) return [];

    return [
      {
        appealId: `APL-${parcelId}-2025`,
        parcelId,
        appealYear: 2025,
        filingDate: '2025-05-20',
        hearingDate: '2025-07-15T09:00:00',
        status: 'scheduled',
        petitionerName: prop.ownerName,
        currentAssessedValue: prop.totalAssessedValue,
        petitionedValue: Math.round(prop.totalAssessedValue * 0.85),
        reason: 'Market value exceeds comparable sales',
      },
    ];
  }

  async getHearings(parcelId?: string): Promise<HearingEvent[]> {
    const appeals = parcelId
      ? await this.getAppeals(parcelId)
      : properties
          .filter((p) => p.hasAppeals)
          .flatMap((p) => {
            const h = hash(p.parcelId);
            return [
              {
                appealId: `APL-${p.parcelId}-2025`,
                parcelId: p.parcelId,
                appealYear: 2025,
                filingDate: '2025-05-20',
                hearingDate: `2025-07-${14 + (h % 10)}T09:00:00`,
                status: 'scheduled' as const,
                petitionerName: p.ownerName,
                currentAssessedValue: p.totalAssessedValue,
                petitionedValue: Math.round(p.totalAssessedValue * 0.85),
                reason: 'Market value exceeds comparable sales',
              },
            ];
          });

    return appeals
      .filter((a) => a.hearingDate)
      .map((a) => ({
        hearingId: `HRG-${a.parcelId}-2025`,
        appealId: a.appealId,
        parcelId: a.parcelId,
        scheduledDate: a.hearingDate!,
        location: 'Benton County Courthouse, Room 214',
        hearingType: 'board-of-equalization' as const,
        status: 'scheduled' as const,
      }));
  }

  // -- GIS -------------------------------------------------------------------

  async getLayers(): Promise<GISLayer[]> {
    return [
      { layerId: 'lyr-parcels', layerName: 'Parcels', layerType: 'parcels', source: 'benton-gis', visible: true, opacity: 1.0, zIndex: 10, description: 'Benton County parcel boundaries' },
      { layerId: 'lyr-zoning', layerName: 'Zoning', layerType: 'zoning', source: 'benton-gis', visible: false, opacity: 0.6, zIndex: 20, description: 'Municipal zoning districts' },
      { layerId: 'lyr-flood', layerName: 'Flood Zones', layerType: 'flood-zones', source: 'fema', visible: false, opacity: 0.5, zIndex: 30, description: 'FEMA flood hazard zones' },
      { layerId: 'lyr-soil', layerName: 'Soil Types', layerType: 'soil-types', source: 'usda-nrcs', visible: false, opacity: 0.4, zIndex: 15, description: 'USDA soil survey data' },
      { layerId: 'lyr-aerial', layerName: 'Aerial Imagery', layerType: 'aerial-imagery', source: 'benton-gis', visible: true, opacity: 1.0, zIndex: 1, description: '2024 aerial orthophotography' },
      { layerId: 'lyr-roads', layerName: 'Roads', layerType: 'roads', source: 'benton-gis', visible: true, opacity: 0.8, zIndex: 25, description: 'Road centerlines' },
      { layerId: 'lyr-boundaries', layerName: 'Boundaries', layerType: 'boundaries', source: 'benton-gis', visible: true, opacity: 0.7, zIndex: 5, description: 'City limits and UGA boundaries' },
      { layerId: 'lyr-topo', layerName: 'Topography', layerType: 'topography', source: 'usgs', visible: false, opacity: 0.5, zIndex: 2, description: 'USGS topographic contours' },
    ];
  }

  // -- Documents -------------------------------------------------------------

  async getDocuments(parcelId: string): Promise<ParcelDocument[]> {
    const prop = propertyIndex.get(parcelId);
    if (!prop) return [];

    const h = hash(parcelId);
    const docs: ParcelDocument[] = [
      {
        documentId: `DOC-${parcelId}-DEED`,
        parcelId,
        documentType: 'deed',
        title: 'Warranty Deed',
        fileName: `${parcelId}-deed.pdf`,
        fileSize: 45000 + (h % 30000),
        mimeType: 'application/pdf',
        uploadDate: '2023-06-15',
        source: 'county-recorder',
      },
      {
        documentId: `DOC-${parcelId}-APPR`,
        parcelId,
        documentType: 'appraisal',
        title: `${prop.assessmentYear} Assessment Worksheet`,
        fileName: `${parcelId}-appraisal-${prop.assessmentYear}.pdf`,
        fileSize: 120000 + (h % 80000),
        mimeType: 'application/pdf',
        uploadDate: `${prop.assessmentYear}-03-10`,
        source: 'assessor-office',
      },
    ];

    if (h % 3 === 0) {
      docs.push({
        documentId: `DOC-${parcelId}-PHOTO`,
        parcelId,
        documentType: 'photo',
        title: 'Property Photo',
        fileName: `${parcelId}-photo.jpg`,
        fileSize: 850000 + (h % 500000),
        mimeType: 'image/jpeg',
        uploadDate: `${prop.assessmentYear}-02-20`,
        source: 'field-inspection',
      });
    }

    if (prop.hasActivePermits) {
      docs.push({
        documentId: `DOC-${parcelId}-PERMIT`,
        parcelId,
        documentType: 'permit',
        title: 'Building Permit',
        fileName: `${parcelId}-permit.pdf`,
        fileSize: 35000,
        mimeType: 'application/pdf',
        uploadDate: '2024-09-15',
        source: 'building-dept',
      });
    }

    return docs;
  }

  // -- Clerk / Recording -----------------------------------------------------

  async getRecordingHistory(parcelId: string): Promise<RecordingEntry[]> {
    const prop = propertyIndex.get(parcelId);
    if (!prop) return [];

    const sales = salesByParcel.get(parcelId) ?? [];
    const h = hash(parcelId);

    const entries: RecordingEntry[] = [
      {
        recordingId: `REC-${parcelId}-DEED`,
        parcelId,
        recordingType: 'warranty-deed',
        documentNumber: `${2020 + (h % 5)}-${String(h % 99999).padStart(5, '0')}`,
        recordingDate: sales[0]?.saleDate ?? '2020-06-15',
        grantor: `Previous Owner ${h % 100}`,
        grantee: prop.ownerName,
        consideration: sales[0]?.salePrice ?? Math.round(prop.totalAssessedValue * 0.95),
      },
    ];

    if (h % 3 === 0) {
      entries.push({
        recordingId: `REC-${parcelId}-MORT`,
        parcelId,
        recordingType: 'mortgage',
        documentNumber: `${2020 + (h % 5)}-${String((h + 1000) % 99999).padStart(5, '0')}`,
        recordingDate: sales[0]?.saleDate ?? '2020-06-20',
        grantor: prop.ownerName,
        grantee: 'Pacific Northwest Mortgage Co.',
        consideration: Math.round(
          (sales[0]?.salePrice ?? prop.totalAssessedValue * 0.95) * 0.8,
        ),
      });
    }

    return entries;
  }

  // -- Audit -----------------------------------------------------------------

  async getAuditTrail(parcelId: string): Promise<AuditEntry[]> {
    const prop = propertyIndex.get(parcelId);
    if (!prop) return [];

    return [
      {
        auditId: `AUD-${parcelId}-1`,
        parcelId,
        action: 'County Data Import',
        userId: 'terrafusionsync',
        userName: 'TerraFusion Sync Service',
        timestamp: '2025-01-15T08:00:00Z',
        source: 'pacs-sync',
      },
      {
        auditId: `AUD-${parcelId}-2`,
        parcelId,
        action: 'Assessment Review',
        field: 'totalAssessedValue',
        oldValue: String(Math.round(prop.totalAssessedValue * 0.96)),
        newValue: String(prop.totalAssessedValue),
        userId: 'assessor-1',
        userName: 'B. Valenzuela',
        timestamp: '2025-03-10T14:22:00Z',
        source: 'manual-review',
      },
      {
        auditId: `AUD-${parcelId}-3`,
        parcelId,
        action: 'AI Enhancement Applied',
        field: 'aiEstimatedValue',
        newValue: String(prop.aiEstimatedValue),
        userId: 'ai-agent-42',
        userName: 'CostForge AI',
        timestamp: '2025-04-05T10:15:00Z',
        source: 'ai-enhancement',
      },
    ];
  }

  // -- Operations / Pilot ----------------------------------------------------

  async getRecentOperations(parcelId?: string): Promise<OperationTrace[]> {
    const targets = parcelId
      ? [propertyIndex.get(parcelId)].filter(Boolean) as Property[]
      : properties.slice(0, 10);

    return targets.flatMap((p, i) => [
      {
        traceId: `TRC-${p.parcelId}-cost`,
        correlationId: `COR-${p.parcelId}-batch1`,
        operationName: 'CostForge Analysis',
        module: 'forge',
        parcelId: p.parcelId,
        status: 'completed' as const,
        startedAt: `2025-04-05T${String(8 + (i % 8)).padStart(2, '0')}:00:00Z`,
        completedAt: `2025-04-05T${String(8 + (i % 8)).padStart(2, '0')}:00:${String(2 + (i % 5)).padStart(2, '0')}Z`,
        durationMs: 2000 + (hash(p.parcelId + 'dur') % 3000),
        result: 'Value estimated successfully',
      },
      {
        traceId: `TRC-${p.parcelId}-comps`,
        correlationId: `COR-${p.parcelId}-batch1`,
        operationName: 'CompsForge Search',
        module: 'forge',
        parcelId: p.parcelId,
        status: 'completed' as const,
        startedAt: `2025-04-05T${String(8 + (i % 8)).padStart(2, '0')}:01:00Z`,
        completedAt: `2025-04-05T${String(8 + (i % 8)).padStart(2, '0')}:01:${String(3 + (i % 4)).padStart(2, '0')}Z`,
        durationMs: 3000 + (hash(p.parcelId + 'dur2') % 5000),
        result: `Found ${(salesByParcel.get(p.parcelId) ?? []).length} comparable sales`,
      },
    ]);
  }

  async getSystemHealth(): Promise<SystemHealthStatus> {
    return {
      overall: 'healthy',
      dataMode: 'snapshot' as 'live' | 'mock',
      services: [
        { name: 'TerraFusion API (Kernel)', status: 'healthy', latencyMs: 12, lastChecked: new Date().toISOString() },
        { name: 'TerraFusion Gateway (Shell)', status: 'healthy', latencyMs: 8, lastChecked: new Date().toISOString() },
        { name: 'TerraFusion Consciousness', status: 'healthy', latencyMs: 15, lastChecked: new Date().toISOString() },
        { name: 'County Data Connector', status: 'healthy', latencyMs: 45, lastChecked: new Date().toISOString(), details: 'pacscontract.v1 validated' },
      ],
      lastChecked: new Date().toISOString(),
    };
  }

  // -- Aggregates ------------------------------------------------------------

  async getCountyStats(): Promise<CountyAggregateStats> {
    const aggs = aggregateStats as RawAggregate[];
    const totalParcels = aggs.reduce((s, a) => s + a.count, 0);
    const totalAssessed = aggs.reduce((s, a) => s + a.totalAssessed, 0);

    const parcelsByType: Record<string, number> = {};
    for (const a of aggs) {
      const mapped = mapPropertyType(a.propertyType);
      parcelsByType[mapped] = (parcelsByType[mapped] ?? 0) + a.count;
    }

    const parcelsByCity: Record<string, number> = {};
    for (const p of properties) {
      parcelsByCity[p.city] = (parcelsByCity[p.city] ?? 0) + 1;
    }

    return {
      totalParcels,
      totalAssessedValue: totalAssessed,
      averageAssessedValue: totalParcels > 0 ? totalAssessed / totalParcels : 0,
      medianAssessedValue: 190000, // approximate from data
      assessedThisYear: totalParcels,
      pendingAssessments: Math.round(totalParcels * 0.02),
      activeAppeals: properties.filter((p) => p.hasAppeals).length,
      totalLevyRevenue: Math.round(totalAssessed * 0.012),
      assessmentCompletionPercent: 98.5,
      parcelsByType: parcelsByType as Record<PropertyType, number>,
      parcelsByCity,
    };
  }

  async getAggregateProperties(options?: {
    page?: number;
    pageSize?: number;
    city?: string;
  }): Promise<SearchResults<AggregateProperty>> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 50;

    let filtered = properties;
    if (options?.city) {
      filtered = filtered.filter(
        (p) => p.city.toLowerCase() === options.city!.toLowerCase(),
      );
    }

    const start = (page - 1) * pageSize;
    const items: AggregateProperty[] = filtered
      .slice(start, start + pageSize)
      .map((p) => ({
        parcelId: p.parcelId,
        address: p.address,
        city: p.city,
        totalAssessedValue: p.totalAssessedValue,
        propertyType: p.propertyType,
        taxDistrictCode: p.taxDistrictCode,
      }));

    return {
      items,
      totalCount: filtered.length,
      page,
      pageSize,
      query: options?.city ?? '',
    };
  }

  // -- Calendar --------------------------------------------------------------

  async getCalendarEvents(
    _startDate?: string,
    _endDate?: string,
  ): Promise<CalendarEvent[]> {
    return [
      { eventId: 'evt-1', title: 'Assessment Roll Opens', eventType: 'deadline', startDate: '2025-01-15', isAllDay: true, description: 'Annual assessment roll opens for current tax year' },
      { eventId: 'evt-2', title: 'Property Revaluation Deadline', eventType: 'deadline', startDate: '2025-04-30', isAllDay: true, description: 'All revaluation work must be complete' },
      { eventId: 'evt-3', title: 'Assessment Change Notices Mailed', eventType: 'deadline', startDate: '2025-05-15', isAllDay: true, description: 'Notices sent to property owners' },
      { eventId: 'evt-4', title: 'Informal Appeal Period', eventType: 'review-period', startDate: '2025-05-15', endDate: '2025-06-30', isAllDay: true, description: '45-day window for informal appeals' },
      { eventId: 'evt-5', title: 'Board of Equalization Hearings', eventType: 'board-meeting', startDate: '2025-07-14', endDate: '2025-07-25', isAllDay: true, description: 'Formal BOE hearings for unresolved appeals' },
      { eventId: 'evt-6', title: 'Assessment Roll Certification', eventType: 'deadline', startDate: '2025-08-15', isAllDay: true, description: 'Final assessment roll certified to county treasurer' },
      { eventId: 'evt-7', title: 'Levy Certification Deadline', eventType: 'deadline', startDate: '2025-11-30', isAllDay: true, description: 'All levy certifications must be filed' },
      { eventId: 'evt-8', title: 'Tax Statements Mailed', eventType: 'deadline', startDate: '2026-02-14', isAllDay: true, description: 'Annual tax statements mailed to property owners' },
      { eventId: 'evt-9', title: 'First Half Tax Due', eventType: 'deadline', startDate: '2026-04-30', isAllDay: true, description: 'First half property tax payment due' },
      { eventId: 'evt-10', title: 'Second Half Tax Due', eventType: 'deadline', startDate: '2026-10-31', isAllDay: true, description: 'Second half property tax payment due' },
    ];
  }
}
