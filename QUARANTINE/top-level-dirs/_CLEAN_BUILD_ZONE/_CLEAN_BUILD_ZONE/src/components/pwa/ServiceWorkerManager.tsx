import React, { useEffect, useState, useCallback } from 'react';
import { Snackbar, Alert, Button, Box } from '@mui/material';

/**
 * Service Worker Manager - PWA functionality for Terrafusion OS
 * Handles offline capabilities, background sync, and app updates
 */

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isOffline: boolean;
  registration: ServiceWorkerRegistration | null;
}

export const ServiceWorkerManager: React.FC = () => {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdateAvailable: false,
    isOffline: !navigator.onLine,
    registration: null
  });

  const [notifications, setNotifications] = useState<{
    show: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
    action?: () => void;
    actionLabel?: string;
  }>({
    show: false,
    message: '',
    severity: 'info'
  });

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!swState.isSupported) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      setSwState(prev => ({ ...prev, isRegistered: true, registration }));
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content available
                setSwState(prev => ({ ...prev, isUpdateAvailable: true }));
                showNotification(
                  'App update available!',
                  'info',
                  () => updateApp(),
                  'Update'
                );
              } else {
                // Content cached for offline use
                showNotification(
                  'App ready for offline use!',
                  'success'
                );
              }
            }
          });
        }
      });

      // Service Worker registered successfully
    } catch (error) {
      // Service Worker registration failed
      setSwState(prev => ({ ...prev, isSupported: false }));
    }
  }, [swState.isSupported]);

  // Update app
  const updateApp = useCallback(() => {
    if (swState.registration?.waiting) {
      swState.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [swState.registration]);

  // Show notification
  const showNotification = useCallback((
    message: string, 
    severity: 'success' | 'info' | 'warning' | 'error',
    action?: () => void,
    actionLabel?: string
  ) => {
    setNotifications({
      show: true,
      message,
      severity,
      action,
      actionLabel
    });
  }, []);

  // Handle offline/online status
  useEffect(() => {
    const handleOnline = () => {
      setSwState(prev => ({ ...prev, isOffline: false }));
      showNotification('Back online!', 'success');
    };

    const handleOffline = () => {
      setSwState(prev => ({ ...prev, isOffline: true }));
      showNotification('You are offline. App will continue to work!', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showNotification]);

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, [registerServiceWorker]);

  // Listen for service worker messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_UPDATE') {
        setSwState(prev => ({ ...prev, isUpdateAvailable: true }));
        showNotification(
          'App update ready!',
          'info',
          () => updateApp(),
          'Reload'
        );
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, [showNotification, updateApp]);

  // Background sync for module data
  const _syncModuleData = useCallback(async () => {
    if (swState.registration?.sync) {
      try {
        await swState.registration.sync.register('module-data-sync');
        // Background sync registered for module data
      } catch (error) {
        // Background sync registration failed
        setSwState(prev => ({ ...prev, isOffline: true }));
      }
    }
  }, [swState.registration]);

  // Export app data for offline use
  const _cacheModuleData = useCallback(async (moduleData: any) => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('terrafusion-module-data-v1');
        const response = new Response(JSON.stringify(moduleData));
        await cache.put('/api/ecosystem/status', response);
        // Module data cached for offline use
      } catch (error) {
        // Failed to cache module data
        setSwState(prev => ({ ...prev, isOffline: true }));
      }
    }
  }, []);

  // Request persistent storage
  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(granted => {
        if (granted) {
          // Persistent storage granted
          setSwState(prev => ({ ...prev, isPersistent: true }));
        }
      });
    }
  }, []);

  const handleCloseNotification = () => {
    setNotifications(prev => ({ ...prev, show: false }));
  };

  return (
    <div>
      {/* Update Available Snackbar */}
      <Snackbar
        open={notifications.show}
        autoHideDuration={notifications.action ? null : 6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notifications.severity}
          action={
            notifications.action && notifications.actionLabel ? (
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => {
                  notifications.action!();
                  handleCloseNotification();
                }}
              >
                {notifications.actionLabel}
              </Button>
            ) : undefined
          }
        >
          {notifications.message}
        </Alert>
      </Snackbar>

      {/* PWA Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          position="fixed"
          bottom={16}
          right={16}
          bgcolor="background.paper"
          border="1px solid"
          borderColor="divider"
          borderRadius={1}
          p={1}
          fontSize="12px"
          fontFamily="monospace"
          zIndex={9999}
        >


          <div>SW Supported: {swState.isSupported ? '✓' : '✗'}</div>
          <div
>SW Registered: {swState.isRegistered ? '✓' : '✗'}</div>


          <div>Update Available: {swState.isUpdateAvailable ? '✓' : '✗'}</div>
          <div
>Offline: {swState.isOffline ? '✓' : '✗'}</div>
        </Box>
      )}
    </div>
  );
};

// Hook for using service worker functionality in components
export const useServiceWorker = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncInBackground = useCallback(async (data: any) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_DATA',
        data
      });
    }
  }, []);

  const cacheData = useCallback(async (key: string, data: any) => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('terrafusion-data-v1');
        const response = new Response(JSON.stringify(data));
        await cache.put(key, response);
        return true;
      } catch (error) {
        console.error('Failed to cache data:', error);
        return false;
      }
    }
    return false;
  }, []);

  const getCachedData = useCallback(async (key: string) => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('terrafusion-data-v1');
        const response = await cache.match(key);
        if (response) {
          return await response.json();
        }
      } catch (error) {
        console.error('Failed to get cached data:', error);
      }
    }
    return null;
  }, []);

  return {
    isOnline,
    syncInBackground,
    cacheData,
    getCachedData,
    isOfflineCapable: 'serviceWorker' in navigator && 'caches' in window
  };
};

export default ServiceWorkerManager;
