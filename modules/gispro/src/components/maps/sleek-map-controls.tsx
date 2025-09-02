import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger,
  SimpleTooltip 
} from '@/components/ui/tooltip';
import { MapTool } from '@/lib/map-utils';

interface ControlItem {
  /**
   * Unique identifier for the control
   */
  id: string;
  
  /**
   * Label for the control
   */
  label: string;
  
  /**
   * Icon element for the control
   */
  icon: React.ReactNode;
  
  /**
   * Whether the control is active
   */
  isActive?: boolean;
  
  /**
   * Whether the control is disabled
   */
  isDisabled?: boolean;
  
  /**
   * Click handler for the control
   */
  onClick?: () => void;
}

interface ControlGroup {
  /**
   * Unique identifier for the group
   */
  id: string;
  
  /**
   * Group label (for accessibility)
   */
  label: string;
  
  /**
   * Controls in this group
   */
  controls: ControlItem[];
}

interface SleekMapControlsProps {
  /**
   * Current active tool
   */
  activeTool?: MapTool;
  
  /**
   * Callback when a tool is selected
   */
  onToolChange?: (tool: MapTool) => void;
  
  /**
   * Control groups to display
   */
  controlGroups?: ControlGroup[];
  
  /**
   * Position of the controls on the map
   * @default 'top-left'
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /**
   * Layout direction
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical';
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Sleek map controls component that provides a clean, minimal interface
 * for map tools and actions. Controls are grouped logically and support
 * tooltips for better usability.
 */
export function SleekMapControls({
  activeTool,
  onToolChange,
  controlGroups = [],
  position = 'top-left',
  direction = 'horizontal',
  className,
}: SleekMapControlsProps) {
  // Position-specific classes
  const positionClasses = {
    'top-left': 'top-3 left-3',
    'top-right': 'top-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
  };
  
  // Direction-specific classes
  const directionClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col',
  };
  
  return (
    <div
      className={cn(
        'absolute z-10',
        positionClasses[position],
        className
      )}
    >
      <div className={cn(
        'flex gap-2',
        directionClasses[direction]
      )}>
        {controlGroups.map((group) => (
          <div
            key={group.id}
            className={cn(
              'bg-white/95 backdrop-blur-sm rounded-md shadow-md p-1 border border-gray-200',
              'flex',
              direction === 'horizontal' ? 'flex-row' : 'flex-col',
              'gap-1'
            )}
            aria-label={group.label}
          >
            {group.controls.map((control) => (
              <SimpleTooltip
                key={control.id}
                content={control.label}
                side={direction === 'horizontal' ? 'bottom' : 'right'}
              >
                <Button
                  variant={control.isActive ? 'default' : 'ghost'}
                  size="icon"
                  className={cn(
                    'h-8 w-8',
                    control.isActive && 'shadow-sm',
                    control.isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={control.onClick}
                  disabled={control.isDisabled}
                  aria-label={control.label}
                  aria-pressed={control.isActive}
                >
                  {control.icon}
                </Button>
              </SimpleTooltip>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}