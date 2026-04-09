import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ExtensionService, Extension, WebviewInfo } from '@/services/extension-service';

interface ExtensionContextType {
  extensionService: ExtensionService;
  extensions: Extension[];
  webviews: WebviewInfo[];
  activeExtensions: Extension[];
  isLoading: boolean;
  error: string | null;
  refreshExtensions: () => Promise<void>;
  activateExtension: (extensionId: string) => Promise<void>;
  deactivateExtension: (extensionId: string) => Promise<void>;
  executeCommand: (commandId: string, args?: any[]) => Promise<any>;
  updateExtensionSettings: (extensionId: string, settings: Record<string, any>) => Promise<void>;
}

const ExtensionContext = createContext<ExtensionContextType | undefined>(undefined);

interface ExtensionProviderProps {
  children: ReactNode;
}

export function ExtensionProvider({ children }: ExtensionProviderProps) {
  const [extensionService] = useState(() => new ExtensionService());
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [webviews, setWebviews] = useState<WebviewInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExtensions = async () => {
    try {
      const fetchedExtensions = await extensionService.getExtensions();
      setExtensions(fetchedExtensions);
      return fetchedExtensions;
    } catch (err) {
      console.error('Error fetching extensions:', err);
      setError('Failed to load extensions');
      return [];
    }
  };

  const fetchWebviews = async () => {
    try {
      const fetchedWebviews = await extensionService.getWebviews();
      setWebviews(fetchedWebviews);
    } catch (err) {
      console.error('Error fetching webviews:', err);
      setError('Failed to load webviews');
    }
  };

  const refreshExtensions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchExtensions(),
        fetchWebviews()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshExtensions();
  }, []);

  const activateExtension = async (extensionId: string) => {
    try {
      await extensionService.activateExtension(extensionId);
      refreshExtensions();
    } catch (err) {
      console.error(`Error activating extension ${extensionId}:`, err);
      throw err;
    }
  };

  const deactivateExtension = async (extensionId: string) => {
    try {
      await extensionService.deactivateExtension(extensionId);
      refreshExtensions();
    } catch (err) {
      console.error(`Error deactivating extension ${extensionId}:`, err);
      throw err;
    }
  };

  const executeCommand = async (commandId: string, args?: any[]) => {
    try {
      return await extensionService.executeCommand(commandId, args);
    } catch (err) {
      console.error(`Error executing command ${commandId}:`, err);
      throw err;
    }
  };

  const updateExtensionSettings = async (extensionId: string, settings: Record<string, any>) => {
    try {
      await extensionService.updateExtensionSettings(extensionId, settings);
      refreshExtensions();
    } catch (err) {
      console.error(`Error updating extension settings for ${extensionId}:`, err);
      throw err;
    }
  };

  const activeExtensions = extensions.filter(ext => ext.isActive);

  const value = {
    extensionService,
    extensions,
    webviews,
    activeExtensions,
    isLoading,
    error,
    refreshExtensions,
    activateExtension,
    deactivateExtension,
    executeCommand,
    updateExtensionSettings,
  };

  return (
    <ExtensionContext.Provider value={value}>
      {children}
    </ExtensionContext.Provider>
  );
}

export function useExtension() {
  const context = useContext(ExtensionContext);
  if (context === undefined) {
    throw new Error('useExtension must be used within an ExtensionProvider');
  }
  return context;
}