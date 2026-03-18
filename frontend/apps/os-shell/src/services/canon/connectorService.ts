/**
 * TFT-168: API client for connector management.
 * canon-sync = synchronization, connectors, orchestration. No appraisal math.
 */

import type {
  ConnectorStatus,
  ConnectorHealth,
  ConnectorSchema,
  SyncResult,
  SyncApiResponse,
  PaginatedResponse,
} from '../../types/sync';

const BASE_URL = '/api/connectors';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Connector API error ${res.status}: ${body || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// --- Connector Listing ---

export async function listConnectors(): Promise<SyncApiResponse<ConnectorStatus[]>> {
  return request<SyncApiResponse<ConnectorStatus[]>>(BASE_URL);
}

// --- Connection Testing ---

export async function testConnection(
  name: string,
): Promise<SyncApiResponse<{ reachable: boolean; latencyMs: number; message: string }>> {
  return request<SyncApiResponse<{ reachable: boolean; latencyMs: number; message: string }>>(
    `${BASE_URL}/${encodeURIComponent(name)}/test`,
    { method: 'POST' },
  );
}

// --- Schema Discovery ---

export async function getConnectorSchema(
  name: string,
): Promise<SyncApiResponse<ConnectorSchema>> {
  return request<SyncApiResponse<ConnectorSchema>>(
    `${BASE_URL}/${encodeURIComponent(name)}/schema`,
  );
}

// --- Sync History per Connector ---

export async function getConnectorHistory(
  name: string,
  page = 1,
  pageSize = 25,
): Promise<PaginatedResponse<SyncResult>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return request<PaginatedResponse<SyncResult>>(
    `${BASE_URL}/${encodeURIComponent(name)}/history?${params}`,
  );
}

// --- Health for a Single Connector ---

export async function getConnectorHealthByName(
  name: string,
): Promise<SyncApiResponse<ConnectorHealth>> {
  return request<SyncApiResponse<ConnectorHealth>>(
    `${BASE_URL}/${encodeURIComponent(name)}/health`,
  );
}
