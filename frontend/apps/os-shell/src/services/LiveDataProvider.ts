/**
 * TerraFusion OS — Live DataProvider
 *
 * Reads from PACS endpoints (/api/pacs/*, /ops/pacs/*) which are backed by
 * PacsEfAdapter (SQLite dev) or PacsSqlAdapter (production SQL Server).
 *
 * Both PACS controllers use [AllowAnonymous] — no JWT required for local dev.
 * This provider replaces SnapshotDataProvider when the backend is reachable,
 * giving the workbench access to all 89K+ Benton County parcels.
 */

import type { DataProvider, DataMode } from './dataProvider';
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
} from '../types/domain';
import { getToken } from '../auth/authStorage';

// ---------------------------------------------------------------------------
// PACS DTO shapes (from PacsController + PacsOpsController)
// ---------------------------------------------------------------------------

/** GET /api/pacs/properties → items[] */
interface PacsSummaryDto {
  propId: number;
  geoId: string;
  address: string;
  assessedValue: number;
  marketValue: number;
  propertyType: string;
}

interface PacsPagedResult {
  items: PacsSummaryDto[];
  page: number;
  pageSize: number;
  totalCount: number;
}

/** GET /ops/pacs/property/{geoId} */
interface PacsPropertyDetailDto {
  propId: number;
  geoId: string;
  address: string;
  ownerName: string;
  assessedValue: number;
  marketValue: number;
  landValue: number;
  improvementValue: number;
  propertyType: string;
  legalDescription: string;
  appraisalYear: number | null;
  lastModified: string | null;
  source: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function apiFetch<T>(path: string): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { headers });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

function mapPacsDetailToProperty(dto: PacsPropertyDetailDto): Property {
  // Parse city from composite address (e.g. "123 Main St, Kennewick, WA, 99336")
  const parts = (dto.address ?? '').split(',').map((s) => s.trim());
  const streetAddr = parts[0] ?? dto.address ?? '';
  const city = parts[1] ?? '';
  const state = parts[2] ?? 'WA';
  const zip = parts[3] ?? '';

  return {
    parcelId: dto.geoId,
    countyCode: 'benton',
    address: streetAddr,
    city,
    state,
    zip,
    legalDescription: dto.legalDescription ?? '',
    ownerName: dto.ownerName ?? 'On File',
    propertyType: dto.propertyType ?? 'residential',
    landAcreage: 0,
    yearBuilt: 0,
    buildingSquareFeet: 0,
    landValue: dto.landValue ?? 0,
    improvementValue: dto.improvementValue ?? 0,
    totalAssessedValue: dto.assessedValue ?? 0,
    marketValue: dto.marketValue ?? dto.assessedValue ?? 0,
    taxableValue: dto.assessedValue ?? 0,
    exemptionAmount: 0,
    assessmentStatus: 'active',
    assessmentYear: dto.appraisalYear ?? new Date().getFullYear(),
    assessmentDate: dto.lastModified ?? new Date().toISOString(),
    lastUpdated: dto.lastModified ?? new Date().toISOString(),
    latitude: 46.2396,
    longitude: -119.2687,
    hasActivePermits: false,
    hasAppeals: false,
    dataSource: 'live',
  };
}

function mapPacsSummaryToSearchResult(dto: PacsSummaryDto): PropertySearchResult {
  const parts = (dto.address ?? '').split(',').map((s) => s.trim());
  return {
    parcelId: dto.geoId,
    address: dto.address ?? '',
    city: parts[1] ?? '',
    ownerName: 'On File',
    totalAssessedValue: dto.assessedValue ?? 0,
    propertyType: (dto.propertyType ?? 'Residential') as any,
    assessmentYear: new Date().getFullYear(),
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class LiveDataProvider implements DataProvider {
  readonly mode: DataMode = 'live';

  // ── Search & Lookup ─────────────────────────────────────────────────────

  async search(query: SearchQuery): Promise<SearchResults<PropertySearchResult>> {
    const params = new URLSearchParams();
    if (query.text) params.set('search', query.text);
    params.set('pageSize', String(query.pageSize ?? 20));
    params.set('page', String(query.page ?? 1));

    const data = await apiFetch<PacsPagedResult>(
      `/api/pacs/properties?${params.toString()}`,
    );
    return {
      items: data.items.map(mapPacsSummaryToSearchResult),
      totalCount: data.totalCount,
      page: data.page,
      pageSize: data.pageSize,
    };
  }

  async getParcel(parcelId: string): Promise<Property | null> {
    try {
      const dto = await apiFetch<PacsPropertyDetailDto>(
        `/ops/pacs/property/${encodeURIComponent(parcelId)}`,
      );
      return mapPacsDetailToProperty(dto);
    } catch {
      return null;
    }
  }

  // ── Assessment ──────────────────────────────────────────────────────────

  async getAssessments(parcelId: string): Promise<Assessment[]> {
    // Build a synthetic assessment from the PACS property data
    try {
      const dto = await apiFetch<PacsPropertyDetailDto>(
        `/ops/pacs/property/${encodeURIComponent(parcelId)}`,
      );
      return [
        {
          assessmentId: `pacs-${dto.propId}`,
          parcelId,
          assessmentYear: dto.appraisalYear ?? new Date().getFullYear(),
          assessmentDate: dto.lastModified ?? new Date().toISOString(),
          landValue: dto.landValue ?? 0,
          improvementValue: dto.improvementValue ?? 0,
          totalAssessedValue: dto.assessedValue ?? 0,
          marketValue: dto.marketValue ?? dto.assessedValue ?? 0,
          taxableValue: dto.assessedValue ?? 0,
          exemptionAmount: 0,
          isActive: true,
        },
      ];
    } catch {
      return [];
    }
  }

  async getValuationRecord(
    _parcelId: string,
    _taxYear: number,
  ): Promise<ValuationRecord | null> {
    return null;
  }

  // ── Tax & Levy ──────────────────────────────────────────────────────────

  async getLevyDistricts(): Promise<TaxDistrict[]> {
    return [];
  }

  async getLevyCertifications(_taxYear: number): Promise<LevyCertification[]> {
    return [];
  }

  async getTaxStatements(_parcelId: string): Promise<TaxStatement[]> {
    return [];
  }

  // ── Appeals ─────────────────────────────────────────────────────────────

  async getAppeals(_parcelId: string): Promise<Appeal[]> {
    return [];
  }

  async getHearings(_parcelId?: string): Promise<HearingEvent[]> {
    return [];
  }

  // ── GIS / Atlas ─────────────────────────────────────────────────────────

  async getLayers(): Promise<GISLayer[]> {
    return [];
  }

  // ── Documents / Dossier ─────────────────────────────────────────────────

  async getDocuments(_parcelId: string): Promise<ParcelDocument[]> {
    return [];
  }

  // ── Clerk / Recording ──────────────────────────────────────────────────

  async getRecordingHistory(_parcelId: string): Promise<RecordingEntry[]> {
    return [];
  }

  // ── Audit ───────────────────────────────────────────────────────────────

  async getAuditTrail(_parcelId: string): Promise<AuditEntry[]> {
    return [];
  }

  // ── Operations / Pilot ──────────────────────────────────────────────────

  async getRecentOperations(_parcelId?: string): Promise<OperationTrace[]> {
    return [];
  }

  async getSystemHealth(): Promise<SystemHealthStatus> {
    try {
      const data = await apiFetch<{ status: string; latencyMs?: number }>(
        '/api/pacs/health',
      );
      return {
        overallStatus: data.status === 'connected' ? 'healthy' : 'degraded',
        services: [],
        lastChecked: new Date().toISOString(),
        activeAgents: 0,
        cpuUsage: 0,
        memoryUsage: 0,
      };
    } catch {
      return {
        overallStatus: 'unhealthy',
        services: [],
        lastChecked: new Date().toISOString(),
        activeAgents: 0,
        cpuUsage: 0,
        memoryUsage: 0,
      };
    }
  }

  // ── Aggregates / Dashboards ────────────────────────────────────────────

  async getCountyStats(): Promise<CountyAggregateStats> {
    const defaults: CountyAggregateStats = {
      totalParcels: 0,
      totalAssessedValue: 0,
      totalMarketValue: 0,
      averageAssessedValue: 0,
      medianAssessedValue: 0,
      assessedThisYear: 0,
      pendingAssessments: 0,
      activeAppeals: 0,
      totalLevyRevenue: 0,
      assessmentCompletionPercent: 0,
      parcelsByType: {} as any,
      parcelsByCity: {},
      byPropertyType: [],
      byCity: [],
      assessmentYear: new Date().getFullYear(),
    };

    // GET /api/terraforge/county-stats — TerraForge county KPI endpoint (Slice 1.3).
    // Source: pacs_valuations WHERE PropValYear = taxYear AND SupNum = 0
    const taxYear = new Date().getFullYear();
    try {
      const data = await apiFetch<{
        taxYear: number;
        totalParcels: number;
        averageAssessedValue: number;
        assessedThisYear: number;
        pendingAssessments: number;
        assessmentCompletionPercent: number;
      }>(`/api/terraforge/county-stats?taxYear=${taxYear}`);
      return {
        ...defaults,
        totalParcels: data.totalParcels ?? 0,
        averageAssessedValue: data.averageAssessedValue ?? 0,
        assessedThisYear: data.assessedThisYear ?? 0,
        pendingAssessments: data.pendingAssessments ?? 0,
        assessmentCompletionPercent: data.assessmentCompletionPercent ?? 0,
      };
    } catch {
      return defaults;
    }
  }

  async getAggregateProperties(options?: {
    page?: number;
    pageSize?: number;
    city?: string;
  }): Promise<SearchResults<AggregateProperty>> {
    return { items: [], totalCount: 0, page: 1, pageSize: 20 };
  }

  // ── Calendar ───────────────────────────────────────────────────────────

  async getCalendarEvents(
    _startDate?: string,
    _endDate?: string,
  ): Promise<CalendarEvent[]> {
    return [];
  }
}
