import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the types of onboarding steps throughout the application
export type OnboardingStep = 
  | 'welcome' 
  | 'dashboard-intro' 
  | 'income-entry' 
  | 'valuation-intro'
  | 'report-intro'
  | 'calculator-intro'
  | 'agent-intro';

// Define the shape of our onboarding state
interface OnboardingState {
  // Global onboarding state
  isOnboardingActive: boolean;
  hasCompletedOnboarding: boolean;
  currentStep: OnboardingStep | null;
  completedSteps: OnboardingStep[];
  
  // User preferences
  showMascot: boolean;
  
  // Methods for controlling onboarding
  startOnboarding: (initialStep?: OnboardingStep) => void;
  completeCurrentStep: () => void;
  skipOnboarding: () => void;
  setCurrentStep: (step: OnboardingStep) => void;
  toggleMascot: () => void;
}

// Create the context with default values
const OnboardingContext = createContext<OnboardingState>({
  isOnboardingActive: false,
  hasCompletedOnboarding: false,
  currentStep: null,
  completedSteps: [],
  showMascot: true,
  startOnboarding: () => {},
  completeCurrentStep: () => {},
  skipOnboarding: () => {},
  setCurrentStep: () => {},
  toggleMascot: () => {}
});

// Local storage keys
const ONBOARDING_STORAGE_KEY = 'income_valuation_onboarding';
const MASCOT_VISIBILITY_KEY = 'income_valuation_show_mascot';

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from local storage if available
  const [isOnboardingActive, setIsOnboardingActive] = useState<boolean>(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    try {
      const savedState = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      return savedState ? JSON.parse(savedState).hasCompletedOnboarding : false;
    } catch {
      return false;
    }
  });
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>(() => {
    try {
      const savedState = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      return savedState ? JSON.parse(savedState).completedSteps : [];
    } catch {
      return [];
    }
  });
  
  const [showMascot, setShowMascot] = useState<boolean>(() => {
    try {
      const savedPref = localStorage.getItem(MASCOT_VISIBILITY_KEY);
      return savedPref ? JSON.parse(savedPref) : true;
    } catch {
      return true;
    }
  });

  // Save onboarding state when it changes
  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({
        hasCompletedOnboarding,
        completedSteps
      }));
    } catch (error) {
      console.error('Failed to save onboarding state to localStorage:', error);
    }
  }, [hasCompletedOnboarding, completedSteps]);

  // Save mascot preference when it changes
  useEffect(() => {
    try {
      localStorage.setItem(MASCOT_VISIBILITY_KEY, JSON.stringify(showMascot));
    } catch (error) {
      console.error('Failed to save mascot visibility preference to localStorage:', error);
    }
  }, [showMascot]);

  // Start the onboarding process
  const startOnboarding = (initialStep: OnboardingStep = 'welcome') => {
    setIsOnboardingActive(true);
    setCurrentStep(initialStep);
  };

  // Mark the current step as completed and move to the next step
  const completeCurrentStep = () => {
    if (currentStep) {
      // Add current step to completed steps if not already included
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      
      // Logic for determining the next step based on the current step
      switch (currentStep) {
        case 'welcome':
          setCurrentStep('dashboard-intro');
          break;
        case 'dashboard-intro':
          setCurrentStep('income-entry');
          break;
        case 'income-entry':
          setCurrentStep('valuation-intro');
          break;
        case 'valuation-intro':
          setCurrentStep('report-intro');
          break;
        case 'report-intro':
          setCurrentStep('calculator-intro');
          break;
        case 'calculator-intro':
          setCurrentStep('agent-intro');
          break;
        case 'agent-intro':
          // End of onboarding flow
          setIsOnboardingActive(false);
          setHasCompletedOnboarding(true);
          setCurrentStep(null);
          break;
        default:
          // If we don't have a specific next step, just end onboarding
          setIsOnboardingActive(false);
          setCurrentStep(null);
      }
    }
  };

  // Skip the entire onboarding process
  const skipOnboarding = () => {
    setIsOnboardingActive(false);
    setHasCompletedOnboarding(true);
    setCurrentStep(null);
  };

  // Toggle mascot visibility
  const toggleMascot = () => {
    setShowMascot(prev => !prev);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingActive,
        hasCompletedOnboarding,
        currentStep,
        completedSteps,
        showMascot,
        startOnboarding,
        completeCurrentStep,
        skipOnboarding,
        setCurrentStep,
        toggleMascot
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

// Custom hook to use the onboarding context
export const useOnboarding = () => useContext(OnboardingContext);