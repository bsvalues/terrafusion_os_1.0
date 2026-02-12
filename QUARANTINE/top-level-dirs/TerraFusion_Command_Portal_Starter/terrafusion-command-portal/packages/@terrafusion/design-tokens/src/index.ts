/**
 * TerraFusion Design System - Core Types
 * TypeScript definitions for design token system
 * @version 1.0.0
 */

export interface ColorToken {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface SemanticColorToken {
  50: string;
  500: string;
  700: string;
}

export interface TerraColors {
  primary: ColorToken;
  earth: ColorToken;
  forest: ColorToken;
}

export interface SemanticColors {
  success: SemanticColorToken;
  warning: SemanticColorToken;
  error: SemanticColorToken;
  info: SemanticColorToken;
}

export interface Typography {
  fontFamily: {
    sans: string[];
    mono: string[];
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
  };
  fontWeight: {
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
    extrabold: string;
  };
  lineHeight: {
    tight: string;
    snug: string;
    normal: string;
    relaxed: string;
    loose: string;
  };
}

export interface Spacing {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
}

export interface BorderRadius {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

export interface Shadow {
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
}

export interface Animation {
  duration: {
    fast: string;
    normal: string;
    slow: string;
    slower: string;
  };
  easing: {
    linear: string;
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    terra: string;
  };
}

export interface TerraFusionTokens {
  color: {
    terra: TerraColors;
    semantic: SemanticColors;
    neutral: ColorToken;
  };
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadow: Shadow;
  animation: Animation;
}

// Export placeholder - actual tokens will be available in built package
export declare const tokens: Record<string, any>;
export default tokens;