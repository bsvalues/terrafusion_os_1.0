/**
 * TerraFusion Notification System
 * Production-ready toast notifications, alerts, and banners
 * 
 * Features:
 * - Toast notifications with auto-dismiss
 * - Alert components for inline feedback
 * - Banner for system-wide messages
 * - Notification queue with stacking
 * - Multiple positioning options
 * - Animations (slide, fade, scale)
 * - Sound and haptic feedback (optional)
 * - Full TypeScript support
 * - Zero external dependencies
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, CSSProperties } from 'react';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationPosition = 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
export type NotificationAnimation = 'slide' | 'fade' | 'scale';
export interface ToastProps {
  id?: string;
  type?: NotificationType;
  title?: string;
  message: string;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  sound?: boolean;
  haptic?: boolean;
}
export interface AlertProps {
  type?: NotificationType;
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}
export interface BannerProps {
  type?: NotificationType;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}
export interface NotificationProviderProps {
  children: React.ReactNode;
  position?: NotificationPosition;
  maxToasts?: number;
  animation?: NotificationAnimation;
}
interface NotificationContextType {
  toast: (props: ToastProps) => string;
  success: (message: string, options?: Omit<ToastProps, 'type' | 'message'>) => string;
  error: (message: string, options?: Omit<ToastProps, 'type' | 'message'>) => string;
  warning: (message: string, options?: Omit<ToastProps, 'type' | 'message'>) => string;
  info: (message: string, options?: Omit<ToastProps, 'type' | 'message'>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}
interface ToastItem extends Required<Omit<ToastProps, 'onDismiss' | 'action' | 'icon' | 'sound' | 'haptic'>> {
  onDismiss?: () => void;
  action?: ToastProps['action'];
  icon?: React.ReactNode;
  sound?: boolean;
  haptic?: boolean;
  createdAt: number;
}

// ============================================================================
// Context
// ============================================================================

const NotificationContext = createContext<NotificationContextType | null>(null);
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

// ============================================================================
// Inline CSS Keyframes
// ============================================================================

const styleElement = <style>{`
    @keyframes notificationSlideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes notificationSlideInLeft {
      from {
        transform: translateX(-100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes notificationSlideInTop {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes notificationSlideInBottom {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes notificationFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes notificationScaleIn {
      from {
        transform: scale(0.8);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes notificationSlideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    @keyframes notificationProgressBar {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }
  `}</style>;

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
function getTypeColors(type: NotificationType, darkMode = false): {
  background: string;
  border: string;
  text: string;
  icon: string;
} {
  if (darkMode) {
    return {
      success: {
        background: '#065f46',
        border: '#10b981',
        text: '#d1fae5',
        icon: '#10b981'
      },
      error: {
        background: '#7f1d1d',
        border: '#ef4444',
        text: '#fee2e2',
        icon: '#ef4444'
      },
      warning: {
        background: '#78350f',
        border: '#f59e0b',
        text: '#fef3c7',
        icon: '#f59e0b'
      },
      info: {
        background: '#1e3a8a',
        border: '#3b82f6',
        text: '#dbeafe',
        icon: '#3b82f6'
      }
    }[type];
  }
  return {
    success: {
      background: '#d1fae5',
      border: '#10b981',
      text: '#065f46',
      icon: '#10b981'
    },
    error: {
      background: '#fee2e2',
      border: '#ef4444',
      text: '#7f1d1d',
      icon: '#ef4444'
    },
    warning: {
      background: '#fef3c7',
      border: '#f59e0b',
      text: '#78350f',
      icon: '#f59e0b'
    },
    info: {
      background: '#dbeafe',
      border: '#3b82f6',
      text: '#1e3a8a',
      icon: '#3b82f6'
    }
  }[type];
}
function getDefaultIcon(type: NotificationType): string {
  return {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }[type];
}
function playNotificationSound(type: NotificationType) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different frequencies for different types
    const frequencies: Record<NotificationType, number[]> = {
      success: [523.25, 659.25],
      // C5, E5
      error: [311.13],
      // Eb4
      warning: [466.16],
      // Bb4
      info: [440] // A4
    };
    const notes = frequencies[type];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.2);
      }, index * 100);
    });
  } catch (error) {
    // Graceful fallback - no sound
    console.debug('Audio not available:', error);
  }
}
function triggerHapticFeedback(type: NotificationType) {
  if (!('vibrate' in navigator)) return;
  const patterns: Record<NotificationType, number[]> = {
    success: [50, 50, 100],
    error: [200, 100, 200],
    warning: [100, 100, 100],
    info: [50]
  };
  navigator.vibrate(patterns[type]);
}

// ============================================================================
// Toast Component
// ============================================================================

interface ToastComponentProps extends ToastItem {
  position: NotificationPosition;
  animation: NotificationAnimation;
  onClose: () => void;
  darkMode?: boolean;
}
function Toast({
  id,
  type,
  title,
  message,
  duration,
  dismissible,
  action,
  icon,
  position,
  animation,
  onClose,
  darkMode = false,
  sound = false,
  haptic = false,
  createdAt
}: ToastComponentProps) {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);
  const progressInterval = useRef<NodeJS.Timer | null>(null);
  const dismissTimeout = useRef<NodeJS.Timer | null>(null);
  const colors = getTypeColors(type, darkMode);
  useEffect(() => {
    // Play sound and haptic feedback
    if (sound) {
      playNotificationSound(type);
    }
    if (haptic) {
      triggerHapticFeedback(type);
    }
  }, [type, sound, haptic]);
  useEffect(() => {
    if (duration === 0) return;
    const startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const progressPercent = remaining / duration * 100;
      setProgress(progressPercent);
      if (remaining <= 0 && progressInterval.current) {
        clearInterval(progressInterval.current);
        handleDismiss();
      }
    };
    progressInterval.current = setInterval(updateProgress, 50);
    dismissTimeout.current = setTimeout(() => {
      handleDismiss();
    }, duration);
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (dismissTimeout.current) clearTimeout(dismissTimeout.current);
    };
  }, [duration]);
  const handleDismiss = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(onClose, 300);
  };
  const getAnimationName = () => {
    if (isExiting) return 'notificationSlideOut 0.3s ease forwards';
    if (animation === 'fade') return 'notificationFadeIn 0.3s ease';
    if (animation === 'scale') return 'notificationScaleIn 0.3s ease';

    // Slide animation based on position
    if (position.includes('right')) return 'notificationSlideInRight 0.3s ease';
    if (position.includes('left')) return 'notificationSlideInLeft 0.3s ease';
    if (position.includes('top')) return 'notificationSlideInTop 0.3s ease';
    return 'notificationSlideInBottom 0.3s ease';
  };
  const toastStyle: CSSProperties = {
    background: colors.background,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    borderRadius: '8px',
    padding: '1rem',
    minWidth: '320px',
    maxWidth: '480px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    position: 'relative',
    overflow: 'hidden',
    animation: getAnimationName()
  };
  const iconStyle: CSSProperties = {
    fontSize: '1.5rem',
    color: colors.icon,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    fontWeight: 'bold'
  };
  const progressBarStyle: CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '3px',
    background: colors.icon,
    transition: 'width 50ms linear',
    width: `${progress}%`
  };
  return <div style={toastStyle} role="alert" aria-live="polite" aria-atomic="true">
      <div className="flex gap-3 items-start">
        <div style={iconStyle}>
          {icon || getDefaultIcon(type)}
        </div>

        <div className="flex-1">
          {title && <div className="font-semibold mb-1">
              {title}
            </div>}
          <div className="text-sm">
            {message}
          </div>
        </div>

        {dismissible && <button onClick={handleDismiss} style={{
        background: 'transparent',
        border: 'none',
        color: colors.text,
        cursor: 'pointer',
        fontSize: '1.25rem',
        opacity: 0.7,
        padding: '0.25rem',
        lineHeight: 1
      }} aria-label="Dismiss notification">
            ×
          </button>}
      </div>

      {action && <div style={{
      paddingLeft: '2rem'
    }}>
          <button onClick={() => {
        action.onClick();
        handleDismiss();
      }} style={{
        background: colors.icon
      }} className="text-sm">
            {action.label}
          </button>
        </div>}

      {duration > 0 && <div style={progressBarStyle} />}
    </div>;
}

// ============================================================================
// Alert Component (Inline, Non-Dismissing)
// ============================================================================

export function Alert({
  type = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
  icon,
  className = '',
  style = {},
  darkMode = false
}: AlertProps & {
  darkMode?: boolean;
}) {
  const colors = getTypeColors(type, darkMode);
  const alertStyle: CSSProperties = {
    background: colors.background,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
    ...style
  };
  const iconStyle: CSSProperties = {
    fontSize: '1.25rem',
    color: colors.icon,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    fontWeight: 'bold'
  };
  return <div className={className} style={alertStyle} role="alert">
      <div style={iconStyle}>
        {icon || getDefaultIcon(type)}
      </div>

      <div className="flex-1">
        {title && <div className="font-semibold mb-1">
            {title}
          </div>}
        <div className="text-sm">
          {message}
        </div>
      </div>

      {dismissible && onDismiss && <button onClick={onDismiss} style={{
      background: 'transparent',
      border: 'none',
      color: colors.text,
      cursor: 'pointer',
      fontSize: '1.25rem',
      opacity: 0.7,
      padding: '0.25rem',
      lineHeight: 1
    }} aria-label="Dismiss alert">
          ×
        </button>}
    </div>;
}

// ============================================================================
// Banner Component (Full-Width)
// ============================================================================

export function Banner({
  type = 'info',
  message,
  dismissible = true,
  onDismiss,
  action,
  icon,
  className = '',
  style = {},
  darkMode = false
}: BannerProps & {
  darkMode?: boolean;
}) {
  const colors = getTypeColors(type, darkMode);
  const bannerStyle: CSSProperties = {
    background: colors.background,
    borderBottom: `2px solid ${colors.border}`,
    color: colors.text,
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    justifyContent: 'space-between',
    ...style
  };
  const iconStyle: CSSProperties = {
    fontSize: '1.25rem',
    color: colors.icon,
    fontWeight: 'bold'
  };
  return <div className={className} style={bannerStyle} role="alert">
      <div className="flex items-center gap-3 flex-1">
        <div style={iconStyle}>
          {icon || getDefaultIcon(type)}
        </div>
        <div style={{
        fontSize: '0.9375rem',
        fontWeight: 500
      }}>
          {message}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {action && <button onClick={action.onClick} style={{
        background: colors.icon
      }} className="text-sm">
            {action.label}
          </button>}

        {dismissible && onDismiss && <button onClick={onDismiss} style={{
        background: 'transparent',
        border: 'none',
        color: colors.text,
        cursor: 'pointer',
        fontSize: '1.5rem',
        opacity: 0.7,
        padding: '0.25rem',
        lineHeight: 1
      }} aria-label="Dismiss banner">
            ×
          </button>}
      </div>
    </div>;
}

// ============================================================================
// NotificationProvider Component
// ============================================================================

export function NotificationProvider({
  children,
  position = 'top-right',
  maxToasts = 5,
  animation = 'slide',
  darkMode = false
}: NotificationProviderProps & {
  darkMode?: boolean;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toast = useCallback((props: ToastProps): string => {
    const id = props.id || generateId();
    const toastItem: ToastItem = {
      id,
      type: props.type || 'info',
      title: props.title,
      message: props.message,
      duration: props.duration !== undefined ? props.duration : 5000,
      dismissible: props.dismissible !== undefined ? props.dismissible : true,
      onDismiss: props.onDismiss,
      action: props.action,
      icon: props.icon,
      sound: props.sound || false,
      haptic: props.haptic || false,
      createdAt: Date.now()
    };
    setToasts(prev => {
      const newToasts = [toastItem, ...prev];
      return newToasts.slice(0, maxToasts);
    });
    return id;
  }, [maxToasts]);
  const success = useCallback((message: string, options?: Omit<ToastProps, 'type' | 'message'>) => {
    return toast({
      ...options,
      type: 'success',
      message
    });
  }, [toast]);
  const error = useCallback((message: string, options?: Omit<ToastProps, 'type' | 'message'>) => {
    return toast({
      ...options,
      type: 'error',
      message
    });
  }, [toast]);
  const warning = useCallback((message: string, options?: Omit<ToastProps, 'type' | 'message'>) => {
    return toast({
      ...options,
      type: 'warning',
      message
    });
  }, [toast]);
  const info = useCallback((message: string, options?: Omit<ToastProps, 'type' | 'message'>) => {
    return toast({
      ...options,
      type: 'info',
      message
    });
  }, [toast]);
  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);
  const contextValue: NotificationContextType = {
    toast,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll
  };
  const getContainerPosition = (): CSSProperties => {
    const base: CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      padding: '1rem',
      pointerEvents: 'none'
    };
    if (position === 'top-right') {
      return {
        ...base,
        top: 0,
        right: 0
      };
    } else if (position === 'top-left') {
      return {
        ...base,
        top: 0,
        left: 0
      };
    } else if (position === 'top-center') {
      return {
        ...base,
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)'
      };
    } else if (position === 'bottom-right') {
      return {
        ...base,
        bottom: 0,
        right: 0,
        flexDirection: 'column-reverse'
      };
    } else if (position === 'bottom-left') {
      return {
        ...base,
        bottom: 0,
        left: 0,
        flexDirection: 'column-reverse'
      };
    } else if (position === 'bottom-center') {
      return {
        ...base,
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        flexDirection: 'column-reverse'
      };
    }
    return base;
  };
  return <NotificationContext.Provider value={contextValue}>
      {styleElement}
      {children}
      <div style={getContainerPosition()}>
        {toasts.map(toastItem => <div key={toastItem.id} style={{
        pointerEvents: 'auto'
      }}>
            <Toast {...toastItem} position={position} animation={animation} onClose={() => {
          if (toastItem.onDismiss) toastItem.onDismiss();
          dismiss(toastItem.id);
        }} darkMode={darkMode} />
          </div>)}
      </div>
    </NotificationContext.Provider>;
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook for displaying notifications with promise tracking
 * Perfect for async operations like API calls
 */
export function useAsyncToast() {
  const {
    toast,
    success,
    error
  } = useNotification();
  const asyncToast = useCallback(async <T,>(promise: Promise<T>, options: {
    loading?: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }): Promise<T> => {
    const loadingId = options.loading ? toast({
      type: 'info',
      message: options.loading,
      duration: 0,
      dismissible: false
    }) : '';
    try {
      const data = await promise;
      const successMsg = typeof options.success === 'function' ? options.success(data) : options.success;
      if (loadingId) {
        // Dismiss loading toast
        setTimeout(() => success(successMsg), 100);
      } else {
        success(successMsg);
      }
      return data;
    } catch (err) {
      const errorMsg = typeof options.error === 'function' ? options.error(err) : options.error;
      if (loadingId) {
        setTimeout(() => error(errorMsg), 100);
      } else {
        error(errorMsg);
      }
      throw err;
    }
  }, [toast, success, error]);
  return {
    asyncToast
  };
}

// ============================================================================
// Exports
// ============================================================================

export default {
  NotificationProvider,
  Alert,
  Banner,
  useNotification,
  useAsyncToast
};