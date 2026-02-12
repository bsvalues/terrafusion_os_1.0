import React from 'react';

/**
 * WorkflowStatus Component
 * Displays a visual representation of a workflow's progress and status
 * 
 * @param {string} status - Current status of the workflow (pending, processing, completed, failed)
 * @param {number} progress - Progress percentage (0-100)
 * @param {Array} steps - Array of step objects with {name, status, description}
 * @param {string} title - Title of the workflow
 * @param {string} description - Description of the workflow
 */
const WorkflowStatus = ({ 
  status = 'pending', 
  progress = 0, 
  steps = [], 
  title = 'Workflow',
  description = 'Processing data'
}) => {
  // Status colors
  const statusColors = {
    pending: '#f5b041', // Orange
    processing: '#3498db', // Blue
    completed: '#2ecc71', // Green
    failed: '#e74c3c' // Red
  };

  // Format progress percentage
  const progressPercent = Math.min(100, Math.max(0, progress));
  
  // Current status display text
  const statusText = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed'
  }[status] || 'Unknown';
  
  return (
    <div className="workflow-status">
      <div className="workflow-header">
        <h3 className="workflow-title">{title}</h3>
        <div className={`workflow-badge ${status}`}>{statusText}</div>
      </div>
      
      {description && (
        <p className="workflow-description">{description}</p>
      )}
      
      <div className="workflow-progress-container">
        <div 
          className={`workflow-progress-bar ${status}`} 
          style={{ 
            width: `${progressPercent}%`,
            backgroundColor: statusColors[status]
          }}
        ></div>
        <span className="workflow-progress-text">{progressPercent}%</span>
      </div>
      
      {steps.length > 0 && (
        <div className="workflow-steps">
          {steps.map((step /* , index */) => (
            <div 
              key={index} 
              className={`workflow-step ${step.status || 'pending'}`}
            >
              <div className="step-indicator">
                {step.status === 'completed' ? (
                  <span className="step-check">✓</span>
                ) : step.status === 'failed' ? (
                  <span className="step-x">✕</span>
                ) : (
                  <span className="step-number">{index + 1}</span>
                )}
              </div>
              <div className="step-content">
                <div className="step-name">{step.name}</div>
                {step.description && (
                  <div className="step-description">{step.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkflowStatus;