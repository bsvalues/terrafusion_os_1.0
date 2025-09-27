/**
 * Terrafusion Genius Button Component
 * Embodies Jobs/Ive/Musk/Tesla excellence in every interaction
 * Part of the @terrafusion/ui component library
 */

import React, {useState, useRef, useEffect} from 'react';
import './GeniusButton.css';

export interface GeniusButtonProps {children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  'aria-label'?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  animate?: boolean;
  haptic?: boolean;
  celebration?: boolean;}

export const GeniusButton: React.FC<GeniusButtonProps> = ({children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onClick,
  className = '',
  'aria-label': ariaLabel,
  type = 'button',
  fullWidth = false,
  animate = true,
  haptic = true,
  celebration = false,
  ...props}) => {const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number}>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);

  // Genius UX: Haptic feedback for supported devices
  const triggerHaptic = () => {if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(10); // Subtle haptic feedback}
  };

  // Genius UX: Celebration animation for success actions
  const triggerCelebration = () => {if (celebration && buttonRef.current) {
      buttonRef.current.classList.add('genius-celebrate');
      setTimeout(() => {
        buttonRef.current?.classList.remove('genius-celebrate');}, 600);
    }
  };

  // Genius UX: Material Design ripple effect
  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {if (!animate || disabled || loading) return;

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple = {
      id: rippleId.current++,
      x,
      y,};

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));}, 600);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {if (disabled || loading) return;

    // Genius UX: Immediate feedback
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);

    // Genius UX: Haptic feedback
    triggerHaptic();

    // Genius UX: Visual ripple effect
    createRipple(event);

    // Genius UX: Celebration for success actions
    if (variant === 'success') {
      triggerCelebration();}

    // Execute user's onClick handler
    onClick?.(event);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {if (event.key === 'Enter' || event.key === ' ') {
      setIsPressed(true);}
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) =>{if (event.key === 'Enter' || event.key === ' ') {
      setIsPressed(false);}
  };

  // Genius UX: Dynamic class composition
  const buttonClasses = [
    'genius-button',
    `genius-button--${variant}`,
    `genius-button--${size}`,
    disabled && 'genius-button--disabled',
    loading && 'genius-button--loading',
    isPressed && 'genius-button--pressed',
    fullWidth && 'genius-button--full-width',
    animate && 'genius-button--animated',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (<button
      ref={buttonRef}
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-disabled={disabled || loading}
      {...props}
    >{/* Loading spinner */}
      {loading && (<div className="genius-button__spinner"><div className="genius-spinner"></div></div>)}

      {/* Icon and content */}<div className="genius-button__content">{icon && iconPosition === 'left' && (<span className="genius-button__icon genius-button__icon--left">{icon}</span>)}<span className="genius-button__text">{children}</span>{icon && iconPosition === 'right' && (<span className="genius-button__icon genius-button__icon--right">{icon}</span>)}</div>{/* Ripple effects */}
      {animate && (<div className="genius-button__ripples">{ripples.map(ripple => (<div
              key={ripple.id}
              className="genius-button__ripple"
              style={{
                left: ripple.x,
                top: ripple.y,}} />))}</div>)}</button>
  );
};

export default GeniusButton;
