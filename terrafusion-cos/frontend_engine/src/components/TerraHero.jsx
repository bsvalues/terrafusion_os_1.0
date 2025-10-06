/**
 * TerraHero - Official TerraFusion Hero Section Component
 * 
 * @architecture Canonical hero section with gradient backgrounds
 * Used for landing pages and section headers
 * 
 * @example
 * <TerraHero 
 *   title="Government. Transcended."
 *   subtitle="The future of civic technology"
 *   variant="clarity"
 * />
 */

import React from 'react';

import { useTheme } from '../theme/ThemeProvider.jsx';

const TerraHero = ({ 
  title,
  subtitle = null,
  variant = 'clarity', // 'clarity', 'transcendence', 'dark'
  children = null,
  animated = true,
  minHeight = '400px',
  align = 'center', // 'left', 'center', 'right'
  className = '',
  ...props 
}) => {
  const theme = useTheme();
  
  const getBackgroundGradient = () => {
    switch (variant) {
      case 'clarity':
        return theme.gradients.clarity;
      case 'transcendence':
        return theme.gradients.transcendence;
      case 'dark':
        return theme.gradients.darkBg;
      default:
        return theme.gradients.clarity;
    }
  };
  
  const containerStyles = {
    background: getBackgroundGradient(),
    minHeight: minHeight,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: align === 'left' ? 'flex-start' : 
                align === 'right' ? 'flex-end' : 'center',
    padding: `${theme.spacing['2xl']} ${theme.spacing.xl}`,
    position: 'relative',
    overflow: 'hidden',
    textAlign: align,
  };
  
  const titleStyles = {
    fontSize: theme.typography.scale['4xl'],
    fontWeight: 700,
    fontFamily: theme.typography.fontFamily,
    color: variant === 'dark' ? theme.colors.white : theme.colors.deepSpace,
    marginBottom: theme.spacing.md,
    maxWidth: '900px',
    animation: animated ? 'clarity-fade 1.2s ease-out' : 'none',
    textShadow: variant === 'dark' ? `0 0 30px rgba(0, 255, 238, 0.4)` : 'none',
  };
  
  const subtitleStyles = {
    fontSize: theme.typography.scale.xl,
    fontWeight: 500,
    color: variant === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(11, 16, 32, 0.8)',
    maxWidth: '700px',
    lineHeight: 1.6,
    animation: animated ? 'clarity-fade 1.2s ease-out 0.2s both' : 'none',
  };
  
  const childrenContainerStyles = {
    marginTop: theme.spacing.xl,
    animation: animated ? 'clarity-fade 1.2s ease-out 0.4s both' : 'none',
  };
  
  return (
    <section 
      style={containerStyles}
      className={`terra-hero terra-hero-${variant} ${className}`}
      {...props}
    >
      <h1 style={titleStyles}>
        {title}
      </h1>
      
      {subtitle && (
        <p style={subtitleStyles}>
          {subtitle}
        </p>
      )}
      
      {children && (
        <div style={childrenContainerStyles}>
          {children}
        </div>
      )}
    </section>
  );
};

export default TerraHero;
