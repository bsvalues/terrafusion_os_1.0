/**
 * TerraFusion OS Toast Component
 *
 * Individual toast notification popup with:
 * - Type-based styling (info, success, warning, error)
 * - Progress bar animation
 * - Auto-dismiss functionality
 * - Action button support
 *
 * @module shell/notifications/Toast
 * @see SUCCESS CRITERIA Phase 8: Notification System
 */

import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';
import type { Toast as ToastType } from '../../stores/notificationStore';

// ============================================================================
// Types
// ============================================================================

export interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
  className?: string;
}

// ============================================================================
// Type Icons
// ============================================================================

const TypeIcon: React.FC<{ type: ToastType['type'] }> = ({ type }) => {
  const icons = {
    info: (
      <svg
        data-testid='toast-icon-info'
        className='w-5 h-5 text-[var(--tf-network-blue)]'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        />
      </svg>
    ),
    success: (
      <svg
        data-testid='toast-icon-success'
        className='w-5 h-5 text-[var(--tf-accent-success)]'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
        />
      </svg>
    ),
    warning: (
      <svg
        data-testid='toast-icon-warning'
        className='w-5 h-5 text-[var(--warning-amber)]'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
        />
      </svg>
    ),
    error: (
      <svg
        data-testid='toast-icon-error'
        className='w-5 h-5 text-[var(--error-red)]'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
        />
      </svg>
    ),
  };

  return icons[type] || icons.info;
};

// ============================================================================
// Toast Component
// ============================================================================

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss, className }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-dismiss timer
  useEffect(() => {
    if (toast.duration > 0) {
      timerRef.current = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast.id, toast.duration, onDismiss]);

  // Determine role based on type
  const role = toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status';
  const ariaLive = toast.type === 'error' ? 'assertive' : 'polite';

  // Border color based on type
  const borderColors = {
    info: 'border-l-[var(--tf-network-blue)]',
    success: 'border-l-[var(--tf-accent-success)]',
    warning: 'border-l-[var(--warning-amber)]',
    error: 'border-l-[var(--error-red)]',
  };

  // Progress bar color based on type
  const progressColors = {
    info: 'bg-[var(--tf-network-blue)]',
    success: 'bg-[var(--tf-accent-success)]',
    warning: 'bg-[var(--warning-amber)]',
    error: 'bg-[var(--error-red)]',
  };

  return (
    <div
      data-testid={`toast-${toast.id}`}
      data-type={toast.type}
      role={role}
      aria-live={ariaLive}
      className={cn(
        // Base styles
        'relative w-80 overflow-hidden rounded-lg',
        'bg-[var(--tf-void-black)]/95 backdrop-blur-xl',
        'border border-white/10',
        'border-l-4',
        borderColors[toast.type],
        'shadow-[0_4px_20px_hsl(var(--tf-bg)/0.5),0_0_30px_hsl(var(--tf-accent)/0.1)]',
        // Animation
        'animate-in slide-in-from-right-full fade-in duration-300',
        className
      )}
    >
      {/* Content */}
      <div className='flex items-start gap-3 p-4'>
        {/* Icon */}
        <div className='flex-shrink-0 mt-0.5'>
          <TypeIcon type={toast.type} />
        </div>

        {/* Text */}
        <div className='flex-1 min-w-0'>
          <h4 className='text-sm font-semibold text-white truncate'>{toast.title}</h4>
          <p className='text-xs text-white/70 mt-0.5 line-clamp-2'>{toast.message}</p>

          {/* Action Button */}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={cn(
                'mt-2 text-xs font-medium',
                'text-[var(--tf-transcend-highlight)] hover:text-[var(--tf-quantum-cyan)]',
                'transition-colors duration-150'
              )}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => onDismiss(toast.id)}
          aria-label='Dismiss notification'
          className={cn(
            'flex-shrink-0',
            'w-6 h-6 rounded flex items-center justify-center',
            'text-white/40 hover:text-white hover:bg-white/10',
            'transition-colors duration-150'
          )}
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      {toast.duration > 0 && (
        <div className='absolute bottom-0 left-0 right-0 h-1 bg-white/10'>
          <div
            data-testid='toast-progress'
            className={cn('h-full', progressColors[toast.type], 'animate-[shrink_linear_forwards]')}
            style={{
              animationDuration: `${toast.duration}ms`,
              width: '100%',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;
