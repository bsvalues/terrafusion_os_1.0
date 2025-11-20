import { Code, Play, Save } from 'lucide-react';
import * as monaco from 'monaco-editor';
import React, { useEffect, useRef, useState } from 'react';

interface CodeEditorProps {
  filePath: string | null;
  onSave?: (content: string) => void;
  onRun?: (content: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ filePath, onSave, onRun }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [content, setContent] = useState<string>('');
  const [language, setLanguage] = useState<string>('typescript');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    // Configure Monaco editor theme
    monaco.editor.defineTheme('terrafusion-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0A0E1A',
        'editor.foreground': '#FFFFFF',
        'editorLineNumber.foreground': '#00FFFF',
        'editor.selectionBackground': '#00FFFF33',
        'editor.lineHighlightBackground': '#1E293B',
      },
    });

    const monacoEditor = monaco.editor.create(editorRef.current, {
      value: content,
      language: language,
      theme: 'terrafusion-dark',
      automaticLayout: true,
      fontSize: 14,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      tabSize: 2,
      insertSpaces: true,
    });

    // Track changes
    monacoEditor.onDidChangeModelContent(() => {
      setContent(monacoEditor.getValue());
      setIsDirty(true);
    });

    // Keyboard shortcuts
    monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    setEditor(monacoEditor);

    return () => {
      monacoEditor.dispose();
    };
  }, []);

  useEffect(() => {
    if (filePath) {
      loadFile(filePath);
    }
  }, [filePath]);

  const loadFile = async (path: string) => {
    try {
      const response = await fetch(`/api/filesystem/read?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      const fileContent = data.content || '';
      const detectedLanguage = detectLanguage(path);

      if (editor) {
        const model = monaco.editor.createModel(fileContent, detectedLanguage);
        editor.setModel(model);
        setContent(fileContent);
        setLanguage(detectedLanguage);
        setIsDirty(false);
      }
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  };

  const detectLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      json: 'json',
      css: 'css',
      scss: 'scss',
      html: 'html',
      md: 'markdown',
      py: 'python',
      cs: 'csharp',
      rs: 'rust',
      go: 'go',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      sh: 'shell',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      sql: 'sql',
    };
    return languageMap[ext] || 'plaintext';
  };

  const handleSave = async () => {
    if (!filePath || !editor) return;

    try {
      await fetch('/api/filesystem/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          content: editor.getValue(),
        }),
      });
      setIsDirty(false);
      if (onSave) {
        onSave(editor.getValue());
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const handleRun = () => {
    if (editor && onRun) {
      onRun(editor.getValue());
    }
  };

  return (
    <div className='h-full flex flex-col bg-terra-midnight'>
      {/* Toolbar */}
      <div className='flex items-center justify-between px-4 py-2 border-b border-terra-cyan/20'>
        <div className='flex items-center space-x-2'>
          <Code size={18} className='text-terra-cyan' />
          <span className='text-sm text-white'>
            {filePath || 'No file open'}
            {isDirty && <span className='text-terra-cyan ml-2'>●</span>}
          </span>
        </div>
        <div className='flex items-center space-x-2'>
          <button
            onClick={handleSave}
            disabled={!isDirty || !filePath}
            className='px-3 py-1 bg-terra-cyan/20 hover:bg-terra-cyan/30 text-terra-cyan rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1'
          >
            <Save size={16} />
            <span className='text-sm'>Save</span>
          </button>
          {onRun && (
            <button
              onClick={handleRun}
              disabled={!filePath}
              className='px-3 py-1 bg-terra-cyan/20 hover:bg-terra-cyan/30 text-terra-cyan rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1'
            >
              <Play size={16} />
              <span className='text-sm'>Run</span>
            </button>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div ref={editorRef} className='flex-1' />
    </div>
  );
};

export default CodeEditor;
