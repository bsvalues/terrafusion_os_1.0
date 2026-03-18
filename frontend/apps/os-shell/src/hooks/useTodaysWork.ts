/**
 * @fileoverview Today's Work hook — deterministic sample fixtures.
 * Returns a static task list for the County Operations Scene.
 * Will connect to backend task API when available.
 */

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

export function useTodaysWork(): {
  tasks: TodaysWorkItem[];
  loading: boolean;
  /** True when returning sample fixtures instead of live backend data */
  isSampleData: boolean;
} {
  return { tasks: SAMPLE_TASKS, loading: false, isSampleData: true };
}
