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

const API = '/api/dais/queue';

// ============================================================================
// Read Operations
// ============================================================================

export async function getQueueItems(): Promise<QueueWorkItem[]> {
  try {
    const res = await fetch(`${API}/pending`);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  } catch {
    return QUEUE_ITEMS;
  }
}

export async function getQueueMetrics(): Promise<QueueMetrics> {
  try {
    const res = await fetch(`${API}/metrics`);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  } catch {
    return QUEUE_METRICS;
  }
}

export async function getAppraiserProductivity(): Promise<AppraiserProductivity[]> {
  try {
    const res = await fetch(`${API}/productivity`);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  } catch {
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workItemId, action }),
    });
    if (!res.ok) throw new Error(res.statusText);
  } catch {
    // Fixture mode — mutations handled optimistically in store
  }
}
