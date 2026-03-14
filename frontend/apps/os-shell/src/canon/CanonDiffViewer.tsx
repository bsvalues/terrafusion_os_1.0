/**
 * CanonDiffViewer — Side-by-side diff comparison using Monaco DiffEditor.
 *
 * Renders two file contents in a Monaco DiffEditor with language detection.
 * Supports inline/side-by-side toggle and read-only comparison.
 *
 * @see Phase N: Diff Viewer
 */
import { DiffEditor, type DiffOnMount } from '@monaco-editor/react';
import React, { useCallback, useRef, useState } from 'react';
import { CANON_THEME_NAME, canonEditorTheme } from './canonEditorTheme';
import { detectLanguage } from './CanonEditor';

export interface DiffViewerProps {
  leftPath: string;
  rightPath: string;
  leftContent: string;
  rightContent: string;
}

export function CanonDiffViewer({ leftPath, rightPath, leftContent, rightContent }: DiffViewerProps): React.ReactElement {
  const [renderSideBySide, setRenderSideBySide] = useState(true);
  const editorRef = useRef<ReturnType<Parameters<DiffOnMount>[0]> extends void ? never : unknown>(null);

  const language = detectLanguage(leftPath) || detectLanguage(rightPath) || 'plaintext';
  const leftFileName = leftPath.split('/').pop() ?? leftPath;
  const rightFileName = rightPath.split('/').pop() ?? rightPath;

  const handleMount: DiffOnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    // Register the canon theme if not already registered
    monaco.editor.defineTheme(CANON_THEME_NAME, canonEditorTheme as Parameters<typeof monaco.editor.defineTheme>[1]);
    monaco.editor.setTheme(CANON_THEME_NAME);
  }, []);

  return (
    <div className='canon-diff-viewer'>
      <div className='canon-diff-viewer__toolbar'>
        <div className='canon-diff-viewer__labels'>
          <span className='canon-diff-viewer__label canon-diff-viewer__label--left' title={leftPath}>
            ← {leftFileName}
          </span>
          <span className='canon-diff-viewer__label canon-diff-viewer__label--right' title={rightPath}>
            {rightFileName} →
          </span>
        </div>
        <button
          className={`canon-diff-viewer__toggle ${renderSideBySide ? 'canon-diff-viewer__toggle--active' : ''}`}
          onClick={() => setRenderSideBySide((prev) => !prev)}
          title={renderSideBySide ? 'Switch to inline diff' : 'Switch to side-by-side diff'}
        >
          {renderSideBySide ? '⇔ Side-by-side' : '⇕ Inline'}
        </button>
      </div>
      <div className='canon-diff-viewer__surface'>
        <DiffEditor
          original={leftContent}
          modified={rightContent}
          language={language}
          theme={CANON_THEME_NAME}
          onMount={handleMount}
          options={{
            readOnly: true,
            renderSideBySide,
            originalEditable: false,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 12,
            lineNumbers: 'on',
            renderOverviewRuler: false,
            diffWordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
}
