/**
 * TerraGrid - Official TerraFusion Grid Layout Component
 * 
 * @architecture Responsive grid system using design tokens
 * Provides consistent spacing and responsive behavior
 * 
 * @example
 * <TerraGrid columns={3} gap="lg">
 *   <TerraCard>Item 1</TerraCard>
 *   <TerraCard>Item 2</TerraCard>
 *   <TerraCard>Item 3</TerraCard>
 * </TerraGrid>
 */

import React from 'react';

import { useTheme } from '../theme/ThemeProvider.jsx';

const TerraGrid = ({ 
  children,
  columns = 'auto', // 1, 2, 3, 4, or 'auto' for auto-fit
  gap = 'md', // 'xs', 'sm', 'md', 'lg', 'xl', '2xl'
  minColumnWidth = '250px', // Used when columns='auto'
  align = 'stretch', // 'start', 'center', 'end', 'stretch'
  className = '',
  style = {},
  ...props 
}) => {
  const theme = useTheme();
  
  const getGapValue = () => {
    const gapMap = {
      xs: theme.spacing.xs,
      sm: theme.spacing.sm,
      md: theme.spacing.md,
      lg: theme.spacing.lg,
      xl: theme.spacing.xl,
      '2xl': theme.spacing['2xl'],
    };
    return gapMap[gap] || theme.spacing.md;
  };
  
  const getGridTemplateColumns = () => {
    if (columns === 'auto') {
      return `repeat(auto-fit, minmax(${minColumnWidth}, 1fr))`;
    }
    return `repeat(${columns}, 1fr)`;
  };
  
  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: getGridTemplateColumns(),
    gap: getGapValue(),
    alignItems: align,
    width: '100%',
    ...style,
  };
  
  return (
    <div 
      style={gridStyles}
      className={`terra-grid terra-grid-${columns} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default TerraGrid;
