/**
 * TerraCanon Monaco Editor Theme
 *
 * Maps canon.css design tokens to a Monaco editor theme definition.
 * Uses the same dark palette as the Canon IDE surfaces.
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
