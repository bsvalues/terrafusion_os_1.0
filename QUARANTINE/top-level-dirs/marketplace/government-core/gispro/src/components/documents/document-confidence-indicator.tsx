import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface DocumentConfidenceIndicatorProps {
  confidence: number;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function DocumentConfidenceIndicator({ 
  confidence, 
  showPercentage = false,
  size = 'md'
}: DocumentConfidenceIndicatorProps) {
  // Normalize confidence to 0-100 range
  const confidencePercent = Math.round(confidence * 100);
  
  // Determine color based on confidence level
  const getConfidenceColor = () => {
    if (confidencePercent >= 80) return 'bg-green-500 text-white';
    if (confidencePercent >= 50) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };
  
  // Determine size based on the size prop
  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4 text-xs';
      case 'lg':
        return 'h-8 w-8 text-base';
      default:
        return 'h-6 w-6 text-sm';
    }
  };
  
  // Get confidence label
  const getConfidenceLabel = () => {
    if (confidencePercent >= 80) return 'High';
    if (confidencePercent >= 50) return 'Medium';
    return 'Low';
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center justify-center rounded-full',
              getConfidenceColor(),
              getSize(),
              'font-medium'
            )}
            data-testid="confidence-indicator"
            data-confidence-level={getConfidenceLabel().toLowerCase()}
          >
            {showPercentage ? `${confidencePercent}%` : null}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            <span className="font-medium">{getConfidenceLabel()} confidence:</span>{' '}
            {confidencePercent}%
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}