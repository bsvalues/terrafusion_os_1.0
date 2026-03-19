/**
 * @fileoverview Today's Work hook — queue-backed task feed with explicit fallback.
 * Starts with sample tasks so the home scene stays populated in dev/offline mode,
 * then promotes to live Dais queue tasks when the backend is reachable.
 */

import { useEffect, useState } from 'react';
import { getQueueItems } from '../services/suites/queueService';
import type { QueueWorkItem } from '../data/queueFixtures';

export interface TodaysWorkItem {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  category: 'workbench' | 'suite' | 'os-feature';
}

const SAMPLE_TASKS: TodaysWorkItem[] = [
  {
    id: 'tw-1',
    title: 'Review 3 appeals',
    subtitle: 'Dais \u2014 Board of Equalization',
    route: 'terradais',
    category: 'suite',
  },
  {
    id: 'tw-2',
    title: 'Inspect 12 parcels',
    subtitle: 'Workbench \u2014 Field Review',
    route: 'workbench',
    category: 'workbench',
  },
  {
    id: 'tw-3',
    title: 'Ratio study due Friday',
    subtitle: 'Forge \u2014 Statistical Analysis',
    route: 'terraforge',
    category: 'suite',
  },
];

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

export function useTodaysWork(): {
  tasks: TodaysWorkItem[];
  loading: boolean;
  /** True when returning sample fixtures instead of live backend data */
  isSampleData: boolean;
} {
  const [tasks, setTasks] = useState<TodaysWorkItem[]>(SAMPLE_TASKS);
  const [loading, setLoading] = useState(true);
  const [isSampleData, setIsSampleData] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadTodaysWork = async () => {
      try {
        const queueItems = await getQueueItems({ throwOnError: true });
        if (cancelled) return;

        setTasks(mapQueueItemsToTodaysWork(queueItems as TodaysWorkSource[]));
        setIsSampleData(false);
      } catch {
        if (cancelled) return;
        setTasks(SAMPLE_TASKS);
        setIsSampleData(true);
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

  return { tasks, loading, isSampleData };
}
