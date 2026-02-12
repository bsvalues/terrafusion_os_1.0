/**
 * TerraFusion Design System - Shadow Tokens
 * 
 * Shadow system for depth and elevation.
 * 
 * @module design-system/tokens/shadows
 */

// ============================================================================
// Box Shadows
// ============================================================================

export const boxShadow = {
  none: 'none',
  
  // Standard shadows (dark theme optimized)
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.6), 0 1px 2px -1px rgba(0, 0, 0, 0.6)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.7), 0 2px 4px -2px rgba(0, 0, 0, 0.7)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.8), 0 4px 6px -4px rgba(0, 0, 0, 0.8)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.9), 0 8px 10px -6px rgba(0, 0, 0, 0.9)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.95)',
  
  // Elevation shadows
  elevation: {
    1: '0 1px 3px rgba(0, 0, 0, 0.6)',
    2: '0 2px 6px rgba(0, 0, 0, 0.7)',
    3: '0 4px 12px rgba(0, 0, 0, 0.75)',
    4: '0 8px 24px rgba(0, 0, 0, 0.8)',
    5: '0 16px 48px rgba(0, 0, 0, 0.85)',
  },
  
  // Colored shadows (brand)
  colored: {
    primary: '0 10px 30px -5px rgba(0, 153, 255, 0.4)',
    transcend: '0 10px 30px -5px rgba(0, 255, 238, 0.4)',
    accent: '0 10px 30px -5px rgba(0, 255, 170, 0.4)',
    success: '0 10px 30px -5px rgba(0, 255, 170, 0.4)',
    error: '0 10px 30px -5px rgba(255, 0, 0, 0.4)',
    warning: '0 10px 30px -5px rgba(255, 185, 0, 0.4)',
  },
  
  // Glow effects
  glow: {
    sm: '0 0 10px rgba(0, 153, 255, 0.3)',
    md: '0 0 20px rgba(0, 153, 255, 0.4)',
    lg: '0 0 40px rgba(0, 153, 255, 0.5)',
    xl: '0 0 60px rgba(0, 153, 255, 0.6)',
  },
  
  // Inner shadows
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.6)',
  innerLg: 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.7)',
} as const;

// ============================================================================
// Drop Shadows (for SVG/filters)
// ============================================================================

export const dropShadow = {
  none: 'none',
  sm: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5))',
  md: 'drop-shadow(0 4px 3px rgba(0, 0, 0, 0.7))',
  lg: 'drop-shadow(0 10px 8px rgba(0, 0, 0, 0.8))',
  xl: 'drop-shadow(0 20px 13px rgba(0, 0, 0, 0.9))',
  '2xl': 'drop-shadow(0 25px 25px rgba(0, 0, 0, 0.95))',
} as const;

// ============================================================================
// Text Shadows
// ============================================================================

export const textShadow = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.8)',
  md: '0 2px 4px rgba(0, 0, 0, 0.9)',
  lg: '0 4px 8px rgba(0, 0, 0, 0.95)',
  glow: '0 0 20px rgba(0, 153, 255, 0.6)',
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type BoxShadow = keyof typeof boxShadow;
export type DropShadow = keyof typeof dropShadow;
export type TextShadow = keyof typeof textShadow;

// ============================================================================
// Default Export
// ============================================================================

export const shadows = {
  box: boxShadow,
  drop: dropShadow,
  text: textShadow,
} as const;

export default shadows;
