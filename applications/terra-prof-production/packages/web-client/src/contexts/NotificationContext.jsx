import React, { createContext, useState, useCallback } from 'react';

// Create Notification Context
const NotificationContext = createContext();

/**
 * Notification Provider Component
 * Manages application-wide notifications and alerts
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  
  // Generate unique ID for notifications
  const generateId = () => {
    return `notification-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };
  
  // Add a new notification
  const addNotification = useCallback((notification) => {
    const id = generateId();
    const newNotification = {
      id,
      type: notification.type || 'info',
      message: notification.message,
      title: notification.title || getDefaultTitle(notification.type),
      autoClose: notification.autoClose !== undefined ? notification.autoClose : true,
      duration: notification.duration || 5000,
      timestamp: new Date(),
      onClose: notification.onClose
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto close notification after duration if autoClose is true
    if (newNotification.autoClose) {
      setTimeout(() => {
        removeNotification(id);
        if (newNotification.onClose) {
          newNotification.onClose();
        }
      }, newNotification.duration);
    }
    
    return id;
  }, []);
  
  // Get default title based on notification type
  const getDefaultTitle = (type) => {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
      default:
        return 'Information';
    }
  };
  
  // Remove a notification by ID
  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && notification.onClose) {
        notification.onClose();
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);
  
  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  // Shorthand methods for different notification types
  const success = useCallback((message, options = {}) => {
    return addNotification({ type: 'success', message, ...options });
  }, [addNotification]);
  
  const error = useCallback((message, options = {}) => {
    return addNotification({ type: 'error', message, ...options });
  }, [addNotification]);
  
  const warning = useCallback((message, options = {}) => {
    return addNotification({ type: 'warning', message, ...options });
  }, [addNotification]);
  
  const info = useCallback((message, options = {}) => {
    return addNotification({ type: 'info', message, ...options });
  }, [addNotification]);
  
  // Return context value
  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;