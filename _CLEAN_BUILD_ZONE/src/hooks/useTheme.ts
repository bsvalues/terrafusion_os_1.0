/**
 * useTheme Hook
 *
 * Provides access to TerraFusion design system theme with quantum-themed tokens.
 * Supports theme switching, dark mode, and design token access.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// TerraFusion Design Tokens
export interface TerraFusionTheme {
  colors: {
    // Core Colors
    terraCyan: string;
    terraMidnight: string;
    terraBlue: string;
    terraSlate: string;
    terraTranscend: string;

    // Semantic Colors
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;

    // Status Colors
    success: string;
    warning: string;
    error: string;
    info: string;
  };

  typography: {
    // Golden Ratio Typography (φ = 1.618)
    baseSize: string;
    textLg: string;
    textXl: string;
    text2xl: string;
    text3xl: string;

    // Font Families
    fontFamily: string;
    fontFamilyMono: string;

    // Font Weights
    fontWeightNormal: number;
    fontWeightMedium: number;
    fontWeightBold: number;
  };

  spacing: {
    // Base-8 Spacing System
    space1: string;
    space2: string;
    space3: string;
    space4: string;
    space6: string;
    space8: string;
    spaceGolden: string;
  };

  radius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };

  effects: {
    shadowGlow: string;
    shadowQuantum: string;
    glassBg: string;
    glassBorder: string;
  };

  mode: 'light' | 'dark';
}

// Default TerraFusion Quantum Theme
const defaultTheme: TerraFusionTheme = {
  colors: {
    terraCyan: '#00FFFF',
    terraMidnight: '#0A0E1A',
    terraBlue: '#0080FF',
    terraSlate: '#1E293B',
    terraTranscend: '#00FFEE',

    primary: '#00FFFF',
    secondary: '#0080FF',
    background: '#0A0E1A',
    surface: '#1E293B',
    text: '#FFFFFF',
    textMuted: '#94A3B8',

    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  typography: {
    baseSize: '1rem',
    textLg: '1.236rem',
    textXl: '1.618rem',
    text2xl: '2rem',
    text3xl: '2.618rem',

    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyMono: '"Fira Code", "Cascadia Code", Consolas, monospace',

    fontWeightNormal: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },

  spacing: {
    space1: '0.25rem',
    space2: '0.5rem',
    space3: '0.75rem',
    space4: '1rem',
    space6: '1.5rem',
    space8: '2rem',
    spaceGolden: '1.618rem',
  },

  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },

  effects: {
    shadowGlow: '0 0 40px rgba(0, 255, 255, 0.4)',
    shadowQuantum: '0 0 20px rgba(0, 255, 255, 0.3)',
    glassBg: 'rgba(30, 41, 59, 0.3)',
    glassBorder: 'rgba(0, 255, 255, 0.2)',
  },

  mode: 'dark',
};

// Theme Context
const ThemeContext = createContext<{
  theme: TerraFusionTheme;
  setTheme: (theme: TerraFusionTheme) => void;
  toggleMode: () => void;
}>({
  theme: defaultTheme,
  setTheme: () => {},
  toggleMode: () => {},
});

// Theme Provider Component
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<TerraFusionTheme>(defaultTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('terrafusion-theme');
    if (storedTheme) {
      try {
        setTheme(JSON.parse(storedTheme));
      } catch (error) {
        console.error('Failed to load theme from localStorage:', error);
      }
    }
  }, []);

  // Save theme to localStorage on change
  useEffect(() => {
    localStorage.setItem('terrafusion-theme', JSON.stringify(theme));
  }, [theme]);

  // Toggle between light and dark mode
  const toggleMode = () => {
    setTheme((prevTheme) => ({
      ...prevTheme,
      mode: prevTheme.mode === 'dark' ? 'light' : 'dark',
      colors: prevTheme.mode === 'dark'
        ? {
            ...prevTheme.colors,
            background: '#FFFFFF',
            surface: '#F1F5F9',
            text: '#0A0E1A',
            textMuted: '#64748B',
          }
        : {
            ...prevTheme.colors,
            background: '#0A0E1A',
            surface: '#1E293B',
            text: '#FFFFFF',
            textMuted: '#94A3B8',
          },
    }));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// useTheme Hook
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// Utility: Get CSS variable value from theme
export function getCSSVariable(variableName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variableName);
}

// Utility: Set CSS variable from theme
export function setCSSVariable(variableName: string, value: string): void {
  document.documentElement.style.setProperty(variableName, value);
}

// Utility: Apply theme to CSS variables
export function applyThemeToCSS(theme: TerraFusionTheme): void {
  // Apply color variables
  setCSSVariable('--terra-cyan', theme.colors.terraCyan);
  setCSSVariable('--terra-midnight', theme.colors.terraMidnight);
  setCSSVariable('--terra-blue', theme.colors.terraBlue);
  setCSSVariable('--terra-slate', theme.colors.terraSlate);
  setCSSVariable('--color-background', theme.colors.background);
  setCSSVariable('--color-surface', theme.colors.surface);
  setCSSVariable('--color-text', theme.colors.text);

  // Apply typography variables
  setCSSVariable('--text-base', theme.typography.baseSize);
  setCSSVariable('--text-lg', theme.typography.textLg);
  setCSSVariable('--text-xl', theme.typography.textXl);
  setCSSVariable('--font-family', theme.typography.fontFamily);

  // Apply spacing variables
  setCSSVariable('--space-4', theme.spacing.space4);
  setCSSVariable('--space-6', theme.spacing.space6);
  setCSSVariable('--space-8', theme.spacing.space8);
  setCSSVariable('--space-golden', theme.spacing.spaceGolden);
}

// Export default theme for testing
export { defaultTheme };
