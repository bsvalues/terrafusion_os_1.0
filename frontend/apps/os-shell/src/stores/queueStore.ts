/**
 * TerraQueue Store — Zustand state for cross-parcel work queue
 *
 * Separate lifecycle from propertyStore (queue is a Dais standalone module,
 * not tied to a single parcel context).
 */

import { create } from 'zustand';
import {
  getQueueItems,
  getQueueMetrics,
  getAppraiserProductivity,
  assignWorkItems as apiAssign,
  reviewWorkItem as apiReview,
  type QueueWorkItem,
  type QueueMetrics,
  type AppraiserProductivity,
} from '@/services/suites/queueService';

interface QueueState {
  items: QueueWorkItem[];
  metrics: QueueMetrics | null;
  productivity: AppraiserProductivity[];
  loading: boolean;
  error: string | null;
  dataSource: 'live' | 'unavailable';
  selectedItemIds: Set<string>;

  // Actions
  fetchQueue: () => Promise<void>;
  assignItems: (appraiserName: string, workItemIds?: string[]) => Promise<void>;
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
  dataSource: 'unavailable',
  selectedItemIds: new Set(),

  fetchQueue: async () => {
    set({ loading: true, error: null });
    try {
      const [items, metrics, productivity] = await Promise.all([
        getQueueItems({ throwOnError: true }),
        getQueueMetrics({ throwOnError: true }),
        getAppraiserProductivity({ throwOnError: true }),
      ]);
      set({ items, metrics, productivity, dataSource: 'live', loading: false });
    } catch (error) {
      set({
        items: [],
        metrics: null,
        productivity: [],
        dataSource: 'unavailable',
        loading: false,
        error: error instanceof Error ? error.message : 'Queue backend unavailable.',
      });
    }
  },

  assignItems: async (appraiserName: string, workItemIds?: string[]) => {
    const { selectedItemIds } = get();
    const ids = workItemIds ?? Array.from(selectedItemIds);
    if (ids.length === 0) return;

    try {
      await apiAssign(ids, appraiserName);
      set({ selectedItemIds: new Set(), error: null });
      await get().fetchQueue();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Assignment failed.' });
    }
  },

  reviewItem: async (workItemId: string, action: 'approve' | 'reject') => {
    try {
      await apiReview(workItemId, action);
      set({ error: null });
      await get().fetchQueue();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Review action failed.' });
    }
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
