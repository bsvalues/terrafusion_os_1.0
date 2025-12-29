/**
 * TerraFusion OS WindowManager Component
 *
 * Renders all windows from the desktop store, managing z-index layering.
 * Each window contains a ModuleLoader that renders the actual module content.
 *
 * @module shell/desktop/WindowManager
 * @see SUCCESS CRITERIA SC-4, SC-3.3
 */

import { useDesktopStore } from '../../stores/desktopStore';
import { ModuleLoader } from './ModuleLoader';
import { Window } from './Window';

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
 * - Each window contains a ModuleLoader for content
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

  // Filter out minimized windows and sort by z-index (ascending)
  // Lower z-index renders first = appears behind higher z-index windows
  const visibleWindows = windows
    .filter((w) => w.state !== 'minimized')
    .sort((a, b) => a.zIndex - b.zIndex);

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
          <ModuleLoader moduleId={window.moduleId} />
        </Window>
      ))}
    </div>
  );
}

export default WindowManager;
