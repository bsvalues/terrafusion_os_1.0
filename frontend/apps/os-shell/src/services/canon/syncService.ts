/**
 * TFT-167: API client for sync operations.
 * canon-sync = synchronization, connectors, orchestration. No appraisal math.
 */

import type {
  SyncJob,
  SyncResult,
  ConnectorHealth,
  SyncSchedule,
  ImportConfig,
  SyncApiResponse,
  PaginatedResponse,
  SyncMode,
} from '../../types/sync';

const BASE_URL = '/api/sync';
const CONNECTORS_URL = '/api/connectors';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Sync API error ${res.status}: ${body || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// --- Sync Jobs ---

export async function listSyncJobs(
  page = 1,
  pageSize = 25,
): Promise<PaginatedResponse<SyncJob>> {
  return request<PaginatedResponse<SyncJob>>(
    `${BASE_URL}/jobs?page=${page}&pageSize=${pageSize}`,
  );
}

export async function getSyncStatus(jobId: string): Promise<SyncApiResponse<SyncJob>> {
  return request<SyncApiResponse<SyncJob>>(`${BASE_URL}/jobs/${encodeURIComponent(jobId)}`);
}

export async function startSync(config: {
  connectorName: string;
  mode: SyncMode;
  tables?: string[];
}): Promise<SyncApiResponse<SyncJob>> {
  return request<SyncApiResponse<SyncJob>>(`${BASE_URL}/jobs`, {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function cancelSync(jobId: string): Promise<SyncApiResponse<SyncResult>> {
  return request<SyncApiResponse<SyncResult>>(
    `${BASE_URL}/jobs/${encodeURIComponent(jobId)}/cancel`,
    { method: 'POST' },
  );
}

export async function getSyncResult(jobId: string): Promise<SyncApiResponse<SyncResult>> {
  return request<SyncApiResponse<SyncResult>>(
    `${BASE_URL}/jobs/${encodeURIComponent(jobId)}/result`,
  );
}

// --- Sync History ---

export async function getSyncHistory(
  connectorName?: string,
  page = 1,
  pageSize = 50,
): Promise<PaginatedResponse<SyncResult>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (connectorName) params.set('connector', connectorName);
  return request<PaginatedResponse<SyncResult>>(`${BASE_URL}/history?${params}`);
}

// --- Connector Health ---

export async function getConnectorHealth(): Promise<SyncApiResponse<ConnectorHealth[]>> {
  return request<SyncApiResponse<ConnectorHealth[]>>(`${CONNECTORS_URL}/health`);
}

// --- Schedules ---

export async function listSchedules(): Promise<SyncApiResponse<SyncSchedule[]>> {
  return request<SyncApiResponse<SyncSchedule[]>>(`${BASE_URL}/schedules`);
}

export async function updateSchedule(
  scheduleId: string,
  update: Partial<Pick<SyncSchedule, 'frequency' | 'cronExpression' | 'mode' | 'enabled'>>,
): Promise<SyncApiResponse<SyncSchedule>> {
  return request<SyncApiResponse<SyncSchedule>>(
    `${BASE_URL}/schedules/${encodeURIComponent(scheduleId)}`,
    { method: 'PATCH', body: JSON.stringify(update) },
  );
}

// --- Import ---

export async function startImport(
  config: ImportConfig,
): Promise<SyncApiResponse<SyncJob>> {
  return request<SyncApiResponse<SyncJob>>(`${BASE_URL}/import`, {
    method: 'POST',
    body: JSON.stringify(config),
  });
}
