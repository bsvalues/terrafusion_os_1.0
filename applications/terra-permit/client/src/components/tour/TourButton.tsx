import React from 'react';
import { Play  } from '@mui/icons-material';
import { Button, ButtonProps } from '@/components/ui/button';
import { useHelp } from '@/contexts/HelpContext';
import { TourType } from '@/types/tour';

export interface TourButtonProps extends ButtonProps {
  tourName: string | TourType;
  label?: string;
  asSpan?: boolean; // Add asSpan prop to prevent button nesting
}

export const PlayTourButton: React.FC<TourButtonProps> = ({
  tourName,
  label = 'Start Tour',
  variant = 'outline',
  size = 'sm',
  className = '',
  onClick,
  asSpan = false, // Default to false for backward compatibility
  ...buttonProps
}) => {
  const { startTour } = useHelp();

  const handleStartTour = (e: React.MouseEvent<HTMLButtonElement | HTMLSpanElement>) => {
    startTour(tourName);
    if (onClick) onClick(e as React.MouseEvent<HTMLButtonElement>);
  };

  // Use span instead of button when needed to prevent nesting issues
  if (asSpan) {
    return (
      <span
        className={`inline-flex items-center justify-center cursor-pointer ${className}`}
        onClick={handleStartTour}
        role="button"
        tabIndex={0}
        aria-label={label}
      >
        <Play className="h-4 w-4 mr-1" />
        {label}
      </span>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`flex items-center ${className}`}
      onClick={handleStartTour}
      {...buttonProps}
    >
      <Play className="h-4 w-4 mr-1" />
      {label}
    </Button>
  );
};

export interface TourButtonIconProps extends ButtonProps {
  tourName: string | TourType;
  tooltip?: string;
  asSpan?: boolean; // Add asSpan prop to prevent button nesting
}

export const TourButtonIcon: React.FC<TourButtonIconProps> = ({
  tourName,
  tooltip = 'Start Tour',
  variant = 'ghost',
  size = 'icon',
  className = '',
  onClick,
  asSpan = false, // Default to false for backward compatibility
  ...buttonProps
}) => {
  const { startTour } = useHelp();

  const handleStartTour = (e: React.MouseEvent<HTMLButtonElement | HTMLSpanElement>) => {
    startTour(tourName);
    if (onClick) onClick(e as React.MouseEvent<HTMLButtonElement>);
  };

  // Use span instead of button when needed to prevent nesting issues
  if (asSpan) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full cursor-pointer ${className}`}
        onClick={handleStartTour}
        role="button"
        tabIndex={0}
        aria-label={tooltip}
        title={tooltip}
      >
        <Play className="h-4 w-4" />
        <span className="sr-only">{tooltip}</span>
      </span>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`rounded-full ${className}`}
      onClick={handleStartTour}
      title={tooltip}
      {...buttonProps}
    >
      <Play className="h-4 w-4" />
      <span className="sr-only">{tooltip}</span>
    </Button>
  );
};

export default PlayTourButton;