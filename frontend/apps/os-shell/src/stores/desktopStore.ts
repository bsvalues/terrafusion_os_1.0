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
import type { TerraFusionShellMode } from '../contracts/shellMode';
import {
  INITIAL_SHELL_MODE,
  isValidTransition,
  SHELL_SURFACE_POLICY,
} from '../contracts/shellMode';

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

export interface VirtualDesktop {
  id: string;
  name: string;
}

export interface DesktopWindow {
  id: string;
  moduleId: string;
  title: string;
  icon: string;
  desktopId: string;
  position: Position;
  size: Size;
  state: WindowState;
  zIndex: number;
  previousPosition?: Position;
  previousSize?: Size;
  snapZone?: SnapZone;
  metadata?: Record<string, any>; // Deep Context Payload
}

export interface DesktopState {
  // State
  shellMode: TerraFusionShellMode;
  previousShellMode: TerraFusionShellMode | null;
  windows: DesktopWindow[];
  activeWindowId: string | null;
  nextZIndex: number;
  snapPreview: SnapPreview | null;
  currentDesktopId: string;
  desktops: VirtualDesktop[];

  // Shell Mode Actions
  setShellMode: (mode: TerraFusionShellMode) => void;
  enterDesktop: () => void;
  enterHome: () => void;
  enterApplication: () => void;

  // Window Actions
  openWindow: (
    moduleId: string,
    title: string,
    icon: string,
    metadata?: Record<string, any>
  ) => string;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, position: Position) => void;
  updateWindowSize: (windowId: string, size: Size) => void;

  // Virtual Desktop Actions
  addDesktop: () => void;
  removeDesktop: (desktopId: string) => void;
  switchDesktop: (desktopId: string) => void;
  nextDesktop: () => void;
  previousDesktop: () => void;
  moveWindowToDesktop: (windowId: string, desktopId: string) => void;

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

const DEFAULT_WINDOW_SIZE: Size = { width: 1024, height: 700 };
const MIN_WINDOW_SIZE: Size = { width: 400, height: 300 };
const CASCADE_OFFSET = 30; // Pixels to offset each new window
const BASE_POSITION: Position = { x: 100, y: 50 };
const SNAP_THRESHOLD = 20; // Pixels from edge to trigger snap
const TASKBAR_HEIGHT = 48;

/**
 * Returns the correct window size for a module based on its type.
 * - Suite windows (suite-*) and OS features (os-*) → near-full-stage
 * - Property Workbench → maximized (full viewport minus chrome)
 * - Everything else → DEFAULT_WINDOW_SIZE
 */
function getModuleWindowSize(moduleId: string): { size: Size; maximized: boolean } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Property Workbench = Tier-0 surface → opens maximized
  if (moduleId === 'property-workbench') {
    return {
      size: { width: vw, height: vh - TASKBAR_HEIGHT },
      maximized: true,
    };
  }

  // Suite workspaces and OS features → near-full-stage
  if (moduleId.startsWith('suite-') || moduleId.startsWith('os-')) {
    return {
      size: { width: vw - 40, height: vh - 120 },
      maximized: false,
    };
  }

  return { size: { ...DEFAULT_WINDOW_SIZE }, maximized: false };
}

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
      shellMode: INITIAL_SHELL_MODE,
      previousShellMode: null,
      windows: [],
      activeWindowId: null,
      nextZIndex: 1,
      snapPreview: null,
      currentDesktopId: 'desktop-1',
      desktops: [
        { id: 'desktop-1', name: 'Desktop 1' },
        { id: 'desktop-2', name: 'Desktop 2' },
        { id: 'desktop-3', name: 'Desktop 3' },
        { id: 'desktop-4', name: 'Desktop 4' },
      ],

      // Shell Mode Actions
      setShellMode: (mode: TerraFusionShellMode) => {
        const { shellMode } = get();
        if (mode === shellMode) return;
        if (!isValidTransition(shellMode, mode)) return;
        set({ previousShellMode: shellMode, shellMode: mode });
      },

      enterDesktop: () => {
        get().setShellMode('desktop');
      },

      enterHome: () => {
        get().setShellMode('home');
      },

      enterApplication: () => {
        get().setShellMode('application');
      },

      // Window Actions
      openWindow: (
        moduleId: string,
        title: string,
        icon: string,
        metadata?: Record<string, any>
      ): string => {
        const id = generateWindowId();
        const { windows, nextZIndex, currentDesktopId } = get();

        // Use module-aware sizing (suites → near-full-stage, workbench → maximized)
        const { size: moduleSize, maximized } = getModuleWindowSize(moduleId);

        const newWindow: DesktopWindow = {
          id,
          moduleId,
          title,
          icon,
          desktopId: currentDesktopId,
          position: maximized ? { x: 0, y: 0 } : calculateNewWindowPosition(windows.length),
          size: moduleSize,
          state: maximized ? 'maximized' : 'normal',
          zIndex: nextZIndex,
          metadata, // INJECTED
        };

        set({
          windows: [...windows, newWindow],
          activeWindowId: id,
          nextZIndex: nextZIndex + 1,
        });

        // Shell mode: opening a window enters application mode
        get().enterApplication();

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

        // Shell mode: when last window closes, restore prior mode (or home)
        if (newWindows.length === 0) {
          const { previousShellMode } = get();
          const restoreTo = previousShellMode === 'application' ? 'home' : (previousShellMode ?? 'home');
          get().setShellMode(restoreTo);
        }
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
      // Virtual Desktop Actions
      // ========================================================================

      addDesktop: () => {
        const { desktops } = get();
        const newId = `desktop-${Date.now()}`;
        const newDesktop: VirtualDesktop = {
          id: newId,
          name: `Desktop ${desktops.length + 1}`,
        };
        set({ desktops: [...desktops, newDesktop] });
      },

      removeDesktop: (desktopId: string) => {
        const { desktops, windows, currentDesktopId } = get();
        if (desktops.length <= 1) return; // Cannot remove last desktop

        const newDesktops = desktops.filter((d) => d.id !== desktopId);

        // Move windows from removed desktop to the first available desktop
        const targetDesktopId = newDesktops[0].id;
        const newWindows = windows.map((w) =>
          w.desktopId === desktopId ? { ...w, desktopId: targetDesktopId } : w
        );

        // If we removed the current desktop, switch to the target
        const newCurrentId = currentDesktopId === desktopId ? targetDesktopId : currentDesktopId;

        set({
          desktops: newDesktops,
          windows: newWindows,
          currentDesktopId: newCurrentId,
        });
      },

      switchDesktop: (desktopId: string) => {
        const { desktops, windows } = get();
        if (!desktops.find((d) => d.id === desktopId)) return;

        // Find the top non-minimized window on the target desktop
        const desktopWindows = windows.filter((w) => w.desktopId === desktopId);
        const topWindow = findTopNonMinimizedWindow(desktopWindows);

        set({
          currentDesktopId: desktopId,
          activeWindowId: topWindow?.id || null,
        });
      },

      nextDesktop: () => {
        const { desktops, currentDesktopId } = get();
        const currentIndex = desktops.findIndex((d) => d.id === currentDesktopId);
        const nextIndex = (currentIndex + 1) % desktops.length;
        get().switchDesktop(desktops[nextIndex].id);
      },

      previousDesktop: () => {
        const { desktops, currentDesktopId } = get();
        const currentIndex = desktops.findIndex((d) => d.id === currentDesktopId);
        const prevIndex = (currentIndex - 1 + desktops.length) % desktops.length;
        get().switchDesktop(desktops[prevIndex].id);
      },

      moveWindowToDesktop: (windowId: string, desktopId: string) => {
        const { windows, desktops, currentDesktopId, activeWindowId } = get();
        if (!desktops.find((d) => d.id === desktopId)) return;

        const newWindows = windows.map((w) => (w.id === windowId ? { ...w, desktopId } : w));

        // If we moved the active window off the current desktop, find a new active window
        let newActiveWindowId = activeWindowId;
        if (windowId === activeWindowId && desktopId !== currentDesktopId) {
          const remainingWindows = newWindows.filter(
            (w) => w.desktopId === currentDesktopId && w.id !== windowId
          );
          const topWindow = findTopNonMinimizedWindow(remainingWindows);
          newActiveWindowId = topWindow?.id || null;
        }

        set({ windows: newWindows, activeWindowId: newActiveWindowId });
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
        const { windows, currentDesktopId } = get();
        return windows.filter((w) => w.state !== 'minimized' && w.desktopId === currentDesktopId);
      },

      getWindowsSortedByZIndex: (): DesktopWindow[] => {
        const { windows, currentDesktopId } = get();
        return [...windows]
          .filter((w) => w.desktopId === currentDesktopId)
          .sort((a, b) => a.zIndex - b.zIndex);
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

/**
 * Hook to get virtual desktop state and actions
 */
export const useVirtualDesktops = () =>
  useDesktopStore((state) => ({
    currentDesktopId: state.currentDesktopId,
    desktops: state.desktops,
    addDesktop: state.addDesktop,
    removeDesktop: state.removeDesktop,
    switchDesktop: state.switchDesktop,
    moveWindowToDesktop: state.moveWindowToDesktop,
  }));

/**
 * Hook to get the current shell mode
 */
export const useShellMode = () => useDesktopStore((state) => state.shellMode);

/**
 * Hook to get shell mode actions
 */
export const useShellModeActions = () =>
  useDesktopStore((state) => ({
    setShellMode: state.setShellMode,
    enterDesktop: state.enterDesktop,
    enterHome: state.enterHome,
    enterApplication: state.enterApplication,
  }));

/**
 * Hook to get surface visibility for the current shell mode
 */
export const useShellSurfaces = () => {
  const shellMode = useDesktopStore((state) => state.shellMode);
  return SHELL_SURFACE_POLICY[shellMode];
};

export default useDesktopStore;
