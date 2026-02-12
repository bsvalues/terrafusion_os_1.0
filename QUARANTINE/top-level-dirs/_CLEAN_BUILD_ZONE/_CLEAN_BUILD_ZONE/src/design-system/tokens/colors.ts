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
    500: '#0099ff', // Main brand color
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
    500: '#00ffee', // Transcend accent
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
    500: '#00ffaa', // Accent green
    600: '#00cc88',
    700: '#009966',
    800: '#006644',
    900: '#003322',
  },
} as const;

// ============================================================================
// Semantic Colors - Context-based Colors
// ============================================================================

export const semanticColors = {
  // Text Colors
  text: {
    primary: '#ffffff',        // Primary text (white)
    secondary: '#b3b3b3',      // Secondary text (gray)
    tertiary: '#808080',       // Tertiary text (darker gray)
    disabled: '#4d4d4d',       // Disabled text
    inverse: '#000000',        // Inverse text (on light backgrounds)
    link: '#0099ff',           // Links (brand primary)
    linkHover: '#1aa3ff',      // Link hover state
  },
  
  // Background Colors
  background: {
    primary: '#000000',        // Primary background (black)
    secondary: '#0a0a0a',      // Secondary background (near-black)
    tertiary: '#1a1a1a',       // Tertiary background (dark gray)
    elevated: '#2a2a2a',       // Elevated surfaces
    overlay: 'rgba(0, 0, 0, 0.8)', // Modal/overlay background
    glass: 'rgba(0, 0, 0, 0.6)',   // Glass morphism effect
  },
  
  // Border Colors
  border: {
    default: '#333333',        // Default border
    subtle: '#1a1a1a',         // Subtle border
    strong: '#4d4d4d',         // Strong border
    interactive: '#0099ff',    // Interactive border (brand primary)
    focus: '#00ffee',          // Focus ring (transcend)
  },
  
  // Surface Colors
  surface: {
    default: '#0a0a0a',        // Default surface
    elevated: '#1a1a1a',       // Elevated surface
    sunken: '#000000',         // Sunken surface
    interactive: '#2a2a2a',    // Interactive surface
    hover: '#333333',          // Hover state
    active: '#3d3d3d',         // Active/pressed state
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
    500: '#00ffaa',  // Primary success
    600: '#00cc88',
    700: '#009966',
    800: '#006644',
    900: '#003322',
    text: '#00ffaa',
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
    500: '#ff0000',  // Primary error
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
    50: '#fff9e6',
    100: '#ffecb3',
    200: '#ffe080',
    300: '#ffd34d',
    400: '#ffc61a',
    500: '#ffb900',  // Primary warning
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
    500: '#0099ff',  // Primary info (brand primary)
    600: '#007acc',
    700: '#005c99',
    800: '#003d66',
    900: '#001f33',
    text: '#0099ff',
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
      text: '#ffffff',
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
      text: '#ffffff',
    },
    danger: {
      background: stateColors.error[500],
      hover: stateColors.error[400],
      active: stateColors.error[600],
      text: '#ffffff',
    },
  },
  
  // Input Colors
  input: {
    background: '#0a0a0a',
    border: '#333333',
    borderFocus: brandColors.primary[500],
    placeholder: '#808080',
    text: '#ffffff',
    disabled: {
      background: '#1a1a1a',
      border: '#1a1a1a',
      text: '#4d4d4d',
    },
  },
  
  // Card Colors
  card: {
    background: '#0a0a0a',
    border: '#333333',
    hover: '#1a1a1a',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Navigation Colors
  navigation: {
    background: '#000000',
    border: '#1a1a1a',
    active: brandColors.primary[500],
    hover: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#b3b3b3',
  },
  
  // Modal/Dialog Colors
  modal: {
    background: '#0a0a0a',
    overlay: 'rgba(0, 0, 0, 0.8)',
    border: '#333333',
  },
  
  // Badge Colors
  badge: {
    primary: {
      background: brandColors.primary[500],
      text: '#ffffff',
    },
    secondary: {
      background: '#333333',
      text: '#ffffff',
    },
    success: {
      background: stateColors.success[500],
      text: '#000000',
    },
    error: {
      background: stateColors.error[500],
      text: '#ffffff',
    },
    warning: {
      background: stateColors.warning[500],
      text: '#000000',
    },
  },
} as const;

// ============================================================================
// Gradient Definitions
// ============================================================================

export const gradients = {
  primary: 'linear-gradient(135deg, #0099ff 0%, #00ffee 100%)',
  transcend: 'linear-gradient(135deg, #00ffee 0%, #00ffaa 100%)',
  dark: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',
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
  gradient: gradients,
  utils: {
    withOpacity,
    themeColor,
  },
} as const;

export default colors;
