/**
 * CanonEditor — Monaco editor wrapper for TerraCanon
 *
 * Features:
 * - Language auto-detection from file extension
 * - Read-only mode for browsed files (id contains ":browse:")
 * - TerraCanon dark theme
 * - Responsive sizing via CSS container
 */
import Editor, { loader, type OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import React, { useCallback, useMemo, useRef } from 'react';
import { CANON_THEME_NAME, canonEditorTheme } from './canonEditorTheme';

// Configure Monaco workers for local (non-CDN) operation
self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'json') return new jsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    return new editorWorker();
  },
};

// Use the locally installed monaco-editor package instead of CDN
loader.config({ monaco });

/** Map file extension → Monaco language id */
function detectLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    json: 'json',
    css: 'css',
    scss: 'scss',
    html: 'html',
    xml: 'xml',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    sh: 'shell',
    bash: 'shell',
    ps1: 'powershell',
    sql: 'sql',
    py: 'python',
    cs: 'csharp',
    csproj: 'xml',
    sln: 'plaintext',
    dockerfile: 'dockerfile',
    toml: 'ini',
    env: 'ini',
    lock: 'plaintext',
    txt: 'plaintext',
  };
  return map[ext] ?? 'plaintext';
}

export interface CanonEditorProps {
  /** File name (used for language detection and display) */
  fileName: string;
  /** Editor content */
  value: string;
  /** Called on content change (suppressed in read-only mode) */
  onChange?: (value: string) => void;
  /** Whether the editor is read-only */
  readOnly?: boolean;
}

export const CanonEditor: React.FC<CanonEditorProps> = React.memo(function CanonEditor({
  fileName,
  value,
  onChange,
  readOnly = false,
}) {
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);

  const language = useMemo(() => detectLanguage(fileName), [fileName]);

  const handleMount: OnMount = useCallback(
    (_editor, monaco) => {
      monacoRef.current = monaco;
      // Register the TerraCanon theme on first mount
      monaco.editor.defineTheme(CANON_THEME_NAME, canonEditorTheme);
      monaco.editor.setTheme(CANON_THEME_NAME);
    },
    [],
  );

  const handleChange = useCallback(
    (val: string | undefined) => {
      if (!readOnly && onChange && val !== undefined) {
        onChange(val);
      }
    },
    [readOnly, onChange],
  );

  return (
    <div className='canon-monaco-container' data-testid='terracanon-monaco'>
      <Editor
        language={language}
        value={value}
        theme={CANON_THEME_NAME}
        onChange={handleChange}
        onMount={handleMount}
        options={{
          readOnly,
          fontSize: 12,
          fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
          lineHeight: 1.6,
          minimap: { enabled: true, maxColumn: 80 },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          padding: { top: 8 },
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          automaticLayout: true,
        }}
        loading={
          <div className='canon-monaco-loading'>Loading editor…</div>
        }
      />
    </div>
  );
});
