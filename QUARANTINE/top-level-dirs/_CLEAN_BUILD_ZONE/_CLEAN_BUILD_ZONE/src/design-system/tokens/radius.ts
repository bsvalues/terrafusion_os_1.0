/**
 * TerraFusion Design System - Border Radius Tokens
 * 
 * Border radius system for consistent corner rounding.
 * 
 * @module design-system/tokens/radius
 */

// ============================================================================
// Border Radius Scale
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.125rem',    // 2px
  md: '0.25rem',     // 4px
  DEFAULT: '0.375rem', // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',    // Circle/pill
} as const;

// ============================================================================
// Semantic Border Radius
// ============================================================================

export const semanticRadius = {
  button: borderRadius.lg,
  input: borderRadius.md,
  card: borderRadius.xl,
  modal: borderRadius['2xl'],
  badge: borderRadius.full,
  avatar: borderRadius.full,
  image: borderRadius.lg,
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type BorderRadius = keyof typeof borderRadius;
export type SemanticRadius = keyof typeof semanticRadius;

// ============================================================================
// Default Export
// ============================================================================

export const radius = {
  borderRadius,
  semantic: semanticRadius,
} as const;

export default radius;
