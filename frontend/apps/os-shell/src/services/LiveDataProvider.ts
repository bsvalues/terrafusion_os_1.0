/**
 * TerraFusion OS — Live DataProvider
 *
 * Reads from the real backend API (/api/properties, etc.) using the
 * authenticated JWT from authStorage.
 *
 * This replaces SnapshotDataProvider when the backend is reachable,
 * giving the workbench access to all 112K+ Benton County parcels.
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
// Backend DTO shapes
// ---------------------------------------------------------------------------

interface BackendPropertyDto {
  id: string;
  parcelNumber: string;
  address: string;
  ownerName: string | null;
  assessedValue: number;
  landValue: number;
  improvementValue: number;
  marketValue: number;
  propertyType: string | null;
  yearBuilt: number | null;
  taxYear: number;
  assessmentDate: string;
  countyId: string;
  countyName: string;
  createdAt: string;
  updatedAt: string;
}

interface BackendPagedResult {
  items: BackendPropertyDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface BackendValuationDto {
  id: string;
  propertyId: string;
  taxYear: number;
  landValue: number;
  improvementValue: number;
  totalValue: number;
  effectiveDate: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function apiFetch<T>(path: string): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

function mapProperty(dto: BackendPropertyDto): Property {
  // Parse city from address (e.g. "123 Main St, Kennewick, WA 99336")
  const parts = (dto.address ?? '').split(',').map((s) => s.trim());
  const city = parts[1] ?? '';
  const state = parts[2]?.split(' ')[0] ?? 'WA';
  const zip = parts[2]?.split(' ')[1] ?? '';

  return {
    parcelId: dto.parcelNumber,
    countyCode: 'benton',
    address: parts[0] ?? dto.address ?? '',
    city,
    state,
    zip,
    legalDescription: '',
    ownerName: dto.ownerName ?? 'On File',
    propertyType: dto.propertyType ?? 'residential',
    landAcreage: 0,
    yearBuilt: dto.yearBuilt ?? 0,
    buildingSquareFeet: 0,
    landValue: dto.landValue ?? 0,
    improvementValue: dto.improvementValue ?? 0,
    totalAssessedValue: dto.assessedValue ?? 0,
    marketValue: dto.marketValue ?? dto.assessedValue ?? 0,
    taxableValue: dto.assessedValue ?? 0,
    exemptionAmount: 0,
    assessmentStatus: 'active',
    assessmentYear: dto.taxYear || new Date().getFullYear(),
    assessmentDate: dto.assessmentDate ?? dto.updatedAt ?? new Date().toISOString(),
    lastUpdated: dto.updatedAt ?? new Date().toISOString(),
    latitude: 46.2396,
    longitude: -119.2687,
    hasActivePermits: false,
    hasAppeals: false,
    dataSource: 'harris-pacs',
  };
}

function mapSearchResult(dto: BackendPropertyDto): PropertySearchResult {
  return {
    parcelId: dto.parcelNumber,
    address: dto.address ?? '',
    city: (dto.address ?? '').split(',')[1]?.trim() ?? '',
    ownerName: dto.ownerName ?? 'On File',
    totalAssessedValue: dto.assessedValue ?? 0,
    propertyType: (dto.propertyType ?? 'Residential') as any,
    assessmentYear: dto.taxYear || new Date().getFullYear(),
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class LiveDataProvider implements DataProvider {
  readonly mode: DataMode = 'live';

  async search(query: SearchQuery): Promise<SearchResults<PropertySearchResult>> {
    const params = new URLSearchParams();
    if (query.text) params.set('search', query.text);
    params.set('pageSize', String(query.pageSize ?? 20));
    params.set('page', String(query.page ?? 1));

    const data = await apiFetch<BackendPagedResult>(
      `/api/properties?${params.toString()}`,
    );
    return {
      items: data.items.map(mapSearchResult),
      totalCount: data.totalCount,
      page: data.page,
      pageSize: data.pageSize,
    };
  }

  async getParcel(parcelId: string): Promise<Property | null> {
    try {
      const dto = await apiFetch<BackendPropertyDto>(
        `/api/properties/parcel/${encodeURIComponent(parcelId)}`,
      );
      return mapProperty(dto);
    } catch {
      return null;
    }
  }

  async getAssessments(parcelId: string): Promise<Assessment[]> {
    // Try to get valuations for this property
    try {
      // First get the property ID (GUID) from the parcel number
      const dto = await apiFetch<BackendPropertyDto>(
        `/api/properties/parcel/${encodeURIComponent(parcelId)}`,
      );
      const vals = await apiFetch<BackendValuationDto[]>(
        `/api/properties/${dto.id}/valuations`,
      );
      return vals.map((v) => ({
        assessmentId: v.id,
        parcelId,
        assessmentYear: v.taxYear,
        assessmentDate: v.effectiveDate,
        landValue: v.landValue,
        improvementValue: v.improvementValue,
        totalAssessedValue: v.totalValue,
        marketValue: v.totalValue,
        taxableValue: v.totalValue,
        exemptionAmount: 0,
        isActive: true,
      }));
    } catch {
      // Return a synthetic assessment from the property data
      try {
        const dto = await apiFetch<BackendPropertyDto>(
          `/api/properties/parcel/${encodeURIComponent(parcelId)}`,
        );
        return [
          {
            assessmentId: `assess-${dto.id}`,
            parcelId,
            assessmentYear: new Date().getFullYear(),
            assessmentDate: dto.updatedAt,
            landValue: dto.landValue,
            improvementValue: dto.improvementValue,
            totalAssessedValue: dto.assessedValue,
            marketValue: dto.assessedValue,
            taxableValue: dto.assessedValue,
            exemptionAmount: 0,
            isActive: true,
          },
        ];
      } catch {
        return [];
      }
    }
  }

  async getValuationRecord(
    _parcelId: string,
    _taxYear: number,
  ): Promise<ValuationRecord | null> {
    return null;
  }

  async getLevyDistricts(): Promise<TaxDistrict[]> {
    return [];
  }

  async getLevyCertifications(_taxYear: number): Promise<LevyCertification[]> {
    return [];
  }

  async getTaxStatements(_parcelId: string): Promise<TaxStatement[]> {
    return [];
  }

  async getAppeals(_parcelId: string): Promise<Appeal[]> {
    return [];
  }

  async getHearings(_parcelId?: string): Promise<HearingEvent[]> {
    return [];
  }

  async getLayers(): Promise<GISLayer[]> {
    return [];
  }

  async getDocuments(_parcelId: string): Promise<ParcelDocument[]> {
    return [];
  }

  async getRecordingHistory(_parcelId: string): Promise<RecordingEntry[]> {
    return [];
  }

  async getAuditTrail(_parcelId: string): Promise<AuditEntry[]> {
    return [];
  }

  async getRecentOperations(_parcelId?: string): Promise<OperationTrace[]> {
    return [];
  }

  async getSystemHealth(): Promise<SystemHealthStatus> {
    try {
      const data = await apiFetch<{ status: string }>('/health');
      return {
        overallStatus: data.status === 'Healthy' ? 'healthy' : 'degraded',
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
    try {
      const data = await apiFetch<{
        totalProperties: number;
        totalAssessedValue: number;
        averageAssessedValue: number;
      }>('/api/properties/stats');
      return {
        ...defaults,
        totalParcels: data.totalProperties ?? 0,
        totalAssessedValue: data.totalAssessedValue ?? 0,
        averageAssessedValue: data.averageAssessedValue ?? 0,
        assessedThisYear: data.totalProperties ?? 0,
        assessmentCompletionPercent: 100,
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

  async getCalendarEvents(
    _startDate?: string,
    _endDate?: string,
  ): Promise<CalendarEvent[]> {
    return [];
  }
}
