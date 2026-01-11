import { useState, useEffect, useCallback } from 'react';

// Define the Electron API interface that matches our preload API
interface ElectronAPI {
  appInfo: {
    versions: {
      node: string;
      chrome: string;
      electron: string;
    };
    isElectron: boolean;
    platform: string;
  };
  
  fileSystem: {
    saveOfflineData: (data: any, filename: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    loadOfflineData: (filename: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    listOfflineFiles: () => Promise<{ success: boolean; files?: string[]; error?: string }>;
    deleteOfflineFile: (filename: string) => Promise<{ success: boolean; error?: string }>;
  };
  
  network: {
    isOnline: () => boolean;
    onOnlineStatusChange: (callback: (isOnline: boolean) => void) => () => void;
  };
  
  ipc: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    send: (channel: string, ...args: any[]) => void;
    on: (channel: string, callback: (...args: any[]) => void) => () => void;
    once: (channel: string, callback: (...args: any[]) => void) => void;
  };
  
  // Specialized offline features from preload.js
  offline: {
    exportToExcel: (data: string, defaultFilename?: string) => Promise<{ 
      success: boolean; 
      filePath?: string; 
      canceled?: boolean; 
      error?: string 
    }>;
    getSystemInfo: () => Promise<{
      platform: string;
      arch: string;
      cpus: number;
      memory: {
        total: number;
        free: number;
      };
      hostname: string;
      homedir: string;
      tempdir: string;
      networkInterfaces: Record<string, any[]>;
    }>;
    isServerRunning: () => Promise<boolean>;
  };
}

// Extend the Window interface
declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

/**
 * Custom hook to access Electron functionality
 * Returns an object with Electron API and various states
 */
export function useElectron() {
  // Check if running in Electron
  const isElectron = Boolean(window.electron);
  
  // Network status state
  const [isOnline, setIsOnline] = useState<boolean>(
    isElectron && window.electron ? window.electron.network.isOnline() : navigator.onLine
  );
  
  // Server status
  const [isServerRunning, setIsServerRunning] = useState<boolean>(true);
  
  // Check if server is running (electron only)
  const checkServerStatus = useCallback(async () => {
    if (isElectron) {
      try {
        const status = await window.electron?.ipc.invoke('is-server-running');
        setIsServerRunning(Boolean(status));
      } catch (error) {
        console.error('Failed to check server status:', error);
        setIsServerRunning(false);
      }
    }
  }, [isElectron]);
  
  // Setup online/offline detection
  useEffect(() => {
    // Common online/offline detection for both Electron and web
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    if (isElectron && window.electron) {
      // Use Electron's API
      const unsubscribe = window.electron.network.onOnlineStatusChange((status: boolean) => {
        setIsOnline(status);
      });
      
      // Check server status initially and periodically
      checkServerStatus();
      const interval = setInterval(checkServerStatus, 10000); // every 10 seconds
      
      return () => {
        if (unsubscribe) unsubscribe();
        clearInterval(interval);
      };
    } else {
      // Fallback to web API
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [isElectron, checkServerStatus]);
  
  // File dialog methods
  const openFileDialog = useCallback(async (options: {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: { name: string; extensions: string[] }[];
    properties?: string[];
  } = {}) => {
    if (!isElectron) return { canceled: true };
    return window.electron?.ipc.invoke('open-file-dialog', options);
  }, [isElectron]);
  
  const saveFileDialog = useCallback(async (options: {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: { name: string; extensions: string[] }[];
  } = {}) => {
    if (!isElectron) return { canceled: true };
    return window.electron?.ipc.invoke('save-file-dialog', options);
  }, [isElectron]);
  
  // Offline data management methods
  const saveOfflineData = useCallback(async (data: any, filename: string) => {
    if (!isElectron) {
      try {
        // Fallback to localStorage for web
        localStorage.setItem(`offline_${filename}`, JSON.stringify(data));
        return { success: true };
      } catch (error) {
        console.error('Failed to save offline data:', error);
        return { success: false, error: String(error) };
      }
    }
    
    return window.electron?.fileSystem.saveOfflineData(data, filename);
  }, [isElectron]);
  
  const loadOfflineData = useCallback(async (filename: string) => {
    if (!isElectron) {
      try {
        // Fallback to localStorage for web
        const data = localStorage.getItem(`offline_${filename}`);
        if (data) {
          return { success: true, data: JSON.parse(data) };
        }
        return { success: false, error: 'File not found' };
      } catch (error) {
        console.error('Failed to load offline data:', error);
        return { success: false, error: String(error) };
      }
    }
    
    return window.electron?.fileSystem.loadOfflineData(filename);
  }, [isElectron]);
  
  const listOfflineFiles = useCallback(async () => {
    if (!isElectron) {
      try {
        // Fallback to localStorage for web
        const files = Object.keys(localStorage)
          .filter(key => key.startsWith('offline_'))
          .map(key => key.substring(8)); // Remove 'offline_' prefix
        
        return { success: true, files };
      } catch (error) {
        console.error('Failed to list offline files:', error);
        return { success: false, error: String(error) };
      }
    }
    
    return window.electron?.fileSystem.listOfflineFiles();
  }, [isElectron]);
  
  const deleteOfflineFile = useCallback(async (filename: string) => {
    if (!isElectron) {
      try {
        // Fallback to localStorage for web
        localStorage.removeItem(`offline_${filename}`);
        return { success: true };
      } catch (error) {
        console.error('Failed to delete offline file:', error);
        return { success: false, error: String(error) };
      }
    }
    
    return window.electron?.fileSystem.deleteOfflineFile(filename);
  }, [isElectron]);
  
  // Import spreadsheet for offline processing
  const importSpreadsheet = useCallback(async (filePath: string) => {
    if (!isElectron) return { success: false, error: 'Not supported in web mode' };
    return window.electron?.ipc.invoke('import-spreadsheet', filePath);
  }, [isElectron]);
  
  // Export permits to Excel file
  const exportToExcel = useCallback(async (data: string, defaultFilename?: string) => {
    if (!isElectron) return { success: false, error: 'Not supported in web mode' };
    return window.electron?.offline.exportToExcel(data, defaultFilename);
  }, [isElectron]);
  
  // Get system information
  const getSystemInfo = useCallback(async () => {
    if (!isElectron) {
      return {
        platform: 'web',
        arch: 'unknown',
        cpus: navigator.hardwareConcurrency || 1,
        memory: { total: 0, free: 0 },
        hostname: window.location.hostname,
        homedir: '/',
        tempdir: '/',
        networkInterfaces: {}
      };
    }
    return window.electron?.offline.getSystemInfo();
  }, [isElectron]);
  
  // Check server status directly
  const checkIsServerRunning = useCallback(async () => {
    if (!isElectron) return true;
    try {
      const status = await window.electron?.offline.isServerRunning();
      return Boolean(status);
    } catch (error) {
      console.error('Error checking server status:', error);
      return false;
    }
  }, [isElectron]);

  // Return all the Electron methods and states
  return {
    isElectron,
    isOnline,
    isServerRunning,
    platform: isElectron ? window.electron?.appInfo.platform : 'web',
    openFileDialog,
    saveFileDialog,
    saveOfflineData,
    loadOfflineData,
    listOfflineFiles,
    deleteOfflineFile,
    importSpreadsheet,
    exportToExcel,
    getSystemInfo,
    checkIsServerRunning,
    electron: window.electron
  };
}