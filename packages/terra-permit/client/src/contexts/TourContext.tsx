import React, { createContext, useContext, useState, useCallback } from 'react';
import { TourType } from '../types/tour';

// Re-export TourType to avoid breaking imports
export { TourType };

interface TourContextType {
  isTourActive: boolean;
  activeTourName: string | null;
  activeTourStep: number;
  startTour: (tourName: string | TourType) => void;
  stopTour: () => void;
  goToTourStep: (step: number) => void;
  registerTourTarget: (id: string, element: HTMLElement) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = (): TourContextType => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

interface TourProviderProps {
  children: React.ReactNode;
}

export const TourContextProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [activeTourName, setActiveTourName] = useState<string | null>(null);
  const [activeTourStep, setActiveTourStep] = useState(0);

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

  // This is a no-op implementation since we're using Joyride which finds elements by ID
  const registerTourTarget = useCallback((id: string, element: HTMLElement) => {
    // In a real implementation, we might store these elements in a map
    // console.log(`Registered tour target: ${id}`);
  }, []);

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        activeTourName,
        activeTourStep,
        startTour,
        stopTour,
        goToTourStep,
        registerTourTarget,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export default TourContext;