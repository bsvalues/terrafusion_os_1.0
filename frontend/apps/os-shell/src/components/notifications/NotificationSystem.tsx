/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION NOTIFICATION SYSTEM
 * Quantum-themed toast notifications and alerts with animations
 * ═══════════════════════════════════════════════════════════════
 */

import { cn } from '@utils/cn';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import './NotificationSystem.css';

// ═══ TYPES & INTERFACES ═══
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  variant?: 'default' | 'glass' | 'quantum';
  glow?: boolean;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface ToastProps {
  notification: Notification;
  onClose: (id: string) => void;
  className?: string;
}

export interface AlertBannerProps {
  type: NotificationType;
  title: string;
  message?: string;
  dismissible?: boolean;
  variant?: 'default' | 'glass' | 'quantum';
  glow?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export interface StatusBadgeProps {
  type: NotificationType;
  label: string;
  variant?: 'default' | 'quantum';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  glow?: boolean;
  className?: string;
}

export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

// ═══ NOTIFICATION CONTEXT ═══
const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// ═══ TOAST COMPONENT ═══
export function QuantumToast({ notification, onClose, className = '' }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notification.persistent && notification.duration !== 0) {
      const duration = notification.duration || 5000;
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  }, [notification.id, onClose]);

  const toastClass = cn(
    'quantum-toast',
    `quantum-toast-${notification.type}`,
    `quantum-toast-${notification.variant || 'default'}`,
    notification.glow && 'quantum-toast-glow',
    isVisible && 'quantum-toast-visible',
    isExiting && 'quantum-toast-exit',
    className
  );

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <div className='quantum-toast-icon quantum-toast-icon-success'>
            <svg viewBox='0 0 20 20' fill='currentColor'>
              <path
                fillRule='evenodd'
                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className='quantum-toast-icon quantum-toast-icon-error'>
            <svg viewBox='0 0 20 20' fill='currentColor'>
              <path
                fillRule='evenodd'
                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className='quantum-toast-icon quantum-toast-icon-warning'>
            <svg viewBox='0 0 20 20' fill='currentColor'>
              <path
                fillRule='evenodd'
                d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className='quantum-toast-icon quantum-toast-icon-info'>
            <svg viewBox='0 0 20 20' fill='currentColor'>
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={toastClass}>
      <div className='quantum-toast-content'>
        {getIcon()}
        <div className='quantum-toast-text'>
          <div className='quantum-toast-title'>{notification.title}</div>
          {notification.message && (
            <div className='quantum-toast-message'>{notification.message}</div>
          )}
        </div>
      </div>

      {notification.actions && notification.actions.length > 0 && (
        <div className='quantum-toast-actions'>
          {notification.actions.map((action, index) => (
            <button
              key={index}
              className={cn(
                'quantum-toast-action',
                `quantum-toast-action-${action.variant || 'secondary'}`
              )}
              onClick={action.action}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <button className='quantum-toast-close' onClick={handleClose} aria-label='Close notification'>
        <svg viewBox='0 0 20 20' fill='currentColor'>
          <path
            fillRule='evenodd'
            d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
            clipRule='evenodd'
          />
        </svg>
      </button>
    </div>
  );
}

// ═══ ALERT BANNER COMPONENT ═══
export function QuantumAlertBanner({
  type,
  title,
  message,
  dismissible = true,
  variant = 'default',
  glow = false,
  onDismiss,
  className = '',
}: AlertBannerProps) {
  const alertClass = cn(
    'quantum-alert-banner',
    `quantum-alert-${type}`,
    `quantum-alert-${variant}`,
    glow && 'quantum-alert-glow',
    className
  );

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className='quantum-alert-icon' viewBox='0 0 20 20' fill='currentColor'>
            <path
              fillRule='evenodd'
              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
              clipRule='evenodd'
            />
          </svg>
        );
      case 'error':
        return (
          <svg className='quantum-alert-icon' viewBox='0 0 20 20' fill='currentColor'>
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
              clipRule='evenodd'
            />
          </svg>
        );
      case 'warning':
        return (
          <svg className='quantum-alert-icon' viewBox='0 0 20 20' fill='currentColor'>
            <path
              fillRule='evenodd'
              d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
              clipRule='evenodd'
            />
          </svg>
        );
      case 'info':
        return (
          <svg className='quantum-alert-icon' viewBox='0 0 20 20' fill='currentColor'>
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
              clipRule='evenodd'
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={alertClass}>
      <div className='quantum-alert-content'>
        {getIcon()}
        <div className='quantum-alert-text'>
          <div className='quantum-alert-title'>{title}</div>
          {message && <div className='quantum-alert-message'>{message}</div>}
        </div>
      </div>

      {dismissible && (
        <button className='quantum-alert-close' onClick={onDismiss} aria-label='Dismiss alert'>
          <svg viewBox='0 0 20 20' fill='currentColor'>
            <path
              fillRule='evenodd'
              d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
              clipRule='evenodd'
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// ═══ STATUS BADGE COMPONENT ═══
export function QuantumStatusBadge({
  type,
  label,
  variant = 'default',
  size = 'md',
  pulse = false,
  glow = false,
  className = '',
}: StatusBadgeProps) {
  const badgeClass = cn(
    'quantum-status-badge',
    `quantum-badge-${type}`,
    `quantum-badge-${variant}`,
    `quantum-badge-${size}`,
    pulse && 'quantum-badge-pulse',
    glow && 'quantum-badge-glow',
    className
  );

  return (
    <span className={badgeClass}>
      <span className='quantum-badge-dot'></span>
      <span className='quantum-badge-label'>{label}</span>
    </span>
  );
}

// ═══ NOTIFICATION CONTAINER ═══
export function QuantumNotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className='quantum-notification-container'>
      {notifications.map((notification) => (
        <QuantumToast
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
}

// ═══ NOTIFICATION PROVIDER ═══
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = { ...notification, id };

    setNotifications((prev) => [...prev, newNotification]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification, clearAll }}
    >
      {children}
      <QuantumNotificationContainer />
    </NotificationContext.Provider>
  );
}

// ═══ CONVENIENCE HOOKS ═══
export function useToast() {
  const { addNotification } = useNotifications();

  return {
    success: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'success', title, message, ...options }),

    error: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'error', title, message, ...options }),

    warning: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'warning', title, message, ...options }),

    info: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'info', title, message, ...options }),

    custom: (notification: Omit<Notification, 'id'>) => addNotification(notification),
  };
}
