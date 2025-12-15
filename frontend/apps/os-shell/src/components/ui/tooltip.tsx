import { cn } from '@utils/cn';
import * as React from 'react';

// Production-grade tooltip components matching Radix UI interface
interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
}

const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => <div>{children}</div>;

// Context to manage tooltip state
interface TooltipContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  tooltipId: string;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const tooltipId = React.useId();

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen, tooltipId }}>
      <div className='relative inline-block group'>{children}</div>
    </TooltipContext.Provider>
  );
};

interface TooltipTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
  disabled?: boolean;
}

const TooltipTrigger: React.FC<TooltipTriggerProps> = ({
  children,
  className,
  disabled = false,
}) => {
  const context = React.useContext(TooltipContext);

  const handleMouseEnter = () => {
    if (!disabled && context) {
      context.setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (context) {
      context.setIsOpen(false);
    }
  };

  const handleFocus = () => {
    if (!disabled && context) {
      context.setIsOpen(true);
    }
  };

  const handleBlur = () => {
    if (context) {
      context.setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && context) {
      context.setIsOpen(false);
    }
  };

  return (
    <button
      type='button'
      className={cn('cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}
      disabled={disabled}
      aria-describedby={context?.isOpen ? context.tooltipId : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      {children}
    </button>
  );
};

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
  sideOffset?: number;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

const TooltipContent: React.FC<TooltipContentProps> = ({ children, className }) => {
  const context = React.useContext(TooltipContext);

  if (!context) return null;

  return (
    <div
      id={context.tooltipId}
      role='tooltip'
      className={cn(
        'absolute z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-lg border border-slate-700',
        context.isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        'transition-opacity',
        'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        className
      )}
    >
      {children}
    </div>
  );
};

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
