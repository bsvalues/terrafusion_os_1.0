/**
 * TerraMetric - Official TerraFusion Metric Display Component
 * 
 * @architecture Canonical metric/KPI display using design tokens
 * Used for dashboards and data visualization
 * 
 * @example
 * <TerraMetric 
 *   value="379M×" 
 *   label="Faster Performance"
 *   trend="up"
 * />
 */

import React from 'react';
import { useTheme } from '../theme/ThemeProvider.jsx';

const TerraMetric = ({ 
  value, 
  label,
  trend = null, // 'up', 'down', 'neutral', or null
  subtitle = null,
  icon = null,
  variant = 'default',
  animated = true,
  className = '',
  ...props 
}) => {
  const theme = useTheme();
  
  const containerStyles = {
    background: theme.colors.midnight,
    border: `1px solid rgba(0, 255, 238, 0.2)`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    textAlign: 'center',
    transition: `all ${theme.motion.duration.standard} ${theme.motion.easing.standard}`,
  };
  
  const valueStyles = {
    fontSize: theme.typography.scale['4xl'],
    fontWeight: 700,
    fontFamily: theme.typography.fontFamily,
    color: variant === 'success' ? theme.colors.successGreen :
           variant === 'alert' ? theme.colors.alertRed :
           theme.colors.transcendCyan,
    marginBottom: theme.spacing.sm,
    textShadow: animated ? `0 0 20px rgba(0, 255, 238, 0.3)` : 'none',
  };
  
  const labelStyles = {
    fontSize: theme.typography.scale.sm,
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };
  
  const subtitleStyles = {
    fontSize: theme.typography.scale.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: theme.spacing.xs,
  };
  
  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    if (trend === 'neutral') return '→';
    return null;
  };
  
  const getTrendColor = () => {
    if (trend === 'up') return theme.colors.successGreen;
    if (trend === 'down') return theme.colors.alertRed;
    if (trend === 'neutral') return theme.colors.cautionAmber;
    return theme.colors.white;
  };
  
  return (
    <div 
      style={containerStyles}
      className={`terra-metric terra-metric-${variant} ${className}`}
      {...props}
    >
      {icon && (
        <div style={{ fontSize: theme.typography.scale['2xl'], marginBottom: theme.spacing.sm }}>
          {icon}
        </div>
      )}
      
      <div style={valueStyles}>
        {value}
        {trend && (
          <span style={{ 
            fontSize: theme.typography.scale.lg, 
            marginLeft: theme.spacing.xs,
            color: getTrendColor(),
          }}>
            {getTrendIcon()}
          </span>
        )}
      </div>
      
      <div style={labelStyles}>
        {label}
      </div>
      
      {subtitle && (
        <div style={subtitleStyles}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default TerraMetric;
