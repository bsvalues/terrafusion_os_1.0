/**
 * TerraLoader - Official TerraFusion Loading Component
 * 
 * @architecture Loading states and spinners using design tokens
 * Provides consistent loading UX across the platform
 * 
 * @example
 * <TerraLoader variant="spinner" size="large" />
 * <TerraLoader variant="pulse" text="Loading data..." />
 */

import React from 'react';

import { useTheme } from '../theme/ThemeProvider.jsx';

const TerraLoader = ({ 
  variant = 'spinner', // 'spinner', 'pulse', 'dots'
  size = 'medium', // 'small', 'medium', 'large'
  text = null,
  color = 'transcendCyan', // Any theme color key
  centered = false,
  className = '',
  ...props 
}) => {
  const theme = useTheme();
  
  const getSizeValue = () => {
    const sizeMap = {
      small: '24px',
      medium: '48px',
      large: '72px',
    };
    return sizeMap[size] || '48px';
  };
  
  const getColor = () => {
    return theme.colors[color] || theme.colors.transcendCyan;
  };
  
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: centered ? 'center' : 'flex-start',
    gap: theme.spacing.md,
    width: centered ? '100%' : 'auto',
    minHeight: centered ? '200px' : 'auto',
  };
  
  const spinnerStyles = {
    width: getSizeValue(),
    height: getSizeValue(),
    border: `4px solid ${theme.colors.midnight}`,
    borderTop: `4px solid ${getColor()}`,
    borderRadius: theme.borderRadius.full,
    animation: 'spin 1s linear infinite',
  };
  
  const pulseStyles = {
    width: getSizeValue(),
    height: getSizeValue(),
    borderRadius: theme.borderRadius.full,
    background: getColor(),
    animation: 'glow-pulse 1.5s ease-in-out infinite',
  };
  
  const dotsContainerStyles = {
    display: 'flex',
    gap: theme.spacing.sm,
  };
  
  const dotStyles = {
    width: size === 'small' ? '8px' : size === 'large' ? '16px' : '12px',
    height: size === 'small' ? '8px' : size === 'large' ? '16px' : '12px',
    borderRadius: theme.borderRadius.full,
    background: getColor(),
  };
  
  const textStyles = {
    fontSize: theme.typography.scale.base,
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily,
  };
  
  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return <div style={spinnerStyles} />;
      
      case 'pulse':
        return <div style={pulseStyles} />;
      
      case 'dots':
        return (
          <div style={dotsContainerStyles}>
            <div style={{ ...dotStyles, animation: 'glow-pulse 1.4s ease-in-out infinite' }} />
            <div style={{ ...dotStyles, animation: 'glow-pulse 1.4s ease-in-out infinite 0.2s' }} />
            <div style={{ ...dotStyles, animation: 'glow-pulse 1.4s ease-in-out infinite 0.4s' }} />
          </div>
        );
      
      default:
        return <div style={spinnerStyles} />;
    }
  };
  
  return (
    <div 
      style={containerStyles}
      className={`terra-loader terra-loader-${variant} ${className}`}
      {...props}
    >
      {renderLoader()}
      {text && <p style={textStyles}>{text}</p>}
    </div>
  );
};

// Add keyframe for spinner
if (typeof document !== 'undefined') {
  const styleSheet = document.styleSheets[0];
  const keyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
}

export default TerraLoader;
