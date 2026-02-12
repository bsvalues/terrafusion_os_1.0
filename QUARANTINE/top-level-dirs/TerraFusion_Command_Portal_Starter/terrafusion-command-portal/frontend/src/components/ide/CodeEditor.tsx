'use client';

import axios from 'axios';
import { Copy, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface CodeEditorProps {
  filePath?: string;
  onClose?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ filePath, onClose }) => {
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('plaintext');
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (filePath) {
      loadFile(filePath);
    }
  }, [filePath]);

  const loadFile = async (path: string) => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:8787/api/files/read', { path });
      setContent(response.data.content || '');
      setLanguage(detectLanguage(path));
      setIsDirty(false);
      setError(null);
    } catch (err) {
      setError('Failed to load file');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const detectLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      rs: 'rust',
      py: 'python',
      go: 'go',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      md: 'markdown',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      dockerfile: 'dockerfile',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sql: 'sql',
    };
    return languageMap[ext] || 'plaintext';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  const handleSave = async () => {
    if (!filePath) return;
    try {
      await axios.post('http://localhost:8787/api/files/write', {
        path: filePath,
        content,
      });
      setIsDirty(false);
      setError(null);
    } catch (err) {
      setError('Failed to save file');
      console.error(err);
    }
  };

  if (!filePath) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-gray-400">
        <File className="h-16 w-16 mb-4 opacity-50" />
        <p>Select a file to edit</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Tab Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-gray-300">{filePath.split('/').pop()}</span>
          {isDirty && <span className="text-red-500">●</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Copy"
          >
            <Copy className="h-4 w-4 text-gray-400" />
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`px-2 py-1 text-sm rounded transition-colors ${
              isDirty
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Save
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded transition-colors">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={e => {
              setContent(e.target.value);
              setIsDirty(true);
            }}
            className="flex-1 p-4 bg-gray-800 text-gray-100 font-mono text-sm border-none outline-none resize-none"
            spellCheck={false}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 border-t border-gray-700 bg-gray-800 text-xs text-gray-400 flex justify-between">
        <span>{language}</span>
        <span>{content.split('\n').length} lines</span>
      </div>
    </div>
  );
};

// Fallback icon if not imported properly
const File = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M4 4a2 2 0 012-2h6a1 1 0 00-.707-.293l-2.828-2.829A1 1 0 008.172 0H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2h-4V4z" />
  </svg>
);
