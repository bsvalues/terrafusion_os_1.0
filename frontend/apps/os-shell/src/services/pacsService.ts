/**
 * pacsService — Typed wrappers for property data endpoints.
 *
 * In development mode uses /api/properties (SQLite dev DB).
 * In production uses /ops/pacs/* (live Harris PACS).
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

// ── Backend DTO (from /api/properties) ──────────────────────────────────

interface BackendPropertyDto {
  id: string;
  parcelNumber: string;
  address: string;
  ownerName: string | null;
  assessedValue: number;
  landValue: number;
  improvementValue: number;
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

function mapToSummary(dto: BackendPropertyDto): PacsPropertySummary {
  return {
    propId: 0,
    geoId: dto.parcelNumber,
    address: dto.address ?? '',
    assessedValue: dto.assessedValue ?? 0,
    marketValue: dto.assessedValue ?? 0, // market ≈ assessed in dev data
    propertyType: '',
  };
}

// ── API calls ───────────────────────────────────────────────────────────

export async function getPacsProof(): Promise<PacsProofResponse> {
  const { data } = await ops.get<PacsProofResponse>('/ops/pacs/proof');
  return data;
}

export async function getPacsProperties(
  page = 1,
  pageSize = 10,
  search?: string,
): Promise<PacsPropertiesPage> {
  // Try /api/properties first (works with SQLite dev DB)
  try {
    const params: Record<string, string | number> = { page, pageSize };
    if (search) params.search = search;
    const { data } = await ops.get<BackendPagedResult>('/api/properties', { params });
    return {
      items: data.items.map(mapToSummary),
      page: data.page,
      pageSize: data.pageSize,
      totalCount: data.totalCount,
    };
  } catch {
    // Fall back to /ops/pacs/properties (live PACS)
    const { data } = await ops.get<PacsPropertiesPage>('/ops/pacs/properties', {
      params: { page, pageSize },
    });
    return data;
  }
}
