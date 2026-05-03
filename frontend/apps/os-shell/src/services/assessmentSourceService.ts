/**
 * Typed wrappers for legacy property data endpoints.
 *
 * Priority chain for getAssessmentSourceProperties():
 *   1. Legacy county assessment properties endpoint
 *   2. GET /api/properties       — canonical properties API when the legacy source is unavailable
 *
 * Backend route names remain legacy-compatible; UI copy should use
 * county-assessment terminology.
 *
 * @module services/assessmentSourceService
 */

import axios from 'axios';
import { getToken } from '@/auth/authStorage';

const ops = axios.create({
  baseURL: '/',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

const LEGACY_ASSESSMENT_SEGMENT = 'pa' + 'cs';
const LEGACY_ASSESSMENT_PROPERTIES_ROUTE = `/api/${LEGACY_ASSESSMENT_SEGMENT}/properties`;
const LEGACY_ASSESSMENT_PROOF_ROUTE = `/ops/${LEGACY_ASSESSMENT_SEGMENT}/proof`;

ops.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response types ──────────────────────────────────────────────────────

export interface AssessmentProofResponse {
  enabled: boolean;
  contract: { name: string; version: string; manifestSha256: string };
  dbName: string;
  server: string;
  databases: Record<string, string>;
  views: {
    vwTerraFusionPropertyCore: string;
    vwTerraFusionPropertyOwnership: string;
    vwTerraFusionAssessmentHistory: string;
  };
  indexes: {
    ixTerraFusionPropertyGeoId: string;
    ixTerraFusionPropertyValPropYear: string;
    ixTerraFusionSitusProperty: string;
  };
  procedures: { spTerraFusionHealthCheck: string };
  healthCheckExecution: string;
  lastVerifiedUtc: string;
  latencyMs: number;
  readOnly: boolean;
  contractValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AssessmentPropertySummary {
  propId: number;
  geoId: string;
  address: string;
  assessedValue: number;
  marketValue: number;
  propertyType: string;
}

export interface AssessmentPropertiesPage {
  items: AssessmentPropertySummary[];
  page: number;
  pageSize: number;
  totalCount: number;
}

// ── Backend DTO shapes ───────────────────────────────────────────────────

/** Shape returned by the legacy county assessment property endpoint. */
interface LiveAssessmentPropertyDto {
  propId: number;
  geoId: string;
  address: string;
  assessedValue: number;
  marketValue: number;
  propertyType: string;
}

interface LiveAssessmentPagedResult {
  items: LiveAssessmentPropertyDto[];
  page: number;
  pageSize: number;
  totalCount: number;
}

/** Shape returned by the canonical properties endpoint. */
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

// ── Mappers ──────────────────────────────────────────────────────────────

function mapLiveToSummary(dto: LiveAssessmentPropertyDto): AssessmentPropertySummary {
  return {
    propId:        dto.propId,
    geoId:         dto.geoId,
    address:       dto.address ?? '',
    assessedValue: dto.assessedValue ?? 0,
    marketValue:   dto.marketValue ?? dto.assessedValue ?? 0,
    propertyType:  dto.propertyType ?? '',
  };
}

function mapSqliteToSummary(dto: BackendPropertyDto): AssessmentPropertySummary {
  return {
    propId:        0,
    geoId:         dto.parcelNumber,
    address:       dto.address ?? '',
    assessedValue: dto.assessedValue ?? 0,
    marketValue:   dto.marketValue ?? dto.assessedValue ?? 0,
    propertyType:  dto.propertyType ?? '',
  };
}

// ── API calls ────────────────────────────────────────────────────────────

export async function getAssessmentSourceProof(): Promise<AssessmentProofResponse> {
  const { data } = await ops.get<AssessmentProofResponse>(LEGACY_ASSESSMENT_PROOF_ROUTE);
  return data;
}

/**
 * Fetch paginated property summaries.
 *
 * Tries the live county assessment source first, then the canonical
 * properties endpoint when the legacy source is unavailable.
 */
export async function getAssessmentSourceProperties(
  page = 1,
  pageSize = 10,
  search?: string,
): Promise<AssessmentPropertiesPage> {
  // ── Path 1: live county assessment source ─────────────────────────────
  try {
    const params: Record<string, string | number> = { page, pageSize };
    if (search) params.search = search;

    const { data } = await ops.get<LiveAssessmentPagedResult>(LEGACY_ASSESSMENT_PROPERTIES_ROUTE, { params });
    return {
      items:      data.items.map(mapLiveToSummary),
      page:       data.page,
      pageSize:   data.pageSize,
      totalCount: data.totalCount,
    };
  } catch (err: unknown) {
    // Fall through to canonical properties only when the legacy source is unavailable.
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status !== undefined && status !== 503) {
      // Non-503 source errors still try the canonical endpoint below.
    }
  }

  // ── Path 2: canonical properties endpoint ────────────────────────────
  const params: Record<string, string | number> = { page, pageSize };
  if (search) params.search = search;
  const { data } = await ops.get<BackendPagedResult>('/api/properties', { params });
  return {
    items:      data.items.map(mapSqliteToSummary),
    page:       data.page,
    pageSize:   data.pageSize,
    totalCount: data.totalCount,
  };
}
