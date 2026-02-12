'use client';

import axios from 'axios';
import { ChevronDown, ChevronRight, File, Folder, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface FileItem {
  path: string;
  name: string;
  is_dir: boolean;
  size?: number;
  modified?: string;
}

interface Workspace {
  id?: string;
  slug: string;
  name: string;
}

interface FileExplorerProps {
  onFileSelect: (path: string) => void;
  selectedFile?: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect, selectedFile }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['/']));
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load workspaces on mount
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        console.log(
          '[FileExplorer] 📡 Fetching workspaces from http://localhost:8787/api/portal/workspaces'
        );
        const response = await axios.get('http://localhost:8787/api/portal/workspaces');
        console.log('[FileExplorer] ✅ Workspaces response:', response.data);
        const ws = response.data?.workspaces || [];
        console.log('[FileExplorer] 🎯 Parsed workspaces:', ws);
        setWorkspaces(ws);
        // Use terra-levy as default (known to have files in marketplace/terra-levy/frontend)
        const defaultWorkspace = 'terra-levy';
        console.log('[FileExplorer] 🔄 Setting selected workspace to:', defaultWorkspace);
        setSelectedWorkspace(defaultWorkspace);
      } catch (err) {
        console.error('[FileExplorer] ❌ Failed to load workspaces:', err);
        // Fallback to terra-levy on error
        console.log('[FileExplorer] ⚠️ Falling back to default workspace: terra-levy');
        setSelectedWorkspace('terra-levy');
      }
    };
    loadWorkspaces();
  }, []);

  // Load files when workspace changes
  useEffect(() => {
    if (selectedWorkspace) {
      loadFiles('/');
    }
  }, [selectedWorkspace]);

  const loadFiles = async (path: string) => {
    if (!selectedWorkspace) {
      console.log('[FileExplorer] ⚠️ loadFiles called but selectedWorkspace is empty');
      return;
    }
    try {
      setLoading(true);
      const payload = { workspace_id: selectedWorkspace, path };
      console.log('[FileExplorer] 📡 Posting to http://localhost:8787/api/files/list', payload);
      const response = await axios.post('http://localhost:8787/api/files/list', payload);
      console.log('[FileExplorer] ✅ Files response:', response.data);
      const filesData = response.data?.files || [];
      console.log('[FileExplorer] 🎯 Parsed files:', filesData);

      // CRITICAL: Clear error FIRST, then set files
      setError(null);
      setFiles(filesData);

      // Force a debug check after state updates
      setTimeout(() => {
        console.log('[FileExplorer] 📊 STATE AFTER UPDATE (async):', {
          errorCleared: true,
          filesSet: filesData.length,
        });
      }, 100);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('[FileExplorer] ❌ Failed to load files for path:', path, 'Error:', errMsg);
      setError(`Failed to load files: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
      loadFiles(path);
    }
    setExpanded(newExpanded);
  };

  const filteredFiles = files.filter(
    f => !search || f.name.toLowerCase().includes(search.toLowerCase())
  );

  // Debug: Log render state
  console.log('[FileExplorer] 🎨 RENDER STATE:', {
    loading,
    error,
    files: files.length,
    filteredFiles: filteredFiles.length,
    selectedWorkspace,
  });

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* Workspace Selector */}
      <div className="p-3 border-b border-gray-700">
        {workspaces.length > 0 ? (
          <select
            value={selectedWorkspace}
            onChange={e => setSelectedWorkspace(e.target.value)}
            className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:outline-none focus:border-blue-500"
          >
            {workspaces.map(ws => (
              <option key={ws.slug || ws.id} value={ws.slug || ws.id || ''}>
                {ws.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-gray-400">No workspaces available</div>
        )}
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold mb-2">🗂️ Explorer</h3>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4 text-sm text-gray-400">Loading files...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-4 text-sm text-gray-400">No files found</div>
        ) : (
          <div className="py-2">
            {filteredFiles.map(file => (
              <FileTreeItem
                key={file.path}
                file={file}
                expanded={expanded}
                onToggle={toggleExpanded}
                onSelect={onFileSelect}
                isSelected={selectedFile === file.path}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface FileTreeItemProps {
  file: FileItem;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  isSelected: boolean;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  file,
  expanded,
  onToggle,
  onSelect,
  isSelected,
}) => {
  const isExpanded = expanded.has(file.path);

  return (
    <div>
      <div
        className={`px-3 py-1 flex items-center gap-1 cursor-pointer hover:bg-gray-800 transition-colors ${
          isSelected ? 'bg-blue-900 text-blue-100' : 'text-gray-300'
        }`}
        onClick={() => {
          if (file.is_dir) {
            onToggle(file.path);
          } else {
            onSelect(file.path);
          }
        }}
      >
        {file.is_dir ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Folder className="h-4 w-4 text-yellow-500" />
          </>
        ) : (
          <>
            <div className="w-4" />
            <File className="h-4 w-4 text-gray-400" />
          </>
        )}
        <span className="text-sm">{file.name}</span>
      </div>
    </div>
  );
};
