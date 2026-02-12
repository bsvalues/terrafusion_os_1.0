/**
 * App Context
 * Provides global state for the application
 */

import React, { createContext, useState, useContext, useCallback } from 'react';

// Create context with default values
const AppContext = createContext({
  isLoading: false,
  setIsLoading: () => {},
  error: null,
  setError: () => {},
  success: null,
  setSuccess: () => {},
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
  clearToasts: () => {}
});

/**
 * Generate a unique ID for toasts
 * @returns {string} Unique ID
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

/**
 * App Provider Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Context provider
 */
export const AppProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [toasts, setToasts] = useState([]);
  
  /**
   * Add a toast notification
   * @param {Object} toast - Toast data
   * @param {string} toast.message - Toast message
   * @param {string} toast.type - Toast type
   * @param {number} toast.duration - Duration in ms
   */
  const addToast = useCallback((toast) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, ...toast }]);

    // Auto-remove toast after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 3000);
    }

    return id;
  }, []);

  /**
   * Remove a toast by ID
   * @param {string} id - Toast ID
   */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * Clear all toasts
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Create the context value object
  const value = {
    isLoading,
    setIsLoading,
    error,
    setError,
    success,
    setSuccess,
    toasts,
    addToast,
    removeToast,
    clearToasts
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Use App Context hook
 * @returns {Object} App context value
 */
export const useApp = () => {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  
  return context;
};

export default AppContext;