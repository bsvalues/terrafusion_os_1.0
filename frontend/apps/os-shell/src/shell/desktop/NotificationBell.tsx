/**
 * TerraFusion OS Notification Bell
 * 
 * System tray component showing notifications.
 * Click to open panel with recent notifications.
 * 
 * @module shell/desktop/NotificationBell
 * @see SUCCESS CRITERIA Phase 7: System Tray
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationBellProps {
  notifications: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onDismiss?: (notificationId: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onNotificationClick?: (notification: Notification) => void;
  onDismiss?: (notificationId: string) => void;
  onClearAll?: () => void;
  className?: string;
}

// ============================================================================
// Helper: Format relative time
// ============================================================================

const formatRelativeTime = (timestamp: string): string => {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return new Date(timestamp).toLocaleDateString();
};

// ============================================================================
// Helper: Get type icon
// ============================================================================

const getTypeIcon = (type: NotificationType): { icon: string; color: string } => {
  switch (type) {
    case 'success':
      return { icon: '✓', color: 'text-[#00ffaa] bg-[#00ffaa]/20' };
    case 'warning':
      return { icon: '⚠', color: 'text-[#ffaa00] bg-[#ffaa00]/20' };
    case 'error':
      return { icon: '✕', color: 'text-[#ff4444] bg-[#ff4444]/20' };
    case 'info':
    default:
      return { icon: 'ℹ', color: 'text-[#00aaff] bg-[#00aaff]/20' };
  }
};

// ============================================================================
// NotificationItem Component
// ============================================================================

interface NotificationItemProps {
  notification: Notification;
  onClick?: (notification: Notification) => void;
  onDismiss?: (notificationId: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  onDismiss,
}) => {
  const { icon, color } = getTypeIcon(notification.type);

  return (
    <li
      data-testid={notification.read ? 'notification-item-read' : 'notification-item-unread'}
      className={cn(
        'relative px-3 py-2 rounded-lg transition-colors',
        'hover:bg-white/5 cursor-pointer group',
        !notification.read && 'bg-[#00ffee]/5'
      )}
    >
      <button
        onClick={() => onClick?.(notification)}
        className="flex items-start gap-3 w-full text-left"
      >
        {/* Type Icon */}
        <div
          data-testid={`notif-icon-${notification.type}`}
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
            'text-xs font-bold',
            color
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {notification.title}
            </span>
            {!notification.read && (
              <span className="w-1.5 h-1.5 bg-[#00ffee] rounded-full flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-white/60 line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <span className="text-xs text-white/40 mt-1 block">
            {formatRelativeTime(notification.timestamp)}
          </span>
        </div>
      </button>

      {/* Dismiss button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss?.(notification.id);
        }}
        aria-label="Dismiss notification"
        className={cn(
          'absolute top-2 right-2',
          'w-5 h-5 rounded flex items-center justify-center',
          'text-white/40 hover:text-white hover:bg-white/10',
          'opacity-0 group-hover:opacity-100 transition-opacity'
        )}
      >
        ✕
      </button>
    </li>
  );
};

// ============================================================================
// NotificationPanel Component
// ============================================================================

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onClose,
  onNotificationClick,
  onDismiss,
  onClearAll,
  className,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div
      ref={panelRef}
      data-testid="notification-panel"
      role="dialog"
      aria-label="Notifications"
      className={cn(
        'absolute bottom-full right-0 mb-2',
        'w-80 max-h-[400px] rounded-lg overflow-hidden',
        'bg-[#0a0e1a]/95 backdrop-blur-xl',
        'border border-[#00ffee]/20',
        'shadow-[0_-8px_30px_rgba(0,0,0,0.5),0_0_40px_rgba(0,255,238,0.1)]',
        'flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔔</span>
          <h3 className="text-sm font-semibold text-white">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-1.5 text-xs text-[#00ffee]">({unreadCount} new)</span>
            )}
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Notification List */}
      {notifications.length > 0 ? (
        <ul
          role="list"
          aria-label="Notification list"
          className="flex-1 overflow-y-auto p-2 space-y-1"
        >
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={onNotificationClick}
              onDismiss={onDismiss}
            />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-white/50">
          <span className="text-3xl mb-2">🔕</span>
          <span className="text-sm">No notifications</span>
        </div>
      )}

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-2 border-t border-white/10">
          <button
            onClick={onClearAll}
            aria-label="Clear all notifications"
            className={cn(
              'w-full py-1.5 rounded-md',
              'text-xs text-white/60 hover:text-white',
              'hover:bg-white/5 transition-colors'
            )}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// NotificationBell Component
// ============================================================================

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  onNotificationClick,
  onDismiss,
  onClearAll,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={cn('relative', className)}>
      <button
        data-testid="notification-bell"
        onClick={togglePanel}
        aria-label={`Notifications - ${unreadCount} unread`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          'flex items-center justify-center',
          'w-8 h-8 rounded-md',
          'hover:bg-white/10 cursor-pointer',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffee]',
          isOpen && 'bg-white/10'
        )}
      >
        <span className="text-lg">🔔</span>
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            className={cn(
              'absolute -top-0.5 -right-0.5',
              'min-w-[18px] h-[18px] px-1',
              'flex items-center justify-center',
              'text-[10px] font-bold',
              'bg-[#ff4444] text-white rounded-full',
              'shadow-[0_0_6px_rgba(255,68,68,0.6)]'
            )}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <NotificationPanel
          notifications={notifications}
          onClose={closePanel}
          onNotificationClick={onNotificationClick}
          onDismiss={onDismiss}
          onClearAll={onClearAll}
        />
      )}
    </div>
  );
};

export default NotificationBell;
