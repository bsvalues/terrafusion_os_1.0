/**
 * TerraFusion OS — Fixture DataProvider
 *
 * Synthetic edge-case records for testing uncommon states that don't appear
 * in the real Benton snapshot data. These are intentionally weird parcels
 * designed to exercise error paths and boundary conditions.
 *
 * Fixtures:
 *   fixture:appeal-pending       — parcel with an active unresolved appeal
 *   fixture:no-improvements      — vacant land, $0 improvement value
 *   fixture:orphan-document      — document references a non-existent parcel
 *   fixture:flood-zone-mismatch  — parcel in flood zone with no flood insurance note
 *   fixture:sync-stale           — parcel whose PACS sync timestamp is >90 days old
 *   fixture:health-degraded      — triggers degraded system health status
 */

import type { DataProvider, DataMode } from '../../services/dataProvider';
import type {
  Property,
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

// ---------------------------------------------------------------------------
// Fixture parcels
// ---------------------------------------------------------------------------

const FIXTURE_PROPERTIES: Property[] = [
  {
    parcelId: 'fixture:appeal-pending',
    countyCode: 'BENTON',
    address: '999 TEST APPEAL DR KENNEWICK, WA 99336',
    city: 'Kennewick',
    state: 'WA',
    zip: '99336',
    legalDescription: 'FIXTURE - Active appeal, BOE hearing scheduled',
    ownerName: 'Fixture Appeal Owner',
    propertyType: 'residential',
    landAcreage: 0.25,
    yearBuilt: 1998,
    buildingSquareFeet: 1800,
    bedrooms: 3,
    bathrooms: 2,
    landValue: 65000,
    improvementValue: 185000,
    totalAssessedValue: 250000,
    marketValue: 275000,
    taxableValue: 250000,
    exemptionAmount: 0,
    assessmentStatus: 'appealed',
    assessmentYear: 2025,
    assessmentDate: '2025-01-15',
    lastUpdated: '2025-06-01',
    hasActivePermits: false,
    hasAppeals: true,
    dataSource: 'fixture',
  },
  {
    parcelId: 'fixture:no-improvements',
    countyCode: 'BENTON',
    address: '0 VACANT LOT RD PROSSER, WA 99350',
    city: 'Prosser',
    state: 'WA',
    zip: '99350',
    legalDescription: 'FIXTURE - Vacant land, zero improvement value',
    ownerName: 'Fixture Vacant LLC',
    propertyType: 'vacant-land',
    landAcreage: 5.0,
    yearBuilt: 0,
    buildingSquareFeet: 0,
    landValue: 42000,
    improvementValue: 0,
    totalAssessedValue: 42000,
    marketValue: 45000,
    taxableValue: 42000,
    exemptionAmount: 0,
    assessmentStatus: 'active',
    assessmentYear: 2025,
    assessmentDate: '2025-01-15',
    lastUpdated: '2025-04-01',
    hasActivePermits: false,
    hasAppeals: false,
    dataSource: 'fixture',
  },
  {
    parcelId: 'fixture:flood-zone-mismatch',
    countyCode: 'BENTON',
    address: '100 FLOODPLAIN LN RICHLAND, WA 99352',
    city: 'Richland',
    state: 'WA',
    zip: '99352',
    legalDescription: 'FIXTURE - In FEMA flood zone AE, no insurance documentation',
    ownerName: 'Fixture Flood Owner',
    propertyType: 'residential',
    landAcreage: 0.35,
    yearBuilt: 1975,
    buildingSquareFeet: 1400,
    bedrooms: 3,
    bathrooms: 1,
    landValue: 40000,
    improvementValue: 120000,
    totalAssessedValue: 160000,
    marketValue: 155000,
    taxableValue: 160000,
    exemptionAmount: 0,
    assessmentStatus: 'under-review',
    assessmentYear: 2025,
    assessmentDate: '2025-01-15',
    lastUpdated: '2025-03-01',
    hasActivePermits: false,
    hasAppeals: false,
    dataSource: 'fixture',
    dataQualityScore: 0.62,
  },
  {
    parcelId: 'fixture:sync-stale',
    countyCode: 'BENTON',
    address: '500 STALE SYNC AVE KENNEWICK, WA 99336',
    city: 'Kennewick',
    state: 'WA',
    zip: '99336',
    legalDescription: 'FIXTURE - PACS sync >90 days old',
    ownerName: 'Fixture Stale Sync',
    propertyType: 'commercial',
    landAcreage: 1.2,
    yearBuilt: 2001,
    buildingSquareFeet: 4500,
    landValue: 180000,
    improvementValue: 420000,
    totalAssessedValue: 600000,
    marketValue: 650000,
    taxableValue: 600000,
    exemptionAmount: 0,
    assessmentStatus: 'active',
    assessmentYear: 2024,
    assessmentDate: '2024-01-15',
    lastUpdated: '2024-09-01',
    hasActivePermits: true,
    hasAppeals: false,
    dataSource: 'fixture',
    dataQualityScore: 0.45,
  },
  {
    parcelId: 'fixture:orphan-document',
    countyCode: 'BENTON',
    address: '777 ORPHAN DOC WAY WEST RICHLAND, WA 99353',
    city: 'West Richland',
    state: 'WA',
    zip: '99353',
    legalDescription: 'FIXTURE - Has documents referencing non-existent parcel',
    ownerName: 'Fixture Orphan Doc',
    propertyType: 'residential',
    landAcreage: 0.18,
    yearBuilt: 2015,
    buildingSquareFeet: 2200,
    bedrooms: 4,
    bathrooms: 2.5,
    landValue: 72000,
    improvementValue: 280000,
    totalAssessedValue: 352000,
    marketValue: 365000,
    taxableValue: 352000,
    exemptionAmount: 0,
    assessmentStatus: 'active',
    assessmentYear: 2025,
    assessmentDate: '2025-01-15',
    lastUpdated: '2025-06-01',
    hasActivePermits: false,
    hasAppeals: false,
    dataSource: 'fixture',
  },
];

const fixtureIndex = new Map<string, Property>();
for (const p of FIXTURE_PROPERTIES) fixtureIndex.set(p.parcelId, p);

// ---------------------------------------------------------------------------
// FixtureDataProvider
// ---------------------------------------------------------------------------

export class FixtureDataProvider implements DataProvider {
  readonly mode: DataMode = 'fixtures';

  async search(query: SearchQuery): Promise<SearchResults<PropertySearchResult>> {
    const text = (query.text || '').toLowerCase();
    const filtered = text
      ? FIXTURE_PROPERTIES.filter(
          (p) =>
            p.parcelId.includes(text) ||
            p.address.toLowerCase().includes(text) ||
            p.ownerName.toLowerCase().includes(text),
        )
      : FIXTURE_PROPERTIES;

    return {
      items: filtered.map((p) => ({
        parcelId: p.parcelId,
        address: p.address,
        city: p.city,
        ownerName: p.ownerName,
        totalAssessedValue: p.totalAssessedValue,
        propertyType: p.propertyType,
        assessmentYear: p.assessmentYear,
      })),
      totalCount: filtered.length,
      page: 1,
      pageSize: 20,
      query: text,
    };
  }

  async getParcel(parcelId: string): Promise<Property | null> {
    return fixtureIndex.get(parcelId) ?? null;
  }

  async getAssessments(parcelId: string): Promise<Assessment[]> {
    const prop = fixtureIndex.get(parcelId);
    if (!prop) return [];
    return [
      {
        assessmentId: `ASM-${parcelId}-2025`,
        parcelId,
        assessmentYear: 2025,
        assessmentDate: '2025-01-15',
        landValue: prop.landValue,
        improvementValue: prop.improvementValue,
        totalAssessedValue: prop.totalAssessedValue,
        marketValue: prop.marketValue,
        taxableValue: prop.taxableValue,
        exemptionAmount: prop.exemptionAmount,
        isActive: true,
      },
    ];
  }

  async getValuationRecord(
    parcelId: string,
    taxYear: number,
  ): Promise<ValuationRecord | null> {
    const prop = fixtureIndex.get(parcelId);
    if (!prop) return null;
    return {
      valuationId: `VAL-${parcelId}-${taxYear}`,
      parcelId,
      taxYear,
      propertyType: prop.propertyType,
      costApproachValue: prop.totalAssessedValue,
      finalReconciledValue: prop.totalAssessedValue,
      status: 'sealed',
      createdAt: `${taxYear}-04-01T00:00:00Z`,
    };
  }

  async getLevyDistricts(): Promise<TaxDistrict[]> {
    return [
      {
        districtCode: 'FIX-001',
        districtName: 'Fixture Test District',
        countyCode: 'BENTON',
        levyRate: 8.5,
        levyAmount: 5000000,
        taxYear: 2025,
        effectiveDate: '2025-01-01',
        isActive: true,
      },
    ];
  }

  async getLevyCertifications(_taxYear: number): Promise<LevyCertification[]> {
    return [];
  }

  async getTaxStatements(parcelId: string): Promise<TaxStatement[]> {
    const prop = fixtureIndex.get(parcelId);
    if (!prop) return [];
    const tax = Math.round(prop.totalAssessedValue * 0.012);
    return [
      {
        statementId: `TAX-${parcelId}-2025`,
        parcelId,
        taxYear: 2025,
        totalDue: tax,
        paid: 0,
        balance: tax,
        dueDate: '2026-04-30',
        payments: [],
      },
    ];
  }

  async getAppeals(parcelId: string): Promise<Appeal[]> {
    const prop = fixtureIndex.get(parcelId);
    if (!prop || !prop.hasAppeals) return [];
    return [
      {
        appealId: `APL-${parcelId}-2025`,
        parcelId,
        appealYear: 2025,
        filingDate: '2025-05-18',
        hearingDate: '2025-07-20T10:00:00',
        status: 'filed',
        petitionerName: prop.ownerName,
        currentAssessedValue: prop.totalAssessedValue,
        petitionedValue: Math.round(prop.totalAssessedValue * 0.80),
        reason: 'Comparable sales indicate lower market value',
      },
    ];
  }

  async getHearings(parcelId?: string): Promise<HearingEvent[]> {
    const appeals = parcelId
      ? await this.getAppeals(parcelId)
      : (
          await Promise.all(
            FIXTURE_PROPERTIES.filter((p) => p.hasAppeals).map((p) =>
              this.getAppeals(p.parcelId),
            ),
          )
        ).flat();
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

  async getLayers(): Promise<GISLayer[]> {
    return [
      { layerId: 'lyr-parcels', layerName: 'Parcels', layerType: 'parcels', source: 'fixture', visible: true, opacity: 1.0, zIndex: 10 },
      { layerId: 'lyr-flood', layerName: 'Flood Zones', layerType: 'flood-zones', source: 'fixture', visible: true, opacity: 0.5, zIndex: 30 },
    ];
  }

  async getDocuments(parcelId: string): Promise<ParcelDocument[]> {
    if (!fixtureIndex.has(parcelId)) return [];
    const docs: ParcelDocument[] = [
      {
        documentId: `DOC-${parcelId}-DEED`,
        parcelId,
        documentType: 'deed',
        title: 'Fixture Warranty Deed',
        fileName: `${parcelId}-deed.pdf`,
        fileSize: 30000,
        mimeType: 'application/pdf',
        uploadDate: '2023-01-01',
        source: 'fixture',
      },
    ];
    // Orphan document edge case
    if (parcelId === 'fixture:orphan-document') {
      docs.push({
        documentId: 'DOC-ORPHAN-REF',
        parcelId: 'NONEXISTENT-PARCEL-9999',
        documentType: 'appraisal',
        title: 'Orphan Appraisal (references missing parcel)',
        fileName: 'orphan-appraisal.pdf',
        fileSize: 55000,
        mimeType: 'application/pdf',
        uploadDate: '2024-06-15',
        source: 'fixture-edge-case',
      });
    }
    return docs;
  }

  async getRecordingHistory(parcelId: string): Promise<RecordingEntry[]> {
    if (!fixtureIndex.has(parcelId)) return [];
    return [
      {
        recordingId: `REC-${parcelId}-DEED`,
        parcelId,
        recordingType: 'warranty-deed',
        documentNumber: '2023-FIX-00001',
        recordingDate: '2023-01-15',
        grantor: 'Fixture Previous Owner',
        grantee: fixtureIndex.get(parcelId)!.ownerName,
        consideration: fixtureIndex.get(parcelId)!.totalAssessedValue,
      },
    ];
  }

  async getAuditTrail(parcelId: string): Promise<AuditEntry[]> {
    if (!fixtureIndex.has(parcelId)) return [];
    const entries: AuditEntry[] = [
      {
        auditId: `AUD-${parcelId}-1`,
        parcelId,
        action: 'Fixture Record Created',
        userId: 'fixture-system',
        userName: 'Fixture Generator',
        timestamp: '2025-01-01T00:00:00Z',
        source: 'fixture',
      },
    ];
    if (parcelId === 'fixture:sync-stale') {
      entries.push({
        auditId: `AUD-${parcelId}-STALE`,
        parcelId,
        action: 'Data Sync Warning: Last sync >90 days',
        userId: 'terrafusionsync',
        userName: 'TerraFusion Sync Service',
        timestamp: '2024-09-01T08:00:00Z',
        source: 'pacs-sync',
      });
    }
    return entries;
  }

  async getRecentOperations(parcelId?: string): Promise<OperationTrace[]> {
    if (parcelId && !fixtureIndex.has(parcelId)) return [];
    return [
      {
        traceId: `TRC-fixture-1`,
        correlationId: 'COR-fixture-batch',
        operationName: 'Fixture Validation',
        module: 'fixture',
        parcelId: parcelId ?? 'fixture:appeal-pending',
        status: 'completed',
        startedAt: '2025-06-01T10:00:00Z',
        completedAt: '2025-06-01T10:00:01Z',
        durationMs: 1000,
        result: 'Edge-case fixture validated',
      },
    ];
  }

  async getSystemHealth(): Promise<SystemHealthStatus> {
    return {
      overall: 'degraded',
      dataMode: 'mock' as 'live' | 'mock',
      services: [
        { name: 'TerraFusion API (Kernel)', status: 'healthy', latencyMs: 12, lastChecked: new Date().toISOString() },
        { name: 'TerraFusion Gateway (Shell)', status: 'healthy', latencyMs: 8, lastChecked: new Date().toISOString() },
        { name: 'TerraFusion Consciousness', status: 'degraded', latencyMs: 850, lastChecked: new Date().toISOString(), details: 'High latency on agent coordination' },
        { name: 'County Data Connector', status: 'down', latencyMs: undefined, lastChecked: new Date().toISOString(), details: 'Connection timeout — fixture:health-degraded edge case' },
      ],
      lastChecked: new Date().toISOString(),
    };
  }

  async getCountyStats(): Promise<CountyAggregateStats> {
    return {
      totalParcels: FIXTURE_PROPERTIES.length,
      totalAssessedValue: FIXTURE_PROPERTIES.reduce((s, p) => s + p.totalAssessedValue, 0),
      averageAssessedValue:
        FIXTURE_PROPERTIES.reduce((s, p) => s + p.totalAssessedValue, 0) /
        FIXTURE_PROPERTIES.length,
      medianAssessedValue: 250000,
      assessedThisYear: FIXTURE_PROPERTIES.length,
      pendingAssessments: 1,
      activeAppeals: FIXTURE_PROPERTIES.filter((p) => p.hasAppeals).length,
      totalLevyRevenue: 50000,
      assessmentCompletionPercent: 80.0,
      parcelsByType: {
        residential: 3,
        'vacant-land': 1,
        commercial: 1,
        industrial: 0,
        agricultural: 0,
        'multi-family': 0,
        'mixed-use': 0,
        exempt: 0,
        other: 0,
      },
      parcelsByCity: {
        Kennewick: 2,
        Prosser: 1,
        Richland: 1,
        'West Richland': 1,
      },
    };
  }

  async getAggregateProperties(options?: {
    page?: number;
    pageSize?: number;
    city?: string;
  }): Promise<SearchResults<AggregateProperty>> {
    let filtered = FIXTURE_PROPERTIES;
    if (options?.city) {
      filtered = filtered.filter(
        (p) => p.city.toLowerCase() === options.city!.toLowerCase(),
      );
    }
    return {
      items: filtered.map((p) => ({
        parcelId: p.parcelId,
        address: p.address,
        city: p.city,
        totalAssessedValue: p.totalAssessedValue,
        propertyType: p.propertyType,
        taxDistrictCode: p.taxDistrictCode,
      })),
      totalCount: filtered.length,
      page: 1,
      pageSize: 20,
      query: options?.city ?? '',
    };
  }

  async getCalendarEvents(
    _startDate?: string,
    _endDate?: string,
  ): Promise<CalendarEvent[]> {
    return [
      {
        eventId: 'evt-fix-1',
        title: 'Fixture Appeal Hearing',
        eventType: 'hearing',
        startDate: '2025-07-20T10:00:00',
        parcelId: 'fixture:appeal-pending',
        isAllDay: false,
        description: 'BOE hearing for fixture appeal edge case',
      },
    ];
  }
}
