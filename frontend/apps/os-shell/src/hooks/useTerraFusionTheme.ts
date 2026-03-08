/**
 * TerraFusion Theme Hook
 *
 * Provides theme values for components that need access to the TerraFusion
 * design system tokens. This replaces the former @terrafusion/quantum-ui
 * package import with a lightweight local implementation.
 */

export interface TerraFusionTheme {
  colors: {
    quantum: {
      deepSpace: string;
      deepAnalytics: string;
    };
    primary: string;
    accent: string;
    cyan: string;
    midnight: string;
  };
}

const defaultTheme: TerraFusionTheme = {
  colors: {
    quantum: {
      deepSpace: '#0A0E1A',
      deepAnalytics: '#080C18',
    },
    primary: '#0080FF',
    accent: '#00FFAA',
    cyan: '#00FFFF',
    midnight: '#0A0E1A',
  },
};

/**
 * Returns the current TerraFusion theme object.
 * In the future this could read from a theme context or CSS custom properties.
 */
export function useTerraFusionTheme(): TerraFusionTheme {
  return defaultTheme;
}
