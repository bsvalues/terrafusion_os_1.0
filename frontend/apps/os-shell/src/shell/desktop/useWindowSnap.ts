/**
 * TerraFusion OS Window Snap Hook
 *
 * Custom React hook that provides window snapping functionality:
 * - Detects snap zones during window drag
 * - Shows snap preview ghost overlay
 * - Applies snap on drag release
 * - Handles edge detection and dimension calculations
 *
 * @module shell/desktop/useWindowSnap
 */

import { useCallback, useEffect, useRef } from 'react';
import { useDesktopStore } from '../../stores/desktopStore';
import { type SnapZone } from './snapUtils';

// ============================================================================
// Types
// ============================================================================

export interface UseWindowSnapOptions {
  /** Window ID for snap operations */
  windowId: string;
  /** Whether window is currently being dragged */
  isDragging: boolean;
  /** Current cursor position during drag (optional, used for preview) */
  cursorPosition?: { x: number; y: number };
}

export interface UseWindowSnapReturn {
  /** Current detected snap zone (null if not near edge) */
  currentSnapZone: SnapZone | null;
  /** Apply snap to window (called on drag release) */
  applySnap: () => void;
  /** Clear snap preview (called on drag end or cancel) */
  clearPreview: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useWindowSnap - Window snapping logic hook
 *
 * Handles:
 * 1. Snap zone detection during drag
 * 2. Snap preview display
 * 3. Snap application on release
 *
 * Usage:
 * ```tsx
 * const { currentSnapZone, applySnap, clearPreview } = useWindowSnap({
 *   windowId: window.id,
 *   isDragging,
 *   cursorPosition: { x, y },
 * });
 * ```
 *
 * @param options - Hook configuration
 * @returns Snap zone detection and control functions
 */
export function useWindowSnap(options: UseWindowSnapOptions): UseWindowSnapReturn {
  const { windowId, isDragging, cursorPosition } = options;

  const {
    detectSnapZone: detectZone,
    setSnapPreview,
    clearSnapPreview,
    snapWindow,
  } = useDesktopStore();

  // Track current snap zone during drag
  const currentSnapZoneRef = useRef<SnapZone | null>(null);

  /**
   * Update snap preview based on cursor position
   */
  const updateSnapPreview = useCallback(
    (x: number, y: number) => {
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Detect snap zone
      const zone = detectZone({ x, y }, viewportWidth, viewportHeight);

      // Update current zone ref
      currentSnapZoneRef.current = zone;

      // Update preview in store
      if (zone) {
        setSnapPreview(zone, viewportWidth, viewportHeight);
      } else {
        clearSnapPreview();
      }
    },
    [detectZone, setSnapPreview, clearSnapPreview]
  );

  /**
   * Apply snap to window (called on drag release)
   */
  const applySnap = useCallback(() => {
    const zone = currentSnapZoneRef.current;

    if (zone) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      snapWindow(windowId, zone, viewportWidth, viewportHeight);
    }

    // Clear preview after applying snap
    clearSnapPreview();
  }, [windowId, snapWindow, clearSnapPreview]);

  /**
   * Clear snap preview (called on drag end or cancel)
   */
  const clearPreview = useCallback(() => {
    currentSnapZoneRef.current = null;
    clearSnapPreview();
  }, [clearSnapPreview]);

  /**
   * Update preview when cursor position changes during drag
   */
  useEffect(() => {
    if (isDragging && cursorPosition) {
      updateSnapPreview(cursorPosition.x, cursorPosition.y);
    } else if (!isDragging) {
      // Clear preview when not dragging
      clearPreview();
    }
  }, [isDragging, cursorPosition, updateSnapPreview, clearPreview]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearSnapPreview();
    };
  }, [clearSnapPreview]);

  return {
    currentSnapZone: currentSnapZoneRef.current,
    applySnap,
    clearPreview,
  };
}

export default useWindowSnap;
