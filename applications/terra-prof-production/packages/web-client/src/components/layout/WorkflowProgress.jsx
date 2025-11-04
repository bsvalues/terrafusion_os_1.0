import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * WorkflowProgress Component
 * Displays a visual representation of workflow progress with steps
 * 
 * @param {Object} props - Component props
 * @param {Array} props.steps - Array of step objects with { id, label, description }
 * @param {number} props.currentStep - Index of the current active step
 * @param {Object} props.completedSteps - Object mapping step indices to completion status
 * @param {Function} props.onStepClick - Function to call when a step is clicked (for navigation)
 * @param {boolean} props.showLabels - Whether to show step labels (default: true)
 * @param {boolean} props.allowNavigation - Whether to allow clicking on steps for navigation (default: true)
 * @param {string} props.orientation - Display orientation, 'horizontal' or 'vertical' (default: 'horizontal')
 */
const WorkflowProgress = ({
  steps = [],
  currentStep = 0,
  completedSteps = {},
  onStepClick,
  showLabels = true,
  allowNavigation = true,
  orientation = 'horizontal'
}) => {
  const [progressWidth, setProgressWidth] = useState(0);
  
  // Calculate progress bar width based on completed steps
  useEffect(() => {
    if (steps.length <= 1) {
      setProgressWidth(100);
      return;
    }
    
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    const totalSteps = steps.length;
    const completionPercentage = (completedCount / (totalSteps - 1)) * 100;
    
    // If current step is last step and not completed, show progress up to last step
    if (currentStep === totalSteps - 1 && !completedSteps[currentStep]) {
      setProgressWidth(((totalSteps - 1) / (totalSteps - 1)) * 100);
    } else {
      setProgressWidth(completionPercentage);
    }
  }, [steps, currentStep, completedSteps]);

  const handleStepClick = (index) => {
    if (allowNavigation && onStepClick) {
      onStepClick(index);
    }
  };

  // Determine step status
  const getStepStatus = (index) => {
    if (completedSteps[index]) return 'completed';
    if (index === currentStep) return 'current';
    if (index < currentStep) return 'visited';
    return 'upcoming';
  };

  return (
    <div className={`workflow-progress ${orientation}`}>
      <div className="workflow-progress-track">
        <div 
          className="workflow-progress-bar"
          style={{ width: orientation === 'horizontal' ? `${progressWidth}%` : '100%', 
                  height: orientation === 'vertical' ? `${progressWidth}%` : '100%' }}
        />
        
        <div className="workflow-steps">
          {steps.map((step /* , index */) => (
            <div 
              key={step.id || index}
              className={`workflow-step ${getStepStatus(index)}`}
              style={{ 
                cursor: allowNavigation ? 'pointer' : 'default',
                [orientation === 'horizontal' ? 'left' : 'top']: 
                  `${index * (100 / (steps.length - 1))}%`
              }}
              onClick={() => handleStepClick(index)}
              data-testid={`workflow-step-${index}`}
            >
              <div className="step-indicator">
                {completedSteps[index] ? (
                  <span className="step-completed-icon">✓</span>
                ) : (
                  <span className="step-number">{index + 1}</span>
                )}
              </div>
              
              {showLabels && (
                <div className="step-label">
                  <span className="step-title">{step.label}</span>
                  {step.description && (
                    <span className="step-description">{step.description}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Show current step info at the bottom */}
      {steps[currentStep] && (
        <div className="current-step-info">
          <h4 className="current-step-label">{steps[currentStep].label}</h4>
          {steps[currentStep].description && (
            <p className="current-step-description">{steps[currentStep].description}</p>
          )}
        </div>
      )}
    </div>
  );
};

WorkflowProgress.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string.isRequired,
      description: PropTypes.string
    })
  ).isRequired,
  currentStep: PropTypes.number,
  completedSteps: PropTypes.object,
  onStepClick: PropTypes.func,
  showLabels: PropTypes.bool,
  allowNavigation: PropTypes.bool,
  orientation: PropTypes.oneOf(['horizontal', 'vertical'])
};

export default WorkflowProgress;