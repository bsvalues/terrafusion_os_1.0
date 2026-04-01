import React, { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextualTooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  title?: string;
  width?: string;
  iconOnly?: boolean;
  asSpan?: boolean;
}

/**
 * ContextualTooltip - A component that provides contextual help information
 * when hovering over UI elements. Can optionally include an info icon.
 */
export function ContextualTooltip({
  content,
  children,
  className,
  iconClassName,
  showIcon = true,
  side = 'top',
  align = 'center',
  delayDuration = 300,
  title,
  width,
  iconOnly = false,
  asSpan = false,
}: ContextualTooltipProps) {
  const [open, setOpen] = useState(false);
  
  // Create the content for the tooltip
  const tooltipContent = (
    <div>
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div className="text-sm">{content}</div>
    </div>
  );

  // For span variant (to avoid DOM nesting issues)
  if (asSpan) {
    return (
      <TooltipProvider>
        <Tooltip open={open} onOpenChange={setOpen} delayDuration={delayDuration}>
          <TooltipTrigger asChild>
            <span
              className={cn('inline-flex items-center gap-1 cursor-help', className)}
              aria-label={`Help: ${title || (typeof content === 'string' ? content : 'Click for more information')}`}
            >
              {!iconOnly && children}
              {(showIcon || iconOnly) && (
                <InfoIcon className={cn('h-4 w-4 text-muted-foreground', iconClassName)} />
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent 
            side={side} 
            align={align} 
            className={cn("max-w-md", width ? `w-[${width}]` : "")}
            style={width ? { width } : undefined}
          >
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Default button variant
  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen} delayDuration={delayDuration}>
        <TooltipTrigger asChild>
          <button 
            type="button"
            className={cn('inline-flex items-center gap-1 cursor-help', className)}
            aria-label={`Help: ${title || (typeof content === 'string' ? content : 'Click for more information')}`}
          >
            {!iconOnly && children}
            {(showIcon || iconOnly) && (
              <InfoIcon className={cn('h-4 w-4 text-muted-foreground', iconClassName)} />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align} 
          className={cn("max-w-md", width ? `w-[${width}]` : "")}
          style={width ? { width } : undefined}
        >
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ContextualTooltip;