/**
 * TerraFusion cOS UI Component Kit
 * Government-grade React components with accessibility and brand compliance
 * Built on TerraFusion Design System tokens
 */

import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { terraFusionThemeManager } from '../design_system/theme_manager.js';

// Base TerraFusion Button Component
export const TerraFusionButton = forwardRef(({
    variant = 'primary',
    size = 'base',
    disabled = false,
    loading = false,
    icon = null,
    iconPosition = 'left',
    children,
    className = '',
    onClick,
    ...props
}, ref) => {
    const baseClasses = 'tf-button tf-transition';
    const variantClasses = {
        primary: 'tf-button-primary',
        secondary: 'tf-button-secondary',
        tertiary: 'tf-bg-glass tf-text-accent tf-border-accent',
        danger: 'tf-bg-glass tf-text-error tf-border-error',
        success: 'tf-bg-glass tf-text-success tf-border-success'
    };
    
    const sizeClasses = {
        sm: 'tf-text-xs tf-p-2',
        base: 'tf-text-sm tf-p-3',
        lg: 'tf-text-base tf-p-4'
    };

    const classes = [
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled ? 'tf-opacity-50 cursor-not-allowed' : '',
        className
    ].filter(Boolean).join(' ');

    const handleClick = (e) => {
        if (disabled || loading) return;
        onClick?.(e);
    };

    return (
        <button
            ref={ref}
            className={classes}
            disabled={disabled || loading}
            onClick={handleClick}
            aria-busy={loading}
            {...props}
        >
            {loading && (
                <span className="tf-animate-pulse">⟐</span>
            )}
            {!loading && icon && iconPosition === 'left' && (
                <span className="tf-text-current">{icon}</span>
            )}
            {children}
            {!loading && icon && iconPosition === 'right' && (
                <span className="tf-text-current">{icon}</span>
            )}
        </button>
    );
});

TerraFusionButton.displayName = 'TerraFusionButton';

// TerraFusion Input Component
export const TerraFusionInput = forwardRef(({
    type = 'text',
    size = 'base',
    error = false,
    success = false,
    icon = null,
    iconPosition = 'left',
    placeholder,
    disabled = false,
    className = '',
    ...props
}, ref) => {
    const baseClasses = 'tf-input tf-transition';
    const stateClasses = error ? 'tf-border-error tf-glow-error' : 
                        success ? 'tf-border-success tf-glow-accent' : '';
    
    const sizeClasses = {
        sm: 'tf-text-sm tf-p-2',
        base: 'tf-text-sm tf-p-3',
        lg: 'tf-text-base tf-p-4'
    };

    const classes = [
        baseClasses,
        sizeClasses[size],
        stateClasses,
        disabled ? 'tf-opacity-50 cursor-not-allowed' : '',
        className
    ].filter(Boolean).join(' ');

    if (icon) {
        return (
            <div className="tf-relative tf-inline-block tf-w-full">
                {iconPosition === 'left' && (
                    <span className="tf-absolute tf-left-3 tf-top-1/2 tf-transform -tf-translate-y-1/2 tf-text-muted">
                        {icon}
                    </span>
                )}
                <input
                    ref={ref}
                    type={type}
                    className={`${classes} ${iconPosition === 'left' ? 'tf-pl-10' : ''} ${iconPosition === 'right' ? 'tf-pr-10' : ''}`}
                    placeholder={placeholder}
                    disabled={disabled}
                    {...props}
                />
                {iconPosition === 'right' && (
                    <span className="tf-absolute tf-right-3 tf-top-1/2 tf-transform -tf-translate-y-1/2 tf-text-muted">
                        {icon}
                    </span>
                )}
            </div>
        );
    }

    return (
        <input
            ref={ref}
            type={type}
            className={classes}
            placeholder={placeholder}
            disabled={disabled}
            {...props}
        />
    );
});

TerraFusionInput.displayName = 'TerraFusionInput';

// TerraFusion Card Component
export const TerraFusionCard = ({
    variant = 'default',
    padding = 'base',
    shadow = 'base',
    glow = false,
    children,
    className = '',
    ...props
}) => {
    const baseClasses = 'tf-card tf-transition';
    const variantClasses = {
        default: 'tf-bg-glass tf-border',
        primary: 'tf-bg-glass tf-border-accent',
        secondary: 'tf-bg-secondary tf-border',
        tertiary: 'tf-bg-tertiary tf-border-secondary'
    };
    
    const paddingClasses = {
        none: 'tf-p-0',
        sm: 'tf-p-3',
        base: 'tf-p-6',
        lg: 'tf-p-8'
    };
    
    const shadowClasses = {
        none: '',
        sm: 'tf-shadow-sm',
        base: 'tf-shadow',
        md: 'tf-shadow-md',
        lg: 'tf-shadow-lg',
        xl: 'tf-shadow-xl'
    };

    const classes = [
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        shadowClasses[shadow],
        glow ? 'tf-glow-primary' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
};

// TerraFusion Modal Component
export const TerraFusionModal = ({
    isOpen = false,
    onClose,
    title,
    size = 'base',
    closable = true,
    children,
    className = ''
}) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const modalRef = useRef();

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && closable) {
            onClose?.();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && closable) {
            onClose?.();
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, closable]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'tf-max-w-md',
        base: 'tf-max-w-lg',
        lg: 'tf-max-w-2xl',
        xl: 'tf-max-w-4xl',
        full: 'tf-max-w-full tf-m-4'
    };

    return (
        <div 
            className="tf-modal tf-animate-fade-in"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
        >
            <div 
                ref={modalRef}
                className={`tf-modal-content tf-animate-slide-up ${sizeClasses[size]} ${className}`}
            >
                {title && (
                    <div className="tf-flex tf-items-center tf-justify-between tf-mb-6">
                        <h2 id="modal-title" className="tf-text-xl tf-font-semibold tf-text-primary">
                            {title}
                        </h2>
                        {closable && (
                            <TerraFusionButton
                                variant="secondary"
                                size="sm"
                                onClick={onClose}
                                icon="✕"
                                aria-label="Close modal"
                            />
                        )}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
};

// TerraFusion Badge Component
export const TerraFusionBadge = ({
    variant = 'default',
    size = 'base',
    icon = null,
    children,
    className = ''
}) => {
    const baseClasses = 'tf-inline-flex tf-items-center tf-gap-1 tf-rounded-full tf-font-medium tf-transition';
    const variantClasses = {
        default: 'tf-bg-glass tf-text-secondary tf-border',
        primary: 'tf-bg-primary-blue tf-text-white',
        accent: 'tf-bg-accent-green tf-text-primary',
        success: 'tf-bg-success tf-text-primary',
        warning: 'tf-bg-warning tf-text-primary',
        error: 'tf-bg-error tf-text-white',
        info: 'tf-bg-info tf-text-primary'
    };
    
    const sizeClasses = {
        sm: 'tf-text-xs tf-px-2 tf-py-1',
        base: 'tf-text-sm tf-px-3 tf-py-1',
        lg: 'tf-text-base tf-px-4 tf-py-2'
    };

    const classes = [
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
    ].filter(Boolean).join(' ');

    return (
        <span className={classes}>
            {icon && <span className="tf-text-current">{icon}</span>}
            {children}
        </span>
    );
};

// TerraFusion Loading Spinner
export const TerraFusionSpinner = ({
    size = 'base',
    color = 'primary',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'tf-w-4 tf-h-4',
        base: 'tf-w-6 tf-h-6',
        lg: 'tf-w-8 tf-h-8',
        xl: 'tf-w-12 tf-h-12'
    };
    
    const colorClasses = {
        primary: 'tf-text-primary-blue',
        accent: 'tf-text-accent-green',
        tertiary: 'tf-text-tertiary-cyan',
        white: 'tf-text-white',
        muted: 'tf-text-muted'
    };

    const classes = [
        'tf-animate-pulse',
        sizeClasses[size],
        colorClasses[color],
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} role="status" aria-label="Loading">
            <span className="tf-block tf-text-center">⟐</span>
        </div>
    );
};

// TerraFusion Alert Component
export const TerraFusionAlert = ({
    variant = 'info',
    dismissible = false,
    onDismiss,
    icon = null,
    title,
    children,
    className = ''
}) => {
    const [isVisible, setIsVisible] = useState(true);
    
    const baseClasses = 'tf-p-4 tf-rounded-lg tf-border tf-transition';
    const variantClasses = {
        info: 'tf-bg-info tf-bg-opacity-10 tf-border-info tf-text-info',
        success: 'tf-bg-success tf-bg-opacity-10 tf-border-success tf-text-success',
        warning: 'tf-bg-warning tf-bg-opacity-10 tf-border-warning tf-text-warning',
        error: 'tf-bg-error tf-bg-opacity-10 tf-border-error tf-text-error'
    };

    const defaultIcons = {
        info: '◊',
        success: '⬢',
        warning: '∆',
        error: '⬡'
    };

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss?.();
    };

    if (!isVisible) return null;

    const classes = [
        baseClasses,
        variantClasses[variant],
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} role="alert">
            <div className="tf-flex tf-items-start tf-gap-3">
                <span className="tf-text-current tf-flex-shrink-0">
                    {icon || defaultIcons[variant]}
                </span>
                <div className="tf-flex-1">
                    {title && (
                        <h3 className="tf-font-semibold tf-mb-1">{title}</h3>
                    )}
                    <div>{children}</div>
                </div>
                {dismissible && (
                    <TerraFusionButton
                        variant="secondary"
                        size="sm"
                        onClick={handleDismiss}
                        icon="✕"
                        className="tf-flex-shrink-0"
                        aria-label="Dismiss alert"
                    />
                )}
            </div>
        </div>
    );
};

// TerraFusion Progress Bar
export const TerraFusionProgress = ({
    value = 0,
    max = 100,
    size = 'base',
    variant = 'primary',
    showLabel = false,
    label,
    className = ''
}) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    const sizeClasses = {
        sm: 'tf-h-1',
        base: 'tf-h-2',
        lg: 'tf-h-3'
    };
    
    const variantClasses = {
        primary: 'tf-bg-primary-blue',
        accent: 'tf-bg-accent-green',
        success: 'tf-bg-success',
        warning: 'tf-bg-warning',
        error: 'tf-bg-error'
    };

    const classes = [
        'tf-w-full tf-bg-gray-700 tf-rounded-full tf-overflow-hidden',
        sizeClasses[size],
        className
    ].filter(Boolean).join(' ');

    const progressClasses = [
        'tf-h-full tf-transition-all tf-duration-normal',
        variantClasses[variant]
    ].join(' ');

    return (
        <div className="tf-w-full">
            {showLabel && (
                <div className="tf-flex tf-justify-between tf-mb-2">
                    <span className="tf-text-sm tf-text-secondary">
                        {label || 'Progress'}
                    </span>
                    <span className="tf-text-sm tf-text-secondary">
                        {Math.round(percentage)}%
                    </span>
                </div>
            )}
            <div className={classes} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
                <div 
                    className={progressClasses}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

// Export all components
export const TerraFusionUIKit = {
    Button: TerraFusionButton,
    Input: TerraFusionInput,
    Card: TerraFusionCard,
    Modal: TerraFusionModal,
    Badge: TerraFusionBadge,
    Spinner: TerraFusionSpinner,
    Alert: TerraFusionAlert,
    Progress: TerraFusionProgress
};

export default TerraFusionUIKit;