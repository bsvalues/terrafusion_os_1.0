/**
 * useMediaQuery Hook
 *
 * Responsive design hook for TerraFusion OS.
 * Detects media query matches and provides reactive breakpoint information.
 */

import { useEffect, useState } from 'react';

/**
 * TerraFusion Breakpoints
 * Based on common device sizes and TerraFusion design system
 */
export const breakpoints = {
  xs: '320px',   // Mobile portrait
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape / Desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px', // Large desktop
} as const;

/**
 * useMediaQuery Hook
 *
 * @param query - CSS media query string (e.g., "(min-width: 768px)")
 * @returns boolean - True if media query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with current match state
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    // Skip if window is not available (SSR)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    // Update match state
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set initial state
    setMatches(mediaQueryList.matches);

    // Listen for changes
    mediaQueryList.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoint hooks
 */

export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${breakpoints.md})`);
}

export function useIsTablet(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`);
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.lg})`);
}

export function useIsLargeDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.xl})`);
}

/**
 * useBreakpoint Hook
 *
 * Returns current breakpoint name
 *
 * @returns 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 *
 * @example
 * const breakpoint = useBreakpoint();
 * if (breakpoint === 'md') {
 *   // Tablet-specific logic
 * }
 */
export function useBreakpoint(): keyof typeof breakpoints {
  const isXs = useMediaQuery(`(max-width: ${breakpoints.sm})`);
  const isSm = useMediaQuery(`(min-width: ${breakpoints.sm}) and (max-width: ${breakpoints.md})`);
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg}) and (max-width: ${breakpoints.xl})`);
  const isXl = useMediaQuery(`(min-width: ${breakpoints.xl}) and (max-width: ${breakpoints['2xl']})`);
  const is2xl = useMediaQuery(`(min-width: ${breakpoints['2xl']})`);

  if (isXs) return 'xs';
  if (isSm) return 'sm';
  if (isMd) return 'md';
  if (isLg) return 'lg';
  if (isXl) return 'xl';
  if (is2xl) return '2xl';

  return 'lg'; // Default fallback
}

/**
 * useOrientation Hook
 *
 * Detects device orientation
 *
 * @returns 'portrait' | 'landscape'
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  return isPortrait ? 'portrait' : 'landscape';
}

/**
 * usePrefersReducedMotion Hook
 *
 * Detects user preference for reduced motion (accessibility)
 *
 * @returns boolean - True if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * usePrefersDarkMode Hook
 *
 * Detects user system preference for dark mode
 *
 * @returns boolean - True if user prefers dark mode
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Responsive value selector utility
 *
 * @param values - Object with breakpoint keys and corresponding values
 * @returns Value for current breakpoint
 *
 * @example
 * const columns = useResponsiveValue({
 *   xs: 1,
 *   sm: 2,
 *   md: 3,
 *   lg: 4,
 * });
 */
export function useResponsiveValue<T>(values: Partial<Record<keyof typeof breakpoints, T>>): T | undefined {
  const breakpoint = useBreakpoint();

  // Find the appropriate value for current breakpoint
  // Falls back to smaller breakpoint values if current is not defined
  const breakpointOrder: (keyof typeof breakpoints)[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);

  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }

  return undefined;
}
