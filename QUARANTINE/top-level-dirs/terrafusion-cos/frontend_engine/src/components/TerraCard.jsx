/**
 * TerraCard - Official TerraFusion Card Component
 * 
 * @architecture Canonical card container using design tokens
 * All cards/panels in TerraFusion MUST use this component
 * 
 * @example
 * <TerraCard variant="default" hover={true}>
 *   <h3>Card Title</h3>
 *   <p>Card content...</p>
 * </TerraCard>
 */

import React from 'react';
import { useTheme } from '../theme/ThemeProvider.jsx';

const TerraCard = ({ 
  children, 
  variant = 'default',
  hover = true,
  glow = false,
  className = '',
  onClick,
  style = {},
  ...props 
}) => {
  const theme = useTheme();
  
  const getVariantStyles = () => {
    const baseStyles = {
      background: theme.colors.midnight,
      border: `1px solid rgba(0, 255, 238, 0.2)`,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      transition: `all ${theme.motion.duration.standard} ${theme.motion.easing.emphasized}`,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    };
    
    switch (variant) {
      case 'elevated':
        return {
          ...baseStyles,
          boxShadow: theme.effects.shadow.card,
        };
      
      case 'glow':
        return {
          ...baseStyles,
          boxShadow: `0 0 ${theme.effects.glow.transcend.radius} rgba(0, 255, 238, ${theme.effects.glow.transcend.intensity})`,
          borderColor: theme.colors.transcendCyan,
        };
      
      case 'flat':
        return {
          ...baseStyles,
          border: 'none',
          background: `rgba(26, 31, 58, 0.5)`,
        };
      
      default:
        return baseStyles;
    }
  };
  
  const [isHovered, setIsHovered] = React.useState(false);
  
  const hoverStyles = hover && isHovered ? {
    transform: 'translateY(-4px)',
    boxShadow: `0 0 ${theme.effects.glow.transcend.radius} rgba(0, 255, 238, ${theme.effects.glow.transcend.intensity})`,
    borderColor: theme.colors.transcendCyan,
  } : {};
  
  return (
    <div
      style={{ ...getVariantStyles(), ...hoverStyles }}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`terra-card terra-card-${variant} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default TerraCard;
