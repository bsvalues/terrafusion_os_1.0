/**
 * TerraFusion cOS Design System - Brand Tokens
 * Government-grade design tokens for consistent UX across all applications and plugins
 * "Government. Transcended." - Professional, enterprise-grade government technology
 */

// Core TerraFusion Brand Colors
export const colors = {
  // Primary Government Colors
  primary: {
    blue: '#0099ff',           // TerraFusion primary blue
    blue_dark: '#0077cc',      // Dark variant for hover states
    blue_light: '#33aaff',     // Light variant for backgrounds
    blue_alpha: 'rgba(0, 153, 255, 0.1)', // Transparent variant
  },
  
  // Accent Colors
  accent: {
    green: '#00ffaa',          // TerraFusion accent green
    green_dark: '#00cc88',     // Dark variant
    green_light: '#33ffbb',    // Light variant
    green_alpha: 'rgba(0, 255, 170, 0.1)', // Transparent variant
  },
  
  // Tertiary Colors
  tertiary: {
    cyan: '#00ffee',           // TerraFusion tertiary cyan
    cyan_dark: '#00ccbb',      // Dark variant
    cyan_light: '#33fff1',     // Light variant
    cyan_alpha: 'rgba(0, 255, 238, 0.1)', // Transparent variant
  },
  
  // Semantic Colors
  semantic: {
    success: '#00ffaa',        // Success states (using accent green)
    warning: '#ffaa00',        // Warning states
    error: '#ff5555',          // Error states
    info: '#00ffee',           // Info states (using tertiary cyan)
  },
  
  // Neutral Colors (Government Grade)
  neutral: {
    white: '#ffffff',
    gray_50: '#f8fafc',        // Lightest gray
    gray_100: '#f1f5f9',
    gray_200: '#e2e8f0',
    gray_300: '#cbd5e1',
    gray_400: '#94a3b8',
    gray_500: '#64748b',       // Mid gray
    gray_600: '#475569',
    gray_700: '#334155',
    gray_800: '#1e293b',
    gray_900: '#0f172a',       // Darkest gray
    black: '#000000',
  },
  
  // Background Colors
  background: {
    primary: '#0f172a',        // Dark professional background
    secondary: '#1e293b',      // Secondary background
    tertiary: '#334155',       // Tertiary background
    glass: 'rgba(15, 23, 42, 0.8)', // Glassmorphism background
    overlay: 'rgba(0, 0, 0, 0.5)',  // Modal overlay
  },
  
  // Border Colors
  border: {
    primary: '#334155',
    secondary: '#475569',
    accent: '#0099ff',
    success: '#00ffaa',
    warning: '#ffaa00',
    error: '#ff5555',
  },
  
  // Text Colors
  text: {
    primary: '#ffffff',        // Primary text (white)
    secondary: '#cbd5e1',      // Secondary text
    tertiary: '#94a3b8',       // Tertiary text
    accent: '#00ffaa',         // Accent text
    muted: '#64748b',          // Muted text
    inverse: '#0f172a',        // Inverse text (for light backgrounds)
  }
};

// Typography Scale (Inter Font Family)
export const typography = {
  fontFamily: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, Consolas, monospace",
  },
  
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
  
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
  }
};

// Spacing Scale (8px base unit)
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem',       // 384px
};

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',    // 2px
  base: '0.25rem',   // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',
};

// Shadows (Government-grade depth)
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // TerraFusion branded glows
  glow_primary: '0 0 20px rgba(0, 153, 255, 0.3)',
  glow_accent: '0 0 20px rgba(0, 255, 170, 0.3)',
  glow_tertiary: '0 0 20px rgba(0, 255, 238, 0.3)',
};

// Z-Index Scale
export const zIndex = {
  hide: '-1',
  auto: 'auto',
  base: '0',
  docked: '10',
  dropdown: '1000',
  sticky: '1020',
  banner: '1030',
  overlay: '1040',
  modal: '1050',
  popover: '1060',
  skipLink: '1070',
  toast: '1080',
  tooltip: '1090',
};

// Animation & Transitions
export const animation = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    government: 'cubic-bezier(0.4, 0, 0.2, 1)', // Professional easing
  },
  
  keyframes: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    slideUp: {
      from: { transform: 'translateY(10px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    terraFusionGlow: {
      '0%, 100%': { boxShadow: '0 0 20px rgba(0, 153, 255, 0.3)' },
      '50%': { boxShadow: '0 0 30px rgba(0, 153, 255, 0.5)' },
    }
  }
};

// Breakpoints (Responsive Design)
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// TerraFusion Geometric Symbols
export const symbols = {
  diamond: '◊',      // Primary geometric symbol
  triangle: '∆',     // Secondary symbol
  hexagon: '⬢',      // Tertiary symbol
  wave: '≋',         // Flow/data symbol
  grid: '⟐',         // Structure/system symbol
  pentagon: '⬡',     // Security/compliance symbol
};

// Component-specific tokens
export const components = {
  button: {
    height: {
      sm: '2rem',      // 32px
      base: '2.5rem',  // 40px
      lg: '3rem',      // 48px
    },
    padding: {
      sm: '0.5rem 1rem',
      base: '0.75rem 1.5rem',
      lg: '1rem 2rem',
    }
  },
  
  input: {
    height: {
      sm: '2rem',
      base: '2.5rem',
      lg: '3rem',
    },
    padding: '0.75rem 1rem',
  },
  
  card: {
    padding: '1.5rem',
    borderRadius: borderRadius.lg,
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(51, 65, 85, 0.8)',
    backdrop: 'blur(10px)',
  },
  
  modal: {
    maxWidth: '32rem',
    padding: '2rem',
    borderRadius: borderRadius.xl,
    background: 'rgba(15, 23, 42, 0.95)',
    backdrop: 'blur(20px)',
  }
};

// Export complete design system
export const terraFusionDesignSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  animation,
  breakpoints,
  symbols,
  components,
  
  // Utility function to get CSS custom properties
  getCSSCustomProperties() {
    const cssVars = {};
    
    // Colors
    Object.entries(colors).forEach(([category, colorSet]) => {
      if (typeof colorSet === 'object') {
        Object.entries(colorSet).forEach(([name, value]) => {
          cssVars[`--tf-color-${category}-${name.replace('_', '-')}`] = value;
        });
      } else {
        cssVars[`--tf-color-${category}`] = colorSet;
      }
    });
    
    // Typography
    Object.entries(typography.fontSize).forEach(([size, value]) => {
      cssVars[`--tf-text-${size}`] = value;
    });
    
    // Spacing
    Object.entries(spacing).forEach(([size, value]) => {
      cssVars[`--tf-spacing-${size}`] = value;
    });
    
    return cssVars;
  },
  
  // Theme validation
  validateTheme(theme) {
    const requiredColors = ['primary', 'accent', 'neutral', 'semantic'];
    const hasRequiredColors = requiredColors.every(color => 
      theme.colors && theme.colors[color]
    );
    
    return {
      isValid: hasRequiredColors,
      errors: hasRequiredColors ? [] : ['Missing required color tokens']
    };
  }
};

export default terraFusionDesignSystem;