/**
 * Dynamic File Explorer Component
 * Integrates with parent TerraFusion system for real file operations
 */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FileSystemService, FileNode, ModuleStructure } from '../services/FileSystemService';
import { TFCard, TFHeading, TFButton } from './SimpleTerraFusion';
import { Folder, File, FolderOpen, Plus, Play, Save } from 'lucide-react';

const ExplorerContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  padding: var(--tf-spacing-md);
`;

const FileTree = styled.div`
  font-size: 0.875rem;
  color: var(--tf-color-light);
`;

const FileItem = styled.div<{ level: number; isSelected?: boolean }>`
  display: flex;
  align-items: center;
  padding: var(--tf-spacing-xs) var(--tf-spacing-sm);
  padding-left: ${props => props.level * 16 + 8}px;
  cursor: pointer;
  border-radius: var(--tf-radius-sm);
  margin-bottom: 2px;
  background: ${props => props.isSelected ? 'rgba(0, 153, 255, 0.2)' : 'transparent'};
  
  &:hover {
    background: rgba(0, 153, 255, 0.1);
  }
  
  svg {
    margin-right: var(--tf-spacing-xs);
    width: 16px;
    height: 16px;
  }
`;

const ActionsBar = styled.div`
  display: flex;
  gap: var(--tf-spacing-xs);
  margin-bottom: var(--tf-spacing-md);
  padding: var(--tf-spacing-sm);
  background: rgba(26, 31, 58, 0.5);
  border-radius: var(--tf-radius-md);
`;

interface FileExplorerProps {
  onFileSelect?: (file: FileNode) => void;
  onFileContent?: (content: string) => void;
  selectedFile?: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ 
  onFileSelect, 
  onFileContent,
  selectedFile 
}) => {
  const [modules, setModules] = useState<ModuleStructure[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [fileSystem] = useState(() => FileSystemService.getInstance());

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setLoading(true);
    try {
      const moduleList = await fileSystem.getModules();
      setModules(moduleList);
      
      // Auto-select TerraFusionIDE if available
      const ideModule = moduleList.find(m => m.name === 'TerraFusionIDE');
      if (ideModule) {
        setSelectedModule(ideModule.path);
        loadModuleFiles(ideModule.path);
      }
    } catch (error) {
      console.error('Failed to load modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModuleFiles = async (modulePath: string) => {
    try {
      const files = await fileSystem.getModuleFiles(modulePath);
      setModules(prev => prev.map(module => 
        module.path === modulePath 
          ? { ...module, files }
          : module
      ));
      setExpandedNodes(prev => new Set([...prev, modulePath]));
    } catch (error) {
      console.error('Failed to load module files:', error);
    }
  };

  const toggleNode = async (path: string, isDirectory: boolean) => {
    if (isDirectory) {
      const isExpanded = expandedNodes.has(path);
      if (isExpanded) {
        setExpandedNodes(prev => {
          const next = new Set(prev);
          next.delete(path);
          return next;
        });
      } else {
        setExpandedNodes(prev => new Set([...prev, path]));
        // Load files if this is a module directory
        const module = modules.find(m => m.path === path);
        if (module && module.files.length === 0) {
          await loadModuleFiles(path);
        }
      }
    } else {
      // File selected
      const file = findFileByPath(path);
      if (file && onFileSelect) {
        onFileSelect(file);
        
        // Load file content
        try {
          const content = await fileSystem.readFile(path);
          if (onFileContent) {
            onFileContent(content);
          }
        } catch (error) {
          console.error('Failed to load file content:', error);
        }
      }
    }
  };

  const findFileByPath = (path: string): FileNode | undefined => {
    const searchInFiles = (files: FileNode[]): FileNode | undefined => {
      for (const file of files) {
        if (file.path === path) {
          return file;
        }
        if (file.children) {
          const found = searchInFiles(file.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    for (const module of modules) {
      const found = searchInFiles(module.files);
      if (found) return found;
    }
    return undefined;
  };

  const renderFileNode = (file: FileNode, level: number): React.ReactNode => {
    const isExpanded = expandedNodes.has(file.path);
    const isSelected = selectedFile === file.path;
    const hasChildren = file.children && file.children.length > 0;

    return (
      <div key={file.path}>
        <FileItem
          level={level}
          isSelected={isSelected}
          onClick={() => toggleNode(file.path, file.type === 'directory')}
        >
          {file.type === 'directory' ? (
            isExpanded ? <FolderOpen /> : <Folder />
          ) : (
            <File />
          )}
          {file.name}
        </FileItem>
        {file.type === 'directory' && isExpanded && hasChildren && (
          <div>
            {file.children!.map(child => renderFileNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleCreateModule = async () => {
    const moduleName = prompt('Enter module name:');
    if (moduleName) {
      const success = await fileSystem.createModule({
        name: moduleName,
        type: 'government',
        description: `${moduleName} - Government module for TerraFusion OS`
      });
      
      if (success) {
        loadModules(); // Refresh the module list
      } else {
        alert('Failed to create module. Check console for details.');
      }
    }
  };

  const handleRunModule = async () => {
    if (selectedModule) {
      try {
        const result = await fileSystem.runModule(selectedModule);
        alert(result.success ? result.output : `Error: ${result.errors?.join('\n')}`);
      } catch (error) {
        alert('Failed to run module');
      }
    }
  };

  const handleCompileModule = async () => {
    if (selectedModule) {
      try {
        const result = await fileSystem.compileModule(selectedModule);
        alert(result.success ? result.output : `Compilation errors:\n${result.errors?.join('\n')}`);
      } catch (error) {
        alert('Failed to compile module');
      }
    }
  };

  if (loading) {
    return (
      <ExplorerContainer>
        <div style={{ textAlign: 'center', padding: 'var(--tf-spacing-lg)' }}>
          <div style={{ color: 'var(--tf-color-transcend)' }}>Loading modules...</div>
        </div>
      </ExplorerContainer>
    );
  }

  return (
    <ExplorerContainer>
      <TFHeading level={4} style={{ marginBottom: 'var(--tf-spacing-md)' }}>
        Explorer
      </TFHeading>

      <ActionsBar>
        <TFButton variant="ghost" size="sm" onClick={handleCreateModule}>
          <Plus size={14} />
        </TFButton>
        <TFButton variant="ghost" size="sm" onClick={handleCompileModule}>
          <Save size={14} />
        </TFButton>
        <TFButton variant="ghost" size="sm" onClick={handleRunModule}>
          <Play size={14} />
        </TFButton>
      </ActionsBar>

      <TFCard variant="elevated" style={{ padding: 'var(--tf-spacing-md)', marginBottom: 'var(--tf-spacing-md)' }}>
        <TFHeading level={5} style={{ marginBottom: 'var(--tf-spacing-sm)' }}>
          TerraFusion Modules
        </TFHeading>
        
        <FileTree>
          {modules.map(module => (
            <div key={module.path}>
              <FileItem
                level={0}
                isSelected={selectedModule === module.path}
                onClick={() => {
                  setSelectedModule(module.path);
                  toggleNode(module.path, true);
                }}
              >
                <Folder />
                {module.name}
                <span style={{ 
                  marginLeft: 'auto', 
                  fontSize: '0.75rem', 
                  color: 'var(--tf-color-accent)',
                  textTransform: 'uppercase'
                }}>
                  {module.type}
                </span>
              </FileItem>
              {expandedNodes.has(module.path) && module.files.length > 0 && (
                <div>
                  {module.files.map(file => renderFileNode(file, 1))}
                </div>
              )}
            </div>
          ))}
        </FileTree>
      </TFCard>

      <TFCard variant="elevated" style={{ padding: 'var(--tf-spacing-md)' }}>
        <TFHeading level={5} style={{ marginBottom: 'var(--tf-spacing-sm)' }}>
          Templates
        </TFHeading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tf-spacing-xs)' }}>
          <TFButton variant="ghost" size="sm" style={{ justifyContent: 'flex-start' }}>
            Government Module
          </TFButton>
          <TFButton variant="ghost" size="sm" style={{ justifyContent: 'flex-start' }}>
            Property Manager
          </TFButton>
          <TFButton variant="ghost" size="sm" style={{ justifyContent: 'flex-start' }}>
            AI Agent
          </TFButton>
          <TFButton variant="ghost" size="sm" style={{ justifyContent: 'flex-start' }}>
            GIS Module
          </TFButton>
        </div>
      </TFCard>
    </ExplorerContainer>
  );
};
