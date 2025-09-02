import { useEffect, useState } from 'react';

type OSState = {
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | string;
  authenticated?: boolean;
  sessionId?: string | null;
  reconnectAttempts?: number;
  lastError?: string | null;
};

export function useOSConnection() {
  const [state, setState] = useState<OSState>({ status: 'disconnected' });

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        if (window.electronAPI?.getOSConnectionState) {
          const current = await window.electronAPI.getOSConnectionState();
          if (mounted) setState(current);
        }
      } catch (_) {
        // Failed to get OS connection state
      }
    }

    init();

    const handler = (s: OSState) => {
      if (!mounted) return;
      setState(s);
    };

    const unsubscribe = window.electronAPI?.onOSConnectionState?.(handler);

    return () => {
      mounted = false;
      try {
        if (typeof unsubscribe === 'function') unsubscribe();
      } catch (_) {
        // Failed to unsubscribe
      }
    };
  }, []);

  return state;
}
