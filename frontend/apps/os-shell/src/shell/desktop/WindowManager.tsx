/**
 * TerraFusion OS WindowManager Component
 *
 * Renders all windows from the desktop store, managing z-index layering.
 * Each window contains a ModuleLoader wrapped in an error boundary for isolation.
 *
 * @module shell/desktop/WindowManager
 * @see SUCCESS CRITERIA SC-4, SC-3.3, SC-9.1
 */

import { useCallback } from 'react';
import { useDesktopStore } from '../../stores/desktopStore';
import { useModuleRegistryStore } from '../../stores/moduleRegistryStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { ModuleLoader } from './ModuleLoader';
import { Window } from './Window';
import { WindowErrorBoundary } from './WindowErrorBoundary';

// ============================================================================
// Types
// ============================================================================

export interface WindowManagerProps {
  /** Optional className for additional styling */
  className?: string;
}

// ============================================================================
// WindowManager Component
// ============================================================================

/**
 * WindowManager - Renders all non-minimized windows sorted by z-index.
 *
 * Features:
 * - Renders windows from desktopStore
 * - Filters out minimized windows
 * - Sorts windows by z-index (lowest first = renders first = appears behind)
 * - Each window's content is wrapped in WindowErrorBoundary for isolation
 * - Error in one window doesn't crash other windows
 * - Provides accessible container with live region
 *
 * @example
 * ```tsx
 * <Desktop>
 *   <DesktopBackground />
 *   <WindowManager />
 *   <Taskbar />
 * </Desktop>
 * ```
 */
export function WindowManager({ className = '' }: WindowManagerProps) {
  // Subscribe to windows from store
  const windows = useDesktopStore((state) => state.windows);
  const closeWindow = useDesktopStore((state) => state.closeWindow);
  
  // Module registry for relaunching
  const launchModule = useModuleRegistryStore((state) => state.launchModule);
  const getModuleById = useModuleRegistryStore((state) => state.getModuleById);
  
  // Notifications for user feedback
  const addNotification = useNotificationStore((state) => state.addNotification);

  // Filter out minimized windows and sort by z-index (ascending)
  // Lower z-index renders first = appears behind higher z-index windows
  const visibleWindows = windows
    .filter((w) => w.state !== 'minimized')
    .sort((a, b) => a.zIndex - b.zIndex);

  /**
   * Handle module reload from error boundary
   */
  const handleReloadModule = useCallback(
    async (windowId: string) => {
      // Find the window
      const window = windows.find((w) => w.id === windowId);
      if (!window) return;

      const module = getModuleById(window.moduleId);
      const moduleName = module?.displayName || window.title;

      // Close the errored window
      closeWindow(windowId);

      try {
        // Relaunch the module
        await launchModule(window.moduleId);
        
        addNotification(
          {
            title: 'Module Reloaded',
            message: `${moduleName} has been restarted successfully.`,
            type: 'success',
          },
          { duration: 3000 }
        );
      } catch (error) {
        addNotification(
          {
            title: 'Reload Failed',
            message: `Failed to restart ${moduleName}. Please try again.`,
            type: 'error',
          },
          { duration: 5000 }
        );
      }
    },
    [windows, closeWindow, launchModule, getModuleById, addNotification]
  );

  /**
   * Handle window close from error boundary
   */
  const handleCloseWindow = useCallback(
    (windowId: string) => {
      closeWindow(windowId);
    },
    [closeWindow]
  );

  return (
    <div
      data-testid='window-manager'
      role='region'
      aria-label='Application windows'
      aria-live='polite'
      className={`
        absolute top-0 left-0 w-full h-[calc(100vh-48px)]
        pointer-events-none overflow-hidden
        ${className}
      `.trim()}
    >
      {visibleWindows.map((window) => (
        <Window key={window.id} window={window}>
          <WindowErrorBoundary
            windowId={window.id}
            moduleName={window.title}
            onReload={handleReloadModule}
            onClose={handleCloseWindow}
          >
            <ModuleLoader moduleId={window.moduleId} />
          </WindowErrorBoundary>
        </Window>
      ))}
    </div>
  );
}

export default WindowManager;
