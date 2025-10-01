// Local TerraFusion components for IDE
import styled, { createGlobalStyle } from 'styled-components';

// Global Styles
export const TerraFusionGlobalStyles = createGlobalStyle`
  :root {
    --tf-color-primary: #0099ff;
    --tf-color-accent: #00ffaa;
    --tf-color-transcend: #00ffee;
    --tf-color-dark: #0b1020;
    --tf-color-light: #ffffff;
    --tf-color-gray: #888888;
    --tf-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --tf-spacing-xs: 0.25rem;
    --tf-spacing-sm: 0.5rem;
    --tf-spacing-md: 1rem;
    --tf-spacing-lg: 1.5rem;
    --tf-spacing-xl: 2rem;
    --tf-radius-md: 0.375rem;
    --tf-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: var(--tf-font-family);
    background: var(--tf-color-dark);
    color: var(--tf-color-light);
    min-height: 100vh;
  }
`;

// Components
export const TFHeading = styled.h1<{
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  gradient?: boolean;
}>`
  font-family: var(--tf-font-family);
  font-weight: 800;
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

export const TFFlex = styled.div<{
  direction?: 'row' | 'column';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  gap?: string;
}>`
  display: flex;
  flex-direction: ${props => props.direction || 'row'};
  align-items: ${props => props.align || 'flex-start'};
  justify-content: ${props => props.justify || 'flex-start'};
  gap: ${props => props.gap || '0'};
`;

export const TFButton = styled.button<{
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}>`
  padding: ${props => {
    switch (props.size) {
      case 'sm': return 'var(--tf-spacing-xs) var(--tf-spacing-sm)';
      case 'lg': return 'var(--tf-spacing-md) var(--tf-spacing-xl)';
      default: return 'var(--tf-spacing-sm) var(--tf-spacing-lg)';
    }
  }};
  
  background: ${props => {
    switch (props.variant) {
      case 'secondary': return 'transparent';
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
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--tf-shadow-md);
  }
`;

export const TFCard = styled.div<{
  variant?: 'default' | 'elevated';
  padding?: string;
}>`
  background: rgba(26, 31, 58, 0.8);
  border: 1px solid rgba(0, 153, 255, 0.2);
  border-radius: var(--tf-radius-md);
  padding: ${props => props.padding || 'var(--tf-spacing-lg)'};
  box-shadow: ${props => props.variant === 'elevated' ? 'var(--tf-shadow-md)' : 'none'};
  backdrop-filter: blur(10px);
`;
