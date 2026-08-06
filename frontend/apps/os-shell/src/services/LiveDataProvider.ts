/**
 * TerraFusion OS — Live DataProvider
 *
 * Reads from backend county assessment endpoints. No local provider is selected
 * when the backend is unreachable; callers render unavailable states instead.
 */

import type { DataProvider, DataMode } from './dataProvider';
import { getSession } from '../auth/session';
import { buildCountyScopedSessionHeaders } from './countyIsolation';
import type {
  Property,
  Assessment,
  ValuationRecord,
  TaxDistrict,
  LevyCertification,
  TaxStatement,
  Appeal,
  AppealGround,
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
// County assessment DTO shapes
// ---------------------------------------------------------------------------

interface AssessmentSourceSummaryDto {
  propId: number;
  geoId: string;
  address: string;
  assessedValue: number;
  marketValue: number;
  propertyType: string;
}

interface AssessmentSourcePagedResult {
  items: AssessmentSourceSummaryDto[];
  page: number;
  pageSize: number;
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Properties API DTO shapes (SQLite dev — always available)
// Endpoint: GET /api/properties  and  GET /api/properties/parcel/{parcelNumber}
// ---------------------------------------------------------------------------

/** GET /api/properties?search=...  → items[] */
interface PropertiesListDto {
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
  squareFeet: number | null;
  grossLivingArea: number | null;
  basementSqft: number | null;
  garageSqft: number | null;
  lotWidthFront: number | null;
  lotDepth: number | null;
  legalDescription: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  landAcres: number | null;
  neighborhood: string | null;
  propertyUseCode: string | null;
  taxDistrictCode: string | null;
  taxDistrictName: string | null;
  taxYear: number;
  assessmentDate: string | null;
  countyId: string;
  countyName: string;
}

interface PropertiesPagedResult {
  items: PropertiesListDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface DaisAppealWorkflowRecordDto {
  appealId: string;
  parcelId: string;
  taxYear: number;
  ground: AppealGround;
  status: Appeal['status'];
  filedAt: string;
  hearingAt?: string;
  decisionAt?: string;
}

interface DaisAppealWorkflowReadResultDto {
  schemaVersion: string;
  countyId: string;
  appeals: DaisAppealWorkflowRecordDto[];
  traceId?: string;
}

/** Legacy county assessment property detail endpoint */
interface AssessmentSourcePropertyDetailDto {
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

const LEGACY_ASSESSMENT_SEGMENT = 'pa' + 'cs';
const LEGACY_ASSESSMENT_PROPERTIES_ROUTE = `/api/${LEGACY_ASSESSMENT_SEGMENT}/properties`;
const LEGACY_ASSESSMENT_PROPERTY_ROUTE = `/ops/${LEGACY_ASSESSMENT_SEGMENT}/property`;
const LEGACY_ASSESSMENT_HEALTH_ROUTE = `/api/${LEGACY_ASSESSMENT_SEGMENT}/health`;
const PRIMARY_PARCEL_EVIDENCE_TIMEOUT_MS = 13_500;

export class ApiFetchError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(status: number, path: string) {
    super(`API ${status}: ${path}`);
    this.name = 'ApiFetchError';
    this.status = status;
    this.path = path;
  }
}

export function isApiFetchError(error: unknown): error is ApiFetchError {
  return error instanceof ApiFetchError;
}

function shouldPreserveAuthFailure(error: unknown): boolean {
  return isApiFetchError(error) && (error.status === 401 || error.status === 403);
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  options?: { timeoutMs?: number },
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> | undefined) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = options?.timeoutMs ? new AbortController() : null;
  const abortFromCaller = () => controller?.abort();
  if (controller && init?.signal) {
    if (init.signal.aborted) {
      controller.abort();
    } else {
      init.signal.addEventListener('abort', abortFromCaller, { once: true });
    }
  }
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), options.timeoutMs)
    : null;

  try {
    const res = await fetch(path, {
      ...init,
      headers,
      signal: controller?.signal ?? init?.signal,
    });
    if (!res.ok) throw new ApiFetchError(res.status, path);
    return res.json();
  } finally {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
    if (controller && init?.signal) init.signal.removeEventListener('abort', abortFromCaller);
  }
}

function mapAssessmentSourceDetailToProperty(dto: AssessmentSourcePropertyDetailDto): Property {
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
    ownerName: dto.ownerName ?? '',
    propertyType: (dto.propertyType ?? '') as any,
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
    assessmentYear: dto.appraisalYear ?? 0,
    assessmentDate: dto.lastModified ?? '',
    lastUpdated: dto.lastModified ?? '',
    hasActivePermits: false,
    hasAppeals: false,
    dataSource: 'live',
  };
}

function isAssessmentSourcePropertyDetailDto(dto: unknown): dto is AssessmentSourcePropertyDetailDto {
  if (!dto || typeof dto !== 'object') return false;
  const candidate = dto as Partial<AssessmentSourcePropertyDetailDto> & {
    pacs?: string;
    reason?: string;
  };

  return candidate.pacs !== 'offline'
    && typeof candidate.geoId === 'string'
    && candidate.geoId.trim().length > 0
    && typeof candidate.address === 'string'
    && typeof candidate.assessedValue === 'number'
    && typeof candidate.marketValue === 'number'
    && typeof candidate.propertyType === 'string';
}

const DAIS_APPEAL_GROUNDS = new Set<AppealGround>([
  'MARKET_VALUE',
  'UNIFORMITY',
  'CLASSIFICATION',
  'EXEMPTION_DENIAL',
  'CLERICAL_ERROR',
]);
const DAIS_APPEAL_STATUSES = new Set<Appeal['status']>([
  'filed',
  'scheduled',
  'heard',
  'decided',
  'withdrawn',
]);
const CANONICAL_GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?Z$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const allowedKeys = new Set(allowed);
  return Object.keys(value).every((key) => allowedKeys.has(key));
}

function isCanonicalGuid(value: unknown): value is string {
  return typeof value === 'string' && CANONICAL_GUID.test(value);
}

function isUtcTimestamp(value: unknown): value is string {
  return typeof value === 'string'
    && UTC_TIMESTAMP.test(value)
    && !Number.isNaN(Date.parse(value));
}

function parseDaisAppealWorkflowResult(
  value: unknown,
  expectedCountyId: string,
  expectedParcelId: string,
): DaisAppealWorkflowReadResultDto {
  if (!isRecord(value)
    || !hasOnlyKeys(value, ['schemaVersion', 'countyId', 'appeals', 'traceId'])
    || value.schemaVersion !== '1.0.0'
    || !isCanonicalGuid(value.countyId)
    || value.countyId !== expectedCountyId
    || !Array.isArray(value.appeals)
    || (value.traceId !== undefined
      && (typeof value.traceId !== 'string' || value.traceId.trim().length === 0))) {
    throw new Error('Dais appeal workflow response failed contract validation.');
  }

  const appealIds = new Set<string>();
  const appeals = value.appeals.map((candidate): DaisAppealWorkflowRecordDto => {
    if (!isRecord(candidate)
      || !hasOnlyKeys(candidate, [
        'appealId', 'parcelId', 'taxYear', 'ground', 'status', 'filedAt', 'hearingAt', 'decisionAt',
      ])
      || !isCanonicalGuid(candidate.appealId)
      || candidate.parcelId !== expectedParcelId
      || !Number.isInteger(candidate.taxYear)
      || (candidate.taxYear as number) < 1900
      || (candidate.taxYear as number) > 2200
      || !DAIS_APPEAL_GROUNDS.has(candidate.ground as AppealGround)
      || !DAIS_APPEAL_STATUSES.has(candidate.status as Appeal['status'])
      || !isUtcTimestamp(candidate.filedAt)
      || (candidate.hearingAt !== undefined && !isUtcTimestamp(candidate.hearingAt))
      || (candidate.decisionAt !== undefined && !isUtcTimestamp(candidate.decisionAt))) {
      throw new Error('Dais appeal workflow record failed contract validation.');
    }

    if (appealIds.has(candidate.appealId)) {
      throw new Error('Dais appeal workflow response contains duplicate appeal identity.');
    }
    appealIds.add(candidate.appealId);

    return candidate as unknown as DaisAppealWorkflowRecordDto;
  });

  return {
    schemaVersion: value.schemaVersion,
    countyId: value.countyId,
    appeals,
    ...(value.traceId === undefined ? {} : { traceId: value.traceId as string }),
  };
}

function mapAssessmentSourceSummaryToSearchResult(dto: AssessmentSourceSummaryDto): PropertySearchResult {
  const parts = (dto.address ?? '').split(',').map((s) => s.trim());
  return {
    parcelId: dto.geoId,
    address: dto.address ?? '',
    city: parts[1] ?? '',
    ownerName: '',
    totalAssessedValue: dto.assessedValue ?? 0,
    propertyType: (dto.propertyType ?? '') as any,
    assessmentYear: 0,
  };
}

// Map /api/properties list item → PropertySearchResult
function mapPropertiesDtoToSearchResult(dto: PropertiesListDto): PropertySearchResult {
  const parts = (dto.address ?? '').split(/[\r\n,]+/).map((s) => s.trim()).filter(Boolean);
  return {
    parcelId: dto.parcelNumber,
    parcelNumber: dto.parcelNumber,
    address: parts[0] ?? dto.address ?? '',
    city: parts[1] ?? '',
    ownerName: dto.ownerName ?? '',
    totalAssessedValue: dto.assessedValue ?? 0,
    propertyType: (dto.propertyType ?? 'R') as any,
    assessmentYear: dto.taxYear ?? 0,
  };
}

// WA State DOR property use code descriptions.
const WA_USE_CODE_DESC: Record<string, string> = {
  '11': 'Single Family Residence',
  '12': 'Single Family Residence w/ Accessory',
  '13': 'Mobile Home',
  '14': 'Condominium',
  '18': 'Recreational / Vacation Residence',
  '19': 'Other Residential',
  '21': 'Duplex',
  '22': 'Triplex',
  '23': 'Four-Plex',
  '24': 'Multi-Family (5+ Units)',
  '39': 'Other Commercial',
  '48': 'Light Industrial',
  '53': 'Agriculture – Orchard',
  '58': 'Agriculture – Dryland',
  '59': 'Agriculture – Irrigated',
  '62': 'Timber',
  '63': 'Agriculture – Grain',
  '65': 'Agriculture – Other',
  '66': 'Agriculture – Pasture',
  '69': 'Agriculture – Misc',
  '76': 'State-Assessed Utility',
  '81': 'Vacant Land – Residential',
  '83': 'Vacant Land – Commercial',
  '91': 'Exempt – Government',
};

// Map /api/properties/parcel/{n} detail → Property
function mapPropertiesDtoToProperty(dto: PropertiesListDto): Property {
  const parts = (dto.address ?? '').split(/[\r\n,]+/).map((s) => s.trim()).filter(Boolean);
  const streetAddr = parts[0] ?? '';
  const city = parts[1] ?? '';
  const stateZip = parts[2] ?? '';
  const stParts = stateZip.split(/\s+/);
  const state = stParts[0] ?? 'WA';
  const zip = stParts[1] ?? '';

  return {
    parcelId: dto.parcelNumber,
    countyCode: 'benton',
    address: streetAddr,
    city,
    state,
    zip,
    legalDescription: dto.legalDescription ?? '',
    ownerName: dto.ownerName ?? '',
    propertyType: dto.propertyType ?? 'R',
    landAcreage: dto.landAcres ?? 0,
    yearBuilt: dto.yearBuilt ?? 0,
    buildingSquareFeet: dto.squareFeet ?? 0,
    grossLivingArea: dto.grossLivingArea ?? undefined,
    basementSqft: dto.basementSqft ?? undefined,
    garageSqft: dto.garageSqft ?? undefined,
    lotWidthFront: dto.lotWidthFront ?? undefined,
    lotDepth: dto.lotDepth ?? undefined,
    bedrooms: dto.bedrooms ?? undefined,
    bathrooms: dto.bathrooms ?? undefined,
    neighborhood: dto.neighborhood ?? undefined,
    propertyUseCode: dto.propertyUseCode ?? undefined,
    landUseDescription: dto.propertyUseCode ? (WA_USE_CODE_DESC[dto.propertyUseCode] ?? undefined) : undefined,
    taxDistrictCode: dto.taxDistrictCode ?? undefined,
    taxDistrictName: dto.taxDistrictName ?? undefined,
    landValue: dto.landValue ?? 0,
    improvementValue: dto.improvementValue ?? 0,
    totalAssessedValue: dto.assessedValue ?? 0,
    marketValue: dto.marketValue ?? dto.assessedValue ?? 0,
    taxableValue: dto.assessedValue ?? 0,
    exemptionAmount: 0,
    assessmentStatus: 'active',
    assessmentYear: dto.taxYear ?? 0,
    assessmentDate: dto.assessmentDate ?? '',
    lastUpdated: dto.assessmentDate ?? '',
    hasActivePermits: false,
    hasAppeals: false,
    dataSource: 'live',
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

    // Use the canonical Properties API first.
    try {
      const data = await apiFetch<PropertiesPagedResult>(
        `/api/properties?${params.toString()}`,
      );
      return {
        items: data.items.map(mapPropertiesDtoToSearchResult),
        totalCount: data.totalCount,
        page: data.page,
        pageSize: data.pageSize,
      };
    } catch (error) {
      if (shouldPreserveAuthFailure(error)) throw error;
      // Compatibility fallback: legacy county assessment summary endpoint.
      const data = await apiFetch<AssessmentSourcePagedResult>(
        `${LEGACY_ASSESSMENT_PROPERTIES_ROUTE}?${params.toString()}`,
      );
      return {
        items: data.items.map(mapAssessmentSourceSummaryToSearchResult),
        totalCount: data.totalCount,
        page: data.page,
        pageSize: data.pageSize,
      };
    }
  }

  async getParcel(parcelId: string): Promise<Property | null> {
    // Primary: canonical Properties API.
    try {
      const dto = await apiFetch<PropertiesListDto>(
        `/api/properties/parcel/${encodeURIComponent(parcelId)}`,
        undefined,
        { timeoutMs: PRIMARY_PARCEL_EVIDENCE_TIMEOUT_MS },
      );
      return mapPropertiesDtoToProperty(dto);
    } catch (error) {
      if (shouldPreserveAuthFailure(error)) throw error;
      // no-op; try compatibility endpoint below.
    }

    // Fallback: legacy county assessment property endpoint.
    try {
      const dto = await apiFetch<unknown>(
        `${LEGACY_ASSESSMENT_PROPERTY_ROUTE}/${encodeURIComponent(parcelId)}`,
      );
      if (!isAssessmentSourcePropertyDetailDto(dto)) return null;
      return mapAssessmentSourceDetailToProperty(dto);
    } catch (error) {
      if (shouldPreserveAuthFailure(error)) throw error;
      return null;
    }
  }

  // ── Assessment ──────────────────────────────────────────────────────────

  async getAssessments(parcelId: string): Promise<Assessment[]> {
    // Build an assessment projection from canonical Properties API data.
    try {
      const dto = await apiFetch<PropertiesListDto>(
        `/api/properties/parcel/${encodeURIComponent(parcelId)}`,
      );
      return [
        {
          assessmentId: `prop-${dto.id}`,
          parcelId,
          assessmentYear: dto.taxYear ?? 0,
          assessmentDate: dto.assessmentDate ?? '',
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

  async getAppeals(parcelId: string): Promise<Appeal[]> {
    const session = getSession();
    const countyScope = buildCountyScopedSessionHeaders(session);
    if (!countyScope.isolated || !isCanonicalGuid(session?.countyId)) {
      throw new Error('Canonical county context required for Dais appeal workflow reads.');
    }

    const path = `/api/dais/appeals/parcel/${encodeURIComponent(parcelId)}/workflow-read`;
    const response = await apiFetch<unknown>(path, { headers: countyScope.headers });
    const contract = parseDaisAppealWorkflowResult(response, session.countyId, parcelId);

    return contract.appeals.map((appeal) => ({
      appealId: appeal.appealId,
      parcelId: appeal.parcelId,
      appealYear: appeal.taxYear,
      appealGround: appeal.ground,
      status: appeal.status,
      filingDate: appeal.filedAt,
      ...(appeal.hearingAt === undefined ? {} : { hearingDate: appeal.hearingAt }),
      ...(appeal.decisionAt === undefined ? {} : { decisionDate: appeal.decisionAt }),
    }));
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
        LEGACY_ASSESSMENT_HEALTH_ROUTE,
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
      assessmentYear: 0,
    };

    // GET /api/terraforge/county-stats — TerraForge county KPI endpoint (Slice 1.3).
    // Source: county valuation rows where PropValYear = taxYear and SupNum = 0
    const taxYear = new Date().getFullYear();
    try {
      const session = getSession();
      const countyScope = buildCountyScopedSessionHeaders(session);
      if (!countyScope.isolated) {
        throw new Error('County context required for TerraForge county stats.');
      }

      const params = new URLSearchParams({ taxYear: String(taxYear) });
      if (session?.countyId) {
        params.set('countyId', session.countyId);
      }

      const data = await apiFetch<{
        taxYear: number;
        totalParcels: number;
        averageAssessedValue: number;
        assessedThisYear: number;
        pendingAssessments: number;
        assessmentCompletionPercent: number;
      }>(`/api/terraforge/county-stats?${params.toString()}`, { headers: countyScope.headers });
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
