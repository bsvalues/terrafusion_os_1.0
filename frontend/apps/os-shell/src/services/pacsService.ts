/**
 * pacsService — Typed wrappers for /ops/pacs/* endpoints.
 *
 * Uses a root-level axios instance (not /api base) because
 * PACS ops live under /ops/pacs/ rather than /api/*.
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

// ── API calls ───────────────────────────────────────────────────────────

export async function getPacsProof(): Promise<PacsProofResponse> {
  const { data } = await ops.get<PacsProofResponse>('/ops/pacs/proof');
  return data;
}

export async function getPacsProperties(
  page = 1,
  pageSize = 10,
): Promise<PacsPropertiesPage> {
  const { data } = await ops.get<PacsPropertiesPage>('/ops/pacs/properties', {
    params: { page, pageSize },
  });
  return data;
}
