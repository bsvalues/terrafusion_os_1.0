/**
 * TerraQueue Service — Cross-Parcel Work Queue
 * ===================================================================
 * Fetch wrappers to /api/dais/queue/* endpoints.
 *
 * Owns: queue items, metrics, appraiser productivity, assignment, review.
 */

import type { QueueWorkItem, QueueMetrics, AppraiserProductivity } from './queueTypes';
import { getToken } from '@/auth/authStorage';

const API = '/api/dais/queue';

// ============================================================================
// Auth Helper (mirrors atlasService pattern)
// ============================================================================

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function authHeadersReadOnly(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// ============================================================================
// Read Options (W5C provenance propagation)
// ============================================================================

/**
 * QueueReadOptions — caller-controlled provenance handling for read-only
 * queue endpoints. When `throwOnError: true`, transport/HTTP failures
 * surface as thrown errors so callers can mark provenance as
 * unavailable/fallback. When omitted/false, reads return empty/null
 * defaults so the dashboard does not synthesize fixture data.
 */
export interface QueueReadOptions {
  throwOnError?: boolean;
}

// ============================================================================
// Read Operations
// ============================================================================

export async function getQueueItems(options?: QueueReadOptions): Promise<QueueWorkItem[]> {
  const res = await fetch(`${API}/all`, { headers: authHeadersReadOnly() });
  if (!res.ok) {
    if (options?.throwOnError) {
      throw new Error(`Failed to fetch queue items: ${res.statusText}`);
    }
    return [];
  }
  return res.json();
}

export async function getQueueMetrics(options?: QueueReadOptions): Promise<QueueMetrics | null> {
  const res = await fetch(`${API}/metrics`, { headers: authHeadersReadOnly() });
  if (!res.ok) {
    if (options?.throwOnError) {
      throw new Error(`Failed to fetch queue metrics: ${res.statusText}`);
    }
    return null;
  }
  const data = await res.json();
  return {
    totalUnassigned: data.totalUnassigned ?? data.totalQueued ?? 0,
    totalInProgress: data.totalInProgress ?? 0,
    totalPendingReview: data.totalPendingReview ?? data.totalQueued ?? 0,
    completedThisWeek: data.completedThisWeek ?? data.totalCompleted ?? 0,
    slaViolations: data.slaViolations ?? data.totalFailed ?? 0,
    avgDaysToComplete: data.avgDaysToComplete ?? 0,
  };
}

export async function getAppraiserProductivity(options?: QueueReadOptions): Promise<AppraiserProductivity[]> {
  const res = await fetch(`${API}/productivity`, { headers: authHeadersReadOnly() });
  if (!res.ok) {
    if (options?.throwOnError) {
      throw new Error(`Failed to fetch appraiser productivity: ${res.statusText}`);
    }
    return [];
  }
  return res.json();
}

// ============================================================================
// Write Operations
// ============================================================================

export async function assignWorkItems(
  workItemIds: string[],
  appraiserName: string
): Promise<void> {
  const res = await fetch(`${API}/assign`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ workItemIds, appraiserName }),
  });
  if (!res.ok) throw new Error(`Failed to assign work items: ${res.statusText}`);
}

export async function reviewWorkItem(
  workItemId: string,
  action: 'approve' | 'reject'
): Promise<void> {
  const res = await fetch(`${API}/review`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ workItemId, action }),
  });
  if (!res.ok) throw new Error(`Failed to review work item: ${res.statusText}`);
}

export type { QueueWorkItem, QueueMetrics, AppraiserProductivity };
