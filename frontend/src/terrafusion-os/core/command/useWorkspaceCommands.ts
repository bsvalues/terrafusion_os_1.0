/**
 * useWorkspaceCommands – React hook for fetching commands from the OS provider.
 *
 * Returns commands available for a given workspace.
 */
import { useEffect, useState } from 'react';
import type { WorkspaceCommand } from './types';
import { getWorkspaceCommandProvider } from './WorkspaceCommandProvider';

export interface UseWorkspaceCommandsResult {
  commands: WorkspaceCommand[];
  loading: boolean;
  error: Error | null;
}

export const useWorkspaceCommands = (workspaceId: string): UseWorkspaceCommandsResult => {
  const [commands, setCommands] = useState<WorkspaceCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const provider = getWorkspaceCommandProvider();

    setLoading(true);
    setError(null);

    provider
      .getCommands(workspaceId)
      .then((cmds) => {
        if (!cancelled) {
          setCommands(cmds);
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
  }, [workspaceId]);

  return { commands, loading, error };
};
