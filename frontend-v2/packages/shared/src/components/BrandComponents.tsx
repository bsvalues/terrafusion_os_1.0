/**
 * TerraFusion Brand Components - Government Operating System UI Library
 * MIT PhD-Level Component Architecture with Transcendent Design
 * 
 * These components ensure consistent "Government. Transcended." identity
 * while providing enterprise-grade functionality for government operations.
 * 
 * Author: TerraFusion-AI (MIT PhD Systems Engineer)
 * Version: 2.0.0 - Enhanced Government Operating System
 */

import React, { forwardRef, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';
import styled, { keyframes, css, createGlobalStyle } from 'styled-components';
import { TerraFusionBrand } from '../brand/TerraFusionBrand';

// ===================== GLOBAL STYLES =====================
export const GlobalTerraFusionStyles = createGlobalStyle`
  :root {
    ${Object.entries(TerraFusionBrand.getCSSVariables()).map(([key, value]) => `${key}: ${value};`).join('\n    ')}
  }

  * {
    box-sizing: border-box;
  }

  body {
    background: ${TerraFusionBrand.COLORS.gradients.dark};
    color: ${TerraFusionBrand.COLORS.light};
    font-family: ${TerraFusionBrand.TYPOGRAPHY.fonts.primary};
    margin: 0;
    padding: 0;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Transcendence animations */
  @keyframes tf-pulse {
    0%, 100% { 
      opacity: 1;
      transform: scale(1);
    }
    50% { 
      opacity: 0.8;
      transform: scale(1.05);
    }
  }

  @keyframes tf-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  @keyframes tf-clarity-fade {
    from {
      opacity: 0;
      transform: translateY(20px);
      filter: blur(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
      filter: blur(0);
    }
  }

  @keyframes tf-transcendence-flow {
    0% { transform: translateX(-100%) rotate(0deg); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateX(100%) rotate(360deg); opacity: 0; }
  }

  /* Utility classes */
  .tf-gradient-text {
    background: ${TerraFusionBrand.COLORS.gradients.hero};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 30px rgba(0, 255, 238, 0.3));
  }

  .tf-glass {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 255, 238, 0.2);
  }

  .tf-animate-pulse {
    animation: tf-pulse 3s ease-in-out infinite;
  }

  .tf-animate-float {
    animation: tf-float 6s ease-in-out infinite;
  }

  .tf-animate-fade-in {
    animation: tf-clarity-fade 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  /* Accessibility */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Focus styles for accessibility */
  *:focus-visible {
    outline: 2px solid ${TerraFusionBrand.COLORS.transcend};
    outline-offset: 2px;
  }
`;

// ===================== ANIMATION KEYFRAMES =====================
const transcendencePulse = keyframes`
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
    filter: brightness(1);
  }
  50% { 
    opacity: 0.8;
    transform: scale(1.05);
    filter: brightness(1.2);
  }
`;

const floatEffect = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(1deg); }
`;

const clarityFade = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
`;

// ===================== STYLED COMPONENTS =====================

// Transcendence Glow Mixin
const transcendenceGlow = css`
  box-shadow: ${TerraFusionBrand.EFFECTS.shadows.transcend};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    box-shadow: 0 0 60px rgba(0, 255, 238, 0.5);
    transform: translateY(-2px);
  }
`;

// Glass Morphism Standard
const glassMorphism = css`
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 255, 238, 0.2);
`;

// ===================== BUTTON COMPONENTS =====================
interface TFButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'transcend' | 'government';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const StyledButton = styled.button<TFButtonProps>`
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  outline: none;
  
  ${props => props.fullWidth && css`width: 100%;`}
  
  /* Size variants */
  ${props => props.size === 'sm' && css`
    padding: 8px 16px;
    font-size: 0.875rem;
  `}
  
  ${props => props.size === 'lg' && css`
    padding: 16px 32px;
    font-size: 1.125rem;
  `}
  
  ${props => !props.size && css`
    padding: 12px 24px;
    font-size: 1rem;
  `}
  
  /* Style variants */
  ${props => props.variant === 'primary' && css`
    background: ${TerraFusionBrand.COLORS.gradients.hero};
    color: white;
    ${transcendenceGlow}
  `}
  
  ${props => props.variant === 'transcend' && css`
    background: ${TerraFusionBrand.COLORS.gradients.transcendence};
    color: white;
    animation: ${transcendencePulse} 3s ease-in-out infinite;
    ${transcendenceGlow}
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  `}
  
  ${props => props.variant === 'secondary' && css`
    background: transparent;
    color: ${TerraFusionBrand.COLORS.transcend};
    border: 2px solid ${TerraFusionBrand.COLORS.transcend};
    
    &:hover {
      background: rgba(0, 255, 238, 0.1);
      transform: translateY(-2px);
    }
  `}
  
  ${props => props.variant === 'government' && css`
    background: ${TerraFusionBrand.COLORS.gradients.government};
    color: white;
    border: 1px solid rgba(0, 153, 255, 0.3);
    ${transcendenceGlow}
  `}
  
  /* Loading state */
  ${props => props.isLoading && css`
    pointer-events: none;
    opacity: 0.7;
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin: -10px 0 0 -10px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}
  
  /* Disabled state */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
  
  /* Focus state for accessibility */
  &:focus-visible {
    outline: 2px solid ${TerraFusionBrand.COLORS.transcend};
    outline-offset: 2px;
  }
`;

export const TFButton = forwardRef<HTMLButtonElement, TFButtonProps>(
  ({ children, variant = 'primary', size = 'md', isLoading, ...props }, ref) => {
    return (
      <StyledButton
        ref={ref}
        variant={variant}
        size={size}
        isLoading={isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {!isLoading && children}
        {isLoading && <span className="sr-only">Loading...</span>}
      </StyledButton>
    );
  }
);

TFButton.displayName = 'TFButton';

// ===================== CARD COMPONENTS =====================
interface TFCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'government' | 'solid';
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const StyledCard = styled.div<TFCardProps>`
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Padding variants */
  ${props => props.padding === 'sm' && css`padding: 16px;`}
  ${props => props.padding === 'lg' && css`padding: 32px;`}
  ${props => !props.padding && css`padding: 24px;`}
  
  /* Style variants */
  ${props => props.variant === 'glass' && css`
    ${glassMorphism}
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: ${TerraFusionBrand.COLORS.gradients.hero};
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }
    
    ${props.hover && css`
      &:hover::before {
        transform: scaleX(1);
      }
      
      &:hover {
        border-color: rgba(0, 255, 238, 0.4);
        transform: translateY(-2px);
      }
    `}
  `}
  
  ${props => props.variant === 'government' && css`
    background: ${TerraFusionBrand.COLORS.gradients.government};
    border: 2px solid rgba(0, 153, 255, 0.3);
    box-shadow: ${TerraFusionBrand.EFFECTS.shadows.government};
  `}
  
  ${props => props.variant === 'solid' && css`
    background: ${TerraFusionBrand.COLORS.darkLighter};
    border: 1px solid rgba(255, 255, 255, 0.1);
  `}
`;

export const TFCard: React.FC<TFCardProps> = ({ 
  children, 
  variant = 'glass', 
  padding = 'md',
  hover = true,
  ...props 
}) => {
  return (
    <StyledCard 
      variant={variant} 
      padding={padding} 
      hover={hover}
      {...props}
    >
      {children}
    </StyledCard>
  );
};

// ===================== INPUT COMPONENTS =====================
interface TFInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const Label = styled.label`
  color: ${TerraFusionBrand.COLORS.light};
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.5px;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input<{ hasIcon?: boolean; hasError?: boolean }>`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid ${props => props.hasError ? TerraFusionBrand.COLORS.error : 'rgba(0, 255, 238, 0.3)'};
  border-radius: 8px;
  padding: 12px 16px;
  ${props => props.hasIcon && css`padding-left: 48px;`}
  color: ${TerraFusionBrand.COLORS.light};
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    border-color: ${TerraFusionBrand.COLORS.transcend};
    box-shadow: 0 0 20px rgba(0, 255, 238, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const IconContainer = styled.div`
  position: absolute;
  left: 16px;
  color: ${TerraFusionBrand.COLORS.transcend};
  pointer-events: none;
`;

const ErrorText = styled.span`
  color: ${TerraFusionBrand.COLORS.error};
  font-size: 0.75rem;
  margin-top: 4px;
`;

export const TFInput = forwardRef<HTMLInputElement, TFInputProps>(
  ({ label, error, icon, ...props }, ref) => {
    const hasIcon = !!icon;
    const hasError = !!error;
    
    return (
      <InputContainer>
        {label && <Label>{label}</Label>}
        <InputWrapper>
          {icon && <IconContainer>{icon}</IconContainer>}
          <StyledInput
            ref={ref}
            hasIcon={hasIcon}
            hasError={hasError}
            aria-invalid={hasError}
            aria-describedby={error ? `${props.id}-error` : undefined}
            {...props}
          />
        </InputWrapper>
        {error && (
          <ErrorText id={`${props.id}-error`} role="alert">
            {error}
          </ErrorText>
        )}
      </InputContainer>
    );
  }
);

TFInput.displayName = 'TFInput';

// ===================== HEADER COMPONENT =====================
interface TFHeaderProps {
  showMetrics?: boolean;
  onMenuClick?: () => void;
}

const HeaderContainer = styled.header`
  ${glassMorphism}
  padding: 20px 40px;
  display: flex;
  align-items: center;
  gap: 30px;
  border-bottom: 1px solid rgba(0, 255, 238, 0.2);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const LogoOrb = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${TerraFusionBrand.COLORS.gradients.hero};
  display: flex;
  align-items: center;
  justify-content: center;
  ${transcendenceGlow}
  animation: ${transcendencePulse} 3s ease-in-out infinite;
  cursor: pointer;
`;

const LogoText = styled.span`
  font-size: 24px;
  font-weight: 100;
  color: white;
  letter-spacing: -1px;
  font-family: ${TerraFusionBrand.TYPOGRAPHY.fonts.display};
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 100;
  background: ${TerraFusionBrand.COLORS.gradients.hero};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  font-family: ${TerraFusionBrand.TYPOGRAPHY.fonts.display};
`;

const Tagline = styled.div`
  color: ${TerraFusionBrand.COLORS.transcend};
  font-size: 1.1rem;
  letter-spacing: 2px;
  font-weight: 300;
`;

const Slogan = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  font-style: italic;
`;

const MetricsBadge = styled.div`
  text-align: center;
  padding: 10px 20px;
  background: rgba(0, 255, 238, 0.1);
  border-radius: 12px;
  border: 1px solid ${TerraFusionBrand.COLORS.transcend};
`;

const MetricValue = styled.div`
  color: ${TerraFusionBrand.COLORS.accent};
  font-size: 1.2rem;
  font-weight: 600;
`;

const MetricLabel = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

export const TFHeader: React.FC<TFHeaderProps> = ({ 
  showMetrics = true, 
  onMenuClick 
}) => {
  return (
    <HeaderContainer>
      <LogoOrb onClick={onMenuClick} role="button" tabIndex={0}>
        <LogoText>TF</LogoText>
      </LogoOrb>
      <HeaderContent>
        <Title>TerraFusion OS</Title>
        <Tagline>{TerraFusionBrand.ESSENCE.tagline}</Tagline>
        <Slogan>{TerraFusionBrand.ESSENCE.slogan}</Slogan>
      </HeaderContent>
      {showMetrics && (
        <MetricsBadge>
          <MetricValue>{TerraFusionBrand.ESSENCE.promise}</MetricValue>
          <MetricLabel>Performance</MetricLabel>
        </MetricsBadge>
      )}
    </HeaderContainer>
  );
};

// ===================== LOADING COMPONENT =====================
interface TFLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingContainer = styled.div<{ size: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px;
  
  ${props => props.size === 'sm' && css`
    gap: 12px;
    padding: 20px;
  `}
  
  ${props => props.size === 'lg' && css`
    gap: 30px;
    padding: 60px;
  `}
`;

const Spinner = styled.div<{ size: string }>`
  width: 60px;
  height: 60px;
  border: 3px solid rgba(0, 255, 238, 0.3);
  border-top: 3px solid ${TerraFusionBrand.COLORS.transcend};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  ${props => props.size === 'sm' && css`
    width: 30px;
    height: 30px;
    border-width: 2px;
  `}
  
  ${props => props.size === 'lg' && css`
    width: 80px;
    height: 80px;
    border-width: 4px;
  `}
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingMessage = styled.div`
  color: ${TerraFusionBrand.COLORS.transcend};
  font-size: 1.1rem;
  letter-spacing: 1px;
  text-align: center;
  animation: ${clarityFade} 0.5s ease-in-out;
`;

export const TFLoading: React.FC<TFLoadingProps> = ({ 
  message, 
  size = 'md' 
}) => {
  const displayMessage = message || TerraFusionBrand.getRandomMicrocopy('loading');
  
  return (
    <LoadingContainer size={size}>
      <Spinner size={size} />
      <LoadingMessage>{displayMessage}</LoadingMessage>
    </LoadingContainer>
  );
};

// ===================== EXPORTS =====================
export { TerraFusionBrand } from '../brand/TerraFusionBrand';
export * from '../brand/TerraFusionBrand';
