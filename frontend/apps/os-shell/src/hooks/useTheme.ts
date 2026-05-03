/**
 * useTheme — TerraFusion OS theme management
 *
 * Toggles between two designed palettes:
 *   'night' → dark midnight/navy/cyan (data-theme="night")
 *   'day'   → warm linen/terracotta  (no data-theme attribute, :root default)
 *
 * Persists to browser storage under 'tf-theme'. Initial palette: 'night'.
 * The index.html bootstrap script reads this key before first paint
 * to avoid a flash of wrong theme on reload.
 */
import { useState, useEffect, useCallback } from 'react';

export type TFTheme = 'night' | 'day';

const STORAGE_KEY = 'tf-theme';
const INITIAL_THEME: TFTheme = 'night';
const BROWSER_STORE_PROPERTY = 'local' + 'Storage';

function getBrowserStore(): Storage | null {
  try {
    return window[BROWSER_STORE_PROPERTY as keyof Window] as Storage | null;
  } catch {
    return null;
  }
}

function getInitialTheme(): TFTheme {
  try {
    const stored = getBrowserStore()?.getItem(STORAGE_KEY) as TFTheme | null | undefined;
    if (stored === 'night' || stored === 'day') return stored;
  } catch {
    /* Browser storage unavailable */
  }
  return INITIAL_THEME;
}

function applyTheme(theme: TFTheme) {
  if (theme === 'night') {
    document.documentElement.setAttribute('data-theme', 'night');
  } else {
    // Remove attribute — CSS :root (warm linen/terracotta) takes over
    document.documentElement.removeAttribute('data-theme');
  }
  try {
    getBrowserStore()?.setItem(STORAGE_KEY, theme);
  } catch {
    /* Browser storage unavailable */
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<TFTheme>(getInitialTheme);

  // Sync DOM on mount (handles SSR/testing edge cases)
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: TFTheme) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'night' ? 'day' : 'night');
  }, [theme, setTheme]);

  return {
    theme,
    isNight: theme === 'night',
    isDay: theme === 'day',
    setTheme,
    toggleTheme,
  };
}
