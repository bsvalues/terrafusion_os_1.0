/**
 * TerraQueue Store — Zustand state for cross-parcel work queue
 *
 * Separate lifecycle from propertyStore (queue is a Dais standalone module,
 * not tied to a single parcel context).
 */

import { create } from 'zustand';
import {
  APPRAISER_PRODUCTIVITY,
  QUEUE_ITEMS,
  QUEUE_METRICS,
  type QueueWorkItem,
  type QueueMetrics,
  type AppraiserProductivity,
} from '@/data/queueFixtures';
import {
  getQueueItems,
  getQueueMetrics,
  getAppraiserProductivity,
  assignWorkItems as apiAssign,
  reviewWorkItem as apiReview,
} from '@/services/suites/queueService';

interface QueueState {
  items: QueueWorkItem[];
  metrics: QueueMetrics | null;
  productivity: AppraiserProductivity[];
  loading: boolean;
  error: string | null;
  isFixture: boolean;
  selectedItemIds: Set<string>;

  // Actions
  fetchQueue: () => Promise<void>;
  assignItems: (appraiserName: string) => Promise<void>;
  reviewItem: (workItemId: string, action: 'approve' | 'reject') => Promise<void>;
  toggleSelection: (workItemId: string) => void;
  selectAll: (workItemIds: string[]) => void;
  clearSelection: () => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  items: [],
  metrics: null,
  productivity: [],
  loading: false,
  error: null,
  isFixture: false,
  selectedItemIds: new Set(),

  fetchQueue: async () => {
    set({ loading: true, error: null });
    try {
      const [items, metrics, productivity] = await Promise.all([
        getQueueItems({ throwOnError: true }),
        getQueueMetrics({ throwOnError: true }),
        getAppraiserProductivity({ throwOnError: true }),
      ]);
      set({ items, metrics, productivity, loading: false, isFixture: false });
    } catch (e) {
      set({
        items: QUEUE_ITEMS,
        metrics: QUEUE_METRICS,
        productivity: APPRAISER_PRODUCTIVITY,
        error: e instanceof Error ? e.message : 'Failed to load queue',
        loading: false,
        isFixture: true,
      });
    }
  },

  assignItems: async (appraiserName: string) => {
    const { selectedItemIds, items } = get();
    const ids = Array.from(selectedItemIds);
    if (ids.length === 0) return;

    // Optimistic update
    const now = new Date().toISOString().slice(0, 10);
    set({
      items: items.map((item) =>
        selectedItemIds.has(item.workItemId)
          ? { ...item, status: 'assigned' as const, assignedTo: appraiserName, assignedDate: now, lastUpdated: now }
          : item
      ),
      selectedItemIds: new Set(),
    });

    await apiAssign(ids, appraiserName);
  },

  reviewItem: async (workItemId: string, action: 'approve' | 'reject') => {
    const { items } = get();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Optimistic update
    const now = new Date().toISOString().slice(0, 10);
    set({
      items: items.map((item) =>
        item.workItemId === workItemId
          ? { ...item, status: newStatus as QueueWorkItem['status'], lastUpdated: now }
          : item
      ),
    });

    await apiReview(workItemId, action);
  },

  toggleSelection: (workItemId: string) => {
    const { selectedItemIds } = get();
    const next = new Set(selectedItemIds);
    if (next.has(workItemId)) {
      next.delete(workItemId);
    } else {
      next.add(workItemId);
    }
    set({ selectedItemIds: next });
  },

  selectAll: (workItemIds: string[]) => {
    set({ selectedItemIds: new Set(workItemIds) });
  },

  clearSelection: () => {
    set({ selectedItemIds: new Set() });
  },
}));
