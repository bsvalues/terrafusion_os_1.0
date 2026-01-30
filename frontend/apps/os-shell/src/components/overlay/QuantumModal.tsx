/**
 * QuantumModal - Advanced Modal System for TerraFusion Governance Platform
 * Features: Glassmorphic overlays, quantum transitions, accessibility, escape handling
 */

import * as LucideIcons from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import { TerraSphere } from '../brand/TerraSphere';
import { Button } from '../ui/button';
import './QuantumModal.css';

export interface QuantumModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to call when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Modal size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Modal variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether modal can be closed by clicking overlay */
  closeOnOverlayClick?: boolean;
  /** Whether modal can be closed with escape key */
  closeOnEscape?: boolean;
  /** Custom className */
  className?: string;
  /** Footer content */
  footer?: React.ReactNode;
  /** Whether to show quantum effects */
  quantum?: boolean;
  /** Custom portal target */
  portalTarget?: HTMLElement;
  /** Role for accessibility */
  role?: 'dialog' | 'alertdialog' | 'form' | 'region';
  /** Aria label */
  'aria-label'?: string;
  /** Aria described by */
  'aria-describedby'?: string;
}

export interface QuantumConfirmModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to call when modal should close */
  onClose: () => void;
  /** Function to call when confirmed */
  onConfirm: () => void;
  /** Confirmation title */
  title: string;
  /** Confirmation message */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Modal variant */
  variant?: 'default' | 'warning' | 'error';
  /** Whether confirm action is loading */
  loading?: boolean;
}

export interface QuantumAlertModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to call when modal should close */
  onClose: () => void;
  /** Alert title */
  title: string;
  /** Alert message */
  message: string;
  /** Alert variant */
  variant: 'success' | 'warning' | 'error' | 'info';
  /** Close button text */
  closeText?: string;
}

const MODAL_SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
} as const;

const MODAL_VARIANTS = {
  default: {
    icon: null,
    iconColor: '',
    borderColor: 'border-terra-cyan/20',
  },
  success: {
    icon: LucideIcons.CheckCircle,
    iconColor: 'text-green-400',
    borderColor: 'border-green-400/30',
  },
  warning: {
    icon: LucideIcons.AlertTriangle,
    iconColor: 'text-yellow-400',
    borderColor: 'border-yellow-400/30',
  },
  error: {
    icon: LucideIcons.XCircle,
    iconColor: 'text-red-400',
    borderColor: 'border-red-400/30',
  },
  info: {
    icon: LucideIcons.Info,
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-400/30',
  },
} as const;

export const QuantumModal: React.FC<QuantumModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  footer,
  quantum = true,
  portalTarget,
  role = 'dialog',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      setMounted(true);
    } else {
      setMounted(false);
      // Restore focus when modal closes
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      modal.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, mounted]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === overlayRef.current) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose]
  );

  const variantConfig = MODAL_VARIANTS[variant];
  const IconComponent = variantConfig.icon;

  if (!isOpen && !mounted) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      className={cn(
        'quantum-modal-overlay',
        quantum && 'quantum-modal-overlay-quantum',
        isOpen ? 'quantum-modal-overlay-open' : 'quantum-modal-overlay-closed'
      )}
      onClick={handleOverlayClick}
      role='presentation'
    >
      <div
        ref={modalRef}
        className={cn(
          'quantum-modal',
          MODAL_SIZES[size],
          variantConfig.borderColor,
          quantum && 'quantum-modal-quantum',
          isOpen ? 'quantum-modal-open' : 'quantum-modal-closed',
          className
        )}
        role={role}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className='quantum-modal-header'>
            <div className='quantum-modal-title-section'>
              {IconComponent &&
                (() => {
                  const Icon = IconComponent as any;
                  return <Icon className={cn('quantum-modal-icon', variantConfig.iconColor)} />;
                })()}
              {title && (
                <h2 className='quantum-modal-title' id='modal-title'>
                  {title}
                </h2>
              )}
              {quantum && <TerraSphere size='sm' variant='glow' className='quantum-modal-sphere' />}
            </div>
            {showCloseButton && (
              <Button
                variant='ghost'
                size='sm'
                onClick={onClose}
                className='quantum-modal-close'
                aria-label='Close modal'
              >
                {(() => {
                  const XIcon = LucideIcons.X as any;
                  return <XIcon className='h-4 w-4' />;
                })()}
              </Button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className='quantum-modal-body' id='modal-content'>
          {children}
        </div>

        {/* Modal Footer */}
        {footer && <div className='quantum-modal-footer'>{footer}</div>}
      </div>
    </div>
  );

  const target = portalTarget || document.body;
  return createPortal(modalContent, target);
};

export const QuantumConfirmModal: React.FC<QuantumConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const footer = (
    <div className='flex justify-end gap-3'>
      <Button variant='outline' onClick={onClose} disabled={loading}>
        {cancelText}
      </Button>
      <Button
        variant={variant === 'error' ? 'destructive' : 'default'}
        onClick={handleConfirm}
        disabled={loading}
      >
        {confirmText}
      </Button>
    </div>
  );

  return (
    <QuantumModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant={variant}
      size='sm'
      footer={footer}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div className='text-slate-300 leading-relaxed'>{message}</div>
    </QuantumModal>
  );
};

export const QuantumAlertModal: React.FC<QuantumAlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  variant,
  closeText = 'Close',
}) => {
  const footer = (
    <div className='flex justify-end'>
      <Button variant='default' onClick={onClose}>
        {closeText}
      </Button>
    </div>
  );

  return (
    <QuantumModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant={variant}
      size='sm'
      footer={footer}
    >
      <div className='text-slate-300 leading-relaxed'>{message}</div>
    </QuantumModal>
  );
};

// Hook for easier modal management
export const useQuantumModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
};

// Modal context for nested modals
export interface QuantumModalContextValue {
  modals: string[];
  addModal: (id: string) => void;
  removeModal: (id: string) => void;
  isTopModal: (id: string) => boolean;
}

export const QuantumModalContext = React.createContext<QuantumModalContextValue | null>(null);

export const QuantumModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modals, setModals] = useState<string[]>([]);

  const addModal = useCallback((id: string) => {
    setModals((prev) => [...prev, id]);
  }, []);

  const removeModal = useCallback((id: string) => {
    setModals((prev) => prev.filter((modalId) => modalId !== id));
  }, []);

  const isTopModal = useCallback(
    (id: string) => {
      return modals.length > 0 && modals[modals.length - 1] === id;
    },
    [modals]
  );

  const value = {
    modals,
    addModal,
    removeModal,
    isTopModal,
  };

  return <QuantumModalContext.Provider value={value}>{children}</QuantumModalContext.Provider>;
};

export const useQuantumModalContext = () => {
  const context = React.useContext(QuantumModalContext);
  if (!context) {
    throw new Error('useQuantumModalContext must be used within a QuantumModalProvider');
  }
  return context;
};

export default QuantumModal;
