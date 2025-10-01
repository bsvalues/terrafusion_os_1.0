/**
 * TerraFusion Official Logo Component
 * Based on REAL TerraFusion Brand Kit v1.0
 * "Government. Transcended."
 */

import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface TerraFusionLogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

export const TerraFusionLogo: React.FC<TerraFusionLogoProps> = ({
  variant = 'full',
  size = 'md',
  animated = true,
  className,
}) => {
  const sizeClasses = {
    sm: { height: 32, fontSize: 16 },
    md: { height: 48, fontSize: 24 },
    lg: { height: 64, fontSize: 32 },
    xl: { height: 96, fontSize: 48 },
  };

  const { height, fontSize } = sizeClasses[size];

  // Animation variants
  const logoAnimation = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      }
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 }
    }
  };

  const glowAnimation = {
    animate: {
      filter: [
        'drop-shadow(0 0 20px rgba(0, 153, 255, 0.3))',
        'drop-shadow(0 0 30px rgba(0, 255, 238, 0.5))',
        'drop-shadow(0 0 20px rgba(0, 153, 255, 0.3))',
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const Component = animated ? motion.div : 'div';
  const animationProps = animated ? {
    initial: "initial",
    animate: "animate",
    whileHover: "hover",
    variants: logoAnimation
  } : {};

  if (variant === 'icon') {
    return (
      <Component
        className={clsx('tf-logo-icon', className)}
        style={{ height, width: height }}
        {...animationProps}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          {/* TerraFusion Geometric Symbol - Diamond with Grid */}
          <defs>
            <linearGradient id="tf-clarity-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0099ff" />
              <stop offset="50%" stopColor="#00ffee" />
              <stop offset="100%" stopColor="#00ffaa" />
            </linearGradient>
            <filter id="tf-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Outer Diamond */}
          <path
            d="M50 5 L85 50 L50 95 L15 50 Z"
            stroke="url(#tf-clarity-gradient)"
            strokeWidth="2"
            fill="none"
            filter={animated ? "url(#tf-glow)" : undefined}
          />
          
          {/* Inner Grid Pattern */}
          <path
            d="M50 20 L70 50 L50 80 L30 50 Z"
            stroke="url(#tf-clarity-gradient)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
          />
          
          {/* Center Node */}
          <circle
            cx="50"
            cy="50"
            r="5"
            fill="#00ffee"
            filter={animated ? "url(#tf-glow)" : undefined}
          />
          
          {/* Connection Lines */}
          <path
            d="M50 20 L50 80 M30 50 L70 50"
            stroke="#0099ff"
            strokeWidth="1"
            opacity="0.6"
          />
        </svg>
      </Component>
    );
  }

  if (variant === 'text') {
    return (
      <Component
        className={clsx('tf-logo-text', className)}
        style={{ fontSize }}
        {...animationProps}
      >
        <motion.span
          className="tf-logo-text-terra"
          style={{
            fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
            fontWeight: 300,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          animate={animated ? glowAnimation.animate : undefined}
        >
          Terra
        </motion.span>
        <span
          style={{
            fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#00ffaa',
          }}
        >
          Fusion
        </span>
      </Component>
    );
  }

  // Full logo (icon + text)
  return (
    <Component
      className={clsx('tf-logo-full', className)}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: height * 0.3,
        height 
      }}
      {...animationProps}
    >
      {/* Icon */}
      <div style={{ height, width: height }}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="tf-full-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0099ff" />
              <stop offset="50%" stopColor="#00ffee" />
              <stop offset="100%" stopColor="#00ffaa" />
            </linearGradient>
            <filter id="tf-full-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <path
            d="M50 5 L85 50 L50 95 L15 50 Z"
            stroke="url(#tf-full-gradient)"
            strokeWidth="2"
            fill="none"
            filter={animated ? "url(#tf-full-glow)" : undefined}
          />
          
          <path
            d="M50 20 L70 50 L50 80 L30 50 Z"
            stroke="url(#tf-full-gradient)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
          />
          
          <circle
            cx="50"
            cy="50"
            r="5"
            fill="#00ffee"
            filter={animated ? "url(#tf-full-glow)" : undefined}
          />
          
          <path
            d="M50 20 L50 80 M30 50 L70 50"
            stroke="#0099ff"
            strokeWidth="1"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Text */}
      <div style={{ fontSize, lineHeight: 1 }}>
        <motion.span
          style={{
            fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
            fontWeight: 300,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          animate={animated ? glowAnimation.animate : undefined}
        >
          Terra
        </motion.span>
        <span
          style={{
            fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#00ffaa',
          }}
        >
          Fusion
        </span>
      </div>
    </Component>
  );
};

export default TerraFusionLogo;
