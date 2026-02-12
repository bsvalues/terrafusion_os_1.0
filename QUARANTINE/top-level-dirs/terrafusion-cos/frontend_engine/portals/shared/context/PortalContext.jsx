/**
 * Portal Context - Shared state management for all TerraFusion portals
 * Provides user data, permissions, notifications, and portal-wide utilities
 */

import { createContext, useContext, useState, useEffect } from 'react';

const PortalContext = createContext(null);

export const PortalProvider = ({ children, portalName, portalConfig = {} }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialize portal user data
  useEffect(() => {
    const initializePortal = async () => {
      try {
        setLoading(true);
        
        // Simulate API call - replace with actual authentication
        const mockUser = {
          id: 1,
          name: 'Benton County Admin',
          email: 'admin@terrafusionmarket.io',
          role: 'administrator',
          avatar: null,
          department: portalName,
        };
        
        const mockPermissions = ['read', 'write', 'admin', 'delete'];
        
        setUser(mockUser);
        setPermissions(mockPermissions);
      } catch (error) {
        console.error('Failed to initialize portal:', error);
      } finally {
        setLoading(false);
      }
    };

    initializePortal();
  }, [portalName]);

  // Add notification
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    return permissions.includes(permission) || permissions.includes('admin');
  };

  const value = {
    // User data
    user,
    setUser,
    
    // Permissions
    permissions,
    hasPermission,
    
    // Notifications
    notifications,
    addNotification,
    markAsRead,
    clearNotifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    
    // UI state
    sidebarCollapsed,
    toggleSidebar,
    setSidebarCollapsed,
    
    // Portal config
    portalName,
    portalConfig,
    
    // Loading state
    loading,
  };

  return (
    <PortalContext.Provider value={value}>
      {children}
    </PortalContext.Provider>
  );
};

/**
 * Hook to access portal context
 * @returns {Object} Portal context values
 * @throws {Error} If used outside PortalProvider
 */
export const usePortal = () => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
};

export default PortalContext;
