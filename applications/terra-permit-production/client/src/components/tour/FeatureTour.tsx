import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft, HelpCircle  } from '@mui/icons-material';
import { useTour } from '@/contexts/TourContext';
import { TourType } from '@/tours';

interface FeatureHighlight {
  id: string;
  title: string;
  description: string;
  targetElement: string;
  position: 'top' | 'right' | 'bottom' | 'left';
  width?: number;
}

interface FeatureTourProps {
  features: FeatureHighlight[];
  onComplete?: () => void;
  autoStart?: boolean;
  delay?: number;
  persistKey?: string;
}

/**
 * Component for creating interactive feature tours that highlight specific
 * UI elements with custom annotations
 */
export const FeatureTour: React.FC<FeatureTourProps> = ({
  features,
  onComplete,
  autoStart = false,
  delay = 1000,
  persistKey
}) => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { isTourActive } = useTour();

  const isActive = currentIndex >= 0 && currentIndex < features.length;
  const currentFeature = isActive ? features[currentIndex] : null;

  // Initialize tour
  useEffect(() => {
    // Check if this tour has been completed before
    const hasSeenTour = persistKey ? localStorage.getItem(`feature_tour_${persistKey}`) === 'completed' : false;
    
    if (autoStart && !hasSeenTour && !isInitialized && !isTourActive) {
      const timer = setTimeout(() => {
        setCurrentIndex(0);
        setIsInitialized(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [autoStart, delay, persistKey, isInitialized, isTourActive]);

  // Update target element position when current feature changes
  useEffect(() => {
    if (currentFeature) {
      const updateTargetRect = () => {
        const element = document.querySelector(`[data-feature="${currentFeature.targetElement}"]`);
        if (element) {
          setTargetRect(element.getBoundingClientRect());
        }
      };

      // Update immediately and on window resize
      updateTargetRect();
      window.addEventListener('resize', updateTargetRect);
      
      // Add highlight class to the current target
      const element = document.querySelector(`[data-feature="${currentFeature.targetElement}"]`);
      if (element) {
        element.classList.add('feature-highlight');
      }
      
      return () => {
        window.removeEventListener('resize', updateTargetRect);
        // Remove highlight class when changing features
        const element = document.querySelector(`[data-feature="${currentFeature.targetElement}"]`);
        if (element) {
          element.classList.remove('feature-highlight');
        }
      };
    }
  }, [currentFeature]);

  const startTour = () => {
    setCurrentIndex(0);
    setIsInitialized(true);
  };

  const nextFeature = () => {
    if (currentIndex < features.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeTour();
    }
  };

  const prevFeature = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const completeTour = () => {
    setCurrentIndex(-1);
    
    // Mark this tour as completed if a persistKey is provided
    if (persistKey) {
      localStorage.setItem(`feature_tour_${persistKey}`, 'completed');
    }
    
    if (onComplete) {
      onComplete();
    }
  };

  // Calculate optimal tooltip position
  const getTooltipPosition = () => {
    if (!targetRect || !currentFeature) return { top: 0, left: 0 };

    const margin = 12; // Space between target and tooltip
    const width = currentFeature.width || 250;
    
    let top = 0;
    let left = 0;
    
    switch (currentFeature.position) {
      case 'top':
        top = targetRect.top - margin;
        left = targetRect.left + (targetRect.width / 2) - (width / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + margin;
        left = targetRect.left + (targetRect.width / 2) - (width / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - 60;
        left = targetRect.left - width - margin;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - 60;
        left = targetRect.right + margin;
        break;
    }
    
    // Ensure the tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left < 20) left = 20;
    if (left + width > viewportWidth - 20) left = viewportWidth - width - 20;
    
    // Ensure tooltip is not positioned off the top of the screen
    if (top < 20) top = 20;
    if (currentFeature.position === 'top' && top < 20) {
      // Flip to bottom if too close to top
      top = targetRect.bottom + margin;
    }
    
    // Ensure tooltip is not positioned off the bottom of the screen
    if (top > viewportHeight - 150) top = viewportHeight - 150;
    
    return { top, left };
  };

  const tooltipPosition = getTooltipPosition();
  
  return (
    <>
      {/* Tour Trigger Button - Can be used to restart the tour */}
      {!isActive && (
        <Button
          onClick={startTour}
          variant="outline"
          size="sm"
          className="feature-tour-button fixed bottom-6 right-6 z-50 shadow-md"
          disabled={isTourActive}
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Feature Tour
        </Button>
      )}
      
      {/* Feature Highlight Tooltip */}
      <AnimatePresence>
        {isActive && currentFeature && (
          <motion.div
            key={`feature-tooltip-${currentIndex}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-blue-200"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              width: currentFeature.width || 250,
            }}
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-2"><>

                <h4 className="font-medium text-blue-700">{currentFeature.title}</h4>
                <Button
</> variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={completeTour}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600">{currentFeature.description}</p>
            </div>
            <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded-b-lg border-t">
              <div>
                <span className="text-xs text-gray-500">
                  {currentIndex + 1} of {features.length}
                </span>
              </div>
              <div className="flex space-x-2">
                {currentIndex > 0 && (
                  <Button variant="ghost" size="sm" onClick={prevFeature}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button variant="default" size="sm" onClick={nextFeature}>
                  {currentIndex < features.length - 1 ? (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    'Finish'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay when tour is active */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={completeTour}
          />
        )}
      </AnimatePresence>
    </>
  );
};