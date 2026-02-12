/**
 * Toast Component
 * Displays temporary notifications
 */

import React, { useState, useEffect } from 'react';

/**
 * Toast Component
 * @param {Object} props - Component props
 * @param {string} props.message - Toast message text
 * @param {string} props.type - Type of toast (success, error, warning, info)
 * @param {number} props.duration - How long to display in ms (default: 3000ms)
 * @param {boolean} props.isVisible - Control visibility externally
 * @param {Function} props.onClose - Function to call when toast is closed
 * @returns {JSX.Element} Toast component
 */
const Toast = ({
  message,
  type = 'info',
  duration = 3000,
  isVisible = true,
  onClose
}) => {
  const [visible, setVisible] = useState(isVisible);

  useEffect(() => {
    setVisible(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success': return 'toast-success';
      case 'error': return 'toast-error';
      case 'warning': return 'toast-warning';
      default: return 'toast-info';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };

  return (
    <div className={`toast ${getTypeClass()}`}>
      <div className="toast-icon">{getTypeIcon()}</div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={handleClose}>×</button>
    </div>
  );
};

/**
 * ToastContainer Component
 * Manages multiple toast notifications
 * @param {Object} props - Component props
 * @param {Object[]} props.toasts - Array of toast objects
 * @param {Function} props.removeToast - Function to remove a toast by ID
 * @param {string} props.position - Position of the toast container
 * @returns {JSX.Element} Toast container component
 */
export const ToastContainer = ({
  toasts = [],
  removeToast,
  position = 'top-right'
}) => {
  return (
    <div className={`toast-container toast-${position}`}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast;