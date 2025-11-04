'use client';

import { useState, useCallback } from 'react';

interface Notification {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface NotificationOptions {
  title?: string;
  duration?: number;
}

export function useNotificationState() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: Notification['type'], options: NotificationOptions = {}) => {
    const id = Math.random().toString(36).substring(7);
    const notification: Notification = {
      id,
      message,
      type,
      title: options.title,
      duration: options.duration || 5000,
    };

    setNotifications((prev) => [...prev, notification]);

    if (notification.duration) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, notification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const success = useCallback((message: string, options?: NotificationOptions) => {
    return addNotification(message, 'success', options);
  }, [addNotification]);

  const error = useCallback((message: string, options?: NotificationOptions) => {
    return addNotification(message, 'error', options);
  }, [addNotification]);

  const info = useCallback((message: string, options?: NotificationOptions) => {
    return addNotification(message, 'info', options);
  }, [addNotification]);

  const warning = useCallback((message: string, options?: NotificationOptions) => {
    return addNotification(message, 'warning', options);
  }, [addNotification]);

  return {
    notifications,
    success,
    error,
    info,
    warning,
    removeNotification,
  };
} 