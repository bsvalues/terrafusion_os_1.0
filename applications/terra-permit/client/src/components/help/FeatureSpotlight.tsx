import React, { useState, useEffect } from 'react';
import { X, Sparkles  } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { PlayTourButton } from '@/components/tour/TourButton';
import { TourType } from '@/types/tour';

interface FeatureSpotlightProps {
  title: string;
  description: string;
  featureId: string;
  tourId?: TourType | string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showOnce?: boolean;
  children?: React.ReactNode;
  className?: string;
  allowDismiss?: boolean;
}

export const FeatureSpotlight: React.FC<FeatureSpotlightProps> = ({
  title,
  description,
  featureId,
  tourId,
  position = 'bottom-right',
  showOnce = true,
  children,
  className = '',
  allowDismiss = true,
}) => {
  const [visible, setVisible] = useState(false);
  const localStorageKey = `spotlight_seen_${featureId}`;

  // Set up positioning classes
  const positionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
  };

  useEffect(() => {
    // Check if the spotlight has been seen before
    const hasSeenFeature = localStorage.getItem(localStorageKey) === 'true';
    
    if (!showOnce || !hasSeenFeature) {
      // Show the spotlight with a slight delay for better UX
      const timer = setTimeout(() => {
        setVisible(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [featureId, localStorageKey, showOnce]);

  const handleDismiss = () => {
    setVisible(false);
    
    if (showOnce) {
      localStorage.setItem(localStorageKey, 'true');
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div 
      className={`
        absolute m-4 bg-white border border-blue-200 rounded-lg shadow-lg 
        z-50 max-w-xs p-4 animate-fadeIn ${positionClasses[position]} ${className}
      `}
    >
      {allowDismiss && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 h-6 w-6" 
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      )}
      
      <div className="flex items-center mb-2">
        <Sparkles className="h-5 w-5 text-blue-500 mr-2" />
        <h4 className="font-medium text-sm">{title}</h4>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      
      {children && <div className="mb-3">{children}</div>}
      
      <div className="flex justify-end space-x-2">
        {tourId && (
          <PlayTourButton 
            tourName={tourId} 
            label="Show me" 
            variant="default" 
            size="sm" 
            onClick={handleDismiss}
          />
        )}
        
        {allowDismiss && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDismiss}
          >
            Got it
          </Button>
        )}
      </div>
    </div>
  );
};

export default FeatureSpotlight;