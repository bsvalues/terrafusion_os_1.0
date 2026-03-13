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
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { fetchCodeActions, fetchCompletions, fetchDocumentHighlights, fetchFindReferences, fetchFoldingRanges, fetchGitDiff, fetchGotoDefinition, fetchHoverInfo, fetchRenameSymbol, fetchSignatureHelp, type CodeActionKind, type CompletionKind, type LineMarker } from '../api/canonFs';
import { CANON_THEME_NAME, CANON_THEMES, type CanonThemeId } from './canonEditorTheme';

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
export function detectLanguage(fileName: string): string {
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

export interface CursorPosition {
  line: number;
  column: number;
}

export interface CanonEditorHandle {
  revealLine: (line: number) => void;
  insertText: (text: string) => void;
  getSelection: () => string;
  replaceSelection: (text: string) => void;
  focus: () => void;
  undo: () => void;
  redo: () => void;
  foldAll: () => void;
  unfoldAll: () => void;
  setMarkers: (markers: LineMarker[]) => void;
  clearMarkers: () => void;
  addCursorAbove: () => void;
  addCursorBelow: () => void;
  selectNextOccurrence: () => void;
  selectAllOccurrences: () => void;
  selectToBracket: () => void;
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
  /** Called when cursor position changes */
  onCursorChange?: (pos: CursorPosition) => void;
  /** Ref for imperative actions (revealLine) */
  editorRef?: React.Ref<CanonEditorHandle>;
  /** Show minimap (default: true) */
  minimap?: boolean;
  /** Enable word wrap (default: true) */
  wordWrap?: boolean;
  /** Editor font size (default: 12) */
  fontSize?: number;
  /** Line markers for decorations (diagnostics, bookmarks, etc.) */
  markers?: LineMarker[];
  /** Called when Go-to-Definition navigates to a location (file, line) */
  onGotoFile?: (filePath: string, line: number) => void;
  /** Active theme name (default: 'terracanon-dark') */
  themeName?: CanonThemeId;
  /** Enable sticky scroll (default: true) */
  stickyScroll?: boolean;
}

export const CanonEditor: React.FC<CanonEditorProps> = React.memo(function CanonEditor({
  fileName,
  value,
  onChange,
  readOnly = false,
  onCursorChange,
  editorRef,
  minimap = true,
  wordWrap = true,
  fontSize = 12,
  markers,
  onGotoFile,
  themeName = CANON_THEME_NAME as CanonThemeId,
  stickyScroll = true,
}) {
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const editorInstanceRef = useRef<Parameters<OnMount>[0] | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const language = useMemo(() => detectLanguage(fileName), [fileName]);

  // Expose imperative handle for editor operations
  useEffect(() => {
    if (!editorRef) return;
    const handle: CanonEditorHandle = {
      revealLine: (line: number) => {
        const editor = editorInstanceRef.current;
        if (editor) {
          editor.revealLineInCenter(line);
          editor.setPosition({ lineNumber: line, column: 1 });
          editor.focus();
        }
      },
      insertText: (text: string) => {
        const editor = editorInstanceRef.current;
        if (!editor) return;
        const selection = editor.getSelection();
        if (!selection) return;
        editor.executeEdits('canon-insert', [{
          range: selection,
          text,
          forceMoveMarkers: true,
        }]);
        editor.focus();
      },
      getSelection: () => {
        const editor = editorInstanceRef.current;
        if (!editor) return '';
        const sel = editor.getSelection();
        if (!sel) return '';
        return editor.getModel()?.getValueInRange(sel) ?? '';
      },
      replaceSelection: (text: string) => {
        const editor = editorInstanceRef.current;
        if (!editor) return;
        const selection = editor.getSelection();
        if (!selection) return;
        editor.executeEdits('canon-replace', [{
          range: selection,
          text,
          forceMoveMarkers: true,
        }]);
        editor.focus();
      },
      focus: () => {
        editorInstanceRef.current?.focus();
      },
      undo: () => {
        editorInstanceRef.current?.trigger('canon', 'undo', null);
      },
      redo: () => {
        editorInstanceRef.current?.trigger('canon', 'redo', null);
      },
      foldAll: () => {
        editorInstanceRef.current?.trigger('canon', 'editor.foldAll', null);
      },
      unfoldAll: () => {
        editorInstanceRef.current?.trigger('canon', 'editor.unfoldAll', null);
      },
      setMarkers: (mkrs: LineMarker[]) => {
        const editor = editorInstanceRef.current;
        const mon = monacoRef.current;
        if (!editor || !mon) return;
        const model = editor.getModel();
        if (!model) return;
        // Set Monaco model markers (squiggly underlines)
        const sevMap: Record<string, monaco.MarkerSeverity> = {
          error: mon.MarkerSeverity.Error,
          warning: mon.MarkerSeverity.Warning,
          info: mon.MarkerSeverity.Info,
          hint: mon.MarkerSeverity.Hint,
        };
        const monacoMarkers = mkrs.filter(m => m.kind === 'diagnostic').map(m => ({
          startLineNumber: m.line,
          startColumn: m.column ?? 1,
          endLineNumber: m.endLine ?? m.line,
          endColumn: m.endColumn ?? model.getLineMaxColumn(m.endLine ?? m.line),
          message: m.message,
          severity: sevMap[m.severity] ?? mon.MarkerSeverity.Info,
          source: m.source ?? 'canon',
        }));
        mon.editor.setModelMarkers(model, 'canon', monacoMarkers);
        // Set line decorations (gutter icons + line highlights)
        const decos = mkrs.map(m => ({
          range: new mon.Range(m.line, 1, m.endLine ?? m.line, 1),
          options: {
            isWholeLine: true,
            className: `canon-line-marker canon-line-marker--${m.severity}`,
            glyphMarginClassName: `canon-glyph canon-glyph--${m.severity}`,
            overviewRuler: {
              color: m.severity === 'error' ? '#f44' : m.severity === 'warning' ? '#fa0' : '#4af',
              position: mon.editor.OverviewRulerLane.Right,
            },
          },
        }));
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decos);
      },
      clearMarkers: () => {
        const editor = editorInstanceRef.current;
        const mon = monacoRef.current;
        if (!editor || !mon) return;
        const model = editor.getModel();
        if (model) mon.editor.setModelMarkers(model, 'canon', []);
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      },
      addCursorAbove: () => {
        editorInstanceRef.current?.trigger('canon', 'editor.action.insertCursorAbove', null);
      },
      addCursorBelow: () => {
        editorInstanceRef.current?.trigger('canon', 'editor.action.insertCursorBelow', null);
      },
      selectNextOccurrence: () => {
        editorInstanceRef.current?.trigger('canon', 'editor.action.addSelectionToNextFindMatch', null);
      },
      selectAllOccurrences: () => {
        editorInstanceRef.current?.trigger('canon', 'editor.action.selectHighlights', null);
      },
      selectToBracket: () => {
        editorInstanceRef.current?.trigger('canon', 'editor.action.selectToBracket', null);
      },
    };
    if (typeof editorRef === 'function') {
      editorRef(handle);
    } else if (editorRef && 'current' in editorRef) {
      (editorRef as React.MutableRefObject<CanonEditorHandle | null>).current = handle;
    }
  }, [editorRef]);

  // Apply markers prop reactively
  useEffect(() => {
    const editor = editorInstanceRef.current;
    const mon = monacoRef.current;
    if (!editor || !mon || !markers) return;
    const model = editor.getModel();
    if (!model) return;

    // Model markers (squiggly underlines) for diagnostics
    const sevMap: Record<string, monaco.MarkerSeverity> = {
      error: mon.MarkerSeverity.Error,
      warning: mon.MarkerSeverity.Warning,
      info: mon.MarkerSeverity.Info,
      hint: mon.MarkerSeverity.Hint,
    };
    const monacoMarkers = markers.filter(m => m.kind === 'diagnostic').map(m => ({
      startLineNumber: m.line,
      startColumn: m.column ?? 1,
      endLineNumber: m.endLine ?? m.line,
      endColumn: m.endColumn ?? model.getLineMaxColumn(m.endLine ?? m.line),
      message: m.message,
      severity: sevMap[m.severity] ?? mon.MarkerSeverity.Info,
      source: m.source ?? 'canon',
    }));
    mon.editor.setModelMarkers(model, 'canon', monacoMarkers);

    // Line decorations (gutter icons + highlights)
    const decos = markers.map(m => ({
      range: new mon.Range(m.line, 1, m.endLine ?? m.line, 1),
      options: {
        isWholeLine: true,
        className: `canon-line-marker canon-line-marker--${m.severity}`,
        glyphMarginClassName: `canon-glyph canon-glyph--${m.severity}`,
        overviewRuler: {
          color: m.severity === 'error' ? '#f44' : m.severity === 'warning' ? '#fa0' : '#4af',
          position: mon.editor.OverviewRulerLane.Right,
        },
      },
    }));
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decos);
  }, [markers]);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      monacoRef.current = monaco;
      editorInstanceRef.current = editor;
      // Register all TerraCanon themes on first mount
      for (const [name, def] of Object.entries(CANON_THEMES)) {
        monaco.editor.defineTheme(name, def);
      }
      monaco.editor.setTheme(themeName);

      // Emit initial cursor position
      if (onCursorChange) {
        const pos = editor.getPosition();
        if (pos) onCursorChange({ line: pos.lineNumber, column: pos.column });
      }

      // Listen for cursor position changes
      editor.onDidChangeCursorPosition((e) => {
        if (onCursorChange) {
          onCursorChange({ line: e.position.lineNumber, column: e.position.column });
        }
      });

      // Register folding range provider (backed by canon_folding_ranges tool)
      const foldingDisposable = monaco.languages.registerFoldingRangeProvider('*', {
        provideFoldingRanges: async (model) => {
          const content = model.getValue();
          const uri = model.uri.toString();
          const fName = uri.split('/').pop() ?? fileName;
          try {
            const resp = await fetchFoldingRanges(fName, content);
            if (resp.error || !resp.ranges.length) return [];
            const kindMap: Record<string, monaco.languages.FoldingRangeKind> = {
              comment: monaco.languages.FoldingRangeKind.Comment,
              imports: monaco.languages.FoldingRangeKind.Imports,
              region: monaco.languages.FoldingRangeKind.Region,
            };
            return resp.ranges.map((r) => ({
              start: r.startLine,
              end: r.endLine,
              kind: kindMap[r.kind] ?? monaco.languages.FoldingRangeKind.Region,
            }));
          } catch {
            return [];
          }
        },
      });

      // Register hover provider (backed by canon_hover_info tool)
      const hoverDisposable = monaco.languages.registerHoverProvider('*', {
        provideHover: async (model, position) => {
          const content = model.getValue();
          const uri = model.uri.toString();
          const fName = uri.split('/').pop() ?? fileName;
          try {
            const resp = await fetchHoverInfo(fName, position.lineNumber, position.column, content);
            if (resp.error || !resp.markdown) return null;
            const word = model.getWordAtPosition(position);
            return {
              range: word
                ? new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn)
                : new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
              contents: [{ value: resp.markdown, isTrusted: true }],
            };
          } catch {
            return null;
          }
        },
      });

      // Register definition provider (backed by canon_goto_definition tool)
      const definitionDisposable = monaco.languages.registerDefinitionProvider('*', {
        provideDefinition: async (model, position) => {
          const content = model.getValue();
          const uri = model.uri.toString();
          const fName = uri.split('/').pop() ?? fileName;
          try {
            const resp = await fetchGotoDefinition(fName, position.lineNumber, position.column, content);
            if (resp.error || !resp.definitions.length) return null;
            return resp.definitions.map((def) => ({
              uri: monaco.Uri.parse(`file:///${def.filePath}`),
              range: new monaco.Range(
                def.line,
                def.column,
                def.endLine ?? def.line,
                def.endColumn ?? def.column + 1,
              ),
            }));
          } catch {
            return null;
          }
        },
      });

      // Register completion provider (backed by canon_completions tool)
      const completionKindMap: Record<CompletionKind, number> = {
        function: monaco.languages.CompletionItemKind.Function,
        class: monaco.languages.CompletionItemKind.Class,
        interface: monaco.languages.CompletionItemKind.Interface,
        variable: monaco.languages.CompletionItemKind.Variable,
        constant: monaco.languages.CompletionItemKind.Constant,
        type: monaco.languages.CompletionItemKind.TypeParameter,
        enum: monaco.languages.CompletionItemKind.Enum,
        keyword: monaco.languages.CompletionItemKind.Keyword,
        snippet: monaco.languages.CompletionItemKind.Snippet,
        property: monaco.languages.CompletionItemKind.Property,
      };
      const completionDisposable = monaco.languages.registerCompletionItemProvider('*', {
        triggerCharacters: ['.', ':', '<', '/'],
        provideCompletionItems: async (model, position) => {
          const content = model.getValue();
          const uri = model.uri.toString();
          const fName = uri.split('/').pop() ?? fileName;
          const wordInfo = model.getWordUntilPosition(position);
          try {
            const resp = await fetchCompletions(fName, position.lineNumber, position.column, content);
            if (resp.error || !resp.items.length) return { suggestions: [] };
            return {
              suggestions: resp.items.map((item) => ({
                label: item.label,
                kind: completionKindMap[item.kind] ?? monaco.languages.CompletionItemKind.Text,
                detail: item.detail,
                insertText: item.insertText,
                sortText: item.sortText,
                range: new monaco.Range(
                  position.lineNumber,
                  wordInfo.startColumn,
                  position.lineNumber,
                  wordInfo.endColumn,
                ),
              })),
            };
          } catch {
            return { suggestions: [] };
          }
        },
      });

      // Register code action provider (backed by canon_code_actions tool)
      const codeActionKindMap: Record<CodeActionKind, monaco.languages.CodeActionKind> = {
        quickfix: monaco.languages.CodeActionKind.QuickFix,
        refactor: monaco.languages.CodeActionKind.Refactor,
        'refactor.extract': monaco.languages.CodeActionKind.RefactorExtract,
        source: monaco.languages.CodeActionKind.Source,
      };
      const codeActionDisposable = monaco.languages.registerCodeActionProvider('*', {
        provideCodeActions: async (model, range) => {
          const content = model.getValue();
          const uri = model.uri.toString();
          const fName = uri.split('/').pop() ?? fileName;
          try {
            const resp = await fetchCodeActions(
              fName,
              range.startLineNumber,
              range.startColumn,
              range.endLineNumber,
              range.endColumn,
              content,
            );
            if (resp.error || !resp.actions.length) return { actions: [], dispose: () => {} };
            return {
              actions: resp.actions.map((act) => ({
                title: act.title,
                kind: codeActionKindMap[act.kind]?.value ?? act.kind,
                isPreferred: act.isPreferred ?? false,
                diagnostics: [],
                edit: act.edit
                  ? {
                      edits: [
                        {
                          resource: model.uri,
                          textEdit: {
                            range: new monaco.Range(
                              act.edit.range.startLine,
                              act.edit.range.startColumn,
                              act.edit.range.endLine,
                              act.edit.range.endColumn,
                            ),
                            text: act.edit.newText,
                          },
                        },
                      ],
                    }
                  : undefined,
              })),
              dispose: () => {},
            };
          } catch {
            return { actions: [], dispose: () => {} };
          }
        },
      });

      const referenceDisposable = monaco.languages.registerReferenceProvider('*', {
        provideReferences: async (model, position) => {
          const content = model.getValue();
          const uri = model.uri.toString();
          const fName = uri.split('/').pop() ?? fileName;
          try {
            const resp = await fetchFindReferences(
              fName,
              position.lineNumber,
              position.column,
              content,
              true,
            );
            if (resp.error || !resp.references.length) return [];
            return resp.references.map((ref) => ({
              uri: model.uri,
              range: new monaco.Range(ref.line, ref.column, ref.endLine, ref.endColumn),
            }));
          } catch {
            return [];
          }
        },
      });

      const renameDisposable = monaco.languages.registerRenameProvider('*', {
        provideRenameEdits: async (model, position, newName) => {
          const content = model.getValue();
          const uri = model.uri.toString();
          const fName = uri.split('/').pop() ?? fileName;
          try {
            const resp = await fetchRenameSymbol(
              fName,
              position.lineNumber,
              position.column,
              newName,
              content,
            );
            if (resp.error || !resp.edits.length) {
              return { edits: [] };
            }
            return {
              edits: [{
                resource: model.uri,
                textEdit: undefined as never,
                versionId: undefined as never,
                edits: resp.edits.map((e) => ({
                  range: new monaco.Range(e.line, e.column, e.endLine, e.endColumn),
                  text: e.newText,
                })),
              }],
            };
          } catch {
            return { edits: [] };
          }
        },
        resolveRenameLocation: async (model, position) => {
          const content = model.getValue();
          const line = content.split('\n')[position.lineNumber - 1] ?? '';
          const before = line.substring(0, position.column);
          const wordStart = before.search(/[\w$]+$/);
          const fromStart = wordStart >= 0 ? wordStart : position.column - 1;
          const wordMatch = line.substring(fromStart).match(/^[\w$]+/);
          const word = wordMatch?.[0];
          if (!word) {
            return { range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column), text: '', rejectReason: 'No symbol at cursor' };
          }
          return {
            range: new monaco.Range(position.lineNumber, fromStart + 1, position.lineNumber, fromStart + 1 + word.length),
            text: word,
          };
        },
      });

      const signatureHelpDisposable = monaco.languages.registerSignatureHelpProvider('*', {
        signatureHelpTriggerCharacters: ['(', ','],
        signatureHelpRetriggerCharacters: [','],
        provideSignatureHelp: async (model, position) => {
          const content = model.getValue();
          const uri = model.uri.toString();
          const fName = uri.split('/').pop() ?? fileName;
          try {
            const resp = await fetchSignatureHelp(
              fName,
              position.lineNumber,
              position.column,
              content,
            );
            if (resp.error || !resp.signatures.length) {
              return undefined;
            }
            return {
              value: {
                signatures: resp.signatures.map((sig) => ({
                  label: sig.label,
                  documentation: sig.documentation,
                  parameters: sig.parameters.map((p) => ({
                    label: p.label,
                    documentation: p.documentation,
                  })),
                })),
                activeSignature: resp.activeSignature,
                activeParameter: resp.activeParameter,
              },
              dispose: () => {},
            };
          } catch {
            return undefined;
          }
        },
      });

      const documentHighlightDisposable = monaco.languages.registerDocumentHighlightProvider('*', {
        provideDocumentHighlights: async (model, position) => {
          const content = model.getValue();
          const uri = model.uri.toString();
          const fName = uri.split('/').pop() ?? fileName;
          try {
            const resp = await fetchDocumentHighlights(
              fName,
              position.lineNumber,
              position.column,
              content,
            );
            if (resp.error || !resp.highlights.length) {
              return [];
            }
            return resp.highlights.map((h) => ({
              range: new monaco.Range(h.line, h.column, h.endLine, h.endColumn),
              kind: h.kind === 'write'
                ? monaco.languages.DocumentHighlightKind.Write
                : monaco.languages.DocumentHighlightKind.Read,
            }));
          } catch {
            return [];
          }
        },
      });

      // Cleanup providers on unmount
      return () => {
        foldingDisposable.dispose();
        hoverDisposable.dispose();
        definitionDisposable.dispose();
        completionDisposable.dispose();
        codeActionDisposable.dispose();
        referenceDisposable.dispose();
        renameDisposable.dispose();
        signatureHelpDisposable.dispose();
        documentHighlightDisposable.dispose();
      };
    },
    [onCursorChange],
  );

  // Switch theme dynamically when themeName prop changes
  useEffect(() => {
    const mon = monacoRef.current;
    if (mon && themeName) {
      mon.editor.setTheme(themeName);
    }
  }, [themeName]);

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
        theme={themeName}
        onChange={handleChange}
        onMount={handleMount}
        options={{
          readOnly,
          fontSize,
          fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
          lineHeight: 1.6,
          minimap: { enabled: minimap, maxColumn: 80 },
          scrollBeyondLastLine: false,
          wordWrap: wordWrap ? 'on' : 'off',
          padding: { top: 8 },
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          automaticLayout: true,
          folding: true,
          foldingStrategy: 'auto',
          showFoldingControls: 'mouseover',
          glyphMargin: true,
          stickyScroll: { enabled: stickyScroll },
        }}
        loading={
          <div className='canon-monaco-loading'>Loading editor…</div>
        }
      />
    </div>
  );
});
