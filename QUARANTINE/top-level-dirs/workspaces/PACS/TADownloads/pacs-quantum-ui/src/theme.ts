/**
 * Theme Configuration
 * Elite Power User - Dark Theme Optimized
 */

import { createTheme as createMuiTheme, ThemeOptions } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';

const baseTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#0891b2', // Cosmic Blue
      light: '#00d2ff', // Quantum Teal
      dark: '#06b6d4',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00d2ff', // Quantum Teal
      light: '#06b6d4',
      dark: '#0891b2',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0a0e27',
      paper: '#131827',
    },
    text: {
      primary: '#e0e7ff',
      secondary: '#9ca3af',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    info: {
      main: '#06b6d4',
      light: '#22d3ee',
      dark: '#0891b2',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    divider: 'rgba(255, 255, 255, 0.1)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 500,
        },
        contained: {
          boxShadow: '0 2px 8px rgba(8, 145, 178, 0.3)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(8, 145, 178, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#131827',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'rgba(8, 145, 178, 0.5)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#131827',
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: '#131827',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(8, 145, 178, 0.1)',
          },
        },
      },
    },
  },
};

export function createTheme(mode: 'light' | 'dark' | 'auto' = 'dark'): Theme {
  const themeMode = mode === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode;

  if (themeMode === 'light') {
    return createMuiTheme({
      ...baseTheme,
      palette: {
        ...baseTheme.palette,
        mode: 'light',
        background: {
          default: '#f8fafc',
          paper: '#ffffff',
        },
        text: {
          primary: '#1f2937',
          secondary: '#6b7280',
        },
      },
    });
  }

  return createMuiTheme(baseTheme);
}

