/**
 * TerraFusion OS Brand Theme System
 * Official brand colors, typography, and design tokens
 * Source: Brand_Assets/tf-brand-config.json
 */

export interface TerraFusionTheme {
  brand: {
    name: string;
    essence: string;
    tagline: string;
    slogan: string;
    motto: string;
    promise: string;
  };
  colors: {
    primary: string;
    primaryDark: string;
    accent: string;
    accentDark: string;
    transcend: string;
    dark: string;
    darkLighter: string;
    light: string;
    gray: string;
    grayLight: string;
    error: string;
    success: string;
    warning: string;
    clarity: string;
  };
  typography: {
    fontFamily: string;
    sizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
      '5xl': string;
    };
    weights: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
      extrabold: number;
      black: number;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    full: string;
  };
  shadows: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    transcend: string;
  };
}

export const terraFusionTheme: TerraFusionTheme = {
  brand: {
    name: "Terrafusion OS",
    essence: "Government. Transcended.",
    tagline: "Government. Transcended.",
    slogan: "Turn Complexity into Clarity.",
    motto: "We do it right the first time.",
    promise: "Every user, every action, every day: simplicity, mastery, and confidence—delivered without compromise."
  },
  colors: {
    primary: "#0099ff",
    primaryDark: "#0077cc",
    accent: "#00ffaa",
    accentDark: "#00cc88",
    transcend: "#00ffee",
    dark: "#0b1020",
    darkLighter: "#1a1f3a",
    light: "#ffffff",
    gray: "#888888",
    grayLight: "#cccccc",
    error: "#ff3333",
    success: "#00ff88",
    warning: "#ffaa00",
    clarity: "#e0f7ff"
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      '2xl': "1.5rem",
      '3xl': "1.875rem",
      '4xl': "2.25rem",
      '5xl': "3rem"
    },
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900
    }
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    '2xl': "3rem",
    '3xl': "4rem",
    '4xl': "6rem",
    '5xl': "8rem"
  },
  borderRadius: {
    none: "0",
    sm: "0.125rem",
    base: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    '2xl': "1rem",
    full: "9999px"
  },
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    '2xl': "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    transcend: "0 0 30px rgba(0, 255, 238, 0.3), 0 0 60px rgba(0, 153, 255, 0.2)"
  }
};

// CSS Custom Properties Generator
export const generateCSSVariables = (theme: TerraFusionTheme): string => {
  return `
    :root {
      /* Colors */
      --tf-color-primary: ${theme.colors.primary};
      --tf-color-primary-dark: ${theme.colors.primaryDark};
      --tf-color-accent: ${theme.colors.accent};
      --tf-color-accent-dark: ${theme.colors.accentDark};
      --tf-color-transcend: ${theme.colors.transcend};
      --tf-color-dark: ${theme.colors.dark};
      --tf-color-dark-lighter: ${theme.colors.darkLighter};
      --tf-color-light: ${theme.colors.light};
      --tf-color-gray: ${theme.colors.gray};
      --tf-color-gray-light: ${theme.colors.grayLight};
      --tf-color-error: ${theme.colors.error};
      --tf-color-success: ${theme.colors.success};
      --tf-color-warning: ${theme.colors.warning};
      --tf-color-clarity: ${theme.colors.clarity};
      
      /* Typography */
      --tf-font-family: ${theme.typography.fontFamily};
      
      /* Spacing */
      --tf-spacing-xs: ${theme.spacing.xs};
      --tf-spacing-sm: ${theme.spacing.sm};
      --tf-spacing-md: ${theme.spacing.md};
      --tf-spacing-lg: ${theme.spacing.lg};
      --tf-spacing-xl: ${theme.spacing.xl};
      --tf-spacing-2xl: ${theme.spacing['2xl']};
      --tf-spacing-3xl: ${theme.spacing['3xl']};
      --tf-spacing-4xl: ${theme.spacing['4xl']};
      --tf-spacing-5xl: ${theme.spacing['5xl']};
      
      /* Border Radius */
      --tf-radius-sm: ${theme.borderRadius.sm};
      --tf-radius-base: ${theme.borderRadius.base};
      --tf-radius-md: ${theme.borderRadius.md};
      --tf-radius-lg: ${theme.borderRadius.lg};
      --tf-radius-xl: ${theme.borderRadius.xl};
      --tf-radius-2xl: ${theme.borderRadius['2xl']};
      --tf-radius-full: ${theme.borderRadius.full};
      
      /* Shadows */
      --tf-shadow-sm: ${theme.shadows.sm};
      --tf-shadow-base: ${theme.shadows.base};
      --tf-shadow-md: ${theme.shadows.md};
      --tf-shadow-lg: ${theme.shadows.lg};
      --tf-shadow-xl: ${theme.shadows.xl};
      --tf-shadow-2xl: ${theme.shadows['2xl']};
      --tf-shadow-transcend: ${theme.shadows.transcend};
    }
  `;
};

export default terraFusionTheme;