/**
 * TerraButton - Official TerraFusion Button Component
 * 
 * @architecture Canonical button implementation using design tokens
 * All buttons in TerraFusion MUST use this component for consistency
 * 
 * @example
 * <TerraButton variant="primary" onClick={handleClick}>
 *   Take Action
 * </TerraButton>
 */

import React from 'react';
import { useTheme } from '../theme/ThemeProvider.jsx';

const TerraButton = ({ 
  children, 
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) => {
  const theme = useTheme();
  
  const getVariantStyles = () => {
    const baseStyles = {
      padding: size === 'small' ? `${theme.spacing.xs} ${theme.spacing.sm}` :
               size === 'large' ? `${theme.spacing.md} ${theme.spacing.xl}` :
               `${theme.spacing.sm} ${theme.spacing.md}`,
      fontSize: size === 'small' ? theme.typography.scale.sm :
                size === 'large' ? theme.typography.scale.lg :
                theme.typography.scale.base,
      borderRadius: theme.borderRadius.md,
      fontFamily: theme.typography.fontFamily,
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      border: 'none',
      transition: `all ${theme.motion.duration.quick} ${theme.motion.easing.standard}`,
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled ? 0.5 : 1,
    };
    
    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          background: theme.gradients.clarity,
          color: theme.colors.deepSpace,
          boxShadow: `0 0 ${theme.effects.glow.clarity.radius} rgba(0, 170, 255, ${theme.effects.glow.clarity.intensity})`,
        };
      
      case 'secondary':
        return {
          ...baseStyles,
          background: theme.colors.midnight,
          color: theme.colors.transcendCyan,
          border: `1px solid ${theme.colors.transcendCyan}`,
        };
      
      case 'alert':
        return {
          ...baseStyles,
          background: theme.colors.alertRed,
          color: theme.colors.white,
        };
      
      case 'success':
        return {
          ...baseStyles,
          background: theme.colors.successGreen,
          color: theme.colors.deepSpace,
        };
      
      case 'ghost':
        return {
          ...baseStyles,
          background: 'transparent',
          color: theme.colors.transcendCyan,
          border: `1px solid transparent`,
        };
      
      default:
        return baseStyles;
    }
  };
  
  const handleMouseEnter = (e) => {
    if (disabled) return;
    
    if (variant === 'primary') {
      e.target.style.transform = 'translateY(-2px)';
      e.target.style.boxShadow = `0 0 ${theme.effects.glow.transcend.radius} rgba(0, 255, 238, ${theme.effects.glow.transcend.intensity})`;
    } else if (variant === 'secondary' || variant === 'ghost') {
      e.target.style.background = `rgba(0, 255, 238, 0.1)`;
      e.target.style.borderColor = theme.colors.transcendCyan;
    }
  };
  
  const handleMouseLeave = (e) => {
    if (disabled) return;
    
    e.target.style.transform = 'translateY(0)';
    
    const styles = getVariantStyles();
    e.target.style.background = styles.background;
    e.target.style.boxShadow = styles.boxShadow || 'none';
    e.target.style.borderColor = styles.border ? theme.colors.transcendCyan : 'transparent';
  };
  
  return (
    <button
      type={type}
      style={getVariantStyles()}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      className={`terra-button terra-button-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default TerraButton;
