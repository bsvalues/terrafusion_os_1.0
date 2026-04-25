/**
 * @fileoverview Today's Work hook - queue-backed task feed.
 * Returns only Dais queue data; backend failures surface as unavailable state.
 */

import { useEffect, useState } from 'react';
import { getQueueItems } from '../services/suites/queueService';
import type { QueueWorkItem } from '../services/suites/queueService';

export interface TodaysWorkItem {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  category: 'workbench' | 'suite' | 'os-feature';
}

type TodaysWorkSource = Partial<QueueWorkItem> & {
  id?: string;
  taskType?: string;
  priority?: string;
  status?: string;
  parcelId?: string;
  address?: string;
  city?: string;
  assignedTo?: string;
  createdAt?: string;
  createdDate?: string;
  lastUpdated?: string;
};

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  medium: 2,
  low: 3,
};

const STATUS_ORDER: Record<string, number> = {
  escalated: 0,
  flagged: 0,
  'review-pending': 1,
  queued: 2,
  unassigned: 2,
  assigned: 3,
  in_progress: 3,
  'inspection-pending': 4,
  inspected: 5,
  valued: 6,
  failed: 7,
  rejected: 7,
  completed: 8,
  approved: 8,
};

const TASK_ROUTE_BY_TYPE: Record<string, TodaysWorkItem['route']> = {
  FIELD_INSPECTION: 'workbench',
  DESK_REVIEW: 'workbench',
  APPEAL_PREPARATION: 'terradais',
  EXEMPTION_REVIEW: 'terradais',
  SUPERVISORY_REVIEW: 'terradais',
  DATA_CORRECTION: 'terraforge',
};

function normalizePriority(priority?: string): number {
  return PRIORITY_ORDER[priority?.toLowerCase() ?? 'normal'] ?? PRIORITY_ORDER.normal;
}

function normalizeStatus(status?: string): number {
  return STATUS_ORDER[status?.toLowerCase() ?? 'queued'] ?? STATUS_ORDER.queued;
}

function routeForQueueItem(taskType?: string): TodaysWorkItem['route'] {
  return TASK_ROUTE_BY_TYPE[taskType ?? ''] ?? 'workbench';
}

function titleForQueueItem(item: TodaysWorkSource): string {
  const parcelId = item.parcelId ?? 'parcel';
  switch (item.taskType) {
    case 'FIELD_INSPECTION':
      return `Inspect ${parcelId}`;
    case 'DESK_REVIEW':
      return `Review ${parcelId}`;
    case 'APPEAL_PREPARATION':
      return `Prepare appeal for ${parcelId}`;
    case 'EXEMPTION_REVIEW':
      return `Review exemption for ${parcelId}`;
    case 'SUPERVISORY_REVIEW':
      return `Supervisory review for ${parcelId}`;
    case 'DATA_CORRECTION':
      return `Correct data for ${parcelId}`;
    default:
      return `Review ${parcelId}`;
  }
}

function subtitleForQueueItem(item: TodaysWorkSource): string {
  const parts = [
    item.taskType ? item.taskType.replace(/_/g, ' ') : 'Queue Task',
    item.city ?? item.area ?? item.address,
    item.assignedTo ? `Assigned to ${item.assignedTo}` : undefined,
  ].filter((part): part is string => typeof part === 'string' && part.length > 0);

  return parts.join(' — ');
}

function queueTaskId(item: TodaysWorkSource, index: number): string {
  return item.workItemId ?? item.id ?? `queue-task-${index}`;
}

function isClosedStatus(status?: string): boolean {
  const normalized = status?.toLowerCase();
  return normalized === 'completed' || normalized === 'approved';
}

export function mapQueueItemsToTodaysWork(items: readonly TodaysWorkSource[]): TodaysWorkItem[] {
  return items
    .filter((item) => !isClosedStatus(item.status))
    .sort((left, right) => {
      const priorityDelta = normalizePriority(left.priority) - normalizePriority(right.priority);
      if (priorityDelta !== 0) return priorityDelta;

      const statusDelta = normalizeStatus(left.status) - normalizeStatus(right.status);
      if (statusDelta !== 0) return statusDelta;

      const leftDate = Date.parse(left.createdAt ?? left.createdDate ?? left.lastUpdated ?? '') || 0;
      const rightDate = Date.parse(right.createdAt ?? right.createdDate ?? right.lastUpdated ?? '') || 0;
      return rightDate - leftDate;
    })
    .slice(0, 3)
    .map((item, index) => ({
      id: queueTaskId(item, index),
      title: titleForQueueItem(item),
      subtitle: subtitleForQueueItem(item),
      route: routeForQueueItem(item.taskType),
      category: item.taskType === 'DATA_CORRECTION' ? 'suite' : routeForQueueItem(item.taskType) === 'workbench' ? 'workbench' : 'suite',
    }));
}

/**
 * SAMPLE_TASKS — bounded sample fallback for the Today's Work panel.
 * Renders only when the backend queue is unavailable, so the home scene
 * stays populated in dev/offline mode. The DemoDataBanner discloses the
 * fixture origin to operators.
 */
export const SAMPLE_TASKS: TodaysWorkItem[] = [
  {
    id: 'sample-task-1',
    title: 'Review BC-DEMO-001',
    subtitle: 'Desk Review — Kennewick',
    route: 'workbench',
    category: 'workbench',
  },
  {
    id: 'sample-task-2',
    title: 'Inspect BC-DEMO-002',
    subtitle: 'Field Inspection — Richland',
    route: 'workbench',
    category: 'workbench',
  },
  {
    id: 'sample-task-3',
    title: 'Prepare appeal for BC-DEMO-003',
    subtitle: 'Appeal Preparation — West Pasco',
    route: 'terradais',
    category: 'suite',
  },
];

export function useTodaysWork(): {
  tasks: TodaysWorkItem[];
  loading: boolean;
  error: string | null;
  /** True when returning sample fixtures instead of live backend data */
  isSampleData: boolean;
} {
  const [tasks, setTasks] = useState<TodaysWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Provenance — true while no live queue read has succeeded yet, so the
  // DemoDataBanner discloses that the panel is showing fixture-equivalent state.
  const [isSampleData, setIsSampleData] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadTodaysWork = async () => {
      try {
        const queueItems = await getQueueItems({ throwOnError: true });
        if (cancelled) return;

        setTasks(mapQueueItemsToTodaysWork(queueItems as TodaysWorkSource[]));
        setIsSampleData(false);
        setError(null);
      } catch (cause) {
        if (cancelled) return;
        // Live queue unavailable — surface unavailable state explicitly.
        // SAMPLE_TASKS is defined for design-time reference, but we do NOT
        // pre-seed the panel with sample data; banner discloses fixture origin.
        setTasks([]);
        setIsSampleData(true);
        setError(cause instanceof Error ? cause.message : 'Today\'s Work queue unavailable.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadTodaysWork();

    return () => {
      cancelled = true;
    };
  }, []);

  return { tasks, loading, error, isSampleData };
}
