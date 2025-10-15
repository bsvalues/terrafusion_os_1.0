import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

// Create a TooltipProvider component
export const TooltipProvider = TooltipPrimitive.Provider;

// Create a Tooltip component (root)
export const Tooltip = TooltipPrimitive.Root;

// Create a TooltipTrigger component
export const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Trigger
    ref={ref}
    className={cn("inline-flex items-center justify-center", className)}
    {...props}
  />
));
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;

// Create a TooltipContent component
export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// For backward compatibility with original Tooltip implementation
interface SimpleTooltipProps {
  /**
   * The element that triggers the tooltip
   */
  children: React.ReactNode;
  
  /**
   * The content of the tooltip
   */
  content: React.ReactNode;
  
  /**
   * The position of the tooltip relative to the trigger element
   * @default 'top'
   */
  side?: 'top' | 'right' | 'bottom' | 'left';
  
  /**
   * The alignment of the tooltip
   * @default 'center'
   */
  align?: 'start' | 'center' | 'end';
  
  /**
   * Delay before showing the tooltip in milliseconds
   * @default 200
   */
  delayShow?: number;
  
  /**
   * Delay before hiding the tooltip in milliseconds
   * @default 150
   */
  delayHide?: number;
  
  /**
   * Offset from the trigger element in pixels
   * @default 8
   */
  offset?: number;
  
  /**
   * Additional CSS class names for the tooltip
   */
  className?: string;
}

/**
 * SimplerTooltip component for backward compatibility
 */
export function SimpleTooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  delayShow = 200,
  delayHide = 150,
  offset = 8,
  className,
}: SimpleTooltipProps) {
  return (
    <TooltipProvider delayDuration={delayShow}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">{children}</span>
        </TooltipTrigger>
        <TooltipContent 
          side={side as any} 
          align={align as any} 
          sideOffset={offset}
          className={className}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}