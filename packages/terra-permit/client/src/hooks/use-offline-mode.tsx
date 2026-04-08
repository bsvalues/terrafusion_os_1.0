import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineModeContextType {
  isOffline: boolean;
  setOfflineMode: (mode: boolean) => void;
}

// Create context with default values
const OfflineModeContext = createContext<OfflineModeContextType>({
  isOffline: false,
  setOfflineMode: () => {}
});

// Custom hook to access the offline mode context
export const useOfflineMode = () => useContext(OfflineModeContext);

interface OfflineModeProviderProps {
  children: React.ReactNode;
}

// Offline mode provider component
export const OfflineModeProvider: React.FC<OfflineModeProviderProps> = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);
  const { toast } = useToast();
  
  // Listen for network status changes
  useEffect(() => {
    const handleOnline = () => {
      if (isOffline) {
        setIsOffline(false);
        toast({
          title: 'Back online',
          description: 'Your internet connection has been restored.',
          variant: 'default',
        });
      }
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      toast({
        title: 'Offline mode',
        description: 'You are currently offline. Some features may be limited.',
        variant: 'destructive',
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial status
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setIsOffline(true);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOffline, toast]);
  
  // Function to manually set offline mode (for testing)
  const setOfflineMode = (mode: boolean) => {
    setIsOffline(mode);
    if (mode) {
      toast({
        title: 'Offline mode enabled',
        description: 'You have manually enabled offline mode.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Offline mode disabled',
        description: 'You have manually disabled offline mode.',
        variant: 'default',
      });
    }
  };
  
  return (
    <OfflineModeContext.Provider value={{ isOffline, setOfflineMode }}>
      {children}
      
      {/* Offline indicator */}
      {isOffline && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Offline Mode
        </div>
      )}
    </OfflineModeContext.Provider>
  );
};