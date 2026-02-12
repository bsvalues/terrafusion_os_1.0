import React, { createContext, useContext, useState, useCallback } from 'react';
import { TourType } from '@/types/tour';

interface HelpContextType {
  // Tour state and methods
  isTourActive: boolean;
  activeTourName: string | null;
  activeTourStep: number;
  startTour: (tourName: string | TourType) => void;
  stopTour: () => void;
  goToTourStep: (step: number) => void;
  
  // Feature spotlight tracking
  hasSeenFeature: (featureId: string) => boolean;
  markFeatureAsSeen: (featureId: string) => void;
  resetFeatureVisibility: (featureId: string) => void;
  
  // Help center state
  isHelpCenterOpen: boolean;
  activeHelpTopic?: string;
  openHelpCenter: () => void;
  closeHelpCenter: () => void;
  showHelp: (topic?: string) => void; // Opens help center with optional topic focus
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export const useHelp = (): HelpContextType => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
};

interface HelpProviderProps {
  children: React.ReactNode;
}

export const HelpProvider: React.FC<HelpProviderProps> = ({ children }) => {
  // Tour state
  const [isTourActive, setIsTourActive] = useState(false);
  const [activeTourName, setActiveTourName] = useState<string | null>(null);
  const [activeTourStep, setActiveTourStep] = useState(0);
  
  // Help center state
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  
  // Tour methods
  const startTour = useCallback((tourName: string | TourType) => {
    setActiveTourName(tourName);
    setActiveTourStep(0);
    setIsTourActive(true);
  }, []);

  const stopTour = useCallback(() => {
    setIsTourActive(false);
    setActiveTourName(null);
    setActiveTourStep(0);
  }, []);

  const goToTourStep = useCallback((step: number) => {
    setActiveTourStep(step);
  }, []);

  // Feature spotlight methods
  const hasSeenFeature = useCallback((featureId: string): boolean => {
    return localStorage.getItem(`spotlight_seen_${featureId}`) === 'true';
  }, []);

  const markFeatureAsSeen = useCallback((featureId: string): void => {
    localStorage.setItem(`spotlight_seen_${featureId}`, 'true');
  }, []);

  const resetFeatureVisibility = useCallback((featureId: string): void => {
    localStorage.removeItem(`spotlight_seen_${featureId}`);
  }, []);

  // Active help topic
  const [activeHelpTopic, setActiveHelpTopic] = useState<string | undefined>(undefined);
  
  // Help center methods
  const openHelpCenter = useCallback(() => {
    setIsHelpCenterOpen(true);
  }, []);

  const closeHelpCenter = useCallback(() => {
    setIsHelpCenterOpen(false);
    // Reset active topic when closing
    setActiveHelpTopic(undefined);
  }, []);
  
  const showHelp = useCallback((topic?: string) => {
    setActiveHelpTopic(topic);
    setIsHelpCenterOpen(true);
  }, []);

  return (
    <HelpContext.Provider
      value={{
        // Tour state and methods
        isTourActive,
        activeTourName,
        activeTourStep,
        startTour,
        stopTour,
        goToTourStep,
        
        // Feature spotlight methods
        hasSeenFeature,
        markFeatureAsSeen,
        resetFeatureVisibility,
        
        // Help center state and methods
        isHelpCenterOpen,
        activeHelpTopic,
        openHelpCenter,
        closeHelpCenter,
        showHelp,
      }}
    >
      {children}
    </HelpContext.Provider>
  );
};

export default HelpContext;