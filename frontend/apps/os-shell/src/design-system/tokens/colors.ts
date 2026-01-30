/**
 * TerraFusion Design System - Color Tokens
 *
 * Comprehensive color token system following MIT/PhD-level design principles.
 * Provides type-safe, semantic color tokens for the entire application.
 *
 * @module design-system/tokens/colors
 * @see docs/guides/FRONTEND_EXCELLENCE_IMPLEMENTATION_PLAN.md
 */

// ============================================================================
// Brand Colors - Core TerraFusion Identity
// ============================================================================

export const brandColors = {
  // Primary Brand Color - TerraFusion Blue
  primary: {
    50: '#e6f5ff',
    100: '#b3e0ff',
    200: '#80ccff',
    300: '#4db8ff',
    400: '#1aa3ff',
    500: 'var(--tf-network-blue)', // Main brand color
    600: '#007acc',
    700: '#005c99',
    800: '#003d66',
    900: '#001f33',
  },

  // Transcend Color - Premium Tier
  transcend: {
    50: '#e6fffd',
    100: '#b3fff9',
    200: '#80fff6',
    300: '#4dfff2',
    400: '#1affef',
    500: 'var(--tf-transcend-highlight)', // Transcend accent
    600: '#00ccbe',
    700: '#00998f',
    800: '#00665f',
    900: '#003330',
  },

  // Accent Color - Success/Growth
  accent: {
    50: '#e6fff7',
    100: '#b3ffe8',
    200: '#80ffd9',
    300: '#4dffca',
    400: '#1affbb',
    500: 'var(--tf-accent-success)', // Accent green
    600: 'var(--tf-transcend-cyan)',
    700: '#009966',
    800: '#006644',
    900: '#003322',
  },

  // Quantum Cyan - Pure Electric
  quantum: {
    500: 'var(--tf-transcend-cyan)',
  },
} as const;

// ============================================================================
// Semantic Colors - Context-based Colors
// ============================================================================

export const semanticColors = {
  // Text Colors
  text: {
    primary: 'var(--tf-text-primary)fff', // Primary text (white)
    secondary: '#b3b3b3', // Secondary text (gray)
    tertiary: '#808080', // Tertiary text (darker gray)
    disabled: '#4d4d4d', // Disabled text
    inverse: 'var(--tf-bg-void)', // Inverse text (on light backgrounds)
    link: 'var(--tf-network-blue)', // Links (brand primary)
    linkHover: '#1aa3ff', // Link hover state
  },

  // Background Colors
  background: {
    primary: 'var(--tf-bg-void)', // Primary background (black)
    secondary: '#0a0a0a', // Secondary background (near-black)
    tertiary: '#1a1a1a', // Tertiary background (dark gray)
    void: 'var(--tf-bg-void)', // Terra Midnight
    elevated: '#2a2a2a', // Elevated surfaces
    overlay: 'rgba(0, 0, 0, 0.8)', // Modal/overlay background
    glass: 'rgba(0, 0, 0, 0.6)', // Glass morphism effect
  },

  // Border Colors
  border: {
    default: 'var(--tf-bg-surface)333', // Default border
    subtle: '#1a1a1a', // Subtle border
    strong: '#4d4d4d', // Strong border
    interactive: 'var(--tf-network-blue)', // Interactive border (brand primary)
    focus: 'var(--tf-transcend-highlight)', // Focus ring (transcend)
  },

  // Surface Colors
  surface: {
    default: '#0a0a0a', // Default surface
    elevated: '#1a1a1a', // Elevated surface
    sunken: 'var(--tf-bg-void)', // Sunken surface
    interactive: '#2a2a2a', // Interactive surface
    hover: 'var(--tf-bg-surface)333', // Hover state
    active: '#3d3d3d', // Active/pressed state
  },
} as const;

// ============================================================================
// State Colors - Feedback & Status
// ============================================================================

export const stateColors = {
  // Success States
  success: {
    50: '#e6fff7',
    100: '#b3ffe8',
    200: '#80ffd9',
    300: '#4dffca',
    400: '#1affbb',
    500: 'var(--tf-accent-success)', // Primary success
    600: 'var(--tf-transcend-cyan)',
    700: '#009966',
    800: '#006644',
    900: '#003322',
    text: 'var(--tf-accent-success)',
    background: 'rgba(0, 255, 170, 0.1)',
    border: 'rgba(0, 255, 170, 0.3)',
  },

  // Error States
  error: {
    50: '#ffe6e6',
    100: '#ffb3b3',
    200: '#ff8080',
    300: '#ff4d4d',
    400: '#ff1a1a',
    500: 'var(--tf-error-red)', // Primary error
    600: '#cc0000',
    700: '#990000',
    800: '#660000',
    900: '#330000',
    text: '#ff4d4d',
    background: 'rgba(255, 0, 0, 0.1)',
    border: 'rgba(255, 0, 0, 0.3)',
  },

  // Warning States
  warning: {
    50: 'var(--tf-text-primary)9e6',
    100: '#ffecb3',
    200: '#ffe080',
    300: '#ffd34d',
    400: '#ffc61a',
    500: '#ffb900', // Primary warning
    600: '#cc9400',
    700: '#996f00',
    800: '#664a00',
    900: '#332500',
    text: '#ffb900',
    background: 'rgba(255, 185, 0, 0.1)',
    border: 'rgba(255, 185, 0, 0.3)',
  },

  // Info States
  info: {
    50: '#e6f5ff',
    100: '#b3e0ff',
    200: '#80ccff',
    300: '#4db8ff',
    400: '#1aa3ff',
    500: 'var(--tf-network-blue)', // Primary info (brand primary)
    600: '#007acc',
    700: '#005c99',
    800: '#003d66',
    900: '#001f33',
    text: 'var(--tf-network-blue)',
    background: 'rgba(0, 153, 255, 0.1)',
    border: 'rgba(0, 153, 255, 0.3)',
  },
} as const;

// ============================================================================
// Component-Specific Colors
// ============================================================================

export const componentColors = {
  // Button Colors
  button: {
    primary: {
      background: brandColors.primary[500],
      hover: brandColors.primary[400],
      active: brandColors.primary[600],
      disabled: '#4d4d4d',
      text: 'var(--tf-text-primary)fff',
    },
    secondary: {
      background: 'transparent',
      hover: 'rgba(0, 153, 255, 0.1)',
      active: 'rgba(0, 153, 255, 0.2)',
      disabled: 'transparent',
      text: brandColors.primary[500],
      border: brandColors.primary[500],
    },
    ghost: {
      background: 'transparent',
      hover: 'rgba(255, 255, 255, 0.05)',
      active: 'rgba(255, 255, 255, 0.1)',
      text: 'var(--tf-text-primary)fff',
    },
    danger: {
      background: stateColors.error[500],
      hover: stateColors.error[400],
      active: stateColors.error[600],
      text: 'var(--tf-text-primary)fff',
    },
  },

  // Input Colors
  input: {
    background: '#0a0a0a',
    border: 'var(--tf-bg-surface)333',
    borderFocus: brandColors.primary[500],
    placeholder: '#808080',
    text: 'var(--tf-text-primary)fff',
    disabled: {
      background: '#1a1a1a',
      border: '#1a1a1a',
      text: '#4d4d4d',
    },
  },

  // Card Colors
  card: {
    background: '#0a0a0a',
    border: 'var(--tf-bg-surface)333',
    hover: '#1a1a1a',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },

  // Navigation Colors
  navigation: {
    background: 'var(--tf-bg-void)',
    border: '#1a1a1a',
    active: brandColors.primary[500],
    hover: '#1a1a1a',
    text: 'var(--tf-text-primary)fff',
    textSecondary: '#b3b3b3',
  },

  // Modal/Dialog Colors
  modal: {
    background: '#0a0a0a',
    overlay: 'rgba(0, 0, 0, 0.8)',
    border: 'var(--tf-bg-surface)333',
  },

  // Badge Colors
  badge: {
    primary: {
      background: brandColors.primary[500],
      text: 'var(--tf-text-primary)fff',
    },
    secondary: {
      background: 'var(--tf-bg-surface)333',
      text: 'var(--tf-text-primary)fff',
    },
    success: {
      background: stateColors.success[500],
      text: 'var(--tf-bg-void)',
    },
    error: {
      background: stateColors.error[500],
      text: 'var(--tf-text-primary)fff',
    },
    warning: {
      background: stateColors.warning[500],
      text: 'var(--tf-bg-void)',
    },
  },
} as const;

// ============================================================================
// Visualization Colors
// ============================================================================

export const visualizationColors = {
  chart: [
    brandColors.transcend[500],
    brandColors.primary[500],
    '#8B5CF6', // Purple
    stateColors.warning[500],
    stateColors.error[500],
    stateColors.success[500],
    '#F97316', // Orange
    '#6366F1', // Indigo
  ],
  sparkline: {
    latency: brandColors.transcend[500],
    throughput: stateColors.success[500],
    error: stateColors.error[300], // lighter red
  },
} as const;

// ============================================================================
// Gradient Definitions
// ============================================================================

export const gradients = {
  primary: 'linear-gradient(135deg, var(--tf-network-blue) 0%, var(--tf-transcend-highlight) 100%)',
  transcend: 'linear-gradient(135deg, var(--tf-transcend-highlight) 0%, var(--tf-accent-success) 100%)',
  dark: 'linear-gradient(180deg, var(--tf-bg-void) 0%, #0a0a0a 100%)',
  void: 'linear-gradient(135deg, var(--tf-void-black) 0%, var(--tf-surface-darker) 100%)', // Terra Midnight
  glow: 'radial-gradient(circle, rgba(0, 153, 255, 0.3) 0%, rgba(0, 153, 255, 0) 70%)',
  mesh: `
    radial-gradient(at 40% 20%, rgba(0, 153, 255, 0.3) 0px, transparent 50%),
    radial-gradient(at 80% 0%, rgba(0, 255, 238, 0.2) 0px, transparent 50%),
    radial-gradient(at 0% 50%, rgba(0, 255, 170, 0.2) 0px, transparent 50%)
  `,
} as const;

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Get color with opacity
 * @param color - Hex color string
 * @param opacity - Opacity value (0-1)
 * @returns RGBA color string
 */
export function withOpacity(color: string, opacity: number): string {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get color for dark/light mode
 * @param darkColor - Color for dark mode
 * @param lightColor - Color for light mode (optional)
 * @returns Color based on current theme
 */
export function themeColor(darkColor: string, lightColor?: string): string {
  // For now, TerraFusion uses dark mode only
  // This function is future-proofed for potential light mode support
  return darkColor;
}

// ============================================================================
// Type Exports
// ============================================================================

export type BrandColor = keyof typeof brandColors;
export type SemanticColor = keyof typeof semanticColors;
export type StateColor = keyof typeof stateColors;
export type ComponentColor = keyof typeof componentColors;
export type GradientName = keyof typeof gradients;

// ============================================================================
// Default Export - All Colors
// ============================================================================

export const colors = {
  brand: brandColors,
  semantic: semanticColors,
  state: stateColors,
  component: componentColors,
  visualization: visualizationColors,
  gradient: gradients,
  utils: {
    withOpacity,
    themeColor,
  },
} as const;

export default colors;
