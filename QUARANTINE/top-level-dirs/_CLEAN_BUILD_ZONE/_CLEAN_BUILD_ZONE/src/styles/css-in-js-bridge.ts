/**
 * 🏆 PhD-Level CSS-in-JS Bridge System
 * MIT Computer Science Advanced Design Architecture
 */

import { createTheme } from '@mui/material/styles';

// CSS Custom Properties Integration
const getCSSVar = (property: string): string => {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(property)
    .trim();
};

// Championship Design Tokens (synced with CSS)
export const championshipTokens = {
  colors: {
    primary: {
      trust: 'var(--tf-trust-blue, #0099ff)',
      transcend: 'var(--tf-transcend-cyan, #00ffee)',
      success: 'var(--tf-success-green, #00ffaa)',
      deepSpace: 'var(--tf-deep-space, #0b1020)',
      midnight: 'var(--tf-midnight, #1a1f3a)',
    },
    gradients: {
      clarity: 'var(--tf-gradient-clarity)',
      transcend: 'var(--tf-gradient-transcend)',
      dark: 'var(--tf-gradient-dark)',
      success: 'var(--tf-gradient-success)',
    },
  },
  
  spacing: {
    xs: 'var(--tf-space-xs, 4px)',
    sm: 'var(--tf-space-sm, 8px)',
    md: 'var(--tf-space-md, 16px)',
    lg: 'var(--tf-space-lg, 24px)',
    xl: 'var(--tf-space-xl, 32px)',
    '2xl': 'var(--tf-space-2xl, 48px)',
  },
  
  radius: {
    sm: 'var(--tf-radius-sm, 8px)',
    md: 'var(--tf-radius-md, 12px)',
    lg: 'var(--tf-radius-lg, 20px)',
    xl: 'var(--tf-radius-xl, 24px)',
    full: 'var(--tf-radius-full, 50px)',
  },
  
  shadows: {
    glow: 'var(--tf-shadow-glow)',
    subtle: 'var(--tf-shadow-subtle)',
    elevated: 'var(--tf-shadow-elevated)',
  },
  
  transitions: {
    default: 'var(--tf-transition)',
    fast: 'var(--tf-transition-fast)',
    spring: 'var(--tf-spring)',
  },
};

// Material-UI Theme Integration
export const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0099ff', // tf-trust-blue
      light: '#00ffee', // tf-transcend-cyan
      dark: '#0066cc',
    },
    secondary: {
      main: '#00ffaa', // tf-success-green
      light: '#33ffbb',
      dark: '#00cc88',
    },
    background: {
      default: '#0b1020', // tf-deep-space
      paper: 'rgba(255, 255, 255, 0.03)', // tf-glass
    },
    error: {
      main: '#ff4444', // tf-alert-red
    },
    warning: {
      main: '#ffaa00', // tf-caution-amber
    },
  },
  
  typography: {
    fontFamily: 'var(--tf-font-primary)',
    h1: {
      fontSize: '72px',
      fontWeight: 900,
      letterSpacing: '-0.02em',
      background: 'var(--tf-gradient-clarity)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontSize: '48px',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '36px',
      fontWeight: 600,
    },
  },
  
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          background: 'var(--tf-gradient-clarity)',
          borderRadius: 'var(--tf-radius-full)',
          padding: '14px 32px',
          fontWeight: 600,
          fontSize: '15px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          transition: 'var(--tf-transition)',
          boxShadow: '0 4px 15px rgba(0, 153, 255, 0.3)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0, 255, 238, 0.4)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          background: 'transparent',
          color: 'var(--tf-transcend-cyan)',
          border: '2px solid var(--tf-transcend-cyan)',
          borderRadius: 'var(--tf-radius-full)',
          padding: '12px 28px',
          fontWeight: 600,
          fontSize: '15px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          transition: 'var(--tf-transition)',
          '&:hover': {
            background: 'var(--tf-transcend-cyan)',
            color: 'var(--tf-deep-space)',
            boxShadow: 'var(--tf-shadow-glow)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'var(--tf-glass)',
          backdropFilter: 'var(--tf-blur)',
          WebkitBackdropFilter: 'var(--tf-blur)',
          border: '1px solid var(--tf-glass-border)',
          borderRadius: 'var(--tf-radius-xl)',
          padding: 'var(--tf-space-lg)',
          transition: 'var(--tf-transition)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'var(--tf-gradient-clarity)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 'var(--tf-shadow-glow)',
            borderColor: 'var(--tf-transcend-cyan)',
            '&::before': {
              opacity: 1,
              animation: 'tf-scan-line 2s linear infinite',
            },
          },
        },
      },
    },
  },
  
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },
});

// Styled-Components Theme Provider
export const styledTheme = {
  ...championshipTokens,
  
  // Container Query Breakpoints
  containerQueries: {
    sm: '(min-width: 320px)',
    md: '(min-width: 480px)',
    lg: '(min-width: 640px)',
    xl: '(min-width: 800px)',
  },
  
  // Animation Curves
  animations: {
    transcendPulse: '3s ease-in-out infinite',
    clarityFade: '0.8s cubic-bezier(0.43, 0.13, 0.23, 0.96) forwards',
    glowPulse: '2s ease-in-out infinite',
    scanLine: '2s linear infinite',
  },
  
  // Glass Morphism Presets
  glass: {
    light: {
      background: 'var(--tf-glass)',
      backdropFilter: 'var(--tf-blur)',
      border: '1px solid var(--tf-glass-border)',
    },
    heavy: {
      background: 'var(--tf-glass-heavy)',
      backdropFilter: 'var(--tf-blur-heavy)',
      border: '1px solid rgba(0, 255, 238, 0.2)',
    },
  },
};

// Runtime CSS Variable Updates
export const updateCSSVariable = (property: string, value: string): void => {
  if (typeof window !== 'undefined') {
    document.documentElement.style.setProperty(property, value);
  }
};

// Performance-Optimized Style Injection
export const injectCriticalCSS = (css: string): void => {
  if (typeof window === 'undefined') return;
  
  const existingStyle = document.querySelector('#critical-css');
  if (existingStyle) {
    existingStyle.textContent = css;
    return;
  }
  
  const style = document.createElement('style');
  style.id = 'critical-css';
  style.textContent = css;
  document.head.insertBefore(style, document.head.firstChild);
};

// Theme Context Hooks
export const useChampionshipTheme = () => {
  return {
    tokens: championshipTokens,
    getCSSVar,
    updateCSSVariable,
    muiTheme,
    styledTheme,
  };
};

export default championshipTokens;