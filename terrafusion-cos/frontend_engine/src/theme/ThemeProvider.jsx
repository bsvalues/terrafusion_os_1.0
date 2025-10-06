/**
 * TerraFusion cOS - Design System Theme Provider
 * Canonical design token integration at ENGINE level
 * 
 * @architecture This is the SINGLE SOURCE OF TRUTH for all TerraFusion theming
 * All components MUST consume this provider, not hardcode colors
 */

import React, { createContext, useContext } from 'react';

// Import canonical design tokens from design-sync
import designTokens from '../../../../design/tokens.json';

const ThemeContext = createContext(null);

/**
 * Convert design tokens to CSS-in-JS format
 * Enables both CSS variables AND programmatic access
 */
const createTheme = (tokens) => {
  return {
    colors: {
      // Primary brand colors
      trustBlue: tokens.colors['trust-blue'],
      transcendCyan: tokens.colors['transcend-cyan'],
      successGreen: tokens.colors['success-green'],
      deepSpace: tokens.colors['deep-space'],
      midnight: tokens.colors['midnight'],
      alertRed: tokens.colors['alert-red'],
      cautionAmber: tokens.colors['caution-amber'],
      clarityLight: tokens.colors['clarity-light'],
      white: tokens.colors['white'],
    },
    
    gradients: {
      clarity: tokens.gradients.clarity.value,
      transcendence: tokens.gradients.transcendence.value,
      darkBg: tokens.gradients['dark-bg'].value,
    },
    
    typography: {
      fontFamily: tokens.typography.fontFamily,
      scale: {
        xs: tokens.typography.scale.xs,
        sm: tokens.typography.scale.sm,
        base: tokens.typography.scale.base,
        lg: tokens.typography.scale.lg,
        xl: tokens.typography.scale.xl,
        '2xl': tokens.typography.scale['2xl'],
        '3xl': tokens.typography.scale['3xl'],
        '4xl': tokens.typography.scale['4xl'],
      },
    },
    
    spacing: {
      xs: tokens.spacing.xs,
      sm: tokens.spacing.sm,
      md: tokens.spacing.md,
      lg: tokens.spacing.lg,
      xl: tokens.spacing.xl,
      '2xl': tokens.spacing['2xl'],
    },
    
    borderRadius: {
      sm: tokens.borderRadius.sm,
      md: tokens.borderRadius.md,
      lg: tokens.borderRadius.lg,
      full: tokens.borderRadius.full,
    },
    
    effects: {
      blur: {
        glass: tokens.effects.blur.glass,
        heavy: tokens.effects.blur.heavy,
      },
      glow: {
        transcend: {
          radius: tokens.effects.glow.transcend.radius,
          intensity: tokens.effects.glow.transcend.intensity,
        },
        clarity: {
          radius: tokens.effects.glow.clarity.radius,
          intensity: tokens.effects.glow.clarity.intensity,
        },
      },
      shadow: {
        card: tokens.effects.shadow.card,
        float: tokens.effects.shadow.float,
      },
    },
    
    motion: {
      easing: {
        standard: tokens.motion.easing.standard,
        emphasized: tokens.motion.easing.emphasized,
      },
      duration: {
        quick: tokens.motion.duration.quick,
        standard: tokens.motion.duration.standard,
        deliberate: tokens.motion.duration.deliberate,
      },
    },
    
    animations: tokens.animations,
  };
};

/**
 * ThemeProvider Component
 * Wraps entire application to provide design token access
 */
export const ThemeProvider = ({ children }) => {
  const theme = createTheme(designTokens);
  
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useTheme Hook
 * Access design tokens in any component
 * 
 * @example
 * const theme = useTheme();
 * <div style={{ color: theme.colors.transcendCyan }}>
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

/**
 * Utility: Generate CSS custom properties from theme
 * For use in global stylesheet injection
 */
export const generateCSSVariables = (theme) => {
  return `
    :root {
      /* TerraFusion Official Brand Colors - Canonical Design Tokens */
      --trust-blue: ${theme.colors.trustBlue};
      --transcend-cyan: ${theme.colors.transcendCyan};
      --success-green: ${theme.colors.successGreen};
      --deep-space: ${theme.colors.deepSpace};
      --midnight: ${theme.colors.midnight};
      --alert-red: ${theme.colors.alertRed};
      --caution-amber: ${theme.colors.cautionAmber};
      --clarity-light: ${theme.colors.clarityLight};
      --white: ${theme.colors.white};
      
      /* Gradients */
      --gradient-clarity: ${theme.gradients.clarity};
      --gradient-transcendence: ${theme.gradients.transcendence};
      --gradient-dark-bg: ${theme.gradients.darkBg};
      
      /* Typography */
      --font-family: ${theme.typography.fontFamily};
      
      /* Spacing */
      --spacing-xs: ${theme.spacing.xs};
      --spacing-sm: ${theme.spacing.sm};
      --spacing-md: ${theme.spacing.md};
      --spacing-lg: ${theme.spacing.lg};
      --spacing-xl: ${theme.spacing.xl};
      --spacing-2xl: ${theme.spacing['2xl']};
      
      /* Border Radius */
      --radius-sm: ${theme.borderRadius.sm};
      --radius-md: ${theme.borderRadius.md};
      --radius-lg: ${theme.borderRadius.lg};
      --radius-full: ${theme.borderRadius.full};
      
      /* Effects */
      --blur-glass: ${theme.effects.blur.glass};
      --glow-transcend-radius: ${theme.effects.glow.transcend.radius};
      --glow-transcend-intensity: ${theme.effects.glow.transcend.intensity};
      --shadow-card: ${theme.effects.shadow.card};
      
      /* Motion */
      --easing-standard: ${theme.motion.easing.standard};
      --duration-standard: ${theme.motion.duration.standard};
    }
  `;
};

export default ThemeProvider;
