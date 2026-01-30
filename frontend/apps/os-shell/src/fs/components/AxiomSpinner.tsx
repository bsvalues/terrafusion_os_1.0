import { cn } from '@/lib/utils';

export interface AxiomSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

export const AxiomSpinner = ({ size = 'md', className, label }: AxiomSpinnerProps) => {
  // Map size to Tailwind classes or raw pixels
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-16 w-16',
    xl: 'h-32 w-32',
  }[size];

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={`relative flex items-center justify-center ${sizeClasses}`}
        style={{ color: 'var(--tf-transcend-cyan)' }} // THE SOURCE OF TRUTH
        role='status'
        aria-label={label || 'System calculating'}
      >
        {/* Outer Ring: Counter-rotating */}
        <svg
          className='absolute inset-0 animate-spin-slow opacity-30'
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <circle
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor' // Inherits var(--tf-transcend-cyan)
            strokeWidth='1'
            strokeDasharray='4 4'
          />
        </svg>

        {/* Inner Ring: Fast spinning */}
        <svg
          className='absolute inset-0 animate-spin'
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22'
            stroke='currentColor' // Inherits var(--tf-transcend-cyan)
            strokeWidth='2'
            strokeLinecap='round'
          />
        </svg>

        {/* Core: Pulsing */}
        <div className='h-1.5 w-1.5 rounded-full bg-current animate-pulse' />
      </div>

      {label && (
        <span className='animate-pulse font-mono text-xs uppercase tracking-widest text-[var(--tf-transcend-highlight)]'>
          {label}
        </span>
      )}
    </div>
  );
};
