/**
 * TerraFusion OS Toast Container
 *
 * Container component that manages toast notification display:
 * - Positioned fixed bottom-right
 * - Stacks toasts with proper spacing
 * - Integrates with notification store
 * - Handles dismissal
 *
 * @module shell/notifications/ToastContainer
 * @see SUCCESS CRITERIA Phase 8: Notification System
 */

import { cn } from '@/lib/utils';
import React from 'react';
import { useNotificationStore, useToasts } from '../../stores/notificationStore';
import { Toast } from './Toast';

// ============================================================================
// Types
// ============================================================================

export interface ToastContainerProps {
  className?: string;
}

// ============================================================================
// ToastContainer Component
// ============================================================================

export const ToastContainer: React.FC<ToastContainerProps> = ({ className }) => {
  const toasts = useToasts();
  const dismissToast = useNotificationStore((state) => state.dismissToast);

  return (
    <div
      data-testid='toast-container'
      role='region'
      aria-live='polite'
      aria-label='Notifications'
      className={cn(
        // Position fixed bottom-right
        'fixed bottom-0 right-0',
        // Padding from edge
        'p-4 pb-16', // pb-16 to stay above taskbar
        // Stack spacing
        'space-y-2',
        // High z-index
        'z-50',
        // Pointer events only on children
        'pointer-events-none',
        className
      )}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className='pointer-events-auto'>
          <Toast toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
