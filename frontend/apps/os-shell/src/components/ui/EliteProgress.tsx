/**
 * ═══════════════════════════════════════════════════════════════
 * ELITE PROGRESS COMPONENT
 * Advanced Progress Bar with Quantum Theming
 * THE TERRAFUSION WAY - Visual Excellence
 * ═══════════════════════════════════════════════════════════════
 */

import { cn } from '@utils/cn';
import { EliteProgressProps } from '@/types/elite-interfaces';
import React from 'react';
import './EliteProgress.css';

const EliteProgress: React.FC<EliteProgressProps> = ({
  value,
  max = 100,
  className,
  variant = 'default',
  size = 'md',
  showValue = false,
  label,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantClasses = {
    default: 'bg-terra-cyan',
    quantum: 'bg-gradient-to-r from-terra-cyan via-purple-400 to-terra-cyan',
    glow: 'bg-terra-cyan shadow-[0_0_10px_hsl(var(--tf-transcend-cyan-hs)_50%_/_0.5)]',
  };

  return (
    <div className='w-full space-y-1'>
      {(label || showValue) && (
        <div className='flex justify-between items-center text-sm'>
          {label && <span className='text-gray-300'>{label}</span>}
          {showValue && <span className='text-white font-medium'>{percentage.toFixed(0)}%</span>}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden bg-terra-slate/30',
          sizeClasses[size],
          className
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out elite-progress-bar',
            variantClasses[variant],
            variant === 'quantum' && 'elite-progress-quantum',
            variant === 'glow' && 'elite-progress-glow'
          )}
          data-progress={percentage}
        />
      </div>
    </div>
  );
};

export default EliteProgress;
