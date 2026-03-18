/**
 * TerraQueue Service — Cross-Parcel Work Queue
 * ===================================================================
 * Fetch wrappers to future /api/dais/queue/* endpoints.
 * Falls back to fixture data when the backend is unavailable.
 *
 * Owns: queue items, metrics, appraiser productivity, assignment, review.
 */

import {
  QUEUE_ITEMS,
  QUEUE_METRICS,
  APPRAISER_PRODUCTIVITY,
  type QueueWorkItem,
  type QueueMetrics,
  type AppraiserProductivity,
} from '@/data/queueFixtures';
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
// Read Operations
//
// Default: silent fixture fallback (backward-compatible).
// Pass { throwOnError: true } when callers need provenance tracking
// (e.g. ManagementDashboard's isFixture flag).
// ============================================================================

interface QueueReadOptions {
  throwOnError?: boolean;
}

export async function getQueueItems(options?: QueueReadOptions): Promise<QueueWorkItem[]> {
  try {
    const res = await fetch(`${API}/all`, { headers: authHeadersReadOnly() });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  } catch (err) {
    if (options?.throwOnError) throw err;
    return QUEUE_ITEMS;
  }
}

export async function getQueueMetrics(options?: QueueReadOptions): Promise<QueueMetrics> {
  try {
    const res = await fetch(`${API}/metrics`, { headers: authHeadersReadOnly() });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  } catch (err) {
    if (options?.throwOnError) throw err;
    return QUEUE_METRICS;
  }
}

export async function getAppraiserProductivity(options?: QueueReadOptions): Promise<AppraiserProductivity[]> {
  try {
    const res = await fetch(`${API}/productivity`, { headers: authHeadersReadOnly() });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  } catch (err) {
    if (options?.throwOnError) throw err;
    return APPRAISER_PRODUCTIVITY;
  }
}

// ============================================================================
// Write Operations
// ============================================================================

export async function assignWorkItems(
  workItemIds: string[],
  appraiserName: string
): Promise<void> {
  try {
    const res = await fetch(`${API}/assign`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ workItemIds, appraiserName }),
    });
    if (!res.ok) throw new Error(res.statusText);
  } catch {
    // Fixture mode — mutations handled optimistically in store
  }
}

export async function reviewWorkItem(
  workItemId: string,
  action: 'approve' | 'reject'
): Promise<void> {
  try {
    const res = await fetch(`${API}/review`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ workItemId, action }),
    });
    if (!res.ok) throw new Error(res.statusText);
  } catch {
    // Fixture mode — mutations handled optimistically in store
  }
}
