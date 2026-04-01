import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: string;
  height?: string;
  theme?: 'light' | 'dark';
  readOnly?: boolean;
  options?: editor.IStandaloneEditorConstructionOptions;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'javascript',
  height = '100%',
  theme = 'light',
  readOnly = false,
  options = {}
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure Monaco editor settings
    editor.updateOptions({
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      ...options
    });
    
    // Add additional language support if needed
    configureMonaco(monaco);
  };

  const configureMonaco = (monaco: Monaco) => {
    // Here we can register custom languages, themes, or completions
    // Example: Register custom themes or language extensions for assessment-specific languages
    monaco.editor.defineTheme('assessment-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1a1d23',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2a2e37',
        'editorLineNumber.foreground': '#6e7681',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#d4d4d4'
      }
    });
  };

  // Map language names to Monaco's format
  const getMonacoLanguage = () => {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return 'javascript';
      case 'typescript':
      case 'ts':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'python':
      case 'py':
        return 'python';
      case 'json':
        return 'json';
      case 'sql':
        return 'sql';
      // Assessment-specific languages can be added here
      default:
        return language.toLowerCase();
    }
  };

  return (
    <div 
      className={cn(
        "h-full overflow-hidden border rounded-md",
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      )}
      style={{ height }}
    >
      <Editor
        height="100%"
        language={getMonacoLanguage()}
        value={value}
        onChange={onChange}
        theme={theme === 'dark' ? 'assessment-dark' : 'light'}
        options={{
          readOnly,
          fontSize: 14,
          wordWrap: 'on',
          renderLineHighlight: 'all',
          renderWhitespace: 'selection',
          ...options
        }}
        onMount={handleEditorDidMount}
        loading={<div className="flex items-center justify-center h-full">Loading editor...</div>}
      />
    </div>
  );
};

export default CodeEditor;