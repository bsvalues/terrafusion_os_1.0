import React, { useState } from 'react';
import { HelpCircle  } from '@mui/icons-material';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button, ButtonProps } from '@/components/ui/button';
import { TourType } from '@/tours';
import { PlayTourButton } from '@/components/tour/TourButton';

interface ContextualHelpProps {
  content: React.ReactNode;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  children?: React.ReactNode;
  tourId?: TourType | string;
  buttonVariant?: ButtonProps['variant'];
  includeStartTourButton?: boolean;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  content,
  title,
  position = 'top',
  className = '',
  children,
  tourId,
  buttonVariant = 'ghost',
  includeStartTourButton = false,
}) => {
  const [open, setOpen] = useState(false);

  const renderTrigger = () => {
    // If children are provided, use them as trigger
    if (children) {
      return children;
    }
    
    // Otherwise, return our default button with a check for potential button nesting
    // Using a span with inline-flex for styling when it might be inside another button
    return (
      <span className="inline-flex">
        <Button variant={buttonVariant} size="icon" className={`h-6 w-6 rounded-full ${className}`}>
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Help</span>
        </Button>
      </span>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}><>

        <TooltipTrigger asChild>
          {renderTrigger()}
        </TooltipTrigger>
        <TooltipContent
</> side={position} className="max-w-sm p-4" sideOffset={5}>
          {title && <h4 className="font-medium mb-1">{title}</h4>}
          <div className="text-sm text-gray-700">{content}</div>
          
          {includeStartTourButton && tourId && (
            <div className="mt-2 flex justify-end">
              <PlayTourButton 
                tourName={tourId} 
                size="sm" 
                variant="outline" 
                className="text-xs h-7"
                onClick={() => setOpen(false)}
                asSpan={true} // Use as span to prevent potential button nesting issues
              />
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ContextualHelp;