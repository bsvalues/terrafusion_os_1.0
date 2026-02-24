/**
 * TerraFusion Design System - Motion Tokens
 *
 * Animation and transition tokens for smooth, consistent motion design.
 *
 * @module design-system/tokens/motion
 */

// ============================================================================
// Duration
// ============================================================================

export const duration = {
  instant: '0ms',
  fast: '100ms',
  normal: '200ms',
  moderate: '300ms',
  slow: '400ms',
  slower: '500ms',
  slowest: '700ms',
} as const;

// ============================================================================
// Easing Functions
// ============================================================================

export const easing = {
  // Standard easing
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Custom cubic-bezier curves
  snappy: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  smooth: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',

  // Tailwind-style easings
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  emphasized: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  decelerated: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  accelerated: 'cubic-bezier(0.4, 0.0, 1, 1)',
} as const;

// ============================================================================
// Transition Presets
// ============================================================================

export const transition = {
  // Fast transitions (UI feedback)
  fast: {
    default: `all ${duration.fast} ${easing.snappy}`,
    opacity: `opacity ${duration.fast} ${easing.snappy}`,
    transform: `transform ${duration.fast} ${easing.snappy}`,
    colors: `background-color ${duration.fast} ${easing.snappy}, border-color ${duration.fast} ${easing.snappy}, color ${duration.fast} ${easing.snappy}`,
  },

  // Normal transitions (general UI)
  normal: {
    default: `all ${duration.normal} ${easing.standard}`,
    opacity: `opacity ${duration.normal} ${easing.standard}`,
    transform: `transform ${duration.normal} ${easing.standard}`,
    colors: `background-color ${duration.normal} ${easing.standard}, border-color ${duration.normal} ${easing.standard}, color ${duration.normal} ${easing.standard}`,
  },

  // Slow transitions (emphasis)
  slow: {
    default: `all ${duration.slow} ${easing.smooth}`,
    opacity: `opacity ${duration.slow} ${easing.smooth}`,
    transform: `transform ${duration.slow} ${easing.smooth}`,
    colors: `background-color ${duration.slow} ${easing.smooth}, border-color ${duration.slow} ${easing.smooth}, color ${duration.slow} ${easing.smooth}`,
  },
} as const;

// ============================================================================
// Animation Keyframes
// ============================================================================

export const keyframes = {
  // Fade animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },

  // Scale animations
  scaleIn: {
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  scaleOut: {
    from: { opacity: 1, transform: 'scale(1)' },
    to: { opacity: 0, transform: 'scale(0.95)' },
  },

  // Slide animations
  slideInUp: {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  slideInDown: {
    from: { opacity: 0, transform: 'translateY(-20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  slideInLeft: {
    from: { opacity: 0, transform: 'translateX(-20px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
  slideInRight: {
    from: { opacity: 0, transform: 'translateX(20px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },

  // Pulse animation
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },

  // Spin animation
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },

  // Bounce animation
  bounce: {
    '0%, 100%': {
      transform: 'translateY(-25%)',
      animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
    },
    '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
  },

  // Glow animation
  glow: {
    '0%, 100%': { boxShadow: '0 0 20px rgba(0, 153, 255, 0.5)' },
    '50%': { boxShadow: '0 0 40px rgba(0, 153, 255, 0.8)' },
  },

  // Shimmer animation (loading skeleton)
  shimmer: {
    '0%': { backgroundPosition: '-1000px 0' },
    '100%': { backgroundPosition: '1000px 0' },
  },
} as const;

// ============================================================================
// Animation Presets
// ============================================================================

export const animation = {
  // Fade
  fadeIn: `fadeIn ${duration.normal} ${easing.standard}`,
  fadeOut: `fadeOut ${duration.normal} ${easing.standard}`,

  // Scale
  scaleIn: `scaleIn ${duration.normal} ${easing.standard}`,
  scaleOut: `scaleOut ${duration.normal} ${easing.standard}`,

  // Slide
  slideInUp: `slideInUp ${duration.normal} ${easing.standard}`,
  slideInDown: `slideInDown ${duration.normal} ${easing.standard}`,
  slideInLeft: `slideInLeft ${duration.normal} ${easing.standard}`,
  slideInRight: `slideInRight ${duration.normal} ${easing.standard}`,

  // Continuous
  pulse: `pulse ${duration.slower} ${easing.ease} infinite`,
  spin: `spin 1s ${easing.linear} infinite`,
  bounce: `bounce 1s ${easing.ease} infinite`,
  glow: `glow 2s ${easing.ease} infinite`,
  shimmer: `shimmer 2s ${easing.linear} infinite`,
} as const;

// ============================================================================
// Spring Animations (for Framer Motion)
// ============================================================================

export const spring = {
  // Gentle spring
  gentle: {
    type: 'spring',
    stiffness: 100,
    damping: 15,
  },

  // Bouncy spring
  bouncy: {
    type: 'spring',
    stiffness: 300,
    damping: 20,
  },

  // Snappy spring
  snappy: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  },

  // Smooth spring
  smooth: {
    type: 'spring',
    stiffness: 200,
    damping: 25,
  },
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type Duration = keyof typeof duration;
export type Easing = keyof typeof easing;
export type Transition = keyof typeof transition;
export type Keyframe = keyof typeof keyframes;
export type Animation = keyof typeof animation;
export type Spring = keyof typeof spring;

// ============================================================================
// Default Export
// ============================================================================

export const motion = {
  duration,
  easing,
  transition,
  keyframes,
  animation,
  spring,
} as const;

export default motion;
