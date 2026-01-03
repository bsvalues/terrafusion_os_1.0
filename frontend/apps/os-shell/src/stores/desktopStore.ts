/**
 * TerraFusion OS Desktop Store
 *
 * Zustand store for managing desktop window state including:
 * - Window lifecycle (open, close, minimize, maximize, restore)
 * - Window positioning and sizing
 * - Z-index management for window stacking
 * - Active window tracking
 * - Window snapping (edges and corners)
 *
 * @module stores/desktopStore
 * @see SUCCESS CRITERIA SC-4: Window Management System
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type WindowState = 'normal' | 'minimized' | 'maximized' | 'snapped';

export type SnapZone =
  | 'left'
  | 'right'
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface SnapBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapPreview {
  zone: SnapZone;
  bounds: SnapBounds;
}

export interface DesktopWindow {
  id: string;
  moduleId: string;
  title: string;
  icon: string;
  position: Position;
  size: Size;
  state: WindowState;
  zIndex: number;
  previousPosition?: Position;
  previousSize?: Size;
  snapZone?: SnapZone;
}

export interface DesktopState {
  // State
  windows: DesktopWindow[];
  activeWindowId: string | null;
  nextZIndex: number;
  snapPreview: SnapPreview | null;

  // Actions
  openWindow: (moduleId: string, title: string, icon: string) => string;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, position: Position) => void;
  updateWindowSize: (windowId: string, size: Size) => void;

  // Snap Actions
  detectSnapZone: (
    position: Position,
    viewportWidth: number,
    viewportHeight: number
  ) => SnapZone | null;
  setSnapPreview: (zone: SnapZone, viewportWidth: number, viewportHeight: number) => void;
  clearSnapPreview: () => void;
  snapWindow: (
    windowId: string,
    zone: SnapZone,
    viewportWidth: number,
    viewportHeight: number
  ) => void;
  snapActiveWindowLeft: (viewportWidth: number, viewportHeight: number) => void;
  snapActiveWindowRight: (viewportWidth: number, viewportHeight: number) => void;

  // Selectors (computed values as functions)
  getWindowById: (windowId: string) => DesktopWindow | undefined;
  getActiveWindow: () => DesktopWindow | undefined;
  getNonMinimizedWindows: () => DesktopWindow[];
  getWindowsSortedByZIndex: () => DesktopWindow[];
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_WINDOW_SIZE: Size = { width: 800, height: 600 };
const MIN_WINDOW_SIZE: Size = { width: 400, height: 300 };
const CASCADE_OFFSET = 30; // Pixels to offset each new window
const BASE_POSITION: Position = { x: 100, y: 50 };
const SNAP_THRESHOLD = 20; // Pixels from edge to trigger snap
const TASKBAR_HEIGHT = 48;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique window ID
 */
const generateWindowId = (): string => {
  return `window-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Calculate position for a new window with cascade effect
 */
const calculateNewWindowPosition = (windowCount: number): Position => {
  const offset = windowCount * CASCADE_OFFSET;
  return {
    x: BASE_POSITION.x + offset,
    y: BASE_POSITION.y + offset,
  };
};

/**
 * Clamp position to non-negative values
 */
const clampPosition = (position: Position): Position => ({
  x: Math.max(0, position.x),
  y: Math.max(0, position.y),
});

/**
 * Enforce minimum window size
 */
const enforceMinSize = (size: Size): Size => ({
  width: Math.max(MIN_WINDOW_SIZE.width, size.width),
  height: Math.max(MIN_WINDOW_SIZE.height, size.height),
});

/**
 * Find the window with the highest z-index among non-minimized windows
 */
const findTopNonMinimizedWindow = (windows: DesktopWindow[]): DesktopWindow | undefined => {
  const nonMinimized = windows.filter((w) => w.state !== 'minimized');
  if (nonMinimized.length === 0) return undefined;

  return nonMinimized.reduce((top, current) => (current.zIndex > top.zIndex ? current : top));
};

/**
 * Calculate snap bounds for a given zone
 */
const calculateSnapBounds = (
  zone: SnapZone,
  viewportWidth: number,
  viewportHeight: number
): SnapBounds => {
  const usableHeight = viewportHeight - TASKBAR_HEIGHT;
  const halfWidth = viewportWidth / 2;
  const halfHeight = usableHeight / 2;

  switch (zone) {
    case 'left':
      return { x: 0, y: 0, width: halfWidth, height: usableHeight };
    case 'right':
      return { x: halfWidth, y: 0, width: halfWidth, height: usableHeight };
    case 'top':
      return { x: 0, y: 0, width: viewportWidth, height: usableHeight };
    case 'top-left':
      return { x: 0, y: 0, width: halfWidth, height: halfHeight };
    case 'top-right':
      return { x: halfWidth, y: 0, width: halfWidth, height: halfHeight };
    case 'bottom-left':
      return { x: 0, y: halfHeight, width: halfWidth, height: halfHeight };
    case 'bottom-right':
      return { x: halfWidth, y: halfHeight, width: halfWidth, height: halfHeight };
    default:
      return { x: 0, y: 0, width: viewportWidth, height: usableHeight };
  }
};

// ============================================================================
// Store
// ============================================================================

export const useDesktopStore = create<DesktopState>()(
  devtools(
    (set, get) => ({
      // Initial State
      windows: [],
      activeWindowId: null,
      nextZIndex: 1,
      snapPreview: null,

      // Actions
      openWindow: (moduleId: string, title: string, icon: string): string => {
        const id = generateWindowId();
        const { windows, nextZIndex } = get();

        const newWindow: DesktopWindow = {
          id,
          moduleId,
          title,
          icon,
          position: calculateNewWindowPosition(windows.length),
          size: { ...DEFAULT_WINDOW_SIZE },
          state: 'normal',
          zIndex: nextZIndex,
        };

        set({
          windows: [...windows, newWindow],
          activeWindowId: id,
          nextZIndex: nextZIndex + 1,
        });

        return id;
      },

      closeWindow: (windowId: string) => {
        const { windows, activeWindowId } = get();
        const newWindows = windows.filter((w) => w.id !== windowId);

        let newActiveId: string | null = activeWindowId;

        // If we're closing the active window, find next window to activate
        if (activeWindowId === windowId) {
          if (newWindows.length === 0) {
            newActiveId = null;
          } else {
            // Find window with highest z-index among remaining windows
            const topWindow = findTopNonMinimizedWindow(newWindows);
            newActiveId = topWindow?.id ?? null;
          }
        }

        set({
          windows: newWindows,
          activeWindowId: newActiveId,
        });
      },

      minimizeWindow: (windowId: string) => {
        const { windows, activeWindowId } = get();

        const newWindows = windows.map((w) =>
          w.id === windowId ? { ...w, state: 'minimized' as WindowState } : w
        );

        let newActiveId: string | null = activeWindowId;

        // If minimizing the active window, find next non-minimized window
        if (activeWindowId === windowId) {
          const topWindow = findTopNonMinimizedWindow(newWindows);
          newActiveId = topWindow?.id ?? null;
        }

        set({
          windows: newWindows,
          activeWindowId: newActiveId,
        });
      },

      maximizeWindow: (windowId: string) => {
        const { windows, nextZIndex } = get();

        const targetWindow = windows.find((w) => w.id === windowId);
        if (!targetWindow) return;

        // Check if window is already at highest z-index
        const maxZIndex = Math.max(...windows.map((w) => w.zIndex));
        const needsNewZIndex = targetWindow.zIndex < maxZIndex;

        const newWindows = windows.map((w) => {
          if (w.id === windowId) {
            return {
              ...w,
              state: 'maximized' as WindowState,
              previousPosition: w.state === 'normal' ? { ...w.position } : w.previousPosition,
              previousSize: w.state === 'normal' ? { ...w.size } : w.previousSize,
              zIndex: needsNewZIndex ? nextZIndex : w.zIndex,
              snapZone: undefined,
            };
          }
          return w;
        });

        set({
          windows: newWindows,
          activeWindowId: windowId,
          nextZIndex: needsNewZIndex ? nextZIndex + 1 : nextZIndex,
        });
      },

      restoreWindow: (windowId: string) => {
        const { windows, nextZIndex } = get();

        const targetWindow = windows.find((w) => w.id === windowId);
        if (!targetWindow) return;

        // Check if window is already at highest z-index
        const maxZIndex = Math.max(...windows.map((w) => w.zIndex));
        const needsNewZIndex = targetWindow.zIndex < maxZIndex;

        const newWindows = windows.map((w) => {
          if (w.id === windowId) {
            return {
              ...w,
              state: 'normal' as WindowState,
              position: w.previousPosition ?? w.position,
              size: w.previousSize ?? w.size,
              zIndex: needsNewZIndex ? nextZIndex : w.zIndex,
              previousPosition: undefined,
              previousSize: undefined,
              snapZone: undefined,
            };
          }
          return w;
        });

        set({
          windows: newWindows,
          activeWindowId: windowId,
          nextZIndex: needsNewZIndex ? nextZIndex + 1 : nextZIndex,
        });
      },

      focusWindow: (windowId: string) => {
        const { windows, nextZIndex } = get();

        const targetWindow = windows.find((w) => w.id === windowId);
        if (!targetWindow) return;

        // Check if window is already at highest z-index
        const maxZIndex = Math.max(...windows.map((w) => w.zIndex));
        const isAlreadyTop = targetWindow.zIndex === maxZIndex;

        // If minimized, restore it
        const wasMinimized = targetWindow.state === 'minimized';

        const newWindows = windows.map((w) => {
          if (w.id === windowId) {
            return {
              ...w,
              state: wasMinimized ? ('normal' as WindowState) : w.state,
              zIndex: isAlreadyTop ? w.zIndex : nextZIndex,
            };
          }
          return w;
        });

        set({
          windows: newWindows,
          activeWindowId: windowId,
          nextZIndex: isAlreadyTop ? nextZIndex : nextZIndex + 1,
        });
      },

      updateWindowPosition: (windowId: string, position: Position) => {
        const { windows } = get();

        const clampedPosition = clampPosition(position);

        const newWindows = windows.map((w) =>
          w.id === windowId ? { ...w, position: clampedPosition } : w
        );

        set({ windows: newWindows });
      },

      updateWindowSize: (windowId: string, size: Size) => {
        const { windows } = get();

        const enforcedSize = enforceMinSize(size);

        const newWindows = windows.map((w) =>
          w.id === windowId ? { ...w, size: enforcedSize } : w
        );

        set({ windows: newWindows });
      },

      // ========================================================================
      // Snap Actions
      // ========================================================================

      detectSnapZone: (
        position: Position,
        viewportWidth: number,
        viewportHeight: number
      ): SnapZone | null => {
        const usableHeight = viewportHeight - TASKBAR_HEIGHT;
        const nearLeft = position.x < SNAP_THRESHOLD;
        const nearRight = position.x > viewportWidth - SNAP_THRESHOLD;
        const nearTop = position.y < SNAP_THRESHOLD;
        const nearBottom = position.y > usableHeight - SNAP_THRESHOLD;

        // Corner detection first (more specific)
        if (nearTop && nearLeft) return 'top-left';
        if (nearTop && nearRight) return 'top-right';
        if (nearBottom && nearLeft) return 'bottom-left';
        if (nearBottom && nearRight) return 'bottom-right';

        // Edge detection
        if (nearTop) return 'top';
        if (nearLeft) return 'left';
        if (nearRight) return 'right';

        return null;
      },

      setSnapPreview: (zone: SnapZone, viewportWidth: number, viewportHeight: number) => {
        const bounds = calculateSnapBounds(zone, viewportWidth, viewportHeight);
        set({ snapPreview: { zone, bounds } });
      },

      clearSnapPreview: () => {
        set({ snapPreview: null });
      },

      snapWindow: (
        windowId: string,
        zone: SnapZone,
        viewportWidth: number,
        viewportHeight: number
      ) => {
        const { windows, nextZIndex } = get();

        const targetWindow = windows.find((w) => w.id === windowId);
        if (!targetWindow) return;

        // For 'top' zone, just maximize
        if (zone === 'top') {
          get().maximizeWindow(windowId);
          set({ snapPreview: null });
          return;
        }

        const bounds = calculateSnapBounds(zone, viewportWidth, viewportHeight);

        // Check if window is already at highest z-index
        const maxZIndex = Math.max(...windows.map((w) => w.zIndex));
        const needsNewZIndex = targetWindow.zIndex < maxZIndex;

        const newWindows = windows.map((w) => {
          if (w.id === windowId) {
            return {
              ...w,
              state: 'snapped' as WindowState,
              position: { x: bounds.x, y: bounds.y },
              size: { width: bounds.width, height: bounds.height },
              previousPosition: w.state === 'normal' ? { ...w.position } : w.previousPosition,
              previousSize: w.state === 'normal' ? { ...w.size } : w.previousSize,
              zIndex: needsNewZIndex ? nextZIndex : w.zIndex,
              snapZone: zone,
            };
          }
          return w;
        });

        set({
          windows: newWindows,
          activeWindowId: windowId,
          nextZIndex: needsNewZIndex ? nextZIndex + 1 : nextZIndex,
          snapPreview: null,
        });
      },

      snapActiveWindowLeft: (viewportWidth: number, viewportHeight: number) => {
        const { activeWindowId } = get();
        if (!activeWindowId) return;
        get().snapWindow(activeWindowId, 'left', viewportWidth, viewportHeight);
      },

      snapActiveWindowRight: (viewportWidth: number, viewportHeight: number) => {
        const { activeWindowId } = get();
        if (!activeWindowId) return;
        get().snapWindow(activeWindowId, 'right', viewportWidth, viewportHeight);
      },

      // Selectors
      getWindowById: (windowId: string): DesktopWindow | undefined => {
        return get().windows.find((w) => w.id === windowId);
      },

      getActiveWindow: (): DesktopWindow | undefined => {
        const { windows, activeWindowId } = get();
        if (!activeWindowId) return undefined;
        return windows.find((w) => w.id === activeWindowId);
      },

      getNonMinimizedWindows: (): DesktopWindow[] => {
        return get().windows.filter((w) => w.state !== 'minimized');
      },

      getWindowsSortedByZIndex: (): DesktopWindow[] => {
        return [...get().windows].sort((a, b) => a.zIndex - b.zIndex);
      },
    }),
    { name: 'TerraFusion-Desktop-Store' }
  )
);

// ============================================================================
// Convenience Hooks (for React components)
// ============================================================================

/**
 * Hook to get all windows
 */
export const useWindows = () => useDesktopStore((state) => state.windows);

/**
 * Hook to get active window ID
 */
export const useActiveWindowId = () => useDesktopStore((state) => state.activeWindowId);

/**
 * Hook to get snap preview
 */
export const useSnapPreview = () => useDesktopStore((state) => state.snapPreview);

/**
 * Hook to get window actions
 */
export const useWindowActions = () =>
  useDesktopStore((state) => ({
    openWindow: state.openWindow,
    closeWindow: state.closeWindow,
    minimizeWindow: state.minimizeWindow,
    maximizeWindow: state.maximizeWindow,
    restoreWindow: state.restoreWindow,
    focusWindow: state.focusWindow,
    updateWindowPosition: state.updateWindowPosition,
    updateWindowSize: state.updateWindowSize,
  }));

/**
 * Hook to get snap actions
 */
export const useSnapActions = () =>
  useDesktopStore((state) => ({
    detectSnapZone: state.detectSnapZone,
    setSnapPreview: state.setSnapPreview,
    clearSnapPreview: state.clearSnapPreview,
    snapWindow: state.snapWindow,
    snapActiveWindowLeft: state.snapActiveWindowLeft,
    snapActiveWindowRight: state.snapActiveWindowRight,
  }));

export default useDesktopStore;
