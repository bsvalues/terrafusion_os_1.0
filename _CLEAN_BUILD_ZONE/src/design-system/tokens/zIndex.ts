/**
 * TerraFusion Design System - Z-Index Tokens
 * 
 * Layering system for consistent z-index management.
 * 
 * @module design-system/tokens/zIndex
 */

// ============================================================================
// Z-Index Scale
// ============================================================================

export const zIndex = {
  // Base layers
  base: 0,
  behind: -1,
  
  // Component layers
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  toast: 1700,
  
  // Extreme layers
  max: 9999,
} as const;

// ============================================================================
// Type Export
// ============================================================================

export type ZIndex = keyof typeof zIndex;

// ============================================================================
// Default Export
// ============================================================================

export default zIndex;
