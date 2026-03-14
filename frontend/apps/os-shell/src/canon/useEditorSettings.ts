/**
 * useEditorSettings — localStorage-backed editor preferences for TerraCanon.
 *
 * Persisted settings: minimap, wordWrap, fontSize.
 * Changes are applied immediately and survive across sessions.
 */
import { useCallback, useState } from 'react';

const STORAGE_KEY = 'terracanon:editor-settings';

export interface EditorSettings {
  minimap: boolean;
  wordWrap: boolean;
  fontSize: number;
  theme: string;
  stickyScroll: boolean;
}

const DEFAULTS: EditorSettings = {
  minimap: true,
  wordWrap: true,
  fontSize: 12,
  theme: 'dark',
  stickyScroll: true,
};

const FONT_MIN = 8;
const FONT_MAX = 24;

function loadSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      minimap: typeof parsed.minimap === 'boolean' ? parsed.minimap : DEFAULTS.minimap,
      wordWrap: typeof parsed.wordWrap === 'boolean' ? parsed.wordWrap : DEFAULTS.wordWrap,
      fontSize: typeof parsed.fontSize === 'number'
        ? Math.max(FONT_MIN, Math.min(FONT_MAX, parsed.fontSize))
        : DEFAULTS.fontSize,
      theme: typeof parsed.theme === 'string' ? parsed.theme : DEFAULTS.theme,
      stickyScroll: typeof parsed.stickyScroll === 'boolean' ? parsed.stickyScroll : DEFAULTS.stickyScroll,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function persistSettings(settings: EditorSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export interface UseEditorSettingsReturn {
  settings: EditorSettings;
  toggleMinimap: () => void;
  toggleWordWrap: () => void;
  toggleStickyScroll: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  setTheme: (theme: string) => void;
}

export function useEditorSettings(): UseEditorSettingsReturn {
  const [settings, setSettings] = useState<EditorSettings>(loadSettings);

  const update = useCallback((patch: Partial<EditorSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      persistSettings(next);
      return next;
    });
  }, []);

  const toggleMinimap = useCallback(() => update({ minimap: !settings.minimap }), [settings.minimap, update]);
  const toggleWordWrap = useCallback(() => update({ wordWrap: !settings.wordWrap }), [settings.wordWrap, update]);
  const toggleStickyScroll = useCallback(() => update({ stickyScroll: !settings.stickyScroll }), [settings.stickyScroll, update]);
  const increaseFontSize = useCallback(
    () => update({ fontSize: Math.min(FONT_MAX, settings.fontSize + 1) }),
    [settings.fontSize, update],
  );
  const decreaseFontSize = useCallback(
    () => update({ fontSize: Math.max(FONT_MIN, settings.fontSize - 1) }),
    [settings.fontSize, update],
  );
  const setTheme = useCallback(
    (theme: string) => update({ theme }),
    [update],
  );

  return { settings, toggleMinimap, toggleWordWrap, toggleStickyScroll, increaseFontSize, decreaseFontSize, setTheme };
}
