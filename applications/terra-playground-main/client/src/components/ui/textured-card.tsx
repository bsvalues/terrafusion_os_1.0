import React from 'react';
import { cn } from '@/lib/utils';

interface TexturedCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'subtle' | 'medium' | 'heavy';
  color?: 'blue' | 'purple' | 'teal' | 'mixed';
  hover?: boolean;
  elevation?: 'flat' | 'raised' | 'floating';
  onClick?: () => void;
}

/**
 * TexturedCard Component
 *
 * A modern card component with noise texture effects based on the 2025 design trend
 * of using noise and textures to add depth and dimensionality to flat designs.
 */
export const TexturedCard: React.FC<TexturedCardProps> = ({
  children,
  className,
  variant = 'subtle',
  color = 'blue',
  hover = true,
  elevation = 'raised',
  onClick,
}) => {
  // Noise opacity based on variant
  const noiseOpacity = {
    subtle: 0.03,
    medium: 0.07,
    heavy: 0.12,
  }[variant];

  // Base gradient based on color
  const getGradient = () => {
    switch (color) {
      case 'blue':
        return 'linear-gradient(135deg, rgba(59, 130, 246, 0.07) 0%, rgba(30, 64, 175, 0.05) 100%)';
      case 'purple':
        return 'linear-gradient(135deg, rgba(147, 51, 234, 0.07) 0%, rgba(88, 28, 135, 0.05) 100%)';
      case 'teal':
        return 'linear-gradient(135deg, rgba(20, 184, 166, 0.07) 0%, rgba(13, 148, 136, 0.05) 100%)';
      case 'mixed':
        return 'linear-gradient(135deg, rgba(59, 130, 246, 0.07) 0%, rgba(147, 51, 234, 0.05) 100%)';
      default:
        return 'linear-gradient(135deg, rgba(59, 130, 246, 0.07) 0%, rgba(30, 64, 175, 0.05) 100%)';
    }
  };

  // Shadow based on elevation
  const getShadow = () => {
    switch (elevation) {
      case 'flat':
        return 'shadow-sm';
      case 'raised':
        return 'shadow-md';
      case 'floating':
        return 'shadow-lg';
      default:
        return 'shadow-md';
    }
  };

  // Get transform style for hover effect
  const getHoverTransform = () => {
    if (!hover) return '';

    switch (elevation) {
      case 'flat':
        return 'hover:-translate-y-1';
      case 'raised':
        return 'hover:-translate-y-1.5';
      case 'floating':
        return 'hover:-translate-y-2';
      default:
        return 'hover:-translate-y-1.5';
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-card border border-border/30',
        getShadow(),
        hover && 'transition-all duration-300 ease-out',
        getHoverTransform(),
        hover && 'hover:shadow-xl',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      style={{
        backgroundImage: getGradient(),
      }}
    >
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: noiseOpacity,
        }}
      />

      {/* Subtle grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"
        style={{
          background:
            "url('data:image/png;base64,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')",
        }}
      />

      {/* Content container */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default TexturedCard;
