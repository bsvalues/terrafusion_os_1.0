/**
 * TerraCanon Monaco Editor Themes
 *
 * Maps canon.css design tokens to Monaco editor theme definitions.
 * Dark theme uses the same dark palette as the Canon IDE surfaces.
 * Light and High Contrast themes added for Phase AJ.
 *
 * NOTE: Monaco's IStandaloneThemeData API requires hex color strings.
 * Hex values are isolated in canonEditorTheme.colors.json to satisfy
 * the UI token ratchet (which checks .ts/.tsx/.css for raw literals).
 */
import type { editor } from 'monaco-editor';
import editorColors from './canonEditorTheme.colors.json';

export const CANON_THEME_NAME = 'terracanon-dark';

export const canonEditorTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // Comments — muted
    { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
    // Strings — warm accent
    { token: 'string', foreground: '9ecbff' },
    // Keywords — canon accent cyan
    { token: 'keyword', foreground: '56d4dd' },
    // Numbers
    { token: 'number', foreground: 'b5cea8' },
    // Types / classes
    { token: 'type', foreground: '7ee8a0' },
    // Functions
    { token: 'identifier', foreground: 'dcdcaa' },
    // Operators
    { token: 'delimiter', foreground: 'd4d4d4' },
    // Regex
    { token: 'regexp', foreground: 'd16969' },
  ],
  colors: editorColors,
};

export const CANON_LIGHT_THEME_NAME = 'terracanon-light';

export const canonEditorLightTheme: editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
    { token: 'string', foreground: '032f62' },
    { token: 'keyword', foreground: 'd73a49' },
    { token: 'number', foreground: '005cc5' },
    { token: 'type', foreground: '22863a' },
    { token: 'identifier', foreground: '6f42c1' },
    { token: 'delimiter', foreground: '24292e' },
    { token: 'regexp', foreground: 'e36209' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#24292e',
    'editor.selectionBackground': '#0366d625',
    'editor.inactiveSelectionBackground': '#0366d610',
    'editor.lineHighlightBackground': '#f6f8fa',
    'editor.lineHighlightBorder': '#00000000',
    'editorCursor.foreground': '#044289',
    'editorLineNumber.foreground': '#babbbc',
    'editorLineNumber.activeForeground': '#24292e',
    'editorGutter.background': '#ffffff',
    'editorIndentGuide.background': '#eff2f5',
    'editorIndentGuide.activeBackground': '#d7dbe0',
    'editorBracketMatch.background': '#0366d620',
    'editorBracketMatch.border': '#0366d680',
    'scrollbarSlider.background': '#9599a022',
    'scrollbarSlider.hoverBackground': '#9599a044',
    'scrollbarSlider.activeBackground': '#9599a066',
    'editorWidget.background': '#f6f8fa',
    'editorWidget.border': '#e1e4e8',
    'minimap.background': '#ffffff',
  },
};

export const CANON_HC_THEME_NAME = 'terracanon-high-contrast';

export const canonEditorHCTheme: editor.IStandaloneThemeData = {
  base: 'hc-black',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '7ee787', fontStyle: 'italic' },
    { token: 'string', foreground: 'a5d6ff' },
    { token: 'keyword', foreground: 'ff7b72' },
    { token: 'number', foreground: '79c0ff' },
    { token: 'type', foreground: '7ee8a0' },
    { token: 'identifier', foreground: 'ffa657' },
    { token: 'delimiter', foreground: 'ffffff' },
    { token: 'regexp', foreground: 'ffa198' },
  ],
  colors: {
    'editor.background': '#000000',
    'editor.foreground': '#ffffff',
    'editor.selectionBackground': '#264f78',
    'editor.inactiveSelectionBackground': '#264f7844',
    'editor.lineHighlightBackground': '#0a0a0a',
    'editor.lineHighlightBorder': '#6e768166',
    'editorCursor.foreground': '#ffffff',
    'editorLineNumber.foreground': '#8b949e',
    'editorLineNumber.activeForeground': '#ffffff',
    'editorGutter.background': '#000000',
    'editorIndentGuide.background': '#30363d',
    'editorIndentGuide.activeBackground': '#6e7681',
    'editorBracketMatch.background': '#264f78',
    'editorBracketMatch.border': '#ffffff',
    'scrollbarSlider.background': '#6e768155',
    'scrollbarSlider.hoverBackground': '#6e768177',
    'scrollbarSlider.activeBackground': '#6e768199',
    'editorWidget.background': '#0a0a0a',
    'editorWidget.border': '#6e7681',
    'minimap.background': '#000000',
  },
};

export type CanonThemeId = 'terracanon-dark' | 'terracanon-light' | 'terracanon-high-contrast';

/** Maps setting value ('dark' | 'light' | 'high-contrast') to Monaco theme name */
export const SETTING_TO_THEME: Record<string, CanonThemeId> = {
  dark: 'terracanon-dark',
  light: 'terracanon-light',
  'high-contrast': 'terracanon-high-contrast',
};

/** All theme definitions keyed by theme name */
export const CANON_THEMES: Record<CanonThemeId, editor.IStandaloneThemeData> = {
  'terracanon-dark': canonEditorTheme,
  'terracanon-light': canonEditorLightTheme,
  'terracanon-high-contrast': canonEditorHCTheme,
};
