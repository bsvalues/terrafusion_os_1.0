import { TourType, useTour } from '@/contexts/TourContext';
import {
  aiFeaturesTourSteps,
  batchProcessingTourSteps,
  collaborationTourSteps,
  dashboardTourSteps,
  dataExportTourSteps,
  helpCenterTourSteps,
  onboardingTourSteps,
  permitProcessingTourSteps,
} from '@/tours';
import React, { useEffect, useMemo } from 'react';
import Joyride, {
  ACTIONS,
  CallBackProps,
  EVENTS,
  Step as JoyrideStep,
  STATUS,
} from 'react-joyride';

// Map of tour name to tour steps
const TOUR_STEPS: Record<string, JoyrideStep[]> = {
  [TourType.PERMIT_PROCESSING]: permitProcessingTourSteps,
  [TourType.ONBOARDING]: onboardingTourSteps,
  [TourType.DASHBOARD]: dashboardTourSteps,
  [TourType.AI_FEATURES]: aiFeaturesTourSteps,
  [TourType.COLLABORATION]: collaborationTourSteps,
  [TourType.HELP_CENTER]: helpCenterTourSteps,
  [TourType.BATCH_PROCESSING]: batchProcessingTourSteps,
  [TourType.DATA_EXPORT]: dataExportTourSteps,
};

interface TourProviderProps {
  children: React.ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const { isTourActive, activeTourName, activeTourStep, stopTour, goToTourStep } = useTour();

  // Get the steps for the active tour
  const steps = useMemo(() => {
    if (!activeTourName) return [];
    return TOUR_STEPS[activeTourName] || [];
  }, [activeTourName]);

  // Handle tour callbacks
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;

    // Update tour step when user navigates
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      goToTourStep(index + (action === ACTIONS.PREV ? -1 : 1));
    }

    // Stop the tour when it's finished or skipped
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      stopTour();
    }
  };

  // Reset scroll position when tour step changes
  useEffect(() => {
    if (isTourActive) {
      window.scrollTo(0, 0);
    }
  }, [isTourActive, activeTourStep]);

  return (
    <>
      {children}

      <Joyride
        callback={handleJoyrideCallback}
        continuous
        hideCloseButton
        run={isTourActive}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={steps}
        stepIndex={activeTourStep}
        styles={{
          options: {
            arrowColor: '#fff',
            backgroundColor: '#fff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            primaryColor: '#3b82f6', // blue-500
            textColor: '#374151', // gray-700
            zIndex: 1000,
          },
          spotlight: {
            backgroundColor: 'transparent',
          },
          tooltipContainer: {
            textAlign: 'left',
          },
        }}
        disableOverlayClose
        spotlightClicks
      />
    </>
  );
};

export default TourProvider;
