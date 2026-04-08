import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderPlus, 
  FilePlus, 
  RefreshCw,
  Trash2,
  FileCode,
  FileText,
  FileJson
} from 'lucide-react';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'FILE' | 'DIRECTORY';
  children?: FileNode[];
}

interface FileExplorerProps {
  files: FileNode[];
  onSelectFile: (filePath: string) => void;
  selectedFile: string | null;
  projectId: string;
  onRefresh: () => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, 
  onSelectFile, 
  selectedFile,
  projectId,
  onRefresh
}) => {
  const { toast } = useToast();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [newItemPath, setNewItemPath] = useState<string>('');
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemType, setNewItemType] = useState<'FILE' | 'DIRECTORY'>('FILE');

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <FileCode className="h-4 w-4 text-yellow-500" />;
      case 'json':
        return <FileJson className="h-4 w-4 text-green-500" />;
      case 'md':
      case 'txt':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'html':
        return <FileCode className="h-4 w-4 text-orange-500" />;
      case 'css':
      case 'scss':
        return <FileCode className="h-4 w-4 text-purple-500" />;
      case 'py':
        return <FileCode className="h-4 w-4 text-blue-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleNewItem = (type: 'FILE' | 'DIRECTORY', parentPath: string = '') => {
    setIsCreatingFile(type === 'FILE');
    setIsCreatingFolder(type === 'DIRECTORY');
    setNewItemType(type);
    setNewItemPath(parentPath);
    setNewItemName('');
  };

  const handleCreateItem = async () => {
    if (!newItemName.trim()) {
      toast({
        title: "Error",
        description: "Name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const fullPath = newItemPath ? `${newItemPath}/${newItemName}` : newItemName;
      
      await apiRequest(`/api/development/projects/${projectId}/files`, {
        method: 'POST',
        data: {
          path: fullPath,
          name: newItemName,
          type: newItemType,
          content: newItemType === 'FILE' ? '' : undefined,
        },
      });

      toast({
        title: "Success",
        description: `${newItemType === 'FILE' ? 'File' : 'Folder'} created successfully`,
      });

      // Reset states
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      setNewItemName('');
      
      // Expand the parent folder if we created an item inside it
      if (newItemPath) {
        setExpandedFolders(prev => new Set([...prev, newItemPath]));
      }
      
      // Refresh the file tree
      onRefresh();
    } catch (error) {
      console.error(`Failed to create ${newItemType.toLowerCase()}:`, error);
      toast({
        title: "Error",
        description: `Failed to create ${newItemType.toLowerCase()}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (path: string, type: 'FILE' | 'DIRECTORY') => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this ${type === 'FILE' ? 'file' : 'folder'}?${
        type === 'DIRECTORY' ? ' This will delete all contents inside it.' : ''
      }`
    );

    if (!confirmDelete) return;

    try {
      await apiRequest(`/api/development/projects/${projectId}/files/${path}`, {
        method: 'DELETE',
      });

      toast({
        title: "Success",
        description: `${type === 'FILE' ? 'File' : 'Folder'} deleted successfully`,
      });

      // Refresh the file tree
      onRefresh();
    } catch (error) {
      console.error(`Failed to delete ${type.toLowerCase()}:`, error);
      toast({
        title: "Error",
        description: `Failed to delete ${type.toLowerCase()}`,
        variant: "destructive",
      });
    }
  };

  const renderFileTree = (nodes: FileNode[], level: number = 0) => {
    return nodes.map((node) => {
      const isFolder = node.type === 'DIRECTORY';
      const isExpanded = expandedFolders.has(node.path);
      const isSelected = selectedFile === node.path;
      
      return (
        <div key={node.path} style={{ paddingLeft: `${level * 12}px` }}>
          <ContextMenu>
            <ContextMenuTrigger>
              <div 
                className={cn(
                  "flex items-center py-1 px-2 text-sm rounded-md cursor-pointer hover:bg-gray-100",
                  isSelected && "bg-indigo-100 text-indigo-800 font-medium"
                )}
                onClick={() => {
                  if (isFolder) {
                    toggleFolder(node.path);
                  } else {
                    onSelectFile(node.path);
                  }
                }}
              >
                {isFolder ? (
                  <button 
                    className="mr-1 focus:outline-none" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolder(node.path);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                ) : (
                  <span className="w-4 h-4 mr-1"></span>
                )}
                
                {isFolder ? (
                  <Folder className="h-4 w-4 text-blue-500 mr-2" />
                ) : (
                  <span className="mr-2">{getFileIcon(node.name)}</span>
                )}
                
                <span className="truncate">{node.name}</span>
              </div>
            </ContextMenuTrigger>
            
            <ContextMenuContent>
              {isFolder && (
                <>
                  <ContextMenuItem onClick={() => handleNewItem('FILE', node.path)}>
                    <FilePlus className="h-4 w-4 mr-2" />
                    New File
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleNewItem('DIRECTORY', node.path)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                </>
              )}
              
              <ContextMenuItem onClick={() => handleDeleteItem(node.path, node.type)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {isFolder ? 'Folder' : 'File'}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          
          {isFolder && isExpanded && node.children && node.children.length > 0 && (
            <div className="mt-1">
              {renderFileTree(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b">
        <h3 className="text-sm font-medium">Files</h3>
        
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            title="New File"
            onClick={() => handleNewItem('FILE')}
          >
            <FilePlus className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            title="New Folder"
            onClick={() => handleNewItem('DIRECTORY')}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            title="Refresh"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {(isCreatingFile || isCreatingFolder) && (
        <div className="p-2 border-b">
          <p className="text-xs font-medium mb-1">
            New {isCreatingFile ? 'File' : 'Folder'}
            {newItemPath && ` in ${newItemPath}`}
          </p>
          
          <div className="flex items-center space-x-2">
            <Input
              size={1}
              placeholder={isCreatingFile ? "filename.js" : "folder name"}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
            
            <Button 
              size="sm" 
              className="h-8" 
              onClick={handleCreateItem}
            >
              Create
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-2">
        {files && files.length > 0 ? (
          renderFileTree(files)
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Folder className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-sm">No files yet</p>
            <p className="text-xs text-gray-400">Create a new file or folder to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;