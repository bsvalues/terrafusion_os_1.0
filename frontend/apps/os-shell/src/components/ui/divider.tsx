/**
 * ═══════════════════════════════════════════════════════════════
 * ELITE DIVIDER COMPONENT - THE TERRAFUSION WAY
 * Quantum-themed separator with terra-cyan styling
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';

export interface DividerProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'quantum' | 'glow' | 'gradient' | 'solid';
}

export const Divider: React.FC<DividerProps> = ({
  className = '',
  orientation = 'horizontal',
  variant = 'default',
}) => {
  const baseClasses =
    orientation === 'horizontal' ? 'border-t w-full my-4' : 'border-l h-full mx-4';

  const variantClasses = {
    default: 'border-terra-cyan/20',
    quantum: 'border-terra-cyan/40 shadow-[0_0_10px_hsl(var(--tf-cyan-hs)_50%_/_0.3)]',
    glow: 'border-terra-cyan shadow-[0_0_15px_hsl(var(--tf-cyan-hs)_50%_/_0.5)] animate-pulse',
    gradient:
      'border-transparent bg-gradient-to-r from-transparent via-terra-cyan to-transparent h-px',
    solid: 'border-terra-cyan',
  };
  return <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />;
};

export default Divider;
