import React from 'react';

/**
 * ProcessTimeline Component
 * Displays a timeline visualization of a process with multiple steps
 * 
 * @param {Array} steps - Array of step objects with {id, name, status, timestamp, description, duration}
 * @param {string} title - Title of the process
 * @param {string} currentStep - ID of the current active step
 */
const ProcessTimeline = ({ 
  steps = [], 
  title = 'Process Timeline',
  currentStep = null
}) => {
  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHr > 0) {
      return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };
  
  // Status colors and icons
  const statusConfig = {
    pending: { icon: '⏳', color: '#f5b041', label: 'Pending' },
    inProgress: { icon: '⚙️', color: '#3498db', label: 'In Progress' },
    completed: { icon: '✅', color: '#2ecc71', label: 'Completed' },
    failed: { icon: '❌', color: '#e74c3c', label: 'Failed' },
    waiting: { icon: '⏱️', color: '#95a5a6', label: 'Waiting' },
    skipped: { icon: '⏭️', color: '#7f8c8d', label: 'Skipped' }
  };
  
  // Check if a step is the current active step
  const isCurrentStep = (stepId) => currentStep === stepId;
  
  // Format duration display
  const formatDuration = (durationMs) => {
    if (!durationMs) return '';
    
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  return (
    <div className="process-timeline">
      <h3 className="timeline-title">{title}</h3>
      
      <div className="timeline-container">
        {steps.map((step /* , index */) => {
          const status = step.status || 'pending';
          const config = statusConfig[status];
          const isCurrent = isCurrentStep(step.id);
          
          return (
            <div 
              key={step.id} 
              className={`timeline-item ${status} ${isCurrent ? 'current' : ''}`}
            >
              <div className="timeline-marker" style={{ backgroundColor: config.color }}>
                <span>{config.icon}</span>
              </div>
              
              <div className="timeline-content">
                <div className="timeline-header">
                  <h4 className="step-name">{step.name}</h4>
                  <div className="step-meta">
                    {step.timestamp && (
                      <span className="step-time">{formatRelativeTime(step.timestamp)}</span>
                    )}
                    
                    {step.duration && (
                      <span className="step-duration">{formatDuration(step.duration)}</span>
                    )}
                    
                    <span className="step-status" style={{ color: config.color }}>
                      {config.label}
                    </span>
                  </div>
                </div>
                
                {step.description && (
                  <p className="step-description">{step.description}</p>
                )}
              </div>
              
              {index < steps.length - 1 && (
                <div className="timeline-connector"></div>
              )}
            </div>
          );
        })}
      </div>
      
      {steps.length === 0 && (
        <div className="timeline-empty">
          <p>No steps available for this process.</p>
        </div>
      )}
    </div>
  );
};

export default ProcessTimeline;