import { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

export const useThemeEffect = () => {
  const { theme, highContrast, reducedMotion, fontSize } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;

    // Handle Theme (Light/Dark/System)
    const applyTheme = () => {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = theme === 'dark' || (theme === 'system' && systemDark);

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for system changes if in system mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;

    // High Contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced Motion
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Font Size
    root.style.fontSize = `${fontSize}%`;
  }, [highContrast, reducedMotion, fontSize]);
};
