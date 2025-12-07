/**
 * TerraFusion Design System - Spacing Tokens
 *
 * Comprehensive spacing system following 8px grid system.
 * Provides consistent spacing throughout the application.
 *
 * @module design-system/tokens/spacing
 */

// ============================================================================
// Base Spacing Scale (8px grid system)
// ============================================================================

export const spacing = {
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
} as const;

// ============================================================================
// Semantic Spacing
// ============================================================================

export const semanticSpacing = {
  // Component Spacing
  component: {
    xxs: spacing[1], // 4px
    xs: spacing[2], // 8px
    sm: spacing[3], // 12px
    md: spacing[4], // 16px
    lg: spacing[6], // 24px
    xl: spacing[8], // 32px
    xxl: spacing[12], // 48px
  },

  // Layout Spacing
  layout: {
    xs: spacing[4], // 16px
    sm: spacing[6], // 24px
    md: spacing[8], // 32px
    lg: spacing[12], // 48px
    xl: spacing[16], // 64px
    xxl: spacing[24], // 96px
  },

  // Container Padding
  container: {
    mobile: spacing[4], // 16px
    tablet: spacing[6], // 24px
    desktop: spacing[8], // 32px
    wide: spacing[12], // 48px
  },

  // Section Spacing
  section: {
    xs: spacing[8], // 32px
    sm: spacing[12], // 48px
    md: spacing[16], // 64px
    lg: spacing[24], // 96px
    xl: spacing[32], // 128px
  },
} as const;

// ============================================================================
// Gap Utilities (for Flexbox/Grid)
// ============================================================================

export const gap = {
  0: spacing[0],
  1: spacing[1],
  2: spacing[2],
  3: spacing[3],
  4: spacing[4],
  5: spacing[5],
  6: spacing[6],
  8: spacing[8],
  10: spacing[10],
  12: spacing[12],
  16: spacing[16],
} as const;

// ============================================================================
// Inset Spacing (Padding shorthand)
// ============================================================================

export const inset = {
  0: spacing[0],
  xs: spacing[2], // 8px
  sm: spacing[3], // 12px
  md: spacing[4], // 16px
  lg: spacing[6], // 24px
  xl: spacing[8], // 32px
} as const;

// ============================================================================
// Stack Spacing (Vertical rhythm)
// ============================================================================

export const stack = {
  xxs: spacing[1], // 4px
  xs: spacing[2], // 8px
  sm: spacing[4], // 16px
  md: spacing[6], // 24px
  lg: spacing[8], // 32px
  xl: spacing[12], // 48px
  xxl: spacing[16], // 64px
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type SpacingScale = keyof typeof spacing;
export type SemanticSpacing = keyof typeof semanticSpacing;
export type GapSize = keyof typeof gap;
export type InsetSize = keyof typeof inset;
export type StackSize = keyof typeof stack;

// ============================================================================
// Default Export
// ============================================================================

export default {
  spacing,
  semantic: semanticSpacing,
  gap,
  inset,
  stack,
} as const;
