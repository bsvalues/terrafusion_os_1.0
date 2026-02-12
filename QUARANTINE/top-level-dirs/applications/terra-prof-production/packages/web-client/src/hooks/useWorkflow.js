import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for tracking workflow progress
 * @param {string} workflowId - Unique identifier for the workflow
 * @param {Array} steps - Array of step objects for the workflow
 * @returns {Object} - Workflow progress state and control functions
 */
const useWorkflow = (workflowId, steps = []) => {
  // Initialize state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Generate a unique key for storing workflow progress in localStorage
  const storageKey = `workflow_${workflowId}_progress`;
  
  // Load saved progress on initial render
  useEffect(() => {
    const savedProgress = localStorage.getItem(storageKey);
    if (savedProgress) {
      try {
        const { currentStep, completedSteps } = JSON.parse(savedProgress);
        setCurrentStep(currentStep);
        setCompletedSteps(completedSteps);
      } catch (err) {
        console.error('Failed to parse saved workflow progress', err);
        // Clear invalid data
        localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey]);
  
  // Save progress when it changes
  useEffect(() => {
    const progressData = { currentStep, completedSteps };
    localStorage.setItem(storageKey, JSON.stringify(progressData));
  }, [currentStep, completedSteps, storageKey]);
  
  // Move to next step
  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prevStep => {
        // Mark the current step as completed
        setCompletedSteps(prev => ({
          ...prev,
          [prevStep]: true
        }));
        return prevStep + 1;
      });
    }
  }, [currentStep, steps]);
  
  // Move to previous step
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  // Jump to a specific step
  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps]);
  
  // Mark current step as completed
  const completeCurrentStep = useCallback(() => {
    setCompletedSteps(prev => ({
      ...prev,
      [currentStep]: true
    }));
  }, [currentStep]);
  
  // Check if a step is completed
  const isStepCompleted = useCallback((stepIndex) => {
    return !!completedSteps[stepIndex];
  }, [completedSteps]);
  
  // Reset workflow progress
  const resetWorkflow = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps({});
    localStorage.removeItem(storageKey);
  }, [storageKey]);
  
  // Calculate overall progress percentage
  const progressPercentage = useCallback(() => {
    if (steps.length === 0) return 0;
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    return Math.round((completedCount / steps.length) * 100);
  }, [completedSteps, steps]);
  
  return {
    currentStep,
    completedSteps,
    error,
    loading,
    steps,
    nextStep,
    prevStep,
    goToStep,
    completeCurrentStep,
    isStepCompleted,
    resetWorkflow,
    progressPercentage,
    setError,
    setLoading
  };
};

export default useWorkflow;