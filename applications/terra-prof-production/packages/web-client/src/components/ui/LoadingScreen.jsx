/**
 * TerraFusionPro - Loading Screen Component
 * Provides a consistent loading indicator for the app
 */

import React from 'react';

/**
 * LoadingScreen Component
 * @param {Object} props - Component props
 * @param {string} props.message - Loading message to display
 * @param {boolean} props.fullScreen - Whether to display fullscreen
 * @param {string} props.className - Additional CSS classes
 */
const LoadingScreen = ({
  message = 'Loading...',
  fullScreen = false,
  className = ''
}) => {
  return (
    <div className={`
      loading-screen 
      ${fullScreen ? 'fullscreen' : ''} 
      ${className}
    `}>
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
        </div>
        
        <div className="loading-message">
          {message}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;