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
import {
  MODULE_OBJECT_TYPES,
  PLACEMENT_POLICY,
  type TerraFusionObjectType,
  type ObjectClassification,
} from '../contracts/objectPlacement';
import { shellEventBus } from './shellEventBus';

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
const TOP_BAR_HEIGHT = 44;

/**
 * Returns the correct window size for a module based on its type.
 * - All suites, workbench, and OS features → near-full-stage
 * - Everything else → DEFAULT_WINDOW_SIZE
 */
export function getModuleWindowSize(moduleId: string): { size: Size; maximized: boolean } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Use MODULE_OBJECT_TYPES classification when available
  const classification = MODULE_OBJECT_TYPES[moduleId];
  if (classification) {
    const { objectType } = classification;

    // Tier-0 workbench → MAXIMIZED (fills usable area between top bar and taskbar)
    if (objectType === 'tier0-workbench') {
      return {
        size: { width: vw, height: vh - TOP_BAR_HEIGHT - TASKBAR_HEIGHT },
        maximized: true,
      };
    }

    // Suite workspaces and OS feature windows → near-full-stage (large, movable)
    if (objectType === 'suite-workspace' || objectType === 'os-feature-window') {
      return {
        size: { width: vw - 40, height: vh - 120 },
        maximized: false,
      };
    }
  }

  // Prefix-matching fallback for unclassified modules
  if (moduleId.startsWith('suite-') || moduleId.startsWith('os-')) {
    return {
      size: { width: vw - 40, height: vh - 120 },
      maximized: false,
    };
  }

  return { size: { ...DEFAULT_WINDOW_SIZE }, maximized: false };
}

// ============================================================================
// Launcher Routing Enforcement (Phase 6 + Phase 9)
// ============================================================================

/**
 * Spawn decision returned by the codex-aware launcher.
 *
 *   'open'       — spawn as standalone window (suites, workbench, os-features, cross-parcel)
 *   'route-to-workbench' — must route through property workbench (parcel-scoped-app)
 *   'reject'     — cannot spawn a window (headless, toast, always-visible, overlay w/o host)
 */
export type SpawnDecision = 'open' | 'route-to-workbench' | 'reject';

export interface SpawnVerdict {
  decision: SpawnDecision;
  reason: string;
  classification?: ObjectClassification;
  objectType?: TerraFusionObjectType;
}

/**
 * Consult the 3-6-9 Object Placement Codex to determine how a module
 * should be launched. This is the constitutional front door — no object
 * may open a window without passing through this check.
 */
export function evaluateSpawnIntent(moduleId: string): SpawnVerdict {
  const classification = MODULE_OBJECT_TYPES[moduleId];

  // Unclassified modules: allow (graceful degradation for dev/extension modules)
  if (!classification) {
    return { decision: 'open', reason: 'unclassified-module-allowed' };
  }

  const { objectType } = classification;
  const policy = PLACEMENT_POLICY[objectType];
  if (!policy) {
    return { decision: 'open', reason: 'no-policy-found', classification, objectType };
  }

  // Phase 9 hard fail-safe: headless services MUST NOT spawn windows
  if (policy.layer === 'no-direct-ui' || policy.renderMode === 'headless') {
    return {
      decision: 'reject',
      reason: `headless-object-cannot-spawn: ${policy.driftForbidden}`,
      classification,
      objectType,
    };
  }

  // Toast-ephemeral objects cannot become persistent windows
  if (policy.renderMode === 'toast-ephemeral') {
    return {
      decision: 'reject',
      reason: `toast-cannot-persist: ${policy.driftForbidden}`,
      classification,
      objectType,
    };
  }

  // Always-visible shell chrome cannot be spawned as windows
  if (policy.renderMode === 'always-visible') {
    return {
      decision: 'reject',
      reason: `shell-chrome-not-spawnable: ${policy.driftForbidden}`,
      classification,
      objectType,
    };
  }

  // Overlay objects (audit-evidence-surface) need workbench host context
  if (policy.renderMode === 'overlay' && policy.hostSurface) {
    return {
      decision: 'route-to-workbench',
      reason: `overlay-requires-host: ${policy.driftForbidden}`,
      classification,
      objectType,
    };
  }

  // Parcel-scoped apps must route through workbench, never standalone
  if (policy.hostSurface === 'tier0-workbench') {
    return {
      decision: 'route-to-workbench',
      reason: `parcel-scoped-routes-through-workbench: ${policy.driftForbidden}`,
      classification,
      objectType,
    };
  }

  // Route-activated objects (home-scene, domain-router) are not window-spawned
  if (policy.renderMode === 'route-activated') {
    return {
      decision: 'reject',
      reason: `route-activated-not-window-spawnable: ${policy.driftForbidden}`,
      classification,
      objectType,
    };
  }

  // All window-spawned objects without a host surface → standalone open
  if (policy.renderMode === 'window-spawned' && !policy.hostSurface) {
    return { decision: 'open', reason: 'lawful-window-spawn', classification, objectType };
  }

  // Fallback: allow (should not reach here for classified objects)
  return { decision: 'open', reason: 'fallback-allow', classification, objectType };
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
 * Current usable desktop bounds inside the window manager region.
 */
const getUsableDesktopBounds = (): Size => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const height = typeof window !== 'undefined' ? window.innerHeight - TOP_BAR_HEIGHT - TASKBAR_HEIGHT : 708;
  return {
    width: Math.max(MIN_WINDOW_SIZE.width, width),
    height: Math.max(MIN_WINDOW_SIZE.height, height),
  };
};

/**
 * Enforce minimum window size
 */
const enforceMinSize = (size: Size): Size => ({
  width: Math.max(MIN_WINDOW_SIZE.width, size.width),
  height: Math.max(MIN_WINDOW_SIZE.height, size.height),
});

/**
 * Clamp size so a normal window always fits inside the usable desktop area.
 */
const clampSizeToDesktop = (size: Size): Size => {
  const bounds = getUsableDesktopBounds();
  const enforced = enforceMinSize(size);
  return {
    width: Math.min(enforced.width, bounds.width),
    height: Math.min(enforced.height, bounds.height),
  };
};

/**
 * Clamp position so the full window stays inside the usable desktop area.
 */
const clampPositionToDesktop = (position: Position, size: Size): Position => {
  const bounds = getUsableDesktopBounds();
  return {
    x: Math.min(Math.max(0, position.x), Math.max(0, bounds.width - size.width)),
    y: Math.min(Math.max(0, position.y), Math.max(0, bounds.height - size.height)),
  };
};

/**
 * Normalize a normal window's size and position together.
 */
const normalizeWindowBounds = (position: Position, size: Size): { position: Position; size: Size } => {
  const normalizedSize = clampSizeToDesktop(size);
  const normalizedPosition = clampPositionToDesktop(position, normalizedSize);
  return {
    position: normalizedPosition,
    size: normalizedSize,
  };
};

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
  const usableHeight = viewportHeight - TOP_BAR_HEIGHT - TASKBAR_HEIGHT;
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
        // ── Phase 6: Launcher Routing Enforcement ──────────────────────
        // Consult the 3-6-9 Codex before spawning any window.
        const verdict = evaluateSpawnIntent(moduleId);

        if (verdict.decision === 'reject') {
          // Object type is not allowed to spawn a window.
          if (typeof console !== 'undefined') {
          }
          shellEventBus.fire('spawn_rejected', null, moduleId, { reason: verdict.reason });
          return '';
        }

        if (verdict.decision === 'route-to-workbench') {
          // Parcel-scoped apps and overlays must route through workbench.
          // Open the workbench instead, injecting the requested tab into metadata.
          const workbenchModuleId = 'property-workbench';
          const routedMetadata = {
            ...metadata,
            _routedTab: moduleId,
            _routeReason: verdict.reason,
          };

          // Check if workbench is already open — focus it and switch tab
          const { windows } = get();
          const existingWorkbench = windows.find(
            (w) => w.moduleId === workbenchModuleId
          );
          if (existingWorkbench) {
            // Update metadata to switch tabs, then focus
            set({
              windows: windows.map((w) =>
                w.id === existingWorkbench.id
                  ? { ...w, metadata: { ...w.metadata, ...routedMetadata } }
                  : w
              ),
            });
            get().focusWindow(existingWorkbench.id);
            shellEventBus.fire('spawn_routed_to_workbench', existingWorkbench.id, moduleId, {
              reason: verdict.reason,
              reusedExisting: true,
            });
            return existingWorkbench.id;
          }

          // No workbench open — spawn it with the routed tab
          return get().openWindow(
            workbenchModuleId,
            'Property Workbench',
            'workbench',
            routedMetadata
          );
        }

        // ── Phase 9: Window Spawn — lawful open ────────────────────────
        const { windows, nextZIndex, currentDesktopId } = get();

        // Deduplicate: if a singleton window with the same moduleId exists, focus it
        // Workbench windows are multi-instance (one per parcel) — skip module dedup
        const isMultiInstance = moduleId === 'property-workbench';
        if (!isMultiInstance) {
          const existingByModule = windows.find((w) => w.moduleId === moduleId);
          if (existingByModule) {
            get().focusWindow(existingByModule.id);
            return existingByModule.id;
          }
        }

        const id = generateWindowId();

        // Use module-aware sizing (suites → near-full-stage, workbench → maximized)
        const { size: moduleSize, maximized } = getModuleWindowSize(moduleId);
        const initialBounds = maximized
          ? null
          : normalizeWindowBounds(calculateNewWindowPosition(windows.length), moduleSize);

        const newWindow: DesktopWindow = {
          id,
          moduleId,
          title,
          icon,
          desktopId: currentDesktopId,
          position: maximized ? { x: 0, y: 0 } : initialBounds!.position,
          size: maximized ? moduleSize : initialBounds!.size,
          state: maximized ? 'maximized' : 'normal',
          zIndex: nextZIndex,
          metadata,
        };

        set({
          windows: [...windows, newWindow],
          activeWindowId: id,
          nextZIndex: nextZIndex + 1,
        });

        // Shell mode: opening a window enters application mode
        get().enterApplication();

        shellEventBus.fire('window_opened', id, moduleId, { state: newWindow.state });

        return id;
      },

      closeWindow: (windowId: string) => {
        const { windows, activeWindowId } = get();
        const closedWindow = windows.find((w) => w.id === windowId);
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

        if (closedWindow) {
          shellEventBus.fire('window_closed', windowId, closedWindow.moduleId);
        }

        // Shell mode: when last window closes, restore prior mode (or home)
        if (newWindows.length === 0) {
          const { previousShellMode } = get();
          const restoreTo = previousShellMode === 'application' ? 'home' : (previousShellMode ?? 'home');
          get().setShellMode(restoreTo);
        }
      },

      minimizeWindow: (windowId: string) => {
        const { windows, activeWindowId } = get();
        const targetWindow = windows.find((w) => w.id === windowId);

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

        if (targetWindow) {
          shellEventBus.fire('window_minimized', windowId, targetWindow.moduleId);
        }
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

        shellEventBus.fire('window_maximized', windowId, targetWindow.moduleId);
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
            const restoredBounds = normalizeWindowBounds(
              w.previousPosition ?? w.position,
              w.previousSize ?? w.size
            );
            return {
              ...w,
              state: 'normal' as WindowState,
              position: restoredBounds.position,
              size: restoredBounds.size,
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

        shellEventBus.fire('window_restored', windowId, targetWindow.moduleId, {
          fromState: targetWindow.state,
        });
      },

      focusWindow: (windowId: string) => {
        const { windows, activeWindowId, nextZIndex } = get();

        const targetWindow = windows.find((w) => w.id === windowId);
        if (!targetWindow) return;

        // If minimized, restore it
        const wasMinimized = targetWindow.state === 'minimized';

        // Toggle: if already focused and not minimized, minimize it (standard OS behavior)
        if (!wasMinimized && windowId === activeWindowId && targetWindow.state !== 'minimized') {
          get().minimizeWindow(windowId);
          return;
        }

        // Check if window is already at highest z-index
        const maxZIndex = Math.max(...windows.map((w) => w.zIndex));
        const isAlreadyTop = targetWindow.zIndex === maxZIndex;

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

        shellEventBus.fire('window_focused', windowId, targetWindow.moduleId, {
          restoredFromMinimized: wasMinimized,
        });
      },

      updateWindowPosition: (windowId: string, position: Position) => {
        const { windows } = get();

        const newWindows = windows.map((w) => {
          if (w.id !== windowId) {
            return w;
          }
          return {
            ...w,
            position: clampPositionToDesktop(position, w.size),
          };
        });

        set({ windows: newWindows });
      },

      updateWindowSize: (windowId: string, size: Size) => {
        const { windows } = get();

        const newWindows = windows.map((w) => {
          if (w.id !== windowId) {
            return w;
          }
          const normalized = normalizeWindowBounds(w.position, size);
          return {
            ...w,
            position: normalized.position,
            size: normalized.size,
          };
        });

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
