import {useState, useEffect} from 'react';

interface UserProfile {name: string;
  role: 'auditor' | 'supervisor' | 'admin' | 'analyst';
  department: string;
  experience: 'beginner' | 'intermediate' | 'expert';
  interests: string[];
  county: string;}

interface OnboardingState {isCompleted: boolean;
  showWizard: boolean;
  showTooltips: boolean;
  currentTooltipFlow: string | null;
  userProfile: UserProfile | null;}

const STORAGE_KEY = 'terrafusion_onboarding';

const defaultState: OnboardingState = {isCompleted: false,
  showWizard: false,
  showTooltips: false,
  currentTooltipFlow: null,
  userProfile: null,};

export function useOnboarding() {const [state, setState] = useState<OnboardingState>(defaultState);

  // Load onboarding state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedState = JSON.parse(saved);
        setState(parsedState);} else {// First time user - show onboarding wizard
        setState(prev => ({ ...prev, showWizard: true}));
      }
    } catch (error) {console.warn('Failed to load onboarding state:', error);
      setState(prev => ({ ...prev, showWizard: true}));
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));} catch (error) {console.warn('Failed to save onboarding state:', error);}
  }, [state]);

  const completeOnboarding = (userProfile: UserProfile) => {setState(prev => ({
      ...prev,
      isCompleted: true,
      showWizard: false,
      showTooltips: true,
      userProfile,
      currentTooltipFlow: 'dashboard',}));
  };

  const skipOnboarding = () => {setState(prev => ({
      ...prev,
      isCompleted: true,
      showWizard: false,
      showTooltips: false,}));
  };

  const startTooltipFlow = (flowName: string) => {setState(prev => ({
      ...prev,
      showTooltips: true,
      currentTooltipFlow: flowName,}));
  };

  const completeTooltipFlow = () => {setState(prev => ({
      ...prev,
      showTooltips: false,
      currentTooltipFlow: null,}));
  };

  const skipTooltips = () => {setState(prev => ({
      ...prev,
      showTooltips: false,
      currentTooltipFlow: null,}));
  };

  const resetOnboarding = () => {setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);};

  const updateUserProfile = (updates: Partial<UserProfile>) => {setState(prev => ({
      ...prev,
      userProfile: prev.userProfile ? { ...prev.userProfile, ...updates} : null,
    }));
  };

  // Get personalized dashboard configuration based on user profile
  const getDashboardConfig = () => {if (!state.userProfile) return null;

    const { role, interests, experience} = state.userProfile;

    // Define role-based priorities
    const rolePriorities = {auditor: ['ai', 'gis', 'automation'],
      supervisor: ['analytics', 'automation', 'ai'],
      admin: ['enterprise', 'analytics', 'quantum'],
      analyst: ['analytics', 'quantum', 'gis'],};

    // Define experience-based features
    const experienceFeatures = {beginner: { showAdvanced: false, tooltipLevel: 'detailed'},
      intermediate: {showAdvanced: true, tooltipLevel: 'standard'},
      expert: {showAdvanced: true, tooltipLevel: 'minimal'},
    };

    const combinedFeatures = [...rolePriorities[role], ...interests];
    const uniqueFeatures = Array.from(new Set(combinedFeatures));

    return {prioritizedFeatures: uniqueFeatures,
      ...experienceFeatures[experience],
      role,
      interests,};
  };

  return {...state,
    completeOnboarding,
    skipOnboarding,
    startTooltipFlow,
    completeTooltipFlow,
    skipTooltips,
    resetOnboarding,
    updateUserProfile,
    getDashboardConfig,};
}
