/**
 * Responsive Utility Functions
 *
 * Helper utilities for responsive design in TerraFusion OS.
 */

import { breakpoints } from '../hooks/useMediaQuery';

/**
 * Generate media query string for breakpoint
 *
 * @param breakpoint - Breakpoint name
 * @param type - Query type ('min' or 'max')
 * @returns Media query string
 *
 * @example
 * const query = getMediaQuery('md', 'min'); // "(min-width: 768px)"
 */
export function getMediaQuery(
  breakpoint: keyof typeof breakpoints,
  type: 'min' | 'max' = 'min'
): string {
  const width = breakpoints[breakpoint];
  return `(${type}-width: ${width})`;
}

/**
 * Check if current viewport matches breakpoint
 *
 * @param breakpoint - Breakpoint name
 * @param type - Query type ('min' or 'max')
 * @returns True if breakpoint matches
 *
 * @example
 * if (matchesBreakpoint('md', 'min')) {
 *   // Desktop layout
 * }
 */
export function matchesBreakpoint(
  breakpoint: keyof typeof breakpoints,
  type: 'min' | 'max' = 'min'
): boolean {
  if (typeof window === 'undefined') return false;

  const query = getMediaQuery(breakpoint, type);
  return window.matchMedia(query).matches;
}

/**
 * Get all matching breakpoints
 *
 * @returns Array of matching breakpoint names
 *
 * @example
 * const matches = getMatchingBreakpoints(); // ['xs', 'sm', 'md']
 */
export function getMatchingBreakpoints(): (keyof typeof breakpoints)[] {
  if (typeof window === 'undefined') return [];

  return (Object.keys(breakpoints) as (keyof typeof breakpoints)[]).filter(
    (bp) => matchesBreakpoint(bp, 'min')
  );
}

/**
 * Get current breakpoint
 *
 * @returns Current breakpoint name
 *
 * @example
 * const current = getCurrentBreakpoint(); // 'md'
 */
export function getCurrentBreakpoint(): keyof typeof breakpoints {
  const matches = getMatchingBreakpoints();
  return matches[matches.length - 1] || 'xs';
}

/**
 * Responsive value mapper
 *
 * Maps breakpoint-specific values to current breakpoint
 *
 * @param values - Object with breakpoint keys and values
 * @param defaultValue - Default value if no match
 * @returns Value for current breakpoint
 *
 * @example
 * const columns = responsiveValue({ xs: 1, sm: 2, md: 3 }, 1);
 */
export function responsiveValue<T>(
  values: Partial<Record<keyof typeof breakpoints, T>>,
  defaultValue: T
): T {
  const breakpoint = getCurrentBreakpoint();
  const breakpointOrder: (keyof typeof breakpoints)[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);

  // Find appropriate value by walking down breakpoint hierarchy
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp] as T;
    }
  }

  return defaultValue;
}

/**
 * Generate responsive CSS class names
 *
 * @param baseClass - Base class name
 * @param responsive - Breakpoint-specific class suffixes
 * @returns Space-separated class names
 *
 * @example
 * const classes = responsiveClasses('grid-cols', { xs: '1', md: '2', lg: '3' });
 * // "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
 */
export function responsiveClasses(
  baseClass: string,
  responsive: Partial<Record<keyof typeof breakpoints, string>>
): string {
  const classes: string[] = [];

  // Add base class with xs value if provided
  if (responsive.xs) {
    classes.push(`${baseClass}-${responsive.xs}`);
  }

  // Add breakpoint-specific classes
  const breakpointOrder: (keyof typeof breakpoints)[] = ['sm', 'md', 'lg', 'xl', '2xl'];

  breakpointOrder.forEach((bp) => {
    if (responsive[bp]) {
      classes.push(`${bp}:${baseClass}-${responsive[bp]}`);
    }
  });

  return classes.join(' ');
}

/**
 * Convert pixel value to rem
 *
 * @param px - Pixel value
 * @param baseFontSize - Base font size (default: 16)
 * @returns Rem value string
 *
 * @example
 * const rem = pxToRem(24); // "1.5rem"
 */
export function pxToRem(px: number, baseFontSize: number = 16): string {
  return `${px / baseFontSize}rem`;
}

/**
 * Convert rem value to pixels
 *
 * @param rem - Rem value
 * @param baseFontSize - Base font size (default: 16)
 * @returns Pixel value
 *
 * @example
 * const px = remToPx(1.5); // 24
 */
export function remToPx(rem: number, baseFontSize: number = 16): number {
  return rem * baseFontSize;
}

/**
 * Clamp value between min and max
 *
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 *
 * @example
 * const clamped = clamp(150, 100, 200); // 150
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate fluid typography size using clamp()
 *
 * @param minSize - Minimum size in rem
 * @param maxSize - Maximum size in rem
 * @param minViewport - Minimum viewport width in px
 * @param maxViewport - Maximum viewport width in px
 * @returns CSS clamp() value
 *
 * @example
 * const fontSize = fluidSize(1, 2, 320, 1920);
 * // "clamp(1rem, 0.5rem + 2vw, 2rem)"
 */
export function fluidSize(
  minSize: number,
  maxSize: number,
  minViewport: number = 320,
  maxViewport: number = 1920
): string {
  const slope = (maxSize - minSize) / (maxViewport - minViewport);
  const yAxisIntersection = -minViewport * slope + minSize;

  return `clamp(${minSize}rem, ${yAxisIntersection.toFixed(4)}rem + ${(slope * 100).toFixed(4)}vw, ${maxSize}rem)`;
}

/**
 * Get viewport dimensions
 *
 * @returns Object with width and height
 *
 * @example
 * const { width, height } = getViewportSize();
 */
export function getViewportSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Check if viewport is in portrait mode
 *
 * @returns True if portrait
 *
 * @example
 * if (isPortrait()) {
 *   // Portrait-specific layout
 * }
 */
export function isPortrait(): boolean {
  const { width, height } = getViewportSize();
  return height > width;
}

/**
 * Check if viewport is in landscape mode
 *
 * @returns True if landscape
 *
 * @example
 * if (isLandscape()) {
 *   // Landscape-specific layout
 * }
 */
export function isLandscape(): boolean {
  return !isPortrait();
}
