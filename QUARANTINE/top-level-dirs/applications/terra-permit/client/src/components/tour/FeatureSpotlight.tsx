import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X  } from '@mui/icons-material';
import { Button } from '@/components/ui/button';

interface FeatureSpotlightProps {
  id: string;
  title: string;
  description: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  showOnce?: boolean;
  delay?: number;
  children: React.ReactNode;
  width?: number;
  onDismiss?: () => void;
}

/**
 * FeatureSpotlight component highlights a specific feature with an attached tooltip.
 * It can be used to guide users through new or important features.
 */
export const FeatureSpotlight: React.FC<FeatureSpotlightProps> = ({
  id,
  title,
  description,
  position = 'bottom',
  showOnce = true,
  delay = 500,
  children,
  width = 250,
  onDismiss
}) => {
  const [visible, setVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [contentRef, setContentRef] = useState<HTMLDivElement | null>(null);
  
  // Generate a storage key from the id
  const storageKey = `feature_spotlight_${id}`;
  
  useEffect(() => {
    // Check if we should show this spotlight
    const hasBeenShown = localStorage.getItem(storageKey) === 'shown';
    
    if (showOnce && hasBeenShown) {
      return;
    }
    
    // Show the spotlight after a delay
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [id, showOnce, delay, storageKey]);
  
  // Update position when ref changes or window resizes
  useEffect(() => {
    if (!contentRef) return;
    
    const updatePosition = () => {
      setTargetRect(contentRef.getBoundingClientRect());
    };
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [contentRef, visible]);
  
  const handleDismiss = () => {
    setVisible(false);
    
    if (showOnce) {
      localStorage.setItem(storageKey, 'shown');
    }
    
    if (onDismiss) {
      onDismiss();
    }
  };
  
  // Calculate tooltip position relative to the target
  const getTooltipPosition = () => {
    if (!targetRect) return { top: 0, left: 0 };
    
    const margin = 12;
    const tooltipWidth = width;
    
    let top = 0;
    let left = 0;
    
    switch (position) {
      case 'top':
        top = targetRect.top - margin;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + margin;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - 50;
        left = targetRect.left - tooltipWidth - margin;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - 50;
        left = targetRect.right + margin;
        break;
    }
    
    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left < 16) left = 16;
    if (left + tooltipWidth > viewportWidth - 16) left = viewportWidth - tooltipWidth - 16;
    if (top < 16) top = 16;
    if (top > viewportHeight - 120) top = viewportHeight - 120;
    
    return {
      top: Math.max(16, top),
      left: Math.max(16, left)
    };
  };
  
  const tooltipPosition = getTooltipPosition();
  
  return (
      {/* Target element with ref */}
      <div
        ref={setContentRef}
        className={visible ? 'feature-highlight' : ''}
        data-feature={id}
      >
        {children}
      </div>
      
      {/* Tooltip */}
      <AnimatePresence>
        {visible && targetRect && (
            {/* Spotlight tooltip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="fixed z-50 bg-white rounded-lg shadow-lg border border-blue-200"
              style={{
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                width,
                maxWidth: '90vw'
              }}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-blue-700 text-sm">{title}</h4>
                  <button type="button"
                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 rounded-full"
                    onClick={handleDismiss}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-xs text-gray-600">{description}</p>
              </div>
              
              {/* Direction indicator based on position */}
              <div
                className={`absolute w-3 h-3 rotate-45 bg-white border-${
                  position === 'bottom' ? 'top' : 
                  position === 'top' ? 'bottom' : 
                  position === 'left' ? 'right' : 'left'
                } border-blue-200`}
                style={{
                  [position === 'bottom' ? 'top' : 
                   position === 'top' ? 'bottom' : 
                   position === 'left' ? 'right' : 'left']: -6,
                  left: position === 'top' || position === 'bottom' 
                    ? '50%' 
                    : position === 'right' 
                      ? -6 
                      : 'auto',
                  right: position === 'left' ? -6 : 'auto',
                  top: position === 'left' || position === 'right' 
                    ? '50%' 
                    : position === 'bottom' 
                      ? -6 
                      : 'auto',
                  bottom: position === 'top' ? -6 : 'auto',
                  transform: (position === 'top' || position === 'bottom') 
                    ? 'translateX(-50%)' 
                    : (position === 'left' || position === 'right') 
                      ? 'translateY(-50%)' 
                      : 'none'
                }}
              />
            </motion.div>
            
            {/* Overlay to capture dismiss clicks */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              onClick={handleDismiss}
              style={{ pointerEvents: 'all' }}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
};