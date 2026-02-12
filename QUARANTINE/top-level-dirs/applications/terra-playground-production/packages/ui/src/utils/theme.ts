/**
 * Theme configuration and utilities
 */

import { themeColors } from './colors';

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  fontFamily: string;
  darkMode: boolean;
}

// Default theme configuration
export const defaultTheme: ThemeConfig = {
  primaryColor: themeColors.primary[500],
  secondaryColor: themeColors.secondary[500],
  backgroundColor: '#ffffff',
  textColor: themeColors.neutral[900],
  borderRadius: '4px',
  fontFamily: 'Inter, system-ui, sans-serif',
  darkMode: false,
};

// Dark theme configuration
export const darkTheme: ThemeConfig = {
  ...defaultTheme,
  backgroundColor: themeColors.neutral[900],
  textColor: themeColors.neutral[100],
  darkMode: true,
};

// Function to create custom theme
export function createTheme(options: Partial<ThemeConfig>): ThemeConfig {
  return {
    ...defaultTheme,
    ...options,
  };
}

// CSS Variables generator
export function generateCssVariables(theme: ThemeConfig): Record<string, string> {
  return {
    '--primary-color': theme.primaryColor,
    '--secondary-color': theme.secondaryColor,
    '--background-color': theme.backgroundColor,
    '--text-color': theme.textColor,
    '--border-radius': theme.borderRadius,
    '--font-family': theme.fontFamily,
  };
}

// Generate CSS custom properties string
export function themeToCssVariables(theme: ThemeConfig): string {
  const variables = generateCssVariables(theme);
  return Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');
}

// Interface for theme context
export interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  toggleDarkMode: () => void;
}
