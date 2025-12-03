/**
 * useWorkspaceHealthSummary – Hook for workspace health state.
 *
 * Combines useWorkspaceActivity + computeWorkspaceHealthSummary
 * into a single hook for consumption by UI components.
 *
 * @example
 * const { summary, loading, error } = useWorkspaceHealthSummary('home');
 * // summary.level: 'nominal' | 'degraded' | 'critical'
 * // summary.incidents24h: number
 */

import { useMemo } from 'react';
import { computeWorkspaceHealthSummary, type WorkspaceHealthSummary } from './healthSummary';
import { useWorkspaceActivity } from './useWorkspaceActivity';

export interface UseWorkspaceHealthSummaryResult {
  /** Computed health summary */
  summary: WorkspaceHealthSummary;
  /** Whether activity data is still loading */
  loading: boolean;
  /** Error if activity fetch failed */
  error: Error | null;
}

/**
 * Hook that returns workspace health summary based on recent activity.
 *
 * @param workspaceId The workspace to get health for
 * @param limit Number of recent items to consider (default: 100)
 */
export function useWorkspaceHealthSummary(
  workspaceId: string,
  limit: number = 100
): UseWorkspaceHealthSummaryResult {
  const { items, loading, error } = useWorkspaceActivity(workspaceId, {
    limit,
  });

  // Memoize summary computation
  const summary = useMemo(() => computeWorkspaceHealthSummary(items), [items]);

  return {
    summary,
    loading,
    error,
  };
}
