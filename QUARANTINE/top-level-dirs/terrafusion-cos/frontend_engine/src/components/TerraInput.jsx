/**
 * TerraInput - Official TerraFusion Input Component
 * 
 * @architecture Form input fields using design tokens
 * Provides consistent form UX across the platform
 * 
 * @example
 * <TerraInput 
 *   label="Email Address"
 *   type="email"
 *   placeholder="user@government.gov"
 *   required
 * />
 */

import React, { useState } from 'react';

import { useTheme } from '../theme/ThemeProvider.jsx';

const TerraInput = ({ 
  label = null,
  type = 'text',
  placeholder = '',
  value = '',
  onChange = () => {},
  error = null,
  helperText = null,
  required = false,
  disabled = false,
  fullWidth = true,
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'default', // 'default', 'filled', 'outlined'
  icon = null,
  className = '',
  ...props 
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  
  const containerStyles = {
    width: fullWidth ? '100%' : 'auto',
    marginBottom: theme.spacing.md,
  };
  
  const labelStyles = {
    display: 'block',
    fontSize: theme.typography.scale.sm,
    fontWeight: 600,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily,
  };
  
  const inputWrapperStyles = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };
  
  const getInputStyles = () => {
    const baseStyles = {
      width: '100%',
      fontFamily: theme.typography.fontFamily,
      fontSize: size === 'small' ? theme.typography.scale.sm :
                size === 'large' ? theme.typography.scale.lg :
                theme.typography.scale.base,
      padding: size === 'small' ? `${theme.spacing.xs} ${theme.spacing.sm}` :
               size === 'large' ? `${theme.spacing.md} ${theme.spacing.lg}` :
               `${theme.spacing.sm} ${theme.spacing.md}`,
      paddingLeft: icon ? `${theme.spacing['2xl']}` : undefined,
      borderRadius: theme.borderRadius.md,
      border: error ? `2px solid ${theme.colors.alertRed}` :
              isFocused ? `2px solid ${theme.colors.transcendCyan}` :
              `1px solid rgba(255, 255, 255, 0.2)`,
      background: variant === 'filled' ? theme.colors.midnight :
                  variant === 'outlined' ? 'transparent' :
                  theme.colors.deepSpace,
      color: theme.colors.white,
      transition: `all ${theme.motion.duration.quick} ${theme.motion.easing.standard}`,
      outline: 'none',
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'text',
    };
    
    return baseStyles;
  };
  
  const iconStyles = {
    position: 'absolute',
    left: theme.spacing.sm,
    color: isFocused ? theme.colors.transcendCyan : 'rgba(255, 255, 255, 0.5)',
    fontSize: theme.typography.scale.lg,
    pointerEvents: 'none',
  };
  
  const errorStyles = {
    display: 'block',
    fontSize: theme.typography.scale.xs,
    color: theme.colors.alertRed,
    marginTop: theme.spacing.xs,
  };
  
  const helperStyles = {
    display: 'block',
    fontSize: theme.typography.scale.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: theme.spacing.xs,
  };
  
  return (
    <div style={containerStyles} className={`terra-input-container ${className}`}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: theme.colors.alertRed }}> *</span>}
        </label>
      )}
      
      <div style={inputWrapperStyles}>
        {icon && <span style={iconStyles}>{icon}</span>}
        
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          required={required}
          style={getInputStyles()}
          className="terra-input"
          {...props}
        />
      </div>
      
      {error && <span style={errorStyles}>{error}</span>}
      {helperText && !error && <span style={helperStyles}>{helperText}</span>}
    </div>
  );
};

export default TerraInput;
