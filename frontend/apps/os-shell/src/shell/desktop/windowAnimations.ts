/**
 * TerraFusion OS Window Animations
 *
 * Framer Motion animation variants for window lifecycle events:
 * - Open: Scale up from 0.8 → 1.0 + fade in
 * - Close: Scale down 1.0 → 0.8 + fade out
 * - Minimize: Scale down + slide toward taskbar
 * - Restore: Scale up from taskbar position
 * - Focus: Subtle pulse/glow
 *
 * @module shell/desktop/windowAnimations
 */

import { Transition, Variants } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

export type WindowAnimationState =
  | 'opening'
  | 'open'
  | 'closing'
  | 'minimizing'
  | 'restoring'
  | 'focused';

export interface WindowAnimationConfig {
  /** Initial state when window first appears */
  initial: string;
  /** Target state after animation completes */
  animate: string;
  /** State when window is removed */
  exit: string;
  /** Animation timing configuration */
  transition: Transition;
}

// ============================================================================
// Animation Timing
// ============================================================================

/**
 * Government-grade smooth timing (championship excellence)
 */
export const WINDOW_ANIMATION_TIMING = {
  /** Standard window open/close */
  standard: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  },

  /** Quick minimize/restore */
  quick: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 35,
    mass: 0.6,
  },

  /** Subtle focus effect */
  subtle: {
    duration: 0.2,
    ease: 'easeInOut' as const,
  },
} as const;

// ============================================================================
// Animation Variants
// ============================================================================

/**
 * Window Open Animation
 * Scale up from 0.8 → 1.0 + fade in (0 → 1)
 */
export const windowOpenVariants: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0,
    y: 20, // Slight drop-in effect
  },
  open: {
    scale: 1,
    opacity: 1,
    y: 0,
  },
};

/**
 * Window Close Animation
 * Scale down 1.0 → 0.8 + fade out (1 → 0)
 */
export const windowCloseVariants: Variants = {
  open: {
    scale: 1,
    opacity: 1,
    y: 0,
  },
  closing: {
    scale: 0.8,
    opacity: 0,
    y: 20, // Slight drop-out effect
  },
};

/**
 * Window Minimize Animation
 * Scale down + slide toward taskbar (bottom-center)
 */
export const windowMinimizeVariants: Variants = {
  open: {
    scale: 1,
    opacity: 1,
    x: 0,
    y: 0,
  },
  minimizing: {
    scale: 0.1,
    opacity: 0,
    // Slide to bottom-center (taskbar position)
    // Note: x/y are relative to current position
    y: 500, // Slide down
    x: 0, // Stay centered horizontally
  },
};

/**
 * Window Restore Animation
 * Scale up from taskbar position (inverse of minimize)
 */
export const windowRestoreVariants: Variants = {
  minimizing: {
    scale: 0.1,
    opacity: 0,
    y: 500,
    x: 0,
  },
  restoring: {
    scale: 1,
    opacity: 1,
    y: 0,
    x: 0,
  },
};

/**
 * Window Focus Animation
 * Subtle pulse/glow effect when window gains focus
 */
export const windowFocusVariants: Variants = {
  unfocused: {
    scale: 1,
    boxShadow: '0 8px 32px hsl(var(--tf-bg) / 0.4)',
  },
  focused: {
    scale: 1,
    boxShadow: [
      '0 8px 32px hsl(var(--tf-bg) / 0.4)',
      '0 0 30px hsl(var(--tf-accent) / 0.2), 0 8px 32px hsl(var(--tf-bg) / 0.5)',
      '0 0 30px hsl(var(--tf-accent) / 0.2), 0 8px 32px hsl(var(--tf-bg) / 0.5)',
    ],
  },
};

/**
 * Combined animation variants for all window states
 */
export const windowVariants: Variants = {
  // Initial state (hidden)
  initial: windowOpenVariants.initial,

  // Open/active state
  open: windowOpenVariants.open,

  // Closing state
  closing: windowCloseVariants.closing,

  // Minimizing state
  minimizing: windowMinimizeVariants.minimizing,

  // Restoring state
  restoring: windowRestoreVariants.restoring,

  // Focus states
  unfocused: windowFocusVariants.unfocused,
  focused: windowFocusVariants.focused,
};

// ============================================================================
// Animation Configs
// ============================================================================

/**
 * Window Open Animation Config
 */
export const openAnimationConfig: WindowAnimationConfig = {
  initial: 'initial',
  animate: 'open',
  exit: 'closing',
  transition: WINDOW_ANIMATION_TIMING.standard,
};

/**
 * Window Close Animation Config
 */
export const closeAnimationConfig: WindowAnimationConfig = {
  initial: 'open',
  animate: 'closing',
  exit: 'closing',
  transition: WINDOW_ANIMATION_TIMING.standard,
};

/**
 * Window Minimize Animation Config
 */
export const minimizeAnimationConfig: WindowAnimationConfig = {
  initial: 'open',
  animate: 'minimizing',
  exit: 'minimizing',
  transition: WINDOW_ANIMATION_TIMING.quick,
};

/**
 * Window Restore Animation Config
 */
export const restoreAnimationConfig: WindowAnimationConfig = {
  initial: 'minimizing',
  animate: 'restoring',
  exit: 'open',
  transition: WINDOW_ANIMATION_TIMING.quick,
};

/**
 * Window Focus Animation Config
 */
export const focusAnimationConfig: WindowAnimationConfig = {
  initial: 'unfocused',
  animate: 'focused',
  exit: 'unfocused',
  transition: WINDOW_ANIMATION_TIMING.subtle,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get animation config for window state
 */
export function getAnimationConfigForState(
  state: 'normal' | 'minimized' | 'maximized',
  isOpening: boolean,
  isClosing: boolean,
  isMinimizing: boolean,
  isRestoring: boolean
): WindowAnimationConfig {
  if (isOpening) return openAnimationConfig;
  if (isClosing) return closeAnimationConfig;
  if (isMinimizing) return minimizeAnimationConfig;
  if (isRestoring) return restoreAnimationConfig;

  // Default to open state
  return openAnimationConfig;
}

/**
 * Get animation variant for window state
 */
export function getAnimationVariantForState(
  state: 'normal' | 'minimized' | 'maximized',
  isActive: boolean,
  isOpening: boolean,
  isClosing: boolean,
  isMinimizing: boolean,
  isRestoring: boolean
): string {
  if (isOpening) return 'initial';
  if (isClosing) return 'closing';
  if (isMinimizing) return 'minimizing';
  if (isRestoring) return 'restoring';
  if (isActive) return 'focused';

  // Default to open/unfocused
  return isActive ? 'focused' : 'unfocused';
}
