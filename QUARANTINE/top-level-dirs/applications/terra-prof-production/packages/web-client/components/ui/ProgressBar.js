/**
 * ProgressBar Component
 * Displays a visual progress indicator
 */

import React from 'react';

/**
 * ProgressBar Component
 * @param {Object} props - Component props
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.height - Height of the progress bar
 * @param {boolean} props.showLabel - Whether to show the percentage label
 * @param {string} props.color - Primary color of the progress bar
 * @returns {JSX.Element} ProgressBar component
 */
const ProgressBar = ({ 
  progress = 0, 
  className = '', 
  height = '10px', 
  showLabel = true,
  color = '#4a90e2' 
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(0, progress), 100);
  const roundedProgress = Math.round(normalizedProgress);
  
  return (
    <div className={`progress-container ${className}`}>
      {showLabel && (
        <div className="progress-label">
          {roundedProgress}%
        </div>
      )}
      <div 
        className="progress-bar-outer" 
        style={{ height }}
      >
        <div 
          className="progress-bar-inner" 
          style={{ 
            width: `${roundedProgress}%`,
            backgroundColor: color 
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;