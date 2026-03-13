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
}

const DEFAULTS: EditorSettings = {
  minimap: true,
  wordWrap: true,
  fontSize: 12,
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
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
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
  const increaseFontSize = useCallback(
    () => update({ fontSize: Math.min(FONT_MAX, settings.fontSize + 1) }),
    [settings.fontSize, update],
  );
  const decreaseFontSize = useCallback(
    () => update({ fontSize: Math.max(FONT_MIN, settings.fontSize - 1) }),
    [settings.fontSize, update],
  );

  return { settings, toggleMinimap, toggleWordWrap, increaseFontSize, decreaseFontSize };
}
