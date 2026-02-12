/**
 * Error State Component
 * Displays error messages with consistent styling and retry options
 */

import React from 'react';

import TerraCard from './TerraCard';
import TerraButton from './TerraButton';
import './ErrorState.css';

const ErrorState = ({ 
  error,
  message = 'An error occurred',
  onRetry,
  fullPage = false,
  showCard = true 
}) => {
  const content = (
    <div className="error-state">
      <div className="error-icon">⚠️</div>
      <h3 className="error-title">{message}</h3>
      {error && (
        <p className="error-details">{error}</p>
      )}
      {onRetry && (
        <TerraButton 
          onClick={onRetry}
          variant="primary"
          className="error-retry-btn"
        >
          Try Again
        </TerraButton>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="error-state-fullpage">
        {showCard ? <TerraCard>{content}</TerraCard> : content}
      </div>
    );
  }

  return showCard ? <TerraCard>{content}</TerraCard> : content;
};

export default ErrorState;
