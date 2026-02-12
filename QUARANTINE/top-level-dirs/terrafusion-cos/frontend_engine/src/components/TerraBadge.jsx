/**
 * TerraBadge - Official TerraFusion Badge Component
 * 
 * @architecture Status indicators and labels using design tokens
 * Used for tags, statuses, counts, and labels
 * 
 * @example
 * <TerraBadge variant="success">Active</TerraBadge>
 * <TerraBadge variant="alert" pulse={true}>3</TerraBadge>
 */

import React from 'react';

import { useTheme } from '../theme/ThemeProvider.jsx';

const TerraBadge = ({ 
  children,
  variant = 'default', // 'default', 'success', 'alert', 'warning', 'info'
  size = 'medium', // 'small', 'medium', 'large'
  pulse = false, // Pulsing animation for notifications
  rounded = true,
  className = '',
  ...props 
}) => {
  const theme = useTheme();
  
  const getVariantStyles = () => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: theme.typography.fontFamily,
      fontWeight: 600,
      borderRadius: rounded ? theme.borderRadius.full : theme.borderRadius.sm,
      border: 'none',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      transition: `all ${theme.motion.duration.quick} ${theme.motion.easing.standard}`,
    };
    
    const sizeStyles = {
      small: {
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        fontSize: theme.typography.scale.xs,
      },
      medium: {
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        fontSize: theme.typography.scale.sm,
      },
      large: {
        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
        fontSize: theme.typography.scale.base,
      },
    };
    
    const variantStyles = {
      default: {
        background: theme.colors.midnight,
        color: theme.colors.transcendCyan,
        border: `1px solid ${theme.colors.transcendCyan}`,
      },
      success: {
        background: theme.colors.successGreen,
        color: theme.colors.deepSpace,
      },
      alert: {
        background: theme.colors.alertRed,
        color: theme.colors.white,
      },
      warning: {
        background: theme.colors.cautionAmber,
        color: theme.colors.deepSpace,
      },
      info: {
        background: theme.colors.trustBlue,
        color: theme.colors.white,
      },
    };
    
    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };
  
  const badgeStyles = {
    ...getVariantStyles(),
    animation: pulse ? 'glow-pulse 2s ease-in-out infinite' : 'none',
  };
  
  return (
    <span 
      style={badgeStyles}
      className={`terra-badge terra-badge-${variant} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default TerraBadge;
