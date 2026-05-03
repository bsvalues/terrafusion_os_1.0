import { useCallback } from 'react';

export interface UseCollaborationOptions {
  sessionId?: string;
  userId?: string;
  userRole?: string;
  department?: string;
}

const UNAVAILABLE_MESSAGE =
  'TerraLevy collaboration is not connected to a governed real-time session service.';

export const useCollaboration = (_options: UseCollaborationOptions = {}) => {
  const reject = useCallback(async () => false, []);

  return {
    status: 'unavailable' as const,
    error: UNAVAILABLE_MESSAGE,
    session: null,
    participants: [] as never[],
    activities: [] as never[],
    conflicts: [] as never[],
    isConnected: false,
    connectionStatus: 'unavailable' as const,
    connectToSession: reject,
    disconnectSession: () => undefined,
    sendActivity: reject,
    resolveConflict: reject,
  };
};
