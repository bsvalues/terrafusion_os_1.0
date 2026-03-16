/**
 * @fileoverview Today's Work hook — deterministic mock fixtures.
 * Phase 7: Returns a static task list for the County Operations Scene.
 * Phase 8+: Will connect to backend task API.
 */

export interface TodaysWorkItem {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  category: 'workbench' | 'suite' | 'os-feature';
}

const MOCK_TASKS: TodaysWorkItem[] = [
  {
    id: 'tw-1',
    title: 'Review 3 appeals',
    subtitle: 'Dais — Board of Equalization',
    route: 'terradais',
    category: 'suite',
  },
  {
    id: 'tw-2',
    title: 'Inspect 12 parcels',
    subtitle: 'Workbench — Field Review',
    route: 'workbench',
    category: 'workbench',
  },
  {
    id: 'tw-3',
    title: 'Ratio study due Friday',
    subtitle: 'Forge — Statistical Analysis',
    route: 'terraforge',
    category: 'suite',
  },
];

export function useTodaysWork(): { tasks: TodaysWorkItem[]; loading: boolean } {
  return { tasks: MOCK_TASKS, loading: false };
}
