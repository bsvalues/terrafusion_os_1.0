/**
 * useDevContext — wires engineering signals onto the companion context bus.
 *
 * Real signals wired:
 *   - buildStatus: driven by Vite HMR events (dev only); 'unknown' in production
 *     or when HMR is not available.
 *
 * Null signals (no oracle available yet):
 *   - activeBranch: no frontend git oracle. Stays null until a backend endpoint
 *     is added (e.g. GET /api/dev/context).
 *   - activeFile: no editor/file-picker surface in OS shell. Stays null.
 *
 * Mount this hook once in Desktop.tsx.
 */

import { useEffect } from 'react';
import { useCompanionStore } from '../stores/companionStore';

export function useDevContext(): void {
  const setBuildStatus = useCompanionStore((s) => s.setBuildStatus);

  useEffect(() => {
    // activeBranch and activeFile have no current oracle — leave null (store default).
    // buildStatus: wire Vite HMR events if available (dev mode only).
    if (typeof import.meta !== 'undefined' && import.meta.hot) {
      const hot = import.meta.hot;

      // Vite fires 'vite:error' when a module fails to compile.
      const onError = () => setBuildStatus('error');

      // Vite fires 'vite:beforeUpdate' before applying an HMR update,
      // then the update resolves — treat that as clean.
      const onUpdate = () => setBuildStatus('clean');

      hot.on('vite:error', onError);
      hot.on('vite:beforeUpdate', onUpdate);

      // Start clean — if we got this far, the initial build succeeded.
      setBuildStatus('clean');

      return () => {
        hot.off('vite:error', onError);
        hot.off('vite:beforeUpdate', onUpdate);
      };
    }

    // Production or SSR — no HMR available.
    setBuildStatus('unknown');
    return undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
