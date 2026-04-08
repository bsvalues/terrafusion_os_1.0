import { useEffect, useState, useCallback } from 'react';
import { ExtensionService, ExtensionCommandParams } from '@/services/extension-service';
import { useToast } from '@/hooks/use-toast';

export function useExtensionService() {
  const extensionService = ExtensionService.getInstance();
  const { toast } = useToast();
  const [activeWebviews, setActiveWebviews] = useState<{ id: string, title: string }[]>([]);
  
  // Register for webview changes
  useEffect(() => {
    const unsubscribe = extensionService.subscribeToWebviewChanges((webviews) => {
      setActiveWebviews(webviews);
    });
    
    // Initialize with current state
    setActiveWebviews(extensionService.getActiveWebviews());
    
    return () => unsubscribe();
  }, [extensionService]);
  
  // Execute a command
  const executeCommand = useCallback(async (command: string, params: ExtensionCommandParams = {}) => {
    try {
      return await extensionService.executeCommand(command, params);
    } catch (error) {
      toast({
        title: 'Extension Error',
        description: error instanceof Error ? error.message : 'Failed to execute extension command',
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [extensionService, toast]);
  
  // Open a webview
  const openWebview = useCallback((id: string, title: string) => {
    extensionService.openWebview(id, title);
  }, [extensionService]);
  
  // Close a webview
  const closeWebview = useCallback((id: string) => {
    extensionService.closeWebview(id);
  }, [extensionService]);
  
  return {
    executeCommand,
    openWebview,
    closeWebview,
    activeWebviews,
  };
}