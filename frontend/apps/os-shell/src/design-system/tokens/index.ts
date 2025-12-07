/**
 * TerraFusion Design System - Token System
 *
 * Central export for all design tokens. Import from this file to access
 * any token in the system with full TypeScript support.
 *
 * @module design-system/tokens
 * @example
 * ```typescript
 * import { tokens } from '@/design-system/tokens';
 *
 * const primaryColor = tokens.colors.brand.primary[500];
 * const spacing = tokens.spacing[4];
 * const shadow = tokens.shadows.box.lg;
 * ```
 */

// Import all token modules
export {
  colors,
  brandColors,
  semanticColors,
  stateColors,
  componentColors,
  gradients,
  withOpacity,
  themeColor,
} from './colors';
export type { BrandColor, SemanticColor, StateColor, ComponentColor, GradientName } from './colors';

export { default as spacing, semanticSpacing, gap, inset, stack } from './spacing';
export type { SpacingScale, SemanticSpacing, GapSize, InsetSize, StackSize } from './spacing';

export {
  typography,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textStyles,
} from './typography';
export type {
  FontFamily,
  FontSize,
  FontWeight,
  LineHeight,
  LetterSpacing,
  TextStyle,
} from './typography';

export { motion, duration, easing, transition, keyframes, animation, spring } from './motion';
export type { Duration, Easing, Transition, Keyframe, Animation, Spring } from './motion';

export { shadows, boxShadow, dropShadow, textShadow } from './shadows';
export type { BoxShadow, DropShadow, TextShadow } from './shadows';

export { default as zIndex } from './zIndex';
export type { ZIndex } from './zIndex';

export { radius, borderRadius, semanticRadius } from './radius';
export type { BorderRadius, SemanticRadius } from './radius';

// ============================================================================
// Unified Token Object
// ============================================================================

import { colors } from './colors';
import spacingTokens from './spacing';
import { typography } from './typography';
import { motion } from './motion';
import { shadows } from './shadows';
import zIndexTokens from './zIndex';
import { radius } from './radius';

/**
 * Complete design token system for TerraFusion OS.
 * Access all tokens through this unified object.
 */
export const tokens = {
  colors,
  spacing: spacingTokens.spacing,
  semantic: {
    spacing: spacingTokens.semantic,
    radius: radius.semantic,
  },
  gap: spacingTokens.gap,
  inset: spacingTokens.inset,
  stack: spacingTokens.stack,
  typography,
  motion,
  shadows,
  zIndex: zIndexTokens,
  radius: radius.borderRadius,
} as const;

// ============================================================================
// Default Export
// ============================================================================

export default tokens;
