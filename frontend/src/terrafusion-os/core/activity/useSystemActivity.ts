/**
 * useSystemActivity – OS-wide activity hook.
 *
 * Fetches activity from ALL workspaces using the provider's getAllRecentActivity method.
 * Gracefully degrades if the provider doesn't support OS-wide views.
 */
import { useEffect, useState } from 'react';
import type { SystemWorkspaceActivityItem } from './types';
import { getWorkspaceActivityProvider } from './WorkspaceActivityProvider';

export interface UseSystemActivityOptions {
  /** Maximum items to retrieve per workspace (default: 20) */
  limitPerWorkspace?: number;
}

export interface UseSystemActivityResult {
  /** Activity items from all workspaces, sorted newest-first */
  items: SystemWorkspaceActivityItem[];
  /** True while initial fetch is in progress */
  loading: boolean;
  /** Error if fetch failed or provider doesn't support OS-wide views */
  error: Error | null;
}

/**
 * Hook to fetch OS-wide activity across all workspaces.
 *
 * @example
 * const { items, loading, error } = useSystemActivity({ limitPerWorkspace: 50 });
 */
export const useSystemActivity = (options?: UseSystemActivityOptions): UseSystemActivityResult => {
  const [items, setItems] = useState<SystemWorkspaceActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const provider = getWorkspaceActivityProvider();

    // Check if provider supports OS-wide activity
    if (!provider.getAllRecentActivity) {
      setLoading(false);
      setError(new Error('System activity not supported by current provider'));
      return;
    }

    setLoading(true);
    setError(null);

    provider
      .getAllRecentActivity({
        limitPerWorkspace: options?.limitPerWorkspace,
      })
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
  }, [options?.limitPerWorkspace]);

  return { items, loading, error };
};
