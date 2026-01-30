import { useEffect } from 'react';
import { syncService } from '../services/syncService';
import { useStartMenuStore } from '../stores/startMenuStore';
import { useThemeStore } from '../stores/themeStore';

/**
 * Hook to integrate state stores with the SyncService.
 * Should be mounted once at the root of the application.
 */
export function useSyncIntegration() {
  useEffect(() => {
    // Initialize the service
    syncService.init();

    // Subscribe to Theme changes
    const unsubTheme = useThemeStore.subscribe(
      (state) => state.theme,
      (theme) => {
        if (!syncService.isApplyingSync) {
          syncService.broadcast('theme', 'setTheme', theme);
        }
      }
    );

    // Subscribe to Pinned Apps changes
    const unsubPinned = useStartMenuStore.subscribe(
      (state) => state.pinnedApps,
      (pinnedApps) => {
        if (!syncService.isApplyingSync) {
          syncService.broadcast('startMenu', 'setPinnedApps', pinnedApps);
        }
      }
    );

    return () => {
      unsubTheme();
      unsubPinned();
    };
  }, []);
}
