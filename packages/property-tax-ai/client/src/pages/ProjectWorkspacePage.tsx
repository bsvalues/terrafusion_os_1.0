import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader, Play, Square, Save, FileCode, Settings, Terminal, Code, PanelLeft, PanelRightClose, Sparkles } from 'lucide-react';
import DevelopmentWorkspaceLayout from '../layout/development-workspace-layout';
import { apiRequest } from '@/lib/queryClient';
import FileExplorer from '../components/development/FileExplorer';
import CodeEditor from '../components/development/CodeEditor';
import PreviewPanel from '../components/development/PreviewPanel';
import AICodeAssistant from '../components/development/AICodeAssistant';
import { useToast } from '@/hooks/use-toast';

const ProjectWorkspacePage = () => {
  const [, params] = useRoute<{ projectId: string }>('/development/projects/:projectId');
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [previewStatus, setPreviewStatus] = useState<'STOPPED' | 'RUNNING' | 'ERROR'>('STOPPED');
  const [showFileExplorer, setShowFileExplorer] = useState<boolean>(true);
  const [showAIAssistant, setShowAIAssistant] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('editor');
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);

  // Fetch project details
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: [`/api/development/projects/${params?.projectId}`],
    enabled: !!params?.projectId,
  });

  // Fetch project files
  const { 
    data: fileTree, 
    isLoading: isLoadingFiles,
    refetch: refetchFiles
  } = useQuery({
    queryKey: [`/api/development/projects/${params?.projectId}/files`],
    enabled: !!params?.projectId,
  });

  // Fetch preview status
  const { 
    data: preview, 
    isLoading: isLoadingPreview,
    refetch: refetchPreview
  } = useQuery({
    queryKey: [`/api/development/projects/${params?.projectId}/preview`],
    enabled: !!params?.projectId,
  });

  useEffect(() => {
    if (preview) {
      setPreviewStatus(preview.status);
    }
  }, [preview]);

  // Load file content when a file is selected
  useEffect(() => {
    if (selectedFile) {
      loadFileContent(selectedFile);
    }
  }, [selectedFile]);

  const loadFileContent = async (filePath: string) => {
    try {
      const response = await apiRequest(
        `/api/development/projects/${params?.projectId}/files/${filePath}`,
        { method: 'GET' }
      );
      setFileContent(response.content);
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to load file:', error);
      toast({
        title: "Error",
        description: "Failed to load file content",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (filePath: string) => {
    if (unsavedChanges) {
      // In a real app, confirm before switching files
      const confirmChange = window.confirm('You have unsaved changes. Do you want to continue?');
      if (!confirmChange) return;
    }
    
    setSelectedFile(filePath);
  };

  const handleCodeChange = (value: string) => {
    setFileContent(value);
    setUnsavedChanges(true);
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    
    try {
      await apiRequest(
        `/api/development/projects/${params?.projectId}/files/${selectedFile}`,
        {
          method: 'PUT',
          data: { content: fileContent }
        }
      );
      setUnsavedChanges(false);
      toast({
        title: "Success",
        description: "File saved successfully",
      });
    } catch (error) {
      console.error('Failed to save file:', error);
      toast({
        title: "Error",
        description: "Failed to save file",
        variant: "destructive",
      });
    }
  };

  const togglePreview = async () => {
    try {
      if (previewStatus === 'RUNNING') {
        // Stop preview
        await apiRequest(
          `/api/development/projects/${params?.projectId}/preview/stop`,
          { method: 'POST' }
        );
      } else {
        // Start preview
        await apiRequest(
          `/api/development/projects/${params?.projectId}/preview/start`,
          { method: 'POST' }
        );
      }
      
      // Refresh preview status
      refetchPreview();
    } catch (error) {
      console.error('Preview action failed:', error);
      toast({
        title: "Error",
        description: "Failed to toggle preview",
        variant: "destructive",
      });
    }
  };

  const toggleFileExplorer = () => {
    setShowFileExplorer(!showFileExplorer);
  };

  const toggleAIAssistant = () => {
    setShowAIAssistant(!showAIAssistant);
  };

  const handleInsertCode = (code: string) => {
    setFileContent(prev => {
      // Simple insertion at the end if no file content yet
      if (!prev.trim()) {
        return code;
      }
      
      // Otherwise append with a newline separator
      return `${prev}\n\n${code}`;
    });
    setUnsavedChanges(true);
  };

  // Determine if it's a loading state
  const isLoading = isLoadingProject || isLoadingFiles || isLoadingPreview;

  // Determine file language for syntax highlighting
  const getFileLanguage = () => {
    if (!selectedFile) return 'javascript';
    
    const extension = selectedFile.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'jsx': return 'javascript';
      case 'tsx': return 'typescript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'go': return 'go';
      case 'rs': return 'rust';
      case 'md': return 'markdown';
      default: return 'plaintext';
    }
  };

  if (isLoading) {
    return (
      <DevelopmentWorkspaceLayout>
        <div className="flex items-center justify-center h-full">
          <Loader className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-2">Loading project...</span>
        </div>
      </DevelopmentWorkspaceLayout>
    );
  }

  if (!project) {
    return (
      <DevelopmentWorkspaceLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-gray-500 mb-4">Project not found or unable to load.</p>
          <Button onClick={() => navigate('/development')}>Back to Projects</Button>
        </div>
      </DevelopmentWorkspaceLayout>
    );
  }

  return (
    <DevelopmentWorkspaceLayout>
      {/* Project Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-gray-500">{project.description}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleFileExplorer}
          >
            {showFileExplorer ? <PanelRightClose className="h-4 w-4 mr-1" /> : <PanelLeft className="h-4 w-4 mr-1" />}
            {showFileExplorer ? 'Hide Explorer' : 'Show Explorer'}
          </Button>
          
          <Button
            size="sm"
            onClick={togglePreview}
            disabled={!selectedFile}
            variant={previewStatus === 'RUNNING' ? "destructive" : "default"}
          >
            {previewStatus === 'RUNNING' ? (
              <>
                <Square className="h-4 w-4 mr-1" />
                Stop Preview
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Run Preview
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
        {/* File Explorer */}
        {showFileExplorer && (
          <div className="w-64 border-r overflow-y-auto">
            <FileExplorer 
              files={fileTree || []} 
              onSelectFile={handleFileSelect}
              selectedFile={selectedFile}
              projectId={params?.projectId || ''}
              onRefresh={refetchFiles}
            />
          </div>
        )}
        
        {/* Editor/Preview Area */}
        <div className="flex-1 flex flex-col">
          {/* Editor Tabs */}
          <div className="border-b">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="px-4">
                <TabsTrigger value="editor" className="flex items-center">
                  <FileCode className="h-4 w-4 mr-1" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center">
                  <Code className="h-4 w-4 mr-1" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="terminal" className="flex items-center">
                  <Terminal className="h-4 w-4 mr-1" />
                  Terminal
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center">
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Editor Content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="editor" className="h-full p-0 m-0">
              {selectedFile ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
                    <span className="text-sm font-medium">{selectedFile}</span>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={toggleAIAssistant}
                        disabled={!selectedFile}
                        className={showAIAssistant ? "bg-indigo-100" : ""}
                      >
                        <Sparkles className={`h-4 w-4 mr-1 ${showAIAssistant ? "text-indigo-600" : ""}`} />
                        AI Assistant
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleSaveFile}
                        disabled={!unsavedChanges}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex">
                    <div className={`${showAIAssistant ? 'w-2/3' : 'w-full'} h-full`}>
                      <CodeEditor 
                        value={fileContent} 
                        onChange={handleCodeChange}
                        language={getFileLanguage()}
                      />
                    </div>
                    
                    {showAIAssistant && (
                      <div className="w-1/3 h-full">
                        <AICodeAssistant 
                          projectId={params?.projectId || ''}
                          fileContent={fileContent}
                          filePath={selectedFile}
                          language={getFileLanguage()}
                          onInsertCode={handleInsertCode}
                          onClose={toggleAIAssistant}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Select a file to edit</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="preview" className="h-full p-0 m-0">
              <PreviewPanel 
                projectId={params?.projectId || ''} 
                status={previewStatus} 
                onTogglePreview={togglePreview}
              />
            </TabsContent>
            
            <TabsContent value="terminal" className="h-full p-4 m-0 bg-gray-900 text-gray-100 font-mono text-sm overflow-auto">
              <p>$ npm run dev</p>
              <p className="text-green-400">Starting development server...</p>
              <p className="text-gray-300">Project is running at http://localhost:3000</p>
            </TabsContent>
            
            <TabsContent value="settings" className="h-full p-4 m-0">
              <h3 className="text-lg font-medium mb-4">Project Settings</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Project Name</p>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded" 
                    value={project.name} 
                    readOnly 
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Type</p>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded" 
                    value={project.type} 
                    readOnly 
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Language</p>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded" 
                    value={project.language} 
                    readOnly 
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </div>
      </div>
    </DevelopmentWorkspaceLayout>
  );
};

export default ProjectWorkspacePage;