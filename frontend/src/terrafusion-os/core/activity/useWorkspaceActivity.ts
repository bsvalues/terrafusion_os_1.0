/**
 * useWorkspaceActivity – React hook for fetching workspace activity from the OS provider.
 *
 * Canonical way for any workspace to ask:
 * "Hey OS, what's going on in this workspace?"
 */
import { useEffect, useState } from 'react';
import type { WorkspaceActivityItem } from './types';
import { getWorkspaceActivityProvider } from './WorkspaceActivityProvider';

export interface UseWorkspaceActivityOptions {
  limit?: number;
}

export interface UseWorkspaceActivityResult {
  items: WorkspaceActivityItem[];
  loading: boolean;
  error: Error | null;
}

export const useWorkspaceActivity = (
  workspaceId: string,
  options?: UseWorkspaceActivityOptions
): UseWorkspaceActivityResult => {
  const [items, setItems] = useState<WorkspaceActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const provider = getWorkspaceActivityProvider();

    setLoading(true);
    setError(null);

    provider
      .getRecentActivity(workspaceId, options)
      .then((data) => {
        if (!cancelled) {
          setItems(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, options?.limit]);

  return { items, loading, error };
};
