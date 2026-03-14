import React, { useCallback, useEffect, useState } from 'react';
import { fetchEditorSettings, type EditorSettingsData } from '../api/canonFs';

const DEFAULTS: EditorSettingsData = {
  minimap: true,
  wordWrap: true,
  fontSize: 12,
  tabSize: 2,
  theme: 'dark',
  lineNumbers: true,
  autoSave: true,
  bracketPairColorization: true,
  stickyScroll: true,
};

const FONT_MIN = 8;
const FONT_MAX = 24;
const TAB_OPTIONS = [2, 4, 8];

export interface CanonSettingsPanelProps {
  onSettingsChange?: (settings: EditorSettingsData) => void;
}

export default function CanonSettingsPanel({ onSettingsChange }: CanonSettingsPanelProps) {
  const [settings, setSettings] = useState<EditorSettingsData>(DEFAULTS);
  const [persisted, setPersisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const resp = await fetchEditorSettings('get');
      if (cancelled) return;
      if (resp.error) {
        setError(resp.error);
      } else {
        setSettings(resp.settings);
        setPersisted(resp.persisted);
        onSettingsChange?.(resp.settings);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSetting = useCallback(
    async (patch: Partial<EditorSettingsData>) => {
      const merged = { ...settings, ...patch };
      setSettings(merged);
      onSettingsChange?.(merged);
      const resp = await fetchEditorSettings('set', patch);
      if (resp.error) {
        setError(resp.error);
      } else {
        setPersisted(resp.persisted);
        setError(null);
      }
    },
    [settings, onSettingsChange],
  );

  const handleReset = useCallback(async () => {
    const resp = await fetchEditorSettings('reset');
    if (resp.error) {
      setError(resp.error);
    } else {
      setSettings(resp.settings);
      setPersisted(resp.persisted);
      onSettingsChange?.(resp.settings);
      setError(null);
    }
  }, [onSettingsChange]);

  if (loading) {
    return <div className="canon-settings-panel canon-settings-loading">Loading settings…</div>;
  }

  return (
    <div className="canon-settings-panel">
      <div className="canon-settings-header">
        <span className="canon-settings-title">Editor Settings</span>
        {persisted && <span className="canon-settings-badge">Synced</span>}
      </div>

      {error && <div className="canon-settings-error">{error}</div>}

      <div className="canon-settings-section">
        <div className="canon-settings-section-title">Appearance</div>

        <label className="canon-settings-toggle">
          <span>Theme</span>
          <select
            value={settings.theme}
            onChange={(e) => updateSetting({ theme: e.target.value })}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="high-contrast">High Contrast</option>
          </select>
        </label>

        <label className="canon-settings-toggle">
          <span>Font Size</span>
          <div className="canon-settings-stepper">
            <button
              disabled={settings.fontSize <= FONT_MIN}
              onClick={() => updateSetting({ fontSize: Math.max(FONT_MIN, settings.fontSize - 1) })}
            >−</button>
            <span className="canon-settings-stepper-value">{settings.fontSize}px</span>
            <button
              disabled={settings.fontSize >= FONT_MAX}
              onClick={() => updateSetting({ fontSize: Math.min(FONT_MAX, settings.fontSize + 1) })}
            >+</button>
          </div>
        </label>

        <label className="canon-settings-toggle">
          <span>Tab Size</span>
          <select
            value={settings.tabSize}
            onChange={(e) => updateSetting({ tabSize: Number(e.target.value) })}
          >
            {TAB_OPTIONS.map((n) => (
              <option key={n} value={n}>{n} spaces</option>
            ))}
          </select>
        </label>

        <label className="canon-settings-toggle">
          <span>Line Numbers</span>
          <input
            type="checkbox"
            checked={settings.lineNumbers}
            onChange={() => updateSetting({ lineNumbers: !settings.lineNumbers })}
          />
        </label>
      </div>

      <div className="canon-settings-section">
        <div className="canon-settings-section-title">Editor</div>

        <label className="canon-settings-toggle">
          <span>Word Wrap</span>
          <input
            type="checkbox"
            checked={settings.wordWrap}
            onChange={() => updateSetting({ wordWrap: !settings.wordWrap })}
          />
        </label>

        <label className="canon-settings-toggle">
          <span>Minimap</span>
          <input
            type="checkbox"
            checked={settings.minimap}
            onChange={() => updateSetting({ minimap: !settings.minimap })}
          />
        </label>

        <label className="canon-settings-toggle">
          <span>Sticky Scroll</span>
          <input
            type="checkbox"
            checked={settings.stickyScroll}
            onChange={() => updateSetting({ stickyScroll: !settings.stickyScroll })}
          />
        </label>

        <label className="canon-settings-toggle">
          <span>Bracket Pair Colorization</span>
          <input
            type="checkbox"
            checked={settings.bracketPairColorization}
            onChange={() => updateSetting({ bracketPairColorization: !settings.bracketPairColorization })}
          />
        </label>

        <label className="canon-settings-toggle">
          <span>Auto Save</span>
          <input
            type="checkbox"
            checked={settings.autoSave}
            onChange={() => updateSetting({ autoSave: !settings.autoSave })}
          />
        </label>
      </div>

      <div className="canon-settings-actions">
        <button className="canon-settings-reset" onClick={handleReset}>
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
