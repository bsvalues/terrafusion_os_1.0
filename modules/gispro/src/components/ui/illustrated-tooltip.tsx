import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle  } from '@mui/icons-material';

type IllustratedTooltipProps = {
  /**
   * The SVG illustration to display in the tooltip
   */
  illustration: string;
  
  /**
   * The title of the tooltip
   */
  title: string;
  
  /**
   * The content of the tooltip
   */
  content: string | React.ReactNode;
  
  /**
   * The position of the tooltip
   */
  position?: 'top' | 'right' | 'bottom' | 'left';
  
  /**
   * The size of the trigger icon
   */
  iconSize?: number;
  
  /**
   * The width of the tooltip content
   */
  width?: number;
  
  /**
   * Optional custom trigger component
   */
  trigger?: React.ReactNode;
};

export function IllustratedTooltip({
  illustration,
  title,
  content,
  position = 'top',
  iconSize = 16,
  width = 320,
  trigger
}: IllustratedTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center">
            {trigger || <HelpCircle size={iconSize} className="text-muted-foreground cursor-help" />}
          </span>
        </TooltipTrigger>
        <TooltipContent side={position} className="p-0 overflow-hidden" style={{ width: `${width}px` }}>
          <div className="flex flex-col">
            <div className="w-full" dangerouslySetInnerHTML={{ __html: illustration }} />
            <div className="p-4"><>

              <h4 className="font-medium text-sm mb-1">{title}</h4>
              <div
</>
className="text-xs text-muted-foreground">
                {content}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}