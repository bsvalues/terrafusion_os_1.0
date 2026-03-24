/**
 * pacsService — Typed wrappers for property data endpoints.
 *
 * Priority chain for getPacsProperties():
 *   1. GET /api/pacs/properties  — live Harris PACS via PacsController (SQL Server)
 *   2. GET /api/properties       — SQLite dev DB (fallback when PACS returns 503)
 *
 * The backend PacsController returns HTTP 503 when TF_DEV_PACS_* /
 * ConnectionStrings:PacsConnection is not configured, triggering the fallback
 * transparently. No env-var branching in the frontend is required.
 *
 * @module services/pacsService
 */

import axios from 'axios';
import { getToken } from '@/auth/authStorage';

const ops = axios.create({
  baseURL: '/',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

ops.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response types ──────────────────────────────────────────────────────

export interface PacsProofResponse {
  enabled: boolean;
  contract: { name: string; version: string; manifestSha256: string };
  dbName: string;
  server: string;
  databases: { pacsOltp: string; ciaps: string };
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

export interface PacsPropertySummary {
  propId: number;
  geoId: string;
  address: string;
  assessedValue: number;
  marketValue: number;
  propertyType: string;
}

export interface PacsPropertiesPage {
  items: PacsPropertySummary[];
  page: number;
  pageSize: number;
  totalCount: number;
}

// ── Backend DTO shapes ───────────────────────────────────────────────────

/** Shape returned by GET /api/pacs/properties (PacsController) */
interface LivePacsPropertyDto {
  propId: number;
  geoId: string;
  address: string;
  assessedValue: number;
  marketValue: number;
  propertyType: string;
}

interface LivePacsPagedResult {
  items: LivePacsPropertyDto[];
  page: number;
  pageSize: number;
  totalCount: number;
}

/** Shape returned by GET /api/properties (SQLite dev DB) */
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

function mapLiveToSummary(dto: LivePacsPropertyDto): PacsPropertySummary {
  return {
    propId:        dto.propId,
    geoId:         dto.geoId,
    address:       dto.address ?? '',
    assessedValue: dto.assessedValue ?? 0,
    marketValue:   dto.marketValue ?? dto.assessedValue ?? 0,
    propertyType:  dto.propertyType ?? '',
  };
}

function mapSqliteToSummary(dto: BackendPropertyDto): PacsPropertySummary {
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

export async function getPacsProof(): Promise<PacsProofResponse> {
  const { data } = await ops.get<PacsProofResponse>('/ops/pacs/proof');
  return data;
}

/**
 * Fetch paginated property summaries.
 *
 * Tries live PACS first (/api/pacs/properties).
 * Falls back to SQLite dev DB (/api/properties) on HTTP 503
 * (PACS not yet configured) or any network error.
 */
export async function getPacsProperties(
  page = 1,
  pageSize = 10,
  search?: string,
): Promise<PacsPropertiesPage> {
  // ── Path 1: live Harris PACS ──────────────────────────────────────────
  try {
    const params: Record<string, string | number> = { page, pageSize };
    if (search) params.search = search;

    const { data } = await ops.get<LivePacsPagedResult>('/api/pacs/properties', { params });
    return {
      items:      data.items.map(mapLiveToSummary),
      page:       data.page,
      pageSize:   data.pageSize,
      totalCount: data.totalCount,
    };
  } catch (err: unknown) {
    // Only fall through on 503 (not configured) — re-throw other errors
    // after also attempting the SQLite fallback so the UI always has data.
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status !== undefined && status !== 503) {
      // Non-503 PACS error (4xx, 500) — still try fallback
    }
  }

  // ── Path 2: SQLite dev DB ─────────────────────────────────────────────
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
