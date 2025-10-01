import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { terraFusionTheme, generateCSSVariables } from './TerraFusionTheme';

// Global Styles with TerraFusion Brand System
export const TerraFusionGlobalStyles = createGlobalStyle`
  ${generateCSSVariables(terraFusionTheme)}
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: var(--tf-font-family);
    background: linear-gradient(135deg, var(--tf-color-dark) 0%, var(--tf-color-dark-lighter) 100%);
    color: var(--tf-color-light);
    min-height: 100vh;
    overflow-x: hidden;
  }
  
  /* TerraFusion Scrollbars */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: var(--tf-color-dark);
  }
  
  ::-webkit-scrollbar-thumb {
    background: var(--tf-color-primary);
    border-radius: var(--tf-radius-full);
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: var(--tf-color-primary-dark);
  }
  
  /* TerraFusion Selections */
  ::selection {
    background: var(--tf-color-primary);
    color: var(--tf-color-light);
  }
  
  ::-moz-selection {
    background: var(--tf-color-primary);
    color: var(--tf-color-light);
  }
`;

// Core TerraFusion Components

export const TFContainer = styled.div<{
  maxWidth?: string;
  padding?: string;
  center?: boolean;
}>`
  max-width: ${props => props.maxWidth || '1200px'};
  padding: ${props => props.padding || 'var(--tf-spacing-md)'};
  margin: ${props => props.center ? '0 auto' : '0'};
  width: 100%;
`;

export const TFCard = styled.div<{
  variant?: 'default' | 'elevated' | 'transcendent';
  padding?: string;
}>`
  background: ${props => 
    props.variant === 'transcendent' 
      ? 'linear-gradient(135deg, rgba(0, 153, 255, 0.1) 0%, rgba(0, 255, 238, 0.1) 100%)'
      : 'rgba(26, 31, 58, 0.8)'
  };
  border: 1px solid ${props =>
    props.variant === 'transcendent' 
      ? 'var(--tf-color-transcend)'
      : 'rgba(0, 153, 255, 0.2)'
  };
  border-radius: var(--tf-radius-lg);
  padding: ${props => props.padding || 'var(--tf-spacing-lg)'};
  box-shadow: ${props =>
    props.variant === 'elevated' 
      ? 'var(--tf-shadow-lg)'
      : props.variant === 'transcendent'
      ? 'var(--tf-shadow-transcend)'
      : 'var(--tf-shadow-base)'
  };
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:hover {
    transform: ${props => props.variant === 'transcendent' ? 'translateY(-2px)' : 'none'};
    box-shadow: ${props => props.variant === 'transcendent' ? 'var(--tf-shadow-transcend)' : 'inherit'};
  }
`;

export const TFButton = styled.button<{
  variant?: 'primary' | 'secondary' | 'accent' | 'transcendent' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}>`
  padding: ${props => {
    switch (props.size) {
      case 'sm': return 'var(--tf-spacing-xs) var(--tf-spacing-sm)';
      case 'lg': return 'var(--tf-spacing-md) var(--tf-spacing-xl)';
      case 'xl': return 'var(--tf-spacing-lg) var(--tf-spacing-2xl)';
      default: return 'var(--tf-spacing-sm) var(--tf-spacing-lg)';
    }
  }};
  
  background: ${props => {
    switch (props.variant) {
      case 'primary': return 'var(--tf-color-primary)';
      case 'secondary': return 'transparent';
      case 'accent': return 'var(--tf-color-accent)';
      case 'transcendent': return 'linear-gradient(135deg, var(--tf-color-primary) 0%, var(--tf-color-transcend) 100%)';
      case 'ghost': return 'transparent';
      default: return 'var(--tf-color-primary)';
    }
  }};
  
  color: ${props => {
    switch (props.variant) {
      case 'secondary': return 'var(--tf-color-primary)';
      case 'ghost': return 'var(--tf-color-gray)';
      default: return 'var(--tf-color-light)';
    }
  }};
  
  border: ${props => {
    switch (props.variant) {
      case 'secondary': return '1px solid var(--tf-color-primary)';
      case 'ghost': return '1px solid transparent';
      default: return 'none';
    }
  }};
  
  border-radius: var(--tf-radius-md);
  font-family: var(--tf-font-family);
  font-weight: 600;
  font-size: ${props => {
    switch (props.size) {
      case 'sm': return '0.875rem';
      case 'lg': return '1.125rem';
      case 'xl': return '1.25rem';
      default: return '1rem';
    }
  }};
  
  cursor: pointer;
  transition: all 0.3s ease;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.variant === 'transcendent' ? 'var(--tf-shadow-transcend)' : 'var(--tf-shadow-md)'};
    
    background: ${props => {
      switch (props.variant) {
        case 'primary': return 'var(--tf-color-primary-dark)';
        case 'secondary': return 'rgba(0, 153, 255, 0.1)';
        case 'accent': return 'var(--tf-color-accent-dark)';
        case 'ghost': return 'rgba(136, 136, 136, 0.1)';
        default: return 'inherit';
      }
    }};
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export const TFInput = styled.input<{
  variant?: 'default' | 'transcendent';
  fullWidth?: boolean;
}>`
  padding: var(--tf-spacing-sm) var(--tf-spacing-md);
  background: rgba(26, 31, 58, 0.8);
  border: 1px solid ${props => 
    props.variant === 'transcendent' 
      ? 'var(--tf-color-transcend)' 
      : 'rgba(0, 153, 255, 0.3)'
  };
  border-radius: var(--tf-radius-md);
  color: var(--tf-color-light);
  font-family: var(--tf-font-family);
  font-size: 1rem;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &::placeholder {
    color: var(--tf-color-gray);
  }
  
  &:focus {
    outline: none;
    border-color: var(--tf-color-primary);
    box-shadow: 0 0 0 3px rgba(0, 153, 255, 0.1);
  }
  
  &:hover {
    border-color: var(--tf-color-primary);
  }
`;

export const TFText = styled.p<{
  variant?: 'body' | 'caption' | 'title' | 'heading' | 'display';
  color?: string;
  weight?: number;
  align?: 'left' | 'center' | 'right';
}>`
  font-family: var(--tf-font-family);
  color: ${props => props.color || 'var(--tf-color-light)'};
  font-weight: ${props => props.weight || 400};
  text-align: ${props => props.align || 'left'};
  line-height: 1.6;
  margin: 0;
  
  font-size: ${props => {
    switch (props.variant) {
      case 'caption': return '0.875rem';
      case 'title': return '1.25rem';
      case 'heading': return '1.875rem';
      case 'display': return '3rem';
      default: return '1rem';
    }
  }};
`;

export const TFHeading = styled.h1<{
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  gradient?: boolean;
  align?: 'left' | 'center' | 'right';
}>`
  font-family: var(--tf-font-family);
  font-weight: 800;
  text-align: ${props => props.align || 'left'};
  margin: 0 0 var(--tf-spacing-md) 0;
  
  ${props => props.gradient && `
    background: linear-gradient(135deg, var(--tf-color-primary) 0%, var(--tf-color-transcend) 50%, var(--tf-color-accent) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  `}
  
  font-size: ${props => {
    switch (props.level) {
      case 1: return '3rem';
      case 2: return '2.25rem';
      case 3: return '1.875rem';
      case 4: return '1.5rem';
      case 5: return '1.25rem';
      case 6: return '1.125rem';
      default: return '2.25rem';
    }
  }};
`;

export const TFGrid = styled.div<{
  columns?: number;
  gap?: string;
  responsive?: boolean;
}>`
  display: grid;
  grid-template-columns: ${props => 
    props.responsive 
      ? `repeat(auto-fit, minmax(300px, 1fr))`
      : `repeat(${props.columns || 3}, 1fr)`
  };
  gap: ${props => props.gap || 'var(--tf-spacing-lg)'};
`;

export const TFFlex = styled.div<{
  direction?: 'row' | 'column';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: boolean;
  gap?: string;
}>`
  display: flex;
  flex-direction: ${props => props.direction || 'row'};
  align-items: ${props => props.align || 'flex-start'};
  justify-content: ${props => props.justify || 'flex-start'};
  flex-wrap: ${props => props.wrap ? 'wrap' : 'nowrap'};
  gap: ${props => props.gap || '0'};
`;

export const TFBadge = styled.span<{
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'transcendent';
  size?: 'sm' | 'md' | 'lg';
}>`
  display: inline-flex;
  align-items: center;
  padding: ${props => {
    switch (props.size) {
      case 'sm': return 'var(--tf-spacing-xs) var(--tf-spacing-sm)';
      case 'lg': return 'var(--tf-spacing-sm) var(--tf-spacing-md)';
      default: return 'calc(var(--tf-spacing-xs) * 1.5) var(--tf-spacing-sm)';
    }
  }};
  
  background: ${props => {
    switch (props.variant) {
      case 'success': return 'var(--tf-color-success)';
      case 'warning': return 'var(--tf-color-warning)';
      case 'error': return 'var(--tf-color-error)';
      case 'transcendent': return 'linear-gradient(135deg, var(--tf-color-primary) 0%, var(--tf-color-transcend) 100%)';
      default: return 'var(--tf-color-primary)';
    }
  }};
  
  color: var(--tf-color-light);
  border-radius: var(--tf-radius-full);
  font-size: ${props => {
    switch (props.size) {
      case 'sm': return '0.75rem';
      case 'lg': return '1rem';
      default: return '0.875rem';
    }
  }};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

// Loading Components
export const TFSpinner = styled.div<{
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}>`
  width: ${props => {
    switch (props.size) {
      case 'sm': return '16px';
      case 'lg': return '32px';
      default: return '24px';
    }
  }};
  height: ${props => {
    switch (props.size) {
      case 'sm': return '16px';
      case 'lg': return '32px';
      default: return '24px';
    }
  }};
  border: 2px solid transparent;
  border-top: 2px solid ${props => props.color || 'var(--tf-color-primary)'};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const TFProgress = styled.div<{
  value: number;
  max?: number;
  variant?: 'primary' | 'transcendent';
}>`
  width: 100%;
  height: 8px;
  background: rgba(26, 31, 58, 0.8);
  border-radius: var(--tf-radius-full);
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => (props.value / (props.max || 100)) * 100}%;
    background: ${props => 
      props.variant === 'transcendent'
        ? 'linear-gradient(90deg, var(--tf-color-primary) 0%, var(--tf-color-transcend) 100%)'
        : 'var(--tf-color-primary)'
    };
    border-radius: var(--tf-radius-full);
    transition: width 0.3s ease;
  }
`;