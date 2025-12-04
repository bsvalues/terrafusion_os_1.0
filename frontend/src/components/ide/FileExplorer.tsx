import { ChevronDown, ChevronRight, File, Folder, FolderOpen } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface FileExplorerProps {
  onFileSelect: (path: string) => void;
  rootPath: string;
  workspaceIds?: string[]; // optional workspace selector list
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect, rootPath, workspaceIds }) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentRoot, setCurrentRoot] = useState(rootPath);

  useEffect(() => {
    fetchFiles(currentRoot);
  }, [currentRoot]);

  const fetchFiles = async (path: string) => {
    try {
      const response = await fetch(`/api/filesystem/browse?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };

  const toggleFolder = async (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (expandedFolders.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
      // Fetch children if not already loaded
      const response = await fetch(`/api/filesystem/browse?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      updateNodeChildren(files, path, data.files);
    }
    setExpandedFolders(newExpanded);
  };

  const updateNodeChildren = (nodes: FileNode[], targetPath: string, children: FileNode[]) => {
    for (const node of nodes) {
      if (node.path === targetPath) {
        node.children = children;
        setFiles([...files]);
        return true;
      }
      if (node.children && updateNodeChildren(node.children, targetPath, children)) {
        return true;
      }
    }
    return false;
  };

  const handleFileClick = (node: FileNode) => {
    if (node.type === 'file') {
      setSelectedFile(node.path);
      onFileSelect(node.path);
    } else {
      toggleFolder(node.path);
    }
  };

  const renderNode = (node: FileNode, level: number = 0): JSX.Element => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;
    const isFolder = node.type === 'directory';

    return (
      <div key={node.path}>
        <div
          className={`flex items-center px-2 py-1 cursor-pointer hover:bg-terra-slate/30 ${
            isSelected ? 'bg-terra-cyan/20 border-l-2 border-terra-cyan' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleFileClick(node)}
        >
          {isFolder && (
            <span className='mr-1 text-terra-cyan'>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          )}
          <span className='mr-2 text-terra-cyan'>
            {isFolder ? (
              isExpanded ? (
                <FolderOpen size={16} />
              ) : (
                <Folder size={16} />
              )
            ) : (
              <File size={16} />
            )}
          </span>
          <span className='text-sm text-white'>{node.name}</span>
        </div>
        {isFolder && isExpanded && node.children && (
          <div>{node.children.map((child) => renderNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className='h-full overflow-y-auto bg-terra-midnight border-r border-terra-cyan/20'>
      <div className='p-2 border-b border-terra-cyan/20'>
        <h3 className='text-sm font-semibold text-terra-cyan'>EXPLORER</h3>
        {workspaceIds && workspaceIds.length > 0 && (
          <select
            className='mt-2 w-full bg-terra-slate text-white text-sm px-2 py-1 rounded border border-terra-cyan/40'
            value={currentRoot}
            onChange={(e) => {
              setExpandedFolders(new Set());
              setSelectedFile(null);
              setCurrentRoot(`workspaces/${e.target.value}`);
            }}
          >
            {workspaceIds.map((id) => (
              <option key={id} value={`workspaces/${id}`}>
                {id}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className='py-2'>{files.map((node) => renderNode(node))}</div>
    </div>
  );
};

export default FileExplorer;
