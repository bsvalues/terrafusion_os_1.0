import { create } from 'zustand';
import { persistenceService } from '../services/persistenceService';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeState {
  theme: ThemeMode;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: number; // Percentage (e.g., 100, 125, 150)

  // Actions
  setTheme: (theme: ThemeMode) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  setFontSize: (size: number) => void;
  reset: () => void;
  hydrate: () => void;
}

const DEFAULT_STATE = {
  theme: 'system' as ThemeMode,
  highContrast: false,
  reducedMotion: false,
  fontSize: 100,
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  ...DEFAULT_STATE,

  setTheme: (theme) => {
    set({ theme });
    persistenceService.saveThemeStateDebounced(get());
  },

  toggleHighContrast: () => {
    set((state) => ({ highContrast: !state.highContrast }));
    persistenceService.saveThemeStateDebounced(get());
  },

  toggleReducedMotion: () => {
    set((state) => ({ reducedMotion: !state.reducedMotion }));
    persistenceService.saveThemeStateDebounced(get());
  },

  setFontSize: (size) => {
    // Clamp between 75% and 200%
    const clamped = Math.max(75, Math.min(200, size));
    set({ fontSize: clamped });
    persistenceService.saveThemeStateDebounced(get());
  },

  reset: () => {
    set(DEFAULT_STATE);
    persistenceService.saveThemeStateDebounced(get());
  },

  hydrate: () => {
    const persisted = persistenceService.loadThemeState();
    if (persisted) {
      set({
        theme: persisted.theme,
        highContrast: persisted.highContrast,
        reducedMotion: persisted.reducedMotion,
        fontSize: persisted.fontSize,
      });
    }
  },
}));

// Initialize hydration
useThemeStore.getState().hydrate();
