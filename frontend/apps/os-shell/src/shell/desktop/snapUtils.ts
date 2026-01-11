/**
 * TerraFusion OS Window Snapping Utilities
 *
 * Provides edge detection and snap dimension calculations for
 * Windows-style window snapping functionality.
 *
 * @module shell/desktop/snapUtils
 * @see SUCCESS CRITERIA Phase 4
 */

// ============================================================================
// Types
// ============================================================================

export type SnapZone =
  | 'left'
  | 'right'
  | 'maximize'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface SnapPosition {
  x: number;
  y: number;
}

export interface SnapDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Distance from screen edge (in pixels) to trigger snap detection
 */
export const SNAP_THRESHOLD = 20;

/**
 * Corner detection area - if within this distance of BOTH edges, it's a corner
 */
export const CORNER_THRESHOLD = 50;

// ============================================================================
// Edge Detection
// ============================================================================

/**
 * Detects which snap zone (if any) the cursor is in based on position.
 *
 * Priority:
 * 1. Corners (if near two edges simultaneously)
 * 2. Top edge → maximize
 * 3. Left/Right edges → half snap
 *
 * @param cursorPosition - Current cursor/window drag position
 * @param screenWidth - Available screen width
 * @param screenHeight - Available screen height (minus taskbar)
 * @returns The snap zone or null if not in any zone
 */
export function detectSnapZone(
  cursorPosition: SnapPosition,
  screenWidth: number,
  screenHeight: number
): SnapZone | null {
  const { x, y } = cursorPosition;

  const nearLeft = x < SNAP_THRESHOLD;
  const nearRight = x > screenWidth - SNAP_THRESHOLD;
  const nearTop = y < SNAP_THRESHOLD;
  const nearBottom = y > screenHeight - SNAP_THRESHOLD;

  // Corner detection (corners take priority)
  const inCornerZoneLeft = x < CORNER_THRESHOLD;
  const inCornerZoneRight = x > screenWidth - CORNER_THRESHOLD;
  const inCornerZoneTop = y < CORNER_THRESHOLD;
  const inCornerZoneBottom = y > screenHeight - CORNER_THRESHOLD;

  // Check corners first (highest priority)
  if (nearLeft && nearTop) {
    return 'top-left';
  }
  if (nearRight && nearTop) {
    return 'top-right';
  }
  if (nearLeft && nearBottom) {
    return 'bottom-left';
  }
  if (nearRight && nearBottom) {
    return 'bottom-right';
  }

  // Extended corner zones (when near edge but within corner threshold of top/bottom)
  if (nearLeft && inCornerZoneTop) {
    return 'top-left';
  }
  if (nearLeft && inCornerZoneBottom) {
    return 'bottom-left';
  }
  if (nearRight && inCornerZoneTop) {
    return 'top-right';
  }
  if (nearRight && inCornerZoneBottom) {
    return 'bottom-right';
  }

  // Top edge → maximize (not in corner zones)
  if (nearTop && !inCornerZoneLeft && !inCornerZoneRight) {
    return 'maximize';
  }

  // Left edge
  if (nearLeft) {
    return 'left';
  }

  // Right edge
  if (nearRight) {
    return 'right';
  }

  // Not in any snap zone
  return null;
}

// ============================================================================
// Snap Dimensions Calculator
// ============================================================================

/**
 * Calculates the position and size for a window in a given snap zone.
 *
 * @param zone - The snap zone to calculate dimensions for
 * @param screenWidth - Available screen width
 * @param screenHeight - Available screen height (minus taskbar)
 * @returns Position and size for the snapped window
 */
export function getSnapDimensions(
  zone: SnapZone,
  screenWidth: number,
  screenHeight: number
): SnapDimensions {
  const halfWidth = screenWidth / 2;
  const halfHeight = screenHeight / 2;

  switch (zone) {
    case 'left':
      return {
        x: 0,
        y: 0,
        width: halfWidth,
        height: screenHeight,
      };

    case 'right':
      return {
        x: halfWidth,
        y: 0,
        width: halfWidth,
        height: screenHeight,
      };

    case 'maximize':
      return {
        x: 0,
        y: 0,
        width: screenWidth,
        height: screenHeight,
      };

    case 'top-left':
      return {
        x: 0,
        y: 0,
        width: halfWidth,
        height: halfHeight,
      };

    case 'top-right':
      return {
        x: halfWidth,
        y: 0,
        width: halfWidth,
        height: halfHeight,
      };

    case 'bottom-left':
      return {
        x: 0,
        y: halfHeight,
        width: halfWidth,
        height: halfHeight,
      };

    case 'bottom-right':
      return {
        x: halfWidth,
        y: halfHeight,
        width: halfWidth,
        height: halfHeight,
      };

    default:
      // Fallback - should never happen
      return {
        x: 0,
        y: 0,
        width: screenWidth,
        height: screenHeight,
      };
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Checks if a window is currently in a snapped state
 */
export function isWindowSnapped(state: string, snapZone?: SnapZone | null): boolean {
  return state === 'snapped' && snapZone != null;
}

/**
 * Gets the opposite snap zone (for Win+Arrow cycling)
 */
export function getOppositeZone(zone: SnapZone): SnapZone | null {
  switch (zone) {
    case 'left':
      return 'right';
    case 'right':
      return 'left';
    case 'top-left':
      return 'top-right';
    case 'top-right':
      return 'top-left';
    case 'bottom-left':
      return 'bottom-right';
    case 'bottom-right':
      return 'bottom-left';
    default:
      return null;
  }
}

export default {
  detectSnapZone,
  getSnapDimensions,
  isWindowSnapped,
  getOppositeZone,
  SNAP_THRESHOLD,
  CORNER_THRESHOLD,
};
