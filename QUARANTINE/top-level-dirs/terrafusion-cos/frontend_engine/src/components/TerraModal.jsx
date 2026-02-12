/**
 * TerraModal - Official TerraFusion Modal/Dialog Component
 * 
 * @architecture Modal dialogs and popups using design tokens
 * Provides accessible, animated modals
 * 
 * @example
 * <TerraModal 
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Confirm Action"
 * >
 *   <p>Are you sure?</p>
 * </TerraModal>
 */

import React, { useEffect } from 'react';

import { useTheme } from '../theme/ThemeProvider.jsx';

const TerraModal = ({ 
  isOpen = false,
  onClose = () => {},
  title = null,
  children,
  size = 'medium', // 'small', 'medium', 'large', 'fullscreen'
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer = null,
  className = '',
  ...props 
}) => {
  const theme = useTheme();
  
  useEffect(() => {
    if (!closeOnEscape) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(11, 16, 32, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: theme.spacing.md,
    animation: 'clarity-fade 0.3s ease-out',
  };
  
  const getModalWidth = () => {
    const widthMap = {
      small: '400px',
      medium: '600px',
      large: '900px',
      fullscreen: '95vw',
    };
    return widthMap[size] || '600px';
  };
  
  const modalStyles = {
    background: theme.colors.midnight,
    border: `1px solid ${theme.colors.transcendCyan}`,
    borderRadius: theme.borderRadius.lg,
    boxShadow: `0 0 ${theme.effects.glow.transcend.radius} rgba(0, 255, 238, ${theme.effects.glow.transcend.intensity})`,
    width: '100%',
    maxWidth: getModalWidth(),
    maxHeight: size === 'fullscreen' ? '95vh' : '90vh',
    display: 'flex',
    flexDirection: 'column',
    animation: 'float 0.4s ease-out',
    position: 'relative',
  };
  
  const headerStyles = {
    padding: theme.spacing.lg,
    borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };
  
  const titleStyles = {
    fontSize: theme.typography.scale.xl,
    fontWeight: 700,
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily,
    margin: 0,
  };
  
  const closeButtonStyles = {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: theme.typography.scale['2xl'],
    cursor: 'pointer',
    padding: theme.spacing.xs,
    lineHeight: 1,
    transition: `color ${theme.motion.duration.quick} ${theme.motion.easing.standard}`,
  };
  
  const contentStyles = {
    padding: theme.spacing.lg,
    flex: 1,
    overflowY: 'auto',
    color: theme.colors.white,
  };
  
  const footerStyles = {
    padding: theme.spacing.lg,
    borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
    display: 'flex',
    gap: theme.spacing.md,
    justifyContent: 'flex-end',
  };
  
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const handleCloseHover = (e, isHovering) => {
    e.target.style.color = isHovering ? theme.colors.alertRed : 'rgba(255, 255, 255, 0.6)';
  };
  
  return (
    <div 
      style={overlayStyles}
      onClick={handleOverlayClick}
      className="terra-modal-overlay"
    >
      <div 
        style={modalStyles}
        className={`terra-modal terra-modal-${size} ${className}`}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        {(title || showCloseButton) && (
          <div style={headerStyles}>
            {title && <h2 style={titleStyles}>{title}</h2>}
            {showCloseButton && (
              <button
                style={closeButtonStyles}
                onClick={onClose}
                onMouseEnter={(e) => handleCloseHover(e, true)}
                onMouseLeave={(e) => handleCloseHover(e, false)}
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}
        
        <div style={contentStyles}>
          {children}
        </div>
        
        {footer && (
          <div style={footerStyles}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default TerraModal;
